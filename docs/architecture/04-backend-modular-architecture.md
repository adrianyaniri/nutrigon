# Arquitectura Modular del Backend (NestJS)

## 1. Visión General

El backend de Nutrigon está concebido como un **Monolito Modular** construido sobre **NestJS + TypeScript**. El sistema expone una API REST para el cliente web (`apps/web`) y centraliza las reglas de negocio, la integridad del catálogo maestro y la segregación de accesos por sucursal.

Se ejecuta en un contenedor dentro de **Railway**, conectado a **PostgreSQL** y consumiendo **Cloudflare R2** para la persistencia de imágenes.

```
                      +---------------------------------------+
                      |          Nutrigon Frontend            |
                      |        (React 19 + TypeScript)        |
                      |            [apps/web]                 |
                      +---------------------------------------+
                                           |
                                           | HTTPS / JSON (REST API)
                                           v
+-----------------------------------------------------------------------------------+
|                            Nutrigon API (NestJS)                                  |
|                                 [apps/api]                                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            Capa HTTP / Global Filters                       |  |
|  |      CORS | Helmet | Rate Limiter | ZodValidationPipe | ExceptionFilter     |  |
|  +-----------------------------------------------------------------------------+  |
|                                           |                                       |
|  +-----------------------------------------------------------------------------+  |
|  |                         Módulo Transversal de Seguridad                     |  |
|  |               JwtAuthGuard | RolesGuard | BranchAccessGuard                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                           |                                       |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  |   Módulo Auth      |  |  Módulo Sucursales |  | Módulo Catálogo Maestro     |  |
|  |  (Login, JWT, Me)  |  | (CRUD, Slugs, Info)|  | (Products & Categories)     |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|            |                       |                            |                 |
|  +-----------------------------------------------------------------------------+  |
|  |                 Módulo Configuración Sucursal (Branch-Products)             |  |
|  |            Precios por sucursal | Activación/Visibilidad | Catálogo Público |  |
|  +-----------------------------------------------------------------------------+  |
|            |                       |                            |                 |
|  +-----------------------------------------------------------------------------+  |
|  |                     Capa de Persistencia y Almacenamiento                   |  |
|  |           Database Service (PostgreSQL)  |  R2 Storage Service (S3 API)     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                    |                                             |
                    v                                             v
     +-----------------------------+               +-----------------------------+
     |     PostgreSQL (Railway)    |               |    Cloudflare R2 Bucket     |
     | Relacional + Transacciones  |               |  Imágenes y assets del CDN  |
     +-----------------------------+               +-----------------------------+
```

---

## 2. Organización del Código

El monorepo organiza las aplicaciones y paquetes compartidos de acuerdo con la siguiente estructura:

```
nutrigon/
├── apps/
│   ├── api/                      # Backend NestJS
│   │   ├── src/
│   │   │   ├── app.module.ts     # Módulo raíz de NestJS
│   │   │   ├── main.ts           # Punto de entrada (Bootstrap, pipes, Swagger)
│   │   │   ├── core/             # Servicios e infraestructura transversal
│   │   │   │   ├── config/       # Variables de entorno validadas
│   │   │   │   ├── database/     # Conexión pg, esquema Drizzle y migraciones (drizzle-kit)
│   │   │   │   ├── auth/         # Estrategia JWT, hashing y Passport
│   │   │   │   └── storage/      # Adaptador S3 hacia Cloudflare R2
│   │   │   ├── common/           # Utilidades compartidas de NestJS
│   │   │   │   ├── decorators/   # @CurrentUser, @Roles, @RequireBranch
│   │   │   │   ├── guards/       # JwtAuthGuard, RolesGuard, BranchAccessGuard
│   │   │   │   ├── filters/      # GlobalHttpExceptionFilter
│   │   │   │   └── interceptors/ # LoggingInterceptor, TransformResponse
│   │   │   └── modules/          # Módulos de dominio funcional
│   │   │       ├── auth/         # Autenticación de administradores
│   │   │       ├── branches/     # Gestión de las 3 sucursales
│   │   │       ├── categories/   # Categorías del catálogo
│   │   │       ├── products/     # Catálogo maestro de productos
│   │   │       ├── branch-products/ # Precios y disponibilidad por sucursal
│   │   │       └── media/        # Carga y gestión de imágenes hacia R2
│   │   ├── test/                 # Pruebas e2e y de integración
│   │   ├── Dockerfile            # Imagen optimizada para Railway
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                      # Frontend React 19 + Vite (proyecto actual)
│
├── packages/
│   ├── contracts/                # Contratos compartidos (fuente única de verdad)
│   │   ├── src/
│   │   │   ├── enums/            # Role, SaleUnit, BranchProductStatus
│   │   │   ├── schemas/          # Esquemas Zod de entrada y salida (validación compartida)
│   │   │   └── types/            # Interfaces de dominio compartidas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── tsconfig/                 # Configuraciones base de TypeScript
│
├── pnpm-workspace.yaml           # Definición del workspace monorepo
├── turbo.json                    # Pipeline de compilación y caché de Turborepo
└── package.json                  # Scripts globales de orquestación
```

---

## 3. Estructura Interna de Cada Módulo

Cada módulo dentro de `apps/api/src/modules/<modulo>/` respeta una separación estricta de responsabilidades en 4 capas:

```
modules/products/
├── products.module.ts            # Definición del módulo y proveedores
├── products.controller.ts        # Enrutamiento HTTP, códigos de estado, OpenAPI
├── products.service.ts           # Casos de uso y reglas de negocio del dominio
├── products.service.spec.ts      # Tests unitarios (se escriben primero, TDD)
├── products.repository.ts        # Consultas a PostgreSQL con Drizzle ORM
└── dto/                          # DTOs derivados de esquemas Zod (nestjs-zod)
    ├── create-product.dto.ts
    ├── update-product.dto.ts
    └── product-response.dto.ts
```

1. **Controller**: Recibe solicitudes HTTP, valida el payload con esquemas Zod, delega la ejecución al Service y retorna respuestas estandarizadas.
2. **Service**: Encapsula las reglas de negocio, coordina transacciones y aplica la lógica de dominio (por ejemplo, validar unicidad o aplicar Soft Delete). Nunca importa Drizzle directamente.
3. **Repository**: Aísla el acceso a PostgreSQL mediante **Drizzle ORM**, garantizando que el Service no dependa de dialectos o implementaciones directas de la base de datos y pueda probarse con un repositorio falso.
4. **Esquemas Zod**: Definen el contrato de entrada y salida. Los compartidos con el frontend viven en `packages/contracts`; los DTOs de NestJS se derivan de ellos con `nestjs-zod`.

---

## 4. Reglas de Acoplamiento y Dependencias

1. **Inyección de Dependencias Estricta:** Un módulo nunca accede a los repositorios o tablas de otro módulo directamente. La comunicación entre módulos se realiza exclusivamente inyectando el `Service` exportado por el módulo correspondiente.
2. **Fuente Única de Contratos (`packages/contracts`):** Los enums (`Role`, `SaleUnit`), tipos base y respuestas de la API residen en el paquete compartido. Si el backend modifica la estructura de una respuesta, TypeScript fuerza la actualización en el frontend durante el build.
3. **Soft Delete Mandatorio:** Las entidades principales (`products`, `categories`, `branches`) no implementan `DELETE` físico. Las bajas se gestionan mediante banderas de estado (`is_active = false`).
4. **Validación en los Bordes:** Todos los controladores validan entrada con esquemas **Zod** de `packages/contracts` mediante un `ZodValidationPipe` global (`nestjs-zod`). Los esquemas son estrictos (`.strict()`): cualquier propiedad no declarada se rechaza con 400. Ver `ADR-004`.
5. **Desarrollo guiado por pruebas (TDD):** Las reglas de negocio y de seguridad (Services, Guards, esquemas Zod, estados de `branch_products`) se desarrollan con TDD: primero el test que falla, luego el código mínimo que lo pasa y finalmente el refactor. Los Services se prueban con repositorios falsos en memoria; los repositorios, con PostgreSQL de pruebas. Ver `ADR-004`.

