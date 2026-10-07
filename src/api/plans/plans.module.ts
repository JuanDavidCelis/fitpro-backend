import { BadRequestException, Body, Controller, Get, Inject, Module, Param, Post, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PLAN_REPOSITORY, RECOVERY_REPOSITORY } from '../../persistence/tokens';
import { PlanRepositoryPort, RecoveryRepositoryPort } from '../../persistence/ports/repositories';
import { PlanApplicationService } from '../../application/PlanApplicationService';
import { GeneratePlanDto, validateGeneratePlanDto } from '../dto/generate-plan.dto';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { FirebaseAuthGuard } from '../../auth/FirebaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';

// Nota de diseño: este endpoint persiste (crea una nueva versión de
// WorkoutPlan ligada al usuario). Es distinto del endpoint stateless
// POST /workout-plans/generate (WorkoutEngineController), que solo invoca
// el motor sin guardar nada — útil para previsualizar un plan antes de
// confirmarlo, o para los tests de validación del motor en aislamiento.

// Se define el provider del servicio de aplicación dentro de este módulo
// (en vez de en persistence.module.ts) porque PlanApplicationService
// pertenece a la capa de aplicación, no a la de persistencia — solo
// depende de los puertos, nunca de Prisma directamente.
const PLAN_APPLICATION_SERVICE = Symbol('PLAN_APPLICATION_SERVICE');

// Orden de guards: primero autentica (¿quién eres?), luego autoriza
// (¿puedes operar sobre este :userId?). SameUserGuard depende de que
// FirebaseAuthGuard ya haya adjuntado req.user.
@Controller('users/:userId/workout-plans')
@UseGuards(FirebaseAuthGuard, SameUserGuard)
class PlansController {
  constructor(
    @Inject(PLAN_APPLICATION_SERVICE) private readonly service: PlanApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
  ) {}

  @Post('generate')
  async generate(@Param('userId') userId: string, @Body() dto: GeneratePlanDto) {
    // SameUserGuard ya garantiza que quien llama ES userId; assertExists
    // sigue haciendo falta porque un usuario puede existir en Firebase Auth
    // pero no haber completado el registro/perfil en nuestra base de datos.
    await this.users.assertExists(userId);

    const errores = validateGeneratePlanDto(dto);
    if (errores.length > 0) {
      throw new BadRequestException({ message: 'Datos de entrada inválidos', errores });
    }
    return this.service.generateAndPersist(userId, {
      perfil: dto.perfil,
      objetivo: dto.objetivo,
      disponibilidad: dto.disponibilidad,
      equipamientoDisponible: dto.equipamientoDisponible ?? [],
      preferencias: dto.preferencias,
      limitaciones: dto.limitaciones,
    });
  }

  @Get('active')
  async getActive(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    return this.service.getActivePlan(userId);
  }

  @Get('history')
  async getHistory(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    return this.service.getVersionHistory(userId);
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule],
  controllers: [PlansController],
  providers: [
    {
      provide: PLAN_APPLICATION_SERVICE,
      useFactory: (planRepo: PlanRepositoryPort, recoveryRepo: RecoveryRepositoryPort) =>
        new PlanApplicationService(planRepo, recoveryRepo),
      inject: [PLAN_REPOSITORY, RECOVERY_REPOSITORY],
    },
  ],
})
export class PlansModule {}
