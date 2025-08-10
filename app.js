// Brainlock v0.5.1 — scoring fixes, simpler settings, level moved, attempt overlay
const VERSION="0.5.1";

/* ===== State & Defaults ===== */
const DEFAULTS = {
  categories: { flips:true, grinds:true, manuals:true, airs:true, spins:true },
  stances: { regular:true, fakie:true, nollie:true, switch:true },
  flips: {"kickflip":true,"heelflip":true,"varial kickflip":true,"varial heelflip":true,"hardflip":true,"inward heelflip":true,"bigspin flip":true,"bigspin heelflip":true,"tre flip":true,"360 flip":true,"laser flip":true},
  grinds: {"50-50":true,"5-0":true,"boardslide":true,"noseslide":true,"tailslide":true,"lipslide":true,"smith":true,"feeble":true,"willy":true,"salad":true,"crooked":true,"overcrook":true,"nosegrind":true,"noseblunt":true,"bluntslide":true},
  spins: {"180":true,"360":true,"540":true,"720":true},
  manuals: {"manual":true,"nose manual":true,"one wheel manual":false},
  obstacles: ["flat","ledge","rail","manual pad","quarterpipe","bank","kicker"],
  level: 6
};
function loadState(){ try{ const s=JSON.parse(localStorage.getItem('bl_state'))||DEFAULTS; return {...DEFAULTS, ...s}; }catch{ return DEFAULTS; } }
function saveState(s){ localStorage.setItem('bl_state', JSON.stringify(s)); }
let STATE = loadState();
const ALL_OBS = ["flat","curb","ledge","flatbar","handrail","rail","hubba","kicker","gap","stair","quarterpipe","bank","mini ramp","funbox","manual pad","box"];

/* ===== Rules & Scoring ===== */
const RULES = {
  DIRECTION_DEFAULTS: {"50-50":"frontside","5-0":"frontside","boardslide":"backside","noseslide":"backside","lipslide":"frontside","tailslide":"frontside","bluntslide":"backside","nosegrind":"frontside","crooked":"backside","willy":"backside","feeble":"backside","smith":"backside","salad":"backside","overcrook":"backside","noseblunt":"frontside"},
  FLIPS:["kickflip","heelflip","hardflip","inward heelflip","varial kickflip","varial heelflip","tre flip","360 flip","laser flip","bigspin flip","bigspin heelflip"],
  GRINDS_SLIDES:["50-50","5-0","boardslide","noseslide","tailslide","lipslide","smith","feeble","willy","salad","crooked","overcrook","nosegrind","noseblunt","bluntslide"],
  SPINS:[180,360,540,720],
  MANUALS:["manual","nose manual","one wheel manual"],
  GRIND_OK:new Set(["rail","handrail","flatbar","ledge","hubba"]),
  SLIDE_OK:new Set(["ledge","hubba","rail","handrail","flatbar","curb","box"]),
  MANUAL_OK:new Set(["manual pad","box","funbox","kicker","bank"]),
  AIR_OK:new Set(["flat","gap","kicker","quarterpipe","bank","stair","funbox"]),
};

// Level descriptions for UI
const LEVELS = {
  1:"Basics",2:"Low Intermediate",3:"Intermediate",4:"Solid",5:"Advanced",
  6:"Flow",7:"Sponsored",8:"Pro",9:"Ender",10:"Comically hard"
};

// Base points tuned for spread
const BASE_POINTS = {
  stance:{regular:0, fakie:0.05, nollie:0.12, switch:0.2},
  spin:{180:0.20, 360:0.45, 540:0.75, 720:1.05},
  flip:{"kickflip":0.25,"heelflip":0.3,"hardflip":0.7,"inward heelflip":0.75,"varial kickflip":0.45,"varial heelflip":0.5,"tre flip":1.0,"360 flip":1.0,"laser flip":1.15,"bigspin flip":0.65,"bigspin heelflip":0.75},
  grind_slide:{"50-50":0.3,"5-0":0.45,"boardslide":0.4,"noseslide":0.5,"tailslide":0.55,"lipslide":0.6,"smith":0.75,"feeble":0.8,"willy":0.6,"salad":0.7,"crooked":0.8,"overcrook":0.9,"nosegrind":0.85,"noseblunt":1.15,"bluntslide":1.1},
  obstacle:{"flat":0,"manual pad":0.1,"box":0.12,"curb":0.18,"ledge":0.28,"hubba":0.4,"flatbar":0.4,"rail":0.55,"handrail":0.7,"gap":0.6,"kicker":0.15,"stair":0.55,"quarterpipe":0.45,"bank":0.28,"funbox":0.25,"mini ramp":0.35},
  manual:{"manual":0.25,"nose manual":0.4,"one wheel manual":0.75}
};
const COMBO_BONUSES = { spin_plus_flip:0.25, flip_into_grind:0.35, spin_into_grind:0.2, manual_combo:0.2 };
const ATTEMPT_MULT = {1:1.00, 2:0.85, 3:0.75};

function tier(skill){ return Math.max(1, Math.min(10, skill|0)); }
function allowFlip(name,s){
  const hi=["tre flip","360 flip","laser flip","bigspin heelflip","hardflip","inward heelflip"];
  const mid=["varial kickflip","varial heelflip","bigspin flip"];
  if (s<=1) return ["kickflip","heelflip"].includes(name);
  if (s<=2) return !hi.includes(name)&&!mid.includes(name);
  if (s<=4) return !hi.includes(name);
  if (s<=5) return name!=="laser flip";
  if (s<=6) return name!=="laser flip";
  if (s===7) return name!=="laser flip";
  if (s===9) return !["kickflip","heelflip"].includes(name);
  return true;
}
function allowGrindSlide(name,s){
  const high=["overcrook","noseblunt","bluntslide"];
  if (s<=1) return ["50-50","boardslide","5-0","noseslide","tailslide"].includes(name);
  if (s<=2) return !high.includes(name)&&!["smith","feeble","overcrook"].includes(name);
  if (s<=4) return !high.includes(name) || name==="overcrook";
  if (s===9) return high.includes(name)||["crooked","nosegrind","5-0"].includes(name);
  return true;
}
function allowSpin(spin,s){
  if (s<=2) return spin<=180;
  if (s<=4) return spin<=360;
  if (s<=7) return spin<=540;
  if (s===8) return spin<=720;
  return true;
}
function stancePool(s){ const p=Object.keys(STATE.stances).filter(k=>STATE.stances[k]); return s<=2 ? p.filter(x=>x!=="switch") : p; }

/* ===== Generator ===== */
function pickObstacle(){
  const src=(STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:DEFAULTS.obstacles).filter(o=>ALL_OBS.includes(o));
  return src.length? src[Math.floor(Math.random()*src.length)] : "flat";
}
function isRail(ob){ return ["rail","handrail","flatbar"].includes(ob); }
function validForObstacle(comp, ob){
  if (comp.grind_slide){
    const isSlide=["boardslide","lipslide","tailslide","noseslide","bluntslide"].includes(comp.grind_slide);
    if (isSlide && !RULES.SLIDE_OK.has(ob)) return false;
    if (!isSlide && !(RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))) return false;
  }
  if (comp.manual){ if (!RULES.MANUAL_OK.has(ob)) return false; }
  if (comp.flip && !comp.grind_slide && !comp.manual){ if (!(RULES.AIR_OK.has(ob)||isRail(ob))) return false; }
  return true;
}
function generateTrick(skill){
  const s=tier(skill), ob=pickObstacle();
  const allowFlipsCat = STATE.categories.flips && Object.values(STATE.flips).some(Boolean);
  const allowGrindsCat = STATE.categories.grinds && Object.values(STATE.grinds).some(Boolean);
  const allowSpinsCat  = STATE.categories.spins && Object.values(STATE.spins).some(Boolean);
  const allowManualsCat= STATE.categories.manuals && Object.values(STATE.manuals).some(Boolean);
  const allowAirsCat   = STATE.categories.airs;

  const pool = {
    stance: stancePool(s),
    flips: allowFlipsCat ? RULES.FLIPS.filter(n=>STATE.flips[n] && allowFlip(n,s)) : [],
    grinds: allowGrindsCat ? RULES.GRINDS_SLIDES.filter(n=>STATE.grinds[n] && allowGrindSlide(n,s)) : [],
    spins: allowSpinsCat ? RULES.SPINS.filter(x=>STATE.spins[String(x)] && allowSpin(x,s)) : [],
    manuals: allowManualsCat ? RULES.MANUALS.filter(n=>STATE.manuals[n]) : []
  };
  const afford={ canGrind: RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob), canManual: RULES.MANUAL_OK.has(ob), canAir: RULES.AIR_OK.has(ob)||isRail(ob) };
  const patterns=[];
  if (afford.canGrind && pool.grinds.length) patterns.push("grindOnly");
  if (afford.canManual && pool.manuals.length) patterns.push("manualOnly");
  if (afford.canAir && pool.flips.length) patterns.push("flipOnly");
  if (afford.canGrind && pool.flips.length) patterns.push("flipToGrind");
  if (afford.canAir && pool.spins.length && pool.flips.length) patterns.push("spinFlip");
  if (!patterns.length) return {stance:null, spin:null, spin_dir:null, flip:"kickflip", grind_slide:null, direction:null, manual:null, obstacle:"flat"};

  let tries=0;
  while(tries++<40){
    const pat=patterns[Math.floor(Math.random()*patterns.length)];
    const comp={stance:null, spin:null, spin_dir:null, flip:null, grind_slide:null, direction:null, manual:null, obstacle:ob};
    if (Math.random()<0.25 && pool.stance.length){ const st=pool.stance[Math.floor(Math.random()*pool.stance.length)]; comp.stance=(st==="regular"?null:st); }
    if (pat==="flipOnly"){ comp.flip=pool.flips[Math.floor(Math.random()*pool.flips.length)]; if (pool.spins.length && Math.random()<0.35){ comp.spin=pool.spins[Math.floor(Math.random()*pool.spins.length)]; comp.spin_dir=(Math.random()<0.5?"frontside":"backside"); } }
    else if (pat==="grindOnly"){ comp.grind_slide=pool.grinds[Math.floor(Math.random()*pool.grinds.length)]; comp.direction=RULES.DIRECTION_DEFAULTS[comp.grind_slide]||"frontside"; if (pool.spins.length && Math.random()<0.2){ comp.spin=pool.spins[Math.floor(Math.random()*pool.spins.length)]; comp.spin_dir=(Math.random()<0.5?"frontside":"backside"); } }
    else if (pat==="manualOnly"){ comp.manual=pool.manuals[Math.floor(Math.random()*pool.manuals.length)]; if (pool.flips.length && Math.random()<0.3) comp.flip=pool.flips[Math.floor(Math.random()*pool.flips.length)]; }
    else if (pat==="flipToGrind"){ comp.flip=pool.flips[Math.floor(Math.random()*pool.flips.length)]; comp.grind_slide=pool.grinds[Math.floor(Math.random()*pool.grinds.length)]; comp.direction=RULES.DIRECTION_DEFAULTS[comp.grind_slide]||"frontside"; }
    else if (pat==="spinFlip"){ comp.spin=pool.spins[Math.floor(Math.random()*pool.spins.length)]; comp.spin_dir=(Math.random()<0.5?"frontside":"backside"); comp.flip=pool.flips[Math.floor(Math.random()*pool.flips.length)]; }
    if (validForObstacle(comp, ob)) return comp;
  }
  return {stance:null, spin:null, spin_dir:null, flip:"kickflip", grind_slide:null, direction:null, manual:null, obstacle:"flat"};
}
function describe(c){
  const isRailObs=["rail","handrail","flatbar"].includes(c.obstacle);
  const parts=[];
  if (c.flip && !c.grind_slide && !c.manual && isRailObs){ parts.push(c.flip,"over",c.obstacle); return parts.join(" "); }
  if (c.stance && c.stance!=="regular") parts.push(c.stance);
  if (c.spin){ parts.push(c.spin_dir?`${c.spin_dir} ${c.spin}`:`${c.spin}`); }
  if (c.flip) parts.push(c.flip);
  if (c.direction && c.grind_slide) parts.push(`${c.direction} ${c.grind_slide}`); else if (c.grind_slide) parts.push(c.grind_slide);
  if (c.manual) parts.push(c.manual);
  if (c.obstacle) parts.push(`on ${c.obstacle}`);
  return parts.join(" ");
}

/* ===== Scoring ===== */
function computeScore(c, attempt){
  if (!c) return {valid:false, final:0, text:"Invalid trick"};
  let s=1.0, bd=[];
  const st=c.stance||"regular"; s+=BASE_POINTS.stance[st]||0; bd.push(["stance",st,BASE_POINTS.stance[st]||0]);
  if (c.spin){ s+=BASE_POINTS.spin[c.spin]||0; bd.push(["spin",c.spin,BASE_POINTS.spin[c.spin]||0]); }
  if (c.flip){ s+=BASE_POINTS.flip[c.flip]||0; bd.push(["flip",c.flip,BASE_POINTS.flip[c.flip]||0]); }
  if (c.grind_slide){ s+=BASE_POINTS.grind_slide[c.grind_slide]||0; bd.push(["grind/slide",c.grind_slide,BASE_POINTS.grind_slide[c.grind_slide]||0]); }
  if (c.manual){ s+=BASE_POINTS.manual[c.manual]||0; bd.push(["manual",c.manual,BASE_POINTS.manual[c.manual]||0]); }
  if (c.obstacle){ s+=BASE_POINTS.obstacle[c.obstacle]||0; bd.push(["obstacle",c.obstacle,BASE_POINTS.obstacle[c.obstacle]||0]); }
  let bonus=0; if (c.spin && c.flip) bonus+=0.25; if (c.flip && c.grind_slide) bonus+=0.35; if (c.spin && c.grind_slide) bonus+=0.2; if (c.manual && (c.flip||c.spin)) bonus+=0.2;
  s*=(1+bonus);
  const mult=ATTEMPT_MULT[attempt]||1.0;
  const base=Math.max(s,0.1);
  const final=round(base*mult,2);
  const text=prettyScore({base:round(base,2), combo:round(1+bonus,2), attempt:mult, final, breakdown:bd});
  return {valid:true, final, text};
}
function round(x,n){ const k=Math.pow(10,n); return Math.round(x*k)/k; }
function prettyScore(r){ let lines=[`Base: ${r.base} pts`,`Combo x${r.combo}`,`Attempt x${r.attempt} => Final: ${r.final} pts`,"","Breakdown:"]; for(const[k,n,p] of r.breakdown){ lines.push(`  + ${k}: ${n} = ${p} pts`);} return lines.join("\n"); }

/* ===== Elements & UI ===== */
const els = {
  titleText:document.getElementById('titleText'),
  settingsBtn:document.getElementById('settingsBtn'),
  previewTray:document.getElementById('previewTray'),
  previewGrid:document.getElementById('previewGrid'),
  collapseToggle:document.getElementById('collapseToggle'),
  levelPill:document.getElementById('levelPill'),
  obsNames:document.getElementById('obsNames'),
  stanceNames:document.getElementById('stanceNames'),
  trickSummary:document.getElementById('trickSummary'),
  levelBrief:document.getElementById('levelBrief'),
  letters:document.getElementById('letters'),
  scoreLabel:document.getElementById('scoreLabel'),
  scoreTop:document.getElementById('scoreTop'),
  viewSetup:document.getElementById('viewSetup'),
  viewGame:document.getElementById('viewGame'),
  viewOver:document.getElementById('viewOver'),
  startBtn:document.getElementById('startBtn'),
  trickText:document.getElementById('trickText'),
  attemptBadge:document.getElementById('attemptBadge'),
  attemptPoints:document.getElementById('attemptPoints'),
  skipBtn:document.getElementById('skipBtn'),
  missBtn:document.getElementById('missBtn'),
  landBtn:document.getElementById('landBtn'),
  nextBtn:document.getElementById('nextBtn'),
  endBtn:document.getElementById('endBtn'),
  finalScore:document.getElementById('finalScore'),
  bestScore:document.getElementById('bestScore'),
  restartBtn:document.getElementById('restartBtn'),
  // Settings
  settingsModal:document.getElementById('settingsModal'),
  settingsTitle:document.getElementById('settingsTitle'),
  settingsBack:document.getElementById('settingsBack'),
  settingsClose:document.getElementById('settingsClose'),
  exportFeedback:document.getElementById('exportFeedback'),
  clearCache:document.getElementById('clearCache'),
  editObs:document.getElementById('editObs'),
  editStance:document.getElementById('editStance'),
  editTricks:document.getElementById('editTricks'),
  editLevel:document.getElementById('editLevel'),
  obsChips:document.getElementById('obsChips'),
  stanceChips:document.getElementById('stanceChips'),
  catChips:document.getElementById('catChips'),
  trickSubs:document.getElementById('trickSubs'),
  levelGrid:document.getElementById('levelGrid'),
  // Attempt modal
  attemptModal:document.getElementById('attemptModal'),
  attemptBreak:document.getElementById('attemptBreak'),
  attemptClose:document.getElementById('attemptClose'),
  // Confirm
  confirmModal:document.getElementById('confirmModal'),
  confirmNo:document.getElementById('confirmNo'),
  confirmYes:document.getElementById('confirmYes'),
};
els.titleText.addEventListener('click', ()=>location.reload());

function setPreviewExpanded(exp){ document.getElementById('previewGrid').style.display=exp?'flex':'none'; els.collapseToggle.textContent=exp?'▲':'▼'; els.collapseToggle.setAttribute('aria-expanded', String(exp)); }
setPreviewExpanded(true);
els.collapseToggle.addEventListener('click', ()=> setPreviewExpanded(document.getElementById('previewGrid').style.display==='none'));

/* Summaries */
function renderObsSummary(){ els.obsNames.textContent=(STATE.obstacles&&STATE.obstacles.length)?STATE.obstacles.join(", "):"—"; }
function renderStanceSummary(){ const on=Object.keys(STATE.stances).filter(k=>STATE.stances[k]); els.stanceNames.textContent=on.join(", ")||"—"; }
function renderTrickSummary(){ const cats=[]; if(STATE.categories.flips)cats.push("Flips"); if(STATE.categories.grinds)cats.push("Grinds/Slides"); if(STATE.categories.manuals)cats.push("Manuals"); if(STATE.categories.airs)cats.push("Airs"); if(STATE.categories.spins)cats.push("Spins"); els.trickSummary.textContent=cats.join("/")||"—"; }
function renderLevelBits(){ const lvl=STATE.level||6; document.getElementById('levelBrief').textContent=`${lvl} • ${LEVELS[lvl]}`; document.getElementById('levelPill').textContent=`Level: ${lvl}`; }
function renderAllSummaries(){ renderObsSummary(); renderStanceSummary(); renderTrickSummary(); renderLevelBits(); }
renderAllSummaries();

/* Settings */
function openSettingsPane(id){
  ["settingsHome","obsPane","stancePane","trickPane","levelPane","aboutPane"].forEach(pid=>{
    const el=document.getElementById(pid);
    el.classList.toggle('hidden', pid!==id);
    el.classList.toggle('active', pid===id);
  });
  document.getElementById('settingsBack').classList.toggle('hidden', id==="settingsHome");
  document.getElementById('settingsTitle').textContent = id==="settingsHome"?"Settings":id==="obsPane"?"Obstacles":id==="stancePane"?"Stances":id==="trickPane"?"Tricks":id==="levelPane"?"Difficulty":"About & Tools";
}
function openSettingsHome(){ openSettingsPane("settingsHome"); }
function showSettings(){ openSettingsHome(); document.getElementById('settingsModal').classList.remove('hidden'); }
function closeSettings(){ document.getElementById('settingsModal').classList.add('hidden'); }
els.settingsBtn.addEventListener('click', showSettings);
els.settingsClose.addEventListener('click', closeSettings);
els.settingsBack.addEventListener('click', openSettingsHome);
document.getElementById('settingsModal').addEventListener('click', (e)=>{ if(e.target.id==='settingsModal') closeSettings(); });
document.querySelectorAll('#settingsHome .list-item').forEach(btn=> btn.addEventListener('click', ()=> openSettingsPane(btn.dataset.open)));
document.querySelectorAll('[data-close]').forEach(btn=> btn.addEventListener('click', closeSettings));
document.getElementById('editObs').addEventListener('click', ()=>{ showSettings(); openSettingsPane("obsPane"); renderObsChips(); });
document.getElementById('editStance').addEventListener('click', ()=>{ showSettings(); openSettingsPane("stancePane"); renderStanceChips(); });
document.getElementById('editTricks').addEventListener('click', ()=>{ showSettings(); openSettingsPane("trickPane"); renderTrickCats(); renderTrickSubs(); });
document.getElementById('editLevel').addEventListener('click', ()=>{ showSettings(); openSettingsPane("levelPane"); renderLevelGrid(); });

function renderObsChips(){ const pool=ALL_OBS; document.getElementById('obsChips').innerHTML=pool.map(o=>`<button data-o="${o}" class="${STATE.obstacles.includes(o)?'active':''}">${o}</button>`).join(''); document.querySelectorAll('#obsChips button').forEach(b=> b.onclick=()=>{ const o=b.dataset.o; STATE.obstacles = STATE.obstacles.includes(o)?STATE.obstacles.filter(x=>x!==o):STATE.obstacles.concat([o]); saveState(STATE); renderObsChips(); renderObsSummary(); }); }
function renderStanceChips(){ const keys=["regular","fakie","nollie","switch"]; document.getElementById('stanceChips').innerHTML=keys.map(k=>`<button data-k="${k}" class="${STATE.stances[k]?'active':''}">${k}</button>`).join(''); document.querySelectorAll('#stanceChips button').forEach(b=> b.onclick=()=>{ const k=b.dataset.k; STATE.stances[k]=!STATE.stances[k]; saveState(STATE); renderStanceChips(); renderStanceSummary(); }); }
function labelBox(group,key,checked){ const id=`${group}-${key}`.replace(/\s+/g,'-'); return `<label><input id="${id}" type="checkbox" data-group="${group}" data-key="${key}" ${checked?'checked':''}/> ${key}</label>`; }
function renderTrickCats(){ const map=[["flips","Flips"],["grinds","Grinds/Slides"],["manuals","Manuals"],["airs","Airs"],["spins","Spins"]]; document.getElementById('catChips').innerHTML=map.map(([k,l])=>`<button data-k="${k}" class="${STATE.categories[k]?'active':''}">${l}</button>`).join(''); document.querySelectorAll('#catChips button').forEach(b=> b.onclick=()=>{ const k=b.dataset.k; STATE.categories[k]=!STATE.categories[k]; saveState(STATE); renderTrickCats(); renderTrickSubs(); renderTrickSummary(); }); }
function renderTrickSubs(){ const subs=document.querySelectorAll('#trickSubs .subpanel'); subs.forEach(sp=>{ const cat=sp.getAttribute('data-cat'); const on=!!STATE.categories[cat]; sp.style.display=on?'block':'none'; if(cat==="flips"){ sp.querySelector('.panel.flips').innerHTML=Object.keys(STATE.flips).map(n=>labelBox('flips',n,STATE.flips[n])).join(''); } else if(cat==="grinds"){ sp.querySelector('.panel.grinds').innerHTML=Object.keys(STATE.grinds).map(n=>labelBox('grinds',n,STATE.grinds[n])).join(''); } else if(cat==="spins"){ sp.querySelector('.panel.spins').innerHTML=Object.keys(STATE.spins).map(n=>labelBox('spins',n,STATE.spins[n])).join(''); } else if(cat==="manuals"){ sp.querySelector('.panel.manuals').innerHTML=Object.keys(STATE.manuals).map(n=>labelBox('manuals',n,STATE.manuals[n])).join(''); } else if(cat==="airs"){ sp.querySelector('.panel.airs').innerHTML="<p class='muted small'>Airs have no granular options yet.</p>"; } }); document.querySelectorAll('#trickPane input[type=checkbox]').forEach(cb=> cb.onchange=()=>{ const g=cb.dataset.group, k=cb.dataset.key; STATE[g][k]=cb.checked; saveState(STATE); }); }
function renderLevelGrid(){ const lvl=STATE.level||6; const boxes=[]; for(let i=1;i<=10;i++){ boxes.push(`<div class="lvl"><button data-lvl="${i}" class="${i===lvl?'active':''}">Level ${i}</button><div class="desc">${LEVELS[i]}</div></div>`);} document.getElementById('levelGrid').innerHTML=boxes.join(''); document.querySelectorAll('#levelGrid button[data-lvl]').forEach(btn=> btn.onclick=()=>{ STATE.level=parseInt(btn.dataset.lvl,10); saveState(STATE); renderLevelGrid(); renderLevelBits(); }); }

/* Attempt modal */
function openAttemptModal(text){ document.getElementById('attemptBreak').textContent=text; document.getElementById('attemptModal').classList.remove('hidden'); }
function closeAttemptModal(){ document.getElementById('attemptModal').classList.add('hidden'); }
document.getElementById('attemptClose').addEventListener('click', closeAttemptModal);
document.getElementById('attemptModal').addEventListener('click', (e)=>{ if(e.target.id==='attemptModal') closeAttemptModal(); });

/* Confirm end session */
function openConfirm(){ document.getElementById('confirmModal').classList.remove('hidden'); }
function closeConfirm(){ document.getElementById('confirmModal').classList.add('hidden'); }
document.getElementById('confirmNo').addEventListener('click', closeConfirm);
document.getElementById('confirmYes').addEventListener('click', ()=>{ closeConfirm(); endSession(); });

/* Game */
let misses=0,total=0,attempt=1,current=null;
function setView(which){
  document.getElementById('viewSetup').classList.toggle('hidden', which!=="setup");
  document.getElementById('viewSetup').classList.toggle('active', which==="setup");
  document.getElementById('viewGame').classList.toggle('hidden', which!=="game");
  document.getElementById('viewGame').classList.toggle('active', which==="game");
  document.getElementById('viewOver').classList.toggle('hidden', which!=="over");
  document.getElementById('viewOver').classList.toggle('active', which==="over");
  if(which==="setup"){ document.getElementById('scoreLabel').textContent="High Score:"; document.getElementById('scoreTop').textContent=(localStorage.getItem('bl_best')||"0.00")+" pts"; }
  if(which==="game"){ document.getElementById('scoreLabel').textContent="Total Score:"; document.getElementById('scoreTop').textContent=total.toFixed(2)+" pts"; }
}
function updateLetters(){ const spans=[...document.getElementById('letters').children]; spans.forEach((s,i)=> s.classList.toggle('lost', i<misses)); }
function resetGameState(){ misses=0; total=0; attempt=1; updateLetters(); document.getElementById('scoreTop').textContent=total.toFixed(2)+" pts"; }
function startSession(){ if(!STATE.obstacles||STATE.obstacles.length===0){ STATE.obstacles=DEFAULTS.obstacles.slice(); } saveState(STATE); resetGameState(); setView("game"); nextTrick(true); }
document.getElementById('startBtn').addEventListener('click', startSession);

function nextTrick(first=false){
  attempt=1; current=generateTrick(STATE.level||6);
  const text=describe(current)||"kickflip on flat"; document.getElementById('trickText').textContent=text;
  renderAttemptBadge(); showActionButtons(true);
  if(!first) window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
}
function renderAttemptBadge(){ document.getElementById('attemptBadge').textContent=`Attempt ${attempt}/3`; const rep=computeScore(current, attempt); const btn=document.getElementById('attemptPoints'); btn.textContent = `This attempt: ${rep.valid?rep.final.toFixed(2):'—'} pts`; btn.disabled=!rep.valid; btn.setAttribute('aria-disabled', String(!rep.valid)); btn.onclick=()=>{ if(rep.valid) openAttemptModal(rep.text); }; }
function showActionButtons(core){ if(core){ document.getElementById('skipBtn').classList.remove('hidden'); document.getElementById('missBtn').classList.remove('hidden'); document.getElementById('landBtn').classList.remove('hidden'); document.getElementById('nextBtn').classList.add('hidden'); } else { document.getElementById('skipBtn').classList.add('hidden'); document.getElementById('missBtn').classList.add('hidden'); document.getElementById('landBtn').classList.add('hidden'); document.getElementById('nextBtn').classList.remove('hidden'); } }
function settle(landed){ if(landed){ const rep=computeScore(current, attempt); total+=rep.final; document.getElementById('scoreTop').textContent=total.toFixed(2)+" pts"; openAttemptModal(rep.text); showActionButtons(false); } else { if(attempt<3){ attempt++; renderAttemptBadge(); } else { misses++; updateLetters(); if(misses>=5){ endSession(); return; } showActionButtons(false); } } }
document.getElementById('landBtn').addEventListener('click', ()=>settle(true));
document.getElementById('missBtn').addEventListener('click', ()=>settle(false));
document.getElementById('skipBtn').addEventListener('click', ()=> nextTrick(false));
document.getElementById('nextBtn').addEventListener('click', ()=> nextTrick(false));
document.getElementById('endBtn').addEventListener('click', openConfirm);
function endSession(){ setView("over"); document.getElementById('finalScore').textContent=total.toFixed(2)+" pts"; const best=Math.max(total, parseFloat(localStorage.getItem('bl_best')||"0")); localStorage.setItem('bl_best', String(best)); document.getElementById('bestScore').textContent=best.toFixed(2)+" pts"; }
document.getElementById('restartBtn').addEventListener('click', ()=> setView("setup"));

/* Tools */
document.getElementById('exportFeedback').addEventListener('click', ()=>{ const payload={state:STATE,version:VERSION,date:new Date().toISOString()}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="brainlock-feedback.json"; a.click(); });
document.getElementById('clearCache').addEventListener('click', async ()=>{ try{ if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); } }catch(e){ console.warn(e); } location.reload(); });

/* SW */
if ('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js')); }
console.log("Brainlock loaded", VERSION);
