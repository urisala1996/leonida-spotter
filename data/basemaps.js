/*
 * Tiled base maps (optional).
 *
 * Add an entry here ONLY for a map you have permission to use: your own
 * tiles, a map with a licence that allows reuse, or one whose owner has said
 * yes in writing. Linking to someone else's tile server without permission
 * republishes their work, and gets fan sites taken down.
 *
 * Each entry shows up as a button under Settings > Map style.
 *
 *   id            short unique id (letters, numbers, dashes)
 *   name          button label
 *   url           tile URL template with {z}, {x}, {y} (and {s} if subdomains)
 *   attribution   credit line shown on the map (keep whatever the owner asks for)
 *   width, height full map size in pixels at tile zoom 0
 *                 (a single 256 px tile at zoom 0 = 256 x 256)
 *   tileSize      tile size in pixels (default 256)
 *   minZoom, maxZoom   zoom range the viewer may use
 *   maxNativeZoom      deepest zoom the server actually has tiles for
 *   tms           true if the server counts tile rows from the bottom
 *   subdomains    e.g. 'abc' when the url contains {s}
 *   calib         alignment for the pins, as { T: [a, b, c, d, e, f] }.
 *                 Leave it out at first: picking the map in Settings runs the
 *                 4-click alignment, and "Copy alignment" gives you this value
 *                 to paste here so every visitor gets aligned pins.
 *
 * Example (disabled):
 *
 * {
 *   id: 'example',
 *   name: 'Example tiles',
 *   url: 'https://tiles.example.com/leonida/{z}/{x}/{y}.png',
 *   attribution: 'Map tiles © Example, used with permission',
 *   width: 256, height: 256,
 *   minZoom: 0, maxZoom: 7, maxNativeZoom: 6,
 *   calib: { T: [0.256, 0, 0, 0, 0.256, 0] },
 * },
 */
(function (root) {
  const BASEMAPS = [
    // Add permitted tile maps here.
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = BASEMAPS;
  else root.LEONIDA_BASEMAPS = BASEMAPS;
})(typeof window !== 'undefined' ? window : globalThis);
