
# Reglas de Diseño Responsive (Mobile-First)

1. **Enfoque Mobile-First**: Todo componente debe estructurarse primero para pantallas pequeñas. Usar prefijos `md:`, `lg:` y `xl:` únicamente para adaptar a pantallas mayores.
2. **Sin dimensiones fijas**: Prohibido el uso de anchos rígidos en píxeles (como `w-[800px]`). Emplear siempre clases fluidas: `w-full`, `max-w-screen-xl`, `mx-auto`.
3. **Layouts Flex y Grid**: Usar `flex-col md:flex-row` o `grid grid-cols-1 md:grid-cols-3` para que las columnas colapsen naturalmente en móviles.
4. **Navegación**: Menús y barras de navegación deben transformarse en panel colapsable (hamburguesa) en pantallas menores a 768px (`md`).
5. **Áreas táctiles**: Botones e inputs con altura mínima táctil (`min-h-[44px]`).

## Habilidades del Proyecto

| Habilidad | Descripción | Referencia |
| :--- | :--- | :--- |
| `stitch-responsive-design` | Flujo de diseño dual (Mobile + Desktop Web) en Google Stitch mediante Stitch MCP | [.agents/skills/stitch-responsive-design/SKILL.md](.agents/skills/stitch-responsive-design/SKILL.md) |
