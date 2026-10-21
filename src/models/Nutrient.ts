import { SimConfig } from '../config/SimulationConfig';

export type SubstrateShape =
  | 'hex_crystal'
  | 'rhomboid'
  | 'glucose_granule'
  | 'amino_cluster'
  | 'mineral_shard'
  | 'corpse_detritus';

const MINERAL_SHAPES: readonly SubstrateShape[] = [
  'hex_crystal',
  'rhomboid',
  'glucose_granule',
  'amino_cluster',
  'mineral_shard',
];

export class Nutrient {
  public isDead: boolean = false;
  public readonly radius: number;
  public readonly angle: number;
  public readonly shape: SubstrateShape;
  public readonly hue: number;
  public readonly aspect: number;

  constructor(
    public x: number,
    public y: number,
    public energyValue: number = SimConfig.BASE_NUTRIENT_ENERGY,
    public readonly isOrganicCorpse: boolean = false,
    corpseHue?: number,
    corpseAngle?: number
  ) {
    if (isOrganicCorpse) {
      this.radius = Math.min(7.2, Math.max(4.0, Math.sqrt(energyValue) * 0.64));
      this.angle = corpseAngle ?? Math.random() * Math.PI * 2;
      this.shape = 'corpse_detritus';
      this.hue = corpseHue ?? 38;
      this.aspect = 0.62 + Math.random() * 0.22;
    } else {
      const idx = Math.floor(Math.random() * MINERAL_SHAPES.length);
      this.shape = MINERAL_SHAPES[idx];
      this.radius = 2.4 + Math.random() * 1.3;
      this.angle = Math.random() * Math.PI * 2;
      this.hue = 132 + Math.round((Math.random() - 0.5) * 38);
      this.aspect = 0.68 + Math.random() * 0.3;
    }
  }
}

