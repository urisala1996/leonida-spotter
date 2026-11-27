// Generates the base maps: assets/map-night.svg and assets/map-atlas.svg.
// An original, schematic map of Leonida drawn from coarse outlines below
// (not traced from any official map), with seeded noise and procedural detail.
//
//   node tools/build-map.mjs
//
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MAP, PLACES } = require(join(root, 'data', 'places.js'));
const W = MAP.width, H = MAP.height;

// ---------- palettes ------------------------------------------------------
const THEMES = {
  night: {
    seaIn: '#0f2c45', seaOut: '#06111c', wave: '#8fd3ff', waveOp: 0.05, shelf: '#1d5d78', shelfLine: '#2f7f99',
    landTop: '#25392f', landBot: '#2a4536', coast: '#d6c08a', beach: '#cdb67f', beachOp: 0.22,
    forest: '#1c3629', tree: '#152d21', swamp: '#22402d', reed: '#7fbf7a', channel: '#1a4a5e',
    farm: '#3b4832', farmLine: '#c7b26b', city: '#323d47', block: '#3d4955', street: '#1a2129', streetOp: 0.9,
    contour: '#9bb3a2', contourOp: 0.18, lake: '#11304a', river: '#2f6f8f',
    hwyCase: '#0d1a14', hwy: '#e8c07a', iCase: '#0d1a14', inter: '#ff9a5a', rail: '#8d8a80', runway: '#76818c', apron: '#2b343d',
    golf: '#2f5a37', county: '#e9e3d3', countyOp: 0.16, grid: '#ffffff', gridOp: 0.03, building: '#4a5868', compass: '#e9e3d3', accent: '#ff5fa2',
  },
  atlas: {
    seaIn: '#86cbd8', seaOut: '#5aa6bf', wave: '#ffffff', waveOp: 0.12, shelf: '#b5e6ea', shelfLine: '#d4f3f3',
    landTop: '#efe5c9', landBot: '#e6dcbc', coast: '#b8a67c', beach: '#f7e9b5', beachOp: 0.9,
    forest: '#bdd19b', tree: '#a5bf83', swamp: '#b4cc9f', reed: '#6f9a6a', channel: '#8fcbd6',
    farm: '#ece0a6', farmLine: '#c9b56a', city: '#ddd6c8', block: '#d0c7b5', street: '#ffffff', streetOp: 1,
    contour: '#a8977a', contourOp: 0.35, lake: '#8fd0dc', river: '#79bccc',
    hwyCase: '#b9ad96', hwy: '#fff7e6', iCase: '#c46a2b', inter: '#f6a04d', rail: '#8d8170', runway: '#a3a39b', apron: '#c8c2b4',
    golf: '#a9d08e', county: '#7d6a4f', countyOp: 0.35, grid: '#5a4a30', gridOp: 0.05, building: '#c3b8a3', compass: '#4a3d2a', accent: '#e4337c',
  },
};

// ---------- helpers -------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function roughen(pts, seed, amp = 0.12, steps = 3) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const d = s === 0 ? 0 : (r() - 0.5) * 2 * amp * len;
      out.push([x1 + (x2 - x1) * t + nx * d, y1 + (y2 - y1) * t + ny * d]);
    }
  }
  return out;
}
function smooth(pts, closed = true) {
  const n = pts.length;
  const p = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}
function blobPts(cx, cy, rx, ry, seed, { rot = 0, jag = 0.22, n = 12 } = {}) {
  const r = rng(seed);
  const pts = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * jag;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return pts;
}
const blob = (...a) => smooth(blobPts(...a));
const line = (pts) => smooth(pts, false);
const at = (k) => PLACES[k];
// A wiggly polyline from a to b (rivers, channels, small roads).
function wiggle(a, b, seed, amp = 6, steps = 8) {
  const r = rng(seed);
  const pts = [a];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  for (let i = 1; i < steps; i++) {
    const t = i / steps, d = (r() - 0.5) * 2 * amp;
    pts.push([a[0] + (b[0] - a[0]) * t + nx * d, a[1] + (b[1] - a[1]) * t + ny * d]);
  }
  pts.push(b);
  return line(pts);
}
// Street grid lines covering a box, rotated by `rot` around its centre.
function gridLines(cx, cy, w, h, step, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const tr = (x, y) => [cx + x * c - y * s, cy + x * s + y * c].map((v) => v.toFixed(1)).join(',');
  let d = '';
  for (let x = -w / 2; x <= w / 2; x += step) d += `M${tr(x, -h / 2)}L${tr(x, h / 2)}`;
  for (let y = -h / 2; y <= h / 2; y += step) d += `M${tr(-w / 2, y)}L${tr(w / 2, y)}`;
  return d;
}

// ---------- geography -----------------------------------------------------
const mainland = [
  [62, 150], [130, 118], [200, 112], [262, 132], [300, 168], [338, 160], [372, 126],
  [440, 112], [520, 104], [565, 122], [592, 150], [622, 132], [660, 108], [730, 108],
  [800, 124], [852, 152], [884, 196], [876, 250], [866, 310], [858, 380], [866, 450],
  [872, 520], [860, 590], [872, 660], [864, 735], [854, 800], [846, 860], [850, 930],
  [846, 990], [832, 1036], [792, 1068], [730, 1090], [680, 1104], [630, 1128],
  [588, 1132], [548, 1124], [505, 1100], [452, 1098], [402, 1112], [340, 1096],
  [292, 1078], [250, 1058], [222, 1022], [200, 978], [206, 922], [196, 868],
  [182, 812], [168, 752], [150, 700], [168, 650], [150, 608], [158, 560], [140, 518],
  [128, 478], [138, 438], [116, 404], [96, 372], [84, 320], [76, 262], [64, 206],
];
const mainD = smooth(roughen(mainland, 7, 0.1, 3));

const bayIslands = ['washington-island', 'denmarch', 'oldby', 'rialto', 'casanova', 'catalan-island', 'vespucci', 'starfish', 'waxman', 'dalton'];
const barrier = [[906, 772], [930, 768], [942, 820], [944, 900], [940, 980], [932, 1030], [914, 1034], [904, 990], [904, 900], [900, 820]];
const islands = [
  { d: smooth(roughen(barrier, 11, 0.04, 2)), beach: true, id: 'barrier' },
  ...bayIslands.map((k, i) => ({ d: blob(at(k)[0], at(k)[1], 12, 6.5, 100 + i, { rot: 0.15, jag: 0.15 }), town: true, id: k })),
  { d: blob(900, 1068, 20, 9, 31, { rot: -0.3 }), beach: true },
  { d: blob(862, 1074, 12, 7, 32) },
  { d: blob(560, 1180, 62, 26, 41, { rot: -0.12, jag: 0.12, n: 16 }), beach: true, id: 'keylento' },
  { d: blob(625, 1200, 9, 6, 42) },
  { d: blob(478, 1232, 26, 13, 43, { rot: -0.4 }), beach: true },
  { d: blob(520, 1230, 9, 5, 44) },
  { d: blob(658, 1240, 18, 9, 45, { rot: 0.3 }) },
  { d: blob(684, 1232, 6, 4, 46) },
  { d: blob(420, 1262, 18, 9, 47, { rot: -0.3 }) },
  { d: blob(350, 1288, 20, 10, 48, { rot: -0.3 }) },
  { d: blob(373, 1305, 10, 6, 49) },
  { d: blob(330, 1296, 7, 4, 50) },
  { d: blob(285, 1318, 26, 10, 51, { rot: -0.25 }) },
  { d: blob(225, 1334, 14, 7, 52) },
  { d: blob(168, 1352, 22, 9, 53, { rot: -0.2 }), beach: true },
  { d: blob(190, 1042, 22, 12, 61, { rot: 0.5 }) },
  { d: blob(212, 1110, 8, 5, 62), beach: true },
  { d: blob(84, 500, 20, 34, 63, { rot: 0.1 }) },
  { d: blob(120, 616, 16, 9, 64) },
  { d: blob(70, 560, 9, 6, 65) }, { d: blob(56, 580, 6, 4, 66) },
  // Sandbars cluster
  { d: blob(120, 682, 14, 6, 67, { rot: 0.5 }), beach: true },
  { d: blob(112, 730, 10, 4, 80, { rot: 0.4 }), beach: true },
  { d: blob(138, 710, 7, 4, 81), beach: true },
  { d: blob(132, 724, 5, 3, 82), beach: true },
  { d: blob(100, 704, 6, 3, 83), beach: true },
  // Saint Attaway, Frampton and a tiny Lummox islet (north coast)
  { d: blob(426, 72, 10, 5, 84) }, { d: blob(442, 64, 7, 4, 85) }, { d: blob(460, 82, 9, 5, 86) },
  { d: blob(788, 78, 20, 10, 87, { rot: 0.2 }) }, { d: blob(814, 96, 8, 5, 88) }, { d: blob(826, 106, 5, 3, 89) },
  { d: blob(560, 90, 4, 2.5, 90) },
  { d: blob(250, 1090, 14, 4, 68, { rot: 0.4 }), beach: true },
  { d: blob(640, 60, 22, 10, 71) }, { d: blob(668, 70, 12, 7, 72) }, { d: blob(612, 52, 8, 5, 73) },
  { d: blob(300, 58, 16, 7, 74) }, { d: blob(326, 64, 7, 4, 75) },
  { d: blob(925, 192, 22, 30, 76, { rot: 0.2 }) },
  { d: blob(906, 332, 12, 26, 77) },
  { d: blob(911, 375, 6, 4, 78), beach: true },
  { d: blob(905, 510, 13, 9, 79) },
];

const lakes = [
  blob(548, 462, 60, 40, 201, { rot: 0.2, n: 16 }), // Lake Leonida, the big central lake
  blob(545, 1097, 22, 12, 202),
  blob(228, 582, 9, 6, 203),
  blob(728, 212, 18, 10, 204),
  blob(612, 330, 12, 7, 205),
  blob(352, 488, 8, 5, 206), // Emerald Springs pond
];

const forest = [
  blob(320, 230, 150, 90, 301, { jag: 0.18, n: 16 }),
  blob(580, 250, 100, 60, 302),
  blob(800, 380, 50, 90, 303),
  blob(160, 300, 60, 70, 304),
];
const peaks = [[318, 215, 46], [282, 252, 30], [360, 245, 26], [250, 205, 22], [395, 200, 20], [232, 330, 22], [102, 352, 16]];
const swamp = [
  blob(410, 960, 150, 85, 401, { jag: 0.2, n: 16 }),
  blob(260, 930, 50, 40, 402),
  blob(390, 692, 45, 28, 403),
  blob(540, 1070, 60, 30, 404),
];
const farmArea = [520, 585, 100, 55];

// Towns: [cx, cy, rx, ry, seed, streetStep, rotation]
const towns = [
  [178, 452, 32, 42, 602, 5, 0.1], [206, 598, 24, 20, 603, 4.5, -0.2], [770, 255, 30, 26, 604, 5, 0.05],
  [615, 596, 22, 16, 605, 4.5, 0], [595, 1005, 18, 13, 606, 4.5, 0.15], [512, 566, 16, 12, 607, 4.5, 0],
  [445, 255, 14, 10, 608, 4.5, 0], [176, 205, 14, 10, 609, 4.5, 0.2], [590, 190, 12, 9, 610, 4.5, 0],
  [848, 560, 14, 18, 611, 4.5, 0.1], [330, 1010, 14, 9, 612, 4.5, 0], [222, 425, 14, 10, 613, 4.5, 0],
  [772, 735, 20, 14, 614, 6, 0], [745, 1048, 22, 12, 615, 4.5, 0], [300, 890, 12, 8, 616, 4.5, 0],
  [455, 860, 10, 7, 617, 4.5, 0], [818, 410, 8, 6, 618, 4.5, 0],
];
const cityCore = blobPts(752, 900, 92, 118, 601, { jag: 0.12, n: 14 });

const roads = {
  interstate: [
    // I-404: east out of Port Gellhorn, across Ambrosia, into Vice City
    [[178, 452], [250, 462], [340, 486], [430, 540], [512, 580], [600, 660], [680, 760], [730, 830], [766, 862]],
    // East-coast interstate, meeting I-404 north of downtown (Crosstown)
    [[790, 140], [780, 255], [800, 360], [820, 470], [832, 560], [826, 660], [800, 740], [780, 820], [766, 862], [760, 940], [745, 1048]],
  ],
  highway: [
    [[480, 140], [470, 260], [500, 330], [520, 420], [512, 566], [540, 700], [575, 850], [595, 1005]], // Route 35
    [[595, 1005], [582, 1070], [576, 1132]], // to the Keys
    [[595, 1005], [660, 985], [720, 960], [760, 930]],
    [[176, 205], [200, 300], [210, 380], [178, 452], [200, 530], [206, 598], [190, 700], [205, 800], [230, 900], [300, 990], [330, 1010], [440, 1010], [595, 1005]],
    [[770, 255], [850, 300], [858, 400]],
    [[176, 205], [300, 190], [445, 255], [590, 190], [700, 200], [770, 255]],
    [[615, 596], [700, 590], [800, 580], [848, 560]],
    [[512, 566], [615, 596]],
    [[662, 870], [700, 880], [766, 862]],
  ],
  causeways: [
    [[800, 828], [878, 816], [924, 822]],
    [[812, 905], [884, 905], [924, 905]],
    [[815, 985], [884, 986], [920, 992]],
  ],
  keys: [[576, 1132], [568, 1160], [560, 1180], [505, 1212], [478, 1232], [420, 1262], [350, 1288], [285, 1318], [225, 1334], [168, 1352]],
};
const rail = [
  [[790, 120], [800, 260], [830, 420], [846, 560], [836, 700], [800, 800], [720, 860], [690, 960], [700, 1040]],
  [[178, 440], [300, 520], [420, 560], [512, 600], [615, 610], [750, 640], [836, 700]],
];
const counties = [
  [[78, 330], [250, 340], [420, 360], [600, 350], [700, 300], [860, 290]],
  [[600, 350], [640, 500], [690, 640], [700, 720], [856, 720]],
  [[690, 640], [600, 720], [560, 800], [520, 860], [190, 830]],
  [[700, 720], [640, 860], [620, 960], [700, 1090]],
];
const rivers = [
  [[548, 500], [530, 560], [505, 640], [470, 720], [450, 800], [430, 880], [420, 960], [400, 1040], [380, 1100]],
  [[612, 330], [580, 380], [560, 425]],
  [[300, 300], [260, 380], [220, 420], [180, 452]],
  [[700, 600], [760, 640], [840, 650]],
];

// ---------- render --------------------------------------------------------
function render(name) {
  const T = THEMES[name];
  const P = (d, attrs) => `<path d="${d}" ${attrs}/>`;
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
  o.push(`<defs>
  <radialGradient id="sea" cx="55%" cy="50%" r="75%"><stop offset="0" stop-color="${T.seaIn}"/><stop offset="1" stop-color="${T.seaOut}"/></radialGradient>
  <linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.landTop}"/><stop offset="1" stop-color="${T.landBot}"/></linearGradient>
  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="${T.grid}" stroke-opacity="${T.gridOp}" stroke-width="0.6"/></pattern>
  <pattern id="waves" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 6q6-4 12 0t12 0" fill="none" stroke="${T.wave}" stroke-opacity="${T.waveOp}" stroke-width="0.7"/></pattern>
  <pattern id="swamp" width="10" height="9" patternUnits="userSpaceOnUse"><path d="M2 7l1.5-3M4 7V3.5M6 7l-1.5-3" stroke="${T.reed}" stroke-opacity="0.45" stroke-width="0.55" fill="none"/></pattern>
  <pattern id="trees" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.6" fill="${T.tree}"/><circle cx="7" cy="6.5" r="1.8" fill="${T.tree}"/></pattern>
  <pattern id="farm" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(90)"><path d="M0 0V8" stroke="${T.farmLine}" stroke-opacity="0.35" stroke-width="2.4"/></pattern>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="clipMain">${P(mainD, '')}</clipPath>
  <clipPath id="clipCity">${P(smooth(cityCore), '')}</clipPath>
  ${towns.map((t, i) => `<clipPath id="ct${i}">${P(blob(t[0], t[1], t[2], t[3], t[4], { jag: 0.18 }), '')}</clipPath>`).join('')}
  <clipPath id="clipBarrier">${P(islands[0].d, '')}</clipPath>
  <clipPath id="clipKL">${P(blob(560, 1180, 46, 17, 620, { jag: 0.1, rot: -0.12 }), '')}</clipPath>
</defs>`);

  o.push(`<rect width="${W}" height="${H}" fill="url(#sea)"/><rect width="${W}" height="${H}" fill="url(#waves)"/>`);
  const allLand = [mainD, ...islands.map((i) => i.d)];

  // Shallow shelf and depth line
  o.push(`<g filter="url(#soft)" opacity="0.6">${allLand.map((d) => P(d, `fill="${T.shelf}" stroke="${T.shelf}" stroke-width="24"`)).join('')}</g>`);
  o.push(`<g>${allLand.map((d) => P(d, `fill="none" stroke="${T.shelfLine}" stroke-opacity="0.5" stroke-width="5"`)).join('')}</g>`);

  // Land + beaches
  o.push(`<g>${allLand.map((d) => P(d, `fill="url(#land)" stroke="${T.coast}" stroke-opacity="0.7" stroke-width="1.3"`)).join('')}</g>`);
  o.push(`<g>${islands.filter((i) => i.beach).map((i) => P(i.d, `fill="${T.beach}" fill-opacity="${T.beachOp * 0.35}"`)).join('')}</g>`);
  // Atlantic beach strip on Vice Beach
  o.push(P(line([[934, 775], [942, 830], [944, 900], [940, 980], [930, 1030]]), `fill="none" stroke="${T.beach}" stroke-opacity="${T.beachOp}" stroke-width="7" stroke-linecap="round" clip-path="url(#clipBarrier)"`));

  // Terrain
  o.push(`<g clip-path="url(#clipMain)">`);
  o.push(forest.map((d) => P(d, `fill="${T.forest}"`)).join('') + forest.map((d) => P(d, 'fill="url(#trees)" opacity="0.9"')).join(''));
  // Farmland: patchwork of fields
  {
    const r = rng(77);
    const [fx, fy, fw, fh] = farmArea;
    let f = '';
    for (let x = fx - fw; x < fx + fw; x += 14) {
      for (let y = fy - fh; y < fy + fh; y += 12) {
        if (((x - fx) / fw) ** 2 + ((y - fy) / fh) ** 2 > 1 || r() < 0.18) continue;
        const shade = r() < 0.5 ? T.farm : T.farmLine;
        f += `<rect x="${x + 0.8}" y="${y + 0.8}" width="12.4" height="10.4" fill="${shade}" fill-opacity="${0.35 + r() * 0.35}"/>`;
      }
    }
    o.push(`<g>${f}</g>`);
  }
  o.push(swamp.map((d) => P(d, `fill="${T.swamp}"`)).join('') + swamp.map((d) => P(d, 'fill="url(#swamp)"')).join(''));
  // Swamp channels (Grassrivers sloughs)
  {
    let ch = '';
    for (let i = 0; i < 26; i++) {
      const r = rng(900 + i);
      const x = 280 + r() * 260, y = 890 + r() * 140;
      ch += P(wiggle([x, y], [x - 20 + r() * 40, y + 20 + r() * 30], 910 + i, 5, 6), '');
    }
    o.push(`<g fill="none" stroke="${T.channel}" stroke-width="1.4" stroke-linecap="round" opacity="0.8">${ch}</g>`);
  }
  // Contour lines around the high ground
  {
    let c = '';
    peaks.forEach(([x, y, s], i) => {
      for (let k = 1; k <= 4; k++) c += P(blob(x, y, s * (1 - k * 0.2), s * 0.7 * (1 - k * 0.2), 1000 + i * 10 + k, { jag: 0.14 }), '');
    });
    o.push(`<g fill="none" stroke="${T.contour}" stroke-opacity="${T.contourOp}" stroke-width="0.8">${c}</g>`);
  }
  o.push(`</g>`);

  // Rivers and lakes
  o.push(`<g fill="none" stroke="${T.river}" stroke-width="2.2" stroke-linecap="round">${rivers.map((r) => P(line(r), '')).join('')}</g>`);
  o.push(`<g>${lakes.map((d) => P(d, `fill="${T.lake}" stroke="${T.shelfLine}" stroke-opacity="0.7" stroke-width="1.2"`)).join('')}</g>`);
  // Dawson Dam
  o.push(`<path d="M600,322L612,340" stroke="${T.runway}" stroke-width="3" stroke-linecap="round"/>`);

  // Vice City: urban fill, blocks, streets, downtown towers
  o.push(P(smooth(cityCore), `fill="${T.city}"`));
  o.push(`<g clip-path="url(#clipCity)">`);
  o.push(P(gridLines(752, 900, 260, 300, 4, -0.08), `fill="none" stroke="${T.street}" stroke-opacity="${T.streetOp * 0.55}" stroke-width="0.45"`));
  o.push(P(gridLines(752, 900, 260, 300, 16, -0.08), `fill="none" stroke="${T.street}" stroke-opacity="${T.streetOp}" stroke-width="1.1"`));
  {
    const r = rng(555);
    let b = '';
    for (let i = 0; i < 160; i++) {
      const x = 760 + (r() - 0.5) * 70, y = 900 + (r() - 0.5) * 50, w = 1.5 + r() * 3, h = 1.5 + r() * 3;
      b += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
    }
    o.push(`<g fill="${T.building}" opacity="0.9">${b}</g>`);
  }
  // Airport (VCIA)
  o.push(P(blob(664, 874, 28, 18, 700, { jag: 0.08 }), `fill="${T.apron}"`));
  o.push(`<g stroke="${T.runway}" stroke-width="3.4" stroke-linecap="round"><path d="M640,862L690,870"/><path d="M642,882L688,890"/><path d="M652,858L676,894"/></g>`);
  o.push(`</g>`);
  // Port of Vice City piers
  o.push(`<g fill="${T.apron}" stroke="${T.runway}" stroke-width="0.6">${[0, 1, 2, 3].map((i) => `<rect x="${838 + i * 2}" y="${870 + i * 7}" width="14" height="3.2" rx="0.6"/>`).join('')}</g>`);

  // Towns: urban fill and street grids
  towns.forEach(([x, y, rx, ry, seed, step, rot], i) => {
    o.push(P(blob(x, y, rx, ry, seed, { jag: 0.18 }), `fill="${T.city}" fill-opacity="0.92"`));
    o.push(`<g clip-path="url(#ct${i})">${P(gridLines(x, y, rx * 2.6, ry * 2.6, step, rot), `fill="none" stroke="${T.street}" stroke-opacity="${T.streetOp * 0.7}" stroke-width="0.5"`)}</g>`);
  });
  // Vice Beach: town strip, golf course, streets
  o.push(`<g clip-path="url(#clipBarrier)">${P(gridLines(922, 900, 60, 280, 5, 0.02), `fill="none" stroke="${T.street}" stroke-opacity="${T.streetOp * 0.6}" stroke-width="0.5"`)}${P(blob(921, 900, 10, 14, 701), `fill="${T.golf}"`)}</g>`);
  // Key Lento town
  o.push(`<g>${P(blob(560, 1180, 46, 17, 620, { jag: 0.1, rot: -0.12 }), `fill="${T.city}"`)}<g clip-path="url(#clipKL)">${P(gridLines(560, 1180, 110, 50, 4.5, -0.12), `fill="none" stroke="${T.street}" stroke-opacity="${T.streetOp * 0.7}" stroke-width="0.5"`)}</g></g>`);
  // Bay islands: estates
  o.push(`<g>${islands.filter((i) => i.town).map((i) => P(i.d, `fill="${T.golf}" fill-opacity="0.55"`)).join('')}</g>`);

  // Refinery tanks in Ambrosia
  o.push(`<g fill="none" stroke="${T.runway}" stroke-width="0.8">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${494 + (i % 3) * 5}" cy="${580 + Math.floor(i / 3) * 5}" r="1.8"/>`).join('')}</g>`);
  // Other airfields
  o.push(`<g stroke="${T.runway}" stroke-width="3.2" stroke-linecap="round"><path d="M266,1323L300,1313"/><path d="M592,1056L610,1068"/><path d="M455,600L470,606"/></g>`);

  // County borders
  o.push(`<g fill="none" stroke="${T.county}" stroke-opacity="${T.countyOp}" stroke-width="1.2" stroke-dasharray="5 5" clip-path="url(#clipMain)">${counties.map((c) => P(line(c), '')).join('')}</g>`);

  // Railways
  o.push(`<g fill="none" clip-path="url(#clipMain)">${rail.map((r) => P(line(r), `stroke="${T.rail}" stroke-width="1.8" stroke-opacity="0.8"`) + P(line(r), `stroke="${T.landTop}" stroke-width="0.9" stroke-dasharray="3 3"`)).join('')}</g>`);

  // Roads
  const roadLayer = (list, w, col, op, extra = '') => list.map((r) => P(line(r), `fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round" ${extra}`)).join('');
  o.push(`<g>${roadLayer([...roads.highway, roads.keys], 3.4, T.hwyCase, 0.65)}${roadLayer([...roads.highway, roads.keys], 1.7, T.hwy, 0.9)}</g>`);
  o.push(`<g>${roadLayer(roads.causeways, 4, T.hwyCase, 0.7)}${roadLayer(roads.causeways, 2, T.hwy, 1)}</g>`);
  o.push(`<g>${roadLayer(roads.interstate, 5, T.iCase, 0.7)}${roadLayer(roads.interstate, 2.6, T.inter, 0.95)}</g>`);

  // Grid and compass
  o.push(`<rect width="${W}" height="${H}" fill="url(#grid)"/>`);
  o.push(`<g transform="translate(940,1330)" fill="none" stroke="${T.compass}" stroke-opacity="0.6">
  <circle r="26" stroke-width="1"/><circle r="20" stroke-width="0.5" stroke-dasharray="2 3"/>
  <path d="M0,-24L5,0L0,24L-5,0Z" fill="${T.compass}" fill-opacity="0.15"/>
  <path d="M0,-24L5,0L-5,0Z" fill="${T.accent}" fill-opacity="0.9" stroke="none"/>
  <text y="-31" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="${T.compass}" stroke="none">N</text>
</g>`);
  o.push(`</svg>`);
  return o.join('\n');
}

mkdirSync(join(root, 'assets'), { recursive: true });
for (const name of Object.keys(THEMES)) {
  writeFileSync(join(root, 'assets', `map-${name}.svg`), render(name));
  console.log(`wrote assets/map-${name}.svg`);
}
