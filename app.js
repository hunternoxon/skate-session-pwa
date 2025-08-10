// v0.5.4 — Admin Mode + Tray fixes + High Score button
const VERSION="0.5.4";

const DEFAULTS={
  obstacles:["flat","ledge","rail","handrail","flatbar","hubba","manual pad","bank","quarterpipe","gap","stair"],
  stances:{regular:true,switch:true,nollie:true,fakie:true},
  categories:{flips:true,grinds:true,spins:true,manuals:true,airs:true},
  flips:{"kickflip":true,"heelflip":true,"varial kickflip":true,"varial heelflip":true,"hardflip":true,"tre flip":true,"laser flip":true},
  grinds:{"50-50":true,"5-0":true,"boardslide":true,"crooked":true,"nosegrind":true,"bluntslide":true,"noseblunt":true},
  spins:{"180":true,"360":true,"540":false,"720":false},
  level:6,
  nickname:""
};
function loadState(){try{return JSON.parse(localStorage.getItem('bl_state'))||DEFAULTS}catch{ return DEFAULTS}}
function saveState(s){localStorage.setItem('bl_state',JSON.stringify(s))}
let STATE=loadState();

function getScores(){return JSON.parse(localStorage.getItem('bl_scores')||"[]")}
function setScores(arr){localStorage.setItem('bl_scores',JSON.stringify(arr))}
function addScore(nickname,value){const arr=getScores();arr.push({id:String(Date.now())+Math.random().toString(16).slice(2),nickname,value,created_at:Date.now()});arr.sort((a,b)=>b.value-a.value);setScores(arr);}
function isAdmin(){return localStorage.getItem('bl_admin')==="1"}
function setAdmin(on){localStorage.setItem('bl_admin',on?"1":"0")}

const $=id=>document.getElementById(id);
const els={
  title:$("titleText"),
  settingsBtn:$("settingsBtn"),
  overlay:$("overlay"),
  overlayTitle:$("overlayTitle"),
  overlayBody:$("overlayBody"),
  overlayPrimary:$("overlayPrimary"),
  overlaySecondary:$("overlaySecondary"),
  settingsModal:$("settingsModal"),
  settingsClose:$("settingsClose"),
  adminToggle:$("adminToggle"),
  nickname:$("nickname"),
  viewSetup:$("viewSetup"),
  viewGame:$("viewGame"),
  viewOver:$("viewOver"),
  startBtn:$("startBtn"),
  restartBtn:$("restartBtn"),
  endBtn:$("endBtn"),
  letters:$("letters"),
  attemptBadge:$("attemptBadge"),
  attemptPoints:$("attemptPoints"),
  trickText:$("trickText"),
  nextBtn:$("nextBtn"),
  playButtons:$("playButtons"),
  highScoreBtn:$("highScoreBtn"),
  highScoreBtnOver:$("highScoreBtnOver"),
  highTop:$("highTop"),
  highTopOver:$("highTopOver"),
  editLevel:$("editLevel"),
  levelNum:$("levelNum"),
  levelDesc:$("levelDesc"),
  collapsePreview:$("collapsePreview"),
  previewTray:$("previewTray"),
  obsNames:$("obsNames"),
  stanceNames:$("stanceNames"),
  trickSummary:$("trickSummary"),
  editObs:$("editObs"),
  editStance:$("editStance"),
  editTricks:$("editTricks"),
  clearCache:$("clearCache"),
  exportFeedback:$("exportFeedback"),
  viewRules:$("viewRules"),
};

const LEVEL_DESC={1:"Beginner",2:"Basic",3:"Park flow",4:"Consistent am",5:"Local ripper",6:"Advanced am",7:"Sponsored",8:"Pro",9:"Top pro",10:"Ender-only"};

function openOverlay(title, bodyHtml, {primary=null, onPrimary=null, secondaryText="X"}={}){
  els.overlayTitle.textContent=title;
  els.overlayBody.innerHTML=bodyHtml;
  if(primary){ els.overlayPrimary.textContent=primary; els.overlayPrimary.classList.remove("hidden"); els.overlayPrimary.onclick=onPrimary||null; }
  else { els.overlayPrimary.classList.add("hidden"); els.overlayPrimary.onclick=null; }
  els.overlaySecondary.textContent=secondaryText;
  els.overlay.classList.remove("hidden");
}
function closeOverlay(){ els.overlay.classList.add("hidden"); els.overlayPrimary.onclick=null; }
els.overlaySecondary.addEventListener('click', closeOverlay);

els.settingsBtn.addEventListener('click',()=>{
  els.adminToggle.checked=isAdmin();
  els.nickname.value=STATE.nickname||"";
  els.settingsModal.classList.remove('hidden');
});
$("settingsClose").addEventListener('click',()=>els.settingsModal.classList.add('hidden'));
els.adminToggle.addEventListener('change',e=>setAdmin(e.target.checked));
els.nickname.addEventListener('input',e=>{STATE.nickname=e.target.value; saveState(STATE);});
els.clearCache.addEventListener('click', async ()=>{
  if('caches'in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
  if('serviceWorker'in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); }
  location.reload();
});
els.exportFeedback.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({state:STATE,scores:getScores()},null,2)],{type:"application/json"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="brainlock-export.json"; a.click();
});
els.viewRules.addEventListener('click',()=>{
  openOverlay("Game Rules", "<ul><li>3 attempts per trick</li><li>Miss all 3 → letter</li><li>5 letters = SKATE = session over</li><li>Scores in pts; earlier attempts score higher</li></ul>");
});

els.collapsePreview.addEventListener('click',()=>{
  const c=els.previewTray.classList.toggle('collapsed');
  els.collapsePreview.textContent = c ? "▼" : "▲";
  els.collapsePreview.setAttribute('aria-expanded', String(!c));
});

function bestScore(){ const arr=getScores(); return arr.length?arr[0].value:0; }
function refreshHigh(){
  const b=bestScore();
  els.highTop.textContent=b.toFixed(2);
  els.highTopOver.textContent=b.toFixed(2);
}
function showHighScores(){
  const rows=getScores().slice(0,10);
  let html="<ol class='list'>";
  rows.forEach(r=>{
    html+=`<li class="list-item row"><span>${r.nickname||"Player"} — ${r.value.toFixed(2)} pts</span>`;
    if(isAdmin()){ html+=`<button data-id="${r.id}" class="ghost small">🗑️</button>`; }
    html+="</li>";
  });
  html+="</ol>";
  if(isAdmin()){ html+=`<div class="row" style="justify-content:center;margin-top:8px"><button id="restoreDemo" class="ghost">Restore demo Top 10</button></div>`;}
  openOverlay("High Scores", html);
  els.overlayBody.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.getAttribute('data-id');
      openOverlay("Remove this score?", "<p>This will remove the entry from Top 10.</p>", {primary:"Yes, remove", onPrimary:()=>{ 
        const filtered=getScores().filter(s=>s.id!==id); setScores(filtered); closeOverlay(); showHighScores(); refreshHigh();
      }, secondaryText:"Cancel"});
    };
  });
  const demo=$("restoreDemo"); if(demo){ demo.onclick=()=>{ seedDemoScores(true); closeOverlay(); showHighScores(); refreshHigh(); }; }
}
els.highScoreBtn.addEventListener('click', showHighScores);
els.highScoreBtnOver.addEventListener('click', showHighScores);

let misses=0,total=0,current=null,attempt=1;
function updateLetters(){
  const spans=[...els.letters.children];
  spans.forEach((s,i)=>s.classList.toggle('lost', i<misses));
}

els.editLevel.addEventListener('click',()=>{
  let html="<div class='list'>";
  for(let i=1;i<=10;i++){
    html+=`<button class="list-item row" data-level="${i}"><span>Level ${i} • ${LEVEL_DESC[i]}</span>${i===STATE.level?'<span class="muted">current</span>':''}</button>`;
  }
  html+="</div>";
  openOverlay("Difficulty", html);
  els.overlayBody.querySelectorAll('[data-level]').forEach(btn=>{
    btn.onclick=()=>{ STATE.level=parseInt(btn.dataset.level,10); saveState(STATE); renderLevel(); closeOverlay(); };
  });
});
function renderLevel(){ $("levelNum").textContent=STATE.level; $("levelDesc").textContent=LEVEL_DESC[STATE.level]; }

const RULES={
  GRIND_OK:new Set(["rail","handrail","flatbar","ledge","hubba"]),
  SLIDE_OK:new Set(["ledge","hubba","rail","handrail","flatbar"]),
  AIR_OK:new Set(["flat","gap","kicker","quarterpipe","bank","stair"]),
};
const BASE_POINTS = {
  stance:{regular:0, fakie:0.1, nollie:0.2, switch:0.3},
  spin:{180:0.2, 360:0.4, 540:0.6, 720:0.8},
  flip:{"kickflip":0.3,"heelflip":0.35,"hardflip":0.55,"varial kickflip":0.45,"varial heelflip":0.5,"tre flip":0.8,"laser flip":0.85},
  grind_slide:{"50-50":0.3,"5-0":0.4,"boardslide":0.4,"crooked":0.65,"nosegrind":0.7,"bluntslide":0.85,"noseblunt":0.9},
  obstacle:{"flat":0,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"quarterpipe":0.4,"bank":0.25,"stair":0.45,"manual pad":0.1}
};
const COMBO_BONUSES={ flip_into_grind:0.25, spin_plus_flip:0.2, spin_into_grind:0.15 };
function computeScore(c,a){
  let s=1.0;
  if(c.stance){ s+=BASE_POINTS.stance[c.stance]||0; }
  if(c.spin){ s+=BASE_POINTS.spin[c.spin]||0; }
  if(c.flip){ s+=BASE_POINTS.flip[c.flip]||0; }
  if(c.grind_slide){ s+=BASE_POINTS.grind_slide[c.grind_slide]||0; }
  if(c.obstacle){ s+=BASE_POINTS.obstacle[c.obstacle]||0; }
  let bonus=0;
  if(c.flip&&c.grind_slide) bonus+=COMBO_BONUSES.flip_into_grind;
  if(c.spin&&c.flip) bonus+=COMBO_BONUSES.spin_plus_flip;
  if(c.spin&&c.grind_slide) bonus+=COMBO_BONUSES.spin_into_grind;
  s*=(1+bonus);
  const mult={1:1.00,2:0.85,3:0.75}[a]||1.0;
  const final=Math.max(0.1, s*mult);
  return {final, breakdown:[["base",s.toFixed(2)],["attempt",`${a} => x${mult}`]]};
}
function attemptText(){ const rep=computeScore(current,attempt); return `This attempt: ${rep.final.toFixed(2)} pts`; }

function pickObstacle(){ const list=STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:DEFAULTS.obstacles; return list[Math.floor(Math.random()*list.length)]; }
function stancePool(){ return Object.keys(STATE.stances).filter(k=>STATE.stances[k] && k!=="regular"); }
function generateTrick(){
  const ob=pickObstacle();
  const allowFlips=STATE.categories.flips;
  const allowGrinds=STATE.categories.grinds && (RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob));
  const allowSpins=STATE.categories.spins;
  const parts={obstacle:ob};
  const pool=stancePool(); if(Math.random()<0.2 && pool.length) parts.stance=pool[Math.floor(Math.random()*pool.length)];
  const patterns=[];
  if(allowGrinds) patterns.push("grindOnly","flipToGrind");
  if(allowFlips) patterns.push("flipOnly");
  if(!patterns.length) patterns.push("flipOnly");
  const pat=patterns[Math.floor(Math.random()*patterns.length)];
  if(pat==="flipToGrind"){
    const flips=Object.keys(STATE.flips).filter(k=>STATE.flips[k]);
    const grs=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]);
    parts.flip=flips.length?flips[Math.floor(Math.random()*flips.length)]:null;
    parts.grind_slide=grs.length?grs[Math.floor(Math.random()*grs.length)]:null;
  } else if(pat==="grindOnly"){
    const grs=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]);
    parts.grind_slide=grs.length?grs[Math.floor(Math.random()*grs.length)]:null;
  } else {
    const flips=Object.keys(STATE.flips).filter(k=>STATE.flips[k]);
    parts.flip=flips.length?flips[Math.floor(Math.random()*flips.length)]:null;
    if(allowSpins){ const spins=Object.keys(STATE.spins).filter(k=>STATE.spins[k]==true).map(Number); if(spins.length && Math.random()<0.4) parts.spin=spins[Math.floor(Math.random()*spins.length)]; }
  }
  if(parts.grind_slide && !(RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))){ parts.grind_slide=null; }
  if(!parts.flip && !parts.grind_slide){ parts.flip="kickflip"; parts.obstacle="flat"; }
  return parts;
}
function describe(c){
  const railish=["rail","handrail","flatbar"].includes(c.obstacle);
  const out=[];
  if(c.stance && c.stance!=="regular") out.push(c.stance);
  if(c.spin) out.push(String(c.spin));
  if(c.flip && !c.grind_slide && railish) return `${out.concat([c.flip,'over',c.obstacle]).join(' ')}`;
  if(c.flip) out.push(c.flip);
  if(c.grind_slide) out.push(c.grind_slide);
  if(c.obstacle) out.push(`on ${c.obstacle}`);
  return out.join(' ');
}

function setView(which){
  els.viewSetup.classList.toggle('active',which==="setup"); els.viewSetup.classList.toggle('hidden',which!=="setup");
  els.viewGame.classList.toggle('active',which==="game"); els.viewGame.classList.toggle('hidden',which!=="game");
  els.viewOver.classList.toggle('active',which==="over"); els.viewOver.classList.toggle('hidden',which!=="over");
}
function resetSession(){ misses=0; total=0; attempt=1; updateLetters(); }
function startSession(){ resetSession(); setView("game"); nextTrick(true); }
els.startBtn.addEventListener('click', startSession);
els.restartBtn.addEventListener('click', ()=>{ setView("setup"); });
els.endBtn.addEventListener('click', ()=>{
  openOverlay("End session?", "<p>Are you sure you want to end this session?</p>", {primary:"Yes, end", onPrimary:()=>{ closeOverlay(); endSession(); }, secondaryText:"Cancel"});
});

function updateAttemptUI(){
  els.attemptBadge.textContent=`Attempt ${attempt}/3`;
  els.attemptPoints.textContent=attemptText();
}
function nextTrick(first=false){
  attempt=1;
  current=generateTrick();
  els.trickText.textContent=describe(current) || "kickflip on flat";
  updateAttemptUI();
  els.nextBtn.classList.add('hidden');
  $("skipBtn").disabled=false; $("missBtn").disabled=false; $("landBtn").disabled=false;
  $("skipBtn").classList.remove('hidden'); $("missBtn").classList.remove('hidden'); $("landBtn").classList.remove('hidden');
}
$("skipBtn").addEventListener('click', ()=>{ nextTrick(false); });
$("missBtn").addEventListener('click', ()=>{
  if(attempt<3){ attempt++; updateAttemptUI(); return; }
  misses++; updateLetters();
  els.nextBtn.classList.remove('hidden');
  $("skipBtn").classList.add('hidden'); $("missBtn").classList.add('hidden'); $("landBtn").classList.add('hidden');
});
$("landBtn").addEventListener('click', ()=>{
  const rep=computeScore(current,attempt);
  total+=rep.final;
  openOverlay("Attempt Score Breakdown", `<pre style="white-space:pre-wrap">Final: ${rep.final.toFixed(2)} pts</pre>`);
  els.nextBtn.classList.remove('hidden');
  $("skipBtn").classList.add('hidden'); $("missBtn").classList.add('hidden'); $("landBtn").classList.add('hidden');
});
els.nextBtn.addEventListener('click', ()=>{
  if(misses>=5){ endSession(); return; }
  closeOverlay();
  nextTrick(false);
});

els.attemptPoints.addEventListener('click', ()=>{
  const rep=computeScore(current,attempt);
  openOverlay("Attempt Score Breakdown", `<pre style="white-space:pre-wrap">Final: ${rep.final.toFixed(2)} pts</pre>`);
});

function endSession(){
  setView("over");
  $("finalScore").textContent=total.toFixed(2);
  addScore(STATE.nickname||"Player", total);
  refreshHigh();
}

function renderSummaries(){
  $("obsNames").textContent=(STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:["flat"]).join(", ");
  $("stanceNames").textContent=Object.keys(STATE.stances).filter(k=>STATE.stances[k]).join(", ");
  const f=Object.keys(STATE.flips).filter(k=>STATE.flips[k]).length;
  const g=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]).length;
  const s=Object.keys(STATE.spins).filter(k=>STATE.spins[k]).length;
  $("trickSummary").textContent=`${Object.entries(STATE.categories).filter(([k,v])=>v).map(([k])=>k).join("/")||"—"} • F:${f} G:${g} S:${s}`;
}

function seedDemoScores(force=false){
  if(!force && getScores().length) return;
  const demo=[3420,3315,3290,3100,2980,2875,2700,2580,2440,2305];
  setScores(demo.map((v,i)=>({id:String(Date.now()+i),nickname:["Jax","Leni","Christopher “Kickflip King” Thompson","Z","Nova","Kai","Rae","Amar","Jo","Ash"][i],value:v,created_at:Date.now()-i*10000})));
}
seedDemoScores(false);

function init(){
  renderLevel();
  renderSummaries();
  refreshHigh();
  updateLetters();
  $("titleText").addEventListener('click', ()=>location.reload());
}
init();

if('serviceWorker'in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js')); }
console.log("Brainlock loaded", VERSION);
