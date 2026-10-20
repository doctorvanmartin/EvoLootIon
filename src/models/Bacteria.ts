import { DNA } from './DNA';
import { Nutrient } from './Nutrient';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { SimConfig } from '../config/SimulationConfig';

let nextBacteriaId = 1;

export class Bacteria {
  public readonly id: number;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = Math.random() * Math.PI * 2;
  public energy: number;
  public age: number = 0;
  public isDead: boolean = false;
  public isSpore: boolean = false;
  public isEmittingToxin: boolean = false;
  public animPhase: number = Math.random() * 100;

  // Buffers estáticos reutilizables para consultas espaciales sin GC
  private static readonly neighborNutrientsBuf: Nutrient[] = [];
  private static readonly contactNutrientsBuf: Nutrient[] = [];
  private static readonly neighborBacteriaBuf: Bacteria[] = [];

  constructor(
    public x: number,
    public y: number,
    public dna: DNA,
    initialEnergy?: number
  ) {
    this.id = nextBacteriaId++;
    this.energy = initialEnergy ?? dna.stats.splitEnergy * 0.55;
  }

  public get radius(): number {
    return this.dna.stats.size;
  }

  public update(
    dt: number,
    gridNutrients: SpatialHashGrid<Nutrient>,
    gridBacteria: SpatialHashGrid<Bacteria>,
    bounds: { width: number; height: number }
  ): Bacteria | null {
    if (this.energy <= 0) {
      this.isDead = true;
      return null;
    }

    this.age += dt;
    this.isEmittingToxin = false;

    // 1. Gestión de Esporulación (Estado latente defensivo ante hambruna)
    if (this.dna.traits.reproduction === 'sporulation') {
      if (!this.isSpore && this.energy < SimConfig.SPORULATION_THRESHOLD) {
        this.isSpore = true;
        this.vx = 0;
        this.vy = 0;
      } else if (
        this.isSpore &&
        this.energy > SimConfig.SPORULATION_THRESHOLD * SimConfig.SPORE_WAKE_MULTIPLIER
      ) {
        this.isSpore = false;
      }
    }

    if (this.isSpore) {
      // Una endospora consume solo un 5% del metabolismo basal y absorbe nutrientes por contacto pasivo
      this.energy -= this.dna.stats.basalMetabolism * SimConfig.SPORE_METABOLISM_FACTOR * dt;
      if (this.dna.traits.metabolism === 'photosynthetic') {
        this.energy += SimConfig.PHOTOSYNTHESIS_RATE * 0.25 * dt;
      }
      this.consumeNearbyNutrients(gridNutrients);
      if (this.energy <= 0) {
        this.isDead = true;
      }
      return null;
    }

    // 2. Búsqueda de entorno en O(1) usando buffers preasignados (Zero-GC)
    const nearbyNutrients = gridNutrients.queryRadius(
      this.x,
      this.y,
      this.dna.stats.perceptionRadius,
      Bacteria.neighborNutrientsBuf
    );
    const nearbyBacteria = gridBacteria.queryRadius(
      this.x,
      this.y,
      this.dna.stats.perceptionRadius,
      Bacteria.neighborBacteriaBuf
    );

    // 3. Quimiotaxis y locomoción
    this.computeLocomotion(nearbyNutrients, nearbyBacteria, bounds);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.handleBoundaryCollisions(bounds);

    const currentSpeed = Math.hypot(this.vx, this.vy) / 30;
    this.animPhase += dt * (2 + currentSpeed * 2.5);

    // 4. Balance energético (Ingreso vs Gasto)
    let energyDrain =
      this.dna.stats.basalMetabolism + this.dna.stats.dragFactor * (currentSpeed ** 2);

    // Guerra química y Quorum Sensing
    if (this.dna.traits.interaction !== 'neutral' && this.dna.stats.toxinPower > 0) {
      const canEmit = this.checkQuorumCondition(nearbyBacteria);
      if (canEmit) {
        this.isEmittingToxin = true;
        energyDrain += this.dna.stats.toxinPower * SimConfig.TOXIN_ENERGY_COST;
        this.applyBacteriocinDamage(nearbyBacteria, dt);
      }
    }

    this.energy -= energyDrain * dt;

    // Ingreso por Fotosíntesis con cinética de saturación de Michaelis-Menten según irradiancia local I(x)
    if (this.dna.traits.metabolism === 'photosynthetic') {
      const irradiance = this.computeLocalIrradiance(bounds);
      const mmFactor = irradiance / (SimConfig.LIGHT_HALF_SATURATION + irradiance);
      this.energy += SimConfig.PHOTOSYNTHESIS_RATE * mmFactor * 1.35 * dt;
    }

    // 5. Alimentación activa (Saprófita / Fermentadora vs Predadora)
    if (this.dna.traits.metabolism === 'predator') {
      this.attemptPredation(nearbyBacteria, dt);
    } else {
      this.consumeNearbyNutrients(gridNutrients);
    }

    if (this.energy <= 0) {
      this.isDead = true;
      return null;
    }

    // 6. División celular (Fisión Binaria vs Gemación)
    if (this.energy >= this.dna.stats.splitEnergy) {
      return this.reproduce();
    }

    return null;
  }

  /**
   * Irradiancia espacial I(x, y): más intensa hacia el centro del medio de cultivo (foco del microscopio).
   */
  private computeLocalIrradiance(bounds: { width: number; height: number }): number {
    const cx = bounds.width * 0.5;
    const cy = bounds.height * 0.5;
    const maxDist = Math.hypot(cx, cy) || 1;
    const dist = Math.hypot(this.x - cx, this.y - cy);
    return Math.max(0.25, 1.15 - (dist / maxDist) * 0.7);
  }

  private computeLocomotion(
    nutrients: Nutrient[],
    bacteria: Bacteria[],
    bounds: { width: number; height: number }
  ): void {
    if (this.dna.traits.motility === 'sessile') {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let minDistSq = Infinity;

    if (this.dna.traits.metabolism === 'predator') {
      // Las predadoras buscan presas vivas de distinto linaje (no esporuladas)
      for (let i = 0; i < bacteria.length; i++) {
        const prey = bacteria[i];
        if (prey.isDead || prey.dna.lineageId === this.dna.lineageId || prey.isSpore) continue;
        const dSq = (prey.x - this.x) ** 2 + (prey.y - this.y) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          targetX = prey.x;
          targetY = prey.y;
        }
      }
    } else if (this.dna.traits.metabolism !== 'photosynthetic') {
      // Saprófitas y fermentadoras siguen el gradiente de nutrientes
      for (let i = 0; i < nutrients.length; i++) {
        const n = nutrients[i];
        if (n.isDead) continue;
        const dSq = (n.x - this.x) ** 2 + (n.y - this.y) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          targetX = n.x;
          targetY = n.y;
        }
      }
    } else {
      // Fotosintéticas con motilidad tienden suavemente hacia el foco luminoso central si están lejos
      const cx = bounds.width * 0.5;
      const cy = bounds.height * 0.5;
      const distCenterSq = (cx - this.x) ** 2 + (cy - this.y) ** 2;
      if (distCenterSq > (Math.min(bounds.width, bounds.height) * 0.38) ** 2) {
        const desired = Math.atan2(cy - this.y, cx - this.x);
        this.angle += Math.sin(desired - this.angle) * 0.08;
      }
    }

    if (minDistSq < Infinity) {
      const desiredAngle = Math.atan2(targetY - this.y, targetX - this.x);
      // Ciliadas maniobran con giro suave; flageladas orientan directo por quimiotaxis
      if (this.dna.traits.motility === 'ciliated') {
        const diff = Math.atan2(Math.sin(desiredAngle - this.angle), Math.cos(desiredAngle - this.angle));
        this.angle += diff * 0.25;
      } else {
        this.angle = desiredAngle;
      }
    } else {
      // Run & tumble browniano
      const tumbleAmplitude = this.dna.traits.motility === 'ciliated' ? 0.2 : 0.35;
      this.angle += (Math.random() - 0.5) * tumbleAmplitude;
    }

    const speedPx = this.dna.stats.maxSpeed * 30;
    this.vx = Math.cos(this.angle) * speedPx;
    this.vy = Math.sin(this.angle) * speedPx;
  }

  private checkQuorumCondition(neighbors: Bacteria[]): boolean {
    if (this.dna.traits.interaction === 'bacteriocins') return true;

    // Si es quorum_sensing, cuenta cuántas bacterias aliadas hay cerca
    let allies = 0;
    const rSq = SimConfig.QUORUM_RADIUS ** 2;
    for (let i = 0; i < neighbors.length; i++) {
      const b = neighbors[i];
      if (b !== this && !b.isDead && b.dna.lineageId === this.dna.lineageId) {
        if ((b.x - this.x) ** 2 + (b.y - this.y) ** 2 <= rSq) {
          allies++;
          if (allies >= SimConfig.QUORUM_MIN_ALLIES) return true;
        }
      }
    }
    return false;
  }

  private applyBacteriocinDamage(neighbors: Bacteria[], dt: number): void {
    const rSq = SimConfig.TOXIN_RADIUS ** 2;
    const sigmaSq2 = 2 * ((SimConfig.TOXIN_RADIUS * 0.65) ** 2);

    for (let i = 0; i < neighbors.length; i++) {
      const rival = neighbors[i];
      if (rival.isDead || rival.dna.lineageId === this.dna.lineageId) continue;

      const dSq = (rival.x - this.x) ** 2 + (rival.y - this.y) ** 2;
      if (dSq <= rSq) {
        // Atenuación gaussiana con la distancia C(d) = C_0 * exp(-d^2 / 2*sigma^2)
        const falloff = Math.exp(-dSq / sigmaSq2);
        const capsuleShield = rival.dna.traits.wall === 'capsule' ? 0.5 : 1.0;
        const gramNegShield = rival.dna.traits.wall === 'gram_negative' ? 0.72 : 1.0;
        const sporeShield = rival.isSpore ? 0.15 : 1.0;

        const rawDmg =
          this.dna.stats.toxinPower *
          SimConfig.TOXIN_DAMAGE_FACTOR *
          dt *
          falloff *
          capsuleShield *
          gramNegShield *
          sporeShield;
        const netDmg = rawDmg / (1 + rival.dna.stats.armor * 0.35);
        rival.energy -= netDmg;
        if (rival.energy <= 0) {
          rival.isDead = true;
        }
      }
    }
  }

  private attemptPredation(neighbors: Bacteria[], dt: number): void {
    for (let i = 0; i < neighbors.length; i++) {
      const prey = neighbors[i];
      if (prey.isDead || prey.dna.lineageId === this.dna.lineageId || prey.isSpore) continue;

      const contactDist = this.radius + prey.radius;
      if ((prey.x - this.x) ** 2 + (prey.y - this.y) ** 2 <= contactDist ** 2) {
        // Cápsula mucosa dificulta ser fagocitada
        const evasionFactor = prey.dna.traits.wall === 'capsule' ? 0.45 : 1.0;
        const biteDmg =
          (SimConfig.PREDATION_BITE_DPS * dt * evasionFactor) /
          (1 + prey.dna.stats.armor * 0.25);
        prey.energy -= biteDmg;
        this.energy += biteDmg * SimConfig.PREDATION_EFFICIENCY;
        if (prey.energy <= 0) {
          prey.isDead = true;
        }
      }
    }
  }

  private consumeNearbyNutrients(gridNutrients: SpatialHashGrid<Nutrient>): void {
    const contact = gridNutrients.queryRadius(
      this.x,
      this.y,
      this.radius + 4,
      Bacteria.contactNutrientsBuf
    );

    const metabolism = this.dna.traits.metabolism;

    for (let i = 0; i < contact.length; i++) {
      const n = contact[i];
      if (!n.isDead) {
        // Cinética de saturación de sustrato (Michaelis-Menten)
        const s = n.energyValue;
        const saturation = (s * 2.1) / (SimConfig.SUBSTRATE_HALF_SATURATION + s);

        let mult = 1.0;
        if (metabolism === 'fermenter') {
          mult = SimConfig.FERMENTER_MULTIPLIER;
        } else if (metabolism === 'saprophyte' && n.isOrganicCorpse) {
          mult = SimConfig.SAPROPHYTE_CORPSE_BONUS;
        } else if (metabolism === 'photosynthetic') {
          mult = 0.35; // Fotosintéticas asimilan poco sustrato orgánico sólido
        }

        this.energy += s * saturation * mult;
        n.isDead = true;
      }
    }
  }

  private reproduce(): Bacteria {
    const cost = this.dna.stats.splitEnergy * SimConfig.REPLICATION_COST_RATIO;
    const available = this.energy - cost;

    // Gemación (65% madre / 35% hija) vs Fisión Binaria (50% / 50%)
    const isBudding = this.dna.traits.reproduction === 'budding';
    const childShare = isBudding ? 0.35 : 0.5;

    this.energy = available * (1 - childShare);
    const childEnergy = available * childShare;

    const offsetAngle = this.angle + Math.PI + (Math.random() - 0.5);
    const spawnDist = this.radius * 1.4;

    return new Bacteria(
      this.x + Math.cos(offsetAngle) * spawnDist,
      this.y + Math.sin(offsetAngle) * spawnDist,
      this.dna.cloneWithMutation(),
      childEnergy
    );
  }

  private handleBoundaryCollisions(bounds: { width: number; height: number }): void {
    const r = this.radius;
    if (this.x < r) {
      this.x = r;
      this.vx *= -1;
      this.angle = Math.atan2(this.vy, this.vx);
    }
    if (this.x > bounds.width - r) {
      this.x = bounds.width - r;
      this.vx *= -1;
      this.angle = Math.atan2(this.vy, this.vx);
    }
    if (this.y < r) {
      this.y = r;
      this.vy *= -1;
      this.angle = Math.atan2(this.vy, this.vx);
    }
    if (this.y > bounds.height - r) {
      this.y = bounds.height - r;
      this.vx *= -1;
      this.angle = Math.atan2(this.vy, this.vx);
    }
  }
}
