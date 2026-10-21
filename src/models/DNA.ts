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

export type CodingStrandErrorKey =
  | 'empty'
  | 'token_count'
  | 'start_codon'
  | 'metabolism_codon'
  | 'size_codon'
  | 'motility_codon'
  | 'speed_codon'
  | 'wall_codon'
  | 'armor_codon'
  | 'reproduction_codon'
  | 'perception_codon'
  | 'interaction_codon'
  | 'toxin_codon'
  | 'adaptation_codon'
  | 'chromophore_codon'
  | 'stop_codon';

export type CodingStrandParseResult =
  | {
      ok: true;
      dna: DNA;
      normalizedStrand: string;
    }
  | {
      ok: false;
      errorKey: CodingStrandErrorKey;
      token?: string;
      expected?: string;
    };

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

const CODON_TO_METABOLISM: Record<string, MetabolismType> = {
  PHO: 'photosynthetic',
  SAP: 'saprophyte',
  PRE: 'predator',
  FER: 'fermenter',
  QUI: 'chemolithotroph',
  HET: 'chemoheterotroph',
};

const CODON_TO_MOTILITY: Record<string, MotilityType> = {
  SES: 'sessile',
  NOM: 'nonmotile',
  FLA: 'flagellated',
  CIL: 'ciliated',
  AXL: 'spirochete',
};

const CODON_TO_WALL: Record<string, WallType> = {
  GRN: 'gram_negative',
  GRP: 'gram_positive',
  CAP: 'capsule',
  SLY: 's_layer',
};

const CODON_TO_REPRODUCTION: Record<string, ReproductionType> = {
  BIN: 'binary_fission',
  GEM: 'budding',
  ESP: 'sporulation',
  CON: 'conjugation',
};

const CODON_TO_INTERACTION: Record<string, InteractionType> = {
  NEU: 'neutral',
  BAC: 'bacteriocins',
  QUO: 'quorum_sensing',
  SID: 'siderophores',
};

const CODON_TO_ADAPTATION: Record<string, AdaptationType> = {
  NON: 'none',
  PIN: 'claws',
  BOC: 'giant_maw',
  PNC: 'spikes',
  LUZ: 'bioluminescence',
  VEN: 'suction_pore',
};

function parsePrefixedNumber(token: string, prefix: string): number | null {
  if (!token.startsWith(prefix)) return null;
  const numPart = token.slice(prefix.length);
  if (!/^\d+(?:\.\d+)?$/.test(numPart)) return null;
  const val = Number(numPart);
  return Number.isFinite(val) ? val : null;
}

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
  private readonly customLineageName?: string;
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
    this.customLineageName = lineageName;
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
   * Analiza y valida una cadena codificante (5' -> 3') de 14 codones (ej.
   * ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG) y reconstruye la instancia DNA.
   */
  public static parseCodingStrand(
    rawStrand: string,
    lineageId: string = 'custom_rival',
    customName?: string
  ): CodingStrandParseResult {
    const cleaned = rawStrand
      .trim()
      .toUpperCase()
      .replace(/^5'\s*(?:->|→)?\s*/, '')
      .replace(/\s*(?:->|→)?\s*3'$/, '')
      .trim();

    if (!cleaned) {
      return { ok: false, errorKey: 'empty' };
    }

    const tokens = cleaned.split(/\s*-\s*/);
    if (tokens.length !== 14) {
      return {
        ok: false,
        errorKey: 'token_count',
        token: String(tokens.length),
        expected: '14',
      };
    }

    if (tokens[0] !== 'ATG') {
      return {
        ok: false,
        errorKey: 'start_codon',
        token: tokens[0],
        expected: 'ATG',
      };
    }

    if (tokens[13] !== 'TAG') {
      return {
        ok: false,
        errorKey: 'stop_codon',
        token: tokens[13],
        expected: 'TAG',
      };
    }

    const metabolism = CODON_TO_METABOLISM[tokens[1]];
    if (!metabolism) {
      return {
        ok: false,
        errorKey: 'metabolism_codon',
        token: tokens[1],
        expected: 'PHO, SAP, PRE, FER, QUI, HET',
      };
    }

    const rawSize = parsePrefixedNumber(tokens[2], 'S');
    if (rawSize === null || rawSize < 5 || rawSize > 15) {
      return {
        ok: false,
        errorKey: 'size_codon',
        token: tokens[2],
        expected: 'S5..S15',
      };
    }

    const motility = CODON_TO_MOTILITY[tokens[3]];
    if (!motility) {
      return {
        ok: false,
        errorKey: 'motility_codon',
        token: tokens[3],
        expected: 'SES, NOM, FLA, CIL, AXL',
      };
    }

    const rawSpeedCodon = parsePrefixedNumber(tokens[4], 'V');
    if (rawSpeedCodon === null || rawSpeedCodon < 0 || rawSpeedCodon > 65) {
      return {
        ok: false,
        errorKey: 'speed_codon',
        token: tokens[4],
        expected: 'V0..V65',
      };
    }

    const wall = CODON_TO_WALL[tokens[5]];
    if (!wall) {
      return {
        ok: false,
        errorKey: 'wall_codon',
        token: tokens[5],
        expected: 'GRN, GRP, CAP, SLY',
      };
    }

    const rawArmorCodon = parsePrefixedNumber(tokens[6], 'A');
    if (rawArmorCodon === null || rawArmorCodon < 0 || rawArmorCodon > 120) {
      return {
        ok: false,
        errorKey: 'armor_codon',
        token: tokens[6],
        expected: 'A0..A120',
      };
    }

    const reproduction = CODON_TO_REPRODUCTION[tokens[7]];
    if (!reproduction) {
      return {
        ok: false,
        errorKey: 'reproduction_codon',
        token: tokens[7],
        expected: 'BIN, GEM, ESP, CON',
      };
    }

    const rawPerceptionCodon = parsePrefixedNumber(tokens[8], 'P');
    if (rawPerceptionCodon === null || rawPerceptionCodon < 4 || rawPerceptionCodon > 16) {
      return {
        ok: false,
        errorKey: 'perception_codon',
        token: tokens[8],
        expected: 'P4..P16',
      };
    }

    const interaction = CODON_TO_INTERACTION[tokens[9]];
    if (!interaction) {
      return {
        ok: false,
        errorKey: 'interaction_codon',
        token: tokens[9],
        expected: 'NEU, BAC, QUO, SID',
      };
    }

    const rawToxinCodon = parsePrefixedNumber(tokens[10], 'T');
    if (rawToxinCodon === null || rawToxinCodon < 0 || rawToxinCodon > 50) {
      return {
        ok: false,
        errorKey: 'toxin_codon',
        token: tokens[10],
        expected: 'T0..T50',
      };
    }

    const adaptation = CODON_TO_ADAPTATION[tokens[11]];
    if (!adaptation) {
      return {
        ok: false,
        errorKey: 'adaptation_codon',
        token: tokens[11],
        expected: 'NON, PIN, BOC, PNC, LUZ, VEN',
      };
    }

    const rawHueCodon = parsePrefixedNumber(tokens[12], 'H');
    if (rawHueCodon === null || rawHueCodon < 0 || rawHueCodon > 360) {
      return {
        ok: false,
        errorKey: 'chromophore_codon',
        token: tokens[12],
        expected: 'H0..H360',
      };
    }

    const traits: GenomeTraits = {
      metabolism,
      motility,
      wall,
      reproduction,
      interaction,
      adaptation,
    };

    const size = Math.min(15, Math.max(5, rawSize));
    let maxSpeed = 0;
    if (motility !== 'sessile' && motility !== 'nonmotile') {
      const effSpeed = rawSpeedCodon / 10;
      const motilityMult =
        motility === 'flagellated'
          ? SimConfig.FLAGELLA_SPEED_MULTIPLIER
          : motility === 'spirochete'
            ? SimConfig.SPIROCHETE_SPEED_MULTIPLIER
            : SimConfig.CILIA_SPEED_MULTIPLIER;
      const clawPenalty = adaptation === 'claws' ? 0.8 : 1.0;
      const rawBaseSpeed = effSpeed / (motilityMult * clawPenalty);
      maxSpeed = Math.min(4.5, Math.max(0.5, Number(rawBaseSpeed.toFixed(4))));
    }

    const armor = Math.min(12, Math.max(0, Number((rawArmorCodon / 10).toFixed(2))));
    const perceptionRadius = Math.min(160, Math.max(40, Math.round(rawPerceptionCodon * 10)));
    const toxinPower =
      interaction === 'neutral' || interaction === 'siderophores'
        ? 0
        : Math.min(5.0, Math.max(0, Number((rawToxinCodon / 10).toFixed(2))));
    const splitEnergy = Math.round(95 + size * 5.5);
    const hue = ((Math.round(rawHueCodon) % 360) + 360) % 360;

    const stats: GenomeStats = {
      size,
      maxSpeed,
      splitEnergy,
      basalMetabolism: 0,
      dragFactor: 0,
      toxinPower,
      armor,
      perceptionRadius,
      mutationRate: 0.05,
    };

    const trimmedName = customName?.trim() || undefined;
    const dna = new DNA(lineageId, hue, traits, stats, 1, trimmedName);
    return {
      ok: true,
      dna,
      normalizedStrand: dna.codingStrand,
    };
  }

  public static fromCodingStrand(
    rawStrand: string,
    lineageId: string = 'custom_rival',
    customName?: string
  ): CodingStrandParseResult {
    return DNA.parseCodingStrand(rawStrand, lineageId, customName);
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

    const nextName =
      this.lineageId === 'player_strain' || this.customLineageName
        ? this.lineageName
        : undefined;
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
