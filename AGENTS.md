# AGENTS.md — Guía para Agentes de IA y LLMs

Este archivo proporciona el contexto arquitectónico, las reglas de negocio y las restricciones de rendimiento de **EvoLootIon** para cualquier agente de codificación o LLM que colabore en el repositorio.

---

## 1. Resumen del Proyecto

* **Propósito:** Simulador web de vida artificial y evolución bacteriana en 2D con renderizado vectorial procedural.
* **Stack Tecnológico:** TypeScript 5 (`strict: true`), Vite 5, HTML5 Canvas 2D nativo, CSS moderno con variables. Sin frameworks de UI ni motores externos en runtime.
* **Idioma del Proyecto:** Interfaz de usuario, comentarios de dominio y documentación en **español**; identificadores de código (clases, métodos, variables y tipos) en **inglés**.

---

## 2. Mapa de Módulos y Responsabilidades

| Archivo | Rol Principal | Restricciones Clave |
| :--- | :--- | :--- |
| `src/config/SimulationConfig.ts` | Única fuente de verdad (`SimConfig`) para constantes físicas, biológicas y de balance. | No meter lógica de estado aquí; exportar como `as const`. |
| `src/core/SpatialHashGrid.ts` | Partición espacial 2D genérica $O(1)$. | **Zero-GC estricto:** nunca usar `new Array` ni `Map.clear()` en cada frame; vaciar con `cell.length = 0`. |
| `src/core/SimulationEngine.ts` | Orquestador del bucle principal, cámara (incluyendo centrado y seguimiento automático de la bacteria seleccionada), sub-stepping, compactación de entidades y telemetría. | Evitar `.filter()`, `.map()` o `.splice()` dentro de `update()` o `render()`. |
| `src/models/DNA.ts` | Genotipo inmutable por generación: 5 categorías (`GenomeTraits`), estadísticas (`GenomeStats`), síntesis y validación/análisis de cadena codificante `5' → 3'` (`formatCodingStrand`, `parseCodingStrand`, `fromCodingStrand`, `getCodonSegments`), *trade-offs*, mutación, generación aleatoria de rivales (`createRandomRival`) y nomenclatura procedural (`generateProceduralName`). | Cualquier nuevo stat cuantitativo debe integrarse en `recalculateDerivedCosts()`, `cloneWithMutation()`, `formatCodingStrand()`, `parseCodingStrand()` y `generateProceduralName()`. |
| `src/models/Bacteria.ts` | Fenotipo y agente autónomo: esporulación, quimiotaxis, metabolismo, guerra química, predación, ciclo lítico por fagos y reproducción. | **Prohibido importar DOM o Canvas aquí.** Usar buffers estáticos preasignados para consultas espaciales. |
| `src/models/HostAgents.ts` | Agentes biológicos externos: `Bacteriophage` (virus lítico T4 con adsorción selectiva según pared celular) y `Neutrophil` (glóbulo blanco polimorfonuclear ameboide con quimiotaxis inmunitaria y fagosomas preasignados). | **Prohibido importar DOM o Canvas aquí.** Mantener buffers estáticos y slots de fagosomas preasignados (Zero-GC). |
| `src/models/Nutrient.ts` | Partícula de sustrato mineral o detritus orgánico (`isOrganicCorpse`). | Puro estado de datos, sin métodos de renderizado. |
| `src/render/ProceduralRenderer.ts` | Traduce el estado de `Bacteria`, `Nutrient`, `Bacteriophage` y `Neutrophil` a trazados de `CanvasRenderingContext2D` (incluyendo el visor de alta definición `renderMicroscopePreview`). | Respetar siempre el flag `lowDetail` (LOD) al añadir efectos visuales nuevos en `renderBacteria()`, `renderBacteriophage()` y `renderNeutrophil()`. |
| `src/i18n/i18n.ts` | Sistema de internacionalización extensible (`ES` / `EN`, ampliable mediante `registerLocale()`) y adaptación pedagógica por tramos de edad en bloques de 3 años (`5-7`, `8-10`, `11-14`, `15+`). | Mantener sincronizadas todas las claves de rasgos (`GenomeTraits`) y etiquetas de UI en cada `LocaleBundle`. |
| `src/main.ts` | Punto de entrada: gestiona el paso previo del Editor Genómico y Fenotípico (`#genomeEditorModal`), los selectores de idioma y de edad del científico (encima del nombre de la cepa), la barra compacta fija con miniatura de la cepa y consumo total de ATP al hacer scroll (`#miniStrainStickyBar`), el copiado al portapapeles de la cadena codificante (`#btnCopyDna`), la navegación por pestañas de categorías biológicas (mostrando una categoría abierta a la vez), los botones de selección de rasgos (`.trait-btn`), el bloque inferior a ancho completo de Condiciones de la Placa de Cultivo (incluyendo la verificación y adición de cepas rivales por cadena de ADN `#customRivalDnaInput` / `#customRivalsList`), el lienzo de microscopio electrónico, el HUD superior compacto (pausa `||`/`▶`, botón rotatorio de velocidad `#btnSpeed` `1x/2x/4x`, controles paso a paso `−/+` para comida/sustrato adaptado por edad y radio de luz, e icono de mirilla `#btnResetCam`), el inspector con barra de progreso de energía, los gestos táctiles/ratón y la gráfica Lotka-Volterra. | Mantener sincronizados los botones `data-trait`/`data-value`, pestañas `data-category-tab` y selectores `data-lang-btn`/`data-age-btn` con `index.html`. |
| `public/icons/` | Catálogo de iconos personalizados en resolución optimizada `128x128` para runtime (`public/icons/*.png`) y sus originales de alta resolución `512x512` (`public/icons/512/*.png`) con nombres semánticos en `kebab-case`. | En la interfaz se referencian siempre las versiones `128x128` (`icons/<nombre>.png`) en lugar de emojis genéricos. |
| `Dockerfile` / `docker-compose.yml` / `deploy.sh` | Empaquetado multietapa (`node:20-alpine` → `nginx:stable-alpine` en puerto `80`), despliegue en infraestructura de contenedores con proxy inverso **Traefik** (`traefik_proxy`, host `${EVOLOOTION_HOST_SUBDOMAIN}.${HOST_BASE}`) + etiquetas de dashboard (**Homepage**), y script interactivo de despliegue continuo por SSH (`EVOLOOTION_REMOTE_USER`, `EVOLOOTION_REMOTE_HOST`, `EVOLOOTION_REMOTE_PATH`, comprobando `${EVOLOOTION_REMOTE_PATH}/../.env`) desde la rama `main`. | Mantener el contenedor sin estado y sirviendo únicamente el bundle estático de `dist/`. |

---

## 3. Invariantes Críticas (Reglas que NO se deben romper)

1. **Desacoplamiento Modelo-Vista (Web Worker Readiness):**
   * Ningún archivo dentro de `src/models/` ni `src/core/SpatialHashGrid.ts` puede referenciar `window`, `document`, `HTMLCanvasElement` o `CanvasRenderingContext2D`.
2. **Disciplina Zero-GC en el Hot Path (60 FPS):**
   * En `Bacteria.update()`, `SpatialHashGrid.queryRadius()` y `SimulationEngine.update()` no se deben instanciar objetos ni arrays temporales por bacteria.
   * Si necesitas hacer una nueva consulta a `gridNutrients` o `gridBacteria`, pásale un buffer estático dedicado (nunca reutilices el mismo buffer en dos consultas anidadas simultáneas).
   * Para eliminar elementos muertos de `this.bacteria` o `this.nutrients`, mantén el patrón de compactación *in-place* con índice de escritura (`writeB`, `writeN`).
3. **Conservación de los Trade-offs Evolutivos (Principio de Pareto):**
   * Toda mejora evolutiva en una estadística (`maxSpeed`, `size`, `armor`, `toxinPower`) debe tener su contrapartida energética reflejada en `DNA.recalculateDerivedCosts()` o en el drenaje activo de `Bacteria.update()`.
   * Si `traits.motility === 'sessile'`, `maxSpeed` debe forzarse a `0`.
   * Si `traits.interaction === 'neutral'`, `toxinPower` debe forzarse a `0`.
4. **Coherencia de las 5 Categorías Biológicas:**
   * Las 5 categorías son: `metabolism`, `motility`, `wall`, `reproduction` e `interaction`. Cualquier cambio en sus tipos de unión en `src/models/DNA.ts` debe reflejarse en:
     * La lógica de comportamiento en `src/models/Bacteria.ts`.
     * La nomenclatura taxonómica procedural en `DNA.generateProceduralName()`.
     * La representación visual en `src/render/ProceduralRenderer.ts`.
     * Los selectores del diseñador en `index.html` y `src/main.ts`.
5. **Sincronización Obligatoria de la Documentación (`.md`):**
   * **Cada cambio que se realice en las características, mecánicas, fórmulas, controles o arquitectura del juego DEBE quedar reflejado inmediatamente en los archivos `.md` correspondientes** (`MECANICAS_JUEGO.md`, `ARQUITECTURA.md`, `DESARROLLO_Y_DESPLIEGUE.md` y/o este mismo `AGENTS.md`). Ninguna tarea funcional se considera terminada si la documentación queda desactualizada respecto al código.

---

## 4. Guía Rápida para Tareas Frecuentes

* **Ajustar el balance del juego (energía, daño, radios, tasas):**
  Edita únicamente `src/config/SimulationConfig.ts`.
* **Añadir una nueva variante a una categoría biológica:**
  1. Añade el literal al tipo correspondiente, a su mapa de codones (`*_CODONS`) y al array de opciones de macro-mutación en `src/models/DNA.ts`.
  2. Implementa su efecto mecánico en `src/models/Bacteria.ts` y/o coste en `DNA.recalculateDerivedCosts()`.
  3. Dibuja su rasgo morfológico en `src/render/ProceduralRenderer.ts` (`renderBacteria` y `renderMicroscopePreview`).
  4. Añade la tarjeta-botón `<button class="trait-btn" data-trait="..." data-value="...">` en `index.html`.
* **Añadir nuevas cepas rivales o modos de escenario:**
  Revisa `SimulationEngine.initColonies()` en `src/core/SimulationEngine.ts`.

---

## 5. Comandos de Verificación

Antes de dar por finalizada cualquier modificación en el código, ejecuta siempre:

```bash
npm run build
```

Este comando ejecuta `tsc && vite build`, validando tanto el tipado estricto de TypeScript como el empaquetado de producción.
