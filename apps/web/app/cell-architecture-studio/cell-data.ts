export type CellModelId =
  | 'liver'
  | 'plant-cell'
  | 'animal-cell'
  | 'neuron'
  | 'white-blood-cell'
  | 'mitochondria'
  | 'nucleus'
  | 'iphone-test';

export type CellShape = 'plant' | 'animal' | 'neuron' | 'immune' | 'mitochondria' | 'nucleus';

export type OrganelleShape =
  | 'sphere'
  | 'capsule'
  | 'rod'
  | 'torus'
  | 'stack'
  | 'axon'
  | 'lobed'
  | 'granules';

export type Vec3 = [number, number, number];

export type Organelle = {
  id: string;
  name: string;
  koreanName: string;
  shape: OrganelleShape;
  color: string;
  position: Vec3;
  scale: Vec3;
  function: string;
  biologicalNotes: string;
  emphasis: number;
};

export type CellModel = {
  id: CellModelId;
  name: string;
  koreanName: string;
  category: string;
  accent: string;
  shell: string;
  shape: CellShape;
  summary: string;
  functions: string[];
  biologicalNotes: string[];
  tags: string[];
  metrics: {
    scale: string;
    complexity: string;
    organelles: number;
  };
  modelPath?: string;
  textures?: {
    baseColor: string;
    normal?: string;
    roughness?: string;
  };
  organelles: Organelle[];
};

export const cellModels: CellModel[] = [
  {
    id: 'liver',
    name: 'Liver',
    koreanName: '간',
    category: 'Human Organ',
    accent: '#b95f4e',
    shell: '#d77964',
    shape: 'animal',
    summary:
      'A liver model for exploring detoxification, bile production, nutrient processing, and blood filtration in the human body.',
    functions: [
      'Filters and processes nutrient-rich blood from the digestive tract',
      'Produces bile to support fat digestion',
      'Stores glycogen, vitamins, and minerals for metabolic regulation'
    ],
    biologicalNotes: [
      'The liver receives blood from both the hepatic portal vein and hepatic artery.',
      'Hepatocytes perform many metabolic, detoxification, and protein-synthesis tasks.',
      'Bile made in the liver travels through bile ducts and is stored in the gallbladder.'
    ],
    tags: ['detoxification', 'bile', 'hepatocyte', 'blood filtration'],
    metrics: { scale: 'Adult organ: about 1.4-1.8 kg', complexity: 'High', organelles: 5 },
    modelPath: '/models/tripo/liver.glb',
    textures: {
      baseColor: '/models/tripo/liver/diff.png',
      normal: '/models/tripo/liver/norm.png',
      roughness: '/models/tripo/liver/rau.png'
    },
    organelles: [
      {
        id: 'hepatocytes',
        name: 'Hepatocytes',
        koreanName: '간세포',
        shape: 'granules',
        color: '#c86f56',
        position: [-0.26, 0.08, 0.12],
        scale: [0.5, 0.42, 0.36],
        function: 'Carry out detoxification, metabolism, bile production, and plasma protein synthesis.',
        biologicalNotes: 'Hepatocytes are arranged in plates around tiny blood channels called sinusoids.',
        emphasis: 0.92
      },
      {
        id: 'hepatic-lobule',
        name: 'Hepatic Lobule',
        koreanName: '간소엽',
        shape: 'sphere',
        color: '#e58a67',
        position: [0.14, -0.08, 0.08],
        scale: [0.62, 0.46, 0.36],
        function: 'Organizes liver tissue around central veins and portal triads.',
        biologicalNotes: 'The lobule pattern helps explain blood flow and bile flow in opposite directions.',
        emphasis: 0.84
      },
      {
        id: 'portal-vein',
        name: 'Portal Vein',
        koreanName: '문맥',
        shape: 'axon',
        color: '#4d83c7',
        position: [-0.42, -0.22, 0.05],
        scale: [0.46, 0.42, 0.42],
        function: 'Brings nutrient-rich blood from digestive organs into the liver.',
        biologicalNotes: 'Portal blood is processed before nutrients reach general circulation.',
        emphasis: 0.78
      },
      {
        id: 'hepatic-artery',
        name: 'Hepatic Artery',
        koreanName: '간동맥',
        shape: 'axon',
        color: '#d55249',
        position: [0.34, -0.26, 0.1],
        scale: [0.42, 0.38, 0.38],
        function: 'Supplies oxygen-rich blood to liver tissue.',
        biologicalNotes: 'The hepatic artery and portal vein mix blood within liver sinusoids.',
        emphasis: 0.72
      },
      {
        id: 'bile-duct',
        name: 'Bile Duct',
        koreanName: '담관',
        shape: 'axon',
        color: '#82a94c',
        position: [0.12, 0.26, 0.08],
        scale: [0.42, 0.38, 0.38],
        function: 'Carries bile from the liver toward the gallbladder and small intestine.',
        biologicalNotes: 'Bile helps emulsify fats so digestive enzymes can work efficiently.',
        emphasis: 0.74
      }
    ]
  },
  {
    id: 'plant-cell',
    name: 'Plant Cell',
    koreanName: '식물 세포',
    category: 'Eukaryotic Cell',
    accent: '#77d86f',
    shell: '#8adf84',
    shape: 'plant',
    summary:
      'Rigid cell wall, chloroplasts, and a central vacuole make this model ideal for teaching photosynthesis and cellular storage.',
    functions: [
      'Photosynthesis through chloroplasts',
      'Water and ion storage through the central vacuole',
      'Structural support from cellulose-rich cell wall'
    ],
    biologicalNotes: [
      'The large vacuole can occupy most of the cell volume in mature plant cells.',
      'Chloroplasts contain thylakoid stacks where light reactions take place.',
      'Plant cell walls provide shape but still allow communication through plasmodesmata.'
    ],
    tags: ['photosynthesis', 'vacuole', 'chloroplast', 'cell wall'],
    metrics: { scale: '10-100 micrometers', complexity: 'High', organelles: 6 },
    organelles: [
      {
        id: 'cell-wall',
        name: 'Cell Wall',
        koreanName: '세포벽',
        shape: 'capsule',
        color: '#a7e86f',
        position: [-0.34, -0.02, 0.18],
        scale: [2.88, 1.55, 0.42],
        function: 'Maintains shape and protects the plant cell from osmotic pressure.',
        biologicalNotes: 'Mostly cellulose, hemicellulose, and pectin in primary walls.',
        emphasis: 0.72
      },
      {
        id: 'central-vacuole',
        name: 'Central Vacuole',
        koreanName: '중앙 액포',
        shape: 'sphere',
        color: '#71d7ff',
        position: [-0.1, -0.08, 0.02],
        scale: [1.15, 0.82, 0.62],
        function: 'Stores water, ions, pigments, and waste products.',
        biologicalNotes: 'Turgor pressure from the vacuole helps keep stems and leaves firm.',
        emphasis: 0.95
      },
      {
        id: 'chloroplast-a',
        name: 'Chloroplast',
        koreanName: '엽록체',
        shape: 'capsule',
        color: '#39db6d',
        position: [-1.05, 0.52, 0.18],
        scale: [0.34, 0.21, 0.2],
        function: 'Converts light energy into sugars through photosynthesis.',
        biologicalNotes: 'Contains chlorophyll pigments and internal thylakoid membranes.',
        emphasis: 0.82
      },
      {
        id: 'chloroplast-b',
        name: 'Chloroplast',
        koreanName: '엽록체',
        shape: 'capsule',
        color: '#37c95f',
        position: [1.02, -0.44, -0.1],
        scale: [0.38, 0.23, 0.18],
        function: 'Converts light energy into sugars through photosynthesis.',
        biologicalNotes: 'Chloroplasts have their own DNA and double membranes.',
        emphasis: 0.78
      },
      {
        id: 'plant-nucleus',
        name: 'Nucleus',
        koreanName: '핵',
        shape: 'sphere',
        color: '#b487ff',
        position: [0.95, 0.45, 0.08],
        scale: [0.42, 0.42, 0.34],
        function: 'Stores genetic information and coordinates cell activity.',
        biologicalNotes: 'The nuclear envelope separates transcription from translation.',
        emphasis: 0.86
      },
      {
        id: 'plant-mitochondria',
        name: 'Mitochondria',
        koreanName: '미토콘드리아',
        shape: 'capsule',
        color: '#ffb15d',
        position: [-0.62, -0.68, 0.18],
        scale: [0.33, 0.16, 0.15],
        function: 'Produces ATP through cellular respiration.',
        biologicalNotes: 'Plant cells use mitochondria alongside chloroplasts.',
        emphasis: 0.68
      }
    ]
  },
  {
    id: 'animal-cell',
    name: 'Animal Cell',
    koreanName: '동물 세포',
    category: 'Eukaryotic Cell',
    accent: '#ff7f9a',
    shell: '#ff98ad',
    shape: 'animal',
    summary:
      'A flexible membrane-bound cell model for organelle comparison, intracellular transport, and basic eukaryotic structure.',
    functions: [
      'Compartmentalized protein synthesis and transport',
      'ATP production through mitochondria',
      'Selective exchange through the plasma membrane'
    ],
    biologicalNotes: [
      'Animal cells do not have a rigid cell wall, so the membrane can flex and remodel.',
      'Lysosomes contain enzymes that recycle cellular material.',
      'The endoplasmic reticulum and Golgi apparatus operate as a trafficking system.'
    ],
    tags: ['membrane', 'lysosome', 'golgi', 'endoplasmic reticulum'],
    metrics: { scale: '10-30 micrometers', complexity: 'Medium', organelles: 7 },
    modelPath: '/models/tripo/animal-cell.glb',
    organelles: [
      {
        id: 'plasma-membrane',
        name: 'Plasma Membrane',
        koreanName: '세포막',
        shape: 'sphere',
        color: '#ff9ab2',
        position: [0, 0, 0],
        scale: [1.74, 1.32, 1.05],
        function: 'Controls material exchange and cell signaling.',
        biologicalNotes: 'A phospholipid bilayer with embedded proteins and cholesterol.',
        emphasis: 0.64
      },
      {
        id: 'animal-nucleus',
        name: 'Nucleus',
        koreanName: '핵',
        shape: 'sphere',
        color: '#b08cff',
        position: [-0.2, 0.18, 0.1],
        scale: [0.5, 0.45, 0.36],
        function: 'Stores DNA and controls gene expression.',
        biologicalNotes: 'Nuclear pores regulate RNA and protein transport.',
        emphasis: 0.93
      },
      {
        id: 'rough-er',
        name: 'Rough ER',
        koreanName: '거친면 소포체',
        shape: 'stack',
        color: '#56d3e8',
        position: [-0.88, -0.18, -0.05],
        scale: [0.62, 0.34, 0.28],
        function: 'Synthesizes and folds membrane or secreted proteins.',
        biologicalNotes: 'Ribosomes attached to the ER surface give it a rough appearance.',
        emphasis: 0.75
      },
      {
        id: 'golgi',
        name: 'Golgi Apparatus',
        koreanName: '골지체',
        shape: 'stack',
        color: '#ffd260',
        position: [0.74, -0.2, 0.08],
        scale: [0.52, 0.28, 0.23],
        function: 'Modifies, sorts, and packages proteins and lipids.',
        biologicalNotes: 'Golgi stacks have cis and trans faces for directional trafficking.',
        emphasis: 0.74
      },
      {
        id: 'lysosome',
        name: 'Lysosome',
        koreanName: '리소좀',
        shape: 'sphere',
        color: '#ff6b4a',
        position: [0.72, 0.58, -0.16],
        scale: [0.2, 0.2, 0.2],
        function: 'Breaks down macromolecules and worn-out organelles.',
        biologicalNotes: 'Acidic interior activates hydrolytic enzymes.',
        emphasis: 0.58
      },
      {
        id: 'animal-mitochondria',
        name: 'Mitochondria',
        koreanName: '미토콘드리아',
        shape: 'capsule',
        color: '#ffac55',
        position: [-0.58, 0.68, 0.12],
        scale: [0.34, 0.17, 0.16],
        function: 'Generates ATP through oxidative phosphorylation.',
        biologicalNotes: 'Mitochondria form dynamic networks that split and fuse.',
        emphasis: 0.72
      },
      {
        id: 'ribosomes',
        name: 'Ribosome Cluster',
        koreanName: '리보솜 무리',
        shape: 'granules',
        color: '#f8f4d7',
        position: [0.15, -0.72, 0.22],
        scale: [0.34, 0.28, 0.2],
        function: 'Translates RNA into protein chains.',
        biologicalNotes: 'Free ribosomes often synthesize proteins used inside the cytosol.',
        emphasis: 0.5
      }
    ]
  },
  {
    id: 'neuron',
    name: 'Neuron',
    koreanName: '뉴런',
    category: 'Specialized Cell',
    accent: '#ffd35c',
    shell: '#ffd66b',
    shape: 'neuron',
    summary:
      'A signal-transmission model with dendrites, soma, axon, myelin segments, and synaptic terminals for nervous-system lessons.',
    functions: [
      'Receives chemical and electrical signals through dendrites',
      'Sends action potentials along the axon',
      'Communicates with target cells through synapses'
    ],
    biologicalNotes: [
      'Myelin insulation increases signal speed by supporting saltatory conduction.',
      'Synaptic terminals release neurotransmitters into synaptic clefts.',
      'Neurons are highly polarized, with distinct input and output regions.'
    ],
    tags: ['axon', 'dendrite', 'synapse', 'myelin'],
    metrics: { scale: 'Micrometers to over 1 meter', complexity: 'Very high', organelles: 6 },
    modelPath: '/models/tripo/neuron.glb',
    organelles: [
      {
        id: 'soma',
        name: 'Soma',
        koreanName: '세포체',
        shape: 'sphere',
        color: '#ffd25f',
        position: [-1.05, 0.05, 0],
        scale: [0.62, 0.52, 0.46],
        function: 'Integrates incoming signals and maintains cell metabolism.',
        biologicalNotes: 'The soma contains the nucleus and major biosynthetic machinery.',
        emphasis: 0.88
      },
      {
        id: 'neuron-nucleus',
        name: 'Nucleus',
        koreanName: '핵',
        shape: 'sphere',
        color: '#b28cff',
        position: [-1.08, 0.08, 0.08],
        scale: [0.24, 0.24, 0.2],
        function: 'Controls gene expression needed for neuron maintenance.',
        biologicalNotes: 'Neurons rely on long-distance transport from the soma.',
        emphasis: 0.72
      },
      {
        id: 'dendrites',
        name: 'Dendrites',
        koreanName: '수상돌기',
        shape: 'granules',
        color: '#ffe596',
        position: [-1.72, 0.18, 0.02],
        scale: [0.55, 0.48, 0.3],
        function: 'Receives input from other neurons.',
        biologicalNotes: 'Dendritic spines can remodel during learning.',
        emphasis: 0.7
      },
      {
        id: 'axon',
        name: 'Axon',
        koreanName: '축삭',
        shape: 'axon',
        color: '#77e0ff',
        position: [0.1, 0, 0],
        scale: [1, 1, 1],
        function: 'Conducts action potentials away from the soma.',
        biologicalNotes: 'Axonal transport moves vesicles and proteins over long distances.',
        emphasis: 0.9
      },
      {
        id: 'myelin',
        name: 'Myelin Sheath',
        koreanName: '수초',
        shape: 'torus',
        color: '#f4fbff',
        position: [0.58, 0, 0],
        scale: [0.64, 0.64, 0.64],
        function: 'Insulates the axon and speeds signal conduction.',
        biologicalNotes: 'Gaps between sheaths are nodes of Ranvier.',
        emphasis: 0.82
      },
      {
        id: 'synapse',
        name: 'Synaptic Terminals',
        koreanName: '시냅스 말단',
        shape: 'granules',
        color: '#ff8c5c',
        position: [1.95, -0.02, 0.02],
        scale: [0.38, 0.28, 0.24],
        function: 'Releases neurotransmitters toward the next cell.',
        biologicalNotes: 'Vesicle fusion at terminals converts electrical signals into chemical messages.',
        emphasis: 0.76
      }
    ]
  },
  {
    id: 'white-blood-cell',
    name: 'White Blood Cell',
    koreanName: '백혈구',
    category: 'Immune Cell',
    accent: '#64e7c4',
    shell: '#74f0cf',
    shape: 'immune',
    summary:
      'An immune-cell model focused on detection, engulfment, granules, and segmented nuclei.',
    functions: [
      'Recognizes infection signals and foreign material',
      'Migrates through tissue toward chemical cues',
      'Engulfs or attacks pathogens depending on cell type'
    ],
    biologicalNotes: [
      'White blood cells include neutrophils, lymphocytes, monocytes, eosinophils, and basophils.',
      'A lobed nucleus is especially prominent in neutrophils.',
      'Granules can store enzymes and antimicrobial compounds.'
    ],
    tags: ['immune', 'nucleus', 'granules', 'pathogen'],
    metrics: { scale: '7-20 micrometers', complexity: 'Medium', organelles: 5 },
    modelPath: '/models/tripo/white-blood-cell.glb',
    organelles: [
      {
        id: 'immune-membrane',
        name: 'Flexible Membrane',
        koreanName: '유연한 세포막',
        shape: 'sphere',
        color: '#76efcf',
        position: [0, 0, 0],
        scale: [1.38, 1.25, 1.06],
        function: 'Changes shape for migration and engulfment.',
        biologicalNotes: 'Cytoskeletal remodeling helps white blood cells squeeze through tissue.',
        emphasis: 0.7
      },
      {
        id: 'lobed-nucleus',
        name: 'Lobed Nucleus',
        koreanName: '분엽핵',
        shape: 'lobed',
        color: '#a88cff',
        position: [-0.06, 0.04, 0.08],
        scale: [0.52, 0.36, 0.32],
        function: 'Stores DNA while allowing compact movement through narrow spaces.',
        biologicalNotes: 'Multi-lobed nuclei are a common teaching marker for neutrophils.',
        emphasis: 0.9
      },
      {
        id: 'granules',
        name: 'Immune Granules',
        koreanName: '면역 과립',
        shape: 'granules',
        color: '#ffcf5f',
        position: [0.36, -0.26, 0.16],
        scale: [0.62, 0.5, 0.32],
        function: 'Stores enzymes and antimicrobial molecules.',
        biologicalNotes: 'Granule contents differ between neutrophils, eosinophils, and basophils.',
        emphasis: 0.78
      },
      {
        id: 'receptors',
        name: 'Surface Receptors',
        koreanName: '표면 수용체',
        shape: 'granules',
        color: '#ffffff',
        position: [-0.58, 0.52, 0.24],
        scale: [0.26, 0.2, 0.18],
        function: 'Detects molecular signals and pathogen markers.',
        biologicalNotes: 'Receptor combinations help immune cells decide when to activate.',
        emphasis: 0.58
      },
      {
        id: 'immune-lysosome',
        name: 'Lysosome',
        koreanName: '리소좀',
        shape: 'sphere',
        color: '#ff755c',
        position: [0.64, 0.44, -0.18],
        scale: [0.22, 0.22, 0.2],
        function: 'Digests engulfed material after phagocytosis.',
        biologicalNotes: 'Fusion with phagosomes creates destructive compartments.',
        emphasis: 0.64
      }
    ]
  },
  {
    id: 'mitochondria',
    name: 'Mitochondria',
    koreanName: '미토콘드리아',
    category: 'Organelle',
    accent: '#ff9f50',
    shell: '#ffad5f',
    shape: 'mitochondria',
    summary:
      'A close-up organelle model for ATP production, membrane structure, matrix chemistry, and cristae folding.',
    functions: [
      'Produces ATP through oxidative phosphorylation',
      'Hosts parts of the citric acid cycle in the matrix',
      'Participates in calcium handling and cell death signaling'
    ],
    biologicalNotes: [
      'The inner membrane folds into cristae to increase surface area.',
      'Mitochondria contain their own circular DNA.',
      'Cells with high energy demands often contain many mitochondria.'
    ],
    tags: ['ATP', 'cristae', 'matrix', 'mtDNA'],
    metrics: { scale: '0.5-10 micrometers', complexity: 'High', organelles: 5 },
    modelPath: '/models/tripo/mitochondria.glb',
    organelles: [
      {
        id: 'outer-membrane',
        name: 'Outer Membrane',
        koreanName: '외막',
        shape: 'capsule',
        color: '#ffae63',
        position: [0, 0, 0],
        scale: [1.5, 0.56, 0.46],
        function: 'Forms the organelle boundary and controls exchange.',
        biologicalNotes: 'Porins in the outer membrane allow small molecules through.',
        emphasis: 0.78
      },
      {
        id: 'inner-membrane',
        name: 'Inner Membrane',
        koreanName: '내막',
        shape: 'capsule',
        color: '#ffe48d',
        position: [0, 0, 0.02],
        scale: [1.18, 0.38, 0.32],
        function: 'Hosts electron transport chain proteins.',
        biologicalNotes: 'Maintains the proton gradient used by ATP synthase.',
        emphasis: 0.88
      },
      {
        id: 'cristae',
        name: 'Cristae',
        koreanName: '크리스타',
        shape: 'stack',
        color: '#ff6d52',
        position: [-0.03, 0.02, 0.12],
        scale: [1.0, 0.26, 0.2],
        function: 'Increases inner membrane surface area for ATP production.',
        biologicalNotes: 'Cristae shape can change with metabolic state.',
        emphasis: 0.96
      },
      {
        id: 'matrix',
        name: 'Matrix',
        koreanName: '기질',
        shape: 'sphere',
        color: '#ffd68f',
        position: [0.38, 0.04, -0.08],
        scale: [0.34, 0.23, 0.2],
        function: 'Contains enzymes for the citric acid cycle.',
        biologicalNotes: 'The matrix also contains mitochondrial ribosomes.',
        emphasis: 0.62
      },
      {
        id: 'mtdna',
        name: 'mtDNA',
        koreanName: '미토콘드리아 DNA',
        shape: 'torus',
        color: '#8fffe5',
        position: [-0.48, -0.12, -0.12],
        scale: [0.2, 0.2, 0.2],
        function: 'Encodes a small set of mitochondrial genes.',
        biologicalNotes: 'Mitochondrial DNA is usually inherited maternally.',
        emphasis: 0.52
      }
    ]
  },
  {
    id: 'nucleus',
    name: 'Nucleus',
    koreanName: '핵',
    category: 'Organelle',
    accent: '#aa91ff',
    shell: '#bda8ff',
    shape: 'nucleus',
    summary:
      'A detailed nucleus model for DNA organization, nucleolus function, nuclear pores, and gene-expression control.',
    functions: [
      'Stores and protects chromosomal DNA',
      'Controls transcription and RNA processing',
      'Builds ribosomal subunits in the nucleolus'
    ],
    biologicalNotes: [
      'The nuclear envelope is continuous with the endoplasmic reticulum.',
      'Chromatin packing affects which genes are accessible.',
      'Nuclear pores are selective transport gates for RNA and proteins.'
    ],
    tags: ['DNA', 'chromatin', 'nucleolus', 'nuclear pore'],
    metrics: { scale: '5-10 micrometers', complexity: 'High', organelles: 5 },
    modelPath: '/models/tripo/nucleus.glb',
    organelles: [
      {
        id: 'nuclear-envelope',
        name: 'Nuclear Envelope',
        koreanName: '핵막',
        shape: 'sphere',
        color: '#bba8ff',
        position: [0, 0, 0],
        scale: [1.22, 1.1, 0.94],
        function: 'Separates nuclear contents from the cytoplasm.',
        biologicalNotes: 'A double membrane surrounds the nucleus.',
        emphasis: 0.82
      },
      {
        id: 'nucleolus',
        name: 'Nucleolus',
        koreanName: '인',
        shape: 'sphere',
        color: '#ff6f8f',
        position: [0.26, 0.18, 0.16],
        scale: [0.34, 0.3, 0.26],
        function: 'Produces ribosomal RNA and assembles ribosomal subunits.',
        biologicalNotes: 'The nucleolus is not membrane-bound.',
        emphasis: 0.9
      },
      {
        id: 'chromatin',
        name: 'Chromatin',
        koreanName: '염색질',
        shape: 'axon',
        color: '#74e4ff',
        position: [-0.05, -0.08, 0.02],
        scale: [0.62, 0.62, 0.62],
        function: 'Packages DNA with histone proteins.',
        biologicalNotes: 'Open chromatin is generally more transcriptionally active.',
        emphasis: 0.84
      },
      {
        id: 'nuclear-pores',
        name: 'Nuclear Pores',
        koreanName: '핵공',
        shape: 'granules',
        color: '#fff4b5',
        position: [-0.52, 0.5, 0.32],
        scale: [0.34, 0.3, 0.26],
        function: 'Regulates traffic between nucleus and cytoplasm.',
        biologicalNotes: 'Large cargo requires transport receptors and nuclear localization signals.',
        emphasis: 0.66
      },
      {
        id: 'nuclear-lamina',
        name: 'Nuclear Lamina',
        koreanName: '핵 라미나',
        shape: 'torus',
        color: '#75ffc9',
        position: [0, 0, -0.05],
        scale: [0.78, 0.78, 0.78],
        function: 'Supports nuclear shape and organizes chromatin.',
        biologicalNotes: 'Lamin mutations can cause severe genetic diseases.',
        emphasis: 0.58
      }
    ]
  },
  {
    id: 'iphone-test',
    name: 'iPhone Test Model',
    koreanName: '아이폰 테스트 모델',
    category: 'Test Asset',
    accent: '#d7c85c',
    shell: '#ece07a',
    shape: 'animal',
    summary:
      'A non-biological test asset kept in the studio to verify GLB loading, centering, camera framing, and export behavior.',
    functions: [
      'Validates GLB conversion from FBX',
      'Checks model centering and scaling inside the 3D viewer',
      'Provides a stable regression asset while educational models are collected'
    ],
    biologicalNotes: [
      'This is not a biology model.',
      'Keep it only as a technical loading sample.',
      'Replace classroom-facing content with organ, tissue, cell, and organelle models.'
    ],
    tags: ['test asset', 'glb', 'fbx conversion', 'viewer check'],
    metrics: { scale: 'Digital model', complexity: 'Medium', organelles: 4 },
    modelPath: '/models/tripo/iphone-pro-test.glb',
    organelles: [
      {
        id: 'phone-screen',
        name: 'Screen',
        koreanName: '화면',
        shape: 'sphere',
        color: '#e8df73',
        position: [0, 0, 0],
        scale: [0.6, 0.4, 0.08],
        function: 'Main visible surface for testing material brightness.',
        biologicalNotes: 'Technical test part only.',
        emphasis: 0.72
      },
      {
        id: 'phone-frame',
        name: 'Frame',
        koreanName: '프레임',
        shape: 'torus',
        color: '#4e5662',
        position: [0, 0, 0],
        scale: [0.65, 0.46, 0.1],
        function: 'Checks edge visibility and model silhouette.',
        biologicalNotes: 'Technical test part only.',
        emphasis: 0.68
      },
      {
        id: 'phone-body',
        name: 'Body',
        koreanName: '본체',
        shape: 'sphere',
        color: '#d6a061',
        position: [0.08, 0, -0.08],
        scale: [0.58, 0.4, 0.12],
        function: 'Checks object thickness in orbit view.',
        biologicalNotes: 'Technical test part only.',
        emphasis: 0.58
      },
      {
        id: 'phone-camera',
        name: 'Camera Area',
        koreanName: '카메라 영역',
        shape: 'sphere',
        color: '#c8d285',
        position: [-0.22, 0.24, 0.08],
        scale: [0.18, 0.1, 0.06],
        function: 'Small detail used to check close-up readability.',
        biologicalNotes: 'Technical test part only.',
        emphasis: 0.5
      }
    ]
  }
];

export function getCellModel(id: CellModelId) {
  return cellModels.find((cell) => cell.id === id) ?? cellModels[0];
}
