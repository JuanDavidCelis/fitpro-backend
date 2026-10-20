import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { SupabaseJwtVerifier } from '../src/auth/SupabaseJwtVerifier';
import { SupabaseAuthGuard } from '../src/auth/SupabaseAuthGuard';
import { SameUserGuard } from '../src/auth/SameUserGuard';
import { buildAuthVerifier } from '../src/auth/auth.module';
import { FakeAuthTokenVerifier } from '../src/auth/FakeAuthTokenVerifier';
import { UserApplicationService } from '../src/application/UserApplicationService';
import { InMemoryUserRepository } from '../src/persistence/memory/InMemoryUserRepository';

const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const USER_ID = '11111111-2222-3333-4444-555555555555';

async function makeKeys(kid = 'key-1') {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid, alg: 'ES256', use: 'sig' };
  return { privateKey, jwks: createLocalJWKSet({ keys: [jwk] }), kid };
}

async function mintToken(
  privateKey: any,
  kid: string,
  overrides: { iss?: string; aud?: string; exp?: string | number; claims?: Record<string, unknown> } = {},
) {
  return new SignJWT({ role: 'authenticated', email: 'ana@example.com', ...(overrides.claims ?? {}) })
    .setProtectedHeader({ alg: 'ES256', kid })
    .setSubject(USER_ID)
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? '1h')
    .sign(privateKey);
}

describe('SupabaseJwtVerifier (claves asimétricas / JWKS)', () => {
  it('acepta un token válido y devuelve uid + email', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    const identity = await verifier.verify(await mintToken(privateKey, kid));
    expect(identity).toEqual({ uid: USER_ID, email: 'ana@example.com' });
  });

  it('tolera una barra final en SUPABASE_URL', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: `${SUPABASE_URL}/`, jwks });
    await expect(verifier.verify(await mintToken(privateKey, kid))).resolves.toBeDefined();
  });

  it('rechaza un token expirado', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    const expirado = await mintToken(privateKey, kid, { exp: Math.floor(Date.now() / 1000) - 3600 });
    await expect(verifier.verify(expirado)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token firmado con OTRA clave (falsificado)', async () => {
    const legit = await makeKeys('key-1');
    const atacante = await makeKeys('key-1'); // mismo kid, distinta clave
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks: legit.jwks });
    const falso = await mintToken(atacante.privateKey, 'key-1');
    await expect(verifier.verify(falso)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un emisor distinto (otro proyecto de Supabase)', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    const ajeno = await mintToken(privateKey, kid, { iss: 'https://otro.supabase.co/auth/v1' });
    await expect(verifier.verify(ajeno)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza audiencia distinta de "authenticated" (p. ej. la clave anon)', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    await expect(verifier.verify(await mintToken(privateKey, kid, { aud: 'anon' }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza sesiones anónimas de Supabase', async () => {
    const { privateKey, jwks, kid } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    const anon = await mintToken(privateKey, kid, { claims: { is_anonymous: true } });
    await expect(verifier.verify(anon)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza basura, vacío, y alg=none', async () => {
    const { jwks } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const algNone = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: USER_ID, aud: 'authenticated', iss: ISSUER })}.`;
    for (const t of ['', 'abc', 'a.b.c', algNone, 'x'.repeat(9000)]) {
      await expect(verifier.verify(t)).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });

  it('exige una SUPABASE_URL válida al construirse', () => {
    expect(() => new SupabaseJwtVerifier({ supabaseUrl: '' })).toThrow(/SUPABASE_URL/);
    expect(() => new SupabaseJwtVerifier({ supabaseUrl: 'no-es-url' })).toThrow(/SUPABASE_URL/);
  });
});

describe('SupabaseJwtVerifier (proyectos legacy HS256)', () => {
  const secret = 'super-secreto-legacy-de-prueba-1234567890';
  const sign = (key: string, alg = 'HS256') =>
    new SignJWT({ role: 'authenticated', email: 'ana@example.com' })
      .setProtectedHeader({ alg })
      .setSubject(USER_ID)
      .setIssuer(ISSUER)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(key));

  it('acepta HS256 cuando hay JWT secret configurado', async () => {
    const { jwks } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks, jwtSecret: secret });
    await expect(verifier.verify(await sign(secret))).resolves.toEqual({ uid: USER_ID, email: 'ana@example.com' });
  });

  it('rechaza HS256 firmado con un secreto equivocado', async () => {
    const { jwks } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks, jwtSecret: secret });
    await expect(verifier.verify(await sign('otro-secreto-distinto-0987654321'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza HS256 si NO hay secreto configurado (no cae a otro modo)', async () => {
    const { jwks } = await makeKeys();
    const verifier = new SupabaseJwtVerifier({ supabaseUrl: SUPABASE_URL, jwks });
    await expect(verifier.verify(await sign(secret))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function ctx(req: any): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

describe('SupabaseAuthGuard', () => {
  const verifier = new FakeAuthTokenVerifier();
  const guard = new SupabaseAuthGuard(verifier);

  it('sin header Authorization -> 401', async () => {
    await expect(guard.canActivate(ctx({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('esquema distinto de Bearer -> 401', async () => {
    await expect(guard.canActivate(ctx({ headers: { authorization: 'Basic abc' } }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it('token inválido -> 401', async () => {
    await expect(guard.canActivate(ctx({ headers: { authorization: 'Bearer basura' } }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it('token válido -> adjunta req.user', async () => {
    const req: any = { headers: { authorization: 'Bearer fake:uid-1:a@b.com' } };
    await expect(guard.canActivate(ctx(req))).resolves.toBe(true);
    expect(req.user).toEqual({ uid: 'uid-1', email: 'a@b.com' });
  });
});

describe('SameUserGuard', () => {
  const guard = new SameUserGuard();
  it('mismo usuario -> permite', () => {
    expect(guard.canActivate(ctx({ params: { userId: 'u1' }, user: { uid: 'u1' } }))).toBe(true);
  });
  it('otro usuario -> 403', () => {
    expect(() => guard.canActivate(ctx({ params: { userId: 'u2' }, user: { uid: 'u1' } }))).toThrow(
      ForbiddenException,
    );
  });
  it('sin identidad (guard mal configurado) -> 403', () => {
    expect(() => guard.canActivate(ctx({ params: { userId: 'u1' } }))).toThrow(ForbiddenException);
  });
  it('sin :userId en la ruta -> 403', () => {
    expect(() => guard.canActivate(ctx({ params: {}, user: { uid: 'u1' } }))).toThrow(ForbiddenException);
  });
});

describe('buildAuthVerifier (selección segura del verificador)', () => {
  const backup = { ...process.env };
  afterEach(() => {
    process.env = { ...backup };
  });

  it('en desarrollo con USE_FAKE_AUTH=true usa el verificador falso', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL;
    process.env.USE_FAKE_AUTH = 'true';
    expect(buildAuthVerifier()).toBeInstanceOf(FakeAuthTokenVerifier);
  });

  it('en PRODUCCIÓN ignora USE_FAKE_AUTH=true y exige Supabase', () => {
    process.env.NODE_ENV = 'production';
    process.env.USE_FAKE_AUTH = 'true';
    delete process.env.SUPABASE_URL;
    expect(() => buildAuthVerifier()).toThrow(/SUPABASE_URL/);

    process.env.SUPABASE_URL = SUPABASE_URL;
    expect(buildAuthVerifier()).toBeInstanceOf(SupabaseJwtVerifier);
  });

  it('en Vercel (VERCEL=1) también se considera producción', () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL = '1';
    process.env.USE_FAKE_AUTH = 'true';
    process.env.SUPABASE_URL = SUPABASE_URL;
    expect(buildAuthVerifier()).toBeInstanceOf(SupabaseJwtVerifier);
  });

  it('sin fake auth y sin SUPABASE_URL falla con un mensaje claro', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL;
    process.env.USE_FAKE_AUTH = 'false';
    delete process.env.SUPABASE_URL;
    expect(() => buildAuthVerifier()).toThrow(/SUPABASE_URL/);
  });
});

describe('UserApplicationService.registerOrGet (perfil idempotente, id = uid de Supabase)', () => {
  const build = () => new UserApplicationService(new InMemoryUserRepository());

  it('crea el perfil con el uid del token como id', async () => {
    const svc = build();
    const u = await svc.registerOrGet({ id: USER_ID, email: 'ana@example.com', nombre: '  Ana  ' });
    expect(u.id).toBe(USER_ID);
    expect(u.nombre).toBe('Ana');
  });

  it('es idempotente: la segunda llamada devuelve el mismo usuario', async () => {
    const svc = build();
    const a = await svc.registerOrGet({ id: USER_ID, email: 'ana@example.com', nombre: 'Ana' });
    const b = await svc.registerOrGet({ id: USER_ID, email: 'ana@example.com' }); // sin nombre (login en otro teléfono)
    expect(b).toEqual(a);
  });

  it('sin nombre usa la parte local del correo', async () => {
    const u = await build().registerOrGet({ id: USER_ID, email: 'maria.perez@example.com' });
    expect(u.nombre).toBe('maria.perez');
  });

  it('rechaza nombres no-texto o demasiado largos', async () => {
    const svc = build();
    await expect(svc.registerOrGet({ id: 'a', email: 'a@x.com', nombre: 123 })).rejects.toThrow();
    await expect(svc.registerOrGet({ id: 'b', email: 'b@x.com', nombre: 'x'.repeat(61) })).rejects.toThrow();
  });

  it('assertExists falla con 404 si el perfil aún no se creó', async () => {
    await expect(build().assertExists('nadie')).rejects.toThrow(/no existe/);
  });
});
