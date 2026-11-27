// Tests for js/transform.js: `npm test`
const assert = require('node:assert/strict');
const path = require('node:path');
const { fitAffine, makeTransform } = require(path.join(__dirname, '..', 'js', 'transform.js'));

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

// Fake gazetteer spread over a 1000 x 1400 map, like real anchors would be.
// The first 4 are the "required" ones; the rest fill in the gaps.
const coords = [
  [170, 450], [790, 900], [560, 1180], [320, 215], // required 4 (west, east, south, north)
  [150, 150], [850, 150], [150, 1300], [850, 1300],
  [500, 650], [300, 900], [700, 400], [450, 450],
];
const places = {};
const keys = coords.map((c, i) => { places[`p${i}`] = c; return `p${i}`; });

// A known affine map is recovered exactly.
{
  const T0 = [0.32, -0.04, 144, -0.14, 0.44, 99];
  const f = (x, y) => [T0[0] * x + T0[1] * y + T0[2], T0[3] * x + T0[4] * y + T0[5]];
  const T = fitAffine(keys.slice(0, 4).map((k) => [places[k], f(...places[k])]));
  T.forEach((v, i) => close(v, T0[i], 1e-9, `affine coefficient ${i}`));
}

// A non-linear "real map": affine plus a smooth bend.
const real = (x, y) => [0.32 * x - 0.04 * y + 144 + 18 * Math.sin(y / 260), -0.14 * x + 0.44 * y + 99 + 14 * Math.cos(x / 210)];
const calibFor = (n) => {
  const pts = keys.slice(0, n).map((k) => [k, ...real(...places[k])]);
  const T = fitAffine(pts.map(([k, X, Y]) => [places[k], [X, Y]]));
  return { T, pts };
};

// With 5+ anchors every anchor lands exactly where it was clicked...
for (const n of [5, 8, 12]) {
  const xf = makeTransform(calibFor(n), places);
  assert.ok(xf.warped, `n=${n} should use the warp`);
  for (const k of keys.slice(0, n)) {
    const p = xf.fwd(...places[k]);
    const [X, Y] = real(...places[k]);
    close(p.x, X, 1e-6, `n=${n} anchor ${k} x`);
    close(p.y, Y, 1e-6, `n=${n} anchor ${k} y`);
  }
}

// ...and more anchors reduce the error at points that are NOT anchors.
const err = (xf) => {
  let sum = 0, cnt = 0;
  // Sample inside the area the anchors cover.
  for (let x = 150; x <= 850; x += 50) {
    for (let y = 150; y <= 1300; y += 50) {
      const p = xf.fwd(x, y);
      const [X, Y] = real(x, y);
      sum += Math.hypot(p.x - X, p.y - Y);
      cnt++;
    }
  }
  return sum / cnt;
};
const e4 = err(makeTransform(calibFor(4), places));
const e12 = err(makeTransform(calibFor(12), places));
assert.ok(e12 < e4 * 0.6, `12 anchors (${e12.toFixed(2)}) should beat 4 anchors (${e4.toFixed(2)}) clearly`);

// The inverse undoes the forward transform (needed for adding pins and waypoints).
for (const n of [4, 12]) {
  const xf = makeTransform(calibFor(n), places);
  for (const [x, y] of [[150, 200], [500, 700], [880, 1300], [300, 1100]]) {
    const p = xf.fwd(x, y);
    const q = xf.inv(p.x, p.y);
    close(q.x, x, 1e-4, `n=${n} inverse x at ${x},${y}`);
    close(q.y, y, 1e-4, `n=${n} inverse y at ${x},${y}`);
  }
}

// A plain 4-point calib with only T (the old format) still works.
{
  const xf = makeTransform({ T: [0.324809, -0.035666, 144.058683, -0.137363, 0.44156, 99.276692] }, places);
  assert.ok(xf && !xf.warped);
  const p = xf.fwd(792, 906);
  close(p.x, 369.0, 0.5, 'old calib x');
  close(p.y, 390.6, 0.5, 'old calib y');
}

// Unknown place keys are ignored rather than breaking the map.
assert.ok(makeTransform({ T: [1, 0, 0, 0, 1, 0], pts: [['nope', 1, 2]] }, places));

console.log(`transform tests passed (mean error: 4 anchors ${e4.toFixed(2)}, 12 anchors ${e12.toFixed(2)} map units)`);
