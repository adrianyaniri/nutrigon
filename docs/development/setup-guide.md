# Guía de Desarrollo y Entorno Local

## Requisitos del Sistema
- Node.js versión 20.x o superior (desarrollado y verificado en Node.js v24).
- npm versión 10.x o superior.
- Git.
- Sistema operativo compatible con PowerShell / Bash.

## Flujo de Trabajo Local

### 1. Clonar el repositorio e instalar dependencias
```powershell
npm install
```

### 2. Configurar variables de entorno
Copiar `.env.example` a `.env.local`:
```powershell
Copy-Item .env.example .env.local
```
Completar las variables correspondientes a tu proyecto de Supabase en `.env.local` si deseas conectarlo a un entorno de desarrollo. La aplicación funciona en modo diagnóstico local si estas variables no se completan.

### 3. Ejecución en desarrollo
```powershell
npm run dev
```

### 4. Verificación de calidad de código
```powershell
# Análisis estático
npm run lint

# Formato
npm run format:check
npm run format

# Tipos TypeScript
npm run typecheck

# Suite de pruebas automatizadas
npm test

# Build de producción
npm run build
```
