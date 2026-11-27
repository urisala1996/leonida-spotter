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
    {
      // State of Leonida's GTA VI map, used with the site owners' permission.
      id: 'sol',
      name: 'Leonida',
      url: 'https://map.stateofleonida.net/tiles/gtavi/day/{z}/{x}/{y}.png',
      attribution: 'Map tiles: State of Leonida',
      // 34000 x 44000 px at native zoom 6 -> 531.25 x 687.5 at zoom 0
      width: 531.25, height: 687.5,
      minZoom: -1, maxZoom: 8, minNativeZoom: 0, maxNativeZoom: 6,
      default: true,
      // Alignment done on the live site: 24 anchor places clicked on the real map.
      calib: {
        T: [0.26048, 0.019523, 124.25785, -0.049575, 0.396947, 81.470086],
        pts: [
          ['port-gellhorn', 181.53, 276.2], ['downtown', 368.99, 390.54], ['key-lento', 283.87, 543.39], ['mount-kalaga', 239.68, 150.53],
          ['vcia', 285.5, 382.99], ['ocean-beach', 441.13, 357.25], ['hamlet', 294.56, 478.43], ['lake-leonida', 314.13, 225.93],
          ['ambrosia', 289, 244.96], ['belville', 331.5, 286.94], ['millport', 350.75, 173.72], ['capri', 158.5, 367.71],
          ['watson-bay', 217.63, 477.62], ['grayson', 205.5, 158.99], ['bonanza', 250.69, 110.37], ['moreau', 272, 127.46],
          ['waning-sands', 374.75, 237.47], ['manifest-canyon', 207, 212.94], ['draper-island', 142, 214.94], ['abismo', 237, 600.83],
          ['southwind', 176, 577.83], ['little-hardin', 394, 184.91], ['hyde-island', 296, 94.93], ['featherstone', 202, 124.93],
        ],
      },
    },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = BASEMAPS;
  else root.LEONIDA_BASEMAPS = BASEMAPS;
})(typeof window !== 'undefined' ? window : globalThis);
