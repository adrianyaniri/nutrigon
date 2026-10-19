---
target_identity: "file:C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\admin-products-page.tsx"
target_fingerprint: "sha256:9d48cedd350346e2200c8d64e04ac9ed448f23c632d2ef62e667dcf8f859d01b"
target_path: "C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\admin-products-page.tsx"
timestamp: 2026-10-19T12-26-53Z
slug: res-catalog-pages-admin-products-page-tsx-b3001a29
---
# Impeccable Design Critique: Gestión de Precios y Ofertas por Sucursal (/admin/productos)

> **Target:** `apps/web/src/features/catalog/pages/admin-products-page.tsx`  
> **Supporting Surfaces:** `branch-product-row.tsx`, `branch-offer-modal.tsx`, `admin-header.tsx`, `admin-combos-page.tsx`  
> **Domain:** Nutrigon — Sistema de Gestión y Catálogo de Dietética (Granel en gramos, balanzas INTI, sucursales segregadas)  
> **Constraint Clave:** Los administradores generales no pueden cambiar el precio de las sucursales ni armar combos/packs.

---

### Design Health Score: 20/40 (Aceptable · 50%)

| # | Heurística de Nielsen | Puntaje | Hallazgo Clave |
|---|:---|:---:|:---|
| 1 | **Visibility of System Status** | **2/4** | Los contadores de pestañas (`Activos`, `En oferta`, `Pausados`, `Sin precio`) son reactivos, pero el feedback de guardado es un banner flotante al tope del viewport que se pierde si el usuario está scrolleando en la fila 15. |
| 2 | **Match System / Real World** | **2/4** | El negocio de dietética fracciona frutos secos y harinas en 100g/250g. La UI solo permite tipear precio por kilo sin mostrar la equivalencia por 100g, propiciando errores de magnitud (ej. tipear $1.800 en lugar de $18.000). |
| 3 | **User Control & Freedom** | **2/4** | Modificar un input de precio no tiene botón de "Deshacer" o revertir. No existe un modo explícito de "Solo Lectura" para Administradores Generales que deseen auditar sin riesgo de alterar valores. |
| 4 | **Consistency & Standards** | **2/4** | **Acoplamiento peligroso**: tocar "Pausar/Activar" ejecuta `onSavePrice(item, !item.isAvailable)` guardando el valor sucio o incompleto que esté tipeado en el input. Controles con altura de 40px (`h-10`) incumplen la regla de 44px táctil de `AGENTS.md`. |
| 5 | **Error Prevention** | **1/4** | **Falla crítica (P0)**: La UI no bloquea a `ADMIN_GENERAL` en `/admin/productos` ni en `/admin/combos`. Además, presionar `Enter` en el input guarda de inmediato sin alertas ante variaciones abruptas de precio (ej: 10x). |
| 6 | **Recognition Rather Than Recall** | **2/4** | El modal de oferta calcula el porcentaje de descuento en vivo, pero las filas no muestran el costo base, la fecha de última actualización ni los precios de referencia de otras sucursales. Lectores de pantalla reciben nombres genéricos repetidos ("Guardar precio", "Oferta"). |
| 7 | **Flexibility & Efficiency** | **2/4** | En una economía inflacionaria con listas de proveedores que aumentan por rubro (+15%), no existe ajuste masivo por categoría. Se obliga a editar 400 productos uno por uno. |
| 8 | **Aesthetic & Minimalist Design** | **3/4** | Estética oscura sobria, excelente contraste tipográfico sobre carbón (`#1a1c20`), badges semánticos claros y miniaturas nítidas. La densidad de 5 controles interactivos por fila compite visualmente. |
| 9 | **Error Recovery** | **2/4** | Mensajes de error claros en español, pero el banner superior desaparece automáticamente a los 3.5 segundos sin persistencia, y los inputs con error no marcan borde rojo ni `aria-invalid`. |
| 10 | **Help & Documentation** | **2/4** | Buenos tooltips explicativos en botones deshabilitados, pero carece de referencias sobre las políticas de precios entre sucursales o advertencias sobre el alcance del rol. |
| | **TOTAL** | **20/40** | **Base visual sólida con fallas operativas severas de control de acceso (RBAC) y prevención de errores.** |

---

### Specificity Verdict: *Domain Coating over Generic Table Mechanics*
Nutrigon presenta un revestimiento visual con vocabulario de dietética (`Granel · Precio por 1 kg`, `Venta por unidad`), pero opera como un CRUD genérico de filas individuales. Carece de la sensibilidad operativa del mostrador: no desglosa precios a fracciones de 100g/250g para granel, no ofrece herramientas de remarcación porcentual ante inflación y, fundamentalmente, **ignora la regla de negocio de segregación de roles**, otorgándole al Administrador General controles de escritura y creación de combos que pertenecen exclusivamente a los encargados de sucursal.

---

### Strengths
1. **Modal de Ofertas Proporcional y Guiado (`BranchOfferModal`)**:
   Implementa un modal con focus trap, cierre por `Escape`, cálculo dinámico de descuento porcentual (`-20%`) y validación estricta que impide precios promocionales mayores o iguales al precio regular.
2. **Pestañas de Estado con Contadores Vivos**:
   La cabecera de segmentación (`Todos`, `Activos en tienda`, `En oferta`, `Pausados`, `Sin precio`) permite a los encargados diagnosticar de un vistazo el catálogo local y detectar productos sin precio con feedback de recuento en tiempo real.
3. **Jerarquía Visual y Paleta Nutrigon**:
   El contraste de dorados (`#f5b731`) y esmeraldas sobre fondo carbón mantiene ratios de contraste que superan holgadamente WCAG AA (promedios entre 6.6:1 y 17:1), con tipografía legible y estados activos bien diferenciados.

---

### Priority Issues (P0–P3)

#### [P0] Brecha de Control de Acceso (RBAC): Administrador General Habilitado para Modificar Precios y Crear Combos
- **Qué:** En `/admin/productos`, `branch-product-row.tsx` muestra inputs de precio, botones "Guardar", "Destacar", "Oferta" y "Pausar/Activar" plenamente interactivos para cualquier usuario logueado, incluido `Role.ADMIN_GENERAL`. Del mismo modo, en `/admin/combos`, el botón `+ Nuevo Combo` y las acciones de edición/borrado están abiertas al Administrador General.
- **Por qué importa:** Viola la regla central de negocio: *"los administradores generales no pueden cambiar el precio de los productos de las sucursales ni tampoco puede armar combos y packs"*. Un dueño auditando sucursales puede alterar involuntariamente precios locales o crear combos no homologados por la sucursal, quebrando la autonomía operativa.
- **Solución:**
  1. En `AdminProductsPage`, si `isGeneralAdmin === true`, activar un **Modo Auditoría / Solo Lectura**: mostrar un banner informativo (`"Modo Auditoría: los precios y ofertas son administrados exclusivamente por cada sucursal"`).
  2. En `BranchProductRow`, para `ADMIN_GENERAL`, renderizar el precio como texto formateado estático (`formatPrice(item.price)`), ocultar o deshabilitar el botón "Guardar" y los botones de mutación ("Oferta", "Destacar", "Pausar").
  3. En `AdminCombosPage`, ocultar el botón `+ Nuevo Combo` y las acciones de edición para `ADMIN_GENERAL`.
- **Comando sugerido:** `$impeccable harden apps/web/src/features/catalog/pages/admin-products-page.tsx`

#### [P1] Acoplamiento Peligroso: "Pausar/Activar" Guarda el Texto Borrador del Input de Precio
- **Qué:** En `branch-product-row.tsx:199`, el botón de pausar o activar llama a `onSavePrice(item, !item.isAvailable)`. Esto lee el valor actual de `draftPrices[item.productId]`. Si el usuario estaba escribiendo un precio o dejó un valor a medio editar, al tocar "Pausar" ese precio sucio se guarda y se persiste en base de datos.
- **Por qué importa:** Provoca sobrescrituras accidentales de precios con valores corruptos o no deseados durante una operación rutinaria de cambio de estado.
- **Solución:** Desacoplar la mutación de disponibilidad (`isAvailable`) de la mutación de precio. Crear un handler específico `onToggleAvailability(item)` que únicamente altere el flag de activación sin tocar el precio.
- **Comando sugerido:** `$impeccable harden apps/web/src/features/catalog/components/branch-product-row.tsx`

#### [P1] Riesgo de Error de Magnitud (10x) en Granel por Ausencia de Fracciones de 100g
- **Qué:** Los productos a granel (`WEIGHT`) exigen tipear el precio por 1 kg en un campo numérico plano (ej: `18000`). No hay visualización de la fracción por 100g (`$1.800 / 100g`) ni separadores de miles de moneda argentina.
- **Por qué importa:** En el día a día de la dietética, la lista de precios de proveedores o el cálculo mental se hace comúnmente por 100g o 250g. Tipear $1.800 creyendo que es por kilo o viceversa causa pérdidas inmediatas en mostrador.
- **Solución:** Mostrar un helper dinámico debajo del input de peso: `100g: $1.800 · 250g: $4.500`, con formateo numérico con separador de miles.
- **Comando sugerido:** `$impeccable clarify apps/web/src/features/catalog/components/branch-product-row.tsx`

#### [P1] Incumplimiento de Áreas Táctiles Mínimas (44px) y Nombres Accesibles Genéricos
- **Qué:** En `branch-product-row.tsx`, el input y los botones usan `h-10` o `size-10` (40px de altura), incumpliendo el estándar de 44x44px definido en `AGENTS.md` y WCAG. Además, los botones de acción repiten `aria-label="Guardar precio"` o `"Oferta"` de forma idéntica en las 20 filas sin especificar el producto. El botón de cerrar notificación en `admin-products-page.tsx:424` mide solo 24x24px.
- **Por qué importa:** En tablets de mostrador o celulares los botones de 40px provocan toques erróneos. Para usuarios con lector de pantalla, la navegación por botones se vuelve una lista incomprensible de 20 botones llamados "Guardar precio".
- **Solución:** Escalar controles a `min-h-[44px]` y parametrizar los labels: `aria-label={`Guardar precio de ${item.name}`}`.
- **Comando sugerido:** `$impeccable audit apps/web/src/features/catalog/components/branch-product-row.tsx`

#### [P2] Feedback Fuera de la Vista y Falta de Estado "Dirty" / Deshacer
- **Qué:** El banner de confirmación es un toast fijo en la parte superior de la página; un encargado editando la fila 18 no ve si se guardó. Al alterar un input no hay botón de "Deshacer" para restaurar el precio original.
- **Por qué importa:** Genera incertidumbre ("¿se guardó?") y obliga a refrescar la página si se cometió un error al tipear antes de guardar.
- **Solución:** Agregar indicador inline en el botón Guardar (icono de tilde o spinner) y un botón discreto de reset si el input tiene cambios sin guardar.
- **Comando sugerido:** `$impeccable polish apps/web/src/features/catalog/components/branch-product-row.tsx`

#### [P3] Ausencia de Remarcación Masiva por Categoría ante Inflación
- **Qué:** Ante aumentos de proveedores por rubro (+15% en frutos secos), el encargado debe recalcular y tipear producto por producto.
- **Por qué importa:** Consumo excesivo de tiempo operativo y alto riesgo de discrepancias entre ítems de una misma familia.
- **Solución:** Incorporar una acción masiva: *"Aumentar categoría seleccionada en X%"* con previsualización antes de aplicar.
- **Comando sugerido:** `$impeccable shape apps/web/src/features/catalog/pages/admin-products-page.tsx`

---

### Persona Red Flags

1. **Guillermo (Dueño / Administrador General):**
   - *Falla:* Entra a `/admin/productos` para comparar precios entre Origone y William Morris. Al ver los campos de precio editables y el botón "Guardar", intenta corregir un precio o toca sin querer un botón y sobreescribe la lista de la sucursal. En `/admin/combos`, ve el botón `+ Nuevo Combo`, lo crea y descoordina el inventario físico del local.
2. **Romina (Encargada de Sucursal Origone):**
   - *Falla:* Recibe la nueva lista del mayorista con precio de nueces a `$1.950 los 100g`. Tipea apurada en el input de kilo `1950` en lugar de `19500`. El sistema no le muestra el valor por 100g ni le advierte que el precio cayó un 90%. Al pausar un producto que tenía un borrador tipeado, el sistema guarda automáticamente ese número erróneo.
3. **Riley (Tester de Estrés y Accesibilidad):**
   - *Falla:* Navega con lector de pantalla NVDA y escucha "Guardar precio", "Oferta", "Destacar" 20 veces seguidas sin saber a qué producto corresponde cada uno. En pantalla táctil pequeña, intenta tocar "Destacar" y le pega a "Oferta" porque los botones tienen 40px de área táctil.

---

### Minor Observations
- En `branch-product-row.tsx:118`, `step="10"` no coincide con los redondeos comerciales habituales de dietética (múltiplos de $50 o $100).
- El botón de "Destacar" (estrella) deshabilitado tiene tooltip en desktop, pero en tablet/móvil no hay evento hover para saber por qué está bloqueado.
- La paginación inferior solo tiene botones "Anterior" y "Siguiente"; no permite saltar a una página específica.

---

### Questions to Consider
1. *¿Debería la vista de Administrador General transformarse en una grilla comparativa multicursal de solo lectura (Origone vs Pedro Díaz vs Morris) en lugar de una pantalla de edición individual por sucursal?*
2. *¿Por qué no desacoplar de forma inmediata el botón de Pausar/Activar para que sea un toggle de disponibilidad puro sin mutar el precio en borrador?*
3. *¿Sería conveniente que el input de kilo calcule en tiempo real una tarjeta de balanza con precios para 100g, 250g y 500g antes de permitir el guardado?*
