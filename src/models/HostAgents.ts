import { Bacteria } from './Bacteria';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { SimConfig } from '../config/SimulationConfig';

export type HostAgentId = 'bacteriophage_t4' | 'neutrophil_pmn';

const HOST_AGENT_IDS: readonly HostAgentId[] = [
  'bacteriophage_t4',
  'neutrophil_pmn',
] as const;

export function isHostAgentId(value: string): value is HostAgentId {
  return (HOST_AGENT_IDS as readonly string[]).includes(value);
}

let nextPhageId = 1;
let nextNeutrophilId = 1;

/**
 * Bacteriófago T4 (Caudoviricetes):
 * Partícula vírica lítica que deriva por agitación térmica browniana y afinidad
 * electrostática de corto alcance hacia receptores de membrana bacterianos.
 * Carece de metabolismo propio y se inactiva si supera su vida útil libre.
 */
export class Bacteriophage {
  public readonly id: number;
  public readonly radius: number = SimConfig.PHAGE_RADIUS;
  public vx: number;
  public vy: number;
  public angle: number;
  public wanderAngle: number;
  public age: number = 0;
  public readonly maxLifespan: number;
  public spawnCooldown: number;
  public isDead: boolean = false;
  public animPhase: number = Math.random() * 100;

  // Buffer estático preasignado para consultas espaciales Zero-GC
  private static readonly neighborBacteriaBuf: Bacteria[] = [];

  constructor(
    public x: number,
    public y: number,
    initialAngle: number = Math.random() * Math.PI * 2,
    spawnCooldown: number = 0
  ) {
    this.id = nextPhageId++;
    this.angle = initialAngle;
    this.wanderAngle = initialAngle;
    this.spawnCooldown = spawnCooldown;
    this.maxLifespan = SimConfig.PHAGE_LIFESPAN * (0.85 + Math.random() * 0.3);
    const speed = SimConfig.PHAGE_DRIFT_SPEED;
    this.vx = Math.cos(initialAngle) * speed;
    this.vy = Math.sin(initialAngle) * speed;
  }

  public update(
    dt: number,
    gridBacteria: SpatialHashGrid<Bacteria>,
    bounds: { width: number; height: number }
  ): void {
    if (this.isDead) return;

    this.age += dt;
    this.animPhase += dt * 5.2;
    if (this.spawnCooldown > 0) {
      this.spawnCooldown = Math.max(0, this.spawnCooldown - dt);
    }

    if (this.age >= this.maxLifespan) {
      this.isDead = true;
      return;
    }

    const nearby = gridBacteria.queryRadius(
      this.x,
      this.y,
      SimConfig.PHAGE_PERCEPTION_RADIUS,
      Bacteriophage.neighborBacteriaBuf
    );

    let closestTarget: Bacteria | null = null;
    let minDistSq = Infinity;

    if (this.spawnCooldown <= 0) {
      for (let i = 0; i < nearby.length; i++) {
        const b = nearby[i];
        if (b.isDead || b.isDying || b.isSpore || b.isInfectedByPhage) continue;
        const dx = b.x - this.x;
        const dy = b.y - this.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestTarget = b;
        }
      }
    }

    if (closestTarget) {
      const desiredAngle = Math.atan2(
        closestTarget.y - this.y,
        closestTarget.x - this.x
      );
      const diff = Math.atan2(
        Math.sin(desiredAngle - this.angle),
        Math.cos(desiredAngle - this.angle)
      );
      this.angle += diff * Math.min(1, 6.5 * dt);
      this.wanderAngle = this.angle;

      const targetVx = Math.cos(this.angle) * SimConfig.PHAGE_SEEK_SPEED;
      const targetVy = Math.sin(this.angle) * SimConfig.PHAGE_SEEK_SPEED;
      const blend = Math.min(1, 8 * dt);
      this.vx += (targetVx - this.vx) * blend;
      this.vy += (targetVy - this.vy) * blend;

      // Comprobar contacto de adsorción con las fibras caudales del fago
      const contactDist = this.radius + closestTarget.radius + 2.5;
      if (minDistSq <= contactDist * contactDist) {
        if (closestTarget.tryAdsorbPhage(this.x, this.y)) {
          this.isDead = true;
          return;
        } else {
          // Rebote si la pared celular (Capa S / Cápsula) bloquea los receptores
          this.angle += Math.PI + (Math.random() - 0.5) * 0.9;
          this.wanderAngle = this.angle;
          this.vx = Math.cos(this.angle) * SimConfig.PHAGE_DRIFT_SPEED * 1.45;
          this.vy = Math.sin(this.angle) * SimConfig.PHAGE_DRIFT_SPEED * 1.45;
          this.spawnCooldown = 0.55;
        }
      }
    } else {
      // Deriva browniana suave en suspensión
      this.wanderAngle += (Math.random() - 0.5) * 7.5 * dt;
      const diff = Math.atan2(
        Math.sin(this.wanderAngle - this.angle),
        Math.cos(this.wanderAngle - this.angle)
      );
      this.angle += diff * Math.min(1, 4.5 * dt);
      const targetVx = Math.cos(this.angle) * SimConfig.PHAGE_DRIFT_SPEED;
      const targetVy = Math.sin(this.angle) * SimConfig.PHAGE_DRIFT_SPEED;
      const blend = Math.min(1, 6 * dt);
      this.vx += (targetVx - this.vx) * blend;
      this.vy += (targetVy - this.vy) * blend;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rebote elástico en los bordes de la placa
    const r = this.radius;
    if (this.x < r) {
      this.x = r;
      this.vx = Math.abs(this.vx);
      this.angle = Math.atan2(this.vy, this.vx);
      this.wanderAngle = this.angle;
    } else if (this.x > bounds.width - r) {
      this.x = bounds.width - r;
      this.vx = -Math.abs(this.vx);
      this.angle = Math.atan2(this.vy, this.vx);
      this.wanderAngle = this.angle;
    }
    if (this.y < r) {
      this.y = r;
      this.vy = Math.abs(this.vy);
      this.angle = Math.atan2(this.vy, this.vx);
      this.wanderAngle = this.angle;
    } else if (this.y > bounds.height - r) {
      this.y = bounds.height - r;
      this.vy = -Math.abs(this.vy);
      this.angle = Math.atan2(this.vy, this.vx);
      this.wanderAngle = this.angle;
    }
  }
}

export interface PhagosomeSlot {
  active: boolean;
  hue: number;
  progress: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Neutrófilo Polimorfonuclear (Leucocito PMN):
 * Célula eucariota inmunitaria ameboide que patrulla el medio guiada por quimiotaxis
 * (con alta sensibilidad hacia bacterias emisoras de péptidos/toxinas) y fagocita
 * microorganismos hasta alcanzar su límite de saciedad / apoptosis.
 */
export class Neutrophil {
  public readonly id: number;
  public readonly radius: number = SimConfig.NEUTROPHIL_RADIUS;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = Math.random() * Math.PI * 2;
  public wanderAngle: number = this.angle;
  public tumbleTimer: number = 1.0 + Math.random() * 1.5;
  public age: number = 0;
  public readonly maxLifespan: number;
  public digestedCount: number = 0;
  public readonly maxPrey: number = SimConfig.NEUTROPHIL_MAX_PREY;
  public isDying: boolean = false;
  public dyingProgress: number = 0;
  public isDead: boolean = false;
  public attackingTimer: number = 0;
  public animPhase: number = Math.random() * 100;

  // Slots preasignados de fagosomas intracelulares (Zero-GC)
  public readonly phagosomes: readonly PhagosomeSlot[];

  // Buffer estático preasignado para consultas espaciales Zero-GC
  private static readonly neighborBacteriaBuf: Bacteria[] = [];

  constructor(public x: number, public y: number) {
    this.id = nextNeutrophilId++;
    this.maxLifespan = SimConfig.NEUTROPHIL_LIFESPAN * (0.9 + Math.random() * 0.25);

    const slots: PhagosomeSlot[] = [];
    for (let i = 0; i < SimConfig.NEUTROPHIL_MAX_PREY; i++) {
      const a = (i / SimConfig.NEUTROPHIL_MAX_PREY) * Math.PI * 2 + 0.4;
      const d = this.radius * 0.42;
      slots.push({
        active: false,
        hue: 150,
        progress: 0,
        offsetX: Math.cos(a) * d,
        offsetY: Math.sin(a) * d,
      });
    }
    this.phagosomes = slots;
  }

  public update(
    dt: number,
    gridBacteria: SpatialHashGrid<Bacteria>,
    bounds: { width: number; height: number }
  ): void {
    if (this.isDead) return;

    if (this.attackingTimer > 0) {
      this.attackingTimer = Math.max(0, this.attackingTimer - dt);
    }

    // Actualizar digestión visual de los fagosomas activos
    for (let i = 0; i < this.phagosomes.length; i++) {
      const slot = this.phagosomes[i];
      if (slot.active) {
        slot.progress = Math.min(1, slot.progress + dt * 0.18);
      }
    }

    if (this.isDying) {
      this.dyingProgress += dt / 1.8;
      this.vx *= 0.88;
      this.vy *= 0.88;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.animPhase += dt * 0.6;
      if (this.dyingProgress >= 1.0) {
        this.isDead = true;
      }
      return;
    }

    this.age += dt;
    if (this.age >= this.maxLifespan || this.digestedCount >= this.maxPrey) {
      this.isDying = true;
      return;
    }

    const nearby = gridBacteria.queryRadius(
      this.x,
      this.y,
      SimConfig.NEUTROPHIL_PERCEPTION_RADIUS,
      Neutrophil.neighborBacteriaBuf
    );

    let targetPrey: Bacteria | null = null;
    let bestScore = Infinity;

    for (let i = 0; i < nearby.length; i++) {
      const b = nearby[i];
      if (b.isDead || b.isDying) continue;
      const dx = b.x - this.x;
      const dy = b.y - this.y;
      const dSq = dx * dx + dy * dy;

      // Las bacterias que secretan péptidos/toxinas generan un fuerte gradiente quimiotáctico;
      // las endosporas inertes apenas emiten señales químicas y las cápsulas camuflan antígenos.
      const chemoWeight = b.isSpore
        ? 3.2
        : b.isEmittingToxin
          ? 0.42
          : b.dna.traits.wall === 'capsule'
            ? 1.45
            : 1.0;

      const score = dSq * chemoWeight;
      if (score < bestScore) {
        bestScore = score;
        targetPrey = b;
      }
    }

    if (targetPrey) {
      const desiredAngle = Math.atan2(
        targetPrey.y - this.y,
        targetPrey.x - this.x
      );
      const diff = Math.atan2(
        Math.sin(desiredAngle - this.angle),
        Math.cos(desiredAngle - this.angle)
      );
      this.angle += diff * Math.min(1, 3.6 * dt);
      this.wanderAngle = this.angle;
    } else {
      this.tumbleTimer -= dt;
      if (this.tumbleTimer <= 0) {
        this.tumbleTimer = 1.4 + Math.random() * 1.8;
        this.wanderAngle = this.angle + (Math.random() - 0.5) * 1.6;
      }
      const diff = Math.atan2(
        Math.sin(this.wanderAngle - this.angle),
        Math.cos(this.wanderAngle - this.angle)
      );
      this.angle += diff * Math.min(1, 2.5 * dt);
    }

    const speedPx = SimConfig.NEUTROPHIL_SPEED;
    const targetVx = Math.cos(this.angle) * speedPx;
    const targetVy = Math.sin(this.angle) * speedPx;
    const blend = Math.min(1, 5.5 * dt);
    this.vx += (targetVx - this.vx) * blend;
    this.vy += (targetVy - this.vy) * blend;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.animPhase += dt * 3.1;

    // Fagocitosis por contacto (pseudópodos y estallido oxidativo)
    for (let i = 0; i < nearby.length; i++) {
      const prey = nearby[i];
      if (prey.isDead || prey.isDying) continue;

      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dSq = dx * dx + dy * dy;
      const reach = this.radius + prey.radius + 3.5;

      if (dSq <= reach * reach) {
        // La cápsula mucosa es la defensa antifagocítica por excelencia (resbala de los pseudópodos)
        const capsuleFactor = prey.dna.traits.wall === 'capsule' ? 0.45 : 1.0;
        const spiroFactor = prey.dna.traits.motility === 'spirochete' ? 0.7 : 1.0;
        const sessileFactor = prey.dna.traits.motility === 'sessile' ? 0.8 : 1.0;
        const sporeFactor = prey.isSpore ? 0.2 : 1.0;

        const dmg =
          (SimConfig.NEUTROPHIL_PHAGOCYTOSIS_DPS *
            dt *
            capsuleFactor *
            spiroFactor *
            sessileFactor *
            sporeFactor) /
          (1 + prey.dna.stats.armor * 0.18);

        prey.energy -= dmg;
        prey.beingAttackedTimer = 0.3;
        this.attackingTimer = 0.32;

        // Atracción hacia el interior del fagosoma (salvo que tenga cápsula mucosa resbaladiza)
        if (prey.dna.traits.wall !== 'capsule' && dSq > 4) {
          const dist = Math.sqrt(dSq);
          prey.x -= (dx / dist) * 28 * dt;
          prey.y -= (dy / dist) * 28 * dt;
          prey.vx *= 0.5;
          prey.vy *= 0.5;
        }

        // Las espículas calcáreas o Capa S desgastan la membrana del neutrófilo al ser engullidas
        if (prey.dna.hasAdaptation('spikes')) {
          this.age += dt * 2.2;
        }
        if (prey.dna.traits.wall === 's_layer') {
          this.age += dt * 0.9;
        }

        if (prey.energy <= 0) {
          // Engullida completamente dentro de una vacuola digestiva (fagosoma)
          prey.isDead = true;
          this.recordPhagosome(prey.dna.hue);
          this.digestedCount++;
          if (this.digestedCount >= this.maxPrey) {
            this.isDying = true;
            break;
          }
        }
      }
    }

    // Colisión con bordes de la placa
    const r = this.radius;
    if (this.x < r) {
      this.x = r;
      this.vx = Math.abs(this.vx);
      this.angle = Math.atan2(this.vy, this.vx);
    } else if (this.x > bounds.width - r) {
      this.x = bounds.width - r;
      this.vx = -Math.abs(this.vx);
      this.angle = Math.atan2(this.vy, this.vx);
    }
    if (this.y < r) {
      this.y = r;
      this.vy = Math.abs(this.vy);
      this.angle = Math.atan2(this.vy, this.vx);
    } else if (this.y > bounds.height - r) {
      this.y = bounds.height - r;
      this.vy = -Math.abs(this.vy);
      this.angle = Math.atan2(this.vy, this.vx);
    }
  }

  private recordPhagosome(hue: number): void {
    for (let i = 0; i < this.phagosomes.length; i++) {
      const slot = this.phagosomes[i];
      if (!slot.active) {
        slot.active = true;
        slot.hue = hue;
        slot.progress = 0;
        return;
      }
    }
  }
}
