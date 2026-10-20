import { SimConfig } from '../config/SimulationConfig';

export class Nutrient {
  public isDead: boolean = false;
  public readonly radius: number;

  constructor(
    public x: number,
    public y: number,
    public energyValue: number = SimConfig.BASE_NUTRIENT_ENERGY,
    public readonly isOrganicCorpse: boolean = false
  ) {
    this.radius = isOrganicCorpse
      ? Math.min(6.0, Math.max(3.2, Math.sqrt(energyValue) * 0.55))
      : 2.6;
  }
}
