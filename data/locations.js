/*
 * Leonida Spotter: location database.
 *
 * Every entry was compiled from public, fan-written guides published in the
 * first weeks after launch (see SOURCES). Descriptions are paraphrased.
 * Pin positions are placed by hand from those written descriptions onto our
 * schematic map, so they show "roughly where", not exact in-game spots.
 *
 * Fields:
 *   cat    category id (see CATEGORIES)
 *   name   display name
 *   at     place key from data/places.js (the pin goes there)
 *   desc   how to find it
 *   sub    sub-type (card set, scan type...)
 *   req    requirements (tools, chapter, time of day)
 *   reward what you get
 *   src    source keys
 *   conflict  text noting where sources disagree
 *   conf   'guess' when the place itself is not on our map yet
 *   d      [dx, dy] manual nudge in map units
 */
(function (root) {
  const SOURCES = {
    xtreme: { label: 'GTA Xtreme: collectible cards', url: 'https://www.gta-xtreme.com/en/gta-6-collectible-card-locations' },
    biglead: { label: 'The Big Lead: collectibles guide', url: 'https://www.thebiglead.com/gta-6-collectibles-guide-cards-styles-meteorite-chunks-landmark-scans/' },
    detonated: { label: 'Detonated: best car locations', url: 'https://detonated.com/gta-6-best-car-locations/' },
    tbm: { label: 'TheBestMods: hidden cars', url: 'https://thebestmods.com/gta-6/hidden-cars/' },
    sportskeeda: { label: 'Sportskeeda: container cars', url: 'https://www.sportskeeda.com/gta/all-hidden-cars-shipping-containers-gta-6-find' },
    ol: { label: 'Open Leonida: easter eggs & secrets', url: 'https://openleonida.com/guides/gta-vi-easter-eggs-secrets/' },
    gz: { label: 'GTA Zone: easter eggs', url: 'https://gta-zone.com/news/gta-6-easter-eggs/' },
    gtaboom: { label: 'GTABoom: treasure diving', url: 'https://www.gtaboom.com/gta-6-treasure-hunting-2b73' },
    bo3: { label: 'bo3.gg: Kenton’s treasures', url: 'https://bo3.gg/games/articles/gta-6-underwater-discoveries-all-kentons-treasure-locations-and-shipwrecks' },
    gtabase: { label: 'GTABase: interactive map', url: 'https://www.gtabase.com/gta-6/map/?feature=treasure' },
    gtaboss: { label: 'GTABoss: collectible sets', url: 'https://www.gtaboss.gg/gta-6/collectibles' },
    search: { label: 'Web search summary (original page not confirmed)', url: null },
    cardhunt: { label: 'Card Hunt GTA: card tracker', url: 'https://cardhuntgta.com/' },
    boomcards: { label: 'GTABoom: card locations', url: 'https://www.gtaboom.com/gta-6-collectible-card-locations-bbf1' },
    gc: { label: 'Game Checklists: WAiNK scans', url: 'https://game-checklists.com/gta6/waink-scans-checklist/' },
    pg: { label: 'Pro-Gamer: WAiNK guide', url: 'https://pro-gamer.gg/gta-6-waink-locations-guide-all-31-landmarks-35-curiosities-you-wainker-trophy/' },
    gcm: { label: 'GTA 6 Collectibles Map: WAiNK', url: 'https://gta6collectiblesmap.com/articles/gta-6-waink-scans' },
    pat: { label: 'GTA6Pat: meteorite chunks', url: 'https://gta6pat.com/collectibles/meteorite-chunks-locations/' },
    powerup: { label: 'Power Up Gaming: meteorite routes', url: 'https://powerupgaming.co.uk/2026/11/23/gta-6-meteorite-chunk-locations-best-night-routes-for-glows/' },
    redbull: { label: 'Red Bull: GTA 6 easter eggs', url: 'https://www.redbull.com/us-en/gta-6-easter-eggs' },
    gvg: { label: 'GTA Vice Guides: easter eggs', url: 'https://gtaviceguides.com/guides/gta-6-easter-eggs/' },
    showgamer: { label: 'Showgamer: secret locations', url: 'https://showgamer.com/en/guides/8037-vse-sekretnye-mesta-v-gta-6-gde-nayti-nlo-tayniki-i-pashalki' },
  };

  // Icon glyphs are drawn in a 24x24 box, white on the category colour.
  const CATEGORIES = [
    { id: 'cards', name: 'Collectible Cards', color: '#ffd23f', glyph: 'card', blurb: '480 cards in 18 sets. Pawn shops buy them.' },
    { id: 'vehicles', name: 'Hidden & Rare Vehicles', color: '#ff4f8b', glyph: 'car', blurb: 'Unique liveries, supercars and container finds.' },
    { id: 'treasure', name: "Kenton's Treasures", color: '#2ec4b6', glyph: 'anchor', blurb: 'Sunken wrecks. Kenton pays $200 per treasure.' },
    { id: 'meteorite', name: 'Meteorite Chunks', color: '#b388ff', glyph: 'meteor', blurb: 'They glow at night. Sell at pawn shops.' },
    { id: 'waink', name: 'WAiNK Scans', color: '#3ab7ff', glyph: 'scan', blurb: 'Landmarks, curiosities and sculptures to scan.' },
    { id: 'easter', name: 'Easter Eggs & Secrets', color: '#7bd389', glyph: 'egg', blurb: 'Bigfoot, UFOs, movie nods, hidden trophies.' },
    { id: 'quests', name: 'Secret Quests', color: '#ff9f43', glyph: 'key', blurb: 'Multi-step hidden questlines and where they start.' },
    { id: 'weapons', name: 'Unique Weapons', color: '#ff5a4e', glyph: 'crosshair', blurb: 'One-off guns and blades.' },
    { id: 'misc', name: 'Other Collectibles', color: '#f4e3b1', glyph: 'star', blurb: 'Magazines, makeup, flamingos, dogs, playlists.' },
    { id: 'vendors', name: 'Shops & Contacts', color: '#9fb3c8', glyph: 'dollar', blurb: 'Where to sell loot and register cars.' },
  ];

  const items = [];
  const add = (cat, name, at, desc, o = {}) => items.push({ cat, name, at, desc, ...o });

  // =================================================================
  // COLLECTIBLE CARDS
  // =================================================================
  const card = (set, name, at, desc, src, o = {}) => add('cards', name, at, desc, { sub: set, src: [src], ...o });

  // Vice City Flamingos
  card('Vice City Flamingos', 'Julian Cruz (Gold)', 'yasmani', "Building directly south of Yasmani's shop. Small office on its north side, on the board.", 'xtreme', { d: [2, 8] });
  card('Vice City Flamingos', 'Mateo Caballero (Silver)', 'zenon-pawn', "House directly north of Zenon's Pawn Shop, in the bedroom.", 'xtreme', { d: [0, -8] });
  card('Vice City Flamingos', 'Ulysses Whitlock (Silver)', 'grand-majestic', 'Building with a rooftop helipad east of Grand Majestic Gym. Take the elevator up, then the spiral stairs on the roof.', 'xtreme', { d: [8, 0] });
  card('Vice City Flamingos', 'Sammy Wordsworth', 'port-gellhorn', "Garage behind Sarena's Bargain Store.", 'biglead', { d: [4, 10] });
  card('Vice City Flamingos', 'Charlie Spears', 'gellhorn-speedway', 'Locked box in the upstairs storage of the restricted building by the helipad next to Gellhorn Speedway.', 'biglead', { d: [8, -4] });
  // Vice City Narcos
  card('Vice City Narcos', 'Kyle Lewicki', 'dynamix', 'Dynamix Fitness, rear corridor, on the bench.', 'xtreme');
  card('Vice City Narcos', 'Carl Kasey', 'kl-pns', "Courtyard by the building next to the Key Lento Pay 'n' Spray, near a rucksack and bench.", 'biglead', { d: [2, 7] });
  card('Vice City Narcos', 'Nicky Mcvee (Silver)', 'watson-bay', 'In the fridge of a small house south-west of Top Fun Drones.', 'biglead', { d: [-6, 6] });
  // Vice City Manatees
  card('Vice City Manatees', 'Delord Nathan Alford', 'belville-strip', 'Abandoned shopping strip south of The Thirsty Wolf. Roof hatch into the laundromat, back-room shelf next to the dog.', 'xtreme');
  card('Vice City Manatees', 'Tusi Taufua', 'grand-majestic', 'Inside Grand Majestic Gym, far side of the gym floor in the kitchen area.', 'xtreme');
  card('Vice City Manatees', 'Makeek River (Gold)', 'vb-south', 'Garage at the southern tip of Vice Beach behind pallets. The safe inside needs explosives.', 'biglead');
  // Vice City Club de Futbol
  card('Vice City Club de Futbol', 'Ayokunumi Kasimu', 'roval-jewelry', 'Enterable building west of Roval Jewelry. Yellow SCOOP container on its north side.', 'xtreme', { req: 'Cut-Off Tool', d: [-6, -3] });
  card('Vice City Club de Futbol', 'Ian Harris (Silver)', 'ocean-view', 'Beach east of the Ocean View rooftop bar, on the orange lifeguard stand.', 'xtreme', { d: [8, 0] });
  card('Vice City Club de Futbol', 'Ian Harris (Pink)', 'ocean-beach', 'Square apartment block south-west of the WHS shoe store, top-floor apartment in the south-east corner.', 'xtreme', { d: [-4, 6] });
  card('Vice City Club de Futbol', 'Badge (Silver)', 'mount-kalaga', 'Hut near the summit of Mount Kalaga. Climb the ladder to the upper level.', 'xtreme');
  card('Vice City Club de Futbol', 'Lupin de Juarez', 'rusty-anchor', 'Trailer just east of The Rusty Anchor.', 'biglead', { d: [7, 0] });
  // Liberty City Swingers
  card('Liberty City Swingers', 'Garth Buxton', 'celerica', 'Celerica warehouse east of Brilliant Cuts. Wall phone box at the back.', 'xtreme', { d: [6, 0] });
  card('Liberty City Swingers', 'Seo-Jun Kim', 'ob-baseball', 'Baseball stands in the north-west of the park, at the top of the tall staircase.', 'xtreme', { d: [-3, -5] });
  card('Liberty City Swingers', 'Lalo Velasco (Gold)', 'capri-beach', 'First house east of Capri beach, on the garage shelf.', 'xtreme', { d: [6, 0] });
  card('Liberty City Swingers', 'Juan Carlos Garcia', 'kl-mid', 'In a box inside a garage in mid Key Lento.', 'biglead', { d: [-8, 2] });
  card('Liberty City Swingers', 'Nest card', 'shoeless-keys', 'In a bird nest on the roof of the Grassrivers Visitor Center (by the Grassrivers Cafe and Deli on Old Fort Rd).', 'search', { d: [6, -4], conf: 'guess' });
  // Liberty City Penetrators
  card('Liberty City Penetrators', 'Alexander Avain (Silver)', 'jack-of-hearts', 'Third-floor apartment above the Kitty Litter lab, west of Jack of Hearts.', 'xtreme', { d: [-6, -3] });
  card('Liberty City Penetrators', 'Alexander Avain (Blue)', 'hamlet', 'LTD Food Mart in Hamlet, back room past the shop floor.', 'xtreme', { d: [4, 4] });
  card('Liberty City Penetrators', 'Remy Herbert (Silver)', 'fast-cash', 'Apartment building east of Fast Cash, the accessible second-floor apartment.', 'xtreme', { d: [6, 0] });
  card('Liberty City Penetrators', 'Remy Herbert (Bright Orange)', 'shrimp-save', "Basketball court south of Shrimp & Save, near a rucksack.", 'biglead', { d: [0, 6] });
  card('Liberty City Penetrators', 'Rion Yapa (Silver)', 'down-town-pawn', 'Garages under the highway west of Down Town Pawn. The garage full of shoe boxes.', 'xtreme', { d: [-8, 0] });
  card('Liberty City Penetrators', 'Demario Richardson (Gold)', 'bucks-pawn', "Buck's Jewelry & Pawn, back-room shelf.", 'xtreme');
  card('Liberty City Penetrators', "D'Angelou Miles", 'rusty-anchor', 'Box inside the rectangular enterable building directly south of The Rusty Anchor.', 'biglead', { d: [0, 7] });
  // Liberty City Wrath
  card('Liberty City Wrath', 'Alvin Orlowski', 'drip-drops', 'Top-floor apartment in the building east of the clothing shop next to Drip Drops.', 'xtreme', { d: [7, 0] });
  card('Liberty City Wrath', 'Anthony Poke II (Red)', 'oldby', 'Ajax Gym on Oldby Island. Behind the treadmills, through the door, on the board in the upper hallway.', 'xtreme');
  card('Liberty City Wrath', 'Robbie Stine (Silver)', 'west-kalaga', 'Building with a smokestack south of the 24/7 gas station. Ladder up to the office.', 'xtreme', { d: [0, 7] });
  card('Liberty City Wrath', 'Dartanyon Pearson', 'kl-n', 'On the fireplace of a house in north-middle Key Lento (break in).', 'biglead', { d: [4, 2] });
  // Los Santos Corkers
  card('Los Santos Corkers', 'Aoi Watanabe', 'peacock-bay', 'Mall roof, tower on the north-west side.', 'xtreme', { d: [-4, -5] });
  card('Los Santos Corkers', 'Victor Maravilla', 'starlet-motel', 'Starlet Motel kitchen, on top of the refrigerator.', 'xtreme', { req: 'Missable: get it before the end of Chapter 2' });
  card('Los Santos Corkers', 'Franklin Turner (Bronze)', 'belville-north', "Garage of the westernmost house in the northern row west of Andy's home, on the counter.", 'xtreme', { d: [-10, 0] });
  card('Los Santos Corkers', 'Carlos Larios (Bronze)', 'ob-baseball', 'Western dugout of the baseball park. Check the ground.', 'xtreme', { d: [-5, 4] });
  // Los Santos Panic
  card('Los Santos Panic', 'Marquise Bernard', 'kenton', "In a barrel just outside Kenton's Island Dreams dive shop.", 'xtreme', { d: [-4, 4] });
  card('Los Santos Panic', 'Nikkander Orlov (Silver)', 'watson-bay', 'House on the eastern edge of Watson Bay. Shelf in the covered area beside it.', 'xtreme', { d: [10, 0] });
  card('Los Santos Panic', 'Terrance Ericks (Bronze)', 'aunt-zola', "Locked building north-west of Aunt Zola's Soul Food.", 'xtreme', { d: [-6, -4] });
  card('Los Santos Panic', 'Terrance Ericks (Silver)', 'roval-jewelry', 'Empty building west of Roval Jewelry, office in the south-east corner.', 'xtreme', { d: [-6, 4] });
  card('Los Santos Panic', 'Santiago Lopez', 'kl-safehouse', 'Trailer just west of the first safehouse.', 'biglead', { d: [-7, 0] });
  // Los Santos Pounders
  card('Los Santos Pounders', 'Sione Apa (Red)', 'vice-seven', 'Gym at Vice Seven Condominiums, changing room on the south side.', 'xtreme');
  card('Los Santos Pounders', 'Maximus Goldbart (Yellow)', 'waning-sands', "Garage of the villa east of the Pay 'n' Spray.", 'xtreme', { d: [6, 2] });
  card('Los Santos Pounders', 'Laki Maivia (Bronze)', 'cottonmouth', 'Safe inside the trailer south-west of the lake. Combination reported as 44017 (clue on the wall photos).', 'xtreme', { d: [-20, 8] });
  card('Los Santos Pounders', 'Lionel Taber', 'kl-se', 'Garage of the party house in the south-east corner of Key Lento. Keypad code 092319 also opens it.', 'biglead', { d: [-4, 0] });
  // Backyard Wrestling
  card('Backyard Wrestling', 'J.D. Wild', 'grayson', "Houses just north of the Pay 'n' Spray. Yellow box on a rear deck.", 'xtreme', { d: [0, -6] });
  card('Backyard Wrestling', 'J.D. Wild (alt. spot)', 'manatee-motel', 'Shack north-east of the Manatee Motel Kingfishers spot, inside the severed alligator head.', 'xtreme', { d: [8, -6] });
  card('Backyard Wrestling', 'Shovel', 'wild-hog-point', 'Trailer on the tip of Wild Hog Point.', 'biglead', { d: [-6, 0] });
  card('Backyard Wrestling', 'Blood Smith', 'manifest-canyon', 'Top of the treehouse-like structure in south-middle Manifest Canyon.', 'biglead', { d: [0, 8] });
  // America's Next Top Hooker
  card("America's Next Top Hooker", 'Kalvyn', 'big-house-storage', 'Roof of Big House Storage Inc. Small phone box beside the stairwell door.', 'xtreme');
  card("America's Next Top Hooker", 'Kalvyn (alt. spot)', 'roval-jewelry', 'Enterable building west of Roval Jewelry, yellow box on its north side.', 'xtreme', { d: [-10, -6] });
  card("America's Next Top Hooker", 'Chastity', 'stockyard-speedshop', 'Robot-filled neon garage north-east of Stockyard Speedshop. Table at the back.', 'xtreme', { d: [6, -5] });
  card("America's Next Top Hooker", 'Kalisha (Silver)', 'bonanza', 'Walk to the end of the dock south-west of Bonanza.', 'xtreme', { d: [-14, 14] });
  card("America's Next Top Hooker", 'Drake Silver', 'kl-pns', "Small island east of the Key Lento Pay 'n' Spray, by a tent and deck chair.", 'biglead', { d: [40, 20] });
  card("America's Next Top Hooker", 'Drake (Gold)', 'macalister', 'Burnt-out hut east of MacAlister Gold Mine.', 'biglead', { d: [14, 0] });
  // Delights Dancers
  card('Delights Dancers', 'Vicki', 'starlet-motel', 'Starlet Motel office bathroom, on the floor beside the toilet.', 'xtreme', { req: 'Missable: get it before the end of Chapter 2', d: [5, 4] });
  card('Delights Dancers', 'Harley', 'delights', 'Delights club, small booth on the east wall.', 'xtreme', { d: [3, -3] });
  card('Delights Dancers', 'Amber', 'draper-island', 'Southern edge near the road guard posts. Yellow phone box on the north wall of a nearby building.', 'xtreme', { d: [0, 24] });
  card('Delights Dancers', 'Amber (alt. spot)', 'cafe-orquidea', 'Roof of the building two west of Cafe Orquidea. Yellow box on the next roof east.', 'xtreme', { d: [-5, 0] });
  card('Delights Dancers', 'Tracy', 'east-salton', 'Rooftop room up a ladder, in a building east of the Hit n Run VC race start in Salton.', 'xtreme', { conflict: 'The Big Lead puts Tracy on the top floor of the water & sewage plant in East Salton.' });
  card('Delights Dancers', 'Nevaeh', 'bonanza', 'Building hanging over a cliff south of Bonanza.', 'xtreme', { d: [4, 22] });
  card('Delights Dancers', 'Thelma', 'badger-tower', 'Control room one floor below the top of the mid-Key Lento tower.', 'biglead', { d: [0, -5] });
  card('Delights Dancers', 'Daisy', 'badger-tower', 'Roof of the smaller building next to the Badger R&D Tower.', 'biglead', { d: [-6, 3], conflict: 'Card Hunt places Daisy in the back kitchenette of the Xero gas station in La Perle.' });
  // Jack of Hearts Dancers
  card('Jack of Hearts Dancers', 'Kadisha (Pink)', 'pawn-city', 'Enterable trailer south-west of Pawn City, mattress on the floor.', 'xtreme', { d: [-6, 6] });
  card('Jack of Hearts Dancers', 'Kelly (Purple)', 'vice-seven', 'Climb onto the containers west of the two C-shaped motel blocks, west of Vice Seven Condominiums.', 'xtreme', { d: [-12, 2] });
  card('Jack of Hearts Dancers', 'Christel (Red)', 'la-perle', "South-west part of the roof of Tyrone's apartment building.", 'xtreme', { d: [-6, 6] });
  card('Jack of Hearts Dancers', 'Brianna Blue (Red)', 'gullet-marsh', 'Square building on the north side of a small built-up island at the western edge of Gullet Marsh. On a shelf.', 'xtreme', { d: [-20, -4] });
  card('Jack of Hearts Dancers', 'Brianna Blue (Purple)', 'capri-south', 'Back room of the gas station in south Capri.', 'biglead');
  card('Jack of Hearts Dancers', 'Malena (Red)', 'belville-north', "Rearmost bedroom desk of a breakable house in the northern row west of Andy's home.", 'xtreme', { d: [-4, -4] });
  card('Jack of Hearts Dancers', 'Lexi Campbell (Gold)', 'pg-drive-in', "Storage room of the drive-in theatre north of the Pay 'n' Spray.", 'biglead');
  // NINE1NINE Dancers
  card('NINE1NINE Dancers', 'Serena (Gold)', 'peacock-estates', 'Garage of the southernmost estate.', 'xtreme', { d: [0, 8] });
  card('NINE1NINE Dancers', 'Georgia (Purple)', 'kl-pns', "Back room of the building next to the Key Lento Pay 'n' Spray.", 'biglead', { d: [4, -4] });
  // The Legends of Ratface
  card('The Legends of Ratface', 'Illuminaughty (Purple)', 'belville-north', "Garage of a northern-row house west of Andy's home, on the board to the right.", 'xtreme', { d: [4, -6] });
  card('The Legends of Ratface', 'Captain Kreuks (Blue)', 'twa-ponya', 'Top floor of the construction building north of TWA Ponya Tattoo.', 'xtreme', { d: [0, -6] });
  card('The Legends of Ratface', 'The Ratster (Purple)', 'buckskin-swamp', 'Top of the central watchtower, on the railing between the binoculars.', 'xtreme');
  card('The Legends of Ratface', 'Wokester (Blue)', 'wonder-whale', 'Bench on the north-east side of The Wonder Whale clothes shop.', 'xtreme', { d: [4, -3] });
  // Right Wing: America's Hero
  card("Right Wing: America's Hero", 'Flamer (Red)', 'grayson', 'Williams Guest House, shelf on the upper walkway.', 'xtreme', { d: [-6, 6] });
  card("Right Wing: America's Hero", 'Flamer (White)', 'watson-bay', 'Campground bathroom building on the eastern edge, board on its outside wall.', 'xtreme', { d: [18, -6] });
  card("Right Wing: America's Hero", 'Right Wing (Red)', 'bayside-apts', 'Bayside Apartments ground-floor lobby, small table in the pool-toy room.', 'xtreme');
  card("Right Wing: America's Hero", "America's Hero (Red)", 'funfair', 'On a bumper car in the abandoned funfair.', 'biglead', { d: [4, 6] });
  // ED Comics Universe
  card('ED Comics Universe', 'Side Effect (Blue)', 'dunks-trailer', "Trailer cluster north-west of Dunk's Trailer, bedroom of the middle trailer.", 'xtreme', { d: [-6, -4] });
  card('ED Comics Universe', 'Dr. Placebo (Blue)', 'la-perle-pns', "Ground-floor shelf in the building south-west of the Pay 'n' Spray.", 'xtreme', { d: [-6, 5] });
  card('ED Comics Universe', 'Femi-Nemesis (Silver)', 'pawn-city', 'Trailer south-west of Pawn City, on the dresser.', 'xtreme', { d: [-10, 2] });
  card('ED Comics Universe', 'Ratface (Bronze)', 'la-perle-pns', "Large warehouse immediately west of the Pay 'n' Spray, couch against the south wall.", 'xtreme', { d: [-8, -1] });
  card('ED Comics Universe', 'Funny Bones (Orange)', 'pg-north', 'Top of the water tower in north Port Gellhorn.', 'biglead');
  // Unknown set / other cards
  card('Unknown set', 'Bryson Powers (Rookie)', 'starlet-motel', 'Laundry room of the Chapter 2 motel.', 'biglead', { d: [-5, 5] });
  card('Backyard Wrestling', 'Danny McLean', 'badger-tower', 'Yellow phone box on the balcony of the Badger R&D Tower, next to the SM-69 sniper rifle.', 'search', { d: [5, -6], conflict: 'Card Hunt lists the main spot as under a red house on the northern island at Watson Bay; this is its alternate.' });

  // =================================================================
  // HIDDEN & RARE VEHICLES
  // =================================================================
  const car = (name, at, desc, src, o = {}) => add('vehicles', name, at, desc, { src: Array.isArray(src) ? src : [src], ...o });
  car('Solid Gold Lamborghini Aventador', 'crimsonpalms', 'Under a balcony at Crimsonpalms Condominiums, off Washington Island near the beach.', 'detonated');
  car('Grotti Itali RSX (kitted)', 'rialto', 'In a garage on Rialto Island.', 'detonated', { req: 'Cloned key' });
  car('Royal Ruby Emerus', 'vespucci', 'Patio garage behind a hedge. Guards at the front gate, so sneak in. Has nitrous; worth about $33,000.', ['detonated', 'tbm'], { d: [6, 2], conflict: 'TheBestMods says a mansion garage on Neptune Circle.' });
  car("Paul Walker's car", 'vespucci', 'Break into the villa, through to the garage, smash the window and hotwire it. Open the trunk for a surprise.', ['detonated', 'ol', 'gz', 'tbm'], { d: [-6, -2], conflict: "Detonated / Open Leonida call it a '95 Eclipse; TheBestMods lists a Penumbra FF at Neptune Circle." });
  car('Gold Pegassi Charred Torus', 'casanova', 'Estate garage in the house at the bottom-centre of Casanova Island.', ['detonated', 'search'], { d: [0, 4] });
  car('Leopard-print supercar', 'starfish', 'In front of the house in the top-right of Starfish Island. The garage to its right often has two Lamborghinis.', 'detonated', { d: [6, -3] });
  car('Anime-livery Nissan Skyline', 'starfish', 'House garage on West Starfish Island. Exclusive livery.', 'detonated', { d: [-7, 1] });
  car('Purple Nitrous McLaren', 'waxman', 'Chatfield Storage and Logistics crime location on Waxman Island.', 'detonated');
  car('Brimstone Golfer (flaming golf cart)', 'denmarch', 'Mansion garage on Penmarch Isle. No security.', 'tbm', { conflict: 'Listed as "Penmarch Isle"; the map label reads Denmarch Isle.' });
  car("'Need for Speed' tribute car", 'peacock-estates', 'Through the garage side door at Peacock Estates.', ['detonated', 'search'], { req: 'Cloned key', d: [-8, -2] });
  car('Custom orange Mercedes-style car', 'casa-guardia', 'At the back of the Casa Guardia crime location.', 'detonated');
  car('Custom pink lowrider', 'jakjak', "JakJak's Garage, a San4San gang location.", 'detonated');
  car('Gold Rolls-Royce', 'san4san-studio', 'Middle of the garage at the San4San Studio location. Clear it first. Sells for about $25k.', 'detonated', { conf: 'guess' });
  car('Charred Toros (black & yellow Urus)', 'la-perle', 'Driveway of the La Perle (trap) house. No tracker; registration about $14,000.', ['detonated', 'tbm'], { d: [6, -6] });
  car('Black & red Firebird', 'slater-towing', 'In a garage at the Slater Towing Inc robbery opportunity.', 'detonated');
  car('Canis Gunrunner Kamacho', 'leonida-carrier', 'Clear the Leonida Carrier Warehouse; the truck is in the back garage. Register at a Pay n Spray for $9,000.', ['detonated', 'search']);
  car('Dundreary Cherry Bomb Chino', 'saber-shipping', 'Parked inside the Saber Shipping Facility compound. Infiltrate it.', 'detonated');
  car('Purple Drank Emerus', 'port-vc', 'Shipping-yard robbery opportunity. Guarded; has nitrous.', 'tbm', { req: 'Chapter 3', conf: 'guess' });
  car('Pink Porsche', 'bayside-apts', 'Take the pink book in the Bayside apartment, check the dog picture by the kitchen, use the laptop, then read the Unknown Contact text for a garage code and location.', 'detonated', { req: 'Chapter 3', d: [-6, 4] });
  car('Blue Banshee (Capital Offense)', 'vc-showroom', 'Drive the blue Banshee out through the showroom window in south Vice City. Unlocks a hidden trophy.', 'ol', { req: 'Chapter 3' });
  car('Passenger jet 015A (Catch Me If You Can)', 'vcia', 'Steal the jet from a boarding bridge at VCIA and fly it away for a hidden trophy.', 'ol', { d: [-4, -8] });
  car('Nitrous muscle car', 'kl-n', "Parked on the street near Jason's house. Respray it, then park it at Jason's place to keep it.", 'detonated', { d: [-20, 8] });
  car('Invetero Spiderweb Coquette', 'kl-se', 'Garage of the party house in the south-east corner of Key Lento. Keypad code 092319.', 'biglead', { d: [6, 2] });
  car('Raita (Wyman car)', 'kl-n', 'North-middle Key Lento. Counts toward Wyman’s car collection.', 'biglead', { d: [-8, -2] });
  car('Pizza-topped delivery van', 'cousin-carlo', "Out front of Cousin Carlo's, east of Coastal Auto Care.", 'biglead');
  car('Nagasaki Rudolph Tao', 'kl-fleeca', 'Outside the Christmas house west of the Key Lento Fleeca Bank.', 'biglead', { d: [-8, -2] });
  car('Bravado Tropic Dawn Youga', 'kl-ammu', 'Dark-blue fish-decorated building south of Ammu-Nation.', 'biglead', { d: [0, 6] });
  car('Rhino tank (Challenging Tank)', 'mile-zero', 'Take the Rhino from Mile Zero Air Station and use it against enemies for a hidden trophy.', 'ol');
  car('Custom drift Nissan Skyline / Drifter Elegy', 'gellhorn-speedway', 'Side door, through the offices, into the garage at Gellhorn Speedway. Register with Moses for about $14k.', ['detonated', 'tbm', 'search'], { req: 'Has a tracker' });
  car('Firebug Dominator', 'la-cascara', 'La Cascara Motel, guarded by the Kolts gang. No tracker.', 'tbm');
  car("Dom's Charger", 'pg-north', 'North of Port Gellhorn, next to a locked RV trailer.', 'detonated', { d: [6, -12] });
  car('Ghosts Exposed (Ecto-1 tribute)', 'halloween-house', 'Driveway of the Halloween-decorated house in Capri.', 'detonated', { d: [4, 3] });
  car('Annis Pixel Elegy', 'capri-yard', 'Inside a shipping container at the Capri Construction Yard. Move the stacked containers with a telehandler, then cut the lock.', ['sportskeeda', 'search'], { req: 'Telehandler + Cut-Off Tool' });
  car('Reynolds kit car (Wyman car)', 'capri-nw', 'Garage on the north-west finger of Capri.', 'biglead');
  car('Hog Stars Dodge Challenger', 'hog-stars', 'Guarded Hog Stars building. Go in from the roof, clear it (shotgun inside), take the car.', 'detonated');
  car('LCC Monarch Avarus (purple chopper)', 'ambrosia-east', 'Back of the Final Chapter biker hideout on the east side of Ambrosia. Clear the hideout first.', 'detonated');
  car('Copperheads Gauntlet', 'ambrosia', 'Garage in Ambrosia. Standard alarm. Unlocks a vinyl.', 'tbm', { d: [-8, 6] });
  car('Bugatti on a trailer', 'boone-speedway', 'Resting on a trailer at Boone Speedway, by Hamlet. Has a tracker.', 'detonated');
  car('Vapid Sandking', 'n-mariana-farm', 'Behind the warehouse at the Industrial Farm, North Mariana County.', 'detonated');
  car('Royal Sanchez (motorcycle)', 'n-mariana-yard', 'Orange shipping container in North Mariana County.', 'tbm', { req: 'Crate opener' });
  car('Caliente Picador', 'n-mariana-yard', 'Yellow container in the same yard. Push the others aside with the bulldozer first.', 'tbm', { d: [8, 4] });
  car("Devil's Rope Gauntlet", 'hamlet', 'Garage in the M7 junkyard in Hamlet. Bikers guard it; get in through the skylight.', 'tbm', { d: [12, 6] });
  car('Albany Verdant Buccaneer', 'm7-compound', 'At the back near the building in the M7 Compound north of Millport.', 'detonated');
  car('Bloodless Jugular', 'leonard-white-house', 'Garage next to a white house in Leonard County.', ['tbm', 'search'], { req: 'Key Cloner', conf: 'guess' });

  // =================================================================
  // KENTON'S TREASURES
  // =================================================================
  const wreck = (name, at, desc, o = {}) => add('treasure', name, at, desc, { src: ['gtaboom', 'bo3'], ...o });
  wreck('Nuestra Señora de la Noche', 'wreck-noche', "South-east of Key Lento's southern tip. Choose the search circle nearer the island, not the one by Abismo Key.", { reward: '7 treasures' });
  wreck('Nuestra Señora de la Ética Laxa', 'wreck-etica', 'South of La Noche, off Abismo Key.', { reward: '5 treasures' });
  wreck('Urca de Cinco Torres', 'wreck-cinco', 'Off south-east Key Lento, just east of the small hooked island.', { reward: '6 treasures' });
  wreck('Nuestra Señora Lujuriosa', 'wreck-lujuriosa', 'A short swim from Cinco Torres, so do both in one dive.', { reward: '5–6 treasures', conflict: 'Guides list either 5 or 6 treasures here.' });
  wreck('Nuestra Señora del Ocio', 'wreck-ocio', "East of Key Lento, near Kenton's shop. Found automatically during the Island Dreams mission.", { reward: '10 doubloons' });
  wreck('Urca de Santa Sierra', 'wreck-sierra', 'East of Key Lento.', { reward: '6 treasures, including the Santa Sierra bell and an ornate pocket watch' });
  wreck('Bobcat Dive Site', 'bobcat-dive', 'Open-water dive site west of Grassrivers. Pieces can be collected in any order.', { reward: '6 pieces', src: ['gtaboom', 'gtabase'] });

  // =================================================================
  // METEORITE CHUNKS
  // =================================================================
  const met = (name, at, desc, src, o = {}) => add('meteorite', name, at, desc, { src: Array.isArray(src) ? src : [src], ...o });
  met('Selkie Hole (5 chunks)', 'selkie-hole', 'Five chunks in the flooded tunnels below the diving spot on the west edge of Emerald Springs. The WAiNK scan is at the same spot.', ['biglead', 'search']);
  met('Wreck of the Meerwunder', 'meerwunder', 'Below the fallen mast by the wreck, Featherstone Islands. A Curiosity scan is at the same stop.', ['search', 'biglead'], { d: [4, 4] });
  met('Hillside Campsite crater', 'hillside-camp', 'In a crater beside the tents at Hillside Campsite, south-west of Dawson Dam.', 'search');
  met('Below the Killtelligence tower', 'killtelligence', 'In the rocks below the tower south-east of Killtelligence Provisions.', 'search', { conf: 'guess', d: [10, 10] });
  met('Belville garage', 'belville-north', 'Under the bed in the garage of a middle-row house on the north edge of Belville town centre.', 'biglead', { d: [8, 2] });
  met('Abismo Key Carcass', 'abismo', 'On the beach at the south tip of Abismo Key, next to the carcass.', 'biglead', { d: [-6, 10] });
  met('Crashed plane (underwater)', 'crashed-plane', 'In the chassis of a crashed plane east of the small island off the east of Corsair Key.', 'biglead');
  met('Sunken cargo ship (underwater)', 'cargo-wreck', 'South-east of the crashed helicopter. Get in through a hole in the side.', 'biglead', { conf: 'guess' });
  met('Belpoint Island pier', 'belpoint', 'Under the pier on the north side of Belpoint Island, west of Capri.', 'biglead', { d: [0, -8] });
  met('Lonely island (2 chunks)', 'bobcat-lonely', 'Two on a lonely island south of Bobcat Key: one on the SOS sign, one on the opposite beach.', 'biglead');
  met('Hyde Island bridge', 'hyde-island', 'Under a bridge north of the small dock in the west inlet of Hyde Island.', 'biglead', { d: [-14, -4] });

  // =================================================================
  // WAiNK SCANS
  // =================================================================
  const scan = (sub, name, at, desc, src, o = {}) => add('waink', name, at, desc, { sub, src: Array.isArray(src) ? src : [src], ...o });
  scan('Sculpture', 'Fatal Incursion Plaque', 'kl-sw', 'South-west point of Key Lento, by the sea.', 'biglead', { d: [-6, 2] });
  scan('Landmark', 'The Wonder Whale', 'wonder-whale', 'Whale sculpture in front of the clothes shop of the same name.', 'biglead');
  scan('Mural', 'Plunge Masters Deep Sea Chalet', 'wonder-whale', 'Back of a house north-east of The Wonder Whale.', 'biglead', { d: [8, -6] });
  scan('Landmark', 'Badger R&D Tower', 'badger-tower', 'Large concrete tower in mid Key Lento, west of the Pay n Spray.', 'biglead');
  scan('Curiosity', 'Thicc Herbie blimp', 'abismo-view', 'Scan the blimp over Maroon Key from the viewpoint car park west of Abismo Key.', 'biglead');
  scan('Curiosity', 'Abismo Key Carcass', 'abismo', 'Beach at the south tip of Abismo Key.', 'biglead', { d: [2, 10] });
  scan('Curiosity', 'Derelict Spy Vessel', 'permit-se', 'Southern tip of the south-eastern Permit Key. A Nipper pistol is inside.', ['biglead', 'ol']);
  scan('Curiosity', 'Fingerpost to Liberty City', 'permit-keys', 'North side of the large middle island in the Permit Keys. Bring a boat.', 'ol', { d: [0, -8] });
  scan('Landmark', 'Large Lure', 'vb-south', 'Next to the Meet the Stuntman stranger, south of Lucciano’s at the south end of Vice Beach.', 'biglead', { d: [-4, -6] });
  scan('Sculpture', 'Gimme All Your Oil', 'vc-ne-mall', 'Pistol sculpture in north-east Vice City, south of the main mall and north-east of Stockyard Speedshop.', 'biglead', { d: [0, 6] });
  scan('Landmark', 'Gellhorn Funfair', 'funfair', 'The big Ferris wheel.', 'biglead');
  scan('Curiosity', 'Halloween House', 'halloween-house', 'Middle of the six-street grid south of Tortoise Lake. A flamingo and a livery car are here too.', ['biglead', 'ol']);
  scan('Sculpture', 'Belville Topiary', 'celerica', 'Hedge in the back garden south-east of the Celerica campus.', 'biglead', { d: [6, 6] });
  scan('Landmark', 'Imperial Spanish Ruins', 'kalaga-sw-peak', 'Top of the south-west peak in Mount Kalaga National Park.', 'biglead');
  scan('Landmark', 'Hoffman Observatory', 'hoffman', 'Peak at the west end of North Kelly County.', 'biglead');
  scan('Sculpture', 'Monument of Leonidan Supremacy', 'manifest-canyon', 'Big column with a globe and four horses (one wearing a traffic cone) on the south-west curve of the road around Manifest Canyon. The statue beeps in a Morse-like pattern.', ['biglead', 'ol'], { d: [-10, 10], conflict: 'GTA Zone places it north of Port Gellhorn.' });
  scan('Curiosity', 'Dead Sharks', 'wetman-bay', 'Beached bull sharks on a long thin sand island in Wetman Bay.', 'biglead', { conf: 'guess' });
  scan('Curiosity', 'Wreck of the Meerwunder', 'meerwunder', 'North-east side of the south-east Featherstone island. The meteorite is at the same stop.', 'biglead', { d: [-4, -4] });
  scan('Landmark', 'St Lucia Lighthouse', 'st-lucia', 'North of Little Hardin Island.', 'biglead');
  scan('Curiosity', 'Bobcat Key Experimental Dome', 'bobcat-dome', 'Curve of land south of Bobcat Key. Reach it by boat.', ['biglead', 'ol']);
  scan('Curiosity', 'Unidentified Building', 'hardin-south-islet', 'Fenced bunker entrance on the small sandy island just south of Little Hardin Island.', 'ol');
  scan('Curiosity', 'Turtle lair (green ooze)', 'millport-drain', 'At night, in the concrete storm drain between north Millport and Lake Tallaloko: green ooze, four baby turtles, pizza boxes and a rat.', 'ol');

  // =================================================================
  // EASTER EGGS & SECRETS
  // =================================================================
  const egg = (name, at, desc, src, o = {}) => add('easter', name, at, desc, { src: Array.isArray(src) ? src : [src], ...o });
  egg('Skunk Ape (Bigfoot)', 'cottonmouth', 'Road along the east shore of Cottonmouth Lake. Follow the roar to the creature feeding on a deer; the trail ends at a human-shaped tree. Leads into Kirk’s "Skunk Apeology 101" questline.', ['ol', 'gz'], { d: [22, -4], conflict: 'Other sightings are reported south of Watson Bay and in Gullet Marsh.' });
  egg('UFO abduction', 'starlet-motel', 'Dirt roads north-west of the Starlet Motel. Go alone after 2am and look for a roadside car with flickering lights and a path into the woods.', ['ol', 'gz'], { d: [-14, -16], req: 'Late night, alone (Chapter 1 or 2)', reward: 'Hidden trophy "The Truth Is Out There"; starts the Alien Dreams quest' });
  egg('Lucky Dog at sea', 'gambit-bay', 'Stay stranded at sea for about 5 minutes and a dog may swim up. Throw him a ball and follow him to his island.', ['ol', 'gz'], { reward: 'About $1,200 from his buried stash' });
  egg('Cowboy hat yard sale', 'pg-south', 'Daytime yard sale on Orchard Avenue, south Port Gellhorn. The hat sits on a guitar case on a white sofa.', 'ol', { reward: '"Genuine Cowboy Hat"' });
  egg('Easter-egg nest on the radio mast', 'bluegrass', 'Climb the antenna mast in Bluegrass (6–7 minutes) and throw an egg off the edge. The top is also a BASE jump.', 'ol', { conflict: 'GTA Zone describes a similar nest on a tall tower in Vice City.' });
  egg('The Immortal Man', 'kl-s', "Deck of a house near Donnie's caravan, south Key Lento. Look at him through a sniper scope. Bullets don't kill him, and he comes for you.", 'ol', { d: [-6, 2] });
  egg('The man who knows', 'belville', 'A garage you can break into, with a conspiracy board and notes mentioning a "J" and an "L".', 'ol', { d: [-8, 8] });
  egg('Red Dead novel', 'millport', 'Readable Western set in New Austin at Jacob’s Tavern, Millport.', 'gz', { d: [-4, 6] });
  egg('Princess Robot Bubblegum statue', 'y-hotel', 'By the main entrance of the Y Hotel on Atlantic Avenue, where Washington Beach meets Ocean Beach.', 'ol');
  egg("Dexter's apartment", 'washington-island', 'The locked corner unit on the second-floor walkway. A side ladder leads to the roof with a kill kit and a toolbox of cash; the boat at the west dock is a nod too.', ['ol', 'gz'], { reward: 'A few hundred dollars' });
  egg("Dexter's kill room", 'kl-sw', 'Garage of a beach house on Surfside Drive, south-west Key Lento. Break in.', 'ol', { d: [4, 4] });
  egg('Scarface motel room', 'sunlite-motel', 'Visit between 12pm and 1pm. Second floor under the red awning: try the first door, go down, wait for the shooting cutscene, then go back up. Leave fast, police come.', 'ol', { reward: 'Little Friend W-10 micro SMG, cash and cocaine' });
  egg('Talking parrot', 'three-sheets', 'Behind Three Sheets Liquor, in the walled yard of the exotic-animal front. Climb the side fence, ask the red parrot "Cash?" then "Where’s the cash?", and pry the low white vent by the generator.', ['ol', 'gz'], { req: 'After the "Get Shirley’s Rum" errand. Armed guards.', reward: 'About $1,300, over $2,000 with the safe' });
  egg('Apple Martini (In The Beginning...)', 'ocean-view', 'Order an Apple Martini at the Ocean View Hotel rooftop bar.', 'ol', { reward: 'Hidden trophy' });
  egg('Kodak Black playlist poster 1', 'aunt-zola', "On the till at Aunt Zola's Soul Food. Scan all four posters to unlock \"The Sniper of La Perle\".", 'ol', { sub: 'Playlist poster' });
  egg('Kodak Black playlist poster 2', 'twa-ponya', 'Entrance table at TWA Ponya Tattoo.', 'ol', { sub: 'Playlist poster' });
  egg('Kodak Black playlist poster 3', 'drip-drops', 'On the counter at Drip Drops.', 'ol', { sub: 'Playlist poster' });
  egg('Kodak Black playlist poster 4', 'jack-of-hearts', 'Crate in the east recording booth, upstairs at Jack of Hearts.', 'ol', { sub: 'Playlist poster', d: [4, -4] });
  egg('The Vault Radio poster', 'the-vault', 'Scan the poster just inside the entrance of The Vault club.', 'ol', { reward: 'Unlocks a 23rd radio station (DJ Pretzel)' });

  // =================================================================
  // SECRET QUESTS
  // =================================================================
  const quest = (name, at, desc, src, o = {}) => add('quests', name, at, desc, { src: Array.isArray(src) ? src : [src], ...o });
  quest('Alien Dreams (lab)', 'south-point', 'After the UFO abduction, sleep at a safehouse until the dream puzzle happens. The real lab is underground in a fenced compound at South Point Airfield. Codes vary per player.', 'ol', { reward: 'Permanent max health, stamina and Focus' });
  quest('Portal to 2002 (start)', 'badger-tower', 'From the top of the tower, flip the power switch and press the button inside until the Malibu Club logo shows on the TV. Then activate 12 LPL substations in the order that spells LIFE IS PASSING ME BY. Avoid fast travel.', 'ol', { d: [8, 4] });
  quest('Portal to 2002 (Reactor 2)', 'th-power', 'Reactor 2 at the T.H. Power Station opens a portal behind a metal door between 7pm and 6am. Step through as Jason.', 'ol', { req: 'Finish the substation step first', reward: "Tommy Vercetti's blue Hawaiian shirt" });
  quest("The President's Bunkers (start)", 'friends-of-freedom', "Talk to Jose Bermudez behind the Friends of Freedom monument in the daytime. His Little Cuba flat on NW 4th Avenue has a tape and a photo of Sharktooth Island.", 'ol');
  quest("President's bunker #1", 'sharktooth', 'Door code 010317. Inside, the desk, phone and radio give the safe code 2975.', 'ol', { reward: "Russo's 1922 and the OBSESS photo" });
  quest("President's bunker #2", 'big-pine', 'In the woods near Big Pine. Keypad code OBSESS = 085355.', 'ol', { d: [14, -8], reward: 'Cold War 556 and a tank behind a hidden door' });
  quest('Circles of Hell', 'pg-north', 'Midnight to 4am: talk to two metalheads in an open garage in north Port Gellhorn, ride in their van to a hillside campsite and fight Satan.', 'ol', { d: [-8, -6], reward: 'Hellspawn Comshot 12, a Circles of Hell shirt, permanent max health' });
  quest('Hyde Island hunt', 'hyde-island', 'Explore Hyde Island alone. You get darted and wake in a container with an explosive collar while a hunter and his dog track you. Turn his rifle on him.', 'ol', { reward: 'Island Poacher FF-50 rifle, cash at the boathouse' });
  quest('The giant crab', 'gullet-marsh', 'Abandoned research outpost south-west of Pelican Valley (go by boat). Turn on the breaker, use the password CLEAVES from the floorboards, read the journal. Safe 0072 gives boathouse code 0212.', 'ol', { d: [-6, 10], reward: 'Crabshack VF5' });
  quest('Lighthouse ghosts', 'st-lucia', 'After dark with scuba gear. Climb to the lantern room where two ghost keepers argue, read the logbook in the keeper’s house, then dive to the open chest on the seabed. Around 1:30am in fog a green ghost ship can appear.', 'ol', { d: [6, 4], reward: 'Cursed Knife' });
  quest('The Final Flush (start)', 'corsair', 'Scan the "Stop! Don’t Flush" No Flushers sign in the men’s room of the Corsair Key restroom, then text "TRUTH". Dr. Merle meets you at Frank’s Waffles.', 'ol');
  quest('The Final Flush (sewage plant)', 'gloriana-key', "Drive Dr. Merle's van to the sewage plant and follow him into a hidden chamber under the floor.", 'ol', { reward: 'Permanent max stamina, plus a stranger mission' });
  quest('The endless containers', 'tallaloko-site', 'Open the single orange container, use the strange object on the table, then cross a maze of containers, jumps and an underwater section.', 'ol', { reward: 'Permanent stamina' });
  quest('The Mario caps', 'moreau', 'Ruins of the Lawton Co. Paper Mill. Get high on the purple tarp and jump into the invisible block above the ruins.', 'ol', { reward: '"J" and "L" caps in Mario and Luigi colours' });
  quest('Missing persons', 'starlet-motel', 'Read the missing-persons poster at reception for the Kelly County Tip Line. It leads to a trophy room in the warehouse opposite Moses’ garage and three bodies around Port Gellhorn.', 'ol', { req: 'Chapter 2', d: [6, -6], reward: 'Two stranger missions' });

  // =================================================================
  // UNIQUE WEAPONS
  // =================================================================
  const gun = (name, at, desc, src, o = {}) => add('weapons', name, at, desc, { src: Array.isArray(src) ? src : [src], ...o });
  gun('Little Friend W-10', 'sunlite-motel', 'Reward from the Scarface motel room easter egg (12pm–1pm).', 'ol', { d: [6, 4] });
  gun("Russo's 1922", 'sharktooth', "In the safe of the president's first bunker (safe code 2975).", 'ol', { d: [8, 4] });
  gun('Cold War 556', 'big-pine', "Second president's bunker near Big Pine.", 'ol', { d: [20, -4] });
  gun('Island Poacher FF-50', 'hyde-island', 'Taken from the hunter during the Hyde Island hunt.', 'ol', { d: [6, 10] });
  gun('Crabshack VF5', 'gullet-marsh', 'At the boathouse after the giant crab quest (boathouse code 0212).', 'ol', { d: [6, 14] });
  gun('Cursed Knife', 'st-lucia', 'Chest on the seabed after the lighthouse ghosts quest.', 'ol', { d: [-8, -6] });
  gun('Hellspawn Comshot 12', 'hillside-camp', 'Reward for beating Satan in Circles of Hell.', 'ol', { conf: 'guess', d: [-10, 4] });
  gun('SM-69 sniper rifle', 'badger-tower', 'On the balcony of the Badger R&D Tower.', 'search', { d: [10, -4] });
  gun('Gun Nut SMS 1 sniper', 'kl-s', 'Inside a house south of Key Lento. Break in.', 'biglead', { d: [8, 4] });
  gun('Nipper pistol', 'permit-se', 'Inside the Derelict Spy Vessel.', 'biglead', { d: [6, 4] });
  gun('Turnt Nipper .38 (legendary pistol)', 'bobcat-bight', 'Wooded island at Bobcat Bight, off the west coast of North Mariana County (boat or jet ski). A crashed powered paraglider hangs in a tree: shoot the parachute to drop it, then grab the pistol.', ['search', 'showgamer']);

  // =================================================================
  // OTHER COLLECTIBLES
  // =================================================================
  const misc = (sub, name, at, desc, src, o = {}) => add('misc', name, at, desc, { sub, src: [src], ...o });
  misc('Magazine', 'Trigger Happy #99', 'kl-n', 'House in north-middle Key Lento (break in).', 'biglead', { d: [8, 4] });
  misc('Magazine', 'Peche #69', 'kl-se', 'Inside the south-east party house.', 'biglead', { d: [0, -6] });
  misc('Makeup', 'Sunset Blush', 'kl-n', 'Scan the magazine in the bedroom of a house on the north coast of Key Lento.', 'biglead', { d: [16, -2] });
  misc('Makeup', 'Goth Garnet', 'hamlet', 'Magazine in the back office of a warehouse above Hamlet Police Department.', 'biglead', { d: [-6, -8] });
  misc('Unique dog', 'Festive Poodle', 'kl-n', 'Garden of the Christmas-themed house on the north seafront row of Key Lento.', 'biglead', { d: [-4, -6] });
  misc('Unique dog', 'Cartoon Labrador', 'kl-se', 'Party house in the south-east corner of Key Lento.', 'biglead', { d: [8, -6] });
  misc('Cocaine Flamingo', 'Cocaine Flamingo (Key Lento)', 'kl-mid', 'Garden of an eccentric house in mid Key Lento.', 'biglead', { d: [-14, -6] });
  misc('Cocaine Flamingo', 'Cocaine Flamingo (Capri)', 'capri', 'Outside La Costa, two blocks from Hair By Clair.', 'biglead', { d: [-8, 4] });
  misc('Cocaine Flamingo', 'Cocaine Flamingo (Halloween House)', 'halloween-house', 'In the front garden of the Halloween House.', 'biglead', { d: [-6, 2] });
  misc('Stunt jump', 'Abismo bridge jump', 'abismo-bridge', 'Lower bridge between Abismo Key and Key Lento.', 'biglead');

  // =================================================================
  // SHOPS & CONTACTS
  // =================================================================
  const shop = (sub, name, at, desc, src, o = {}) => add('vendors', name, at, desc, { sub, src: Array.isArray(src) ? src : [src], ...o });
  shop('Treasure buyer', "Kenton: Island Dreams Boat Charters", 'kenton', 'Sells dive gear and pays a finder’s fee of about $200 per wreck treasure, more for completed sets.', ['gtaboom', 'gtaboss']);
  shop('Car registration', "Moses' garage", 'moses', 'Register stolen cars without trackers here from early Chapter 2.', ['detonated', 'tbm']);
  shop('Pawn shop', "Zenon's Pawn Shop", 'zenon-pawn', 'Buys cards and other loot.', 'xtreme');
  shop('Pawn shop', 'Down Town Pawn', 'down-town-pawn', 'Buys cards and other loot.', 'xtreme');
  shop('Pawn shop', 'Pawn City', 'pawn-city', 'Buys cards and other loot.', 'xtreme');
  shop('Pawn shop', "Buck's Jewelry & Pawn", 'bucks-pawn', 'Buys cards and other loot.', 'xtreme', { d: [-6, -4] });
  shop('Pawn shop', 'Fast Cash', 'fast-cash', 'Buys cards and other loot.', 'xtreme', { d: [0, -5] });
  shop('Pay n Spray', "Pay 'n' Spray (Key Lento)", 'kl-pns', 'Respray stolen cars and, from Chapter 3, deal with trackers.', 'tbm');

  const out = { SOURCES, CATEGORIES, ITEMS: items };
  if (typeof module !== 'undefined' && module.exports) module.exports = out;
  else root.LEONIDA_DATA = out;
})(typeof window !== 'undefined' ? window : globalThis);
