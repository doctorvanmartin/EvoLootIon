import {
  AdaptationType,
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
import { DetailMode, SimulationEngine, SimulationTelemetry } from './core/SimulationEngine';
import { ProceduralRenderer } from './render/ProceduralRenderer';
import { SimConfig } from './config/SimulationConfig';
import { AgeGroup, i18n, LocaleCode } from './i18n/i18n';

// --- Referencias del DOM ---
const genomeEditorModal = document.getElementById('genomeEditorModal')!;
const btnCloseEditor = document.getElementById('btnCloseEditor')!;
const btnOpenEditorSidebar = document.getElementById('btnOpenEditorSidebar')!;
const btnOpenEditorHud = document.getElementById('btnOpenEditorHud')!;

const simCanvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
const chartCanvas = document.getElementById('chartCanvas') as HTMLCanvasElement;

const strainNameInput = document.getElementById('strainName') as HTMLInputElement;
const traitButtons = document.querySelectorAll<HTMLButtonElement>('.trait-btn');
const langButtons = document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]');
const ageButtons = document.querySelectorAll<HTMLButtonElement>('[data-age-btn]');

const rngSize = document.getElementById('rngSize') as HTMLInputElement;
const rngSpeed = document.getElementById('rngSpeed') as HTMLInputElement;
const rngArmor = document.getElementById('rngArmor') as HTMLInputElement;
const rngPerception = document.getElementById('rngPerception') as HTMLInputElement;
const rngToxin = document.getElementById('rngToxin') as HTMLInputElement;
const rngHue = document.getElementById('rngHue') as HTMLInputElement;
const rngInitialPop = document.getElementById('rngInitialPop') as HTMLInputElement;
const rngRivals = document.getElementById('rngRivals') as HTMLInputElement;

const valSize = document.getElementById('valSize')!;
const valSpeed = document.getElementById('valSpeed')!;
const valArmor = document.getElementById('valArmor')!;
const valPerception = document.getElementById('valPerception')!;
const valToxin = document.getElementById('valToxin')!;
const valHue = document.getElementById('valHue')!;
const valInitialPop = document.getElementById('valInitialPop')!;
const valRivals = document.getElementById('valRivals')!;

const locusMetabolism = document.getElementById('locusMetabolism')!;
const locusMotility = document.getElementById('locusMotility')!;
const locusWall = document.getElementById('locusWall')!;
const locusReproduction = document.getElementById('locusReproduction')!;
const locusInteraction = document.getElementById('locusInteraction')!;
const locusAdaptation = document.getElementById('locusAdaptation')!;
const locusHue = document.getElementById('locusHue')!;

const dnaStrandDisplay = document.getElementById('dnaStrandDisplay')!;
const previewTaxonomyName = document.getElementById('previewTaxonomyName')!;
const previewTraitSummary = document.getElementById('previewTraitSummary')!;

const badgeEfficiency = document.getElementById('badgeEfficiency')!;
const badgeBasal = document.getElementById('badgeBasal')!;
const badgeDrag = document.getElementById('badgeDrag')!;
const badgeToxinCost = document.getElementById('badgeToxinCost')!;
const badgeTotalCost = document.getElementById('badgeTotalCost')!;

const activeStrainTitle = document.getElementById('activeStrainTitle')!;
const activeStrainTaxonomy = document.getElementById('activeStrainTaxonomy')!;
const activeStrainDna = document.getElementById('activeStrainDna')!;

const btnDeploy = document.getElementById('btnDeploy')!;
const btnPause = document.getElementById('btnPause')!;
const btnFeed = document.getElementById('btnFeed')!;
const btnRemoveSubstrate = document.getElementById('btnRemoveSubstrate')!;
const btnDecreaseLightRadius = document.getElementById('btnDecreaseLightRadius')!;
const btnIncreaseLightRadius = document.getElementById('btnIncreaseLightRadius')!;
const btnResetCam = document.getElementById('btnResetCam')!;
const btnToggleDetail = document.getElementById('btnToggleDetail')!;

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
const inspCodingStrand = document.getElementById('inspCodingStrand')!;
const inspGen = document.getElementById('inspGen')!;
const inspEnergyTrack = document.getElementById('inspEnergyTrack')!;
const inspEnergyFill = document.getElementById('inspEnergyFill')!;
const inspMeta = document.getElementById('inspMeta')!;
const inspMot = document.getElementById('inspMot')!;
const inspWall = document.getElementById('inspWall')!;
const inspRepro = document.getElementById('inspRepro')!;
const inspInter = document.getElementById('inspInter')!;
const inspArmor = document.getElementById('inspArmor')!;
const inspBasal = document.getElementById('inspBasal')!;
const inspSpeed = document.getElementById('inspSpeed')!;

// --- Estado de Selección de las Categorías Biológicas y Adaptación Única ---
const selectedTraits: GenomeTraits = {
  metabolism: 'saprophyte',
  motility: 'flagellated',
  wall: 'gram_positive',
  reproduction: 'binary_fission',
  interaction: 'bacteriocins',
  adaptation: 'none',
};

function pickRandom<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function randomizeSlider(input: HTMLInputElement): void {
  const min = Number(input.min);
  const max = Number(input.max);
  const step = Number(input.step);
  const stepCount = Math.floor((max - min) / step);
  const value = min + Math.floor(Math.random() * (stepCount + 1)) * step;
  input.value = String(Number(value.toFixed(6)));
}

function randomizeInitialSelection(): void {
  selectedTraits.metabolism = pickRandom([
    'photosynthetic',
    'saprophyte',
    'predator',
    'fermenter',
    'chemolithotroph',
  ]);
  selectedTraits.motility = pickRandom(
    selectedTraits.metabolism === 'predator'
      ? ['flagellated', 'ciliated', 'spirochete']
      : ['sessile', 'flagellated', 'ciliated', 'spirochete']
  );
  selectedTraits.wall = pickRandom(['gram_negative', 'gram_positive', 'capsule', 's_layer']);
  selectedTraits.reproduction = pickRandom([
    'binary_fission',
    'budding',
    'sporulation',
    'conjugation',
  ]);
  selectedTraits.interaction = pickRandom([
    'neutral',
    'bacteriocins',
    'quorum_sensing',
    'siderophores',
  ]);
  selectedTraits.adaptation = pickRandom([
    'none',
    'claws',
    'giant_maw',
    'spikes',
    'bioluminescence',
    'suction_pore',
  ]);

  [rngSize, rngSpeed, rngArmor, rngPerception, rngToxin, rngHue].forEach(
    randomizeSlider
  );

  traitButtons.forEach((btn) => {
    const category = btn.dataset.trait as keyof GenomeTraits | undefined;
    if (category) {
      btn.classList.toggle('active', selectedTraits[category] === btn.dataset.value);
    }
  });
}

randomizeInitialSelection();

let hasInoculatedOnce = false;
let wasPausedBeforeEditor = false;

// --- Construcción del ADN desde el Diseñador ---
function buildUserDNA(): DNA {
  const traits: GenomeTraits = { ...selectedTraits };
  const size = parseFloat(rngSize.value);
  const perceptionRadius = parseFloat(rngPerception.value);
  const stats: GenomeStats = {
    size,
    maxSpeed: traits.motility === 'sessile' ? 0 : parseFloat(rngSpeed.value),
    splitEnergy: Math.round(95 + size * 5.5),
    basalMetabolism: 0,
    dragFactor: 0,
    toxinPower:
      traits.interaction === 'neutral' || traits.interaction === 'siderophores'
        ? 0
        : parseFloat(rngToxin.value),
    armor: parseFloat(rngArmor.value),
    perceptionRadius,
    mutationRate: 0.05,
  };

  const hue = parseFloat(rngHue.value);
  const defaultName = i18n.getBundle().ui.defaultPlayerStrainName;
  const name = strainNameInput.value.trim() || defaultName;
  return new DNA('player_strain', hue, traits, stats, 1, name);
}

// --- Vista Previa Procedural en Tiempo Real ---
let previewDummy = new Bacteria(0, 0, buildUserDNA());
let lastTelemetry: SimulationTelemetry | null = null;
let detailMode: DetailMode = 'auto';

function renderCodingStrandTokens(dna: DNA): void {
  const segments = dna.getCodonSegments();
  const c = i18n.getBundle().ui.codons;
  const translatedLabels = [
    c.start,
    c.metabolism,
    c.size,
    c.motility,
    c.speed,
    c.wall,
    c.armor,
    c.reproduction,
    c.perception,
    c.interaction,
    c.toxin,
    c.adaptation,
    c.chromophore,
    c.stop,
  ];
  dnaStrandDisplay.innerHTML = segments
    .map((seg, idx) => {
      const cls =
        seg.category === 'start' || seg.category === 'stop'
          ? 'codon-token start-stop'
          : seg.category === 'stats'
            ? 'codon-token quant'
            : seg.category === 'adaptation'
              ? 'codon-token adapt'
              : seg.category === 'chromophore'
                ? 'codon-token chromo'
                : 'codon-token';
      const sep = idx < segments.length - 1 ? '<span class="codon-sep">-</span>' : '';
      const tooltip = translatedLabels[idx] || seg.label;
      return `<span class="${cls}" title="${tooltip}">${seg.code}</span>${sep}`;
    })
    .join('');
}

function getSelectedRivalCount(): number {
  const parsed = parseInt(rngRivals.value, 10);
  return Number.isNaN(parsed) ? 3 : parsed;
}

function getSelectedInitialPop(): number {
  const parsed = parseInt(rngInitialPop.value, 10);
  return Number.isNaN(parsed) ? SimConfig.INITIAL_COLONY_SIZE : parsed;
}

function updateDesignerReadouts(): void {
  const ui = i18n.getBundle().ui;
  const dna = buildUserDNA();
  previewDummy.dna = dna;

  const effSpeed = dna.getEffectiveMaxSpeed();
  const loci = dna.getCategoryLoci();

  valSize.textContent = `${dna.stats.size.toFixed(1)} px`;

  if (dna.traits.motility === 'sessile') {
    valSpeed.textContent = ui.sessileZero;
  } else {
    const motTag =
      dna.traits.motility === 'flagellated'
        ? ui.flagellaTag
        : dna.traits.motility === 'spirochete'
          ? ui.spirocheteTag
          : ui.ciliaTag;
    const clawNote = dna.traits.adaptation === 'claws' ? ui.clawsPenaltyTag : '';
    valSpeed.textContent = `${effSpeed.toFixed(1)} ${ui.speedRealUnit} (${motTag}${clawNote})`;
  }

  valArmor.textContent =
    dna.traits.adaptation === 'giant_maw'
      ? `${dna.stats.armor.toFixed(1)} ${ui.giantMawArmorNote}`
      : dna.stats.armor.toFixed(1);
  valPerception.textContent = `${Math.round(dna.stats.perceptionRadius)} px`;

  if (dna.traits.interaction === 'neutral') {
    valToxin.textContent = ui.neutralZero;
  } else if (dna.traits.interaction === 'siderophores') {
    valToxin.textContent = ui.siderophoresActive;
  } else {
    valToxin.textContent = dna.stats.toxinPower.toFixed(1);
  }

  valHue.textContent = `${Math.round(dna.hue)}°`;

  const initPop = getSelectedInitialPop();
  valInitialPop.textContent = `${initPop} ${
    initPop === 1 ? ui.specimenSingular : ui.specimenPlural
  }`;

  const rivalCount = getSelectedRivalCount();
  valRivals.textContent = `${rivalCount} ${
    rivalCount === 1 ? ui.rivalSingular : ui.rivalPlural
  }`;

  rngSpeed.disabled = dna.traits.motility === 'sessile';
  rngToxin.disabled =
    dna.traits.interaction === 'neutral' || dna.traits.interaction === 'siderophores';

  // Actualizar las etiquetas de secuencia de ADN individuales en cada categoría
  locusMetabolism.textContent = loci.metabolismLocus;
  locusMotility.textContent = loci.motilityLocus;
  locusWall.textContent = loci.wallLocus;
  locusReproduction.textContent = loci.reproductionLocus;
  locusInteraction.textContent = loci.interactionLocus;
  locusAdaptation.textContent = `${ui.genePrefix}: ${loci.adaptationLocus}`;
  locusHue.textContent = loci.chromophoreLocus;

  // Costes Bioenergéticos (Kleiber + Nado a velocidad efectiva + Química)
  const basalCost = dna.stats.basalMetabolism;
  const swimCruiseCost = dna.stats.dragFactor * (effSpeed ** 2);
  const rawToxinCost =
    dna.traits.interaction === 'neutral'
      ? 0
      : dna.traits.interaction === 'siderophores'
        ? 0.24
        : dna.stats.toxinPower * SimConfig.TOXIN_ENERGY_COST;
  const effectiveToxinCost =
    dna.traits.interaction === 'quorum_sensing' ? rawToxinCost * 0.5 : rawToxinCost;
  const totalCost = basalCost + swimCruiseCost + effectiveToxinCost;

  badgeBasal.textContent = `${basalCost.toFixed(2)} ATP/s`;
  badgeDrag.textContent = `${swimCruiseCost.toFixed(2)} ATP/s`;
  badgeToxinCost.textContent =
    dna.traits.interaction === 'quorum_sensing'
      ? `${effectiveToxinCost.toFixed(2)} ATP/s (${ui.quorumTag})`
      : dna.traits.interaction === 'siderophores'
        ? `${rawToxinCost.toFixed(2)} ATP/s (${ui.magnetTag})`
        : `${rawToxinCost.toFixed(2)} ATP/s`;
  badgeTotalCost.textContent = `${totalCost.toFixed(2)} ATP/s`;

  badgeEfficiency.classList.remove('warning', 'danger');
  if (totalCost <= 2.35) {
    badgeEfficiency.textContent = ui.efficiencyHigh;
  } else if (totalCost <= 3.65) {
    badgeEfficiency.textContent = ui.efficiencyModerate;
    badgeEfficiency.classList.add('warning');
  } else {
    badgeEfficiency.textContent = ui.efficiencyDanger;
    badgeEfficiency.classList.add('danger');
  }

  const shapeLabel =
    dna.traits.metabolism === 'photosynthetic'
      ? ui.shapes.coccus
      : dna.traits.metabolism === 'predator'
        ? ui.shapes.spirillum
        : dna.traits.metabolism === 'fermenter'
          ? ui.shapes.diplococcus
          : dna.traits.metabolism === 'chemolithotroph'
            ? ui.shapes.archaea
            : ui.shapes.bacillus;

  const splitReq =
    dna.traits.adaptation === 'suction_pore'
      ? Math.round(dna.stats.splitEnergy * 1.15)
      : dna.stats.splitEnergy;
  const taxName = DNA.generateProceduralName(dna.traits, dna.stats);
  previewTaxonomyName.textContent = taxName;
  previewTraitSummary.textContent = `${shapeLabel} · ${ui.divisionAtLabel} ${splitReq}E`;

  renderCodingStrandTokens(dna);
}

function animatePreview(): void {
  const isEditorOpen = !genomeEditorModal.classList.contains('hidden');
  if (isEditorOpen) {
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      const w = previewCanvas.clientWidth || 420;
      const h = previewCanvas.clientHeight || 220;
      if (
        previewCanvas.width !== Math.floor(w * dpr) ||
        previewCanvas.height !== Math.floor(h * dpr)
      ) {
        previewCanvas.width = Math.floor(w * dpr);
        previewCanvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      previewDummy.angle = Math.sin(performance.now() * 0.0014) * 0.08;
      previewDummy.animPhase += 0.11;
      previewDummy.isEmittingToxin = previewDummy.dna.traits.interaction !== 'neutral';

      ProceduralRenderer.renderMicroscopePreview(ctx, previewDummy, w, h);
      ctx.restore();
    }
  }

  updateInspectorView();
  requestAnimationFrame(animatePreview);
}

// --- Gráfica Lotka-Volterra y Telemetría ---
let lineageColors: Record<string, number> = {
  player_strain: 155,
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

function renderLineageList(telemetry: SimulationTelemetry): void {
  const sporesShort = i18n.getBundle().ui.sidebar.sporesShort;
  lineageList.innerHTML = telemetry.lineages
    .map(
      (l) => `
      <div class="lineage-item">
        <div class="lineage-name">
          <span class="lineage-swatch" style="background: hsl(${l.avgHue}, 80%, 52%)"></span>
          <span>${l.lineageName}</span>
        </div>
        <div class="lineage-meta">
          <b>${l.count}</b> (${l.spores} ${sporesShort}) · G${l.maxGeneration}
        </div>
      </div>`
    )
    .join('');
}

function handleTelemetry(telemetry: SimulationTelemetry): void {
  lastTelemetry = telemetry;
  kpiPop.textContent = String(telemetry.totalBacteria);
  kpiSpores.textContent = String(telemetry.totalSpores);
  kpiNutrients.textContent = String(telemetry.totalNutrients);
  kpiGen.textContent = String(telemetry.maxGeneration);
  kpiFps.textContent = String(telemetry.fps);
  lblSimTime.textContent = `${telemetry.elapsedTime.toFixed(1)}s`;

  renderLineageList(telemetry);
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

  const ui = i18n.getBundle().ui;
  const ageTraits = i18n.getAgeContent().traits;

  inspectorPanel.classList.add('visible');
  inspName.textContent = `${b.dna.lineageName} #${b.id}`;
  inspState.textContent = b.isDying
    ? ui.inspector.stateDying
    : b.dividingProgress > 0
      ? `${ui.inspector.stateDividing} (${Math.round(b.dividingProgress * 100)}%)`
      : b.isSpore
        ? ui.inspector.stateSpore
        : b.isEmittingToxin
          ? ui.inspector.stateToxinActive
          : ui.inspector.stateVegetative;
  inspState.style.color = b.isDying
    ? '#f87171'
    : b.dividingProgress > 0
      ? '#38bdf8'
      : b.isSpore
        ? '#fbbf24'
        : '#4ade80';
  inspCodingStrand.textContent = b.dna.codingStrand;
  inspGen.textContent = String(b.dna.generation);

  // Representar la energía como barra de progreso visual sin números
  const energyRatio = Math.min(1, Math.max(0, b.energy / Math.max(1, b.effectiveSplitEnergy)));
  const energyPct = Math.round(energyRatio * 100);
  inspEnergyFill.style.width = `${energyPct}%`;
  if (energyRatio < 0.3) {
    inspEnergyFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
  } else if (energyRatio < 0.65) {
    inspEnergyFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  } else {
    inspEnergyFill.style.background = 'linear-gradient(90deg, #10b981, #38bdf8)';
  }
  inspEnergyTrack.setAttribute('aria-valuenow', String(energyPct));

  const metaEntry = ageTraits.metabolism[b.dna.traits.metabolism];
  const motEntry = ageTraits.motility[b.dna.traits.motility];
  const wallEntry = ageTraits.wall[b.dna.traits.wall];
  const reproEntry = ageTraits.reproduction[b.dna.traits.reproduction];
  const interEntry = ageTraits.interaction[b.dna.traits.interaction];
  const adaptKey = b.dna.traits.adaptation || 'none';
  const adaptEntry = ageTraits.adaptation[adaptKey];

  inspMeta.textContent = metaEntry ? metaEntry.inspectorLabel : b.dna.traits.metabolism;
  inspMot.textContent = motEntry ? motEntry.inspectorLabel : b.dna.traits.motility;
  inspWall.textContent = wallEntry ? wallEntry.inspectorLabel : b.dna.traits.wall;
  inspRepro.textContent = reproEntry ? reproEntry.inspectorLabel : b.dna.traits.reproduction;
  inspInter.textContent =
    adaptKey !== 'none' && adaptEntry
      ? `${interEntry.inspectorLabel} (${adaptEntry.inspectorLabel})`
      : interEntry.inspectorLabel;
  inspArmor.textContent = b.dna.stats.armor.toFixed(1);
  inspBasal.textContent = `${b.dna.stats.basalMetabolism.toFixed(2)}/s`;
  inspSpeed.textContent = b.dna.getEffectiveMaxSpeed().toFixed(1);
}

// --- Eventos de Selección Visual por Botones ---
traitButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const traitCategory = btn.dataset.trait as keyof GenomeTraits | undefined;
    const traitVal = btn.dataset.value;
    if (!traitCategory || !traitVal) return;

    if (traitCategory === 'metabolism') {
      selectedTraits.metabolism = traitVal as MetabolismType;
    } else if (traitCategory === 'motility') {
      selectedTraits.motility = traitVal as MotilityType;
    } else if (traitCategory === 'wall') {
      selectedTraits.wall = traitVal as WallType;
    } else if (traitCategory === 'reproduction') {
      selectedTraits.reproduction = traitVal as ReproductionType;
    } else if (traitCategory === 'interaction') {
      selectedTraits.interaction = traitVal as InteractionType;
    } else if (traitCategory === 'adaptation') {
      selectedTraits.adaptation = traitVal as AdaptationType;
    }

    document
      .querySelectorAll<HTMLButtonElement>(`.trait-btn[data-trait="${traitCategory}"]`)
      .forEach((b) => b.classList.toggle('active', b === btn));

    updateDesignerReadouts();
  });
});

[rngSize, rngSpeed, rngArmor, rngPerception, rngToxin, rngHue, rngInitialPop, rngRivals].forEach(
  (el) => el.addEventListener('input', updateDesignerReadouts)
);
strainNameInput.addEventListener('input', updateDesignerReadouts);

// --- Flujo del Paso Previo (Editor <-> Placa de Cultivo) ---
function syncPauseButtonUI(paused: boolean): void {
  const ui = i18n.getBundle().ui;
  btnPause.textContent = paused ? ui.hud.btnResume : ui.hud.btnPause;
  btnPause.classList.toggle('active', paused);
}

function syncDetailButtonUI(): void {
  const ui = i18n.getBundle().ui;
  const labels: Record<DetailMode, string> = {
    auto: ui.hud.btnDetailAuto,
    low: ui.hud.btnDetailLow,
    high: ui.hud.btnDetailHigh,
  };
  btnToggleDetail.textContent = labels[detailMode];
  btnToggleDetail.title = ui.hud.btnDetailTitle;
  btnToggleDetail.classList.toggle('active', detailMode !== 'auto');
}

function setTextById(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function applyTranslations(): void {
  const bundle = i18n.getBundle();
  const ui = bundle.ui;
  const age = i18n.getAgeContent();
  const currentLocale = i18n.getLocale();
  const currentAge = i18n.getAgeGroup();

  document.title = bundle.documentTitle;
  genomeEditorModal.setAttribute('aria-label', ui.editorModalAria);

  // Actualizar estado activo de los selectores de idioma y edad
  langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.langBtn === currentLocale);
  });
  ageButtons.forEach((btn) => {
    const isCurrent = btn.dataset.ageBtn === currentAge;
    btn.classList.toggle('active', isCurrent);
    btn.title = `${btn.dataset.ageBtn} ${ui.ageUnit} — ${age.ageBadgeTooltip}`;
  });
  document.querySelectorAll<HTMLElement>('.js-age-label').forEach((el) => {
    el.textContent = ui.ageLabel;
  });

  // Cabecera del Editor
  setTextById('lblEditorTitle', ui.editorTitle);
  setTextById('lblEditorSubtitle', age.editorSubtitle);
  btnCloseEditor.textContent = ui.btnReturnToCulture;

  // Columna izquierda del Editor
  setTextById('lblMicroscopeTitle', ui.microscopeTitle);
  setTextById('lblStrainName', age.params.strainNameLabel);
  strainNameInput.placeholder = age.params.strainNamePlaceholder;
  if (
    strainNameInput.value === 'Súper Bacilo' ||
    strainNameInput.value === 'Super Bacillus' ||
    strainNameInput.value === 'Jugador Alpha' ||
    strainNameInput.value === 'Player Alpha'
  ) {
    strainNameInput.value = ui.defaultPlayerStrainName;
    if (!hasInoculatedOnce) {
      activeStrainTitle.textContent = ui.defaultPlayerStrainName;
    }
  }
  setTextById('lblParamHue', age.params.hue);
  setTextById('lblColorGeneBadge', ui.colorGeneBadge);
  setTextById('lblCodingStrandTitle', ui.codingStrandTitle);
  setTextById('lblBioBalanceTitle', ui.bioBalanceTitle);
  setTextById('lblCostBasal', ui.costBasal);
  setTextById('lblCostSwim', ui.costSwim);
  setTextById('lblCostToxin', ui.costToxin);
  setTextById('lblCostTotal', ui.costTotal);

  const paretoNote = document.getElementById('lblParetoNote');
  if (paretoNote) {
    paretoNote.innerHTML = `💡 <strong>${age.paretoTitle}</strong> ${age.paretoBody}`;
  }

  setTextById('lblCultureConditionsTitle', ui.cultureConditionsTitle);
  setTextById('lblParamInitialPop', age.params.initialPop);
  setTextById('lblParamRivals', age.params.rivals);
  setTextById('lblBtnDeploy', ui.btnDeploy);

  // Columna derecha del Editor: Encabezado y Categorías A..F
  const sectionHeading = document.querySelector<HTMLElement>('.editor-right-col .section-heading');
  if (sectionHeading) {
    sectionHeading.textContent = age.section1Heading;
  }

  const updateCategoryHeader = (
    group: 'metabolism' | 'motility' | 'wall' | 'reproduction' | 'interaction',
    titleText: string,
    hintText: string
  ) => {
    const catEl = document.querySelector<HTMLElement>(`.trait-category[data-trait-group="${group}"]`);
    if (!catEl) return;
    const titleSpan = catEl.querySelector<HTMLElement>('.trait-category-title > span:first-child');
    const hintSpan = catEl.querySelector<HTMLElement>('.trait-category-title > span.codon-hint');
    if (titleSpan) titleSpan.textContent = titleText;
    if (hintSpan) hintSpan.textContent = hintText;
  };

  updateCategoryHeader('metabolism', age.categories.metabolism.title, age.categories.metabolism.locusHint);
  updateCategoryHeader('motility', age.categories.motility.title, age.categories.motility.locusHint);
  updateCategoryHeader('wall', age.categories.wall.title, age.categories.wall.locusHint);
  updateCategoryHeader('reproduction', age.categories.reproduction.title, age.categories.reproduction.locusHint);
  updateCategoryHeader('interaction', age.categories.interaction.title, age.categories.interaction.locusHint);

  const adaptCatEl = document.querySelector<HTMLElement>('.trait-category[data-trait-group="adaptation"]');
  if (adaptCatEl) {
    const titleSpan = adaptCatEl.querySelector<HTMLElement>('.trait-category-title > span:first-child');
    if (titleSpan) titleSpan.textContent = age.categories.adaptation.title;
  }

  // Botones de rasgos biológicos (Categorías A..F) adaptados por edad e idioma
  traitButtons.forEach((btn) => {
    const category = btn.dataset.trait as keyof GenomeTraits | undefined;
    const value = btn.dataset.value;
    if (!category || !value) return;

    const titleEl = btn.querySelector<HTMLElement>('.trait-btn-title');
    const descEl = btn.querySelector<HTMLElement>('.trait-btn-desc');

    if (category === 'metabolism') {
      const entry = age.traits.metabolism[value as MetabolismType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'motility') {
      const entry = age.traits.motility[value as MotilityType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'wall') {
      const entry = age.traits.wall[value as WallType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'reproduction') {
      const entry = age.traits.reproduction[value as ReproductionType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'interaction') {
      const entry = age.traits.interaction[value as InteractionType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'adaptation') {
      const entry = age.traits.adaptation[value as AdaptationType];
      if (entry) {
        if (titleEl) titleEl.textContent = entry.editorTitle;
        if (descEl) descEl.innerHTML = entry.editorDesc;
        const proEl = btn.querySelector<HTMLElement>('.tag-pro');
        const conEl = btn.querySelector<HTMLElement>('.tag-con');
        if (proEl) proEl.textContent = entry.proTag;
        if (conEl && entry.conTag) conEl.textContent = entry.conTag;
      }
    }
  });

  // Etiquetas de los sliders cuantitativos vinculados a cada categoría
  const setLinkedSliderLabel = (inputId: string, labelText: string) => {
    const labelSpan = document.querySelector<HTMLElement>(`label[for="${inputId}"] > span:first-child`);
    if (labelSpan) labelSpan.textContent = labelText;
  };
  setLinkedSliderLabel('rngSize', age.params.size);
  setLinkedSliderLabel('rngSpeed', age.params.speed);
  setLinkedSliderLabel('rngArmor', age.params.armor);
  setLinkedSliderLabel('rngPerception', age.params.perception);
  setLinkedSliderLabel('rngToxin', age.params.toxin);

  document.querySelectorAll<HTMLElement>('.editor-right-col .linked-dna-badge .lbl').forEach((el) => {
    el.textContent = ui.dnaSequenceBadge;
  });

  // Barra lateral y HUD de Simulación
  setTextById('lblBrandSubtitle', ui.sidebar.brandSubtitle);
  setTextById('lblVersionBadge', ui.sidebar.versionBadge);
  setTextById('lblFounderStrainCard', ui.sidebar.founderStrainCard);
  btnOpenEditorSidebar.textContent = ui.sidebar.btnOpenEditor;
  setTextById('lblPopDynamicsCard', ui.sidebar.populationDynamicsCard);

  btnOpenEditorHud.textContent = ui.hud.btnEditorDna;
  syncPauseButtonUI(btnPause.classList.contains('active'));
  btnFeed.textContent = ui.hud.btnFeed;
  btnRemoveSubstrate.textContent = ui.hud.btnRemoveSubstrate;
  btnDecreaseLightRadius.textContent = ui.hud.btnDecreaseLightRadius;
  btnIncreaseLightRadius.textContent = ui.hud.btnIncreaseLightRadius;
  btnResetCam.textContent = ui.hud.btnResetCam;
  syncDetailButtonUI();

  setTextById('lblKpiBacteria', ui.hud.kpiBacteria);
  setTextById('lblKpiSpores', ui.hud.kpiSpores);
  setTextById('lblKpiNutrients', ui.hud.kpiNutrients);
  setTextById('lblKpiMaxGen', ui.hud.kpiMaxGen);
  setTextById('lblKpiFps', ui.hud.kpiFps);

  // Etiquetas del Inspector de Célula Seleccionada
  setTextById('lblInspGen', ui.inspector.gen);
  setTextById('lblInspEnergy', ui.inspector.energy);
  setTextById('lblInspMeta', ui.inspector.metabolism);
  setTextById('lblInspMot', ui.inspector.motility);
  setTextById('lblInspWall', ui.inspector.wall);
  setTextById('lblInspRepro', ui.inspector.reproduction);
  setTextById('lblInspInter', ui.inspector.interaction);
  setTextById('lblInspArmor', ui.inspector.armor);
  setTextById('lblInspBasal', ui.inspector.basal);
  setTextById('lblInspSpeed', ui.inspector.speed);

  updateDesignerReadouts();
  updateInspectorView();
  if (lastTelemetry) {
    renderLineageList(lastTelemetry);
  }
}

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.langBtn as LocaleCode | undefined;
    if (lang) {
      i18n.setLocale(lang);
    }
  });
});

ageButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const age = btn.dataset.ageBtn as AgeGroup | undefined;
    if (age) {
      i18n.setAgeGroup(age);
    }
  });
});

i18n.onChange(applyTranslations);

function openGenomeEditor(): void {
  wasPausedBeforeEditor = btnPause.classList.contains('active');
  engine.setPaused(true);
  syncPauseButtonUI(true);
  if (hasInoculatedOnce) {
    btnCloseEditor.classList.remove('hidden');
  }
  genomeEditorModal.classList.remove('hidden');
  updateDesignerReadouts();
}

function closeGenomeEditor(): void {
  genomeEditorModal.classList.add('hidden');
  engine.setPaused(wasPausedBeforeEditor);
  syncPauseButtonUI(wasPausedBeforeEditor);
}

function deployColonies(): void {
  const userDNA = buildUserDNA();
  lineageColors = { player_strain: userDNA.hue };

  hasInoculatedOnce = true;
  btnCloseEditor.classList.remove('hidden');
  genomeEditorModal.classList.add('hidden');

  engine.resizeCanvas();
  engine.initColonies(userDNA, getSelectedRivalCount(), getSelectedInitialPop());

  // Actualizar tarjeta resumen de la cepa activa en la barra lateral
  activeStrainTitle.textContent = userDNA.lineageName;
  activeStrainTaxonomy.textContent = DNA.generateProceduralName(userDNA.traits, userDNA.stats);
  activeStrainDna.textContent = userDNA.codingStrand;

  engine.setPaused(false);
  syncPauseButtonUI(false);
  engine.start();
}

btnDeploy.addEventListener('click', deployColonies);
btnCloseEditor.addEventListener('click', closeGenomeEditor);
btnOpenEditorSidebar.addEventListener('click', openGenomeEditor);
btnOpenEditorHud.addEventListener('click', openGenomeEditor);

btnPause.addEventListener('click', () => {
  const paused = engine.togglePause();
  syncPauseButtonUI(paused);
});

document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-speed]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    engine.setTimeScale(parseFloat(btn.dataset.speed || '1'));
  });
});

btnFeed.addEventListener('click', () => {
  engine.spawnNutrient(SimConfig.MANUAL_NUTRIENT_AMOUNT);
});

btnRemoveSubstrate.addEventListener('click', () => {
  engine.removeNutrients(SimConfig.MANUAL_NUTRIENT_AMOUNT);
});

btnDecreaseLightRadius.addEventListener('click', () => {
  engine.adjustLightRadius(-SimConfig.LIGHT_SPOT_RADIUS_STEP);
});

btnIncreaseLightRadius.addEventListener('click', () => {
  engine.adjustLightRadius(SimConfig.LIGHT_SPOT_RADIUS_STEP);
});

btnResetCam.addEventListener('click', () => {
  engine.resetCamera();
});

btnToggleDetail.addEventListener('click', () => {
  detailMode = detailMode === 'auto' ? 'low' : detailMode === 'low' ? 'high' : 'auto';
  engine.setDetailMode(detailMode);
  syncDetailButtonUI();
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

// --- Arranque inicial en el Paso Previo (Editor Genómico y Fenotípico) ---
applyTranslations();
engine.setPaused(true);
requestAnimationFrame(animatePreview);
