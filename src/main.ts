import {
  AdaptationType,
  CodingStrandParseResult,
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
import { HostAgentId, isHostAgentId } from './models/HostAgents';
import { isKnownSpeciesId, KnownSpeciesId } from './models/KnownSpeciesCatalog';

// --- Referencias del DOM ---
const genomeEditorModal = document.getElementById('genomeEditorModal')!;
const btnCloseEditor = document.getElementById('btnCloseEditor')!;
const btnOpenEditorSidebar = document.getElementById('btnOpenEditorSidebar')!;
const btnOpenEditorHud = document.getElementById('btnOpenEditorHud')!;

const simCanvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
const miniPreviewCanvas = document.getElementById('miniPreviewCanvas') as HTMLCanvasElement;
const chartCanvas = document.getElementById('chartCanvas') as HTMLCanvasElement;

const editorBodyScroll = document.getElementById('editorBodyScroll')!;
const microscopeViewport = document.getElementById('microscopeViewport')!;
const miniStrainStickyBar = document.getElementById('miniStrainStickyBar')!;
const miniStrainName = document.getElementById('miniStrainName')!;
const miniStrainTaxonomy = document.getElementById('miniStrainTaxonomy')!;
const miniBadgeTotalCost = document.getElementById('miniBadgeTotalCost')!;
const miniBadgeEfficiency = document.getElementById('miniBadgeEfficiency')!;
const btnCopyDna = document.getElementById('btnCopyDna') as HTMLButtonElement;
const lblCopyDna = document.getElementById('lblCopyDna')!;

const strainNameInput = document.getElementById('strainName') as HTMLInputElement;
const traitButtons = document.querySelectorAll<HTMLButtonElement>('.trait-btn');
const langButtons = document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]');
const ageButtons = document.querySelectorAll<HTMLButtonElement>('[data-age-btn]');
const categoryTabButtons = document.querySelectorAll<HTMLButtonElement>('[data-category-tab]');
const traitCategories = document.querySelectorAll<HTMLElement>('.trait-category[data-trait-group]');
const btnPrevCategory = document.getElementById('btnPrevCategory') as HTMLButtonElement;
const btnNextCategory = document.getElementById('btnNextCategory') as HTMLButtonElement;
const lblCategoryStepIndicator = document.getElementById('lblCategoryStepIndicator')!;

const rngSize = document.getElementById('rngSize') as HTMLInputElement;
const rngSpeed = document.getElementById('rngSpeed') as HTMLInputElement;
const rngArmor = document.getElementById('rngArmor') as HTMLInputElement;
const rngPerception = document.getElementById('rngPerception') as HTMLInputElement;
const rngToxin = document.getElementById('rngToxin') as HTMLInputElement;
const rngHue = document.getElementById('rngHue') as HTMLInputElement;
const rngInitialPop = document.getElementById('rngInitialPop') as HTMLInputElement;
const rngRivals = document.getElementById('rngRivals') as HTMLInputElement;
const knownSpeciesCheckboxes =
  document.querySelectorAll<HTMLInputElement>('[data-known-species]');
const knownSpeciesBox = document.getElementById('knownSpeciesBox')!;
const btnToggleFamousSpecies = document.getElementById('btnToggleFamousSpecies') as HTMLButtonElement;
const badgeFamousSpeciesCount = document.getElementById('badgeFamousSpeciesCount')!;
const hostAgentsCheckboxes =
  document.querySelectorAll<HTMLInputElement>('[data-host-agent]');
const hostAgentsBox = document.getElementById('hostAgentsBox')!;
const btnToggleHostAgents = document.getElementById('btnToggleHostAgents') as HTMLButtonElement;
const badgeHostAgentsCount = document.getElementById('badgeHostAgentsCount')!;
const customRivalDnaBox = document.getElementById('customRivalDnaBox')!;
const btnToggleCustomRivalDna = document.getElementById('btnToggleCustomRivalDna') as HTMLButtonElement;
const badgeCustomRivalsCount = document.getElementById('badgeCustomRivalsCount')!;
const customRivalDnaInput = document.getElementById('customRivalDnaInput') as HTMLInputElement;
const btnRandomCustomRivalDna = document.getElementById('btnRandomCustomRivalDna') as HTMLButtonElement;
const customRivalNameInput = document.getElementById('customRivalNameInput') as HTMLInputElement;
const btnAddCustomRival = document.getElementById('btnAddCustomRival') as HTMLButtonElement;
const customRivalFeedback = document.getElementById('customRivalFeedback')!;
const customRivalsList = document.getElementById('customRivalsList')!;

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
const btnSpeed = document.getElementById('btnSpeed') as HTMLButtonElement;
const lblHudSubstrate = document.getElementById('lblHudSubstrate')!;
const lblHudLight = document.getElementById('lblHudLight')!;
const lblHudPhages = document.getElementById('lblHudPhages')!;
const lblHudNeutrophils = document.getElementById('lblHudNeutrophils')!;
const btnFeed = document.getElementById('btnFeed')!;
const btnRemoveSubstrate = document.getElementById('btnRemoveSubstrate')!;
const btnDecreaseLightRadius = document.getElementById('btnDecreaseLightRadius')!;
const btnIncreaseLightRadius = document.getElementById('btnIncreaseLightRadius')!;
const btnSpawnPhages = document.getElementById('btnSpawnPhages')!;
const btnRemovePhages = document.getElementById('btnRemovePhages')!;
const btnSpawnNeutrophils = document.getElementById('btnSpawnNeutrophils')!;
const btnRemoveNeutrophils = document.getElementById('btnRemoveNeutrophils')!;
const btnResetCam = document.getElementById('btnResetCam')!;
const btnToggleDetail = document.getElementById('btnToggleDetail')!;

const kpiPop = document.getElementById('kpiPop')!;
const kpiSpores = document.getElementById('kpiSpores')!;
const kpiNutrients = document.getElementById('kpiNutrients')!;
const kpiPhages = document.getElementById('kpiPhages')!;
const kpiNeutrophils = document.getElementById('kpiNeutrophils')!;
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
const TRAIT_ICONS: {
  metabolism: Record<MetabolismType, string>;
  motility: Record<MotilityType, string>;
  wall: Record<WallType, string>;
  reproduction: Record<ReproductionType, string>;
  interaction: Record<InteractionType, string>;
  adaptation: Record<AdaptationType, string>;
} = {
  metabolism: {
    photosynthetic: 'metabolism-photosynthetic.png',
    saprophyte: 'metabolism-saprophyte.png',
    predator: 'species-helicobacter.png',
    fermenter: 'metabolism-fermenter.png',
    chemolithotroph: 'metabolism-chemolithotroph.png',
    chemoheterotroph: 'pipette.png',
  },
  motility: {
    sessile: 'motility-sessile.png',
    nonmotile: 'motility-nonmotile.png',
    flagellated: 'motility-flagellated.png',
    ciliated: 'motility-ciliated.png',
    spirochete: 'motility-spirochete.png',
  },
  wall: {
    gram_negative: 'wall-gram-negative.png',
    gram_positive: 'wall-gram-positive.png',
    capsule: 'wall-capsule.png',
    s_layer: 'wall-s-layer.png',
  },
  reproduction: {
    binary_fission: 'reproduction-fission.png',
    budding: 'reproduction-budding.png',
    sporulation: 'reproduction-sporulation.png',
    conjugation: 'reproduction-conjugation.png',
  },
  interaction: {
    neutral: 'petri-colony.png',
    bacteriocins: 'toxin-allergen.png',
    quorum_sensing: 'interaction-quorum.png',
    siderophores: 'interaction-siderophores.png',
  },
  adaptation: {
    none: 'adaptation-none.png',
    claws: 'adaptation-claws.png',
    giant_maw: 'adaptation-giant-maw.png',
    spikes: 'adaptation-spikes.png',
    bioluminescence: 'adaptation-bioluminescence.png',
    suction_pore: 'adaptation-suction-pore.png',
  },
};

function setElementWithIcon(
  el: HTMLElement | null,
  iconFile: string,
  text: string,
  iconClass = 'ui-icon'
): void {
  if (!el) return;
  el.innerHTML = '';
  const img = document.createElement('img');
  img.src = `icons/${iconFile}`;
  img.alt = '';
  img.className = iconClass;
  img.decoding = 'async';
  const span = document.createElement('span');
  span.textContent = text;
  el.append(img, span);
}

const selectedTraits: GenomeTraits = {
  metabolism: 'saprophyte',
  motility: 'flagellated',
  wall: 'gram_positive',
  reproduction: 'binary_fission',
  interaction: 'bacteriocins',
  adaptation: 'none',
  adaptations: [],
};

function syncAdaptationButtonsUI(): void {
  const adapts = DNA.syncTraitAdaptations(selectedTraits);
  document
    .querySelectorAll<HTMLButtonElement>('.trait-btn[data-trait="adaptation"]')
    .forEach((btn) => {
      const val = btn.dataset.value as AdaptationType | undefined;
      if (!val) return;
      if (val === 'none') {
        btn.classList.toggle('active', adapts.length === 0);
      } else {
        btn.classList.toggle('active', adapts.includes(val));
      }
    });
}

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
    'chemoheterotroph',
  ]);
  selectedTraits.motility = pickRandom(
    selectedTraits.metabolism === 'predator'
      ? ['flagellated', 'ciliated', 'spirochete']
      : ['sessile', 'nonmotile', 'flagellated', 'ciliated', 'spirochete']
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
  const initialAdapt = pickRandom([
    'none',
    'claws',
    'giant_maw',
    'spikes',
    'bioluminescence',
    'suction_pore',
  ] as const);
  selectedTraits.adaptation = initialAdapt;
  selectedTraits.adaptations = initialAdapt === 'none' ? [] : [initialAdapt];

  [rngSize, rngSpeed, rngArmor, rngPerception, rngToxin, rngHue].forEach(
    randomizeSlider
  );

  traitButtons.forEach((btn) => {
    const category = btn.dataset.trait as keyof GenomeTraits | undefined;
    if (category && category !== 'adaptation') {
      btn.classList.toggle('active', selectedTraits[category] === btn.dataset.value);
    }
  });
  syncAdaptationButtonsUI();
}

randomizeInitialSelection();

let hasInoculatedOnce = false;
let wasPausedBeforeEditor = false;

const CATEGORY_ORDER: readonly (keyof GenomeTraits)[] = [
  'metabolism',
  'motility',
  'wall',
  'reproduction',
  'interaction',
  'adaptation',
] as const;

let activeCategoryGroup: keyof GenomeTraits = 'metabolism';

function setActiveCategoryGroup(group: keyof GenomeTraits, focusTab = false): void {
  activeCategoryGroup = group;

  categoryTabButtons.forEach((btn) => {
    const isTarget = btn.dataset.categoryTab === group;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    if (isTarget && focusTab) {
      btn.focus();
    }
  });

  traitCategories.forEach((catEl) => {
    catEl.classList.toggle('is-open', catEl.dataset.traitGroup === group);
  });

  updateCategoryStepNavText();
}

function updateCategoryStepNavText(): void {
  const ui = i18n.getBundle().ui;
  const idx = CATEGORY_ORDER.indexOf(activeCategoryGroup);
  const currentNum = idx >= 0 ? idx + 1 : 1;
  lblCategoryStepIndicator.textContent = ui.categoryTabs.stepOf
    .replace('{current}', String(currentNum))
    .replace('{total}', String(CATEGORY_ORDER.length));
  btnPrevCategory.textContent = ui.categoryTabs.prev;
  btnNextCategory.textContent = ui.categoryTabs.next;
}

// --- Construcción del ADN desde el Diseñador ---
function buildUserDNA(): DNA {
  const adapts = DNA.syncTraitAdaptations(selectedTraits);
  const traits: GenomeTraits = {
    ...selectedTraits,
    adaptation: adapts[0] ?? 'none',
    adaptations: [...adapts],
  };
  const size = parseFloat(rngSize.value);
  const perceptionRadius = parseFloat(rngPerception.value);
  const stats: GenomeStats = {
    size,
    maxSpeed:
      traits.motility === 'sessile' || traits.motility === 'nonmotile'
        ? 0
        : parseFloat(rngSpeed.value),
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
  const codontoCategoryMap: Partial<Record<number, keyof GenomeTraits>> = {
    1: 'metabolism',
    2: 'metabolism',
    3: 'motility',
    4: 'motility',
    5: 'wall',
    6: 'wall',
    7: 'reproduction',
    8: 'reproduction',
    9: 'interaction',
    10: 'interaction',
    11: 'adaptation',
  };
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
      const jumpCat = codontoCategoryMap[idx];
      const dataAttr = jumpCat ? ` data-jump-category="${jumpCat}" style="cursor:pointer;"` : '';
      return `<span class="${cls}" title="${tooltip}"${dataAttr}>${seg.code}</span>${sep}`;
    })
    .join('');
}

function getSelectedRivalCount(): number {
  const parsed = parseInt(rngRivals.value, 10);
  return Number.isNaN(parsed) ? 3 : parsed;
}

function getSelectedKnownSpecies(): KnownSpeciesId[] {
  const species: KnownSpeciesId[] = [];
  knownSpeciesCheckboxes.forEach((checkbox) => {
    if (checkbox.checked && isKnownSpeciesId(checkbox.value)) {
      species.push(checkbox.value);
    }
  });
  return species;
}

function getSelectedHostAgents(): HostAgentId[] {
  const agents: HostAgentId[] = [];
  hostAgentsCheckboxes.forEach((checkbox) => {
    if (checkbox.checked && isHostAgentId(checkbox.value)) {
      agents.push(checkbox.value);
    }
  });
  return agents;
}

function getSelectedInitialPop(): number {
  const parsed = parseInt(rngInitialPop.value, 10);
  return Number.isNaN(parsed) ? SimConfig.INITIAL_COLONY_SIZE : parsed;
}

interface CustomRivalEntry {
  id: number;
  dna: DNA;
  customName?: string;
  taxonomyName: string;
}

const customRivals: CustomRivalEntry[] = [];
let nextCustomRivalId = 1;

type CustomFeedbackState =
  | { type: 'none' }
  | { type: 'preview'; result: CodingStrandParseResult }
  | { type: 'added'; name: string; taxonomy: string };

let customFeedbackState: CustomFeedbackState = { type: 'none' };

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCustomRivalFeedback(): void {
  const i18nCustom = i18n.getBundle().ui.customRivalDna;
  customRivalFeedback.classList.remove('is-valid', 'is-invalid');

  if (customFeedbackState.type === 'none') {
    customRivalFeedback.textContent = '';
    return;
  }

  if (customFeedbackState.type === 'added') {
    customRivalFeedback.classList.add('is-valid');
    customRivalFeedback.textContent = i18nCustom.addedSuccess
      .replace('{name}', customFeedbackState.name)
      .replace('{taxonomy}', customFeedbackState.taxonomy);
    return;
  }

  const res = customFeedbackState.result;
  if (res.ok) {
    const taxonomy = DNA.generateProceduralName(res.dna.traits, res.dna.stats);
    customRivalFeedback.classList.add('is-valid');
    customRivalFeedback.textContent = i18nCustom.validPreview
      .replace('{taxonomy}', taxonomy)
      .replace('{strand}', res.normalizedStrand);
  } else {
    const template = i18nCustom.errors[res.errorKey];
    customRivalFeedback.classList.add('is-invalid');
    customRivalFeedback.textContent = template
      .replace('{token}', res.token ?? '')
      .replace('{expected}', res.expected ?? '');
  }
}

function renderCustomRivalsList(): void {
  const removeTitle = escapeHtml(i18n.getBundle().ui.customRivalDna.removeTitle);
  customRivalsList.innerHTML = customRivals
    .map((entry) => {
      const displayTitle = escapeHtml(entry.customName || entry.taxonomyName);
      const subtitleHtml = entry.customName
        ? `<span class="custom-rival-chip-tax">${escapeHtml(entry.taxonomyName)}</span>`
        : '';
      return `
        <div class="custom-rival-chip">
          <span class="custom-rival-swatch" style="background: hsl(${entry.dna.hue}, 80%, 52%); color: hsl(${entry.dna.hue}, 80%, 52%)"></span>
          <div class="custom-rival-chip-info">
            <div class="custom-rival-chip-title">
              <span>${displayTitle}</span>
              ${subtitleHtml}
            </div>
            <code class="custom-rival-chip-strand">${escapeHtml(entry.dna.codingStrand)}</code>
          </div>
          <button
            type="button"
            class="custom-rival-remove-btn"
            data-remove-custom-rival="${entry.id}"
            title="${removeTitle}"
            aria-label="${removeTitle}"
          >&times;</button>
        </div>`;
    })
    .join('');
}

function handleCustomRivalDnaLiveInput(): void {
  const raw = customRivalDnaInput.value.trim();
  if (!raw) {
    customFeedbackState = { type: 'none' };
    renderCustomRivalFeedback();
    return;
  }
  const result = DNA.parseCodingStrand(
    raw,
    `custom_rival_${nextCustomRivalId}`,
    customRivalNameInput.value.trim() || undefined
  );
  customFeedbackState = { type: 'preview', result };
  renderCustomRivalFeedback();
}

function handleAddCustomRival(): void {
  const rawStrand = customRivalDnaInput.value;
  const customName = customRivalNameInput.value.trim() || undefined;
  const id = nextCustomRivalId;
  const result = DNA.parseCodingStrand(rawStrand, `custom_rival_${id}`, customName);

  if (!result.ok) {
    customFeedbackState = { type: 'preview', result };
    renderCustomRivalFeedback();
    customRivalDnaInput.focus();
    return;
  }

  nextCustomRivalId++;
  const taxonomyName = DNA.generateProceduralName(result.dna.traits, result.dna.stats);
  customRivals.push({
    id,
    dna: result.dna,
    customName,
    taxonomyName,
  });

  customRivalDnaInput.value = '';
  customRivalNameInput.value = '';
  customFeedbackState = {
    type: 'added',
    name: result.dna.lineageName,
    taxonomy: taxonomyName,
  };
  renderCustomRivalFeedback();
  renderCustomRivalsList();
  updateDesignerReadouts();
}

function updateDesignerReadouts(): void {
  const ui = i18n.getBundle().ui;
  const dna = buildUserDNA();
  previewDummy.dna = dna;
  previewDummy.energy = dna.stats.splitEnergy * SimConfig.GROWTH_EQUILIBRIUM_RATIO;

  const effSpeed = dna.getEffectiveMaxSpeed();
  const loci = dna.getCategoryLoci();
  const growthRange = DNA.getMetabolicGrowthRange(dna.traits.metabolism);

  valSize.textContent = `${dna.stats.size.toFixed(1)} px (${(dna.stats.size * growthRange.min).toFixed(1)}–${(dna.stats.size * growthRange.max).toFixed(1)})`;

  if (dna.traits.motility === 'sessile') {
    valSpeed.textContent = ui.sessileZero;
  } else if (dna.traits.motility === 'nonmotile') {
    valSpeed.textContent = ui.nonmotileZero;
  } else {
    const motTag =
      dna.traits.motility === 'flagellated'
        ? ui.flagellaTag
        : dna.traits.motility === 'spirochete'
          ? ui.spirocheteTag
          : ui.ciliaTag;
    const clawNote = dna.hasAdaptation('claws') ? ui.clawsPenaltyTag : '';
    valSpeed.textContent = `${effSpeed.toFixed(1)} ${ui.speedRealUnit} (${motTag}${clawNote})`;
  }

  valArmor.textContent =
    dna.hasAdaptation('giant_maw')
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
  const selectedFamousCount = getSelectedKnownSpecies().length;
  const customCount = customRivals.length;
  const extraRivalsCount = selectedFamousCount + customCount;
  const totalRivalsCount = rivalCount + extraRivalsCount;
  const rivalUnit = totalRivalsCount === 1 ? ui.rivalSingular : ui.rivalPlural;
  valRivals.textContent =
    extraRivalsCount > 0
      ? `${rivalCount} + ${extraRivalsCount} (${totalRivalsCount} ${rivalUnit})`
      : `${rivalCount} ${rivalUnit}`;

  badgeFamousSpeciesCount.textContent = `+${selectedFamousCount}`;
  badgeFamousSpeciesCount.classList.toggle('hidden', selectedFamousCount === 0);

  const selectedHostAgentsCount = getSelectedHostAgents().length;
  badgeHostAgentsCount.textContent = `+${selectedHostAgentsCount}`;
  badgeHostAgentsCount.classList.toggle('hidden', selectedHostAgentsCount === 0);

  badgeCustomRivalsCount.textContent = `+${customCount}`;
  badgeCustomRivalsCount.classList.toggle('hidden', customCount === 0);

  rngSpeed.disabled =
    dna.traits.motility === 'sessile' || dna.traits.motility === 'nonmotile';
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

  // Actualizar los resúmenes en las pestañas rápidas de categorías (A..F)
  const ageTraits = i18n.getAgeContent().traits;

  const metaEntry = ageTraits.metabolism[dna.traits.metabolism];
  const motEntry = ageTraits.motility[dna.traits.motility];
  const wallEntry = ageTraits.wall[dna.traits.wall];
  const reproEntry = ageTraits.reproduction[dna.traits.reproduction];
  const interEntry = ageTraits.interaction[dna.traits.interaction];
  const activeAdapts = dna.getAdaptations();
  const primaryAdaptKey: AdaptationType = activeAdapts[0] ?? 'none';
  const adaptSummaryLabel =
    activeAdapts.length === 0
      ? ageTraits.adaptation.none.inspectorLabel
      : activeAdapts.map((a) => ageTraits.adaptation[a].inspectorLabel).join(' + ');

  setElementWithIcon(
    document.getElementById('catTraitMetabolism'),
    TRAIT_ICONS.metabolism[dna.traits.metabolism],
    metaEntry.inspectorLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusMetabolism', loci.metabolismLocus);

  setElementWithIcon(
    document.getElementById('catTraitMotility'),
    TRAIT_ICONS.motility[dna.traits.motility],
    motEntry.inspectorLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusMotility', loci.motilityLocus);

  setElementWithIcon(
    document.getElementById('catTraitWall'),
    TRAIT_ICONS.wall[dna.traits.wall],
    wallEntry.inspectorLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusWall', loci.wallLocus);

  setElementWithIcon(
    document.getElementById('catTraitReproduction'),
    TRAIT_ICONS.reproduction[dna.traits.reproduction],
    reproEntry.inspectorLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusReproduction', loci.reproductionLocus);

  setElementWithIcon(
    document.getElementById('catTraitInteraction'),
    TRAIT_ICONS.interaction[dna.traits.interaction],
    interEntry.inspectorLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusInteraction', loci.interactionLocus);

  setElementWithIcon(
    document.getElementById('catTraitAdaptation'),
    TRAIT_ICONS.adaptation[primaryAdaptKey],
    adaptSummaryLabel,
    'ui-icon ui-icon-xs'
  );
  setTextById('catLocusAdaptation', loci.adaptationLocus);

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
  miniBadgeEfficiency.classList.remove('warning', 'danger');
  if (totalCost <= 2.35) {
    badgeEfficiency.textContent = ui.efficiencyHigh;
    miniBadgeEfficiency.textContent = ui.efficiencyHigh;
  } else if (totalCost <= 3.65) {
    badgeEfficiency.textContent = ui.efficiencyModerate;
    badgeEfficiency.classList.add('warning');
    miniBadgeEfficiency.textContent = ui.efficiencyModerate;
    miniBadgeEfficiency.classList.add('warning');
  } else {
    badgeEfficiency.textContent = ui.efficiencyDanger;
    badgeEfficiency.classList.add('danger');
    miniBadgeEfficiency.textContent = ui.efficiencyDanger;
    miniBadgeEfficiency.classList.add('danger');
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
    dna.hasAdaptation('suction_pore')
      ? Math.round(dna.stats.splitEnergy * 1.15)
      : dna.stats.splitEnergy;
  const taxName = DNA.generateProceduralName(dna.traits, dna.stats);
  previewTaxonomyName.textContent = taxName;
  previewTraitSummary.textContent = `${shapeLabel} · ${ui.divisionAtLabel} ${splitReq}E`;

  // Actualizar también la barra compacta flotante (imagen mini + consumo total de ATP)
  miniStrainName.textContent = dna.lineageName;
  miniStrainTaxonomy.textContent = taxName;
  miniBadgeTotalCost.textContent = `${totalCost.toFixed(2)} ATP/s`;

  renderCodingStrandTokens(dna);
}

function syncMiniStickyBarVisibility(): boolean {
  const scrollRect = editorBodyScroll.getBoundingClientRect();
  const viewportRect = microscopeViewport.getBoundingClientRect();
  // Mostrar barra compacta cuando más de la mitad del visor del microscopio queda oculto por el scroll
  const isMainPreviewHidden =
    viewportRect.height > 0 && viewportRect.bottom < scrollRect.top + viewportRect.height * 0.45;
  miniStrainStickyBar.classList.toggle('hidden', !isMainPreviewHidden);
  return isMainPreviewHidden;
}

function animatePreview(): void {
  const isEditorOpen = !genomeEditorModal.classList.contains('hidden');
  if (isEditorOpen) {
    previewDummy.angle = Math.sin(performance.now() * 0.0014) * 0.08;
    previewDummy.animPhase += 0.11;
    previewDummy.isEmittingToxin = previewDummy.dna.traits.interaction !== 'neutral';

    const dpr = window.devicePixelRatio || 1;
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      const w = previewCanvas.clientWidth || 420;
      const h = previewCanvas.clientHeight || 195;
      if (
        previewCanvas.width !== Math.floor(w * dpr) ||
        previewCanvas.height !== Math.floor(h * dpr)
      ) {
        previewCanvas.width = Math.floor(w * dpr);
        previewCanvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ProceduralRenderer.renderMicroscopePreview(ctx, previewDummy, w, h);
      ctx.restore();
    }

    const isMiniVisible = syncMiniStickyBarVisibility();
    if (isMiniVisible) {
      const miniCtx = miniPreviewCanvas.getContext('2d');
      if (miniCtx) {
        const mw = miniPreviewCanvas.clientWidth || 84;
        const mh = miniPreviewCanvas.clientHeight || 50;
        if (
          miniPreviewCanvas.width !== Math.floor(mw * dpr) ||
          miniPreviewCanvas.height !== Math.floor(mh * dpr)
        ) {
          miniPreviewCanvas.width = Math.floor(mw * dpr);
          miniPreviewCanvas.height = Math.floor(mh * dpr);
        }

        miniCtx.save();
        miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ProceduralRenderer.renderMicroscopePreview(miniCtx, previewDummy, mw, mh, 2.05);
        miniCtx.restore();
      }
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
  kpiPhages.textContent = String(telemetry.totalPhages);
  kpiNeutrophils.textContent = String(telemetry.totalNeutrophils);
  kpiGen.textContent = String(telemetry.maxGeneration);
  kpiFps.textContent = String(telemetry.fps);
  lblSimTime.textContent = `${telemetry.elapsedTime.toFixed(1)}s`;
  syncPauseButtonUI(telemetry.isPaused);

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
  const fullInspName = `${b.dna.lineageName} #${b.id}`;
  inspName.textContent = fullInspName;
  inspName.title = fullInspName;
  inspState.textContent = b.isDying
    ? ui.inspector.stateDying
    : b.isInfectedByPhage
      ? `${ui.inspector.stateInfectedPhage} (${Math.round(b.phageInfectionProgress * 100)}%)`
      : b.dividingProgress > 0
        ? `${ui.inspector.stateDividing} (${Math.round(b.dividingProgress * 100)}%)`
        : b.isSpore
          ? ui.inspector.stateSpore
          : b.isEmittingToxin
            ? ui.inspector.stateToxinActive
            : ui.inspector.stateVegetative;
  inspState.style.color = b.isDying
    ? '#f87171'
    : b.isInfectedByPhage
      ? '#c084fc'
      : b.dividingProgress > 0
        ? '#38bdf8'
        : b.isSpore
          ? '#fbbf24'
          : '#4ade80';
  inspCodingStrand.textContent = b.dna.codingStrand;
  inspCodingStrand.title = b.dna.codingStrand;
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
  const activeAdapts = b.dna.getAdaptations();
  const adaptLabels = activeAdapts
    .map((a) => ageTraits.adaptation[a]?.inspectorLabel)
    .filter(Boolean)
    .join(' + ');

  inspMeta.textContent = metaEntry ? metaEntry.inspectorLabel : b.dna.traits.metabolism;
  inspMot.textContent = motEntry ? motEntry.inspectorLabel : b.dna.traits.motility;
  inspWall.textContent = wallEntry ? wallEntry.inspectorLabel : b.dna.traits.wall;
  inspRepro.textContent = reproEntry ? reproEntry.inspectorLabel : b.dna.traits.reproduction;
  inspInter.textContent = adaptLabels
    ? `${interEntry.inspectorLabel} (${adaptLabels})`
    : interEntry.inspectorLabel;
  inspArmor.textContent = b.dna.stats.armor.toFixed(1);
  inspBasal.textContent = `${b.currentBasalMetabolism.toFixed(2)}/s (${Math.round(b.growthScale * 100)}%)`;
  inspSpeed.textContent = b.dna.getEffectiveMaxSpeed().toFixed(1);
}

// --- Eventos de Selección Visual por Botones ---
traitButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const traitCategory = btn.dataset.trait as keyof GenomeTraits | undefined;
    const traitVal = btn.dataset.value;
    if (!traitCategory || !traitVal) return;

    if (traitCategory === 'adaptation') {
      const clickedAdapt = traitVal as AdaptationType;
      const currentList = [...DNA.syncTraitAdaptations(selectedTraits)];
      if (clickedAdapt === 'none') {
        selectedTraits.adaptations = [];
        selectedTraits.adaptation = 'none';
      } else {
        const existingIdx = currentList.indexOf(clickedAdapt);
        if (existingIdx >= 0) {
          currentList.splice(existingIdx, 1);
        } else {
          if (currentList.length >= SimConfig.MAX_SIMULTANEOUS_ADAPTATIONS) {
            currentList.shift();
          }
          currentList.push(clickedAdapt);
        }
        selectedTraits.adaptations = DNA.normalizeAdaptations(currentList);
        selectedTraits.adaptation = selectedTraits.adaptations[0] ?? 'none';
      }
      syncAdaptationButtonsUI();
      updateDesignerReadouts();
      return;
    }

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
    }

    document
      .querySelectorAll<HTMLButtonElement>(`.trait-btn[data-trait="${traitCategory}"]`)
      .forEach((b) => b.classList.toggle('active', b === btn));

    updateDesignerReadouts();
  });
});

  // Eventos de cambio rápido entre categorías biológicas (pestañas, teclado, botones Anterior/Siguiente y codones ADN)
  categoryTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.categoryTab as keyof GenomeTraits | undefined;
      if (cat && CATEGORY_ORDER.includes(cat)) {
        setActiveCategoryGroup(cat);
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const idx = CATEGORY_ORDER.indexOf(activeCategoryGroup);
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const nextIdx = (idx + delta + CATEGORY_ORDER.length) % CATEGORY_ORDER.length;
      setActiveCategoryGroup(CATEGORY_ORDER[nextIdx], true);
    });
  });

  btnPrevCategory.addEventListener('click', () => {
    const idx = CATEGORY_ORDER.indexOf(activeCategoryGroup);
    const prevIdx = (idx - 1 + CATEGORY_ORDER.length) % CATEGORY_ORDER.length;
    setActiveCategoryGroup(CATEGORY_ORDER[prevIdx]);
  });

  btnNextCategory.addEventListener('click', () => {
    const idx = CATEGORY_ORDER.indexOf(activeCategoryGroup);
    const nextIdx = (idx + 1) % CATEGORY_ORDER.length;
    setActiveCategoryGroup(CATEGORY_ORDER[nextIdx]);
  });

  dnaStrandDisplay.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-jump-category]');
    const cat = target?.dataset.jumpCategory as keyof GenomeTraits | undefined;
    if (cat && CATEGORY_ORDER.includes(cat)) {
      setActiveCategoryGroup(cat);
    }
  });

  let copyFeedbackTimeout: number | undefined;
  btnCopyDna.addEventListener('click', async () => {
    const strand = buildUserDNA().codingStrand;
    try {
      await navigator.clipboard.writeText(strand);
    } catch {
      const tempInput = document.createElement('textarea');
      tempInput.value = strand;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }

    const ui = i18n.getBundle().ui;
    btnCopyDna.classList.add('copied');
    lblCopyDna.textContent = ui.copyDnaCopied;
    if (copyFeedbackTimeout !== undefined) {
      window.clearTimeout(copyFeedbackTimeout);
    }
    copyFeedbackTimeout = window.setTimeout(() => {
      btnCopyDna.classList.remove('copied');
      lblCopyDna.textContent = i18n.getBundle().ui.copyDnaBtn;
    }, 1800);
  });

  editorBodyScroll.addEventListener('scroll', syncMiniStickyBarVisibility, { passive: true });

  [rngSize, rngSpeed, rngArmor, rngPerception, rngToxin, rngHue, rngInitialPop, rngRivals].forEach(
  (el) => el.addEventListener('input', updateDesignerReadouts)
);
knownSpeciesCheckboxes.forEach((checkbox) =>
  checkbox.addEventListener('change', updateDesignerReadouts)
);
hostAgentsCheckboxes.forEach((checkbox) =>
  checkbox.addEventListener('change', updateDesignerReadouts)
);
strainNameInput.addEventListener('input', updateDesignerReadouts);

btnToggleFamousSpecies.addEventListener('click', () => {
  const isOpen = knownSpeciesBox.classList.toggle('is-open');
  btnToggleFamousSpecies.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

btnToggleHostAgents.addEventListener('click', () => {
  const isOpen = hostAgentsBox.classList.toggle('is-open');
  btnToggleHostAgents.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

btnToggleCustomRivalDna.addEventListener('click', () => {
  const isOpen = customRivalDnaBox.classList.toggle('is-open');
  btnToggleCustomRivalDna.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

btnRandomCustomRivalDna.addEventListener('click', () => {
  const randomHue = Math.floor(Math.random() * 72) * 5;
  const randomDna = DNA.createRandomRival('random_sample', randomHue);
  const adaptPool: readonly AdaptationType[] = [
    'claws',
    'giant_maw',
    'spikes',
    'bioluminescence',
    'suction_pore',
  ];
  const adaptCount = Math.random() < 0.25 ? 0 : Math.random() < 0.7 ? 1 : 2;
  const pickedAdapts: AdaptationType[] = [];
  while (pickedAdapts.length < adaptCount) {
    const candidate = pickRandom(adaptPool);
    if (!pickedAdapts.includes(candidate)) pickedAdapts.push(candidate);
  }
  const sampleDna = new DNA(
    'random_sample',
    randomHue,
    {
      ...randomDna.traits,
      adaptation: pickedAdapts[0] ?? 'none',
      adaptations: pickedAdapts,
    },
    randomDna.stats,
    1
  );
  customRivalDnaInput.value = sampleDna.codingStrand;
  handleCustomRivalDnaLiveInput();
  customRivalDnaInput.focus();
});

customRivalDnaInput.addEventListener('input', handleCustomRivalDnaLiveInput);
customRivalDnaInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleAddCustomRival();
  }
});
customRivalNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleAddCustomRival();
  }
});
btnAddCustomRival.addEventListener('click', handleAddCustomRival);
customRivalsList.addEventListener('click', (e) => {
  const removeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
    '[data-remove-custom-rival]'
  );
  if (!removeBtn) return;
  const targetId = Number(removeBtn.dataset.removeCustomRival);
  const idx = customRivals.findIndex((item) => item.id === targetId);
  if (idx !== -1) {
    customRivals.splice(idx, 1);
    renderCustomRivalsList();
    updateDesignerReadouts();
  }
});

// --- Flujo del Paso Previo (Editor <-> Placa de Cultivo) ---
function syncPauseButtonUI(paused: boolean): void {
  const ui = i18n.getBundle().ui;
  const label = paused ? ui.hud.btnResume : ui.hud.btnPause;
  btnPause.textContent = paused ? '▶' : '||';
  btnPause.title = label;
  btnPause.setAttribute('aria-label', label);
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
  setElementWithIcon(
    document.getElementById('lblMicroscopeTitle'),
    'microscope-lab.png',
    ui.microscopeTitle,
    'ui-icon ui-icon-sm'
  );
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
  setElementWithIcon(
    document.getElementById('lblParamHue'),
    'param-hue.png',
    age.params.hue,
    'ui-icon ui-icon-sm'
  );
  setTextById('lblColorGeneBadge', ui.colorGeneBadge);
  setElementWithIcon(
    document.getElementById('lblCodingStrandTitle'),
    'dna-helix.png',
    ui.codingStrandTitle,
    'ui-icon ui-icon-sm'
  );
  if (!btnCopyDna.classList.contains('copied')) {
    lblCopyDna.textContent = ui.copyDnaBtn;
  }
  btnCopyDna.title = ui.copyDnaTitle;
  setElementWithIcon(
    document.getElementById('lblBioBalanceTitle'),
    'atp-energy.png',
    ui.bioBalanceTitle,
    'ui-icon ui-icon-sm'
  );
  setTextById('lblCostBasal', ui.costBasal);
  setTextById('lblCostSwim', ui.costSwim);
  setTextById('lblCostToxin', ui.costToxin);
  setTextById('lblCostTotal', ui.costTotal);
  setTextById('lblMiniTotalCost', ui.costTotal);

  const paretoNote = document.getElementById('lblParetoNote');
  if (paretoNote) {
    paretoNote.innerHTML = `<img class="ui-icon ui-icon-xs" src="icons/adaptation-bioluminescence.png" alt="" /> <strong>${age.paretoTitle}</strong> ${age.paretoBody}`;
  }

  setElementWithIcon(
    document.getElementById('lblCultureConditionsTitle'),
    'petri-dish.png',
    ui.cultureConditionsTitle,
    'ui-icon ui-icon-sm'
  );
  setElementWithIcon(
    document.getElementById('lblParamInitialPop'),
    'petri-colony.png',
    age.params.initialPop,
    'ui-icon ui-icon-sm'
  );
  setElementWithIcon(
    document.getElementById('lblParamRivals'),
    'rivals-colonies.png',
    age.params.rivals,
    'ui-icon ui-icon-sm'
  );
  setElementWithIcon(
    document.getElementById('lblFamousSpeciesTitle'),
    'motility-flagellated.png',
    ui.famousSpeciesTitle,
    'ui-icon ui-icon-sm'
  );
  setElementWithIcon(
    document.getElementById('lblHostAgentsTitle'),
    'adaptation-spikes.png',
    ui.hostAgents.title,
    'ui-icon ui-icon-sm'
  );
  setTextById('lblHostAgentPhage', ui.hostAgents.phageLabel);
  setTextById('lblHostAgentNeutrophil', ui.hostAgents.neutrophilLabel);
  setElementWithIcon(
    document.getElementById('lblCustomRivalDnaTitle'),
    'dna-helix.png',
    ui.customRivalDna.title,
    'ui-icon ui-icon-sm'
  );
  setTextById('lblCustomRivalDnaHint', ui.customRivalDna.hint);
  customRivalDnaInput.placeholder = ui.customRivalDna.dnaPlaceholder;
  btnRandomCustomRivalDna.textContent = ui.customRivalDna.btnRandomDna;
  btnRandomCustomRivalDna.title = ui.customRivalDna.btnRandomDnaTitle;
  customRivalNameInput.placeholder = ui.customRivalDna.namePlaceholder;
  btnAddCustomRival.textContent = ui.customRivalDna.btnVerifyAdd;
  renderCustomRivalFeedback();
  renderCustomRivalsList();
  setElementWithIcon(
    document.getElementById('lblBtnDeploy'),
    'petri-dish.png',
    ui.btnDeploy,
    'ui-icon ui-icon-md'
  );

  // Columna derecha del Editor: Encabezado, Pestañas Rápidas y Categorías A..F
  const sectionHeading = document.querySelector<HTMLElement>('.editor-right-col .section-heading');
  if (sectionHeading) {
    sectionHeading.textContent = age.section1Heading;
  }

  setTextById('lblCatTabMetabolism', ui.categoryTabs.metabolism);
  setTextById('lblCatTabMotility', ui.categoryTabs.motility);
  setTextById('lblCatTabWall', ui.categoryTabs.wall);
  setTextById('lblCatTabReproduction', ui.categoryTabs.reproduction);
  setTextById('lblCatTabInteraction', ui.categoryTabs.interaction);
  setTextById('lblCatTabAdaptation', ui.categoryTabs.adaptation);
  updateCategoryStepNavText();

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
      const key = value as MetabolismType;
      const entry = age.traits.metabolism[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.metabolism[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'motility') {
      const key = value as MotilityType;
      const entry = age.traits.motility[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.motility[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'wall') {
      const key = value as WallType;
      const entry = age.traits.wall[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.wall[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'reproduction') {
      const key = value as ReproductionType;
      const entry = age.traits.reproduction[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.reproduction[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'interaction') {
      const key = value as InteractionType;
      const entry = age.traits.interaction[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.interaction[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
      }
    } else if (category === 'adaptation') {
      const key = value as AdaptationType;
      const entry = age.traits.adaptation[key];
      if (entry) {
        setElementWithIcon(titleEl, TRAIT_ICONS.adaptation[key], entry.editorTitle, 'trait-icon');
        if (descEl) descEl.innerHTML = entry.editorDesc;
        const proEl = btn.querySelector<HTMLElement>('.tag-pro');
        const conEl = btn.querySelector<HTMLElement>('.tag-con');
        setElementWithIcon(proEl, 'tag-pro.png', entry.proTag, 'ui-icon ui-icon-xs');
        if (conEl && entry.conTag) {
          setElementWithIcon(conEl, 'tag-con.png', entry.conTag, 'ui-icon ui-icon-xs');
        }
      }
    }
  });

  // Etiquetas de los sliders cuantitativos vinculados a cada categoría
  const setLinkedSliderLabel = (inputId: string, iconFile: string, labelText: string) => {
    const labelSpan = document.querySelector<HTMLElement>(`label[for="${inputId}"] > span:first-child`);
    setElementWithIcon(labelSpan, iconFile, labelText, 'ui-icon ui-icon-sm');
  };
  setLinkedSliderLabel('rngSize', 'param-size.png', age.params.size);
  setLinkedSliderLabel('rngSpeed', 'param-speed.png', age.params.speed);
  setLinkedSliderLabel('rngArmor', 'wall-gram-negative.png', age.params.armor);
  setLinkedSliderLabel('rngPerception', 'param-perception.png', age.params.perception);
  setLinkedSliderLabel('rngToxin', 'toxin-vials.png', age.params.toxin);

  document.querySelectorAll<HTMLElement>('.editor-right-col .linked-dna-badge .lbl').forEach((el) => {
    el.textContent = ui.dnaSequenceBadge;
  });

  // Barra lateral y HUD de Simulación
  setTextById('lblBrandSubtitle', ui.sidebar.brandSubtitle);
  setTextById('lblVersionBadge', ui.sidebar.versionBadge);
  setTextById('lblFounderStrainCard', ui.sidebar.founderStrainCard);
  setElementWithIcon(
    btnOpenEditorSidebar,
    'dna-helix.png',
    ui.sidebar.btnOpenEditor,
    'ui-icon ui-icon-sm'
  );
  setTextById('lblPopDynamicsCard', ui.sidebar.populationDynamicsCard);

  setElementWithIcon(btnOpenEditorHud, 'dna-helix.png', ui.hud.btnEditorDna, 'ui-icon ui-icon-xs');
  syncPauseButtonUI(btnPause.classList.contains('active'));
  btnSpeed.title = ui.hud.btnSpeedTitle;
  btnSpeed.setAttribute('aria-label', ui.hud.btnSpeedTitle);
  setElementWithIcon(
    lblHudSubstrate,
    'pipette.png',
    age.substrateLabel,
    'ui-icon ui-icon-xs'
  );
  lblHudLight.textContent = ui.hud.lightLabel;
  setElementWithIcon(
    lblHudPhages,
    'adaptation-spikes.png',
    ui.hud.phagesLabel,
    'ui-icon ui-icon-xs'
  );
  setElementWithIcon(
    lblHudNeutrophils,
    'wall-capsule.png',
    ui.hud.neutrophilsLabel,
    'ui-icon ui-icon-xs'
  );
  btnFeed.title = ui.hud.btnFeed;
  btnFeed.setAttribute('aria-label', ui.hud.btnFeed);
  btnRemoveSubstrate.title = ui.hud.btnRemoveSubstrate;
  btnRemoveSubstrate.setAttribute('aria-label', ui.hud.btnRemoveSubstrate);
  btnDecreaseLightRadius.title = ui.hud.btnDecreaseLightRadius;
  btnDecreaseLightRadius.setAttribute('aria-label', ui.hud.btnDecreaseLightRadius);
  btnIncreaseLightRadius.title = ui.hud.btnIncreaseLightRadius;
  btnIncreaseLightRadius.setAttribute('aria-label', ui.hud.btnIncreaseLightRadius);
  btnSpawnPhages.title = ui.hud.btnSpawnPhages;
  btnSpawnPhages.setAttribute('aria-label', ui.hud.btnSpawnPhages);
  btnRemovePhages.title = ui.hud.btnRemovePhages;
  btnRemovePhages.setAttribute('aria-label', ui.hud.btnRemovePhages);
  btnSpawnNeutrophils.title = ui.hud.btnSpawnNeutrophils;
  btnSpawnNeutrophils.setAttribute('aria-label', ui.hud.btnSpawnNeutrophils);
  btnRemoveNeutrophils.title = ui.hud.btnRemoveNeutrophils;
  btnRemoveNeutrophils.setAttribute('aria-label', ui.hud.btnRemoveNeutrophils);
  btnResetCam.title = ui.hud.btnResetCam;
  btnResetCam.setAttribute('aria-label', ui.hud.btnResetCam);
  syncDetailButtonUI();

  setElementWithIcon(
    document.getElementById('lblKpiBacteria'),
    'species-ecoli.png',
    ui.hud.kpiBacteria,
    'ui-icon ui-icon-xs'
  );
  setElementWithIcon(
    document.getElementById('lblKpiSpores'),
    'reproduction-sporulation.png',
    ui.hud.kpiSpores,
    'ui-icon ui-icon-xs'
  );
  setElementWithIcon(
    document.getElementById('lblKpiNutrients'),
    'petri-colony.png',
    ui.hud.kpiNutrients,
    'ui-icon ui-icon-xs'
  );
  setElementWithIcon(
    document.getElementById('lblKpiPhages'),
    'adaptation-spikes.png',
    ui.hud.kpiPhages,
    'ui-icon ui-icon-xs'
  );
  setElementWithIcon(
    document.getElementById('lblKpiNeutrophils'),
    'wall-capsule.png',
    ui.hud.kpiNeutrophils,
    'ui-icon ui-icon-xs'
  );
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
  engine.initColonies(
    userDNA,
    getSelectedRivalCount(),
    getSelectedInitialPop(),
    getSelectedKnownSpecies(),
    customRivals.map((entry) => entry.dna),
    getSelectedHostAgents()
  );

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

const SPEED_STEPS = [1, 2, 4] as const;
let currentSpeedIdx = 0;

btnSpeed.addEventListener('click', () => {
  currentSpeedIdx = (currentSpeedIdx + 1) % SPEED_STEPS.length;
  const nextSpeed = SPEED_STEPS[currentSpeedIdx];
  btnSpeed.dataset.speed = String(nextSpeed);
  btnSpeed.textContent = `${nextSpeed}x`;
  engine.setTimeScale(nextSpeed);
});

btnFeed.addEventListener('click', () => {
  engine.spawnNutrient(SimConfig.MANUAL_NUTRIENT_AMOUNT, true);
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

btnSpawnPhages.addEventListener('click', () => {
  engine.spawnPhages(SimConfig.MANUAL_PHAGE_WAVE_COUNT, false);
});

btnRemovePhages.addEventListener('click', () => {
  engine.removePhages(SimConfig.MANUAL_PHAGE_WAVE_COUNT);
});

btnSpawnNeutrophils.addEventListener('click', () => {
  engine.spawnNeutrophils(SimConfig.MANUAL_NEUTROPHIL_COUNT, false);
});

btnRemoveNeutrophils.addEventListener('click', () => {
  engine.removeNeutrophils(SimConfig.MANUAL_NEUTROPHIL_COUNT);
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
    if (movedDist >= 6) {
      engine.stopFollowingSelected();
      engine.camera.x += dx;
      engine.camera.y += dy;
    }
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

inspectorPanel.addEventListener('click', () => {
  const b = engine.getSelectedBacteria();
  if (b) {
    engine.isFollowingSelected = true;
    engine.centerCameraOn(b.x, b.y);
  }
});

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
