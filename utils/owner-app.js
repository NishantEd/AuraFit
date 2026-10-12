let appView='owner';
let ownerSelection='';
function render(){
  if(appView==='user'&&!selectedCSVUser())selectedUserId=csvUsers[0]?.user_id||'';
  $('#main').innerHTML=appView==='user'?renderUser():renderOwner();bindOwnerControls();refreshCoachContext();
  $('#app-view').value=appView;
  $('#view-context').innerHTML=appView==='owner'?'<div><strong>App owner</strong><span>Choose a user to inspect their data. No user login required.</span></div><span class="badge">CSV DATA SOURCE</span>':'<div><strong>User view</strong><span>One person’s saved progress. This is a preview without login.</span></div><button class="text-button" data-action="owner-view">Back to app owner →</button>';
}
function setAppView(view){
  if(!['owner','user'].includes(view)||view===appView)return;
  if(view==='user'){ownerSelection=selectedUserId;if(!selectedCSVUser())selectedUserId=csvUsers[0]?.user_id||'';}
  else selectedUserId=csvUsers.some(u=>u.user_id===ownerSelection)?ownerSelection:'';
  appView=view;render();
}
function selectCSVUser(id){
  if(id&&!csvUsers.some(u=>u.user_id===id))return;
  selectedUserId=id;render();$('#main').focus({preventScroll:true});
}
function bindOwnerControls(){
  $('#csv-user-select')?.addEventListener('change',e=>selectCSVUser(e.target.value));
  $('#csv-file')?.addEventListener('change',e=>importCSV(e.target.files[0]));
}
document.addEventListener('click',e=>{
  if(e.target.closest('#download-csv')){e.preventDefault();const url=URL.createObjectURL(new Blob([activeCSVText],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='users.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.csvUser){selectCSVUser(button.dataset.csvUser);return;}
  if(button.dataset.action==='all-users')selectCSVUser('');
  if(button.dataset.action==='reload-csv')reloadCSV();
  if(button.dataset.action==='owner-view')setAppView('owner');
});
$('#theme-select').addEventListener('change',e=>setTheme(e.target.value));
$('#app-view').addEventListener('change',e=>setAppView(e.target.value));
window.addEventListener('storage',e=>{if(e.key===THEME_KEY)setTheme(savedTheme(),false);});
$('#navigation').hidden=true;$('#coach').hidden=false;
$('#view-context').hidden=false;$('#view-context').innerHTML='<div><strong>App owner</strong><span>Choose a user to inspect their data. No user login required.</span></div><span class="badge">CSV DATA SOURCE</span>';
setTheme(savedTheme(),false);initializeCoach();render();
if(!EMBEDDED_APP&&location.protocol!=='file:')reloadCSV();
