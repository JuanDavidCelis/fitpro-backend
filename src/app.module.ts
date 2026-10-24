import { Module } from '@nestjs/common';
import { WorkoutEngineModule } from './api/workout-engine/workout-engine.module';
import { PlansModule } from './api/plans/plans.module';
import { SessionsModule } from './api/sessions/sessions.module';
import { UsersModule } from './api/users/users.module';
import { ProfileModule } from './api/profile/profile.module';
import { ProgressModule } from './api/progress/progress.module';

@Module({
  imports: [
    WorkoutEngineModule,
    UsersModule,
    PlansModule,
    SessionsModule,
    ProfileModule,
    ProgressModule,
  ],
})
export class AppModule {}
