# PWA del personal en el mismo proyecto de Cloudflare Pages

El despliegue sigue siendo único. El manifiesto público generado por VitePWA conserva
`/catalogo` como inicio. Pages ejecuta `public/_worker.js` únicamente para `/` y
`/manifest.webmanifest`, según `public/_routes.json`:

- En `www.nutrigon.ar`, ambos recursos conservan su comportamiento actual.
- En `admin.nutrigon.ar`, `/` redirige a `/admin` y la URL habitual del manifiesto
  entrega `admin.webmanifest`, con inicio y alcance en `/admin`.
- Las rutas `/admin` siguen requiriendo inicio de sesión y aplican permisos por rol.
  El manifiesto no impide que una persona instale el acceso directo: la autorización
  protege el contenido, no la instalación del icono.

## Activación

1. Publicar una versión cuyo directorio de salida `apps/web/dist` incluya
   `_worker.js`, `_routes.json`, `admin.webmanifest` y el manifiesto público.
   No crear otro proyecto Pages ni modificar el directorio raíz del proyecto.
2. En el proyecto Pages existente, agregar `admin.nutrigon.ar` como **dominio
   personalizado**. Completar la validación DNS/TLS que indique Cloudflare;
   crear solo un registro DNS no vincula por sí mismo el dominio al proyecto.
3. Agregar `https://admin.nutrigon.ar` a `CORS_ORIGINS` de la API en Railway,
   conservando los orígenes actuales. Reiniciar el servicio para aplicar el cambio.
4. Antes de habilitar el uso del personal, verificar en producción que
   `https://admin.nutrigon.ar/` redirija a `/admin`, que su
   `/manifest.webmanifest` tenga `start_url: "/admin"`, que el manifiesto de
   `www.nutrigon.ar` continúe iniciando en `/catalogo`, y que un usuario no
   autenticado no pueda entrar en las pantallas administrativas.

## Instalación

El personal abre `https://admin.nutrigon.ar/`, inicia sesión y usa la acción de
instalación del navegador (o «Agregar a pantalla de inicio» en Safari para iPhone).
La PWA pública y la administrativa tienen orígenes distintos y pueden instalarse
por separado.

La autenticación simulada queda limitada al entorno de pruebas. En producción,
un fallo de red o CORS no inicia sesión; por eso es imprescindible actualizar
`CORS_ORIGINS` antes de distribuir el acceso al personal.
