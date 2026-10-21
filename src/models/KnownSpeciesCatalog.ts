import {
  DNA,
  GenomeStats,
  GenomeTraits,
  ReferenceSpeciesProfile,
} from './DNA';

export type KnownSpeciesId =
  | 'salmonella_enterica'
  | 'helicobacter_pylori'
  | 'escherichia_coli'
  | 'staphylococcus_aureus'
  | 'pseudomonas_aeruginosa'
  | 'bacillus_subtilis';

interface KnownSpeciesPreset extends ReferenceSpeciesProfile {
  traits: GenomeTraits;
  stats: GenomeStats;
}

const commonTraits = {
  metabolism: 'chemoheterotroph',
  reproduction: 'binary_fission',
  interaction: 'neutral',
  adaptation: 'none',
} as const;

// Valores continuos normalizados para el balance del juego; los rasgos categóricos describen los perfiles de referencia.
export const KNOWN_SPECIES: readonly KnownSpeciesPreset[] = [
  {
    id: 'salmonella_enterica',
    scientificName: 'Salmonella enterica serovar Typhimurium',
    morphology: 'rod',
    traits: {
      ...commonTraits,
      motility: 'flagellated',
      wall: 'gram_negative',
    },
    stats: {
      size: 8,
      maxSpeed: 2.8,
      splitEnergy: 139,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 0,
      armor: 1.7,
      perceptionRadius: 120,
      mutationRate: 0.04,
    },
  },
  {
    id: 'helicobacter_pylori',
    scientificName: 'Helicobacter pylori',
    morphology: 'curved_rod',
    traits: {
      ...commonTraits,
      motility: 'flagellated',
      wall: 'gram_negative',
    },
    stats: {
      size: 7.5,
      maxSpeed: 2.2,
      splitEnergy: 136,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 0,
      armor: 1.8,
      perceptionRadius: 130,
      mutationRate: 0.035,
    },
  },
  {
    id: 'escherichia_coli',
    scientificName: 'Escherichia coli K-12',
    morphology: 'rod',
    traits: {
      ...commonTraits,
      motility: 'flagellated',
      wall: 'gram_negative',
    },
    stats: {
      size: 7.5,
      maxSpeed: 2.7,
      splitEnergy: 136,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 0,
      armor: 1.5,
      perceptionRadius: 115,
      mutationRate: 0.05,
    },
  },
  {
    id: 'staphylococcus_aureus',
    scientificName: 'Staphylococcus aureus',
    morphology: 'coccus_cluster',
    traits: {
      ...commonTraits,
      motility: 'nonmotile',
      wall: 'gram_positive',
    },
    stats: {
      size: 6.5,
      maxSpeed: 0,
      splitEnergy: 131,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 0,
      armor: 2.2,
      perceptionRadius: 85,
      mutationRate: 0.04,
    },
  },
  {
    id: 'pseudomonas_aeruginosa',
    scientificName: 'Pseudomonas aeruginosa PAO1',
    morphology: 'rod',
    traits: {
      ...commonTraits,
      motility: 'flagellated',
      wall: 'gram_negative',
      interaction: 'quorum_sensing',
    },
    stats: {
      size: 9,
      maxSpeed: 3.2,
      splitEnergy: 145,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 1.8,
      armor: 1.4,
      perceptionRadius: 130,
      mutationRate: 0.045,
    },
  },
  {
    id: 'bacillus_subtilis',
    scientificName: 'Bacillus subtilis 168',
    morphology: 'rod',
    traits: {
      ...commonTraits,
      motility: 'flagellated',
      wall: 'gram_positive',
      reproduction: 'sporulation',
    },
    stats: {
      size: 9,
      maxSpeed: 2.7,
      splitEnergy: 145,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower: 0,
      armor: 2.2,
      perceptionRadius: 110,
      mutationRate: 0.04,
    },
  },
];

export function isKnownSpeciesId(value: string): value is KnownSpeciesId {
  return KNOWN_SPECIES.some((species) => species.id === value);
}

export function createKnownSpeciesDNA(speciesId: KnownSpeciesId, hue: number): DNA {
  const preset = KNOWN_SPECIES.find((species) => species.id === speciesId);
  if (!preset) {
    throw new Error(`Unknown reference species: ${speciesId}`);
  }

  return new DNA(
    `known_${preset.id}`,
    hue,
    { ...preset.traits },
    { ...preset.stats },
    1,
    preset.scientificName,
    preset
  );
}
