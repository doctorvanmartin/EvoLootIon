import { Bacteria, WorldEnvironment } from '../models/Bacteria';
import { DNA, MetabolismType } from '../models/DNA';
import { Nutrient } from '../models/Nutrient';
import { SpatialHashGrid } from './SpatialHashGrid';
import { SimConfig } from '../config/SimulationConfig';
import { ProceduralRenderer } from '../render/ProceduralRenderer';

export interface LineageSummary {
  lineageId: string;
  lineageName: string;
  count: number;
  spores: number;
  avgHue: number;
  maxGeneration: number;
  avgEnergy: number;
}

export interface SimulationTelemetry {
  elapsedTime: number;
  totalBacteria: number;
  totalSpores: number;
  totalNutrients: number;
  maxGeneration: number;
  fps: number;
  lineages: LineageSummary[];
  history: Array<{ time: number; counts: Record<string, number> }>;
}

export type DetailMode = 'auto' | 'low' | 'high';

export class SimulationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bacteria: Bacteria[] = [];
  private nutrients: Nutrient[] = [];
  private offspringBuffer: Bacteria[] = [];
  private nutrientClusterCenters: Array<{ x: number; y: number }> = [];
  private nutrientSpawnTimer: number = 0;

  private gridNutrients = new SpatialHashGrid<Nutrient>(SimConfig.CELL_SIZE);
  private gridBacteria = new SpatialHashGrid<Bacteria>(SimConfig.CELL_SIZE);

  private worldWidth: number = 1400;
  private worldHeight: number = 900;

  // Epicentro de luz aleatorio con deriva suave
  private lightX: number = 700;
  private lightY: number = 450;
  private lightRadius: number = SimConfig.LIGHT_SPOT_RADIUS;
  private lightVx: number = 0;
  private lightVy: number = 0;
  private readonly envBounds: WorldEnvironment = {
    width: 1400,
    height: 900,
    lightX: 700,
    lightY: 450,
    lightRadius: SimConfig.LIGHT_SPOT_RADIUS,
  };

  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private timeScale: number = 1;
  private detailMode: DetailMode = 'auto';

  // Cámara (Zoom & Pan)
  public camera = {
    x: 0,
    y: 0,
    zoom: 1.0,
  };

  // Telemetría e inspección
  private elapsedTime: number = 0;
  private historyTimer: number = 0;
  private fps: number = 60;
  private history: Array<{ time: number; counts: Record<string, number> }> = [];
  public selectedBacteriaId: number | null = null;
  private onTelemetryCallback?: (telemetry: SimulationTelemetry) => void;

  constructor(canvas: HTMLCanvasElement, onTelemetry?: (telemetry: SimulationTelemetry) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onTelemetryCallback = onTelemetry;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  public resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 600;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    if (this.bacteria.length === 0) {
      this.worldWidth = Math.max(1200, w * 1.25);
      this.worldHeight = Math.max(800, h * 1.25);
      this.resetCamera();
    }
  }

  public resetCamera(): void {
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;
    const fitZoom = Math.min(viewW / this.worldWidth, viewH / this.worldHeight) * 0.94;
    this.camera.zoom = Math.max(0.4, Math.min(1.5, fitZoom));
    this.camera.x = (viewW - this.worldWidth * this.camera.zoom) * 0.5;
    this.camera.y = (viewH - this.worldHeight * this.camera.zoom) * 0.5;
  }

  public initColonies(
    userDNA: DNA,
    rivalCount: number = SimConfig.DEFAULT_RIVAL_COLONIES,
    initialColonySize: number = SimConfig.INITIAL_COLONY_SIZE
  ): void {
    this.bacteria.length = 0;
    this.nutrients.length = 0;
    this.nutrientClusterCenters.length = 0;
    this.nutrientSpawnTimer = 0;
    this.history.length = 0;
    this.elapsedTime = 0;
    this.historyTimer = 0;
    this.selectedBacteriaId = null;

    const clampedRivals = Math.max(0, Math.min(SimConfig.MAX_RIVAL_COLONIES, Math.round(rivalCount)));
    const count = Math.max(
      SimConfig.MIN_INITIAL_COLONY_SIZE,
      Math.min(SimConfig.MAX_INITIAL_COLONY_SIZE, Math.round(initialColonySize))
    );

    const viewW = this.canvas.clientWidth || 900;
    const viewH = this.canvas.clientHeight || 650;
    this.worldWidth = Math.max(1200, Math.floor(viewW * 1.2));
    this.worldHeight = Math.max(800, Math.floor(viewH * 1.2));
    this.resetCamera();

    const w = this.worldWidth;
    const h = this.worldHeight;
    const totalColonies = 1 + clampedRivals;

    // Elegir al azar el epicentro de luz inicial dentro de la placa y su vector de deriva
    const margin = Math.min(200, Math.min(w, h) * 0.22);
    this.lightX = margin + Math.random() * (w - margin * 2);
    this.lightY = margin + Math.random() * (h - margin * 2);
    this.lightRadius = SimConfig.LIGHT_SPOT_RADIUS;
    const driftAngle = Math.random() * Math.PI * 2;
    this.lightVx = Math.cos(driftAngle) * SimConfig.LIGHT_DRIFT_SPEED;
    this.lightVy = Math.sin(driftAngle) * SimConfig.LIGHT_DRIFT_SPEED;

    this.envBounds.width = w;
    this.envBounds.height = h;
    this.envBounds.lightX = this.lightX;
    this.envBounds.lightY = this.lightY;
    this.envBounds.lightRadius = this.lightRadius;

    const getColonyPosition = (index: number): { x: number; y: number } => {
      if (totalColonies === 1) {
        return { x: w * 0.5, y: h * 0.5 };
      }
      const angle = (index / totalColonies) * Math.PI * 2 - Math.PI * 0.75;
      return {
        x: w * 0.5 + Math.cos(angle) * (w * 0.28),
        y: h * 0.5 + Math.sin(angle) * (h * 0.26),
      };
    };
    const colonyCenters = Array.from({ length: totalColonies }, (_, index) =>
      getColonyPosition(index)
    );
    const additionalSessileCenters: Array<{ x: number; y: number }> = [];
    const getAdditionalSessileCenter = (originIndex: number): { x: number; y: number } => {
      const margin = SimConfig.SESSILE_COLONY_SEPARATION * 0.5;
      const sameColonyDistanceSq = SimConfig.SESSILE_COLONY_SEPARATION ** 2;
      const otherColonyDistanceSq = SimConfig.SESSILE_OTHER_COLONY_CLEARANCE ** 2;
      let bestCenter = { x: margin, y: margin };
      let bestDistanceSq = -1;

      for (let attempt = 0; attempt < 64; attempt++) {
        const candidate = {
          x: margin + Math.random() * (w - margin * 2),
          y: margin + Math.random() * (h - margin * 2),
        };
        let nearestDistanceSq = Infinity;
        for (let i = 0; i < colonyCenters.length; i++) {
          const dx = candidate.x - colonyCenters[i].x;
          const dy = candidate.y - colonyCenters[i].y;
          const distanceSq = dx * dx + dy * dy;
          const requiredDistanceSq = i === originIndex ? sameColonyDistanceSq : otherColonyDistanceSq;
          if (distanceSq < requiredDistanceSq) {
            nearestDistanceSq = Math.min(nearestDistanceSq, distanceSq);
          }
        }
        for (let i = 0; i < additionalSessileCenters.length; i++) {
          const dx = candidate.x - additionalSessileCenters[i].x;
          const dy = candidate.y - additionalSessileCenters[i].y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < sameColonyDistanceSq) {
            nearestDistanceSq = Math.min(nearestDistanceSq, distanceSq);
          }
        }
        if (nearestDistanceSq > bestDistanceSq) {
          bestCenter = candidate;
          bestDistanceSq = nearestDistanceSq;
        }
        if (nearestDistanceSq === Infinity) {
          return candidate;
        }
      }
      return bestCenter;
    };
    const spawnInitialColony = (
      center: { x: number; y: number },
      centerIndex: number,
      dna: DNA
    ): void => {
      this.spawnColonyCluster(center.x, center.y, count, dna);
      if (dna.traits.motility === 'sessile') {
        const additionalCenter = getAdditionalSessileCenter(centerIndex);
        additionalSessileCenters.push(additionalCenter);
        this.spawnColonyCluster(additionalCenter.x, additionalCenter.y, count, dna);
      }
    };

    // 1. Cepa diseñada por el jugador
    spawnInitialColony(colonyCenters[0], 0, userDNA);

    // 2. Generación aleatoria de las N poblaciones rivales con nombres procedurales según sus atributos
    const shuffledMetabolisms = this.buildRandomMetabolismQueue(clampedRivals);
    let hasSessileColony = userDNA.traits.motility === 'sessile';
    for (let i = 0; i < clampedRivals; i++) {
      const hueStep = 360 / (clampedRivals + 1);
      const jitter = (Math.random() - 0.5) * (hueStep * 0.35);
      const hue = Math.round((userDNA.hue + hueStep * (i + 1) + jitter + 360) % 360);
      const rivalDNA = DNA.createRandomRival(
        `rival_${i + 1}`,
        hue,
        shuffledMetabolisms[i],
        !hasSessileColony
      );
      if (rivalDNA.traits.motility === 'sessile') {
        hasSessileColony = true;
      }
      spawnInitialColony(colonyCenters[i + 1], i + 1, rivalDNA);
    }

    // Población inicial de sustrato repartida en focos separados
    const initialClusterCount = Math.min(
      SimConfig.INITIAL_NUTRIENT_CLUSTERS,
      SimConfig.INITIAL_NUTRIENTS
    );
    const baseClusterSize = Math.floor(SimConfig.INITIAL_NUTRIENTS / initialClusterCount);
    const extraNutrients = SimConfig.INITIAL_NUTRIENTS % initialClusterCount;
    for (let i = 0; i < initialClusterCount; i++) {
      this.spawnNutrient(baseClusterSize + (i < extraNutrients ? 1 : 0));
    }

    this.recordHistorySnapshot();
    this.emitTelemetry();
  }

  /**
   * Baraja los tipos de metabolismo al azar en bloques para que las cepas rivales sean aleatorias
   * pero sin repetir innecesariamente el mismo tipo cuando hay varias colonias.
   */
  private buildRandomMetabolismQueue(count: number): MetabolismType[] {
    const base: MetabolismType[] = [
      'photosynthetic',
      'saprophyte',
      'predator',
      'fermenter',
      'chemolithotroph',
    ];
    const result: MetabolismType[] = [];
    while (result.length < count) {
      const pool = [...base];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }
      result.push(...pool);
    }
    return result.slice(0, count);
  }

  private spawnColonyCluster(cx: number, cy: number, count: number, dna: DNA): void {
    if (dna.traits.motility === 'sessile') {
      const minSpacing = dna.stats.size * 3;
      const minSpacingSq = minSpacing ** 2;
      let clusterRadius = Math.max(65, minSpacing * Math.sqrt(count) * 0.8);
      const positions: Array<{ x: number; y: number }> = [];
      const boundaryMargin = dna.stats.size + 4;
      for (let i = 0; i < count; i++) {
        let x = cx;
        let y = cy;
        let placed = false;
        while (!placed) {
          for (let attempt = 0; attempt < 128; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * clusterRadius;
            const candidateX = cx + Math.cos(angle) * distance;
            const candidateY = cy + Math.sin(angle) * distance;
            if (
              candidateX < boundaryMargin ||
              candidateX > this.worldWidth - boundaryMargin ||
              candidateY < boundaryMargin ||
              candidateY > this.worldHeight - boundaryMargin
            ) {
              continue;
            }
            let clear = true;
            for (let j = 0; j < positions.length; j++) {
              const dx = candidateX - positions[j].x;
              const dy = candidateY - positions[j].y;
              if (dx * dx + dy * dy < minSpacingSq) {
                clear = false;
                break;
              }
            }
            if (clear) {
              x = candidateX;
              y = candidateY;
              placed = true;
              break;
            }
          }
          if (!placed) {
            clusterRadius *= 1.25;
          }
        }
        positions.push({ x, y });
        this.bacteria.push(new Bacteria(x, y, dna));
      }
      return;
    }

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 65;
      const x = Math.min(this.worldWidth - 20, Math.max(20, cx + Math.cos(a) * r));
      const y = Math.min(this.worldHeight - 20, Math.max(20, cy + Math.sin(a) * r));
      this.bacteria.push(new Bacteria(x, y, dna));
    }
  }

  public spawnNutrient(count: number = 1): void {
    const margin = SimConfig.NUTRIENT_CLUSTER_RADIUS + 20;
    let center = { x: margin, y: margin };
    let bestDistanceSq = -1;
    const minimumDistanceSq = SimConfig.NUTRIENT_CLUSTER_SEPARATION ** 2;

    for (let attempt = 0; attempt < 64; attempt++) {
      const candidate = {
        x: margin + Math.random() * (this.worldWidth - margin * 2),
        y: margin + Math.random() * (this.worldHeight - margin * 2),
      };
      let nearestDistanceSq = Infinity;
      for (let i = 0; i < this.nutrientClusterCenters.length; i++) {
        const dx = candidate.x - this.nutrientClusterCenters[i].x;
        const dy = candidate.y - this.nutrientClusterCenters[i].y;
        nearestDistanceSq = Math.min(nearestDistanceSq, dx * dx + dy * dy);
      }
      if (nearestDistanceSq > bestDistanceSq) {
        center = candidate;
        bestDistanceSq = nearestDistanceSq;
      }
      if (nearestDistanceSq >= minimumDistanceSq) {
        center = candidate;
        break;
      }
    }
    this.nutrientClusterCenters.push(center);
    if (this.nutrientClusterCenters.length > 8) {
      this.nutrientClusterCenters.shift();
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * SimConfig.NUTRIENT_CLUSTER_RADIUS;
      this.nutrients.push(
        new Nutrient(
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius,
          SimConfig.BASE_NUTRIENT_ENERGY,
          false
        )
      );
    }
  }

  public removeNutrients(count: number): void {
    const removeCount = Math.min(Math.max(0, Math.floor(count)), this.nutrients.length);
    for (let i = 0; i < removeCount; i++) {
      const index = Math.floor(Math.random() * this.nutrients.length);
      const lastIndex = this.nutrients.length - 1;
      this.nutrients[index] = this.nutrients[lastIndex];
      this.nutrients.pop();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.25, Math.min(8, scale));
  }

  public adjustLightRadius(change: number): void {
    this.lightRadius = Math.max(
      SimConfig.LIGHT_SPOT_RADIUS_MIN,
      Math.min(SimConfig.LIGHT_SPOT_RADIUS_MAX, this.lightRadius + change)
    );
    this.envBounds.lightRadius = this.lightRadius;
  }

  public setDetailMode(mode: DetailMode): void {
    this.detailMode = mode;
  }

  public getSelectedBacteria(): Bacteria | null {
    if (this.selectedBacteriaId === null) return null;
    for (let i = 0; i < this.bacteria.length; i++) {
      if (this.bacteria[i].id === this.selectedBacteriaId) {
        return this.bacteria[i];
      }
    }
    this.selectedBacteriaId = null;
    return null;
  }

  public selectBacteriaAtScreenPoint(screenX: number, screenY: number): Bacteria | null {
    const worldX = (screenX - this.camera.x) / this.camera.zoom;
    const worldY = (screenY - this.camera.y) / this.camera.zoom;

    let closest: Bacteria | null = null;
    let minDistSq = (26 / this.camera.zoom) ** 2;

    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      const dSq = (b.x - worldX) ** 2 + (b.y - worldY) ** 2;
      if (dSq <= Math.max(minDistSq, (b.radius * 1.8) ** 2)) {
        minDistSq = dSq;
        closest = b;
      }
    }

    this.selectedBacteriaId = closest ? closest.id : null;
    return closest;
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const rawDt = Math.max(0.001, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    this.fps = this.fps * 0.9 + (1 / rawDt) * 0.1;

    const dt = Math.min(rawDt, 0.04);

    if (!this.isPaused) {
      // Sub-stepping cuando timeScale > 1 para mantener precisión física
      const steps = this.timeScale > 1 ? Math.round(this.timeScale) : 1;
      const stepDt = (dt * this.timeScale) / steps;
      for (let s = 0; s < steps; s++) {
        this.update(stepDt);
      }
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.elapsedTime += dt;
    this.historyTimer += dt;

    // Deriva suave del epicentro de luz dentro de la placa
    const margin = Math.min(180, Math.min(this.worldWidth, this.worldHeight) * 0.2);
    this.lightX += this.lightVx * dt;
    this.lightY += this.lightVy * dt;
    if (this.lightX < margin) {
      this.lightX = margin;
      this.lightVx = Math.abs(this.lightVx);
    } else if (this.lightX > this.worldWidth - margin) {
      this.lightX = this.worldWidth - margin;
      this.lightVx = -Math.abs(this.lightVx);
    }
    if (this.lightY < margin) {
      this.lightY = margin;
      this.lightVy = Math.abs(this.lightVy);
    } else if (this.lightY > this.worldHeight - margin) {
      this.lightY = this.worldHeight - margin;
      this.lightVy = -Math.abs(this.lightVy);
    }

    this.envBounds.width = this.worldWidth;
    this.envBounds.height = this.worldHeight;
    this.envBounds.lightX = this.lightX;
    this.envBounds.lightY = this.lightY;

    this.offspringBuffer.length = 0;

    // 1. Generación lenta de nuevos focos de sustrato
    if (this.nutrients.length < SimConfig.MAX_NUTRIENTS) {
      this.nutrientSpawnTimer += dt;
      if (this.nutrientSpawnTimer >= SimConfig.NUTRIENT_CLUSTER_INTERVAL) {
        this.nutrientSpawnTimer -= SimConfig.NUTRIENT_CLUSTER_INTERVAL;
        this.spawnNutrient(
          Math.min(
            SimConfig.NUTRIENT_CLUSTER_SIZE,
            SimConfig.MAX_NUTRIENTS - this.nutrients.length
          )
        );
      }
    } else {
      this.nutrientSpawnTimer = 0;
    }

    // 2. Reconstrucción de ambos Spatial Hash Grids O(N) Zero-GC
    this.gridNutrients.build(this.nutrients);
    this.gridBacteria.build(this.bacteria);

    // 3. Actualización de agentes
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.isDead) continue;
      const child = b.update(dt, this.gridNutrients, this.gridBacteria, this.envBounds);
      if (child) {
        this.offspringBuffer.push(child);
      }
    }

    // 4. Compactación in-place de bacterias muertas (Zero-GC) y generación de detritus orgánico
    let writeB = 0;
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.isDead) {
        const corpseEnergy = b.dna.stats.splitEnergy * SimConfig.CORPSE_ENERGY_RATIO;
        this.nutrients.push(new Nutrient(b.x, b.y, corpseEnergy, true));
      } else {
        this.bacteria[writeB++] = b;
      }
    }
    this.bacteria.length = writeB;

    // 5. Inserción de descendencia
    for (let i = 0; i < this.offspringBuffer.length; i++) {
      this.bacteria.push(this.offspringBuffer[i]);
    }

    // 6. Compactación in-place de nutrientes consumidos (Zero-GC)
    let writeN = 0;
    for (let i = 0; i < this.nutrients.length; i++) {
      const n = this.nutrients[i];
      if (!n.isDead) {
        this.nutrients[writeN++] = n;
      }
    }
    this.nutrients.length = writeN;

    // 7. Registro periódico de telemetría (cada 0.4s de tiempo simulado)
    if (this.historyTimer >= 0.4) {
      this.historyTimer = 0;
      this.recordHistorySnapshot();
      this.emitTelemetry();
    }
  }

  private recordHistorySnapshot(): void {
    const counts: Record<string, number> = {};
    for (let i = 0; i < this.bacteria.length; i++) {
      const id = this.bacteria[i].dna.lineageId;
      counts[id] = (counts[id] || 0) + 1;
    }
    this.history.push({ time: this.elapsedTime, counts });
    if (this.history.length > 140) {
      this.history.shift();
    }
  }

  private emitTelemetry(): void {
    if (!this.onTelemetryCallback) return;

    const map = new Map<
      string,
      {
        lineageName: string;
        count: number;
        spores: number;
        hueSum: number;
        maxGen: number;
        energySum: number;
      }
    >();

    let maxGeneration = 1;
    let totalSpores = 0;

    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.dna.generation > maxGeneration) maxGeneration = b.dna.generation;
      if (b.isSpore) totalSpores++;

      let entry = map.get(b.dna.lineageId);
      if (!entry) {
        entry = {
          lineageName: b.dna.lineageName,
          count: 0,
          spores: 0,
          hueSum: 0,
          maxGen: 1,
          energySum: 0,
        };
        map.set(b.dna.lineageId, entry);
      }
      entry.count++;
      if (b.isSpore) entry.spores++;
      entry.hueSum += b.dna.hue;
      entry.energySum += b.energy;
      if (b.dna.generation > entry.maxGen) entry.maxGen = b.dna.generation;
    }

    const lineages: LineageSummary[] = [];
    for (const [lineageId, data] of map.entries()) {
      lineages.push({
        lineageId,
        lineageName: data.lineageName,
        count: data.count,
        spores: data.spores,
        avgHue: Math.round(data.hueSum / data.count),
        maxGeneration: data.maxGen,
        avgEnergy: Math.round(data.energySum / data.count),
      });
    }
    lineages.sort((a, b) => b.count - a.count);

    this.onTelemetryCallback({
      elapsedTime: this.elapsedTime,
      totalBacteria: this.bacteria.length,
      totalSpores,
      totalNutrients: this.nutrients.length,
      maxGeneration,
      fps: Math.round(this.fps),
      lineages,
      history: this.history,
    });
  }

  private render(): void {
    const dpr = window.devicePixelRatio || 1;
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;

    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fondo exterior oscuro
    this.ctx.fillStyle = '#070b14';
    this.ctx.fillRect(0, 0, viewW, viewH);

    // Transformación de cámara (Pan & Zoom)
    this.ctx.translate(this.camera.x, this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // Placa de cultivo (mundo) en penumbra con epicentro luminoso acotado
    this.ctx.fillStyle = '#090e1a';
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    const spotRadius = this.lightRadius;
    const lightGrad = this.ctx.createRadialGradient(
      this.lightX,
      this.lightY,
      15,
      this.lightX,
      this.lightY,
      spotRadius * 1.35
    );
    lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    lightGrad.addColorStop(0.45, 'rgba(30, 64, 115, 0.14)');
    lightGrad.addColorStop(1, 'rgba(9, 14, 26, 0)');

    this.ctx.fillStyle = lightGrad;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Halo delimitador sutil del epicentro de luz
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.14)';
    this.ctx.lineWidth = 1.2;
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();
    this.ctx.arc(this.lightX, this.lightY, spotRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();

    // Retícula sutil de microscopía
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    this.ctx.lineWidth = 1;
    const step = SimConfig.CELL_SIZE * 2;
    this.ctx.beginPath();
    for (let x = step; x < this.worldWidth; x += step) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.worldHeight);
    }
    for (let y = step; y < this.worldHeight; y += step) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.worldWidth, y);
    }
    this.ctx.stroke();

    // Borde de la placa
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

    const lowDetail =
      this.detailMode === 'low' ||
      (this.detailMode === 'auto' &&
        (this.camera.zoom < SimConfig.AUTO_DETAIL_ZOOM_THRESHOLD ||
          this.bacteria.length > SimConfig.AUTO_DETAIL_POPULATION_THRESHOLD));

    // 1. Renderizar nutrientes y detritus orgánico
    for (let i = 0; i < this.nutrients.length; i++) {
      ProceduralRenderer.renderNutrient(this.ctx, this.nutrients[i]);
    }

    // 2. Renderizar bacterias
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      ProceduralRenderer.renderBacteria(
        this.ctx,
        b,
        lowDetail,
        b.id === this.selectedBacteriaId
      );
    }

    this.ctx.restore();
  }
}
