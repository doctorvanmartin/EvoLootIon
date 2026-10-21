import { Bacteria, WorldEnvironment } from '../models/Bacteria';
import { DNA, MetabolismType } from '../models/DNA';
import { Bacteriophage, HostAgentId, Neutrophil } from '../models/HostAgents';
import { createKnownSpeciesDNA, KnownSpeciesId } from '../models/KnownSpeciesCatalog';
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
  totalPhages: number;
  totalNeutrophils: number;
  maxGeneration: number;
  fps: number;
  isPaused: boolean;
  lineages: LineageSummary[];
  history: Array<{ time: number; counts: Record<string, number> }>;
}

export type DetailMode = 'auto' | 'low' | 'high';

export class SimulationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bacteria: Bacteria[] = [];
  private nutrients: Nutrient[] = [];
  private phages: Bacteriophage[] = [];
  private neutrophils: Neutrophil[] = [];
  private offspringBuffer: Bacteria[] = [];
  private nutrientClusterCenters: Array<{ x: number; y: number }> = [];
  private nutrientSpawnTimer: number = 0;
  private autoSubstrateEnabled: boolean = true;
  private autoPhagesEnabled: boolean = false;
  private autoNeutrophilsEnabled: boolean = false;
  private phageWaveTimer: number = 0;
  private neutrophilWaveTimer: number = 0;

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
  public isFollowingSelected: boolean = false;
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
    this.isFollowingSelected = false;
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;
    const fitZoom = Math.min(viewW / this.worldWidth, viewH / this.worldHeight) * 0.94;
    this.camera.zoom = Math.max(0.4, Math.min(1.5, fitZoom));
    this.camera.x = (viewW - this.worldWidth * this.camera.zoom) * 0.5;
    this.camera.y = (viewH - this.worldHeight * this.camera.zoom) * 0.5;
  }

  public centerCameraOn(worldX: number, worldY: number): void {
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;
    this.camera.x = viewW * 0.5 - worldX * this.camera.zoom;
    this.camera.y = viewH * 0.5 - worldY * this.camera.zoom;
  }

  public stopFollowingSelected(): void {
    this.isFollowingSelected = false;
  }

  public initColonies(
    userDNA: DNA,
    rivalCount: number = SimConfig.DEFAULT_RIVAL_COLONIES,
    initialColonySize: number = SimConfig.INITIAL_COLONY_SIZE,
    knownSpeciesIds: readonly KnownSpeciesId[] = [],
    customRivalDNAs: readonly DNA[] = [],
    initialHostAgents: readonly HostAgentId[] = []
  ): void {
    this.bacteria.length = 0;
    this.nutrients.length = 0;
    this.phages.length = 0;
    this.neutrophils.length = 0;
    this.nutrientClusterCenters.length = 0;
    this.nutrientSpawnTimer = 0;
    this.autoSubstrateEnabled = true;
    this.autoPhagesEnabled = initialHostAgents.includes('bacteriophage_t4');
    this.autoNeutrophilsEnabled = initialHostAgents.includes('neutrophil_pmn');
    this.phageWaveTimer = 0;
    this.neutrophilWaveTimer = 0;
    this.history.length = 0;
    this.elapsedTime = 0;
    this.historyTimer = 0;
    this.selectedBacteriaId = null;
    this.isFollowingSelected = false;

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
    const totalColonies = 1 + clampedRivals + knownSpeciesIds.length + customRivalDNAs.length;

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

    // 2. Poblaciones rivales generadas al azar
    const shuffledMetabolisms = this.buildRandomMetabolismQueue(clampedRivals);
    let hasSessileColony = userDNA.traits.motility === 'sessile';
    const hasCustomSessileRival = customRivalDNAs.some(
      (dna) => dna.traits.motility === 'sessile'
    );
    for (let i = 0; i < clampedRivals; i++) {
      const hueStep = 360 / totalColonies;
      const jitter = (Math.random() - 0.5) * (hueStep * 0.35);
      const hue = Math.round((userDNA.hue + hueStep * (i + 1) + jitter + 360) % 360);
      const rivalDNA = DNA.createRandomRival(
        `rival_${i + 1}`,
        hue,
        shuffledMetabolisms[i],
        !hasSessileColony && !hasCustomSessileRival
      );
      if (rivalDNA.traits.motility === 'sessile') {
        hasSessileColony = true;
      }
      spawnInitialColony(colonyCenters[i + 1], i + 1, rivalDNA);
    }

    // 3. Perfiles de referencia seleccionados, además de las poblaciones aleatorias
    for (let i = 0; i < knownSpeciesIds.length; i++) {
      const colonyIndex = clampedRivals + i + 1;
      const hueStep = 360 / totalColonies;
      const hue = Math.round((userDNA.hue + hueStep * colonyIndex + 360) % 360);
      const speciesDNA = createKnownSpeciesDNA(knownSpeciesIds[i], hue);
      spawnInitialColony(colonyCenters[colonyIndex], colonyIndex, speciesDNA);
    }

    // 4. Cepas rivales personalizadas introducidas por cadena codificante de ADN
    for (let i = 0; i < customRivalDNAs.length; i++) {
      const colonyIndex = clampedRivals + knownSpeciesIds.length + i + 1;
      const sourceDNA = customRivalDNAs[i];
      const traits = { ...sourceDNA.traits };
      const stats = { ...sourceDNA.stats };
      const defaultProceduralName = DNA.generateProceduralName(
        sourceDNA.traits,
        sourceDNA.stats
      );
      const hasCustomName = sourceDNA.lineageName !== defaultProceduralName;

      if (traits.motility === 'sessile') {
        if (hasSessileColony) {
          traits.motility = 'nonmotile';
          stats.maxSpeed = 0;
        } else {
          hasSessileColony = true;
        }
      }

      const customColonyDNA = new DNA(
        `custom_rival_${i + 1}`,
        sourceDNA.hue,
        traits,
        stats,
        1,
        hasCustomName ? sourceDNA.lineageName : undefined,
        sourceDNA.referenceSpecies
      );
      spawnInitialColony(colonyCenters[colonyIndex], colonyIndex, customColonyDNA);
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

    // 5. Agentes biológicos externos seleccionados desde el inicio (Bacteriófagos T4 y Neutrófilos)
    if (this.autoPhagesEnabled) {
      this.spawnPhages(SimConfig.INITIAL_PHAGE_COUNT, true, 2.2);
    }
    if (this.autoNeutrophilsEnabled) {
      this.spawnNeutrophils(SimConfig.INITIAL_NEUTROPHIL_COUNT, true);
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
      'chemoheterotroph',
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
    const isSessile = dna.traits.motility === 'sessile';
    const spacingFactor = isSessile ? 3.0 : 2.65;
    const minSpacing = dna.stats.size * spacingFactor;
    let clusterRadius = Math.max(68, minSpacing * Math.sqrt(count) * 0.88);
    const boundaryMargin = dna.stats.size + 8;

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
          for (let j = 0; j < this.bacteria.length; j++) {
            const existing = this.bacteria[j];
            const requiredDist =
              (dna.stats.size + existing.radius) *
              (isSessile && existing.dna.traits.motility === 'sessile' ? 1.5 : 1.32);
            const dx = candidateX - existing.x;
            const dy = candidateY - existing.y;
            if (dx * dx + dy * dy < requiredDist * requiredDist) {
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
      this.bacteria.push(new Bacteria(x, y, dna));
    }
  }

  public spawnNutrient(count: number = 1, enableAutoSpawn: boolean = false): void {
    if (enableAutoSpawn) {
      this.autoSubstrateEnabled = true;
    }
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
    this.autoSubstrateEnabled = false;
    this.nutrientSpawnTimer = 0;
    const removeCount = Math.min(Math.max(0, Math.floor(count)), this.nutrients.length);
    for (let i = 0; i < removeCount; i++) {
      const index = Math.floor(Math.random() * this.nutrients.length);
      const lastIndex = this.nutrients.length - 1;
      this.nutrients[index] = this.nutrients[lastIndex];
      this.nutrients.pop();
    }
  }

  public spawnPhages(
    count: number = SimConfig.MANUAL_PHAGE_WAVE_COUNT,
    enableAutoSpawn: boolean = false,
    initialCooldown: number = 0.25
  ): void {
    if (enableAutoSpawn) {
      this.autoPhagesEnabled = true;
    }
    const available = Math.max(0, SimConfig.MAX_PHAGES - this.phages.length);
    const toSpawn = Math.min(Math.max(0, Math.floor(count)), available);
    if (toSpawn <= 0) return;

    const margin = 60;
    const centerX = margin + Math.random() * Math.max(100, this.worldWidth - margin * 2);
    const centerY = margin + Math.random() * Math.max(100, this.worldHeight - margin * 2);

    for (let i = 0; i < toSpawn; i++) {
      const angle = (i / toSpawn) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = Math.sqrt(Math.random()) * 42;
      this.phages.push(
        new Bacteriophage(
          centerX + Math.cos(angle) * dist,
          centerY + Math.sin(angle) * dist,
          angle,
          initialCooldown
        )
      );
    }
    this.emitTelemetry();
  }

  public removePhages(count: number = SimConfig.MANUAL_PHAGE_WAVE_COUNT): void {
    this.autoPhagesEnabled = false;
    this.phageWaveTimer = 0;
    const removeCount = Math.min(Math.max(0, Math.floor(count)), this.phages.length);
    for (let i = 0; i < removeCount; i++) {
      const index = Math.floor(Math.random() * this.phages.length);
      const lastIndex = this.phages.length - 1;
      this.phages[index] = this.phages[lastIndex];
      this.phages.pop();
    }
    if (this.phages.length === 0) {
      // Si se retiran todos los fagos, limpiar también infecciones en curso
      for (let i = 0; i < this.bacteria.length; i++) {
        this.bacteria[i].isInfectedByPhage = false;
        this.bacteria[i].phageInfectionProgress = 0;
        this.bacteria[i].burstPhagesPending = false;
      }
    }
    this.emitTelemetry();
  }

  public spawnNeutrophils(
    count: number = SimConfig.MANUAL_NEUTROPHIL_COUNT,
    enableAutoSpawn: boolean = false
  ): void {
    if (enableAutoSpawn) {
      this.autoNeutrophilsEnabled = true;
    }
    const available = Math.max(0, SimConfig.MAX_NEUTROPHILS - this.neutrophils.length);
    const toSpawn = Math.min(Math.max(0, Math.floor(count)), available);
    if (toSpawn <= 0) return;

    const margin = 80;
    for (let i = 0; i < toSpawn; i++) {
      const x = margin + Math.random() * Math.max(100, this.worldWidth - margin * 2);
      const y = margin + Math.random() * Math.max(100, this.worldHeight - margin * 2);
      this.neutrophils.push(new Neutrophil(x, y));
    }
    this.emitTelemetry();
  }

  public removeNeutrophils(count: number = SimConfig.MANUAL_NEUTROPHIL_COUNT): void {
    this.autoNeutrophilsEnabled = false;
    this.neutrophilWaveTimer = 0;
    const removeCount = Math.min(Math.max(0, Math.floor(count)), this.neutrophils.length);
    for (let i = 0; i < removeCount; i++) {
      const index = Math.floor(Math.random() * this.neutrophils.length);
      const lastIndex = this.neutrophils.length - 1;
      this.neutrophils[index] = this.neutrophils[lastIndex];
      this.neutrophils.pop();
    }
    this.emitTelemetry();
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
    this.isFollowingSelected = false;
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

    if (closest) {
      this.selectedBacteriaId = closest.id;
      this.isFollowingSelected = true;
      this.centerCameraOn(closest.x, closest.y);
    } else {
      this.selectedBacteriaId = null;
      this.isFollowingSelected = false;
    }
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
        if (this.isPaused) break;
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

    // 1. Generación lenta de nuevos focos de sustrato (si no ha sido desconectada manualmente con - Sustrato)
    if (this.autoSubstrateEnabled && this.nutrients.length < SimConfig.MAX_NUTRIENTS) {
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

    // 3. Actualización de agentes bacterianos
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.isDead) continue;
      const child = b.update(dt, this.gridNutrients, this.gridBacteria, this.envBounds);
      if (child) {
        this.offspringBuffer.push(child);
      }
      // Si la bacteria acaba de alcanzar el estallido lítico por fagos, liberar nuevos viriones
      if (b.burstPhagesPending) {
        b.burstPhagesPending = false;
        const canSpawn = Math.min(
          SimConfig.PHAGE_BURST_SIZE,
          Math.max(0, SimConfig.MAX_PHAGES - this.phages.length)
        );
        const baseAngle = Math.random() * Math.PI * 2;
        for (let p = 0; p < canSpawn; p++) {
          const ang = baseAngle + (p / SimConfig.PHAGE_BURST_SIZE) * Math.PI * 2;
          const dist = b.radius * 0.85;
          this.phages.push(
            new Bacteriophage(
              b.x + Math.cos(ang) * dist,
              b.y + Math.sin(ang) * dist,
              ang,
              SimConfig.PHAGE_SPAWN_COOLDOWN
            )
          );
        }
      }
    }

    // 3.b Actualización y compactación in-place de Bacteriófagos T4 (Zero-GC)
    let writeP = 0;
    for (let i = 0; i < this.phages.length; i++) {
      const p = this.phages[i];
      p.update(dt, this.gridBacteria, this.envBounds);
      if (!p.isDead) {
        this.phages[writeP++] = p;
      }
    }
    this.phages.length = writeP;

    // 3.c Actualización y compactación in-place de Neutrófilos PMN (Zero-GC)
    let writeW = 0;
    for (let i = 0; i < this.neutrophils.length; i++) {
      const n = this.neutrophils[i];
      n.update(dt, this.gridBacteria, this.envBounds);
      if (n.isDead) {
        // Al entrar en apoptosis tras su patrulla inmunitaria, el neutrófilo libera restos orgánicos ricos
        for (let k = 0; k < 3; k++) {
          const ang = (k / 3) * Math.PI * 2 + n.angle;
          this.nutrients.push(
            new Nutrient(
              n.x + Math.cos(ang) * (n.radius * 0.5),
              n.y + Math.sin(ang) * (n.radius * 0.5),
              SimConfig.BASE_NUTRIENT_ENERGY * 1.35,
              true,
              205,
              ang
            )
          );
        }
      } else {
        this.neutrophils[writeW++] = n;
      }
    }
    this.neutrophils.length = writeW;

    // 3.d Reintroducción periódica suave si los agentes externos estaban activos y se agotaron
    if (this.autoPhagesEnabled) {
      if (this.phages.length === 0) {
        this.phageWaveTimer += dt;
        if (this.phageWaveTimer >= SimConfig.HOST_AGENT_AUTO_WAVE_INTERVAL) {
          this.phageWaveTimer = 0;
          this.spawnPhages(SimConfig.MANUAL_PHAGE_WAVE_COUNT, true, 0.5);
        }
      } else {
        this.phageWaveTimer = 0;
      }
    }
    if (this.autoNeutrophilsEnabled) {
      if (this.neutrophils.length === 0) {
        this.neutrophilWaveTimer += dt;
        if (this.neutrophilWaveTimer >= SimConfig.HOST_AGENT_AUTO_WAVE_INTERVAL) {
          this.neutrophilWaveTimer = 0;
          this.spawnNeutrophils(SimConfig.INITIAL_NEUTROPHIL_COUNT, true);
        }
      } else {
        this.neutrophilWaveTimer = 0;
      }
    }

    // 4. Compactación in-place de bacterias muertas (Zero-GC) y generación de detritus orgánico
    let writeB = 0;
    for (let i = 0; i < this.bacteria.length; i++) {
      const b = this.bacteria[i];
      if (b.isDead) {
        const corpseEnergy = b.dna.stats.splitEnergy * SimConfig.CORPSE_ENERGY_RATIO;
        this.nutrients.push(
          new Nutrient(b.x, b.y, corpseEnergy, true, b.dna.hue, b.angle)
        );
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

    // 7. Si no quedan bacterias ni endosporas vivas, detener automáticamente la simulación
    if (this.bacteria.length === 0) {
      this.isPaused = true;
      this.historyTimer = 0;
      this.recordHistorySnapshot();
      this.emitTelemetry();
      return;
    }

    // 8. Registro periódico de telemetría (cada 0.4s de tiempo simulado)
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
      totalPhages: this.phages.length,
      totalNeutrophils: this.neutrophils.length,
      maxGeneration,
      fps: Math.round(this.fps),
      isPaused: this.isPaused,
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

    // Seguimiento automático de la bacteria seleccionada
    if (this.isFollowingSelected && this.selectedBacteriaId !== null) {
      const selected = this.getSelectedBacteria();
      if (selected) {
        this.centerCameraOn(selected.x, selected.y);
      }
    }

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
      ProceduralRenderer.renderNutrient(this.ctx, this.nutrients[i], lowDetail);
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

    // 3. Renderizar Glóbulos Blancos Neutrófilos (Leucocitos PMN)
    for (let i = 0; i < this.neutrophils.length; i++) {
      ProceduralRenderer.renderNeutrophil(this.ctx, this.neutrophils[i], lowDetail);
    }

    // 4. Renderizar Bacteriófagos T4
    for (let i = 0; i < this.phages.length; i++) {
      ProceduralRenderer.renderBacteriophage(this.ctx, this.phages[i], lowDetail);
    }

    this.ctx.restore();
  }
}
