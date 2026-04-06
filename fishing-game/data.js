const WORLD_W = 10000, WORLD_H = 7000;

// Locked areas
const AREA_LOCKS = {
  river:          {name:'River',          cost:200,  unlocked:false},
  ocean:          {name:'Ocean',          cost:600,  unlocked:false},
  deep_sea:       {name:'Deep Sea',       cost:2500, unlocked:false},
  ice_lake:       {name:'Frozen Lake',    cost:900,  unlocked:false},
  deep_ocean_key: {name:'Volcano Island', cost:5000, unlocked:false},
  midnight_key:   {name:'Midnight Zone',  cost:8000, unlocked:false},
  docks_key:      {name:'The Docks',      cost:300,  unlocked:false},
};

const BARRIER_ZONES = [
  {id:'river_barrier',      x:0,    y:1040, w:10000,h:280,  lockKey:'river'},
  {id:'ocean_barrier',      x:4100, y:0,    w:5900, h:7000, lockKey:'ocean'},
  {id:'deep_barrier',       x:0,    y:3460, w:2300, h:740,  lockKey:'deep_sea'},
  {id:'ice_barrier',        x:60,   y:60,   w:880,  h:680,  lockKey:'ice_lake'},
  {id:'volcano_barrier',    x:2780, y:3780, w:440,  h:440,  lockKey:'deep_ocean_key'},
  {id:'midnight_barrier',   x:1180, y:4780, w:840,  h:640,  lockKey:'midnight_key'},
];

const ZONES = [
  {id:'grass',         x:0,    y:0,    w:10000,h:7000, color:'#4a7a30', fishable:false},
  {id:'snow_ground',   x:0,    y:0,    w:900,  h:700,  color:'#ddeeff', fishable:false},
  {id:'ice_shore',     x:80,   y:80,   w:560,  h:440,  color:'#c8e8f8', fishable:false},
  {id:'ice_lake',      x:140,  y:140,  w:440,  h:320,  color:'#5ab8d8', name:'Frozen Lake', fishable:true, biome:'ice_lake', lockKey:'ice_lake'},
  {id:'arctic_water',  x:100,  y:50,   w:300,  h:250,  color:'#0a4a6a', name:'Arctic Ocean', fishable:true, biome:'arctic', lockKey:'ice_lake'},
  {id:'river_shore_n', x:0,    y:1060, w:10000,h:30,   color:'#c9a96e', fishable:false},
  {id:'river_shore_s', x:0,    y:1290, w:10000,h:30,   color:'#c9a96e', fishable:false},
  {id:'river',         x:0,    y:1090, w:10000,h:200,  color:'#2a7fa8', name:'River', fishable:true, biome:'river', lockKey:'river'},
  {id:'pond_shore',    x:340,  y:1820, w:520,  h:420,  color:'#c9a96e', fishable:false},
  {id:'pond',          x:380,  y:1860, w:440,  h:340,  color:'#2a7fa8', name:'Pond',  fishable:true, biome:'pond'},
  {id:'ocean_shore',   x:4100, y:0,    w:360,  h:6000, color:'#c9a96e', fishable:false},
  {id:'ocean',         x:4460, y:0,    w:1140, h:6000, color:'#1a5a8a', name:'Ocean', fishable:true, biome:'ocean', lockKey:'ocean'},
  {id:'deep_ocean',    x:4900, y:0,    w:700,  h:6000, color:'#0d3d6a', name:'Deep Ocean', fishable:true, biome:'ocean_deep', lockKey:'ocean'},
  // Coral reef — on the beach shore, accessible by walking
  {id:'coral_reef',    x:4200, y:1200, w:200,  h:400,  color:'#1a6a7a', name:'Coral Reef', fishable:true, biome:'coral', lockKey:'ocean'},
  {id:'cave_ground',   x:0,    y:3460, w:2300, h:740,  color:'#0d3d5c', fishable:false},
  {id:'cave_water1',   x:100,  y:3580, w:380,  h:280,  color:'#1a5a8a', name:'Deep Pool', fishable:true, biome:'deep_sea', lockKey:'deep_sea'},
  {id:'cave_water2',   x:600,  y:3630, w:320,  h:240,  color:'#1a5a8a', name:'Deep Pool', fishable:true, biome:'deep_sea', lockKey:'deep_sea'},
  {id:'cave_water3',   x:1050, y:3580, w:280,  h:260,  color:'#1a5a8a', name:'Deep Pool', fishable:true, biome:'deep_sea', lockKey:'deep_sea'},
  // Dock — wide platform, big ocean south
  {id:'dock_platform', x:1600, y:2600, w:1800, h:500,  color:'#7a5a14', name:'The Docks', fishable:false},
  // Dock edge — walkable strip right at water
  {id:'dock_edge',     x:1600, y:3080, w:1800, h:40,   color:'#7a5a14', fishable:false},
  // Big ocean directly south of dock — always fishable
  {id:'dock_ocean',    x:1600, y:3100, w:1800, h:1100, color:'#1a5a8a', name:'Ocean',     fishable:true, biome:'ocean'},
  {id:'town_sq',       x:1700, y:1500, w:700,  h:600,  color:'#8a7a6a', name:'Town Square', fishable:false},
  {id:'path_n',        x:1980, y:700,  w:140,  h:800,  color:'#9a8a78', fishable:false},
  {id:'path_s',        x:1980, y:2100, w:140,  h:500,  color:'#9a8a78', fishable:false},
  {id:'path_e',        x:2400, y:1720, w:2000, h:160,  color:'#9a8a78', fishable:false},
  {id:'path_w',        x:200,  y:1720, w:1500, h:160,  color:'#9a8a78', fishable:false},
  {id:'path_cave',     x:1980, y:3100, w:140,  h:360,  color:'#9a8a78', fishable:false},
  {id:'path_snow',     x:1980, y:0,    w:140,  h:700,  color:'#9a8a78', fishable:false},
  {id:'bridge_main',   x:1980, y:1060, w:140,  h:260,  color:'#8b6a1a', fishable:false},
  {id:'bridge_east',   x:3800, y:1060, w:140,  h:260,  color:'#8b6a1a', fishable:false},
  {id:'bridge_west',   x:600,  y:1060, w:140,  h:260,  color:'#8b6a1a', fishable:false},
  // Swamp biome
  {id:'swamp',         x:2800, y:2000, w:600,  h:500,  color:'#2d4a1a', name:'Swamp', fishable:false},
  {id:'swamp_water',   x:2900, y:2100, w:400,  h:300,  color:'#1a3a2a', name:'Swamp Fishing', fishable:true, biome:'swamp'},
  // Volcano island
  {id:'volcano_island',x:2800, y:3800, w:400,  h:400,  color:'#3a1a0a', name:'Volcano Island', fishable:false},
  {id:'lava_pool',     x:2880, y:3880, w:240,  h:240,  color:'#8a2a0a', name:'Lava Pool', fishable:true, biome:'lava', lockKey:'deep_ocean_key'},
  // Midnight zone
  {id:'midnight_zone', x:1200, y:4800, w:800,  h:600,  color:'#020208', name:'Midnight Zone', fishable:true, biome:'midnight', lockKey:'midnight_key'},
];

const ZONE_ORDER = [
  'grass',
  'snow_ground','ice_shore',
  'river_shore_n','river_shore_s','river',
  'pond_shore','pond',
  'ocean_shore','ocean','deep_ocean','coral_reef',
  'cave_ground','cave_water1','cave_water2','cave_water3',
  'dock_ocean','dock_edge','dock_platform',
  'town_sq','path_n','path_s','path_e','path_w','path_cave','path_snow',
  'bridge_main','bridge_east','bridge_west',
  'ice_lake','arctic_water',
  'swamp','swamp_water',
  'volcano_island','lava_pool',
  'midnight_zone',
];

const WALKABLE_IDS = new Set([
  'grass','snow_ground','ice_shore',
  'river_shore_n','river_shore_s',
  'pond_shore',
  'ocean_shore',
  'cave_ground',
  'dock_platform','dock_edge',
  'town_sq','path_n','path_s','path_e','path_w','path_cave','path_snow',
  'bridge_main','bridge_east','bridge_west',
  'swamp',
  'volcano_island',
]);

const BUILDINGS = [
  {id:'rod_shop',   x:1720, y:1520, w:170, h:130, color:'#5a3a10', roofColor:'#8b1a1a', label:'Rod Shop',  type:'shop'},
  {id:'bait_shop',  x:1920, y:1520, w:170, h:130, color:'#1a3a5a', roofColor:'#1a5a8a', label:'Bait Shop', type:'bait'},
  {id:'sell_town',  x:2120, y:1520, w:170, h:130, color:'#1a4a1a', roofColor:'#1a8a1a', label:'Sell Fish', type:'sell'},
  {id:'sell_dock',  x:1650, y:2620, w:130, h:110, color:'#3a5a1a', roofColor:'#2a8a1a', label:'Sell Fish', type:'sell'},
  {id:'dock_bait',  x:1820, y:2620, w:130, h:110, color:'#1a3a5a', roofColor:'#1a5a8a', label:'Bait Shop', type:'bait'},
  {id:'boat_shop',  x:2200, y:2520, w:160, h:110, color:'#3a2a10', roofColor:'#6a4a10', label:'Boat Shop', type:'boat'},
  {id:'dock_toll',  x:1955, y:2560, w:80,  h:60,  color:'#5a4a10', roofColor:'#8a6a10', label:'Enter Docks', type:'dock_toll'},
];

const TREES = [];
(function(){
  const rng = seed => { let s=seed; return ()=>{ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; }; };
  const r = rng(77);
  const avoid = [
    {x:1600,y:1400,w:1000,h:900},   // town
    {x:1500,y:2500,w:2200,h:900},   // docks + dock ocean
    {x:0,   y:1040,w:8000,h:280},   // river band + shores
    {x:4050,y:0,   w:5950,h:7000},  // ocean + wide beach
    {x:0,   y:3400,w:2400,h:800},   // cave
    {x:0,   y:0,   w:950, h:750},   // snow biome
    {x:1880,y:0,   w:240, h:6000},  // main N-S path
    {x:200, y:1640,w:2200,h:240},   // W-E path
    {x:2400,y:1640,w:2000,h:240},   // E path
    {x:300, y:1800,w:600, h:450},   // pond + shore
    {x:0,   y:1090,w:8000,h:200},   // river water itself
    {x:380, y:1860,w:440, h:340},   // pond water
    {x:140, y:140, w:440, h:320},   // ice lake
    {x:2780,y:1980,w:640, h:540},   // swamp
    {x:5480,y:1480,w:440, h:440},   // volcano island
  ];
  function blocked(tx,ty,tr){
    for(const a of avoid) if(tx>a.x-tr&&tx<a.x+a.w+tr&&ty>a.y-tr&&ty<a.y+a.h+tr) return true;
    return false;
  }
  for(let i=0;i<320;i++){
    const tx=r()*9800+100, ty=r()*6800+100;
    const cr=16+r()*20;
    if(!blocked(tx,ty,cr)) TREES.push({x:tx,y:ty,r:cr,inner:'#2d6018',outer:'#1e4010'});
  }
  for(let i=0;i<25;i++){
    const tx=60+r()*820, ty=60+r()*620;
    const cr=12+r()*16;
    TREES.push({x:tx,y:ty,r:cr,inner:'#4a8a9a',outer:'#2a5a6a',snow:true});
  }
})();

const BIOMES = {
  pond:      {name:'Pond',        fish:[
    {id:'minnow',   name:'Minnow',       rarity:'common',    val:2,    exp:1,   w:50},
    {id:'bluegill', name:'Bluegill',     rarity:'common',    val:5,    exp:2,   w:30},
    {id:'catfish',  name:'Catfish',      rarity:'uncommon',  val:15,   exp:6,   w:14},
    {id:'g_carp',   name:'Golden Carp',  rarity:'rare',      val:45,   exp:18,  w:4},
    {id:'koi',      name:'Ancient Koi',  rarity:'legendary', val:250,  exp:60,  w:1},
    {id:'boot',     name:'Old Boot',     rarity:'junk',      val:0,    exp:0,   w:1},
    {id:'ghost_koi',name:'Ghost Koi',    rarity:'mythic',    val:5000, exp:500, w:0.1, eventOnly:'fog'},
  ]},
  river:     {name:'River',       fish:[
    {id:'trout',    name:'Trout',        rarity:'common',    val:7,    exp:3,   w:40},
    {id:'bass',     name:'Bass',         rarity:'common',    val:10,   exp:4,   w:28},
    {id:'salmon',   name:'Salmon',       rarity:'uncommon',  val:22,   exp:9,   w:18},
    {id:'pike',     name:'Pike',         rarity:'rare',      val:65,   exp:22,  w:8},
    {id:'sturgeon', name:'Sturgeon',     rarity:'epic',      val:160,  exp:45,  w:4},
    {id:'r_dragon', name:'River Dragon', rarity:'legendary', val:400,  exp:90,  w:1},
    {id:'storm_pike',name:'Storm Pike',  rarity:'legendary', val:600,  exp:120, w:0.5, eventOnly:'rain'},
  ]},
  ocean:     {name:'Ocean',       fish:[
    {id:'mackerel', name:'Mackerel',     rarity:'common',    val:22,   exp:5,   w:38},
    {id:'tuna',     name:'Tuna',         rarity:'uncommon',  val:75,   exp:14,  w:24},
    {id:'clownfish',name:'Clownfish',    rarity:'uncommon',  val:55,   exp:11,  w:18},
    {id:'swordfish',name:'Swordfish',    rarity:'rare',      val:200,   exp:32,  w:12},
    {id:'octopus',  name:'Octopus',      rarity:'epic',      val:420,  exp:58,  w:5},
    {id:'shark',    name:'Shark',        rarity:'epic',      val:480,  exp:65,  w:2},
    {id:'whale',    name:'Blue Whale',   rarity:'legendary', val:2000,  exp:160, w:0.5},
    {id:'storm_whale',name:'Storm Whale',rarity:'mythic',    val:15000,exp:1500,w:0.1, eventOnly:'rain'},
  ]},
  ocean_deep:{name:'Deep Ocean',  fish:[
    {id:'d_tuna',   name:'Tuna',         rarity:'common',    val:20,   exp:8,   w:30},
    {id:'d_sword',  name:'Swordfish',    rarity:'uncommon',  val:55,   exp:20,  w:25},
    {id:'d_shark',  name:'Shark',        rarity:'rare',      val:130,  exp:40,  w:20},
    {id:'d_whale',  name:'Blue Whale',   rarity:'epic',      val:500,  exp:100, w:10},
    {id:'kraken',   name:'Kraken',       rarity:'legendary', val:1500, exp:250, w:2},
    {id:'sea_god',  name:'Sea God',      rarity:'mythic',    val:8000, exp:800, w:0.3},
  ]},
  deep_sea:  {name:'Deep Sea',    fish:[
    {id:'angler',   name:'Anglerfish',   rarity:'uncommon',  val:55,   exp:22,  w:32},
    {id:'viper',    name:'Viperfish',    rarity:'rare',      val:130,  exp:44,  w:24},
    {id:'ghost',    name:'Ghost Fish',   rarity:'rare',      val:180,  exp:55,  w:20},
    {id:'squid',    name:'Giant Squid',  rarity:'epic',      val:320,  exp:85,  w:14},
    {id:'serpent',  name:'Sea Serpent',  rarity:'legendary', val:1300, exp:220, w:4},
    {id:'leviathan',name:'Leviathan',    rarity:'mythic',    val:6000, exp:600, w:0.5},
    {id:'col_squid',name:'Colossal Squid',rarity:'legendary',val:8000, exp:800, w:0.3, eventOnly:'fog',fogOnly:true},
  ]},
  ice_lake:  {name:'Frozen Lake', fish:[
    {id:'ice_min',  name:'Ice Minnow',   rarity:'common',    val:18,    exp:3,   w:40},
    {id:'frost_t',  name:'Frost Trout',  rarity:'uncommon',  val:65,   exp:12,  w:28},
    {id:'crystal',  name:'Crystal Fish', rarity:'rare',      val:220,  exp:35,  w:18},
    {id:'snow_crab',name:'Snow Crab',    rarity:'epic',      val:550,  exp:70,  w:10},
    {id:'ice_drag', name:'Ice Dragon',   rarity:'legendary', val:2400, exp:200, w:2},
    {id:'aurora_dragon',name:'Aurora Dragon',rarity:'mythic',val:18000,exp:1800,w:0.05,eventOnly:'aurora'},
  ]},
  swamp:     {name:'Swamp',       fish:[
    {id:'mudfish',      name:'Mudfish',       rarity:'common',    val:14,    exp:2,   w:45},
    {id:'swamp_eel',    name:'Swamp Eel',     rarity:'uncommon',  val:55,   exp:10,  w:20},
    {id:'giant_frog',   name:'Giant Frog',    rarity:'rare',      val:180,   exp:28,  w:10},
    {id:'swamp_dragon', name:'Swamp Dragon',  rarity:'epic',      val:620,  exp:75,  w:4},
    {id:'ancient_turtle',name:'Ancient Turtle',rarity:'legendary',val:2600, exp:210, w:1},
    {id:'swamp_witch',  name:'Swamp Witch Fish',rarity:'mythic',  val:7000, exp:700, w:0.2, eventOnly:'fog'},
  ]},
  coral:     {name:'Coral Reef',  fish:[
    {id:'parrotfish',   name:'Parrotfish',    rarity:'common',    val:28,   exp:6,   w:40},
    {id:'lionfish',     name:'Lionfish',      rarity:'uncommon',  val:85,   exp:15,  w:22},
    {id:'seahorse',     name:'Seahorse',      rarity:'rare',      val:240,  exp:38,  w:12},
    {id:'reef_shark',   name:'Reef Shark',    rarity:'epic',      val:520,  exp:68,  w:5},
    {id:'coral_queen',  name:'Coral Queen',   rarity:'legendary', val:3000, exp:240, w:1},
    {id:'rainbow_fish', name:'Rainbow Fish',  rarity:'mythic',    val:9000, exp:900, w:0.2, eventOnly:'aurora'},
  ]},
  lava:      {name:'Lava Pool',   fish:[
    {id:'lava_eel',     name:'Lava Eel',      rarity:'uncommon',  val:60,   exp:24,  w:35},
    {id:'magma_crab',   name:'Magma Crab',    rarity:'rare',      val:150,  exp:50,  w:20},
    {id:'fire_fish',    name:'Fire Fish',     rarity:'epic',      val:400,  exp:95,  w:10},
    {id:'volcano_lord', name:'Volcano Lord',  rarity:'legendary', val:2000, exp:300, w:3},
    {id:'phoenix_fish', name:'Phoenix Fish',  rarity:'mythic',    val:12000,exp:1200,w:0.5},
  ]},
  arctic:    {name:'Arctic Ocean',fish:[
    {id:'arctic_cod',   name:'Arctic Cod',    rarity:'common',    val:10,   exp:4,   w:42},
    {id:'narwhal',      name:'Narwhal',       rarity:'rare',      val:120,  exp:42,  w:15},
    {id:'polar_shark',  name:'Polar Shark',   rarity:'epic',      val:300,  exp:82,  w:6},
    {id:'ice_whale',    name:'Ice Whale',     rarity:'legendary', val:1600, exp:260, w:1},
    {id:'aurora_fish',  name:'Aurora Fish',   rarity:'mythic',    val:11000,exp:1100,w:0.3, eventOnly:'aurora'},
  ]},
  midnight:  {name:'Midnight Zone',fish:[
    {id:'midnight_eel', name:'Midnight Eel',  rarity:'uncommon',  val:70,   exp:28,  w:30},
    {id:'abyssal_ray',  name:'Abyssal Ray',   rarity:'rare',      val:180,  exp:58,  w:20},
    {id:'nightmare_fish',name:'Nightmare Fish',rarity:'epic',     val:500,  exp:110, w:10},
    {id:'void_kraken',  name:'Void Kraken',   rarity:'legendary', val:3000, exp:400, w:2},
    {id:'the_darkness', name:'The Darkness',  rarity:'mythic',    val:20000,exp:2000,w:0.1},
  ]},
};

const RARITY_DIFF = {
  junk:      {zoneSize:0.38, speed:1.2, erratic:0.4},
  common:    {zoneSize:0.28, speed:1.8, erratic:0.8},
  uncommon:  {zoneSize:0.22, speed:2.4, erratic:1.3},
  rare:      {zoneSize:0.16, speed:3.2, erratic:2.0},
  epic:      {zoneSize:0.12, speed:4.0, erratic:2.8},
  legendary: {zoneSize:0.08, speed:5.0, erratic:3.8},
  mythic:    {zoneSize:0.05, speed:6.5, erratic:5.0},
};

const MUTATIONS = [
  {id:'golden',  name:'Golden',  mult:3,   color:'#ffd700', chance:0.04},
  {id:'albino',  name:'Albino',  mult:2,   color:'#ffffff', chance:0.06},
  {id:'giant',   name:'Giant',   mult:2.5, color:'#ff6600', chance:0.05},
  {id:'shadow',  name:'Shadow',  mult:4,   color:'#6600ff', chance:0.02},
  {id:'crystal', name:'Crystal', mult:5,   color:'#00ffff', chance:0.01},
];

const RODS = [
  {id:'stick',    name:'Stick Rod',   cost:0,     luck:1,  speed:1,  strength:1,  stability:1,  zoneBonus:0,    desc:'A basic stick and string',      ability:null},
  {id:'basic',    name:'Basic Rod',   cost:50,    luck:2,  speed:2,  strength:2,  stability:3,  zoneBonus:0.04, desc:'A proper fishing rod',           ability:null},
  {id:'pro',      name:'Pro Rod',     cost:300,   luck:3,  speed:4,  strength:3,  stability:5,  zoneBonus:0.08, desc:'For serious anglers',            ability:'steady'},
  {id:'carbon',   name:'Carbon Rod',  cost:1000,  luck:4,  speed:6,  strength:5,  stability:6,  zoneBonus:0.14, desc:'Lightweight carbon fiber',       ability:'swift'},
  {id:'golden',   name:'Golden Rod',  cost:5000,  luck:7,  speed:7,  strength:8,  stability:8,  zoneBonus:0.22, desc:'Legendary golden rod',           ability:'lucky'},
  {id:'mythic',   name:'Mythic Rod',  cost:20000, luck:10, speed:10, strength:10, stability:9,  zoneBonus:0.35, desc:'Forged from stardust',           ability:'mythic'},
  {id:'swamp_rod',name:'Swamp Rod',   cost:800,   luck:5,  speed:3,  strength:7,  stability:8,  zoneBonus:0.28, desc:'Heavy swamp wood rod',           ability:'swamp',  biomeBonus:'swamp'},
  {id:'coral_rod',name:'Coral Rod',   cost:2000,  luck:8,  speed:5,  strength:4,  stability:5,  zoneBonus:0.18, desc:'Lightweight coral rod',          ability:'coral',  biomeBonus:'coral'},
  {id:'volcano_rod',name:'Volcano Rod',cost:8000, luck:6,  speed:9,  strength:9,  stability:3,  zoneBonus:0.12, desc:'Forged in volcanic heat',        ability:'volcano',biomeBonus:'lava'},
  {id:'ice_rod',  name:'Ice Rod',     cost:3000,  luck:7,  speed:4,  strength:6,  stability:9,  zoneBonus:0.38, desc:'Frozen solid, ultra stable',     ability:'ice',    biomeBonus:'ice_lake'},
  {id:'deep_rod', name:'Abyss Rod',   cost:15000, luck:9,  speed:8,  strength:10, stability:7,  zoneBonus:0.30, desc:'From the midnight zone',         ability:'deep',   biomeBonus:'midnight'},
  {id:'speed_rod',name:'Speed Rod',   cost:600,   luck:2,  speed:10, strength:2,  stability:2,  zoneBonus:0.05, desc:'Blazing fast, tiny zone',        ability:'speed'},
  {id:'tank_rod', name:'Tank Rod',    cost:600,   luck:2,  speed:1,  strength:10, stability:10, zoneBonus:0.50, desc:'Huge zone, very slow cast',      ability:'tank'},
];
// Rod ability descriptions shown in shop
const ROD_ABILITIES = {
  steady:  {name:'Steady Hand',   desc:'Escape bar 25% slower'},
  swift:   {name:'Swift Cast',    desc:'Bite wait time -40%'},
  lucky:   {name:'Golden Touch',  desc:'+15% sell value on catch'},
  mythic:  {name:'Void Sense',    desc:'Reveals fish rarity before catch'},
  swamp:   {name:'Swamp Mastery', desc:'+20% luck in swamp biome'},
  coral:   {name:'Reef Sense',    desc:'+20% luck in coral biome'},
  volcano: {name:'Fire Reel',     desc:'Catch progress fills 20% faster'},
  ice:     {name:'Frozen Zone',   desc:'Zone falls 50% slower'},
  deep:    {name:'Abyss Vision',  desc:'Fish dot always visible on bar'},
  speed:   {name:'Instant Cast',  desc:'Cast time reduced by 80%'},
  tank:    {name:'Iron Wall',     desc:'Escape bar fills 50% slower'},
};
function rodLuck(rod)  { return (rod.luck-1)*0.04; }
function rodSpeed(rod) { return 3200-(rod.speed-1)*280; }
function rodZoneBonus(rod) { return (rod.zoneBonus||0) + ((rod.stability||1)-1)*0.02; }
function rodFallSpeed(rod) { return Math.max(0.15, 0.65 - (rod.stability||1)*0.05); }

const BAITS = [
  {id:'worm',     name:'Worm',        cost:5,   desc:'Basic bait',          luckBonus:0.05, speedBonus:0,    color:'#c87040'},
  {id:'shrimp',   name:'Shrimp',      cost:15,  desc:'+speed to catch',     luckBonus:0,    speedBonus:0.15, color:'#e87060'},
  {id:'glowworm', name:'Glow Worm',   cost:30,  desc:'+luck for rare fish', luckBonus:0.12, speedBonus:0,    color:'#60e870'},
  {id:'deepbait', name:'Deep Bait',   cost:80,  desc:'+speed & +luck',      luckBonus:0.08, speedBonus:0.10, color:'#6060e8'},
  {id:'goldbait', name:'Golden Lure', cost:200, desc:'Big luck boost',      luckBonus:0.25, speedBonus:0,    color:'#e8c030'},
];

const SKILL_TREE = [
  // ── LUCK (cols 0-1) ──────────────────────────────────────────────────────
  {id:'lucky_cast',      name:'Lucky Cast',      desc:'+5% rare chance',       cost:1,  requires:null,               col:0, row:0, cat:'luck',  effect:{rarityBonus:0.05}},
  {id:'treasure_sense',  name:'Treasure Sense',  desc:'+10% rare chance',      cost:1,  requires:'lucky_cast',       col:0, row:1, cat:'luck',  effect:{rarityBonus:0.1}},
  {id:'golden_touch',    name:'Golden Touch',    desc:'Sell for +25%',         cost:1,  requires:'lucky_cast',       col:1, row:1, cat:'luck',  effect:{sellBonus:0.25}},
  {id:'rare_magnet',     name:'Rare Magnet',     desc:'+8% rare chance',       cost:2,  requires:'treasure_sense',   col:0, row:2, cat:'luck',  effect:{rarityBonus:0.08}},
  {id:'golden_net',      name:'Golden Net',      desc:'Sell for +50%',         cost:2,  requires:'golden_touch',     col:1, row:2, cat:'luck',  effect:{sellBonus:0.5}},
  {id:'lucky_streak',    name:'Lucky Streak',    desc:'+12% rare chance',      cost:3,  requires:'rare_magnet',      col:0, row:3, cat:'luck',  effect:{rarityBonus:0.12}},
  {id:'fish_whisperer',  name:'Fish Whisperer',  desc:'Sell for +80%',         cost:3,  requires:'golden_net',       col:1, row:3, cat:'luck',  effect:{sellBonus:0.8}},
  {id:'legendary_hunter',name:'Legendary Hunter',desc:'+20% legendary',        cost:4,  requires:'lucky_streak',     col:0, row:4, cat:'luck',  effect:{rarityBonus:0.2}},
  {id:'market_master',   name:'Market Master',   desc:'Sell for +120%',        cost:5,  requires:'fish_whisperer',   col:1, row:4, cat:'luck',  effect:{sellBonus:1.2}},
  {id:'mythic_seeker',   name:'Mythic Seeker',   desc:'Unlock mythic fish',    cost:7,  requires:'legendary_hunter', col:0, row:5, cat:'luck',  effect:{mythicUnlock:true}},
  {id:'golden_god',      name:'Golden God',      desc:'Sell for +200%',        cost:8,  requires:'market_master',    col:1, row:5, cat:'luck',  effect:{sellBonus:2.0}},
  {id:'void_caller',     name:'Void Caller',     desc:'+30% all rarity',       cost:10, requires:'mythic_seeker',    col:0, row:6, cat:'luck',  effect:{rarityBonus:0.3}},
  {id:'fortune_king',    name:'Fortune King',    desc:'Sell for +300%',        cost:12, requires:'golden_god',       col:1, row:6, cat:'luck',  effect:{sellBonus:3.0}},

  // ── SKILL (cols 2-3) ─────────────────────────────────────────────────────
  {id:'steady_reel',     name:'Steady Reel',     desc:'Zone +20% bigger',      cost:1,  requires:null,               col:2, row:0, cat:'skill', effect:{zoneBonus:0.20}},
  {id:'swift_hands',     name:'Swift Hands',     desc:'Cast 25% faster',       cost:1,  requires:null,               col:3, row:0, cat:'skill', effect:{speedBonus:0.25}},
  {id:'iron_grip',       name:'Iron Grip',       desc:'Zone +30% bigger',      cost:2,  requires:'steady_reel',      col:2, row:1, cat:'skill', effect:{zoneBonus:0.30}},
  {id:'double_cast',     name:'Double Cast',     desc:'25% catch 2 fish',      cost:2,  requires:'swift_hands',      col:3, row:1, cat:'skill', effect:{doubleChance:0.25}},
  {id:'master_grip',     name:'Master Grip',     desc:'Zone +45% bigger',      cost:3,  requires:'iron_grip',        col:2, row:2, cat:'skill', effect:{zoneBonus:0.45}},
  {id:'triple_cast',     name:'Triple Cast',     desc:'40% catch 2 fish',      cost:3,  requires:'double_cast',      col:3, row:2, cat:'skill', effect:{doubleChance:0.40}},
  {id:'zone_master',     name:'Zone Master',     desc:'Zone +60% bigger',      cost:5,  requires:'master_grip',      col:2, row:3, cat:'skill', effect:{zoneBonus:0.60}},
  {id:'master_angler',   name:'Master Angler',   desc:'Cast 50% faster',       cost:5,  requires:'triple_cast',      col:3, row:3, cat:'skill', effect:{speedBonus:0.50}},
  {id:'iron_will',       name:'Iron Will',       desc:'Escape 30% slower',     cost:4,  requires:'zone_master',      col:2, row:4, cat:'skill', effect:{escapeSlow:0.30}},
  {id:'speed_demon',     name:'Speed Demon',     desc:'Cast 75% faster',       cost:6,  requires:'master_angler',    col:3, row:4, cat:'skill', effect:{speedBonus:0.75}},
  {id:'god_of_fishing',  name:'God of Fishing',  desc:'All bonuses x2',        cost:12, requires:'iron_will',        col:2, row:5, cat:'skill', effect:{allDouble:true}},
  {id:'infinite_cast',   name:'Infinite Cast',   desc:'60% catch 2 fish',      cost:8,  requires:'speed_demon',      col:3, row:5, cat:'skill', effect:{doubleChance:0.60}},
  {id:'omnifisher',      name:'Omnifisher',      desc:'All bonuses x3',        cost:20, requires:'god_of_fishing',   col:2, row:6, cat:'skill', effect:{allDouble:true}},
  {id:'instant_cast',    name:'Instant Cast',    desc:'Cast 90% faster',       cost:10, requires:'infinite_cast',    col:3, row:6, cat:'skill', effect:{speedBonus:0.90}},

  // ── EXTRA (cols 4-5) ─────────────────────────────────────────────────────
  {id:'deep_knowledge',  name:'Deep Knowledge',  desc:'+40% EXP gain',         cost:1,  requires:null,               col:4, row:0, cat:'extra', effect:{expBonus:0.4}},
  {id:'keen_eye',        name:'Keen Eye',        desc:'See fish rarity hint',  cost:1,  requires:null,               col:5, row:0, cat:'extra', effect:{keenEye:true}},
  {id:'scholar',         name:'Scholar',         desc:'+70% EXP gain',         cost:2,  requires:'deep_knowledge',   col:4, row:1, cat:'extra', effect:{expBonus:0.7}},
  {id:'weather_sense',   name:'Weather Sense',   desc:'See next weather',      cost:1,  requires:'keen_eye',         col:5, row:1, cat:'extra', effect:{weatherSense:true}},
  {id:'exp_master',      name:'EXP Master',      desc:'+120% EXP gain',        cost:3,  requires:'scholar',          col:4, row:2, cat:'extra', effect:{expBonus:1.2}},
  {id:'storm_fisher',    name:'Storm Fisher',    desc:'+20% luck in rain',     cost:2,  requires:'weather_sense',    col:5, row:2, cat:'extra', effect:{stormBonus:0.20}},
  {id:'night_fisher',    name:'Night Fisher',    desc:'+15% luck at night',    cost:3,  requires:'exp_master',       col:4, row:3, cat:'extra', effect:{nightBonus:0.15}},
  {id:'aurora_blessed',  name:'Aurora Blessed',  desc:'+30% luck in aurora',   cost:3,  requires:'storm_fisher',     col:5, row:3, cat:'extra', effect:{auroraBonus:0.30}},
  {id:'mutation_hunter', name:'Mutation Hunter', desc:'+50% mutation chance',  cost:4,  requires:'night_fisher',     col:4, row:4, cat:'extra', effect:{mutationBonus:0.5}},
  {id:'weather_master',  name:'Weather Master',  desc:'+35% all weather luck', cost:4,  requires:'aurora_blessed',   col:5, row:4, cat:'extra', effect:{stormBonus:0.35,auroraBonus:0.35}},
  {id:'legend',          name:'The Legend',      desc:'+100% mutation chance', cost:8,  requires:'mutation_hunter',  col:4, row:5, cat:'extra', effect:{mutationBonus:1.0}},
  {id:'world_fisher',    name:'World Fisher',    desc:'All weather +50% luck', cost:8,  requires:'weather_master',   col:5, row:5, cat:'extra', effect:{stormBonus:0.5,auroraBonus:0.5}},
  {id:'exp_god',         name:'EXP God',         desc:'+200% EXP gain',        cost:10, requires:'legend',           col:4, row:6, cat:'extra', effect:{expBonus:2.0}},
  {id:'omniscient',      name:'Omniscient',      desc:'All luck bonuses x2',   cost:12, requires:'world_fisher',     col:5, row:6, cat:'extra', effect:{rarityBonus:0.5,stormBonus:0.5,auroraBonus:0.5}},
];

const RARITY_COLORS = {
  junk:'#555',common:'#aaa',uncommon:'#4caf50',
  rare:'#2196f3',epic:'#9c27b0',legendary:'#ff9800',mythic:'#f44336'
};
const EXP_PER_LEVEL = lvl => Math.floor(100*Math.pow(1.3,lvl-1));
