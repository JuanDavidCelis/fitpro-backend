# Conectar FitPro backend a tu base de datos Supabase (Postgres real)

Este sandbox donde se desarrolló el backend **no tiene salida de red hacia
Supabase** (el proxy de red devuelve `x-deny-reason: host_not_allowed` para
`*.supabase.co` y `*.pooler.supabase.com`). Por eso el schema, el motor y la
lógica de persistencia están completamente escritos y testeados con
implementaciones en memoria, pero la conexión real a Postgres **debes
ejecutarla tú**, en una máquina con acceso normal a internet.

Los pasos son exactamente estos, en orden:

## 1. Instalar dependencias

```bash
cd fitpro-backend
npm install
```

## 2. Configurar el `.env`

Copia `.env.example` a `.env` y pega las credenciales que ya generaste en
Supabase (pantalla "Connect to your project" → ORM → Prisma):

```bash
cp .env.example .env
```

Edita `.env` y pon tus valores reales de `DATABASE_URL` y `DIRECT_URL`
(los mismos que ya tienes: el pooler puerto 6543 para `DATABASE_URL`, y el
puerto 5432 para `DIRECT_URL`). Deja `USE_IN_MEMORY_DB` sin definir o en
`false` para que el backend use Prisma real en vez de los repositorios en
memoria.

## 3. Generar el cliente Prisma contra tu base real

```bash
npx prisma generate
```

Este paso es importante: en el sandbox donde se escribió el código, este
comando falló porque tampoco había acceso al binario del motor de consultas
de Prisma (`binaries.prisma.sh`). En tu máquina, con internet normal, debería
funcionar sin problema y generar un cliente con tipos reales para cada
modelo (`User`, `Exercise`, `WorkoutPlan`, etc.) — cosa que en el sandbox no
pude verificar.

## 4. Crear las tablas en Supabase

```bash
npx prisma db push
```

Esto lee `prisma/schema.prisma` y crea todas las tablas descritas en el
documento de diseño (User, UserProfile, WorkoutPlan, WorkoutDay,
WorkoutExercise, ExerciseSet, RecoveryRecord, etc.) directamente en tu
proyecto de Supabase. Puedes verificarlo después en el Table Editor de
Supabase.

## 5. Sembrar el catálogo de ejercicios

```bash
npx prisma db seed
```

Esto ejecuta `prisma/seed.ts`, que carga los ~55 ejercicios de
`src/data/exercises.ts` en la tabla `Exercise`. Es un paso obligatorio antes
de poder generar cualquier plan con Prisma real, porque `WorkoutExercise`
tiene una foreign key a `Exercise.id`.

## 6. Arrancar el backend contra Postgres real

```bash
npm start
```

(o `npm run build && node dist/main.js` para producción). Sin
`USE_IN_MEMORY_DB=true`, el backend usará automáticamente
`PrismaPlanRepository`, `PrismaSessionRepository`, `PrismaUserRepository` y
`PrismaRecoveryRepository` en vez de las versiones en memoria.

## 7. Probar que de verdad funciona (recomendado)

Repite las mismas pruebas `curl` que ya hicimos en el sandbox contra memoria,
pero ahora contra tu servidor real:

```bash
# Registrar un usuario (requiere token; ver nota de auth abajo)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake:UID123:test@example.com" \
  -d '{"nombre":"Test"}'

# Generar un plan
curl -X POST http://localhost:3000/users/UID123/workout-plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake:UID123:test@example.com" \
  -d '{
    "perfil": {"edad":24,"sexo":"masculino","pesoKg":78,"alturaCm":178,"nivelExperiencia":"principiante"},
    "objetivo": "perdida_grasa",
    "disponibilidad": {"diasPorSemana":5,"minutosPorSesion":30},
    "equipamientoDisponible": [],
    "preferencias": {"musculosPrioritarios":[],"modalidadCardioPreferida":[],"ejerciciosExcluidosIds":[],"ejerciciosFavoritosIds":[],"solicitaOlympia":false},
    "limitaciones": {"lesiones":[],"dolorActual":[],"patronesExcluidos":[],"ejerciciosExcluidosIds":[],"requiereConsultaProfesional":false}
  }'
```

Nota: el ejemplo de arriba usa `fake:UID123:test@example.com` como token,
que funciona mientras `USE_FAKE_AUTH=true` (o mientras no la definas y
`USE_IN_MEMORY_DB=true`, que es el valor por defecto heredado). Los dos
flags ya son independientes, así que puedes combinar:

- `USE_IN_MEMORY_DB=false` + `USE_FAKE_AUTH=true` → Postgres real, auth falsa
  (útil para probar la base de datos antes de montar Firebase).
- `USE_IN_MEMORY_DB=true` + `USE_FAKE_AUTH=false` → memoria + Firebase real.
- Ambos en `false` → todo real (producción).

## Si algo falla

- **Error de conexión / timeout**: revisa que la contraseña en la URL no
  tenga caracteres especiales sin escapar (`@`, `#`, etc. deben ir con
  percent-encoding en la connection string).
- **`P2002` en el seed**: ya corriste el seed antes; es idempotente
  (usa `upsert`), así que puedes volver a correrlo sin problema.
- **Prisma no encuentra el modelo X**: asegúrate de haber corrido
  `npx prisma generate` DESPUÉS de cualquier cambio a `schema.prisma`.
