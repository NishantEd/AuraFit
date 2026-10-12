const renderers={dashboard:renderDashboard,fasting:renderFasting,logger:renderLogger,rewards:renderRewards,profile:renderProfile};
function render(){
  $('#main').innerHTML=workspace.view==='owner'?renderOwner():renderers[activeTab]();$('#main').classList.remove('tab-enter');void $('#main').offsetWidth;$('#main').classList.add('tab-enter');
  document.querySelectorAll('#navigation button').forEach(button=>{const selected=button.dataset.tab===activeTab;button.classList.toggle('active',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  $('#nav-avatar').textContent=state.profile.name.slice(0,2).toUpperCase();
  renderViewControls();bindForms();tick();
}
function navigate(tab,focus=true){if(!renderers[tab])tab='dashboard';activeTab=tab;if(location.hash!==`#${tab}`)history.replaceState(null,'',`#${tab}`);render();if(focus){$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}}
function bindForms(){
  $('#add-user-form')?.addEventListener('submit',e=>{e.preventDefault();addUser($('#new-user-name').value,$('#new-user-email').value);});
  $('#owner-search')?.addEventListener('input',e=>{ownerSearch=e.target.value;$('#owner-rows').innerHTML=ownerRows();});
  $('#fast-preset')?.addEventListener('change',e=>{$('#custom-field').hidden=e.target.value!=='custom';$('#custom-hours').required=e.target.value==='custom';});
  $('#fast-form')?.addEventListener('submit',e=>{e.preventDefault();startFast($('#fast-preset').value==='custom'?Number($('#custom-hours').value):Number($('#fast-preset').value));});
  $('#log-type')?.addEventListener('change',e=>{const type=e.target.value;$('#amount-label').textContent=`Amount (${{water:'ml',meal:'kcal',activity:'minutes'}[type]})`;$('#log-label').value={water:'Water',meal:'Meal',activity:'Walk'}[type];$('#log-amount').value={water:250,meal:400,activity:30}[type];$('#log-amount').max=type==='activity'?'1440':'10000';});
  $('#log-form')?.addEventListener('submit',e=>{e.preventDefault();const label=$('#log-label').value.trim();if(!label){toast('Give your entry a name.');return;}addLog($('#log-type').value,label,Number($('#log-amount').value),$('#log-note').value.trim());});
  $('#log-filter')?.addEventListener('change',e=>{logFilter=e.target.value;render();});
  $('#profile-form')?.addEventListener('submit',e=>{e.preventDefault();const name=$('#profile-name').value.trim();if(!name){toast('Please enter your name.');return;}Object.assign(state.profile,{name,goal:$('#profile-goal').value,waterGoal:Number($('#water-goal').value),activityGoal:Number($('#activity-goal').value),fastPreset:Number($('#profile-fast').value)});persist();render();toast('Preferences saved. Your rhythm, your rules.');});
  $('#coach-setting')?.addEventListener('change',e=>setCoach(e.target.checked));
}
function tick(){
  if(!state.fast)return;const info=fastInfo();
  document.querySelectorAll('[data-fast-time]').forEach(el=>el.textContent=duration(info.elapsed));
  document.querySelectorAll('[data-fast-ring]').forEach(el=>el.style.setProperty('--progress',info.percent));
  if($('#main [data-fast-remaining]'))$('#main [data-fast-remaining]').textContent=duration(info.remaining);
  if($('#main [data-fast-percent]'))$('#main [data-fast-percent]').textContent=`${Math.floor(info.percent)}%`;
  if($('#main [data-fast-progress]')){const el=$('#main [data-fast-progress]');el.setAttribute('aria-valuenow',String(Math.floor(info.percent)));el.querySelector('span').style.setProperty('--value',`${info.percent}%`);}
  if(info.percent>=100&&$('#main [data-fast-message]')){$('#main [data-fast-message]').textContent='Your target is complete. End your fast to collect 100 XP.';$('#main [data-fast-message]').classList.add('running-text');}
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.viewUser){switchUser(target.dataset.viewUser);return;}
  if(target.dataset.tab){if(workspace.view==='owner'){workspace.view='user';saveWorkspace(false);}navigate(target.dataset.tab);return;}
  if(target.dataset.reward){claimReward(target.dataset.reward);return;}
  if(target.dataset.deleteLog){if(confirm('Delete this journal entry?')){state.logs=state.logs.filter(l=>l.id!==target.dataset.deleteLog);persist();render();toast('Entry deleted.');}return;}
  switch(target.dataset.action){
    case 'owner':switchView('owner');break;
    case 'quick-water':addLog('water','Water',250);break;
    case 'end-fast':if(fastInfo().percent>=100||confirm('End this fast early? It will be recorded, with no completion XP.'))endFast();break;
    case 'export':{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`aurafit-${dayKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your progress has been exported.');break;}
    case 'reset':if(confirm('Reset this user’s AuraFit progress, logs, rewards, and settings? Other users are unaffected. This cannot be undone.')){const name=state.profile.name;state=defaults();state.profile.name=name;persist();setCoach(true);navigate('dashboard');toast('A fresh start. This user’s progress has been reset.');}break;
  }
});
$('#chat-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#chat-input').value.trim();if(!text)return;chatMessage(text,true);$('#chat-input').value='';chatMessage(reply(text));});
$('#motivation').addEventListener('click',()=>chatMessage(motivation()));
$('#coach-toggle').addEventListener('click',()=>{setCoach(!state.profile.coachOpen);if($('#coach-setting'))$('#coach-setting').checked=state.profile.coachOpen;});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
window.addEventListener('storage',e=>{if(e.key===WORKSPACE_KEY){workspace=readWorkspace();state=sanitizeState(workspace.users.find(u=>u.id===workspace.selectedId).data);setCoach(state.profile.coachOpen,false);render();}if(e.key===THEME_KEY)setTheme(savedTheme(),false);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
chatMessage('Hey, I’m Aura ✧ Your little corner of encouragement. Need a hydration nudge, fasting tip, or some motivation? I’m here.');
$('#theme-select').addEventListener('change',e=>setTheme(e.target.value));
$('#view-toggle').addEventListener('click',()=>switchView(workspace.view==='owner'?'user':'owner'));
setTheme(savedTheme(),false);
setCoach(state.profile.coachOpen,false);
saveWorkspace(false);
navigate(location.hash.slice(1)||'dashboard',false);
let lastDay=dayKey();
setInterval(()=>{tick();if(dayKey()!==lastDay){lastDay=dayKey();render();}},1000);
