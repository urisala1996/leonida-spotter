/* Leonida Spotter: interactive map app. No build step; plain browser JS. */
(() => {
  'use strict';

  const { MAP, REGIONS, PLACES } = window.LEONIDA_PLACES;
  const { SOURCES, CATEGORIES, ITEMS } = window.LEONIDA_DATA;
  const { glyphFor, blipSVG, GLYPHS } = window.LEONIDA_ICONS;

  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  CAT.custom = { id: 'custom', name: 'My Pins', color: '#f4f1ea', glyph: 'pin', blurb: 'Pins you added. Saved in this browser.' };
  const CAT_ORDER = [...CATEGORIES.map((c) => c.id), 'custom'];
  const FOUND_WORD = {
    cards: 'Card collected', vehicles: 'Vehicle found', treasure: 'Treasure found', meteorite: 'Meteorite found',
    waink: 'Scanned', easter: 'Secret found', quests: 'Quest complete', weapons: 'Weapon found', misc: 'Collected',
    vendors: 'Visited', custom: 'Found',
  };

  // ------------------------------------------------------------- storage
  const KEY = 'leonida-spotter:v1';
  // overrides:    pin fixes on the schematic maps (shared by Night and Atlas)
  // mapOverrides: pin fixes per aligned map, keyed by style ('custom', 'tile:<id>')
  // tileCalib:    alignment per tiled map, keyed by tile id
  const defaults = () => ({
    found: [], custom: [], overrides: {}, mapOverrides: {}, tileCalib: {}, off: [], hideFound: false, region: '',
    style: 'night', labels: true, size: 'm', waypoint: null, calib: null,
  });
  let storedStyle = false;
  const store = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      storedStyle = !!saved.style;
      return { ...defaults(), ...saved };
    } catch { return defaults(); }
  })();
  // Migrate the v1 "imgOverrides" / "img" fields to the per-map format.
  if (store.imgOverrides) {
    if (Object.keys(store.imgOverrides).length) store.mapOverrides.custom = { ...store.imgOverrides, ...store.mapOverrides.custom };
    delete store.imgOverrides;
  }
  for (const c of store.custom) if (c.img) { c.pos = { ...c.pos, custom: c.img }; delete c.img; }
  if (store.waypoint && store.waypoint.img) { store.waypoint.base = 'custom'; store.waypoint.pos = store.waypoint.img; delete store.waypoint.img; }
  const found = new Set(store.found);
  const catOff = new Set(store.off);
  const save = () => {
    try {
      store.found = [...found];
      store.off = [...catOff];
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch { /* storage blocked: keep working in memory */ }
  };

  // Image files go in IndexedDB (too big for localStorage).
  const idb = (() => {
    let p;
    const open = () => p || (p = new Promise((res, rej) => {
      const r = indexedDB.open('leonida-spotter', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const run = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      const t = db.transaction('files', mode);
      const req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    }));
    return {
      get: (k) => run('readonly', (s) => s.get(k)),
      set: (k, v) => run('readwrite', (s) => s.put(v, k)),
      del: (k) => run('readwrite', (s) => s.delete(k)),
    };
  })();

  // ------------------------------------------------------------- helpers
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const placeName = (k) => (PLACES[k] ? PLACES[k][2] : '');
  const isMobile = () => matchMedia('(max-width: 860px)').matches;

  function feed(title, text = '', color = '#ff3f8e', ms = 2600) {
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.style.setProperty('--c', color);
    el.innerHTML = `<div><b>${esc(title)}</b>${text ? esc(text) : ''}</div>`;
    const box = $('#feed');
    box.append(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
  }
  function splash(title, sub) {
    const s = $('#splash');
    s.querySelector('.splash-title').textContent = title;
    s.querySelector('.splash-sub').textContent = sub;
    s.classList.remove('show');
    void s.offsetWidth;
    s.classList.add('show');
  }

  // ------------------------------------------------------------- base maps + coordinate spaces
  // Schematic space is the hand-drawn map (1000 x 1400). An aligned map
  // ("My map" image or a permitted tile map) has its own space, and schematic
  // positions are carried across with an affine fit from the alignment clicks.
  // Coordinates run from the top-left corner (y down), which is also how tile
  // servers number their tiles, so tiles line up without any offset.
  const TILE_BASES = (window.LEONIDA_BASEMAPS || []).filter((b) =>
    b && /^[\w-]+$/.test(b.id || '') && typeof b.url === 'string' && ['{z}', '{x}', '{y}'].every((t) => b.url.includes(t)) && b.width > 0 && b.height > 0);
  const tileBase = (style = store.style) => (String(style).startsWith('tile:') ? TILE_BASES.find((b) => `tile:${b.id}` === style) || null : null);
  const tileCalib = (b) => (b && (store.tileCalib[b.id]?.T || b.calib?.T)) || null;
  // First visit: start on a tile map marked `default: true` (if it is aligned).
  if (!storedStyle) {
    const def = TILE_BASES.find((b) => b.default && b.calib?.T);
    if (def) store.style = `tile:${def.id}`;
  }

  let SPACE = { w: MAP.width, h: MAP.height };
  let affine = null; // [a,b,c,d,e,f]: X = a x + b y + c, Y = d x + e y + f
  // Zoom levels are tuned for a 1000-unit-wide map; other sizes shift them.
  let zBias = 0;
  const aligned = () => !!affine;
  const proj = (x, y) => (affine ? { x: affine[0] * x + affine[1] * y + affine[2], y: affine[3] * x + affine[4] * y + affine[5] } : { x, y });
  const unproj = (X, Y) => {
    if (!affine) return { x: X, y: Y };
    const [a, b, c, d, e, f] = affine;
    const det = a * e - b * d;
    return { x: (e * (X - c) - b * (Y - f)) / det, y: (-d * (X - c) + a * (Y - f)) / det };
  };
  const toLL = (p) => L.latLng(-p.y, p.x);
  const fromLL = (ll) => ({ x: Math.round(ll.lng * 100) / 100, y: Math.round(-ll.lat * 100) / 100 });
  const spaceBounds = () => L.latLngBounds([[-SPACE.h, 0], [0, SPACE.w]]);
  const mapOv = () => (store.mapOverrides[store.style] ||= {});

  function solve3(M, v) {
    const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(M);
    return [0, 1, 2].map((i) => det(M.map((row, r) => row.map((val, c) => (c === i ? v[r] : val)))) / D);
  }
  // Least-squares affine fit from schematic points to image points.
  function fitAffine(pairs) {
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
    for (const [[x, y], [X, Y]] of pairs) {
      const r = [x, y, 1];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j];
        bx[i] += r[i] * X;
        by[i] += r[i] * Y;
      }
    }
    return [...solve3(M, bx), ...solve3(M, by)];
  }

  // ------------------------------------------------------------- data prep
  const usedIds = new Set();
  const stacked = new Map();
  function prepare(raw) {
    let id = raw.id || slug(`${raw.cat}-${raw.name}-${raw.at || ''}`);
    while (usedIds.has(id)) id += '-2';
    usedIds.add(id);
    let x, y;
    if (raw.custom) ({ x, y } = raw);
    else {
      const p = PLACES[raw.at];
      const [dx, dy] = raw.d || [0, 0];
      x = p[0] + dx;
      y = p[1] + dy;
      const k = `${Math.round(x)},${Math.round(y)}`;
      const n = stacked.get(k) || 0;
      stacked.set(k, n + 1);
      if (n > 0) {
        const a = n * 2.4, r = 4.5 * Math.sqrt(n);
        x += Math.cos(a) * r;
        y += Math.sin(a) * r;
      }
    }
    const region = raw.custom ? nearestRegion(x, y) : PLACES[raw.at][4];
    const item = { ...raw, id, base: { x, y }, region };
    item.glyph = glyphFor(item, CAT[item.cat] || CAT.custom);
    item.haystack = [item.name, item.desc, item.sub, item.req, item.reward, placeName(item.at), CAT[item.cat]?.name, REGIONS[region]]
      .filter(Boolean).join(' ').toLowerCase();
    return item;
  }
  function nearestPlace(x, y, maxDist = 60) {
    let best = null, bd = Infinity;
    for (const [k, p] of Object.entries(PLACES)) {
      if (p[3] === 1 || p[3] === 2 || p[3] === 5) continue;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < bd) { bd = d; best = k; }
    }
    return bd <= maxDist ? best : null;
  }
  function nearestRegion(x, y) { const k = nearestPlace(x, y, Infinity); return k ? PLACES[k][4] : ''; }

  // Where an item sits in the current space.
  function posOf(item) {
    if (aligned()) {
      const ov = store.mapOverrides[store.style]?.[item.id];
      if (ov) return ov;
      if (item.custom && item.pos?.[store.style]) return item.pos[store.style];
      const s = store.overrides[item.id] || item.base;
      return proj(s.x, s.y);
    }
    return store.overrides[item.id] || item.base;
  }

  const items = ITEMS.map(prepare);
  for (const c of store.custom) items.push(prepare({ ...c, custom: true }));
  const byId = new Map(items.map((i) => [i.id, i]));

  // Per-category tooltip colours
  document.head.insertAdjacentHTML('beforeend', `<style>${CAT_ORDER.map((c) => `.tip-${c}{--c:${CAT[c].color}}`).join('')}</style>`);

  // ------------------------------------------------------------- map
  const map = L.map('map', {
    crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomSnap: 1, zoomControl: false,
    attributionControl: false, maxBoundsViscosity: 0.8, wheelPxPerZoomLevel: 90, doubleClickZoom: false,
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const attribution = L.control.attribution({ prefix: false, position: 'bottomleft' });
  const mapEl = $('#map');
  const syncZ = () => { mapEl.dataset.z = String(map.getZoom() - zBias); };
  map.on('zoomend', syncZ);

  // Build the layer for a base map and apply its space, zoom range and credit.
  function baseLayer(style) {
    const tb = tileBase(style);
    if (tb) {
      SPACE = { w: tb.width, h: tb.height };
      zBias = Math.round(Math.log2(1000 / SPACE.w));
      map.setMinZoom(tb.minZoom ?? -2 + zBias);
      map.setMaxZoom(tb.maxZoom ?? 3 + zBias);
      const opts = {
        tileSize: tb.tileSize || 256, noWrap: true, bounds: spaceBounds(), tms: !!tb.tms,
        minZoom: map.getMinZoom(), maxZoom: map.getMaxZoom(), maxNativeZoom: tb.maxNativeZoom ?? map.getMaxZoom(),
        minNativeZoom: tb.minNativeZoom ?? Math.max(0, map.getMinZoom()),
        attribution: tb.attribution ? esc(tb.attribution) : '',
      };
      if (tb.subdomains) opts.subdomains = tb.subdomains;
      return L.tileLayer(tb.url, opts);
    }
    if (style === 'custom') SPACE = { w: 1000, h: store.calib?.h || calibSize?.h || 1000 };
    else SPACE = { w: MAP.width, h: MAP.height };
    zBias = 0;
    map.setMinZoom(-2);
    map.setMaxZoom(3);
    return L.imageOverlay(style === 'custom' ? customURL : `assets/map-${style}.svg`, spaceBounds(), { interactive: false });
  }

  let overlay = null;
  let customURL = null;
  let firstLoad = true;
  async function setBase(fit = true) {
    if (overlay) map.removeLayer(overlay);
    const tb = tileBase();
    if (store.style === 'custom' && !(store.calib && customURL)) store.style = 'night';
    if (String(store.style).startsWith('tile:') && !tileCalib(tb)) store.style = 'night';
    affine = store.style === 'custom' ? store.calib.T : tileCalib(tileBase());
    overlay = baseLayer(store.style).addTo(map);
    overlay.once('load', () => { if (firstLoad) { firstLoad = false; hideLoader(); } });
    if (tileBase()?.attribution) map.addControl(attribution); else map.removeControl(attribution);
    document.body.classList.toggle('theme-atlas', store.style === 'atlas');
    document.body.classList.toggle('theme-night', store.style !== 'atlas');
    const bounds = spaceBounds();
    map.setMaxBounds(bounds.pad(0.2));
    if (fit) map.fitBounds(affine ? bounds : L.latLngBounds([toLL({ x: 40, y: 40 }), toLL({ x: 960, y: 1380 })]));
    syncZ();
    rebuildCluster();
    syncSeg('#styleSeg', 'style', store.style);
    syncTileTools();
    renderLabels();
    repositionAll();
  }

  // Place labels
  const labelLayer = L.layerGroup().addTo(map);
  function renderLabels() {
    labelLayer.clearLayers();
    document.body.classList.toggle('no-labels', !store.labels);
    for (const [, [x, y, label, tier]] of Object.entries(PLACES)) {
      if (!tier) continue;
      L.marker(toLL(proj(x, y)), {
        icon: L.divIcon({ className: `place-label tier-${tier}`, html: `<span>${esc(label)}</span>`, iconSize: [0, 0] }),
        interactive: false, keyboard: false,
      }).addTo(labelLayer);
    }
  }

  // Clusters, ring coloured by the categories inside. Rebuilt when the base map
  // changes because the "stop clustering" zoom depends on the map's scale.
  let cluster = null;
  let clusterBias = null;
  function rebuildCluster() {
    if (cluster && clusterBias === zBias) return;
    if (cluster) { cluster.clearLayers(); map.removeLayer(cluster); }
    cluster = L.markerClusterGroup({ ...clusterOpts, disableClusteringAtZoom: 2 + zBias });
    clusterBias = zBias;
    map.addLayer(cluster);
  }
  const clusterOpts = {
    maxClusterRadius: 44, showCoverageOnHover: false, spiderfyOnMaxZoom: true,
    iconCreateFunction(cl) {
      const ms = cl.getAllChildMarkers();
      const counts = {};
      for (const m of ms) counts[m.item.cat] = (counts[m.item.cat] || 0) + 1;
      let acc = 0;
      const stops = CAT_ORDER.filter((c) => counts[c]).map((c) => {
        const from = (acc / ms.length) * 360;
        acc += counts[c];
        return `${CAT[c].color} ${from}deg ${(acc / ms.length) * 360}deg`;
      });
      return L.divIcon({ className: 'cluster-wrap', html: `<div class="cluster" style="--ring:conic-gradient(${stops.join(',')})"><span>${ms.length}</span></div>`, iconSize: [40, 40] });
    },
  };
  rebuildCluster();

  let selectedId = null;
  const markers = new Map();
  function iconFor(item, extra = '') {
    const cls = ['blip', found.has(item.id) && 'is-found', item.custom && 'is-custom', selectedId === item.id && 'is-active', extra].filter(Boolean).join(' ');
    return L.divIcon({ className: cls, html: blipSVG(CAT[item.cat].color, item.glyph, 30), iconSize: [30, 30], iconAnchor: [15, 15] });
  }
  const refreshIcon = (item) => { const m = markers.get(item.id); if (m) m.setIcon(iconFor(item)); };

  function makeMarker(item) {
    const m = L.marker(toLL(posOf(item)), { icon: iconFor(item), riseOnHover: true, keyboard: true, title: item.name });
    m.item = item;
    if (!matchMedia('(hover: none)').matches) {
      m.bindTooltip(`${esc(item.name)}<small>${esc(item.sub || CAT[item.cat].name)}</small>`, { direction: 'top', offset: [0, -16], className: `blip-tip tip-${item.cat}`, opacity: 1 });
    }
    m.on('click', () => select(item.id));
    m.on('dragend', () => {
      const p = fromLL(m.getLatLng());
      if (aligned()) {
        mapOv()[item.id] = p;
        if (item.custom) syncCustom(item, { pos: { ...item.pos, [store.style]: p }, ...unproj(p.x, p.y) });
      } else if (item.custom) {
        item.base = p;
        syncCustom(item, { x: p.x, y: p.y });
      } else {
        store.overrides[item.id] = p;
      }
      save();
      m.dragging.disable();
      refreshIcon(item);
      renderInfo();
      feed('Position saved', 'Stored in this browser. Export to keep a copy.', CAT[item.cat].color);
    });
    markers.set(item.id, m);
    return m;
  }
  function syncCustom(item, patch) {
    Object.assign(item, patch);
    if (patch.x != null) item.base = { x: patch.x, y: patch.y };
    const c = store.custom.find((c) => c.id === item.id);
    if (c) Object.assign(c, patch);
  }
  items.forEach(makeMarker);

  function repositionAll() {
    for (const i of items) markers.get(i.id)?.setLatLng(toLL(posOf(i)));
    drawWaypoint();
    applyFilters();
  }

  // ------------------------------------------------------------- waypoint
  let wpMarker = null;
  function drawWaypoint() {
    if (wpMarker) { map.removeLayer(wpMarker); wpMarker = null; }
    if (!store.waypoint) return;
    const w = store.waypoint;
    const pos = w.pos && w.base === store.style ? w.pos : proj(w.x, w.y);
    wpMarker = L.marker(toLL(pos), {
      icon: L.divIcon({ className: 'waypoint', html: blipSVG('#ff3f8e', 'waypoint', 32), iconSize: [32, 32], iconAnchor: [16, 16] }),
      zIndexOffset: 3000, title: 'Waypoint (click to clear)',
    }).addTo(map);
    wpMarker.on('click', () => setWaypoint(null));
  }
  function setWaypoint(p, label) {
    if (!p) { store.waypoint = null; feed('Waypoint removed'); }
    else { store.waypoint = p; feed('Waypoint set', label || '', '#ff3f8e'); }
    save();
    drawWaypoint();
    renderInfo();
  }
  const waypointAt = (spacePos) => ({ ...unproj(spacePos.x, spacePos.y), base: store.style, pos: aligned() ? spacePos : null });
  map.on('contextmenu', (e) => {
    if (calibrating) return;
    const p = fromLL(e.latlng);
    const s = waypointAt(p);
    const near = nearestPlace(s.x, s.y, 50);
    setWaypoint(s, near ? `Near ${placeName(near)}` : '');
  });
  function toggleWaypointFor(item) {
    const p = posOf(item);
    const w = store.waypoint;
    if (w && w.item === item.id) setWaypoint(null);
    else setWaypoint({ ...waypointAt(p), item: item.id }, item.name);
  }

  // ------------------------------------------------------------- info card
  const info = $('#info');
  function select(id) {
    const prev = selectedId;
    selectedId = id;
    if (prev && byId.has(prev)) refreshIcon(byId.get(prev));
    if (id && byId.has(id)) {
      refreshIcon(byId.get(id));
      history.replaceState(null, '', `#/item/${id}`);
      document.body.classList.remove('panel-open');
    } else if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    renderInfo();
  }
  function renderInfo() {
    const item = selectedId && byId.get(selectedId);
    if (!item) { info.hidden = true; return; }
    const c = CAT[item.cat];
    const isFound = found.has(item.id);
    const where = [...new Set([placeName(item.at), REGIONS[item.region]].filter(Boolean))].join(' · ');
    const kv = [item.sub && ['Type', item.sub], item.req && ['Needs', item.req], item.reward && ['Reward', item.reward]].filter(Boolean);
    const srcs = (item.src || []).map((k) => SOURCES[k]).filter(Boolean)
      .map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>` : esc(s.label)));
    const moved = aligned() ? !!store.mapOverrides[store.style]?.[item.id] : !!store.overrides[item.id];
    const isWp = store.waypoint && store.waypoint.item === item.id;
    const accuracy = item.custom ? '' : moved ? 'You moved this pin. Its position is saved in this browser.'
      : item.conf === 'guess' ? 'Rough guess: this place is not on our map yet, so the pin is in the most likely area.'
      : aligned() ? 'Carried over from the schematic map, so it may be a little off on this map. Use Move to fix it.'
      : 'Approximate: placed from a written guide description, not exact in-game coordinates.';
    info.style.setProperty('--c', c.color);
    info.innerHTML = `
      <button class="info-close" data-act="close" aria-label="Close">&times;</button>
      <div class="info-head">${blipSVG(c.color, item.glyph, 40)}
        <div><div class="info-cat">${esc(item.custom ? `My pin · ${c.name}` : c.name)}</div>
        <div class="info-title">${esc(item.name)}</div>
        ${where ? `<div class="info-where">${esc(where)}</div>` : ''}</div>
      </div>
      <div class="info-body">
        <span class="status ${isFound ? 'found' : 'todo'}">${isFound ? '✓ Found' : 'Not found yet'}</span>
        ${item.desc ? `<p>${esc(item.desc)}</p>` : ''}
        ${kv.length ? `<dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
        ${item.conflict ? `<div class="note warn">Sources disagree: ${esc(item.conflict)}</div>` : ''}
        ${accuracy ? `<div class="note acc">${accuracy}</div>` : ''}
        ${srcs.length ? `<div class="srcs">Source${srcs.length > 1 ? 's' : ''}: ${srcs.join(' · ')}</div>` : ''}
      </div>
      <div class="info-actions">
        <button class="gbtn ${isFound ? 'on' : 'primary'}" data-act="found"><kbd>F</kbd>${isFound ? 'Found' : 'Mark found'}</button>
        <button class="gbtn ${isWp ? 'on' : ''}" data-act="waypoint"><kbd>W</kbd>${isWp ? 'Clear waypoint' : 'Waypoint'}</button>
        <button class="gbtn" data-act="move"><kbd>M</kbd>Move</button>
        <button class="gbtn ghost" data-act="link">Copy link</button>
        ${moved ? '<button class="gbtn ghost" data-act="reset">Reset spot</button>' : ''}
        ${item.custom ? '<button class="gbtn ghost" data-act="delete">Delete</button>' : ''}
      </div>`;
    info.hidden = false;
  }
  info.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) act(b.dataset.act);
  });

  function act(what) {
    const item = selectedId && byId.get(selectedId);
    if (what === 'close' || !item) { select(null); return; }
    const m = markers.get(item.id);
    switch (what) {
      case 'found': toggleFound(item); break;
      case 'waypoint': toggleWaypointFor(item); break;
      case 'move':
        if (!cluster.hasLayer(m)) return;
        m.dragging.enable();
        m.setIcon(iconFor(item, 'is-dragging'));
        feed('Move pin', 'Drag the blip to the right spot and drop it.', CAT[item.cat].color, 3500);
        break;
      case 'link': {
        const url = `${location.href.split('#')[0]}#/item/${item.id}`;
        (navigator.clipboard?.writeText(url) ?? Promise.reject()).then(() => feed('Link copied'), () => prompt('Copy this link', url));
        break;
      }
      case 'reset':
        delete (aligned() ? mapOv() : store.overrides)[item.id];
        save();
        m.setLatLng(toLL(posOf(item)));
        renderInfo();
        feed('Pin reset');
        break;
      case 'delete':
        if (!confirm(`Delete your pin "${item.name}"?`)) return;
        store.custom = store.custom.filter((c) => c.id !== item.id);
        save();
        cluster.removeLayer(m);
        markers.delete(item.id);
        byId.delete(item.id);
        items.splice(items.indexOf(item), 1);
        select(null);
        refreshCounts();
        applyFilters();
        break;
    }
  }

  function toggleFound(item) {
    const c = CAT[item.cat];
    if (found.has(item.id)) {
      found.delete(item.id);
      feed('Unmarked', item.name, c.color);
    } else {
      found.add(item.id);
      const total = items.filter((i) => i.cat === item.cat).length;
      const got = items.filter((i) => i.cat === item.cat && found.has(i.id)).length;
      splash(FOUND_WORD[item.cat] || 'Found', `${c.name}  ${got} / ${total}`);
    }
    save();
    refreshIcon(item);
    refreshCounts();
    renderInfo();
    if (store.hideFound) applyFilters(); else renderList();
  }

  // ------------------------------------------------------------- left panel
  const regionSel = $('#region');
  for (const [k, v] of Object.entries(REGIONS)) regionSel.add(new Option(v, k));
  regionSel.value = store.region || '';
  $('#hideFound').checked = !!store.hideFound;
  $('#showLabels').checked = !!store.labels;

  const legend = $('#legend');
  function renderLegend() {
    legend.innerHTML = CAT_ORDER.map((id) => {
      const c = CAT[id];
      return `<li><button data-cat="${id}" aria-pressed="${!catOff.has(id)}" style="--c:${c.color}" title="${esc(c.blurb)} (Alt-click to show only this)">
        ${blipSVG(c.color, c.glyph, 26)}<span class="lname">${esc(c.name)}</span><span class="lcount" data-count="${id}"></span><span class="lcheck"></span></button></li>`;
    }).join('');
  }
  legend.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    const id = b.dataset.cat;
    if (e.altKey || e.ctrlKey || e.metaKey) CAT_ORDER.forEach((c) => (c === id ? catOff.delete(c) : catOff.add(c)));
    else catOff.has(id) ? catOff.delete(id) : catOff.add(id);
    syncLegend(); save(); applyFilters();
  });
  const syncLegend = () => legend.querySelectorAll('button[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(!catOff.has(b.dataset.cat))));
  $('#catAll').onclick = () => { catOff.clear(); syncLegend(); save(); applyFilters(); };
  $('#catNone').onclick = () => { CAT_ORDER.forEach((c) => catOff.add(c)); syncLegend(); save(); applyFilters(); };

  function refreshCounts() {
    const total = {}, got = {};
    for (const i of items) {
      total[i.cat] = (total[i.cat] || 0) + 1;
      if (found.has(i.id)) got[i.cat] = (got[i.cat] || 0) + 1;
    }
    for (const id of CAT_ORDER) {
      const el = legend.querySelector(`[data-count="${id}"]`);
      if (el) el.textContent = `${got[id] || 0}/${total[id] || 0}`;
    }
    const all = items.filter((i) => !i.custom);
    const have = all.filter((i) => found.has(i.id)).length;
    $('#compPct').textContent = `${all.length ? ((have / all.length) * 100).toFixed(1) : '0.0'}%`;
    $('#compSub').textContent = `${have} / ${all.length} found`;
    renderCollections(total, got);
  }

  function renderCollections(total, got) {
    const box = $('#collections');
    box.innerHTML = CAT_ORDER.filter((id) => total[id]).map((id) => {
      const c = CAT[id];
      const pct = Math.round(((got[id] || 0) / total[id]) * 100);
      let sets = '';
      if (id === 'cards') {
        const bySet = {};
        for (const i of items.filter((i) => i.cat === 'cards')) {
          const s = (bySet[i.sub] ||= { n: 0, f: 0 });
          s.n++;
          if (found.has(i.id)) s.f++;
        }
        sets = `<div class="coll-sets">${Object.entries(bySet).sort().map(([s, v]) =>
          `<button class="coll-set" data-set="${esc(s)}"><span>${esc(s)}</span><span><b>${v.f}</b> / ${v.n}</span></button>`).join('')}</div>
          <div class="coll-note">The game has 480 cards in 18 sets; ${total[id]} are mapped here so far.</div>`;
      }
      return `<div class="coll" style="--c:${c.color}">
        <div class="coll-head">${blipSVG(c.color, c.glyph, 30)}<span class="coll-name">${esc(c.name)}</span><span class="coll-num">${got[id] || 0}<span class="muted"> / ${total[id]}</span></span></div>
        <div class="coll-bar"><i style="width:${pct}%"></i></div>${sets}</div>`;
    }).join('');
  }
  $('#collections').addEventListener('click', (e) => {
    const s = e.target.closest('[data-set]');
    if (!s) return;
    catOff.delete('cards');
    syncLegend();
    $('#search').value = s.dataset.set;
    query = s.dataset.set.toLowerCase();
    setTab('map');
    $('#resultsBox').open = true;
    applyFilters();
    fitVisible();
  });

  // Tabs
  function setTab(name) {
    document.querySelectorAll('.tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.dataset.pane !== name; });
    if (isMobile()) document.body.classList.add('panel-open');
  }
  document.querySelectorAll('.tabs [data-tab]').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });

  // Search, region, toggles
  let query = '';
  let searchTimer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      query = e.target.value.trim().toLowerCase();
      if (query) $('#resultsBox').open = true;
      applyFilters();
    }, 120);
  });
  regionSel.addEventListener('change', () => { store.region = regionSel.value; save(); applyFilters(); if (store.region) fitVisible(); });
  $('#hideFound').addEventListener('change', (e) => { store.hideFound = e.target.checked; save(); applyFilters(); });
  $('#showLabels').addEventListener('change', (e) => { store.labels = e.target.checked; save(); renderLabels(); });

  function fitVisible() {
    const pts = visible.map((i) => markers.get(i.id).getLatLng());
    if (pts.length) map.flyToBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 2 + zBias, duration: 0.6 });
  }

  function isVisible(i) {
    if (catOff.has(i.cat)) return false;
    if (store.hideFound && found.has(i.id)) return false;
    if (store.region && i.region !== store.region) return false;
    if (query && !query.split(/\s+/).every((w) => i.haystack.includes(w))) return false;
    return true;
  }
  let visible = [];
  function applyFilters() {
    if (calibrating) return;
    visible = items.filter(isVisible);
    cluster.clearLayers();
    cluster.addLayers(visible.map((i) => markers.get(i.id)));
    renderList();
  }

  const resultList = $('#resultList');
  function renderList() {
    const sorted = [...visible].sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || a.name.localeCompare(b.name));
    $('#resultCount').textContent = `(${sorted.length})`;
    if (!sorted.length) { resultList.innerHTML = '<li class="empty">Nothing matches. Clear the search or turn categories back on.</li>'; return; }
    resultList.innerHTML = sorted.map((i) => `<li class="${found.has(i.id) ? 'is-found' : ''}"><button data-id="${i.id}">
        ${blipSVG(CAT[i.cat].color, i.glyph, 22)}
        <span><span class="name">${esc(i.name)}</span><span class="where">${esc([i.sub, placeName(i.at) || REGIONS[i.region]].filter(Boolean).join(' · '))}</span></span></button></li>`).join('');
  }
  resultList.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) focusItem(b.dataset.id); });

  function focusItem(id) {
    const m = markers.get(id);
    if (!m) return;
    if (!cluster.hasLayer(m)) cluster.addLayer(m);
    document.body.classList.remove('panel-open');
    if (map.getZoom() < 2 + zBias) map.setView(m.getLatLng(), 2 + zBias, { animate: false });
    cluster.zoomToShowLayer(m, () => { map.panTo(m.getLatLng()); select(id); });
  }

  // Settings: style + blip size
  function syncSeg(sel, attr, val) { document.querySelectorAll(`${sel} [data-${attr}]`).forEach((b) => b.setAttribute('aria-checked', String(b.dataset[attr] === val))); }
  // One button per permitted tile map from data/basemaps.js
  for (const tb of TILE_BASES) {
    const b = Object.assign(document.createElement('button'), { textContent: tb.name || tb.id, title: tb.attribution || '' });
    b.dataset.style = `tile:${tb.id}`;
    b.setAttribute('role', 'radio');
    $('#styleSeg').append(b);
  }
  if (TILE_BASES.length) $('#styleSeg').classList.add('wrap');
  $('#styleSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-style]');
    if (!b || b.disabled || b.dataset.style === store.style) return;
    const tb = tileBase(b.dataset.style);
    if (tb && !tileCalib(tb)) { startCalibration({ tile: tb }); return; }
    store.style = b.dataset.style;
    save();
    setBase(true);
  });
  function syncTileTools() {
    const tb = tileBase();
    $('#tileTools').hidden = !tb;
    if (tb) $('#tileToolsName').textContent = tb.name || tb.id;
  }
  $('#tileRealign').onclick = () => { const tb = tileBase(); if (tb) startCalibration({ tile: tb }); };
  $('#tileCopy').onclick = () => {
    const tb = tileBase();
    const T = tileCalib(tb);
    if (!T) return;
    const text = `calib: { T: [${T.map((v) => +v.toFixed(6)).join(', ')}] },`;
    (navigator.clipboard?.writeText(text) ?? Promise.reject()).then(
      () => feed('Alignment copied', `Paste it into the "${tb.id}" entry in data/basemaps.js.`, '#4fe39a', 4500),
      () => prompt('Copy this into data/basemaps.js', text));
  };
  const applySize = () => {
    document.body.classList.remove('blips-s', 'blips-m', 'blips-l');
    document.body.classList.add(`blips-${store.size}`);
    syncSeg('#sizeSeg', 'size', store.size);
  };
  $('#sizeSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) { store.size = b.dataset.size; save(); applySize(); } });

  // ------------------------------------------------------------- add pin
  let placing = false;
  let pendingPos = null;
  const pinDialog = $('#pinDialog');
  const pinCat = $('#pinCat');
  ['custom', ...CATEGORIES.map((c) => c.id)].forEach((id) => pinCat.add(new Option(CAT[id].name, id)));
  const setPlacing = (on) => {
    placing = on;
    document.body.classList.toggle('placing', on);
    $('#addPin').classList.toggle('active', on);
    if (on) { document.body.classList.remove('panel-open'); feed('Add pin', 'Click the map where it is. Esc cancels.', '#f4f1ea', 3500); }
  };
  $('#addPin').onclick = () => setPlacing(!placing);

  map.on('click', (e) => {
    if (calibrating) { calibClick(fromLL(e.latlng)); return; }
    if (!placing) { if (selectedId) select(null); return; }
    pendingPos = fromLL(e.latlng);
    const s = unproj(pendingPos.x, pendingPos.y);
    const near = nearestPlace(s.x, s.y);
    $('#pinWhere').textContent = near ? `Near ${placeName(near)}` : 'Custom location';
    $('#pinForm').reset();
    pinCat.value = 'custom';
    pinDialog.showModal();
  });
  pinDialog.addEventListener('close', () => {
    setPlacing(false);
    if (pinDialog.returnValue !== 'save' || !pendingPos) return;
    const fd = new FormData($('#pinForm'));
    const s = unproj(pendingPos.x, pendingPos.y);
    const raw = {
      id: `my-${Date.now().toString(36)}`, cat: fd.get('cat'),
      name: String(fd.get('name')).trim() || 'My pin', desc: String(fd.get('desc')).trim(),
      x: s.x, y: s.y, pos: aligned() ? { [store.style]: pendingPos } : undefined, at: nearestPlace(s.x, s.y),
    };
    store.custom.push(raw);
    save();
    const item = prepare({ ...raw, custom: true });
    items.push(item);
    byId.set(item.id, item);
    makeMarker(item);
    catOff.delete(item.cat);
    syncLegend();
    refreshCounts();
    applyFilters();
    select(item.id);
    feed('Pin added', item.name, CAT[item.cat].color);
    pendingPos = null;
  });

  // ------------------------------------------------------------- custom map image + calibration
  const ANCHORS = [
    ['port-gellhorn', 'Port Gellhorn', 'the town centre'],
    ['downtown', 'Downtown Vice City', 'the middle of the skyscraper district'],
    ['key-lento', 'Key Lento', 'the middle of the island'],
    ['mount-kalaga', 'Mount Kalaga', 'the summit'],
  ];
  let calibrating = false, calibPts = [], calibPrev = null, calibOverlay = null, calibSize = null;

  async function loadCustomImage() {
    try {
      const blob = await idb.get('basemap');
      if (!blob) return false;
      customURL = URL.createObjectURL(blob);
      return true;
    } catch { return false; }
  }
  function syncCustomButtons() {
    const has = !!(customURL && store.calib);
    $('#customStyleBtn').disabled = !has;
    $('#recalBtn').hidden = !customURL;
    $('#removeMapBtn').hidden = !customURL;
  }
  $('#loadMapBtn').onclick = () => $('#mapFile').click();
  $('#mapFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      await idb.set('basemap', f);
      if (customURL) URL.revokeObjectURL(customURL);
      customURL = URL.createObjectURL(f);
      startCalibration({ image: true });
    } catch (err) { feed('Could not load image', err.message, '#ff5a4e', 4000); }
  });
  $('#recalBtn').onclick = () => startCalibration({ image: true });
  $('#removeMapBtn').onclick = async () => {
    if (!confirm('Remove your map image and its alignment from this browser?')) return;
    try { await idb.del('basemap'); } catch { /* ignore */ }
    if (customURL) URL.revokeObjectURL(customURL);
    customURL = null;
    store.calib = null;
    delete store.mapOverrides.custom;
    if (store.style === 'custom') store.style = 'night';
    save();
    syncCustomButtons();
    setBase(true);
    feed('Map image removed');
  };

  // target: { image: true } for "My map", or { tile: <entry from basemaps.js> }
  let calibTarget = null;
  async function startCalibration(target) {
    if (target.image) {
      const img = new Image();
      img.src = customURL;
      try { await img.decode(); } catch { feed('That file is not an image we can read', '', '#ff5a4e'); return; }
      calibSize = { w: 1000, h: Math.round((1000 * img.naturalHeight) / img.naturalWidth) };
    }
    if (!calibrating) calibPrev = store.style;
    calibTarget = target;
    calibrating = true;
    calibPts = [];
    calibMarks.clearLayers();
    select(null);
    document.body.classList.add('calibrating');
    document.body.classList.remove('panel-open');
    cluster.clearLayers();
    labelLayer.clearLayers();
    if (wpMarker) map.removeLayer(wpMarker);
    if (overlay) { map.removeLayer(overlay); overlay = null; }
    if (calibOverlay) map.removeLayer(calibOverlay);
    affine = null;
    calibOverlay = baseLayer(target.tile ? `tile:${target.tile.id}` : 'custom').addTo(map);
    if (target.tile?.attribution) map.addControl(attribution); else map.removeControl(attribution);
    const b = spaceBounds();
    map.setMaxBounds(b.pad(0.2));
    map.fitBounds(b);
    syncZ();
    calibPrompt();
  }
  function calibPrompt() {
    const [, name, hint] = ANCHORS[calibPts.length];
    $('#calib .calib-step').textContent = `${calibPts.length + 1}/${ANCHORS.length}`;
    $('#calib .calib-text').innerHTML = `Click <b>${esc(name)}</b> on the ${calibTarget?.tile ? 'map' : 'image'}: ${esc(hint)}.`;
    $('#calibUndo').hidden = calibPts.length === 0;
    $('#calib').hidden = false;
  }
  $('#calibUndo').onclick = () => {
    calibPts.pop();
    const marks = calibMarks.getLayers();
    if (marks.length) calibMarks.removeLayer(marks[marks.length - 1]);
    calibPrompt();
  };
  function calibClick(p) {
    calibPts.push(p);
    L.circleMarker(toLL(p), { radius: 7, color: '#fff', weight: 2, fillColor: '#ff3f8e', fillOpacity: 1 }).addTo(calibMarks);
    if (calibPts.length < ANCHORS.length) { calibPrompt(); return; }
    const pairs = ANCHORS.map(([k], i) => [[PLACES[k][0], PLACES[k][1]], [calibPts[i].x, calibPts[i].y]]);
    const T = fitAffine(pairs);
    const wasTile = !!calibTarget.tile;
    if (wasTile) {
      store.tileCalib[calibTarget.tile.id] = { T };
      store.style = `tile:${calibTarget.tile.id}`;
    } else {
      store.calib = { T, h: calibSize.h };
      store.style = 'custom';
    }
    delete store.mapOverrides[store.style];
    save();
    endCalibration();
    feed('Map aligned', wasTile
      ? 'Pins are carried over from the schematic map. Settings > Copy alignment gives you the line for data/basemaps.js.'
      : 'Pins are carried over from the schematic map. Use Move on any pin to fine-tune it.', '#4fe39a', 5500);
  }
  const calibMarks = L.layerGroup().addTo(map);
  function endCalibration(cancelled = false) {
    calibrating = false;
    document.body.classList.remove('calibrating');
    $('#calib').hidden = true;
    calibMarks.clearLayers();
    if (calibOverlay) { map.removeLayer(calibOverlay); calibOverlay = null; }
    if (cancelled) store.style = calibPrev;
    calibTarget = null;
    syncCustomButtons();
    setBase(true);
  }
  $('#calibCancel').onclick = () => { endCalibration(true); feed('Alignment cancelled'); };

  // ------------------------------------------------------------- export / import / reset
  $('#exportBtn').onclick = () => {
    const data = { app: 'leonida-spotter', version: 3, exported: new Date().toISOString(), found: [...found], overrides: store.overrides, mapOverrides: store.mapOverrides, tileCalib: store.tileCalib, custom: store.custom, waypoint: store.waypoint, calib: store.calib };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `leonida-spotter-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.app !== 'leonida-spotter') throw new Error('not a Leonida Spotter file');
      (d.found || []).forEach((id) => found.add(id));
      Object.assign(store.overrides, d.overrides || {});
      const mo = { ...(d.mapOverrides || {}) };
      if (d.imgOverrides) mo.custom = { ...d.imgOverrides, ...mo.custom }; // v2 files
      for (const [k, v] of Object.entries(mo)) store.mapOverrides[k] = { ...store.mapOverrides[k], ...v };
      for (const [k, v] of Object.entries(d.tileCalib || {})) if (!store.tileCalib[k]) store.tileCalib[k] = v;
      if (d.calib && !store.calib) store.calib = d.calib;
      const have = new Set(store.custom.map((c) => c.id));
      (d.custom || []).filter((c) => c && c.id && !have.has(c.id)).forEach((c) => {
        if (c.img) { c.pos = { ...c.pos, custom: c.img }; delete c.img; }
        store.custom.push(c);
      });
      save();
      feed('Imported', 'Reloading…', '#4fe39a');
      setTimeout(() => location.reload(), 700);
    } catch (err) { feed('Import failed', err.message, '#ff5a4e', 4000); }
  });
  $('#resetBtn').onclick = () => {
    if (!confirm('Clear all "found" marks? Your custom pins and moved pins stay.')) return;
    found.clear();
    save();
    items.forEach(refreshIcon);
    refreshCounts();
    applyFilters();
    renderInfo();
    feed('Progress reset');
  };

  // ------------------------------------------------------------- HUD + keys
  $('#panelOpen').onclick = () => document.body.classList.add('panel-open');
  $('#panelClose').onclick = () => document.body.classList.remove('panel-open');

  const coords = $('#coords');
  map.on('mousemove', (e) => {
    const p = fromLL(e.latlng);
    if (p.x < 0 || p.y < 0 || p.x > SPACE.w || p.y > SPACE.h || calibrating) { coords.textContent = ''; return; }
    const s = unproj(p.x, p.y);
    const near = nearestPlace(s.x, s.y, 40);
    coords.textContent = near ? `${placeName(near)} · ${REGIONS[PLACES[near][4]] || ''}` : '';
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.querySelector('dialog[open]');
    if (e.key === 'Escape') {
      if (calibrating) return endCalibration(true);
      if (placing) return setPlacing(false);
      if (document.activeElement === $('#search')) return $('#search').blur();
      if (selectedId) return select(null);
      document.body.classList.remove('panel-open');
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === '/') { e.preventDefault(); setTab('map'); $('#search').focus(); }
    else if (k === '1') setTab('map');
    else if (k === '2') setTab('collections');
    else if (k === '3') setTab('settings');
    else if (k === 'a') setPlacing(!placing);
    else if (selectedId && k === 'f') act('found');
    else if (selectedId && k === 'w') act('waypoint');
    else if (selectedId && k === 'm') act('move');
  });

  function openFromHash() {
    const m = location.hash.match(/^#\/item\/(.+)$/);
    if (m && byId.has(decodeURIComponent(m[1]))) focusItem(decodeURIComponent(m[1]));
  }
  window.addEventListener('hashchange', openFromHash);

  // ------------------------------------------------------------- loader
  const TIPS = [
    'Meteorite chunks glow in the dark. Hunt them at night.',
    'Kenton at Island Dreams pays for every treasure you pull off the sea floor.',
    'Two Starlet Motel cards become unreachable after Chapter 2. Grab them early.',
    'Right-click anywhere on the map to drop a waypoint.',
    'Pawn shops buy collectible cards, and sold cards still count toward 100%.',
    'Alt-click a category in the index to show only that category.',
    'Pins come from community guides. If one is off, Move it and Export your fixes.',
  ];
  $('#loaderTip').innerHTML = `<b>TIP</b>${esc(TIPS[Math.floor(Math.random() * TIPS.length)])}`;
  const loadStart = performance.now();
  let loaderGone = false;
  function hideLoader() {
    if (loaderGone) return;
    loaderGone = true;
    const wait = Math.max(0, 900 - (performance.now() - loadStart));
    setTimeout(() => { $('#loader').classList.add('done'); setTimeout(() => $('#loader').remove(), 600); openFromHash(); }, wait);
  }
  $('#loader').addEventListener('click', hideLoader);
  setTimeout(hideLoader, 4000);

  // ------------------------------------------------------------- boot
  renderLegend();
  applySize();
  refreshCounts();
  (async () => {
    await loadCustomImage();
    syncCustomButtons();
    await setBase(true);
  })();
})();
