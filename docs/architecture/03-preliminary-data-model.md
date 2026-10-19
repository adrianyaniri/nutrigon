# Modelo Entidad-Relación (MER) — Nutrigon MVP

**Estado:** Aprobado y alineado con los contratos y semillas CSV  
**Fecha:** 15 de Octubre de 2026  
**Motor:** PostgreSQL 16 (Drizzle ORM)  

---

## 1. Diagrama Entidad-Relación (MER)

```mermaid
erDiagram
    BRANCHES ||--o{ BRANCH_PRODUCTS : "configura precio y disponibilidad"
    BRANCHES ||--o{ BRANCH_COMBOS : "configura precio combo"
    BRANCHES ||--o{ USERS : "asigna personal"

    CATEGORIES ||--o{ PRODUCTS : "clasifica"

    PRODUCTS ||--o{ BRANCH_PRODUCTS : "parametrizado en"
    PRODUCTS ||--o{ COMBO_ITEMS : "compone"

    COMBOS ||--o{ COMBO_ITEMS : "contiene"
    COMBOS ||--o{ BRANCH_COMBOS : "parametrizado en"

    BRANCHES {
        uuid id PK "Identificador único"
        varchar name "Nombre (Origone, Pedro Diaz, W Morris)"
        varchar slug UK "Slug único (origone, pedro-diaz, w-morris)"
        varchar address "Dirección física de la sucursal"
        varchar phone "Teléfono fijo / contacto"
        varchar whatsapp_number "Número de WhatsApp para pedidos"
        boolean is_active "Soft delete (true por defecto)"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de modificación"
    }

    CATEGORIES {
        uuid id PK "Identificador único"
        varchar name "Nombre (ej. FRUTOS SECOS, HARINAS)"
        varchar slug UK "Slug único (ej. frutos-secos, harinas)"
        integer order_index "Orden de prioridad en navegación"
        boolean is_active "Soft delete (true por defecto)"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de modificación"
    }

    PRODUCTS {
        uuid id PK "Identificador único"
        uuid category_id FK "FK -> categories.id"
        varchar code "Código numérico o SKU visible"
        varchar barcode "Código de barras EAN-13 para escáner"
        varchar name "Nombre maestro del producto"
        text description "Descripción comercial o nutricional"
        varchar sale_unit "Modalidad: 'UNIT' o 'WEIGHT'"
        text_array image_urls "Imágenes en Cloudflare R2"
        boolean is_active "Soft delete (true por defecto)"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de modificación"
    }

    BRANCH_PRODUCTS {
        uuid id PK "Identificador único de configuración"
        uuid branch_id FK "FK -> branches.id"
        uuid product_id FK "FK -> products.id"
        numeric price "Precio de venta de la sucursal ($ o $/kg)"
        numeric promotional_price "Precio de oferta (nullable)"
        boolean is_on_sale "Flag para precio tachado y badge de oferta"
        boolean is_available "Visible en el catálogo público"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de actualización de precio/estado"
    }

    COMBOS {
        uuid id PK "Identificador único del combo"
        varchar name "Nombre maestro del combo"
        text description "Descripción del paquete promocional"
        text_array image_urls "Imágenes en Cloudflare R2"
        boolean is_active "Soft delete (true por defecto)"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de modificación"
    }

    COMBO_ITEMS {
        uuid id PK "Identificador único del ítem"
        uuid combo_id FK "FK -> combos.id"
        uuid product_id FK "FK -> products.id"
        numeric quantity "Cantidad del producto (unidades o kg)"
    }

    BRANCH_COMBOS {
        uuid id PK "Identificador único de precio del combo"
        uuid branch_id FK "FK -> branches.id"
        uuid combo_id FK "FK -> combos.id"
        numeric price "Precio del combo en la sucursal"
        boolean is_available "Visible en el catálogo público"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de actualización de precio/estado"
    }

    USERS {
        uuid id PK "Identificador único"
        varchar email UK "Email de acceso"
        text password_hash "Hash Argon2id"
        varchar full_name "Nombre y apellido"
        varchar role "ADMIN_GENERAL | BRANCH_ADMIN"
        uuid branch_id FK "FK -> branches.id (null si es ADMIN_GENERAL)"
        boolean is_active "Estado de la cuenta"
        timestamp created_at "Fecha de alta"
        timestamp updated_at "Fecha de modificación"
    }
```

---

## 2. Restricciones de Integridad y Claves Únicas

1. **`BRANCH_PRODUCTS`:**
   - `UNIQUE(branch_id, product_id)`: Garantiza que un producto tenga una única configuración comercial por sucursal.
2. **`BRANCH_COMBOS`:**
   - `UNIQUE(branch_id, combo_id)`: Garantiza que un combo tenga un único precio y disponibilidad por sucursal.
3. **`CATEGORIES`:**
   - `UNIQUE(slug)`: Garantiza que las rutas web del catálogo (`/categoria/:slug`) sean unívocas.
4. **`BRANCHES`:**
   - `UNIQUE(slug)`: Garantiza que el acceso web por sucursal (`/sucursal/:slug`) sea determinista.
5. **`USERS`:**
   - `UNIQUE(email)`: Autenticación única.
6. **`PRODUCTS`:**
   - Índice sobre `code` y `barcode` para búsquedas instantáneas en el panel de administración y punto de venta.

---

## 3. Alineación con las Semillas CSV (`data/`)

| Tabla | Archivo Semilla | Cobertura |
|---|---|---|
| `branches` | `data/branches.csv` | 3 sucursales fundacionales: Origone, Pedro Diaz, W Morris |
| `categories` | `data/categories.csv` | 20 categorías normalizadas (Frutos Secos, Harinas, etc.) |
| `products` | `data/products.csv` | 2.257 productos maestros con código, nombre, categoría y modalidad (`UNIT` / `WEIGHT`) |
| `branch_products` | — | Se parametriza desde el panel de administración o seed inicial |
| `combos` / `combo_items` | — | Se administran desde el panel de administración |
| `users` | — | Seed de administradores iniciales con credenciales hash Argon2id |
