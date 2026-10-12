let appView='owner';
let ownerSelection='';
const renderers={dashboard:renderDashboard,fasting:renderFasting,logger:renderLogger,rewards:renderRewards,profile:renderProfile};
function render(){
  if((appView==='user'||activeTab!=='dashboard')&&!selectedCSVUser()){selectedUserId=csvUsers[0]?.user_id||'';loadActiveState();}
  const ownerDashboard=appView==='owner'&&activeTab==='dashboard';
  const selector=ownerDashboard?'':`<section class="card csv-toolbar"><div class="csv-selection"><label for="csv-user-select">Working with user</label><select id="csv-user-select">${effectiveUsers().map(u=>`<option value="${escapeHTML(u.user_id)}" ${u.user_id===selectedUserId?'selected':''}>${escapeHTML(u.name)}</option>`).join('')}</select></div><p class="csv-source">CSV starting values + saved browser progress · Changes apply only to the selected user</p></section>`;
  $('#main').innerHTML=ownerDashboard?renderOwner():selector+renderers[activeTab]();
  $('#navigation').hidden=false;
  document.querySelectorAll('#navigation button').forEach(button=>{const selected=button.dataset.tab===activeTab;button.classList.toggle('active',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  $('#app-view').value=appView;
  $('#view-context').innerHTML=appView==='owner'?'<div><strong>App owner</strong><span>Dashboard shows the directory. All five tabs work with the selected user.</span></div><span class="badge">NO LOGIN REQUIRED</span>':'<div><strong>User view</strong><span>Your five wellness tabs, with browser-saved progress.</span></div><button class="text-button" data-action="owner-view">Back to app owner →</button>';
  bindOwnerControls();bindForms();refreshCoachContext();tick();
}
function navigate(tab,focus=true){activeTab=renderers[tab]?tab:'dashboard';render();if(focus){$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}}
function setAppView(view){
  if(!['owner','user'].includes(view)||view===appView)return;
  if(view==='user'){ownerSelection=selectedUserId;if(!selectedCSVUser())selectedUserId=csvUsers[0]?.user_id||'';}
  else selectedUserId=csvUsers.some(u=>u.user_id===ownerSelection)?ownerSelection:'';
  appView=view;activeTab='dashboard';loadActiveState();render();
}
function selectCSVUser(id){if(id&&!csvUsers.some(u=>u.user_id===id))return;selectedUserId=id;logFilter='all';loadActiveState();render();$('#main').focus({preventScroll:true});}
function bindOwnerControls(){
  $('#csv-user-select')?.addEventListener('change',e=>selectCSVUser(e.target.value));
  $('#csv-file')?.addEventListener('change',e=>importCSV(e.target.files[0]));
}
function bindForms(){
  $('#fast-preset')?.addEventListener('change',e=>{$('#custom-field').hidden=e.target.value!=='custom';$('#custom-hours').required=e.target.value==='custom';});
  $('#fast-form')?.addEventListener('submit',e=>{e.preventDefault();startFast($('#fast-preset').value==='custom'?Number($('#custom-hours').value):Number($('#fast-preset').value));});
  $('#log-type')?.addEventListener('change',e=>{const type=e.target.value;$('#amount-label').textContent=`Amount (${{water:'ml',meal:'kcal',activity:'minutes'}[type]})`;$('#log-label').value={water:'Water',meal:'Meal',activity:'Walk'}[type];$('#log-amount').value={water:250,meal:400,activity:30}[type];$('#log-amount').max=type==='activity'?'1440':'10000';});
  $('#log-form')?.addEventListener('submit',e=>{e.preventDefault();const label=$('#log-label').value.trim();if(!label){toast('Give your entry a name.');return;}addLog($('#log-type').value,label,Number($('#log-amount').value),$('#log-note').value.trim());});
  $('#log-filter')?.addEventListener('change',e=>{logFilter=e.target.value;render();});
  $('#profile-form')?.addEventListener('submit',e=>{e.preventDefault();const name=$('#profile-name').value.trim();if(!name){toast('Please enter your name.');return;}Object.assign(state.profile,{name,goal:$('#profile-goal').value,waterGoal:Number($('#water-goal').value),activityGoal:Number($('#activity-goal').value),fastPreset:Number($('#profile-fast').value)});persist();render();toast('Preferences saved.');});
  $('#coach-setting')?.addEventListener('change',e=>{setCoach(e.target.checked);state.profile.coachOpen=e.target.checked;persist();});
}
function tick(){
  if(!state.fast)return;const info=fastInfo();
  document.querySelectorAll('[data-fast-time]').forEach(el=>el.textContent=duration(info.elapsed));
  document.querySelectorAll('[data-fast-ring]').forEach(el=>el.style.setProperty('--progress',info.percent));
  const remaining=$('[data-fast-remaining]'),percent=$('[data-fast-percent]'),bar=$('[data-fast-progress]'),message=$('[data-fast-message]');
  if(remaining)remaining.textContent=duration(info.remaining);if(percent)percent.textContent=`${Math.floor(info.percent)}%`;
  if(bar){bar.setAttribute('aria-valuenow',String(Math.floor(info.percent)));bar.querySelector('span').style.setProperty('--value',`${info.percent}%`);}
  if(message&&info.percent>=100){message.textContent='Your target is complete. End your fast to collect 100 XP.';message.classList.add('running-text');}
}
document.addEventListener('click',e=>{
  if(e.target.closest('#download-csv')){e.preventDefault();downloadData(activeCSVText,'users.csv','text/csv');return;}
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.csvUser){selectCSVUser(button.dataset.csvUser);return;}
  if(button.dataset.tab){navigate(button.dataset.tab);return;}
  if(button.dataset.reward){claimReward(button.dataset.reward);return;}
  if(button.dataset.deleteLog){if(confirm('Delete this journal entry?')){state.logs=state.logs.filter(l=>l.id!==button.dataset.deleteLog);persist();render();}return;}
  switch(button.dataset.action){
    case 'all-users':selectCSVUser('');break;
    case 'reload-csv':reloadCSV();break;
    case 'owner-view':setAppView('owner');break;
    case 'quick-water':addLog('water','Water',250);break;
    case 'end-fast':if(fastInfo().percent>=100||confirm('End this fast early? It will be saved without completion XP.'))endFast();break;
    case 'export':downloadData(JSON.stringify(state,null,2),`aurafit-${state.baseline.user_id}.json`,'application/json');break;
    case 'reset':if(confirm('Reset this user’s browser progress to their CSV starting values? Other users are unaffected.')){state=seedUser(csvUsers.find(u=>u.user_id===selectedUserId));persist();setCoach(true);navigate('dashboard');toast('This user’s local progress has been reset.');}break;
  }
});
function downloadData(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#theme-select').addEventListener('change',e=>setTheme(e.target.value));
$('#app-view').addEventListener('change',e=>setAppView(e.target.value));
window.addEventListener('storage',e=>{if(e.key===THEME_KEY)setTheme(savedTheme(),false);if(e.key===LIVE_KEY){userStates=readLiveStore();loadActiveState();render();}});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
$('#coach').hidden=false;$('#view-context').hidden=false;
loadActiveState();setTheme(savedTheme(),false);initializeCoach();render();
let lastDay=dayKey();setInterval(()=>{tick();if(dayKey()!==lastDay){lastDay=dayKey();render();}},1000);
if(!EMBEDDED_APP&&location.protocol!=='file:')reloadCSV();
