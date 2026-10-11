import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { WorkoutEngineController } from './workout-engine.controller';
import { WorkoutEngineService } from './workout-engine.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutEngineController],
  providers: [WorkoutEngineService],
  exports: [WorkoutEngineService],
})
export class WorkoutEngineModule {}
