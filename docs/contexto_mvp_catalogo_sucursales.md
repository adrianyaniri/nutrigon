# MVP — Catálogo de productos por sucursal

## 1. Propósito

Este documento registra las decisiones funcionales acordadas para el MVP del sistema de catálogo de una dietética con tres sucursales. Debe usarse como contexto por cualquier agente que diseñe, implemente o revise el sistema.

El objetivo del MVP es administrar un catálogo público por sucursal y permitir que los clientes preparen un pedido para enviarlo por WhatsApp. **No es un sistema de ventas ni de inventario.**

## 2. Alcance confirmado

Incluido:

- Catálogo público de productos.
- Selección o acceso a una sucursal.
- Productos, categorías, descripciones e imágenes.
- Precios específicos por sucursal.
- Activar u ocultar un producto en el catálogo de cada sucursal.
- Panel de administración.
- Roles de administrador general y administrador de sucursal.
- Carrito o selección de productos en la web y generación de un mensaje para continuar el pedido por WhatsApp.
- QR que dirige al catálogo o a la sucursal correspondiente, según se defina en el diseño final.

Fuera del alcance del MVP:

- Control de stock e inventario.
- Registro de ventas.
- Caja, cobros o facturación.
- Movimientos de inventario, ajustes o transferencias.
- Integración con balanzas Cuora Neo.
- Compras y proveedores.
- WhatsApp Business API.

No presentar un pedido preparado para WhatsApp como una venta registrada. El envío a WhatsApp no debe descontar stock ni crear una venta en el sistema.

## 3. Decisión central: catálogo maestro y configuración por sucursal

El sistema debe distinguir entre:

1. **Producto maestro:** información general compartida, como nombre, descripción, categoría e imágenes.
2. **Configuración del producto en una sucursal:** si esa sucursal lo ofrece/publica y cuál es su precio.

Un producto debe crearse una sola vez en el catálogo maestro. No se deben crear copias del mismo producto para cada sucursal solo porque cambien el precio o la disponibilidad comercial.

Ejemplo:

| Producto | Sucursal Centro | Sucursal Norte | Sucursal Sur |
|---|---:|---:|---:|
| Almendras naturales | $5.000 | $5.500 | $4.900 |
| Semillas de chía | $2.800 | No lo ofrece | $3.000 |
| Harina de almendras | No lo ofrece | $6.400 | $6.200 |

Los precios son ilustrativos. La tabla representa un único producto maestro con una configuración distinta para cada sucursal.

**Crear un producto maestro no lo publica automáticamente en todas las sucursales.** Cada sucursal debe habilitarlo y establecer su propio precio antes de ofrecerlo en su catálogo.

## 4. Roles y permisos

### 4.1 Administrador general

Es el único rol autorizado a crear productos en el MVP.

Puede:

- Crear productos maestros.
- Editar los datos generales de un producto: nombre, descripción, categoría e imágenes.
- Administrar las sucursales.
- Administrar las cuentas y asignaciones de los administradores de sucursal.
- Consultar las configuraciones de producto de las distintas sucursales.

La creación de un producto no debe activarlo automáticamente en todos los catálogos. El producto queda disponible en el catálogo maestro y cada sucursal decide si lo ofrece.

### 4.2 Administrador de sucursal

Cada administrador está asociado a una sucursal. Puede consultar el catálogo maestro completo, pero solo modificar la configuración comercial de su propia sucursal.

Puede:

- Ver todos los productos maestros, incluidos los que su sucursal todavía no ofrece.
- Activar un producto para que aparezca en el catálogo público de su sucursal.
- Desactivarlo u ocultarlo en el catálogo de su sucursal.
- Definir y modificar el precio del producto en su sucursal.
- Buscar y filtrar productos por nombre, categoría y estado.

No puede:

- Crear productos maestros.
- Editar los datos generales compartidos de los productos.
- Modificar precios, activación o visibilidad de otra sucursal.
- Administrar usuarios o sucursales, salvo que se le otorgue explícitamente otro permiso en una etapa posterior.

En el MVP, **solo el administrador general crea productos**. No implementar solicitudes de aprobación ni creación directa por parte de los administradores de sucursal, salvo que se decida posteriormente.

### 4.3 Cliente del catálogo público

El cliente consulta los productos y precios de la sucursal seleccionada, arma su pedido y continúa por WhatsApp.

Solo debe ver los productos activos/publicados para esa sucursal. No debe ver productos ocultos ni los precios de otras sucursales.

## 5. Pantalla del administrador de sucursal

La pantalla principal puede llamarse **“Productos de mi sucursal”**.

Debe incluir:

- Nombre de la sucursal activa.
- Campo de búsqueda.
- Filtro por categoría.
- Filtro por estado: todos, activos y ocultos/inactivos.
- Tabla o lista de productos con:
  - nombre e imagen;
  - categoría;
  - precio en esa sucursal;
  - estado de publicación;
  - acción para activar/desactivar;
  - acción para editar el precio.
- Una aclaración visible: “Los cambios afectan únicamente a esta sucursal. Los datos generales de los productos los administra el administrador general”.

Es importante que la interfaz diferencie estos estados:

- **Activo:** el producto está ofrecido y publicado en esa sucursal.
- **Inactivo/oculto:** el producto existe en el catálogo maestro, pero no se muestra en el catálogo público de esa sucursal.
- **Sin configurar:** el producto maestro existe, pero todavía no fue habilitado/configurado para esa sucursal.

La interfaz puede permitir que el administrador active un producto y cargue su precio en el mismo flujo. No publicar un producto sin un precio válido si el modelo comercial requiere precio para mostrarlo.

## 6. Ejemplo de flujo

1. El administrador general crea “Pasta de maní”, con nombre, descripción, categoría e imágenes.
2. El producto queda disponible en el catálogo maestro, pero no se publica automáticamente en todas las sucursales.
3. El administrador de Centro ve “Pasta de maní” en su lista y decide activarlo.
4. El administrador de Centro establece el precio para Centro.
5. El producto aparece en el catálogo público de Centro.
6. Norte y Sur no lo muestran hasta que sus administradores lo activen y configuren su precio.
7. Si el administrador general actualiza la descripción general o las imágenes, los cambios se reflejan en las sucursales que usan ese producto. El precio y el estado de publicación de cada sucursal no deben modificarse como efecto colateral.

## 7. Modelo de datos conceptual

Mantener el modelo simple. Como mínimo, considerar:

### `branches`
Datos de cada sucursal, por ejemplo nombre, dirección, identificador de URL, teléfono/WhatsApp y estado.

### `products`
Catálogo maestro. Contiene los datos compartidos del producto: nombre, descripción, categoría, unidad o modalidad de venta, imágenes asociadas y estado general.

### `categories`
Categorías del catálogo, si se administran como entidad independiente.

### `branch_products`
Relación entre un producto y una sucursal. Debe contener, como mínimo:

- `branch_id`
- `product_id`
- precio de esa sucursal
- estado de publicación/activación

Debe existir una restricción única sobre `(branch_id, product_id)` para evitar más de una configuración del mismo producto para la misma sucursal.

Puede usarse la ausencia de una fila en `branch_products` para representar que el producto aún no fue configurado en esa sucursal. Si se prefiere crear la relación al momento de generar un producto maestro, el estado inicial debe ser inactivo y sin publicación; elegir una estrategia y mantenerla consistentemente.

### `users` y asignación de sucursal/rol
La cuenta del usuario y su asociación con la sucursal deben permitir que el backend determine qué acciones puede realizar. La asignación puede representarse mediante una tabla como `user_branch_roles`, según la estrategia de autenticación elegida.

La autorización debe validarse en el backend, no solo ocultando botones en la interfaz. Un administrador de sucursal no puede cambiar datos de otra sucursal manipulando una solicitud HTTP.

### Futuro inventario
El diseño debe permitir incorporar inventario después, relacionado al producto y a la sucursal, sin implementar ahora tablas ni lógica de stock. No crear tablas de stock, movimientos, ventas o ítems de venta en este MVP.

## 8. Reglas funcionales que deben respetarse

1. Un producto maestro se crea una sola vez.
2. Cada sucursal puede tener su propio precio para el mismo producto.
3. Cada sucursal decide qué productos ofrece y publica.
4. La activación en una sucursal no activa el producto en las demás.
5. El administrador general es el único que crea productos maestros en el MVP.
6. Los administradores de sucursal solo editan precio y estado de publicación de su propia sucursal.
7. Los datos generales del producto son compartidos; no duplicarlos por sucursal.
8. El catálogo público muestra solo productos publicados para la sucursal seleccionada.
9. El MVP no registra ventas ni controla stock.
10. El flujo de WhatsApp no implica una venta confirmada ni un descuento de inventario.
11. No agregar módulos, tablas o procesos no requeridos por el alcance confirmado sin consultar antes.

## 9. Decisiones cerradas y validadas

Las siguientes decisiones fueron formalmente analizadas y confirmadas para el MVP:

- **Modalidad de venta y precios (CERRADO):** Se admiten dos modalidades de venta: `UNIT` (por unidad) y `WEIGHT` (por peso). Para productos pesables, el precio base en `branch_products` se fija siempre por kilogramo ($/kg). En el catálogo público web, el cliente puede seleccionar múltiplos y fracciones estándar en gramos (100g, 250g, 500g, 1kg) para calcular el subtotal y armar el mensaje de WhatsApp.
- **Formato definitivo de los códigos QR (CERRADO):** En el MVP se implementa el código QR general por sucursal (`/sucursal/:slug`) orientado a cartelería de mostrador y vidriera física. Los QRs individuales por producto quedan contemplados a nivel de rutas para una etapa posterior.
- **Campos del catálogo maestro y categorías (CERRADO):** `products` incluye `id`, `name`, `description`, `category_id`, `sale_unit` (`UNIT` | `WEIGHT`), `image_urls` (Cloudflare R2), `is_active` (soft delete), marcas temporales. `categories` incluye `id`, `name`, `slug`, `order_index`, `is_active`.
- **UX de productos sin configurar en la sucursal (CERRADO):** En la pantalla del administrador de sucursal se implementa navegación por pestañas en la misma tabla: `[Activos (N)]`, `[Ocultos (N)]` y `[Sin configurar (N)]`. La pestaña "Sin configurar" muestra un badge numérico que alerta sobre nuevos productos maestros creados, y cuenta con una acción directa para fijar precio y activar en un solo paso.
- **Política de baja de productos maestros (CERRADO):** Se aplica **Soft Delete** (`is_active: false`). NUNCA se realiza eliminación física (`DELETE`) en la base de datos si el producto posee relaciones con sucursales. Al desactivar un producto maestro, este se oculta automáticamente de todos los catálogos públicos manteniendo su configuración histórica en las sucursales.
- **Tecnología de backend, persistencia y autenticación (CERRADO):**
  - **Arquitectura:** Monorepo gestionado con Turborepo y PNPM Workspaces (`apps/web`, `apps/api`, `packages/contracts`).
  - **Framework Backend:** NestJS + TypeScript (Monolito modular).
  - **Base de Datos:** PostgreSQL en Railway (Plan Hobby, ejecución continua 24/7 sin suspensiones por inactividad).
  - **Almacenamiento de Imágenes:** Cloudflare R2 con SDK S3 (10 GB gratuitos y 0 costo de egress).
  - **Autenticación y Autorización:** Tokens JWT Stateless (Argon2id) con Guards a nivel de framework (`RolesGuard` y `BranchAccessGuard`). (Ver `docs/decisions/ADR-003-backend-nestjs-monorepo-railway-r2.md`).


## 10. Criterio para futuros agentes

Antes de proponer una funcionalidad, comprobar que pertenece al alcance del MVP. Priorizar la solución más simple que respete las reglas de este documento. No agregar inventario, ventas, compras, integración con balanzas ni automatizaciones adicionales por anticipación. La arquitectura puede dejar puntos de extensión para el futuro, pero no implementar módulos futuros ahora.
