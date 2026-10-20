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
| `src/core/SimulationEngine.ts` | Orquestador del bucle principal, cámara, sub-stepping, compactación de entidades y telemetría. | Evitar `.filter()`, `.map()` o `.splice()` dentro de `update()` o `render()`. |
| `src/models/DNA.ts` | Genotipo inmutable por generación: 5 categorías (`GenomeTraits`), estadísticas (`GenomeStats`), *trade-offs* y mutación. | Cualquier nuevo stat cuantitativo debe integrarse en `recalculateDerivedCosts()` y `cloneWithMutation()`. |
| `src/models/Bacteria.ts` | Fenotipo y agente autónomo: esporulación, quimiotaxis, metabolismo, guerra química, predación y reproducción. | **Prohibido importar DOM o Canvas aquí.** Usar buffers estáticos preasignados para consultas espaciales. |
| `src/models/Nutrient.ts` | Partícula de sustrato mineral o detritus orgánico (`isOrganicCorpse`). | Puro estado de datos, sin métodos de renderizado. |
| `src/render/ProceduralRenderer.ts` | Traduce el estado de `Bacteria` y `Nutrient` a trazados de `CanvasRenderingContext2D`. | Respetar siempre el flag `lowDetail` (LOD) al añadir efectos visuales nuevos. |
| `src/main.ts` | Punto de entrada: conecta el diseñador de cepa, el lienzo de vista previa, los gestos táctiles/ratón y la gráfica Lotka-Volterra. | Mantener sincronizados los selectores con `index.html`. |

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
     * La representación visual en `src/render/ProceduralRenderer.ts`.
     * Los selectores del diseñador en `index.html` y `src/main.ts`.

---

## 4. Guía Rápida para Tareas Frecuentes

* **Ajustar el balance del juego (energía, daño, radios, tasas):**
  Edita únicamente `src/config/SimulationConfig.ts`.
* **Añadir una nueva variante a una categoría biológica:**
  1. Añade el literal al tipo correspondiente y al array de opciones de macro-mutación en `src/models/DNA.ts`.
  2. Implementa su efecto mecánico en `src/models/Bacteria.ts` y/o coste en `DNA.recalculateDerivedCosts()`.
  3. Dibuja su rasgo morfológico en `src/render/ProceduralRenderer.ts`.
  4. Añade la opción `<option>` en `index.html`.
* **Añadir nuevas cepas rivales o modos de escenario:**
  Revisa `SimulationEngine.initColonies()` en `src/core/SimulationEngine.ts`.

---

## 5. Comandos de Verificación

Antes de dar por finalizada cualquier modificación en el código, ejecuta siempre:

```bash
npm run build
```

Este comando ejecuta `tsc && vite build`, validando tanto el tipado estricto de TypeScript como el empaquetado de producción.
