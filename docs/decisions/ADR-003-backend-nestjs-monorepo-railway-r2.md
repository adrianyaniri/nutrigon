# ADR-003: Backend Dedicado en NestJS, Monorepo Turborepo, Railway y Cloudflare R2

## Estado
Aprobado (Reemplaza la dependencia directa de Supabase Client del ADR-001)

## Contexto
En el ADR-001 se contempló el uso de Supabase como Backend-as-a-Service (BaaS) directo desde el frontend para minimizar costos iniciales. Sin embargo, en el análisis operativo y de infraestructura se detectaron dos factores determinantes:
1. **Comportamiento del plan gratuito de Supabase:** Pausa los proyectos tras 7 días de inactividad, lo que resulta inviable para un catálogo comercial de producción. La alternativa continua en Supabase requiere el plan Pro de **USD 25/mes**.
2. **Costos en Railway:** El plan Hobby de Railway (**USD 5/mes**) permite ejecutar PostgreSQL gestionado y un contenedor de backend 24/7 sin suspensiones.
3. **Almacenamiento de imágenes:** El catálogo requiere albergar fotografías de productos. Cloudflare R2 ofrece 10 GB de almacenamiento gratuito y **cero costo de transferencia saliente (egress)**, eliminando costos por ancho de banda de descarga.
4. **Reglas de negocio y autorización:** El catálogo maestro segregado por sucursales (`products` vs `branch_products`) y la restricción estricta de permisos por rol (`admin_general` vs `branch_admin`) se vuelven más testeables, auditables y desacoplados cuando la lógica reside en servicios y Guards de aplicación en TypeScript, en lugar de depender exclusivamente de políticas SQL RLS.

## Decisión
Se adopta una arquitectura de **Monorepo gestionado con Turborepo y PNPM Workspaces**:
- **`apps/api` (Backend):** Desarrollado con **NestJS + TypeScript**. Implementa un monolito modular con capas de controladores, servicios de aplicación y repositorios.
- **`apps/web` (Frontend):** La aplicación cliente React 19 + Vite existente, consumiendo la API REST propia.
- **`packages/contracts` (Contratos Compartidos):** Tipos, enums (ej. `SaleUnit`, `Role`) y esquemas de validación compartidos entre frontend y backend para garantizar consistencia de datos de punta a punta.
- **Base de Datos:** PostgreSQL alojado en **Railway**, con esquema versionado mediante migraciones automatizadas.
- **Almacenamiento de Medios:** **Cloudflare R2** para las imágenes de productos, operado mediante el cliente compatible con S3 (`@aws-sdk/client-s3`).
- **Autenticación y Autorización:** Tokens JWT emitidos por el backend con estrategia Passport/JWT, y autorización basada en Guards por rol (`RolesGuard`) y ámbito de sucursal (`BranchAccessGuard`).

## Consecuencias

### Positivas
- **Costo operativo predecible y reducido:** Costo de infraestructura base de aproximadamente **USD 5/mes** en Railway + **USD 0/mes** en Cloudflare R2 y Cloudflare Pages, frente a los USD 25/mes de Supabase Pro.
- **Disponibilidad continua:** Eliminación total de suspensiones por inactividad.
- **Cero costo de egress:** Las imágenes servidas desde Cloudflare R2 / CDN no generan cobros por transferencia de datos.
- **Soberanía del dominio:** La lógica de negocio, validaciones y autorización quedan desacopladas de un proveedor específico y sujetas a pruebas unitarias y de integración en TypeScript.
- **Código compartido:** El monorepo evita duplicación de interfaces y contratos entre cliente y servidor.

### Negativas / Mitigaciones
- **Mayor responsabilidad de mantenimiento:** Requiere mantener Dockerfile, configuración del servidor HTTP, CORS, rate limiting y migraciones de base de datos. Se mitiga mediante la estructura modular estandarizada de NestJS y scripts unificados en Turborepo.
- **Implementación propia de autenticación:** Es necesario gestionar el ciclo de vida de tokens JWT y hashing seguro de credenciales (Argon2id/Bcrypt). Se encapsula en un módulo aislado `core/auth`.

