export const SimConfig = {
  CELL_SIZE: 64,
  MAX_NUTRIENTS: 220,
  INITIAL_NUTRIENTS: 60,
  INITIAL_NUTRIENT_CLUSTERS: 6,
  NUTRIENT_CLUSTER_SIZE: 5,
  NUTRIENT_CLUSTER_RADIUS: 44,
  NUTRIENT_CLUSTER_INTERVAL: 4,
  NUTRIENT_CLUSTER_SEPARATION: 110,
  MANUAL_NUTRIENT_AMOUNT: 35,
  BASE_NUTRIENT_ENERGY: 26,
  CORPSE_ENERGY_RATIO: 0.48,
  INITIAL_COLONY_SIZE: 6,
  MIN_INITIAL_COLONY_SIZE: 3,
  MAX_INITIAL_COLONY_SIZE: 10,
  SESSILE_COLONY_SEPARATION: 280,
  SESSILE_OTHER_COLONY_CLEARANCE: 210,
  DEFAULT_RIVAL_COLONIES: 3,
  MAX_RIVAL_COLONIES: 8,
  MOVEMENT_SPEED_FACTOR: 14,        // Factor px/s por unidad de velocidad efectiva

  // Multiplicadores realistas de velocidad punta según apéndice locomotor
  FLAGELLA_SPEED_MULTIPLIER: 1.35,  // El flagelo rotatorio permite sprints rápidos
  SPIROCHETE_SPEED_MULTIPLIER: 1.1, // Sacacorchos ágil en medio viscoso
  CILIA_SPEED_MULTIPLIER: 0.8,      // Los cilios dan giro suave y ahorro, pero menor velocidad punta

  // Tiempos de transición visual (reproducción y muerte graduales)
  DIVISION_DURATION: 3.6,           // Segundos de división celular visible
  MIN_INTERDIVISION_INTERVAL: 3.6,   // Crecimiento mínimo tras dividirse antes de iniciar otro ciclo
  DEATH_LYSIS_DURATION: 1.6,        // Segundos que dura la lisis celular antes de desaparecer

  // Constantes bioenergéticas y cinética de Michaelis-Menten
  PHOTOSYNTHESIS_RATE: 4.4,
  CHEMOLITHOTROPHY_RATE: 1.95,      // Oxidación mineral constante independiente de la luz
  LIGHT_HALF_SATURATION: 0.38,      // K_I para fotosíntesis
  LIGHT_SPOT_RADIUS: 260,           // Radio del epicentro luminoso (zona acotada)
  LIGHT_SPOT_RADIUS_MIN: 120,
  LIGHT_SPOT_RADIUS_MAX: 520,
  LIGHT_SPOT_RADIUS_STEP: 40,
  LIGHT_AMBIENT_MIN: 0.03,          // Penumbra fuera del foco (insuficiente para mantener metabolismo basal)
  LIGHT_DRIFT_SPEED: 14,            // Velocidad (px/s) a la que deriva suavemente el epicentro de luz
  PHOTOSYNTHESIS_SHADING_COEFF: 0.22, // Atenuación por auto-sombreado (Ley de Beer-Lambert según densidad local)
  PHOTOSYNTHESIS_SHADING_RADIUS: 42,  // Radio en el que bacterias vecinas proyectan sombra
  SUBSTRATE_HALF_SATURATION: 26.0,  // K_S para absorción saprófita/fermentadora
  SAPROPHYTE_CORPSE_BONUS: 1.55,    // Eficiencia extra de saprófitas sobre detritus orgánico
  FERMENTER_MULTIPLIER: 1.45,       // Asimilación rápida de fermentadoras
  PREDATION_EFFICIENCY: 0.85,
  PREDATION_BITE_DPS: 16,           // Caza más gradual y visible para observar los combates
  REPLICATION_COST_RATIO: 0.14,
  SENSOR_MAINTENANCE_MAX_COST: 0.30, // ATP/s para mantener sensores al alcance máximo de 160 px

  // Interacción, Guerra Química y Esporulación
  TOXIN_RADIUS: 48,
  TOXIN_DAMAGE_FACTOR: 9.5,         // Daño químico progresivo (no instantáneo)
  TOXIN_ENERGY_COST: 0.20,
  QUORUM_RADIUS: 60,
  QUORUM_MIN_ALLIES: 3,
  SIDEROPHORE_PULL_RADIUS: 68,      // Radio de atracción magnética de nutrientes (Sideróforos)
  SIDEROPHORE_PULL_FORCE: 26,
  SPORULATION_THRESHOLD: 12,        // Energía crítica para entrar en espora
  SPORE_WAKE_MULTIPLIER: 2.2,       // Factor sobre umbral para germinar
  SPORE_METABOLISM_FACTOR: 0.05,    // Consumo basal reducido al 5%

  // Evolución y Transgresión Evolutiva (límites desbloqueados más allá del editor)
  MACRO_MUTATION_CHANCE: 0.012,     // 1.2% de probabilidad por división de mutar un rasgo cualitativo
  ADAPTATION_GAIN_CHANCE: 0.02,     // 2.0% de probabilidad por reproducción de ganar/mutar adaptaciones
  ADAPTATION_SWAP_OR_LOSS_CHANCE: 0.3, // Al mutar una cepa que ya tiene adaptaciones, 30% de sustituir o perder una
  MAX_SIMULTANEOUS_ADAPTATIONS: 3,  // Hasta 3 súper-adaptaciones acumulables simultáneamente en un mismo linaje
  MUTATION_MIN_SIZE: 3.5,           // Nanobacteria evolutiva (editor min: 5.5)
  MUTATION_MAX_SIZE: 20.0,          // Megabacteria / Leviatán evolutivo (editor max: 13.5)
  MUTATION_MIN_SPEED: 0.2,          // Deriva lenta evolutiva (editor min: 0.6)
  MUTATION_MAX_SPEED: 6.5,          // Hiper-velocidad evolutiva (editor max: 4.0)
  MUTATION_MIN_SPLIT_ENERGY: 55,
  MUTATION_MAX_SPLIT_ENERGY: 340,
  MUTATION_MIN_TOXIN: 0.1,
  MUTATION_MAX_TOXIN: 7.5,          // Veneno hiper-concentrado (editor max: 4.5)
  MUTATION_MIN_ARMOR: 0,
  MUTATION_MAX_ARMOR: 18.0,         // Coraza extrema (editor max: 10.0)
  MUTATION_MIN_PERCEPTION: 25,
  MUTATION_MAX_PERCEPTION: 220,     // Quimiotaxis de largo alcance (editor max: 150)

  // Agentes Biológicos Externos (Bacteriófagos T4 y Glóbulos Blancos Neutrófilos)
  MAX_PHAGES: 42,
  INITIAL_PHAGE_COUNT: 8,
  MANUAL_PHAGE_WAVE_COUNT: 6,
  PHAGE_RADIUS: 3.4,
  PHAGE_DRIFT_SPEED: 38,
  PHAGE_SEEK_SPEED: 64,
  PHAGE_PERCEPTION_RADIUS: 85,
  PHAGE_LIFESPAN: 26,               // Segundos que un virión libre permanece activo fuera de un huésped
  PHAGE_INCUBATION_TIME: 4.8,       // Segundos de ciclo lítico intracelular antes de estallar
  PHAGE_BURST_SIZE: 3,              // Nuevos fagos liberados al lisar una bacteria infectada
  PHAGE_SPAWN_COOLDOWN: 0.65,       // Tiempo refractario tras la lisis antes de infectar otra célula
  PHAGE_INFECTED_METABOLIC_DRAIN: 0.55, // ATP/s secuestrado por la maquinaria de replicación vírica

  MAX_NEUTROPHILS: 6,
  INITIAL_NEUTROPHIL_COUNT: 2,
  MANUAL_NEUTROPHIL_COUNT: 1,
  NEUTROPHIL_RADIUS: 18.0,
  NEUTROPHIL_SPEED: 46,
  NEUTROPHIL_PERCEPTION_RADIUS: 220,
  NEUTROPHIL_PHAGOCYTOSIS_DPS: 36,  // Lisis enzimática y estallido oxidativo por contacto
  NEUTROPHIL_MAX_PREY: 6,           // Bacterias que puede fagocitar antes de entrar en apoptosis
  NEUTROPHIL_LIFESPAN: 55,          // Segundos de vida útil patrullando la placa
  HOST_AGENT_AUTO_WAVE_INTERVAL: 16, // Segundos para reintroducir oleada si se activó desde el inicio

  // Plasticidad trófica y crecimiento ontogenético (escala min/max de radio según reserva de ATP y metabolismo)
  GROWTH_EQUILIBRIUM_RATIO: 0.62,   // Fracción de energía inicial (62% de splitEnergy) donde la escala es 1.0x
  GROWTH_RANGE_PREDATOR: { min: 0.72, max: 1.42 },
  GROWTH_RANGE_SAPROPHYTE: { min: 0.75, max: 1.36 },
  GROWTH_RANGE_FERMENTER: { min: 0.74, max: 1.34 },
  GROWTH_RANGE_CHEMOHETEROTROPH: { min: 0.78, max: 1.28 },
  GROWTH_RANGE_PHOTOSYNTHETIC: { min: 0.84, max: 1.20 },
  GROWTH_RANGE_CHEMOLITHOTROPH: { min: 0.94, max: 1.06 },

  // Renderizado / Detalle automático
  AUTO_DETAIL_ZOOM_THRESHOLD: 0.65,
  AUTO_DETAIL_POPULATION_THRESHOLD: 450,
} as const;
