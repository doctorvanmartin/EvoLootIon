# Mecánicas del Juego y Modelo Biológico — EvoLootIon

**EvoLootIon** es un simulador de vida artificial y estrategia evolutiva microbiana en 2D. El jugador diseña el genoma inicial de una cepa bacteriana combinando rasgos cualitativos en **5 categorías biológicas** y ajustando atributos cuantitativos sujetos a restricciones físicas reales (ley alométrica de Kleiber y arrastre viscoso a bajo número de Reynolds).

Una vez inoculada en la placa de Petri, la cepa compite en tiempo real contra otras colonias por recursos, luz y espacio, evolucionando generación tras generación mediante mutaciones heredables.

---

## 1. Las 5 Categorías Biológicas

Cada organismo se define por cinco ejes funcionales almacenados en `DNA.traits`:

### 1.1. Metabolismo y Alimentación (`metabolism`)

Define cómo la bacteria obtiene energía ($E$) del entorno y determina la morfología del cuerpo celular (soma):

* **Fotosintética (`photosynthetic` — Morfología: Coco esférico):**
  * Genera energía pasiva en función de la irradiancia luminosa local $I(\mathbf{x})$ dentro de un **epicentro de luz acotado** (`LIGHT_SPOT_RADIUS = 260 px`) que aparece en una posición aleatoria y deriva suavemente por la placa (`LIGHT_DRIFT_SPEED = 14 px/s`). Fuera de dicho foco, la placa permanece en penumbra (`LIGHT_AMBIENT_MIN = 0.03`).
  * Sufre **auto-sombreado por densidad celular (Ley de Beer-Lambert)**: cuantas más bacterias se aglomeran alrededor, menor es la fracción de luz recibida, evitando superpoblaciones infinitas.
  * Sigue una cinética de saturación de Michaelis-Menten, presenta **fototaxis** (si es móvil, se orienta hacia el foco luminoso) y tiene muy baja eficiencia ($20\%$) asimilando partículas sólidas de sustrato.
* **Saprófita / Detritívora (`saprophyte` — Morfología: Bacilo cilíndrico):**
  * Se alimenta de sustrato libre y recibe una bonificación del $+55\%$ (`SAPROPHYTE_CORPSE_BONUS = 1.55`) al consumir detritus orgánico procedente de bacterias muertas.
* **Predadora / Fagocítica (`predator` — Morfología: Espirilo / Vibrio afilado):**
  * Ignora las partículas minerales y persigue activamente por quimiotaxis a bacterias vivas de otros linajes (que no estén esporuladas) para fagocitarlas por contacto, absorbiendo el $82\%$ (`PREDATION_EFFICIENCY`) del daño infligido como energía propia.
* **Fermentadora (`fermenter` — Morfología: Diplococo lobulado):**
  * Especialista en asimilación rápida: obtiene un $+45\%$ de energía (`FERMENTER_MULTIPLIER = 1.45`) de cualquier nutriente del medio.
* **Quimiolitótrofa (`chemolithotroph` — Morfología: Arquea hexagonal):**
  * Oxida compuestos inorgánicos obteniendo energía pasiva constante (`CHEMOLITHOTROPHY_RATE = 1.95`) sin depender de la luz solar, además de resistir un $20\%$ el daño químico de toxinas.

### 1.2. Locomoción y Movilidad (`motility`)

Determina cómo se desplaza la célula, su multiplicador realista de velocidad punta y su coste energético por movimiento:

* **Sésil / Biofilm (`sessile`):**
  * Permanece anclada ($v = 0$) y proyecta pili/matriz de biofilm. Su gasto energético locomotor es cero y su anclaje reduce un $15\%$ el daño recibido por mordiscos.
* **Flagelada (`flagellated`):**
  * Nado rápido mediante hélice flagelar rotatoria (*Run & Tumble*). Otorga un **multiplicador de velocidad máxima de $\times 1.35$** (`FLAGELLA_SPEED_MULTIPLIER`), permitiendo sprints veloces a cambio de un mayor coste de ATP/s (`0.048`).
* **Ciliada (`ciliated`):**
  * Corona perimetral de cilios vibrátiles. Realiza giros suaves con bajo gasto energético locomotor (`0.028`), pero tiene un **techo de velocidad máxima menor ($\times 0.80$)** (`CILIA_SPEED_MULTIPLIER`).
* **Espiroqueta (`spirochete`):**
  * Filamento axial interno que impulsa a la célula en sacacorchos ($\times 1.10$ velocidad) y le permite esquivar un $25\%$ del daño por mordiscos predadores.

### 1.3. Estructura y Pared Celular (`wall`)

Define la defensa física y química frente al entorno y ataques rivales:

* **Gram-Negativa (`gram_negative`):**
  * Doble membrana lipídica fina sin recargo en el metabolismo basal (`wallMultiplier = 1.0`). Otorga resistencia química adicional reduciendo un $28\%$ el daño recibido por bacteriocinas rivales.
* **Gram-Positiva (`gram_positive`):**
  * Pared gruesa de peptidoglicano. Incrementa el coste metabólico basal un $+32\%$ (`wallMultiplier = 1.32`), ideal para soportar alta armadura estructural.
* **Cápsula Mucosa (`capsule`):**
  * Halo exterior de glicocálix que incrementa el gasto basal un $+18\%$, pero reduce en un $50\%$ el daño químico de bacteriocinas y de mordiscos predadores.
* **Capa S Cristalina (`s_layer`):**
  * Coraza proteica geométrica (+24% basal) que reduce un $25\%$ el coste de mantenimiento de la armadura, filtra un $20\%$ de toxinas y rebota el $20\%$ del daño de mordiscos al atacante.

### 1.4. Estrategia Reproductiva (`reproduction`)

Regula cómo se divide la célula al alcanzar el umbral `splitEnergy` (mediante una **división celular progresiva de $3.6\text{ s}$**). Tras separarse, tanto la madre como la hija necesitan al menos **$3.6\text{ s}$ de crecimiento activo** antes de iniciar otra división, además de volver a alcanzar el umbral energético. La esporulación permite sobrevivir a crisis extremas:

* **Fisión Binaria Simétrica (`binary_fission`):**
  * Tras descontar el coste de replicación del ADN ($14\%$), la energía restante se reparte a partes iguales ($50\%$ madre / $50\%$ hija).
* **Gemación Polar (`budding`):**
  * División asimétrica: la célula madre conserva el $65\%$ de la energía neta y emite una yema hija con el $35\%$.
* **Capacidad de Esporulación (`sporulation`):**
  * Ante hambruna crítica ($E < 12$), la bacteria se transforma en una **endospora** mineralizada inerte ($5\%$ de consumo basal, inmune a predación y $-85\%$ daño por toxinas) hasta recuperar reservas ($E > 26.4$).
* **Conjugación / Pili Sexual (`conjugation`):**
  * Tiende puentes citoplasmáticos con bacterias aliadas cercanas, regenerando $+0.35\text{ ATP/s}$ por sinergia metabólica y dividiéndose en proporción $55\% / 45\%$.

### 1.5. Interacción y Guerra Química (`interaction`)

Controla la síntesis de péptidos antimicrobianos o quelantes en el medio:

* **Neutral (`neutral`):**
  * No sintetiza compuestos químicos externos (`toxinPower = 0`), ahorrando todo el drenaje energético químico.
* **Producción de Bacteriocinas (`bacteriocins`):**
  * Emite continuamente un campo químico difusivo de radio $48\text{ px}$ que daña gradualmente a bacterias de distinto linaje.
* **Quorum Sensing (`quorum_sensing`):**
  * Comportamiento cooperativo: solo activa la síntesis y emisión de bacteriocinas cuando detecta al menos **3 aliadas cercanas** en un radio de $60\text{ px}$.
* **Sideróforos Quelantes (`siderophores`):**
  * Secreta moléculas captadoras que atraen magnéticamente las partículas de nutrientes cercanas ($R = 68\text{ px}$) hacia la bacteria por un coste fijo de $0.24\text{ ATP/s}$.

### 1.6. Súper Mutaciones / Atributos Únicos (`adaptation`)

Cada cepa puede incorporar un órgano especial con una **ventaja táctica** y una **penalización biofísica** para mantener el equilibrio de Pareto:

* **Sin Mutación Extra (`none` — `NON`):** Equilibrio estándar sin penalización ni sobrecoste.
* **Pinzas Quitinosas (`claws` — `PIN`):** $+45\%$ de daño por mordisco y sujeta/frena a la presa, pero su peso resta un **$-20\%$ de velocidad** y añade $+0.28\text{ ATP/s}$ al gasto basal.
* **Gran Boca / Citostoma (`giant_maw` — `BOC`):** Mayor radio de ingesta ($+5\text{ px}$) y $+25\%$ de energía extraída al comer o morder, pero debilita la membrana (**$-25\%$ efectividad de armadura**) y añade $+0.22\text{ ATP/s}$.
* **Pinchos Calcáreos (`spikes` — `PNC`):** Devuelve el $40\%$ del daño por mordisco y pincha por contacto a rivales, pero incrementa el roce hidrodinámico (**$+35\%$ coste de nado**) y añade $+0.25\text{ ATP/s}$.
* **Bioluminiscencia (`bioluminescence` — `LUZ`):** Genera luz propia (útil para fotosintéticas en penumbra) y deslumbra a predadores ($-28\%$ daño recibido), a cambio de un alto coste lumínico de **$+0.36\text{ ATP/s}$**.
* **Trompa Ventosa (`suction_pore` — `VEN`):** Succiona el nutriente más cercano hacia la boca, pero exige un **$+15\%$ más de energía para poder dividirse** y $+0.20\text{ ATP/s}$.

---

## 2. Modelo Matemático Bioenergético

La reserva de energía celular $E$ evoluciona en cada paso temporal $\Delta t$ según:

$$\frac{dE}{dt} = \dot{E}_{\text{in}} - \dot{E}_{\text{out}}$$

Si en cualquier instante $E \le 0$, la bacteria sufre **lisis celular**: muere y deposita en su posición un corpúsculo de detritus orgánico con energía equivalente al $45\%$ de su umbral de división (`CORPSE_ENERGY_RATIO`).

### 2.1. Tasas de Ingreso ($\dot{E}_{\text{in}}$)

1. **Fotosíntesis (Epicentro móvil acotado, Michaelis-Menten y Auto-sombreado de Beer-Lambert):**

   $$I_{\text{raw}}(\mathbf{x}) = I_{\min} + (1 - I_{\min}) \cdot \exp\left(-1.65 \cdot \frac{\|\mathbf{x} - \mathbf{x}_{\text{luz}}(t)\|^2}{R_{\text{luz}}^2}\right)$$

   $$I(\mathbf{x}) = \frac{I_{\text{raw}}(\mathbf{x})}{1 + \alpha_{\text{shade}} \cdot N_{\text{vecinas}}}, \qquad \dot{E}_{\text{photo}} = V_{\max}^{\text{photo}} \cdot \frac{I(\mathbf{x})}{K_I + I(\mathbf{x})}$$

   Donde $\mathbf{x}_{\text{luz}}(t)$ es el epicentro luminoso elegido al azar con deriva suave ($14\text{ px/s}$), $R_{\text{luz}}$ parte de $260\text{ px}$ y se ajusta con los botones de radio de luz entre $120$ y $520\text{ px}$ en pasos de $40\text{ px}$, $I_{\min} = 0.03$, $\alpha_{\text{shade}} = 0.22$ es el coeficiente de auto-sombreado por bacterias vecinas en un radio de $42\text{ px}$, $V_{\max}^{\text{photo}} = 4.6$ y $K_I = 0.38$.

2. **Ingesta de Sustrato por Contacto:**

   $$\Delta E_{\text{nut}} = S \cdot \left(\frac{2.1 \cdot S}{K_S + S}\right) \cdot M_{\text{tipo}}$$

   Donde $S$ es el valor energético de la partícula, $K_S = 26.0$ y $M_{\text{tipo}}$ refleja las bonificaciones tróficas (fermentadora $\times 1.45$, saprófita sobre cadáver $\times 1.55$, fotosintética $\times 0.20$).

3. **Fagocitosis Predadora:**

   $$\dot{E}_{\text{pred}} = \eta_{\text{pred}} \cdot \frac{\text{DPS}_{\text{bite}} \cdot \phi_{\text{evasión}}}{1 + 0.25 \cdot \text{Armor}}$$

   Con $\eta_{\text{pred}} = 0.82$ y $\text{DPS}_{\text{bite}} = 34$.

4. **Escala de Velocidad Locomotora:**

   La velocidad lineal en píxeles por segundo a velocidad de simulación `1x` viene dada por $v_{\text{px}} = v_{\max} \cdot 15$ (`MOVEMENT_SPEED_FACTOR = 15`), calibrada para una observación microscópica pausada y legible.

### 2.2. Tasas de Gasto ($\dot{E}_{\text{out}}$) y Trade-offs de Pareto

Para impedir que la evolución produzca un "super-organismo" sin debilidades, el método `DNA.recalculateDerivedCosts()` recalcula automáticamente los costes pasivos y activos cada vez que nace o muta una bacteria:

1. **Metabolismo Basal y Mantenimiento de Pared (Escalado de Kleiber):**

   $$\dot{E}_{\text{basal}} = 0.95 \cdot \left(\frac{r}{8}\right)^2 \cdot M_{\text{wall}} + k_{\text{armor}}\cdot\text{Armor} + C_{\text{adapt}} + 0.30\cdot\left(\frac{P}{160}\right)^2$$

   Crecer en tamaño ($r$) encarece cuadráticamente el mantenimiento celular; acumular armadura y mantener adaptaciones o receptores sensoriales también impone un drenaje constante. El coste de receptores crece cuadráticamente con el alcance $P$ y alcanza $0.30\text{ ATP/s}$ a $160\text{ px}$ (`SENSOR_MAINTENANCE_MAX_COST`); $k_{\text{armor}}=0.06$ para la capa S y $0.08$ para las demás paredes.

2. **Arrastre Viscoso Locomotor (Bajo Número de Reynolds):**

   $$c_{\text{drag}} = k_{\text{mot}} \cdot \left(\frac{r}{8}\right) \cdot v_{\max}^{1.8}, \qquad \dot{E}_{\text{mov}} = c_{\text{drag}} \cdot v^2$$

3. **Síntesis de Bacteriocinas:**

   $$\dot{E}_{\text{tox}} = 0.22 \cdot \text{ToxinPower} \quad (\text{solo cuando la emisión está activa})$$

### 2.3. Difusión Gaussiana del Daño Químico

Cuando una bacteria emite bacteriocinas, las bacterias de distinto `lineageId` situadas a distancia $d \le R_{\text{tox}}$ reciben un daño por segundo atenuado de forma gaussiana:

$$\dot{D}(d) = \frac{\text{ToxinPower} \cdot 16 \cdot e^{-\frac{d^2}{2\sigma^2}} \cdot \phi_{\text{capsule}} \cdot \phi_{\text{gram-}} \cdot \phi_{\text{spore}}}{1 + 0.35 \cdot \text{Armor}}$$

---

## 3. Genética, Mutación y Deriva Evolutiva

Cada vez que una bacteria supera `splitEnergy`, genera una descendiente invocando `dna.cloneWithMutation()`:

1. **Micro-evolución cuantitativa:** Cada atributo continuo (`size`, `maxSpeed`, `splitEnergy`, `toxinPower`, `armor`, `perceptionRadius`) tiene una probabilidad `mutationRate` (por defecto $5\%$) de sufrir una perturbación distribuida según una campana de Irwin-Hall (aproximación gaussiana centrada en $0$) acotada a rangos biológicos viables.
2. **Macro-evolución cualitativa:** Con una probabilidad baja (`MACRO_MUTATION_CHANCE = 0.5%`), la bacteria hija muta uno de sus 5 rasgos discretos hacia otra categoría (por ejemplo, una saprófita puede originar una mutante fermentadora o adquirir capacidad de esporulación).
3. **Deriva cromática de linaje:** El matiz de color (`hue`) rota ligeramente ($\pm 5^\circ$ HSL) cuando ocurre una mutación, permitiendo observar visualmente cómo las sub-ramas de un mismo linaje divergen en el mapa sin perder la inmunidad de cepa (`lineageId`).
4. **Adquisición de adaptaciones:** Los rivales comienzan sin adaptación especial (`none`). En cada reproducción, cualquier cepa sin adaptación tiene un $1\%$ de probabilidad (`ADAPTATION_GAIN_CHANCE`) de adquirir una al azar; una adaptación adquirida se hereda y permanece en sus descendientes.

---

## 4. Colonias Iniciales y Nomenclatura Taxonómica Procedural

### 4.1. Configuración de Poblaciones Iniciales y Rivales

Desde el Editor Genómico, el jugador puede seleccionar:

* Al cargar la aplicación se sortean las categorías biológicas y los valores genéticos cuantitativos de los deslizadores; el jugador puede modificarlos antes de inocular la cepa. La cantidad de ejemplares iniciales y de cepas rivales mantiene sus valores predeterminados (`6` y `3`).
* El **número de ejemplares iniciales por cepa** se puede ajustar entre `3` y `10` individuos (`INITIAL_COLONY_SIZE = 6` por defecto). Como máximo, una cepa sésil aparece en la partida; duplica ese total y se reparte en dos focos separados: con 6 ejemplares seleccionados, empieza con 12, en dos grupos de 6. Las mutaciones de motilidad no crean nuevos linajes sésiles.
* Los ejemplares sésiles se colocan aleatoriamente con separación mínima entre sus centros para evitar solapamientos y evitar formaciones geométricas regulares.
* El **número de poblaciones rivales** entre `0` y `8` (siendo **3 poblaciones rivales** el valor por defecto, además de la cepa del jugador).

* Las colonias se inoculan distribuidas de forma equidistante en un anillo elíptico alrededor de la placa de Petri; los focos adicionales sésiles se colocan en posiciones aleatorias separadas.
* El sustrato comienza con `60` partículas (`INITIAL_NUTRIENTS`) en seis focos. Después aparecen grupos de cinco partículas cada `4 s`, concentrados en áreas de radio `44 px`; los focos nuevos se separan de los recientes siempre que el espacio lo permite.
* Los controles de la simulación permiten añadir o retirar `35` partículas de sustrato y ampliar o reducir el radio de luz en pasos de `40 px`.
* Tanto la **mitosis (reproducción)** como la **lisis celular (muerte)** tienen transiciones graduales visibles (`3.6s` y `1.6s` respectivamente) para poder observar cómo las bacterias se estiran al dividirse o se desintegran al morir antes de convertirse en detritus orgánico.
* Los genomas rivales se **generan al azar** en cada partida (`DNA.createRandomRival`), barajando los tipos de metabolismo para garantizar variedad ecológica y eligiendo aleatoriamente tanto sus rasgos cualitativos como sus estadísticas cuantitativas y matices cromáticos (`hue`).

### 4.2. Generación Procedural de Nombres (`DNA.generateProceduralName`)

Los nombres de las cepas rivales se construyen dinámicamente combinando partículas taxonómicas en función de sus atributos cualitativos y cuantitativos (y se actualizan si una cepa rival sufre mutaciones):

1. **Género (`[Prefijo de Tamaño] + [Raíz de Metabolismo] + [Sufijo de Pared]`):**
   * **Tamaño (`size`):** `Mega` ($\ge 10.5\text{ px}$), `Micro` ($\le 6.8\text{ px}$) o sin prefijo en tamaños medios.
   * **Metabolismo (`metabolism`):** `cyano` (fotosintética), `sapro` (saprófita), `phago` (predadora), `zymo` (fermentadora).
   * **Pared celular (`wall`):** `vibrio` (Gram-negativa), `bacillus` (Gram-positiva), `coccus` (cápsula mucosa).
   * *Ejemplos de género:* `Megaphagovibrio`, `Saprobacillus`, `Microzymococcus`, `Cyanococcus`.
2. **Epíteto específico (`[Motilidad] + [Interacción] + [Reproducción]`):**
   * **Locomoción (`motility`):** `flagel` (flagelada), `cili` (ciliada), `sessi` (sésil).
   * **Guerra química (`interaction`):** `toxi` (bacteriocinas), `quor` (quorum sensing), `neutr` (neutral).
   * **Reproducción (`reproduction`):** `fissa` (fisión binaria), `gemma` (gemación), `spora` (esporulación).
   * *Ejemplos de especie:* `flagelneutrfissa`, `ciliquorspora`, `sessitoxigemma`.
3. **Modificadores cuantitativos destacados (sufijos opcionales):**
   * Velocidad: `velox` ($v_{\max} \ge 2.6$) o `lenta` ($0 < v_{\max} \le 1.2$).
   * Blindaje: `ferrea` ($\text{Armor} \ge 6.0$) o `tenuis` ($\text{Armor} \le 1.5$).
   * Toxicidad: `letalis` ($\text{ToxinPower} \ge 2.6$).
   * *Ejemplo completo:* `Megaphagobacillus cilitoxigemma ferrea-letalis`.

### 4.3. Cadena Codificante de ADN (`5' → 3'`) y Editor Genómico Previo

Antes de iniciar la simulación (o en cualquier momento pulsando **Editor ADN**), el jugador accede a una pantalla dedicada: el **Editor Genómico y Fenotípico** (`#genomeEditorModal`), que otorga protagonismo central al visor de **Microscopio Electrónico** y al **Balance Bioenergético** de Kleiber/Pareto. En él, las 5 categorías biológicas se eligen de forma visual mediante tarjetas interactivas con botones (`.trait-btn`).

Cada instancia de `DNA` sintetiza automáticamente su propia **Cadena Codificante (`5' → 3'`)** mediante `DNA.formatCodingStrand`, emparejando cada categoría biológica con su atributo cuantitativo inmediatamente después:

$$\texttt{ATG}-\texttt{[META]-S\{r\}}-\texttt{[MOT]-V\{10v\}}-\texttt{[WALL]-A\{10a\}}-\texttt{[REPRO]-P\{p/10\}}-\texttt{[INTER]-T\{10t\}}-\texttt{[ADAPT]}-\texttt{H\{hue\}}-\texttt{TAG}$$

* **`ATG` / `TAG`:** Codones universales de inicio y parada de traducción.
* **Pares Categoría + Atributo:**
  * *Metabolismo + Tamaño (`S`):* `PHO`, `SAP`, `PRE`, `FER`, `QUI` seguido de `S{radio}` (ej. `SAP-S9`).
  * *Locomoción + Velocidad Efectiva (`V`):* `SES`, `FLA`, `CIL`, `AXL` seguido de `V{vel*10}` (ej. `FLA-V30`).
  * *Pared + Armadura (`A`):* `GRN`, `GRP`, `CAP`, `SLY` seguido de `A{armadura*10}` (ej. `GRP-A40`).
  * *Reproducción + Sensores (`P`):* `BIN`, `GEM`, `ESP`, `CON` seguido de `P{radio/10}` (ej. `BIN-P11`).
  * *Interacción + Toxina (`T`):* `NEU`, `BAC`, `QUO`, `SID` seguido de `T{toxina*10}` (ej. `BAC-T20`).
  * *Súper Mutación Única + Cromóforo:* `NON`, `PIN`, `BOC`, `PNC`, `LUZ`, `VEN` seguido de `H{hue}`.

### 4.4. Internacionalización (`ES / EN`), Adaptación por Edades (`5-7` a `15+`) e Inspector Celular

* **Selector de Idioma (`ES` / `EN`) y Arquitectura i18n Extensible:**
  * Centralizado en `src/i18n/i18n.ts` mediante paquetes tipados (`LocaleBundle`) y registro dinámico (`i18n.registerLocale()`), permitiendo cambiar en caliente toda la interfaz entre español e inglés y añadir futuros idiomas sin alterar la lógica del simulador.
* **Selector Pedagógico de Edades en Bloques de 3 Años (`5-7`, `8-10`, `11-14`, `15+`):**
  * Adapta los títulos y textos explicativos del Editor Genómico, la regla de Pareto y las etiquetas de atributos según la edad seleccionada. En los tramos infantiles (`5-7` y `8-10`) se emplean metáforas intuitivas (p. ej. *☀️ ComeLuz (Fotosintética · Coco)* o *🌿 Limpiadora (Saprófita · Bacilo)*) conservando siempre entre paréntesis o en la explicación el nombre científico real, mientras que en `11-14` y `15+` se incrementa progresivamente el rigor microbiológico y biofísico.
* **Inspector de Célula Seleccionada con Barra de Progreso de Energía:**
  * Al seleccionar cualquier bacteria en la placa de cultivo, el panel inspector muestra todos sus rasgos traducidos al idioma y tramo de edad activos, representando la **energía celular como una barra de progreso visual coloreada** (sin valores numéricos crudos) respecto a su umbral de división (`effectiveSplitEnergy`).
