import { DNA } from './DNA';
import { Nutrient } from './Nutrient';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { SimConfig } from '../config/SimulationConfig';

let nextBacteriaId = 1;

export interface WorldEnvironment {
  width: number;
  height: number;
  lightX: number;
  lightY: number;
  lightRadius: number;
}

export class Bacteria {
  public readonly id: number;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = Math.random() * Math.PI * 2;
  public wanderAngle: number = this.angle;
  public tumbleTimer: number = 0.5 + Math.random() * 1.2;
  public lockedTargetX: number = 0;
  public lockedTargetY: number = 0;
  public hasLockedTarget: boolean = false;
  public energy: number;
  public age: number = 0;
  public isDead: boolean = false;
  public isDying: boolean = false;
  public dyingProgress: number = 0;
  public dividingProgress: number = 0;
  public divisionCooldown: number = 0;
  public beingAttackedTimer: number = 0;
  public isAttackingTimer: number = 0;
  public isSpore: boolean = false;
  public isEmittingToxin: boolean = false;
  public isInfectedByPhage: boolean = false;
  public phageInfectionProgress: number = 0;
  public burstPhagesPending: boolean = false;
  public animPhase: number = Math.random() * 100;

  // Buffers estáticos reutilizables para consultas espaciales sin GC
  private static readonly neighborNutrientsBuf: Nutrient[] = [];
  private static readonly contactNutrientsBuf: Nutrient[] = [];
  private static readonly neighborBacteriaBuf: Bacteria[] = [];

  constructor(
    public x: number,
    public y: number,
    public dna: DNA,
    initialEnergy?: number,
    initialDivisionCooldown: number = 0
  ) {
    this.id = nextBacteriaId++;
    this.energy = initialEnergy ?? dna.stats.splitEnergy * 0.62;
    this.divisionCooldown = initialDivisionCooldown;
  }

  public get effectiveSplitEnergy(): number {
    const suctionPenalty = this.dna.hasAdaptation('suction_pore') ? 1.15 : 1.0;
    return this.dna.stats.splitEnergy * suctionPenalty;
  }

  /**
   * Factor de crecimiento ontogenético según las reservas de energía actuales y la plasticidad
   * anabólica de su metabolismo: < 1.0 en ayunas / recién dividida, 1.0 en equilibrio (62% E)
   * y > 1.0 cuando se hincha de biomasa antes de la fisión.
   */
  public get growthScale(): number {
    const range = DNA.getMetabolicGrowthRange(this.dna.traits.metabolism);
    const eq = SimConfig.GROWTH_EQUILIBRIUM_RATIO;
    const ratio = Math.max(
      0,
      Math.min(1.2, this.energy / Math.max(1, this.effectiveSplitEnergy))
    );
    if (ratio <= eq) {
      const t = ratio / eq;
      return range.min + (1.0 - range.min) * t;
    }
    const t = Math.min(1, (ratio - eq) / (1.0 - eq));
    return 1.0 + (range.max - 1.0) * t;
  }

  public get radius(): number {
    return this.dna.stats.size * this.growthScale;
  }

  /**
   * Gasto metabólico basal instantáneo (ATP/s): el término superficial/volumétrico (Kleiber)
   * escala cuadráticamente con el crecimiento real de la célula, mientras que la armadura,
   * sensores y adaptaciones mantienen su coste estructural base.
   */
  public get currentBasalMetabolism(): number {
    const scale = this.growthScale;
    const sizeRatio = this.dna.stats.size / 8.0;
    const wallMultiplier =
      this.dna.traits.wall === 'gram_positive'
        ? 1.32
        : this.dna.traits.wall === 's_layer'
          ? 1.24
          : this.dna.traits.wall === 'capsule'
            ? 1.18
            : 1.0;
    const baseCellTerm = 0.95 * (sizeRatio ** 2) * wallMultiplier;
    const fixedStructuralCost = Math.max(0, this.dna.stats.basalMetabolism - baseCellTerm);
    return baseCellTerm * (scale ** 2) + fixedStructuralCost;
  }

  /**
   * Coeficiente de arrastre hidrodinámico instantáneo (Ley de Stokes a bajo Reynolds):
   * crece linealmente con el radio actual de la bacteria.
   */
  public get currentDragFactor(): number {
    return this.dna.stats.dragFactor * this.growthScale;
  }

  /**
   * Intenta adsorber un bacteriófago T4 sobre los receptores de la envoltura celular.
   * La Capa S cristalina y la Cápsula mucosa enmascaran los receptores reduciendo la probabilidad.
   */
  public tryAdsorbPhage(): boolean {
    if (this.isDead || this.isDying || this.isSpore || this.isInfectedByPhage) {
      return false;
    }
    const wall = this.dna.traits.wall;
    const wallPassChance =
      wall === 's_layer'
        ? 0.35
        : wall === 'capsule'
          ? 0.5
          : wall === 'gram_positive'
            ? 0.75
            : 1.0;
    const spikesFactor = this.dna.hasAdaptation('spikes') ? 0.8 : 1.0;
    const armorFactor = 1 / (1 + this.dna.stats.armor * 0.08);
    if (Math.random() <= wallPassChance * spikesFactor * armorFactor) {
      this.isInfectedByPhage = true;
      this.phageInfectionProgress = 0.02;
      this.dividingProgress = 0;
      this.beingAttackedTimer = 0.35;
      return true;
    }
    return false;
  }

  public update(
    dt: number,
    gridNutrients: SpatialHashGrid<Nutrient>,
    gridBacteria: SpatialHashGrid<Bacteria>,
    bounds: WorldEnvironment
  ): Bacteria | null {
    if (this.beingAttackedTimer > 0) {
      this.beingAttackedTimer = Math.max(0, this.beingAttackedTimer - dt);
    }
    if (this.isAttackingTimer > 0) {
      this.isAttackingTimer = Math.max(0, this.isAttackingTimer - dt);
    }

    // Fase de Lisis Celular gradual (muerte progresiva y visible)
    if (this.isDying) {
      this.dyingProgress += dt / SimConfig.DEATH_LYSIS_DURATION;
      this.vx *= 0.9;
      this.vy *= 0.9;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.animPhase += dt * 0.5;
      if (this.dyingProgress >= 1.0) {
        this.isDead = true;
      }
      return null;
    }

    if (this.energy <= 0) {
      this.isDying = true;
      this.dividingProgress = 0;
      this.isEmittingToxin = false;
      return null;
    }

    this.age += dt;
    this.isEmittingToxin = false;

    // 1. Gestión de Esporulación (Estado latente defensivo ante hambruna; imposible si ya fue secuestrada por un fago)
    if (this.dna.traits.reproduction === 'sporulation' && !this.isInfectedByPhage) {
      if (!this.isSpore && this.energy < SimConfig.SPORULATION_THRESHOLD) {
        this.isSpore = true;
        this.dividingProgress = 0;
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
      // Una endospora es metabólicamente casi inerte: consume 5% del basal y solo germina si toca sustrato
      this.energy -= this.dna.stats.basalMetabolism * SimConfig.SPORE_METABOLISM_FACTOR * dt;
      this.consumeNearbyNutrients(gridNutrients);
      if (this.energy <= 0) {
        this.isDying = true;
      }
      return null;
    }

    // 1.b Progresión del ciclo lítico intracelular si está infectada por un bacteriófago
    if (this.isInfectedByPhage) {
      this.phageInfectionProgress += dt / SimConfig.PHAGE_INCUBATION_TIME;
      this.energy -= SimConfig.PHAGE_INFECTED_METABOLIC_DRAIN * dt;
      this.dividingProgress = 0;
      if (this.phageInfectionProgress >= 1.0) {
        this.phageInfectionProgress = 1.0;
        this.isDying = true;
        this.burstPhagesPending = true;
        this.isEmittingToxin = false;
        return null;
      }
    }

    this.divisionCooldown = Math.max(0, this.divisionCooldown - dt);

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

    // 3. Quimiotaxis / Fototaxis y locomoción fluida
    this.computeLocomotion(dt, nearbyNutrients, nearbyBacteria, bounds);

    // Si está en pleno proceso de división o secuestrada por replicación vírica, reduce su velocidad
    if (this.dividingProgress > 0) {
      this.vx *= 0.42;
      this.vy *= 0.42;
    } else if (this.isInfectedByPhage) {
      this.vx *= 0.76;
      this.vy *= 0.76;
    }

    // 3.b Repulsión estérica suave y resolución de colisiones cuerpo a cuerpo
    this.resolveStericCollisions(dt, nearbyBacteria);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.handleBoundaryCollisions(bounds);

    const currentSpeed = Math.hypot(this.vx, this.vy) / SimConfig.MOVEMENT_SPEED_FACTOR;
    this.animPhase += dt * (1 + currentSpeed * 1.25);

    // 4. Balance energético (Ingreso vs Gasto: escala con el tamaño ontogenético actual)
    let energyDrain =
      this.currentBasalMetabolism + this.currentDragFactor * (currentSpeed ** 2);

    // Guerra química, Quorum Sensing y Sideróforos
    if (this.dna.traits.interaction === 'siderophores') {
      this.isEmittingToxin = true;
      energyDrain += 0.24;
      this.applySiderophorePull(nearbyNutrients, dt);
    } else if (this.dna.traits.interaction !== 'neutral' && this.dna.stats.toxinPower > 0) {
      const canEmit = this.checkQuorumCondition(nearbyBacteria);
      if (canEmit) {
        this.isEmittingToxin = true;
        energyDrain += this.dna.stats.toxinPower * SimConfig.TOXIN_ENERGY_COST;
        this.applyBacteriocinDamage(nearbyBacteria, dt);
      }
    }

    // Adaptación: Ventosa / Arpón contráctil atrae el nutriente más cercano
    if (this.dna.hasAdaptation('suction_pore')) {
      this.applySuctionPore(nearbyNutrients, dt);
    }

    // Reproducción por Conjugación (Pili sexual): apoyo metabólico al contactar con aliadas
    if (this.dna.traits.reproduction === 'conjugation') {
      this.applyConjugationSynergy(nearbyBacteria, dt);
    }

    this.energy -= energyDrain * dt;

    // Ingreso por Fotosíntesis o Quimiolitotrofia
    if (this.dna.traits.metabolism === 'photosynthetic') {
      const irradiance = this.computeLocalIrradiance(bounds, nearbyBacteria);
      const mmFactor = irradiance / (SimConfig.LIGHT_HALF_SATURATION + irradiance);
      this.energy += SimConfig.PHOTOSYNTHESIS_RATE * mmFactor * dt;
    } else if (this.dna.traits.metabolism === 'chemolithotroph') {
      this.energy += SimConfig.CHEMOLITHOTROPHY_RATE * dt;
    }

    // 5. Alimentación activa y defensa por espinas
    if (this.dna.traits.metabolism === 'predator') {
      this.attemptPredation(nearbyBacteria, dt);
    } else {
      this.consumeNearbyNutrients(gridNutrients);
    }
    if (this.dna.hasAdaptation('spikes')) {
      this.applyDefensiveSpikes(nearbyBacteria, dt);
    }

    if (this.energy <= 0) {
      this.isDying = true;
      this.dividingProgress = 0;
      return null;
    }

    // 6. División celular gradual (imposible si la maquinaria celular está secuestrada por un fago)
    const splitThreshold = this.effectiveSplitEnergy;
    if (
      !this.isInfectedByPhage &&
      this.divisionCooldown <= 0 &&
      (this.energy >= splitThreshold || this.dividingProgress > 0)
    ) {
      if (this.energy < splitThreshold * 0.78) {
        // Si sufre daño grave durante la división, aborta la citocinesis para sobrevivir
        this.dividingProgress = Math.max(0, this.dividingProgress - dt * 1.5);
      } else {
        this.dividingProgress += dt / SimConfig.DIVISION_DURATION;
        if (this.dividingProgress >= 1.0) {
          this.dividingProgress = 0;
          return this.reproduce();
        }
      }
    }

    return null;
  }

  /**
   * Irradiancia espacial I(x, y): concentrada en un epicentro luminoso acotado (lightX, lightY)
   * y sujeta a auto-sombreado por densidad celular vecina (Ley de Beer-Lambert).
   */
  private computeLocalIrradiance(bounds: WorldEnvironment, nearbyBacteria: Bacteria[]): number {
    const dist = Math.hypot(this.x - bounds.lightX, this.y - bounds.lightY);
    const r = bounds.lightRadius;
    // Caída gaussiana fuera del foco luminoso hacia la penumbra basal
    const radial = Math.exp(-((dist / r) ** 2) * 1.65);
    const rawLight =
      SimConfig.LIGHT_AMBIENT_MIN + (1.0 - SimConfig.LIGHT_AMBIENT_MIN) * radial;

    // Auto-sombreado: las bacterias cercanas absorben y bloquean parte de los fotones disponibles
    const shadeRadiusSq = SimConfig.PHOTOSYNTHESIS_SHADING_RADIUS ** 2;
    let shadingNeighbors = 0;
    for (let i = 0; i < nearbyBacteria.length; i++) {
      const other = nearbyBacteria[i];
      if (other !== this && !other.isDead) {
        const dSq = (other.x - this.x) ** 2 + (other.y - this.y) ** 2;
        if (dSq <= shadeRadiusSq) {
          shadingNeighbors++;
        }
      }
    }

    const shadingFactor = 1 / (1 + shadingNeighbors * SimConfig.PHOTOSYNTHESIS_SHADING_COEFF);
    const baseIrradiance = rawLight * shadingFactor;
    if (this.dna.hasAdaptation('bioluminescence')) {
      return Math.max(0.55 * shadingFactor, baseIrradiance);
    }
    return baseIrradiance;
  }

  private computeLocomotion(
    dt: number,
    nutrients: Nutrient[],
    bacteria: Bacteria[],
    bounds: WorldEnvironment
  ): void {
    if (this.dna.traits.motility === 'sessile') {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    if (this.dna.traits.motility === 'nonmotile') {
      // Las bacterias no móviles amortiguan suavemente cualquier empuje por contacto
      const damp = Math.exp(-8 * dt);
      this.vx *= damp;
      this.vy *= damp;
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let minDistSq = Infinity;

    if (this.dna.traits.metabolism === 'predator') {
      // Las predadoras buscan presas vivas de distinto linaje (no esporuladas ni muriendo) con histéresis
      for (let i = 0; i < bacteria.length; i++) {
        const prey = bacteria[i];
        if (
          prey.isDead ||
          prey.isDying ||
          prey.dna.lineageId === this.dna.lineageId ||
          prey.isSpore
        ) {
          continue;
        }
        const dSq = (prey.x - this.x) ** 2 + (prey.y - this.y) ** 2;
        const headingDot =
          Math.cos(this.angle) * (prey.x - this.x) +
          Math.sin(this.angle) * (prey.y - this.y);
        const directionalBias = headingDot > 0 ? 0.78 : 1.0;
        const effectiveDSq = dSq * directionalBias;
        if (effectiveDSq < minDistSq) {
          minDistSq = effectiveDSq;
          targetX = prey.x;
          targetY = prey.y;
        }
      }
    } else if (this.dna.traits.metabolism !== 'photosynthetic') {
      // Las bacterias heterótrofas siguen el gradiente de nutrientes con preferencia frontal para no oscilar
      for (let i = 0; i < nutrients.length; i++) {
        const n = nutrients[i];
        if (n.isDead) continue;
        const dx = n.x - this.x;
        const dy = n.y - this.y;
        const dSq = dx * dx + dy * dy;
        const headingDot = Math.cos(this.angle) * dx + Math.sin(this.angle) * dy;
        const directionalBias = headingDot > 0 ? 0.75 : 1.05;
        const effectiveDSq = dSq * directionalBias;
        if (effectiveDSq < minDistSq) {
          minDistSq = effectiveDSq;
          targetX = n.x;
          targetY = n.y;
        }
      }
    } else {
      // Fototaxis: las fotosintéticas móviles perciben el gradiente hacia el epicentro de luz
      const distLight = Math.hypot(bounds.lightX - this.x, bounds.lightY - this.y);
      const maxSenseLight = bounds.lightRadius * 1.6 + this.dna.stats.perceptionRadius;
      if (distLight > bounds.lightRadius * 0.42 && distLight <= maxSenseLight) {
        minDistSq = distLight * distLight;
        targetX = bounds.lightX;
        targetY = bounds.lightY;
      }
    }

    const turnRate =
      this.dna.traits.motility === 'ciliated'
        ? 4.2
        : this.dna.traits.motility === 'spirochete'
          ? 5.4
          : 6.8;

    if (minDistSq < Infinity) {
      let desiredAngle = Math.atan2(targetY - this.y, targetX - this.x);
      if (this.dna.traits.motility === 'spirochete') {
        desiredAngle += Math.sin(this.animPhase * 1.8) * 0.14;
      }
      const diff = Math.atan2(
        Math.sin(desiredAngle - this.angle),
        Math.cos(desiredAngle - this.angle)
      );
      this.angle += diff * Math.min(1, turnRate * dt);
      this.wanderAngle = this.angle;
    } else {
      // Run & Tumble fluido dependiente de dt: corridas rectas suaves con reorientaciones periódicas
      this.tumbleTimer -= dt;
      if (this.tumbleTimer <= 0) {
        const tumbleInterval =
          this.dna.traits.motility === 'ciliated'
            ? 1.4 + Math.random() * 1.4
            : this.dna.traits.motility === 'spirochete'
              ? 1.0 + Math.random() * 1.1
              : 0.75 + Math.random() * 1.15;
        this.tumbleTimer = tumbleInterval;
        const maxTurn =
          this.dna.traits.motility === 'ciliated'
            ? 0.85
            : this.dna.traits.motility === 'spirochete'
              ? 1.15
              : 1.45;
        this.wanderAngle = this.angle + (Math.random() - 0.5) * 2 * maxTurn;
      }

      // Deriva rotacional browniana continua pero suave y proporcional a dt
      this.wanderAngle += Math.sin(this.animPhase * 0.7 + this.id * 1.7) * 0.35 * dt;
      const diff = Math.atan2(
        Math.sin(this.wanderAngle - this.angle),
        Math.cos(this.wanderAngle - this.angle)
      );
      this.angle += diff * Math.min(1, (turnRate * 0.72) * dt);
    }

    const effectiveSpeed = this.dna.getEffectiveMaxSpeed();
    const speedPx = effectiveSpeed * SimConfig.MOVEMENT_SPEED_FACTOR;
    const targetVx = Math.cos(this.angle) * speedPx;
    const targetVy = Math.sin(this.angle) * speedPx;
    const inertiaBlend = Math.min(1, 10 * dt);
    this.vx += (targetVx - this.vx) * inertiaBlend;
    this.vy += (targetVy - this.vy) * inertiaBlend;
  }

  /**
   * Evita que las bacterias se atraviesen o se apilen unas encima de otras aplicando
   * desviación suave de dirección y separación estérica elástica entre somas cercanos.
   */
  private resolveStericCollisions(dt: number, neighbors: Bacteria[]): void {
    const isSessile = this.dna.traits.motility === 'sessile';
    let steerX = 0;
    let steerY = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || other.isDead || other.isDying) continue;

      let dx = this.x - other.x;
      let dy = this.y - other.y;
      let dSq = dx * dx + dy * dy;

      const minSep = (this.radius + other.radius) * 1.12;
      const softZone = minSep * 1.32;

      if (dSq >= softZone * softZone) continue;

      if (dSq < 0.0001) {
        const fallbackAngle = ((this.id * 2.39996) % (Math.PI * 2));
        dx = Math.cos(fallbackAngle);
        dy = Math.sin(fallbackAngle);
        dSq = 1;
      }

      const dist = Math.sqrt(dSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Desviación suave de rumbo antes del choque frontal
      if (!isSessile && dist < softZone) {
        const weight = (softZone - dist) / softZone;
        steerX += nx * weight;
        steerY += ny * weight;
      }

      // Separación física directa si los somas se solapan
      if (dist < minSep) {
        const overlap = minSep - dist;
        const otherFixed = other.dna.traits.motility === 'sessile' || other.isSpore;
        const thisFixed = isSessile || this.isSpore;

        if (!thisFixed) {
          const share = otherFixed ? 0.9 : 0.5;
          const push = overlap * share * Math.min(1, dt * 18);
          this.x += nx * push;
          this.y += ny * push;
        }
        if (!otherFixed && other.id > this.id) {
          const share = thisFixed ? 0.9 : 0.5;
          const push = overlap * share * Math.min(1, dt * 18);
          other.x -= nx * push;
          other.y -= ny * push;
        }
      }
    }

    if (
      !isSessile &&
      this.dna.traits.motility !== 'nonmotile' &&
      (steerX !== 0 || steerY !== 0)
    ) {
      // Si es predadora persiguiendo una presa, aplica menor evasión para poder morder
      const avoidGain = this.dna.traits.metabolism === 'predator' ? 1.4 : 2.8;
      const avoidAngle = Math.atan2(steerY, steerX);
      const diff = Math.atan2(
        Math.sin(avoidAngle - this.angle),
        Math.cos(avoidAngle - this.angle)
      );
      this.angle += diff * Math.min(0.45, avoidGain * dt);
    }
  }

  private applySiderophorePull(nutrients: Nutrient[], dt: number): void {
    const rSq = SimConfig.SIDEROPHORE_PULL_RADIUS ** 2;
    for (let i = 0; i < nutrients.length; i++) {
      const n = nutrients[i];
      if (n.isDead) continue;
      const dx = this.x - n.x;
      const dy = this.y - n.y;
      const dSq = dx * dx + dy * dy;
      if (dSq > 4 && dSq <= rSq) {
        const dist = Math.sqrt(dSq);
        n.x += (dx / dist) * SimConfig.SIDEROPHORE_PULL_FORCE * dt;
        n.y += (dy / dist) * SimConfig.SIDEROPHORE_PULL_FORCE * dt;
      }
    }
  }

  private applySuctionPore(nutrients: Nutrient[], dt: number): void {
    const maxR = this.radius + 46;
    const maxRSq = maxR * maxR;
    let closest: Nutrient | null = null;
    let bestDSq = maxRSq;
    for (let i = 0; i < nutrients.length; i++) {
      const n = nutrients[i];
      if (n.isDead) continue;
      const dx = this.x - n.x;
      const dy = this.y - n.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDSq) {
        bestDSq = dSq;
        closest = n;
      }
    }
    if (closest && bestDSq > 4) {
      const dist = Math.sqrt(bestDSq);
      closest.x += ((this.x - closest.x) / dist) * 52 * dt;
      closest.y += ((this.y - closest.y) / dist) * 52 * dt;
    }
  }

  private applyConjugationSynergy(neighbors: Bacteria[], dt: number): void {
    const rSq = (this.radius * 3.5) ** 2;
    for (let i = 0; i < neighbors.length; i++) {
      const ally = neighbors[i];
      if (
        ally !== this &&
        !ally.isDead &&
        !ally.isDying &&
        ally.dna.lineageId === this.dna.lineageId
      ) {
        const dSq = (ally.x - this.x) ** 2 + (ally.y - this.y) ** 2;
        if (dSq <= rSq) {
          this.energy += 0.35 * dt;
          return;
        }
      }
    }
  }

  private applyDefensiveSpikes(neighbors: Bacteria[], dt: number): void {
    for (let i = 0; i < neighbors.length; i++) {
      const rival = neighbors[i];
      if (rival.isDead || rival.isDying || rival.dna.lineageId === this.dna.lineageId) continue;
      const contactDist = this.radius + rival.radius + 4;
      if ((rival.x - this.x) ** 2 + (rival.y - this.y) ** 2 <= contactDist ** 2) {
        rival.energy -= 6.5 * dt;
        rival.beingAttackedTimer = 0.2;
        if (rival.energy <= 0) {
          rival.isDying = true;
        }
      }
    }
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
      if (rival.isDead || rival.isDying || rival.dna.lineageId === this.dna.lineageId) continue;

      const dSq = (rival.x - this.x) ** 2 + (rival.y - this.y) ** 2;
      if (dSq <= rSq) {
        // Atenuación gaussiana con la distancia C(d) = C_0 * exp(-d^2 / 2*sigma^2)
        const falloff = Math.exp(-dSq / sigmaSq2);
        const capsuleShield = rival.dna.traits.wall === 'capsule' ? 0.5 : 1.0;
        const gramNegShield = rival.dna.traits.wall === 'gram_negative' ? 0.72 : 1.0;
        const sLayerShield = rival.dna.traits.wall === 's_layer' ? 0.8 : 1.0;
        const lithoShield = rival.dna.traits.metabolism === 'chemolithotroph' ? 0.8 : 1.0;
        const sporeShield = rival.isSpore ? 0.15 : 1.0;
        const mawVuln = rival.dna.hasAdaptation('giant_maw') ? 0.75 : 1.0;

        const rawDmg =
          this.dna.stats.toxinPower *
          SimConfig.TOXIN_DAMAGE_FACTOR *
          dt *
          falloff *
          capsuleShield *
          gramNegShield *
          sLayerShield *
          lithoShield *
          sporeShield;
        const netDmg = rawDmg / (1 + rival.dna.stats.armor * mawVuln * 0.35);
        rival.energy -= netDmg;
        rival.beingAttackedTimer = 0.22;
        if (rival.energy <= 0) {
          rival.isDying = true;
        }
      }
    }
  }

  private attemptPredation(neighbors: Bacteria[], dt: number): void {
    for (let i = 0; i < neighbors.length; i++) {
      const prey = neighbors[i];
      if (
        prey.isDead ||
        prey.isDying ||
        prey.dna.lineageId === this.dna.lineageId ||
        prey.isSpore
      ) {
        continue;
      }

      const contactDist = this.radius + prey.radius + 2;
      if ((prey.x - this.x) ** 2 + (prey.y - this.y) ** 2 <= contactDist ** 2) {
        // Cápsula mucosa, espiroqueta y bioluminiscencia dificultan ser fagocitada
        const evasionFactor =
          (prey.dna.traits.wall === 'capsule' ? 0.5 : 1.0) *
          (prey.dna.traits.motility === 'spirochete' ? 0.75 : 1.0) *
          (prey.dna.hasAdaptation('bioluminescence') ? 0.72 : 1.0) *
          (prey.dna.traits.motility === 'sessile' ? 0.85 : 1.0);

        const clawBonus = this.dna.hasAdaptation('claws') ? 1.45 : 1.0;
        const mawBonus = this.dna.hasAdaptation('giant_maw') ? 1.25 : 1.0;
        const preyArmorEff = prey.dna.hasAdaptation('giant_maw') ? 0.75 : 1.0;

        const biteDmg =
          (SimConfig.PREDATION_BITE_DPS * dt * evasionFactor * clawBonus) /
          (1 + prey.dna.stats.armor * preyArmorEff * 0.25);

        prey.energy -= biteDmg;
        prey.beingAttackedTimer = 0.28;
        this.isAttackingTimer = 0.28;

        // Si el predador tiene pinzas, frena a la presa sujetándola
        if (this.dna.hasAdaptation('claws')) {
          prey.vx *= 0.4;
          prey.vy *= 0.4;
        }

        // Daño reflejado si la presa tiene Pinchos Calcáreos o Capa S Cristalina (pueden acumularse)
        if (prey.dna.hasAdaptation('spikes')) {
          this.energy -= biteDmg * 0.4;
          this.beingAttackedTimer = 0.25;
        }
        if (prey.dna.traits.wall === 's_layer') {
          this.energy -= biteDmg * 0.2;
        }

        this.energy += biteDmg * SimConfig.PREDATION_EFFICIENCY * mawBonus;
        if (prey.energy <= 0) {
          prey.isDying = true;
        }
      }
    }
  }

  private consumeNearbyNutrients(gridNutrients: SpatialHashGrid<Nutrient>): void {
    const extraReach = this.dna.hasAdaptation('giant_maw') ? 9 : 4;
    const contact = gridNutrients.queryRadius(
      this.x,
      this.y,
      this.radius + extraReach,
      Bacteria.contactNutrientsBuf
    );

    const metabolism = this.dna.traits.metabolism;
    const mawBonus = this.dna.hasAdaptation('giant_maw') ? 1.25 : 1.0;

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
          mult = 0.2; // Fotosintéticas asimilan muy poco sustrato orgánico sólido
        } else if (metabolism === 'chemolithotroph') {
          mult = 0.65;
        }

        this.energy += s * saturation * mult * mawBonus;
        n.isDead = true;
      }
    }
  }

  private reproduce(): Bacteria {
    const cost = this.effectiveSplitEnergy * SimConfig.REPLICATION_COST_RATIO;
    const available = this.energy - cost;

    // Gemación (65% madre / 35% hija), Conjugación (55% / 45%) o Fisión Binaria (50% / 50%)
    const repro = this.dna.traits.reproduction;
    const childShare = repro === 'budding' ? 0.35 : repro === 'conjugation' ? 0.45 : 0.5;

    this.energy = available * (1 - childShare);
    const childEnergy = available * childShare;
    this.divisionCooldown = SimConfig.MIN_INTERDIVISION_INTERVAL;

    const offsetAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.4;
    const spawnDist = this.radius * 1.65;

    return new Bacteria(
      this.x + Math.cos(offsetAngle) * spawnDist,
      this.y + Math.sin(offsetAngle) * spawnDist,
      this.dna.cloneWithMutation(),
      childEnergy,
      SimConfig.MIN_INTERDIVISION_INTERVAL
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
