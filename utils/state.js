'use strict';
const STORAGE_KEY = 'aurafit.v1';
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey = (value = Date.now()) => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const defaults = () => ({version:1, xp:0, totalXP:0, fast:null, history:[], logs:[], claimed:[], hydrationBonuses:[], profile:{name:'Alex',goal:'Build consistent habits',waterGoal:2000,activityGoal:30,fastPreset:16,coachOpen:true}});
function sanitizeState(s){
  try {
    if(!s || s.version!==1) return defaults();
    const base=defaults();
    for(const key of ['history','logs','claimed','hydrationBonuses']) if(!Array.isArray(s[key])) return base;
    if(!Number.isFinite(s.xp)||s.xp<0||!Number.isFinite(s.totalXP)||s.totalXP<0) return base;
    const profile={...base.profile,...s.profile};
    if(!Number.isFinite(profile.waterGoal)||profile.waterGoal<250||profile.waterGoal>10000) profile.waterGoal=2000;
    if(!Number.isFinite(profile.activityGoal)||profile.activityGoal<1||profile.activityGoal>300) profile.activityGoal=30;
    if(!Number.isFinite(profile.fastPreset)||profile.fastPreset<1||profile.fastPreset>24) profile.fastPreset=16;
    profile.name=String(profile.name).slice(0,40);
    if(s.fast && (!Number.isFinite(s.fast.start)||s.fast.start>Date.now()||!Number.isFinite(s.fast.hours)||s.fast.hours<1||s.fast.hours>24)) s.fast=null;
    return {...base,...s,profile};
  } catch { return defaults(); }
}
function readState(){
  try { const registry=JSON.parse(localStorage.getItem('aurafit.workspace.v2'));const current=registry?.users?.find(u=>u.id===registry.selectedId);return sanitizeState(current?current.data:JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch {return defaults();}
}
let state=readState();
let activeTab='dashboard';
let toastTimeout;
function persist(){saveWorkspace();}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').hidden=true,4000);}
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const duration = seconds => {const n=Math.max(0,Math.floor(seconds));return `${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
const dateLabel = timestamp => new Date(timestamp).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const timeLabel = timestamp => new Date(timestamp).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
const todayLogs = () => state.logs.filter(l=>dayKey(l.at)===dayKey());
const totalFor = type => todayLogs().filter(l=>l.type===type).reduce((sum,l)=>sum+l.amount,0);
const level = () => Math.floor(state.totalXP/500)+1;
function streak(userState=state){
  const days=new Set(userState.history.filter(f=>f.completed).map(f=>dayKey(f.end)));
  const cursor=new Date(); cursor.setHours(12,0,0,0);
  if(!days.has(dayKey(cursor)))cursor.setDate(cursor.getDate()-1);
  let count=0;while(days.has(dayKey(cursor))){count++;cursor.setDate(cursor.getDate()-1);}return count;
}
function fastInfo(){if(!state.fast)return {elapsed:0,percent:0,remaining:0};const elapsed=Math.max(0,(Date.now()-state.fast.start)/1000);const target=state.fast.hours*3600;return {elapsed,percent:Math.min(100,elapsed/target*100),remaining:Math.max(0,target-elapsed)};}
function startFast(hours){
  if(state.fast){toast('You already have an active fast.');return;}
  hours=Number(hours);if(!Number.isFinite(hours)||hours<1||hours>24){toast('Choose a duration between 1 and 24 hours.');return;}
  state.fast={start:Date.now(),hours};persist();render();toast('Your fast has started. Find your rhythm.');
}
function endFast(){
  if(!state.fast)return;
  const f=state.fast;const end=Date.now();const completed=end-f.start>=f.hours*3600000;
  state.history.unshift({id:uid(),start:f.start,end,hours:f.hours,completed});state.fast=null;
  if(completed){state.xp+=100;state.totalXP+=100;}
  persist();render();toast(completed?'Fast completed! +100 XP earned.':'Fast ended early and saved to your history.');
}
function addLog(type,label,amount,note=''){
  if(!['water','meal','activity'].includes(type)||!Number.isFinite(amount)||amount<=0)return;
  state.logs.unshift({id:uid(),type,label:String(label).slice(0,80),amount,note:String(note).slice(0,200),at:Date.now()});
  let bonus=false;
  if(type==='water'&&totalFor('water')>=state.profile.waterGoal&&!state.hydrationBonuses.includes(dayKey())){state.hydrationBonuses.push(dayKey());state.xp+=10;state.totalXP+=10;bonus=true;}
  persist();render();toast(bonus?'Daily hydration goal reached! +10 XP.':'Entry saved. Small steps add up.');
}
function heading(eyebrow,title,description){return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><span class="date-pill">◷ &nbsp; ${new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span></div>`;}
function metric(label,value,unit,note,icon){return `<article class="card metric"><div><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${unit}</small></div><div class="metric-note">${note}</div></div><div class="icon-box" aria-hidden="true">${icon}</div></article>`;}
function progress(value){const v=Math.max(0,Math.min(100,value));return `<div class="progress" role="progressbar" aria-label="Goal progress" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><span style="--value:${v}%"></span></div>`;}
function ring(percent,content,running=false){return `<div class="ring ${running?'active':''}" style="--progress:${percent}" data-fast-ring><div class="ring-content">${content}</div></div>`;}
