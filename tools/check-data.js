// Sanity-checks the location database: `npm run check`
const path = require('node:path');
const { PLACES, REGIONS } = require(path.join(__dirname, '..', 'data', 'places.js'));
const { ITEMS, CATEGORIES, SOURCES } = require(path.join(__dirname, '..', 'data', 'locations.js'));
require(path.join(__dirname, '..', 'data', 'locations-more.js'));

const cats = new Set(CATEGORIES.map((c) => c.id));
const problems = [];
for (const i of ITEMS) {
  const tag = `${i.cat} / ${i.name}`;
  if (!cats.has(i.cat)) problems.push(`${tag}: unknown category "${i.cat}"`);
  if (!PLACES[i.at]) problems.push(`${tag}: unknown place "${i.at}"`);
  else if (!REGIONS[PLACES[i.at][4]]) problems.push(`${tag}: place "${i.at}" has unknown region`);
  if (!i.desc) problems.push(`${tag}: missing description`);
  for (const s of i.src || []) if (!SOURCES[s]) problems.push(`${tag}: unknown source "${s}"`);
  if (!i.src || !i.src.length) problems.push(`${tag}: no source`);
}
// Same category + name + place twice is almost certainly a duplicate entry.
const seen = new Set();
for (const i of ITEMS) {
  const k = `${i.cat}|${i.name.toLowerCase()}|${i.at}`;
  if (seen.has(k)) problems.push(`${i.cat} / ${i.name}: duplicate entry at ${i.at}`);
  seen.add(k);
}
const counts = {};
for (const i of ITEMS) counts[i.cat] = (counts[i.cat] || 0) + 1;
console.log(`${ITEMS.length} locations`, counts);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('All good.');
