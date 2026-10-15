---
name: cloudflare-r2-storage
description: >
  Patrones de integración y subida directa de archivos e imágenes a Cloudflare R2 usando URLs prefirmadas (S3 API).
  Trigger: Cuando se implemente o modifique la carga de imágenes, generación de URLs prefirmadas o gestión de medios en apps/api o apps/web.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Al implementar o modificar el módulo `media` en `apps/api`.
- Al generar Presigned URLs para subida directa de imágenes desde el navegador.
- Al configurar la optimización y carga de imágenes en el frontend (`apps/web`).
- Al ajustar variables de entorno o clientes S3 para Cloudflare R2.

---

## Critical Patterns

### 1. Subida Directa desde el Navegador (Presigned PUT)
- **NUNCA subir binarios pesados al backend de Railway.** Esto satura la memoria RAM del contenedor y duplica el consumo de ancho de banda.
- El backend (`apps/api`) actúa exclusivamente como emisor de tickets de autorización generando una **Presigned PUT URL** temporal mediante `@aws-sdk/s3-request-presigner`.
- El frontend (`apps/web`) realiza la petición `PUT` directamente al endpoint de Cloudflare R2 con el archivo binario (preferentemente optimizado en WebP).
- Tras el `PUT` exitoso, el frontend asocia la URL pública del bucket (`R2_PUBLIC_URL`) al producto.

### 2. Compatibilidad con Amazon S3 API
Cloudflare R2 implementa una API compatible con S3. En NestJS se utiliza `@aws-sdk/client-s3`:
- **Endpoint:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- **Region:** Siempre `"auto"`.
- **Credentials:** `accessKeyId` y `secretAccessKey` provistos por el token API de Cloudflare R2.

### 3. Nomenclatura y Organización de Archivos
- Estructurar las claves (keys) de los objetos con prefijo de carpeta y UUID para evitar colisiones: `products/<uuid>.<ext>`.
- Las URLs públicas deben apuntar al dominio público del bucket o CDN configurado (ej. `https://media.nutrigon.com/products/...`).

---

## Code Examples

### Generación de Presigned URL en NestJS
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL prefirmada válida por 5 minutos (300 segundos)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}
```

### Subida Directa en Frontend (React)
```typescript
async function uploadImageToR2(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Error al subir la imagen directamente a Cloudflare R2');
  }
}
```

---

## Resources

- **Documentación de Infraestructura**: [07-backend-infrastructure-and-storage.md](../../../docs/architecture/07-backend-infrastructure-and-storage.md)
- **Especificación del Endpoint**: [05-backend-api-endpoints-and-use-cases.md](../../../docs/architecture/05-backend-api-endpoints-and-use-cases.md)

