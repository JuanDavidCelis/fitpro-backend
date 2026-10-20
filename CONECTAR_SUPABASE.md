# FitPro backend · Supabase (base de datos + autenticación)

Todo pasa por Supabase: **Postgres** (vía Prisma) y **Supabase Auth**
(correo + contraseña). El backend no emite tokens: solo **verifica** los que
emite Supabase.

## Cómo funciona la identidad

1. La app Android inicia sesión directamente con Supabase Auth y recibe un JWT.
2. Cada petición al backend lleva `Authorization: Bearer <jwt>`.
3. `SupabaseAuthGuard` verifica firma, emisor, audiencia y expiración.
4. `SameUserGuard` exige que el `:userId` de la URL sea el del token.
5. El `id` del usuario en la tabla `User` **es** el uid de Supabase (claim `sub`).

## Configuración en el panel de Supabase (una vez)

1. **Authentication → Sign In / Providers → Email**: habilitado.
   Para pruebas, desactiva **Confirm email** (si no, cada alta exige abrir un
   enlace del correo antes de poder entrar).
2. **Settings → API Keys**: copia la **clave pública** (anon / publishable) y la
   **Project URL**. Van en la app Android (`local.properties`), no en el backend.
3. ¿Claves legacy? Abre `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`:
   - Muestra claves (`{"keys":[{...}]}`) → no necesitas nada más.
   - Muestra `{"keys":[]}` → copia el **JWT Secret** (Settings → JWT Keys) a `SUPABASE_JWT_SECRET`.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | pooler 6543 con `?pgbouncer=true` |
| `DIRECT_URL` | pooler/directa 5432 |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_JWT_SECRET` | solo si tu proyecto es legacy (ver arriba) |
| `USE_IN_MEMORY_DB` | `false` |

**Borra** `USE_FAKE_AUTH` y cualquier `FIREBASE_*`. En producción el login falso
se ignora de todas formas.

## Base de datos (desde tu máquina, con internet normal)

```bash
npm install                       # ejecuta `prisma generate` automáticamente
npx prisma db push --accept-data-loss
```

`--accept-data-loss` es necesario esta vez porque el schema **elimina la
columna `firebaseUid`** de `User` (solo afecta a esa columna de tus filas de
prueba). Después, en **Supabase → SQL Editor**, ejecuta `prisma/supabase-setup.sql`
(activa RLS; explicación dentro del archivo). Repítelo si algún día
`db push` crea tablas nuevas.

> Si ya tenías filas de prueba en `User` con un correo que vas a usar para
> registrarte de verdad, bórralas antes (Table Editor → `User` → eliminar):
> el correo es único y chocaría.

## Desarrollo local sin Supabase

```bash
USE_IN_MEMORY_DB=true USE_FAKE_AUTH=true npm start
# token de prueba: Authorization: Bearer fake:<uid>:<email>
```

El modo falso **solo existe en local**; con `NODE_ENV=production` o en Vercel se ignora.

## Tests

```bash
npm test
```
