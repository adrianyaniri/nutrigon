
# Propuesta inicial de infraestructura tecnológica

## Sistema de gestión y catálogo web para la dietética

**Versión:** 1.0 — Propuesta preliminar
**Fecha:** 12 de octubre de 2026

## 1. Objetivo

Implementar una solución web para administrar productos, precios, inventario y ventas de las tres sucursales, y ofrecer un catálogo comercial accesible desde celulares, computadoras y códigos QR.

La infraestructura se seleccionará priorizando el bajo costo inicial, la posibilidad de crecimiento y el control de los datos.

## 2. Infraestructura propuesta

### Alojamiento de la aplicación: Cloudflare Pages

Se utilizará para publicar la aplicación web y distribuir sus archivos.

- Plan inicial: gratuito.
- Permite alojar la aplicación React + Vite.
- Ofrece integración con GitHub para facilitar las publicaciones.
- El uso de funciones de servidor, si fueran necesarias, deberá evaluarse según sus cuotas y condiciones.

### Base de datos y autenticación: Supabase

Se utilizará PostgreSQL para guardar los productos, precios, existencias, movimientos de inventario, ventas y usuarios.

- Plan inicial: gratuito.
- Incluye una base de datos con una cuota de 500 MB por proyecto.
- Incluye cuotas gratuitas para almacenamiento, transferencia y usuarios activos.
- El plan gratuito puede pausar proyectos por inactividad y no ofrece todas las prestaciones operativas de los planes pagos.

Las cuotas y condiciones vigentes se verificarán antes del lanzamiento.

### Dominio web: NIC Argentina

Se recomienda registrar un dominio propio terminado en `.com.ar`, sujeto a disponibilidad.

La tarifa publicada por el portal oficial de aranceles consultado es de **ARS 8.500 por año** para `.com.ar`. Es un valor de referencia que debe confirmarse al momento de registrar o renovar el dominio.

El dominio se paga anualmente, no necesariamente mes a mes.

### Control de versiones: GitHub

Se utilizará para conservar el código fuente, registrar cambios y facilitar el mantenimiento.

Para el uso básico previsto se puede comenzar con un plan gratuito.

## 3. Presupuesto mínimo estimado

| Servicio                                           |                     Costo de referencia |
| -------------------------------------------------- | --------------------------------------: |
| Cloudflare Pages                                   |                               USD 0/mes |
| Supabase Free                                      |                               USD 0/mes |
| GitHub Free                                        |                               USD 0/mes |
| Dominio`.com.ar`                                 | ARS 8.500/año, según tarifa publicada |
| **Costo mensual de hosting y base de datos** |        **USD 0/mes inicialmente** |

El costo equivalente mensual del dominio dependerá de la tarifa vigente y del tipo de cambio utilizado para presupuestar. No se convierte a dólares en esta propuesta.

Referencias oficiales:

- Cloudflare Pages: https://pages.cloudflare.com/
- Supabase: https://supabase.com/pricing
- GitHub: https://github.com/pricing
- NIC Argentina: https://punto.gob.ar/es/dominios/aranceles

## 4. Qué cubre esta infraestructura

- Publicación de la aplicación web.
- Base de datos para la información del negocio.
- Autenticación de usuarios y almacenamiento de datos dentro de las cuotas contratadas.
- Gestión de catálogo, precios y existencias según el alcance aprobado.
- Acceso desde computadoras y teléfonos.
- Publicación de enlaces que podrán utilizarse en códigos QR.

## 5. Qué no incluye

Los siguientes conceptos no forman parte del costo de infraestructura:

- Desarrollo inicial del sistema.
- Diseño de pantallas y experiencia de usuario.
- Carga y limpieza de los archivos Excel.
- Mantenimiento, soporte técnico y nuevas funcionalidades.
- Integración con balanzas Cuora Neo.
- Compras, proveedores y caja/POS.
- Cobros integrados o facturación fiscal.
- WhatsApp Business API.
- Impuestos, servicios adicionales o consumos que excedan las cuotas gratuitas.

## 6. Consideraciones sobre el plan gratuito

La propuesta permite comenzar sin pagar una suscripción mensual de hosting y base de datos, pero los planes gratuitos tienen limitaciones.

Antes de utilizar el sistema como herramienta principal de operación, se deberá:

1. Verificar los límites actuales de los proveedores.
2. Configurar los permisos de acceso por usuario y sucursal.
3. Definir un procedimiento de copia de seguridad o exportación.
4. Probar la restauración de los datos.
5. Establecer quién administrará las cuentas y los accesos.
6. Evaluar si el uso real requiere contratar un plan pago.

El plan gratuito de Supabase puede pausar proyectos por inactividad. Por este motivo, esta propuesta debe considerarse una alternativa de bajo costo inicial, no una garantía de disponibilidad continua.

## 7. Posibles costos futuros

Si el volumen de uso aumenta o el negocio necesita mejores condiciones operativas, se evaluará un plan pago para la base de datos u otros servicios.

Cualquier cambio se presupuestará antes de contratarlo. No se incorporarán servicios pagos automáticamente.

## 8. Conclusión

Se propone iniciar con Cloudflare Pages, Supabase Free, GitHub Free y un dominio propio.

Esta combinación permite validar y poner en marcha la solución con un gasto recurrente inicial muy bajo. La contratación de planes pagos se evaluará según el uso real y las necesidades de continuidad del negocio.

Los importes y condiciones están sujetos a cambios de los proveedores. El desarrollo y el mantenimiento profesional se cotizarán por separado.
