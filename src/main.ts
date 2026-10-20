import {
  DNA,
  GenomeStats,
  GenomeTraits,
  InteractionType,
  MetabolismType,
  MotilityType,
  ReproductionType,
  WallType,
} from './models/DNA';
import { Bacteria } from './models/Bacteria';
import { SimulationEngine, SimulationTelemetry } from './core/SimulationEngine';
import { ProceduralRenderer } from './render/ProceduralRenderer';

// --- Referencias del DOM ---
const simCanvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
const chartCanvas = document.getElementById('chartCanvas') as HTMLCanvasElement;

const strainNameInput = document.getElementById('strainName') as HTMLInputElement;
const selMetabolism = document.getElementById('selMetabolism') as HTMLSelectElement;
const selMotility = document.getElementById('selMotility') as HTMLSelectElement;
const selWall = document.getElementById('selWall') as HTMLSelectElement;
const selReproduction = document.getElementById('selReproduction') as HTMLSelectElement;
const selInteraction = document.getElementById('selInteraction') as HTMLSelectElement;

const rngSize = document.getElementById('rngSize') as HTMLInputElement;
const rngSpeed = document.getElementById('rngSpeed') as HTMLInputElement;
const rngArmor = document.getElementById('rngArmor') as HTMLInputElement;
const rngToxin = document.getElementById('rngToxin') as HTMLInputElement;
const rngHue = document.getElementById('rngHue') as HTMLInputElement;

const valSize = document.getElementById('valSize')!;
const valSpeed = document.getElementById('valSpeed')!;
const valArmor = document.getElementById('valArmor')!;
const valToxin = document.getElementById('valToxin')!;
const valHue = document.getElementById('valHue')!;

const badgeBasal = document.getElementById('badgeBasal')!;
const badgeDrag = document.getElementById('badgeDrag')!;
const previewTraitSummary = document.getElementById('previewTraitSummary')!;

const btnDeploy = document.getElementById('btnDeploy')!;
const btnPause = document.getElementById('btnPause')!;
const btnFeed = document.getElementById('btnFeed')!;
const btnResetCam = document.getElementById('btnResetCam')!;
const btnToggleLod = document.getElementById('btnToggleLod')!;

const kpiPop = document.getElementById('kpiPop')!;
const kpiSpores = document.getElementById('kpiSpores')!;
const kpiNutrients = document.getElementById('kpiNutrients')!;
const kpiGen = document.getElementById('kpiGen')!;
const kpiFps = document.getElementById('kpiFps')!;
const lblSimTime = document.getElementById('lblSimTime')!;
const lineageList = document.getElementById('lineageList')!;

const inspectorPanel = document.getElementById('inspectorPanel')!;
const inspName = document.getElementById('inspName')!;
const inspState = document.getElementById('inspState')!;
const inspGen = document.getElementById('inspGen')!;
const inspEnergy = document.getElementById('inspEnergy')!;
const inspMeta = document.getElementById('inspMeta')!;
const inspMot = document.getElementById('inspMot')!;
const inspWall = document.getElementById('inspWall')!;
const inspRepro = document.getElementById('inspRepro')!;
const inspInter = document.getElementById('inspInter')!;
const inspArmor = document.getElementById('inspArmor')!;
const inspBasal = document.getElementById('inspBasal')!;
const inspSpeed = document.getElementById('inspSpeed')!;

// --- Construcción del ADN desde el Diseñador ---
function buildUserDNA(): DNA {
  const traits: GenomeTraits = {
    metabolism: selMetabolism.value as MetabolismType,
    motility: selMotility.value as MotilityType,
    wall: selWall.value as WallType,
    reproduction: selReproduction.value as ReproductionType,
    interaction: selInteraction.value as InteractionType,
  };

  const size = parseFloat(rngSize.value);
  const stats: GenomeStats = {
    size,
    maxSpeed: traits.motility === 'sessile' ? 0 : parseFloat(rngSpeed.value),
    splitEnergy: Math.round(95 + size * 5.5),
    basalMetabolism: 0,
    dragFactor: 0,
    toxinPower: traits.interaction === 'neutral' ? 0 : parseFloat(rngToxin.value),
    armor: parseFloat(rngArmor.value),
    perceptionRadius: 110,
    mutationRate: 0.05,
  };

  const hue = parseFloat(rngHue.value);
  const name = strainNameInput.value.trim() || 'Cepa Jugador';
  return new DNA('player_strain', hue, traits, stats, 1, name);
}

// --- Vista Previa Procedural en Tiempo Real ---
let previewDummy = new Bacteria(0, 0, buildUserDNA());

function updateDesignerReadouts(): void {
  const dna = buildUserDNA();
  previewDummy.dna = dna;

  valSize.textContent = `${dna.stats.size.toFixed(1)} px`;
  valSpeed.textContent = dna.traits.motility === 'sessile' ? '0 (Sésil)' : dna.stats.maxSpeed.toFixed(1);
  valArmor.textContent = dna.stats.armor.toFixed(1);
  valToxin.textContent = dna.traits.interaction === 'neutral' ? '0 (Neutral)' : dna.stats.toxinPower.toFixed(1);
  valHue.textContent = `${Math.round(dna.hue)}°`;

  rngSpeed.disabled = dna.traits.motility === 'sessile';
  rngToxin.disabled = dna.traits.interaction === 'neutral';

  badgeBasal.textContent = `Basal: ${dna.stats.basalMetabolism.toFixed(2)}/s`;
  badgeDrag.textContent = `Drag: ${dna.stats.dragFactor.toFixed(2)}`;

  const shapeLabel =
    dna.traits.metabolism === 'photosynthetic'
      ? 'Coco'
      : dna.traits.metabolism === 'predator'
        ? 'Espirilo/Vibrio'
        : dna.traits.metabolism === 'fermenter'
          ? 'Diplococo'
          : 'Bacilo';
  previewTraitSummary.textContent = `${shapeLabel} · Split ${dna.stats.splitEnergy}E`;
}

function animatePreview(): void {
  const ctx = previewCanvas.getContext('2d');
  if (ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = previewCanvas.clientWidth || 300;
    const h = previewCanvas.clientHeight || 115;
    if (previewCanvas.width !== Math.floor(w * dpr) || previewCanvas.height !== Math.floor(h * dpr)) {
      previewCanvas.width = Math.floor(w * dpr);
      previewCanvas.height = Math.floor(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    previewDummy.x = w * 0.5;
    previewDummy.y = h * 0.5;
    previewDummy.angle = Math.sin(performance.now() * 0.0012) * 0.18;
    previewDummy.animPhase += 0.12;
    previewDummy.isEmittingToxin = previewDummy.dna.traits.interaction !== 'neutral';

    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(2.1, 2.1);
    ctx.translate(-w * 0.5, -h * 0.5);

    ProceduralRenderer.renderBacteria(ctx, previewDummy, false, false);
    ctx.restore();
  }

  updateInspectorView();
  requestAnimationFrame(animatePreview);
}

// --- Gráfica Lotka-Volterra y Telemetría ---
const lineageColors: Record<string, number> = {
  player_strain: 195,
  rival_predator: 350,
  rival_quorum: 275,
  rival_photo: 160,
};

function renderPopulationChart(telemetry: SimulationTelemetry): void {
  const ctx = chartCanvas.getContext('2d');
  if (!ctx) return;

  const w = chartCanvas.width;
  const h = chartCanvas.height;
  ctx.clearRect(0, 0, w, h);

  for (const l of telemetry.lineages) {
    lineageColors[l.lineageId] = l.avgHue;
  }

  const history = telemetry.history;
  if (history.length < 2) return;

  let maxPop = 30;
  for (let i = 0; i < history.length; i++) {
    for (const count of Object.values(history[i].counts)) {
      if (count > maxPop) maxPop = count;
    }
  }

  const knownLineages = Object.keys(lineageColors);
  for (const id of knownLineages) {
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * (w - 8) + 4;
      const count = history[i].counts[id] || 0;
      const y = h - 6 - (count / maxPop) * (h - 14);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${lineageColors[id]}, 80%, 58%)`;
    ctx.lineWidth = id === 'player_strain' ? 2.2 : 1.4;
    ctx.stroke();
  }
}

function handleTelemetry(telemetry: SimulationTelemetry): void {
  kpiPop.textContent = String(telemetry.totalBacteria);
  kpiSpores.textContent = String(telemetry.totalSpores);
  kpiNutrients.textContent = String(telemetry.totalNutrients);
  kpiGen.textContent = String(telemetry.maxGeneration);
  kpiFps.textContent = String(telemetry.fps);
  lblSimTime.textContent = `${telemetry.elapsedTime.toFixed(1)}s`;

  lineageList.innerHTML = telemetry.lineages
    .map(
      (l) => `
      <div class="lineage-item">
        <div class="lineage-name">
          <span class="lineage-swatch" style="background: hsl(${l.avgHue}, 80%, 52%)"></span>
          <span>${l.lineageName}</span>
        </div>
        <div class="lineage-meta">
          <b>${l.count}</b> (${l.spores} esp) · G${l.maxGeneration}
        </div>
      </div>`
    )
    .join('');

  renderPopulationChart(telemetry);
}

// --- Inicialización del Motor ---
const engine = new SimulationEngine(simCanvas, handleTelemetry);

function updateInspectorView(): void {
  const b = engine.getSelectedBacteria();
  if (!b) {
    inspectorPanel.classList.remove('visible');
    return;
  }

  inspectorPanel.classList.add('visible');
  inspName.textContent = `${b.dna.lineageName} #${b.id}`;
  inspState.textContent = b.isSpore ? 'Endospora' : b.isEmittingToxin ? 'Toxina Activa' : 'Vegetativa';
  inspState.style.color = b.isSpore ? '#fbbf24' : '#4ade80';
  inspGen.textContent = String(b.dna.generation);
  inspEnergy.textContent = `${Math.round(b.energy)} / ${Math.round(b.dna.stats.splitEnergy)}`;
  inspMeta.textContent = b.dna.traits.metabolism;
  inspMot.textContent = b.dna.traits.motility;
  inspWall.textContent = b.dna.traits.wall;
  inspRepro.textContent = b.dna.traits.reproduction;
  inspInter.textContent = b.dna.traits.interaction;
  inspArmor.textContent = b.dna.stats.armor.toFixed(1);
  inspBasal.textContent = `${b.dna.stats.basalMetabolism.toFixed(2)}/s`;
  inspSpeed.textContent = b.dna.stats.maxSpeed.toFixed(1);
}

// --- Eventos de Controles ---
[selMetabolism, selMotility, selWall, selReproduction, selInteraction].forEach((el) =>
  el.addEventListener('change', updateDesignerReadouts)
);
[rngSize, rngSpeed, rngArmor, rngToxin, rngHue].forEach((el) =>
  el.addEventListener('input', updateDesignerReadouts)
);

btnDeploy.addEventListener('click', () => {
  const userDNA = buildUserDNA();
  lineageColors.player_strain = userDNA.hue;
  engine.initColonies(userDNA);
});

btnPause.addEventListener('click', () => {
  const paused = engine.togglePause();
  btnPause.textContent = paused ? 'Reanudar' : 'Pausar';
  btnPause.classList.toggle('active', paused);
});

document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-speed]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    engine.setTimeScale(parseFloat(btn.dataset.speed || '1'));
  });
});

btnFeed.addEventListener('click', () => {
  engine.spawnNutrient(35);
});

btnResetCam.addEventListener('click', () => {
  engine.resetCamera();
});

let lodForced = false;
btnToggleLod.addEventListener('click', () => {
  lodForced = !lodForced;
  engine.setForceLowDetail(lodForced);
  btnToggleLod.textContent = lodForced ? 'LOD Bajo' : 'LOD Auto';
  btnToggleLod.classList.toggle('active', lodForced);
});

// --- Cámara Interactiva (Pan, Pinch-to-Zoom y Selección por Clic/Touch) ---
const activePointers = new Map<number, { x: number; y: number }>();
let lastPinchDist = 0;
let movedDist = 0;

simCanvas.addEventListener('pointerdown', (e) => {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  simCanvas.setPointerCapture(e.pointerId);

  if (activePointers.size === 1) {
    movedDist = 0;
  } else if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  }
});

simCanvas.addEventListener('pointermove', (e) => {
  const prev = activePointers.get(e.pointerId);
  if (!prev) return;

  if (activePointers.size === 1) {
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    movedDist += Math.hypot(dx, dy);
    engine.camera.x += dx;
    engine.camera.y += dy;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  } else if (activePointers.size === 2) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(activePointers.values());
    const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

    if (lastPinchDist > 10 && dist > 10) {
      const rect = simCanvas.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) * 0.5 - rect.left;
      const midY = (pts[0].y + pts[1].y) * 0.5 - rect.top;
      const ratio = dist / lastPinchDist;
      const newZoom = Math.min(3.5, Math.max(0.3, engine.camera.zoom * ratio));

      engine.camera.x = midX - ((midX - engine.camera.x) / engine.camera.zoom) * newZoom;
      engine.camera.y = midY - ((midY - engine.camera.y) / engine.camera.zoom) * newZoom;
      engine.camera.zoom = newZoom;
    }
    lastPinchDist = dist;
    movedDist = 100; // Evitar disparo de selección tras gesto pinch
  }
});

function handlePointerEnd(e: PointerEvent): void {
  if (!activePointers.has(e.pointerId)) return;
  const wasSingleTap = activePointers.size === 1 && movedDist < 6;
  activePointers.delete(e.pointerId);

  if (simCanvas.hasPointerCapture(e.pointerId)) {
    simCanvas.releasePointerCapture(e.pointerId);
  }

  if (activePointers.size < 2) {
    lastPinchDist = 0;
  }

  if (wasSingleTap && e.type === 'pointerup') {
    const rect = simCanvas.getBoundingClientRect();
    engine.selectBacteriaAtScreenPoint(e.clientX - rect.left, e.clientY - rect.top);
    updateInspectorView();
  }
}

simCanvas.addEventListener('pointerup', handlePointerEnd);
simCanvas.addEventListener('pointercancel', handlePointerEnd);

simCanvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const rect = simCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(3.5, Math.max(0.3, engine.camera.zoom * zoomFactor));

    // Mantener el punto bajo el cursor fijo al hacer zoom
    engine.camera.x = mx - ((mx - engine.camera.x) / engine.camera.zoom) * newZoom;
    engine.camera.y = my - ((my - engine.camera.y) / engine.camera.zoom) * newZoom;
    engine.camera.zoom = newZoom;
  },
  { passive: false }
);

// --- Arranque inicial ---
updateDesignerReadouts();
engine.initColonies(buildUserDNA());
engine.start();
requestAnimationFrame(animatePreview);
