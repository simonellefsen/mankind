export type SpeciesId =
  | "sapiens"
  | "neanderthal"
  | "denisovan"
  | "floresiensis"
  | "luzonensis"
  | "naledi"
  | "erectus";

export type LonLat = [number, number];

export type RangeBlob = {
  lon: number;
  lat: number;
  rlon: number;
  rlat: number;
};

export const SPECIES: Record<
  SpeciesId,
  {
    id: SpeciesId;
    name: string;
    latin: string;
    color: string;
    from: number;
    to: number;
    blurb: string;
  }
> = {
  sapiens: {
    id: "sapiens",
    name: "Sapiens",
    latin: "Homo sapiens",
    color: "#f0c75e",
    from: 315000,
    to: 0,
    blurb:
      "Us. Fossils from Jebel Irhoud, Morocco (~315 ka) and a pan-African mosaic of later sites show our species did not erupt from a single Garden of Eden.",
  },
  neanderthal: {
    id: "neanderthal",
    name: "Neanderthal",
    latin: "Homo neanderthalensis",
    color: "#e07a3d",
    from: 430000,
    to: 39000,
    blurb:
      "Europe and western Asia. Cold-capable, not ice-bound: fire, hide clothing, hunting, and southern refugia carried them through many glacials until ~40–37 ka.",
  },
  denisovan: {
    id: "denisovan",
    name: "Denisovan",
    latin: "Denisovans (incl. Homo longi)",
    color: "#8d7cff",
    from: 400000,
    to: 30000,
    blurb:
      "Known first from DNA in a Siberian finger bone (2010). 2025–26 work ties the Harbin “Dragon Man” skull, a Taiwan jaw, and a Yunnan cave to this Asian sister group.",
  },
  floresiensis: {
    id: "floresiensis",
    name: "Floresiensis",
    latin: "Homo floresiensis",
    color: "#3ecfb4",
    from: 700000,
    to: 50000,
    blurb:
      "The “hobbits” of Flores. Island-dwarfed descendants of Asian Homo erectus, not of sapiens — already small-bodied by ~700 ka, gone around 50 ka.",
  },
  luzonensis: {
    id: "luzonensis",
    name: "Luzonensis",
    latin: "Homo luzonensis",
    color: "#6bcf7a",
    from: 67000,
    to: 50000,
    blurb:
      "Another island experiment, on Luzon in the Philippines (~67 ka). Mix of archaic and derived traits; a reminder that Wallacea was a hominin archipelago.",
  },
  naledi: {
    id: "naledi",
    name: "Naledi",
    latin: "Homo naledi",
    color: "#e08ab0",
    from: 335000,
    to: 236000,
    blurb:
      "Small-brained Homo in South Africa overlapping in time with early sapiens. Rising Star Cave still argues for complex behaviour in a lineage that is not us.",
  },
  erectus: {
    id: "erectus",
    name: "Erectus",
    latin: "Homo erectus",
    color: "#c4a07a",
    from: 1800000,
    to: 110000,
    blurb:
      "The first hominin to leave Africa (~1.8 Ma, Dmanisi) and to reach Java. Parent stock, most likely, of floresiensis — and a long Eurasian experiment of its own.",
  },
};

export const CLIMATE_KEYS: { year: number; ice: number; shelf: number; label: string }[] = [
  { year: 2000000, ice: 0.28, shelf: 0.35, label: "Early Pleistocene ice" },
  { year: 400000, ice: 0.45, shelf: 0.4, label: "Mid-Pleistocene glacials" },
  { year: 270000, ice: 0.36, shelf: 0.3, label: "Late Middle Pleistocene" },
  { year: 155000, ice: 0.22, shelf: 0.12, label: "Approach to the Eemian" },
  { year: 130000, ice: 0.14, shelf: 0.05, label: "Eemian interglacial (MIS 5e)" },
  { year: 115000, ice: 0.35, shelf: 0.25, label: "Early last glacial" },
  { year: 71000, ice: 0.78, shelf: 0.7, label: "MIS 4 — hard cold" },
  { year: 55000, ice: 0.42, shelf: 0.45, label: "MIS 3 milder windows" },
  { year: 26000, ice: 1, shelf: 1, label: "Last Glacial Maximum" },
  { year: 21000, ice: 0.98, shelf: 1, label: "LGM peak" },
  { year: 14000, ice: 0.52, shelf: 0.55, label: "Meltwater pulse" },
  { year: 11500, ice: 0.22, shelf: 0.25, label: "Younger Dryas / early Holocene" },
  { year: 0, ice: 0.12, shelf: 0, label: "Present" },
];

export function sampleClimate(yearBP: number) {
  const keys = CLIMATE_KEYS;
  if (yearBP >= keys[0].year) return keys[0];
  if (yearBP <= 0) return keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (yearBP <= a.year && yearBP >= b.year) {
      const t = (a.year - yearBP) / (a.year - b.year);
      return {
        year: yearBP,
        ice: a.ice + (b.ice - a.ice) * t,
        shelf: a.shelf + (b.shelf - a.shelf) * t,
        label: t < 0.5 ? a.label : b.label,
      };
    }
  }
  return keys[keys.length - 1];
}

export type Chapter = {
  id: string;
  year: number;
  yearLabel: string;
  kicker: string;
  title: string;
  digest: string;
  body?: string;
  facts?: string[];
  note?: string;
  image: string;
  lookAt: LonLat;
  distance: number;
  species: SpeciesId[];
  migrations: string[];
  sites: string[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "first-exits",
    year: 1800000,
    yearLabel: "1.8 million years ago",
    kicker: "Deep time",
    title: "The first humans to leave Africa",
    digest:
      "Before sapiens existed, Homo erectus was already walking out of Africa. Five skulls at Dmanisi in Georgia, about 1.8 million years old, sit on Eurasia’s doorstep. Their descendants reached Java, China, and most likely Flores.",
    facts: [
      "This is not our migration — it is the older river later stories still flow in.",
      "Floresiensis, the “hobbits,” almost certainly come from this Asian erectus stock, not from sapiens.",
    ],
    body: "Long before sapiens, Homo erectus walked out of Africa. At Dmanisi in Georgia, five skulls dated to about 1.8 million years sit on the doorstep of Eurasia. Descendants reached Java, China, and — most likely — the island of Flores. This was not our migration. It is the older river our later story still flows in.",
    image: "/images/lgm.jpg",
    lookAt: [44.4, 41.3],
    distance: 2.35,
    species: ["erectus"],
    migrations: ["erectus-dmanisi", "erectus-java"],
    sites: ["dmanisi", "java"],
  },
  {
    id: "split",
    year: 400000,
    yearLabel: "400,000 years ago",
    kicker: "A family splits",
    title: "Neanderthals, Denisovans, and us",
    digest:
      "A Eurasian population split into Neanderthals in the west and Denisovans in the east, while sapiens took shape in Africa. By a few hundred thousand years ago, several large-brained humans shared the planet.",
    facts: [
      "Genetics puts the Neanderthal–Denisovan split around 400 ka, give or take.",
      "A 2025 reading of China’s Yunxian skull as an early Denisovan would push the split much older — still being weighed.",
    ],
    body: "Sometime after 700–400 ka, a Eurasian population split into Neanderthals in the west and Denisovans in the east. Sapiens were taking shape in Africa. A 2025 reconstruction of the Yunxian skull in China has been argued as an early Denisovan near a million years old — if it holds, the three-way split is older than textbooks still print. What is firm: by a few hundred thousand years ago, several large-brained humans shared the planet.",
    note: "Yunxian-as-Denisovan is a 2025 claim still being weighed; the Neanderthal–Denisovan split from genetics is the conservative backbone.",
    image: "/images/denisovan.jpg",
    lookAt: [40, 45],
    distance: 2.6,
    species: ["erectus", "neanderthal", "denisovan", "sapiens"],
    migrations: [],
    sites: ["denisova", "harbin", "jebel-irhoud"],
  },
  {
    id: "origin",
    year: 300000,
    yearLabel: "300,000 years ago",
    kicker: "African mosaic",
    title: "Sapiens do not have one birthplace",
    digest:
      "Jebel Irhoud in Morocco holds sapiens-like faces at about 315,000 years. Fossils in Ethiopia and South Africa, plus genomes, say the same thing: our species formed across Africa, mixing between regions. Not a Garden of Eden. A crowded laboratory.",
    facts: [
      "Homo naledi, small-brained, lived in South Africa in the same broad window.",
      "Africa still holds more human genetic diversity than the rest of the world combined.",
    ],
    body: "Jebel Irhoud, Morocco, holds sapiens-like faces at ~315 ka. Omo Kibish and Herto in Ethiopia, Florisbad in South Africa, and later genomes all point the same way: our species formed across Africa, mixing between regions for tens of millennia. Homo naledi — small-brained, also South African — lived in the same broad window. Africa was a crowded laboratory, not a single stage.",
    image: "/images/sapiens.jpg",
    lookAt: [15, 8],
    distance: 2.45,
    species: ["sapiens", "naledi", "erectus"],
    migrations: [],
    sites: ["jebel-irhoud", "omo", "rising-star"],
  },
  {
    id: "y-adam",
    year: 270000,
    yearLabel: "about 270,000 years ago",
    kicker: "Y-chromosomal Adam",
    title: "A father of the Y — not of humanity",
    digest:
      "All living men inherit their Y chromosome from one man who lived in Africa around 240–300 thousand years ago (a 2025 Y-tree puts the coalescence near 270 ka). Journalists called him Y-chromosomal Adam. He was not the first man, and he was not married to Mitochondrial Eve.",
    facts: [
      "He lived in a population of thousands. Other men’s Y lines simply died out — no surviving sons of sons.",
      "The oldest living branch, haplogroup A00, still sits in West-Central Africa (Cameroon). That is a clue to where he likely lived.",
      "He is only the ancestor of one chromosome, not of your whole genome.",
    ],
    note: "Dates move when rare Y lineages are found. A00, announced in 2013, pushed “Adam” tens of thousands of years older than 2000s estimates.",
    image: "/images/sapiens.jpg",
    lookAt: [11, 5],
    distance: 2.35,
    species: ["sapiens", "naledi"],
    migrations: [],
    sites: ["y-adam", "jebel-irhoud"],
  },
  {
    id: "pulses",
    year: 185000,
    yearLabel: "200–120,000 years ago",
    kicker: "Leaky Africa",
    title: "Out, and back again",
    digest:
      "The old story — sapiens sit in Africa for 200,000 years, then one heroic exit — is wrong. A jaw at Misliya, Israel, is ~194–177 ka. Skhūl and Qafzeh people lived in the Levant ~120–90 ka. People were already moving, meeting, and sometimes coming home.",
    facts: [
      "Princeton work in 2025 found Neanderthal–sapiens gene flow at ~250–200 ka, ~120–100 ka, and ~60–50 ka.",
      "Most of those early exits left little lasting ancestry outside Africa. The later wave did.",
    ],
    body: "The old story — sapiens stay in Africa 200,000 years, then one heroic exit — is wrong. Misliya Cave in Israel has a sapiens jaw around 194–177 ka. Skhūl and Qafzeh people lived in the Levant ~120–90 ka. Princeton work in 2025 found Neanderthal–sapiens gene flow at ~250–200 ka, ~120–100 ka, and the famous 60–50 ka pulse. People were already moving, meeting, and sometimes returning.",
    image: "/images/sapiens.jpg",
    lookAt: [35, 32],
    distance: 2.2,
    species: ["sapiens", "neanderthal"],
    migrations: ["levant-early"],
    sites: ["misliya", "skhul"],
  },
  {
    id: "mt-eve",
    year: 155000,
    yearLabel: "about 155,000 years ago",
    kicker: "Mitochondrial Eve",
    title: "A mother of mitochondria — not of us all",
    digest:
      "All living humans inherit their mitochondrial DNA from one woman who lived in Africa about 140–200 thousand years ago (most clocks cluster near 150–160 ka). She is Mitochondrial Eve. She was not the first woman, not the only woman, and she never met Y-chromosomal Adam — he had been dead for on the order of a hundred thousand years.",
    facts: [
      "Mitochondria pass (almost always) from mother to child. Eve is the woman whose mum-line never broke.",
      "Thousands of other women lived with her. Their mtDNA lines ended when a generation had only sons, or no children.",
      "The deepest mtDNA branches (haplogroup L) still live in Africa, especially the east and south.",
      "A different “Adam and Eve” — the most recent couple who are ancestors of everyone through any line, not just Y or mt — likely lived only a few thousand years ago. That is pedigree math, not a first pair.",
    ],
    note: "The biblical names are a 1980s nickname (Cann, Stoneking & Wilson, 1987). They confuse more than they explain — which is why this globe keeps the dates and drops the garden.",
    image: "/images/sapiens.jpg",
    lookAt: [36, 4],
    distance: 2.3,
    species: ["sapiens"],
    migrations: ["levant-early"],
    sites: ["mt-eve", "omo"],
  },
  {
    id: "ice-refugia",
    year: 70000,
    yearLabel: "75–55,000 years ago",
    kicker: "How Neanderthals survived ice",
    title: "Not a species of the ice sheet",
    digest:
      "Neanderthals lived through at least ten major climate swings. They sewed hides, kept fire, hunted, and fell back on southern ground when ice advanced. A hard glacial around 75–65 ka squeezed them into refugia and left a genetic bottleneck.",
    facts: [
      "They used river valleys as highways into the Altai in warmer windows.",
      "Ice shaped them. It did not invent them — and climate alone probably did not end them.",
    ],
    body: "Neanderthals lived through at least ten major climate swings. They were stocky, large-nosed, fire-using hunters who sewed hides and took southern ground when ice advanced. Around 75–65 ka, a hard glacial (MIS 4) squeezed them into refugia — especially south-western France — and left a genetic bottleneck. They were not exclusively arctic specialists; habitat maps now show them using river corridors into the Altai during warmer windows. Ice shaped them. It did not invent them.",
    note: "A 2026 paper argues climate fragmentation alone does not explain their later extinction — isolation, tiny numbers, and incoming sapiens all matter.",
    image: "/images/neanderthal.jpg",
    lookAt: [5, 48],
    distance: 2.15,
    species: ["neanderthal", "denisovan", "sapiens"],
    migrations: ["neanderthal-altai"],
    sites: ["vindija", "denisova", "gibraltar"],
  },
  {
    id: "wave",
    year: 60000,
    yearLabel: "70–50,000 years ago",
    kicker: "The wave that stayed",
    title: "A founder population leaves — and keeps going",
    digest:
      "After about 70 ka, a small African-rooted population seeds almost all living non-Africans. They meet Neanderthals on the way. Most of the Neanderthal DNA in people today dates to this window.",
    facts: [
      "Recent estimates put the main Neanderthal pulse around 50–43 ka.",
      "Inside Africa, a “ghost” lineage mixed into sapiens (~0.5–1% of living genomes).",
    ],
    body: "After ~70 ka a small African-rooted population seeds almost all living non-Africans. They meet Neanderthals in the Levant and beyond; most of the Neanderthal DNA in people today dates to this window (about 50–43 ka in recent estimates). Inside Africa, a “ghost” lineage also mixed into sapiens (~0.5–1% of living genomes). The world was already a palimpsest of meetings.",
    image: "/images/wallacea.jpg",
    lookAt: [45, 25],
    distance: 2.7,
    species: ["sapiens", "neanderthal", "denisovan"],
    migrations: ["ooa-main", "into-india"],
    sites: ["jebel-faya"],
  },
  {
    id: "sahul",
    year: 60000,
    yearLabel: "65–50,000 years ago",
    kicker: "The first blue-water crossing",
    title: "How we reached Australia",
    digest:
      "Sahul — Australia, New Guinea, Tasmania — was one continent in the ice age. It was never joined to Asia. Getting there meant boats across Wallacea’s deep channels. 2025 genomes support people in Sahul by about 60 ka, by at least two routes.",
    facts: [
      "A northern path via Sulawesi; a southern path toward Timor.",
      "A Sulawesi hand stencil dated in 2026 to ≥67.8 ka may be the world’s oldest rock art.",
    ],
    body: "Sahul — Australia, New Guinea, Tasmania — was one continent when seas sat ~60–80 m lower. It was never joined to Asia. Between them lay Wallacea: islands and deep channels that demanded boats. 2025 mitochondrial work supports a “long chronology”: people in Sahul by ~60 ka, by at least two routes. A northern path via Sulawesi, a southern path toward Timor. A hand stencil on Sulawesi, dated in 2026 to at least 67.8 ka, may be the world’s oldest rock art — and a sign that the artists were already island-hopping.",
    image: "/images/wallacea.jpg",
    lookAt: [125, -8],
    distance: 2.05,
    species: ["sapiens", "floresiensis", "luzonensis", "denisovan"],
    migrations: ["sunda-north", "sunda-south"],
    sites: ["madjedbebe", "sulawesi", "liang-bua", "callao"],
  },
  {
    id: "cousins",
    year: 50000,
    yearLabel: "60–40,000 years ago",
    kicker: "Meetings",
    title: "We did not inherit an empty world",
    digest:
      "In the east, sapiens met Denisovans — more than once, and more than one Denisovan people. New Guinea, the Philippines, and Australia still carry the highest Denisovan ancestry on Earth. On Flores the hobbits vanish around 50 ka.",
    facts: [
      "2025: the Harbin “Dragon Man” skull is a Denisovan face. A Taiwan jaw reached the subtropics.",
      "2026: Bianfu Cave in Yunnan gives Denisovan bone and a hint of culture.",
    ],
    body: "In the east, sapiens met Denisovans — likely more than once, and with more than one Denisovan population. People in New Guinea, the Philippines, and Australia still carry the highest Denisovan ancestry on Earth. In 2025 the Harbin skull became a face for the group; a jaw dredged off Taiwan proved they reached the subtropics; Bianfu Cave in Yunnan (2026) gave culture as well as bone. On Flores the hobbits vanish around 50 ka. Whether sapiens had a hand in that is open. The timing is not kind.",
    image: "/images/denisovan.jpg",
    lookAt: [110, 20],
    distance: 2.4,
    species: ["sapiens", "denisovan", "floresiensis", "luzonensis", "neanderthal"],
    migrations: ["into-sunda"],
    sites: ["harbin", "penghu", "bianfu", "liang-bua"],
  },
  {
    id: "last-neanderthals",
    year: 40000,
    yearLabel: "45–37,000 years ago",
    kicker: "An ending",
    title: "The last Neanderthals",
    digest:
      "By 42–37 ka the archaeological Neanderthal fades, last perhaps in Iberia. Their numbers were already small after the 65 ka bottleneck. Some became our ancestors. Most lineages simply stopped.",
    facts: [
      "People outside Africa still carry about 1–2% Neanderthal DNA.",
      "Extinction here is not a single winter. It is a long thinning.",
    ],
    body: "By 42–37 ka the archaeological Neanderthal fades, last perhaps in Iberia. Their numbers were already small and inbred after the 65 ka bottleneck. Sapiens were spreading through the same valleys. Some Neanderthals became our ancestors — 1–2% of the genome of people outside Africa. Most lineages simply stopped. Extinction here is not a single winter. It is a long thinning.",
    image: "/images/neanderthal.jpg",
    lookAt: [-4, 37],
    distance: 2.1,
    species: ["sapiens", "neanderthal"],
    migrations: ["into-europe"],
    sites: ["gibraltar", "vindija"],
  },
  {
    id: "lgm",
    year: 21000,
    yearLabel: "26–19,000 years ago",
    kicker: "Last Glacial Maximum",
    title: "The planet grows ice, and land",
    digest:
      "Ice sheets bury Canada and Scandinavia. Sea level falls about 120 m. Beringia is a wide, windy, mostly ice-free steppe — mammoth country, not a glacier highway. Sunda, Sahul and Doggerland become dry land. Wallacea’s deep channels still refuse to close.",
    facts: [
      "The map our species walked on is not the map in a school atlas.",
      "Beringia being ice-free is why people could cross without climbing an ice sheet.",
    ],
    body: "Ice sheets bury Canada and Scandinavia. Sea level falls ~120 m. Beringia becomes a wide, windy, mostly ice-free steppe between Siberia and Alaska — mammoth country, not a glacier highway. Sunda joins Sumatra, Java and Borneo to Asia. Sahul locks Australia to New Guinea. Britain meets Europe across Doggerland. Wallacea’s deep channels still refuse to close. The map our species walks on is not the map we draw in school.",
    image: "/images/lgm.jpg",
    lookAt: [-170, 62],
    distance: 2.2,
    species: ["sapiens"],
    migrations: [],
    sites: ["beringia"],
  },
  {
    id: "americas",
    year: 16000,
    yearLabel: "23–14,000 years ago",
    kicker: "The last continent",
    title: "How we reached the Americas",
    digest:
      "Beringia was open from about 30–11 ka. The inland ice-free corridor opens late, ~14–13.5 ka — probably too late for the first people. A coastal “kelp highway” could have run even at full ice. White Sands tracks sit in lake beds dated ~23–21 ka.",
    facts: [
      "Ancestry points to Northeast Asia; a 2026 study argues a Hokkaido–Sakhalin–Kuril seafaring start.",
      "A Denisovan mucin gene (MUC19) is unusually common in Indigenous American genomes.",
    ],
    body: "Beringia was open, in the last glacial, from about 30–11 ka (and earlier, ~70–60 ka). The interior ice-free corridor between the Laurentide and Cordilleran sheets opens late, around 14–13.5 ka — probably too late for the first people. A coastal “kelp highway” along the North Pacific could have run even at full ice. White Sands, New Mexico, now has human tracks in lake beds dated ~23–21 ka, with 2025 geochronology still supporting an LGM age. Ancestry points to a Northeast Asian homeland; a 2026 study argues seafarers from the Hokkaido–Sakhalin–Kuril world. Denisovan DNA (MUC19) is unusually common in Indigenous American genomes — a Siberian inheritance carried across the bridge.",
    note: "White Sands remains debated in some circles; multiple dating lines now converge on LGM. Clovis (~13 ka) is a later chapter, not the first.",
    image: "/images/beringia.jpg",
    lookAt: [-128, 50],
    distance: 2.45,
    species: ["sapiens"],
    migrations: ["kelp-highway", "ice-free-corridor", "south-america"],
    sites: ["white-sands", "monte-verde", "beringia"],
  },
  {
    id: "after",
    year: 8000,
    yearLabel: "after the ice",
    kicker: "What remains",
    title: "The cousins live in us",
    digest:
      "Ice melts. The land bridges drown. Only sapiens remain as a living human species — and yet we are not only sapiens. Neanderthal, Denisovan and African “ghost” DNA still sit in living genomes. The globe is a story of meetings. The genome is the archive.",
    facts: [
      "Y-Adam and mt-Eve are two thin threads. Your other ancestors number in the tens of thousands in their generations.",
      "The most recent person who is an ancestor of everyone alive (through any line) likely lived only a few thousand years ago — a much younger, mathematical “Adam and Eve.”",
    ],
    body: "Ice melts. Shelves drown. Doggerland, Sunda, Beringia and Sahul’s land bridges slip under. Only sapiens remain as a living human species — and yet we are not only sapiens. Neanderthal DNA in Eurasians and many others; Denisovan DNA from Tibet’s altitude gene to Oceanian immune loci to a mucin variant common in the Americas; African ghost ancestry still being mapped. The globe on this page is a story of meetings. The genome is the archive.",
    image: "/images/sapiens.jpg",
    lookAt: [12, 18],
    distance: 2.85,
    species: ["sapiens"],
    migrations: [],
    sites: [],
  },
];

export type Site = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  year: number;
  species: SpeciesId;
  text: string;
};

export const SITES: Site[] = [
  {
    id: "y-adam",
    name: "Y-chromosomal Adam",
    lon: 11.0,
    lat: 5.2,
    year: 270000,
    species: "sapiens",
    text: "West-Central Africa. The Y chromosome of all living men coalesces here, around 240–300 ka — one man in a crowd, not a first father.",
  },
  {
    id: "mt-eve",
    name: "Mitochondrial Eve",
    lon: 36.5,
    lat: 3.5,
    year: 155000,
    species: "sapiens",
    text: "East Africa. All living mtDNA coalesces on one woman ~140–200 ka. Thousands of other women lived. Their mum-lines ended.",
  },
  {
    id: "jebel-irhoud",
    name: "Jebel Irhoud",
    lon: -8.87,
    lat: 31.95,
    year: 315000,
    species: "sapiens",
    text: "Morocco. Sapiens faces at ~315 ka — the oldest widely accepted members of our species.",
  },
  {
    id: "omo",
    name: "Omo Kibish",
    lon: 36.0,
    lat: 4.8,
    year: 233000,
    species: "sapiens",
    text: "Ethiopia. Among the oldest East African sapiens fossils.",
  },
  {
    id: "rising-star",
    name: "Rising Star",
    lon: 27.9,
    lat: -26.02,
    year: 250000,
    species: "naledi",
    text: "South Africa. Homo naledi, overlapping in time with early sapiens.",
  },
  {
    id: "dmanisi",
    name: "Dmanisi",
    lon: 44.34,
    lat: 41.34,
    year: 1770000,
    species: "erectus",
    text: "Georgia. ~1.8 Ma Homo erectus — the first well-dated exit from Africa.",
  },
  {
    id: "java",
    name: "Java",
    lon: 111.8,
    lat: -7.4,
    year: 1000000,
    species: "erectus",
    text: "Indonesian erectus, later the likely source of floresiensis.",
  },
  {
    id: "misliya",
    name: "Misliya",
    lon: 35.02,
    lat: 32.74,
    year: 185000,
    species: "sapiens",
    text: "Israel. A sapiens jaw ~194–177 ka — an early, maybe failed, Levant excursion.",
  },
  {
    id: "skhul",
    name: "Skhūl / Qafzeh",
    lon: 35.0,
    lat: 32.6,
    year: 100000,
    species: "sapiens",
    text: "Levantine sapiens ~120–90 ka, overlapping Neanderthal country.",
  },
  {
    id: "gibraltar",
    name: "Iberia",
    lon: -5.35,
    lat: 36.0,
    year: 40000,
    species: "neanderthal",
    text: "A late Neanderthal refugium as the species thinned after 42 ka.",
  },
  {
    id: "vindija",
    name: "Vindija",
    lon: 16.0,
    lat: 46.3,
    year: 40000,
    species: "neanderthal",
    text: "Croatia. A key Neanderthal genome; once dated too young, now in the ~40 ka cluster.",
  },
  {
    id: "denisova",
    name: "Denisova Cave",
    lon: 84.68,
    lat: 51.4,
    year: 120000,
    species: "denisovan",
    text: "Altai. The finger bone that named a people, plus a second high-quality genome in 2025.",
  },
  {
    id: "harbin",
    name: "Harbin (Dragon Man)",
    lon: 126.65,
    lat: 45.8,
    year: 146000,
    species: "denisovan",
    text: "Near-complete skull, ≥146 ka, identified as Denisovan in 2025 — a face at last.",
  },
  {
    id: "penghu",
    name: "Penghu 1",
    lon: 119.6,
    lat: 23.5,
    year: 100000,
    species: "denisovan",
    text: "Jaw from the Taiwan strait. 2025 proteins: Denisovans reached the subtropics.",
  },
  {
    id: "bianfu",
    name: "Bianfu Cave",
    lon: 101.5,
    lat: 24.5,
    year: 150000,
    species: "denisovan",
    text: "Yunnan, 2026. Teeth and skull pieces from at least three Denisovans, 167–134 ka.",
  },
  {
    id: "liang-bua",
    name: "Liang Bua",
    lon: 120.45,
    lat: -8.52,
    year: 50000,
    species: "floresiensis",
    text: "Flores. The hobbit cave; the species is gone by ~50 ka.",
  },
  {
    id: "callao",
    name: "Callao Cave",
    lon: 121.82,
    lat: 17.7,
    year: 67000,
    species: "luzonensis",
    text: "Luzon, Philippines. Homo luzonensis ~67 ka.",
  },
  {
    id: "madjedbebe",
    name: "Madjedbebe",
    lon: 132.87,
    lat: -12.48,
    year: 65000,
    species: "sapiens",
    text: "Arnhem Land. Stone tools dated 65–55 ka — a pillar of the long chronology for Sahul.",
  },
  {
    id: "sulawesi",
    name: "Sulawesi art",
    lon: 119.9,
    lat: -5.0,
    year: 67800,
    species: "sapiens",
    text: "A hand stencil dated 2026 to ≥67.8 ka — possibly the oldest rock art yet.",
  },
  {
    id: "jebel-faya",
    name: "Arabia",
    lon: 55.8,
    lat: 25.1,
    year: 125000,
    species: "sapiens",
    text: "When rains greened Arabia, the peninsula was a corridor, not a wall.",
  },
  {
    id: "beringia",
    name: "Beringia",
    lon: -168.0,
    lat: 65.5,
    year: 21000,
    species: "sapiens",
    text: "The ice-free land bridge: mammoth steppe, not a slog over ice sheets.",
  },
  {
    id: "white-sands",
    name: "White Sands",
    lon: -106.33,
    lat: 32.78,
    year: 22000,
    species: "sapiens",
    text: "New Mexico. Human tracks in LGM lake beds, ~23–21 ka.",
  },
  {
    id: "monte-verde",
    name: "Monte Verde",
    lon: -73.4,
    lat: -41.5,
    year: 14500,
    species: "sapiens",
    text: "Chile. A southern site that helped break the Clovis-first model.",
  },
];

export type Migration = {
  id: string;
  species: SpeciesId;
  from: LonLat;
  to: LonLat;
  via?: LonLat[];
  start: number;
  end: number;
  kind: "land" | "sea" | "ice";
  label: string;
};

export const MIGRATIONS: Migration[] = [
  {
    id: "erectus-dmanisi",
    species: "erectus",
    from: [36, 8],
    to: [44.3, 41.3],
    start: 1900000,
    end: 1700000,
    kind: "land",
    label: "Erectus into the Caucasus",
  },
  {
    id: "erectus-java",
    species: "erectus",
    from: [44.3, 41.3],
    to: [112, -7.5],
    via: [[70, 30], [100, 20]],
    start: 1600000,
    end: 1000000,
    kind: "land",
    label: "Erectus across Asia",
  },
  {
    id: "levant-early",
    species: "sapiens",
    from: [32, 30],
    to: [35, 32.7],
    start: 194000,
    end: 90000,
    kind: "land",
    label: "Early Levant pulses",
  },
  {
    id: "neanderthal-altai",
    species: "neanderthal",
    from: [40, 48],
    to: [84.7, 51.4],
    via: [[60, 54]],
    start: 125000,
    end: 50000,
    kind: "land",
    label: "Neanderthal corridor to the Altai",
  },
  {
    id: "ooa-main",
    species: "sapiens",
    from: [36, 22],
    to: [48, 29],
    via: [[40, 16]],
    start: 70000,
    end: 50000,
    kind: "land",
    label: "Successful Out of Africa",
  },
  {
    id: "into-india",
    species: "sapiens",
    from: [48, 29],
    to: [78, 20],
    via: [[58, 24]],
    start: 65000,
    end: 50000,
    kind: "land",
    label: "Southern coastal / inland Asia",
  },
  {
    id: "into-sunda",
    species: "sapiens",
    from: [78, 20],
    to: [110, 2],
    via: [[96, 12]],
    start: 65000,
    end: 50000,
    kind: "land",
    label: "Into Sunda",
  },
  {
    id: "sunda-north",
    species: "sapiens",
    from: [118, 4],
    to: [140, -6],
    via: [[124, 1], [132, -1]],
    start: 65000,
    end: 55000,
    kind: "sea",
    label: "Northern Wallacea → Sahul",
  },
  {
    id: "sunda-south",
    species: "sapiens",
    from: [115, -8],
    to: [130, -12],
    via: [[124, -10]],
    start: 65000,
    end: 50000,
    kind: "sea",
    label: "Southern Wallacea → Australia",
  },
  {
    id: "into-europe",
    species: "sapiens",
    from: [35, 36],
    to: [10, 48],
    via: [[25, 42]],
    start: 47000,
    end: 40000,
    kind: "land",
    label: "Into Neanderthal Europe",
  },
  {
    id: "kelp-highway",
    species: "sapiens",
    from: [145, 44],
    to: [-124, 48],
    via: [[165, 50], [-170, 60], [-145, 58]],
    start: 23000,
    end: 15000,
    kind: "sea",
    label: "Pacific kelp highway",
  },
  {
    id: "ice-free-corridor",
    species: "sapiens",
    from: [-140, 64],
    to: [-110, 48],
    via: [[-120, 56]],
    start: 14000,
    end: 12500,
    kind: "ice",
    label: "Ice-free corridor (late)",
  },
  {
    id: "south-america",
    species: "sapiens",
    from: [-110, 40],
    to: [-73, -41],
    via: [[-90, 15], [-75, -5]],
    start: 18000,
    end: 14000,
    kind: "land",
    label: "South along the Americas",
  },
];

export const RANGES: { species: SpeciesId; year: number; blobs: RangeBlob[] }[] = [
  {
    species: "erectus",
    year: 1000000,
    blobs: [
      { lon: 36, lat: 0, rlon: 18, rlat: 22 },
      { lon: 70, lat: 30, rlon: 28, rlat: 16 },
      { lon: 115, lat: 30, rlon: 18, rlat: 14 },
      { lon: 112, lat: -6, rlon: 10, rlat: 6 },
    ],
  },
  {
    species: "sapiens",
    year: 300000,
    blobs: [{ lon: 20, lat: 5, rlon: 28, rlat: 28 }],
  },
  {
    species: "sapiens",
    year: 100000,
    blobs: [
      { lon: 20, lat: 5, rlon: 28, rlat: 28 },
      { lon: 35, lat: 32, rlon: 6, rlat: 5 },
    ],
  },
  {
    species: "sapiens",
    year: 50000,
    blobs: [
      { lon: 20, lat: 5, rlon: 28, rlat: 28 },
      { lon: 50, lat: 25, rlon: 22, rlat: 14 },
      { lon: 90, lat: 20, rlon: 24, rlat: 16 },
      { lon: 125, lat: -5, rlon: 18, rlat: 14 },
    ],
  },
  {
    species: "sapiens",
    year: 20000,
    blobs: [
      { lon: 20, lat: 10, rlon: 32, rlat: 30 },
      { lon: 80, lat: 30, rlon: 50, rlat: 28 },
      { lon: 135, lat: -20, rlon: 22, rlat: 18 },
      { lon: -140, lat: 60, rlon: 20, rlat: 8 },
      { lon: -100, lat: 35, rlon: 22, rlat: 16 },
    ],
  },
  {
    species: "sapiens",
    year: 10000,
    blobs: [
      { lon: 20, lat: 10, rlon: 40, rlat: 35 },
      { lon: 90, lat: 30, rlon: 55, rlat: 32 },
      { lon: 135, lat: -20, rlon: 22, rlat: 18 },
      { lon: -80, lat: 10, rlon: 40, rlat: 40 },
    ],
  },
  {
    species: "neanderthal",
    year: 100000,
    blobs: [
      { lon: 10, lat: 48, rlon: 22, rlat: 12 },
      { lon: 40, lat: 42, rlon: 18, rlat: 10 },
      { lon: 70, lat: 50, rlon: 16, rlat: 8 },
    ],
  },
  {
    species: "denisovan",
    year: 150000,
    blobs: [
      { lon: 90, lat: 50, rlon: 16, rlat: 10 },
      { lon: 105, lat: 32, rlon: 18, rlat: 12 },
      { lon: 120, lat: 24, rlon: 10, rlat: 8 },
    ],
  },
  {
    species: "floresiensis",
    year: 100000,
    blobs: [{ lon: 120.5, lat: -8.6, rlon: 3.5, rlat: 2.5 }],
  },
  {
    species: "luzonensis",
    year: 67000,
    blobs: [{ lon: 121.5, lat: 16.5, rlon: 3, rlat: 3 }],
  },
  {
    species: "naledi",
    year: 280000,
    blobs: [{ lon: 28, lat: -26, rlon: 5, rlat: 4 }],
  },
];

export function formatYear(yearBP: number) {
  if (yearBP < 800) return "the present";
  if (yearBP >= 1_000_000) {
    const ma = yearBP / 1_000_000;
    const n = ma >= 2 ? ma.toFixed(1).replace(/\.0$/, "") : ma.toFixed(2).replace(/0$/, "");
    return `${n} million years ago`;
  }
  return `${Math.round(yearBP).toLocaleString()} years ago`;
}

export function prettyYear(yearBP: number) {
  if (yearBP < 800) return "now";
  if (yearBP >= 1_000_000) return `${(yearBP / 1_000_000).toFixed(1)} Ma`;
  if (yearBP >= 1000) return `${Math.round(yearBP / 1000)} ka`;
  return `${Math.round(yearBP)} yr`;
}

export function rangesFor(species: SpeciesId, year: number): RangeBlob[] {
  const set = RANGES.filter((r) => r.species === species).sort((a, b) => b.year - a.year);
  if (!set.length) return [];
  const alive = SPECIES[species];
  if (year > alive.from || year < alive.to) return [];
  const later = set.find((r) => r.year <= year) ?? set[set.length - 1];
  return later.blobs;
}

export const SOURCES = [
  {
    title: "Jebel Irhoud sapiens (~315 ka)",
    credit: "Hublin et al., Nature, 2017",
  },
  {
    title: "Pan-African origin of sapiens",
    credit: "Scerri, Stringer and others, 2018–",
  },
  {
    title: "Mitochondrial Eve (~140–200 ka, Africa)",
    credit: "Cann, Stoneking & Wilson, Nature, 1987; later clocks still cluster ~150–160 ka",
  },
  {
    title: "Y-chromosomal Adam (~240–300 ka; ~270 ka in 2025 trees)",
    credit: "Mendez et al. 2013 (A00); Karmin et al. 2015; Y-phylogeny TMRCA ~270 ka, 2025",
  },
  {
    title: "They were not a couple — genealogical MRCA is much younger",
    credit: "Uniparental MRCAs ≠ first pair; pedigree MRCAs often a few thousand years ago (Rohde / Chang-style models)",
  },
  {
    title: "200,000 years of Neanderthal–sapiens contact",
    credit: "Li & Akey, Princeton / Science, 2025",
  },
  {
    title: "Harbin “Dragon Man” identified as Denisovan",
    credit: "Fu et al., Cell / Science, 2025",
  },
  {
    title: "Penghu 1 jaw, Taiwan — subtropical Denisovan",
    credit: "2025 palaeoproteomics",
  },
  {
    title: "Bianfu Cave, Yunnan — Denisovan fossil trove",
    credit: "Nature, September 2026",
  },
  {
    title: "Early small body size in Homo floresiensis",
    credit: "Kaifu et al., Nature Communications, 2024",
  },
  {
    title: "Long chronology for Sahul (~60 ka, two routes)",
    credit: "Science Advances, Nov 2025",
  },
  {
    title: "Sulawesi hand stencil ≥ 67.8 ka",
    credit: "2026 dating of Pleistocene rock art",
  },
  {
    title: "White Sands tracks, LGM age supported",
    credit: "Paleolake Otero geochronology, 2025",
  },
  {
    title: "Denisovan MUC19 in the Americas",
    credit: "Villanea, Huerta-Sánchez et al., 2025",
  },
  {
    title: "Neanderthal genetic bottleneck ~65 ka",
    credit: "Posth and colleagues, 2026",
  },
  {
    title: "Ghost lineages in living human DNA",
    credit: "Science, 2026",
  },
  {
    title: "Beringia ice-free steppe; kelp-highway coastal model",
    credit: "Consensus palaeoecology; Science Advances coastal-origin work, 2026",
  },
];
