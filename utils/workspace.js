const WORKSPACE_KEY='aurafit.workspace.v2';
function readWorkspace(){
  try {
    const saved=JSON.parse(localStorage.getItem(WORKSPACE_KEY));
    if(saved?.version===2&&Array.isArray(saved.users)&&saved.users.length){
      const seen=new Set();
      const users=saved.users.filter(u=>u&&typeof u.id==='string'&&!seen.has(u.id)&&seen.add(u.id)).map(u=>({...u,email:String(u.email||'').slice(0,120),data:sanitizeState(u.data)}));
      if(users.length)return {version:2,users,selectedId:users.some(u=>u.id===saved.selectedId)?saved.selectedId:users[0].id,view:saved.view==='owner'?'owner':'user'};
    }
  }catch{}
  return {version:2,selectedId:'original-user',view:'user',users:[{id:'original-user',email:'',joinedAt:Date.now(),lastActiveAt:Date.now(),data:state}]};
}
let workspace=readWorkspace();
state=sanitizeState(workspace.users.find(u=>u.id===workspace.selectedId).data);
function saveWorkspace(updateActivity=true){
  const current=workspace.users.find(u=>u.id===workspace.selectedId);
  if(current){current.data=state;if(updateActivity&&workspace.view==='user')current.lastActiveAt=Date.now();}
  try{localStorage.setItem(WORKSPACE_KEY,JSON.stringify(workspace));}catch{toast('Storage unavailable. Keep this page open to retain your progress.');}
}
function switchView(view){
  saveWorkspace();workspace.view=view==='owner'?'owner':'user';saveWorkspace(false);render();$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});
}
function switchUser(id){
  if(!workspace.users.some(u=>u.id===id))return;
  saveWorkspace(false);workspace.selectedId=id;state=sanitizeState(workspace.users.find(u=>u.id===id).data);workspace.view='user';logFilter='all';
  $('#chat-log').innerHTML='';chatMessage(`Hi ${state.profile.name}, welcome to your space. Ask me about your habits or a little motivation.`);setCoach(state.profile.coachOpen,false);
  saveWorkspace();navigate('dashboard');
}
function addUser(name,email=''){
  name=String(name).trim().slice(0,40);email=String(email).trim().toLowerCase().slice(0,120);
  if(!name){toast('Enter a name for the user.');return false;}
  if(email&&workspace.users.some(u=>u.email.toLowerCase()===email)){toast('A user with this email already exists.');return false;}
  const data=defaults();data.profile.name=name;
  workspace.users.push({id:uid(),email,joinedAt:Date.now(),lastActiveAt:null,data});saveWorkspace(false);render();toast(`${name} added. Open their user view to get started.`);return true;
}
function renderViewControls(){
  const owner=workspace.view==='owner';
  $('#navigation').hidden=owner;$('#nav-avatar').hidden=owner;$('#coach').hidden=owner;
  $('#view-toggle').textContent=owner?'User view':'Owner view';$('#view-toggle').setAttribute('aria-pressed',String(owner));
  $('#view-context').hidden=false;
  $('#view-context').innerHTML=owner?'<div><strong>Owner workspace</strong><span>Manage users and explore their progress.</span></div><span class="badge">LOCAL WORKSPACE</span>':`<div><strong>User view</strong><span>Viewing ${escapeHTML(state.profile.name)}’s personal space</span></div><div class="context-actions"><label class="sr-only" for="user-select">Switch user</label><select id="user-select" aria-label="Switch user">${workspace.users.map(u=>`<option value="${escapeHTML(u.id)}" ${u.id===workspace.selectedId?'selected':''}>${escapeHTML(u.data.profile.name)}</option>`).join('')}</select><button class="text-button" data-action="owner">Back to owner →</button></div>`;
  $('#user-select')?.addEventListener('change',e=>switchUser(e.target.value));
}
