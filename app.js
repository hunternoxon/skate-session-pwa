// Brainlock v0.5.5 – Fix Game Options, border, remove mock scores, keep Admin Mode
const VERSION="0.5.5";

const DEFAULTS = {
  level:6,
  categories:{flips:true,grinds:true,manuals:true,airs:true,spins:true},
  stances:{regular:true,switch:true,nollie:true,fakie:true},
  flips:{"kickflip":true,"heelflip":true,"varial kickflip":true,"hardflip":true,"tre flip":true,"360 flip":true,"laser flip":true,"inward heelflip":true,"bigspin flip":true},
  grinds:{"50-50":true,"5-0":true,"boardslide":true,"noseslide":true,"tailslide":true,"lipslide":true,"smith":true,"feeble":true,"crooked":true,"nosegrind":true,"noseblunt":true,"bluntslide":true},
  spins:{"180":true,"360":true,"540":true,"720":false},
  obstacles:["flat","ledge","rail","handrail","flatbar","hubba","kicker","gap","bank","quarterpipe"]
};
const LEVEL_DESC = {1:"Beginner",2:"Basic",3:"Park flow",4:"Consistent am",5:"Local ripper",6:"Advanced am",7:"Sponsored",8:"Pro",9:"Top pro",10:"Ender-only"};
function loadState(){ try{return JSON.parse(localStorage.getItem('bl_state'))||DEFAULTS}catch{return DEFAULTS} }
function saveState(s){ localStorage.setItem('bl_state', JSON.stringify(s)) }
let STATE = loadState();

function getScores(){ try{return JSON.parse(localStorage.getItem('bl_scores')||"[]")}catch{return[]} }
function setScores(a){ localStorage.setItem('bl_scores', JSON.stringify(a)) }
function bestScore(){ const s=getScores(); return s.length? Math.max(...s.map(x=>x.value)) : 0; }

function isAdmin(){ return localStorage.getItem('bl_admin')==="1" }
function setAdmin(on){ localStorage.setItem('bl_admin', on?"1":"0") }

const els = {
  title:document.getElementById('titleText'),
  settingsBtn:document.getElementById('settingsBtn'),
  levelPill:document.getElementById('levelPill'),
  levelVal:document.getElementById('levelVal'),
  levelDesc:document.getElementById('levelDesc'),
  editLevel:document.getElementById('editLevel'),
  gameOpts:document.getElementById('gameOpts'),
  goToggle:document.getElementById('goToggle'),
  goBody:document.querySelector('.go-body'),
  obsSummary:document.getElementById('obsSummary'),
  stanceSummary:document.getElementById('stanceSummary'),
  trickSummary:document.getElementById('trickSummary'),
  letters:document.getElementById('letters'),
  scoreLine:document.getElementById('scoreLine'),
  openHigh:document.getElementById('openHigh'),
  openHigh2:document.getElementById('openHigh2'),
  startBtn:document.getElementById('startBtn'),
  viewSetup:document.getElementById('viewSetup'),
  viewGame:document.getElementById('viewGame'),
  viewOver:document.getElementById('viewOver'),
  attemptBadge:document.getElementById('attemptBadge'),
  openAttempt:document.getElementById('openAttempt'),
  trickText:document.getElementById('trickText'),
  skipBtn:document.getElementById('skipBtn'),
  missBtn:document.getElementById('missBtn'),
  landBtn:document.getElementById('landBtn'),
  nextBtn:document.getElementById('nextBtn'),
  endBtn:document.getElementById('endBtn'),
  finalScore:document.getElementById('finalScore'),
  restartBtn:document.getElementById('restartBtn'),
  overlay:document.getElementById('overlay'),
  modalTitle:document.getElementById('modalTitle'),
  modalBody:document.getElementById('modalBody'),
  modalClose:document.getElementById('modalClose'),
  confirm:document.getElementById('confirm'),
  confirmYes:document.getElementById('confirmYes'),
  confirmNo:document.getElementById('confirmNo'),
  settings:document.getElementById('settings'),
  settingsClose:document.getElementById('settingsClose'),
  nickInput:document.getElementById('nickInput'),
  adminToggle:document.getElementById('adminToggle'),
  clearCache:document.getElementById('clearCache'),
  editObs:document.getElementById('editObs'),
  editStance:document.getElementById('editStance'),
  editTricks:document.getElementById('editTricks'),
};

els.title.addEventListener('click', ()=>location.reload());

function renderLevel(){ els.levelVal.textContent=STATE.level; els.levelDesc.textContent=LEVEL_DESC[STATE.level]||""; }
function renderSummaries(){
  els.obsSummary.textContent = (STATE.obstacles||[]).join(", ")||"—";
  const st = Object.keys(STATE.stances).filter(k=>STATE.stances[k]);
  els.stanceSummary.textContent = st.join(", ")||"—";
  const cats = Object.entries(STATE.categories).filter(([k,v])=>v).map(([k])=>k).join("/");
  const f = Object.keys(STATE.flips).filter(k=>STATE.flips[k]).length;
  const g = Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]).length;
  const s = Object.keys(STATE.spins).filter(k=>STATE.spins[k]).length;
  els.trickSummary.textContent = (cats?cats:"—") + ` • F:${f} G:${g} S:${s}`;
  const high = bestScore();
  [els.openHigh, els.openHigh2].forEach(b=>{ if(b) b.textContent = `${high} pts`; });
}

function openOverlay(title, innerHTML){
  els.modalTitle.textContent=title;
  els.modalBody.innerHTML=innerHTML;
  els.overlay.classList.remove('hidden');
}
function closeOverlay(){ els.overlay.classList.add('hidden'); }
els.modalClose.addEventListener('click', closeOverlay);

function buildObsOverlay(){
  const all = ["flat","curb","ledge","rail","handrail","flatbar","hubba","manual pad","box","kicker","gap","bank","quarterpipe","stair","funbox"];
  const set = new Set(STATE.obstacles||[]);
  let html = '<div class="list">';
  for(const o of all){ html += `<label><input type="checkbox" data-o="${o}" ${set.has(o)?"checked":""}/> ${o}</label>`; }
  html += '</div>';
  return html;
}
function wireObsOverlay(){
  els.modalBody.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.onchange = ()=>{
      const o = cb.dataset.o;
      const set = new Set(STATE.obstacles||[]);
      if(cb.checked) set.add(o); else set.delete(o);
      STATE.obstacles = Array.from(set);
      saveState(STATE); renderSummaries();
    };
  });
}

function buildStanceOverlay(){
  let html = '<div class="list">';
  for(const k of ["regular","switch","nollie","fakie"]){ html += `<label><input type="checkbox" data-k="${k}" ${STATE.stances[k]?"checked":""}/> ${k}</label>`; }
  html += '</div>';
  return html;
}
function wireStanceOverlay(){
  els.modalBody.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.onchange=()=>{ const k=cb.dataset.k; STATE.stances[k]=cb.checked; saveState(STATE); renderSummaries(); };
  });
}

function buildTricksOverlay(){
  const cats = [["flips","Flips"],["grinds","Grinds/Slides"],["spins","Spins"],["manuals","Manuals"],["airs","Airs"]];
  let html = '<div class="list">';
  for(const [k,label] of cats){
    html += `<label><input type="checkbox" data-cat="${k}" ${STATE.categories[k]?"checked":""}/> ${label}</label>`;
    if(STATE.categories[k]){
      if(k==="flips"){
        html+='<div class="list sub">';
        for(const n of Object.keys(STATE.flips)){ html += `<label><input type="checkbox" data-flip="${n}" ${STATE.flips[n]?"checked":""}/> ${n}</label>`; }
        html+='</div>';
      }
      if(k==="grinds"){
        html+='<div class="list sub">';
        for(const n of Object.keys(STATE.grinds)){ html += `<label><input type="checkbox" data-grind="${n}" ${STATE.grinds[n]?"checked":""}/> ${n}</label>`; }
        html+='</div>';
      }
      if(k==="spins"){
        html+='<div class="list sub">';
        for(const n of Object.keys(STATE.spins)){ html += `<label><input type="checkbox" data-spin="${n}" ${STATE.spins[n]?"checked":""}/> ${n}</label>`; }
        html+='</div>';
      }
    }
  }
  html += '</div>';
  return html;
}
function wireTricksOverlay(){
  els.modalBody.querySelectorAll('input[data-cat]').forEach(cb=>{
    cb.onchange=()=>{
      const k=cb.dataset.cat;
      STATE.categories[k]=cb.checked;
      if(!cb.checked){
        if(k==="flips"){ for(const n of Object.keys(STATE.flips)) STATE.flips[n]=false; }
        if(k==="grinds"){ for(const n of Object.keys(STATE.grinds)) STATE.grinds[n]=false; }
        if(k==="spins"){ for(const n of Object.keys(STATE.spins)) STATE.spins[n]=false; }
      }
      saveState(STATE);
      openOverlay("Tricks", buildTricksOverlay()); wireTricksOverlay(); renderSummaries();
    };
  });
  els.modalBody.querySelectorAll('input[data-flip]').forEach(cb=>{
    cb.onchange=()=>{ STATE.flips[cb.dataset.flip]=cb.checked; saveState(STATE); renderSummaries(); };
  });
  els.modalBody.querySelectorAll('input[data-grind]').forEach(cb=>{
    cb.onchange=()=>{ STATE.grinds[cb.dataset.grind]=cb.checked; saveState(STATE); renderSummaries(); };
  });
  els.modalBody.querySelectorAll('input[data-spin]').forEach(cb=>{
    cb.onchange=()=>{ STATE.spins[cb.dataset.spin]=cb.checked; saveState(STATE); renderSummaries(); };
  });
}

document.getElementById('editObs').onclick = ()=>{ openOverlay("Obstacles", buildObsOverlay()); wireObsOverlay(); };
document.getElementById('editStance').onclick = ()=>{ openOverlay("Stances", buildStanceOverlay()); wireStanceOverlay(); };
document.getElementById('editTricks').onclick = ()=>{ openOverlay("Tricks", buildTricksOverlay()); wireTricksOverlay(); };

els.goToggle.addEventListener('click', ()=>{
  const was = els.goBody.classList.contains('hidden');
  els.goBody.classList.toggle('hidden');
  els.goToggle.textContent = was ? "▲" : "▼";
  els.goToggle.setAttribute('aria-expanded', String(was));
});

els.settingsBtn.addEventListener('click', ()=>{
  els.nickInput.value = localStorage.getItem('bl_nick')||"";
  els.adminToggle.checked = isAdmin();
  document.getElementById('settings').classList.remove('hidden');
});
document.getElementById('settingsClose').addEventListener('click', ()=>document.getElementById('settings').classList.add('hidden'));
els.nickInput.addEventListener('change', ()=>localStorage.setItem('bl_nick', els.nickInput.value.trim()));
els.adminToggle.addEventListener('change', ()=>setAdmin(els.adminToggle.checked));
document.getElementById('viewRules').addEventListener('click', ()=>{
  openOverlay("Game Rules", "<ul><li>Land tricks to score points.</li><li>3 attempts per trick with diminishing multipliers.</li><li>Five letters = SKATE → session ends.</li></ul>");
});

document.getElementById('clearCache').addEventListener('click', async ()=>{
  if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
  if('serviceWorker' in navigator){ const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); }
  location.reload();
});

els.editLevel.addEventListener('click', ()=>{
  let html = '<div class="list">';
  for(let i=1;i<=10;i++){ html += `<button class="list-item" data-l="${i}">${i} • ${LEVEL_DESC[i]}</button>`; }
  html += '</div>';
  openOverlay("Difficulty", html);
  els.modalBody.querySelectorAll('[data-l]').forEach(b=>{
    b.onclick=()=>{ STATE.level=parseInt(b.dataset.l,10); saveState(STATE); renderLevel(); closeOverlay(); };
  });
});

function renderHighScores(){
  const scores = getScores().sort((a,b)=>b.value-a.value).slice(0,10);
  let html = '<ol class="list">';
  for(const s of scores){
    const name = s.nickname || "—";
    const del = isAdmin() ? ` <button class="ghost small danger-outline" data-del="${s.id}">🗑️</button>` : "";
    html += `<li class="list-item">${name} — ${s.value} pts${del}</li>`;
  }
  html += scores.length? "" : "<div class='muted'>No scores yet. Land something!</div>";
  html += '</ol>';
  openOverlay("High Scores", html);
  if(isAdmin()){
    els.modalBody.querySelectorAll('[data-del]').forEach(btn=>{
      btn.onclick=()=>{
        if(!confirm("Remove this score?")) return;
        const id = btn.dataset.del;
        const next = getScores().filter(x=>x.id!==id);
        setScores(next);
        renderHighScores(); renderSummaries();
      };
    });
  }
}
document.getElementById('openHigh').addEventListener('click', renderHighScores);
document.getElementById('openHigh2').addEventListener('click', renderHighScores);

/* Trick + Scoring */
const RULES = {
  GRIND_OK:new Set(["rail","handrail","flatbar","ledge","hubba"]),
  SLIDE_OK:new Set(["ledge","hubba","rail","handrail","flatbar","curb","box"]),
  MANUAL_OK:new Set(["manual pad","box","funbox","kicker","bank"]),
  AIR_OK:new Set(["flat","gap","kicker","quarterpipe","bank","stair","funbox"]),
  DIRECTION_DEFAULTS: {"50-50":"frontside","5-0":"frontside","boardslide":"backside","noseslide":"backside","lipslide":"frontside","tailslide":"frontside","bluntslide":"backside","nosegrind":"frontside","crooked":"backside","smith":"backside","feeble":"backside","noseblunt":"frontside"}
};
const BASE = {
  stance:{regular:0, switch:0.3, nollie:0.2, fakie:0.1},
  spin:{180:0.2, 360:0.4, 540:0.6, 720:0.8},
  flip:{"kickflip":0.3,"heelflip":0.35,"varial kickflip":0.45,"hardflip":0.55,"tre flip":0.8,"360 flip":0.8,"laser flip":0.85,"inward heelflip":0.6,"bigspin flip":0.6},
  grind:{"50-50":0.3,"5-0":0.4,"boardslide":0.4,"noseslide":0.45,"tailslide":0.5,"lipslide":0.55,"smith":0.65,"feeble":0.65,"crooked":0.65,"nosegrind":0.7,"noseblunt":0.9,"bluntslide":0.85},
  manual:{"manual":0.25},
  obstacle:{"flat":0,"manual pad":0.1,"box":0.1,"curb":0.15,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"kicker":0.1,"stair":0.45,"quarterpipe":0.4,"bank":0.25,"funbox":0.2}
};
const BONUS = { flip_into_grind:0.25, spin_plus_flip:0.2, spin_into_grind:0.15, manual_combo:0.1 };
const ATTEMPT = {1:1.00,2:0.85,3:0.75};

let current=null, attempt=1, misses=0, total=0;
function tier(){ return Math.max(1, Math.min(10, STATE.level|0)); }
function stancePool(){ return Object.keys(STATE.stances).filter(k=>STATE.stances[k]); }
function allowedSpins(){ return Object.keys(STATE.spins).filter(k=>STATE.spins[k]).map(Number); }
function allowedFlips(){ return Object.keys(STATE.flips).filter(k=>STATE.flips[k]); }
function allowedGrinds(){ return Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]); }
function pickObstacle(){ const src=(STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:["flat"]); return src[Math.floor(Math.random()*src.length)] }
function isRail(o){ return ["rail","handrail","flatbar"].includes(o) }

function generateTrick(){
  const ob=pickObstacle();
  const parts={obstacle:ob};
  const pools={
    stance: stancePool(),
    spins: allowedSpins(),
    flips: allowedFlips(),
    grinds: allowedGrinds()
  };
  const canGrind = (STATE.categories.grinds && (RULES.GRIND_OK.has(ob) || RULES.SLIDE_OK.has(ob))) && pools.grinds.length;
  const canManual = (STATE.categories.manuals && RULES.MANUAL_OK.has(ob));
  const canAir = (STATE.categories.airs && (RULES.AIR_OK.has(ob)||isRail(ob)));
  const canFlip = (STATE.categories.flips && pools.flips.length);

  const patterns = [];
  if (canGrind) patterns.push("flipToGrind","grindOnly");
  if (canManual) patterns.push("manualOnly");
  if (canAir && canFlip) patterns.push("flipOnly");
  if (!patterns.length && canFlip) patterns.push("flipOnly");
  if (!patterns.length) patterns.push("manualOnly");

  const pat = patterns[Math.floor(Math.random()*patterns.length)];

  if (Math.random()<0.25){ const pool=pools.stance; if(pool.length){ const st=pool[Math.floor(Math.random()*pool.length)]; if(st!=="regular") parts.stance=st; } }
  if (STATE.categories.spins && pools.spins.length && Math.random()<0.2){ parts.spin = pools.spins[Math.floor(Math.random()*pools.spins.length)]; }

  if (pat==="flipOnly"){
    const f = pools.flips[Math.floor(Math.random()*pools.flips.length)];
    parts.flip=f;
  } else if (pat==="grindOnly"){
    const g = pools.grinds[Math.floor(Math.random()*pools.grinds.length)];
    parts.grind=g; parts.direction = RULES.DIRECTION_DEFAULTS[g]||"frontside";
  } else if (pat==="flipToGrind"){
    const g = pools.grinds[Math.floor(Math.random()*pools.grinds.length)];
    parts.grind=g; parts.direction = RULES.DIRECTION_DEFAULTS[g]||"frontside";
    const f = pools.flips[Math.floor(Math.random()*pools.flips.length)];
    parts.flip=f;
  } else if (pat==="manualOnly"){
    parts.manual="manual";
  }

  if (parts.grind){
    const isSlide = ["boardslide","noseslide","tailslide","lipslide","bluntslide"].includes(parts.grind);
    if (isSlide && !RULES.SLIDE_OK.has(ob)) parts.grind=null;
    if (!isSlide && !(RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))) parts.grind=null;
  }
  if (parts.flip && !parts.grind && !parts.manual){
    if (!(RULES.AIR_OK.has(ob)||isRail(ob))) parts.flip=null;
  }
  if (!parts.flip && !parts.grind && !parts.manual){
    parts.flip="kickflip"; parts.obstacle = RULES.AIR_OK.has(ob)?ob:"flat";
  }
  return parts;
}

function describe(c){
  const isRailObs=["rail","handrail","flatbar"].includes(c.obstacle);
  const parts=[];
  if (c.flip && !c.grind && !c.manual && isRailObs){ parts.push(c.flip,"over",c.obstacle); return parts.join(" "); }
  if (c.stance) parts.push(c.stance);
  if (c.spin) parts.push(String(c.spin));
  if (c.flip) parts.push(c.flip);
  if (c.direction && c.grind) parts.push(`${c.direction} ${c.grind}`); else if (c.grind) parts.push(c.grind);
  if (c.manual) parts.push(c.manual);
  if (c.obstacle) parts.push(`on ${c.obstacle}`);
  return parts.join(" ");
}

const BASEPTS = {
  stance:{regular:0, switch:0.3, nollie:0.2, fakie:0.1},
  spin:{180:0.2, 360:0.4, 540:0.6, 720:0.8},
  flip:{"kickflip":0.3,"heelflip":0.35,"varial kickflip":0.45,"hardflip":0.55,"tre flip":0.8,"360 flip":0.8,"laser flip":0.85,"inward heelflip":0.6,"bigspin flip":0.6},
  grind:{"50-50":0.3,"5-0":0.4,"boardslide":0.4,"noseslide":0.45,"tailslide":0.5,"lipslide":0.55,"smith":0.65,"feeble":0.65,"crooked":0.65,"nosegrind":0.7,"noseblunt":0.9,"bluntslide":0.85},
  manual:{"manual":0.25},
  obstacle:{"flat":0,"manual pad":0.1,"box":0.1,"curb":0.15,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"kicker":0.1,"stair":0.45,"quarterpipe":0.4,"bank":0.25,"funbox":0.2}
};
const BONUS = { flip_into_grind:0.25, spin_plus_flip:0.2, spin_into_grind:0.15, manual_combo:0.1 };
const ATTEMPT = {1:1.00,2:0.85,3:0.75};

function computeScore(c,att){
  let s=1.0, bd=[];
  const st=c.stance||"regular"; s+=BASEPTS.stance[st]||0; bd.push(["stance",st,BASEPTS.stance[st]||0]);
  if (c.spin){ s+=BASEPTS.spin[c.spin]||0; bd.push(["spin",c.spin,BASEPTS.spin[c.spin]||0]); }
  if (c.flip){ s+=BASEPTS.flip[c.flip]||0; bd.push(["flip",c.flip,BASEPTS.flip[c.flip]||0]); }
  if (c.grind){ s+=BASEPTS.grind[c.grind]||0; bd.push(["grind",c.grind,BASEPTS.grind[c.grind]||0]); }
  if (c.manual){ s+=BASEPTS.manual[c.manual]||0; bd.push(["manual",c.manual,BASEPTS.manual[c.manual]||0]); }
  if (c.obstacle){ s+=BASEPTS.obstacle[c.obstacle]||0; bd.push(["obstacle",c.obstacle,BASEPTS.obstacle[c.obstacle]||0]); }
  let bonus=0;
  if (c.flip && c.grind) bonus+=BONUS.flip_into_grind;
  if (c.flip && c.spin) bonus+=BONUS.spin_plus_flip;
  if (c.spin && c.grind) bonus+=BONUS.spin_into_grind;
  if (c.manual && (c.flip||c.spin)) bonus+=BONUS.manual_combo;
  const base=Math.max(0.1,s)*(1+bonus);
  const mult=ATTEMPT[att]||1;
  return {final: +(base*mult).toFixed(2), breakdown:bd, bonus, mult, base:+base.toFixed(2)};
}

function setView(v){
  els.viewSetup.classList.toggle('hidden', v!=="setup"); els.viewSetup.classList.toggle('active', v==="setup");
  els.viewGame.classList.toggle('hidden', v!=="game"); els.viewGame.classList.toggle('active', v==="game");
  els.viewOver.classList.toggle('hidden', v!=="over"); els.viewOver.classList.toggle('active', v==="over");
  if (v==="setup"){ document.getElementById('scoreLine').innerHTML = 'High Score: <button id="openHigh" class="link small">'+bestScore()+' pts</button>'; document.getElementById('openHigh').onclick=renderHighScores; }
  if (v==="game"){ document.getElementById('scoreLine').textContent = 'Total Score: '+total+' pts'; }
}
function updateLetters(){
  const spans=[...els.letters.children];
  spans.forEach((s,i)=>{ s.classList.toggle('lost', i < misses); });
}
function startSession(){
  misses=0; total=0; attempt=1; updateLetters();
  setView("game"); nextTrick(true);
}
els.startBtn.addEventListener('click', startSession);

function nextTrick(first=false){
  attempt=1;
  current=generateTrick();
  const text=describe(current)||"kickflip on flat";
  els.trickText.textContent=text;
  updateAttemptUI();
  els.nextBtn.classList.add('hidden');
  els.skipBtn.disabled=false; els.missBtn.disabled=false; els.landBtn.disabled=false;
  document.getElementById('scoreLine').textContent = 'Total Score: '+total+' pts';
}
function updateAttemptUI(){
  els.attemptBadge.textContent = `Attempt ${attempt}/3`;
  const rep=computeScore(current,attempt);
  els.openAttempt.textContent = `This attempt: ${rep.final} pts`;
}
els.openAttempt.addEventListener('click', ()=>{
  const rep=computeScore(current,attempt);
  let lines = `Base: ${rep.base} \nCombo x${(1+rep.bonus).toFixed(2)} \nAttempt x${rep.mult} => Final: ${rep.final} pts \n\nBreakdown:\n`;
  for(const [k,n,p] of rep.breakdown){ lines += ` + ${k}: ${n} = ${p}\n`; }
  openOverlay("Attempt Score Breakdown", `<pre>${lines}</pre>`);
});

function settle(hit){
  if (hit){
    const rep=computeScore(current,attempt);
    total = +(total + rep.final).toFixed(2);
    document.getElementById('scoreLine').textContent = 'Total Score: '+total+' pts';
    els.nextBtn.classList.remove('hidden');
    els.skipBtn.disabled=true; els.missBtn.disabled=true; els.landBtn.disabled=true;
  } else {
    if (attempt<3){ attempt++; updateAttemptUI(); }
    else {
      misses++; updateLetters();
      if (misses>=5){ endSession(); return; }
      els.nextBtn.classList.remove('hidden');
      els.skipBtn.disabled=true; els.missBtn.disabled=true; els.landBtn.disabled=true;
    }
  }
}
els.landBtn.addEventListener('click', ()=>settle(true));
els.missBtn.addEventListener('click', ()=>settle(false));
els.skipBtn.addEventListener('click', ()=>{ els.nextBtn.classList.add('hidden'); nextTrick(false); });
els.nextBtn.addEventListener('click', ()=> nextTrick(false));

function endSession(){
  document.getElementById('finalScore').textContent = total+' pts';
  const arr = getScores();
  const nick = (localStorage.getItem('bl_nick')||"").trim();
  arr.push({ id: String(Date.now()), value: total, nickname: nick, created_at: Date.now() });
  setScores(arr.sort((a,b)=>b.value-a.value).slice(0,100));
  renderSummaries();
  setView("over");
}
els.endBtn.addEventListener('click', ()=>{
  if (total<=0){ setView("setup"); return; }
  document.getElementById('confirm').classList.remove('hidden');
});
els.confirmNo.addEventListener('click', ()=>document.getElementById('confirm').classList.add('hidden'));
els.confirmYes.addEventListener('click', ()=>{ document.getElementById('confirm').classList.add('hidden'); endSession(); });

els.restartBtn.addEventListener('click', ()=>setView("setup"));

renderLevel(); renderSummaries(); setView("setup"); updateLetters();

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js')); }
console.log("Brainlock loaded", VERSION);
