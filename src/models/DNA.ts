import { SimConfig } from '../config/SimulationConfig';

export type MetabolismType =
  | 'photosynthetic'
  | 'saprophyte'
  | 'predator'
  | 'fermenter'
  | 'chemolithotroph'
  | 'chemoheterotroph';
export type MotilityType = 'sessile' | 'nonmotile' | 'flagellated' | 'ciliated' | 'spirochete';
export type WallType = 'gram_negative' | 'gram_positive' | 'capsule' | 's_layer';
export type ReproductionType = 'binary_fission' | 'budding' | 'sporulation' | 'conjugation';
export type InteractionType = 'neutral' | 'bacteriocins' | 'quorum_sensing' | 'siderophores';
export type CellMorphology = 'coccus' | 'coccus_cluster' | 'rod' | 'curved_rod';
export type AdaptationType =
  | 'none'
  | 'claws'
  | 'giant_maw'
  | 'spikes'
  | 'bioluminescence'
  | 'suction_pore';

export interface ReferenceSpeciesProfile {
  id: string;
  scientificName: string;
  morphology: CellMorphology;
}

export interface GenomeTraits {
  metabolism: MetabolismType;
  motility: MotilityType;
  wall: WallType;
  reproduction: ReproductionType;
  interaction: InteractionType;
  adaptation?: AdaptationType;
}

export interface GenomeStats {
  size: number;               // Radio base en px (5 - 15)
  maxSpeed: number;           // Potencia locomotora base (0 - 4.5)
  splitEnergy: number;        // Umbral de fisión (70 - 260)
  basalMetabolism: number;    // Gasto basal derivado del tamaño, pared y adaptaciones
  dragFactor: number;         // Coste locomotor hidrodinámico
  toxinPower: number;         // Potencia química (0 - 5.0)
  armor: number;              // Defensa de membrana (0 - 12)
  perceptionRadius: number;   // Quimiotaxis / Sensores (40 - 160)
  mutationRate: number;       // Tasa de mutación (0.01 - 0.15)
}

export interface CodonSegment {
  code: string;
  label: string;
  category: 'start' | 'trait' | 'stats' | 'adaptation' | 'chromophore' | 'stop';
}

export interface CategoryLociMap {
  metabolismLocus: string;
  motilityLocus: string;
  wallLocus: string;
  reproductionLocus: string;
  interactionLocus: string;
  adaptationLocus: string;
  chromophoreLocus: string;
}

export const METABOLISM_CODONS: Record<MetabolismType, string> = {
  photosynthetic: 'PHO',
  saprophyte: 'SAP',
  predator: 'PRE',
  fermenter: 'FER',
  chemolithotroph: 'QUI',
  chemoheterotroph: 'HET',
};

export const MOTILITY_CODONS: Record<MotilityType, string> = {
  sessile: 'SES',
  nonmotile: 'NOM',
  flagellated: 'FLA',
  ciliated: 'CIL',
  spirochete: 'AXL',
};

export const WALL_CODONS: Record<WallType, string> = {
  gram_negative: 'GRN',
  gram_positive: 'GRP',
  capsule: 'CAP',
  s_layer: 'SLY',
};

export const REPRODUCTION_CODONS: Record<ReproductionType, string> = {
  binary_fission: 'BIN',
  budding: 'GEM',
  sporulation: 'ESP',
  conjugation: 'CON',
};

export const INTERACTION_CODONS: Record<InteractionType, string> = {
  neutral: 'NEU',
  bacteriocins: 'BAC',
  quorum_sensing: 'QUO',
  siderophores: 'SID',
};

export const ADAPTATION_CODONS: Record<AdaptationType, string> = {
  none: 'NON',
  claws: 'PIN',
  giant_maw: 'BOC',
  spikes: 'PNC',
  bioluminescence: 'LUZ',
  suction_pore: 'VEN',
};

const METABOLISM_OPTIONS: readonly MetabolismType[] = [
  'photosynthetic',
  'saprophyte',
  'predator',
  'fermenter',
  'chemolithotroph',
  'chemoheterotroph',
];
const MOTILITY_OPTIONS: readonly MotilityType[] = [
  'sessile',
  'nonmotile',
  'flagellated',
  'ciliated',
  'spirochete',
];
const MOBILE_MOTILITY_OPTIONS: readonly MotilityType[] = [
  'flagellated',
  'ciliated',
  'spirochete',
];
const NON_SESSILE_MOTILITY_OPTIONS: readonly MotilityType[] = [
  'nonmotile',
  ...MOBILE_MOTILITY_OPTIONS,
];
const WALL_OPTIONS: readonly WallType[] = [
  'gram_negative',
  'gram_positive',
  'capsule',
  's_layer',
];
const REPRODUCTION_OPTIONS: readonly ReproductionType[] = [
  'binary_fission',
  'budding',
  'sporulation',
  'conjugation',
];
const INTERACTION_OPTIONS: readonly InteractionType[] = [
  'neutral',
  'bacteriocins',
  'quorum_sensing',
  'siderophores',
];
const ADAPTATION_OPTIONS: readonly AdaptationType[] = [
  'claws',
  'giant_maw',
  'spikes',
  'bioluminescence',
  'suction_pore',
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRange(min: number, max: number, step: number = 0.1): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / step) * step;
}

export class DNA {
  public readonly generation: number;
  public readonly lineageName: string;
  public codingStrand: string = '';

  constructor(
    public readonly lineageId: string,
    public hue: number,
    public traits: GenomeTraits,
    public stats: GenomeStats,
    generation: number = 1,
    lineageName?: string,
    public readonly referenceSpecies?: ReferenceSpeciesProfile
  ) {
    if (!this.traits.adaptation) {
      this.traits.adaptation = 'none';
    }
    this.generation = generation;
    this.recalculateDerivedCosts();
    this.lineageName =
      lineageName ||
      referenceSpecies?.scientificName ||
      DNA.generateProceduralName(this.traits, this.stats);
  }

  /**
   * Calcula la velocidad efectiva real teniendo en cuenta la biofísica del apéndice
   * (los flagelos rotatorios dan mayor velocidad punta que los cilios) y el peso de adaptaciones.
   */
  public static computeEffectiveSpeed(traits: GenomeTraits, rawSpeed: number): number {
    if (traits.motility === 'sessile' || traits.motility === 'nonmotile') return 0;
    const motilityMult =
      traits.motility === 'flagellated'
        ? SimConfig.FLAGELLA_SPEED_MULTIPLIER
        : traits.motility === 'spirochete'
          ? SimConfig.SPIROCHETE_SPEED_MULTIPLIER
          : SimConfig.CILIA_SPEED_MULTIPLIER;

    const clawPenalty = traits.adaptation === 'claws' ? 0.8 : 1.0;
    return rawSpeed * motilityMult * clawPenalty;
  }

  public getEffectiveMaxSpeed(): number {
    return DNA.computeEffectiveSpeed(this.traits, this.stats.maxSpeed);
  }

  /**
   * Construye los loci emparejados de cada categoría biológica con su parámetro cuantitativo.
   */
  public static buildCategoryLoci(
    traits: GenomeTraits,
    stats: GenomeStats,
    hue: number = 155
  ): CategoryLociMap {
    const cMeta = METABOLISM_CODONS[traits.metabolism];
    const sCode = `S${Math.round(stats.size)}`;

    const cMot = MOTILITY_CODONS[traits.motility];
    const effSpeed = DNA.computeEffectiveSpeed(traits, stats.maxSpeed);
    const vCode = `V${Math.round(effSpeed * 10)}`;

    const cWall = WALL_CODONS[traits.wall];
    const aCode = `A${Math.round(stats.armor * 10)}`;

    const cRepro = REPRODUCTION_CODONS[traits.reproduction];
    const pCode = `P${Math.round(stats.perceptionRadius / 10)}`;

    const cInter = INTERACTION_CODONS[traits.interaction];
    const tCode = `T${Math.round(stats.toxinPower * 10)}`;

    const cAdapt = ADAPTATION_CODONS[traits.adaptation || 'none'];
    const hCode = `H${Math.round((hue + 360) % 360)}`;

    return {
      metabolismLocus: `${cMeta}-${sCode}`,
      motilityLocus: `${cMot}-${vCode}`,
      wallLocus: `${cWall}-${aCode}`,
      reproductionLocus: `${cRepro}-${pCode}`,
      interactionLocus: `${cInter}-${tCode}`,
      adaptationLocus: cAdapt,
      chromophoreLocus: hCode,
    };
  }

  public getCategoryLoci(): CategoryLociMap {
    return DNA.buildCategoryLoci(this.traits, this.stats, this.hue);
  }

  /**
   * Construye la secuencia genética codificante (5' -> 3') emparejando cada rasgo
   * con su atributo cuantitativo inmediatamente después (ej. FLA-V30).
   */
  public static formatCodingStrand(traits: GenomeTraits, stats: GenomeStats, hue: number = 155): string {
    const loci = DNA.buildCategoryLoci(traits, stats, hue);
    return `ATG-${loci.metabolismLocus}-${loci.motilityLocus}-${loci.wallLocus}-${loci.reproductionLocus}-${loci.interactionLocus}-${loci.adaptationLocus}-${loci.chromophoreLocus}-TAG`;
  }

  /**
   * Devuelve los segmentos desglosados de la cadena codificante para su visualización.
   */
  public getCodonSegments(): CodonSegment[] {
    const loci = this.getCategoryLoci();
    const [cMeta, sCode] = loci.metabolismLocus.split('-');
    const [cMot, vCode] = loci.motilityLocus.split('-');
    const [cWall, aCode] = loci.wallLocus.split('-');
    const [cRepro, pCode] = loci.reproductionLocus.split('-');
    const [cInter, tCode] = loci.interactionLocus.split('-');

    return [
      { code: 'ATG', label: 'Codón de Inicio (Metionina)', category: 'start' },
      { code: cMeta, label: 'Tipo de Metabolismo', category: 'trait' },
      { code: sCode, label: 'Tamaño Celular (Radio)', category: 'stats' },
      { code: cMot, label: 'Apéndice de Locomoción', category: 'trait' },
      { code: vCode, label: 'Velocidad Efectiva de Nado', category: 'stats' },
      { code: cWall, label: 'Estructura de Pared', category: 'trait' },
      { code: aCode, label: 'Armadura de Membrana', category: 'stats' },
      { code: cRepro, label: 'Estrategia Reproductiva', category: 'trait' },
      { code: pCode, label: 'Alcance Sensorial (Quimiotaxis)', category: 'stats' },
      { code: cInter, label: 'Interacción / Guerra Química', category: 'trait' },
      { code: tCode, label: 'Potencia Química', category: 'stats' },
      { code: loci.adaptationLocus, label: 'Atributo Especial Único', category: 'adaptation' },
      { code: loci.chromophoreLocus, label: 'Pigmento Genético (Hue)', category: 'chromophore' },
      { code: 'TAG', label: 'Codón de Parada (Ámbar)', category: 'stop' },
    ];
  }

  /**
   * Genera un nombre taxonómico combinado de forma procedural uniendo partículas
   * morfológicas, metabólicas, estructurales, locomotoras y cuantitativas.
   */
  public static generateProceduralName(traits: GenomeTraits, stats: GenomeStats): string {
    // 1. Prefijo de escala celular según tamaño (size)
    const sizePrefix =
      stats.size >= 10.5 ? 'Mega' : stats.size <= 6.8 ? 'Micro' : '';

    // 2. Raíz trófica según metabolismo
    const metaRootMap: Record<MetabolismType, string> = {
      photosynthetic: 'cyano',
      saprophyte: 'sapro',
      predator: 'phago',
      fermenter: 'zymo',
      chemolithotroph: 'litho',
      chemoheterotroph: 'chemo',
    };
    const metaRoot = metaRootMap[traits.metabolism];

    // 3. Sufijo morfológico-estructural según pared celular
    const wallSuffixMap: Record<WallType, string> = {
      gram_negative: 'vibrio',
      gram_positive: 'bacillus',
      capsule: 'coccus',
      s_layer: 'archaea',
    };
    const wallSuffix = wallSuffixMap[traits.wall];

    const rawGenus = `${sizePrefix}${metaRoot}${wallSuffix}`;
    const genus = rawGenus.charAt(0).toUpperCase() + rawGenus.slice(1);

    // 4. Epíteto específico combinado: Motilidad + Interacción + Reproducción
    const motilityPartMap: Record<MotilityType, string> = {
      flagellated: 'flagel',
      ciliated: 'cili',
      sessile: 'sessi',
      nonmotile: 'apode',
      spirochete: 'spiro',
    };
    const interactionPartMap: Record<InteractionType, string> = {
      bacteriocins: 'toxi',
      quorum_sensing: 'quor',
      neutral: 'neutr',
      siderophores: 'sidero',
    };
    const reproductionPartMap: Record<ReproductionType, string> = {
      binary_fission: 'fissa',
      budding: 'gemma',
      sporulation: 'spora',
      conjugation: 'conjuga',
    };

    const species = `${motilityPartMap[traits.motility]}${interactionPartMap[traits.interaction]}${reproductionPartMap[traits.reproduction]}`;

    // 5. Modificadores adicionales según atributos especiales y cuantitativos destacados
    const statParts: string[] = [];
    const adaptationPartMap: Record<AdaptationType, string> = {
      none: '',
      claws: 'chelata',
      giant_maw: 'vorax',
      spikes: 'echinata',
      bioluminescence: 'lucens',
      suction_pore: 'haustor',
    };
    const adaptTag = adaptationPartMap[traits.adaptation || 'none'];
    if (adaptTag) statParts.push(adaptTag);

    const effSpeed = DNA.computeEffectiveSpeed(traits, stats.maxSpeed);
    if (traits.motility !== 'sessile' && traits.motility !== 'nonmotile') {
      if (effSpeed >= 2.8) statParts.push('velox');
      else if (effSpeed <= 1.1) statParts.push('lenta');
    }
    if (stats.armor >= 6.0) statParts.push('ferrea');
    else if (stats.armor <= 1.5) statParts.push('tenuis');

    if (traits.interaction !== 'neutral' && stats.toxinPower >= 2.6) {
      statParts.push('letalis');
    }

    const statSuffix = statParts.length > 0 ? ` ${statParts.join('-')}` : '';
    return `${genus} ${species}${statSuffix}`;
  }

  /**
   * Genera un genoma rival completamente aleatorio pero biológicamente coherente.
   */
  public static createRandomRival(
    lineageId: string,
    hue: number,
    preferredMetabolism?: MetabolismType,
    allowSessileMotility: boolean = true
  ): DNA {
    const metabolism = preferredMetabolism ?? pickRandom(METABOLISM_OPTIONS);

    // Una bacteria predadora no puede ser sésil (moriría de inanición al no poder cazar)
    const motilityPool: readonly MotilityType[] =
      metabolism === 'predator'
        ? MOBILE_MOTILITY_OPTIONS
        : allowSessileMotility
          ? MOTILITY_OPTIONS
          : NON_SESSILE_MOTILITY_OPTIONS;
    const motility = pickRandom(motilityPool);

    const wall = pickRandom(WALL_OPTIONS);
    const reproduction = pickRandom(REPRODUCTION_OPTIONS);
    const interaction = pickRandom(INTERACTION_OPTIONS);
    const adaptation: AdaptationType = 'none';

    const size = randomRange(6.0, 12.5, 0.5);
    const maxSpeed =
      motility === 'sessile' || motility === 'nonmotile'
        ? 0
        : randomRange(1.0, 3.4, 0.2);
    const splitEnergy = Math.round(95 + size * 5.5 + randomRange(-10, 18, 1));
    const toxinPower = interaction === 'neutral' ? 0 : randomRange(0.8, 3.6, 0.2);
    const armor = randomRange(0.5, 8.5, 0.5);
    const perceptionRadius = randomRange(70, 140, 10);
    const mutationRate = randomRange(0.03, 0.08, 0.01);

    const traits: GenomeTraits = {
      metabolism,
      motility,
      wall,
      reproduction,
      interaction,
      adaptation,
    };

    const stats: GenomeStats = {
      size,
      maxSpeed,
      splitEnergy,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower,
      armor,
      perceptionRadius,
      mutationRate,
    };

    return new DNA(lineageId, hue, traits, stats, 1);
  }

  /**
   * Garantiza que los trade-offs físicos (Kleiber, Reynolds, pared y adaptaciones únicas) se cumplan siempre.
   */
  public recalculateDerivedCosts(): void {
    const sizeRatio = this.stats.size / 8.0;
    const wallMultiplier =
      this.traits.wall === 'gram_positive'
        ? 1.32
        : this.traits.wall === 's_layer'
          ? 1.24
          : this.traits.wall === 'capsule'
            ? 1.18
            : 1.0;

    if (this.traits.motility === 'sessile' || this.traits.motility === 'nonmotile') {
      this.stats.maxSpeed = 0;
    }

    if (this.traits.interaction === 'neutral') {
      this.stats.toxinPower = 0;
    }

    // Costes y penalizaciones de los atributos únicos (adaptaciones especiales)
    const adapt = this.traits.adaptation || 'none';
    const adaptationBasalCost =
      adapt === 'claws'
        ? 0.28
        : adapt === 'giant_maw'
          ? 0.22
          : adapt === 'spikes'
            ? 0.25
            : adapt === 'bioluminescence'
              ? 0.36
              : adapt === 'suction_pore'
                ? 0.2
                : 0;

    // Capa S cristalina reduce en un 25% el coste de mantenimiento por unidad de armadura
    const armorMaintenanceRate = this.traits.wall === 's_layer' ? 0.06 : 0.08;

    // Metabolismo basal proporcional al área/volumen celular (Kleiber) + pared + armadura + adaptación
    this.stats.basalMetabolism =
      0.95 * (sizeRatio ** 2) * wallMultiplier +
      this.stats.armor * armorMaintenanceRate +
      adaptationBasalCost +
      SimConfig.SENSOR_MAINTENANCE_MAX_COST *
        (this.stats.perceptionRadius / 160) ** 2;

    // Factor de arrastre hidrodinámico según apéndice locomotor y penalización por espinas
    const motilityFactor =
      this.traits.motility === 'ciliated'
        ? 0.028
        : this.traits.motility === 'spirochete'
          ? 0.038
          : this.traits.motility === 'flagellated'
            ? 0.048
            : 0;

    const spikesDragPenalty = adapt === 'spikes' ? 1.35 : 1.0;
    this.stats.dragFactor =
      motilityFactor * spikesDragPenalty * sizeRatio * (this.stats.maxSpeed ** 1.75);

    this.codingStrand = DNA.formatCodingStrand(this.traits, this.stats, this.hue);
  }

  public cloneWithMutation(): DNA {
    const s: GenomeStats = { ...this.stats };
    const t: GenomeTraits = { ...this.traits };
    const p = s.mutationRate;

    const mutateStat = (val: number, variance: number, min: number, max: number): number => {
      if (Math.random() >= p) return val;
      // Aproximación gaussiana rápida (Irwin-Hall de 2 uniformes)
      const gauss = (Math.random() + Math.random()) - 1;
      return Math.min(max, Math.max(min, val + gauss * variance));
    };

    // Macro-evolución ocasional: mutación puntual de rasgo cualitativo
    if (Math.random() < SimConfig.MACRO_MUTATION_CHANCE) {
      const category = Math.floor(Math.random() * 5);
      if (category === 0) t.metabolism = pickRandom(METABOLISM_OPTIONS);
      else if (category === 1) t.motility = pickRandom(NON_SESSILE_MOTILITY_OPTIONS);
      else if (category === 2) t.wall = pickRandom(WALL_OPTIONS);
      else if (category === 3) t.reproduction = pickRandom(REPRODUCTION_OPTIONS);
      else if (category === 4) t.interaction = pickRandom(INTERACTION_OPTIONS);
    }

    if ((t.adaptation || 'none') === 'none' && Math.random() < SimConfig.ADAPTATION_GAIN_CHANCE) {
      t.adaptation = pickRandom(ADAPTATION_OPTIONS);
    }

    // Micro-evolución de estadísticas continuas
    s.size = mutateStat(s.size, 0.8, 5, 15);
    s.maxSpeed =
      t.motility === 'sessile' || t.motility === 'nonmotile'
        ? 0
        : mutateStat(Math.max(0.6, s.maxSpeed), 0.35, 0.4, 4.5);
    s.splitEnergy = mutateStat(s.splitEnergy, 12, 70, 260);
    s.toxinPower = t.interaction === 'neutral' ? 0 : mutateStat(Math.max(0.8, s.toxinPower), 0.4, 0.2, 5.0);
    s.armor = mutateStat(s.armor, 0.7, 0, 12);
    s.perceptionRadius = mutateStat(s.perceptionRadius, 8, 40, 160);

    const newHue =
      Math.random() < p ? (this.hue + (Math.random() * 10 - 5) + 360) % 360 : this.hue;

    const nextName = this.lineageId === 'player_strain' ? this.lineageName : undefined;
    return new DNA(
      this.lineageId,
      newHue,
      t,
      s,
      this.generation + 1,
      nextName,
      this.referenceSpecies
    );
  }
}
