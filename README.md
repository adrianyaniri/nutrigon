# Nutrigon — Sistema de Gestión y Catálogo Web para Dietética

Plataforma integral de gestión administrativa y catálogo comercial para dietética con tres sucursales físicas. Desarrollada con un enfoque de **Monolito Modular**, diseño **Mobile-First** y tipado estricto de extremo a extremo.

---

## 1. Requisitos Previos

- **Node.js**: Versión `>= 20.0.0` (verificado en `v24.13.0`).
- **npm**: Versión `>= 10.0.0` (verificado en `11.9.0`).
- **Git**: Sistema de control de versiones instalado.
- Terminal compatible con PowerShell en Windows (o Bash en Linux/macOS).

---

## 2. Instalación

1. Clonar el repositorio:
   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd Nutrigon
   ```

2. Instalar las dependencias del proyecto:
   ```powershell
   npm install
   ```

---

## 3. Configuración de Variables de Entorno

El proyecto incluye un archivo de plantilla con valores de ejemplo seguros: `.env.example`.

Para desarrollo local:
```powershell
Copy-Item .env.example .env.local
```

### Variables disponibles:

| Variable | Descripción | Valor de Ejemplo |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima de Supabase | `eyJhbGciOiJIUzI1NiIsIn...` |
| `VITE_APP_NAME` | Nombre de la aplicación | `Nutrigon Dietética` |
| `VITE_APP_ENV` | Entorno de ejecución (`development`, `staging`, `production`, `test`) | `development` |

> **Nota de Seguridad**: Nunca incluyas claves de servicio con privilegios (`service_role`) en el frontend ni en archivos versionados. La aplicación detecta automáticamente si las variables de Supabase son marcadores de posición y muestra un aviso de diagnóstico sin interrumpir la ejecución.

---

## 4. Comandos Disponibles

| Comando | Finalidad |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (recarga rápida HMR). |
| `npm run build` | Compila TypeScript y genera el empaquetado optimizado en `dist/`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |
| `npm run typecheck` | Ejecuta el compilador de TypeScript (`tsc --noEmit`) en modo estricto. |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con Vitest. |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo observando cambios. |
| `npm run lint` | Analiza el código con ESLint 9 (reglas estrictas y hooks de React). |
| `npm run lint:fix` | Corrige automáticamente problemas detectados por ESLint. |
| `npm run format:check` | Comprueba que el formato del código cumpla las reglas de Prettier. |
| `npm run format` | Aplica el formato automático de código con Prettier en todo el proyecto. |

---

## 5. Estructura General de Carpetas

```
Nutrigon/
├── docs/                     # Documentación técnica y de requerimientos
│   ├── architecture/         # Documentos de arquitectura técnica y diagramas
│   ├── decisions/            # ADRs (Architecture Decision Records)
│   ├── development/          # Guías de desarrollo y buenas prácticas
│   └── requirements/         # Requerimientos de negocio y propuestas
├── supabase/                 # Configuración de base de datos e infraestructura
│   └── migrations/           # Migraciones versionadas en SQL
├── src/                      # Código fuente de la aplicación
│   ├── app/                  # Núcleo de la aplicación
│   │   ├── config/           # Validación de variables de entorno (Zod)
│   │   ├── layouts/          # Layouts estructurales (Mobile-First responsive)
│   │   ├── providers/        # Proveedores de contexto (TanStack Query, Router)
│   │   └── router/           # Enrutamiento de páginas y vistas
│   ├── components/           # Componentes visuales desacoplados
│   │   ├── ui/               # Componentes atómicos (shadcn/ui + Tailwind v4)
│   │   └── shared/           # Componentes compartidos entre módulos
│   ├── features/             # Módulos de negocio (arquitectura modular)
│   │   ├── auth/             # Autenticación y roles por sucursal
│   │   ├── products/         # Catálogo maestro de productos
│   │   ├── categories/       # Categorías de productos
│   │   ├── branches/         # Gestión de las 3 sucursales
│   │   ├── pricing/          # Precios segregados por sucursal
│   │   ├── inventory/        # Stock y movimientos de inventario
│   │   ├── sales/            # Registro administrativo de ventas
│   │   └── web-orders/       # Catálogo público y pedidos por WhatsApp
│   ├── lib/                  # Adaptadores técnicos y utilidades
│   │   ├── supabase/         # Cliente y wrapper de Supabase
│   │   ├── utils/            # Funciones utilitarias (`cn`, helpers)
│   │   └── validation/       # Esquemas comunes de validación con Zod
│   ├── hooks/                # Custom hooks transversales
│   ├── types/                # Interfaces y tipos TypeScript compartidos
│   ├── styles/               # Estilos globales y tokens de diseño
│   └── test/                 # Configuración de Vitest y pruebas
├── .env.example              # Plantilla de variables de entorno
├── components.json           # Configuración de componentes shadcn/ui
├── eslint.config.js          # Configuración de ESLint (Flat Config)
├── index.html                # Entrada HTML de Vite
├── package.json              # Manifiesto de dependencias y scripts
├── tsconfig.json             # Configuración raíz de TypeScript
└── vite.config.ts            # Configuración de Vite, plugins y Vitest
```

---

## 6. Dependencias Instaladas y Justificación

### Dependencias de Producción (`dependencies`):
- **`react` & `react-dom` (`^19.0.0`)**: Núcleo de la interfaz de usuario con soporte para las APIs más recientes.
- **`react-router-dom` (`^7.2.0`)**: Enrutamiento declarativo del lado del cliente y control de layouts anidados.
- **`@tanstack/react-query` (`^5.66.0`)**: Gestión eficiente del estado asíncrono del servidor, caché, deduplicación de peticiones y sincronización en segundo plano sin sobrecargar con Redux.
- **`@supabase/supabase-js` (`^2.49.1`)**: Cliente oficial para interactuar con la base de datos PostgreSQL, autenticación y storage de Supabase.
- **`react-hook-form` (`^7.54.2`)**: Manejo performante de formularios sin renderizados innecesarios.
- **`zod` (`^3.24.2`)**: Validación de esquemas en tiempo de ejecución con inferencia estricta de tipos TypeScript.
- **`@hookform/resolvers` (`^3.10.0`)**: Integración fluida entre React Hook Form y Zod.
- **`lucide-react` (`^0.475.0`)**: Biblioteca completa de iconos vectoriales consistentes y accesibles.
- **`clsx` & `tailwind-merge` (`^2.1.1` / `^3.0.1`)**: Fusión segura y condicional de clases de Tailwind eliminando colisiones.
- **`class-variance-authority` (`^0.7.1`)**: Creación de variantes de componentes con soporte completo de TypeScript.
- **`@base-ui/react` & `shadcn` (`^1.9.0` / `^4.21.4`)**: Primitivas accesibles y componentes desacoplados de shadcn/ui.
- **`@fontsource-variable/geist` (`^5.3.0`)**: Tipografía variable de alta legibilidad para interfaces web.

### Dependencias de Desarrollo (`devDependencies`):
- **`vite` (`^6.2.0`)**: Entorno de ejecución y empaquetador ultrarrápido para desarrollo y producción.
- **`@vitejs/plugin-react` (`^4.3.4`)**: Soporte oficial de React con Fast Refresh en Vite.
- **`tailwindcss` & `@tailwindcss/vite` (`^4.0.9`)**: Motor de estilos CSS-first de última generación integrado directamente como plugin de Vite.
- **`typescript` (`^5.7.3`)**: Compilador de TypeScript configurado con opciones estrictas de comprobación de tipos.
- **`vitest` (`^5.0.4`)**: Framework de pruebas unitarias y de integración de alto rendimiento.
- **`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`**: Utilidades para pruebas de componentes orientadas al comportamiento del usuario en el DOM.
- **`jsdom` (`^26.0.0`)**: Entorno simulado del DOM para ejecución de pruebas en Node.js.
- **`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`**: Análisis estático de código con soporte para TypeScript y reglas oficiales de React.
- **`prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`**: Formateo consistente y unificado de código sin conflictos con el linter.
