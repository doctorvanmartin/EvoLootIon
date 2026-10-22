import {
  AdaptationType,
  CodingStrandErrorKey,
  InteractionType,
  MetabolismType,
  MotilityType,
  ReproductionType,
  WallType,
} from '../models/DNA';

export type LocaleCode = 'es' | 'en';
export type AgeGroup = '5-7' | '8-10' | '11-14' | '15+';

export const SUPPORTED_LOCALES: readonly LocaleCode[] = ['es', 'en'] as const;
export const AGE_GROUPS: readonly AgeGroup[] = ['5-7', '8-10', '11-14', '15+'] as const;

export interface TraitTextEntry {
  /** Título en las tarjetas del editor genómico (incluye icono y nombre científico real entre paréntesis para los más pequeños) */
  editorTitle: string;
  /** Descripción explicativa adaptada a la edad en el editor genómico */
  editorDesc: string;
  /** Etiqueta traducida para el panel inspector al seleccionar una célula durante la simulación */
  inspectorLabel: string;
}

export interface AdaptationTextEntry extends TraitTextEntry {
  proTag: string;
  conTag?: string;
}

export interface AgeAdaptedContent {
  ageBadgeTooltip: string;
  editorSubtitle: string;
  section1Heading: string;
  paretoTitle: string;
  paretoBody: string;
  substrateLabel: string;
  bioBalance: {
    title: string;
    costBasal: string;
    costSwim: string;
    costToxin: string;
    costTotal: string;
    efficiencyHigh: string;
    efficiencyModerate: string;
    efficiencyDanger: string;
  };
  categories: {
    metabolism: { title: string; locusHint: string };
    motility: { title: string; locusHint: string };
    wall: { title: string; locusHint: string };
    reproduction: { title: string; locusHint: string };
    interaction: { title: string; locusHint: string };
    adaptation: { title: string };
  };
  params: {
    strainNameLabel: string;
    strainNamePlaceholder: string;
    initialPop: string;
    rivals: string;
    size: string;
    speed: string;
    armor: string;
    perception: string;
    toxin: string;
    hue: string;
  };
  traits: {
    metabolism: Record<MetabolismType, TraitTextEntry>;
    motility: Record<MotilityType, TraitTextEntry>;
    wall: Record<WallType, TraitTextEntry>;
    reproduction: Record<ReproductionType, TraitTextEntry>;
    interaction: Record<InteractionType, TraitTextEntry>;
    adaptation: Record<AdaptationType, AdaptationTextEntry>;
  };
}

export interface LocaleBundle {
  code: LocaleCode;
  label: string;
  documentTitle: string;
  ui: {
    langLabel: string;
    ageLabel: string;
    ageUnit: string;
    categoryTabs: {
      metabolism: string;
      motility: string;
      wall: string;
      reproduction: string;
      interaction: string;
      adaptation: string;
      prev: string;
      next: string;
      stepOf: string;
    };
    editorModalAria: string;
    editorTitle: string;
    instructionsLink: string;
    btnReturnToCulture: string;
    microscopeTitle: string;
    dnaSequenceBadge: string;
    genePrefix: string;
    codingStrandTitle: string;
    editDnaBtn: string;
    editDnaDoneBtn: string;
    editDnaTitle: string;
    editDnaPlaceholder: string;
    editDnaValid: string;
    copyDnaBtn: string;
    copyDnaCopied: string;
    copyDnaTitle: string;
    bioBalanceTitle: string;
    efficiencyHigh: string;
    efficiencyModerate: string;
    efficiencyDanger: string;
    costBasal: string;
    costSwim: string;
    costToxin: string;
    costTotal: string;
    cultureConditionsTitle: string;
    quorumTag: string;
    magnetTag: string;
    btnDeploy: string;
    defaultPlayerStrainName: string;
    specimenSingular: string;
    specimenPlural: string;
    rivalSingular: string;
    rivalPlural: string;
    famousSpeciesTitle: string;
    hostAgents: {
      title: string;
      phageLabel: string;
      neutrophilLabel: string;
    };
    customRivalDna: {
      title: string;
      hint: string;
      dnaPlaceholder: string;
      namePlaceholder: string;
      btnRandomDna: string;
      btnRandomDnaTitle: string;
      btnVerifyAdd: string;
      validPreview: string;
      addedSuccess: string;
      removeTitle: string;
      errors: Record<CodingStrandErrorKey, string>;
    };
    sessileZero: string;
    nonmotileZero: string;
    neutralZero: string;
    siderophoresActive: string;
    speedRealUnit: string;
    flagellaTag: string;
    spirocheteTag: string;
    ciliaTag: string;
    clawsPenaltyTag: string;
    giantMawArmorNote: string;
    divisionAtLabel: string;
    shapes: {
      coccus: string;
      spirillum: string;
      diplococcus: string;
      bacillus: string;
      archaea: string;
    };
    codons: {
      start: string;
      metabolism: string;
      size: string;
      motility: string;
      speed: string;
      wall: string;
      armor: string;
      reproduction: string;
      perception: string;
      interaction: string;
      toxin: string;
      adaptation: string;
      chromophore: string;
      stop: string;
    };
    sidebar: {
      brandSubtitle: string;
      versionBadge: string;
      founderStrainCard: string;
      btnOpenEditor: string;
      populationDynamicsCard: string;
      sporesShort: string;
    };
    hud: {
      btnEditorDna: string;
      btnPause: string;
      btnResume: string;
      btnSpeedTitle: string;
      lightLabel: string;
      btnFeed: string;
      btnRemoveSubstrate: string;
      btnDecreaseLightRadius: string;
      btnIncreaseLightRadius: string;
      phagesLabel: string;
      btnSpawnPhages: string;
      btnRemovePhages: string;
      neutrophilsLabel: string;
      btnSpawnNeutrophils: string;
      btnRemoveNeutrophils: string;
      btnResetCam: string;
      btnDetailAuto: string;
      btnDetailLow: string;
      btnDetailHigh: string;
      btnDetailTitle: string;
      kpiBacteria: string;
      kpiSpores: string;
      kpiNutrients: string;
      kpiPhages: string;
      kpiNeutrophils: string;
      kpiMaxGen: string;
      kpiFps: string;
    };
    inspector: {
      defaultOrganism: string;
      stateVegetative: string;
      stateSpore: string;
      stateToxinActive: string;
      statePredating: string;
      stateUnderAttack: string;
      stateInfectedPhage: string;
      stateFightingPhage: string;
      statePhageCured: string;
      stateDying: string;
      stateDividing: string;
      gen: string;
      energy: string;
      metabolism: string;
      motility: string;
      wall: string;
      reproduction: string;
      interaction: string;
      armor: string;
      basal: string;
      speed: string;
    };
  };
  byAge: Record<AgeGroup, AgeAdaptedContent>;
}

const ES_BUNDLE: LocaleBundle = {
  code: 'es',
  label: 'ES',
  documentTitle: 'EvoLootIon — Simulador de Vida Artificial Microbiana',
  ui: {
    langLabel: 'Idioma',
    ageLabel: 'Científico',
    ageUnit: 'años',
    categoryTabs: {
      metabolism: 'Metabolismo',
      motility: 'Locomoción',
      wall: 'Pared Celular',
      reproduction: 'Reproducción',
      interaction: 'Interacción',
      adaptation: 'Mutación Extra',
      prev: '← Anterior',
      next: 'Siguiente →',
      stepOf: 'Categoría {current} de {total}',
    },
    editorModalAria: 'Editor Genómico y Fenotípico',
    editorTitle: 'Editor Genómico y Fenotípico',
    instructionsLink: 'Instrucciones',
    btnReturnToCulture: 'Volver al Cultivo ×',
    microscopeTitle: 'Microscopio Electrónico',
    dnaSequenceBadge: 'Secuencia ADN',
    genePrefix: 'Gen',
    codingStrandTitle: 'Cadena Codificante (ADN)',
    editDnaBtn: 'Editar',
    editDnaDoneBtn: 'Listo',
    editDnaTitle: 'Escribir o pegar directamente la cadena codificante de ADN',
    editDnaPlaceholder: 'ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG',
    editDnaValid: 'ADN aplicado: {taxonomy} ({strand})',
    copyDnaBtn: 'Copiar',
    copyDnaCopied: '¡Copiado!',
    copyDnaTitle: 'Copiar cadena codificante al portapapeles',
    bioBalanceTitle: 'Balance de Energía (ATP)',
    efficiencyHigh: 'Alta Eficiencia',
    efficiencyModerate: 'Gasto Moderado',
    efficiencyDanger: 'Riesgo Inanición',
    costBasal: 'Metabolismo Basal (Cuerpo + Pared + Mutación):',
    costSwim: 'Gasto al Nadar a Velocidad Crucero:',
    costToxin: 'Fábrica de Veneno / Imanes Químicos:',
    costTotal: 'Consumo Total Estimado:',
    cultureConditionsTitle: 'Condiciones de la Placa de Cultivo',
    quorumTag: 'Equipo',
    magnetTag: 'Imán',
    btnDeploy: '¡Inocular Placa de Cultivo y Empezar!',
    defaultPlayerStrainName: 'Súper Bacilo',
    specimenSingular: 'ejemplar',
    specimenPlural: 'ejemplares',
    rivalSingular: 'cepa',
    rivalPlural: 'cepas',
    famousSpeciesTitle: 'Bacterias famosas que añadir',
    hostAgents: {
      title: 'Virus y defensas inmunes que añadir',
      phageLabel: 'Bacteriófago T4 (Virus lítico)',
      neutrophilLabel: 'Neutrófilo PMN (Glóbulo blanco)',
    },
    customRivalDna: {
      title: 'Añadir cepas rivales por cadena de ADN',
      hint: "Pega una cadena codificante 5' → 3' (14 codones ATG-...-TAG) para verificar su genoma e incluirla en el cultivo.",
      dnaPlaceholder: 'ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG',
      namePlaceholder: 'Nombre opcional (ej. Cepa Omega)',
      btnRandomDna: '🎲 ADN al azar',
      btnRandomDnaTitle: 'Generar una cadena de ADN válida al azar para editarla o añadirla',
      btnVerifyAdd: '+ Verificar y Añadir Cepa',
      validPreview: 'ADN válido: {taxonomy} ({strand})',
      addedSuccess: 'Cepa añadida al cultivo: {name} ({taxonomy})',
      removeTitle: 'Quitar esta cepa personalizada',
      errors: {
        empty: 'Introduce una cadena codificante de ADN para verificarla.',
        token_count: 'Formato inválido ({token} codones): se esperan {expected} separados por guiones.',
        start_codon: 'Codón de inicio inválido "{token}": debe comenzar por {expected}.',
        metabolism_codon: 'Codón de metabolismo inválido "{token}". Valores válidos: {expected}.',
        size_codon: 'Codón de tamaño inválido "{token}". Formato esperado: {expected}.',
        motility_codon: 'Codón de locomoción inválido "{token}". Valores válidos: {expected}.',
        speed_codon: 'Codón de velocidad inválido "{token}". Formato esperado: {expected}.',
        wall_codon: 'Codón de pared celular inválido "{token}". Valores válidos: {expected}.',
        armor_codon: 'Codón de armadura inválido "{token}". Formato esperado: {expected}.',
        reproduction_codon: 'Codón de reproducción inválido "{token}". Valores válidos: {expected}.',
        perception_codon: 'Codón sensorial inválido "{token}". Formato esperado: {expected}.',
        interaction_codon: 'Codón de interacción inválido "{token}". Valores válidos: {expected}.',
        toxin_codon: 'Codón de toxina inválido "{token}". Formato esperado: {expected}.',
        adaptation_codon: 'Codón de mutación extra inválido "{token}". Valores válidos: {expected}.',
        chromophore_codon: 'Codón de color inválido "{token}". Formato esperado: {expected}.',
        stop_codon: 'Codón de parada inválido "{token}": debe terminar en {expected}.',
      },
    },
    sessileZero: '0 (Inmóvil / Sésil)',
    nonmotileZero: '0 (No móvil)',
    neutralZero: '0 (Pacífica / Neutral)',
    siderophoresActive: 'Imán Activo (Sideróforos)',
    speedRealUnit: 'real',
    flagellaTag: 'Flagelo x1.35',
    spirocheteTag: 'Espiral x1.10',
    ciliaTag: 'Cilios x0.80',
    clawsPenaltyTag: ' · Pinzas -20%',
    giantMawArmorNote: '(-25% por Gran Boca)',
    divisionAtLabel: 'División a',
    shapes: {
      coccus: 'Coco',
      spirillum: 'Espirilo',
      diplococcus: 'Diplococo',
      bacillus: 'Bacilo',
      archaea: 'Arquea Hexagonal',
    },
    codons: {
      start: 'Codón de Inicio (Metionina)',
      metabolism: 'Tipo de Metabolismo',
      size: 'Tamaño Celular (Radio)',
      motility: 'Apéndice de Locomoción',
      speed: 'Velocidad Efectiva de Nado',
      wall: 'Estructura de Pared',
      armor: 'Armadura de Membrana',
      reproduction: 'Estrategia Reproductiva',
      perception: 'Alcance Sensorial (más alcance = más gasto basal)',
      interaction: 'Interacción / Guerra Química',
      toxin: 'Potencia Química',
      adaptation: 'Atributo Especial Único',
      chromophore: 'Pigmento Genético (Hue)',
      stop: 'Codón de Parada (Ámbar)',
    },
    sidebar: {
      brandSubtitle: 'Simulador Evolutivo Microbiano',
      versionBadge: 'v2.1 Genoma',
      founderStrainCard: 'Cepa Fundadora Inoculada',
      btnOpenEditor: 'Abrir Editor Genómico / Reinocular',
      populationDynamicsCard: 'Dinámica de Poblaciones',
      sporesShort: 'esp',
    },
    hud: {
      btnEditorDna: 'Editor ADN',
      btnPause: 'Pausar',
      btnResume: 'Reanudar',
      btnSpeedTitle: 'Cambiar velocidad (1x / 2x / 4x / 0,5x)',
      lightLabel: 'Luz',
      btnFeed: 'Añadir sustrato',
      btnRemoveSubstrate: 'Retirar sustrato',
      btnDecreaseLightRadius: 'Reducir radio de luz',
      btnIncreaseLightRadius: 'Aumentar radio de luz',
      phagesLabel: 'Fagos',
      btnSpawnPhages: 'Inocular oleada de bacteriófagos T4',
      btnRemovePhages: 'Retirar bacteriófagos de la placa',
      neutrophilsLabel: 'Neutrófilos',
      btnSpawnNeutrophils: 'Desplegar glóbulo blanco neutrófilo',
      btnRemoveNeutrophils: 'Retirar neutrófilos de la placa',
      btnResetCam: 'Centrar Vista',
      btnDetailAuto: 'Detalle: Auto',
      btnDetailLow: 'Detalle: Bajo',
      btnDetailHigh: 'Detalle: Alto',
      btnDetailTitle: 'Alternar entre detalle automático, bajo y alto',
      kpiBacteria: 'Bacterias:',
      kpiSpores: 'Esporas:',
      kpiNutrients: 'Nutrientes:',
      kpiPhages: 'Fagos:',
      kpiNeutrophils: 'Neutrófilos:',
      kpiMaxGen: 'Gen Máx:',
      kpiFps: 'FPS:',
    },
    inspector: {
      defaultOrganism: 'Organismo #1',
      stateVegetative: 'Vegetativa',
      stateSpore: 'Endospora',
      stateToxinActive: 'Química Activa',
      statePredating: 'Fagocitando presa',
      stateUnderAttack: 'En combate / Defendiéndose',
      stateInfectedPhage: 'Infectada (Fago T4)',
      stateFightingPhage: 'Defensa CRISPR vs Fago',
      statePhageCured: '¡Fago neutralizado (CRISPR)!',
      stateDying: 'Muriendo (Lisis)',
      stateDividing: 'Dividiéndose',
      gen: 'Gen',
      energy: 'Energía',
      metabolism: 'Metabolismo',
      motility: 'Locomoción',
      wall: 'Pared',
      reproduction: 'Reprod.',
      interaction: 'Interacción',
      armor: 'Armadura',
      basal: 'Basal',
      speed: 'Velocidad',
    },
  },
  byAge: {
    '5-7': {
      ageBadgeTooltip: 'Explicaciones sencillas y divertidas para pequeños de 5 a 7 años',
      editorSubtitle:
        '¡Crea tu propio bichito microscópico, elige sus súper poderes y mira cómo vive en el plato!',
      section1Heading: '1. Elige los Súper Poderes de tu Bichito (Con su nombre científico)',
      paretoTitle: 'Regla del Hambre (Principio de Pareto):',
      paretoBody:
        'Si haces un bichito gigante, rapidísimo y con muchas armas, ¡tendrá muchísima hambre todo el rato y se quedará sin energía si hay poca comida!',
      substrateLabel: 'Comida',
      bioBalance: {
        title: 'Energía y Hambre',
        costBasal: 'Cuerpo y escudo:',
        costSwim: 'Gasto al nadar:',
        costToxin: 'Veneno / Imanes:',
        costTotal: 'Hambre total:',
        efficiencyHigh: 'Come poquito',
        efficiencyModerate: 'Hambre normal',
        efficiencyDanger: '¡Mucha hambre!',
      },
      categories: {
        metabolism: {
          title: 'A. ¿Cómo come y qué forma tiene? (Metabolismo)',
          locusHint: 'Forma del Cuerpo',
        },
        motility: {
          title: 'B. ¿Cómo nada por el agua? (Locomoción)',
          locusHint: 'Aletas y Colas',
        },
        wall: {
          title: 'C. ¿Qué traje protector lleva? (Pared Celular)',
          locusHint: 'Escudo Protector',
        },
        reproduction: {
          title: 'D. ¿Cómo tiene bebés y huele la comida? (Reproducción)',
          locusHint: 'Familia y Olfato',
        },
        interaction: {
          title: 'E. ¿Cómo se defiende de otros bichitos? (Interacción)',
          locusHint: 'Poderes Químicos',
        },
        adaptation: {
          title: 'F. ¡Súper Disfraces Especiales! (Mutaciones con ventaja y coste)',
        },
      },
      params: {
        strainNameLabel: 'Nombre:',
        strainNamePlaceholder: 'Nombre de tu bichito',
        initialPop: 'Bichitos por Familia (Ejemplares)',
        rivals: 'Rivales aleatorias',
        size: 'Tamaño del Cuerpo (Tamaño medio: más grande = más reserva y hambre)',
        speed: 'Fuerza al Nadar (Velocidad Efectiva)',
        armor: 'Dureza del Escudo (Armadura de Pared)',
        perception: 'Súper olfato (más alcance gasta más energía)',
        toxin: 'Fuerza del Veneno (Potencia de Bacteriocina)',
        hue: 'Color de tu Bichito (Pigmento / Cromóforo)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'ComeLuz (Fotosintética · Coco)',
            editorDesc:
              '¡Come rayitos de sol como una plantita sin buscar comida! Cuerpo redondito como una pelota (Coco, Fotosintética).',
            inspectorLabel: 'ComeLuz (Fotosintética)',
          },
          saprophyte: {
            editorTitle: 'Limpiadora (Saprófita · Bacilo)',
            editorDesc:
              'Recicla miguitas y restos del plato (+55% energía de restos). Forma de bastoncito (Bacilo, Saprófita).',
            inspectorLabel: 'Limpiadora (Saprófita)',
          },
          predator: {
            editorTitle: 'Cazadora (Predadora · Espirilo)',
            editorDesc:
              'Persigue y da mordisquitos a bichitos de otros colores. Cuerpo alargado y veloz (Espirilo, Predadora).',
            inspectorLabel: 'Cazadora (Predadora)',
          },
          fermenter: {
            editorTitle: 'Súper Barriga (Fermentadora · Diplococo)',
            editorDesc:
              'Saca mucha más energía (+45%) de cada bolita de comida. Forma de dos bolitas juntas (Diplococo, Fermentadora).',
            inspectorLabel: 'Súper Barriga (Fermentadora)',
          },
          chemolithotroph: {
            editorTitle: 'ComeRocas (Quimiolitótrofa · Arquea)',
            editorDesc:
              'Come minerales invisibles del agua sin necesitar sol y aguanta un 20% mejor el veneno (Quimiolitótrofa).',
            inspectorLabel: 'ComeRocas (Quimiolitótrofa)',
          },
          chemoheterotroph: {
            editorTitle: 'ComeOrgánico (Quimioheterótrofa · Bacilo)',
            editorDesc:
              'Obtiene energía de nutrientes orgánicos sin especializarse en fermentar o reciclar restos.',
            inspectorLabel: 'ComeOrgánico (Quimioheterótrofa)',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Quietecita (Sésil)',
            editorDesc:
              'No se mueve de su sitio (gasta 0 energía) y su pegamento la protege un +15% de mordiscos (Sésil).',
            inspectorLabel: 'Quietecita (Sésil)',
          },
          nonmotile: {
            editorTitle: 'No móvil',
            editorDesc: 'No nada activamente, pero tampoco queda pegada al suelo como una bacteria sésil.',
            inspectorLabel: 'No móvil',
          },
          flagellated: {
            editorTitle: '〰️ Cola Turbo (Flagelada)',
            editorDesc:
              'Tiene una colita larga que gira como una lancha motora (+35% más rápida), pero da más hambre (Flagelada).',
            inspectorLabel: 'Cola Turbo (Flagelada)',
          },
          ciliated: {
            editorTitle: 'Pelitos Remos (Ciliada)',
            editorDesc:
              'Rema con muchos pelitos cortos para girar súper bien y cansarse poquito, pero corre menos (-20%, Ciliada).',
            inspectorLabel: 'Pelitos Remos (Ciliada)',
          },
          spirochete: {
            editorTitle: 'Sacacorchos (Espiroqueta)',
            editorDesc:
              'Avanza girando como un tornillo (+10% velocidad) y se escapa del 25% de los mordiscos (Espiroqueta).',
            inspectorLabel: 'Sacacorchos (Espiroqueta)',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Traje Ligero (Gram-Negativa)',
            editorDesc:
              'Doble piel finita que no pesa nada y frena un 28% de los venenos (Gram-Negativa).',
            inspectorLabel: 'Traje Ligero (Gram−)',
          },
          gram_positive: {
            editorTitle: 'Escudo Fuerte (Gram-Positiva)',
            editorDesc:
              'Un traje duro y grueso que protege mucho de los golpes, aunque pesa un poquito más (Gram-Positiva).',
            inspectorLabel: 'Escudo Fuerte (Gram+)',
          },
          capsule: {
            editorTitle: 'Burbuja Viscosa (Cápsula Mucosa)',
            editorDesc:
              'Recubierta de gelatina resbaladiza que quita la mitad del daño (-50%) de mordiscos y venenos (Cápsula Mucosa).',
            inspectorLabel: 'Burbuja (Cápsula)',
          },
          s_layer: {
            editorTitle: 'Armadura de Cristal (Capa S)',
            editorDesc:
              'Traje brillante como un diamante que rebota el 20% de los mordiscos y cansa menos (Capa S Cristalina).',
            inspectorLabel: 'Cristal (Capa S)',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Gemelas Iguales (Fisión Binaria)',
            editorDesc:
              'Cuando come mucho se parte por la mitad en dos hermanas igualitas (50% / 50% energía, Fisión Binaria).',
            inspectorLabel: 'Gemelas (Fisión Binaria)',
          },
          budding: {
            editorTitle: 'Bebé Retoño (Gemación)',
            editorDesc:
              'Le sale un hijito pequeño al lado y la mamá se queda con más fuerza (65% energía, Gemación).',
            inspectorLabel: 'Retoño (Gemación)',
          },
          sporulation: {
            editorTitle: 'Semilla de Piedra (Esporulación)',
            editorDesc:
              'Si se acaba la comida, se duerme dentro de una piedrecita indestructible hasta que vuelva el alimento (Esporulación).',
            inspectorLabel: 'Semilla (Esporulación)',
          },
          conjugation: {
            editorTitle: 'Abrazo de Energía (Conjugación · Pili)',
            editorDesc:
              'Se da la mano con sus hermanas cercanas usando antenitas y ganan energía juntas (+0.35 ATP/s, Conjugación).',
            inspectorLabel: 'Abrazo (Conjugación)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Buena Vecina (Pacífica / Neutral)',
            editorDesc:
              'No tira veneno a nadie y guarda toda su fuerza para crecer y tener más bebés (Neutral).',
            inspectorLabel: 'Amigable (Neutral)',
          },
          bacteriocins: {
            editorTitle: 'Spray de Veneno (Bacteriocinas)',
            editorDesc:
              'Suelta una nube de veneno todo el rato para alejar a los bichitos rivales (Bacteriocinas).',
            inspectorLabel: 'Spray Veneno (Bacteriocinas)',
          },
          quorum_sensing: {
            editorTitle: 'Defensa en Equipo (Quorum Sensing)',
            editorDesc:
              'Solo suelta el veneno cuando se juntan 3 o más amigas de su misma familia (Quorum Sensing).',
            inspectorLabel: 'En Equipo (Quorum)',
          },
          siderophores: {
            editorTitle: 'Imán de Comida (Sideróforos)',
            editorDesc:
              'Lanza imanes invisibles que atraen las bolitas de comida cercanas hacia su boca (Sideróforos).',
            inspectorLabel: 'Imán (Sideróforos)',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Normal (Sin Mutación Extra)',
            editorDesc: 'Cuerpo sencillo y ligero, sin gastos raros ni peso extra.',
            inspectorLabel: 'Normal',
            proTag: 'No gasta energía extra',
          },
          claws: {
            editorTitle: 'Pinzas de Cangrejo (Pinzas Quitinosas)',
            editorDesc: 'Tenazas delanteras que sujetan fuerte a otros bichitos para que no escapen.',
            inspectorLabel: 'Pinzas (Quelada)',
            proTag: '+45% daño y frena presas',
            conTag: 'Pesan: -20% velocidad y +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Súper Bocota (Gran Boca · Citostoma)',
            editorDesc: 'Una boca gigante con dientecitos para tragar comida desde más lejos.',
            inspectorLabel: 'Súper Bocota (Citostoma)',
            proTag: '+25% energía al comer',
            conTag: 'Escudo más blando (-25%) y +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Pinchos de Erizo (Pinchos Calcáreos)',
            editorDesc: 'Corona de espinas que pincha a quien intente morderla.',
            inspectorLabel: 'Pinchos (Equinada)',
            proTag: 'Devuelve 40% del daño',
            conTag: 'Frena en el agua (+35% coste nadar)',
          },
          bioluminescence: {
            editorTitle: 'Linterna Mágica (Bioluminiscencia)',
            editorDesc: '¡Brilla en la oscuridad! Se da luz a sí misma y encandila a las cazadoras.',
            inspectorLabel: 'Linterna (Bioluminiscente)',
            proTag: 'Luz propia y -28% mordiscos',
            conTag: 'Brillar gasta +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Trompa Aspiradora (Trompa Ventosa)',
            editorDesc: 'Una trompita que chupa las bolitas de comida cercanas como una aspiradora.',
            inspectorLabel: 'Aspiradora (Ventosa)',
            proTag: 'Aspira comida a distancia',
            conTag: 'Cuesta +15% tener bebés',
          },
        },
      },
    },
    '8-10': {
      ageBadgeTooltip: 'Explicaciones claras con vocabulario científico guiado para 8 a 10 años',
      editorSubtitle:
        'Combina los genes de tu bacteria, descubre cómo funciona cada órgano y ponla a prueba en la placa de cultivo',
      section1Heading: '1. Configura los Genes y Órganos de tu Bacteria',
      paretoTitle: 'Equilibrio de la Naturaleza (Regla de Pareto):',
      paretoBody:
        'Cada habilidad cuesta energía (ATP). Si creas una bacteria enorme, rapidísima y llena de defensas, gastará tanta energía por segundo que morirá de hambre cuando escasee la comida.',
      substrateLabel: 'Comida',
      bioBalance: {
        title: 'Balance de Energía',
        costBasal: 'Mantenimiento del cuerpo:',
        costSwim: 'Energía al nadar:',
        costToxin: 'Defensa química / Imán:',
        costTotal: 'Gasto total:',
        efficiencyHigh: 'Bajo gasto',
        efficiencyModerate: 'Gasto medio',
        efficiencyDanger: '¡Gasta mucho!',
      },
      categories: {
        metabolism: {
          title: 'A. ¿Cómo consigue energía y qué forma tiene? (Metabolismo)',
          locusHint: 'Forma Celular',
        },
        motility: {
          title: 'B. ¿Cómo se impulsa en el agua? (Locomoción y Velocidad)',
          locusHint: 'Propulsión',
        },
        wall: {
          title: 'C. ¿Qué escudo protege su cuerpo? (Pared Celular)',
          locusHint: 'Defensa',
        },
        reproduction: {
          title: 'D. ¿Cómo se multiplica y detecta comida? (Reproducción)',
          locusHint: 'Supervivencia',
        },
        interaction: {
          title: 'E. ¿Usa defensas químicas o imanes? (Interacción)',
          locusHint: 'Química',
        },
        adaptation: {
          title: 'F. ¡Súper Mutaciones Especiales! (Órgano extra con ventaja y coste)',
        },
      },
      params: {
        strainNameLabel: 'Nombre:',
        strainNamePlaceholder: 'Nombre de tu bacteria',
        initialPop: 'Ejemplares por Colonia',
        rivals: 'Colonias Rivales Aleatorias',
        size: 'Tamaño del Cuerpo (Tamaño medio: más reserva y gasto)',
        speed: 'Potencia del Motor (Velocidad Efectiva Real)',
        armor: 'Dureza de la Armadura (Reduce el daño recibido)',
        perception: 'Olfato químico (más alcance = más gasto basal)',
        toxin: 'Potencia del Veneno Químico (Bacteriocina)',
        hue: 'Color / Pigmento de tu Bacteria (Cromóforo)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Productora Solar (Fotosintética · Coco)',
            editorDesc:
              'Transforma la luz en energía como las plantas. Tiene cuerpo esférico (Coco, Fotosintética).',
            inspectorLabel: 'Solar (Fotosintética)',
          },
          saprophyte: {
            editorTitle: 'Recicladora (Saprófita · Bacilo)',
            editorDesc:
              'Come nutrientes sueltos y aprovecha un +55% los restos orgánicos. Forma de bastón (Bacilo, Saprófita).',
            inspectorLabel: 'Recicladora (Saprófita)',
          },
          predator: {
            editorTitle: 'Cazadora Activa (Predadora · Espirilo)',
            editorDesc:
              'Persigue y atrapa bacterias vivas de otras colonias. Forma alargada (Espirilo, Predadora).',
            inspectorLabel: 'Cazadora (Predadora)',
          },
          fermenter: {
            editorTitle: 'Súper Digestión (Fermentadora · Diplococo)',
            editorDesc:
              'Extrae un +45% más de energía de cada nutriente que come. Célula doble (Diplococo, Fermentadora).',
            inspectorLabel: 'Súper Digestión (Fermentadora)',
          },
          chemolithotroph: {
            editorTitle: 'ComeMinerales (Quimiolitótrofa · Arquea)',
            editorDesc:
              'Se alimenta de minerales inorgánicos sin necesitar luz y resiste un 20% el veneno (Quimiolitótrofa).',
            inspectorLabel: 'ComeMinerales (Quimiolitótrofa)',
          },
          chemoheterotroph: {
            editorTitle: 'ComeMateria Orgánica (Quimioheterótrofa)',
            editorDesc:
              'Obtiene energía de materia orgánica a ritmo normal, sin bonificación por fermentación o detritos.',
            inspectorLabel: 'Quimioheterótrofa',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Fija al Fondo (Sésil)',
            editorDesc:
              'No se mueve (gasta 0 ATP/s en nadar) y su película protectora resiste +15% los mordiscos (Sésil).',
            inspectorLabel: 'Fija (Sésil)',
          },
          nonmotile: {
            editorTitle: 'No móvil',
            editorDesc: 'No nada activamente, pero no está anclada ni forma un biofilm sésil.',
            inspectorLabel: 'No móvil',
          },
          flagellated: {
            editorTitle: '〰️ Cola Motorizada (Flagelada)',
            editorDesc:
              'Látigo giratorio que le da un <strong>+35% más de velocidad</strong>, aunque consume más energía.',
            inspectorLabel: 'Cola Motor (Flagelada)',
          },
          ciliated: {
            editorTitle: 'Remos Ágiles (Ciliada)',
            editorDesc:
              'Pequeños cilios que ahorran energía y giran muy bien, pero con <strong>menor velocidad punta (-20%)</strong>.',
            inspectorLabel: 'Remos (Ciliada)',
          },
          spirochete: {
            editorTitle: 'Giro Sacacorchos (Espiroqueta)',
            editorDesc:
              'Avanza rotando en espiral (<strong>+10% velocidad</strong>) y esquiva el 25% de los ataques.',
            inspectorLabel: 'Sacacorchos (Espiroqueta)',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Doble Piel Ligera (Gram-Negativa)',
            editorDesc:
              'Membrana doble muy ligera que no añade peso y filtra un 28% de las toxinas.',
            inspectorLabel: 'Piel Ligera (Gram−)',
          },
          gram_positive: {
            editorTitle: 'Muro Reforzado (Gram-Positiva)',
            editorDesc:
              'Pared celular gruesa y muy resistente (+Armadura), aunque cuesta algo más de energía mantenerla.',
            inspectorLabel: 'Muro Grueso (Gram+)',
          },
          capsule: {
            editorTitle: 'Escudo Gelatinoso (Cápsula Mucosa)',
            editorDesc:
              'Cubierta resbaladiza que reduce a la mitad (-50%) el daño de mordiscos y venenos.',
            inspectorLabel: 'Escudo Gel (Cápsula)',
          },
          s_layer: {
            editorTitle: 'Malla Cristalina (Capa S)',
            editorDesc:
              'Coraza geométrica que rebota el 20% de los mordiscos y hace más ligera la armadura.',
            inspectorLabel: 'Malla Cristal (Capa S)',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'División en Dos (Fisión Binaria)',
            editorDesc:
              'Se estira y se divide por la mitad en dos células gemelas (50% / 50% de energía).',
            inspectorLabel: 'División 50/50 (Fisión)',
          },
          budding: {
            editorTitle: 'Brote Lateral (Gemación)',
            editorDesc:
              'Forma un brote pequeño mientras la célula madre conserva el 65% de su energía.',
            inspectorLabel: 'Brote (Gemación)',
          },
          sporulation: {
            editorTitle: 'Cápsula de Piedra (Esporulación)',
            editorDesc:
              'Si pasa hambre, se transforma en una endospora resistente casi inmortal hasta que vuelva la comida.',
            inspectorLabel: 'Endospora (Esporulación)',
          },
          conjugation: {
            editorTitle: 'Antena de Equipo (Conjugación · Pili)',
            editorDesc:
              'Conecta puentes (pili) con sus compañeras cercanas para darse energía extra (+0.35 ATP/s).',
            inspectorLabel: 'Antena Pili (Conjugación)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Pacífica (Neutral / Simbiótica)',
            editorDesc:
              'No gasta energía en fabricar venenos y dedica todo su ATP a crecer y dividirse.',
            inspectorLabel: 'Pacífica (Neutral)',
          },
          bacteriocins: {
            editorTitle: 'Nube de Veneno (Bacteriocinas)',
            editorDesc:
              'Libera un halo continuo de toxinas (bacteriocinas) que debilita a las cepas enemigas.',
            inspectorLabel: 'Toxinas (Bacteriocinas)',
          },
          quorum_sensing: {
            editorTitle: 'Ataque en Equipo (Quorum Sensing)',
            editorDesc:
              'Solo activa el veneno cuando detecta a 3 o más compañeras juntas, ahorrando energía si está sola.',
            inspectorLabel: 'En Equipo (Quorum)',
          },
          siderophores: {
            editorTitle: 'Imán de Nutrientes (Sideróforos)',
            editorDesc:
              'Lanza moléculas captadoras que atraen la comida cercana hacia ella automáticamente.',
            inspectorLabel: 'Imán (Sideróforos)',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Sin Mutación Extra',
            editorDesc: 'Cuerpo clásico ligero, sin gastos ni penalizaciones adicionales.',
            inspectorLabel: 'Sin mutación',
            proTag: '+0 ATP/s extra',
          },
          claws: {
            editorTitle: 'Pinzas de Captura (Pinzas Quitinosas)',
            editorDesc: 'Tenazas frontales que sujetan a la presa para que no pueda escapar.',
            inspectorLabel: 'Pinzas (Quelada)',
            proTag: '+45% daño y frena presas',
            conTag: 'Pesadas: -20% velocidad y +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Gran Boca (Citostoma)',
            editorDesc: 'Boca gigante para tragar nutrientes y presas desde más lejos.',
            inspectorLabel: 'Gran Boca (Citostoma)',
            proTag: '+25% energía al comer',
            conTag: 'Punto débil: -25% armadura y +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Pinchos Defensivos (Pinchos Calcáreos)',
            editorDesc: 'Corona de espinas que devuelve daño a cualquier cazadora que la muerda.',
            inspectorLabel: 'Pinchos (Equinada)',
            proTag: 'Devuelve 40% del daño',
            conTag: 'Roce en el agua (+35% coste nado)',
          },
          bioluminescence: {
            editorTitle: 'Luz Propia (Bioluminiscencia)',
            editorDesc: 'Brilla en la oscuridad generando su propia luz y deslumbrando a los depredadores.',
            inspectorLabel: 'Bioluminiscente',
            proTag: 'Luz propia y -28% mordiscos',
            conTag: 'Brillar gasta +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Trompa Ventosa (Poro Suctor)',
            editorDesc: 'Trompa elástica que aspira las partículas de comida cercanas.',
            inspectorLabel: 'Trompa Ventosa',
            proTag: 'Aspira comida a distancia',
            conTag: '+15% coste para dividirse',
          },
        },
      },
    },
    '11-14': {
      ageBadgeTooltip: 'Biología educativa intermedia con conceptos y nombres científicos (11 a 14 años)',
      editorSubtitle:
        'Diseña los genes funcionales y órganos de tu cepa bacteriana antes de inocular la placa de cultivo',
      section1Heading: '1. Diseña los Genes y Órganos de tu Bacteria (Genotipo y Fenotipo)',
      paretoTitle: 'Regla de la Naturaleza (Principio de Pareto):',
      paretoBody:
        'Toda adaptación tiene un coste metabólico en ATP (Ley de Kleiber). Una bacteria gigante, veloz y armada consumirá tanta energía que morirá de inanición si escasea el sustrato.',
      substrateLabel: 'Sustrato',
      bioBalance: {
        title: 'Balance de Energía (ATP)',
        costBasal: 'Metabolismo Basal (Cuerpo + Pared + Mutación):',
        costSwim: 'Gasto al Nadar a Velocidad Crucero:',
        costToxin: 'Fábrica de Veneno / Imanes Químicos:',
        costTotal: 'Consumo Total Estimado:',
        efficiencyHigh: 'Alta Eficiencia',
        efficiencyModerate: 'Gasto Moderado',
        efficiencyDanger: 'Riesgo Inanición',
      },
      categories: {
        metabolism: {
          title: 'A. ¿Cómo se alimenta y qué forma tiene? (Metabolismo y Tamaño)',
          locusHint: 'Forma Celular (Locus Trófico)',
        },
        motility: {
          title: 'B. ¿Cómo se mueve por el medio? (Locomoción y Velocidad)',
          locusHint: 'Propulsión (Locus Cinético)',
        },
        wall: {
          title: 'C. ¿Qué estructura protege su membrana? (Pared Celular y Armadura)',
          locusHint: 'Defensa (Locus Estructural)',
        },
        reproduction: {
          title: 'D. ¿Cómo se reproduce y percibe el entorno? (Reproducción y Quimiotaxis)',
          locusHint: 'Supervivencia (Locus Reproductivo)',
        },
        interaction: {
          title: 'E. ¿Qué estrategia química utiliza? (Interacción y Toxinas)',
          locusHint: 'Química (Locus Químico)',
        },
        adaptation: {
          title: 'F. Adaptaciones Morfológicas Especiales (Con ventaja y compromiso metabólico)',
        },
      },
      params: {
        strainNameLabel: 'Nombre:',
        strainNamePlaceholder: 'Nombre de tu cepa',
        initialPop: 'Ejemplares por Cepa',
        rivals: 'Cepas Rivales Aleatorias',
        size: 'Tamaño Celular (Tamaño medio: más reserva y gasto basal)',
        speed: 'Potencia Locomotora (Velocidad Efectiva Real)',
        armor: 'Armadura de Membrana (Mitigación de daño físico y químico)',
        perception: 'Quimiotaxis (más alcance = más gasto basal)',
        toxin: 'Potencia de Bacteriocina (Toxicidad química)',
        hue: 'Pigmento Genético / Cromóforo de la Cepa',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Fotosintética (Coco)',
            editorDesc:
              'Autótrofa solar: sintetiza ATP con la luz sin depender de nutrientes sólidos. Cuerpo esférico.',
            inspectorLabel: 'Fotosintética (Coco)',
          },
          saprophyte: {
            editorTitle: 'Saprófita (Bacilo)',
            editorDesc:
              'Descomponedora: consume nutrientes libres y obtiene +55% de energía de restos orgánicos.',
            inspectorLabel: 'Saprófita (Bacilo)',
          },
          predator: {
            editorTitle: 'Predadora (Espirilo)',
            editorDesc:
              'Heterótrofa cazadora: persigue y fagocita bacterias vivas de otras cepas.',
            inspectorLabel: 'Predadora (Espirilo)',
          },
          fermenter: {
            editorTitle: 'Fermentadora (Diplococo)',
            editorDesc:
              'Metabolismo fermentativo: extrae un +45% extra de ATP de cada partícula de sustrato.',
            inspectorLabel: 'Fermentadora (Diplococo)',
          },
          chemolithotroph: {
            editorTitle: 'Quimiolitótrofa (Arquea)',
            editorDesc:
              'Oxida minerales inorgánicos sin necesitar luz solar y resiste un 20% las toxinas.',
            inspectorLabel: 'Quimiolitótrofa (Arquea)',
          },
          chemoheterotroph: {
            editorTitle: 'Quimioheterótrofa (Bacilo)',
            editorDesc:
              'Usa compuestos orgánicos como fuente de energía, sin la especialización de fermentadoras o saprófitas.',
            inspectorLabel: 'Quimioheterótrofa',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Sésil (Anclada / Biofilm)',
            editorDesc:
              'Inmóvil (Coste 0 ATP/s) y su matriz de biofilm resiste un +15% los ataques de predadores.',
            inspectorLabel: 'Sésil (Inmóvil)',
          },
          nonmotile: {
            editorTitle: 'No móvil',
            editorDesc: 'Carece de locomoción activa, pero no se considera anclada ni obtiene defensa de biofilm.',
            inspectorLabel: 'No móvil',
          },
          flagellated: {
            editorTitle: '〰️ Flagelada (Propulsión Flagelar)',
            editorDesc:
              'Filamento rotatorio: alcanza <strong>+35% más velocidad punta</strong>, con mayor consumo de ATP.',
            inspectorLabel: 'Flagelada',
          },
          ciliated: {
            editorTitle: 'Ciliada (Cilios Perimetrales)',
            editorDesc:
              'Cilios coordinados que ahorran energía y giran con agilidad, pero con <strong>menor velocidad máxima (-20%)</strong>.',
            inspectorLabel: 'Ciliada',
          },
          spirochete: {
            editorTitle: 'Espiroqueta (Filamento Axial)',
            editorDesc:
              'Tracción helicoidal (<strong>+10% velocidad</strong>) que esquiva un 25% de los ataques por predación.',
            inspectorLabel: 'Espiroqueta',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Gram-Negativa (Doble Membrana)',
            editorDesc:
              'Pared delgada con membrana externa ligera: no añade peso y filtra un 28% de las toxinas.',
            inspectorLabel: 'Gram-Negativa',
          },
          gram_positive: {
            editorTitle: 'Gram-Positiva (Pared Gruesa)',
            editorDesc:
              'Capa gruesa de peptidoglicano muy resistente (+Armadura), con mayor coste de mantenimiento.',
            inspectorLabel: 'Gram-Positiva',
          },
          capsule: {
            editorTitle: 'Cápsula Mucosa (Glicocálix)',
            editorDesc:
              'Envoltura mucosa anti-fagocitosis: reduce a la mitad (-50%) el daño de mordiscos y toxinas.',
            inspectorLabel: 'Cápsula Mucosa',
          },
          s_layer: {
            editorTitle: 'Capa S Cristalina',
            editorDesc:
              'Red proteica paracristalina: desvía el 20% del daño físico y reduce un 25% el coste de armadura.',
            inspectorLabel: 'Capa S Cristalina',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Fisión Binaria (Simétrica)',
            editorDesc:
              'Bipartición celular en dos bacterias hijas idénticas (reparto 50% / 50% de energía).',
            inspectorLabel: 'Fisión Binaria',
          },
          budding: {
            editorTitle: 'Gemación (Asimétrica)',
            editorDesc:
              'Genera una yema hija menor mientras la célula madre retiene el 65% de la energía.',
            inspectorLabel: 'Gemación',
          },
          sporulation: {
            editorTitle: 'Esporulación (Endospora)',
            editorDesc:
              'Ante la inanición forma una endospora latente casi invulnerable hasta detectar nutrientes.',
            inspectorLabel: 'Esporulación',
          },
          conjugation: {
            editorTitle: 'Conjugación (Pili Sexuales)',
            editorDesc:
              'Conecta pili con células hermanas cercanas generando sinergia metabólica (+0.35 ATP/s).',
            inspectorLabel: 'Conjugación (Pili)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Neutral / Simbiótica',
            editorDesc:
              'Sin gasto químico en toxinas: destina todo su ATP al crecimiento y la división celular.',
            inspectorLabel: 'Neutral / Simbiótica',
          },
          bacteriocins: {
            editorTitle: 'Nube de Bacteriocinas',
            editorDesc:
              'Secreción continua de péptidos antimicrobianos que dañan a las bacterias competidoras.',
            inspectorLabel: 'Bacteriocinas',
          },
          quorum_sensing: {
            editorTitle: 'Quorum Sensing (Cooperativo)',
            editorDesc:
              'Comunicación por autoinductores: solo emite toxinas cuando se agrupan 3 o más células aliadas.',
            inspectorLabel: 'Quorum Sensing',
          },
          siderophores: {
            editorTitle: 'Sideróforos (Quelación)',
            editorDesc:
              'Secreta moléculas quelantes que atraen hacia la célula los nutrientes cercanos.',
            inspectorLabel: 'Sideróforos',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Sin Mutación Extra',
            editorDesc: 'Morfología estándar sin órganos adicionales ni penalizaciones metabólicas.',
            inspectorLabel: 'Ninguna',
            proTag: '+0 ATP/s extra',
          },
          claws: {
            editorTitle: 'Pinzas Quitinosas (Quelada)',
            editorDesc: 'Apéndices prensores frontales que inmovilizan a la presa durante la caza.',
            inspectorLabel: 'Pinzas Quitinosas',
            proTag: '+45% daño y frena presas',
            conTag: 'Pesadas: -20% velocidad y +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Citostoma Gigante (Voraz)',
            editorDesc: 'Abertura oral ampliada para fagocitar nutrientes y presas a mayor distancia.',
            inspectorLabel: 'Citostoma (Gran Boca)',
            proTag: '+25% energía al comer',
            conTag: '-25% armadura y +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Espinas Calcáreas (Equinada)',
            editorDesc: 'Espículas minerales perimetrales que dañan por contacto a los depredadores.',
            inspectorLabel: 'Espinas Calcáreas',
            proTag: 'Devuelve 40% del daño',
            conTag: 'Fricción (+35% coste nado)',
          },
          bioluminescence: {
            editorTitle: 'Bioluminiscencia (Luciferasa)',
            editorDesc: 'Emisión fotónica propia que activa fotosíntesis y reduce ataques de cazadores.',
            inspectorLabel: 'Bioluminiscencia',
            proTag: 'Luz propia y -28% mordiscos',
            conTag: 'Coste +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Poro Suctor (Trompa Ventosa)',
            editorDesc: 'Órgano de succión hidrodinámica que aspira partículas nutritivas cercanas.',
            inspectorLabel: 'Poro Suctor',
            proTag: 'Aspira nutrientes a distancia',
            conTag: '+15% umbral de división',
          },
        },
      },
    },
    '15+': {
      ageBadgeTooltip: 'Terminología microbiológica y biofísica avanzada (15+ años)',
      editorSubtitle:
        'Diseña la cadena de ADN inicial de tu cepa antes de inocular la placa de cultivo',
      section1Heading: '1. Selección de las Categorías Biológicas y Loci Genómicos',
      paretoTitle: 'Principio de Pareto y Ley de Kleiber:',
      paretoBody:
        'Una bacteria muy rápida, grande y armada sufrirá un drenaje metabólico de ATP altísimo y colapsará por inanición cuando el sustrato escasee.',
      substrateLabel: 'Sustrato',
      bioBalance: {
        title: 'Balance de Energía (ATP)',
        costBasal: 'Metabolismo Basal (Cuerpo + Pared + Mutación):',
        costSwim: 'Gasto al Nadar a Velocidad Crucero:',
        costToxin: 'Fábrica de Veneno / Imanes Químicos:',
        costTotal: 'Consumo Total Estimado:',
        efficiencyHigh: 'Alta Eficiencia',
        efficiencyModerate: 'Gasto Moderado',
        efficiencyDanger: 'Riesgo Inanición',
      },
      categories: {
        metabolism: {
          title: 'A. Metabolismo, Nutrición y Tamaño (Morfología Base)',
          locusHint: 'Locus Trófico',
        },
        motility: {
          title: 'B. Locomoción, Apéndices Cinéticos y Velocidad',
          locusHint: 'Locus Cinético',
        },
        wall: {
          title: 'C. Estructura de Pared Celular y Armadura',
          locusHint: 'Locus Estructural',
        },
        reproduction: {
          title: 'D. Estrategia Reproductiva y Quimiotaxis',
          locusHint: 'Locus Reproductivo',
        },
        interaction: {
          title: 'E. Interacción Ecológica y Guerra Química',
          locusHint: 'Locus Químico',
        },
        adaptation: {
          title: 'F. Adaptaciones Fenotípicas Especiales (Trade-offs Evolutivos)',
        },
      },
      params: {
        strainNameLabel: 'Cepa:',
        strainNamePlaceholder: 'Nombre de la cepa',
        initialPop: 'Inóculo Inicial por Cepa',
        rivals: 'Poblaciones Competidoras Aleatorias',
        size: 'Radio Celular (Radio medio: más reserva y coste basal)',
        speed: 'Potencia Locomotora (Codón V · Velocidad efectiva)',
        armor: 'Armadura de Membrana (Codón A · Reducción de lisis)',
        perception: 'Quimiotaxis (P · mantenimiento de receptores)',
        toxin: 'Potencia de Bacteriocina (Codón T · Lisis química)',
        hue: 'Cromóforo Genético (Codón H · Longitud de onda)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Fotosintética (Coco)',
            editorDesc: 'Fototrofía oxigénica pasiva proporcional al flujo lumínico. Soma esférico.',
            inspectorLabel: 'Fotosintética',
          },
          saprophyte: {
            editorTitle: 'Saprófita (Bacilo)',
            editorDesc: 'Quimioorganotrofa descomponedora: +55% de rendimiento en detritus orgánico.',
            inspectorLabel: 'Saprófita',
          },
          predator: {
            editorTitle: 'Predadora (Espirilo)',
            editorDesc: 'Fagocitosis activa de biomasa heteróloga viva mediante contacto directo.',
            inspectorLabel: 'Predadora',
          },
          fermenter: {
            editorTitle: 'Fermentadora (Diplococo)',
            editorDesc: 'Fosforilación a nivel de sustrato optimizada (+45% rendimiento energético).',
            inspectorLabel: 'Fermentadora',
          },
          chemolithotroph: {
            editorTitle: 'Quimiolitótrofa (Arquea)',
            editorDesc: 'Oxidación inorgánica basal autónoma y +20% de resistencia a bacteriocinas.',
            inspectorLabel: 'Quimiolitótrofa',
          },
          chemoheterotroph: {
            editorTitle: 'Quimioheterótrofa',
            editorDesc: 'Obtiene energía de compuestos orgánicos a rendimiento basal, sin bonificación especial.',
            inspectorLabel: 'Quimioheterótrofa',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Sésil (Biofilm)',
            editorDesc: 'Adhesión estática sin gasto cinético (0 ATP/s) y +15% resistencia mecánica.',
            inspectorLabel: 'Sésil',
          },
          nonmotile: {
            editorTitle: 'No móvil',
            editorDesc: 'No nada activamente, pero no queda anclada ni recibe la defensa del biofilm.',
            inspectorLabel: 'No móvil',
          },
          flagellated: {
            editorTitle: '〰️ Flagelada (Monotrica)',
            editorDesc: 'Propulsión rotatoria de alta velocidad (<strong>x1.35</strong>) con mayor arrastre hidrodinámico.',
            inspectorLabel: 'Flagelada',
          },
          ciliated: {
            editorTitle: 'Ciliada (Holotrica)',
            editorDesc: 'Batido ciliar de bajo coste energético y alta maniobrabilidad (<strong>x0.80 vel.</strong>).',
            inspectorLabel: 'Ciliada',
          },
          spirochete: {
            editorTitle: 'Espiroqueta (Endoflagelar)',
            editorDesc: 'Torsión helicoidal por filamento axial (<strong>x1.10 vel.</strong>) y 25% evasión de predación.',
            inspectorLabel: 'Espiroqueta',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Gram-Negativa',
            editorDesc: 'Doble membrana lipopolisacárida ligera que atenúa un 28% la difusión de toxinas.',
            inspectorLabel: 'Gram-Negativa',
          },
          gram_positive: {
            editorTitle: 'Gram-Positiva',
            editorDesc: 'Pared gruesa de peptidoglicano de alta integridad estructural (+32% coste basal).',
            inspectorLabel: 'Gram-Positiva',
          },
          capsule: {
            editorTitle: 'Cápsula Mucosa',
            editorDesc: 'Glicocálix externo anti-fagocítico que mitiga un 50% el daño físico y químico.',
            inspectorLabel: 'Cápsula Mucosa',
          },
          s_layer: {
            editorTitle: 'Capa S Cristalina',
            editorDesc: 'Envoltura paracristalina que refleja el 20% del daño y reduce un 25% el coste de armadura.',
            inspectorLabel: 'Capa S',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Fisión Binaria',
            editorDesc: 'Citocinesis simétrica clásica con reparto equitativo de reservas (50% / 50%).',
            inspectorLabel: 'Fisión Binaria',
          },
          budding: {
            editorTitle: 'Gemación',
            editorDesc: 'División asimétrica donde la célula progenitora retiene el 65% del ATP.',
            inspectorLabel: 'Gemación',
          },
          sporulation: {
            editorTitle: 'Esporulación',
            editorDesc: 'Diferenciación en endospora criptobiótica altamente resistente ante inanición.',
            inspectorLabel: 'Esporulación',
          },
          conjugation: {
            editorTitle: 'Conjugación (Pili)',
            editorDesc: 'Sinergia metabólica mediante pili conectores con células congéneres (+0.35 ATP/s).',
            inspectorLabel: 'Conjugación',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Neutral / Simbiótica',
            editorDesc: 'Ausencia de síntesis de metabolitos secundarios tóxicos (0 ATP/s en toxinas).',
            inspectorLabel: 'Neutral',
          },
          bacteriocins: {
            editorTitle: 'Bacteriocinas',
            editorDesc: 'Secreción constitutiva de péptidos citolíticos contra cepas competidoras.',
            inspectorLabel: 'Bacteriocinas',
          },
          quorum_sensing: {
            editorTitle: 'Quorum Sensing',
            editorDesc: 'Expresión génica dependiente de densidad: libera toxinas con ≥3 congéneres cercanos.',
            inspectorLabel: 'Quorum Sensing',
          },
          siderophores: {
            editorTitle: 'Sideróforos',
            editorDesc: 'Secreción de quelantes de alta afinidad que atraen nutrientes hacia el soma.',
            inspectorLabel: 'Sideróforos',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Fenotipo Basal',
            editorDesc: 'Arquitectura celular estándar sin estructuras accesorias ni sobrecoste.',
            inspectorLabel: 'Ninguna',
            proTag: '+0 ATP/s basal',
          },
          claws: {
            editorTitle: 'Quelada (Pinzas Quitinosas)',
            editorDesc: 'Apéndices de fijación que incrementan la lisis predadora e inmovilizan presas.',
            inspectorLabel: 'Quelada',
            proTag: '+45% daño y frena presas',
            conTag: '-20% velocidad y +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Voraz (Citostoma Gigante)',
            editorDesc: 'Aparato citostómico hipertrófico de mayor radio de ingestión y asimilación.',
            inspectorLabel: 'Voraz',
            proTag: '+25% asimilación trófica',
            conTag: '-25% armadura y +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Equinada (Espículas Calcáreas)',
            editorDesc: 'Proyecciones minerales que reflejan daño mecánico al atacante por contacto.',
            inspectorLabel: 'Equinada',
            proTag: 'Refleja 40% del daño',
            conTag: '+35% arrastre hidrodinámico',
          },
          bioluminescence: {
            editorTitle: 'Bioluminiscente (Luciferasa)',
            editorDesc: 'Quimioluminiscencia endógena que aporta fotones propios y disuade predadores.',
            inspectorLabel: 'Bioluminiscente',
            proTag: 'Auto-iluminación y -28% predación',
            conTag: '+0.36 ATP/s basal',
          },
          suction_pore: {
            editorTitle: 'Haustor (Poro Suctor)',
            editorDesc: 'Gradiente de presión negativa que aspira partículas de sustrato a distancia.',
            inspectorLabel: 'Poro Suctor',
            proTag: 'Succión de sustrato',
            conTag: '+15% umbral de fisión',
          },
        },
      },
    },
  },
};

const EN_BUNDLE: LocaleBundle = {
  code: 'en',
  label: 'EN',
  documentTitle: 'EvoLootIon — Microbial Artificial Life Simulator',
  ui: {
    langLabel: 'Language',
    ageLabel: 'Scientist age',
    ageUnit: 'yrs',
    categoryTabs: {
      metabolism: 'Metabolism',
      motility: 'Locomotion',
      wall: 'Cell Wall',
      reproduction: 'Reproduction',
      interaction: 'Interaction',
      adaptation: 'Adaptation',
      prev: '← Previous',
      next: 'Next →',
      stepOf: 'Category {current} of {total}',
    },
    editorModalAria: 'Genomic and Phenotypic Editor',
    editorTitle: 'Genomic & Phenotypic Editor',
    instructionsLink: 'Instructions',
    btnReturnToCulture: 'Back to Culture ×',
    microscopeTitle: 'Electron Microscope',
    dnaSequenceBadge: 'DNA Sequence',
    genePrefix: 'Gene',
    codingStrandTitle: 'Coding Strand (DNA)',
    editDnaBtn: 'Edit',
    editDnaDoneBtn: 'Done',
    editDnaTitle: 'Type or paste the DNA coding strand directly',
    editDnaPlaceholder: 'ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG',
    editDnaValid: 'DNA applied: {taxonomy} ({strand})',
    copyDnaBtn: 'Copy',
    copyDnaCopied: 'Copied!',
    copyDnaTitle: 'Copy coding strand to clipboard',
    bioBalanceTitle: 'Energy Balance (ATP)',
    efficiencyHigh: 'High Efficiency',
    efficiencyModerate: 'Moderate Drain',
    efficiencyDanger: 'Starvation Risk',
    costBasal: 'Basal Metabolism (Body + Wall + Mutation):',
    costSwim: 'Cruise Swimming Drain:',
    costToxin: 'Venom Factory / Chemical Magnets:',
    costTotal: 'Estimated Total Drain:',
    cultureConditionsTitle: 'Culture Dish Conditions',
    quorumTag: 'Team',
    magnetTag: 'Magnet',
    btnDeploy: 'Inoculate Petri Dish & Start!',
    defaultPlayerStrainName: 'Super Bacillus',
    specimenSingular: 'cell',
    specimenPlural: 'cells',
    rivalSingular: 'strain',
    rivalPlural: 'strains',
    famousSpeciesTitle: 'Famous bacteria to add',
    hostAgents: {
      title: 'Viruses & immune defenses to add',
      phageLabel: 'Bacteriophage T4 (Lytic virus)',
      neutrophilLabel: 'PMN Neutrophil (White blood cell)',
    },
    customRivalDna: {
      title: 'Add rival strains by DNA coding strand',
      hint: "Paste a 5' → 3' coding strand (14 codons ATG-...-TAG) to verify its genome and include it in the dish.",
      dnaPlaceholder: 'ATG-SAP-S9-FLA-V30-GRP-A40-BIN-P11-BAC-T20-NON-H155-TAG',
      namePlaceholder: 'Optional name (e.g. Strain Omega)',
      btnRandomDna: '🎲 Random DNA',
      btnRandomDnaTitle: 'Generate a random valid DNA coding strand to edit or add',
      btnVerifyAdd: '+ Verify & Add Strain',
      validPreview: 'Valid DNA: {taxonomy} ({strand})',
      addedSuccess: 'Strain added to culture: {name} ({taxonomy})',
      removeTitle: 'Remove this custom strain',
      errors: {
        empty: 'Enter a DNA coding strand to verify it.',
        token_count: 'Invalid format ({token} codons): expected {expected} hyphen-separated codons.',
        start_codon: 'Invalid start codon "{token}": must start with {expected}.',
        metabolism_codon: 'Invalid metabolism codon "{token}". Valid values: {expected}.',
        size_codon: 'Invalid size codon "{token}". Expected format: {expected}.',
        motility_codon: 'Invalid motility codon "{token}". Valid values: {expected}.',
        speed_codon: 'Invalid speed codon "{token}". Expected format: {expected}.',
        wall_codon: 'Invalid cell wall codon "{token}". Valid values: {expected}.',
        armor_codon: 'Invalid armor codon "{token}". Expected format: {expected}.',
        reproduction_codon: 'Invalid reproduction codon "{token}". Valid values: {expected}.',
        perception_codon: 'Invalid sensory codon "{token}". Expected format: {expected}.',
        interaction_codon: 'Invalid interaction codon "{token}". Valid values: {expected}.',
        toxin_codon: 'Invalid toxin codon "{token}". Expected format: {expected}.',
        adaptation_codon: 'Invalid adaptation codon "{token}". Valid values: {expected}.',
        chromophore_codon: 'Invalid chromophore codon "{token}". Expected format: {expected}.',
        stop_codon: 'Invalid stop codon "{token}": must end with {expected}.',
      },
    },
    sessileZero: '0 (Non-Motile / Sessile)',
    nonmotileZero: '0 (Non-motile)',
    neutralZero: '0 (Peaceful / Neutral)',
    siderophoresActive: 'Active Magnet (Siderophores)',
    speedRealUnit: 'eff.',
    flagellaTag: 'Flagellum x1.35',
    spirocheteTag: 'Spiral x1.10',
    ciliaTag: 'Cilia x0.80',
    clawsPenaltyTag: ' · Claws -20%',
    giantMawArmorNote: '(-25% Giant Maw)',
    divisionAtLabel: 'Split at',
    shapes: {
      coccus: 'Coccus',
      spirillum: 'Spirillum',
      diplococcus: 'Diplococcus',
      bacillus: 'Bacillus',
      archaea: 'Hexagonal Archaea',
    },
    codons: {
      start: 'Start Codon (Methionine)',
      metabolism: 'Metabolism Type',
      size: 'Cell Size (Radius)',
      motility: 'Locomotion Appendage',
      speed: 'Effective Swimming Speed',
      wall: 'Cell Wall Structure',
      armor: 'Membrane Armor',
      reproduction: 'Reproductive Strategy',
      perception: 'Sensory Range (greater range costs more upkeep)',
      interaction: 'Ecological / Chemical Interaction',
      toxin: 'Chemical Potency',
      adaptation: 'Unique Special Adaptation',
      chromophore: 'Genetic Pigment (Hue)',
      stop: 'Stop Codon (Amber)',
    },
    sidebar: {
      brandSubtitle: 'Microbial Evolution Simulator',
      versionBadge: 'v2.1 Genome',
      founderStrainCard: 'Inoculated Founder Strain',
      btnOpenEditor: 'Open Genome Editor / Re-inoculate',
      populationDynamicsCard: 'Population Dynamics',
      sporesShort: 'spores',
    },
    hud: {
      btnEditorDna: 'DNA Editor',
      btnPause: 'Pause',
      btnResume: 'Resume',
      btnSpeedTitle: 'Cycle simulation speed (1x / 2x / 4x / 0.5x)',
      lightLabel: 'Light',
      btnFeed: 'Add substrate',
      btnRemoveSubstrate: 'Remove substrate',
      btnDecreaseLightRadius: 'Decrease light radius',
      btnIncreaseLightRadius: 'Increase light radius',
      phagesLabel: 'Phages',
      btnSpawnPhages: 'Inoculate T4 bacteriophage wave',
      btnRemovePhages: 'Remove bacteriophages from dish',
      neutrophilsLabel: 'Neutrophils',
      btnSpawnNeutrophils: 'Deploy neutrophil white blood cell',
      btnRemoveNeutrophils: 'Remove neutrophils from dish',
      btnResetCam: 'Center View',
      btnDetailAuto: 'Detail: Auto',
      btnDetailLow: 'Detail: Low',
      btnDetailHigh: 'Detail: High',
      btnDetailTitle: 'Switch between automatic, low and high detail',
      kpiBacteria: 'Bacteria:',
      kpiSpores: 'Spores:',
      kpiNutrients: 'Nutrients:',
      kpiPhages: 'Phages:',
      kpiNeutrophils: 'Neutrophils:',
      kpiMaxGen: 'Max Gen:',
      kpiFps: 'FPS:',
    },
    inspector: {
      defaultOrganism: 'Organism #1',
      stateVegetative: 'Vegetative',
      stateSpore: 'Endospore',
      stateToxinActive: 'Active Toxin',
      statePredating: 'Engulfing Prey',
      stateUnderAttack: 'In Combat / Defending',
      stateInfectedPhage: 'Infected (T4 Phage)',
      stateFightingPhage: 'CRISPR Defense vs Phage',
      statePhageCured: 'Phage Neutralized (CRISPR)!',
      stateDying: 'Dying (Lysis)',
      stateDividing: 'Dividing',
      gen: 'Gen',
      energy: 'Energy',
      metabolism: 'Metabolism',
      motility: 'Motility',
      wall: 'Cell Wall',
      reproduction: 'Reprod.',
      interaction: 'Interaction',
      armor: 'Armor',
      basal: 'Basal',
      speed: 'Speed',
    },
  },
  byAge: {
    '5-7': {
      ageBadgeTooltip: 'Fun, simple explanations for young explorers aged 5 to 7',
      editorSubtitle:
        'Create your own tiny microbe friend, pick its superpowers, and watch it live in the dish!',
      section1Heading: '1. Pick Your Microbe’s Superpowers (With real scientific names)',
      paretoTitle: 'Tummy Rule (Pareto Principle):',
      paretoBody:
        'If you make a giant, super-fast microbe with lots of weapons, it will get super hungry all the time and run out of energy if food is scarce!',
      substrateLabel: 'Food',
      bioBalance: {
        title: 'Energy & Appetite',
        costBasal: 'Body & shield:',
        costSwim: 'Swimming energy:',
        costToxin: 'Poison / Magnets:',
        costTotal: 'Total hunger:',
        efficiencyHigh: 'Eats a little',
        efficiencyModerate: 'Normal hunger',
        efficiencyDanger: 'Super hungry!',
      },
      categories: {
        metabolism: {
          title: 'A. How does it eat & what shape is it? (Metabolism)',
          locusHint: 'Body Shape',
        },
        motility: {
          title: 'B. How does it swim in water? (Locomotion)',
          locusHint: 'Tails & Oars',
        },
        wall: {
          title: 'C. What protective suit does it wear? (Cell Wall)',
          locusHint: 'Protective Shield',
        },
        reproduction: {
          title: 'D. How does it have babies & smell food? (Reproduction)',
          locusHint: 'Family & Smell',
        },
        interaction: {
          title: 'E. How does it defend against others? (Interaction)',
          locusHint: 'Chemical Powers',
        },
        adaptation: {
          title: 'F. Special Super Costumes! (Bonus power with a trade-off)',
        },
      },
      params: {
        strainNameLabel: 'Name:',
        strainNamePlaceholder: 'Name your microbe',
        initialPop: 'Microbes per Family (Cells)',
        rivals: 'Random rival populations',
        size: 'Body Size (Average: bigger = more reserves and hunger)',
        speed: 'Swim Power (Effective Speed)',
        armor: 'Shield Toughness (Wall Armor)',
        perception: 'Super nose (greater range costs more energy)',
        toxin: 'Poison Strength (Bacteriocin Potency)',
        hue: 'Microbe Color (Pigment / Chromophore)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Sun-Eater (Photosynthetic · Coccus)',
            editorDesc:
              'Eats sunbeams like a tiny plant without needing food crumbs! Round ball shape (Coccus, Photosynthetic).',
            inspectorLabel: 'Sun-Eater (Photosynthetic)',
          },
          saprophyte: {
            editorTitle: 'Clean-Up Crew (Saprophyte · Bacillus)',
            editorDesc:
              'Recycles floating crumbs and leftovers (+55% bonus from leftovers). Rod shape (Bacillus, Saprophyte).',
            inspectorLabel: 'Clean-Up (Saprophyte)',
          },
          predator: {
            editorTitle: 'Little Hunter (Predator · Spirillum)',
            editorDesc:
              'Chases and nibbles microbes of other colors. Sleek, fast shape (Spirillum, Predator).',
            inspectorLabel: 'Hunter (Predator)',
          },
          fermenter: {
            editorTitle: 'Super Tummy (Fermenter · Diplococcus)',
            editorDesc:
              'Gets +45% extra energy from every single bite of food. Twin-ball shape (Diplococcus, Fermenter).',
            inspectorLabel: 'Super Tummy (Fermenter)',
          },
          chemolithotroph: {
            editorTitle: 'Rock-Eater (Chemolithotroph · Archaea)',
            editorDesc:
              'Eats invisible minerals in the water without needing sunlight and resists 20% of poison (Chemolithotroph).',
            inspectorLabel: 'Rock-Eater (Chemolithotroph)',
          },
          chemoheterotroph: {
            editorTitle: 'Organic Feeder (Chemoheterotroph)',
            editorDesc:
              'Gets energy from organic nutrients without specializing in fermentation or recycling remains.',
            inspectorLabel: 'Organic Feeder (Chemoheterotroph)',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Stay-Put (Sessile)',
            editorDesc:
              'Stays in one spot (0 energy cost) and its sticky glue blocks +15% of bites (Sessile).',
            inspectorLabel: 'Stay-Put (Sessile)',
          },
          nonmotile: {
            editorTitle: 'Non-motile',
            editorDesc: 'Does not actively swim, but is not anchored like a sessile bacterium.',
            inspectorLabel: 'Non-motile',
          },
          flagellated: {
            editorTitle: '〰️ Turbo Tail (Flagellated)',
            editorDesc:
              'Spins a long tail like a speedboat motor (+35% faster), but makes it hungrier (Flagellated).',
            inspectorLabel: 'Turbo Tail (Flagellated)',
          },
          ciliated: {
            editorTitle: 'Rowing Hairs (Ciliated)',
            editorDesc:
              'Rows with lots of tiny hairs to turn super easily and save energy, but swims slower (-20%, Ciliated).',
            inspectorLabel: 'Rowing Hairs (Ciliated)',
          },
          spirochete: {
            editorTitle: 'Corkscrew Twister (Spirochete)',
            editorDesc:
              'Twists like a screw (+10% speed) and wiggles away from 25% of bites (Spirochete).',
            inspectorLabel: 'Corkscrew (Spirochete)',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Light Jacket (Gram-Negative)',
            editorDesc:
              'Thin double skin that weighs nothing and blocks 28% of poison clouds (Gram-Negative).',
            inspectorLabel: 'Light Jacket (Gram−)',
          },
          gram_positive: {
            editorTitle: 'Strong Shield (Gram-Positive)',
            editorDesc:
              'Thick, tough coat that protects against bumps and bites, though a bit heavier (Gram-Positive).',
            inspectorLabel: 'Strong Shield (Gram+)',
          },
          capsule: {
            editorTitle: 'Slimy Bubble (Mucous Capsule)',
            editorDesc:
              'Slippery jelly bubble that cuts damage from bites and poison in half (-50%, Mucous Capsule).',
            inspectorLabel: 'Slimy Bubble (Capsule)',
          },
          s_layer: {
            editorTitle: 'Crystal Armor (S-Layer)',
            editorDesc:
              'Shiny diamond-like suit that bounces off 20% of bites and feels lighter (Crystalline S-Layer).',
            inspectorLabel: 'Crystal (S-Layer)',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Identical Twins (Binary Fission)',
            editorDesc:
              'When it eats enough, it splits down the middle into two equal twin sisters (50% / 50%, Binary Fission).',
            inspectorLabel: 'Twins (Binary Fission)',
          },
          budding: {
            editorTitle: 'Little Sprout (Budding)',
            editorDesc:
              'Grows a tiny baby bud on its side while mom keeps most of her strength (65% energy, Budding).',
            inspectorLabel: 'Sprout (Budding)',
          },
          sporulation: {
            editorTitle: 'Stone Seed (Sporulation)',
            editorDesc:
              'When food runs out, sleeps inside an unbreakable stone seed until food comes back (Sporulation).',
            inspectorLabel: 'Stone Seed (Sporulation)',
          },
          conjugation: {
            editorTitle: 'Energy Hug (Conjugation · Pili)',
            editorDesc:
              'Holds hands with nearby sisters using tiny antennas to share bonus energy (+0.35 ATP/s, Conjugation).',
            inspectorLabel: 'Energy Hug (Conjugation)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Friendly Neighbor (Peaceful / Neutral)',
            editorDesc:
              'Never sprays poison and saves all its strength to grow and make more babies (Neutral).',
            inspectorLabel: 'Friendly (Neutral)',
          },
          bacteriocins: {
            editorTitle: 'Poison Spray (Bacteriocins)',
            editorDesc:
              'Constantly puffs a cloud of poison around itself to keep rival microbes away (Bacteriocins).',
            inspectorLabel: 'Poison Spray (Bacteriocins)',
          },
          quorum_sensing: {
            editorTitle: 'Team Defense (Quorum Sensing)',
            editorDesc:
              'Only sprays poison when 3 or more friends from its family are together (Quorum Sensing).',
            inspectorLabel: 'Teamwork (Quorum)',
          },
          siderophores: {
            editorTitle: 'Food Magnet (Siderophores)',
            editorDesc:
              'Sends out invisible magnets that pull nearby food crumbs toward its mouth (Siderophores).',
            inspectorLabel: 'Food Magnet (Siderophores)',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Normal Body (No Extra Mutation)',
            editorDesc: 'Simple, lightweight body with no extra energy drain or penalties.',
            inspectorLabel: 'Normal',
            proTag: 'No extra energy drain',
          },
          claws: {
            editorTitle: 'Crab Claws (Chitinous Claws)',
            editorDesc: 'Front pincers that grab onto prey so they cannot swim away.',
            inspectorLabel: 'Claws (Chelate)',
            proTag: '+45% bite damage & slows prey',
            conTag: 'Heavy: -20% speed & +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Big Mouth (Cytostome)',
            editorDesc: 'A giant mouth with little fangs to swallow food from farther away.',
            inspectorLabel: 'Big Mouth (Cytostome)',
            proTag: '+25% energy from food',
            conTag: 'Softer shield (-25%) & +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Hedgehog Spikes (Calcareous Spikes)',
            editorDesc: 'A crown of pointy spikes that pokes anyone who tries to bite it.',
            inspectorLabel: 'Spikes (Echinate)',
            proTag: 'Reflects 40% of bite damage',
            conTag: 'Water drag (+35% swim cost)',
          },
          bioluminescence: {
            editorTitle: 'Magic Lantern (Bioluminescence)',
            editorDesc: 'Glows in the dark! Makes its own light and dazzles hunters.',
            inspectorLabel: 'Lantern (Bioluminescent)',
            proTag: 'Own light & -28% bites taken',
            conTag: 'Glowing costs +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Vacuum Trunk (Suction Pore)',
            editorDesc: 'A stretchy little trunk that sucks in nearby food crumbs like a vacuum.',
            inspectorLabel: 'Vacuum (Suction Pore)',
            proTag: 'Pulls food from afar',
            conTag: '+15% energy needed for babies',
          },
        },
      },
    },
    '8-10': {
      ageBadgeTooltip: 'Clear explanations with guided scientific vocabulary for ages 8 to 10',
      editorSubtitle:
        'Combine your bacterium’s genes, learn how each organ works, and test it in the culture dish',
      section1Heading: '1. Configure the Genes & Organs of Your Bacterium',
      paretoTitle: 'Nature’s Balance (Pareto Rule):',
      paretoBody:
        'Every ability costs energy (ATP). If you build a huge, super-fast, heavily armed bacterium, it will burn so much energy per second that it will starve when food runs low.',
      substrateLabel: 'Food',
      bioBalance: {
        title: 'Energy Balance',
        costBasal: 'Body upkeep:',
        costSwim: 'Swimming drain:',
        costToxin: 'Chemical / Magnet:',
        costTotal: 'Total drain:',
        efficiencyHigh: 'Low drain',
        efficiencyModerate: 'Medium drain',
        efficiencyDanger: 'High drain!',
      },
      categories: {
        metabolism: {
          title: 'A. How does it get energy & what shape is it? (Metabolism)',
          locusHint: 'Cell Shape',
        },
        motility: {
          title: 'B. How does it move through water? (Locomotion & Speed)',
          locusHint: 'Propulsion',
        },
        wall: {
          title: 'C. What shield protects its body? (Cell Wall & Armor)',
          locusHint: 'Defense',
        },
        reproduction: {
          title: 'D. How does it multiply & sense food? (Reproduction)',
          locusHint: 'Survival',
        },
        interaction: {
          title: 'E. Does it use chemical defenses or magnets? (Interaction)',
          locusHint: 'Chemistry',
        },
        adaptation: {
          title: 'F. Special Super Mutations! (Extra organ with bonus and cost)',
        },
      },
      params: {
        strainNameLabel: 'Name:',
        strainNamePlaceholder: 'Your bacterium name',
        initialPop: 'Cells per Colony',
        rivals: 'Random rival colonies',
        size: 'Body Size (Average size: more reserves and drain)',
        speed: 'Motor Power (Effective Real Speed)',
        armor: 'Armor Toughness (Reduces incoming damage)',
        perception: 'Chemical sensing (greater range costs more upkeep)',
        toxin: 'Chemical Toxin Power (Bacteriocin)',
        hue: 'Color / Pigment of Your Bacterium (Chromophore)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Solar Producer (Photosynthetic · Coccus)',
            editorDesc:
              'Turns sunlight into energy like plants. Round body shape (Coccus, Photosynthetic).',
            inspectorLabel: 'Solar (Photosynthetic)',
          },
          saprophyte: {
            editorTitle: 'Recycler (Saprophyte · Bacillus)',
            editorDesc:
              'Eats free nutrients and gets +55% bonus energy from organic remains. Rod shape (Bacillus, Saprophyte).',
            inspectorLabel: 'Recycler (Saprophyte)',
          },
          predator: {
            editorTitle: 'Active Hunter (Predator · Spirillum)',
            editorDesc:
              'Chases and bites live bacteria from other tribes. Streamlined shape (Spirillum, Predator).',
            inspectorLabel: 'Hunter (Predator)',
          },
          fermenter: {
            editorTitle: 'Super Digester (Fermenter · Diplococcus)',
            editorDesc:
              'Extracts +45% more energy from every bite of food. Double cell (Diplococcus, Fermenter).',
            inspectorLabel: 'Super Digester (Fermenter)',
          },
          chemolithotroph: {
            editorTitle: 'Mineral Feeder (Chemolithotroph · Archaea)',
            editorDesc:
              'Feeds on rock minerals without needing sunlight and resists 20% of poison (Chemolithotroph).',
            inspectorLabel: 'Mineral Feeder (Chemolithotroph)',
          },
          chemoheterotroph: {
            editorTitle: 'Organic Feeder (Chemoheterotroph)',
            editorDesc:
              'Gets energy from organic matter at the baseline rate, without fermentation or detritus bonuses.',
            inspectorLabel: 'Chemoheterotroph',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Anchored (Sessile)',
            editorDesc:
              'Stays still (0 ATP/s swim cost) and its biofilm resists +15% of bites (Sessile).',
            inspectorLabel: 'Anchored (Sessile)',
          },
          nonmotile: {
            editorTitle: 'Non-motile',
            editorDesc: 'Does not swim actively, but is neither anchored nor protected by a biofilm.',
            inspectorLabel: 'Non-motile',
          },
          flagellated: {
            editorTitle: '〰️ Motorized Tail (Flagellated)',
            editorDesc:
              'Spinning whip tail: reaches <strong>+35% higher top speed</strong>, but uses more ATP.',
            inspectorLabel: 'Motor Tail (Flagellated)',
          },
          ciliated: {
            editorTitle: 'Agile Oars (Ciliated)',
            editorDesc:
              'Tiny hairs that save energy and turn smoothly, with <strong>lower top speed (-20%)</strong>.',
            inspectorLabel: 'Agile Oars (Ciliated)',
          },
          spirochete: {
            editorTitle: 'Corkscrew Spin (Spirochete)',
            editorDesc:
              'Moves by spinning in a spiral (<strong>+10% speed</strong>) and dodges 25% of bites.',
            inspectorLabel: 'Corkscrew (Spirochete)',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Light Double Skin (Gram-Negative)',
            editorDesc:
              'Lightweight double skin that adds no weight and filters out 28% of toxins.',
            inspectorLabel: 'Light Skin (Gram−)',
          },
          gram_positive: {
            editorTitle: 'Reinforced Wall (Gram-Positive)',
            editorDesc:
              'Thick, sturdy cell wall (+Armor), though maintaining it costs a bit more energy.',
            inspectorLabel: 'Thick Wall (Gram+)',
          },
          capsule: {
            editorTitle: 'Jelly Shield (Mucous Capsule)',
            editorDesc:
              'Slippery bubble that cuts damage from bites and toxins in half (-50%).',
            inspectorLabel: 'Jelly Shield (Capsule)',
          },
          s_layer: {
            editorTitle: 'Crystal Mesh (S-Layer)',
            editorDesc:
              'Shiny geometric mesh that deflects 20% of bites and makes armor cheaper to maintain.',
            inspectorLabel: 'Crystal Mesh (S-Layer)',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Split in Two (Binary Fission)',
            editorDesc:
              'Stretches and splits down the middle into two twin cells (50% / 50% energy).',
            inspectorLabel: '50/50 Split (Fission)',
          },
          budding: {
            editorTitle: 'Side Sprout (Budding)',
            editorDesc:
              'Grows a small bud while the mother cell keeps 65% of the energy.',
            inspectorLabel: 'Sprout (Budding)',
          },
          sporulation: {
            editorTitle: 'Stone Pod (Sporulation)',
            editorDesc:
              'When starving, turns into a nearly immortal stone endospore until food returns.',
            inspectorLabel: 'Endospore (Sporulation)',
          },
          conjugation: {
            editorTitle: 'Team Antenna (Conjugation · Pili)',
            editorDesc:
              'Connects bridges (pili) with nearby sisters to generate bonus energy (+0.35 ATP/s).',
            inspectorLabel: 'Pili Antenna (Conjugation)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Peaceful (Neutral / Symbiotic)',
            editorDesc:
              'Spends zero energy on poison and saves all its ATP to grow and divide!',
            inspectorLabel: 'Peaceful (Neutral)',
          },
          bacteriocins: {
            editorTitle: 'Toxin Cloud (Bacteriocins)',
            editorDesc:
              'Emits a continuous halo of poison (bacteriocins) that weakens enemy bacteria.',
            inspectorLabel: 'Toxins (Bacteriocins)',
          },
          quorum_sensing: {
            editorTitle: 'Team Attack (Quorum Sensing)',
            editorDesc:
              'Only activates poison when a group of 3 or more allies gather together.',
            inspectorLabel: 'Teamwork (Quorum)',
          },
          siderophores: {
            editorTitle: 'Nutrient Magnet (Siderophores)',
            editorDesc:
              'Releases magnetic molecules that pull nearby food particles toward itself.',
            inspectorLabel: 'Magnet (Siderophores)',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'No Extra Mutation',
            editorDesc: 'Classic lightweight body with no extra costs or penalties.',
            inspectorLabel: 'No mutation',
            proTag: '+0 extra ATP/s',
          },
          claws: {
            editorTitle: 'Capture Claws (Chitinous Claws)',
            editorDesc: 'Front pincers that grab prey so they cannot escape.',
            inspectorLabel: 'Claws (Chelate)',
            proTag: '+45% damage & slows prey',
            conTag: 'Heavy: -20% speed & +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Giant Mouth (Cytostome)',
            editorDesc: 'Giant mouth to swallow nutrients and prey from farther away.',
            inspectorLabel: 'Giant Mouth (Cytostome)',
            proTag: '+25% energy when eating',
            conTag: 'Weak spot: -25% armor & +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Defensive Spikes (Calcareous Spikes)',
            editorDesc: 'Crown of thorns that pokes anyone who gets close or bites it.',
            inspectorLabel: 'Spikes (Echinate)',
            proTag: 'Reflects 40% of damage',
            conTag: 'Water drag (+35% swim cost)',
          },
          bioluminescence: {
            editorTitle: 'Inner Glow (Bioluminescence)',
            editorDesc: 'Glows in the dark: makes its own light and dazzles hunters.',
            inspectorLabel: 'Bioluminescent',
            proTag: 'Own light & -28% bites',
            conTag: 'Glowing costs +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Suction Trunk (Suction Pore)',
            editorDesc: 'Elastic trunk that vacuums in nearby food pellets.',
            inspectorLabel: 'Suction Trunk',
            proTag: 'Vacuums food from afar',
            conTag: '+15% cost to divide',
          },
        },
      },
    },
    '11-14': {
      ageBadgeTooltip: 'Intermediate biology explanations with scientific terms and functions (ages 11 to 14)',
      editorSubtitle:
        'Design the functional genes and organs of your bacterial strain before inoculating the culture dish',
      section1Heading: '1. Design Your Bacterium’s Genes & Organs (Genotype & Phenotype)',
      paretoTitle: 'Law of Nature (Pareto Principle):',
      paretoBody:
        'Every adaptation has an ATP metabolic cost (Kleiber’s Law). A huge, fast, heavily armed bacterium will consume so much energy that it will starve if substrate runs low.',
      substrateLabel: 'Substrate',
      bioBalance: {
        title: 'Energy Balance (ATP)',
        costBasal: 'Basal Metabolism (Body + Wall + Mutation):',
        costSwim: 'Cruise Swimming Drain:',
        costToxin: 'Venom Factory / Chemical Magnets:',
        costTotal: 'Estimated Total Drain:',
        efficiencyHigh: 'High Efficiency',
        efficiencyModerate: 'Moderate Drain',
        efficiencyDanger: 'Starvation Risk',
      },
      categories: {
        metabolism: {
          title: 'A. How does it feed & what is its morphology? (Metabolism & Size)',
          locusHint: 'Cell Shape (Trophic Locus)',
        },
        motility: {
          title: 'B. How does it move through the medium? (Locomotion & Speed)',
          locusHint: 'Propulsion (Kinetic Locus)',
        },
        wall: {
          title: 'C. What structure protects its membrane? (Cell Wall & Armor)',
          locusHint: 'Defense (Structural Locus)',
        },
        reproduction: {
          title: 'D. How does it reproduce & sense the medium? (Reproduction & Chemotaxis)',
          locusHint: 'Survival (Reproductive Locus)',
        },
        interaction: {
          title: 'E. What chemical strategy does it use? (Interaction & Toxins)',
          locusHint: 'Chemistry (Chemical Locus)',
        },
        adaptation: {
          title: 'F. Special Morphological Adaptations (With advantage & metabolic trade-off)',
        },
      },
      params: {
        strainNameLabel: 'Name:',
        strainNamePlaceholder: 'Your strain name',
        initialPop: 'Specimens per Strain',
        rivals: 'Random rival strains',
        size: 'Cell Size (Average size: reserves and basal drain)',
        speed: 'Locomotor Power (Effective Real Speed)',
        armor: 'Membrane Armor (Physical & chemical damage mitigation)',
        perception: 'Chemotaxis (greater range costs more upkeep)',
        toxin: 'Bacteriocin Potency (Chemical toxicity)',
        hue: 'Genetic Pigment / Strain Chromophore',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Photosynthetic (Coccus)',
            editorDesc:
              'Solar autotroph: synthesizes ATP from light without needing solid nutrients. Spherical soma.',
            inspectorLabel: 'Photosynthetic (Coccus)',
          },
          saprophyte: {
            editorTitle: 'Saprophyte (Bacillus)',
            editorDesc:
              'Decomposer: consumes free nutrients and extracts +55% energy from organic debris.',
            inspectorLabel: 'Saprophyte (Bacillus)',
          },
          predator: {
            editorTitle: 'Predator (Spirillum)',
            editorDesc:
              'Hunting heterotroph: tracks and phagocytizes live bacteria from other strains.',
            inspectorLabel: 'Predator (Spirillum)',
          },
          fermenter: {
            editorTitle: 'Fermenter (Diplococcus)',
            editorDesc:
              'Fermentative metabolism: extracts +45% bonus ATP from each substrate particle.',
            inspectorLabel: 'Fermenter (Diplococcus)',
          },
          chemolithotroph: {
            editorTitle: 'Chemolithotroph (Archaea)',
            editorDesc:
              'Oxidizes inorganic minerals without sunlight and resists 20% of toxin damage.',
            inspectorLabel: 'Chemolithotroph (Archaea)',
          },
          chemoheterotroph: {
            editorTitle: 'Chemoheterotroph',
            editorDesc:
              'Uses organic compounds as an energy source without the specialization of fermenters or saprophytes.',
            inspectorLabel: 'Chemoheterotroph',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Sessile (Anchored / Biofilm)',
            editorDesc:
              'Non-motile (0 ATP/s cost) and its biofilm matrix resists +15% of predator attacks.',
            inspectorLabel: 'Sessile (Non-Motile)',
          },
          nonmotile: {
            editorTitle: 'Non-motile',
            editorDesc: 'Lacks active locomotion but is not anchored and receives no biofilm defense.',
            inspectorLabel: 'Non-motile',
          },
          flagellated: {
            editorTitle: '〰️ Flagellated (Flagellar Propulsion)',
            editorDesc:
              'Rotary filament: reaches <strong>+35% higher top speed</strong>, with higher ATP consumption.',
            inspectorLabel: 'Flagellated',
          },
          ciliated: {
            editorTitle: 'Ciliated (Perimeter Cilia)',
            editorDesc:
              'Coordinated cilia that save energy and turn nimbly, with <strong>lower top speed (-20%)</strong>.',
            inspectorLabel: 'Ciliated',
          },
          spirochete: {
            editorTitle: 'Spirochete (Axial Filament)',
            editorDesc:
              'Helical traction (<strong>+10% speed</strong>) that evades 25% of predation attacks.',
            inspectorLabel: 'Spirochete',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Gram-Negative (Double Membrane)',
            editorDesc:
              'Thin wall with a light outer membrane: adds no weight and filters 28% of toxins.',
            inspectorLabel: 'Gram-Negative',
          },
          gram_positive: {
            editorTitle: 'Gram-Positive (Thick Wall)',
            editorDesc:
              'Thick peptidoglycan layer with high durability (+Armor) and higher maintenance cost.',
            inspectorLabel: 'Gram-Positive',
          },
          capsule: {
            editorTitle: 'Mucous Capsule (Glycocalyx)',
            editorDesc:
              'Anti-phagocytic mucous coat: halves (-50%) damage from bites and toxins.',
            inspectorLabel: 'Mucous Capsule',
          },
          s_layer: {
            editorTitle: 'Crystalline S-Layer',
            editorDesc:
              'Paracrystalline protein mesh: deflects 20% of physical damage and cuts armor cost by 25%.',
            inspectorLabel: 'Crystalline S-Layer',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Binary Fission (Symmetric)',
            editorDesc:
              'Cell division into two identical daughter bacteria (50% / 50% energy split).',
            inspectorLabel: 'Binary Fission',
          },
          budding: {
            editorTitle: 'Budding (Asymmetric)',
            editorDesc:
              'Forms a smaller daughter bud while the mother cell retains 65% of the energy.',
            inspectorLabel: 'Budding',
          },
          sporulation: {
            editorTitle: 'Sporulation (Endospore)',
            editorDesc:
              'Under starvation, forms a nearly invulnerable dormant endospore until nutrients return.',
            inspectorLabel: 'Sporulation',
          },
          conjugation: {
            editorTitle: 'Conjugation (Sex Pili)',
            editorDesc:
              'Connects pili with nearby sister cells, generating metabolic synergy (+0.35 ATP/s).',
            inspectorLabel: 'Conjugation (Pili)',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Neutral / Symbiotic',
            editorDesc:
              'Zero chemical expenditure on toxins: devotes all ATP to growth and cell division.',
            inspectorLabel: 'Neutral / Symbiotic',
          },
          bacteriocins: {
            editorTitle: 'Bacteriocin Cloud',
            editorDesc:
              'Continuous secretion of antimicrobial peptides that damage competing bacteria.',
            inspectorLabel: 'Bacteriocins',
          },
          quorum_sensing: {
            editorTitle: 'Quorum Sensing (Cooperative)',
            editorDesc:
              'Autoinducer signaling: only emits toxins when 3 or more allied cells group together.',
            inspectorLabel: 'Quorum Sensing',
          },
          siderophores: {
            editorTitle: 'Siderophores (Chelation)',
            editorDesc:
              'Secretes chelating molecules that attract nearby nutrients toward the cell.',
            inspectorLabel: 'Siderophores',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'No Extra Mutation',
            editorDesc: 'Standard morphology without accessory organs or metabolic penalties.',
            inspectorLabel: 'None',
            proTag: '+0 extra ATP/s',
          },
          claws: {
            editorTitle: 'Chitinous Claws (Chelate)',
            editorDesc: 'Front grasping appendages that immobilize prey during hunting.',
            inspectorLabel: 'Chitinous Claws',
            proTag: '+45% damage & slows prey',
            conTag: 'Heavy: -20% speed & +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Giant Cytostome (Vorax)',
            editorDesc: 'Enlarged oral aperture to engulf nutrients and prey from a wider radius.',
            inspectorLabel: 'Cytostome (Giant Maw)',
            proTag: '+25% energy from food',
            conTag: '-25% armor & +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Calcareous Spikes (Echinate)',
            editorDesc: 'Perimeter mineral spicules that deal contact damage to predators.',
            inspectorLabel: 'Calcareous Spikes',
            proTag: 'Reflects 40% of damage',
            conTag: 'Drag (+35% swim cost)',
          },
          bioluminescence: {
            editorTitle: 'Bioluminescence (Luciferase)',
            editorDesc: 'Endogenous photon emission that powers photosynthesis and deters predators.',
            inspectorLabel: 'Bioluminescence',
            proTag: 'Own light & -28% bites',
            conTag: 'Costs +0.36 ATP/s',
          },
          suction_pore: {
            editorTitle: 'Suction Pore (Haustor)',
            editorDesc: 'Hydrodynamic suction organ that draws in nearby nutrient particles.',
            inspectorLabel: 'Suction Pore',
            proTag: 'Draws nutrients from afar',
            conTag: '+15% division threshold',
          },
        },
      },
    },
    '15+': {
      ageBadgeTooltip: 'Advanced microbiological and biophysical terminology (ages 15+)',
      editorSubtitle:
        'Design the initial DNA coding strand of your strain before inoculating the culture dish',
      section1Heading: '1. Selection of Biological Categories & Genomic Loci',
      paretoTitle: 'Pareto Principle & Kleiber’s Law:',
      paretoBody:
        'A very fast, large, heavily armed bacterium will suffer extreme metabolic ATP drain and collapse from starvation when substrate becomes scarce.',
      substrateLabel: 'Substrate',
      bioBalance: {
        title: 'Energy Balance (ATP)',
        costBasal: 'Basal Metabolism (Body + Wall + Mutation):',
        costSwim: 'Cruise Swimming Drain:',
        costToxin: 'Venom Factory / Chemical Magnets:',
        costTotal: 'Estimated Total Drain:',
        efficiencyHigh: 'High Efficiency',
        efficiencyModerate: 'Moderate Drain',
        efficiencyDanger: 'Starvation Risk',
      },
      categories: {
        metabolism: {
          title: 'A. Metabolism, Nutrition & Size (Base Morphology)',
          locusHint: 'Trophic Locus',
        },
        motility: {
          title: 'B. Locomotion, Kinetic Appendages & Speed',
          locusHint: 'Kinetic Locus',
        },
        wall: {
          title: 'C. Cell Wall Structure & Membrane Armor',
          locusHint: 'Structural Locus',
        },
        reproduction: {
          title: 'D. Reproductive Strategy & Chemotaxis',
          locusHint: 'Reproductive Locus',
        },
        interaction: {
          title: 'E. Ecological Interaction & Chemical Warfare',
          locusHint: 'Chemical Locus',
        },
        adaptation: {
          title: 'F. Special Phenotypic Adaptations (Evolutionary Trade-offs)',
        },
      },
      params: {
        strainNameLabel: 'Strain:',
        strainNamePlaceholder: 'Strain name',
        initialPop: 'Initial Inoculum per Strain',
        rivals: 'Random competing populations',
        size: 'Cell Radius (Mean radius: reserves and basal cost)',
        speed: 'Locomotor Power (Codon V · Effective speed)',
        armor: 'Membrane Armor (Codon A · Lysis reduction)',
        perception: 'Chemotaxis (P · receptor maintenance cost)',
        toxin: 'Bacteriocin Potency (Codon T · Chemical lysis)',
        hue: 'Genetic Chromophore (Codon H · Wavelength)',
      },
      traits: {
        metabolism: {
          photosynthetic: {
            editorTitle: 'Photosynthetic (Coccus)',
            editorDesc: 'Passive oxygenic phototrophy proportional to luminous flux. Spherical soma.',
            inspectorLabel: 'Photosynthetic',
          },
          saprophyte: {
            editorTitle: 'Saprophyte (Bacillus)',
            editorDesc: 'Decomposer chemoorganotroph: +55% energy yield from organic detritus.',
            inspectorLabel: 'Saprophyte',
          },
          predator: {
            editorTitle: 'Predator (Spirillum)',
            editorDesc: 'Active phagocytosis of live heterologous biomass via direct contact.',
            inspectorLabel: 'Predator',
          },
          fermenter: {
            editorTitle: 'Fermenter (Diplococcus)',
            editorDesc: 'Optimized substrate-level phosphorylation (+45% energetic yield).',
            inspectorLabel: 'Fermenter',
          },
          chemolithotroph: {
            editorTitle: 'Chemolithotroph (Archaea)',
            editorDesc: 'Autonomous inorganic oxidation and +20% resistance to bacteriocins.',
            inspectorLabel: 'Chemolithotroph',
          },
          chemoheterotroph: {
            editorTitle: 'Chemoheterotroph',
            editorDesc: 'Gets energy from organic compounds at the baseline rate, with no special bonus.',
            inspectorLabel: 'Chemoheterotroph',
          },
        },
        motility: {
          sessile: {
            editorTitle: 'Sessile (Biofilm)',
            editorDesc: 'Static adhesion with zero kinetic drain (0 ATP/s) and +15% mechanical resistance.',
            inspectorLabel: 'Sessile',
          },
          nonmotile: {
            editorTitle: 'Non-motile',
            editorDesc: 'Does not swim actively, but is not anchored and has no biofilm defense.',
            inspectorLabel: 'Non-motile',
          },
          flagellated: {
            editorTitle: '〰️ Flagellated (Monotrichous)',
            editorDesc: 'High-velocity rotary propulsion (<strong>x1.35</strong>) with higher hydrodynamic drag.',
            inspectorLabel: 'Flagellated',
          },
          ciliated: {
            editorTitle: 'Ciliated (Holotrichous)',
            editorDesc: 'Low-cost ciliary beating with high maneuverability (<strong>x0.80 speed</strong>).',
            inspectorLabel: 'Ciliated',
          },
          spirochete: {
            editorTitle: 'Spirochete (Endoflagellar)',
            editorDesc: 'Helical torsion via axial filament (<strong>x1.10 speed</strong>) and 25% predation evasion.',
            inspectorLabel: 'Spirochete',
          },
        },
        wall: {
          gram_negative: {
            editorTitle: 'Gram-Negative',
            editorDesc: 'Lightweight lipopolysaccharide double membrane attenuating 28% of toxin diffusion.',
            inspectorLabel: 'Gram-Negative',
          },
          gram_positive: {
            editorTitle: 'Gram-Positive',
            editorDesc: 'Thick peptidoglycan wall with high structural integrity (+32% basal cost).',
            inspectorLabel: 'Gram-Positive',
          },
          capsule: {
            editorTitle: 'Mucous Capsule',
            editorDesc: 'External anti-phagocytic glycocalyx mitigating 50% of physical and chemical damage.',
            inspectorLabel: 'Mucous Capsule',
          },
          s_layer: {
            editorTitle: 'Crystalline S-Layer',
            editorDesc: 'Paracrystalline envelope deflecting 20% of damage and reducing armor cost by 25%.',
            inspectorLabel: 'S-Layer',
          },
        },
        reproduction: {
          binary_fission: {
            editorTitle: 'Binary Fission',
            editorDesc: 'Classical symmetric cytokinesis with equal reserve partitioning (50% / 50%).',
            inspectorLabel: 'Binary Fission',
          },
          budding: {
            editorTitle: 'Budding',
            editorDesc: 'Asymmetric division where the progenitor cell retains 65% of ATP.',
            inspectorLabel: 'Budding',
          },
          sporulation: {
            editorTitle: 'Sporulation',
            editorDesc: 'Differentiation into a highly resistant cryptobiotic endospore under starvation.',
            inspectorLabel: 'Sporulation',
          },
          conjugation: {
            editorTitle: 'Conjugation (Pili)',
            editorDesc: 'Metabolic synergy via connecting pili with kin cells (+0.35 ATP/s).',
            inspectorLabel: 'Conjugation',
          },
        },
        interaction: {
          neutral: {
            editorTitle: 'Neutral / Symbiotic',
            editorDesc: 'No synthesis of toxic secondary metabolites (0 ATP/s toxin cost).',
            inspectorLabel: 'Neutral',
          },
          bacteriocins: {
            editorTitle: 'Bacteriocins',
            editorDesc: 'Constitutive secretion of cytolytic peptides against competing strains.',
            inspectorLabel: 'Bacteriocins',
          },
          quorum_sensing: {
            editorTitle: 'Quorum Sensing',
            editorDesc: 'Density-dependent gene expression: releases toxins when ≥3 kin cells cluster.',
            inspectorLabel: 'Quorum Sensing',
          },
          siderophores: {
            editorTitle: 'Siderophores',
            editorDesc: 'High-affinity chelator secretion that pulls nutrients toward the soma.',
            inspectorLabel: 'Siderophores',
          },
        },
        adaptation: {
          none: {
            editorTitle: 'Basal Phenotype',
            editorDesc: 'Standard cellular architecture without accessory structures or overhead.',
            inspectorLabel: 'None',
            proTag: '+0 basal ATP/s',
          },
          claws: {
            editorTitle: 'Chelate (Chitinous Claws)',
            editorDesc: 'Grasping appendages that boost predatory lysis and immobilize prey.',
            inspectorLabel: 'Chelate',
            proTag: '+45% damage & slows prey',
            conTag: '-20% speed & +0.28 ATP/s',
          },
          giant_maw: {
            editorTitle: 'Vorax (Giant Cytostome)',
            editorDesc: 'Hypertrophic cytostomic apparatus with wider ingestion radius and assimilation.',
            inspectorLabel: 'Vorax',
            proTag: '+25% trophic assimilation',
            conTag: '-25% armor & +0.22 ATP/s',
          },
          spikes: {
            editorTitle: 'Echinate (Calcareous Spicules)',
            editorDesc: 'Mineral projections that reflect mechanical damage back to the attacker.',
            inspectorLabel: 'Echinate',
            proTag: 'Reflects 40% of damage',
            conTag: '+35% hydrodynamic drag',
          },
          bioluminescence: {
            editorTitle: 'Bioluminescent (Luciferase)',
            editorDesc: 'Endogenous chemiluminescence providing self-photons and deterring predators.',
            inspectorLabel: 'Bioluminescent',
            proTag: 'Self-illumination & -28% predation',
            conTag: '+0.36 basal ATP/s',
          },
          suction_pore: {
            editorTitle: 'Haustor (Suction Pore)',
            editorDesc: 'Negative-pressure gradient that draws in substrate particles from a distance.',
            inspectorLabel: 'Suction Pore',
            proTag: 'Remote substrate suction',
            conTag: '+15% fission threshold',
          },
        },
      },
    },
  },
};

const LOCALE_REGISTRY: Record<string, LocaleBundle> = {
  es: ES_BUNDLE,
  en: EN_BUNDLE,
};

class I18nService {
  private currentLocale: LocaleCode = 'es';
  private currentAge: AgeGroup = '11-14';
  private listeners: Array<() => void> = [];

  constructor() {
    const savedLocale = localStorage.getItem('evolootion.locale');
    if (savedLocale === 'es' || savedLocale === 'en') {
      this.currentLocale = savedLocale;
    }

    const savedAge = localStorage.getItem('evolootion.age');
    if (AGE_GROUPS.some((age) => age === savedAge)) {
      this.currentAge = savedAge as AgeGroup;
    }
    document.documentElement.lang = this.currentLocale;
  }

  public getLocale(): LocaleCode {
    return this.currentLocale;
  }

  public setLocale(locale: LocaleCode): void {
    if (!LOCALE_REGISTRY[locale] || this.currentLocale === locale) return;
    this.currentLocale = locale;
    localStorage.setItem('evolootion.locale', locale);
    document.documentElement.lang = locale;
    this.notify();
  }

  public getAgeGroup(): AgeGroup {
    return this.currentAge;
  }

  public setAgeGroup(age: AgeGroup): void {
    if (this.currentAge === age) return;
    this.currentAge = age;
    localStorage.setItem('evolootion.age', age);
    this.notify();
  }

  /**
   * Permite registrar nuevos paquetes de idioma en el futuro sin modificar la lógica de UI.
   */
  public registerLocale(code: string, bundle: LocaleBundle): void {
    LOCALE_REGISTRY[code] = bundle;
  }

  public getBundle(): LocaleBundle {
    return LOCALE_REGISTRY[this.currentLocale] ?? ES_BUNDLE;
  }

  public getAgeContent(): AgeAdaptedContent {
    const bundle = this.getBundle();
    return bundle.byAge[this.currentAge] ?? bundle.byAge['15+'];
  }

  public onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]();
    }
  }
}

export const i18n = new I18nService();
