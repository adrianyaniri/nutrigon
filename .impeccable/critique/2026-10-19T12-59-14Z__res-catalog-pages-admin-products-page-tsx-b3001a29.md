---
target: admin/productos
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\admin-products-page.tsx"
target_fingerprint: "sha256:423e5b6a70c61a39bcc1a9f476bbc16292e55dd56fcc6651cee93f789bf29936"
target_path: "C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\admin-products-page.tsx"
timestamp: 2026-10-19T12-59-14Z
slug: res-catalog-pages-admin-products-page-tsx-b3001a29
---
# Design Review & Usability Critique: /admin/productos

**Method**: dual-agent (A: 69a3af24-6986-43c4-a203-e2a892e28178 · B: 38b68f70-d821-49ae-8054-a1aa4ae3e270)  
**Target**: `apps/web/src/features/catalog/pages/admin-products-page.tsx` (Route: `/admin/productos`)  
**Supporting Surfaces**: `branch-product-row.tsx`, `branch-offer-modal.tsx`, `admin-combos-page.tsx`, `combo-card.tsx`

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **3/4** | Tab counters y banner de feedback claros; falta spinner o feedback inline por fila al guardar precio. |
| 2 | **Match System / Real World** | **4/4** | Lenguaje auténtico de dietética argentina: referencia `$ / 100g`, Granel vs Unidad, etiquetas de sucursal. |
| 3 | **User Control and Freedom** | **3/4** | Filtros reseteables, modal con ESC y clic backdrop; falta botón inline para revertir borrador de precio. |
| 4 | **Consistency and Standards** | **4/4** | Touch targets $\ge 44$px (`min-h-[44px]`), convenciones de precios, modo auditoría consistente en productos y combos. |
| 5 | **Error Prevention** | **3/4** | Blindaje estricto de permisos para Admin General; validación $> \$0$; falta saneo de coma decimal argentina en inputs numéricos. |
| 6 | **Recognition Rather Than Recall** | **3/4** | Cálculo dinámico de 100g en fila y porcentaje de descuento en modal; no requiere cálculos manuales. |
| 7 | **Flexibility and Efficiency** | **3/4** | Guardado con `Enter` y búsqueda con debounce; falta actualización de precios por lote (inflación). |
| 8 | **Aesthetic and Minimalist Design** | **3/4** | Paleta oscura elegante (`bg-surface-card`) con acentos dorados; fila superior de chips densa en pantallas muy chicas. |
| 9 | **Help Users Recognize & Recover** | **3/4** | Mensajes descriptivos en banners y modales; el banner superior puede quedar fuera del scroll al editar filas inferiores. |
| 10 | **Help and Documentation** | **3/4** | Microcopy explicativo de modo auditoría y ofertas públicas; tooltips y aria-labels contextualizados en cada botón. |
| **Total** | | **32/40** | **Good (80%)** — Gran salto de calidad y madurez operativa tras la implementación del modo auditoría y a11y. |

---

## Design Specificity Verdict

**Veredicto**: Alta especificidad y fidelidad de dominio (9/10). No es una plantilla genérica de e-commerce.

- **Evaluación cualitativa (Assessment A)**:
  La vista refleja con autenticidad la operativa diaria de una dietética argentina: diferenciación nítida de productos a granel (`WEIGHT`) vs por unidad (`UNIT`), cálculo automático del valor equivalente por 100g (la unidad cognitiva de compra del cliente en mostrador), y separación estricta de responsabilidades entre el dueño/administrador general (modo auditoría de consulta) y el encargado de sucursal (gestión de precios y disponibilidad local).
- **Escaneo determinista (Assessment B)**:
  El detector estático arrojó **0 hallazgos (`[]`)**. La auditoría de código validó el 100% de cumplimiento en ergonomía táctil ($\ge 44\text{px}$ en botones e inputs), accesibilidad semántica (`aria-label` descriptivos con nombre del producto, dialog focus trap con escape y restauración de foco), contraste WCAG AAA en textos clave y omisión total de controles de mutación para `ADMIN_GENERAL`.

---

## Overall Impression

La interfaz alcanzó un nivel de madurez operativa y robustez técnica notable. Pasó de ser un formulario vulnerable a cambios accidentales entre sucursales a un sistema con **seguridad psicológica para ambos roles**: el Administrador General puede auditar sin riesgo de tocar precios de sucursales ajenas, y el Encargado de Sucursal dispone de controles accesibles, rápidos y adaptados al despacho fraccionado. Las oportunidades restantes se centran en la fluidez de edición masiva (inflación argentina) y la visibilidad de cambios en borrador.

---

## What's Working

1. **Blindaje de roles con Modo Auditoría**:
   El banner informativo para `ADMIN_GENERAL` y la sustitución de controles interactivos por precios formateados en dorado con etiqueta `"Solo Lectura"` resuelve de raíz el riesgo de conflicto operativo.
2. **Referencia de 100g para productos a granel**:
   Cálculo en vivo de `{formatPrice(Math.round(draft / 10))} / 100g` que replica el modelo mental del mostrador con balanzas INTI.
3. **Ergonomía táctil y accesibilidad completa**:
   Todos los botones e inputs cumplen la norma de 44x44px; el modal de ofertas cuenta con focus trap, scroll lock y cierre por Escape; y cada botón tiene un `aria-label` específico.

---

## Priority Issues (P0–P3)

### [P1] Falta de indicador visual de estado en borrador ("Dirty") y acción de revertir
- **Problema**: Al tipear un precio en el input, no hay un indicador que distinga visualmente un precio modificado pendiente de guardar respecto al precio guardado.
- **Impacto**: Si la encargada se distrae atendiendo a un cliente en mostrador, al volver no sabe qué filas tienen borradores sin guardar y qué filas ya impactaron.
- **Solución**: Resaltar el input con borde ámbar cuando `draftValue !== savedValue` y ofrecer un botón rápido de "Revertir" al valor anterior.
- **Comando sugerido**: `$impeccable harden`

### [P2] Banner de feedback fijo en la cabecera (fuera del viewport al scrollear)
- **Problema**: El banner de notificación (`feedbackBanner`) se renderiza al principio de la página (arriba de la tabla).
- **Impacto**: Al editar productos en las filas 10 a 20, el mensaje de guardado exitoso o de error ocurre fuera de la vista del usuario, generando incertidumbre.
- **Solución**: Convertir la notificación en un Toast flotante (`fixed bottom-4 right-4 z-50`) con animación de entrada y mostrar un checkmark inline temporal en el botón "Guardar" de la fila.
- **Comando sugerido**: `$impeccable layout`

### [P2] Fragilidad del input numérico con comas decimales argentinas
- **Problema**: El input utiliza `<input type="number">`.
- **Impacto**: En teclados y configuraciones regionales argentinas es común escribir comas (`15000,50`). HTML5 trata la coma como valor inválido en navegadores en inglés, limpiando el valor a vacío y disparando "Ingresá un precio válido".
- **Solución**: Utilizar `inputMode="decimal"` con saneamiento controlado en el handler que reemplace comas por puntos antes de parsear.
- **Comando sugerido**: `$impeccable harden`

### [P3] Ausencia de herramienta de ajuste porcentual por categoría
- **Problema**: Los precios solo pueden actualizarse producto por producto.
- **Impacto**: Frente a listas de proveedores con aumentos generales (ej. +15% en frutos secos), actualizar 40 productos individuales resulta tedioso y propenso a errores.
- **Solución**: Agregar una acción en la barra de herramientas al filtrar por categoría: "Aumentar categoría (+X%)" con modal de revisión previa.
- **Comando sugerido**: `$impeccable shape`

---

## Persona Red Flags

- **Guillermo (Dueño / Administrador General)**:
  - *Experiencia*: Recorre `/admin/productos` para auditar precios entre Origone y Centro.
  - *Estado*: Plena tranquilidad; el banner y el modo solo lectura le garantizan que no alterará precios por error.
  - *Alerta*: Al hacer scroll hacia abajo, pierde de vista el nombre de la sucursal activa. Convendría fijar la sucursal en un encabezado sticky.
- **Romina (Encargada de Sucursal Origone)**:
  - *Experiencia*: Carga precios de mercadería recién ingresada en la pestaña "Sin precio".
  - *Estado*: Flujo ágil con tecla `Enter` y cálculo de 100g.
  - *Alerta*: Si guarda un producto al fondo de la lista, no ve el toast de confirmación porque quedó arriba de la pantalla.
- **Riley (Tester de estrés y entradas accidentales)**:
  - *Experiencia*: Prueba valores $0, negativos, comas y clics repetidos.
  - *Estado*: Las validaciones bloquean $0 en activos y números negativos.
  - *Alerta*: Tipear comas decimales vacía el input numérico estándar de HTML5.

---

## Minor Observations

- La fila de chips superiores en `BranchProductRow` puede ocupar hasta 3 líneas en pantallas angostas (<375px) si un producto acumula Granel, Oferta, Destacado y Estado.
- Los badges de oferta y destacado tienen tamaño de fuente `text-[10px]`; subirlos a `text-[11px]` mejoraría la legibilidad sin sacrificar espacio.
- En el modal de ofertas, el indicador visual de arrastre (`w-12 h-1.5 rounded-full bg-zinc-600`) brinda una excelente sensación táctil de bottom-sheet en dispositivos móviles.

---

## Questions to Consider

1. *¿Sería útil mostrar la fecha de última actualización del precio en cada fila (ej. "Actualizado hace 3 días") para detectar productos con precios desactualizados?*
2. *¿Convendría tener un popover rápido que muestre la tabla de precios fraccionados (100g, 250g, 500g, 1kg) para que el personal de mostrador pueda responder dudas al cliente al instante?*
3. *¿Sumaría una barra flotante de guardado masivo cuando se detectan múltiples precios modificados sin guardar?*
