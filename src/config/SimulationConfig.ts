export const SimConfig = {
  CELL_SIZE: 64,
  MAX_NUTRIENTS: 220,
  INITIAL_NUTRIENTS: 90,
  NUTRIENT_SPAWN_RATE: 0.35,
  BASE_NUTRIENT_ENERGY: 25,
  CORPSE_ENERGY_RATIO: 0.45,
  INITIAL_COLONY_SIZE: 20,

  // Constantes bioenergéticas y cinética de Michaelis-Menten
  PHOTOSYNTHESIS_RATE: 9.5,
  LIGHT_HALF_SATURATION: 0.35,      // K_I para fotosíntesis
  SUBSTRATE_HALF_SATURATION: 30.0,  // K_S para absorción saprófita/fermentadora
  SAPROPHYTE_CORPSE_BONUS: 1.4,     // Eficiencia extra de saprófitas sobre detritus orgánico
  FERMENTER_MULTIPLIER: 1.35,       // Asimilación rápida de fermentadoras
  PREDATION_EFFICIENCY: 0.7,
  PREDATION_BITE_DPS: 28,
  REPLICATION_COST_RATIO: 0.15,

  // Interacción, Guerra Química y Esporulación
  TOXIN_RADIUS: 48,
  TOXIN_DAMAGE_FACTOR: 16,
  TOXIN_ENERGY_COST: 0.22,
  QUORUM_RADIUS: 60,
  QUORUM_MIN_ALLIES: 3,
  SPORULATION_THRESHOLD: 12,        // Energía crítica para entrar en espora
  SPORE_WAKE_MULTIPLIER: 2.2,       // Factor sobre umbral para germinar
  SPORE_METABOLISM_FACTOR: 0.05,    // Consumo basal reducido al 5%

  // Evolución
  MACRO_MUTATION_CHANCE: 0.005,     // 0.5% de probabilidad de mutar un rasgo cualitativo

  // Renderizado / LOD
  LOD_ZOOM_THRESHOLD: 0.65,
  LOD_POPULATION_THRESHOLD: 450,
} as const;
