
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
| `nestjs-drizzle-tdd` | Arquitectura NestJS, Drizzle ORM, validación con Zod y ciclo TDD | [.agents/skills/nestjs-drizzle-tdd/SKILL.md](.agents/skills/nestjs-drizzle-tdd/SKILL.md) |
| `cloudflare-r2-storage` | Almacenamiento y subida directa de imágenes mediante Presigned URLs hacia Cloudflare R2 | [.agents/skills/cloudflare-r2-storage/SKILL.md](.agents/skills/cloudflare-r2-storage/SKILL.md) |
| `docker-api` | Contenerización, Dockerfiles, Docker Compose y validación de la API NestJS | [.agents/skills/docker-api/SKILL.md](.agents/skills/docker-api/SKILL.md) |


# Reglas del Backend (apps/api)

1. **TDD por defecto**: en reglas de negocio y seguridad (services, guards, esquemas Zod) escribir primero el test que falla, luego el código mínimo y después refactorizar. Ver [docs/decisions/ADR-004-drizzle-zod-and-tdd.md](docs/decisions/ADR-004-drizzle-zod-and-tdd.md).
2. **Validación con Zod** desde `packages/contracts`; no usar `class-validator`.
3. **Acceso a datos con Drizzle** solo dentro de repositorios; los services no importan Drizzle.
4. Un cambio no se integra si falla `pnpm turbo run lint typecheck test`.
