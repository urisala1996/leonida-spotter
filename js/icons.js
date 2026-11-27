/*
 * Original blip icon set for Leonida Spotter.
 * Each glyph is drawn in a 24x24 box using "#fff" as the ink colour; the
 * renderer swaps the ink for white or near-black depending on the blip colour
 * so it always has contrast. All shapes are original drawings.
 */
(function (root) {
  const G = {
    card: '<rect x="6" y="3" width="12" height="18" rx="2" fill="#fff"/><rect x="8" y="5" width="8" height="9" rx="1" fill="#000" fill-opacity=".35"/><rect x="8" y="16" width="8" height="2" rx="1" fill="#000" fill-opacity=".35"/>',
    car: '<path d="M3 15.6v-2.8l2.3-4.6A2.2 2.2 0 0 1 7.3 7h9.4a2.2 2.2 0 0 1 2 1.2l2.3 4.6v2.8a1 1 0 0 1-1 1h-1.2a2.4 2.4 0 0 1-4.6 0H9.8a2.4 2.4 0 0 1-4.6 0H4a1 1 0 0 1-1-1z" fill="#fff"/><path d="M6.8 12.2l1.5-3.2h7.4l1.5 3.2z" fill="#000" fill-opacity=".38"/>',
    anchor: '<g fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5.2" r="2.2"/><path d="M12 7.4V21M7.8 11h8.4M4.5 14a7.5 7.5 0 0 0 15 0"/></g>',
    meteor: '<path d="M2.5 3l7 5.5M5.8 2l5.4 6M2 6.8l5.2 3.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M14.4 8c3.4 0 6.2 2.6 6.2 6 0 3.7-3 6.8-6.6 6.8-3.6 0-6.2-2.7-6.2-6 0-3.8 3-6.8 6.6-6.8z" fill="#fff"/><circle cx="12.8" cy="13" r="1.5" fill="#000" fill-opacity=".38"/><circle cx="16.6" cy="16.6" r="1.2" fill="#000" fill-opacity=".38"/>',
    scan: '<path d="M3 8.6V5.3A2.3 2.3 0 0 1 5.3 3h3.3M15.4 3h3.3A2.3 2.3 0 0 1 21 5.3v3.3M21 15.4v3.3a2.3 2.3 0 0 1-2.3 2.3h-3.3M8.6 21H5.3A2.3 2.3 0 0 1 3 18.7v-3.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="4" fill="#fff"/>',
    egg: '<path d="M12 2.6c4 0 7.1 5.8 7.1 10.3A7.1 7.1 0 0 1 4.9 12.9C4.9 8.4 8 2.6 12 2.6z" fill="#fff"/><path d="M5.5 13.8l2.6-1.8 2.6 1.8 2.6-1.8 2.6 1.8 2.6-1.8" fill="none" stroke="#000" stroke-opacity=".38" stroke-width="1.7" stroke-linejoin="round"/>',
    key: '<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="7.6" cy="12" r="4.2"/><path d="M11.8 12H21.2M17.6 12v3.8M20.8 12v2.8"/></g>',
    crosshair: '<g fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round"><circle cx="12" cy="12" r="6.8"/><path d="M12 2v5.2M12 16.8V22M2 12h5.2M16.8 12H22"/></g><circle cx="12" cy="12" r="1.9" fill="#fff"/>',
    star: '<path d="M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.2l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z" fill="#fff"/>',
    dollar: '<path d="M16 8.2c-.6-1.4-2.2-2.3-4-2.3-2.2 0-3.9 1.2-3.9 3 0 4 8.1 2.2 8.1 6.3 0 1.9-1.8 3.2-4.2 3.2-2 0-3.6-1-4.3-2.4M12 3.4v17.2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
    pin: '<circle cx="12" cy="9.6" r="4.8" fill="#fff"/><path d="M12 14.4v7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
    ufo: '<ellipse cx="12" cy="13" rx="9.5" ry="3.6" fill="#fff"/><path d="M7.6 11.2a4.4 4.4 0 0 1 8.8 0z" fill="#fff"/><path d="M8 18.5l-1.5 3M16 18.5l1.5 3M12 18.8v2.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
    paw: '<ellipse cx="12" cy="16" rx="4.6" ry="3.8" fill="#fff"/><circle cx="6.2" cy="10.6" r="2" fill="#fff"/><circle cx="9.6" cy="6.8" r="2.1" fill="#fff"/><circle cx="14.4" cy="6.8" r="2.1" fill="#fff"/><circle cx="17.8" cy="10.6" r="2" fill="#fff"/>',
    foot: '<path d="M9.5 21c-2.6 0-4-2.2-3.6-5.4.4-3.3 1.5-6.8 4.3-6.8 2.6 0 3.2 3 2.7 6.3-.5 3.6-1.2 5.9-3.4 5.9z" fill="#fff"/><circle cx="12.5" cy="5.6" r="1.6" fill="#fff"/><circle cx="15.6" cy="6.8" r="1.4" fill="#fff"/><circle cx="17.8" cy="9.2" r="1.3" fill="#fff"/><circle cx="18.6" cy="12.2" r="1.2" fill="#fff"/>',
    ghost: '<path d="M5 21V10.5a7 7 0 0 1 14 0V21l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z" fill="#fff"/><circle cx="9.4" cy="11" r="1.4" fill="#000" fill-opacity=".45"/><circle cx="14.6" cy="11" r="1.4" fill="#000" fill-opacity=".45"/>',
    music: '<path d="M9 17.5V5.5l11-2.2v12" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/><circle cx="6.6" cy="17.6" r="2.8" fill="#fff"/><circle cx="17.6" cy="15.4" r="2.8" fill="#fff"/>',
    trophy: '<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#fff"/><path d="M7 5H3.8c0 3 1.4 4.6 3.6 4.9M17 5h3.2c0 3-1.4 4.6-3.6 4.9" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M10.6 13.2h2.8v3.6h-2.8zM7.6 17.6h8.8V21H7.6z" fill="#fff"/>',
    book: '<path d="M3 5.2c3-1.2 6-1 9 1 3-2 6-2.2 9-1v14c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z" fill="#fff"/><path d="M12 6.2v14" stroke="#000" stroke-opacity=".38" stroke-width="1.4"/>',
    bike: '<circle cx="6" cy="16" r="3.6" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="18" cy="16" r="3.6" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M6 16l4.4-6.6h4.2L18 16M9 9.4h3.4M14.6 9.4l1.6-3h2.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    plane: '<path d="M21 11.2v1.6l-7.6 1.4-1 6 2.4 1.4v1.2l-3-.8-3 .8v-1.2l2.4-1.4-1-6L3 12.8v-1.6l7.2-2.4V4a1.8 1.8 0 0 1 3.6 0v4.8z" fill="#fff"/>',
    tank: '<rect x="2.5" y="13" width="19" height="6" rx="3" fill="#fff"/><path d="M6 13l1.6-4h8.8l1.6 4z" fill="#fff"/><path d="M14 9.6h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
    waypoint: '<path d="M12 2.5l6.5 9.5L12 21.5 5.5 12z" fill="#fff"/><circle cx="12" cy="12" r="2.6" fill="#000" fill-opacity=".4"/>',
  };

  // Pick a more specific glyph for a few memorable entries.
  const KEYWORDS = [
    [/ufo|alien/i, 'ufo'], [/skunk ape|bigfoot/i, 'foot'], [/dog|poodle|labrador|parrot/i, 'paw'],
    [/ghost/i, 'ghost'], [/playlist|radio/i, 'music'], [/trophy|catch me|challenging tank|in the beginning|capital offense/i, 'trophy'],
    [/magazine|novel|makeup/i, 'book'], [/sanchez|chopper|avarus/i, 'bike'], [/jet 015a/i, 'plane'], [/rhino/i, 'tank'],
  ];
  function glyphFor(item, cat) {
    if (item.icon && G[item.icon]) return item.icon;
    const text = `${item.name} ${item.sub || ''}`;
    for (const [re, g] of KEYWORDS) if (re.test(text)) return g;
    return cat.glyph;
  }

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const inkFor = (hex) => (luminance(hex) > 0.42 ? '#10131c' : '#ffffff');
  const glyphSVG = (name, ink) => (G[name] || G.star).replaceAll('#fff', ink);

  // Round blip with a dark rim.
  function blipSVG(color, glyph, size = 30) {
    const ink = inkFor(color);
    return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="#05070c" stroke-width="2.4"/>
      <circle cx="16" cy="16" r="11.6" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>
      <g transform="translate(7 7) scale(.75)">${glyphSVG(glyph, ink)}</g></svg>`;
  }

  root.LEONIDA_ICONS = { GLYPHS: G, glyphFor, blipSVG, glyphSVG, inkFor };
})(window);
