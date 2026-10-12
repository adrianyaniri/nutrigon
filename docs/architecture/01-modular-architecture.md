# Arquitectura Modular del Sistema

## 1. Visión General

El sistema Nutrigon está diseñado bajo el patrón de **Monolito Modular** en el frontend (React + TypeScript + Vite) con backend integrado en la nube mediante **Supabase (PostgreSQL + Auth + Storage)**. Esta arquitectura minimiza el costo operativo y la sobrecarga de infraestructura, ofreciendo una alta cohesión y bajo acoplamiento entre los módulos funcionales del negocio.

```
                      +---------------------------------------+
                      |          Nutrigon Frontend            |
                      |        (React 19 + TypeScript)        |
                      +---------------------------------------+
                                          |
                +-------------------------+-------------------------+
                |                         |                         |
       +-----------------+       +-----------------+       +-----------------+
       |     Portal      |       |  Administración |       | Catálogo Web &  |
       |  Administrativo |       |    Sucursal     |       | Carrito WhatsApp|
       +-----------------+       +-----------------+       +-----------------+
                |                         |                         |
                +-------------------------+-------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         Supabase Client SDK           |
                      |     (RLS, Session & Cache Layer)      |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         PostgreSQL Database           |
                      |   (Roles, RLS, Audit & Integrity)     |
                      +---------------------------------------+
```

## 2. Organización del Código

El proyecto separa responsabilidades respetando la arquitectura guiada por dominio/características:

```
src/
├── app/                  # Configuración transversal, providers, layouts y router
│   ├── config/           # Variables de entorno y configuración centralizada
│   ├── layouts/          # Layouts estructurales (Mobile-First responsive)
│   ├── providers/        # Contextos globales (TanStack Query, Router)
│   └── router/           # Definición de rutas y navegación
├── components/           # Componentes visuales desacoplados
│   ├── ui/               # Componentes base de diseño (shadcn/ui + Tailwind v4)
│   └── shared/           # Componentes compartidos entre funcionalidades
├── features/             # Módulos de negocio (cohesión funcional)
│   ├── auth/             # Sesión, roles y permisos por sucursal
│   ├── products/         # Catálogo maestro de productos (unidad y peso)
│   ├── categories/       # Taxonomía y agrupaciones
│   ├── branches/         # Sucursales (3 puntos de venta físicos)
│   ├── pricing/          # Precios independientes por sucursal
│   ├── inventory/        # Existencias y auditoría de movimientos
│   ├── sales/            # Registro administrativo de ventas
│   └── web-orders/       # Catálogo público y armado de pedido para WhatsApp
├── lib/                  # Adaptadores e infraestructura técnica
│   ├── supabase/         # Cliente y helpers de conexión
│   ├── utils/            # Utilidades generales (cn, formato)
│   └── validation/       # Esquemas base de validación con Zod
├── hooks/                # Hooks transversales reutilizables
├── types/                # Contratos de tipos del dominio
├── styles/               # Tokens de estilos y variables CSS
└── test/                 # Configuración de pruebas y suites de integración
```

## 3. Reglas de Acoplamiento y Dependencias

1. **Aislamiento de Features**: Una carpeta `features/<modulo>` nunca debe importar detalles internos de otra feature. Si dos módulos requieren compartir lógica o presentación, esta debe promoverse a `components/shared/`, `lib/` o `types/`.
2. **Componentes UI Aislados**: `components/ui/` no contiene conocimiento del dominio ni reglas de negocio.
3. **Single Source of Truth para Datos Maestros**: El catálogo de productos es único y maestro; los precios y las existencias residen en entidades segregadas asociadas a la sucursal.
4. **Validación en los Bordes**: Toda entrada de datos externos (formularios, respuestas del servidor, variables de entorno) debe validarse estrictamente con esquemas Zod.
