
# Especificación de requerimientos

## Sistema de gestión y catálogo web para una dietética

**Versión:** 0.3 — Borrador para validación
**Fecha:** 12 de octubre de 2026
**Estado:** Pendiente de validación con el cliente

## 1. Propósito

Definir los requerimientos iniciales de un sistema que permita administrar productos, precios, existencias y ventas de una dietética con tres sucursales, junto con un catálogo web comercial que facilite la preparación de pedidos mediante WhatsApp.

Este documento no es todavía una especificación contractual cerrada. Las decisiones pendientes deben validarse antes de estimar el alcance definitivo.

## 2. Contexto actual

- El negocio tiene tres sucursales.
- Actualmente utiliza archivos Excel separados por sucursal.
- Las ventas se registran manualmente.
- El inventario actual es aproximado y se verifica físicamente.
- Los precios pueden ser distintos en cada sucursal.
- Hay productos que se venden por unidad y otros por peso.
- Se desea ofrecer un catálogo web accesible desde enlaces y códigos QR.

## 3. Alcance inicial

El sistema contempla:

1. Catálogo maestro de productos.
2. Precios por producto y sucursal.
3. Inventario independiente por sucursal.
4. Registro administrativo de ventas.
5. Registro de movimientos y ajustes de inventario.
6. Usuarios y permisos.
7. Catálogo comercial web.
8. Carrito o preparación de pedido para continuar por WhatsApp.
9. QR para el catálogo general y para cada producto.
10. Consultas e informes básicos, sujetos a validación.

### 3.1. Fuera del alcance del MVP

- Integración o sincronización con balanzas Cuora Neo.
- Compras y proveedores.
- Caja o sistema POS.
- Cobros integrados, pasarelas de pago y conciliación de pagos.
- Facturación fiscal.
- WhatsApp Business API.
- Automatización de inventario mediante lectura directa de las balanzas.

## 4. Actores

**Administrador:** administra el catálogo, los precios, los usuarios y las operaciones autorizadas de las sucursales.

**Personal de sucursal:** registra ventas, consulta existencias y realiza movimientos de inventario dentro de sus permisos.

**Cliente web:** consulta productos y prepara un pedido para continuar la conversación por WhatsApp.

Los roles definitivos y los permisos exactos quedan pendientes de validación.

## 5. Requerimientos funcionales

### RF-01 — Gestión del catálogo maestro

**Prioridad:** Alta. **Estado:** Confirmado en alcance preliminar.

El sistema permitirá crear, consultar, editar y desactivar productos.

Cada producto tendrá, como mínimo, identificador interno, nombre y modalidad de venta. Se evaluarán código/SKU, categoría, descripción, imágenes y visibilidad en la web.

**Criterio de aceptación:** un usuario autorizado puede crear un producto y consultarlo en el catálogo administrativo.

### RF-02 — Importación de datos desde Excel

**Prioridad:** Alta. **Estado:** Pendiente de revisar los archivos.

Se deberá analizar la estructura de los archivos actuales y definir una importación inicial. El proceso identificará duplicados, datos obligatorios faltantes, precios inválidos y errores de formato.

**Criterio de aceptación:** antes de confirmar la importación, el sistema informa los registros que no puede procesar y el motivo.

### RF-03 — Precios por sucursal

**Prioridad:** Alta. **Estado:** Confirmado.

El sistema permitirá configurar precios independientes para un mismo producto en cada sucursal.

Deberá poder consultarse el precio vigente asociado a una sucursal. Se recomienda registrar los cambios de precio con fecha y usuario.

**Criterio de aceptación:** el mismo producto puede tener precios diferentes en dos sucursales sin duplicar el producto maestro.

### RF-04 — Inventario independiente

**Prioridad:** Alta. **Estado:** Confirmado.

El sistema mantendrá existencias separadas por producto y sucursal.

Permitirá registrar entradas, salidas y ajustes de inventario, con fecha, usuario, cantidad y motivo.

**Criterio de aceptación:** una modificación de stock en una sucursal no modifica automáticamente la existencia de las otras.

### RF-05 — Recuento físico

**Prioridad:** Alta. **Estado:** Propuesto; confirmar inclusión.

El usuario autorizado podrá comparar el stock registrado con el recuento físico y registrar el ajuste correspondiente, conservando la trazabilidad del cambio.

**Criterio de aceptación:** el ajuste deja constancia del valor previo, el resultado del recuento, la diferencia y el motivo.

### RF-06 — Registro administrativo de ventas

**Prioridad:** Alta. **Estado:** Confirmado, con reglas pendientes.

El sistema permitirá registrar una venta asociada a una sucursal, incluyendo sus productos, cantidades, precios aplicados y total.

Los productos por unidad utilizarán cantidades enteras. Los productos por peso admitirán cantidades fraccionarias conforme a la unidad y precisión que se acuerden.

Al confirmar una venta, el sistema registrará el movimiento de inventario correspondiente.

**Criterio de aceptación:** una venta confirmada queda registrada y genera el efecto de stock correspondiente una sola vez.

**Exclusión:** este módulo no reemplaza una caja fiscal, no procesa pagos ni emite comprobantes fiscales.

### RF-07 — Consulta de ventas

**Prioridad:** Media. **Estado:** Pendiente de definir detalle.

Se propone consultar ventas por fecha, sucursal y detalle de productos.

La inclusión de exportaciones Excel/CSV, filtros adicionales y reportes de rentabilidad requiere confirmación.

### RF-08 — Catálogo web público

**Prioridad:** Alta. **Estado:** Confirmado como objetivo.

La web permitirá consultar productos, categorías y detalles comerciales. Se propone incorporar búsqueda y una interfaz adaptable a teléfonos y computadoras.

**Criterio de aceptación:** el cliente puede encontrar un producto y acceder a su información desde un navegador móvil.

### RF-09 — Selección de sucursal y precio público

**Prioridad:** Alta. **Estado:** Pendiente.

Debe definirse si el cliente selecciona una sucursal antes de consultar precios y preparar el pedido, o si existe otro flujo.

No se debe mostrar como universal un precio que cambia por sucursal.

### RF-10 — Carrito y continuidad por WhatsApp

**Prioridad:** Alta. **Estado:** Confirmado como objetivo; flujo pendiente.

El cliente podrá seleccionar productos y cantidades y generar un mensaje con el detalle para abrir WhatsApp.

Debe definirse qué sucursal recibe el pedido y si el mensaje muestra precios y total.

Un pedido enviado por WhatsApp no se considerará automáticamente una venta confirmada.

### RF-11 — Códigos QR

**Prioridad:** Media. **Estado:** Confirmado.

Se habilitarán enlaces para un QR general del catálogo y enlaces individuales por producto.

La impresión de etiquetas o materiales físicos se cotizará por separado si se solicita.

### RF-12 — Usuarios y control de acceso

**Prioridad:** Alta. **Estado:** Requerimiento necesario; roles pendientes.

El sistema administrativo requerirá autenticación y permisos por rol y sucursal.

**Criterio de aceptación:** un usuario no puede ejecutar operaciones ni consultar datos fuera de los permisos asignados.

### RF-13 — Auditoría de operaciones

**Prioridad:** Alta. **Estado:** Propuesto.

Se recomienda conservar usuario, fecha, operación y datos relevantes para cambios de precio, movimientos de stock, ventas, anulaciones y correcciones.

La retención y el detalle exacto de la auditoría deben definirse.

### RF-14 — Transferencias entre sucursales

**Prioridad:** Media. **Estado:** Pendiente.

Si el negocio transfiere productos entre sucursales, se podrá implementar un movimiento relacionado de salida y entrada. No se incluirá en el MVP hasta confirmar la necesidad.

## 6. Requerimientos no funcionales

### RNF-01 — Seguridad

El sistema administrativo requerirá autenticación. Las claves privilegiadas nunca se expondrán en el navegador. Las operaciones se protegerán mediante controles en servidor y políticas RLS en la base de datos, según corresponda.

### RNF-02 — Separación por sucursal

Los usuarios accederán únicamente a los datos y operaciones autorizados para sus sucursales. Las restricciones se comprobarán también en la base de datos, no solamente en la interfaz.

### RNF-03 — Integridad de datos

La confirmación de una venta y sus movimientos de stock deben ser consistentes. Se evitarán ventas duplicadas o descuentos de stock repetidos por reintentos.

### RNF-04 — Trazabilidad

Las operaciones relevantes conservarán la información necesaria para investigar diferencias de inventario y corregir errores de manera controlada.

### RNF-05 — Usabilidad

Las pantallas tendrán etiquetas comprensibles, formularios validados, mensajes de error útiles y flujos adecuados para usuarios con distintos niveles de experiencia técnica.

### RNF-06 — Diseño adaptable

La web comercial y las pantallas administrativas principales deberán funcionar en celulares, tabletas y computadoras.

### RNF-07 — Rendimiento

La aplicación deberá responder adecuadamente para el volumen inicial de productos y usuarios. Los objetivos cuantitativos se establecerán después de relevar los datos reales.

### RNF-08 — Disponibilidad

La disponibilidad dependerá del hosting, el plan contratado y sus condiciones. Los planes gratuitos pueden tener límites o pausas y no deben presentarse como equivalentes a un servicio con SLA.

### RNF-09 — Copias de seguridad y recuperación

Se definirá una política de copias de seguridad o exportación de datos. Antes del uso operativo se probará la recuperación de una copia.

### RNF-10 — Mantenibilidad

El código estará organizado por módulos, usará TypeScript y Git, y contará con instrucciones de ejecución, despliegue y migración de base de datos.

### RNF-11 — Compatibilidad

Se probará el sistema en versiones recientes de navegadores de uso común.

### RNF-12 — Privacidad

Se recopilarán solo los datos personales necesarios. El mensaje enviado a WhatsApp incluirá únicamente la información necesaria para tramitar el pedido.

### RNF-13 — Gestión de errores

Las fallas relevantes deberán poder diagnosticarse sin exponer contraseñas, claves privadas ni información sensible.

## 7. Modelo de datos conceptual

- **Branch:** sucursales.
- **Product:** datos maestros de cada producto.
- **Category:** clasificación de productos.
- **BranchPrice:** precio del producto por sucursal.
- **Inventory:** existencia por producto y sucursal.
- **InventoryMovement:** entradas, salidas, ajustes y otros movimientos autorizados.
- **Sale:** cabecera de una venta.
- **SaleItem:** detalle de productos, cantidades y precios aplicados.
- **User/Profile:** identidad y datos del usuario.
- **Role / UserBranch:** permisos y asignación de sucursales.
- **WebOrder:** entidad opcional si se decide guardar y administrar los pedidos web dentro del sistema.

El esquema definitivo se diseñará luego de validar las reglas comerciales y revisar los Excel.

## 8. Decisiones pendientes para la reunión

1. **Pedidos:** ¿el cliente selecciona sucursal y contacta su WhatsApp, o recibe los pedidos una administración central?
2. **Peso:** ¿qué unidad y precisión decimal se utilizarán para los productos vendidos por peso?
3. **Disponibilidad web:** ¿se muestra stock, disponibilidad aproximada o se confirma por WhatsApp?
4. **Excel:** ¿qué estructura tienen los archivos y cómo se resolverán productos duplicados o equivalentes?
5. **Correcciones:** ¿quién puede anular una venta y cómo se revierte el stock?
6. **Reportes:** ¿qué informes, filtros y exportaciones necesita el cliente?
7. **Transferencias:** ¿se necesita registrar el movimiento de mercadería entre sucursales?
8. **Usuarios:** ¿cuántos usuarios habrá y qué permisos necesita cada uno?
9. **Catálogo:** ¿qué información se publica y qué importancia tiene el posicionamiento en Google?
10. **Responsabilidad operativa:** ¿quién será titular de las cuentas, quién administrará los accesos y quién supervisará los backups?

## 9. Riesgos y supuestos

- El stock depende de que el personal registre correctamente ventas y movimientos.
- No existe integración automática con las balanzas en el alcance inicial.
- Un pedido de WhatsApp no equivale a una venta confirmada.
- La migración de Excel no puede estimarse con precisión hasta revisar los archivos.
- Los costos y condiciones de los proveedores deberán verificarse antes del despliegue.

## 10. Condición de aprobación

La especificación quedará lista para estimar e implementar cuando el cliente valide el flujo de pedidos, las reglas de peso, las reglas de inventario, los permisos y el alcance de reportes, y se hayan revisado los Excel existentes.
