---
target_identity: "file:C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\catalog-page.tsx"
target_fingerprint: "sha256:c655610a972f02261b5a82f7b7abbbc197f07db4cd3ce919379c15e514638a30"
target_path: "C:\\Users\\agyan\\Projects\\nutrigon\\apps\\web\\src\\features\\catalog\\pages\\catalog-page.tsx"
timestamp: 2026-10-17T20-30-43Z
slug: c-features-catalog-pages-catalog-page-tsx-b16870aa
---
# Impeccable Design Critique: Catálogo Público de Sucursal (/catalogo/:branchSlug)

> **Provenance:** dual-agent (A: `7d094bf7-491b-40b7-955d-f2fe887a1e27` · B: `fd3d26d2-894d-47aa-850a-654165b6a95a`)  
> **Target:** `apps/web/src/features/catalog/pages/catalog-page.tsx`  
> **Surface Scope:** `product-card.tsx`, `product-modal.tsx`, `product-grid.tsx`, `category-chips.tsx`, `branch-picker-modal.tsx`, `cart-drawer.tsx`

---

### Design Health Score: 28/40

| # | Nielsen Heuristic | Score | Key Finding |
|---|:---|:---:|:---|
| 1 | **Visibility of System Status** | **3/4** | El carrito flotante y el drawer reflejan cantidades al instante, pero el feedback visual en cards de peso confunde (muestra tilde verde cuando solo abre el modal). |
| 2 | **Match System / Real World** | **4/4** | Excepcional dominio del rubro dietética: fraccionamiento a granel, porciones de 100g/250g/500g, sellado hermético, balanzas INTI y formato directo a WhatsApp. |
| 3 | **User Control & Freedom** | **2/4** | "Vaciar carrito" purga todos los ítems con un solo clic sin confirmación previa. Cambiar de sucursal borra el pedido sin alertar el impacto al cliente. |
| 4 | **Consistency & Standards** | **2/4** | El botón `+` en cards de unidades agrega directo, pero en granel abre modal con un check verde engañoso. En cards, `<article role="button">` anida botones interactivos. |
| 5 | **Error Prevention** | **2/4** | No hay barreras defensivas contra vaciados accidentales. El checkout permite enviar pedidos de WhatsApp con datos incompletos si no se valida el formulario antes de presionar. |
| 6 | **Recognition Rather Than Recall** | **3/4** | Los chips de categorías y el resumen de ítems son claros, pero al navegar categorías profundas en móvil se pierde de vista el contexto de la sucursal activa. |
| 7 | **Flexibility & Efficiency** | **3/4** | La búsqueda en tiempo real y el ordenamiento funcionan muy bien, pero faltan filtros dietarios rápidos esenciales para dietéticas (Sin TACC, Vegano, Orgánico, Keto). |
| 8 | **Aesthetic & Minimalist Design** | **3/4** | Paleta cálida trigo/dorado sobre carbón muy bien lograda; sin embargo, en móvil la cabecera acumula 5 franjas apiladas que reducen drásticamente el viewport útil. |
| 9 | **Error Recovery** | **3/4** | Estados vacíos bien diseñados con sugerencias de categorías, aunque si el cliente vacía el carrito accidentalmente no existe un botón de "Deshacer". |
| 10 | **Help & Documentation** | **3/4** | Excelente contexto sobre balanzas INTI y peso exacto en modal; faltan aclaraciones sobre horarios de despacho y costos estimados de envío según la sucursal. |
| | **TOTAL** | **28/40** | **Sólida base de dominio con oportunidades críticas de control de usuario y contraste móvil.** |

---

### Specificity Verdict: *Tailored (Altamente Específico con Fricciones de Usabilidad)*
Nutrigon no se siente como un e-commerce genérico de Shopify o WooCommerce reempaquetado. La UI respira cultura de dietética y cerealera argentina: balanzas certificadas por INTI, fraccionamiento en gramos (100g, 250g, 500g, 1kg), sellado hermético y cierre ágil por WhatsApp. Sin embargo, sufre de inconsistencias en micro-interacciones (el botón `+` engañoso en productos a granel) y falta de defensas contra acciones destructivas accidentales.

---

### Strengths
1. **Modelado Impecable del Fraccionamiento a Granel (`ProductModal`)**:
   El selector de porciones no obliga a tipear decimales ni números abstractos; ofrece píldoras preconfiguradas (100g, 250g, 500g, 1kg) con cálculo de precio en tiempo real, desglose del valor por kilo y nota de confianza sobre pesado en balanza certificada.
2. **Generación y Mensajería de Pedido para WhatsApp (`CartDrawer`)**:
   La serialización del mensaje de WhatsApp está perfectamente estructurada: agrupa ítems con sus unidades/gramajes, calcula subtotales, incluye nombre/dirección y entrega un formato legible tanto para el cliente como para el encargado de mostrador.
3. **Lenguaje Visual Nutrigon (Trigo y Carbón)**:
   La combinación de ámbar/dorado (`#f5b731`) con superficies oscuras (`#121316`, `#1e222b`) transmite calidez artesanal y modernidad, despegándose del clásico verde genérico de dietética.

---

### Priority Issues

#### [P0] Acciones Destructivas Instantáneas sin Confirmación Previa ni Deshacer
- **Qué:** En `CartDrawer`, el botón *"Vaciar"* purga de un solo toque todo el pedido del cliente sin diálogo de confirmación ni opción de "Deshacer" (`toast` con undo). Del mismo modo, en `BranchPickerModal`, si el usuario cambia de sucursal teniendo productos cargados, el carrito se vacía automáticamente sin advertirle: *"Si cambiás de sucursal, se reiniciará tu carrito porque los precios y stock varían"*.
- **Por qué importa:** Un cliente que dedicó 10 minutos a seleccionar 15 productos a granel por gramos puede perder todo su pedido con un tap involuntario en móvil, generando abandono absoluto.
- **Solución concreta:** 
  1. Agregar confirmación inline o popover destructivo al tocar *"Vaciar"* (`"¿Vaciar tu pedido? [Cancelar] [Vaciar]"`).
  2. En `BranchPickerModal`, si `cartItemCount > 0`, mostrar un aviso bloqueante antes de cambiar de sucursal.
- **Comando sugerido:** `$impeccable polish` / `$impeccable clarify`

#### [P1] Ambigüedad de Feedback y CTA en Cards de Productos a Granel
- **Qué:** En `ProductCard`, los productos por unidad (`saleUnit === 'UNIT'`) se agregan directo al carrito. Pero para productos a granel (`WEIGHT`), el botón `+` ejecuta `onSelect`, abriendo el modal de porciones mientras el botón transiciona erróneamente a un check verde (`Check`) diciendo *"Agregado al pedido"*, cuando en realidad **aún no se agregó nada**. Además, la card muestra el precio por 1 kg (ej: `$18.000`), causando "sticker shock" en clientes que buscan comprar 100g o 250g.
- **Por qué importa:** Genera desconcierto: el usuario cree que ya compró o no entiende por qué se abrió un pop-up si el botón le dio feedback de éxito.
- **Solución concreta:**
  1. Para `WEIGHT`, el botón en la card debe ser explícito: botón o píldora con texto *"Elegir gramos"* o icono de balanza/ajuste en lugar de un `+` con feedback falso de checkmark.
  2. Mostrar en el precio de la card: `"$1.800 / 100g"` como referencia base accesible, aclarando *"($18.000 / kg)"*.
- **Comando sugerido:** `$impeccable clarify`

#### [P1] Falta de Dock Inferior Adherente ("Sticky Bottom Cart Dock") en Móvil
- **Qué:** Al navegar el catálogo en pantallas móviles (`< 768px`) scrolleando decenas de productos, el acceso al carrito queda confinado exclusivamente al icono diminuto en la esquina superior derecha del header.
- **Por qué importa:** El patrón estándar de e-commerce móvil requiere un botón o barra flotante fija al fondo de pantalla (`bottom dock`) con la cantidad de ítems y el subtotal actualizado, accesible de forma ergonómica con el pulgar.
- **Solución concreta:** Implementar un `StickyCartBar` inferior móvil que aparezca cuando `itemCount > 0`, con resumen: `"{count} productos · ${subtotal} — Ver Pedido"`.
- **Comando sugerido:** `$impeccable craft`

#### [P1] Fallas de Contraste en Temas y Filtros Activos (Evidencia Detector B)
- **Qué:** 
  1. En `category-chips.tsx:49`, el chip seleccionado usa `bg-brand-gold/15` con `text-white`. Si la app se visualiza en fondo claro, el ratio de contraste cae a ~1.1:1 (completamente ilegible).
  2. En `catalog-page.tsx:208`, el texto dorado `#f5b731` sobre fondos claros entrega solo ~1.86:1, fallando el mínimo de accesibilidad WCAG AA (4.5:1).
- **Por qué importa:** Los clientes que utilicen navegación con alto brillo o tema claro no pueden leer qué categoría tienen seleccionada.
- **Solución concreta:** Usar tokens semánticos adaptables (`text-foreground` o `text-brand-dark` cuando el chip está activo con fondo dorado) garantizando contraste >= 4.5:1 en cualquier modo.
- **Comando sugerido:** `$impeccable colorize`

#### [P2] Agrupamiento Semántico Interactivo en `ProductCard` (Evidencia Detector B)
- **Qué:** La card (`<article>`) posee `role="button"` y `tabIndex={0}` para abrir el modal, pero adentro anida un `<IconButton>` (`<button>`) para el botón de agregar.
- **Por qué importa:** Los botones anidados dentro de contenedores interactivos (`nested interactive elements`) violan especificaciones HTML5/WAI-ARIA y confunden la navegación por teclado y lectores de pantalla.
- **Solución concreta:** Convertir el título/imagen en enlaces/botones accesibles dedicados, o estructurar la card como contenedor estándar sin `role="button"` delegando el evento.
- **Comando sugerido:** `$impeccable polish`

#### [P2] Ausencia de Filtros Dietarios Rápidos ("Lentes de Afinidad")
- **Qué:** Actualmente solo se filtra por rubro (Frutos Secos, Harinas, Legumbres). No existen filtros transversales clave en una dietética: *Sin TACC / Celíacos*, *Vegano*, *Keto*, *Orgánico*.
- **Por qué importa:** El cliente con celiaquía o vegano no busca por legumbre: busca productos aptos para su salud de forma inmediata.
- **Solución concreta:** Incorporar píldoras de filtrado rápido por etiquetas dietarias (`dietaryTags`).
- **Comando sugerido:** `$impeccable shape`

---

### Persona Red Flags

1. **Marta (58 años, compradora presencial escaneando el QR en góndola):**
   - *Falla:* En el local con luz ambiental alta, escanea el QR con su celular y quiere ver el precio de las nueces mariposa. La card dice `$24.000 / kg` y se asusta ("¡Qué caro!"). Toca el botón `+` para llevar una bolsita y ve un check verde, pero le salta una ventana en medio de la pantalla con números en gramos. Se confunde creyendo que ya agregó un kilo entero y cancela por miedo.
2. **Lucas (28 años, meal-prepper comprando frutos secos y semillas):**
   - *Falla:* Seleccionó 12 productos a granel. Al ver que una sucursal no tenía stock de castañas de cajú, abre el selector de sucursal para consultar si en la otra sucursal hay. Al cambiar de sucursal, **su carrito de 12 ítems se borra a cero en silencio sin avisarle**.
3. **Agustina (compradora primeriza por delivery):**
   - *Falla:* Al scrollear 4 pantallas hacia abajo para encontrar condimentos en su teléfono, pierde de vista el carrito. No hay barra inferior que le diga cuánto va gastando ni cómo ir al checkout sin tener que scrollear todo de vuelta hacia arriba.

---

### Minor Observations
- En `CatalogHero`, el mensaje promocional ocupa demasiado espacio vertical en móvil antes de que el usuario vea el primer producto.
- En `SortSelect`, la opción *"Menor precio"* compara precio por kilo con precio por unidad indistintamente, lo cual puede distorsionar el ranking relativo.
- Cuando el pedido se despacha a WhatsApp (`window.open`), la pestaña de Nutrigon queda abierta con el carrito lleno exactamente igual que antes, sin mostrar una pantalla de confirmación: *"¡Pedido derivado a WhatsApp! Si no se abrió la app, hacé clic acá"*.

---

### Provocative Questions
1. **¿Y si en lugar de mostrar el precio por 1 kg en productos a granel, mostramos la porción cotidiana de 100g o 250g como precio protagonista?** En la cultura de dietética argentina nadie compra 1 kg de nueces de entrada; mostrar `$2.200 los 100g` reduce el sticker shock y conecta con la compra real de mostrador.
2. **¿Y si convertimos la barra inferior móvil en un resumen dinámico de compra ("Bolsa de compras") con botón táctil prominente?** Aumentaría la tasa de conversión en clientes que compran desde el celular tras escanear el QR.
3. **¿Y si al cambiar de sucursal ofrecemos mantener los productos recalculando los precios de la nueva sucursal en lugar de destruirlo todo?** Si el producto existe en ambas sucursales, solo se actualiza el precio local; si no hay stock, se marca con advertencia en vez de resetear el pedido a cero.

---

### Run Notes
- **Target slug:** `c-features-catalog-pages-catalog-page-tsx-b16870aa`
- **Ignore list:** Ninguna regla ignorada (`.impeccable/config.json` no tiene exclusiones activas).
- **Assessment independence:** Dual-agent completamente aislado (Evaluador A completó análisis heurístico y semántico antes de la síntesis; Evaluador B ejecutó CLI determinístico y análisis de código en paralelo).
- **CLI detector:** 0 hallazgos primarios y 0 advertencias sobre 122 archivos escaneados (modo regex estático limpio).
- **Browser visibility & overlay:** Dev server inactivo y sin canvas de navegador interactivo adjunto (`browser_mutation_unavailable_dev_server_offline`). Inyección omitida según protocolo de contingencia.
- **Limpieza de temporales:** Archivo de cuerpo de snapshot temporal preparado para registro en critique-storage.
