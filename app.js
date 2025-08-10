const VERSION="0.5.3"; const UPDATED="2025-08-10";
const DEFAULTS={"categories":{"flips":true,"grinds":true,"manuals":true,"airs":true,"spins":true},"stances":{"regular":true,"fakie":true,"nollie":true,"switch":true},"flips":{"kickflip":true,"heelflip":true,"varial kickflip":true,"varial heelflip":true,"hardflip":true,"inward heelflip":true,"bigspin flip":true,"bigspin heelflip":true,"tre flip":true,"360 flip":true,"laser flip":true},"grinds":{"50-50":true,"5-0":true,"boardslide":true,"noseslide":true,"tailslide":true,"lipslide":true,"smith":true,"feeble":true,"willy":true,"salad":true,"crooked":true,"overcrook":true,"nosegrind":true,"noseblunt":true,"bluntslide":true},"spins":{"180":true,"360":true,"540":true,"720":true},"obstacles":["flat","ledge","rail","manual pad","quarterpipe","bank","kicker"],"level":6,"nickname":""};
function loadState(){ try{ return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('bl_state')||"{}")); }catch{ return DEFAULTS; } }
function saveState(s){ localStorage.setItem('bl_state', JSON.stringify(s)); }
let STATE = loadState();
const $ = (id)=>document.getElementById(id);
const els = { "titleText":$('titleText'), "settingsBtn":$('settingsBtn'), "levelLabel":$('levelLabel'), "levelEdit":$('levelEdit'), "previewTray":$('previewTray'), "collapsePreview":$('collapsePreview'), "obsNames":$('obsNames'), "stanceNames":$('stanceNames'), "trickSummary":$('trickSummary'), "openObs":$('openObs'), "openStance":$('openStance'), "openTricks":$('openTricks'), "scoreModeSetup":$('scoreModeSetup'), "scoreModeActive":$('scoreModeActive'), "scoreModeOver":$('scoreModeOver'), "highScoreBtn":$('highScoreBtn'), "highScoreBtn2":$('highScoreBtn2'), "highScoreTop":$('highScoreTop'), "highScoreTop2":$('highScoreTop2'), "scoreActive":$('scoreActive'), "finalLeft":$('finalLeft'), "sheet":$('sheet'), "viewSetup":$('viewSetup'), "viewGame":$('viewGame'), "viewOver":$('viewOver'), "startBtn":$('startBtn'), "endBtn":$('endBtn'), "restartBtn":$('restartBtn'), "attemptBadge":$('attemptBadge'), "attemptPoints":$('attemptPoints'), "attemptPointsBtn":$('attemptPointsBtn'), "trickText":$('trickText'), "nextBtn":$('nextBtn'), "landBtn":$('landBtn'), "missBtn":$('missBtn'), "skipBtn":$('skipBtn'), "overlayBackdrop":$('overlayBackdrop'), "overlayBody":$('overlayBody'), "overlayClose":$('overlayClose'), "confirmBackdrop":$('confirmBackdrop'), "confirmYes":$('confirmYes'), "confirmCancel":$('confirmCancel'), "settingsModal":$('settingsModal'), "settingsClose":$('settingsClose'), "nickname":$('nickname'), "clearCache":$('clearCache'), "exportFeedback":$('exportFeedback') };
els.titleText.addEventListener('click', ()=>location.reload());
els.settingsBtn.addEventListener('click', ()=>{ els.settingsModal.classList.remove('hidden'); els.nickname.value=STATE.nickname||""; });
els.settingsClose.addEventListener('click', ()=>els.settingsModal.classList.add('hidden'));
els.nickname.addEventListener('change', ()=>{ STATE.nickname = els.nickname.value.trim(); saveState(STATE); });
function fmtPts(n){ return (n.toFixed(2)+" pts"); }
function setView(which){
  els.viewSetup.classList.toggle('active', which==="setup"); els.viewSetup.classList.toggle('hidden', which!=="setup");
  els.viewGame.classList.toggle('active', which==="game"); els.viewGame.classList.toggle('hidden', which!=="game");
  els.viewOver.classList.toggle('active', which==="over"); els.viewOver.classList.toggle('hidden', which!=="over");
  els.scoreModeSetup.classList.toggle('hidden', which!=="setup");
  els.scoreModeActive.classList.toggle('hidden', which!=="game");
  els.scoreModeOver.classList.toggle('hidden', which!=="over");
}
function getScores(){ try{ return JSON.parse(localStorage.getItem('bl_scores')||"[]"); }catch{ return []; } }
function pushScore(score){
  const list = getScores();
  list.push({score, name:STATE.nickname||"Guest", when:Date.now()});
  list.sort((a,b)=>b.score-a.score); localStorage.setItem('bl_scores', JSON.stringify(list.slice(0,50)));
}
function bestScore(){ const l=getScores(); return l.length? l[0].score : 0; }
function renderHighScorePills(){ const best=bestScore(); els.highScoreTop.textContent=fmtPts(best); els.highScoreTop2.textContent=fmtPts(best); }
function openHighScores(){
  const list=getScores().slice(0,10);
  const rows=list.map((r,i)=>"<div style='display:flex;justify-content:space-between'><div>#"+(i+1)+" — "+r.name+"</div><div>"+fmtPts(r.score)+"</div></div>").join('');
  els.overlayBody.innerHTML = "<h3>Top 10 High Scores</h3>"+(rows||"<p class='muted'>No scores yet.</p>");
  els.overlayBackdrop.classList.remove('hidden');
}
els.highScoreBtn.addEventListener('click', openHighScores);
els.highScoreBtn2.addEventListener('click', openHighScores);
function openOverlayFor(kind){
  if (kind==="obstacles"){
    const all=["flat","curb","ledge","flatbar","handrail","rail","hubba","kicker","gap","stair","quarterpipe","bank","mini ramp","funbox","manual pad","box"];
    els.overlayBody.innerHTML="<h3>Obstacles</h3><div class='chips'>"+all.map(o=>"<button data-o='"+o+"' class='"+(STATE.obstacles.includes(o)?"active":"")+"'>"+o+"</button>").join('')+"</div>";
    els.overlayBackdrop.classList.remove('hidden');
    els.overlayBody.querySelectorAll('button[data-o]').forEach(b=>b.onclick=()=>{ const o=b.dataset.o; STATE.obstacles=STATE.obstacles.includes(o)?STATE.obstacles.filter(x=>x!==o):STATE.obstacles.concat([o]); renderObsSummary(); saveState(STATE); b.classList.toggle('active'); });
  }
  if (kind==="stances"){
    const keys=["regular","fakie","nollie","switch"];
    els.overlayBody.innerHTML="<h3>Stances</h3><div class='chips'>"+keys.map(k=>"<button data-k='"+k+"' class='"+(STATE.stances[k]?"active":"")+"'>"+k+"</button>").join('')+"</div>";
    els.overlayBackdrop.classList.remove('hidden');
    els.overlayBody.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; STATE.stances[k]=!STATE.stances[k]; renderStanceSummary(); saveState(STATE); b.classList.toggle('active'); });
  }
  if (kind==="tricks"){
    function section(name,key,items){
      const enabled=STATE.categories[key];
      const chips = items.map(it=>"<label><input type='checkbox' data-group='"+key+"' data-key='"+it+"' "+(STATE[key][it]?"checked":"")+" "+(enabled?"":"disabled")+"/> "+it+"</label>").join('');
      return "<div class='list-item'><h4>"+name+"</h4><div class='chips'><button data-cat='"+key+"' class='"+(enabled?"active":"")+"'>"+(enabled?"On":"Off")+"</button></div><div class='panel'>"+chips+"</div></div>";
    }
    const flips=Object.keys(STATE.flips), grinds=Object.keys(STATE.grinds), spins=Object.keys(STATE.spins);
    els.overlayBody.innerHTML="<h3>Tricks</h3>"+section("Flips","flips",flips)+section("Grinds/Slides","grinds",grinds)+section("Spins","spins",spins);
    els.overlayBackdrop.classList.remove('hidden');
    els.overlayBody.querySelectorAll('button[data-cat]').forEach(b=>b.onclick=()=>{ const k=b.dataset.cat; STATE.categories[k]=!STATE.categories[k]; saveState(STATE); openOverlayFor("tricks"); renderTrickSummary(); });
    els.overlayBody.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.onchange=()=>{ const g=cb.dataset.group, k=cb.dataset.key; STATE[g][k]=cb.checked; saveState(STATE); renderTrickSummary(); });
  }
}
els.openObs.addEventListener('click', ()=>openOverlayFor("obstacles"));
els.openStance.addEventListener('click', ()=>openOverlayFor("stances"));
els.openTricks.addEventListener('click', ()=>openOverlayFor("tricks"));
els.overlayClose.addEventListener('click', ()=>els.overlayBackdrop.classList.add('hidden'));
els.overlayBackdrop.addEventListener('click', (e)=>{ if(e.target===els.overlayBackdrop) els.overlayBackdrop.classList.add('hidden'); });
const LEVEL_DESCS={1:"Basics",2:"Beginner",3:"Comfortable",4:"Intermediate",5:"Strong",6:"Sponsored",7:"Semi‑Pro",8:"Pro",9:"Enders",10:"Comically hard"};
function openLevelOverlay(){
  const grid = Array.from({length:10}, (_,i)=>i+1).map(n=>"<button data-l='"+n+"' class='ghost level-box "+(STATE.level===n?"active":"")+"'>"+n+"<div class='muted' style='font-size:12px'>"+LEVEL_DESCS[n]+"</div></button>").join('');
  els.overlayBody.innerHTML = "<h3>Difficulty</h3><div class='level-grid'>"+grid+"</div>";
  els.overlayBackdrop.classList.remove('hidden');
  els.overlayBody.querySelectorAll('button[data-l]').forEach(b=>b.onclick=()=>{ STATE.level=parseInt(b.dataset.l,10); saveState(STATE); renderLevelPill(); els.overlayBackdrop.classList.add('hidden'); });
}
els.levelEdit.addEventListener('click', openLevelOverlay);
els.collapsePreview.addEventListener('click', ()=>{ const c=els.previewTray.classList.toggle('collapsed'); els.collapsePreview.textContent=c?'▼':'▲'; });
function renderObsSummary(){ els.obsNames.textContent=(STATE.obstacles&&STATE.obstacles.length)?STATE.obstacles.join(", "):"—"; }
function renderStanceSummary(){ const on=Object.keys(STATE.stances).filter(k=>STATE.stances[k]); els.stanceNames.textContent=on.join(", ")||"—"; }
function renderTrickSummary(){ const cats=Object.entries(STATE.categories).filter(([k,v])=>v).map(([k])=>k).join("/"); const ef=Object.keys(STATE.flips).filter(k=>STATE.flips[k]).length; const eg=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]).length; const es=Object.keys(STATE.spins).filter(k=>STATE.spins[k]).length; els.trickSummary.textContent=(cats||"—")+" • F:"+ef+" G:"+eg+" S:"+es; }
function renderLevelPill(){ els.levelLabel.textContent = "Level: "+STATE.level+" • "+LEVEL_DESCS[STATE.level]; }
function renderAll(){ renderObsSummary(); renderStanceSummary(); renderTrickSummary(); renderLevelPill(); renderHighScorePills(); }
renderAll();
const RULES={ "GRIND_OK":new Set(["rail","handrail","flatbar","ledge","hubba"]), "SLIDE_OK":new Set(["ledge","hubba","rail","handrail","flatbar","curb","box"]), "MANUAL_OK":new Set(["manual pad","box","funbox","kicker","bank"]), "AIR_OK":new Set(["flat","gap","kicker","quarterpipe","bank","stair","funbox"]) };
function pickObstacle(){ const src=(STATE.obstacles&&STATE.obstacles.length?STATE.obstacles:DEFAULTS.obstacles); return src[Math.floor(Math.random()*src.length)]||"flat"; }
function generateTrick(){
  const ob=pickObstacle();
  const allowFlips=STATE.categories.flips && Object.values(STATE.flips).some(Boolean);
  const allowGrinds=STATE.categories.grinds && Object.values(STATE.grinds).some(Boolean);
  const allowManuals=STATE.categories.manuals;
  const patterns=[];
  if (allowGrinds && (RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))) patterns.push('grindOnly');
  if (allowManuals && RULES.MANUAL_OK.has(ob)) patterns.push('manualOnly');
  if (allowFlips && (RULES.AIR_OK.has(ob)||["rail","handrail","flatbar"].includes(ob))) patterns.push('flipOnly');
  if (allowFlips && allowGrinds && (RULES.GRIND_OK.has(ob)||RULES.SLIDE_OK.has(ob))) patterns.push('flipToGrind');
  let pat = patterns[Math.floor(Math.random()*patterns.length)];
  function randKey(obj){ const keys=Object.keys(obj).filter(k=>obj[k]); return keys[Math.floor(Math.random()*keys.length)]; }
  let res=null;
  for(let i=0;i<20;i++){
    if(!pat) break;
    if(pat==='flipOnly'){ const flip=randKey(STATE.flips)||"kickflip"; res={flip, obstacle:ob}; break; }
    if(pat==='grindOnly'){ const pool=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]); const g=pool[Math.floor(Math.random()*pool.length)]||"50-50"; res={grind_slide:g, obstacle:ob, direction:"frontside"}; break; }
    if(pat==='manualOnly'){ res={manual:"manual", obstacle:ob}; break; }
    if(pat==='flipToGrind'){ const flip=randKey(STATE.flips)||"kickflip"; const pool=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]); const g=pool[Math.floor(Math.random()*pool.length)]||"50-50"; res={flip, grind_slide:g, obstacle:ob, direction:"frontside"}; break; }
  }
  if(!res) res={flip:"kickflip", obstacle: RULES.AIR_OK.has(ob)?ob:"flat"};
  return res;
}
function describe(c){
  const rail=["rail","handrail","flatbar"].includes(c.obstacle);
  if(c.flip && !c.grind_slide && !c.manual && rail) return c.flip+" over "+c.obstacle;
  const parts=[];
  if(c.flip) parts.push(c.flip);
  if(c.direction && c.grind_slide) parts.push(c.direction+" "+c.grind_slide); else if(c.grind_slide) parts.push(c.grind_slide);
  if(c.manual) parts.push(c.manual);
  if(c.obstacle) parts.push("on "+c.obstacle);
  return parts.join(" ");
}
const BASE={ "flip":{"kickflip":0.3,"heelflip":0.35,"varial kickflip":0.45,"varial heelflip":0.5,"hardflip":0.55,"inward heelflip":0.6,"tre flip":0.8,"360 flip":0.8,"laser flip":0.85,"bigspin flip":0.6,"bigspin heelflip":0.65}, "grind_slide":{"50-50":0.3,"5-0":0.4,"boardslide":0.4,"noseslide":0.45,"tailslide":0.5,"lipslide":0.55,"smith":0.65,"feeble":0.65,"willy":0.55,"salad":0.6,"crooked":0.65,"overcrook":0.75,"nosegrind":0.7,"noseblunt":0.9,"bluntslide":0.85}, "manual":{"manual":0.25,"nose manual":0.35,"one wheel manual":0.6}, "obstacle":{"flat":0,"manual pad":0.1,"box":0.1,"curb":0.15,"ledge":0.25,"hubba":0.35,"flatbar":0.35,"rail":0.45,"handrail":0.55,"gap":0.5,"kicker":0.1,"stair":0.45,"quarterpipe":0.4,"bank":0.25,"funbox":0.2,"mini ramp":0.3} };
const BONUS={ "flip_to_grind":0.3 }, ATTEMPT={1:1.00,2:0.85,3:0.75};
function computeScore(c,a){
  let s=1.0;
  if(c.flip) s+=BASE.flip[c.flip]||0;
  if(c.grind_slide) s+=BASE.grind_slide[c.grind_slide]||0;
  if(c.manual) s+=BASE.manual[c.manual]||0;
  if(c.obstacle) s+=BASE.obstacle[c.obstacle]||0;
  if(c.flip && c.grind_slide) s*=(1+BONUS.flip_to_grind);
  const mult=ATTEMPT[a]||0;
  const base=Math.max(s,0.1);
  return {base, final:base*mult};
}
let current=null, attempt=1, total=0;
function updateAttemptUI(){
  els.attemptBadge.textContent="Attempt "+attempt+"/3";
  const rep=computeScore(current,attempt);
  els.attemptPoints.textContent=fmtPts(rep.final);
}
function startSession(){ total=0; attempt=1; setView("game"); els.scoreActive.textContent=fmtPts(total); nextTrick(true); }
function nextTrick(first){ attempt=1; current=generateTrick(); const text=describe(current)||"kickflip on flat"; els.trickText.textContent=text; updateAttemptUI(); els.nextBtn.classList.add('hidden'); ['skipBtn','missBtn','landBtn'].forEach(id=>els[id].classList.remove('hidden')); }
function settle(landed){
  if(landed){ const rep=computeScore(current,attempt); total+=rep.final; els.scoreActive.textContent=fmtPts(total); els.nextBtn.classList.remove('hidden'); ['skipBtn','missBtn','landBtn'].forEach(id=>els[id].classList.add('hidden')); }
  else { if(attempt<3){ attempt++; updateAttemptUI(); } else { els.nextBtn.classList.remove('hidden'); ['skipBtn','missBtn','landBtn'].forEach(id=>els[id].classList.add('hidden')); } }
}
function endSessionOver(){ setView("over"); els.finalLeft.textContent=fmtPts(total); pushScore(total); renderHighScorePills(); }
els.startBtn.addEventListener('click', startSession);
els.nextBtn.addEventListener('click', ()=>nextTrick(false));
els.landBtn.addEventListener('click', ()=>settle(true));
els.missBtn.addEventListener('click', ()=>settle(false));
els.skipBtn.addEventListener('click', ()=>nextTrick(false));
els.endBtn.addEventListener('click', ()=>{ $('confirmBackdrop').classList.remove('hidden'); });
els.confirmCancel.addEventListener('click', ()=>$('confirmBackdrop').classList.add('hidden'));
els.confirmYes.addEventListener('click', ()=>{ $('confirmBackdrop').classList.add('hidden'); endSessionOver(); });
els.attemptPointsBtn.addEventListener('click', ()=>{
  const rep=computeScore(current,attempt);
  els.overlayBody.innerHTML="<h3>Attempt Score Breakdown</h3><p>Trick: "+els.trickText.textContent+"</p><p>Base: "+rep.base.toFixed(2)+" pts</p><p>Attempt x"+ATTEMPT[attempt]+" → "+rep.final.toFixed(2)+" pts</p>";
  els.overlayBackdrop.classList.remove('hidden');
});
function refreshScoreMode(){ renderHighScorePills(); els.scoreActive.textContent=fmtPts(total); }
function renderAll(){ renderObsSummary(); renderStanceSummary(); renderTrickSummary(); renderLevelPill(); renderHighScorePills(); }
function renderObsSummary(){ els.obsNames.textContent=(STATE.obstacles&&STATE.obstacles.length)?STATE.obstacles.join(", "):"—"; }
function renderStanceSummary(){ const on=Object.keys(STATE.stances).filter(k=>STATE.stances[k]); els.stanceNames.textContent=on.join(", ")||"—"; }
function renderTrickSummary(){ const cats=Object.entries(STATE.categories).filter(([k,v])=>v).map(([k])=>k).join("/"); const ef=Object.keys(STATE.flips).filter(k=>STATE.flips[k]).length; const eg=Object.keys(STATE.grinds).filter(k=>STATE.grinds[k]).length; const es=Object.keys(STATE.spins).filter(k=>STATE.spins[k]).length; els.trickSummary.textContent=(cats||"—")+" • F:"+ef+" G:"+eg+" S:"+es; }
function renderLevelPill(){ els.levelLabel.textContent="Level: "+STATE.level+" • "+LEVEL_DESCS[STATE.level]; }
function init(){ renderAll(); refreshScoreMode(); setView("setup"); }
init();
els.overlayClose.addEventListener('click', ()=>els.overlayBackdrop.classList.add('hidden'));
els.overlayBackdrop.addEventListener('click', (e)=>{ if(e.target===els.overlayBackdrop) els.overlayBackdrop.classList.add('hidden'); });
els.clearCache.addEventListener('click', async ()=>{ try{ const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); const keys = await caches.keys(); for(const k of keys) await caches.delete(k); }catch(e){ console.log(e); } location.reload(); });
els.exportFeedback.addEventListener('click', ()=>{ const blob = new Blob([JSON.stringify({state:STATE, scores:getScores(), version:VERSION, updated:UPDATED}, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'brainlock-feedback.json'; a.click(); URL.revokeObjectURL(url); });
console.log("Brainlock loaded", VERSION, UPDATED);
