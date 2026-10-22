# EvoLootIon — Mecánicas del Juego y Modelo Biológico

**EvoLootIon** es un simulador de vida artificial y estrategia evolutiva microbiana en 2D. El jugador diseña el genoma inicial de una cepa bacteriana combinando rasgos cualitativos en **5 categorías biológicas** y ajustando atributos cuantitativos sujetos a restricciones físicas reales (ley alométrica de Kleiber y arrastre viscoso a bajo número de Reynolds).

Una vez inoculada en la placa de Petri, la cepa compite en tiempo real contra otras colonias por recursos, luz y espacio, evolucionando generación tras generación mediante mutaciones heredables.

---

## 1. Las 5 Categorías Biológicas

Cada organismo se define por cinco ejes funcionales almacenados en `DNA.traits`:

### 1.1. Metabolismo y Alimentación (`metabolism`)

Define cómo la bacteria obtiene energía ($E$) del entorno y, en las cepas diseñadas, orienta la morfología base del soma. Los perfiles de referencia pueden fijar su forma celular conocida:

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
* **Quimiolitótrofa (`chemolithotroph` — Morfología de juego: Arquea hexagonal):**
  * Oxida compuestos inorgánicos obteniendo energía pasiva constante (`CHEMOLITHOTROPHY_RATE = 1.95`) sin depender de la luz solar, además de resistir un $20\%$ el daño químico de toxinas.
* **Quimioheterótrofa (`chemoheterotroph` — Morfología base: Bacilo):**
  * Obtiene energía de materia orgánica al rendimiento basal. Representa a heterótrofos que no encajan en las especializaciones de fermentación o consumo de detritos; no añade una bonificación de energía.

### 1.2. Locomoción y Movilidad (`motility`)

Determina cómo se desplaza la célula, su multiplicador realista de velocidad punta y su coste energético por movimiento:

* **Sésil / Biofilm (`sessile`):**
  * Permanece anclada ($v = 0$) y proyecta pili/matriz de biofilm. Su gasto energético locomotor es cero y su anclaje reduce un $15\%$ el daño recibido por mordiscos.
* **No móvil (`nonmotile`):**
  * No tiene locomoción activa, pero no queda anclada ni obtiene la defensa o el despliegue en dos focos propios de una cepa sésil.
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
  * Ante hambruna crítica ($E < 12$), la bacteria se transforma en una **endospora** mineralizada inerte ($5\%$ de consumo basal, inmune a predación y $-85\%$ daño por toxinas) hasta recuperar reservas ($E > 26.4$). En nivel de detalle alto, las células vegetativas muestran una pre-espora polar en maduración y las endosporas latentes exhiben su estructura concéntrica (exosporio, cubierta laminar, córtex y núcleo birrefringente de dipicolinato de calcio).
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

3. **Fagocitosis Predadora y Combate Directo entre Bacterias:**

   $$\dot{E}_{\text{pred}} = \eta_{\text{pred}} \cdot \frac{\text{DPS}_{\text{bite}} \cdot \phi_{\text{evasión}}}{1 + 0.25 \cdot \text{Armor}}$$

   Con $\eta_{\text{pred}} = 0.85$ y $\text{DPS}_{\text{bite}} = 16$. Durante el combate cuerpo a cuerpo y químico se manifiestan efectos físicos y visuales según los atributos de cada bacteria:
   * **Embestida y Flujo de Fagocitosis (`drawPredatorFeedingStream`):** La predadora embiste frontalmente y absorbe un chorro de vesículas de citoplasma del color (`hue`) de la presa hacia su boca, mientras la presa sufre una muesca de desgarro y sacudidas en el punto mordido. Si la predadora tiene **Pinzas (`claws`)**, sujeta y arrastra físicamente a la presa hacia sus fauces.
   * **Defensa Evasiva (`capsule_slip`):** Las presas con **Cápsula Mucosa (`capsule`)**, **Espiroqueta (`spirochete`)** o **Bioluminiscencia (`bioluminescence`)** se escurren lateralmente del mordisco mostrando estelas hidrodinámicas cian.
   * **Contraataque y Rebote de Coraza (`armor_reflect`):** Si la presa posee **Pinchos Calcáreos (`spikes`)** ($40\%$ de daño reflejado), **Capa S Cristalina (`s_layer`)** ($20\%$ reflejado) o alta **Armadura (`armor >= 5`)**, despliega un arco defensivo ámbar-dorado en el flanco atacado, lanza chispazos punzantes y empuja hacia atrás al atacante.
   * **Escudo de Neutralización Química (`toxin_shield`):** Frente a **Bacteriocinas (`bacteriocins` / `quorum_sensing`)**, las bacterias muestran burbujeo corrosivo magenta en el flanco expuesto, pero aquellas con defensas químicas (**Cápsula**, **Gram-Negativa**, **Capa S**, **Quimiolitótrofa** o alta armadura) despliegan una barrera esmeralda discontinua que amortigua la toxina.

4. **Escala de Velocidad Locomotora:**

   La velocidad lineal en píxeles por segundo a velocidad de simulación `1x` viene dada por $v_{\text{px}} = v_{\max} \cdot 15$ (`MOVEMENT_SPEED_FACTOR = 15`), calibrada para una observación microscópica pausada y legible.

5. **Velocidad de Simulación:**

   El botón de velocidad del HUD alterna entre `1x`, `2x`, `4x` y `0,5x`, y vuelve a `1x`. La escala afecta al tiempo simulado completo; `0,5x` hace que bacterias, agentes, nutrientes y temporizadores avancen a la mitad de velocidad.

### 2.2. Tasas de Gasto ($\dot{E}_{\text{out}}$), Crecimiento Ontogenético y Trade-offs de Pareto

Para impedir que la evolución produzca un "super-organismo" sin debilidades, el método `DNA.recalculateDerivedCosts()` recalcula los costes base del genoma, mientras que `Bacteria` escala en tiempo real su radio y gasto energético a medida que ingiere alimento y acumula reservas de ATP antes de dividirse:

1. **Crecimiento Ontogenético y Plasticidad Trófica (`growthScale`):**

   El **Tamaño del Cuerpo** del editor muestra el tamaño celular medio de referencia ($r_{\text{genético}}$), correspondiente al punto de equilibrio energético inicial ($62\%$); su descripción breve recuerda que un tamaño mayor aumenta tanto las reservas como el gasto basal. El valor se presenta sin el rango mínimo-máximo; la bacteria cambia su tamaño efectivo durante la simulación según $r_{\text{actual}} = r_{\text{genético}} \cdot \gamma$, donde $\gamma$ varía con la reserva energética y la elasticidad anabólica $[\gamma_{\min}, \gamma_{\max}]$ está gobernada por su **locus de metabolismo**:
   * **Predadora (`PRE`):** $0.72\times \to 1.42\times$ (alta hipertrofia tras cazar presas).
   * **Saprófita (`SAP`):** $0.75\times \to 1.36\times$ (gran expansión al digerir detritus orgánico).
   * **Fermentadora (`FER`):** $0.74\times \to 1.34\times$ (hinchazón rápida en festines de sustrato).
   * **Quimioheterótrofa (`HET`):** $0.78\times \to 1.28\times$ (plasticidad heterótrofa estándar).
   * **Fotosintética (`PHO`):** $0.84\times \to 1.20\times$ (crecimiento moderado bajo la luz).
   * **Quimiolitótrofa (`QUI`):** $0.94\times \to 1.06\times$ (pared rígida y gasto homeostático casi constante).

2. **Metabolismo Basal y Mantenimiento de Pared (Escalado de Kleiber dinámico):**

   $$\dot{E}_{\text{basal}}(\gamma) = 0.95 \cdot \left(\frac{r_{\text{genético}} \cdot \gamma}{8}\right)^2 \cdot M_{\text{wall}} + k_{\text{armor}}\cdot\text{Armor} + C_{\text{adapt}} + 0.30\cdot\left(\frac{P}{160}\right)^2$$

   Crecer en tamaño al comer ($r_{\text{genético}} \cdot \gamma$) amplía el radio de contacto para absorber nutrientes o cazar, pero encarece cuadráticamente el mantenimiento celular en tiempo real (`currentBasalMetabolism`). Acumular armadura y mantener adaptaciones o receptores sensoriales también impone un drenaje constante ($k_{\text{armor}}=0.06$ para la capa S y $0.08$ para las demás paredes).

3. **Arrastre Viscoso Locomotor (Bajo Número de Reynolds dinámico):**

   $$c_{\text{drag}}(\gamma) = k_{\text{mot}} \cdot \left(\frac{r_{\text{genético}} \cdot \gamma}{8}\right) \cdot v_{\max}^{1.75}, \qquad \dot{E}_{\text{mov}} = c_{\text{drag}}(\gamma) \cdot v^2$$

4. **Síntesis de Bacteriocinas:**

   $$\dot{E}_{\text{tox}} = 0.20 \cdot \text{ToxinPower} \quad (\text{solo cuando la emisión está activa})$$

### 2.3. Difusión Gaussiana del Daño Químico

Cuando una bacteria emite bacteriocinas, las bacterias de distinto `lineageId` situadas a distancia $d \le R_{\text{tox}}$ reciben un daño por segundo atenuado de forma gaussiana:

$$\dot{D}(d) = \frac{\text{ToxinPower} \cdot 16 \cdot e^{-\frac{d^2}{2\sigma^2}} \cdot \phi_{\text{capsule}} \cdot \phi_{\text{gram-}} \cdot \phi_{\text{spore}}}{1 + 0.35 \cdot \text{Armor}}$$

---

## 3. Genética, Mutación y Deriva Evolutiva

Cada vez que una bacteria supera `splitEnergy`, genera una descendiente invocando `dna.cloneWithMutation()`:

1. **Micro-evolución cuantitativa con Transgresión Evolutiva (extremos desbloqueados):** Cada atributo continuo (`size`, `maxSpeed`, `splitEnergy`, `toxinPower`, `armor`, `perceptionRadius`, además de `mutationRate` entre `0.02` y `0.12`) tiene una probabilidad `mutationRate` (por defecto $5\%$) de sufrir una perturbación distribuida según una campana de Irwin-Hall (aproximación gaussiana centrada en $0$) que puede superar los límites de creación del Editor Genómico:
   * **Tamaño (`size`):** `3.5 – 20.0 px` (desbloqueando prefijos taxonómicos `Nano` y `Titan`).
   * **Velocidad base (`maxSpeed`):** `0.2 – 6.5` (desbloqueando el epíteto `hypervelox`).
   * **Umbral de fisión (`splitEnergy`):** `55 – 340 E`.
   * **Potencia de toxina (`toxinPower`):** `0.1 – 7.5`.
   * **Armadura (`armor`):** `0.0 – 18.0` (desbloqueando el epíteto `adamantina`).
   * **Alcance sensorial (`perceptionRadius`):** `25 – 220 px`.
2. **Macro-evolución cualitativa:** Con una probabilidad del $1.2\%$ (`MACRO_MUTATION_CHANCE = 0.012`), la bacteria hija muta uno de sus 5 rasgos discretos hacia otra categoría (por ejemplo, una saprófita puede originar una mutante fermentadora o adquirir capacidad de esporulación).
3. **Deriva cromática de linaje:** El matiz de color (`hue`) rota ligeramente ($\pm 5^\circ$ HSL) cuando ocurre una mutación, permitiendo observar visualmente cómo las sub-ramas de un mismo linaje divergen en el mapa sin perder la inmunidad de cepa (`lineageId`).
4. **Acumulación y evolución de múltiples Súper-Adaptaciones (`adaptations`):** Tanto en el Editor Genómico como por evolución (`ADAPTATION_GAIN_CHANCE = 0.02`), una cepa puede combinar simultáneamente hasta **3 adaptaciones fenotípicas** (`MAX_SIMULTANEOUS_ADAPTATIONS = 3`, codificadas en el locus #12 unidas por `+`, p. ej. `PIN+BOC+PNC`). Todos sus beneficios tácticos, efectos morfológicos en Canvas y *trade-offs* biofísicos (costes basales de ATP/s, penalización de velocidad, armadura, arrastre o umbral de división) se acumulan íntegramente. En divisiones posteriores, las cepas que ya poseen adaptaciones pueden adquirir una adicional, sustituir una existente o perder una si resulta metabólicamente insostenible (`ADAPTATION_SWAP_OR_LOSS_CHANCE = 0.3`).

---

## 4. Colonias Iniciales y Nomenclatura Taxonómica Procedural

### 4.1. Configuración de Poblaciones Iniciales y Rivales

Desde el Editor Genómico, el jugador puede seleccionar:

* Al cargar la aplicación se sortean las categorías biológicas y los valores genéticos cuantitativos de los deslizadores; el jugador puede modificarlos antes de inocular la cepa. La cantidad de ejemplares iniciales y de cepas rivales mantiene sus valores predeterminados (`6` y `3`).
* El **número de ejemplares iniciales por cepa** se puede ajustar entre `3` y `10` individuos (`INITIAL_COLONY_SIZE = 6` por defecto). Como máximo, una cepa sésil aparece en la partida; duplica ese total y se reparte en dos focos separados: con 6 ejemplares seleccionados, empieza con 12, en dos grupos de 6. Las mutaciones de motilidad no crean nuevos linajes sésiles.
* Los ejemplares de todas las colonias (tanto móviles como sésiles) se inoculan mediante muestreo con rechazo para garantizar una separación mínima entre sus centros y evitar que aparezcan apilados o solapados al inicio de la partida. Durante la simulación, las bacterias presentan **repulsión estérica suave y evasión de colisiones**, evitando atravesarse unas a otras, y su locomoción sigue una cinética fluida dependiente de $\Delta t$ (*Run & Tumble* con temporizador, histéresis direccional hacia nutrientes/presas e inercia de giro). Al alcanzar los límites de la placa, rebotan invirtiendo la componente de velocidad perpendicular a la pared y actualizan su orientación.
* El sustrato comienza con `60` partículas (`INITIAL_NUTRIENTS`) en seis focos. Después aparecen grupos de cinco partículas cada `4 s`, concentrados en áreas de radio `44 px`; los focos nuevos se separan de los recientes siempre que el espacio lo permite. En nivel de detalle alto, las partículas de sustrato exhiben **morfologías diversas** (cristales hexagonales, romboides minerales, tríadas de aminoácidos, esquirlas minerales y gránulos de glucosa) y los **cadáveres bacterianos** se representan como restos celulares lisados (membrana rota colapsada del matiz de la bacteria fallecida, gránulos coagulados y hebras de cromatina liberadas).
* El **número de poblaciones rivales** entre `0` y `8` (siendo **3 poblaciones rivales** el valor por defecto, además de la cepa del jugador).
* Además de las rivales generadas al azar, se pueden incluir perfiles fijos de *Salmonella enterica* serovar Typhimurium, *Helicobacter pylori*, *Escherichia coli* K-12, *Staphylococcus aureus*, *Pseudomonas aeruginosa* PAO1 y *Bacillus subtilis* 168. Cada casilla marcada añade una población y usa el mismo número de ejemplares por colonia. Todas aparecen desmarcadas inicialmente.

  * *Salmonella*, *H. pylori* y *E. coli* se representan como bacilos quimioheterótrofos Gram-negativos y flagelados; *H. pylori* tiene soma curvado.
  * *S. aureus* se representa como cocos agrupados Gram-positivos y no móviles (no sésiles). *P. aeruginosa* es un bacilo quimioheterótrofo Gram-negativo con quorum sensing. *B. subtilis* es un bacilo quimioheterótrofo Gram-positivo con capacidad de esporulación.
  * Los rasgos categóricos y la forma de referencia están fijados al inocular. Los parámetros numéricos están escalados para el juego y pueden evolucionar en las generaciones descendientes.
* **Agentes biológicos externos: Bacteriófagos T4 y Glóbulos Blancos Neutrófilos (`src/models/HostAgents.ts`):**
  * Pueden activarse **desde el inicio de la partida** desplegando el selector **Virus y defensas inmunes que añadir** (`#hostAgentsBox`, situado inmediatamente debajo de *Bacterias famosas que añadir* con el mismo formato de casillas e indicador `+N`), o bien lanzarse/retirarse en cualquier momento como **eventos rápidos** desde la barra superior del HUD (`−/+ Fagos` y `−/+ Neutrófilos`):
    1. **Bacteriófago T4 (`bacteriophage_t4`):** Partícula vírica lítica icosaédrica (`PHAGE_RADIUS = 3.4 px`) con vaina contráctil y 6 fibras caudales articuladas. Deriva por agitación browniana y afinidad electrostática (`PHAGE_PERCEPTION_RADIUS = 85 px`) hacia bacterias vivas no esporuladas. El enfrentamiento transcurre en **dos líneas de defensa biológicas**:
       * **1ª Línea — Bloqueo de entrada en la pared celular (`tryAdsorbPhage`):** Al contactar, la **Capa S (`s_layer`)** bloquea el $65\%$ de los intentos, la **Cápsula Mucosa (`capsule`)** el $50\%$, la pared **Gram-Positiva (`gram_positive`)** el $25\%$, los **Pinchos (`spikes`)** aportan un $20\%$ adicional y la **Armadura (`armor`)** reduce la penetración ($\frac{1}{1 + 0.08 \cdot \text{Armor}}$), mostrando un destello de escudo defensivo y repeliendo al virión.
       * **2ª Línea — Lucha intracelular CRISPR-Cas y Enzimas de Restricción vs. Ciclo Lítico:** Si el fago logra anclarse, permanece clavado en el exterior de la membrana contrayendo su vaina e inyectando su ADN cian mientras su cápside se vacía (`4.8 s` base, `PHAGE_INCUBATION_TIME`). Mientras la bacteria sufre sacudidas motoras y drena $+0.55\text{ ATP/s}$, si conserva reservas de energía ($E > 15.6$) contraataca invirtiendo ATP adicional (`PHAGE_CRISPR_DEFENSE_DRAIN = 0.32`) en sintetizar **endonucleasas de restricción y complejos CRISPR-Cas** (visibles como un anillo contra-rotatorio esmeralda y destellos dorados de "tijeras moleculares" cortando el filamento viral). La eficacia de esta inmunidad intracelular depende de los atributos del genoma: **Conjugación (`CON`, $+0.24$)** por transferencia horizontal de casetes CRISPR en plásmidos, **Quorum Sensing activo (`QUO`, $+0.28$)** por activación inmunitaria cooperativa, **Bacteriocinas (`BAC`, $+0.14 + 0.04 \cdot T$)** y **Sideróforos (`SID`, $+0.08$)** por maquinaria enzimática secretora, **Quimiolitotrofia (`QUI`, $+0.14$)** y **Armadura ($+0.02 \cdot A$)**. Si `phageCrisprProgress` alcanza el $100\%$ antes de la maduración lítica ($< 88\%$), la bacteria **tritura el ADN invasor, expulsa la carcasa vacía del fago dando vueltas con una onda esmeralda y sobrevive**. Si el virus gana la carrera, el soma se hincha por presión osmótica, se agrieta en magenta y revienta en una onda lítica liberando `3` nuevos bacteriófagos (`PHAGE_BURST_SIZE`) y detritus orgánico.
    2. **Neutrófilo PMN (`neutrophil_pmn`):** Leucocito polimorfonuclear ameboide (`NEUTROPHIL_RADIUS = 18 px`) con pseudópodos dinámicos, núcleo trilobulado, gránulos azurófilos y vacuolas digestivas (fagosomas). Patrulla por quimiotaxis (`NEUTROPHIL_PERCEPTION_RADIUS = 220 px`) sintiéndose especialmente atraído por bacterias que secretan **bacteriocinas/toxinas**. Al contactar, fagocita y digiere presas (`NEUTROPHIL_PHAGOCYTOSIS_DPS = 36`); la **Cápsula Mucosa (`capsule`)** actúa como defensa antifagocítica reduciendo el daño un $55\%$ y permitiendo escurrirse de los pseudópodos, las **Espiroquetas (`spirochete`)** esquivan un $30\%$ y las **Endosporas (`isSpore`)** resisten un $80\%$. Tras digerir hasta `6` bacterias (`NEUTROPHIL_MAX_PREY`) o cumplir su vida útil (`55 s`), el neutrófilo entra en apoptosis liberando nutrientes orgánicos ricos al medio.
* **Inoculación de cepas rivales personalizadas por cadena codificante de ADN (`5' → 3'`) y paneles desplegables:** Dentro de **Condiciones de la Placa de Cultivo**, tanto el bloque de **Bacterias famosas que añadir** (`#knownSpeciesBox`), el de **Virus y defensas inmunes que añadir** (`#hostAgentsBox`) como el de **Añadir cepas rivales por cadena de ADN** (`#customRivalDnaBox`) se muestran plegados por defecto (mostrando únicamente su barra de título y contador de opciones seleccionadas/añadidas) y se despliegan al hacer clic. En el bloque de ADN rival, el jugador puede pegar o escribir cualquier cadena codificante de 14 codones (`#customRivalDnaInput`, p. ej. `ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG`), pulsar el botón **`🎲 ADN al azar`** (`#btnRandomCustomRivalDna`) para rellenar automáticamente un ADN celular válido aleatorio que pueda editar directamente, e indicar un nombre opcional (`#customRivalNameInput`). El método `DNA.parseCodingStrand` valida en tiempo real cada locus y sus rangos biofísicos extendidos (`S4..S20`, `V0..V90`, `A0..A180`, `P2..P22`, `T0..T75`, `H0..H360` y hasta 3 adaptaciones combinadas con `+` como `PIN+BOC`), mostrando confirmación taxonómica o el error específico de codón en el idioma activo (`#customRivalFeedback`) y añadiendo la cepa a la lista de rivales (`#customRivalsList`) para su inoculación en el anillo elíptico de la placa.

* Las colonias se inoculan distribuidas de forma equidistante en un anillo elíptico alrededor de la placa de Petri; los focos adicionales sésiles se colocan en posiciones aleatorias separadas.
* El sustrato comienza con `60` partículas (`INITIAL_NUTRIENTS`) en seis focos. Después aparecen grupos de cinco partículas cada `4 s`, concentrados en áreas de radio `44 px`; los focos nuevos se separan de los recientes siempre que el espacio lo permite.
* Los controles de la simulación permiten añadir o retirar `35` partículas de sustrato y ampliar o reducir el radio de luz en pasos de `40 px`. Al pulsar el botón de retirar sustrato (`- Sustrato`), se desconecta la introducción automática de sustrato hasta que el jugador vuelva a pulsar el botón de añadir (`+ Sustrato`) o inicie un nuevo cultivo.
* Si en algún momento se extinguen todas las bacterias y endosporas de la placa (`totalBacteria === 0`), la simulación se detiene automáticamente.
* La **división celular** y la **lisis** tienen transiciones graduales visibles (`3.6s` y `1.6s`). Después de dividirse, madre e hija requieren al menos `3.6s` de crecimiento activo antes de poder iniciar otra división.
* Las poblaciones rivales aleatorias se generan en cada partida (`DNA.createRandomRival`), con rasgos y estadísticas variados. Los perfiles de especies conocidas usan rasgos cualitativos y morfología de referencia fijos; sus estadísticas continuas están normalizadas para el balance del juego, no son mediciones directas de velocidades o metabolismo reales. Las generaciones descendientes pueden evolucionar y conservan el nombre de su especie de referencia.
* La simulación no modela oxígeno, pH, huésped ni todos los mecanismos de virulencia. Por ejemplo, la ureasa de *H. pylori* y el entorno ácido gástrico no tienen efecto mecánico; la interacción por quorum sensing de *P. aeruginosa* es una aproximación del juego, no una simulación literal de sus factores de virulencia.

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

Antes de iniciar la simulación (o en cualquier momento pulsando **Editor ADN**), el jugador accede a una pantalla dedicada: el **Editor Genómico y Fenotípico** (`#genomeEditorModal`), que otorga protagonismo central al visor de **Microscopio Electrónico** y al **Balance Bioenergético** de Kleiber/Pareto. La cabecera identifica el juego como **Evo Loot Ion** e incluye el enlace **Instrucciones**, que abre este README renderizado en GitHub; en pantallas móviles el enlace se reduce a un botón compacto con icono de ayuda. En él:

* El selector **Edad del científico** (`5-7`, `8-10`, `11-14`, `15+`) y el selector compacto de idioma con banderas (`🇪🇸` / `🇬🇧`) se ubican juntos directamente encima del campo para introducir el nombre de la cepa, evitando ocupar espacio fijo en la barra superior.
* El nombre base de la cepa se guarda en el almacenamiento local del navegador (`evolootion.strainName`); al iniciar cada sesión se le añade un sufijo aleatorio de cuatro caracteres alfanuméricos en mayúsculas, sin acumular sufijos guardados.
* La **Cadena Codificante (ADN)** se muestra en una sola línea con tipografía monoespaciada muy compacta (sin recuadros individuales por codón) e incorpora dos botones de acción rápida en su cabecera: **Editar** (`#btnEditDna`) y **Copiar** (`#btnCopyDna`). Al pulsar **Editar**, se despliega un campo de texto directo (`#dnaStrandInput`) para escribir o pegar cualquier secuencia `5' → 3'`, validándola en tiempo real (`#dnaStrandFeedback`) y actualizando automáticamente los rasgos, deslizadores, vista previa del microscopio y balance de ATP de la cepa del jugador.
* El selector de color muestra el matiz elegido en grados; el locus cromóforo (`H{hue}`) aparece en la cadena codificante, por lo que no se repite en un bloque independiente junto al control.
* El bloque de **Balance de Energía (ATP)** y la nota de Pareto se integran directamente debajo de la cadena codificante dentro de la misma tarjeta del **Microscopio Electrónico**, evitando solapamientos con otros bloques.
* En pantallas o dispositivos en los que al desplazarse hacia los selectores el visor principal queda oculto, aparece automáticamente una **barra superior fija (`#miniStrainStickyBar`)** con la vista previa en miniatura de la bacteria en tiempo real (`#miniPreviewCanvas`, contenedor de `100 × 60 px`) y su **Consumo Total Estimado de ATP/s** (`#miniBadgeTotalCost`).
* Las categorías biológicas (`A` a `F`) se presentan como **bloques desplegables en acordeón** (al estilo de *Bacterias famosas*): cuando una categoría se despliega, el resto del grupo se contrae automáticamente y el contenedor hace scroll automático hasta el inicio del apartado recién abierto (sin botones de *Anterior* / *Siguiente*). En su cabecera siempre visible muestran la letra de la categoría, su nombre, el icono y nombre del rasgo activo y el locus de ADN correspondiente (`[data-category-tab]`), pudiendo también desplegarse al hacer clic sobre los codones de la cadena de ADN (`#dnaStrandDisplay`).
* El bloque de **Condiciones de la Placa de Cultivo** se sitúa en la parte inferior del editor ocupando todo el ancho disponible en pantallas grandes (`grid-column: 1 / -1`).

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
  * Adapta los títulos y textos explicativos del Editor Genómico, el **Balance de Energía**, la regla de Pareto y las etiquetas de atributos según la edad seleccionada.
  * En los tramos infantiles (`5-7` y `8-10`), el bloque de **Balance de Energía** utiliza etiquetas reducidas y directas (*Cuerpo y escudo*, *Gasto al nadar*, *Veneno / Imanes*, *Hambre total*) y sustituye los valores decimales en `ATP/s` por un **medidor visual de 5 iconos de energía (`atp-energy.png`)** que se iluminan progresivamente según el nivel de gasto (tanto en el desglose como en la barra fija `#miniStrainStickyBar`), mientras que en `11-14` y `15+` se muestra la cifra exacta en `ATP/s` y la terminología biofísica completa.
  * En todas las tarjetas de rasgos, encabezados de categoría y etiquetas de parámetros que incluyen una aclaración entre paréntesis (p. ej. *ComeLuz (Fotosintética · Coco)* o *Limpiadora (Saprófita · Bacilo)*), el encabezado principal muestra únicamente el nombre limpio sin paréntesis y despliega la descripción técnica o morfológica justo debajo como un **subtítulo en tamaño menor y tono atenuado**.
  * Las tarjetas de rasgos mantienen una separación vertical compacta para ahorrar espacio en pantalla, conservando la separación horizontal.
* **Inspector Compacto de Célula Seleccionada con Barra de Progreso de Energía y Seguimiento de Cámara:**
  * Al seleccionar cualquier bacteria en la placa de cultivo, la cámara centra automáticamente la vista sobre el microorganismo y lo sigue en tiempo real mientras se desplaza (si el usuario arrastra manualmente el lienzo o pulsa **Centrar Vista**, el seguimiento se libera, pudiendo reactivarse al volver a pinchar la bacteria o el propio panel inspector).
  * El panel inspector presenta un formato compacto donde la cadena codificante de ADN (`5' → 3'`), el encabezado y cada atributo se mantienen en una sola línea, mostrando todos sus rasgos traducidos al idioma y tramo de edad activos y representando la **energía celular como una barra de progreso visual coloreada** (sin valores numéricos crudos) respecto a su umbral de división (`effectiveSplitEnergy`).
