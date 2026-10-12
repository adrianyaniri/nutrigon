# ADR-001: Selección de Stack Tecnológico y Arquitectura de Monolito Modular

## Estado
Aprobado

## Contexto
El sistema de gestión de la dietética requiere administrar tres sucursales físicas (catálogo maestro, precios independientes, inventario independiente, registro de ventas) y brindar un catálogo público web con carrito para pedidos por WhatsApp. El cliente busca una solución con bajo costo operativo, alta mantenibilidad, rápida respuesta y mínima infraestructura intermedia.

## Decisión
Se adopta una arquitectura de **Monolito Modular** en el frontend estructurada con:
- **React 19 + TypeScript**: Tipado estricto en toda la base de código.
- **Vite 6**: Empaquetador ultra-rápido con soporte nativo de ESM y recarga en caliente eficiente.
- **Tailwind CSS v4 + shadcn/ui**: Sistema de diseño moderno, accesible, mobile-first y sin dependencias de runtime pesadas.
- **React Router 7**: Enrutamiento declarativo del lado del cliente.
- **TanStack Query v5**: Gestión de estado asíncrono, caché, reintentos y deduplicación de consultas del servidor sin requerir bibliotecas de estado global complejas como Redux.
- **React Hook Form + Zod**: Validación declarativa y tipada de entradas.
- **Supabase (PostgreSQL + Auth + Storage)**: Backend-as-a-Service que elimina la necesidad de mantener un servidor API intermedio para operaciones CRUD estándar.
- **Vitest + React Testing Library**: Suite de pruebas unitarias y de integración rápida con entorno DOM nativo.

## Consecuencias
### Positivas
- Ausencia de infraestructura de servidor API dedicada que mantener o pagar mensualmente.
- Despliegue estático de costo prácticamente nulo (por ejemplo, Cloudflare Pages o Vercel).
- Alta velocidad de desarrollo sin sacrificar rigor arquitectónico.
- Separación estricta por módulos de negocio (`features/`) que permite migrar partes del sistema a microfrontends o backend dedicado si el negocio lo requiriese en el futuro.

### Negativas / Mitigaciones
- Lógica de autorización y auditoría debe residir estrictamente en políticas RLS y funciones de PostgreSQL, ya que no hay middleware intermedio propio.
