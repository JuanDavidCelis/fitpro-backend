import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { AUTH_TOKEN_VERIFIER } from './tokens';
import { FirebaseAuthTokenVerifier } from './FirebaseAuthTokenVerifier';
import { FakeAuthTokenVerifier } from './FakeAuthTokenVerifier';
import { FirebaseAuthGuard } from './FirebaseAuthGuard';
import { SameUserGuard } from './SameUserGuard';

// Flag independiente del de persistencia (USE_IN_MEMORY_DB), para poder
// probar Postgres real con auth falsa mientras se monta Firebase, o
// viceversa. Si no se define explícitamente, sigue el mismo valor que
// USE_IN_MEMORY_DB para mantener el comportamiento previo por defecto.
const useFakeAuth =
  process.env.USE_FAKE_AUTH === 'true' ||
  (process.env.USE_FAKE_AUTH === undefined && process.env.USE_IN_MEMORY_DB === 'true');

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: AUTH_TOKEN_VERIFIER,
      useClass: useFakeAuth ? FakeAuthTokenVerifier : FirebaseAuthTokenVerifier,
    },
    FirebaseAuthGuard,
    SameUserGuard,
  ],
  exports: [AUTH_TOKEN_VERIFIER, FirebaseAuthGuard, SameUserGuard],
})
export class AuthModule {}
