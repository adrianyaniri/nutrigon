---
name: nestjs-drizzle-tdd
description: >
  Guía y patrones obligatorios para el desarrollo del backend en NestJS con Drizzle ORM, validación Zod y metodología TDD.
  Trigger: Cuando se implementen o modifiquen módulos, controladores, servicios, repositorios, esquemas Drizzle, guards o tests en apps/api.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Al crear o extender módulos funcionales en `apps/api/src/modules/`.
- Al definir tablas, relaciones o migraciones con **Drizzle ORM** en `apps/api/src/core/database/schema/`.
- Al crear contratos y DTOs validados con **Zod** (`packages/contracts` y `nestjs-zod`).
- Al escribir pruebas unitarias, de integración o e2e aplicando **TDD**.
- Al implementar lógica de autorización basada en roles o sucursales (`BranchAccessGuard`).

---

## Critical Patterns

### 1. Protocolo TDD Obligatorio (Rojo -> Verde -> Refactor)
Para toda regla de negocio, servicio de dominio, guard de seguridad o esquema de validación:
1. **Red:** Escribir primero el test unitario (`*.service.spec.ts` o `*.guard.spec.ts`) que falle describiendo el comportamiento esperado.
2. **Green:** Escribir la implementación mínima necesaria en el servicio o guard para que el test pase.
3. **Refactor:** Limpiar código, eliminar duplicación y mejorar legibilidad manteniendo los tests en verde.
4. **Fixes de bugs:** NUNCA corregir un bug sin escribir previamente el test que reproduzca la falla.

### 2. Aislamiento de Capas y Repositorios
- **Los Services NUNCA importan Drizzle directamente.** Toda interacción con PostgreSQL se aísla en una clase repositorio (`*.repository.ts`).
- En tests unitarios, inyectar un repositorio falso (Fake en memoria) para que los tests corran en milisegundos sin depender de una base de datos activa.
- Las entidades principales (`products`, `categories`, `branches`) aplican **Soft Delete** (`is_active = false`). NUNCA `DELETE` físico.

### 3. Validación Única con Zod (Sin class-validator)
- Los esquemas Zod se definen en `packages/contracts/src/schemas/` y se comparten entre frontend y backend.
- En NestJS, los DTOs se derivan usando `createZodDto` de `nestjs-zod`.
- Todo esquema de mutación debe usar `.strict()` para rechazar payloads con campos extraños (Error 400).

### 4. Segregación Multisucursal en Guards
- `BRANCH_ADMIN` solo puede consultar o modificar datos correspondientes a su `branchId`.
- El control de acceso a sucursal se aplica en `BranchAccessGuard` validando el parámetro `:branchId` contra el JWT del usuario autenticado. `ADMIN_GENERAL` posee bypass global.

---

## Code Examples

### Test Unitario con Fake Repository (TDD en Service)
```typescript
// apps/api/src/modules/products/products.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsService } from './products.service.js';
import type { IProductsRepository } from './products.repository.interface.js';

class InMemoryProductsRepository implements IProductsRepository {
  private items: any[] = [];
  async create(data: any) {
    const item = { id: 'uuid-1', ...data, isActive: true };
    this.items.push(item);
    return item;
  }
  async findById(id: string) {
    return this.items.find(x => x.id === id) ?? null;
  }
}

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: InMemoryProductsRepository;

  beforeEach(() => {
    repo = new InMemoryProductsRepository();
    service = new ProductsService(repo as any);
  });

  it('debe crear un producto maestro con estado activo por defecto', async () => {
    const product = await service.create({
      name: 'Almendras',
      saleUnit: 'WEIGHT',
      categoryId: 'cat-1',
      imageUrls: [],
    });

    expect(product.id).toBeDefined();
    expect(product.isActive).toBe(true);
  });
});
```

### DTO con Zod (`nestjs-zod`)
```typescript
// packages/contracts/src/schemas/product.schema.ts
import { z } from 'zod';
import { SaleUnit } from '../enums/index.js';

export const createProductSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid(),
  saleUnit: z.nativeEnum(SaleUnit),
  imageUrls: z.array(z.string().url()).default([]),
}).strict();

// apps/api/src/modules/products/dto/create-product.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createProductSchema } from '@nutrigon/contracts';

export class CreateProductDto extends createZodDto(createProductSchema) {}
```

---

## Commands

```bash
# Ejecutar tests unitarios de la API
pnpm --filter @nutrigon/api test

# Tests en modo watch para ciclo TDD
pnpm --filter @nutrigon/api test:watch

# Generar migraciones SQL tras modificar esquemas Drizzle
pnpm --filter @nutrigon/api exec drizzle-kit generate

# Aplicar migraciones en PostgreSQL
pnpm --filter @nutrigon/api exec drizzle-kit migrate

# Verificación completa del monorepo (gate de calidad)
pnpm turbo run lint typecheck test
```

---

## Resources

- **Decisión de Arquitectura**: [ADR-004: Drizzle ORM, Zod y TDD](../../../docs/decisions/ADR-004-drizzle-zod-and-tdd.md)
- **Estructura Modular**: [04-backend-modular-architecture.md](../../../docs/architecture/04-backend-modular-architecture.md)
- **Seguridad y Guards**: [06-backend-security-and-auth.md](../../../docs/architecture/06-backend-security-and-auth.md)

