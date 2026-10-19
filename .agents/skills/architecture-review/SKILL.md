---
name: architecture-review
description: Audita la arquitectura, calidad, seguridad y mantenibilidad de Nutrigon durante el diseño, implementación, modificación y cierre de funcionalidades. Utilizar en cambios de frontend React, backend NestJS, contratos compartidos, persistencia, infraestructura y dependencias entre módulos.
---

# Architecture Review — Nutrigon

## 1. Objetivo

Actuar como revisor arquitectónico durante todo el ciclo de desarrollo, no solamente al finalizar una tarea.

Detectar tempranamente:
- Violaciones de las responsabilidades de cada capa.
- Acoplamiento innecesario y dependencias circulares.
- Duplicación de lógica o contratos.
- Riesgos de seguridad, autorización y aislamiento entre sucursales.
- Falta de cobertura de pruebas.
- Degradaciones de accesibilidad, experiencia móvil y mantenibilidad.
- Cambios que contradigan decisiones arquitectónicas existentes.

La auditoría debe ser concreta, basada en el código real y proporcional al alcance de la tarea.

## 2. Contexto obligatorio antes de trabajar

Antes de implementar una funcionalidad o modificar código:

1. Leer las instrucciones aplicables de `AGENTS.md`.
2. Identificar los paquetes y módulos afectados.
3. Revisar las implementaciones existentes relacionadas con la tarea.
4. Consultar las skills específicas que correspondan.
5. Revisar contratos, pruebas y decisiones documentadas relevantes.
6. Identificar las restricciones de compatibilidad y los riesgos principales.

No proponer una arquitectura nueva sin comprobar primero si el repositorio ya resuelve ese problema.

No asumir que una dependencia, un script o una capacidad existe: verificarlo en los archivos del proyecto.

## 3. Auditoría durante la implementación

Revisar cada incremento coherente de cambios, antes de continuar con el siguiente.

### Arquitectura y dependencias

- Mantener responsabilidades claras entre presentación, lógica de aplicación, dominio y persistencia.
- Evitar dependencias circulares y accesos directos entre módulos que deberían comunicarse mediante contratos definidos.
- Reutilizar abstracciones existentes cuando sean adecuadas.
- Evitar capas, interfaces, factories o patrones que no aporten un beneficio concreto.
- No introducir dependencias nuevas ni refactorizaciones amplias sin justificar su necesidad.

### Contratos y tipos

- Definir y validar los contratos compartidos mediante Zod en `packages/contracts`, según las convenciones existentes.
- No introducir `class-validator`.
- Evitar duplicar esquemas, tipos y reglas de validación entre frontend y backend.
- No utilizar `any` sin una justificación técnica explícita.
- Tratar los datos externos como no confiables y validar las entradas en los límites correspondientes.

### Backend: NestJS

- Mantener el acceso a Drizzle dentro de los repositorios, respetando las convenciones existentes.
- Evitar consultas a la base de datos desde controllers o services cuando corresponda utilizar repositorios.
- Mantener los controllers enfocados en HTTP y delegar la lógica de negocio a las capas correspondientes.
- Aplicar TDD para lógica de negocio, autorización y validaciones críticas.
- Comprobar autenticación, autorización, permisos por rol y aislamiento por sucursal.
- No confiar en identificadores de sucursal enviados por el cliente sin verificar los permisos correspondientes.
- Revisar el manejo de errores, transacciones y consistencia de datos.
- Respetar las políticas de soft delete definidas para cada entidad; no aplicarlas indiscriminadamente a todas.
- No debilitar guards ni controles de acceso para hacer pasar una prueba.

### Frontend: React y TypeScript

- Respetar la estructura de features y los patrones de componentes existentes.
- Priorizar diseño mobile-first y layouts adaptables mediante flexbox y grid.
- Evitar dimensiones rígidas que provoquen desbordamiento en pantallas pequeñas.
- Mantener objetivos táctiles de al menos 44 px cuando corresponda.
- Garantizar etiquetas accesibles, estados de carga, errores y estados vacíos.
- Evitar duplicar reglas de negocio que deban ser responsabilidad del backend.
- Probar el comportamiento visible para el usuario y no solamente los detalles internos de implementación.

### Datos y persistencia

- Revisar integridad referencial, restricciones, índices y migraciones cuando sean pertinentes.
- Considerar concurrencia, duplicados y actualizaciones parciales.
- Verificar que las modificaciones sean compatibles con los datos existentes.
- No ejecutar migraciones destructivas ni operaciones irreversibles sin autorización explícita.
- Mantener las credenciales y los secretos fuera del código, los logs y los informes.

## 4. Estrategia de pruebas

Elegir las pruebas según el alcance de los cambios:

1. Pruebas unitarias para lógica de negocio.
2. Pruebas de integración para repositorios, persistencia y límites entre módulos.
3. Pruebas de componentes para el comportamiento de la interfaz.
4. Pruebas de autorización para roles, usuarios y sucursales.
5. Pruebas de regresión para comportamientos existentes afectados.

Aplicar el ciclo Red-Green-Refactor cuando corresponda.

No eliminar, desactivar, omitir ni debilitar pruebas únicamente para conseguir una ejecución exitosa.

No modificar las expectativas de una prueba sin comprobar que el comportamiento esperado realmente cambió por una decisión válida.

Cuando una prueba falla:
- Identificar el fallo concreto y su causa.
- Determinar si se debe al cambio actual, a un defecto previo o al entorno.
- Corregir la causa real cuando corresponda.
- Informar claramente cualquier fallo pendiente.

Distinguir entre una prueba ejecutada, una prueba aprobada y una prueba omitida o recuperada desde caché cuando esa información esté disponible.

## 5. Auditoría de cierre de cada funcionalidad

Antes de considerar terminada una funcionalidad:

1. Revisar todos los cambios realizados.
2. Buscar duplicación, complejidad innecesaria y violaciones de límites entre módulos.
3. Verificar contratos, validaciones, permisos y manejo de errores.
4. Confirmar la cobertura de los casos principales y de los casos límite relevantes.
5. Revisar accesibilidad y comportamiento responsive si hay cambios de interfaz.
6. Ejecutar los controles disponibles del paquete afectado.
7. Ejecutar la validación global:

   `pnpm turbo run lint typecheck test`

8. Revisar el resultado completo y diferenciar fallos nuevos de problemas preexistentes.
9. Informar riesgos pendientes y deuda técnica relevante.

No declarar la validación global exitosa si algún control obligatorio falla, no se ejecuta o no puede verificarse.

Si existe un fallo previo no relacionado, documentarlo por separado y no atribuirlo automáticamente al cambio actual.

## 6. Severidad de los hallazgos

Clasificar los hallazgos:

- **Crítico:** exposición de datos, bypass de autorización, pérdida o corrupción de información.
- **Alto:** incumplimiento arquitectónico importante, error funcional grave o regresión significativa.
- **Medio:** acoplamiento, duplicación, cobertura insuficiente o problema de mantenibilidad relevante.
- **Bajo:** mejora localizada de claridad, consistencia o estilo.

Para cada hallazgo indicar:
- Archivo o módulo afectado.
- Evidencia concreta.
- Consecuencia.
- Corrección recomendada.

No presentar preferencias estilísticas como defectos críticos.

## 7. Límites de actuación

- Respetar `AGENTS.md` y las skills especializadas existentes.
- No reescribir módulos completos para corregir problemas localizados.
- No agregar infraestructura, dependencias o abstracciones sin necesidad demostrable.
- No cambiar contratos públicos o esquemas de base de datos sin evaluar el impacto.
- No ocultar errores ni afirmar que se ejecutaron comandos que no se ejecutaron.
- No revelar secretos de archivos de credenciales, variables de entorno ni configuraciones locales.
- Si una decisión arquitectónica requiere una elección de producto o negocio, explicar las alternativas y solicitar confirmación antes de decidir.
- Priorizar correcciones pequeñas, verificables y compatibles con el diseño actual.

## 8. Formato del informe

Al terminar cada incremento relevante, presentar:

### Revisión arquitectónica
- Estado: aprobado, aprobado con observaciones o bloqueado.
- Módulos y límites arquitectónicos revisados.
- Hallazgos por severidad.
- Pruebas ejecutadas y resultados.
- Riesgos o decisiones pendientes.
- Próximo paso recomendado.

Al cerrar una funcionalidad, incluir también:
- Resumen de los cambios.
- Archivos principales modificados.
- Resultado de lint, typecheck y tests.
- Resultado de la validación global.
- Deuda técnica pendiente.

Ser conciso cuando no haya hallazgos. No inventar problemas para completar el informe.

## 9. Criterio de aceptación

Una funcionalidad está lista cuando:
- Cumple los requisitos definidos.
- Respeta las reglas arquitectónicas del repositorio.
- Incluye pruebas apropiadas.
- No introduce regresiones conocidas sin documentar.
- Supera los controles obligatorios o deja claramente documentada una limitación preexistente que impide confirmarlos.

La revisión arquitectónica complementa las pruebas y la revisión humana; no las reemplaza.