# Infraestructura, Despliegue y Almacenamiento R2

## 1. Topología de Infraestructura

La arquitectura de infraestructura de Nutrigon separa el cómputo estático del cómputo dinámico y el almacenamiento de medios:

```
+-----------------------------------------------------------------------------------+
|                              Cloudflare Global Edge                               |
|                                                                                   |
|  [Cloudflare Pages]               [Cloudflare R2 Bucket]                          |
|  Frontend SPA (React 19)          Imágenes del Catálogo (WebP)                    |
|  nutrigon.com                     media.nutrigon.com                              |
|  Costo: USD 0/mes                 Costo: USD 0/mes (<10GB, 0 egress)              |
+-----------------------------------------------------------------------------------+
                                           |
                                           | REST API (HTTPS)
                                           v
+-----------------------------------------------------------------------------------+
|                                 Railway Cloud                                     |
|                                                                                   |
|  [NestJS API Container]   <---- Privado ---->   [PostgreSQL Database]             |
|  apps/api (Node 22 LTS)                         v16 con extensiones uuid-ossp     |
|  api.nutrigon.com                               Volumen persistente               |
|                                                                                   |
|  Plan Hobby (~USD 5/mes base + uso mínimo de recursos)                            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Despliegue del Backend en Railway

### 2.1 Dockerfile Multi-Stage Optimizado para Monorepo

Para mantener una imagen liviana y tiempos de compilación veloces en Railway, se emplea un Dockerfile multi-etapa que aísla el paquete `apps/api` utilizando `turbo prune`:

```dockerfile
# Etapa 1: Pruning del Monorepo
FROM node:22-alpine AS pruner
RUN npm install -g pnpm turbo
WORKDIR /app
COPY . .
RUN turbo prune @nutrigon/api --docker

# Etapa 2: Instalación de dependencias
FROM node:22-alpine AS installer
RUN npm install -g pnpm
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Etapa 3: Build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@nutrigon/api

# Etapa 4: Runner de Producción
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 2.2 Variables de Entorno del Backend

| Variable                 | Descripción                                               | Entorno Ejemplo                                                   |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                 | Puerto de escucha HTTP                                     | `3000`                                                          |
| `NODE_ENV`             | Modo de ejecución                                         | `production`                                                    |
| `DATABASE_URL`         | Cadena de conexión privada interna de Railway             | `postgresql://user:pass@postgres.railway.internal:5432/railway` |
| `JWT_SECRET`           | Clave secreta para firma de tokens (mínimo 64 caracteres) | `6b9c8...`                                                      |
| `JWT_EXPIRES_IN`       | Tiempo de vida del token                                   | `8h`                                                            |
| `CORS_ORIGINS`         | Orígenes web autorizados separados por coma               | `https://nutrigon.pages.dev,https://cat.nutrigon.com`           |
| `R2_ACCOUNT_ID`        | Identificador de cuenta de Cloudflare                      | `a1b2c3d4...`                                                   |
| `R2_ACCESS_KEY_ID`     | Access Key ID del token API de R2                          | `token_id...`                                                   |
| `R2_SECRET_ACCESS_KEY` | Secret Key del token API de R2                             | `secret...`                                                     |
| `R2_BUCKET_NAME`       | Nombre del bucket en Cloudflare                            | `nutrigon-media`                                                |
| `R2_PUBLIC_URL`        | Dominio o URL pública asignada al bucket                  | `https://media.nutrigon.com`                                    |

### 2.3 Health Check

El servicio expone `GET /api/v1/health` verificando conectividad a la base de datos PostgreSQL. Railway utiliza este endpoint para orquestar despliegues sin tiempo de inactividad (Zero-Downtime Deployments).

---

## 3. Integración con Cloudflare R2

### 3.1 Arquitectura de Subida Directa (Presigned URLs)

Para evitar que imágenes de alta resolución saturen la memoria RAM o el ancho de banda del contenedor de Railway, el backend nunca procesa el archivo binario directamente:

1. El frontend solicita una URL prefirmada al backend: `POST /api/v1/media/upload-url`.
2. El backend genera un ticket criptográfico temporal (Presigned PUT URL) utilizando `@aws-sdk/s3-request-presigner` con expiración a 5 minutos.
3. El frontend sube el binario optimizado en formato WebP directamente al endpoint de Cloudflare R2 mediante una petición HTTP `PUT`.
4. El frontend almacena la `publicUrl` resultante en el catálogo maestro del producto.

### 3.2 Cliente S3 para R2 en NestJS

Cloudflare R2 implementa una API 100% compatible con Amazon S3:

```typescript
import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

---

## 4. Matriz Comparativa de Costos Operativos Mensuales

| Componente                           | Proveedor y Nivel                       |       Costo Mensual Estimado       |
| ------------------------------------ | --------------------------------------- | :---------------------------------: |
| Frontend Hosting                     | Cloudflare Pages (Free Tier)            |         **USD 0.00**         |
| Almacenamiento de Imágenes          | Cloudflare R2 (10 GB gratis + 0 egress) |         **USD 0.00**         |
| Base de Datos PostgreSQL             | Railway Managed Postgres (Hobby)        |         **~USD 2.50**         |
| Backend API NestJS                   | Railway Container 24/7 (Hobby)          |         **~USD 2.50**         |
| Dominio Personalizado                | Cloudflare Registrar (.com)             | **~USD 0.80** (USD 9.50/año) |
| **Total Estimado del Sistema** | **Infraestructura Completa 24/7** |      **~USD 5.80 / mes**      |

*(Comparado con el plan Supabase Pro de USD 25.00/mes obligatorio para evitar pausas tras 7 días de inactividad).*
