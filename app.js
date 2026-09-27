const API=window.GOLF_API_URL;
const $=x=>document.getElementById(x);
let courses=[];
let s={match:null,players:[],playerId:null,hole:1,course:null,scores:[],mode:'F9'};
let editingCourseId=null;
let playerCount=2;
let deferred;
let modalHole=1;

function toast(x){$('toast').textContent=x;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2400)}
function page(id){['home','coursePage','matchPage'].forEach(x=>$(x).hidden=x!==id)}
function showHome(){page('home');$('joinPanel').hidden=true;$('newPanel').hidden=true;$('headerQr').hidden=true;$('headerGameId').textContent=''}
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
function renderPlayerNames(){const old=[...document.querySelectorAll('.pname')].map(x=>x.value);$('playerNames').innerHTML=Array.from({length:playerCount},(_,i)=>`<label>Player ${i+1}<input class="pname" data-i="${i}" placeholder="Name" value="${esc(old[i]||'')}" maxlength="20"></label>`).join('')}

$('showJoin').onclick=()=>{ $('newPanel').hidden=true;$('joinPanel').hidden=false;const params=new URLSearchParams(location.search);const gid=params.get('game');if(gid)$('mid').value=gid;prefillRememberedName($('mid').value.trim());$('mid').focus() };
$('showNew').onclick=()=>{ $('joinPanel').hidden=true;$('newPanel').hidden=false;$('gameId').focus() };
$('courses').onclick=()=>{page('coursePage');resetCourseForm();renderSaved()};
$('joinBack').onclick=showHome;$('newBack').onclick=showHome;$('courseBack').onclick=showHome;$('matchBack').onclick=showHome;
function resetCourseForm(){editingCourseId=null;$('courseFormTitle').textContent='Add Course';$('cname').value='';$('saveCourse').textContent='Save';$('cancelEdit').hidden=true;holeEditor()}
window.editCourse=id=>{const c=courses.find(x=>x.course_id===id);if(!c)return;editingCourseId=id;$('courseFormTitle').textContent='Edit Course';$('cname').value=c.course_name;holeEditor(c);$('saveCourse').textContent='Update';$('cancelEdit').hidden=false;window.scrollTo({top:0,behavior:'smooth'})};
$('cancelEdit').onclick=resetCourseForm;
$('saveCourse').onclick=async()=>{const name=$('cname').value.trim();if(!name)return toast('Enter course name');const holes=[...document.querySelectorAll('.hr')].map((r,i)=>({hole:i+1,par:+r.querySelector('.par').value,si:+r.querySelector('.si').value}));if(holes.length!==18||holes.some(h=>!Number.isInteger(h.par)||h.par<3||h.par>6||!Number.isInteger(h.si)||h.si<1||h.si>18)||new Set(holes.map(h=>h.si)).size!==18)return toast('PAR 3-6; Index 1-18, each once');const dup=courses.some(c=>c.course_id!==editingCourseId&&c.course_name.trim().toLowerCase()===name.toLowerCase());if(dup)return toast('Course already exists');$('saveCourse').disabled=true;try{const action=editingCourseId?'updateCourse':'createCourse';const data=editingCourseId?{action,course_id:editingCourseId,course_name:name,holes}:{action,course_name:name,holes};const r=await post(data);if(!r.success)return toast(r.error||'Save failed');toast(editingCourseId?'Course updated':'Course saved');await loadCourses();resetCourseForm()}catch(e){toast('Save failed: '+e.message)}finally{$('saveCourse').disabled=false}};

$('create').onclick=async()=>{const gameId=$('gameId').value.trim(),admin=$('admin').value.trim(),course_id=$('course').value;const names=[...document.querySelectorAll('.pname')].map(x=>x.value.trim());if(!gameId)return toast('Enter Game ID');if(!admin)return toast('Enter admin name');if(!course_id)return toast('Select course');if(names.length<2||names.length>6)return toast('Players must be 2-6');if(names.some(x=>!x))return toast('Enter all player names');const normalized=names.map(x=>x.toLowerCase());if(new Set(normalized).size!==normalized.length)return toast('Player names must be unique');$('create').disabled=true;try{const r=await post({action:'createMatch',match_id:gameId,admin,course_id,players:names});if(!r.success)return toast(r.error||'Create failed');s={match:null,players:[],playerId:null,hole:1,course:null,scores:[],mode:'F9'};rememberName(gameId,names[0]);await enter(r.match_id||gameId,names[0]);toast('Game created')}catch(e){toast('Create failed: '+e.message)}finally{$('create').disabled=false}};

function rememberName(gameId,name){if(gameId&&name)localStorage.setItem('golf_player_name_'+gameId.trim().toUpperCase(),name.trim())}
function rememberedName(gameId){return gameId?localStorage.getItem('golf_player_name_'+gameId.trim().toUpperCase())||'':''}
function prefillRememberedName(gameId){const n=rememberedName(gameId);if(n)$('name').value=n}
$('mid').addEventListener('input',()=>prefillRememberedName($('mid').value.trim()));
$('name').addEventListener('input',()=>{const gid=$('mid').value.trim();if(gid&&$('name').value.trim())rememberName(gid,$('name').value.trim())});

$('join').onclick=async()=>{const match_id=$('mid').value.trim(),name=$('name').value.trim(),joinCode=$('joinCode').value.trim();if(!match_id||!name)return toast('Enter Game ID and name');rememberName(match_id,name);$('join').disabled=true;try{const r=await post({action:'joinMatch',match_id,name,join_code:joinCode});if(!r.success)return toast(r.error||'Join failed');const p=r.player||{};s.playerId=p.player_id||r.player_id||null;await enter(r.match_id||match_id,name);toast('Joined')}catch(e){toast('Join failed: '+e.message)}finally{$('join').disabled=false}};

async function enter(id,preferredName){const r=await get({action:'getMatch',match_id:id});if(!r.success)return toast(r.error||'Load game failed');s.match=r.match;s.players=r.players||[];if(!s.playerId&&preferredName){const p=s.players.find(x=>x.name.toLowerCase()===preferredName.toLowerCase());if(p)s.playerId=p.player_id}const cid=r.match.course_id||r.course_id;if(cid){s.course=courses.find(c=>c.course_id===cid)||null;if(!s.course){try{const cr=await get({action:'getCourse',course_id:cid});if(cr.success)s.course=normalizeCourse(cr.course)}catch(_){}}}$('headerGameId').textContent=s.match.match_id||id;$('headerQr').hidden=false;page('matchPage');setMode('F9');renderScorecard();await refresh()}

function holeInfo(hole){return s.course?.holes?.find(x=>x.hole===hole)||null}
function scoreFor(playerId,hole){return s.scores.find(x=>x.player_id===playerId&&+x.hole===hole)||null}
function currentHoles(){return s.mode==='F9'?[1,2,3,4,5,6,7,8,9]:s.mode==='B9'?[10,11,12,13,14,15,16,17,18]:Array.from({length:18},(_,i)=>i+1)}
function isBaccarat(){return s.mode==='Baccarat'}

function setMode(mode){s.mode=mode;$('modeF9').classList.toggle('active',mode==='F9');$('modeB9').classList.toggle('active',mode==='B9');$('modeBaccarat').classList.toggle('active',mode==='Baccarat');const hs=currentHoles();if(!hs.includes(s.hole))s.hole=hs[0];$('holeLabel').innerHTML=isBaccarat()?`Hole <span id="hole">${s.hole}</span> / 18`:`Hole <span id="hole">${s.hole}</span> / 9`;renderScorecard()}
window.setMode=setMode;
$('modeF9').onclick=()=>setMode('F9');$('modeB9').onclick=()=>setMode('B9');$('modeBaccarat').onclick=()=>setMode('Baccarat');

function makeRow(cells, cls=''){
  return `<div class="score-row ${cls}">${cells.join('')}</div>`;
}
function labelCell(text, cls=''){
  return `<div class="score-label ${cls}">${text}</div>`;
}
function dataCell(text, cls=''){
  return `<div class="score-data ${cls}">${text}</div>`;
}
function renderScorecard(){
  const grid=$('scoreGrid'); if(!grid)return;
  const holes=currentHoles();
  const mine=s.players.find(p=>p.player_id===s.playerId)||s.players[0];
  if(!s.playerId&&mine)s.playerId=mine.player_id;
  $('headerGameId').textContent=s.match?.match_id||'';
  $('headerQr').hidden=!s.match;
  if(isBaccarat()){
    grid.innerHTML=renderBaccaratGrid(holes,mine);
  }else{
    const rows=[];
    rows.push(makeRow([labelCell('Holes','top-label')].concat(holes.map(h=>dataCell(h,`top-cell ${h===s.hole?'active':''}`)))));
    rows.push(makeRow([labelCell('Index','top-label')].concat(holes.map(h=>dataCell(holeInfo(h)?.si??'—','top-cell')))));
    rows.push(makeRow([labelCell('PAR','top-label')].concat(holes.map(h=>dataCell(holeInfo(h)?.par??'—','top-cell')))));
    if(mine){
      rows.push(makeRow([labelCell(`${esc(mine.name)}<small>YOU</small>`,'player-label mine-label player-bg-white')].concat(holes.map(h=>scoreCell(mine,h,true,0)))));
    }
    s.players.filter(p=>p.player_id!==s.playerId).forEach((p,index)=>{
      const bgClass=index%2===0?'player-bg-gray':'player-bg-white';
      rows.push(makeRow([labelCell(esc(p.name),'player-label '+bgClass)].concat(holes.map(h=>scoreCell(p,h,false,index+1))), 'opponent-row '+bgClass));
      rows.push(makeRow([labelCell('STROKES','status-label '+bgClass)].concat(holes.map(h=>statusCell(p,h,index+1))), 'status-row '+bgClass));
    });
    grid.innerHTML=rows.join('');
  }
  $('hole').textContent=s.hole;
}

function renderBaccaratGrid(holes,mine){
  const rows=[];
  rows.push(makeRow([labelCell('Holes','top-label')].concat(holes.map(h=>dataCell(h,`top-cell ${h===s.hole?'active':''}`)), dataCell('Total','top-cell total-col'))));
  rows.push(makeRow([labelCell('Index','top-label')].concat(holes.map(h=>dataCell(holeInfo(h)?.si??'—','top-cell')),dataCell('—','top-cell total-col'))));
  rows.push(makeRow([labelCell('PAR','top-label')].concat(holes.map(h=>dataCell(holeInfo(h)?.par??'—','top-cell')),dataCell('—','top-cell total-col'))));
  if(mine){
    rows.push(makeRow([labelCell(`${esc(mine.name)}<small>YOU</small>`,'player-label mine-label player-bg-white')].concat(holes.map(h=>baccaratCell(mine,h,0,true)),dataCell(baccaratTotal(mine),'baccarat-total total-col'))));
  }
  s.players.filter(p=>p.player_id!==s.playerId).forEach((p,index)=>{
    const bg=index%2===0?'player-bg-gray':'player-bg-white';
    rows.push(makeRow([labelCell(esc(p.name),'player-label '+bg)].concat(holes.map(h=>baccaratCell(p,h,index+1,false)),dataCell(baccaratTotal(p),'baccarat-total total-col')), 'baccarat-player-row '+bg));
  });
  return rows.join('');
}
function baccaratTotal(p){
  const vals=s.scores.filter(x=>x.player_id===p.player_id&&x.points!=null).map(x=>Number(x.points)).filter(Number.isFinite);
  return vals.length?vals.reduce((a,b)=>a+b,0):'—';
}

function scoreCell(p,h,mine,rowIndex=0){
  const rec=scoreFor(p.player_id,h);
  const val=rec&&rec.score!==''&&rec.score!=null?Number(rec.score):null;
  const display=val===null?'–':val;
  const par=Number(holeInfo(h)?.par);
  let ring='';
  if(val!==null&&Number.isFinite(par)){
    if(val===par)ring=' single-ring';
    else if(val<par)ring=' double-ring';
  }
  const bg=(rowIndex%2===1)?' player-bg-gray':' player-bg-white';
  const inner=val===null?esc(display):`<span class="score-number${ring}">${esc(display)}</span>`;
  if(mine)return `<button class="score-cell mine-score${bg} ${h===s.hole?'current':''}" data-hole="${h}" onclick="openScore(${h})">${inner}</button>`;
  return `<div class="score-cell opponent-score${bg}">${inner}</div>`;
}
function statusCell(p,h,rowIndex=0){
  const n=Number(p.strokes&&p.strokes[h]);
  const bg=(rowIndex%2===1)?' player-bg-gray':' player-bg-white';
  if(Number.isFinite(n)&&n!==0)return `<div class="status-cell ${n>0?'stroke-plus':'stroke-minus'}${bg}">${n>0?'+':''}${n}</div>`;
  return `<div class="status-cell neutral${bg}">—</div>`;
}
function baccaratCell(p,h,rowIndex,mine){
  const bg=rowIndex%2===1?' player-bg-gray':' player-bg-white';
  const rec=scoreFor(p.player_id,h);
  const pts=rec&&rec.points!=null?Number(rec.points):null;
  return `<div class="baccarat-cell${bg}">${Number.isFinite(pts)?pts:'—'}</div>`;
}

window.openScore=hole=>{if(!s.playerId)return toast('Player not found');if(isBaccarat())return toast('Baccarat points will be calculated after the Baccarat rules are connected');modalHole=hole;const rec=scoreFor(s.playerId,hole);$('modalTitle').textContent=`Hole ${hole} · Score`;$('modalUp').checked=!!rec?.up;$('scoreChoices').innerHTML=Array.from({length:12},(_,i)=>{const n=i+1;return `<button type="button" class="score-choice ${Number(rec?.score)===n?'selected':''}" onclick="selectScore(${n})">${n}</button>`}).join('');$('scoreModal').hidden=false};
window.selectScore=n=>{document.querySelectorAll('.score-choice').forEach(b=>b.classList.toggle('selected',Number(b.textContent)===n));$('scoreModal').dataset.score=n};
function closeModal(){$('scoreModal').hidden=true;delete $('scoreModal').dataset.score}
$('closeModal').onclick=closeModal;$('modalCancel').onclick=closeModal;
$('modalSave').onclick=async()=>{const score=Number($('scoreModal').dataset.score);if(!score)return toast('Select score');$('modalSave').disabled=true;try{const r=await post({action:'saveScore',match_id:s.match.match_id,player_id:s.playerId,hole:modalHole,score,up:$('modalUp').checked,submitted_by:s.playerId});if(!r.success)return toast(r.error||'Save failed');closeModal();s.hole=modalHole;await refresh();toast('Saved')}catch(e){toast('Save failed: '+e.message)}finally{$('modalSave').disabled=false}};

async function refresh(){if(!s.match)return;try{const r=await get({action:'getScores',match_id:s.match.match_id});if(r.success){s.scores=r.scores||[];renderScorecard()}}catch(e){}}
$('prev').onclick=()=>{const hs=currentHoles();const i=hs.indexOf(s.hole);if(i>0){s.hole=hs[i-1];renderScorecard()}};
$('next').onclick=()=>{const hs=currentHoles();const i=hs.indexOf(s.hole);if(i<hs.length-1){s.hole=hs[i+1];renderScorecard()}};

function joinUrl(){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('join','1');u.searchParams.set('game',s.match.match_id);return u.toString()}
$('headerQr').onclick=()=>{if(!s.match)return;const link=joinUrl();$('qrGameId').textContent=s.match.match_id;$('qrImage').src='https://quickchart.io/qr?text='+encodeURIComponent(link)+'&size=240&margin=2';$('copyJoin').dataset.link=link;$('qrModal').hidden=false};
$('closeQr').onclick=()=>{$('qrModal').hidden=true};
$('copyJoin').onclick=async()=>{const link=$('copyJoin').dataset.link||'';try{await navigator.clipboard.writeText(link);toast('Join link copied')}catch(e){toast(link)}};

setInterval(()=>{if(!$('matchPage').hidden)refresh()},8000);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install')&&($('install').hidden=false)});
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!sessionStorage.getItem('golf_sw_reloaded_v75')){sessionStorage.setItem('golf_sw_reloaded_v75','1');location.reload();}
  });
  navigator.serviceWorker.register('service-worker.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}

// Restore QR join flow when a player scans a creator's QR code.
(function initJoinLink(){const params=new URLSearchParams(location.search);if(params.get('join')==='1'){const gid=params.get('game')||'';$('joinPanel').hidden=false;$('mid').value=gid;prefillRememberedName(gid);page('home');}})();
renderCount();loadCourses();
