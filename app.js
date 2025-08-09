// Skate Session — v0.3.1 (bugfix: startup order, chips render, lazy allowed)
// + cache-buster + clear-cache tool for quicker iteration
const VERSION = "0.3.1";

// --- Toggles (load first so generator can see them)
const DEFAULT_TOGGLES = {
  flips: {"kickflip":true,"heelflip":true,"varial kickflip":true,"varial heelflip":true,"hardflip":true,"inward heelflip":true,"bigspin flip":true,"bigspin heelflip":true,"tre flip":true,"360 flip":true,"laser flip":true},
  grinds: {"50-50":true,"5-0":true,"boardslide":true,"noseslide":true,"tailslide":true,"lipslide":true,"smith":true,"feeble":true,"willy":true,"salad":true,"crooked":true,"overcrook":true,"nosegrind":true,"noseblunt":true,"bluntslide":true},
  spins: {"180":true,"360":true,"540":true,"720":true}
};
function loadToggles(){ try{ return JSON.parse(localStorage.getItem('ss_toggles'))||DEFAULT_TOGGLES; }catch{ return DEFAULT_TOGGLES; } }
function saveToggles(t){ localStorage.setItem('ss_toggles', JSON.stringify(t)); }
let TOGGLES = loadToggles();
function enabledFlip(n){ return !!TOGGLES.flips[n]; }
function enabledGrind(n){ return !!TOGGLES.grinds[n]; }
function enabledSpin(d){ return !!TOGGLES.spins[String(d)]; }

// --- Obstacles (chips) declared early to avoid undefined on load
const ALL_OBS = ["flat","curb","ledge","flatbar","handrail","rail","hubba","kicker","gap","stair","quarterpipe","bank","mini ramp","funbox","manual pad","box"];
let selectedObs = ["flat","ledge","rail","manual pad","quarterpipe","bank","kicker"];

// --- Core rules/scoring
const RULES = {
  DIRECTION_DEFAULTS: {
    "50-50":"frontside","5-0":"frontside","boardslide":"backside","noseslide":"backside",
    "lipslide":"frontside","tailslide":"frontside","bluntslide":"backside","nosegrind":"frontside",
    "crooked":"backside","willy":"backside","feeble":"backside","smith":"backside","salad":"backside",
    "overcrook":"backside","noseblunt":"frontside"
  },
  STANCES:["regular","switch","nollie","fakie"],
  DIRECTIONS:["frontside","backside"],
  SPINS:[180,360,540,720],
  FLIPS:["kickflip","heelflip","hardflip","inward heelflip","varial kickflip","varial heelflip","tre flip","360 flip","laser flip","bigspin flip","bigspin heelflip"],
  GRINDS_SLIDES:["50-50","5-0","boardslide","noseslide","tailslide","lipslide","smith","feeble","willy","salad","crooked","overcrook","nosegrind","noseblunt","bluntslide"],
  MANUALS:["manual","nose manual","one wheel manual"],
  OBSTACLES: ALL_OBS,
  GRIND_OK:new Set(["rail","handrail","flatbar","ledge","hubba"]),
  SLIDE_OK:new Set(["ledge","hubba","rail","handrail","flatbar","curb","box"]),
  MANUAL_OK:new Set(["manual pad","box","funbox","kicker","bank"]), // no 'flat'
  AIR_OK:new Set(["flat","gap","kicker","quarterpipe","bank","stair","funbox"]),
};
const BASE_POINTS = {
  stance:{regular:0, fakie:0.1, nollie:0.2, switch:0.3},
  spin:{180:0.2, 360:0.4, 540:0.6, 720:0.8},
  flip:{
    "kickflip":0.3,"heelflip":0.35,"hardflip":0.55,"inward heelflip":0.6,"varial kickflip":0.45,"varial heelflip":0.5,
    "tre flip":0.8,"360 flip":0.8,"laser flip":0.85,"bigspin flip":0.6,"bigspin heelflip":0.65
  },
  grind_slide:{
    "50-50":0.3,"5-0":0.4,"boardslide":0.4,"noseslide":0.45,"tailslide":0.5,"lipslide":0.55,"smith":0.65,"feeble":0.65,"willy":0.55,"salad":0.6,
    "crooked":0.65,"overcrook":0.75,"nosegrind":0.7,"noseblunt":0.9,"bluntslide":0.85
  },
  obstacle:{
    "flat":0,"manual pad":0.1,"box":0.1,"curb":0.15,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"kicker":0.1,"stair":0.45,
    "quarterpipe":0.4,"bank":0.25,"funbox":0.2,"mini ramp":0.3
  },
  manual:{"manual":0.25,"nose manual":0.35,"one wheel manual":0.6}
};
const COMBO_BONUSES = { spin_plus_flip:0.2, flip_into_grind:0.25, spin_into_grind:0.15, manual_combo:0.15 };

function isValidCombo(c){
  const g = c.grind_slide, m = c.manual, ob = c.obstacle, fl = c.flip;
  if (g){
    const isSlide = ["boardslide","lipslide","tailslide","noseslide","bluntslide"].includes(g);
    if (!ob) return false;
    if (isSlide && !RULES.SLIDE_OK.has(ob)) return false;
    if (!isSlide && !(RULES.GRIND_OK.has(ob) || RULES.SLIDE_OK.has(ob))) return false;
  }
  if (m){
    if (ob && !RULES.MANUAL_OK.has(ob)) return false;
  }
  if (fl && !g && !m && ob){
    if (!RULES.AIR_OK.has(ob)) return false;
  }
  return true;
}
function baseScore(c){
  let s = 1.0, breakdown=[];
  const st = c.stance || "regular"; s += BASE_POINTS.stance[st]||0; breakdown.push(["stance",st,BASE_POINTS.stance[st]||0]);
  if (c.spin){ s += BASE_POINTS.spin[c.spin]||0; breakdown.push(["spin",c.spin,BASE_POINTS.spin[c.spin]||0]); }
  if (c.flip){ s += BASE_POINTS.flip[c.flip]||0; breakdown.push(["flip",c.flip,BASE_POINTS.flip[c.flip]||0]); }
  if (c.grind_slide){ s += BASE_POINTS.grind_slide[c.grind_slide]||0; breakdown.push(["grind_slide",c.grind_slide,BASE_POINTS.grind_slide[c.grind_slide]||0]); }
  if (c.manual){ s += BASE_POINTS.manual[c.manual]||0; breakdown.push(["manual",c.manual,BASE_POINTS.manual[c.manual]||0]); }
  if (c.obstacle){ s += BASE_POINTS.obstacle[c.obstacle]||0; breakdown.push(["obstacle",c.obstacle,BASE_POINTS.obstacle[c.obstacle]||0]); }
  let bonus=0;
  if (c.spin && c.flip) bonus+=COMBO_BONUSES.spin_plus_flip;
  if (c.flip && c.grind_slide) bonus+=COMBO_BONUSES.flip_into_grind;
  if (c.spin && c.grind_slide) bonus+=COMBO_BONUSES.spin_into_grind;
  if (c.manual && (c.flip || c.spin)) bonus+=COMBO_BONUSES.manual_combo;
  s *= (1+bonus);
  return {score: Math.max(s,0.1), breakdown, combo: 1+bonus};
}
function landMultiplier(attempt){ return {1:1.00,2:0.94,3:0.92}[attempt] || 0; }
function computeScore(c, attempt){
  if (!isValidCombo(c)) return {valid:false, base:0, combo:1, attempt:0, final:0, breakdown:[]};
  const {score, breakdown, combo} = baseScore(c);
  const mult = landMultiplier(attempt);
  return {valid:true, base:round(score,3), combo:round(combo,3), attempt:mult, final:round(score*mult,3), breakdown};
}
function round(x,n){ const k = Math.pow(10,n); return Math.round(x*k)/k; }

// Difficulty mapping
function tier(skill){ return Math.max(1, Math.min(10, skill|0)); }
const SCORE_CAP = {1:2.0,2:2.3,3:2.6,4:3.0,5:3.4,6:3.8,7:4.2,8:4.7,9:5.2,10:6.0};
function scoreCapFor(skill){ return SCORE_CAP[tier(skill)]; }
function allowFlip(name, s){
  const hi = ["tre flip","360 flip","laser flip","bigspin heelflip","hardflip","inward heelflip"];
  const mid = ["varial kickflip","varial heelflip","bigspin flip"];
  if (s<=2) return !hi.includes(name) && !mid.includes(name);
  if (s<=4) return !hi.includes(name);
  if (s===5) return !["laser flip"].includes(name);
  if (s<=7) return true;
  if (s===8) return true;
  if (s===9) return !["kickflip","heelflip"].includes(name);
  return true;
}
function allowGrindSlide(name, s){
  const high = ["overcrook","noseblunt","bluntslide"];
  if (s<=2) return !high.includes(name) && !["smith","feeble","overcrook"].includes(name);
  if (s<=4) return !high.includes(name) || (name==="overcrook");
  if (s===5) return true;
  if (s<=7) return true;
  if (s===8) return true;
  if (s===9) return high.includes(name) || ["crooked","nosegrind","5-0"].includes(name);
  return true;
}
function allowSpin(spin, s){
  if (s<=2) return spin<=180;
  if (s<=4) return spin<=360;
  if (s===5) return spin<=540;
  if (s<=7) return spin<=540;
  if (s===8) return spin<=720;
  return true;
}
function underScoreCap(components){ const rep = computeScore(components,1); return rep.base <= scoreCapFor(currentSkill||6); }

// Generator (Patch 01 refined + bugfix order)
const HISTORY_WINDOW = 7, DUPLICATE_THRESHOLD = 0.82;
let _recent = [];
function pushRecent(c){ _recent.unshift(c); if (_recent.length>HISTORY_WINDOW) _recent.pop(); }
function similarity(a,b){ const keys=["stance","spin","flip","grind_slide","direction","manual","obstacle"]; let same=0; for(const k of keys){ if((!a[k]&&!b[k])||(a[k]&&b[k]&&String(a[k])===String(b[k]))) same++; } return same/keys.length; }
function notTooSimilar(c){ for(const p of _recent){ if (similarity(c,p)>=DUPLICATE_THRESHOLD) return false; } return true; }
function weightedChoice(pairs){ const tot=pairs.reduce((s,[,w])=>s+w,0); let r=Math.random()*tot; for(const [it,w] of pairs){ if((r-=w)<=0) return it; } return pairs[pairs.length-1][0]; }

function generateTrick(skill, allowed){
  const s = tier(skill);
  const ob = (allowed && allowed.length) ? allowed[Math.floor(Math.random()*allowed.length)] : RULES.OBSTACLES[Math.floor(Math.random()*RULES.OBSTACLES.length)];
  const c = { stance:null, spin:null, spin_dir:null, flip:null, grind_slide:null, direction:null, manual:null, obstacle:ob, extras:[] };

  if (Math.random() < (0.12 + 0.04*s)){
    const stPairs = [["regular",1],["fakie", s>=2?1.1:0.6],["nollie", s>=3?1.3:0.5],["switch", s>=5?1.4:0.2]];
    const st = weightedChoice(stPairs); c.stance = (st==="regular"?null:st);
  }
  if (Math.random() < (0.16 + 0.05*s)){
    const spins = [180,360,540,720].filter(x=>enabledSpin(x) && allowSpin(x,s));
    if (spins.length){ c.spin = spins[Math.floor(Math.random()*spins.length)]; if (Math.random()<0.6) c.spin_dir = RULES.DIRECTIONS[Math.floor(Math.random()*2)]; }
  }
  if (Math.random() < (0.26 + 0.05*s)){
    let pool = RULES.FLIPS.filter(n=>enabledFlip(n) && allowFlip(n,s));
    if (pool.length){ c.flip = pool[Math.floor(Math.random()*pool.length)]; }
  }
  const canGrindish = RULES.GRIND_OK.has(ob) || RULES.SLIDE_OK.has(ob);
  const canManual   = RULES.MANUAL_OK.has(ob);
  const isAir       = RULES.AIR_OK.has(ob);

  if (canGrindish && Math.random()<(0.26+0.04*s)){
    const pool = RULES.GRINDS_SLIDES.filter(n=>enabledGrind(n) && allowGrindSlide(n,s));
    if (pool.length){ c.grind_slide = pool[Math.floor(Math.random()*pool.length)]; c.direction = RULES.DIRECTION_DEFAULTS[c.grind_slide] || "frontside"; }
  } else if (canManual && Math.random()<(0.20+0.03*s)){
    const pool = RULES.MANUALS;
    c.manual = pool[Math.floor(Math.random()*pool.length)];
  } else if (isAir && !c.flip && Math.random()<(0.40+0.05*s)){
    const pool = ["kickflip","heelflip","varial kickflip","varial heelflip","tre flip","360 flip"].filter(n=>enabledFlip(n) && allowFlip(n,s));
    if (pool.length){ c.flip = pool[Math.floor(Math.random()*pool.length)]; }
  }

  for (let i=0; i<8 && (!isValidCombo(c) || !underScoreCap(c) || !notTooSimilar(c)); i++){
    if (!isValidCombo(c)){
      if (c.grind_slide && !(RULES.GRIND_OK.has(c.obstacle)||RULES.SLIDE_OK.has(c.obstacle))){
        const opts = Array.from(new Set([...RULES.GRIND_OK, ...RULES.SLIDE_OK])); c.obstacle = opts[Math.floor(Math.random()*opts.length)];
      } else if (c.manual && !RULES.MANUAL_OK.has(c.obstacle)){
        c.obstacle = Array.from(RULES.MANUAL_OK)[Math.floor(Math.random()*RULES.MANUAL_OK.size)];
      } else if (c.flip && !c.grind_slide && !c.manual && !RULES.AIR_OK.has(c.obstacle)){
        c.obstacle = Array.from(RULES.AIR_OK)[Math.floor(Math.random()*RULES.AIR_OK.size)];
      } else {
        if (c.manual) { c.manual=null; }
        else if (c.grind_slide){ c.grind_slide=null; c.direction=null; }
        else if (c.flip){ c.flip=null; }
      }
    } else {
      if (!underScoreCap(c)){ if (c.spin && Math.random()<0.5) { c.spin=null; c.spin_dir=null; } else if (c.flip){ c.flip=null; } else if (c.grind_slide){ c.grind_slide=null; c.direction=null; } }
      if (!notTooSimilar(c)){ c.spin=null; c.spin_dir=null; if (Math.random()<0.5) c.flip=null; if (Math.random()<0.5){ c.grind_slide=null; c.direction=null; } }
    }
  }
  if (!c.spin) c.spin_dir = null;
  pushRecent(c);
  return c;
}

function describe(c){
  const parts=[];
  if (c.stance && c.stance!=="regular") parts.push(c.stance);
  if (c.spin){ parts.push(c.spin_dir? `${c.spin_dir} ${c.spin}`: `${c.spin}`); }
  if (c.flip) parts.push(c.flip);
  if (c.direction && c.grind_slide) parts.push(`${c.direction} ${c.grind_slide}`); else if (c.grind_slide) parts.push(c.grind_slide);
  if (c.manual) parts.push(c.manual);
  if (c.obstacle) parts.push(`on ${c.obstacle}`);
  return parts.join(" ");
}

// ---- App wiring (now after all helpers; lazy 'allowed' init) ----
const els = {
  skill: document.getElementById('skill'),
  skillVal: document.getElementById('skillVal'),
  startBtn: document.getElementById('startBtn'),
  gameCard: document.getElementById('gameCard'),
  setupCard: document.getElementById('setupCard'),
  overCard: document.getElementById('overCard'),
  trick: document.getElementById('trick'),
  letters: document.getElementById('letters'),
  landBtn: document.getElementById('landBtn'),
  missBtn: document.getElementById('missBtn'),
  nextBtn: document.getElementById('nextBtn'),
  endBtn: document.getElementById('endBtn'),
  attempt: document.getElementById('attempt'),
  score: document.getElementById('score'),
  finalScore: document.getElementById('finalScore'),
  bestScore: document.getElementById('bestScore'),
  restartBtn: document.getElementById('restartBtn'),
  breakdown: document.getElementById('breakdown'),
  breakText: document.getElementById('breakText'),
  feedbackBtn: document.getElementById('feedbackBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  settingsSave: document.getElementById('settingsSave'),
  settingsClose: document.getElementById('settingsClose'),
  moreBtn: document.getElementById('moreBtn'),
  obsChips: document.getElementById('obsChips'),
};
els.skill.addEventListener('input', e=> els.skillVal.textContent = e.target.value);

// Render obstacle chips (now that obsChips is defined)
function renderObsChips(){
  els.obsChips.innerHTML = ALL_OBS.map(o=>`<button data-o="${o}" class="${selectedObs.includes(o)?'active':''}">${o}</button>`).join('');
  els.obsChips.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{ const o=b.dataset.o; selectedObs = selectedObs.includes(o) ? selectedObs.filter(x=>x!==o) : selectedObs.concat([o]); renderObsChips(); };
  });
}
renderObsChips();

let misses=0, total=0, current=null, currentSkill=6, allowed=[], attempt=1;

function startSession(){
  currentSkill = parseInt(els.skill.value,10);
  allowed = selectedObs.slice();  // lazy init here (fixed)
  misses=0; total=0; attempt=1;
  els.score.textContent = total.toFixed(2);
  els.setupCard.classList.add('hidden');
  els.gameCard.classList.remove('hidden');
  updateLetters();
  nextTrick(true);
}
els.startBtn.addEventListener('click', startSession);

function nextTrick(first=false){
  attempt=1; els.attempt.textContent = attempt;
  current = generateTrick(currentSkill, allowed);
  els.trick.textContent = describe(current);
  els.breakdown.open = false;
  els.nextBtn.classList.add('hidden');
  els.landBtn.disabled = false; els.missBtn.disabled = false;
  if (!first) window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
}

function settle(landed){
  if (landed){
    const rep = computeScore(current, attempt);
    total += rep.final; els.score.textContent = total.toFixed(2);
    els.breakText.textContent = prettyScore(rep);
    els.breakdown.open = true;
    els.nextBtn.classList.remove('hidden');
    els.landBtn.disabled = true; els.missBtn.disabled = true;
  } else {
    if (attempt<3){ attempt++; els.attempt.textContent = attempt; }
    else {
      misses++; updateLetters();
      if (misses>=5){ endSession(); return; }
      els.nextBtn.classList.remove('hidden');
      els.landBtn.disabled = true; els.missBtn.disabled = true;
    }
  }
}
els.landBtn.addEventListener('click', ()=>settle(true));
els.missBtn.addEventListener('click', ()=>settle(false));
els.nextBtn.addEventListener('click', ()=>nextTrick(false));
els.endBtn.addEventListener('click', endSession);

function endSession(){
  els.gameCard.classList.add('hidden');
  els.overCard.classList.remove('hidden');
  els.finalScore.textContent = total.toFixed(2);
  const best = Math.max(total, parseFloat(localStorage.getItem('ss_best')||"0"));
  localStorage.setItem('ss_best', String(best));
  els.bestScore.textContent = best.toFixed(2);
}
els.restartBtn.addEventListener('click', ()=>{ els.overCard.classList.add('hidden'); els.setupCard.classList.remove('hidden'); });

function updateLetters(){ const taken="SKATE".split("").map((ch,i)=> i<misses?`[${ch}]`:ch).join(" "); els.letters.textContent = taken; }
function prettyScore(rep){
  if (!rep.valid) return "Invalid combo for obstacle.";
  let lines = [`Base: ${rep.base}`, `Combo x${rep.combo}`, `Attempt x${rep.attempt} => Final: ${rep.final}`, "", "Breakdown:"];
  for (const [kind,name,pts] of rep.breakdown){ lines.push(`  + ${kind}:${name} = ${pts}`); }
  return lines.join("\n");
}

// Feedback
els.feedbackBtn.addEventListener('click', ()=>{
  const note = prompt("Drop feedback here:");
  if (!note) return;
  const bag = JSON.parse(localStorage.getItem('ss_feedback')||'[]');
  bag.push({note, at: Date.now(), score: total, version: VERSION});
  localStorage.setItem('ss_feedback', JSON.stringify(bag));
  alert("Saved locally. You can export later.");
});

// Settings modal
els.settingsBtn.addEventListener('click', ()=>{ renderSettings(); els.settingsModal.classList.remove('hidden'); });
els.settingsClose.addEventListener('click', ()=> els.settingsModal.classList.add('hidden'));
els.settingsSave.addEventListener('click', ()=>{
  document.querySelectorAll('#settingsModal input[type=checkbox]').forEach(cb=>{
    const group = cb.dataset.group, key = cb.dataset.key; TOGGLES[group][key] = cb.checked;
  });
  saveToggles(TOGGLES);
  els.settingsModal.classList.add('hidden');
});
function renderSettings(){
  const modal = els.settingsModal;
  const flipsDiv = modal.querySelector('.panel.flips');
  const grindsDiv = modal.querySelector('.panel.grinds');
  const spinsDiv = modal.querySelector('.panel.spins');
  flipsDiv.innerHTML = Object.keys(TOGGLES.flips).map(n=>labelBox('flips',n,TOGGLES.flips[n])).join('');
  grindsDiv.innerHTML = Object.keys(TOGGLES.grinds).map(n=>labelBox('grinds',n,TOGGLES.grinds[n])).join('');
  spinsDiv.innerHTML = Object.keys(TOGGLES.spins).map(n=>labelBox('spins',n,TOGGLES.spins[n])).join('');
  modal.querySelectorAll('.tab').forEach(t=>{
    t.onclick=()=>{ modal.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
      modal.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
      modal.querySelector(`.panel.${t.dataset.tab}`).classList.remove('hidden'); };
  });
}
function labelBox(group,key,checked){ const id = `${group}-${key}`.replace(/\s+/g,'-'); return `<label><input id="${id}" type="checkbox" data-group="${group}" data-key="${key}" ${checked?'checked':''}/> ${key}</label>`; }

// More menu (reset & clear cache)
const RESET_PASS = "sk8-reset-2025";
els.moreBtn.addEventListener('click', async ()=>{
  const act = prompt("More:\n- Type 'reset' to clear best score\n- Type 'clear' to clear cache & reload");
  if (!act) return;
  if (act.toLowerCase()==='reset'){
    const pw = prompt("Password to reset:");
    if (pw===RESET_PASS){ localStorage.removeItem('ss_best'); alert("Best score reset."); }
    else alert("Nope.");
  }
  if (act.toLowerCase()==='clear'){
    const keys = await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
    alert("Cache cleared. Reloading…");
    location.reload(true);
  }
});

// SW register
if ('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js')); }

console.log("Skate Session loaded", VERSION);
