# ADR-004: Drizzle ORM, Validación con Zod y Desarrollo Guiado por Pruebas (TDD)

## Estado
Aprobado (Complementa el ADR-003)

## Contexto
El ADR-003 definió NestJS + PostgreSQL en Railway, pero dejó abiertas tres decisiones que afectan a toda la implementación:
1. **Acceso a datos:** qué ORM o query builder usar y cómo versionar el esquema.
2. **Validación:** la documentación inicial (docs `04` y `06`) proponía `class-validator` con `ValidationPipe`. El frontend ya valida con **Zod**, y `packages/contracts` existe para compartir contratos. Mantener dos librerías de validación duplicaría las reglas de negocio.
3. **Metodología de pruebas:** el dominio (catálogo maestro, precios por sucursal, permisos por rol y sucursal) tiene reglas cuya violación es silenciosa y costosa.

## Decisión

### 1. ORM: Drizzle ORM + drizzle-kit
- **`drizzle-orm`** con el driver **`pg`** (node-postgres) contra PostgreSQL en Railway.
- Esquema declarado en TypeScript (`apps/api/src/core/database/schema/`), con tipos inferidos de las tablas.
- **`drizzle-kit`** genera y aplica migraciones SQL versionadas en `apps/api/drizzle/`. Las migraciones se versionan en Git y nunca se editan una vez aplicadas.
- El acceso a la base se aísla en repositorios (`*.repository.ts`). Los services nunca importan Drizzle.

### 2. Validación: Zod como única fuente de verdad
- Los esquemas Zod viven en **`packages/contracts`** y se usan tanto en el frontend (React Hook Form) como en el backend.
- En NestJS se integra con **`nestjs-zod`** (`ZodValidationPipe` global y DTOs derivados de esquemas Zod).
- Los esquemas son estrictos (`.strict()`): se rechaza cualquier propiedad no declarada.
- **Se descarta `class-validator`/`class-transformer`.**

### 3. TDD como práctica por defecto
Se trabaja con TDD **en la medida de lo posible**:
- **Ciclo:** rojo (test que falla) → verde (mínimo código que pasa) → refactor.
- **Obligatorio** para reglas de negocio y seguridad: Services, Guards, cálculo de estados de `branch_products` (`ACTIVE` / `INACTIVE` / `UNCONFIGURED`), Soft Delete y esquemas Zod.
- **Recomendado, sin dogma:** controladores finos, módulos de infraestructura (cliente S3/R2, conexión) y scaffolding, donde se admite test posterior o de integración.
- **Pirámide de pruebas:**
  - *Unitarias* (vitest): Services con repositorios falsos (fakes en memoria); sin base de datos.
  - *Integración*: repositorios contra PostgreSQL real de pruebas (base descartable, migraciones aplicadas).
  - *E2E* (vitest + supertest): flujos HTTP críticos (login, permisos por rol y sucursal, catálogo público).
- **Definición de terminado:** un cambio no se integra si falla `pnpm turbo run lint typecheck test`.
- Un bug se corrige escribiendo primero el test que lo reproduce.

## Alternativas consideradas
| Opción | Motivo de descarte |
|---|---|
| Prisma | Más pesado y con paso de generación de cliente; Drizzle ofrece tipos inferidos con menos magia para un modelo simple. |
| TypeORM | Decoradores y *active record* dificultan el testeo aislado y la inferencia de tipos. |
| `class-validator` | Duplica reglas con el frontend (Zod) y no comparte contratos con `packages/contracts`. |

## Consecuencias
### Positivas
- Una sola definición de validación de punta a punta; un cambio de contrato rompe el build si hay desalineación.
- Migraciones SQL explícitas y revisables.
- Reglas críticas protegidas por pruebas antes de existir.

### Negativas / Mitigaciones
- `nestjs-zod` es una dependencia comunitaria: se encapsula en `common/pipes` para poder reemplazarla.
- TDD requiere disciplina y más tiempo inicial: se mitiga con alcance obligatorio acotado (reglas de negocio y seguridad).
- Pruebas de integración necesitan una base de pruebas: se define en la guía de desarrollo y en CI.

