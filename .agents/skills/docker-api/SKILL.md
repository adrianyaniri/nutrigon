---
name: docker-api
description: Diseña, implementa, revisa y valida la contenerización de la API NestJS de Nutrigon. Usar al crear o modificar Dockerfiles, imágenes de producción, Docker Compose, configuración de contenedores, pipelines de build y despliegues de la API.
---

# Docker API — Nutrigon

## 1. Objetivo

Contenerizar la API de Nutrigon con imágenes reproducibles, seguras, eficientes y aptas para producción, respetando la arquitectura del monorepo existente.

No asumir que una configuración Docker genérica funcionará en este proyecto. Inspeccionar el repositorio y verificar cada decisión.

## 2. Inspección obligatoria

Antes de modificar archivos:

1. Leer `AGENTS.md` y la skill `architecture-review`.
2. Leer las skills `nestjs-drizzle-tdd` y `cloudflare-r2-storage` cuando correspondan.
3. Revisar `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` y `turbo.json`.
4. Inspeccionar `apps/api/package.json` y `packages/contracts/package.json`.
5. Revisar `apps/api/tsconfig*.json`, configuración de NestJS, configuración de TypeScript y scripts de build.
6. Inspeccionar el `docker-compose.yml` existente y cualquier `.dockerignore`, Dockerfile o configuración de despliegue.
7. Identificar dependencias nativas, recursos necesarios en runtime y variables de entorno.
8. Verificar el punto de entrada compilado y la estructura real de `dist`.

Nunca asumir que `dist/main.js`, una ruta de artefactos o un comando de inicio es correcto sin comprobar la configuración de compilación.

No leer, copiar ni mostrar el contenido de `credentials.local.md`, archivos `.env` ni otros archivos que contengan secretos. Inspeccionar únicamente los nombres de variables o ejemplos saneados cuando sea necesario.

## 3. Estrategia de build para el monorepo

- Usar la versión de Node.js compatible con `engines` y con las dependencias del proyecto. La configuración actual exige Node.js >=22.
- Respetar la versión de pnpm declarada en `package.json` y el lockfile.
- Mantener la instalación reproducible mediante `pnpm install --frozen-lockfile`.
- Considerar Turbo y los paquetes `workspace:*`.
- No copiar únicamente `apps/api` si la compilación necesita el workspace raíz o `packages/contracts`.
- Evaluar si conviene usar `turbo prune` con salida Docker, un build desde la raíz o una estrategia equivalente.
- Elegir una estrategia compatible con la versión instalada de Turbo, verificando los comandos disponibles.
- Separar las etapas de dependencias, compilación y runtime cuando aporte una mejora real.
- Aprovechar la caché de capas: copiar primero los manifiestos necesarios y después el código fuente.
- No instalar todas las dependencias de desarrollo en la imagen final si se pueden excluir de forma segura.
- Verificar que la imagen final incluya todos los paquetes y archivos requeridos para ejecutar la API.
- No introducir un gestor de paquetes distinto ni cambiar el lockfile para simplificar el Dockerfile.

## 4. Seguridad de la imagen

- Ejecutar la aplicación como usuario no privilegiado, por ejemplo el usuario `node` cuando la imagen elegida lo soporte.
- No ejecutar la API como root en producción.
- No copiar archivos `.env`, credenciales, claves privadas, tokens ni archivos locales sensibles.
- No utilizar `ARG` o `ENV` para incorporar secretos durante el build.
- Usar BuildKit secrets o mecanismos equivalentes cuando una operación de build requiera credenciales.
- Mantener `.dockerignore` en la raíz del contexto de build y comprobar que excluya, según corresponda:
  - `.git`
  - `node_modules`
  - `.turbo`
  - artefactos locales de build
  - `.env` y variantes locales
  - archivos de credenciales
  - logs, cachés y archivos temporales
- No excluir manifiestos, lockfiles ni paquetes internos necesarios para compilar.
- No agregar capacidades privilegiadas, montar el socket de Docker ni usar `privileged: true` sin una necesidad excepcional justificada.
- Evitar copiar herramientas de compilación, shells o paquetes innecesarios al runtime.
- Elegir una imagen base oficial y mantenida. Comparar variantes compatibles con las dependencias nativas; no elegir Alpine automáticamente.
- Fijar una versión concreta de la imagen base y documentar cómo mantenerla actualizada. Evaluar digest por entorno cuando corresponda.
- No afirmar que una imagen es segura únicamente porque es pequeña o usa una imagen slim.

## 5. Dependencias nativas

La API usa `argon2`, que puede depender de binarios nativos.

- Comprobar la compatibilidad entre la arquitectura, libc y los binarios instalados durante el build y el runtime.
- Mantener compatibles las etapas de build y runtime.
- No compilar módulos nativos en una distribución y ejecutarlos en otra incompatible.
- Verificar que el runtime pueda importar y utilizar `argon2`.
- No instalar compiladores en la imagen final salvo justificación técnica demostrable.

## 6. Runtime de NestJS

- Ejecutar la aplicación compilada mediante el script de producción o un comando equivalente verificado.
- No usar `nest start --watch` en producción.
- Configurar correctamente el puerto y la interfaz de escucha para el entorno del contenedor.
- Mantener las variables de entorno fuera de la imagen.
- Validar la configuración requerida al iniciar, respetando la implementación existente.
- Asegurar que el proceso Node.js reciba las señales de terminación del contenedor.
- Preferir un proceso principal directo, sin un shell intermedio innecesario. Evaluar `exec` o `init` cuando la arquitectura lo requiera.
- Implementar apagado ordenado para solicitudes HTTP y recursos abiertos cuando corresponda.
- No ejecutar migraciones de base de datos automáticamente al arrancar cada réplica sin analizar concurrencia e idempotencia.
- No incluir PostgreSQL dentro de la imagen de la API.

## 7. Healthchecks y dependencias externas

- Revisar si la API ya expone un endpoint de salud adecuado.
- Usar ese endpoint para el healthcheck si existe y está disponible en runtime.
- No agregar un endpoint ni una dependencia de diagnóstico sin evaluar el diseño actual.
- No asumir que `curl` o `wget` existen en la imagen final.
- Si se necesita un healthcheck, preferir una solución compatible con la imagen elegida y evitar instalar herramientas innecesarias.
- Distinguir disponibilidad del proceso, salud HTTP y disponibilidad de dependencias externas.
- No presentar una conexión exitosa a PostgreSQL como garantizada por el mero hecho de que el contenedor esté iniciado.

## 8. Docker Compose

Antes de cambiar `docker-compose.yml`:

1. Identificar los servicios actuales y sus dependencias.
2. Preservar los puertos, volúmenes, redes y variables que sigan siendo necesarios.
3. Diferenciar claramente el uso local del despliegue de producción.
4. No reemplazar configuraciones existentes sin explicar el impacto.
5. Usar nombres de servicios como hostname dentro de la red Compose, no `localhost`, para comunicarse entre contenedores.
6. No publicar PostgreSQL externamente por defecto si solo lo necesita la red interna.
7. Evitar exponer la API a interfaces públicas innecesariamente.
8. Usar `healthcheck` y condiciones de disponibilidad cuando correspondan, sin confundirlas con una garantía de recuperación.
9. Evitar montar el código fuente o `node_modules` del host en el contenedor de producción.
10. No almacenar secretos en el YAML ni en archivos versionados.
11. No ejecutar comandos destructivos como `docker compose down -v` sin autorización explícita.

Si existen necesidades diferentes para desarrollo y producción, proponer archivos o perfiles separados sin duplicación innecesaria.

## 9. Persistencia y configuración

- La base de datos y la API son componentes independientes.
- Mantener credenciales, URLs y claves como configuración externa.
- Documentar los nombres y la finalidad de las variables requeridas, sin publicar sus valores.
- Mantener la conexión a PostgreSQL compatible con el entorno de ejecución.
- Considerar que R2 es un servicio externo y no necesita un volumen local para almacenar los objetos remotos.
- No introducir almacenamiento local para archivos de usuarios sin un requisito explícito.
- No guardar datos persistentes dentro de la capa escribible del contenedor.

## 10. Validación obligatoria

Después de implementar, realizar las comprobaciones aplicables:

1. Revisar el Dockerfile y el contexto de build.
2. Construir la imagen sin usar caché cuando sea necesario para validar reproducibilidad.
3. Confirmar que el build utiliza el lockfile y resuelve los paquetes internos.
4. Inspeccionar el usuario efectivo del runtime y los archivos incluidos.
5. Arrancar la imagen con configuración de prueba y sin exponer secretos.
6. Verificar que la API inicia y responde al endpoint de salud o a una comprobación HTTP equivalente.
7. Confirmar que la API puede cargar los módulos nativos necesarios, incluido `argon2`.
8. Verificar el comportamiento de terminación y los logs de errores.
9. Ejecutar lint, typecheck y tests relevantes desde el monorepo.
10. Probar el flujo con Docker Compose si se modificó.
11. Usar herramientas de escaneo de imagen disponibles y documentar los resultados; no afirmar que hubo escaneo si no se ejecutó.

No considerar exitosa una compilación si no se ha probado el arranque del contenedor.

Si PostgreSQL u otra dependencia externa no está disponible, distinguir entre el fallo de entorno y los fallos de la imagen. No inventar resultados.

## 11. Límites de actuación

- No modificar lógica de negocio para resolver un problema de empaquetado sin demostrar que es necesario.
- No cambiar contratos, esquemas ni migraciones como efecto colateral de dockerizar.
- No cambiar el entorno de despliegue ni agregar un registry sin autorización.
- No publicar imágenes ni desplegar servicios remotos sin autorización explícita.
- No agregar dependencias únicamente para facilitar un healthcheck si existe una alternativa adecuada.
- No debilitar la seguridad ni las pruebas para conseguir que la imagen arranque.
- No sobrescribir archivos Docker existentes sin inspeccionarlos y explicar los cambios.
- Si hay varias alternativas válidas, presentar ventajas, costos y riesgos antes de elegir una que afecte el despliegue.

## 12. Informe de cierre

Al finalizar, informar:

- Archivos creados y modificados.
- Estrategia de build y razón de su elección.
- Imagen base y versión de Node.js.
- Usuario de runtime.
- Variables de entorno necesarias, solo por nombre.
- Resultado de build, arranque, healthcheck y pruebas.
- Resultado del escaneo de imagen, si se ejecutó.
- Limitaciones y riesgos pendientes.
- Comandos exactos para reproducir la validación.

Clasificar el resultado como:
- **Aprobado:** validaciones relevantes completadas sin problemas conocidos.
- **Aprobado con observaciones:** existe una limitación documentada no bloqueante.
- **Bloqueado:** la imagen no compila, no arranca, presenta riesgos graves o faltan validaciones esenciales.

Nunca declarar validada una etapa que no se ejecutó realmente.
