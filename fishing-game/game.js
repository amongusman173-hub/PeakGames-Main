// ─── AUDIO ───────────────────────────────────────────────────────────────────
const SFX = {};
function loadSound(key, file) {
  const a = new Audio('sounds/' + file);
  a.preload = 'auto';
  SFX[key] = a;
}
loadSound('cast',       'fishing_cast.mp3');
loadSound('reel',       'fish_reel_in.mp3');
loadSound('levelup',    'level_up.mp3');
loadSound('buy',        'shop_buy.mp3');
loadSound('sell_sm',    'sell_small.mp3');
loadSound('sell_md',    'sell_medium.mp3');
loadSound('sell_lg',    'sell_large.mp3');
loadSound('unlock',     'unlock_new_area.mp3');
loadSound('skill',      'skill_tree_upgrade.mp3');
loadSound('walk_wood',  'walk_on_wood.mp3');
loadSound('grass_walk', 'grass walk.mp3');
loadSound('sand_walk',  'grass walk.mp3');
loadSound('fish_catch', 'fish catch.mp3');
loadSound('beach_amb',  'beach ambience.mp3');
loadSound('concrete_walk','concrete walk.mp3');
loadSound('music',      'music_track_1_name=Beach_Vibe.mp3');
loadSound('menu_music', 'main_menu_music.mp3');
loadSound('shop_music', 'shop_music.mp3');
loadSound('ambience_river', 'river:pond ambience.mp3');
loadSound('ambience_ocean', 'ocean ambience.mp3');
loadSound('ambience_dock',  'docks:beach ambience.mp3');
loadSound('rain',       'rain_weather_event.mp3');

function playSound(key, vol=0.6, loop=false) {
  const s = SFX[key]; if (!s) return;
  try {
    if(loop){
      // For looping sounds, use the original element directly (clones don't loop reliably)
      const node = s.cloneNode(true);
      node.volume = Math.min(1, vol * settings.sfxVol);
      node.loop = true;
      node.play().catch(()=>{});
      return node;
    }
    const clone = s.cloneNode();
    clone.volume = Math.min(1, vol * settings.sfxVol);
    clone.loop = false;
    clone.play().catch(()=>{});
    return clone;
  } catch(e) {}
}

let bgMusic = null;
function setBGMusic(key, vol=1.0) {
  if (bgMusic) { bgMusic.pause(); bgMusic = null; }
  if (!key) return;
  bgMusic = playSound(key, settings.musicVol, true);
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
window.addEventListener('resize', resize); resize();

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const settings = {
  musicVol: 1.0,
  sfxVol: 1.0,
  showFps: false,
  screenShake: true,
  rainSounds: true,
};

// ─── WEATHER ─────────────────────────────────────────────────────────────────
const weather = {
  current: 'clear',
  next: 'rain',
  timer: 90,
  alpha: 1,
  phase: 'hold',
  raindrops: [],
  waves: [],
};
const WEATHER_TYPES = ['clear','clear','clear','clear','rain','rain','fog','aurora'];
const WEATHER_DURATION = {clear:120, rain:60, fog:45, aurora:60};
// After any non-clear event, force a clear cooldown
let weatherCooldown = 0; // seconds of forced clear remaining
let rainAmbienceNode = null;

function updateWeather(dt) {
  // Phase: 'in' = fading in, 'hold' = full, 'out' = fading out
  if(!weather.phase) weather.phase='hold';

  if(weather.phase==='out'){
    weather.alpha=Math.max(0, weather.alpha-dt*0.7);
    if(weather.alpha<=0){
      // Switch weather
      if(rainAmbienceNode){rainAmbienceNode.pause();rainAmbienceNode=null;}
      weather.current=weather.next;
      weather.next=weatherCooldown>0?'clear':WEATHER_TYPES[Math.floor(Math.random()*WEATHER_TYPES.length)];
      weather.timer=WEATHER_DURATION[weather.current]||60;
      weather.alpha=0;
      weather.phase='in';
      weather.raindrops=[];
      if(weather.current==='rain') rainAmbienceNode=playSound('rain',0.8,true);
      if(weather.current!=='clear') notify('Weather: '+weather.current.charAt(0).toUpperCase()+weather.current.slice(1),'uncommon');
      else notify('Skies clearing...','common');
    }
    // Still update existing raindrops while fading out
  } else if(weather.phase==='in'){
    weather.alpha=Math.min(1, weather.alpha+dt*0.5);
    if(weather.alpha>=1) weather.phase='hold';
  } else {
    // hold
    weather.timer-=dt;
    if(weather.timer<=0){
      // After non-clear event, force clear cooldown
      if(weather.current!=='clear'){
        weatherCooldown=90+Math.random()*60; // 90-150s forced clear
        weather.next='clear';
      }
      weather.phase='out';
    }
  }
  // Tick cooldown
  if(weatherCooldown>0){
    weatherCooldown-=dt;
    if(weatherCooldown<=0){ weatherCooldown=0; }
  }

  // Spawn rain only when active and not fully faded out
  if(weather.current==='rain' && weather.alpha>0){
    const spawnRate=Math.round(6*weather.alpha);
    for(let i=0;i<spawnRate;i++){
      weather.raindrops.push({
        x: Math.random() * (canvas.width + 200),  // spread across top
        y: -30 - Math.random()*40,                 // start above screen
        vy: 500+Math.random()*250,
        vx: -60,
        life: 1.4,
      });
    }
    if(Math.random()<0.12*weather.alpha){
      const wx=cam.x+Math.random()*canvas.width;
      const wy=cam.y+Math.random()*canvas.height;
      const z=getTopZone(wx,wy);
      if(z&&z.fishable) spawnRipple(wx,wy);
    }
  }
  for(let i=weather.raindrops.length-1;i>=0;i--){
    const d=weather.raindrops[i];
    d.x+=d.vx*dt; d.y+=d.vy*dt; d.life-=dt*0.7;
    if(d.life<=0||d.y>canvas.height+20) weather.raindrops.splice(i,1);
  }
  // Ocean waves always present near ocean
  if(weather.waves.length<20){
    weather.waves.push({x:4460+Math.random()*1140,y:Math.random()*4200,w:60+Math.random()*120,life:1,speed:0.4+Math.random()*0.3});
  }
  for(let i=weather.waves.length-1;i>=0;i--){
    const w=weather.waves[i];
    w.x-=w.speed; w.life-=dt*0.3;
    if(w.life<=0||w.x<4460) weather.waves.splice(i,1);
  }
}

function getWeatherLuckBonus(biome) {
  let bonus = 0;
  if (weather.current === 'rain') {
    if (biome === 'ocean' || biome === 'ocean_deep') bonus += 0.15;
    bonus += skillEffect('stormBonus');
  }
  if (weather.current === 'aurora') {
    bonus += 0.20 + skillEffect('auroraBonus');
  }
  if (weather.current === 'fog') bonus += 0.05;
  // Night bonus
  if (getDayPhase() < 0.3) bonus += skillEffect('nightBonus');
  return bonus;
}

// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  money:50, exp:0, level:1, skillPoints:0,
  skills: new Set(),
  rod:'stick', ownedRods: new Set(['stick']),
  bait:null, baitCount:{},
  hasBoat: false,
  totalCaught:0, fishLog:[],
  caughtIds: new Set(), // for fish collection
  screen:'world',
  nearBuilding:null, nearWater:null,
  musicStarted: false,
  shopScroll: 0,
  paused: false,
  skillInfo: null,
  mainMenu: true,
  wipeConfirm: false, // two-step wipe confirmation
};

// ─── TUTORIAL ────────────────────────────────────────────────────────────────
function advanceTutorial(){
  if(!tutorial.active||tutorial.done) return;
  if(tutorial.step<TUTORIAL_STEPS.length-1){
    tutorial.step++;
  } else {
    tutorial.done=true;
    tutorial.active=false;
    try{ localStorage.setItem('fishgame_tutorial_done','1'); }catch(e){}
  }
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Fishing Game!',
    lines: ['Explore the world and find water to fish.','Walk up to any water body and press [E] to cast.'],
    icon: '\uD83C\uDFAF'
  },
  {
    title: 'Moving Around',
    lines: ['Use WASD or Arrow Keys to move.','Hold Shift to sprint faster.','The map is large — explore to find new biomes!'],
    icon: '\uD83D\uDEB6'
  },
  {
    title: 'Fishing Minigame',
    lines: ['After casting, wait for a bite.','When the minigame starts, HOLD to move your zone UP.','Release to let it fall. Keep the fish inside the zone!'],
    icon: '\uD83C\uDFA3'
  },
  {
    title: 'Shops & Upgrades',
    lines: ['Visit the Town Square to buy better rods and bait.','Better rods = bigger catch zone and more rare fish.','Sell your fish at the Sell Fish stand for money.'],
    icon: '\uD83C\uDFEA'
  },
  {
    title: 'Skill Tree & Levels',
    lines: ['Catch fish to earn EXP and level up.','Spend skill points in the Skill Tree [K].','Unlock new areas at the Rod Shop!'],
    icon: '\u2B50'
  },
  {
    title: 'The Docks',
    lines: ['Pay $300 at the toll stand near the south path.','The docks have a bait shop and sell stand.','Fish in the ocean water south of the docks!'],
    icon: '\u26F5'
  },
];

const tutorial = {
  active: false,
  step: 0,
  done: false,
};

// Tutorial button rect — shared between draw and click handler
const tutBtn = {x:0,y:0,w:0,h:0};

function drawTutorial(){
  if(!tutorial.active||tutorial.done) return;
  const step=TUTORIAL_STEPS[tutorial.step];
  const cx=canvas.width/2, cy=canvas.height-120;
  const pw=500, ph=120, px=cx-pw/2, py=cy-ph/2;

  ctx.fillStyle='rgba(6,10,6,0.94)';
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,12); ctx.fill();
  ctx.strokeStyle='rgba(79,195,247,0.4)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,12); ctx.stroke();

  // Icon + Title
  ctx.font='22px serif'; ctx.textAlign='left';
  ctx.fillText(step.icon, px+14, py+30);
  ctx.fillStyle='#4fc3f7'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
  ctx.fillText(step.title, px+44, py+22);

  // Lines
  ctx.fillStyle='#ccc'; ctx.font='11px sans-serif';
  step.lines.forEach((line,i)=>{ ctx.fillText(line, px+14, py+40+i*16); });

  // Progress dots
  const dotY=py+ph-14;
  TUTORIAL_STEPS.forEach((_,i)=>{
    ctx.fillStyle=i===tutorial.step?'#4fc3f7':'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(cx-TUTORIAL_STEPS.length*8+i*16, dotY, 4, 0, Math.PI*2); ctx.fill();
  });

  // Next / Done button — store coords in tutBtn for click detection
  const isLast=tutorial.step===TUTORIAL_STEPS.length-1;
  const bw=isLast?72:64, bh=24;
  tutBtn.x=px+pw-bw-10; tutBtn.y=py+ph-bh-8; tutBtn.w=bw; tutBtn.h=bh;
  ctx.fillStyle='rgba(79,195,247,0.3)';
  ctx.beginPath(); ctx.roundRect(tutBtn.x,tutBtn.y,bw,bh,6); ctx.fill();
  ctx.strokeStyle='#4fc3f7'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(tutBtn.x,tutBtn.y,bw,bh,6); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
  ctx.fillText(isLast?'Done \u2713':'Next \u2192', tutBtn.x+bw/2, tutBtn.y+bh/2+4);

  // Hint
  ctx.fillStyle='#444'; ctx.font='10px sans-serif'; ctx.textAlign='left';
  ctx.fillText('[Space] next', px+14, py+ph-10);
}


// ─── PLAYER ──────────────────────────────────────────────────────────────────
const player = { x:2050, y:1700, r:12, speed:3.0, angle:0, sprinting:false };
const cam    = { x:0, y:0 };
const keys   = {};

const footprints = [];
let footTimer = 0;
let woodSoundNode = null;
let grassSoundNode = null;
let sandSoundNode = null;
let concreteSoundNode = null;

// ─── VFX ─────────────────────────────────────────────────────────────────────
const particles=[], floatTexts=[], ripples=[];
const levelUpRings=[];
function spawnParticles(x,y,color,n=12,opts={}){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=(opts.speed||1)+Math.random()*(opts.spread||3);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:(opts.r||2)+Math.random()*3,
      color,life:1,decay:(opts.decay||1.2)+Math.random()*0.6});
  }
}
function spawnFloat(x,y,text,color='#fff'){floatTexts.push({x,y,text,color,life:2,vy:-0.65});}
function spawnRipple(x,y){ripples.push({x,y,r:5,life:1});}

// ─── INPUT ───────────────────────────────────────────────────────────────────
// Sprint tracked via explicit keydown/keyup — never via keys map (modifier keys unreliable)
let ctrlHeld = false;

function clearKeys(){
  for(const k in keys) keys[k]=false;
  player.sprinting=false;
  ctrlHeld=false;
}

// ─── ADMIN PANEL (Konami: ↑↓↑↓←→←→BA Enter) ─────────────────────────────────
const KONAMI = ['ArrowUp','ArrowDown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
let konamiIdx = 0;
const admin = { open: false, scroll: 0 };

function drawAdmin(){
  if(!admin.open) return;
  overlay();
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=Math.min(560,canvas.width-32), ph=Math.min(620,canvas.height-32);
  const px=cx-pw/2, py=cy-ph/2;
  panel(px,py,pw,ph,'⚙ Admin Panel','rgba(255,50,50,0.25)');

  // subtitle
  ctx.fillStyle='#f44336'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('CHEAT MODE', cx, py+46);

  const btnW=pw-40, btnH=38, bx=px+20;
  let by=py+62+admin.scroll;
  const gap=10;

  function adminBtn(label, sublabel, color, action, id){
    const visible = by+btnH > py+55 && by < py+ph-10;
    if(visible){
      const hover=false;
      ctx.fillStyle=color+'33';
      ctx.beginPath(); ctx.roundRect(bx,by,btnW,btnH,8); ctx.fill();
      ctx.strokeStyle=color+'99'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(bx,by,btnW,btnH,8); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(label, bx+14, by+btnH/2+1);
      if(sublabel){
        ctx.fillStyle=color; ctx.font='11px sans-serif'; ctx.textAlign='right';
        ctx.fillText(sublabel, bx+btnW-14, by+btnH/2+1);
      }
    }
    // store hit rect
    admin._btns = admin._btns||[];
    admin._btns.push({x:bx,y:by,w:btnW,h:btnH,action,id});
    by+=btnH+gap;
  }

  admin._btns=[];

  // Money
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx,by,btnW,22,5); ctx.fill();
  ctx.fillStyle='#ffd54f'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
  if(by+22>py+55&&by<py+ph-10) ctx.fillText('💰  MONEY', bx+10, by+15);
  by+=28;
  adminBtn('+$500',    null,'#ffd54f',()=>{ state.money+=500; notify('+$500 (admin)','uncommon'); });
  adminBtn('+$5,000',  null,'#ffd54f',()=>{ state.money+=5000; notify('+$5,000 (admin)','rare'); });
  adminBtn('+$50,000', null,'#ffd54f',()=>{ state.money+=50000; notify('+$50,000 (admin)','legendary'); });

  // XP / Levels
  by+=4;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx,by,btnW,22,5); ctx.fill();
  ctx.fillStyle='#4fc3f7'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
  if(by+22>py+55&&by<py+ph-10) ctx.fillText('⭐  XP & LEVELS', bx+10, by+15);
  by+=28;
  adminBtn('+500 XP',   null,'#4fc3f7',()=>{ addExp(500); notify('+500 XP (admin)','uncommon'); });
  adminBtn('+5,000 XP', null,'#4fc3f7',()=>{ addExp(5000); notify('+5,000 XP (admin)','rare'); });
  adminBtn('+10 Skill Points', null,'#4fc3f7',()=>{ state.skillPoints+=10; notify('+10 Skill Points (admin)','epic'); });

  // Rods
  by+=4;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx,by,btnW,22,5); ctx.fill();
  ctx.fillStyle='#ce93d8'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
  if(by+22>py+55&&by<py+ph-10) ctx.fillText('🎣  RODS', bx+10, by+15);
  by+=28;
  adminBtn('Unlock All Rods', null,'#ce93d8',()=>{
    RODS.forEach(r=>state.ownedRods.add(r.id));
    notify('All rods unlocked (admin)','legendary');
  });
  adminBtn('Equip Mythic Rod', null,'#ce93d8',()=>{
    state.ownedRods.add('mythic'); state.rod='mythic';
    notify('Mythic Rod equipped (admin)','legendary');
  });

  // Fish
  by+=4;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx,by,btnW,22,5); ctx.fill();
  ctx.fillStyle='#80cbc4'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
  if(by+22>py+55&&by<py+ph-10) ctx.fillText('🐟  FISH', bx+10, by+15);
  by+=28;
  adminBtn('Add 1 of Every Fish', null,'#80cbc4',()=>{
    Object.values(BIOMES).forEach(b=>b.fish.forEach(f=>{
      state.caughtIds.add(f.id);
      state.fishLog.unshift({...f, mutation:null, ts:Date.now()});
      state.totalCaught++;
    }));
    notify('All fish added (admin)','mythic');
  });
  adminBtn('+50 Random Fish (sell value)', null,'#80cbc4',()=>{
    const allFish=Object.values(BIOMES).flatMap(b=>b.fish);
    let earned=0;
    for(let i=0;i<50;i++){
      const f=allFish[Math.floor(Math.random()*allFish.length)];
      earned+=f.val;
      state.caughtIds.add(f.id);
      state.totalCaught++;
    }
    state.money+=earned;
    notify('+50 fish sold for $'+earned+' (admin)','epic');
  });

  // Biomes
  by+=4;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx,by,btnW,22,5); ctx.fill();
  ctx.fillStyle='#a5d6a7'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
  if(by+22>py+55&&by<py+ph-10) ctx.fillText('🗺  BIOMES', bx+10, by+15);
  by+=28;
  adminBtn('Unlock All Biomes', null,'#a5d6a7',()=>{
    Object.keys(AREA_LOCKS).forEach(k=>{ AREA_LOCKS[k].unlocked=true; });
    notify('All biomes unlocked (admin)','legendary');
    playSound('unlock',0.5);
  });

  // total content height for scroll clamping
  const totalH = by - (py+62+admin.scroll);
  const visH = ph - 72;
  admin._maxScroll = Math.max(0, totalH - visH);

  // scroll hint
  if(admin._maxScroll>0){
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('scroll ↕', cx, py+ph-8);
  }

  // clip so buttons don't bleed outside panel
  // (drawn in-bounds check above handles this)
}

function adminClick(mx,my){
  if(!admin.open) return false;
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=Math.min(560,canvas.width-32), ph=Math.min(620,canvas.height-32);
  const px=cx-pw/2, py=cy-ph/2;
  if(isCloseBtn(mx,my,px,py,pw)){ admin.open=false; return true; }
  if(admin._btns) for(const b of admin._btns){
    if(mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h){ b.action(); return true; }
  }
  return true; // swallow clicks inside panel area
}

window.addEventListener('keydown', e=>{
  // Konami code detection
  if(e.key===KONAMI[konamiIdx]){ konamiIdx++; if(konamiIdx===KONAMI.length){ admin.open=!admin.open; konamiIdx=0; } }
  else konamiIdx = e.key===KONAMI[0] ? 1 : 0;

  keys[e.key]=true;
  if(e.key==='Control') ctrlHeld=true;
  if(e.key==='e'||e.key==='E') handleInteract();
  if(e.key==='Escape'){
    if(admin.open){ admin.open=false; return; }
    if(state.screen==='fishing') cancelFishing();
    else if(state.skillInfo) state.skillInfo=null;
    else if(state.paused) state.paused=false;
    else if(state.screen!=='world') { if(state.screen==='settings') state.wipeConfirm=false; state.screen='world'; }
    else state.paused=true;
  }
  if(e.key==='k'||e.key==='K') state.screen=state.screen==='skills'?'world':'skills';
  if(e.key==='i'||e.key==='I') state.screen=state.screen==='log'?'world':'log';
  if(e.key==='c'||e.key==='C') state.screen=state.screen==='collection'?'world':'collection';
  if(e.key==='p'||e.key==='P') state.screen=state.screen==='settings'?'world':'settings';
  if(e.key==='Tab'){ state.paused=!state.paused; e.preventDefault(); return; }
  if(!state.musicStarted){ state.musicStarted=true; setBGMusic('music',0.2); }
  // Main menu dismiss on any key
  if(state.mainMenu){
    state.mainMenu=false;
    if(!localStorage.getItem('fishgame_tutorial_done')){ tutorial.active=true; tutorial.step=0; }
    e.preventDefault(); return;
  }
  // Tutorial advance — Space skips/advances, handled before any preventDefault
  if(e.key===' '){
    if(tutorial.active&&!tutorial.done){ advanceTutorial(); e.preventDefault(); return; }
  }
  const gameKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','A','s','S','d','D','w','W','e','E','k','K','i','I','c','C','Escape'];
  if(gameKeys.includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e=>{ keys[e.key]=false; if(e.key==='Control') ctrlHeld=false; });
window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) clearKeys(); });
window.addEventListener('contextmenu', e=>{
  clearKeys();
  // Right-click on skill node
  if(state.screen==='skills'){
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const cx=canvas.width/2, cy=canvas.height/2;
    const pw=Math.min(1000,canvas.width-40), ph=Math.min(680,canvas.height-40);
    const ppx=cx-pw/2, ppy=cy-ph/2;
    const nR=36, cG=126, rG=96;
    const gx=ppx+20, gy=ppy+70-skillScroll;
    for(const skill of SKILL_TREE){
      const nx=gx+skill.col*cG, ny=gy+26+skill.row*rG;
      if(Math.hypot(mx-(nx+nR),my-(ny+nR))<nR){
        state.skillInfo=skill;
        e.preventDefault();
        return;
      }
    }
  }
  e.preventDefault();
});
canvas.addEventListener('wheel', e=>{
  if(admin.open){
    admin.scroll = Math.max(0, Math.min(admin._maxScroll||0, admin.scroll + e.deltaY*0.5));
    e.preventDefault(); return;
  }
  if(state.screen==='shop'){
    const maxScroll = Math.max(0, Math.ceil(RODS.length/3)*162 - 310);
    state.shopScroll = Math.max(0, Math.min(maxScroll, state.shopScroll + e.deltaY*0.5));
    e.preventDefault();
  }
  if(state.screen==='skills'){
    skillScroll = Math.max(0, skillScroll + e.deltaY*0.5);
    e.preventDefault();
  }
  if(state.screen==='log'){
    if(!state.logScroll) state.logScroll=0;
    state.logScroll = Math.max(0, state.logScroll + e.deltaY*0.5);
    e.preventDefault();
  }
},{passive:false});
canvas.addEventListener('mousedown', e=>{ onCanvasDown(e); if(!state.musicStarted){state.musicStarted=true;setBGMusic('music',0.2);} });
canvas.addEventListener('touchstart', e=>{e.preventDefault();onCanvasDown(e.touches[0]);},{passive:false});
canvas.addEventListener('mouseup',  ()=>{ if(state.screen==='fishing'&&mg.phase==='reeling') mg.holding=false; sliderDrag.active=false; });
canvas.addEventListener('touchend', ()=>{ if(state.screen==='fishing'&&mg.phase==='reeling') mg.holding=false; sliderDrag.active=false; });
canvas.addEventListener('mousemove', e=>{
  if(!sliderDrag.active) return;
  const rect=canvas.getBoundingClientRect();
  applySliderDrag(e.clientX-rect.left);
});
canvas.addEventListener('touchmove', e=>{
  if(!sliderDrag.active) return;
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  applySliderDrag(e.touches[0].clientX-rect.left);
},{passive:false});

// ─── ZONE / WALKABILITY ──────────────────────────────────────────────────────
function getTopZone(wx,wy){
  for(let i=ZONE_ORDER.length-1;i>=0;i--){
    const z=ZONES.find(z=>z.id===ZONE_ORDER[i]);
    if(z&&wx>=z.x&&wx<=z.x+z.w&&wy>=z.y&&wy<=z.y+z.h) return z;
  }
  return null;
}
function isBarriered(wx,wy){
  for(const b of BARRIER_ZONES){
    if(wx>=b.x&&wx<=b.x+b.w&&wy>=b.y&&wy<=b.y+b.h){
      if(!AREA_LOCKS[b.lockKey]?.unlocked) return true;
    }
  }
  return false;
}
function isWalkable(wx,wy){
  if(wx<player.r||wy<player.r||wx>WORLD_W-player.r||wy>WORLD_H-player.r) return false;
  if(isBarriered(wx,wy)) return false;
  const z=getTopZone(wx,wy);
  if(!z) return false;
  if(!WALKABLE_IDS.has(z.id)) return false;
  // Dock requires docks_key
  if((z.id==='dock_platform'||z.id==='dock_edge') && !AREA_LOCKS.docks_key?.unlocked) return false;
  for(const b of BUILDINGS){
    if(wx>=b.x+4&&wx<=b.x+b.w-4&&wy>=b.y+20&&wy<=b.y+b.h-4) return false;
  }
  for(const t of TREES){
    const tr=t.r*0.45;
    if((wx-t.x)**2+(wy-t.y)**2<tr*tr) return false;
  }
  return true;
}
function checkNearby(){
  state.nearBuilding=null; state.nearWater=null;
  const px=player.x, py=player.y;
  for(const b of BUILDINGS){
    const cx=b.x+b.w/2, cy=b.y+b.h/2;
    if(Math.hypot(px-cx,py-cy)<80){ state.nearBuilding=b; return; }
  }
  for(const [dx,dy] of [[0,-32],[0,32],[-32,0],[32,0],[0,-48],[0,48],[-48,0],[48,0]]){
    const z=getTopZone(px+dx,py+dy);
    if(z&&z.fishable&&!isBarriered(px+dx,py+dy)){ state.nearWater=z; return; }
  }
}
function handleInteract(){
  if(state.screen!=='world') return;
  if(state.nearBuilding){
    const t=state.nearBuilding.type;
    if(t==='shop') state.screen='shop';
    if(t==='bait') state.screen='bait';
    if(t==='sell') sellAllFish();
    if(t==='boat') state.screen='boat';
    if(t==='dock_toll'){
      if(AREA_LOCKS.docks_key?.unlocked){
        notify('Docks already unlocked!','common');
      } else if(state.money>=300){
        state.money-=300;
        AREA_LOCKS.docks_key.unlocked=true;
        notify('Docks unlocked! Welcome aboard.','epic');
        playSound('unlock',0.8);
        spawnParticles(player.x,player.y,'#ff9800',24,{speed:2,spread:5});
      } else {
        notify('Need $300 to enter the Docks','common');
      }
    }
  } else if(state.nearWater){
    startCasting();
  }
}

// ─── WORLD UPDATE ────────────────────────────────────────────────────────────
function updateWorld(dt){
  if(state.screen!=='world') return;
  if(state.paused) return;
  if(state.mainMenu) return;
  let dx=0,dy=0;
  if(keys['ArrowLeft'] ||keys['a']||keys['A']) dx=-1;
  if(keys['ArrowRight']||keys['d']||keys['D']) dx= 1;
  if(keys['ArrowUp']   ||keys['w']||keys['W']) dy=-1;
  if(keys['ArrowDown'] ||keys['s']||keys['S']) dy= 1;
  if(dx&&dy){dx*=0.707;dy*=0.707;}
  const moving=!!(dx||dy);
  // Only sprint when BOTH a movement key AND Ctrl are held this exact frame
  player.sprinting = moving && ctrlHeld;
  const spd=player.speed*(player.sprinting?1.85:1);
  if(dx||dy) player.angle=Math.atan2(dy,dx);
  const nx=player.x+dx*spd, ny=player.y+dy*spd;
  const prevX=player.x, prevY=player.y;
  if(isWalkable(nx,player.y)) player.x=nx;
  if(isWalkable(player.x,ny)) player.y=ny;
  const didMove = (player.x !== prevX || player.y !== prevY);

  if(dx||dy){
    const onGrass = isOnGrass(player.x, player.y);
    const onSand  = isOnSand(player.x, player.y);
    if(onGrass){
      footTimer-=dt;
      if(footTimer<=0){
        footTimer=player.sprinting?0.12:0.22;
        const side=Math.cos(player.angle+Math.PI/2);
        const sideY=Math.sin(player.angle+Math.PI/2);
        const alt=(Math.floor(Date.now()/(player.sprinting?120:220))%2)*2-1;
        footprints.push({x:player.x+side*alt*5, y:player.y+sideY*alt*5, angle:player.angle, life:1.2, maxLife:1.2});
      }
      // Sprint dust on grass
      if(player.sprinting && Math.random()<0.4){
        spawnParticles(player.x,player.y,'rgba(160,140,100,0.5)',1,{speed:0.4,spread:0.8,r:2,decay:4});
      }
    }
    if(onSand){
      footTimer-=dt;
      if(footTimer<=0){
        footTimer=player.sprinting?0.14:0.25;
        const side=Math.cos(player.angle+Math.PI/2);
        const sideY=Math.sin(player.angle+Math.PI/2);
        const alt=(Math.floor(Date.now()/(player.sprinting?140:250))%2)*2-1;
        footprints.push({x:player.x+side*alt*5, y:player.y+sideY*alt*5, angle:player.angle, life:1.8, maxLife:1.8, sand:true});
      }
    }
    const onWood = isOnWood(player.x, player.y);
    const onConcrete = isOnConcrete(player.x, player.y);
    // Check if player actually moved (not walking into wall)
    if(onWood && didMove){
      if(!woodSoundNode) woodSoundNode = playSound('walk_wood', 0.35, true);
      try{ if(woodSoundNode) woodSoundNode.playbackRate = player.sprinting ? 1.6 : 1.0; }catch(e){}
    } else if(!onWood && woodSoundNode){
      woodSoundNode.pause(); woodSoundNode = null;
    }
    if(!onWood) woodSoundNode = null;
    // Concrete walk sound (paths, town square)
    if(onConcrete && didMove && !onWood){
      if(!concreteSoundNode) concreteSoundNode = playSound('concrete_walk', 0.4, true);
      try{ if(concreteSoundNode) concreteSoundNode.playbackRate = player.sprinting ? 1.6 : 1.0; }catch(e){}
    } else if(!onConcrete && concreteSoundNode){
      concreteSoundNode.pause(); concreteSoundNode = null;
    }
    if(!onConcrete) concreteSoundNode = null;
    // Grass walk sound
    if(onGrass && didMove){
      if(!grassSoundNode) grassSoundNode = playSound('grass_walk', 0.55, true);
      try{ if(grassSoundNode) grassSoundNode.playbackRate = player.sprinting ? 1.6 : 1.0; }catch(e){}
    } else if(!onGrass && grassSoundNode){
      grassSoundNode.pause(); grassSoundNode = null;
    }
    // Sand walk sound
    if(onSand && didMove){
      if(!sandSoundNode) sandSoundNode = playSound('sand_walk', 0.25, true);
      try{ if(sandSoundNode) sandSoundNode.playbackRate = player.sprinting ? 1.6 : 1.0; }catch(e){}
    } else if(!onSand && sandSoundNode){
      sandSoundNode.pause(); sandSoundNode = null;
    }
  } else {
    player.sprinting = false;
    if(woodSoundNode){ woodSoundNode.pause(); woodSoundNode = null; }
    if(grassSoundNode){ grassSoundNode.pause(); grassSoundNode = null; }
    if(sandSoundNode){ sandSoundNode.pause(); sandSoundNode = null; }
    if(concreteSoundNode){ concreteSoundNode.pause(); concreteSoundNode = null; }
  }

  for(let i=footprints.length-1;i>=0;i--){
    footprints[i].life-=dt;
    if(footprints[i].life<=0) footprints.splice(i,1);
  }

  cam.x=player.x-canvas.width/2;
  cam.y=player.y-canvas.height/2;
  checkNearby();

  const z=getTopZone(player.x,player.y);
  const zid=z?.id||'';
  if(zid.includes('dock')||zid.includes('pier')) updateAmbience('ambience_dock');
  else if(zid==='ocean'||zid==='deep_ocean'||zid==='ocean_shore'||zid==='dock_ocean'||zid==='coral_reef') updateAmbience('ambience_ocean');
  else if(zid==='river'||zid==='pond'||zid==='pond_shore'||zid==='river_shore_n'||zid==='river_shore_s') updateAmbience('ambience_river');
  else updateAmbience(null);
  tickAmbience(dt);
}

let currentAmbience=null, ambienceNode=null, ambienceAlpha=0, ambienceTarget=null;
function updateAmbience(key){
  if(key===ambienceTarget) return;
  ambienceTarget=key;
  // Start crossfade: fade out old, fade in new
  if(ambienceNode){ ambienceNode.pause(); ambienceNode=null; }
  currentAmbience=key;
  ambienceAlpha=0;
  if(key){
    ambienceNode=playSound(key,0,true);
  }
}
function tickAmbience(dt){
  if(!ambienceNode) return;
  ambienceAlpha=Math.min(1,ambienceAlpha+dt/2.0); // 2 second fade in
  ambienceNode.volume=ambienceAlpha*0.18;
}
function isOnWood(wx,wy){
  const z=getTopZone(wx,wy);
  return z&&(z.id.includes('dock')||z.id.includes('pier')||z.id.includes('bridge'));
}
function isOnGrass(wx,wy){
  const z=getTopZone(wx,wy);
  return z&&(z.id==='grass'||z.id==='snow_ground'||z.id==='ice_shore');
}
function isOnSand(wx,wy){
  const z=getTopZone(wx,wy);
  return z&&(z.id==='pond_shore'||z.id==='ocean_shore'||z.id==='river_shore_n'||z.id==='river_shore_s');
}
function isOnConcrete(wx,wy){
  const z=getTopZone(wx,wy);
  return z&&(z.id==='town_sq'||z.id.startsWith('path_'));
}

// ─── SKILLS / EXP / SELL ─────────────────────────────────────────────────────
function skillEffect(key){
  let v=0;
  for(const id of state.skills){
    const s=SKILL_TREE.find(x=>x.id===id);
    if(s&&s.effect[key]) v+=s.effect[key];
  }
  if(state.skills.has('god_of_fishing')) v*=2;
  return v;
}
function addExp(amount){
  state.exp+=Math.floor(amount*(1+skillEffect('expBonus')));
  while(state.exp>=EXP_PER_LEVEL(state.level)){
    state.exp-=EXP_PER_LEVEL(state.level);
    state.level++; state.skillPoints++;
    spawnFloat(player.x,player.y-40,'LEVEL UP!','#ffd54f');
    spawnParticles(player.x,player.y,'#ffd54f',40,{speed:2.5,spread:6,r:3,decay:0.8});
    spawnParticles(player.x,player.y,'#fff',20,{speed:1.5,spread:4,r:2,decay:1.2});
    // Ring explosion
    levelUpRings.push({x:player.x,y:player.y,r:0,life:1.0});
    playSound('levelup',0.7);
    playSound('fish_catch',0.5);
    notify('Level '+state.level+'! +1 Skill Point','legendary');
  }
}
const notifs=[];
function notify(msg,rarity='common'){notifs.push({msg,rarity,t:3.5});}

function sellAllFish(){
  if(!state.fishLog.length){notify('No fish to sell!','common');return;}
  let total=0;
  for(const e of state.fishLog) total+=e.value;
  state.money+=total;
  spawnFloat(player.x,player.y-40,'+$'+total,'#ffd54f');
  spawnParticles(player.x,player.y,'#ffd54f',18,{speed:1.5,spread:3.5});
  const snd=total>500?'sell_lg':total>100?'sell_md':'sell_sm';
  playSound(snd,0.7);
  notify('Sold '+state.fishLog.length+' fish for $'+total,'rare');
  state.fishLog=[];
}

// ─── FISHING MINIGAME ────────────────────────────────────────────────────────
let reelSoundNode = null;
const mg = {
  active: false,
  phase: 'waiting',
  waitTimer:0, waitDuration:0,
  castTimer:0, castDuration:0,
  fishPos:0.5, fishVel:0, fishDir:1, erraticTimer:0,
  zonePos:0.5, zoneSize:0.18,
  progress:0, escaped:0,
  holding:false, fish:null, biome:null,
  mutation:null, revealTimer:0,
  bobberX:0, bobberY:0, screenShake:0,
  steadyMult:1.0,
};

function rollMutation() {
  const bonus = skillEffect('mutationBonus');
  for (const m of MUTATIONS) {
    if (Math.random() < m.chance * (1 + bonus)) return m;
  }
  return null;
}

function startCasting(){
  const z=state.nearWater; if(!z) return;
  const fish=rollFish(z.biome); if(!fish) return;
  const rod=RODS.find(r=>r.id===state.rod);
  const bait=state.bait?BAITS.find(b=>b.id===state.bait):null;
  const speedMult=1-skillEffect('speedBonus')-(bait?bait.speedBonus:0);
  const castDur=Math.max(350,rodSpeed(rod)*speedMult);
  const waitMult = rod.ability==='swift' ? 0.6 : rod.ability==='speed' ? 0.2 : 1.0;
  mg.phase='waiting';
  mg.waitTimer=0;
  mg.waitDuration=(2+Math.random()*6)*waitMult;
  mg.castTimer=0; mg.castDuration=castDur;
  mg.fish=fish; mg.biome=z.biome; mg.active=true;
  mg.mutation=null; mg.revealTimer=0; mg.screenShake=0;
  mg.bobberX=player.x+Math.cos(player.angle)*60;
  mg.bobberY=player.y+Math.sin(player.angle)*60;
  state.screen='fishing';
  playSound('cast',0.6);
  spawnRipple(mg.bobberX, mg.bobberY);
}

function startReeling(){
  const d=RARITY_DIFF[mg.fish.rarity];
  const rod=RODS.find(r=>r.id===state.rod);
  const zb=skillEffect('zoneBonus')+rodZoneBonus(rod);
  // Steady ability: zone shrinks 20% slower (handled in update)
  mg.steadyMult = rod.ability==='steady' ? 0.8 : 1.0;
  mg.phase='reeling'; mg.fishPos=0.5; mg.fishDir=Math.random()<0.5?1:-1;
  mg.fishVel=d.speed*0.003; mg.erraticTimer=0;
  mg.zoneSize=Math.min(0.72,d.zoneSize+zb);
  mg.zonePos=0.5; mg.progress=0; mg.escaped=0; mg.holding=false;
  reelSoundNode = playSound('reel',0.4,true);
}

function stopReelSound(){ if(reelSoundNode){reelSoundNode.pause();reelSoundNode=null;} }
function cancelFishing(){mg.active=false;state.screen='world';stopReelSound();}

function updateMinigame(dt){
  if(!mg.active) return;

  if(mg.phase==='waiting'){
    mg.waitTimer+=dt;
    if(mg.waitTimer>=mg.waitDuration){
      mg.screenShake=0.4;
      startReeling();
    }
    return;
  }

  if(mg.phase==='reveal'){
    mg.revealTimer-=dt;
    if(mg.revealTimer<=0){ mg.active=false; state.screen='world'; }
    return;
  }

  if(mg.screenShake>0) mg.screenShake=Math.max(0,mg.screenShake-dt*2);

  mg.erraticTimer-=dt;
  if(mg.erraticTimer<=0){
    const d=RARITY_DIFF[mg.fish.rarity];
    mg.erraticTimer=0.2+Math.random()*0.6/(d.erratic+0.1);
    if(Math.random()<0.35+d.erratic*0.08) mg.fishDir*=-1;
    mg.fishVel=d.speed*0.003*(0.6+Math.random()*0.8);
  }
  mg.fishPos+=mg.fishVel*mg.fishDir;
  if(mg.fishPos<=0){mg.fishPos=0;mg.fishDir=1;}
  if(mg.fishPos>=1){mg.fishPos=1;mg.fishDir=-1;}

  // Zone physics: holding = accelerate UP, not holding = decelerate/fall DOWN
  const rod=RODS.find(r=>r.id===state.rod);
  const fallSpeed=rodFallSpeed(rod)*(mg.steadyMult||1.0);
  // ice rod: zone falls 50% slower
  const iceMult = rod.ability==='ice' ? 0.5 : 1.0;
  // Direct position control — no slippery physics
  if(mg.holding){
    mg.zonePos=Math.max(mg.zoneSize/2, mg.zonePos - dt*0.85);
  } else {
    mg.zonePos=Math.min(1-mg.zoneSize/2, mg.zonePos + dt*1.9*fallSpeed*iceMult);
  }
  const inZone=mg.fishPos>=mg.zonePos-mg.zoneSize/2&&mg.fishPos<=mg.zonePos+mg.zoneSize/2;
  const escapeRate = rod.ability==='steady' ? 0.28 : rod.ability==='tank' ? 0.21 : 0.42;
  const escapeSlowSkill = skillEffect('escapeSlow');
  const finalEscapeRate = escapeRate * (1 - escapeSlowSkill);
  // volcano rod: progress fills 20% faster
  const progressRate = rod.ability==='volcano' ? 0.38*1.2 : 0.38;
  if(inZone){mg.progress=Math.min(1,mg.progress+dt*progressRate);mg.escaped=Math.max(0,mg.escaped-dt*0.18);}
  else      {mg.escaped=Math.min(1,mg.escaped+dt*finalEscapeRate); mg.progress=Math.max(0,mg.progress-dt*0.1);}
  if(mg.progress>=1) fishCaught();
  if(mg.escaped>=1)  fishEscaped();
}

function fishCaught(){
  stopReelSound();
  const fish=mg.fish;
  // Handle fish crate
  if(fish.isCrate){
    mg.active=false; state.screen='world';
    playSound('fish_catch',0.7);
    spawnParticles(player.x,player.y,'#ffd54f',30,{speed:2,spread:5});
    // Roll 3 fish from biome for crate
    const crateContents=[];
    const rod=RODS.find(r=>r.id===state.rod);
    for(let ci=0;ci<3;ci++){
      const cf=rollFishFromBiome(fish._biome);
      if(cf){
        const cv=Math.floor(cf.val*(1+skillEffect('sellBonus')));
        state.totalCaught++; addExp(cf.exp);
        state.caughtIds.add(cf.id);
        state.fishLog.unshift({fish:cf,value:cv,mutation:null});
        crateContents.push({fish:cf,value:cv});
      }
    }
    notify('Fish Crate! Got '+crateContents.length+' fish!','epic');
    return;
  }
  const rod=RODS.find(r=>r.id===state.rod);
  const mut=rollMutation();
  mg.mutation=mut;
  const mutMult=mut?mut.mult:1;
  const luckyBonus = rod.ability==='lucky' ? 0.15 : 0;
  const val=Math.floor(fish.val*mutMult*(1+skillEffect('sellBonus')+luckyBonus));
  state.totalCaught++; addExp(fish.exp);
  state.caughtIds.add(fish.id);
  state.fishLog.unshift({fish,value:val,mutation:mut});
  if(state.fishLog.length>60) state.fishLog.pop();
  spawnParticles(player.x,player.y,mut?mut.color:RARITY_COLORS[fish.rarity],20,{speed:1.5,spread:4});
  spawnRipple(mg.bobberX, mg.bobberY);
  playSound('fish_catch',0.6);
  if(state.bait){
    state.baitCount[state.bait]=(state.baitCount[state.bait]||1)-1;
    if(state.baitCount[state.bait]<=0){state.baitCount[state.bait]=0;state.bait=null;}
  }
  const dbl=skillEffect('doubleChance');
  if(Math.random()<dbl){
    const b=rollFish(mg.biome);
    if(b){
      const bv=Math.floor(b.val*(1+skillEffect('sellBonus')));
      state.totalCaught++; addExp(b.exp);
      state.caughtIds.add(b.id);
      state.fishLog.unshift({fish:b,value:bv,mutation:null});
      spawnFloat(player.x,player.y-60,'Double! '+b.name,RARITY_COLORS[b.rarity]);
      notify('Double! '+b.name+'  +$'+bv,b.rarity);
    }
  }
  // Reveal phase
  mg.phase='reveal';
  mg.revealTimer=2.5;
  const mutLabel=mut?' ['+mut.name+']':'';
  notify('Caught '+fish.name+mutLabel+'  +$'+val,fish.rarity);
}

function fishEscaped(){
  mg.active=false; state.screen='world';
  stopReelSound();
  spawnFloat(player.x,player.y-36,'Got away...','#888');
  notify('The '+mg.fish.name+' got away...','common');
}

function rollFishFromBiome(biome){
  const b=BIOMES[biome]; if(!b) return null;
  const rod=RODS.find(r=>r.id===state.rod);
  const bait=state.bait?BAITS.find(b=>b.id===state.bait):null;
  const luck=rodLuck(rod)+skillEffect('rarityBonus')+(bait?bait.luckBonus:0)+getWeatherLuckBonus(biome);
  const mythicOk=state.skills.has('mythic_seeker');
  const list=b.fish.filter(f=>{
    if(f.rarity==='mythic'&&!mythicOk) return false;
    if(f.eventOnly&&weather.current!==f.eventOnly) return false;
    return true;
  });
  const boosted=list.map(f=>{let w=f.w;if(['rare','epic','legendary','mythic'].includes(f.rarity))w*=(1+luck*3);return{...f,w};});
  const total=boosted.reduce((s,f)=>s+f.w,0);
  let roll=Math.random()*total;
  for(const f of boosted){roll-=f.w;if(roll<=0)return f;}
  return boosted[boosted.length-1];
}

function rollFish(biome){
  const b=BIOMES[biome]; if(!b) return null;
  const rod=RODS.find(r=>r.id===state.rod);
  const bait=state.bait?BAITS.find(b=>b.id===state.bait):null;
  const biomeLuckBonus=(rod.biomeBonus===biome)?0.20:0;
  const luck=rodLuck(rod)+skillEffect('rarityBonus')+(bait?bait.luckBonus:0)+getWeatherLuckBonus(biome)+biomeLuckBonus;
  const mythicOk=state.skills.has('mythic_seeker');
  const isFog=weather.current==='fog';
  // 3% chance for fish crate
  if(Math.random()<0.03){
    return {id:'fish_crate',name:'Fish Crate',rarity:'rare',val:0,exp:5,w:0,isCrate:true,_biome:biome};
  }
  const list=b.fish.filter(f=>{
    if(f.rarity==='mythic'&&!mythicOk) return false;
    if(f.fogOnly&&!isFog) return false;
    if(f.eventOnly&&weather.current!==f.eventOnly) return false;
    return true;
  });
  const boosted=list.map(f=>{let w=f.w;if(['rare','epic','legendary','mythic'].includes(f.rarity))w*=(1+luck*3);return{...f,w};});
  const total=boosted.reduce((s,f)=>s+f.w,0);
  let roll=Math.random()*total;
  for(const f of boosted){roll-=f.w;if(roll<=0)return f;}
  return boosted[boosted.length-1];
}

// ─── VFX UPDATE ──────────────────────────────────────────────────────────────
const waveT={t:0};
// Day/night: full cycle = 2 real minutes (120s). Starts at day.
const dayNight={t:150, cycleDuration:600}; // 10 min cycle, start at day
function getDayPhase(){ return (Math.sin(dayNight.t/dayNight.cycleDuration*Math.PI*2-Math.PI/2)+1)/2; } // 0=night 1=day
function updateVFX(dt){
  waveT.t+=dt;
  dayNight.t=(dayNight.t+dt)%dayNight.cycleDuration;
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.life-=dt*p.decay;
    if(p.life<=0) particles.splice(i,1);
  }
  for(let i=floatTexts.length-1;i>=0;i--){
    const f=floatTexts[i]; f.y+=f.vy; f.life-=dt;
    if(f.life<=0) floatTexts.splice(i,1);
  }
  for(let i=ripples.length-1;i>=0;i--){
    const r=ripples[i]; r.r+=dt*85; r.life-=dt*1.3;
    if(r.life<=0) ripples.splice(i,1);
  }
  for(let i=levelUpRings.length-1;i>=0;i--){
    const r=levelUpRings[i]; r.r+=dt*280; r.life-=dt*1.8;
    if(r.life<=0) levelUpRings.splice(i,1);
  }
  for(let i=notifs.length-1;i>=0;i--){notifs[i].t-=dt;if(notifs[i].t<=0)notifs.splice(i,1);}
}

// ─── DRAW WORLD ──────────────────────────────────────────────────────────────
function drawWorld(){
  ctx.fillStyle='#1a2a1a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for(const id of ZONE_ORDER){
    const z=ZONES.find(z=>z.id===id); if(!z) continue;
    const sx=z.x-cam.x, sy=z.y-cam.y;
    if(sx+z.w<-10||sy+z.h<-10||sx>canvas.width+10||sy>canvas.height+10) continue;

    ctx.fillStyle=z.color;
    ctx.fillRect(sx,sy,z.w,z.h);

    if(z.fishable){
      ctx.save(); ctx.beginPath(); ctx.rect(sx,sy,z.w,z.h); ctx.clip();
      ctx.filter='blur(1px)';
      ctx.fillStyle='rgba(255,255,255,0.05)';
      const t=waveT.t;
      for(let i=0;i<4;i++){
        const wy=sy+z.h*(0.15+i*0.22)+Math.sin(t*0.9+i*1.5)*7;
        const ww=z.w*(0.35+Math.sin(t*0.4+i)*0.12);
        const wx=sx+z.w*0.08+Math.sin(t*0.25+i*2)*z.w*0.08;
        ctx.fillRect(wx,wy,ww,4);
      }
      ctx.filter='none';
      ctx.restore();
    }
    if(z.id==='ice_lake'){
      ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(sx+z.w*0.08,sy+z.h*0.12,z.w*0.84,z.h*0.12);
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+z.w*0.2,sy+z.h*0.55,z.w*0.6,z.h*0.08);
    }
    if(z.id==='dock_platform'||z.id.startsWith('pier')){
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2;
      for(let i=0;i<z.h;i+=16){ctx.beginPath();ctx.moveTo(sx,sy+i);ctx.lineTo(sx+z.w,sy+i);ctx.stroke();}
      ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=2;
      ctx.strokeRect(sx+1,sy+1,z.w-2,z.h-2);
    }
    if(z.id.startsWith('bridge')){
      ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=2;
      for(let i=0;i<z.h;i+=12){ctx.beginPath();ctx.moveTo(sx,sy+i);ctx.lineTo(sx+z.w,sy+i);ctx.stroke();}
      ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(sx+5,sy);ctx.lineTo(sx+5,sy+z.h);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx+z.w-5,sy);ctx.lineTo(sx+z.w-5,sy+z.h);ctx.stroke();
    }
    if(z.id==='town_sq'){
      ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1;
      for(let i=0;i<z.w;i+=44){ctx.beginPath();ctx.moveTo(sx+i,sy);ctx.lineTo(sx+i,sy+z.h);ctx.stroke();}
      for(let i=0;i<z.h;i+=44){ctx.beginPath();ctx.moveTo(sx,sy+i);ctx.lineTo(sx+z.w,sy+i);ctx.stroke();}
    }
    if(z.id.startsWith('path_')){
      ctx.strokeStyle='rgba(0,0,0,0.07)'; ctx.lineWidth=1;
      const horiz=z.w>z.h;
      if(horiz){for(let i=0;i<z.h;i+=18){ctx.beginPath();ctx.moveTo(sx,sy+i);ctx.lineTo(sx+z.w,sy+i);ctx.stroke();}}
      else     {for(let i=0;i<z.w;i+=18){ctx.beginPath();ctx.moveTo(sx+i,sy);ctx.lineTo(sx+i,sy+z.h);ctx.stroke();}}
    }
    if(z.id==='snow_ground'||z.id==='ice_shore'){
      ctx.fillStyle='rgba(255,255,255,0.22)';
      for(let i=0;i<10;i++){
        const spx=sx+((z.x*7+i*137)%Math.max(1,z.w));
        const spy=sy+((z.y*11+i*97)%Math.max(1,z.h));
        ctx.beginPath(); ctx.arc(spx,spy,1.5,0,Math.PI*2); ctx.fill();
      }
    }
    // Beach shore waves — animated lines moving toward shore (right to left)
    if(z.id==='ocean_shore'){
      ctx.save(); ctx.beginPath(); ctx.rect(sx,sy,z.w,z.h); ctx.clip();
      const t=waveT.t;
      for(let wi=0;wi<4;wi++){
        const waveOffset=((t*28+wi*z.w/4)%z.w);
        const wy2=sy+z.h*(0.2+wi*0.2);
        const waveX=sx+z.w-waveOffset;
        ctx.strokeStyle='rgba(255,255,255,'+(0.35-wi*0.06)+')';
        ctx.lineWidth=2;
        ctx.beginPath();
        for(let px2=0;px2<z.w;px2+=8){
          const wvy=wy2+Math.sin((px2+waveOffset)*0.04+t*1.2+wi)*4;
          px2===0?ctx.moveTo(sx+px2,wvy):ctx.lineTo(sx+px2,wvy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    // Deep ocean color patches
    if(z.id==='deep_ocean'){
      ctx.save(); ctx.beginPath(); ctx.rect(sx,sy,z.w,z.h); ctx.clip();
      for(let pi=0;pi<8;pi++){
        const px2=sx+((z.x*13+pi*173)%Math.max(1,z.w));
        const py2=sy+((z.y*17+pi*113)%Math.max(1,z.h));
        const pr=30+((pi*37)%40);
        ctx.fillStyle='rgba(30,80,140,0.18)';
        ctx.beginPath(); ctx.arc(px2,py2,pr,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  // Ocean waves
  for(const w of weather.waves){
    const wx=w.x-cam.x, wy=w.y-cam.y;
    ctx.strokeStyle='rgba(255,255,255,'+(w.life*0.35)+')'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(wx,wy); ctx.lineTo(wx+w.w,wy); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+(w.life*0.15)+')'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(wx+4,wy+3); ctx.lineTo(wx+w.w-4,wy+3); ctx.stroke();
  }

  // Locked area signs — show when player is near the barrier edge
  for(const b of BARRIER_ZONES){
    if(AREA_LOCKS[b.lockKey]?.unlocked) continue;
    const lock=AREA_LOCKS[b.lockKey];
    // Distance to nearest edge of barrier
    const nearX = Math.max(b.x, Math.min(player.x, b.x+b.w));
    const nearY = Math.max(b.y, Math.min(player.y, b.y+b.h));
    const dist = Math.hypot(player.x-nearX, player.y-nearY);
    if(dist>180) continue;
    // Sign appears at the nearest point on the barrier edge
    const ssx=nearX-cam.x, ssy=nearY-cam.y;
    const alpha=Math.min(1,(180-dist)/80);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.85)';
    ctx.beginPath(); ctx.roundRect(ssx-80,ssy-28,160,46,8); ctx.fill();
    ctx.strokeStyle='#ffd54f44'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(ssx-80,ssy-28,160,46,8); ctx.stroke();
    ctx.fillStyle='#ffd54f'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('\uD83D\uDD12 Unlock '+lock.name, ssx, ssy-10);
    ctx.fillStyle='#aaa'; ctx.font='10px sans-serif';
    ctx.fillText('$'+lock.cost+' \u2022 Rod Shop', ssx, ssy+8);
    ctx.globalAlpha=1;
  }

  ctx.strokeStyle='rgba(0,0,0,0.85)'; ctx.lineWidth=10;
  ctx.strokeRect(-cam.x,-cam.y,WORLD_W,WORLD_H);
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=3;
  ctx.strokeRect(-cam.x+5,-cam.y+5,WORLD_W-10,WORLD_H-10);

  for(const r of ripples){
    ctx.strokeStyle='rgba(255,255,255,'+(r.life*0.4)+')'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(r.x-cam.x,r.y-cam.y,r.r,r.r*0.38,0,0,Math.PI*2); ctx.stroke();
  }

  for(const r of levelUpRings){
    ctx.strokeStyle='rgba(255,213,79,'+(r.life*0.8)+')'; ctx.lineWidth=4*r.life;
    ctx.beginPath(); ctx.arc(r.x-cam.x,r.y-cam.y,r.r,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+(r.life*0.4)+')'; ctx.lineWidth=2*r.life;
    ctx.beginPath(); ctx.arc(r.x-cam.x,r.y-cam.y,r.r*0.6,0,Math.PI*2); ctx.stroke();
  }

  for(const fp of footprints){
    const a=fp.life/fp.maxLife;
    ctx.globalAlpha=a*0.3;
    ctx.fillStyle=fp.sand?'#a08050':'#2a4a18';
    ctx.save();
    ctx.translate(fp.x-cam.x,fp.y-cam.y);
    ctx.rotate(fp.angle);
    ctx.beginPath(); ctx.ellipse(0,0,3,5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha=1;

  for(const t of TREES){
    const sx=t.x-cam.x, sy=t.y-cam.y;
    if(sx<-80||sy<-80||sx>canvas.width+80||sy>canvas.height+80) continue;
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(sx+3,sy+t.r*0.5,t.r*0.75,t.r*0.25,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=t.snow?'#7a8a9a':'#5a3a18';
    ctx.fillRect(sx-2,sy,4,t.r*0.6);
    ctx.globalAlpha=1;
    ctx.fillStyle=t.outer;
    ctx.beginPath(); ctx.arc(sx,sy,t.r,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.5;
    ctx.fillStyle=t.inner;
    ctx.beginPath(); ctx.arc(sx,sy,t.r*0.68,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    if(t.snow){
      ctx.fillStyle='rgba(220,240,255,0.7)';
      ctx.beginPath(); ctx.arc(sx,sy-t.r*0.2,t.r*0.45,0,Math.PI*2); ctx.fill();
    }
  }

  for(const b of BUILDINGS){
    const sx=b.x-cam.x, sy=b.y-cam.y;
    if(sx+b.w<0||sy+b.h<0||sx>canvas.width||sy>canvas.height) continue;
    drawBuilding(b,sx,sy);
  }

  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life);
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x-cam.x,p.y-cam.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  for(const f of floatTexts){
    ctx.globalAlpha=Math.min(1,f.life);
    ctx.fillStyle=f.color; ctx.font='bold 15px sans-serif'; ctx.textAlign='center';
    ctx.fillText(f.text,f.x-cam.x,f.y-cam.y);
  }
  ctx.globalAlpha=1;

  drawPlayer();

  // Weather overlays (rain/fog/aurora) — drawn over player
  drawWeatherOverlay();

  // Day/night overlay
  const dayPhase=getDayPhase();
  if(dayPhase<0.98){
    const nightAlpha=(1-dayPhase)*0.68;
    ctx.fillStyle=`rgba(5,8,30,${nightAlpha.toFixed(3)})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(dayPhase<0.4){
      const starAlpha=(0.4-dayPhase)/0.4;
      for(let i=0;i<80;i++){
        const sx=((i*137+73)%canvas.width);
        const sy=((i*97+41)%(canvas.height*0.55));
        const twinkle=0.4+0.6*Math.abs(Math.sin(waveT.t*0.8+i));
        ctx.globalAlpha=starAlpha*twinkle*0.85;
        ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(sx,sy,i%3===0?1.5:1,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    // Subtle horizon tint at dusk/dawn — very thin strip only
    if(dayPhase>0.35&&dayPhase<0.65){
      const glowAlpha=Math.sin((dayPhase-0.35)/0.3*Math.PI)*0.12;
      ctx.fillStyle=`rgba(255,120,30,${glowAlpha.toFixed(3)})`;
      ctx.fillRect(0,canvas.height-8,canvas.width,8);
    }
  }

  // Interact prompt — always on top
  const near=state.nearBuilding||state.nearWater;
  if(near){
    const px=player.x-cam.x, py=player.y-cam.y;
    const label=state.nearBuilding?'[E] '+state.nearBuilding.label:'[E] Fish';
    ctx.fillStyle='rgba(0,0,0,0.78)';
    ctx.beginPath(); ctx.roundRect(px-60,py-56,120,24,6); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(label,px,py-39);
  }

  // Dock locked warning — show when player walks near dock area
  if(!AREA_LOCKS.docks_key?.unlocked){
    const dockX=1600+900, dockY=2600+250; // center of dock
    const dist=Math.hypot(player.x-dockX, player.y-dockY);
    if(dist<320){
      const alpha=Math.min(1,(320-dist)/160);
      const sx=dockX-cam.x, sy=dockY-cam.y-80;
      ctx.globalAlpha=alpha;
      ctx.fillStyle='rgba(0,0,0,0.82)';
      ctx.beginPath(); ctx.roundRect(sx-90,sy-18,180,46,8); ctx.fill();
      ctx.strokeStyle='#ffd54f55'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(sx-90,sy-18,180,46,8); ctx.stroke();
      ctx.fillStyle='#ffd54f'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('\uD83D\uDD12 The Docks', sx, sy-2);
      ctx.fillStyle='#aaa'; ctx.font='10px sans-serif';
      ctx.fillText('$300 at the toll stand', sx, sy+14);
      ctx.globalAlpha=1;
    }
  }
}

function drawWeatherOverlay(){
  const t=waveT.t;
  const wa=weather.alpha; // fade multiplier
  if(wa<=0) return;

  if(weather.current==='rain'){
    ctx.save();
    ctx.globalAlpha=wa;
    ctx.fillStyle='rgba(20,40,70,0.25)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const d of weather.raindrops){
      if(d.y<-20||d.y>canvas.height+20) continue;
      const ex=d.x+d.vx*0.05, ey=d.y+d.vy*0.05;
      ctx.strokeStyle='rgba(180,210,255,'+(d.life*0.9)+')';
      ctx.lineWidth=1.5;
      ctx.globalAlpha=wa*d.life;
      ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(ex,ey); ctx.stroke();
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  if(weather.current==='fog'){
    ctx.save();
    ctx.globalAlpha=wa;
    ctx.fillStyle='rgba(200,215,230,0.28)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<8;i++){
      const speed=14+i*5;
      const fx=((t*speed+i*canvas.width/7)%(canvas.width+500))-250;
      const fy=canvas.height*(0.08+i*0.11);
      const fw=350+i*70, fh=90+i*22;
      ctx.fillStyle='rgba(210,225,240,'+(0.22-i*0.018)+')';
      ctx.beginPath(); ctx.ellipse(fx,fy,fw,fh,0,0,Math.PI*2); ctx.fill();
    }
    const fogGrad=ctx.createLinearGradient(0,canvas.height*0.55,0,canvas.height);
    fogGrad.addColorStop(0,'rgba(200,215,230,0)');
    fogGrad.addColorStop(1,'rgba(200,215,230,0.35)');
    ctx.fillStyle=fogGrad;
    ctx.fillRect(0,canvas.height*0.55,canvas.width,canvas.height*0.45);
    ctx.globalAlpha=1;
    ctx.restore();
  }

  if(weather.current==='aurora'){
    ctx.save();
    ctx.globalAlpha=wa;
    const grad=ctx.createLinearGradient(0,0,0,canvas.height*0.55);
    grad.addColorStop(0,'rgba(0,180,80,0.32)');
    grad.addColorStop(0.4,'rgba(80,0,180,0.22)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,canvas.width,canvas.height*0.55);
    const bands=[
      {col:'rgba(0,255,120,0.22)',amp:38,freq:0.008,phase:0,  w:22},
      {col:'rgba(100,0,255,0.18)',amp:28,freq:0.012,phase:1.5,w:18},
      {col:'rgba(0,200,255,0.15)',amp:22,freq:0.006,phase:3.0,w:14},
    ];
    for(const b of bands){
      ctx.strokeStyle=b.col; ctx.lineWidth=b.w;
      ctx.beginPath();
      for(let x=0;x<=canvas.width;x+=6){
        const y=canvas.height*0.12+Math.sin(x*b.freq+t+b.phase)*b.amp+Math.sin(x*b.freq*2+t*1.4)*b.amp*0.4;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }
}

// ─── DRAW BUILDING (market stand style) ──────────────────────────────────────
function drawBuilding(b,sx,sy){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(sx+5,sy+5,b.w,b.h);
  // Counter/table base
  ctx.fillStyle=b.color;
  ctx.beginPath(); ctx.roundRect(sx,sy+b.h*0.45,b.w,b.h*0.55,4); ctx.fill();
  // Counter top edge highlight
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillRect(sx,sy+b.h*0.45,b.w,4);
  // Awning (flat rectangle canopy)
  ctx.fillStyle=b.roofColor;
  ctx.beginPath(); ctx.roundRect(sx-6,sy+b.h*0.18,b.w+12,b.h*0.28,4); ctx.fill();
  // Awning bottom stripe
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillRect(sx-6,sy+b.h*0.18+b.h*0.28-5,b.w+12,5);
  // Hanging decorations (small circles)
  const hangY=sy+b.h*0.46;
  for(let i=0;i<5;i++){
    const hx=sx+b.w*0.12+i*(b.w*0.19);
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(hx,sy+b.h*0.18+b.h*0.28); ctx.lineTo(hx,hangY); ctx.stroke();
    ctx.fillStyle=b.roofColor;
    ctx.beginPath(); ctx.arc(hx,hangY,3,0,Math.PI*2); ctx.fill();
  }
  // Label on awning
  ctx.fillStyle='rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(sx+4,sy+b.h*0.21,b.w-8,16,3); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
  ctx.fillText(b.label,sx+b.w/2,sy+b.h*0.21+12);
  // Highlight if near
  if(state.nearBuilding?.id===b.id){
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2;
    ctx.strokeRect(sx-1,sy-1,b.w+2,b.h+2);
  }
}

// ─── DRAW PLAYER ─────────────────────────────────────────────────────────────
function drawPlayer(){
  const px=player.x-cam.x, py=player.y-cam.y;
  const sprinting=player.sprinting;
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(px,py+player.r,player.r*0.85,player.r*0.3,0,0,Math.PI*2); ctx.fill();
  // Rod
  const ra=player.angle-0.5;
  const rx1=px+Math.cos(ra)*player.r*0.7, ry1=py+Math.sin(ra)*player.r*0.7;
  const rx2=px+Math.cos(ra)*30, ry2=py+Math.sin(ra)*30;
  const rc={stick:'#8b6a1a',basic:'#6a4a20',pro:'#3a3a3a',carbon:'#1a1a2a',golden:'#c8a020',mythic:'#6020c0'};
  ctx.strokeStyle=rc[state.rod]||'#8b6a1a'; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(rx1,ry1); ctx.lineTo(rx2,ry2); ctx.stroke();
  // Rod bobber at tip — only show when NOT actively fishing
  if(state.screen!=='fishing'){
    ctx.fillStyle='#e53935';
    ctx.beginPath(); ctx.arc(rx2,ry2,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(rx2,ry2,4,Math.PI,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx2,ry2,4,0,Math.PI*2); ctx.stroke();
  }
  if(state.rod==='mythic'||state.rod==='golden'){
    ctx.fillStyle=state.rod==='mythic'?'rgba(120,40,255,0.9)':'rgba(255,200,0,0.9)';
    ctx.beginPath(); ctx.arc(rx2,ry2,3.5,0,Math.PI*2); ctx.fill();
  }
  // Sprint trail
  if(sprinting){
    for(let i=1;i<=3;i++){
      const tx=px-Math.cos(player.angle)*player.r*i*1.4;
      const ty=py-Math.sin(player.angle)*player.r*i*1.4;
      ctx.globalAlpha=0.12/i;
      ctx.fillStyle='#4fc3f7';
      ctx.beginPath(); ctx.arc(tx,ty,player.r*(1-i*0.2),0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  // Body — plain solid circle with subtle highlight, NO eyes
  ctx.fillStyle=sprinting?'#80d8ff':'#4fc3f7';
  ctx.beginPath(); ctx.arc(px,py,player.r,0,Math.PI*2); ctx.fill();
  // Subtle highlight
  ctx.fillStyle='rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.arc(px-player.r*0.28,py-player.r*0.28,player.r*0.45,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(px,py,player.r,0,Math.PI*2); ctx.stroke();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD(){
  const p=14;
  // Stats panel — taller to fit all content
  ctx.fillStyle='rgba(6,10,6,0.88)';
  ctx.beginPath(); ctx.roundRect(p,p,214,148,10); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(p,p,214,148,10); ctx.stroke();

  // Money + level on same row
  ctx.fillStyle='#ffd54f'; ctx.font='bold 16px sans-serif'; ctx.textAlign='left';
  ctx.fillText('$'+state.money.toLocaleString(), p+12, p+22);
  ctx.fillStyle='rgba(79,195,247,0.2)';
  ctx.beginPath(); ctx.roundRect(p+130,p+8,78,18,4); ctx.fill();
  ctx.fillStyle='#4fc3f7'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Lv. '+state.level, p+169, p+21);

  // EXP bar
  const ew=190, eh=4;
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.roundRect(p+12,p+30,ew,eh,2); ctx.fill();
  ctx.fillStyle='#4fc3f7';
  ctx.beginPath(); ctx.roundRect(p+12,p+30,ew*(state.exp/EXP_PER_LEVEL(state.level)),eh,2); ctx.fill();

  // Skill pts
  if(state.skillPoints>0){
    ctx.fillStyle='rgba(192,128,255,0.2)';
    ctx.beginPath(); ctx.roundRect(p+12,p+38,ew,13,3); ctx.fill();
    ctx.fillStyle='#c080ff'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
    ctx.fillText(state.skillPoints+' skill pt'+(state.skillPoints>1?'s':'')+' ready', p+12+ew/2, p+48);
  }

  // Divider
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(p+12,p+56); ctx.lineTo(p+202,p+56); ctx.stroke();

  // Rod
  const rod=RODS.find(r=>r.id===state.rod);
  const rodColors={stick:'#8b6a1a',basic:'#a07040',pro:'#888',carbon:'#bbb',golden:'#c8a020',mythic:'#9040e0'};
  ctx.fillStyle=rodColors[state.rod]||'#aaa';
  ctx.beginPath(); ctx.arc(p+19,p+66,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ccc'; ctx.font='11px sans-serif'; ctx.textAlign='left';
  ctx.fillText(rod.name, p+30, p+70);

  // Bait
  if(state.bait){
    const bait=BAITS.find(b=>b.id===state.bait);
    ctx.fillStyle=bait.color;
    ctx.beginPath(); ctx.arc(p+19,p+82,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#aaa'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText(bait.name+' \xD7'+(state.baitCount[state.bait]||0), p+30, p+86);
  } else {
    ctx.fillStyle='#333'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText('No bait', p+12, p+86);
  }

  // Zone
  const z=getTopZone(player.x,player.y);
  ctx.fillStyle='#3a4a3a'; ctx.font='10px sans-serif'; ctx.textAlign='left';
  ctx.fillText(z?.name||'Wilderness', p+12, p+100);

  // Time + weather on one row
  const wicons={clear:'\u2600',rain:'\uD83C\uDF27',fog:'\uD83C\uDF2B',aurora:'\u2728'};
  const dp=getDayPhase();
  const timeStr=dp>0.75?'Day':dp>0.5?'Dusk':dp>0.25?'Night':'Dawn';
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(p+12,p+106,ew,14,3); ctx.fill();
  ctx.fillStyle='#888'; ctx.font='9px sans-serif'; ctx.textAlign='center';
  ctx.fillText(timeStr+'  \u2022  '+weather.current.charAt(0).toUpperCase()+weather.current.slice(1), p+12+ew/2, p+116);

  // Controls hint
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='8px sans-serif'; ctx.textAlign='left';
  ctx.fillText('WASD\u00B7Shift:sprint\u00B7E:interact\u00B7C:collection', p+12, p+132);

  // Bottom buttons
  const bby=canvas.height-p-40, bbh=32;
  const btns=[
    {label:'Skills [K]',x:p,     col:'#c080ff',bg:'rgba(40,20,80,0.9)', border:'rgba(120,60,200,0.35)'},
    {label:'Log [I]',   x:p+82,  col:'#80ff80',bg:'rgba(20,40,20,0.9)', border:'rgba(60,160,60,0.35)'},
    {label:'Dex [C]',   x:p+154, col:'#ffd54f',bg:'rgba(60,50,10,0.9)', border:'rgba(200,180,40,0.35)'},
    {label:'\u2699 [P]',x:p+226, col:'#aaa',   bg:'rgba(30,30,40,0.9)', border:'rgba(100,100,120,0.35)'},
  ];
  for(const btn of btns){
    const bw=68;
    ctx.fillStyle=btn.bg; ctx.beginPath(); ctx.roundRect(btn.x,bby,bw,bbh,7); ctx.fill();
    ctx.strokeStyle=btn.border; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(btn.x,bby,bw,bbh,7); ctx.stroke();
    ctx.fillStyle=btn.col; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(btn.label, btn.x+bw/2, bby+bbh/2+4);
  }

  // Notifications
  let ny=canvas.height-p;
  for(let i=notifs.length-1;i>=0;i--){
    const n=notifs[i]; const a=Math.min(1,n.t*1.5);
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(6,10,6,0.92)';
    ctx.beginPath(); ctx.roundRect(canvas.width-330,ny-26,318,28,7); ctx.fill();
    ctx.strokeStyle=RARITY_COLORS[n.rarity]+'44'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(canvas.width-330,ny-26,318,28,7); ctx.stroke();
    ctx.fillStyle=RARITY_COLORS[n.rarity]||'#fff';
    ctx.font='12px sans-serif'; ctx.textAlign='right';
    ctx.fillText(n.msg, canvas.width-14, ny-7);
    ctx.globalAlpha=1; ny-=32;
  }
}

// ─── FISHING DRAW ─────────────────────────────────────────────────────────────
function drawFishing(){
  drawWorld(); drawHUD();
  const cx=canvas.width/2, cy=canvas.height/2;

  // Waiting phase — no overlay, just bobber on the world
  if(mg.phase==='waiting'){
    const t=waveT.t;
    const bx=mg.bobberX-cam.x, by=mg.bobberY-cam.y;
    const hasDouble=skillEffect('doubleChance')>0;

    // Draw fishing line(s)
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(player.x-cam.x,player.y-cam.y); ctx.lineTo(bx,by); ctx.stroke();
    if(hasDouble){
      ctx.strokeStyle='rgba(255,213,79,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(player.x-cam.x,player.y-cam.y); ctx.lineTo(bx+20,by+10); ctx.stroke();
    }

    function drawBobber(bx2, by2, offset){
      const bobY=by2+Math.sin(t*2.5+offset)*4;
      ctx.fillStyle='rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(bx2,bobY+8,10,3,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#e53935';
      ctx.beginPath(); ctx.arc(bx2,bobY,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(bx2,bobY,7,Math.PI,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(bx2,bobY,7,0,Math.PI*2); ctx.stroke();
    }

    drawBobber(bx, by, 0);
    if(hasDouble) drawBobber(bx+20, by+10, 1.5);
    // Small "waiting" hint bottom of screen
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.roundRect(cx-100,canvas.height-60,200,36,8); ctx.fill();
    ctx.fillStyle='#4fc3f7'; ctx.font='13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Waiting for bite... [Esc] cancel', cx, canvas.height-37);
    // Mythic rod ability: show rarity hint
    if(state.rod==='mythic'&&mg.fish){
      const rc=RARITY_COLORS[mg.fish.rarity];
      ctx.fillStyle='rgba(0,0,0,0.75)';
      ctx.beginPath(); ctx.roundRect(cx-80,canvas.height-100,160,28,6); ctx.fill();
      ctx.fillStyle=rc; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('\u{1F52E} '+mg.fish.rarity.toUpperCase()+' fish detected', cx, canvas.height-81);
    }
    return;
  }

  // Screen shake for bite moment
  if(mg.screenShake>0){
    ctx.save();
    ctx.translate((Math.random()-0.5)*mg.screenShake*8,(Math.random()-0.5)*mg.screenShake*8);
  }

  // Dim for reeling/reveal
  ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Redraw rod + line above the dim so it stays visible
  {
    const px2=player.x-cam.x, py2=player.y-cam.y;
    const ra=player.angle-0.5;
    const rx2=px2+Math.cos(ra)*30, ry2=py2+Math.sin(ra)*30;
    const rc={stick:'#8b6a1a',basic:'#6a4a20',pro:'#3a3a3a',carbon:'#1a1a2a',golden:'#c8a020',mythic:'#6020c0'};
    ctx.strokeStyle=rc[state.rod]||'#8b6a1a'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(px2+Math.cos(ra)*player.r*0.7,py2+Math.sin(ra)*player.r*0.7); ctx.lineTo(rx2,ry2); ctx.stroke();
    // Fishing line to bobber
    const bx=mg.bobberX-cam.x, by=mg.bobberY-cam.y;
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(rx2,ry2); ctx.lineTo(bx,by); ctx.stroke();
    // Bobber at water
    ctx.fillStyle='#e53935'; ctx.beginPath(); ctx.arc(bx,by,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx,by,5,Math.PI,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(bx,by,5,0,Math.PI*2); ctx.stroke();
  }

  if(mg.phase==='reveal'){
    const fish=mg.fish;
    const mut=mg.mutation;
    const col=mut?mut.color:RARITY_COLORS[fish.rarity];
    const t=waveT.t;
    // Dramatic reveal panel
    ctx.fillStyle='rgba(6,10,6,0.97)';
    ctx.beginPath(); ctx.roundRect(cx-160,cy-110,320,220,18); ctx.fill();
    ctx.strokeStyle=col+'88'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(cx-160,cy-110,320,220,18); ctx.stroke();
    // Fish clipart (large, centered, glowing)
    const iconSize=32+Math.sin(t*4)*3;
    ctx.shadowColor=col; ctx.shadowBlur=30;
    drawFishIcon(fish.id, cx, cy-40, iconSize, col);
    ctx.shadowBlur=0;
    ctx.fillStyle=col; ctx.font='bold 22px sans-serif'; ctx.textAlign='center';
    ctx.fillText(fish.name, cx, cy+10);
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='11px sans-serif';
    ctx.fillText(fish.rarity.toUpperCase(), cx, cy+28);
    if(mut){
      ctx.fillStyle=mut.color; ctx.font='bold 13px sans-serif';
      ctx.fillText('\u2728 '+mut.name+' Mutation! \u2728', cx, cy+50);
    }
    ctx.fillStyle='#ffd54f'; ctx.font='bold 14px sans-serif';
    ctx.fillText('+$'+state.fishLog[0]?.value, cx, cy+72);
    if(mg.screenShake>0) ctx.restore();
    return;
  }

  // Reeling phase
  const bH=300,bW=42,bX=cx-bW/2,bY=cy-bH/2;
  const panW=310,panH=430;
  ctx.fillStyle='rgba(6,10,6,0.97)';
  ctx.beginPath(); ctx.roundRect(cx-panW/2,cy-panH/2,panW,panH,16); ctx.fill();
  ctx.strokeStyle=RARITY_COLORS[mg.fish.rarity]+'55'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(cx-panW/2,cy-panH/2,panW,panH,16); ctx.stroke();

  // Fish shown as "???" during reeling (unless deep rod reveals it)
  const deepRod = state.rod==='deep_rod';
  ctx.fillStyle=deepRod?RARITY_COLORS[mg.fish.rarity]:'rgba(255,255,255,0.3)';
  ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
  ctx.fillText(deepRod?mg.fish.name:'???', cx, cy-panH/2+32);
  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.font='10px sans-serif';
  ctx.fillText(deepRod?mg.fish.rarity.toUpperCase():'UNKNOWN FISH', cx, cy-panH/2+48);
  // Question mark icon
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(cx,cy-panH/2+80,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='bold 24px sans-serif';
  ctx.fillText('?', cx, cy-panH/2+89);

  ctx.fillStyle='rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.roundRect(bX,bY,bW,bH,8); ctx.fill();

  const zY=bY+mg.zonePos*bH-(mg.zoneSize*bH)/2;
  const zH=mg.zoneSize*bH;
  const inZone=mg.fishPos>=mg.zonePos-mg.zoneSize/2&&mg.fishPos<=mg.zonePos+mg.zoneSize/2;
  const zg=ctx.createLinearGradient(bX,zY,bX+bW,zY);
  zg.addColorStop(0,inZone?'rgba(76,175,80,0.55)':'rgba(76,175,80,0.18)');
  zg.addColorStop(1,inZone?'rgba(100,220,100,0.55)':'rgba(76,175,80,0.18)');
  ctx.fillStyle=zg; ctx.beginPath(); ctx.roundRect(bX+2,zY,bW-4,zH,5); ctx.fill();
  ctx.strokeStyle=inZone?'#4caf50':'#2e7d32'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(bX+2,zY,bW-4,zH,5); ctx.stroke();

  const fY=bY+mg.fishPos*bH;
  const grd=ctx.createRadialGradient(bX+bW/2,fY,0,bX+bW/2,fY,16);
  const fishDotColor=deepRod?RARITY_COLORS[mg.fish.rarity]:'rgba(255,255,255,0.6)';
  grd.addColorStop(0,fishDotColor); grd.addColorStop(1,'transparent');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(bX+bW/2,fY,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bX+bW/2,fY,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#aaa'; ctx.beginPath(); ctx.arc(bX+bW/2,fY,4,0,Math.PI*2); ctx.fill();

  const pW=190,pH=8,pX=cx-pW/2,p1Y=cy+bH/2+18,p2Y=p1Y+22;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(pX,p1Y,pW,pH,4); ctx.fill();
  ctx.fillStyle='#4caf50'; ctx.beginPath(); ctx.roundRect(pX,p1Y,pW*mg.progress,pH,4); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(pX,p2Y,pW,pH,4); ctx.fill();
  ctx.fillStyle='#f44336'; ctx.beginPath(); ctx.roundRect(pX,p2Y,pW*mg.escaped,pH,4); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='9px sans-serif'; ctx.textAlign='left';
  ctx.fillText('CATCH',pX-42,p1Y+7); ctx.fillText('ESCAPE',pX-46,p2Y+7);
  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font='11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Hold to move zone UP',cx,cy+panH/2-28);
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.font='10px sans-serif';
  ctx.fillText('[Esc] Cancel',cx,cy+panH/2-12);

  if(mg.screenShake>0) ctx.restore();
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function overlay(){ ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,canvas.width,canvas.height); }
function panel(px,py,pw,ph,title,accentColor){
  ctx.fillStyle='rgba(6,10,6,0.98)'; ctx.beginPath(); ctx.roundRect(px,py,pw,ph,16); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(px,py,pw,ph,16); ctx.stroke();
  // Header gradient
  const hg=ctx.createLinearGradient(px,py,px+pw,py);
  hg.addColorStop(0,(accentColor||'rgba(255,255,255,0.06)'));
  hg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(px,py,pw,44,{upperLeft:16,upperRight:16,lowerLeft:0,lowerRight:0}); ctx.fill();
  ctx.fillStyle='#e0e0e0'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
  ctx.fillText(title, px+pw/2, py+28);
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(px+pw-22,py+22,12,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(px+pw-28,py+16); ctx.lineTo(px+pw-16,py+28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px+pw-16,py+16); ctx.lineTo(px+pw-28,py+28); ctx.stroke();
}
function isCloseBtn(mx,my,px,py,pw){
  return Math.hypot(mx-(px+pw-22),my-(py+22))<14;
}

// ─── SHOP ────────────────────────────────────────────────────────────────────
function drawShop(){
  overlay();
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=760,ph=600,px=cx-pw/2,py=cy-ph/2;
  panel(px,py,pw,ph,'Rod Shop','rgba(139,26,26,0.25)');
  ctx.fillStyle='#ffd54f'; ctx.font='13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Balance: $'+state.money.toLocaleString(), cx, py+52);

  // Scrollable rod grid
  const cols=3,cW=208,cH=158,gap=10;
  const gx=cx-(cols*cW+(cols-1)*gap)/2;
  const gridH=ph-180; // visible height for rods
  const gridTop=py+62;
  const totalRows=Math.ceil(RODS.length/cols);
  const totalH=totalRows*(cH+gap);
  const maxScroll=Math.max(0,totalH-gridH);
  state.shopScroll=Math.max(0,Math.min(maxScroll,state.shopScroll));

  // Clip to grid area
  ctx.save();
  ctx.beginPath(); ctx.rect(px+8,gridTop,pw-16,gridH); ctx.clip();

  RODS.forEach((rod,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    const rx=gx+col*(cW+gap), ry=gridTop+row*(cH+gap)-state.shopScroll;
    if(ry+cH<gridTop||ry>gridTop+gridH) return; // skip off-screen
    const owned=state.ownedRods.has(rod.id),active=state.rod===rod.id;
    ctx.fillStyle=active?'rgba(79,195,247,0.1)':owned?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,10); ctx.fill();
    ctx.strokeStyle=active?'#4fc3f7':owned?'rgba(255,255,255,0.14)':'rgba(255,255,255,0.04)'; ctx.lineWidth=active?2:1;
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,10); ctx.stroke();
    // Rod art
    const rodColors={stick:'#8b6a1a',basic:'#a07040',pro:'#888',carbon:'#aaa',golden:'#c8a020',mythic:'#9040e0',
      swamp_rod:'#4a6a1a',coral_rod:'#1a8a8a',volcano_rod:'#8a2a0a',ice_rod:'#4a8aaa',deep_rod:'#1a0a4a',speed_rod:'#4a4aaa',tank_rod:'#6a4a1a'};
    ctx.strokeStyle=rodColors[rod.id]||'#888'; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(rx+16,ry+16); ctx.lineTo(rx+cW-16,ry+44); ctx.stroke();
    ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(rx+cW-16,ry+44); ctx.lineTo(rx+cW-8,ry+60); ctx.stroke();
    ctx.fillStyle='#e0e0e0'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(rod.name, rx+cW/2, ry+70);
    ctx.fillStyle='#555'; ctx.font='10px sans-serif'; ctx.fillText(rod.desc, rx+cW/2, ry+83);
    if(rod.ability&&ROD_ABILITIES[rod.ability]){
      const ab=ROD_ABILITIES[rod.ability];
      ctx.fillStyle='rgba(255,213,79,0.15)';
      ctx.beginPath(); ctx.roundRect(rx+8,ry+87,cW-16,16,4); ctx.fill();
      ctx.fillStyle='#ffd54f'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
      ctx.fillText('\u2605 '+ab.name+': '+ab.desc, rx+cW/2, ry+98);
    }
    [['Luck',rod.luck,'#ffd54f'],['Speed',rod.speed,'#4fc3f7'],['Str',rod.strength,'#f44336']].forEach(([lbl,val,col2],si)=>{
      const bx2=rx+10,by2=ry+104+si*14,bw2=cW-20,bh2=6;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(bx2,by2,bw2,bh2,3); ctx.fill();
      ctx.fillStyle=col2; ctx.beginPath(); ctx.roundRect(bx2,by2,bw2*(val/10),bh2,3); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='8px sans-serif'; ctx.textAlign='left';
      ctx.fillText(lbl, bx2, by2-1);
    });
    const bx2=rx+14,by2=ry+cH-26,bw2=cW-28,bh2=20;
    if(owned){
      ctx.fillStyle=active?'rgba(79,195,247,0.25)':'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.roundRect(bx2,by2,bw2,bh2,6); ctx.fill();
      ctx.fillStyle=active?'#4fc3f7':'#888'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(active?'\u2713 Equipped':'Equip', rx+cW/2, by2+14);
    } else {
      const can=state.money>=rod.cost;
      ctx.fillStyle=can?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.roundRect(bx2,by2,bw2,bh2,6); ctx.fill();
      ctx.fillStyle=can?'#4fc3f7':'#444'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Buy $'+rod.cost.toLocaleString(), rx+cW/2, by2+14);
    }
  });
  ctx.restore();

  // Scroll indicator
  if(maxScroll>0){
    const sbx=px+pw-14, sby=gridTop, sbh=gridH;
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(sbx,sby,6,sbh,3); ctx.fill();
    const thumbH=Math.max(30,sbh*(gridH/totalH));
    const thumbY=sby+(state.shopScroll/maxScroll)*(sbh-thumbH);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.roundRect(sbx,thumbY,6,thumbH,3); ctx.fill();
    ctx.fillStyle='#555'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('scroll', sbx+3, gridTop+gridH+12);
  }

  // Area unlocks strip at bottom
  const ay=py+ph-118;
  ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.roundRect(px+12,ay-4,pw-24,112,8); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(px+12,ay-4,pw-24,112,8); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Area Unlocks', cx, ay+10);
  const lockEntries=Object.entries(AREA_LOCKS);
  const lockCols=4, lockW=Math.floor((pw-32)/lockCols);
  lockEntries.forEach(([id,lock],i)=>{
    const col2=i%lockCols, row2=Math.floor(i/lockCols);
    const ax=px+16+col2*lockW, aay=ay+18+row2*52, aw=lockW-6, ah=46;
    ctx.fillStyle=lock.unlocked?'rgba(76,175,80,0.12)':'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.roundRect(ax,aay,aw,ah,6); ctx.fill();
    ctx.strokeStyle=lock.unlocked?'rgba(76,175,80,0.4)':'rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(ax,aay,aw,ah,6); ctx.stroke();
    ctx.fillStyle=lock.unlocked?'#4caf50':'#ccc'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
    ctx.fillText((lock.unlocked?'\u2713 ':'')+lock.name, ax+aw/2, aay+14);
    if(!lock.unlocked){
      const can=state.money>=lock.cost;
      ctx.fillStyle=can?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.roundRect(ax+6,aay+20,aw-12,18,4); ctx.fill();
      ctx.fillStyle=can?'#4fc3f7':'#444'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
      ctx.fillText('$'+lock.cost.toLocaleString(), ax+aw/2, aay+33);
    } else {
      ctx.fillStyle='#2a5a2a'; ctx.font='9px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Unlocked', ax+aw/2, aay+33);
    }
  });
}

// ─── BAIT ────────────────────────────────────────────────────────────────────
function drawBait(){
  overlay();
  const cx=canvas.width/2,cy=canvas.height/2;
  const pw=600,ph=480,px=cx-pw/2,py=cy-ph/2;
  panel(px,py,pw,ph,'Bait Shop','rgba(26,58,90,0.25)');
  ctx.fillStyle='#ffd54f'; ctx.font='13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Balance: $'+state.money.toLocaleString(), cx, py+52);
  const cols=3,cW=172,cH=124,gap=10;
  const gx=cx-(cols*cW+(cols-1)*gap)/2,gy=py+66;
  BAITS.forEach((bait,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    const rx=gx+col*(cW+gap),ry=gy+row*(cH+gap);
    const count=state.baitCount[bait.id]||0,active=state.bait===bait.id;
    ctx.fillStyle=active?'rgba(100,200,100,0.1)':'rgba(255,255,255,0.03)';
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,10); ctx.fill();
    ctx.strokeStyle=active?'#4caf50':'rgba(255,255,255,0.07)'; ctx.lineWidth=active?2:1;
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,10); ctx.stroke();
    // Bait icon — colored circle
    ctx.fillStyle=bait.color+'88';
    ctx.beginPath(); ctx.arc(rx+cW/2,ry+28,16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=bait.color;
    ctx.beginPath(); ctx.arc(rx+cW/2,ry+28,11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(rx+cW/2-4,ry+24,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#e0e0e0'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText(bait.name, rx+cW/2, ry+54);
    ctx.fillStyle='#555'; ctx.font='9px sans-serif'; ctx.fillText(bait.desc, rx+cW/2, ry+66);
    ctx.fillStyle='#ffd54f'; ctx.font='10px sans-serif'; ctx.fillText('x'+count+' owned', rx+cW/2, ry+78);
    const hw=(cW-20)/2;
    const can=state.money>=bait.cost;
    ctx.fillStyle=can?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(rx+8,ry+cH-30,hw,22,5); ctx.fill();
    ctx.fillStyle=can?'#4fc3f7':'#444'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Buy $'+bait.cost, rx+8+hw/2, ry+cH-15);
    ctx.fillStyle=count>0?(active?'rgba(76,175,80,0.3)':'rgba(255,255,255,0.07)'):'rgba(255,255,255,0.02)';
    ctx.beginPath(); ctx.roundRect(rx+cW/2+2,ry+cH-30,hw,22,5); ctx.fill();
    ctx.fillStyle=count>0?(active?'#4caf50':'#aaa'):'#333'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(active?'Active':'Equip', rx+cW/2+2+hw/2, ry+cH-15);
  });
}

// ─── SKILLS ──────────────────────────────────────────────────────────────────
// Skill tree scroll state
let skillScroll = 0;

function drawSkills(){
  overlay();
  const cx=canvas.width/2,cy=canvas.height/2;
  const pw=Math.min(1000,canvas.width-40), ph=Math.min(680,canvas.height-40);
  const px=cx-pw/2,py=cy-ph/2;
  panel(px,py,pw,ph,'Skill Tree','rgba(80,40,120,0.25)');
  ctx.fillStyle='#ffd54f'; ctx.font='13px sans-serif'; ctx.textAlign='center';
  ctx.fillText(state.skillPoints+' skill point'+(state.skillPoints!==1?'s':'')+' available', cx, py+52);

  const catCols={
    luck: {col:0,span:2,label:'LUCK',  color:'#ffd54f'},
    skill:{col:2,span:2,label:'SKILL', color:'#4fc3f7'},
    extra:{col:4,span:2,label:'EXTRA', color:'#c080ff'},
  };
  const nR=36, cG=126, rG=96;
  const gridTop=py+70;
  const gridH=ph-80;
  const gx=px+20, gy=gridTop-skillScroll;

  // Total content height
  const maxRow=Math.max(...SKILL_TREE.map(s=>s.row));
  const totalH=(maxRow+1)*rG+nR*2+30;
  const maxScroll=Math.max(0,totalH-gridH);
  skillScroll=Math.max(0,Math.min(maxScroll,skillScroll));

  // Clip to grid area
  ctx.save();
  ctx.beginPath(); ctx.rect(px+4,gridTop,pw-8,gridH); ctx.clip();

  // Category headers
  for(const [cat,info] of Object.entries(catCols)){
    const hx=gx+info.col*cG, hw=info.span*cG-8;
    ctx.fillStyle=info.color+'22';
    ctx.beginPath(); ctx.roundRect(hx,gy,hw,20,5); ctx.fill();
    ctx.fillStyle=info.color; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(info.label, hx+hw/2, gy+14);
  }

  // Connector lines
  ctx.lineWidth=1.5;
  for(const skill of SKILL_TREE){
    if(!skill.requires) continue;
    const par=SKILL_TREE.find(s=>s.id===skill.requires); if(!par) continue;
    const x1=gx+par.col*cG+nR, y1=gy+26+par.row*rG+nR;
    const x2=gx+skill.col*cG+nR, y2=gy+26+skill.row*rG+nR;
    ctx.strokeStyle=state.skills.has(skill.id)?'rgba(76,175,80,0.55)':state.skills.has(par.id)?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }

  // Nodes
  for(const skill of SKILL_TREE){
    const nx=gx+skill.col*cG, ny=gy+26+skill.row*rG;
    const unlocked=state.skills.has(skill.id);
    const parOk=!skill.requires||state.skills.has(skill.requires);
    const avail=parOk&&!unlocked&&state.skillPoints>=skill.cost;
    const catColor=catCols[skill.cat]?.color||'#fff';

    if(ny+nR*2<gridTop||ny>gridTop+gridH) continue; // skip off-screen

    if(unlocked||avail){ ctx.shadowColor=catColor; ctx.shadowBlur=10; }
    ctx.fillStyle=unlocked?catColor+'33':avail?catColor+'18':'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.arc(nx+nR,ny+nR,nR,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle=unlocked?catColor:avail?catColor+'88':'rgba(255,255,255,0.08)';
    ctx.lineWidth=unlocked?2.5:avail?2:1;
    ctx.beginPath(); ctx.arc(nx+nR,ny+nR,nR,0,Math.PI*2); ctx.stroke();

    if(!parOk&&!unlocked){
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.font='18px sans-serif'; ctx.textAlign='center';
      ctx.fillText('?',nx+nR,ny+nR+6); continue;
    }
    ctx.fillStyle=unlocked?catColor:'#ccc'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
    const words=skill.name.split(' ');
    if(words.length>1){
      ctx.fillText(words[0],nx+nR,ny+nR-8);
      ctx.fillText(words.slice(1).join(' '),nx+nR,ny+nR+2);
    } else {
      ctx.fillText(skill.name,nx+nR,ny+nR-2);
    }
    ctx.fillStyle=unlocked?'#4caf50':avail?'#ffd54f':'#555'; ctx.font='8px sans-serif';
    ctx.fillText(unlocked?'\u2713':skill.cost+' pts',nx+nR,ny+nR+14);
    // Desc on hover-like always visible
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='7px sans-serif';
    ctx.fillText(skill.desc.length>16?skill.desc.slice(0,15)+'\u2026':skill.desc,nx+nR,ny+nR*2-4);
    if(avail){
      ctx.fillStyle=catColor+'33';
      ctx.beginPath(); ctx.arc(nx+nR,ny+nR,nR,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();

  // Scrollbar
  if(maxScroll>0){
    const sbx=px+pw-12, sby=gridTop, sbh=gridH;
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(sbx,sby,6,sbh,3); ctx.fill();
    const thumbH=Math.max(30,sbh*(gridH/totalH));
    const thumbY=sby+(skillScroll/maxScroll)*(sbh-thumbH);
    ctx.fillStyle='rgba(192,128,255,0.5)'; ctx.beginPath(); ctx.roundRect(sbx,thumbY,6,thumbH,3); ctx.fill();
    ctx.fillStyle='#555'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('scroll', sbx+3, sby+sbh+12);
  }
}

// ─── LOG ─────────────────────────────────────────────────────────────────────
function drawLog(){
  overlay();
  const cx=canvas.width/2,cy=canvas.height/2;
  const pw=Math.min(820,canvas.width-40), ph=Math.min(640,canvas.height-40), px=cx-pw/2, py=cy-ph/2;
  panel(px,py,pw,ph,'Catch Log','rgba(20,60,20,0.25)');
  ctx.fillStyle='#888'; ctx.font='12px sans-serif'; ctx.textAlign='center';
  ctx.fillText(state.totalCaught+' fish caught total', cx, py+52);
  const log=state.fishLog.slice(0,45);
  const cols=3, cW=Math.floor((pw-32)/cols), cH=60, gap=8;
  const gridH=ph-70, gridTop=py+60;
  if(!state.logScroll) state.logScroll=0;
  const totalLogH=Math.ceil(log.length/cols)*(cH+gap);
  state.logScroll=Math.max(0,Math.min(Math.max(0,totalLogH-gridH),state.logScroll));
  const gx=cx-(cols*cW+(cols-1)*gap)/2, gy=gridTop-state.logScroll;
  ctx.save(); ctx.beginPath(); ctx.rect(px+4,gridTop,pw-8,gridH); ctx.clip();
  log.forEach((entry,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    const rx=gx+col*(cW+gap),ry=gy+row*(cH+gap);
    const mut=entry.mutation;
    const borderCol=mut?mut.color:RARITY_COLORS[entry.fish.rarity];
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,7); ctx.fill();
    ctx.strokeStyle=borderCol+'55'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,7); ctx.stroke();
    // Fish clipart in log
    drawFishIcon(entry.fish.id, rx+cW-20, ry+cH/2, 12, borderCol);
    ctx.fillStyle='#ccc'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left'; ctx.fillText(entry.fish.name,rx+10,ry+20);
    ctx.fillStyle=RARITY_COLORS[entry.fish.rarity]; ctx.font='9px sans-serif'; ctx.fillText(entry.fish.rarity,rx+26,ry+32);
    if(mut){ ctx.fillStyle=mut.color; ctx.font='8px sans-serif'; ctx.fillText(mut.name,rx+26,ry+44); }
    ctx.fillStyle='#ffd54f'; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('+$'+entry.value,rx+cW-8,ry+32);
  });
  ctx.restore();
  if(!log.length){ctx.fillStyle='#333';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('No fish yet \u2014 go explore!',cx,cy+20);}
  // Scrollbar
  if(totalLogH>gridH){
    const sbx=px+pw-10,sby=gridTop,sbh=gridH;
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(sbx,sby,6,sbh,3); ctx.fill();
    const thumbH=Math.max(24,sbh*(gridH/totalLogH));
    const thumbY=sby+(state.logScroll/Math.max(1,totalLogH-gridH))*(sbh-thumbH);
    ctx.fillStyle='rgba(128,255,128,0.4)'; ctx.beginPath(); ctx.roundRect(sbx,thumbY,6,thumbH,3); ctx.fill();
  }
}

// ─── BOAT SHOP ───────────────────────────────────────────────────────────────
function drawBoatShop(){
  overlay();
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=480, ph=320, px=cx-pw/2, py=cy-ph/2;
  panel(px,py,pw,ph,'Boat Shop','rgba(100,70,20,0.3)');

  ctx.fillStyle='#ffd54f'; ctx.font='13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Balance: $'+state.money.toLocaleString(), cx, py+52);

  // Boat icon (simple drawn boat)
  const bx=cx, by=cy-20;
  ctx.fillStyle='#8b6a1a';
  ctx.beginPath();
  ctx.moveTo(bx-50,by); ctx.lineTo(bx+50,by);
  ctx.lineTo(bx+40,by+24); ctx.lineTo(bx-40,by+24);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='#c8a020';
  ctx.fillRect(bx-4,by-30,8,32);
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.moveTo(bx,by-28); ctx.lineTo(bx+28,by-4); ctx.lineTo(bx,by-4); ctx.closePath(); ctx.fill();

  ctx.fillStyle='#e0e0e0'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
  ctx.fillText(state.hasBoat ? 'You own a boat!' : 'Fishing Boat', cx, cy+46);
  ctx.fillStyle='#888'; ctx.font='11px sans-serif';
  ctx.fillText(state.hasBoat ? 'Fish in the deep ocean from the dock' : 'Sail out to fish in the deep ocean', cx, cy+62);

  if(!state.hasBoat){
    const can=state.money>=2000;
    ctx.fillStyle=can?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(cx-70,cy+74,140,28,7); ctx.fill();
    ctx.fillStyle=can?'#4fc3f7':'#444'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Buy Boat  $2,000', cx, cy+93);
  } else {
    ctx.fillStyle='rgba(76,175,80,0.15)';
    ctx.beginPath(); ctx.roundRect(cx-70,cy+74,140,28,7); ctx.fill();
    ctx.fillStyle='#4caf50'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('\u2713 Boat Owned', cx, cy+93);
  }
}

// ─── CLICK HANDLER ───────────────────────────────────────────────────────────
function onCanvasDown(e){
  const rect=canvas.getBoundingClientRect();
  const mx=(e.clientX||e.pageX)-rect.left, my=(e.clientY||e.pageY)-rect.top;
  const cx=canvas.width/2, cy=canvas.height/2;

  if(admin.open){ adminClick(mx,my); return; }

  if(state.mainMenu){
    for(const btn of mainMenuBtns){
      if(mx>=btn.bx&&mx<=btn.bx+btn.bw&&my>=btn.by&&my<=btn.by+btn.bh){
        if(btn.action==='play'){
          state.mainMenu=false;
          if(!localStorage.getItem('fishgame_tutorial_done')){ tutorial.active=true; tutorial.step=0; }
          state.musicStarted=true; setBGMusic('music',0.2);
        } else if(btn.action==='newgame'){
          localStorage.removeItem('fishgame_save_v1');
          localStorage.removeItem('fishgame_tutorial_done');
          location.reload();
        } else if(btn.action==='settings'){
          state.mainMenu=false; state.screen='settings';
          if(!state.musicStarted){ state.musicStarted=true; setBGMusic('music',0.2); }
        }
        return;
      }
    }
    // Any click starts game
    state.mainMenu=false;
    if(!localStorage.getItem('fishgame_tutorial_done')){ tutorial.active=true; tutorial.step=0; }
    if(!state.musicStarted){ state.musicStarted=true; setBGMusic('music',0.2); }
    return;
  }

  if(state.screen==='fishing'&&mg.phase==='reeling'){mg.holding=true;return;}
  if(state.screen==='fishing'&&mg.phase==='reveal'){mg.active=false;state.screen='world';return;}

  // Pause menu clicks
  if(state.paused){
    const btns=drawPause._btns||[];
    for(const btn of btns){
      if(mx>=btn.bx&&mx<=btn.bx+btn.bw&&my>=btn.by&&my<=btn.by+btn.bh){ btn.action(); return; }
    }
    return;
  }

  // Skill info panel clicks
  if(state.skillInfo){
    const si=drawSkillInfo;
    const px2=si._px, py2=si._py, pw2=si._pw, ph2=si._ph;
    // X close
    if(Math.hypot(mx-(px2+pw2-18),my-(py2+18))<14){ state.skillInfo=null; return; }
    const skill=state.skillInfo;
    const unlocked=state.skills.has(skill.id);
    const parOk=!skill.requires||state.skills.has(skill.requires);
    // Unlock button
    if(!unlocked&&parOk&&mx>=px2+20&&mx<=px2+pw2-20&&my>=py2+ph2-80&&my<=py2+ph2-52){
      if(state.skillPoints>=skill.cost){
        state.skillPoints-=skill.cost; state.skills.add(skill.id);
        notify('Unlocked '+skill.name+'!','epic'); playSound('skill',0.7);
        spawnParticles(player.x,player.y,'#c080ff',16,{speed:1.5,spread:4});
        state.skillInfo=null;
      } else notify('Need '+skill.cost+' skill points','common');
      return;
    }
    // Refund button
    if(unlocked&&mx>=px2+20&&mx<=px2+pw2-20&&my>=py2+ph2-80&&my<=py2+ph2-52){
      // Check no other skill requires this one
      const dependents=SKILL_TREE.filter(s=>s.requires===skill.id&&state.skills.has(s.id));
      if(dependents.length>0){
        notify('Refund '+dependents.map(s=>s.name).join(', ')+' first','common');
      } else {
        state.skills.delete(skill.id);
        state.skillPoints+=skill.cost;
        notify('Refunded '+skill.name+' (+'+skill.cost+' pts)','uncommon');
        state.skillInfo=null;
      }
      return;
    }
    return;
  }

  // Tutorial click
  if(tutorial.active&&!tutorial.done){
    if(mx>=tutBtn.x&&mx<=tutBtn.x+tutBtn.w&&my>=tutBtn.y&&my<=tutBtn.y+tutBtn.h){
      advanceTutorial(); return;
    }
  }

  if(state.screen==='world'){
    const p=14,bby=canvas.height-p-42,bbh=34;
    if(mx>=p&&mx<=p+68&&my>=bby&&my<=bby+bbh){state.screen='skills';return;}
    if(mx>=p+82&&mx<=p+150&&my>=bby&&my<=bby+bbh){state.screen='log';return;}
    if(mx>=p+154&&mx<=p+222&&my>=bby&&my<=bby+bbh){state.screen='collection';return;}
    if(mx>=p+226&&mx<=p+294&&my>=bby&&my<=bby+bbh){state.screen='settings';return;}
  }

  const panelDims={
    shop:       {pw:740,ph:580}, bait:{pw:600,ph:480},
    boat:       {pw:480,ph:320},
    skills:     {pw:Math.min(1000,canvas.width-40), ph:Math.min(680,canvas.height-40)},
    log:        {pw:Math.min(820,canvas.width-40),  ph:Math.min(640,canvas.height-40)},
    collection: {pw:Math.min(900,canvas.width-40), ph:Math.min(600,canvas.height-40)},
    settings:   {pw:520,ph:560},
  };
  if(state.screen in panelDims){
    const {pw,ph}=panelDims[state.screen];
    const ppx=cx-pw/2,ppy=cy-ph/2;
    if(isCloseBtn(mx,my,ppx,ppy,pw)){
      if(state.screen==='settings') state.wipeConfirm=false;
      state.screen='world'; return;
    }
  }

  if(state.screen==='shop'){
    const pw=760,ph=600,ppx=cx-pw/2,ppy=cy-ph/2;
    const cols=3,cW=208,cH=158,gap=10;
    const gx=cx-(cols*cW+(cols-1)*gap)/2;
    const gridH=ph-180, gridTop=ppy+62;
    RODS.forEach((rod,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const rx=gx+col*(cW+gap), ry=gridTop+row*(cH+gap)-state.shopScroll;
      if(ry+cH<gridTop||ry>gridTop+gridH) return;
      const bx2=rx+14,by2=ry+cH-26,bw2=cW-28,bh2=20;
      if(mx>=bx2&&mx<=bx2+bw2&&my>=by2&&my<=by2+bh2){
        if(state.ownedRods.has(rod.id)){state.rod=rod.id;notify('Equipped '+rod.name,'uncommon');playSound('buy',0.4);}
        else if(state.money>=rod.cost){state.money-=rod.cost;state.ownedRods.add(rod.id);state.rod=rod.id;notify('Bought '+rod.name+'!','rare');playSound('buy',0.6);spawnParticles(player.x,player.y,'#4fc3f7',10);}
        else notify('Need $'+rod.cost,'common');
      }
    });
    // Area unlock buttons
    const ay=ppy+ph-118+18;
    const lockEntries=Object.entries(AREA_LOCKS);
    const lockCols=4, lockW=Math.floor((pw-32)/lockCols);
    lockEntries.forEach(([id,lock],i)=>{
      const col2=i%lockCols, row2=Math.floor(i/lockCols);
      const ax=ppx+16+col2*lockW, aay=ay+row2*52, aw=lockW-6;
      if(!lock.unlocked&&mx>=ax+6&&mx<=ax+aw-6&&my>=aay+20&&my<=aay+38){
        if(state.money>=lock.cost){
          state.money-=lock.cost; lock.unlocked=true;
          notify('Unlocked '+lock.name+'!','epic');
          playSound('unlock',0.8);
          spawnParticles(player.x,player.y,'#ff9800',24,{speed:2,spread:5});
        } else notify('Need $'+lock.cost,'common');
      }
    });
  }

  if(state.screen==='bait'){
    const pw=600,ph=480,ppx=cx-pw/2,ppy=cy-ph/2;
    const cols=3,cW=172,cH=124,gap=10;
    const gx=cx-(cols*cW+(cols-1)*gap)/2,gy=ppy+66;
    BAITS.forEach((bait,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const rx=gx+col*(cW+gap),ry=gy+row*(cH+gap);
      const hw=(cW-20)/2;
      if(mx>=rx+8&&mx<=rx+8+hw&&my>=ry+cH-30&&my<=ry+cH-8){
        if(state.money>=bait.cost){state.money-=bait.cost;state.baitCount[bait.id]=(state.baitCount[bait.id]||0)+5;notify('Bought 5x '+bait.name,'uncommon');playSound('buy',0.5);}
        else notify('Need $'+bait.cost,'common');
      }
      if(mx>=rx+cW/2+2&&mx<=rx+cW/2+2+hw&&my>=ry+cH-30&&my<=ry+cH-8){
        const count=state.baitCount[bait.id]||0;
        if(count>0){state.bait=state.bait===bait.id?null:bait.id;notify(state.bait?'Using '+bait.name:'Bait removed','common');}
        else notify('Buy some first!','common');
      }
    });
  }

  if(state.screen==='boat'){
    const pw=480,ph=320,ppx=cx-pw/2,ppy=cy-ph/2;
    const bx=cx-70, by=ppy+ph/2+74, bw=140, bh=28;
    if(!state.hasBoat&&mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh){
      if(state.money>=2000){
        state.money-=2000; state.hasBoat=true;
        notify('Boat purchased! Fish from the dock.','epic');
        playSound('buy',0.7);
        spawnParticles(player.x,player.y,'#c8a020',20,{speed:2,spread:4});
      } else notify('Need $2,000 for a boat!','common');
    }
  }

  if(state.screen==='skills'){
    const pw=Math.min(1000,canvas.width-40), ph=Math.min(680,canvas.height-40);
    const ppx=cx-pw/2,ppy=cy-ph/2;
    const nR=36, cG=126, rG=96;
    const gridTop=ppy+70;
    const gx=ppx+20, gy=gridTop-skillScroll;
    for(const skill of SKILL_TREE){
      const nx=gx+skill.col*cG, ny=gy+26+skill.row*rG;
      if(Math.hypot(mx-(nx+nR),my-(ny+nR))<nR){
        const unlocked=state.skills.has(skill.id);
        const parOk=!skill.requires||state.skills.has(skill.requires);
        if(!unlocked&&parOk&&state.skillPoints>=skill.cost){
          state.skillPoints-=skill.cost; state.skills.add(skill.id);
          notify('Unlocked '+skill.name+'!','epic');
          playSound('skill',0.7);
          spawnParticles(player.x,player.y,'#c080ff',16,{speed:1.5,spread:4});
        } else if(unlocked) notify(skill.name+' already unlocked','common');
        else if(!parOk) notify('Unlock prerequisite first','common');
        else notify('Need '+skill.cost+' skill points','common');
      }
    }
  }

  if(state.screen==='collection'){
    const pw=Math.min(900,canvas.width-40), ph=Math.min(600,canvas.height-40);
    const ppx=cx-pw/2, ppy=cy-ph/2;
    const biomeKeys=Object.keys(BIOMES);
    const tabW=Math.floor((pw-24)/biomeKeys.length);
    biomeKeys.forEach((bid,i)=>{
      const tx=ppx+12+i*tabW, ty=ppy+44, tw=tabW-4, th=22;
      if(mx>=tx&&mx<=tx+tw&&my>=ty&&my<=ty+th) state._colTab=bid;
    });
  }

  if(state.screen==='settings'){
    const pw=520,ph=560,ppx=cx-pw/2,ppy=cy-ph/2;
    const rows=[
      {key:'musicVol',  type:'slider'},
      {key:'sfxVol',    type:'slider'},
      {key:'showFps',   type:'toggle'},
      {key:'screenShake',type:'toggle'},
      {key:'rainSounds', type:'toggle'},
    ];
    rows.forEach((row,i)=>{
      const ry=ppy+60+i*62;
      if(row.type==='slider'){
        const bx=ppx+30, by=ry+30, bw=pw-60;
        if(mx>=bx-10&&mx<=bx+bw+10&&my>=by-12&&my<=by+20){
          // Start drag
          sliderDrag.active=true;
          sliderDrag.key=row.key;
          sliderDrag.bx=bx;
          sliderDrag.bw=bw;
          applySliderDrag(mx);
        }
      } else {
        const tx=ppx+pw-80, ty=ry+14, tw=52, th=24;
        if(mx>=tx&&mx<=tx+tw&&my>=ty&&my<=ty+th){
          settings[row.key]=!settings[row.key];
          if(row.key==='rainSounds'&&rainAmbienceNode){
            rainAmbienceNode.volume=settings.rainSounds?settings.sfxVol*0.5:0;
          }
        }
      }
    });
    // Save button
    const sbx=cx-70, sby=ppy+ph-90, sbw=140, sbh=32;
    if(mx>=sbx&&mx<=sbx+sbw&&my>=sby&&my<=sby+sbh){
      saveGame();
      notify('Game saved!','uncommon');
    }
    // Wipe data button
    if(!state.wipeConfirm){
      if(mx>=cx-70&&mx<=cx+70&&my>=ppy+ph-130&&my<=ppy+ph-102){
        state.wipeConfirm=true;
      }
    } else {
      // Yes, Wipe
      if(mx>=cx-110&&mx<=cx-10&&my>=ppy+ph-116&&my<=ppy+ph-94){
        localStorage.removeItem('fishgame_save_v1');
        localStorage.removeItem('fishgame_tutorial_done');
        notify('All data wiped. Reloading...','common');
        setTimeout(()=>location.reload(), 800);
      }
      // Cancel
      if(mx>=cx+10&&mx<=cx+110&&my>=ppy+ph-116&&my<=ppy+ph-94){
        state.wipeConfirm=false;
      }
    }
  }
}

// ─── SLIDER DRAG STATE ───────────────────────────────────────────────────────
const sliderDrag = { active: false, key: null, bx: 0, bw: 0 };

function getSettingsSliderHit(mx, my) {
  if (state.screen !== 'settings') return null;
  const cx = canvas.width/2, cy = canvas.height/2;
  const pw = 520, ph = 560, px = cx-pw/2, py = cy-ph/2;
  const sliderKeys = ['musicVol','sfxVol'];
  for (let i = 0; i < sliderKeys.length; i++) {
    const ry = py+60+i*62;
    const bx = px+30, by = ry+30, bw = pw-60;
    if (mx >= bx-10 && mx <= bx+bw+10 && my >= by-12 && my <= by+20) {
      return { key: sliderKeys[i], bx, bw };
    }
  }
  return null;
}

function applySliderDrag(mx) {
  if (!sliderDrag.active) return;
  const val = Math.max(0, Math.min(1, (mx - sliderDrag.bx) / sliderDrag.bw));
  settings[sliderDrag.key] = val;
  if (sliderDrag.key === 'musicVol' && bgMusic) bgMusic.volume = val;
  if (sliderDrag.key === 'sfxVol' && rainAmbienceNode) {
    rainAmbienceNode.volume = settings.rainSounds ? val * 0.5 : 0;
  }
}
let last=0, fps=0, fpsTimer=0, fpsCount=0;
function loop(ts){
  const dt=Math.min((ts-last)/1000,0.1); last=ts;

  // FPS counter
  fpsCount++; fpsTimer+=dt;
  if(fpsTimer>=1){ fps=fpsCount; fpsCount=0; fpsTimer=0; }

  // Auto-save every 30s
  autoSaveTimer+=dt;
  if(autoSaveTimer>=30){ autoSaveTimer=0; saveGame(); }

  if(!state.paused && !state.mainMenu) updateVFX(dt);
  if(!state.paused && !state.mainMenu){
    updateWorld(dt);
    updateWeather(dt);
    if(state.screen==='fishing') updateMinigame(dt);
  }

  if(state.mainMenu){
    waveT.t+=dt; // keep animations running on menu
    if(!bgMusic) setBGMusic('menu_music', 0.5);
    drawMainMenu();
    requestAnimationFrame(loop);
    return;
  }
  if     (state.screen==='world')      {drawWorld();drawHUD();drawTutorial();}
  else if(state.screen==='fishing')    {drawFishing();drawTutorial();}
  else if(state.screen==='shop')       {drawWorld();drawHUD();drawShop();}
  else if(state.screen==='bait')       {drawWorld();drawHUD();drawBait();}
  else if(state.screen==='boat')       {drawWorld();drawHUD();drawBoatShop();}
  else if(state.screen==='skills')     {drawWorld();drawHUD();drawSkills(); if(state.skillInfo) drawSkillInfo();}
  else if(state.screen==='log')        {drawWorld();drawHUD();drawLog();}
  else if(state.screen==='collection') {drawWorld();drawHUD();drawCollection();}
  else if(state.screen==='settings')   {drawWorld();drawHUD();drawSettings();}

  if(state.paused) drawPause();
  if(admin.open) drawAdmin();

  // FPS overlay
  if(settings.showFps){
    ctx.fillStyle='rgba(255,255,0,0.8)'; ctx.font='bold 12px monospace'; ctx.textAlign='right';
    ctx.fillText(fps+' fps', canvas.width-8, 18);
  }

  requestAnimationFrame(loop);
}

// ─── SAVE / LOAD ─────────────────────────────────────────────────────────────
const SAVE_KEY = 'fishgame_save_v1';

function saveGame() {
  const data = {
    money: state.money, exp: state.exp, level: state.level,
    skillPoints: state.skillPoints,
    skills: [...state.skills],
    rod: state.rod, ownedRods: [...state.ownedRods],
    bait: state.bait, baitCount: state.baitCount,
    hasBoat: state.hasBoat,
    totalCaught: state.totalCaught,
    caughtIds: [...state.caughtIds],
    fishLog: state.fishLog.slice(0,60),
    areaLocks: Object.fromEntries(Object.entries(AREA_LOCKS).map(([k,v])=>[k,v.unlocked])),
    settings: settings,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e){}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    state.money = d.money||50;
    state.exp = d.exp||0;
    state.level = d.level||1;
    state.skillPoints = d.skillPoints||0;
    state.skills = new Set(d.skills||[]);
    state.rod = d.rod||'stick';
    state.ownedRods = new Set(d.ownedRods||['stick']);
    state.bait = d.bait||null;
    state.baitCount = d.baitCount||{};
    state.hasBoat = d.hasBoat||false;
    state.totalCaught = d.totalCaught||0;
    state.caughtIds = new Set(d.caughtIds||[]);
    state.fishLog = d.fishLog||[];
    if (d.areaLocks) {
      for (const [k,v] of Object.entries(d.areaLocks)) {
        if (AREA_LOCKS[k]) AREA_LOCKS[k].unlocked = v;
      }
    }
    if (d.settings) Object.assign(settings, d.settings);
  } catch(e) { console.warn('Save load failed', e); }
}

// Auto-save every 30 seconds
let autoSaveTimer = 0;


function drawSettings() {
  overlay();
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=520, ph=560, px=cx-pw/2, py=cy-ph/2;
  panel(px,py,pw,ph,'Settings','rgba(40,40,60,0.3)');

  const rows = [
    {label:'Music Volume',   key:'musicVol',    type:'slider', min:0, max:1, step:0.05},
    {label:'SFX Volume',     key:'sfxVol',      type:'slider', min:0, max:1, step:0.05},
    {label:'Show FPS',       key:'showFps',     type:'toggle'},
    {label:'Screen Shake',   key:'screenShake', type:'toggle'},
    {label:'Rain Sounds',    key:'rainSounds',  type:'toggle'},
  ];

  rows.forEach((row,i)=>{
    const ry=py+60+i*62;
    ctx.fillStyle='rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(px+16,ry,pw-32,50,8); ctx.fill();
    ctx.fillStyle='#ccc'; ctx.font='13px sans-serif'; ctx.textAlign='left';
    ctx.fillText(row.label, px+30, ry+20);

    if(row.type==='slider'){
      const val=settings[row.key];
      const bx=px+30, by=ry+30, bw=pw-60, bh=8;
      const isDragging=sliderDrag.active&&sliderDrag.key===row.key;
      // Track
      ctx.fillStyle='rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,4); ctx.fill();
      // Fill
      ctx.fillStyle=isDragging?'#80d8ff':'#4fc3f7';
      ctx.beginPath(); ctx.roundRect(bx,by,bw*val,bh,4); ctx.fill();
      // Thumb
      const thumbR=isDragging?9:7;
      ctx.fillStyle=isDragging?'#80d8ff':'#fff';
      ctx.beginPath(); ctx.arc(bx+bw*val,by+bh/2,thumbR,0,Math.PI*2); ctx.fill();
      if(isDragging){
        ctx.strokeStyle='rgba(79,195,247,0.5)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(bx+bw*val,by+bh/2,thumbR+3,0,Math.PI*2); ctx.stroke();
      }
      ctx.fillStyle='#aaa'; ctx.font='11px sans-serif'; ctx.textAlign='right';
      ctx.fillText(Math.round(val*100)+'%', px+pw-30, ry+20);
    } else {
      const on=settings[row.key];
      const tx=px+pw-80, ty=ry+14, tw=52, th=24;
      ctx.fillStyle=on?'rgba(76,175,80,0.3)':'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,12); ctx.fill();
      ctx.strokeStyle=on?'#4caf50':'rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,12); ctx.stroke();
      ctx.fillStyle=on?'#4caf50':'#888';
      ctx.beginPath(); ctx.arc(on?tx+tw-12:tx+12,ty+th/2,9,0,Math.PI*2); ctx.fill();
    }
  });

  // Save button
  ctx.fillStyle='rgba(79,195,247,0.2)';
  ctx.beginPath(); ctx.roundRect(cx-70,py+ph-90,140,32,8); ctx.fill();
  ctx.strokeStyle='#4fc3f7'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(cx-70,py+ph-90,140,32,8); ctx.stroke();
  ctx.fillStyle='#4fc3f7'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Save Game', cx, py+ph-69);

  // Wipe data button
  if(!state.wipeConfirm){
    ctx.fillStyle='rgba(244,67,54,0.12)';
    ctx.beginPath(); ctx.roundRect(cx-70,py+ph-130,140,28,7); ctx.fill();
    ctx.strokeStyle='rgba(244,67,54,0.35)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(cx-70,py+ph-130,140,28,7); ctx.stroke();
    ctx.fillStyle='#f44336'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Wipe All Data', cx, py+ph-111);
  } else {
    // Confirm step
    ctx.fillStyle='rgba(244,67,54,0.25)';
    ctx.beginPath(); ctx.roundRect(cx-120,py+ph-140,240,46,8); ctx.fill();
    ctx.strokeStyle='#f44336'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(cx-120,py+ph-140,240,46,8); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Are you sure? This cannot be undone!', cx, py+ph-124);
    // Confirm
    ctx.fillStyle='rgba(244,67,54,0.4)';
    ctx.beginPath(); ctx.roundRect(cx-110,py+ph-116,100,22,5); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Yes, Wipe', cx-60, py+ph-101);
    // Cancel
    ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(cx+10,py+ph-116,100,22,5); ctx.fill();
    ctx.fillStyle='#aaa'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Cancel', cx+60, py+ph-101);
  }

  // Privacy policy
  ctx.fillStyle='rgba(255,255,255,0.04)';
  ctx.beginPath(); ctx.roundRect(px+16,py+ph-50,pw-32,34,6); ctx.fill();
  ctx.fillStyle='#555'; ctx.font='10px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Privacy Policy: This game stores save data locally in your browser only.', cx, py+ph-36);
  ctx.fillText('No data is collected, transmitted, or shared with any third party.', cx, py+ph-22);
}

// ─── MAIN MENU ────────────────────────────────────────────────────────────────
const mainMenuBtns = [];

function drawMainMenu(){
  const cx=canvas.width/2, cy=canvas.height/2;
  const t=waveT.t;

  // Deep ocean sky gradient
  const skyGrad=ctx.createLinearGradient(0,0,0,canvas.height);
  skyGrad.addColorStop(0,'#020d1a');
  skyGrad.addColorStop(0.5,'#0a1e35');
  skyGrad.addColorStop(1,'#0d3a5c');
  ctx.fillStyle=skyGrad; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Stars
  for(let i=0;i<60;i++){
    const sx=((i*137+73)%canvas.width);
    const sy=((i*97+41)%(canvas.height*0.45));
    const twinkle=0.3+0.7*Math.abs(Math.sin(t*0.6+i*0.4));
    ctx.globalAlpha=twinkle*0.7;
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(sx,sy,i%5===0?1.5:0.8,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // Moon
  const moonX=canvas.width*0.82, moonY=canvas.height*0.12;
  ctx.fillStyle='rgba(255,240,200,0.9)';
  ctx.shadowColor='rgba(255,240,150,0.5)'; ctx.shadowBlur=30;
  ctx.beginPath(); ctx.arc(moonX,moonY,28,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  // Moon crescent shadow
  ctx.fillStyle='rgba(2,13,26,0.6)';
  ctx.beginPath(); ctx.arc(moonX+10,moonY-4,24,0,Math.PI*2); ctx.fill();

  // Animated ocean surface
  const waterY=canvas.height*0.58;
  // Water body
  const waterGrad=ctx.createLinearGradient(0,waterY,0,canvas.height);
  waterGrad.addColorStop(0,'#0d3a5c');
  waterGrad.addColorStop(1,'#061828');
  ctx.fillStyle=waterGrad;
  ctx.fillRect(0,waterY,canvas.width,canvas.height-waterY);

  // Wave layers
  for(let w=0;w<4;w++){
    const wSpeed=0.4+w*0.15, wAmp=6+w*3, wY=waterY+w*18;
    ctx.fillStyle=`rgba(13,58,92,${0.5-w*0.1})`;
    ctx.beginPath(); ctx.moveTo(0,wY);
    for(let x=0;x<=canvas.width;x+=8){
      const wy=wY+Math.sin(x*0.012+t*wSpeed+w)*wAmp+Math.sin(x*0.02+t*(wSpeed*0.7))*wAmp*0.4;
      ctx.lineTo(x,wy);
    }
    ctx.lineTo(canvas.width,canvas.height); ctx.lineTo(0,canvas.height); ctx.closePath(); ctx.fill();
  }

  // Moon reflection on water
  const refGrad=ctx.createLinearGradient(moonX-20,waterY,moonX+20,canvas.height);
  refGrad.addColorStop(0,'rgba(255,240,150,0.15)');
  refGrad.addColorStop(1,'rgba(255,240,150,0)');
  ctx.fillStyle=refGrad;
  ctx.fillRect(moonX-15,waterY,30,canvas.height-waterY);

  // Animated fish swimming in background
  const fishTypes=['mackerel','tuna','salmon','trout','bass'];
  for(let i=0;i<6;i++){
    const speed=18+i*6;
    const dir=i%2===0?1:-1;
    const fx=((t*speed*dir+i*canvas.width/5+canvas.width)%canvas.width);
    const fy=waterY+30+i*28+Math.sin(t*0.4+i)*12;
    ctx.save();
    ctx.translate(fx,fy);
    if(dir<0) ctx.scale(-1,1);
    ctx.globalAlpha=0.18+i*0.03;
    drawFishIcon(fishTypes[i%fishTypes.length],0,0,10,'#4fc3f7');
    ctx.globalAlpha=1;
    ctx.restore();
  }

  // Floating bubbles
  for(let i=0;i<12;i++){
    const bx=((i*173+t*8)%canvas.width);
    const by=canvas.height-(((t*15+i*80)%(canvas.height*0.5)));
    const br=1.5+Math.sin(t+i)*0.5;
    ctx.strokeStyle=`rgba(79,195,247,${0.15+Math.sin(t*0.5+i)*0.08})`;
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.stroke();
  }

  // Title with glow pulse
  const pulse=0.8+0.2*Math.sin(t*1.2);
  ctx.save();
  ctx.shadowColor='#4fc3f7'; ctx.shadowBlur=20*pulse;
  ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(56+Math.sin(t*0.5)*2)}px sans-serif`; ctx.textAlign='center';
  ctx.fillText('FISHING', cx, cy-100);
  ctx.fillStyle='#4fc3f7'; ctx.shadowBlur=30*pulse;
  ctx.fillText('GAME', cx, cy-38);
  ctx.shadowBlur=0;
  ctx.restore();

  // Tagline
  ctx.fillStyle=`rgba(255,255,255,${0.3+0.1*Math.sin(t*0.8)})`; ctx.font='13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Explore · Fish · Collect · Discover', cx, cy-8);

  // Play button with animated border
  const hasSave=!!localStorage.getItem('fishgame_save_v1');
  const btnLabel=hasSave?'Continue':'Play';
  const bw=240, bh=52, bx=cx-bw/2, by=cy+20;
  const btnPulse=0.5+0.5*Math.abs(Math.sin(t*1.5));

  // Glow behind button
  ctx.shadowColor='#4fc3f7'; ctx.shadowBlur=20*btnPulse;
  ctx.fillStyle=`rgba(79,195,247,${0.12+0.08*btnPulse})`;
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,12); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle=`rgba(79,195,247,${0.4+0.4*btnPulse})`; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,12); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
  ctx.fillText(btnLabel, cx, by+bh/2+6);

  mainMenuBtns.length=0;
  mainMenuBtns.push({bx,by,bw,bh,action:'play'});

  // Hint
  ctx.fillStyle=`rgba(255,255,255,${0.2+0.1*Math.sin(t*2)})`; ctx.font='11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Press any key or click to start', cx, by+bh+22);

  // Version
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.font='10px sans-serif';
  ctx.fillText('v1.0', cx, canvas.height-10);
}

// ─── PAUSE MENU ───────────────────────────────────────────────────────────────
function drawPause(){
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=320, ph=340, px=cx-pw/2, py=cy-ph/2;
  ctx.fillStyle='rgba(6,10,6,0.98)';
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,16); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,16); ctx.stroke();
  ctx.fillStyle='#e0e0e0'; ctx.font='bold 20px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Paused', cx, py+38);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(px+20,py+50); ctx.lineTo(px+pw-20,py+50); ctx.stroke();

  const btns=[
    {label:'Resume',      action:()=>{ state.paused=false; },                    col:'#4fc3f7'},
    {label:'Settings',    action:()=>{ state.paused=false; state.screen='settings'; }, col:'#aaa'},
    {label:'Save Game',   action:()=>{ saveGame(); notify('Saved!','uncommon'); }, col:'#80ff80'},
    {label:'Skill Tree',  action:()=>{ state.paused=false; state.screen='skills'; }, col:'#c080ff'},
    {label:'Quit to Menu',action:()=>{ state.paused=false; state.mainMenu=true; setBGMusic('menu_music',0.4); }, col:'#f44336'},
  ];
  btns.forEach((btn,i)=>{
    const bx=px+30, by=py+66+i*50, bw=pw-60, bh=36;
    ctx.fillStyle='rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.stroke();
    ctx.fillStyle=btn.col; ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
    ctx.fillText(btn.label, cx, by+bh/2+5);
    // Store for click
    btn.bx=bx; btn.by=by; btn.bw=bw; btn.bh=bh;
  });
  ctx.fillStyle='#333'; ctx.font='11px sans-serif'; ctx.textAlign='center';
  ctx.fillText('[Esc] Resume', cx, py+ph-14);
  // Store btns for click
  drawPause._btns=btns;
}

// ─── SKILL INFO PANEL ─────────────────────────────────────────────────────────
function drawSkillInfo(){
  const skill=state.skillInfo; if(!skill) return;
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=300, ph=220, px=cx-pw/2, py=cy-ph/2;
  const catColors={luck:'#ffd54f',skill:'#4fc3f7',extra:'#c080ff'};
  const col=catColors[skill.cat]||'#fff';

  ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(6,10,6,0.98)';
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,14); ctx.fill();
  ctx.strokeStyle=col+'66'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,14); ctx.stroke();

  // X close
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.arc(px+pw-18,py+18,12,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(px+pw-24,py+12); ctx.lineTo(px+pw-12,py+24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px+pw-12,py+12); ctx.lineTo(px+pw-24,py+24); ctx.stroke();

  ctx.fillStyle=col; ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
  ctx.fillText(skill.name, cx, py+36);
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='10px sans-serif';
  ctx.fillText(skill.cat.toUpperCase()+' SKILL  •  '+skill.cost+' pts', cx, py+52);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(px+20,py+60); ctx.lineTo(px+pw-20,py+60); ctx.stroke();

  ctx.fillStyle='#ccc'; ctx.font='12px sans-serif'; ctx.textAlign='center';
  ctx.fillText(skill.desc, cx, py+80);

  // Effect details
  const effs=Object.entries(skill.effect);
  effs.forEach(([k,v],i)=>{
    ctx.fillStyle='#888'; ctx.font='10px sans-serif';
    ctx.fillText(k+': '+v, cx, py+100+i*16);
  });

  const unlocked=state.skills.has(skill.id);
  const parOk=!skill.requires||state.skills.has(skill.requires);

  // Unlock button
  if(!unlocked&&parOk){
    const can=state.skillPoints>=skill.cost;
    ctx.fillStyle=can?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(px+20,py+ph-80,pw-40,28,7); ctx.fill();
    ctx.fillStyle=can?'#4fc3f7':'#444'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(can?'Unlock ('+skill.cost+' pts)':'Need '+skill.cost+' pts', cx, py+ph-61);
  }

  // Refund button (only if unlocked)
  if(unlocked){
    ctx.fillStyle='rgba(244,67,54,0.15)';
    ctx.beginPath(); ctx.roundRect(px+20,py+ph-80,pw-40,28,7); ctx.fill();
    ctx.strokeStyle='rgba(244,67,54,0.4)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(px+20,py+ph-80,pw-40,28,7); ctx.stroke();
    ctx.fillStyle='#f44336'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Refund (+'+skill.cost+' pts)', cx, py+ph-61);
  }

  ctx.fillStyle='#333'; ctx.font='10px sans-serif'; ctx.textAlign='center';
  ctx.fillText('[Esc] Back', cx, py+ph-14);
  drawSkillInfo._px=px; drawSkillInfo._py=py; drawSkillInfo._pw=pw; drawSkillInfo._ph=ph;
}

window.onload=()=>{
  loadGame();
  state.mainMenu=true;
  // Music starts on first user interaction (browser policy)
  requestAnimationFrame(loop);
};

// ─── FISH COLLECTION ─────────────────────────────────────────────────────────
// Fish clipart — draws a simple but distinct fish shape based on fish id
function drawFishIcon(fishId, x, y, size, color){
  ctx.save();
  ctx.translate(x, y);
  // Different shapes per fish type
  const shapes = {
    // Round fish
    minnow:    {body:[1,0.5], tail:0.4, fins:false, color:'#88aacc'},
    bluegill:  {body:[1,0.65],tail:0.45,fins:true,  color:'#4488bb'},
    catfish:   {body:[1.2,0.5],tail:0.5,fins:true,  color:'#886644', whiskers:true},
    g_carp:    {body:[1.1,0.6],tail:0.5,fins:true,  color:'#ddaa22'},
    koi:       {body:[1.1,0.6],tail:0.6,fins:true,  color:'#ff6622'},
    ghost_koi: {body:[1.1,0.6],tail:0.6,fins:true,  color:'#aaccff'},
    trout:     {body:[1.3,0.5],tail:0.5,fins:true,  color:'#668844'},
    bass:      {body:[1.1,0.6],tail:0.45,fins:true, color:'#557755'},
    salmon:    {body:[1.3,0.5],tail:0.55,fins:true, color:'#dd7755'},
    pike:      {body:[1.6,0.4],tail:0.4,fins:false, color:'#667744'},
    sturgeon:  {body:[1.8,0.4],tail:0.35,fins:false,color:'#445566'},
    r_dragon:  {body:[1.5,0.5],tail:0.7,fins:true,  color:'#aa2222'},
    mackerel:  {body:[1.3,0.45],tail:0.5,fins:true, color:'#4477aa'},
    tuna:      {body:[1.2,0.6],tail:0.55,fins:true, color:'#336699'},
    clownfish: {body:[0.9,0.65],tail:0.5,fins:true, color:'#ff6600'},
    swordfish: {body:[1.8,0.4],tail:0.4,fins:false, color:'#336688', sword:true},
    octopus:   {body:[0.8,0.8],tail:0,  fins:false, color:'#884488', tentacles:true},
    shark:     {body:[1.6,0.5],tail:0.5,fins:true,  color:'#667788'},
    whale:     {body:[1.8,0.7],tail:0.6,fins:true,  color:'#334466'},
    angler:    {body:[1.0,0.7],tail:0.4,fins:true,  color:'#334422', lure:true},
    viper:     {body:[1.6,0.35],tail:0.4,fins:false,color:'#223322'},
    ghost:     {body:[1.0,0.6],tail:0.5,fins:true,  color:'#aabbcc'},
    squid:     {body:[0.7,0.9],tail:0,  fins:false, color:'#553366', tentacles:true},
    serpent:   {body:[2.0,0.35],tail:0.3,fins:false,color:'#224422'},
    leviathan: {body:[2.0,0.6],tail:0.6,fins:true,  color:'#111122'},
    col_squid: {body:[1.0,1.0],tail:0,  fins:false, color:'#220033', tentacles:true},
    ice_min:   {body:[1.0,0.5],tail:0.4,fins:false, color:'#aaddff'},
    frost_t:   {body:[1.3,0.5],tail:0.5,fins:true,  color:'#88ccee'},
    crystal:   {body:[1.0,0.6],tail:0.5,fins:true,  color:'#ccffff'},
    snow_crab: {body:[0.8,0.6],tail:0,  fins:false, color:'#ddccaa', crab:true},
    ice_drag:  {body:[1.5,0.6],tail:0.7,fins:true,  color:'#88ccff'},
    mudfish:   {body:[1.1,0.5],tail:0.4,fins:false, color:'#887755'},
    swamp_eel: {body:[2.0,0.3],tail:0.3,fins:false, color:'#446633'},
    giant_frog:{body:[0.8,0.8],tail:0,  fins:false, color:'#558833', frog:true},
    swamp_dragon:{body:[1.5,0.55],tail:0.65,fins:true,color:'#335522'},
    ancient_turtle:{body:[0.9,0.8],tail:0.2,fins:false,color:'#667744',shell:true},
    parrotfish:{body:[1.0,0.65],tail:0.5,fins:true, color:'#44aacc'},
    lionfish:  {body:[1.0,0.6],tail:0.5,fins:true,  color:'#cc4422', spines:true},
    seahorse:  {body:[0.5,1.0],tail:0.3,fins:false, color:'#ddaa44', upright:true},
    reef_shark:{body:[1.5,0.5],tail:0.5,fins:true,  color:'#557799'},
    coral_queen:{body:[1.1,0.65],tail:0.55,fins:true,color:'#ff44aa'},
  };
  const s = shapes[fishId] || {body:[1,0.55],tail:0.45,fins:true,color:'#4488aa'};
  const fc = color || s.color;
  const w = size * s.body[0], h = size * s.body[1];

  if(s.tentacles){
    // Octopus/squid body
    ctx.fillStyle=fc;
    ctx.beginPath(); ctx.ellipse(0,0,w*0.5,h*0.5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=fc+'aa';
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2, tx=Math.cos(a)*w*0.4, ty=Math.sin(a)*h*0.4+h*0.3;
      ctx.beginPath(); ctx.ellipse(tx,ty,w*0.08,h*0.25,a,0,Math.PI*2); ctx.fill();
    }
  } else if(s.upright){
    // Seahorse
    ctx.fillStyle=fc;
    ctx.beginPath(); ctx.ellipse(0,0,w*0.4,h*0.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,-h*0.5,w*0.25,h*0.3,0,0,Math.PI*2); ctx.fill();
  } else if(s.crab){
    // Crab
    ctx.fillStyle=fc;
    ctx.beginPath(); ctx.ellipse(0,0,w*0.5,h*0.4,0,0,Math.PI*2); ctx.fill();
    for(let i=0;i<4;i++){
      const side=i<2?-1:1, yoff=(i%2)*h*0.3-h*0.15;
      ctx.beginPath(); ctx.moveTo(side*w*0.4,yoff); ctx.lineTo(side*w*0.8,yoff-h*0.2); ctx.lineWidth=size*0.08; ctx.strokeStyle=fc; ctx.stroke();
    }
  } else if(s.frog){
    // Frog
    ctx.fillStyle=fc;
    ctx.beginPath(); ctx.ellipse(0,0,w*0.5,h*0.45,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-w*0.35,-h*0.3,w*0.2,h*0.2,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w*0.35,-h*0.3,w*0.2,h*0.2,0,0,Math.PI*2); ctx.fill();
  } else {
    // Standard fish body
    ctx.fillStyle=fc;
    ctx.beginPath();
    ctx.ellipse(0,0,w*0.5,h*0.5,0,0,Math.PI*2);
    ctx.fill();
    // Tail
    if(s.tail>0){
      ctx.beginPath();
      ctx.moveTo(-w*0.45,0);
      ctx.lineTo(-w*0.45-size*s.tail,-h*0.4);
      ctx.lineTo(-w*0.45-size*s.tail, h*0.4);
      ctx.closePath(); ctx.fill();
    }
    // Dorsal fin
    if(s.fins){
      ctx.fillStyle=fc+'cc';
      ctx.beginPath();
      ctx.moveTo(-w*0.1,-h*0.5);
      ctx.lineTo(w*0.2,-h*0.8);
      ctx.lineTo(w*0.35,-h*0.5);
      ctx.closePath(); ctx.fill();
    }
    // Sword
    if(s.sword){
      ctx.strokeStyle=fc; ctx.lineWidth=size*0.06; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(w*0.5,0); ctx.lineTo(w*1.1,0); ctx.stroke();
    }
    // Lure
    if(s.lure){
      ctx.strokeStyle='#ffff44'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(w*0.3,-h*0.5); ctx.lineTo(w*0.5,-h*1.0); ctx.stroke();
      ctx.fillStyle='#ffff44'; ctx.beginPath(); ctx.arc(w*0.5,-h*1.0,size*0.08,0,Math.PI*2); ctx.fill();
    }
    // Whiskers
    if(s.whiskers){
      ctx.strokeStyle=fc+'88'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(w*0.4,-h*0.1); ctx.lineTo(w*0.8,-h*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w*0.4, h*0.1); ctx.lineTo(w*0.8, h*0.3); ctx.stroke();
    }
    // Spines
    if(s.spines){
      ctx.strokeStyle=fc; ctx.lineWidth=size*0.05;
      for(let i=0;i<5;i++){
        const sx=-w*0.2+i*w*0.15;
        ctx.beginPath(); ctx.moveTo(sx,-h*0.5); ctx.lineTo(sx,-h*0.9); ctx.stroke();
      }
    }
    // Shell
    if(s.shell){
      ctx.strokeStyle=fc+'88'; ctx.lineWidth=size*0.08;
      ctx.beginPath(); ctx.ellipse(0,0,w*0.45,h*0.45,0,0,Math.PI*2); ctx.stroke();
    }
  }
  // Eye
  if(!s.tentacles&&!s.crab&&!s.frog){
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(w*0.25,-h*0.1,size*0.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(w*0.27,-h*0.1,size*0.06,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawCollection(){
  overlay();
  const cx=canvas.width/2, cy=canvas.height/2;
  const pw=Math.min(900,canvas.width-40), ph=Math.min(600,canvas.height-40);
  const px=cx-pw/2, py=cy-ph/2;
  panel(px,py,pw,ph,'Fish Collection','rgba(20,60,80,0.3)');

  // Biome tabs
  const biomeKeys=Object.keys(BIOMES);
  if(!state._colTab) state._colTab=biomeKeys[0];
  const tabW=Math.floor((pw-24)/biomeKeys.length);
  biomeKeys.forEach((bid,i)=>{
    const tx=px+12+i*tabW, ty=py+44, tw=tabW-4, th=22;
    const active=state._colTab===bid;
    ctx.fillStyle=active?'rgba(79,195,247,0.2)':'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,5); ctx.fill();
    ctx.strokeStyle=active?'#4fc3f7':'rgba(255,255,255,0.08)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,5); ctx.stroke();
    ctx.fillStyle=active?'#4fc3f7':'#666'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(BIOMES[bid].name, tx+tw/2, ty+15);
  });

  const biome=BIOMES[state._colTab];
  const fish=biome.fish;
  const cols=4, cW=Math.floor((pw-32)/cols), cH=90, gap=6;
  const gx=px+12, gy=py+74;

  // Summary
  const caught=fish.filter(f=>state.caughtIds.has(f.id)).length;
  ctx.fillStyle='#888'; ctx.font='11px sans-serif'; ctx.textAlign='right';
  ctx.fillText(caught+'/'+fish.length+' caught', px+pw-16, py+42);

  fish.forEach((f,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const rx=gx+col*(cW+gap), ry=gy+row*(cH+gap);
    const known=state.caughtIds.has(f.id);
    const rc=RARITY_COLORS[f.rarity];

    // Card bg
    ctx.fillStyle=known?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,8); ctx.fill();
    ctx.strokeStyle=known?rc+'66':'rgba(255,255,255,0.05)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(rx,ry,cW,cH,8); ctx.stroke();

    if(known){
      // Rarity color bar on left
      ctx.fillStyle=rc;
      ctx.beginPath(); ctx.roundRect(rx,ry,4,cH,{upperLeft:8,lowerLeft:8,upperRight:0,lowerRight:0}); ctx.fill();

      // Fish clipart
      drawFishIcon(f.id, rx+cW-28, ry+cH/2, 14, rc);

      // Fish name
      ctx.fillStyle='#e0e0e0'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
      ctx.fillText(f.name, rx+12, ry+18);

      // Rarity badge
      ctx.fillStyle=rc+'33';
      ctx.beginPath(); ctx.roundRect(rx+12,ry+24,cW-20,14,4); ctx.fill();
      ctx.fillStyle=rc; ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
      ctx.fillText(f.rarity.toUpperCase(), rx+12+(cW-20)/2, ry+34);

      // Value
      ctx.fillStyle='#ffd54f'; ctx.font='10px sans-serif'; ctx.textAlign='left';
      ctx.fillText('$'+f.val, rx+12, ry+52);

      // EXP
      ctx.fillStyle='#4fc3f7'; ctx.font='10px sans-serif';
      ctx.fillText(f.exp+' exp', rx+12, ry+66);

      // Check mark
      ctx.fillStyle='#4caf50'; ctx.font='bold 14px sans-serif'; ctx.textAlign='right';
      ctx.fillText('\u2713', rx+cW-8, ry+18);
    } else {
      // Unknown — silhouette
      ctx.fillStyle='rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.roundRect(rx+8,ry+10,cW-16,14,3); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.roundRect(rx+8,ry+30,cW-24,10,3); ctx.fill();
      ctx.beginPath(); ctx.roundRect(rx+8,ry+46,cW-32,10,3); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
      ctx.fillText('?', rx+cW/2, ry+cH/2+7);
    }
  });
}
