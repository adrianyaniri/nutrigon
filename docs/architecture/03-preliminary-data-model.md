# Propuesta Preliminar del Modelo de Datos — Dietética (3 Sucursales)

> [!WARNING]
> **ESTADO DEL DOCUMENTO: BORRADOR PRELIMINAR DE VALIDACIÓN TÉCNICA**
> Este modelo de datos representa una propuesta de diseño para estructurar la separación entre catálogo maestro y las 3 sucursales. **NO ES EL MODELO FINAL DEFINITIVO**. Está sujeto a ajustes y validación técnica una vez analizados los archivos Excel reales y definidas las decisiones comerciales pendientes (D-01 a D-10).

---

## 1. Diagrama Entidad-Relación Conceptual

```mermaid
erDiagram
    BRANCHES ||--o{ BRANCH_PRICES : "fija precios en"
    BRANCHES ||--o{ BRANCH_INVENTORY : "mantiene stock en"
    BRANCHES ||--o{ INVENTORY_MOVEMENTS : "registra movimientos en"
    BRANCHES ||--o{ SALES : "registra ventas en"

    CATEGORIES ||--o{ PRODUCTS : "clasifica"

    PRODUCTS ||--o{ BRANCH_PRICES : "tiene precio por sucursal"
    PRODUCTS ||--o{ BRANCH_INVENTORY : "tiene existencias por sucursal"
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : "participa en"
    PRODUCTS ||--o{ SALE_ITEMS : "vendido en"

    SALES ||--|{ SALE_ITEMS : "contiene"

    BRANCHES {
        uuid id PK
        text code "sucursal-1, sucursal-2, sucursal-3"
        text name
        text address
        text phone
        text whatsapp_number
        boolean is_active
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        text name
        text slug
        text description
        boolean is_active
        timestamp created_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text sku "Opcional hasta auditar Excel"
        text name
        text description
        text sale_unit "unit, weight_kg, weight_g"
        boolean is_visible_web
        boolean is_active
        timestamp created_at
    }

    BRANCH_PRICES {
        uuid id PK
        uuid product_id FK
        uuid branch_id FK
        numeric price "12, 2"
        timestamp updated_at
        uuid updated_by
    }

    BRANCH_INVENTORY {
        uuid id PK
        uuid product_id FK
        uuid branch_id FK
        numeric current_stock "12, 3"
        numeric min_stock_alert "12, 3"
        timestamp updated_at
    }

    INVENTORY_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        uuid branch_id FK
        text movement_type "in, out, adjustment, transfer"
        numeric quantity "12, 3"
        text reason
        uuid created_by
        timestamp created_at
    }

    SALES {
        uuid id PK
        uuid branch_id FK
        text sale_number
        numeric total_amount "12, 2"
        text payment_method "efectivo, debito, transferencia"
        text status "completed, cancelled"
        uuid created_by
        timestamp created_at
    }

    SALE_ITEMS {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        numeric quantity "12, 3"
        numeric unit_price "12, 2"
        numeric subtotal "12, 2"
    }
```

---

## 2. Descripción de Entidades

### 2.1. `branches` (Sucursales)
Representa los tres puntos de venta físicos del negocio. Permite asignar usuarios, segmentar precios, controlar existencias e indicar el número de WhatsApp comercial de cada una si la atención es descentralizada.

### 2.2. `categories` (Categorías)
Estructura taxonómica para organizar productos en el catálogo web y en el buscador administrativo (ej. Frutos Secos, Harinas, Suplementos, Especias).

### 2.3. `products` (Catálogo Maestro)
**Fuente única de verdad de los productos.** No se duplica por sucursal.
- `sale_unit`: define si se comercializa por unidad entera (`unit`), por kilogramo (`weight_kg`) o por gramos (`weight_g`).
- `is_visible_web`: flag para controlar qué productos se publican en el catálogo digital.

### 2.4. `branch_prices` (Precios Segregados)
Resuelve el requerimiento de precios diferenciados entre sucursales. Posee una restricción `UNIQUE (product_id, branch_id)` para asegurar un único precio activo por producto en cada sucursal.

### 2.5. `branch_inventory` (Existencias Segregadas)
Mantiene el balance de stock actual e indicador de alerta de reposición. Utiliza precisión de 3 decimales (`numeric(12, 3)`) para soportar fraccionamiento por peso.

### 2.6. `inventory_movements` (Auditoría de Movimientos)
Tabla histórica e inmutable. Registra cada ingreso, egreso, merma o ajuste manual con su responsable y justificación.

### 2.7. `sales` y `sale_items` (Ventas Administrativas)
Registro transaccional de ventas realizadas en mostrador. Permite vincular los ítems vendidos para consolidar reportes de venta por fecha y sucursal.

---

## 3. Matriz Preliminar de Seguridad y RLS

| Rol | Catálogo (`products`, `categories`) | Precios (`branch_prices`) | Inventario (`branch_inventory`) | Ventas (`sales`) |
| :--- | :--- | :--- | :--- | :--- |
| **Público (Anónimo Web)** | Solo lectura (`is_visible_web = true`) | Solo lectura de sucursal seleccionada | No visible (o solo indicador de disponibilidad) | Sin acceso |
| **Personal de Sucursal** | Lectura completa | Lectura de su sucursal | Lectura y ajustes de su sucursal | Registro y consulta de su sucursal |
| **Administrador General** | Lectura y Escritura total | Lectura y Escritura total | Lectura y Escritura total | Lectura y Reportes consolidados |

---

## 4. Preguntas Abiertas para Validación con el Cliente
1. ¿El SKU actual en las planillas Excel es único entre todas las sucursales o difiere?
2. Para productos por peso: ¿se cobrará siempre por 100g o por 1kg como precio base visible?
3. ¿Las anulaciones de venta reintegran el stock automáticamente mediante un movimiento compensatorio?
