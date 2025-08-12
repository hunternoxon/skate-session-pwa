const VERSION="0.5.7b";
const DEFAULTS={level:6,categories:{flips:true,grinds:true,manuals:true,airs:true,spins:true},stances:{regular:true,switch:true,nollie:true,fakie:true},
flips:{"kickflip":true,"heelflip":true,"varial kickflip":true,"hardflip":true,"tre flip":true,"360 flip":true,"laser flip":true,"inward heelflip":true,"bigspin flip":true},
grinds:{"50-50":true,"5-0":true,"boardslide":true,"noseslide":true,"tailslide":true,"lipslide":true,"smith":true,"feeble":true,"crooked":true,"nosegrind":true,"noseblunt":true,"bluntslide":true},
spins:{"180":true,"360":true,"540":true,"720":false},
obstacles:["flat","ledge","rail","handrail","flatbar","hubba","kicker","gap","bank","quarterpipe"]};
const LEVEL_DESC={1:"Beginner",2:"Basic",3:"Park flow",4:"Consistent am",5:"Local ripper",6:"Advanced am",7:"Sponsored",8:"Pro",9:"Top pro",10:"Ender-only"};
let STATE;try{STATE=JSON.parse(localStorage.getItem('bl_state'))||DEFAULTS}catch{STATE=DEFAULTS}
function saveState(s){localStorage.setItem('bl_state',JSON.stringify(s))}
function getScores(){try{return JSON.parse(localStorage.getItem('bl_scores')||"[]")}catch{return[]}}
function setScores(a){localStorage.setItem('bl_scores',JSON.stringify(a))}
function bestScore(){const s=getScores();return s.length?Math.max(...s.map(x=>x.value)):0}
function isAdmin(){return localStorage.getItem('bl_admin')==="1"}function setAdmin(on){localStorage.setItem('bl_admin',on?"1":"0")}
// 0.5.7b safe-boot markers + error banner
window.__blSafeBoot = true;
document.documentElement.classList.add('js-ok');
window.onerror = function(msg, src, line, col, err){
  const b = document.getElementById('errBanner');
  if(!b) return;
  b.classList.remove('hidden');
  b.textContent = 'JS Error: ' + msg + ' @ ' + (src||'inline') + ':' + line;
  document.documentElement.classList.remove('js-ok');
};


const $=id=>document.getElementById(id);
const els={title:$('titleText'),settingsBtn:$('settingsBtn'),levelPill:$('levelPill'),levelVal:$('levelVal'),levelDesc:$('levelDesc'),editLevel:$('editLevel'),
goToggle:$('goToggle'),goBody:document.querySelector('.go-body'),obsSummary:$('obsSummary'),stanceSummary:$('stanceSummary'),trickSummary:$('trickSummary'),
letters:$('letters'),scoreLine:$('scoreLine'),openHigh:$('openHigh'),openHigh2:$('openHigh2'),
startBtn:$('startBtn'),viewSetup:$('viewSetup'),viewGame:$('viewGame'),viewOver:$('viewOver'),
attemptBadge:$('attemptBadge'),openAttempt:$('openAttempt'),trickText:$('trickText'),
skipBtn:$('skipBtn'),missBtn:$('missBtn'),landBtn:$('landBtn'),nextBtn:$('nextBtn'),
endBtn:$('endBtn'),finalScore:$('finalScore'),restartBtn:$('restartBtn'),
overlay:$('overlay'),modalTitle:$('modalTitle'),modalBody:$('modalBody'),modalClose:$('modalClose'),
confirm:$('confirm'),confirmYes:$('confirmYes'),confirmNo:$('confirmNo'),
settings:$('settings'),settingsClose:$('settingsClose'),nickInput:$('nickInput'),adminToggle:$('adminToggle'),clearCache:$('clearCache'),
editObs:$('editObs'),editStance:$('editStance'),editTricks:$('editTricks')};

els.title.addEventListener('click',()=>location.reload());

function renderLevel(){els.levelVal.textContent=STATE.level;els.levelDesc.textContent=LEVEL_DESC[STATE.level]||""}
function renderSummaries(){
  els.obsSummary.textContent=(STATE.obstacles||[]).join(", ")||"—";
  const st=Object.keys(STATE.stances).filter(k=>STATE.stances[k]);
  els.stanceSummary.textContent=st.join(", ")||"—";
  const cats=Object.entries(STATE.categories).filter(([k,v])=>v).map(([k])=>k).join("/");
  const f=Object.keys(STATE.flips).filter(k=>STATE.flips[k]).length;
  const g=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]).length;
  const s=Object.keys(STATE.spins).filter(k=>STATE.spins[k]).length;
  els.trickSummary.textContent=(cats?cats:"—")+` • F:${f} G:${g} S:${s}`;
  const high=bestScore(); [els.openHigh,els.openHigh2].forEach(b=>{if(b)b.textContent=`${high} pts`});
}
function showModal(node){node.classList.remove('hidden');node.setAttribute('aria-hidden','false')}
function hideModal(node){node.classList.add('hidden');node.setAttribute('aria-hidden','true')}

function openOverlay(title,html){els.modalTitle.textContent=title;els.modalBody.innerHTML=html;showModal(els.overlay)}
function closeOverlay(){hideModal(els.overlay)} els.modalClose.addEventListener('click',closeOverlay)
function setNextVisible(on){
  els.nextBtn.classList.toggle('hidden', !on);
  [els.skipBtn, els.missBtn, els.landBtn].forEach(b=> b.classList.toggle('is-hidden', on));
}


function buildObsOverlay(){
  const all=["flat","curb","ledge","rail","handrail","flatbar","hubba","manual pad","box","kicker","gap","bank","quarterpipe","stair","funbox"];
  const set=new Set(STATE.obstacles||[]); let html='<div class="list">';
  for(const o of all){html+=`<label><input type="checkbox" data-o="${o}" ${set.has(o)?"checked":""}/> ${o}</label>`}
  html+='</div>';return html;
}
function wireObsOverlay(){els.modalBody.querySelectorAll('input[type=checkbox]').forEach(cb=>{cb.onchange=()=>{
  const o=cb.dataset.o;const set=new Set(STATE.obstacles||[]); if(cb.checked)set.add(o);else set.delete(o); STATE.obstacles=Array.from(set); saveState(STATE); renderSummaries();
}})}

function buildStanceOverlay(){let html='<div class="list">'; for(const k of ["regular","switch","nollie","fakie"]){html+=`<label><input type="checkbox" data-k="${k}" ${STATE.stances[k]?"checked":""}/> ${k}</label>`} html+='</div>';return html}
function wireStanceOverlay(){els.modalBody.querySelectorAll('input[type=checkbox]').forEach(cb=>{cb.onchange=()=>{const k=cb.dataset.k;STATE.stances[k]=cb.checked;saveState(STATE);renderSummaries();}})}

function buildTricksOverlay(){
  const cats=[["flips","Flips"],["grinds","Grinds/Slides"],["spins","Spins"],["manuals","Manuals"],["airs","Airs"]];
  let html='<div class="list">';
  for(const [k,label] of cats){
    html+=`<label class="cat"><input class="cat" type="checkbox" data-cat="${k}" ${STATE.categories[k]?"checked":""}/> ${label}</label>`;
    if(STATE.categories[k]){
      if(k==="flips"){ html+='<div class="list sub">'; for(const n of Object.keys(STATE.flips)){html+=`<label><input type="checkbox" data-flip="${n}" ${STATE.flips[n]?"checked":""}/> ${n}</label>`} html+='</div>'; }
      if(k==="grinds"){ html+='<div class="list sub">'; for(const n of Object.keys(STATE.grinds)){html+=`<label><input type="checkbox" data-grind="${n}" ${STATE.grinds[n]?"checked":""}/> ${n}</label>`} html+='</div>'; }
      if(k==="spins"){ html+='<div class="list sub">'; for(const n of Object.keys(STATE.spins)){html+=`<label><input type="checkbox" data-spin="${n}" ${STATE.spins[n]?"checked":""}/> ${n}</label>`} html+='</div>'; }
    }
  }
  html+='</div>'; return html;
}
function wireTricksOverlay(){
  els.modalBody.querySelectorAll('input[data-cat]').forEach(cb=>{cb.onchange=()=>{
    const k=cb.dataset.cat; STATE.categories[k]=cb.checked;
    if(!cb.checked){ if(k==="flips"){for(const n of Object.keys(STATE.flips))STATE.flips[n]=false}
                     if(k==="grinds"){for(const n of Object.keys(STATE.grinds))STATE.grinds[n]=false}
                     if(k==="spins"){for(const n of Object.keys(STATE.spins))STATE.spins[n]=false} }
    saveState(STATE); openOverlay("Tricks",buildTricksOverlay()); wireTricksOverlay(); renderSummaries();
  }});
  els.modalBody.querySelectorAll('input[data-flip]').forEach(cb=>{cb.onchange=()=>{STATE.flips[cb.dataset.flip]=cb.checked;saveState(STATE);renderSummaries();}});
  els.modalBody.querySelectorAll('input[data-grind]').forEach(cb=>{cb.onchange=()=>{STATE.grinds[cb.dataset.grind]=cb.checked;saveState(STATE);renderSummaries();}});
  els.modalBody.querySelectorAll('input[data-spin]').forEach(cb=>{cb.onchange=()=>{STATE.spins[cb.dataset.spin]=cb.checked;saveState(STATE);renderSummaries();}});
}

$('editObs').onclick=()=>{openOverlay("Obstacles",buildObsOverlay());wireObsOverlay()}
$('editStance').onclick=()=>{openOverlay("Stances",buildStanceOverlay());wireStanceOverlay()}
$('editTricks').onclick=()=>{openOverlay("Tricks",buildTricksOverlay());wireTricksOverlay()}

els.goToggle.addEventListener('click',()=>{
  const willShow=els.goBody.classList.contains('hidden'); els.goBody.classList.toggle('hidden'); els.goToggle.textContent=willShow?"▲":"▼"; els.goToggle.setAttribute('aria-expanded',String(willShow));
});

els.settingsBtn.addEventListener('click',()=>{els.nickInput.value=localStorage.getItem('bl_nick')||"";els.adminToggle.checked=isAdmin();showModal(els.settings)});
els.settingsClose.addEventListener('click',()=>hideModal(els.settings));
els.nickInput.addEventListener('change',()=>localStorage.setItem('bl_nick',els.nickInput.value.trim()));
els.adminToggle.addEventListener('change',()=>setAdmin(els.adminToggle.checked));
$('viewRules').addEventListener('click',()=>{openOverlay("Game Rules","<ul><li>Land tricks to score points.</li><li>3 attempts per trick with diminishing multipliers.</li><li>Five letters = SKATE → session ends.</li></ul>")});
$('clearCache').addEventListener('click',async()=>{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))} if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))} location.reload()});

els.editLevel.addEventListener('click',()=>{
  let html='<div class="list">'; for(let i=1;i<=10;i++){html+=`<button class="list-item" data-l="${i}">${i} • ${LEVEL_DESC[i]}</button>`} html+='</div>';
  openOverlay("Difficulty",html);
  els.modalBody.querySelectorAll('[data-l]').forEach(b=>{b.onclick=()=>{STATE.level=parseInt(b.dataset.l,10);saveState(STATE);renderLevel();closeOverlay();}});
});

function renderHighScores(){
  const scores=getScores().sort((a,b)=>b.value-a.value).slice(0,10);
  let html='<ol class="list">'; for(const s of scores){const name=s.nickname||"—"; const del=isAdmin()?` <button class="ghost small" data-del="${s.id}">🗑️</button>`:""; html+=`<li class="list-item">${name} — ${s.value} pts${del}</li>`} html+=scores.length?"":"<div class='muted'>No scores yet. Land something!</div>"; html+='</ol>';
  openOverlay("High Scores",html);
  if(isAdmin()){els.modalBody.querySelectorAll('[data-del]').forEach(btn=>{btn.onclick=()=>{if(!confirm("Remove this score?"))return;const id=btn.dataset.del;const next=getScores().filter(x=>x.id!==id);setScores(next);renderHighScores();renderSummaries();};})}
}
$('openHigh').addEventListener('click',renderHighScores);
$('openHigh2').addEventListener('click',renderHighScores);

/* Trick + Scoring */
const RULES={GRIND_OK:new Set(["rail","handrail","flatbar","ledge","hubba"]),SLIDE_OK:new Set(["ledge","hubba","rail","handrail","flatbar","curb","box"]),
MANUAL_OK:new Set(["manual pad","box","funbox","kicker","bank"]),AIR_OK:new Set(["flat","gap","kicker","quarterpipe","bank","stair","funbox"]),
DIRECTION_DEFAULTS:{"50-50":"frontside","5-0":"frontside","boardslide":"backside","noseslide":"backside","lipslide":"frontside","tailslide":"frontside","bluntslide":"backside","nosegrind":"frontside","crooked":"backside","smith":"backside","feeble":"backside","noseblunt":"frontside"}};
const BASE={stance:{regular:0,switch:0.3,nollie:0.2,fakie:0.1},spin:{180:0.2,360:0.4,540:0.6,720:0.8},
flip:{"kickflip":0.3,"heelflip":0.35,"varial kickflip":0.45,"hardflip":0.55,"tre flip":0.8,"360 flip":0.8,"laser flip":0.85,"inward heelflip":0.6,"bigspin flip":0.6},
grind:{"50-50":0.3,"5-0":0.4,"boardslide":0.4,"noseslide":0.45,"tailslide":0.5,"lipslide":0.55,"smith":0.65,"feeble":0.65,"crooked":0.65,"nosegrind":0.7,"noseblunt":0.9,"bluntslide":0.85},
manual:{"manual":0.25},obstacle:{"flat":0,"manual pad":0.1,"box":0.1,"curb":0.15,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"kicker":0.1,"stair":0.45,"quarterpipe":0.4,"bank":0.25,"funbox":0.2}};
const BONUS={flip_into_grind:0.25,spin_plus_flip:0.2,spin_into_grind:0.15,manual_combo:0.1}; const ATTEMPT={1:1,2:0.85,3:0.75};

let current=null,attempt=1,misses=0,total=0;
function stancePool(){return Object.keys(STATE.stances).filter(k=>STATE.stances[k])}
function allowedSpins(){return Object.keys(STATE.spins).filter(k=>STATE.spins[k]).map(Number)}
function allowedFlips(){return Object.keys(STATE.flips).filter(k=>STATE.flips[k])}
function allowedGrinds(){return Object.keys(STATE.grinds).filter(k=>STATE.grinds[k])}
function pickObstacle(){const src=(STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:["flat"]);return src[Math.floor(Math.random()*src.length)]}
function isRail(o){return ["rail","handrail","flatbar"].includes(o)}
function pickStanceBySettings(){
  const pool=stancePool();
  if(!pool.length) return null;
  const nonRegular=pool.filter(s=>s!=="regular");
  if(!STATE.stances.regular && nonRegular.length){ return nonRegular[Math.floor(Math.random()*nonRegular.length)] }
  if(pool.length===1){ return pool[0] }
  if(nonRegular.length && Math.random()<0.5){ return nonRegular[Math.floor(Math.random()*nonRegular.length)] }
  return null;
}


function generateTrick(){
  const ob=pickObstacle(); 
  const pools={spins:allowedSpins(),flips:allowedFlips(),grinds:allowedGrinds()};
  const parts={obstacle:ob};

  const chosenStance = pickStanceBySettings();
  if(chosenStance) parts.stance = chosenStance;

  const canGrind=(STATE.categories.grinds&&(RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob)))&&pools.grinds.length;
  const canManual=(STATE.categories.manuals&&RULES.MANUAL_OK.has(ob));
  const canAir=(STATE.categories.airs&&(RULES.AIR_OK.has(ob)||isRail(ob)));
  const canFlip=(STATE.categories.flips&&pools.flips.length);

  const patterns=[]; 
  if(canGrind)patterns.push("flipToGrind","grindOnly");
  if(canManual)patterns.push("manualOnly");
  if(canAir&&canFlip)patterns.push("flipOnly");
  if(!patterns.length&&canFlip)patterns.push("flipOnly");
  if(!patterns.length)patterns.push("manualOnly");

  for(let tries=0; tries<12; tries++){
    const pat=patterns[Math.floor(Math.random()*patterns.length)];
    let temp={...parts};

    if(STATE.categories.spins&&pools.spins.length&&Math.random()<0.2){temp.spin=pools.spins[Math.floor(Math.random()*pools.spins.length)]}
    if(pat==="flipOnly"){ if(canFlip){ temp.flip=pools.flips[Math.floor(Math.random()*pools.flips.length)] } }
    else if(pat==="grindOnly"){ if(canGrind){ const g=pools.grinds[Math.floor(Math.random()*pools.grinds.length)]; temp.grind=g; temp.direction=RULES.DIRECTION_DEFAULTS[g]||"frontside" } }
    else if(pat==="flipToGrind"){ if(canGrind && canFlip){ const g=pools.grinds[Math.floor(Math.random()*pools.grinds.length)]; temp.grind=g; temp.direction=RULES.DIRECTION_DEFAULTS[g]||"frontside"; temp.flip=pools.flips[Math.floor(Math.random()*pools.flips.length)] } }
    else if(pat==="manualOnly"){ if(canManual){ temp.manual="manual" } }

    if(temp.grind){
      const slide=["boardslide","noseslide","tailslide","lipslide","bluntslide"].includes(temp.grind);
      if(slide && !RULES.SLIDE_OK.has(ob)) temp.grind=null;
      if(!slide && !(RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))) temp.grind=null;
    }
    if(temp.flip&&!temp.grind&&!temp.manual){ if(!(RULES.AIR_OK.has(ob)||isRail(ob))) temp.flip=null }

    if(temp.flip||temp.grind||temp.manual){
      return temp;
    }
  }

  if(STATE.categories.flips && pools.flips.length){ return {obstacle: RULES.AIR_OK.has(ob)?ob:"flat", flip: pools.flips[0], stance: parts.stance} }
  if(STATE.categories.manuals){ return {obstacle: "manual pad", manual: "manual", stance: parts.stance} }
  if(STATE.categories.grinds && pools.grinds.length){ const g=pools.grinds[0]; return {obstacle: (RULES.SLIDE_OK.has("rail")?"rail":"ledge"), grind:g, direction: RULES.DIRECTION_DEFAULTS[g]||"frontside", stance: parts.stance} }
  return {obstacle:"flat", flip:"kickflip", stance: parts.stance};
}}
function describe(c){
  const isRailObs=["rail","handrail","flatbar"].includes(c.obstacle); const parts=[];
  if(c.flip&&!c.grind&&!c.manual&&isRailObs){parts.push(c.flip,"over",c.obstacle);return parts.join(" ")}
  if(c.stance)parts.push(c.stance); if(c.spin)parts.push(String(c.spin)); if(c.flip)parts.push(c.flip);
  if(c.direction&&c.grind)parts.push(`${c.direction} ${c.grind}`); else if(c.grind)parts.push(c.grind);
  if(c.manual)parts.push(c.manual); if(c.obstacle)parts.push(`on ${c.obstacle}`); return parts.join(" ");
}

function computeScore(c,att){
  let s=1.0,bd=[]; const st=c.stance||"regular"; s+=BASE.stance[st]||0; bd.push(["stance",st,BASE.stance[st]||0]);
  if(c.spin){s+=BASE.spin[c.spin]||0; bd.push(["spin",c.spin,BASE.spin[c.spin]||0])}
  if(c.flip){s+=BASE.flip[c.flip]||0; bd.push(["flip",c.flip,BASE.flip[c.flip]||0])}
  if(c.grind){s+=BASE.grind[c.grind]||0; bd.push(["grind",c.grind,BASE.grind[c.grind]||0])}
  if(c.manual){s+=BASE.manual[c.manual]||0; bd.push(["manual",c.manual,BASE.manual[c.manual]||0])}
  if(c.obstacle){s+=BASE.obstacle[c.obstacle]||0; bd.push(["obstacle",c.obstacle,BASE.obstacle[c.obstacle]||0])}
  let bonus=0; if(c.flip&&c.grind)bonus+=BONUS.flip_into_grind; if(c.flip&&c.spin)bonus+=BONUS.spin_plus_flip; if(c.spin&&c.grind)bonus+=BONUS.spin_into_grind; if(c.manual&&(c.flip||c.spin))bonus+=BONUS.manual_combo;
  const base=Math.max(0.1,s)*(1+bonus); const mult=ATTEMPT[att]||1; return {final:+(base*mult).toFixed(2),breakdown:bd,bonus,mult,base:+base.toFixed(2)};
}

function setView(v){
  els.viewSetup.classList.toggle('hidden',v!=="setup"); els.viewSetup.classList.toggle('active',v==="setup");
  els.viewGame.classList.toggle('hidden',v!=="game"); els.viewGame.classList.toggle('active',v==="game");
  els.viewOver.classList.toggle('hidden',v!=="over"); els.viewOver.classList.toggle('active',v==="over");
  if(v==="setup"){els.scoreLine.innerHTML='High Score: <button id="openHigh" class="link small">'+bestScore()+' pts</button>'; $('openHigh').onclick=renderHighScores}
  if(v==="game"){els.scoreLine.textContent='Total Score: '+total+' pts'}
}
function updateLetters(){[...els.letters.children].forEach((s,i)=>s.classList.toggle('lost',i<misses))}
function startSession(){misses=0;total=0;attempt=1;updateLetters();setView("game");nextTrick(true)}
els.startBtn.addEventListener('click',startSession);

function nextTrick(){attempt=1;current=generateTrick();els.trickText.textContent=describe(current)||"kickflip on flat";updateAttemptUI();setNextVisible(false);els.skipBtn.disabled=false;els.missBtn.disabled=false;els.landBtn.disabled=false;els.scoreLine.textContent='Total Score: '+total+' pts'}
function updateAttemptUI(){els.attemptBadge.textContent=`Attempt ${attempt}/3`;const rep=computeScore(current,attempt);els.openAttempt.textContent=`This attempt: ${rep.final} pts`}
els.openAttempt.addEventListener('click',()=>{const rep=computeScore(current,attempt);let lines=`Base: ${rep.base} \nCombo x${(1+rep.bonus).toFixed(2)} \nAttempt x${rep.mult} => Final: ${rep.final} pts \n\nBreakdown:\n`;for(const [k,n,p] of rep.breakdown){lines+=` + ${k}: ${n} = ${p}\n`} openOverlay("Attempt Score Breakdown",`<pre>${lines}</pre>`)});

function settle(hit){
  if(hit){const rep=computeScore(current,attempt);total=+(total+rep.final).toFixed(2);els.scoreLine.textContent='Total Score: '+total+' pts';setNextVisible(true);els.skipBtn.disabled=true;els.missBtn.disabled=true;els.landBtn.disabled=true}
  else{if(attempt<3){attempt++;updateAttemptUI()}else{misses++;updateLetters();if(misses>=5){endSession();return}setNextVisible(true);els.skipBtn.disabled=true;els.missBtn.disabled=true;els.landBtn.disabled=true}}
}
els.landBtn.addEventListener('click',()=>settle(true));
els.missBtn.addEventListener('click',()=>settle(false));
els.skipBtn.addEventListener('click',()=>{els.nextBtn.classList.add('hidden');nextTrick()});
els.nextBtn.addEventListener('click',()=>nextTrick());

function endSession(){ $('finalScore').textContent=total+' pts'; const arr=getScores(); const nick=(localStorage.getItem('bl_nick')||"").trim(); arr.push({id:String(Date.now()),value:total,nickname:nick,created_at:Date.now()}); setScores(arr.sort((a,b)=>b.value-a.value).slice(0,100)); renderSummaries(); setView("over")}
els.endBtn.addEventListener('click',()=>{ if(total<=0){setView("setup");return} showModal(els.confirm)});
els.confirmNo.addEventListener('click',()=>hideModal(els.confirm));
els.confirmYes.addEventListener('click',()=>{hideModal(els.confirm);endSession()});
els.restartBtn.addEventListener('click',()=>setView("setup"));

renderLevel();renderSummaries();setView("setup");updateLetters();
// v0.5.7a: force-hide all modals at boot to avoid any invisible overlay blocking taps
;['overlay','confirm','settings'].forEach(id=>{
  const m=document.getElementById(id);
  if(m){ m.classList.add('hidden'); m.setAttribute('aria-hidden','true'); }
});


// SW disabled in 0.5.7b safe-mode to avoid stale cache issues
/* if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'))} */
console.log("Brainlock loaded",VERSION);
