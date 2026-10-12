# ADR-002: Segregación de Precios e Inventario por Sucursal sobre Catálogo Maestro

## Estado
Aprobado

## Contexto
El negocio opera actualmente con 3 archivos Excel aislados, uno por cada sucursal. Esto genera discrepancias en los nombres y códigos de los productos, duplicaciones y dificulta la visión consolidada del negocio. A la vez, cada sucursal tiene autonomía física: los precios pueden variar por zona o promociones locales, y las existencias físicas no se comparten automáticamente.

## Decisión
Se define una arquitectura de datos relacional de dos niveles:
1. **Entidad Maestra `products`**: Representa el producto a nivel conceptual y comercial (código maestro, nombre, descripción, modalidad de venta: unidad o peso por gramo/kilo, categoría, visibilidad web).
2. **Entidad Segregada `branch_prices`**: Relaciona `(product_id, branch_id)` con el precio vigente en dicha sucursal, fecha de actualización y usuario que autorizó el cambio.
3. **Entidad Segregada `branch_inventory`**: Relaciona `(product_id, branch_id)` con la existencia actual, existencias mínimas de alerta y enlace a la tabla histórica de auditoría `inventory_movements`.

## Consecuencias
### Positivas
- Se elimina la duplicación de catálogo entre sucursales.
- Si una sucursal actualiza el precio o descuenta stock, no afecta a las restantes.
- Permite que el catálogo web consolide productos y permita al usuario elegir la sucursal de referencia para consultar precios y disponibilidad.

### Negativas / Mitigaciones
- Las consultas requieren joins entre `products`, `branch_prices` y `branch_inventory`. Se crearán vistas optimizadas e índices compuestos en PostgreSQL.
