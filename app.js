const API=window.GOLF_API_URL;
const $=x=>document.getElementById(x);
let courses=[];
let s={match:null,players:[],playerId:null,hole:1,course:null,scores:[]};
let editingCourseId=null;
let playerCount=2;
let deferred;
let modalHole=1;

function toast(x){$('toast').textContent=x;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2400)}
function page(id){['home','coursePage','matchPage'].forEach(x=>$(x).hidden=x!==id)}
function jsonp(params){return new Promise((resolve,reject)=>{const cb='ggcb_'+Date.now()+'_'+Math.random().toString(36).slice(2);const script=document.createElement('script');let done=false;const cleanup=()=>{delete window[cb];script.remove()};const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('API timeout'))},15000);window[cb]=data=>{if(done)return;done=true;clearTimeout(timer);cleanup();resolve(data)};script.onerror=()=>{if(done)return;done=true;clearTimeout(timer);cleanup();reject(new Error('NetworkError'))};const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)q.set(k,typeof v==='object'?JSON.stringify(v):String(v))});q.set('callback',cb);script.src=API+'?'+q.toString();document.head.appendChild(script)})}
async function get(p){return jsonp(p)}
async function post(x){return jsonp(x)}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function normalizeCourse(c){return {course_id:c.course_id||c.id,course_name:c.course_name||c.name,holes:(c.holes||[]).map((h,i)=>({hole:+(h.hole||i+1),par:+h.par,si:+h.si}))}}

async function loadCourses(){try{const r=await get({action:'getCourses'});if(!r.success)throw Error(r.error||'Load courses failed');courses=(r.courses||[]).map(normalizeCourse);renderCourseSelect();renderSaved()}catch(e){toast('Load courses failed: '+e.message)}}
function renderCourseSelect(){$('course').innerHTML='<option value="">Select course</option>'+courses.map(c=>`<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`).join('')}
function renderSaved(){if(!courses.length){$('saved').innerHTML='<p>No courses yet.</p>';return}$('saved').innerHTML=courses.map(c=>`<div class="courseitem"><div><b>${esc(c.course_name)}</b><small>${esc(c.course_id)}</small></div><button class="small" onclick="editCourse('${esc(c.course_id)}')">Edit</button></div>`).join('')}
function holeEditor(course=null){const hs=course?.holes||Array.from({length:18},(_,i)=>({hole:i+1,par:4,si:i+1}));$('holes').innerHTML=hs.map((h,i)=>`<div class="hr"><b>${i+1}</b><input class="par" value="${h.par}" type="number" min="3" max="6"><input class="si" value="${h.si}" type="number" min="1" max="18"></div>`).join('')}
function renderCount(){ $('countBtns').innerHTML=[2,3,4,5,6].map(n=>`<button type="button" class="choicebtn ${n===playerCount?'selected':''}" onclick="setPlayerCount(${n})">${n}</button>`).join('');renderPlayerNames()}
window.setPlayerCount=n=>{playerCount=n;renderCount()};
function renderPlayerNames(){const old=[...document.querySelectorAll('.pname')].map(x=>x.value);$('playerNames').innerHTML=Array.from({length:playerCount},(_,i)=>`<label>Player ${i+1}<input class="pname" data-i="${i}" placeholder="Name" value="${esc(old[i]||'')}"></label>`).join('')}

$('courses').onclick=()=>{page('coursePage');resetCourseForm();renderSaved()};
function resetCourseForm(){editingCourseId=null;$('courseFormTitle').textContent='Add Course';$('cname').value='';$('saveCourse').textContent='Save';$('cancelEdit').hidden=true;holeEditor()}
window.editCourse=id=>{const c=courses.find(x=>x.course_id===id);if(!c)return;editingCourseId=id;$('courseFormTitle').textContent='Edit Course';$('cname').value=c.course_name;holeEditor(c);$('saveCourse').textContent='Update';$('cancelEdit').hidden=false;window.scrollTo({top:0,behavior:'smooth'})};
$('cancelEdit').onclick=resetCourseForm;
$('saveCourse').onclick=async()=>{const name=$('cname').value.trim();if(!name)return toast('Enter course name');const holes=[...document.querySelectorAll('.hr')].map((r,i)=>({hole:i+1,par:+r.querySelector('.par').value,si:+r.querySelector('.si').value}));if(holes.length!==18||holes.some(h=>!Number.isInteger(h.par)||h.par<3||h.par>6||!Number.isInteger(h.si)||h.si<1||h.si>18)||new Set(holes.map(h=>h.si)).size!==18)return toast('PAR 3-6; SI 1-18, each once');const dup=courses.some(c=>c.course_id!==editingCourseId&&c.course_name.trim().toLowerCase()===name.toLowerCase());if(dup)return toast('Course already exists');$('saveCourse').disabled=true;try{const action=editingCourseId?'updateCourse':'createCourse';const data=editingCourseId?{action,course_id:editingCourseId,course_name:name,holes}:{action,course_name:name,holes};const r=await post(data);if(!r.success)return toast(r.error||'Save failed');toast(editingCourseId?'Course updated':'Course saved');await loadCourses();resetCourseForm()}catch(e){toast('Save failed: '+e.message)}finally{$('saveCourse').disabled=false}};

$('create').onclick=async()=>{const gameId=$('gameId').value.trim(),admin=$('admin').value.trim(),course_id=$('course').value;const names=[...document.querySelectorAll('.pname')].map(x=>x.value.trim());if(!gameId)return toast('Enter Game ID');if(!admin)return toast('Enter admin name');if(!course_id)return toast('Select course');if(names.length<2||names.length>6)return toast('Players must be 2-6');if(names.some(x=>!x))return toast('Enter all player names');const normalized=names.map(x=>x.toLowerCase());if(new Set(normalized).size!==normalized.length)return toast('Player names must be unique');$('create').disabled=true;try{const r=await post({action:'createMatch',match_id:gameId,admin,course_id,players:names});if(!r.success)return toast(r.error||'Create failed');s={match:null,players:[],playerId:null,hole:1,course:null,scores:[]};await enter(r.match_id||gameId,names[0]);toast('Game created')}catch(e){toast('Create failed: '+e.message)}finally{$('create').disabled=false}};

$('join').onclick=async()=>{const match_id=$('mid').value.trim(),name=$('name').value.trim();if(!match_id||!name)return toast('Enter Game ID and name');$('join').disabled=true;try{const r=await post({action:'joinMatch',match_id,name});if(!r.success)return toast(r.error||'Join failed');const p=r.player||{};s.playerId=p.player_id||r.player_id||null;await enter(r.match_id||match_id,name);toast('Joined')}catch(e){toast('Join failed: '+e.message)}finally{$('join').disabled=false}};

async function enter(id,preferredName){const r=await get({action:'getMatch',match_id:id});if(!r.success)return toast(r.error||'Load game failed');s.match=r.match;s.players=r.players||[];if(!s.playerId&&preferredName){const p=s.players.find(x=>x.name.toLowerCase()===preferredName.toLowerCase());if(p)s.playerId=p.player_id}const cid=r.match.course_id||r.course_id;if(cid){s.course=courses.find(c=>c.course_id===cid)||null;if(!s.course){try{const cr=await get({action:'getCourse',course_id:cid});if(cr.success)s.course=normalizeCourse(cr.course)}catch(_){}}}$('headerGameId').textContent=s.match.match_id||id;page('matchPage');renderScorecard();await refresh()}

function holeInfo(hole){return s.course?.holes?.find(x=>x.hole===hole)||null}
function scoreFor(playerId,hole){return s.scores.find(x=>x.player_id===playerId&&+x.hole===hole)||null}
function isMine(player){return player.player_id===s.playerId}

function renderScorecard(){
  const grid=$('scoreGrid');
  if(!grid){
    console.error('scoreGrid not found. Please refresh to load the latest PWA.');
    return;
  }
  const holes=Array.from({length:18},(_,i)=>i+1);
  const mine=s.players.find(p=>p.player_id===s.playerId)||s.players[0];
  if(!s.playerId&&mine)s.playerId=mine.player_id;

  // Game ID belongs in the top app header, never above the scorecard.
  $('headerGameId').textContent = s.match?.match_id ? `Game ID: ${s.match.match_id}` : '';

  // Scorecard top-left cell is explicitly labeled "Holes".
  let html='<div class="corner score-head-label">Holes</div>'+
    holes.map(h=>`<div class="head-hole ${h===s.hole?'active':''}">${h}</div>`).join('');

  // The three information rows share a pale-cyan background.
  html+='<div class="label meta-label index-label">Index</div>'+
    holes.map(h=>`<div class="meta info-meta">${holeInfo(h)?.si??'—'}</div>`).join('');
  html+='<div class="label meta-label par-label">PAR</div>'+
    holes.map(h=>`<div class="meta info-meta">${holeInfo(h)?.par??'—'}</div>`).join('');

  if(mine){
    html+='<div class="label player-label mine-label player-bg-white">'+esc(mine.name)+'<small>YOU</small></div>'+
      holes.map(h=>scoreCell(mine,h,true,0)).join('');
  }

  s.players.filter(p=>p.player_id!==s.playerId).forEach((p, index)=>{
    const rowIndex=index+1; // opponent 1 = player row #2
    const bgClass=rowIndex%2===1?'player-bg-gray':'player-bg-white';
    html+='<div class="label player-label opponent-label '+bgClass+'">'+esc(p.name)+'</div>'+
      holes.map(h=>scoreCell(p,h,false,rowIndex)).join('');
    html+='<div class="label status-label '+bgClass+'">STROKES</div>'+
      holes.map(h=>statusCell(p,h,rowIndex)).join('');
  });

  grid.innerHTML=html;
  $('hole').textContent=s.hole;
}

function scoreCell(p,h,mine,rowIndex=0){
  const rec=scoreFor(p.player_id,h);
  const val=rec&&rec.score!==''&&rec.score!=null?Number(rec.score):null;
  const display=val===null?'–':val;
  const par=Number(holeInfo(h)?.par);
  let ring='';
  if(val!==null && Number.isFinite(par)){
    if(val===par) ring=' single-ring';
    else if(val<par) ring=' double-ring';
  }
  const bg=(rowIndex%2===1)?' player-bg-gray':' player-bg-white';
  const inner=val===null?esc(display):`<span class="score-number${ring}">${esc(display)}</span>`;
  if(mine){
    return `<button class="score-cell mine-score${bg} ${h===s.hole?'current':''}" data-hole="${h}" onclick="openScore(${h})">${inner}</button>`;
  }
  return `<div class="score-cell opponent-score${bg}">${inner}</div>`;
}

function statusCell(p,h,rowIndex=0){
  // Handicap Matrix will supply the signed stroke value.
  // Positive = P1 receives a stroke; negative = P1 gives a stroke.
  const n = Number(p.strokes && p.strokes[h]);
  const bg=(rowIndex%2===1)?' player-bg-gray':' player-bg-white';
  if(Number.isFinite(n) && n!==0){
    return `<div class="status-cell ${n>0?'stroke-plus':'stroke-minus'}${bg}">${n>0?'+':''}${n}</div>`;
  }
  return `<div class="status-cell neutral${bg}">—</div>`;
}

window.openScore=hole=>{
  if(!s.playerId)return toast('Player not found');
  modalHole=hole;const rec=scoreFor(s.playerId,hole);$('modalTitle').textContent=`Hole ${hole} · Score`;$('modalUp').checked=!!rec?.up;
  $('scoreChoices').innerHTML=Array.from({length:12},(_,i)=>{const n=i+1;return `<button type="button" class="score-choice ${Number(rec?.score)===n?'selected':''}" onclick="selectScore(${n})">${n}</button>`}).join('');
  $('scoreModal').hidden=false;
};
window.selectScore=n=>{document.querySelectorAll('.score-choice').forEach(b=>b.classList.toggle('selected',Number(b.textContent)===n));$('scoreModal').dataset.score=n};
function closeModal(){$('scoreModal').hidden=true;delete $('scoreModal').dataset.score}
$('closeModal').onclick=closeModal;$('modalCancel').onclick=closeModal;
$('modalSave').onclick=async()=>{const score=Number($('scoreModal').dataset.score);if(!score)return toast('Select score');$('modalSave').disabled=true;try{const r=await post({action:'saveScore',match_id:s.match.match_id,player_id:s.playerId,hole:modalHole,score,up:$('modalUp').checked,submitted_by:s.playerId});if(!r.success)return toast(r.error||'Save failed');closeModal();s.hole=modalHole;await refresh();toast('Saved')}catch(e){toast('Save failed: '+e.message)}finally{$('modalSave').disabled=false}};

async function refresh(){if(!s.match)return;try{const r=await get({action:'getScores',match_id:s.match.match_id});if(r.success){s.scores=r.scores||[];renderScorecard();}}catch(e){}}

$('prev').onclick=()=>{if(s.hole>1){s.hole--;renderScorecard();$('scoreScroll').scrollLeft=Math.max(0,(s.hole-1)*58)}};
$('next').onclick=()=>{if(s.hole<18){s.hole++;renderScorecard();$('scoreScroll').scrollLeft=Math.max(0,(s.hole-1)*58)}};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>page('home'));
setInterval(()=>{if(!$('matchPage').hidden)refresh()},8000);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').hidden=false});
$('install').onclick=async()=>{if(deferred){deferred.prompt();deferred=null}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('service-worker.js');
renderCount();loadCourses();
