# Mecánicas del Juego y Modelo Biológico — EvoLootIon

**EvoLootIon** es un simulador de vida artificial y estrategia evolutiva microbiana en 2D. El jugador diseña el genoma inicial de una cepa bacteriana combinando rasgos cualitativos en **5 categorías biológicas** y ajustando atributos cuantitativos sujetos a restricciones físicas reales (ley alométrica de Kleiber y arrastre viscoso a bajo número de Reynolds).

Una vez inoculada en la placa de Petri, la cepa compite en tiempo real contra otras colonias por recursos, luz y espacio, evolucionando generación tras generación mediante mutaciones heredables.

---

## 1. Las 5 Categorías Biológicas

Cada organismo se define por cinco ejes funcionales almacenados en `DNA.traits`:

### 1.1. Metabolismo y Alimentación (`metabolism`)

Define cómo la bacteria obtiene energía ($E$) del entorno y determina la morfología del cuerpo celular (soma):

* **Fotosintética (`photosynthetic` — Morfología: Coco esférico):**
  * Genera energía pasiva continua en función de la irradiancia luminosa local $I(\mathbf{x})$, que es máxima en el foco central del microscopio y decae hacia los bordes.
  * Sigue una cinética de saturación de Michaelis-Menten. Tiene baja eficiencia ($35\%$) asimilando partículas sólidas de sustrato.
* **Saprófita / Detritívora (`saprophyte` — Morfología: Bacilo cilíndrico):**
  * Se alimenta de sustrato libre y recibe una bonificación del $+40\%$ (`SAPROPHYTE_CORPSE_BONUS = 1.4`) al consumir detritus orgánico procedente de bacterias muertas.
* **Predadora / Fagocítica (`predator` — Morfología: Espirilo / Vibrio afilado):**
  * Ignora las partículas minerales y persigue activamente por quimiotaxis a bacterias vivas de otros linajes (que no estén esporuladas) para fagocitarlas por contacto, absorbiendo el $70\%$ (`PREDATION_EFFICIENCY`) del daño infligido como energía propia.
* **Fermentadora (`fermenter` — Morfología: Diplococo lobulado):**
  * Especialista en asimilación rápida: obtiene un $+35\%$ de energía (`FERMENTER_MULTIPLIER = 1.35`) de cualquier nutriente del medio.

### 1.2. Locomoción y Movilidad (`motility`)

Determina cómo se desplaza la célula y cuál es su coste energético por movimiento:

* **Sésil / Biofilm (`sessile`):**
  * Permanece anclada ($v = 0$) y proyecta pili/matriz de biofilm. Su gasto energético locomotor es exactamente cero, ideal para estrategias fotosintéticas o defensivas.
* **Flagelada (`flagellated`):**
  * Nado rápido mediante flagelo articulado con comportamiento *Run & Tumble* (orientación directa hacia el objetivo por quimiotaxis o giro browniano aleatorio cuando no percibe estímulos). Mayor factor de arrastre hidrodinámico (`0.055`).
* **Ciliada (`ciliated`):**
  * Corona perimetral de cilios vibrátiles. Realiza giros suaves y progresivos con menor coste energético locomotor (`0.035`), siendo más eficiente a velocidades medias y bajas.

### 1.3. Estructura y Pared Celular (`wall`)

Define la defensa física y química frente al entorno y ataques rivales:

* **Gram-Negativa (`gram_negative`):**
  * Doble membrana lipídica fina sin recargo en el metabolismo basal (`wallMultiplier = 1.0`). Otorga resistencia química adicional reduciendo un $28\%$ el daño recibido por bacteriocinas rivales.
* **Gram-Positiva (`gram_positive`):**
  * Pared gruesa de peptidoglicano. Incrementa el coste metabólico basal un $+35\%$ (`wallMultiplier = 1.35`), pero suele combinarse con valores altos de armadura estructural.
* **Cápsula Mucosa (`capsule`):**
  * Halo exterior de glicocálix que incrementa el gasto basal un $+20\%$, pero reduce en un $50\%$ el daño químico de bacteriocinas y dificulta la fagocitosis predadora en un $55\%$ (`evasionFactor = 0.45`).

### 1.4. Estrategia Reproductiva (`reproduction`)

Regula cómo se divide la célula al alcanzar el umbral `splitEnergy` o cómo sobrevive a crisis extremas:

* **Fisión Binaria Simétrica (`binary_fission`):**
  * Tras descontar el coste de replicación del ADN ($15\%$), la energía restante se reparte a partes iguales ($50\%$ madre / $50\%$ hija).
* **Gemación Polar (`budding`):**
  * División asimétrica: la célula madre conserva el $65\%$ de la energía neta (manteniendo mayor reserva y estabilidad) y emite una yema hija con el $35\%$.
* **Capacidad de Esporulación (`sporulation`):**
  * Ante hambruna crítica ($E < 12$), la bacteria se transforma en una **endospora** mineralizada inerte. Mientras es espora:
    * Su gasto metabólico basal se reduce al $5\%$ (`SPORE_METABOLISM_FACTOR = 0.05`).
    * Es inmune a la fagocitosis predadora y recibe solo el $15\%$ del daño por bacteriocinas.
    * Germina de nuevo al estado vegetativo cuando recupera reservas ($E > 26.4$).

### 1.5. Interacción y Guerra Química (`interaction`)

Controla la síntesis de péptidos antimicrobianos contra cepas rivales:

* **Neutral (`neutral`):**
  * No sintetiza toxinas (`toxinPower = 0`), ahorrando todo el drenaje energético químico.
* **Producción de Bacteriocinas (`bacteriocins`):**
  * Emite continuamente un campo químico difusivo de radio $48\text{ px}$ que daña a cualquier bacteria de distinto linaje, pagando un coste energético proporcional a `toxinPower`.
* **Quorum Sensing (`quorum_sensing`):**
  * Comportamiento social cooperativo: la bacteria evalúa la densidad local de congéneres en un radio de $60\text{ px}$. Solo activa la síntesis y emisión de bacteriocinas cuando detecta al menos **3 aliadas cercanas** (`QUORUM_MIN_ALLIES = 3`), evitando malgastar energía cuando está aislada.

---

## 2. Modelo Matemático Bioenergético

La reserva de energía celular $E$ evoluciona en cada paso temporal $\Delta t$ según:

$$\frac{dE}{dt} = \dot{E}_{\text{in}} - \dot{E}_{\text{out}}$$

Si en cualquier instante $E \le 0$, la bacteria sufre **lisis celular**: muere y deposita en su posición un corpúsculo de detritus orgánico con energía equivalente al $45\%$ de su umbral de división (`CORPSE_ENERGY_RATIO`).

### 2.1. Tasas de Ingreso ($\dot{E}_{\text{in}}$)

1. **Fotosíntesis (Cinética de Michaelis-Menten espacial):**

   $$\dot{E}_{\text{photo}} = V_{\max}^{\text{photo}} \cdot \frac{I(\mathbf{x})}{K_I + I(\mathbf{x})} \cdot 1.35$$

   Donde $I(\mathbf{x}) \in [0.25, 1.15]$ es la irradiancia radial desde el centro de la placa y $K_I = 0.35$.

2. **Ingesta de Sustrato por Contacto:**

   $$\Delta E_{\text{nut}} = S \cdot \left(\frac{2.1 \cdot S}{K_S + S}\right) \cdot M_{\text{tipo}}$$

   Donde $S$ es el valor energético de la partícula, $K_S = 30.0$ y $M_{\text{tipo}}$ refleja las bonificaciones tróficas (fermentadora $\times 1.35$, saprófita sobre cadáver $\times 1.40$, fotosintética $\times 0.35$).

3. **Fagocitosis Predadora:**

   $$\dot{E}_{\text{pred}} = \eta_{\text{pred}} \cdot \frac{\text{DPS}_{\text{bite}} \cdot \phi_{\text{evasión}}}{1 + 0.25 \cdot \text{Armor}}$$

   Con $\eta_{\text{pred}} = 0.70$ y $\text{DPS}_{\text{bite}} = 28$.

### 2.2. Tasas de Gasto ($\dot{E}_{\text{out}}$) y Trade-offs de Pareto

Para impedir que la evolución produzca un "super-organismo" sin debilidades, el método `DNA.recalculateDerivedCosts()` recalcula automáticamente los costes pasivos y activos cada vez que nace o muta una bacteria:

1. **Metabolismo Basal y Mantenimiento de Pared (Escalado de Kleiber):**

   $$\dot{E}_{\text{basal}} = 1.1 \cdot \left(\frac{r}{8}\right)^2 \cdot M_{\text{wall}} + 0.08 \cdot \text{Armor}$$

   Crecer en tamaño ($r$) encarece cuadráticamente el mantenimiento celular, y acumular armadura impone un drenaje constante.

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

---

## 4. Colonias Iniciales en el Ecosistema

Al iniciar o reiniciar la placa, el motor inocula 4 poblaciones de 20 individuos cada una en distintos cuadrantes:

| Identificador | Nombre en Simulación | Perfil Biológico |
| :--- | :--- | :--- |
| `player_strain` | Configurable por el jugador | Definido en el panel lateral de diseño genético |
| `rival_predator` | *Vibrio Vorax* | Predadora flagelada Gram-negativa de alta velocidad y gran radio de percepción |
| `rival_quorum` | *Bacillus Quorum* | Saprófita ciliada Gram-positiva con alta armadura, Quorum Sensing y esporulación |
| `rival_photo` | *Cyanococcus Lux* | Fotosintética ciliada con cápsula mucosa, reproducción por gemación y bacteriocinas |
