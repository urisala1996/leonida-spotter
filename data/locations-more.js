/*
 * Leonida Spotter: second data pass (added after launch week).
 * Appends to LEONIDA_DATA.ITEMS from data/locations.js. Same fields and rules:
 * paraphrased community-guide descriptions, approximate pin positions.
 */
(function (root) {
  const D = typeof module !== 'undefined' && module.exports ? require('./locations.js') : root.LEONIDA_DATA;
  const add = (cat, name, at, desc, o = {}) => D.ITEMS.push({ cat, name, at, desc, ...o });
  const arr = (s) => (Array.isArray(s) ? s : [s]);
  const card = (set, name, at, desc, o = {}) => add('cards', name, at, desc, { sub: set, src: arr(o.src || 'cardhunt'), ...o, ...(o.src ? { src: arr(o.src) } : {}) });
  const scan = (sub, name, at, desc, o = {}) => add('waink', name, at, desc, { sub, src: arr(o.src || ['gc', 'pg']), ...o, ...(o.src ? { src: arr(o.src) } : {}) });
  const met = (name, at, desc, o = {}) => add('meteorite', name, at, desc, { src: arr(o.src || 'pat'), ...o, ...(o.src ? { src: arr(o.src) } : {}) });

  // =================================================================
  // COLLECTIBLE CARDS (Card Hunt GTA set pages unless noted)
  // =================================================================
  const VCF = 'Vice City Flamingos';
  card(VCF, 'Angel Cienfuegos (Silver)', 'belville', 'Filing cabinet in the garage of a white house on Grace Ave, just below the O-shaped lake.', { d: [-6, -12] });
  card(VCF, 'Angel Cienfuegos (Light Blue)', 'buckskin-swamp', 'Microwave in the back break room of the Xero gas station on Omega Pkwy.', { d: [-12, -6] });
  card(VCF, 'Angel Cienfuegos (Pink)', 'abismo', 'Fence post behind the deck of the southern beachfront restroom.', { d: [6, 9] });
  card(VCF, 'Bill Norton', 'southside', 'Ledge of the arched opening at the end of the second-floor balcony above E-Z Kwik.', { d: [4, 6] });
  card(VCF, 'Elias Delgado (Silver)', 'watson-bay', 'Bottom shelf of the workbench in the detached garage at JDs Fabrication.', { d: [-10, -4] });
  card(VCF, 'Elias Delgado (Light Blue)', 'emerald-springs', 'Railing of the small hut at the end of the bridge over the Emerald River.', { d: [-6, 8] });
  card(VCF, 'Elias Delgado (Pink)', 'ocean-beach', 'On the ground beside a couch behind a yellow condo on Spirea Ln.', { d: [-2, 12] });
  card(VCF, 'Harold Toye (Silver)', 'grayson', 'Ground by a rocking chair under the flag of a wooden house.', { d: [8, 4] });
  card(VCF, 'Harold Toye (Light Blue)', 'peacock-bay', 'Under a folding chair behind Open Door Immigration Services.', { d: [6, -6] });
  card(VCF, 'Harold Toye (Pink)', 'waning-sands', 'Top shelf on the back wall of the pink mansion’s detached garage.', { d: [-6, -8] });
  card(VCF, 'Jude Flores', 'kl-mid', 'First-floor patio outside Apartment 13 at Bugners Getaways.', { d: [10, 6] });
  card(VCF, 'Julian Hall', 'balsero', 'Microwave in the back break room of the RON gas station.', { d: [-6, 6] });
  card(VCF, 'Thunder Lee', 'belville', 'Edge of the dugout bench at the baseball field on Grace Ave.', { d: [8, -10] });

  const NAR = 'Vice City Narcos';
  card(NAR, 'Bryson Powers', 'washington-beach', 'Ledge of the lifeguard hut at the south end of Washington Beach. Alternate: washer in the Starlet Motel laundry (missable after Chapter 2).', { d: [0, 18] });
  card(NAR, 'Leroy Rook (Bronze)', 'royal-bay-marina', 'Office safe on the second floor of Royal Bay Marina.');
  card(NAR, 'Leroy Rook (Silver)', 'apollo-aggregates', 'Safe on the filing cabinets in the office next to the van, in the red warehouse south-east of three rectangular pools. Go in by the side door. Does not respawn.', { src: ['cardhunt', 'boomcards'] });
  card(NAR, 'Leroy Rook (Gold)', 'celerica', 'Safe on a shelf in the bedroom closet of a cream house on Harmony Dr, south-east of the Cellerica campus.', { d: [10, 10] });

  card('Liberty City Swingers', 'Ichiro Yamada (Bronze)', 'vespucci', 'Drawer unit in the garage of a cream villa.', { d: [8, 6] });
  card('Liberty City Swingers', 'Ichiro Yamada (Silver)', 'port-vc', 'Big wooden table just inside the storage doors of the Port Vice City terminal on Gulf St. Reported reachable during the Chapter 5 mission "Doggie Bag".', { req: 'Chapter 5', d: [6, 4] });
  card('Los Santos Panic', 'Chibuike Bello (Gold)', 'vinewood-beach', 'Garage counter of a villa on the north-west side of the Vinewood Beach strip.', { d: [-8, -6] });

  const BW = 'Backyard Wrestling';
  card(BW, "Cherry O'Glade", 'breakwater', 'Inside a derelict train car at Breakwater Quarry.');
  card(BW, 'Chico Bonez', 'hamlet', 'Wooden bleachers by the backyard wrestling ring behind the white-and-green house on Grisette Ave. Other reported spots: a Belville garage and a pier box south of Lake Leonida.', { d: [-8, 8] });
  card(BW, 'Danny McLean (Watson Bay)', 'watson-bay', 'Under the lone red house on the east side of the northern island, beneath a punching bag in the outdoor gym.', { d: [6, -14] });
  card(BW, 'Judas Sterling', 'gloriana-key', 'Awning ledge of the abandoned stadium.', { d: [6, 6] });

  const MAN = 'Vice City Manatees';
  card(MAN, 'Anthony Ross (Dusty Pink)', 'vespucci', 'Counter in the pink-accented garage of a cream villa on Neptune Cir.', { d: [-4, 8] });
  card(MAN, 'Dominic Brizzolato (Gold)', 'oceanarium', 'Under the turtle sign in the domed live-exhibit room of the Oceanarium, by the shark display.');
  card(MAN, 'Georgie Macklerath (Silver)', 'kl-sw', 'Side of the kitchen fridge in a yellow waterfront house on Surfside Dr.', { d: [8, -4] });
  card(MAN, 'John Morgan (Dusty Pink)', 'casanova', 'Back garage floor of a cream villa on Rialto Cswy, at the south edge of the row. On one side of a poster frame.', { d: [-8, -2] });
  card(MAN, 'John Morgan (Green)', 'casanova', 'Same back garage as the Dusty Pink version, on the other side of the poster frame.', { d: [-8, 3] });
  card(MAN, 'Junior Taufua (Dusty Pink)', 'grand-majestic', 'Bookshelf by the kitchenette on the lobby floor of the Grand Majestic Aparthotel.', { d: [-6, -4] });

  card('Vice City Club de Futbol', 'Ian Harris (Gold)', 'leaf-links', 'Garage shelving of a mansion on Delamore Dr, west side of Leaf Links.', { d: [-6, 0] });
  card('Vice City Club de Futbol', 'Leon Correo (Gold)', 'capri-south', 'Marble TV stand upstairs in a mansion on Ravella Dr, south-east Capri.', { d: [10, -2] });

  const PEN = 'Liberty City Penetrators';
  card(PEN, 'Noah Marcus (Bronze)', 'vespucci', 'Folder in the eastern garage of a yellow mansion.', { d: [10, -4] });
  card(PEN, 'Noah Marcus (Gold)', 'riquezas', 'Under a plastic chair in the northern watchtower on the large south-western island.', { d: [-4, -4] });
  card(PEN, 'Remy Herbert (Navy Blue)', 'capri', 'Counter in the gym room of a tan villa just west of Volcano Coffee Co.', { d: [6, -8] });

  const WR = 'Liberty City Wrath';
  card(WR, 'James Bowery (Deep Red)', 'southside', 'Under a park bench.', { d: [-10, 0], conf: 'guess' });
  card(WR, 'Robbie Stine (Bronze)', 'catalan-key', 'Workbench in a mansion garage in the gated community.');
  card(WR, 'Thien Trinh (Silver)', 'gellhorn', 'Front-porch railing of a big blue farmhouse just off US-183, east side of Gellhorn.', { d: [14, 2] });
  card(WR, 'Thien Trinh (Gold)', 'watson-bay', 'Ledge of the Bitehouse tower.', { d: [4, 8] });

  const COR = 'Los Santos Corkers';
  card(COR, 'Anthony Herndon (Bronze)', 'ambrosia-farmhouse', 'Workbench in the farmhouse garage next to the Ambrosia Farmhouse.');
  card(COR, 'Franklin Turner (Gold)', 'capri-south', 'Dresser on the upstairs landing of a mansion at the start of the south-east finger.', { d: [14, 4] });
  card(COR, 'Jonah Clemmons (Silver)', 'watson-bay', 'Table in the back bedroom of a house south-west of the safehouse.', { d: [-8, 8] });
  card(COR, 'Miguel Ayala', 'moreau-pass', 'Stone railing of the patio at the riverside ranger station in Moreau Pass State Park. Also drops at random from yellow loot boxes.');
  card(COR, 'Samuel Buono (Navy Blue)', 'watson-bay', 'Patio bench next to a garden gnome.', { d: [14, 10], conf: 'guess' });
  card(COR, 'Xavier Gomez', 'boone-speedway', 'Side of the fridge in the car wash office north-east of Boone Speedway. One guide lists a yellow trailer in North Mariana County instead.', { d: [8, -6] });

  const POU = 'Los Santos Pounders';
  card(POU, 'Bingo Johnson', 'la-cascara', 'Side of the fridge in a mobile home in the trailer area south-east of La Cascara Motel.', { d: [8, 6] });
  card(POU, 'Dravy Mease (Yellow)', 'ocean-beach', 'Hanging from a locker at the back of the shipping container next to the outdoor gym. Walk into the container.', { d: [2, -14] });
  card(POU, 'Granian Beach', 'watson-bay', "Floor of a hoarder's house.", { d: [-14, -2], conf: 'guess' });
  card(POU, 'Laki Maivia (Gold)', 'casanova', 'TV stand in the upstairs workout room of the northern mansion.', { d: [4, -6] });
  card(POU, 'Maximus Goldbart (Silver)', 'southwind', 'TV stand in a house on stilts.');
  card(POU, 'Maximus Goldbart (Deep Red)', 'salton', 'Card holder in a parking garage.', { d: [6, -6], conf: 'guess' });

  const DEL = 'Delights Dancers';
  card(DEL, 'Chip', 'watson-bay', 'Toilet in the bathroom of a riverside house on Kingston Rd.', { d: [-4, -10] });
  card(DEL, 'Cleo', 'kalaga-reservoir', 'Large battery in the supply closet of the southern building.', { d: [0, 10] });
  card(DEL, 'Crystal', 'downtown', 'Under a chair on a stone balcony off the alleys near East Royale St.', { d: [8, -6] });
  card(DEL, 'Cyrus', 'vcia', 'Side of the fridge in the second-to-last top-floor apartment at Park Apartments.', { d: [10, 12] });
  card(DEL, 'Daisy (La Perle)', 'la-perle', 'Side of the corkboard in the back kitchenette of the Xero gas station. Alternate to the Key Lento spot.', { d: [-10, -2] });
  card(DEL, 'Jason', 'delights', 'Bathroom counter inside Delights Cabaret. Available after a Chapter 2 mission.', { d: [-4, 4], req: 'After a Chapter 2 mission' });
  card(DEL, 'Kandi', 'little-cuba', 'Toilet in the first apartment above Farmacia Tu Salud.', { d: [-6, 8] });
  card(DEL, 'Lance', 'ocean-beach', 'Desk inside the lifeguard stand on the southern shoreline.', { d: [6, 30] });
  card(DEL, 'Lucky', 'la-perle', 'Dresser beside the bed in a mobile home at Caledonia Blvd and NW 9th Ave.', { d: [-14, 8] });
  card(DEL, 'Mario', 'southside', 'Roof edge of the Water and Sewage building.', { d: [12, 8] });
  card(DEL, 'Nicole', 'hamlet-prison', 'End table in the second apartment from the right, middle block on Formosa Ave, south of the prison.', { d: [4, 8] });
  card(DEL, 'Perla', 'balsero-trainyard', 'Electrical box on the control building above the train yard.');

  const JOH = 'Jack of Hearts Dancers';
  card(JOH, 'Brianna Blue (Pink)', 'moreau', 'In a magazine under a chair in the corner of a ruined cabin.', { d: [-10, 6] });
  card(JOH, 'Christel (Pink)', 'salton', "Toilet in the RON station's back staff restroom.", { d: [-8, 4] });
  card(JOH, 'Christel (Purple)', 'ocean-beach', 'Under a chair above the elevator housing on the Sixth & Harper roof.', { d: [-4, -24] });
  card(JOH, 'Jada Watts (Bronze)', 'port-gellhorn', 'End table by the bed in a brown house on Pennwort St.', { d: [-10, 14] });
  card(JOH, 'Jada Watts (Silver)', 'bobcat-key', 'In the sand in front of a garden gnome fishing from a toilet chair.');
  card(JOH, 'Jada Watts (Gold)', 'gellhorn-radio', 'Corner of the top platform of the tall radio tower by CR 62.');
  card(JOH, 'Jemila (Deep Red)', 'rockridge', "Railing of the upper balcony above Lisette's Food Store.", { d: [6, -4] });
  card(JOH, 'Jemila (Pink)', 'peacock-bay', 'Rooftop railing of a yellow L-shaped apartment building.', { d: [-10, 6] });
  card(JOH, 'Jemila (Purple)', 'ocean-beach', 'Floor under an electrical box in the room at the top of the back stairs at Fairbanks Pharmacy.', { d: [2, 22] });
  card(JOH, 'Kadisha (Deep Red)', 'breakwater', 'Next to a backpack inside an abandoned train car.', { d: [6, 4] });
  card(JOH, 'Kadisha (Purple)', 'gellhorn', 'Windowsill of a derelict garage off Butternut Rd.', { d: [-6, -8] });
  card(JOH, 'Kelly (Deep Red)', 'port-gellhorn', 'Bottom drawer of the dresser in a pink-and-white coastal mobile home.', { d: [-18, 0] });
  card(JOH, 'Kelly (Pink)', 'belville', 'Floor of the back restroom at the Xero station on Caledonia Blvd.', { d: [12, 6] });
  card(JOH, 'Lexi Campbell (Bronze)', 'n-leonard-bunker', 'Stained mattress in the corner of an underground bunker near the Mount Kalaga border.', { conf: 'guess' });
  card(JOH, 'Lexi Campbell (Silver)', 'cougars-cave', "Corner of the desk in the back room of Cougar's Cave.");
  card(JOH, 'Malena (Pink)', 'kalaga-fire-tower', 'Wall ledge left of the doorway in the fire lookout tower.');
  card(JOH, 'Malena (Purple)', 'emerald-springs', 'In front of the top doorway of the spiral-stair building under the cell tower.', { d: [10, -6] });
  card(JOH, 'MonaLi$a (Bronze)', 'king-gator', "Men's restroom at a trailside facility in South Kelly County.", { d: [-12, -10], conf: 'guess' });
  card(JOH, 'MonaLi$a (Silver)', 'featherstone', 'Next to a backpack on the highest deck of the beached freighter.', { d: [-10, 2] });
  card(JOH, 'MonaLi$a (Gold)', 'abismo', 'On the ground under a deck chair by a beached boat on a small island.', { d: [-22, 8] });
  card(JOH, 'Pricilla Pace (Bronze)', 'mount-kalaga', 'Edge of the front-porch railing of a weathered pink house.', { d: [-16, 10], conf: 'guess' });
  card(JOH, 'Pricilla Pace (Silver)', 'permit-keys', 'Ledge of the wooden library box outside a beach hut, at the Beach Party Site.', { d: [8, -4] });
  card(JOH, 'Pricilla Pace (Gold)', 'capri', 'Top of the tower behind the Leonida Brewing warehouse.', { d: [12, 6] });
  card(JOH, 'Vanessa (Bronze)', 'n-leonard-farm', 'Wall shelf inside an outhouse shed on a farm lot.', { conf: 'guess' });
  card(JOH, 'Vanessa (Silver)', 'salton', 'Narrow ledge around the highest rooftop of Juliet Terrance Apartments.', { d: [10, 4] });
  card(JOH, 'Vanessa (Gold)', 'bayside', "Back-room safe at Uncle Jack's Liquor. Reported safe code 7869.", { d: [-8, 6] });
  card(JOH, 'Zaria "Ri Ri" Luckett (Bronze)', 'balsero', 'Corner of the billboard catwalk by the Bare With Me club.', { d: [8, -6] });
  card(JOH, 'Zaria "Ri Ri" Luckett (Silver)', 'port-gellhorn', 'Next to a backpack in a yellow abandoned train car.', { d: [14, -10] });
  card(JOH, 'Zaria "Ri Ri" Luckett (Gold)', 'little-hardin', 'In the sand by a lone deck chair near a jet ski on the southern beach.', { d: [0, 20] });

  const N19 = 'NINE1NINE Dancers';
  card(N19, 'Amie (Deep Red)', 'buckskin-swamp', 'Seat of a bench in a picnic clearing.', { d: [12, 8], conf: 'guess' });
  card(N19, 'Amie (Pink)', 'rusty-anchor', "Toilet tank in the men's restroom at the Rusty Anchor.", { d: [-4, -4] });
  card(N19, 'Amie (Purple)', 'capri', 'Outdoor bed on the back balcony of a brightly coloured house on Vela Rota Dr.', { d: [-6, 10] });
  card(N19, 'Braelynn (Deep Red)', 'hoffman', 'Wooden platform on the top floor of the abandoned Hoffman Observatory.', { d: [4, 4] });
  card(N19, 'Braelynn (Pink)', 'gellhorn', 'Ledge behind the Xero Gas billboard.', { d: [8, -6] });
  card(N19, 'Braelynn (Purple)', 'millport-church', 'Next to a mattress on the top level of the ruined church.');
  card(N19, 'Chrissie (Deep Red)', 'macalister', 'Red blanket among trash piles in a cave tunnel at the gold mine.', { d: [-6, 6] });
  card(N19, 'Chrissie (Pink)', 'port-gellhorn', "Wedged in an armchair cushion in a red mobile home east of the Pay 'n' Spray.", { d: [16, 4] });
  card(N19, 'Chrissie (Purple)', 'manifest-canyon', 'Next to a crate at a small camp inside a cave.', { d: [12, -4], conf: 'guess' });
  card(N19, 'Clarissa (Bronze)', 'little-cuba', 'Next to lawn chairs on the roof of a yellow apartment building on NW 3rd Ave.', { d: [-10, -4] });
  card(N19, 'Clarissa (Silver)', 'capri-nw', 'Counter next to a magazine in the garage of a yellow villa on the north-west finger.', { d: [-4, -4] });
  card(N19, 'Clarissa (Gold)', 'breakwater', 'Under a lawn chair at the roof edge of the Leonida Industrial Services factory.', { d: [-8, -4] });
  card(N19, 'Georgia (Deep Red)', 'millport', 'Under a lawn chair on the front patio of a white mobile home.', { d: [10, 8] });
  card(N19, 'Georgia (Pink)', 'la-perle', 'Sleeping bag on a mattress in a run-down corner house.', { d: [8, 10] });
  card(N19, 'Jesenia (Bronze)', 'balsero', 'Under a lawn chair on top of tank AC-2C at the water analysis compound.', { d: [-10, -6] });
  card(N19, 'Jesenia (Silver)', 'permit-keys', 'Round table under a pink umbrella on the sandbar.', { d: [-10, 8] });
  card(N19, 'Jesenia (Gold)', 'vespucci', 'TV stand next to the receiver, second floor of the north-western mansion.', { d: [-8, -6] });
  card(N19, 'Julia (Bronze)', 'wild-hog-point', 'Floor next to a magazine in the shack by the air traffic control tower.', { d: [6, -8] });
  card(N19, 'Julia (Silver)', 'peacock-bay', 'Railing of the Bounty Plaza rooftop overlook.', { d: [10, 4] });
  card(N19, 'Julia (Gold)', 'ocean-beach', 'Between two magazines on a bed in the middle rooftop courtyard of the Ocean Beach Apartments.', { d: [-4, 4] });
  card(N19, 'Lavinia (Deep Red)', 'draper-island', 'Desk in the office of the Xero Draper Refinery warehouse (restricted area).', { d: [4, -10] });
  card(N19, 'Lavinia (Pink)', 'millport', 'Barrel in the back room of an abandoned gas station.', { d: [-12, 4] });
  card(N19, 'Lavinia (Purple)', 'moreau-pass', 'Shelf inside a derailed red train car in the river.', { d: [-6, 8] });
  card(N19, 'Lenora (Deep Red)', 'tequesta', 'Yellow couch at the base of Saint Malo I Condominiums.', { d: [6, -8] });
  card(N19, 'Lenora (Pink)', 'rockridge', 'Table in Apartment 21, top floor of a colourful complex.', { d: [-6, 8] });
  card(N19, 'Lenora (Purple)', 'tequesta', 'Top railing of the stairs behind Basix Food & Pharmacy.', { d: [-8, 4] });
  card(N19, 'Louise (Bronze)', 'salton', 'Roof edge of the highest rooftop of the abandoned Westbrook building.', { d: [-4, -10] });
  card(N19, 'Louise (Silver)', 'belville', 'Toilet next to a garden gnome in the lakeside rest-area restroom by the dock.', { d: [14, -14] });
  card(N19, 'Louise (Gold)', 'merlins-palace', "Parapet of the northern tower at Merlin's Palace Casino.");
  card(N19, 'Meghan (Bronze)', 'crosstown', 'Second shelf in the upstairs storage room of the Vice City Pawn shop.', { d: [10, -4] });
  card(N19, 'Meghan (Gold)', 'king-gator', 'Top of the tower behind the King Gator Adventure Golf sign on US-183.');
  card(N19, 'Serena (Bronze)', 'mount-kalaga', 'Ground next to a blue couch outside a weathered barn.', { d: [20, 16], conf: 'guess' });
  card(N19, 'Serena (Silver)', 'grayson', 'Lone brown leather chair on the beach.', { d: [-4, -14], conf: 'guess' });

  const HOOK = "America's Next Top Hooker";
  card(HOOK, 'Angel (Bronze)', 'sandbars-n', 'Ledge in front of the Blue Shell Oyster Farms kiosk on the largest northern sandbar.');
  card(HOOK, 'Beverly (Gold)', 'riquezas', 'In the sand by a lone chair on a small northern island.', { d: [4, -12] });
  card(HOOK, 'Crystal', 'bunch-farms', "Floor of the red barn's bathroom, south-east of Bunch Farms.", { d: [6, 6] });
  card(HOOK, 'Drake (Bronze)', 'three-needles', "Men's restroom at the Three Needles Recreational Area.");

  const RAT = 'The Legends of Ratface';
  card(RAT, 'Captain Krueks (Maroon)', 'corsair', "Top of the soap dispenser in the beachfront women's restroom near the north point.", { d: [-4, -6] });
  card(RAT, 'Illuminaughty (Blue)', 'hamlet-prison', 'Side of the kitchen fridge in the second apartment from the left, south of the prison.', { d: [-6, 8] });
  card(RAT, 'Silver Age Betrayal (Purple)', 'watson-bay', 'Chest freezer in the room under a blue house west of Top Fun Drones.', { d: [-18, 4] });
  card(RAT, 'Swallow (Purple)', 'port-gellhorn', 'Cassette display shelf in the living room of a red riverside mobile home off Gellhorn Ave.', { d: [8, -16] });

  const RW = "Right Wing: America's Hero";
  card(RW, 'Great Uncle Sam (White)', 'anakala-sam', "Top of the railing left of the entrance to Anakala Sam's tiki bar.");
  card(RW, 'Great Uncle Sam & President Blunt (White)', 'port-gellhorn', 'Washing machine next to a laundry basket in a mobile home.', { d: [-6, 22], conf: 'guess' });
  card(RW, 'Immigrintasma (Red)', 'abismo', "Women's public restroom on Abismo Key. One guide says the men's restroom at Abismo Key State Park, so check both.", { d: [10, 4] });
  card(RW, 'President Blunt (White)', 'capri', 'Window sill along the side of the Cor Blimey! restaurant, northern Capri.', { d: [2, -12] });

  const ED = 'ED Comics Universe';
  card(ED, 'Femi-Nemesis (Bronze)', 'maroon', 'Blue plastic chair by the railing of a rusted observation tower.');
  card(ED, 'General Surgeon (Pink)', 'pg-south', 'Side of the fridge in a sky-blue trailer in the southern trailer park behind Dirt Merchants Mod Shop.', { d: [6, 8] });

  // =================================================================
  // WAiNK SCANS (Game Checklists + Pro-Gamer unless noted)
  // =================================================================
  scan('Landmark', 'Lawton Co. Paper Mill', 'moreau', 'Ruined paper mill just north of the West Kalaga gas station. Also where the Mario caps quest happens.', { d: [6, 6] });
  scan('Landmark', "Farmer Scrumpy's Apple Orchard", 'farmer-scrumpy', 'Main orchard building, north of Rodgers Ranch & Shooting Range.');
  scan('Landmark', 'Belpoint Lighthouse', 'belpoint', 'Southern tip of Belpoint Island. Take a boat west from Capri.', { d: [0, 8] });
  scan('Landmark', 'Kalaga Lookout', 'kalaga-lookout', 'Peak just below the word "Mount" on the map label. Follow the graffiti up to the ruins.');
  scan('Landmark', 'Dock Ring', 'dock-ring', 'Giant Ferris wheel on the Downtown waterfront off Catalan Blvd.');
  scan('Landmark', 'Grayson Assembly', 'grayson-assembly', 'Front entrance of the assembly building on SR-45, south of Ledford Motorcycle Workshop.');
  scan('Landmark', 'Downtown Periscope', 'periscope', 'Observation structure on Catalan Blvd near the Dock Ring.');
  scan('Landmark', "Howe Dairy Farm's Big Udder", 'howe-dairy', 'Giant cow-print silo just south of CR 62.');
  scan('Landmark', "Tucker's Citrus Farms Water Tower", 'tuckers-citrus', 'Water tower east of Port Gellhorn. You can frame it from the road.');
  scan('Landmark', 'Sky Ride', 'emerald-springs', 'Top of the ride in the park by the Emerald River. Frame it from Black Bear Cafe.', { d: [-4, 6] });
  scan('Landmark', "Outlaw's Cabin", 'outlaws-cabin', 'Collapsing old cabin off Rockledge Rd.');
  scan('Landmark', 'Bonanza Giant', 'bonanza-giant', 'Giant wooden statue on a forested hill in southern Bonanza.');
  scan('Landmark', 'Tallaloko Amphitheater', 'tallaloko-amph', 'Ruined amphitheater with a bell structure by Lake Tallaloko.');
  scan('Landmark', 'Grayson Cairns', 'grayson', 'Stone cairn on a hilltop in Mount Kalaga National Park.', { d: [-20, -10], conf: 'guess' });
  scan('Landmark', 'Old Goliath', 'ambrosia', 'Giant tree trunk at Magnolia Rd and Sycamore Ave.', { d: [-6, -6] });
  scan('Landmark', 'Wild Hog Point Radar Base', 'wild-hog-radar', 'Dome on top of the radar tower at the airfield.');
  scan('Landmark', 'Fleeca Field', 'fleeca-field', 'Stadium in western Rockridge.');
  scan('Landmark', 'Sahara Arena', 'sahara-arena', 'Arena on the eastern Downtown waterfront, south of Bayside. Scan the front sign.');
  scan('Landmark', "IAA's Friends of Freedom", 'friends-of-freedom', 'Memorial plaque in the central Downtown memorial park.', { d: [-4, 6] });
  scan('Landmark', 'Aqua Stadium', 'aqua-stadium', 'Stadium on the southern coast of Gloriana Key.');
  scan('Landmark', 'Courtland Park Stadium', 'courtland-stadium', 'Stadium on the main Catalan Key island.');
  scan('Landmark', 'Pelican Valley Observation Tower', 'pelican-tower', 'Tower off Sweetbay Rd. Climb the raised wooden walkway.');
  scan('Landmark', 'Vice City Sign', 'vc-sign', 'Large sign between Three Toe Lake and VCIA.');
  scan('Landmark', 'Riquezas Keys Radome', 'riquezas', 'Large dome on the big south-western island, past Mile Zero Air Station.', { d: [-8, 4] });

  scan('Curiosity', 'Big Entrance', 'dalton', 'Oversized entrance down the stairs beneath a golden sculpture on Dalton Island.');
  scan('Curiosity', 'Hovercraft Crash', 'sandbars-s', 'Wrecked hovercraft on the north side of the southernmost Sandbars island.', { d: [0, -4] });
  scan('Curiosity', 'Christmas House', 'kl-fleeca', 'House on Sunset Dr with holiday lights and decorations all year.', { d: [-12, -6] });
  scan('Curiosity', 'Promotional Sand Vehicles', 'ocean-beach', 'Cars sculpted from sand on the eastern shore.', { d: [14, 8] });
  scan('Curiosity', 'C0-B8 Fairing', 'featherstone', 'Buried rocket payload fairing on the west coast of an eastern Featherstone island.', { d: [20, 8] });
  scan('Curiosity', 'C0-B8 Engine', 'macalister', 'Half-buried rocket engine in the mountains south-west of Bonanza.', { d: [-30, -20], conf: 'guess' });
  scan('Curiosity', 'C0-B8 Debris', 'featherstone', 'Buried rocket debris on a small Featherstone islet.', { d: [-26, -6] });
  scan('Curiosity', 'Pet Cemetery', 'grayson', 'Hidden row of gravestones off SR-73, southern Grayson.', { d: [4, 22] });
  scan('Curiosity', 'Fairy Lane', 'chariot', 'Small red fairy house in the forest of south-west Lummox County.', { d: [12, 10], conf: 'guess' });
  scan('Curiosity', 'Lovers Lookout', 'kalaga-sw-peak', 'Wooden arch on a forest cliff in south-west Mount Kalaga National Park.', { d: [-16, 14] });
  scan('Curiosity', 'Spaceship House', 'ambrosia', 'Flying-saucer lander on a roof at Maple Ln and Cedar St.', { d: [8, 8] });
  scan('Curiosity', 'Dino Golf', 'frogswater', 'Weathered sign for an abandoned golf course in southern Frogswater.', { d: [0, 16] });
  scan('Curiosity', 'Anti Sugar Residence', 'ambrosia', 'Lone house in a construction zone in western Ambrosia.', { d: [-20, 4] });
  scan('Curiosity', 'Deserted Home', 'emerald-springs', 'Overgrown house by a swamp in south-west Emerald Springs.', { d: [-16, 16] });
  scan('Curiosity', 'Camp Moonflower', 'camp-moonflower', 'Camp entrance sign on Emerald Springs Dr.');
  scan('Curiosity', 'Mermaid Display', 'oceanarium', 'Tank in the loading warehouse of the Vice City Oceanarium.', { d: [-6, 4] });
  scan('Curiosity', 'Unidentified Animal Pen', 'watson-bay', 'UFO-shaped barn in a backyard in northern Watson Bay.', { d: [2, -20] });
  scan('Curiosity', 'Wetman Bay Carcass', 'wetman-bay', 'Creature carcass in the mud on the central Wetman Bay island.', { d: [6, -4] });
  scan('Curiosity', 'Vibrant Pond', 'gullet-marsh', 'Warning sign beside a lake full of fish in southern Gullet Marsh.', { d: [4, 22] });
  scan('Curiosity', 'Desert Island Piano', 'shoeless-keys', 'Upright piano on a tiny island in the western Shoeless Keys.', { d: [-14, 4] });
  scan('Curiosity', 'Goose Key Carcass', 'goose-key', 'Creature carcass on the north shore near Mile Zero Air Station. A meteorite fragment lies beside it.', { d: [-4, -8] });
  scan('Curiosity', 'Fossilized Prints', 'west-kalaga', 'Fossil footprints in the river valley north-west of Taco Bomb West Kalaga, south-east of Moreau.', { d: [-10, -12] });
  scan('Curiosity', 'Selkie Hole', 'selkie-hole', 'Diving spot down the stairs by the buildings. Five meteorite chunks wait in the flooded tunnels.', { d: [4, -4] });
  scan('Curiosity', 'Beach Party Site', 'permit-keys', 'Wooden platform just north-east of the Fingerpost on the central island. The Pricilla Pace (Silver) card is here.', { d: [10, -10] });
  scan('Curiosity', 'No Flusher Homestead', 'wetman-bay', 'Homestead cabin east of the Fishing Stacks outpost on the middle island.', { d: [16, 2] });

  scan('Sculpture', 'Triangler Sculpture', 'corsair', 'Dolphin-like monument in the water beside the road leading west off Corsair Key. Park off-road to scan.', { src: 'gc', d: [-22, -2] });
  scan('Sculpture', 'Pixel Fountain', 'pixel-fountain', 'Cube-shaped fountain where Catalan Blvd meets South Vice Ave.', { src: 'gc' });
  scan('Sculpture', 'Neptune Rises', 'washington-beach', 'Huge figure clutching a car under the southern bridge to Flamingo Island.', { src: 'gc', d: [-16, 6], conf: 'guess' });
  scan('Sculpture', 'Vice Museum of Art Sculpture', 'vice-museum', 'Outside the art museum. Scannable from Atlantic Ave.', { src: 'gc' });
  scan('Sculpture', 'Princess Robot Bubblegum Statue', 'y-hotel', 'Three character statues by the hotel parking lot. Frame all three.', { src: 'gc', d: [-4, 4] });
  scan('Sculpture', 'Grassrivers Visitor Center Statue', 'shoeless-keys', 'West side of Grassrivers Cafe and Deli on Old Fort Rd.', { src: 'gc', d: [8, -8] });
  scan('Sculpture', 'Blanco Memorial', 'salton-memorial', 'Memorial just north of Starfish Island.', { src: 'gc' });
  scan('Sculpture', 'Junkyard T-Rex', 'kalaga-reservoir', "Dinosaur figure off Sassafrass Rd, north of the reservoir and east of Bret's hunting cabin.", { src: 'gc', d: [6, -14] });
  scan('Sculpture', 'Catalan Blvd Garden', 'bayside-park', 'Giant hand with a bird on one finger. Scan the hand.', { src: 'gc' });
  scan('Sculpture', 'Leonida Snow', 'leonida-snow', 'Small park where Mariner’s Hwy meets Catalan Blvd.', { src: 'gc' });
  scan('Sculpture', 'Flam Gummies', 'bayside', 'Giant gummy bears floating in the water in front of Panos Plaza. Scan from the waterfront.', { src: 'gc', d: [12, 4] });
  scan('Sculpture', 'Colossus', 'colossus', 'Bronze rock-like figure at Marina Vista Cir and South Vice Ave.', { src: 'gc' });
  scan('Sculpture', 'The Grand Turkey of Capri', 'capri', 'Turkey statue in the waterfront park on the east side of Capri.', { src: 'gc', d: [16, 0] });
  scan('Sculpture', 'Chariot to Valhalla', 'chariot', 'Roadside memorial on Rockledge Rd. Pull over next to it.', { src: 'gc' });
  scan('Sculpture', 'Mother Rushwood', 'mother-rushwood', 'Wooden statue on Tallaloko Lake Rd near the goods yard.', { src: 'gc' });
  scan('Sculpture', 'Buckskin Swamp Totem', 'buckskin-swamp', 'Totem pole behind a sign on a small island.', { src: 'gc', d: [-4, 12] });
  scan('Sculpture', 'Thrillbilly Mascot', 'thrillbilly', 'Tire-built figure beside the Thrillbilly Mud Club track.', { src: 'gc', d: [-6, 4] });
  scan('Sculpture', 'Monument of Leonida', 'pg-north', 'Stone column on a wooded cliff in north Port Gellhorn. A separate scan from the Monument of Leonidan Supremacy.', { src: 'gc', d: [-6, -22] });

  const NF = 'No Flusher tag';
  scan(NF, 'Banana Hole tag', 'ocean-beach', 'Painted on the ground at Shore Dr and Huevo St, outside The Banana Hole.', { src: 'gc', d: [-8, 26] });
  scan(NF, 'Washington Beach Manhole', 'washington-beach', 'Manhole cover on the sidewalk, second building north of the helipad building.', { src: 'gc', d: [-6, -6] });
  scan(NF, 'The Buckingham tag', 'ocean-beach', 'Painted on Shore Dr across from The Buckingham.', { src: 'gc', d: [-8, 18] });
  scan(NF, 'Rocco Rich tag', 'ocean-beach', 'Spray tag outside the Rocco Rich jewelry shop.', { src: 'gc', d: [-10, 10] });
  scan(NF, 'Aural Expert tag', 'ocean-beach', 'Sewer cover south-east of the Aural Expert electronics store.', { src: 'gc', d: [-10, 2] });
  scan(NF, 'Legendary Custom Jewelry tag', 'ocean-beach', 'Sewer cover south-east of the jewelry shop.', { src: 'gc', d: [-10, -6] });
  scan(NF, 'Ring of Fire Chili House tag', 'ocean-beach', 'Beside a sewer cover north-west of the chili house.', { src: 'gc', d: [-10, -14] });
  scan(NF, 'Ring of Fire Electric Box tag', 'ocean-beach', 'Painted by an electric box a short walk north of the chili house tag.', { src: 'gc', d: [-8, -20] });
  scan(NF, 'WHS Ocean Beach tag', 'ocean-beach', 'Near the WHS shoe store on the strip.', { src: 'gc', d: [-14, 6] });
  scan(NF, 'Easy Electronics tag', 'ocean-beach', 'Sidewalk just south of Easy Electronics.', { src: 'gc', d: [-12, -2] });
  scan(NF, 'Hotel Sapphire tag', 'oldby', 'Sidewalk beside Hotel Sapphire at Oleander Blvd and SW 4th St.', { src: 'gc', d: [6, 4], conf: 'guess' });
  scan(NF, 'Portside Lane tag', 'starfish', 'Ground along Portside Lane, east of Starfish Island.', { src: 'gc', d: [16, 0] });
  scan('Peewees billboard', 'Mariana County Billboard', 'richardson-hunting', 'Between the highway lanes east of Richardson Hunting Supplies. Scan the west face.', { src: 'gc', d: [10, 0] });
  scan('Peewees billboard', 'Vice-Dale Billboard', 'balsero', "South of a highway ramp north-west of Ron Stop'n'Snack. Scan the west side.", { src: 'gc', d: [-16, -12] });
  scan('Peewees billboard', 'Leonard County Billboard', 'lake-leonida', 'East side of the highway along the eastern shore of Lake Leonida. Scan the north face.', { src: 'gc', d: [64, 0] });
  scan('Peewees billboard', 'Lummox County Billboard', 'grayson', 'West side of the highway south-east of Grayson. Scan the north side.', { src: 'gc', d: [26, 18] });

  // =================================================================
  // METEORITE CHUNKS
  // =================================================================
  met('Southern Sandbar beach', 'sandbars-s', 'On the north-facing beach of the southernmost Sandbars island.', { d: [4, -2] });
  met('Northern Sandbar pier', 'sandbars-n', 'Under the pier on the largest northern Sandbars island.', { src: ['pat', 'powerup'], d: [-6, 2] });
  met('Eastern Sandbar tip', 'sandbars-e', 'North tip of the easternmost Sandbars island.', { d: [0, -4] });
  met('Eastern cluster islet', 'sandbars-e', 'South tip of the bottom small island in the eastern Sandbars cluster.', { src: ['pat', 'powerup'], d: [-6, 14] });
  met('Zephyr Islands boat', 'zephyr', 'North-east coast of the biggest island, by a grounded luxury boat.');
  met('Saint Attaway (west)', 'saint-attaway', 'Small western island of the group.', { d: [-14, 0] });
  met('Saint Attaway (south-east)', 'saint-attaway-se', 'By the trees on the biggest cliff of the south-eastern island.');
  met('Frampton Islands (large island)', 'frampton', 'West coast of the large island, with a second pickup on the cliff on its north side.', { d: [-14, 0] });
  met('Frampton Islands (south-east)', 'frampton-se', 'South-east tip of the south-eastern island. The matching coast of its southern neighbour may have one too (unconfirmed).');
  met('East Lummox islet', 'e-lummox-islet', 'Tiny island north of the "M" in the county label. The chunk sits on a log.', { conf: 'guess' });
  met('Sands of Time', 'sands-of-time', 'Chunks at the Sands of Time retirement home.', { src: 'powerup' });
  met('Crashed yacht (underwater)', 'kenton', "Wreck east of Kenton's shop.", { src: 'powerup', d: [28, 6] });
  met('Crashed helicopter (underwater)', 'kl-pns', "East of the southern tip of the island that lies east of Kenton's.", { src: 'powerup', d: [76, 34], conf: 'guess' });
  met('Sunken research lab (underwater)', 'hardin-lab', 'Underwater lab wreck east of Little Hardin Island.', { src: 'powerup' });
  met('Goose Key Carcass', 'goose-key', 'Next to the creature carcass on the north shore near Mile Zero Air Station.', { src: 'gc', d: [2, -10] });
  met('Table Rock slope', 'table-rock', 'Purple meteorite-like rock on the eastern slope below the Table Rock summit.', { src: 'showgamer', conflict: 'GTA Vice Guides describes a crater at an eastern Mount Kalaga campsite south of Dawson Dam instead.' });

  // =================================================================
  // EASTER EGGS, QUESTS, VEHICLES
  // =================================================================
  add('vehicles', '"ASS MAN" Phoenix', 'hamlet', 'Red Phoenix with the "ASS MAN" plate (a Seinfeld nod), collected from the Hamlet police impound.', { src: ['redbull'], d: [10, -8] });
  add('easter', 'Snake in the trunk', 'belville', 'Open the trunk of the car parked outside the conspiracy garage house for a jump scare.', { src: ['showgamer'], d: [-2, 10] });
  add('easter', 'Liberty City memoir', 'kl-safehouse', "On the side table by the back door of Jason's house: a mobster's memoir about 2008.", { src: ['redbull', 'gz'], req: 'Missable: Chapter 1 only' });
  add('easter', "Michael's yacht?", 'kl-safehouse', "A boat in Jason's garden carries a Los Santos GPS map.", { src: ['redbull'], d: [6, 4], conf: 'guess' });
  add('easter', 'Love Fist sticker', 'starlet-motel', 'A Love Fist sticker and a purple hippo bin at the Starlet Motel.', { src: ['redbull'], d: [10, 2] });
  add('easter', 'SOS island phone', 'bobcat-lonely', '"SOS" and "Send Beer" are written in the sand. A phone near the first S plays a found-footage recording. The meteorites here are listed separately.', { src: ['showgamer', 'gvg'], d: [-6, -4], conflict: 'GTA Vice Guides puts the SOS sandbar west of the Keys and saw no reward.' });
  add('quests', 'Alien bunker (keypad 2314)', 'abandoned-site', 'Enter code 2314 on the keypad, restore power at the control panel, feed the alien milk, then carry it outside for the UFO to collect.', { src: ['gvg', 'redbull'], reward: 'Permanent max health, stamina and Focus', conflict: 'Open Leonida describes the lab at South Point Airfield, reached through a dream sequence after the UFO abduction.' });
  add('quests', 'Mount Kalaga tower bunker', 'kalaga-fire-tower', 'Climb the tall metal tower near the summit and read the 5-digit code on the upper platform sign (reported as 69185). It opens the keypad on the small wooden shack at the base. The logbook has a strange drawing.', { src: ['showgamer'], d: [-8, -6], reward: 'Lore only' });

  if (typeof module === 'undefined' || !module.exports) root.LEONIDA_DATA = D;
})(typeof window !== 'undefined' ? window : globalThis);
