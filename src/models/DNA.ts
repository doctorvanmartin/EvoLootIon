import { SimConfig } from '../config/SimulationConfig';

export type MetabolismType = 'photosynthetic' | 'saprophyte' | 'predator' | 'fermenter';
export type MotilityType = 'sessile' | 'flagellated' | 'ciliated';
export type WallType = 'gram_negative' | 'gram_positive' | 'capsule';
export type ReproductionType = 'binary_fission' | 'budding' | 'sporulation';
export type InteractionType = 'neutral' | 'bacteriocins' | 'quorum_sensing';

export interface GenomeTraits {
  metabolism: MetabolismType;
  motility: MotilityType;
  wall: WallType;
  reproduction: ReproductionType;
  interaction: InteractionType;
}

export interface GenomeStats {
  size: number;               // Radio base en px (5 - 15)
  maxSpeed: number;           // Velocidad base (0 - 4.5)
  splitEnergy: number;        // Umbral de fisión (70 - 260)
  basalMetabolism: number;    // Gasto basal derivado del tamaño y armadura
  dragFactor: number;         // Coste locomotor
  toxinPower: number;         // Potencia química (0 - 5.0)
  armor: number;              // Defensa de membrana (0 - 12)
  perceptionRadius: number;   // Quimiotaxis (30 - 160)
  mutationRate: number;       // Tasa de mutación (0.01 - 0.15)
}

const METABOLISM_OPTIONS: readonly MetabolismType[] = ['photosynthetic', 'saprophyte', 'predator', 'fermenter'];
const MOTILITY_OPTIONS: readonly MotilityType[] = ['sessile', 'flagellated', 'ciliated'];
const WALL_OPTIONS: readonly WallType[] = ['gram_negative', 'gram_positive', 'capsule'];
const REPRODUCTION_OPTIONS: readonly ReproductionType[] = ['binary_fission', 'budding', 'sporulation'];
const INTERACTION_OPTIONS: readonly InteractionType[] = ['neutral', 'bacteriocins', 'quorum_sensing'];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class DNA {
  public readonly generation: number;

  constructor(
    public readonly lineageId: string,
    public hue: number,
    public traits: GenomeTraits,
    public stats: GenomeStats,
    generation: number = 1,
    public readonly lineageName: string = lineageId
  ) {
    this.generation = generation;
    this.recalculateDerivedCosts();
  }

  /**
   * Garantiza que los trade-offs físicos (Kleiber, Reynolds y mantenimiento de pared) se cumplan siempre.
   */
  public recalculateDerivedCosts(): void {
    const sizeRatio = this.stats.size / 8.0;
    const wallMultiplier =
      this.traits.wall === 'gram_positive'
        ? 1.35
        : this.traits.wall === 'capsule'
          ? 1.2
          : 1.0;

    if (this.traits.motility === 'sessile') {
      this.stats.maxSpeed = 0;
    }

    if (this.traits.interaction === 'neutral') {
      this.stats.toxinPower = 0;
    }

    // Metabolismo basal proporcional al área/volumen celular (Kleiber) + mantenimiento de pared/armadura
    this.stats.basalMetabolism =
      1.1 * (sizeRatio ** 2) * wallMultiplier + this.stats.armor * 0.08;

    // Ciliadas son más eficientes a baja velocidad; flageladas gastan más en picos
    const motilityFactor =
      this.traits.motility === 'ciliated'
        ? 0.035
        : this.traits.motility === 'flagellated'
          ? 0.055
          : 0;
    this.stats.dragFactor = motilityFactor * sizeRatio * (this.stats.maxSpeed ** 1.8);
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
      else if (category === 1) t.motility = pickRandom(MOTILITY_OPTIONS);
      else if (category === 2) t.wall = pickRandom(WALL_OPTIONS);
      else if (category === 3) t.reproduction = pickRandom(REPRODUCTION_OPTIONS);
      else t.interaction = pickRandom(INTERACTION_OPTIONS);
    }

    // Micro-evolución de estadísticas continuas
    s.size = mutateStat(s.size, 0.8, 5, 15);
    s.maxSpeed = t.motility === 'sessile' ? 0 : mutateStat(Math.max(0.6, s.maxSpeed), 0.35, 0.4, 4.5);
    s.splitEnergy = mutateStat(s.splitEnergy, 12, 70, 260);
    s.toxinPower = t.interaction === 'neutral' ? 0 : mutateStat(Math.max(0.8, s.toxinPower), 0.4, 0.2, 5.0);
    s.armor = mutateStat(s.armor, 0.7, 0, 12);
    s.perceptionRadius = mutateStat(s.perceptionRadius, 8, 30, 160);

    const newHue =
      Math.random() < p ? (this.hue + (Math.random() * 10 - 5) + 360) % 360 : this.hue;

    return new DNA(this.lineageId, newHue, t, s, this.generation + 1, this.lineageName);
  }
}
