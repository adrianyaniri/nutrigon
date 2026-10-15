# Especificación de Endpoints y Casos de Uso del Backend

## 1. Convenciones Generales de la API

- **Prefijo base:** `/api/v1`
- **Formato de intercambio:** `application/json`
- **Estructura estándar de respuesta:**
  ```json
  {
    "success": true,
    "data": {},
    "meta": { "total": 120, "page": 1, "limit": 20 }
  }
  ```
- **Estructura estándar de error (RFC 7807 compatible):**
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Mensaje descriptivo del error",
    "errors": ["El campo price debe ser mayor a 0"],
    "timestamp": "2026-10-13T22:00:00.000Z"
  }
  ```

---

## 2. Módulo de Autenticación (`/api/v1/auth`)

### Caso de Uso: Inicio de Sesión de Administradores
- **Endpoint:** `POST /api/v1/auth/login`
- **Acceso:** Público
- **Descripción:** Valida credenciales contra la tabla de usuarios administradores y retorna un token JWT firmado.
- **Payload (`LoginDto`):**
  ```json
  {
    "email": "admin.centro@nutrigon.com",
    "password": "Password123!"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "e8b0a99c-b3a1-4fc3-a9c1-123456789abc",
        "email": "admin.centro@nutrigon.com",
        "name": "Juan Pérez",
        "role": "BRANCH_ADMIN",
        "branchId": "a1b2c3d4-e5f6-7890-abcd-111111111111"
      }
    }
  }
  ```

### Caso de Uso: Consulta de Sesión Activa
- **Endpoint:** `GET /api/v1/auth/me`
- **Acceso:** Autenticado (`Bearer Token`)
- **Descripción:** Retorna el perfil y sucursal asignada del usuario correspondiente al token actual.

---

## 3. Módulo de Sucursales (`/api/v1/branches`)

### Caso de Uso: Listar Sucursales para Selector Web
- **Endpoint:** `GET /api/v1/branches`
- **Acceso:** Público
- **Descripción:** Devuelve las sucursales físicas activas para el selector inicial del frontend y catálogo web.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
        "name": "Sucursal Centro",
        "slug": "sucursal-centro",
        "address": "Av. Principal 123",
        "phone": "+54 11 1234-5678",
        "whatsappNumber": "5491112345678",
        "isActive": true
      }
    ]
  }
  ```

### Caso de Uso: Detalle de Sucursal por Slug
- **Endpoint:** `GET /api/v1/branches/:slug`
- **Acceso:** Público
- **Descripción:** Obtiene los datos públicos de la sucursal para la cabecera y pie de página del catálogo comercial.

### Caso de Uso: Crear y Editar Sucursales
- **Endpoints:** `POST /api/v1/branches` y `PATCH /api/v1/branches/:id`
- **Acceso:** Restringido a `ADMIN_GENERAL`

---

## 4. Módulo de Categorías (`/api/v1/categories`)

### Caso de Uso: Listar Categorías
- **Endpoint:** `GET /api/v1/categories`
- **Acceso:** Público
- **Descripción:** Listado taxonómico ordenado para filtros y navegación del catálogo.

### Caso de Uso: Alta y Modificación de Categorías
- **Endpoints:** `POST /api/v1/categories` y `PATCH /api/v1/categories/:id`
- **Acceso:** Restringido a `ADMIN_GENERAL`

---

## 5. Módulo de Catálogo Maestro de Productos (`/api/v1/products`)

### Caso de Uso: Consulta del Catálogo Maestro
- **Endpoint:** `GET /api/v1/products`
- **Acceso:** Autenticado (`ADMIN_GENERAL`, `BRANCH_ADMIN`)
- **Query Params:** `search`, `categoryId`, `isActive`, `page`, `limit`
- **Descripción:** Lista los productos maestros compartidos.

### Caso de Uso: Creación de Producto Maestro
- **Endpoint:** `POST /api/v1/products`
- **Acceso:** Restringido exclusivamente a `ADMIN_GENERAL`
- **Payload (`CreateProductDto`):**
  ```json
  {
    "name": "Almendras Non Pareil",
    "description": "Almendras seleccionadas tamaño grande, sin tostar ni salar.",
    "categoryId": "c4b3a2d1-e5f6-7890-abcd-222222222222",
    "saleUnit": "WEIGHT",
    "imageUrls": [
      "https://pub-r2.nutrigon.com/products/almendras-nonpareil-1.webp"
    ]
  }
  ```
- **Regla:** Solo crea el producto maestro. No lo publica automáticamente en las sucursales.

### Caso de Uso: Modificación de Producto Maestro
- **Endpoint:** `PATCH /api/v1/products/:id`
- **Acceso:** Restringido exclusivamente a `ADMIN_GENERAL`
- **Descripción:** Actualiza nombre, descripción, imágenes o categoría. El cambio impacta inmediatamente a todas las sucursales que ofrezcan el producto, sin alterar precios ni visibilidad.

### Caso de Uso: Desactivación (Soft Delete) de Producto Maestro
- **Endpoint:** `DELETE /api/v1/products/:id`
- **Acceso:** Restringido a `ADMIN_GENERAL`
- **Descripción:** Establece `isActive: false`. El producto se oculta automáticamente de los catálogos públicos de todas las sucursales, conservando su configuración histórica.

---

## 6. Módulo de Configuración y Catálogo de Sucursal (`/api/v1/branches/:branchId`)

### Caso de Uso: Catálogo Público de la Sucursal
- **Endpoint:** `GET /api/v1/branches/:branchId/catalog`
- **Acceso:** Público
- **Query Params:** `search`, `categorySlug`
- **Descripción:** Retorna únicamente productos con estado `isAvailable = true` y precio configurado para esa sucursal.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "p1b2c3d4-e5f6-7890-abcd-333333333333",
        "name": "Almendras Non Pareil",
        "description": "Almendras seleccionadas...",
        "categoryName": "Frutos Secos",
        "saleUnit": "WEIGHT",
        "price": 18500.00,
        "priceUnitLabel": "$18.500 / kg",
        "imageUrls": ["https://pub-r2.nutrigon.com/products/almendras-1.webp"]
      }
    ]
  }
  ```

### Caso de Uso: Panel de Administración de Productos de Sucursal
- **Endpoint:** `GET /api/v1/branches/:branchId/products`
- **Acceso:** `BRANCH_ADMIN` (de esa sucursal) o `ADMIN_GENERAL`
- **Query Params:** `status=active|inactive|unconfigured`, `search`, `categoryId`
- **Descripción:** Diseñado específicamente para alimentar las pestañas de administración con badges de conteo.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "counts": {
      "active": 45,
      "inactive": 12,
      "unconfigured": 3
    },
    "data": [
      {
        "productId": "p1b2c3d4-e5f6-7890-abcd-333333333333",
        "name": "Pasta de Maní Natural 400g",
        "categoryName": "Untables",
        "saleUnit": "UNIT",
        "status": "UNCONFIGURED",
        "price": null,
        "isAvailable": false,
        "imageUrls": ["https://pub-r2.nutrigon.com/products/pasta-mani.webp"]
      }
    ]
  }
  ```

### Caso de Uso: Fijar Precio y Disponibilidad en Sucursal
- **Endpoint:** `PUT /api/v1/branches/:branchId/products/:productId`
- **Acceso:** `BRANCH_ADMIN` (de esa sucursal) o `ADMIN_GENERAL`
- **Payload (`UpsertBranchProductDto`):**
  ```json
  {
    "price": 4200.00,
    "isAvailable": true
  }
  ```
- **Regla:** Si la relación no existía (estado `UNCONFIGURED`), se inserta en `branch_products`. Si ya existía, se actualiza el precio y estado. El precio no puede ser nulo si `isAvailable = true`.

---

## 7. Módulo de Almacenamiento e Imágenes (`/api/v1/media`)

### Caso de Uso: Obtención de URL Prefirmada para R2
- **Endpoint:** `POST /api/v1/media/upload-url`
- **Acceso:** Restringido a `ADMIN_GENERAL`
- **Payload (`GetUploadUrlDto`):**
  ```json
  {
    "fileName": "almendras-bolsa.jpg",
    "contentType": "image/jpeg",
    "folder": "products"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "uploadUrl": "https://<account-id>.r2.cloudflarestorage.com/nutrigon-media/products/...",
      "publicUrl": "https://pub-r2.nutrigon.com/products/8f9b...webp",
      "key": "products/8f9b...webp"
    }
  }
  ```
- **Flujo:** El frontend sube la imagen optimizada directamente desde el navegador a Cloudflare R2 vía `PUT`, eliminando el consumo de ancho de banda y CPU en el backend de Railway.

