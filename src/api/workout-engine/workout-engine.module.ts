import { Module } from '@nestjs/common';
import { WorkoutEngineController } from './workout-engine.controller';
import { WorkoutEngineService } from './workout-engine.service';

@Module({
  controllers: [WorkoutEngineController],
  providers: [WorkoutEngineService],
  exports: [WorkoutEngineService],
})
export class WorkoutEngineModule {}
