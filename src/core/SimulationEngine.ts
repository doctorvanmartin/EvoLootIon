import { Bacteria } from '../models/Bacteria';
import { DNA } from '../models/DNA';
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

export class SimulationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bacteria: Bacteria[] = [];
  private nutrients: Nutrient[] = [];
  private offspringBuffer: Bacteria[] = [];

  private gridNutrients = new SpatialHashGrid<Nutrient>(SimConfig.CELL_SIZE);
  private gridBacteria = new SpatialHashGrid<Bacteria>(SimConfig.CELL_SIZE);

  private worldWidth: number = 1400;
  private worldHeight: number = 900;

  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private timeScale: number = 1;
  private forceLowDetail: boolean = false;

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

  public initColonies(userDNA: DNA): void {
    this.bacteria.length = 0;
    this.nutrients.length = 0;
    this.history.length = 0;
    this.elapsedTime = 0;
    this.historyTimer = 0;
    this.selectedBacteriaId = null;

    const viewW = this.canvas.clientWidth || 900;
    const viewH = this.canvas.clientHeight || 650;
    this.worldWidth = Math.max(1200, Math.floor(viewW * 1.2));
    this.worldHeight = Math.max(800, Math.floor(viewH * 1.2));
    this.resetCamera();

    const w = this.worldWidth;
    const h = this.worldHeight;
    const count = SimConfig.INITIAL_COLONY_SIZE;

    // 1. Cepa diseñada por el jugador
    this.spawnColonyCluster(w * 0.25, h * 0.35, count, userDNA);

    // 2. Cepa rival A: Predadora / Fagocítica agresiva
    const predatorDNA = new DNA(
      'rival_predator',
      350,
      {
        metabolism: 'predator',
        motility: 'flagellated',
        wall: 'gram_negative',
        reproduction: 'binary_fission',
        interaction: 'neutral',
      },
      {
        size: 9.5,
        maxSpeed: 2.9,
        splitEnergy: 145,
        basalMetabolism: 0,
        dragFactor: 0,
        toxinPower: 0,
        armor: 2.5,
        perceptionRadius: 130,
        mutationRate: 0.05,
      },
      1,
      'Vibrio Vorax (Predadora)'
    );
    this.spawnColonyCluster(w * 0.75, h * 0.35, count, predatorDNA);

    // 3. Cepa rival B: Saprófita con Quorum Sensing y esporulación
    const quorumDNA = new DNA(
      'rival_quorum',
      275,
      {
        metabolism: 'saprophyte',
        motility: 'ciliated',
        wall: 'gram_positive',
        reproduction: 'sporulation',
        interaction: 'quorum_sensing',
      },
      {
        size: 8.5,
        maxSpeed: 1.8,
        splitEnergy: 130,
        basalMetabolism: 0,
        dragFactor: 0,
        toxinPower: 2.8,
        armor: 6.5,
        perceptionRadius: 105,
        mutationRate: 0.04,
      },
      1,
      'Bacillus Quorum (Defensiva)'
    );
    this.spawnColonyCluster(w * 0.28, h * 0.72, count, quorumDNA);

    // 4. Cepa rival C: Fotosintética / Formadora de cápsula con gemación
    const photoDNA = new DNA(
      'rival_photo',
      160,
      {
        metabolism: 'photosynthetic',
        motility: 'ciliated',
        wall: 'capsule',
        reproduction: 'budding',
        interaction: 'bacteriocins',
      },
      {
        size: 8.0,
        maxSpeed: 1.1,
        splitEnergy: 120,
        basalMetabolism: 0,
        dragFactor: 0,
        toxinPower: 1.4,
        armor: 4.0,
        perceptionRadius: 85,
        mutationRate: 0.05,
      },
      1,
      'Cyanococcus Lux (Fotosintética)'
    );
    this.spawnColonyCluster(w * 0.72, h * 0.72, count, photoDNA);

    // Población inicial de sustrato
    for (let i = 0; i < SimConfig.INITIAL_NUTRIENTS; i++) {
      this.spawnNutrient();
    }

    this.recordHistorySnapshot();
    this.emitTelemetry();
  }

  private spawnColonyCluster(cx: number, cy: number, count: number, dna: DNA): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 65;
      const x = Math.min(this.worldWidth - 20, Math.max(20, cx + Math.cos(a) * r));
      const y = Math.min(this.worldHeight - 20, Math.max(20, cy + Math.sin(a) * r));
      this.bacteria.push(new Bacteria(x, y, dna));
    }
  }

  public spawnNutrient(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      this.nutrients.push(
        new Nutrient(
          20 + Math.random() * (this.worldWidth - 40),
          20 + Math.random() * (this.worldHeight - 40),
          SimConfig.BASE_NUTRIENT_ENERGY,
          false
        )
      );
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

  public setForceLowDetail(lowDetail: boolean): void {
    this.forceLowDetail = lowDetail;
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

    const bounds = { width: this.worldWidth, height: this.worldHeight };
    this.offspringBuffer.length = 0;

    // 1. Generación pasiva de sustrato
    if (
      this.nutrients.length < SimConfig.MAX_NUTRIENTS &&
      Math.random() < SimConfig.NUTRIENT_SPAWN_RATE
    ) {
      this.spawnNutrient();
    }

    // 2. Reconstrucción de ambos Spatial Hash Grids O(N) Zero-GC
    this.gridNutrients.build(this.nutrients);
    this.gridBacteria.build(this.bacteria);

    // 3. Actualización de agentes
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.isDead) continue;
      const child = b.update(dt, this.gridNutrients, this.gridBacteria, bounds);
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

    // Placa de cultivo (mundo) con gradiente radial de irradiancia luminosa
    const cx = this.worldWidth * 0.5;
    const cy = this.worldHeight * 0.5;
    const lightGrad = this.ctx.createRadialGradient(
      cx,
      cy,
      40,
      cx,
      cy,
      Math.max(this.worldWidth, this.worldHeight) * 0.65
    );
    lightGrad.addColorStop(0, '#13233f');
    lightGrad.addColorStop(0.55, '#0f172a');
    lightGrad.addColorStop(1, '#090e1a');

    this.ctx.fillStyle = lightGrad;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

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

    // Nivel de Detalle (LOD) automático o forzado
    const lowDetail =
      this.forceLowDetail ||
      this.camera.zoom < SimConfig.LOD_ZOOM_THRESHOLD ||
      this.bacteria.length > SimConfig.LOD_POPULATION_THRESHOLD;

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
