# Seguridad, Autenticación y Autorización del Backend

## 1. Estrategia de Autenticación

El backend implementa autenticación basada en **JSON Web Tokens (JWT) Stateless**, eliminando la necesidad de persistir sesiones en memoria o en Redis.

```
+----------------+                +------------------+                +---------------------+
|    Frontend    |                |    NestJS API    |                | PostgreSQL Database |
|   (apps/web)   |                |    (apps/api)    |                |      (Railway)      |
+----------------+                +------------------+                +---------------------+
       |                                   |                                     |
       |  1. POST /api/v1/auth/login       |                                     |
       |---------------------------------->|                                     |
       |                                   |  2. Consulta usuario por email      |
       |                                   |------------------------------------>|
       |                                   |  3. Retorna hash Argon2id           |
       |                                   |<------------------------------------|
       |                                   |                                     |
       |                                   |-- 4. Compara hash con Argon2id      |
       |                                   |                                     |
       |                                   |-- 5. Firma JWT (id, role, branchId) |
       |                                   |                                     |
       |  6. Retorna Access Token + User   |                                     |
       |<----------------------------------|                                     |
       |                                   |                                     |
       |  7. Solicitud con Authorization:  |                                     |
       |     Bearer <JWT>                  |                                     |
       |---------------------------------->|                                     |
       |                                   |-- 8. JwtAuthGuard verifica firma    |
       |                                   |-- 9. RolesGuard verifica rol        |
       |                                   |-- 10. BranchAccessGuard valida scope|
       |                                   |                                     |
       |  11. Respuesta protegida (200 OK) |                                     |
       |<----------------------------------|                                     |
```

### Contenido del Token (JWT Payload)
```typescript
interface JwtPayload {
  sub: string;             // UUID del usuario
  email: string;           // Correo electrónico
  role: 'ADMIN_GENERAL' | 'BRANCH_ADMIN';
  branchId: string | null; // UUID de la sucursal asignada (null si es ADMIN_GENERAL)
  iat: number;
  exp: number;             // Expiración a 8 horas (jornada operativa)
}
```

### Hashing de Contraseñas
Las contraseñas de los administradores se procesan mediante **Argon2id**, el estándar recomendado por OWASP para resistencia contra ataques de fuerza bruta y GPU. Nunca se almacenan contraseñas en texto plano ni con algoritmos obsoletos (MD5, SHA1, SHA256 sin salting).

---

## 2. Matriz de Roles y Permisos

| Recurso / Operación | Público | `BRANCH_ADMIN` | `ADMIN_GENERAL` |
|---|:---:|:---:|:---:|
| Ver sucursales y detalles públicos | ✅ | ✅ | ✅ |
| Consultar catálogo público de sucursal | ✅ | ✅ | ✅ |
| Iniciar sesión administrativa | ❌ | ✅ | ✅ |
| Ver catálogo maestro completo | ❌ | ✅ | ✅ |
| Crear o editar producto maestro | ❌ | ❌ | ✅ |
| Desactivar producto maestro (Soft delete) | ❌ | ❌ | ✅ |
| Subir imágenes a Cloudflare R2 | ❌ | ❌ | ✅ |
| Administrar sucursales y categorías | ❌ | ❌ | ✅ |
| Ver productos de **su propia** sucursal | ❌ | ✅ | ✅ |
| Ver productos de **otra** sucursal | ❌ | ❌ | ✅ |
| Fijar precio y activar en **su propia** sucursal | ❌ | ✅ | ✅ |
| Fijar precio y activar en **otra** sucursal | ❌ | ❌ | ✅ |

---

## 3. Implementación de Guards en NestJS

La autorización se ejecuta a nivel de framework antes de alcanzar la lógica de los servicios:

### 1. `JwtAuthGuard`
Verifica la firma criptográfica y la vigencia temporal del token enviado en la cabecera `Authorization: Bearer <token>`. Inyecta el usuario decodificado en `request.user`.

### 2. `RolesGuard`
Comprueba si el usuario posee los roles requeridos mediante el decorador de metadatos `@Roles()`:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_GENERAL')
@Post('products')
createProduct(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

### 3. `BranchAccessGuard`
Asegura el principio de mínimo privilegio para los administradores de sucursal:
- Si el usuario tiene rol `ADMIN_GENERAL`, la solicitud se autoriza de forma transparente.
- Si el usuario tiene rol `BRANCH_ADMIN`, el guard valida que el parámetro `branchId` presente en la ruta HTTP (ejemplo: `/branches/:branchId/products`) coincida con el `branchId` grabado en el JWT del usuario.
- En caso de discrepancia, interrumpe el ciclo de vida de la solicitud retornando **403 Forbidden**, imposibilitando que un administrador de una sucursal modifique precios o publicaciones de otra sede.

---

## 4. Endurecimiento de la Capa HTTP e Infraestructura

1. **Restricción CORS (Cross-Origin Resource Sharing):**
   El backend únicamente acepta solicitudes originadas desde los dominios autorizados de Cloudflare Pages (`https://nutrigon.pages.dev`, `https://cat.nutrigon.com`) y `http://localhost:5173` para desarrollo local.
2. **Cabeceras HTTP de Seguridad (Helmet):**
   Inyección automática de cabeceras de protección: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` y `Content-Security-Policy`.
3. **Limitación de Tasa (Rate Limiting):**
   Implementación de `@nestjs/throttler`:
   - Límite global: 120 solicitudes por minuto por dirección IP.
   - Límite estricto para `/auth/login`: 5 intentos por minuto para prevenir ataques de diccionario.
4. **Validación Exhaustiva de Payloads:**
   Los esquemas **Zod** de `packages/contracts` se aplican mediante un `ZodValidationPipe` global (`nestjs-zod`):
   ```typescript
   import { APP_PIPE } from '@nestjs/core';
   import { ZodValidationPipe } from 'nestjs-zod';

   // En AppModule
   providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
   ```
   Los esquemas se declaran con `.strict()`: cualquier propiedad no declarada se rechaza y genera un error 400 (ver `ADR-004`).

