import { Module } from '@nestjs/common';
import { WorkoutEngineModule } from './api/workout-engine/workout-engine.module';
import { PlansModule } from './api/plans/plans.module';
import { SessionsModule } from './api/sessions/sessions.module';
import { UsersModule } from './api/users/users.module';
// Pendiente (fase 1 backend, ver roadmap):
// import { AuthModule } from './auth/auth.module';

@Module({
  imports: [WorkoutEngineModule, UsersModule, PlansModule, SessionsModule],
})
export class AppModule {}
