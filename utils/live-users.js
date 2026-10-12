const LIVE_KEY='aurafit.interactive.v3';
function readLiveStore(){try{const stored=JSON.parse(localStorage.getItem(LIVE_KEY));return Object.assign(Object.create(null),stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{});}catch{return Object.create(null);}}
let userStates=readLiveStore();
function seedUser(user){const data=defaults();Object.assign(data,{xp:user.available_xp,totalXP:user.lifetime_xp,baseline:{...user}});Object.assign(data.profile,{name:user.name,goal:user.goal,waterGoal:user.water_goal_ml,activityGoal:user.activity_goal_minutes,fastPreset:user.fast_target_hours});if(user.water_ml>=user.water_goal_ml)data.hydrationBonuses.push(user.snapshot_date);return data;}
function userStateFor(user){
  let data=userStates[user.user_id];
  if(!data?.baseline||data.version!==1)data=seedUser(user);
  else{data=sanitizeState(data);const old=data.baseline;
    if(JSON.stringify(old)!==JSON.stringify(user)){
      data.xp=Math.max(0,user.available_xp+data.xp-old.available_xp);data.totalXP=Math.max(data.xp,user.lifetime_xp+data.totalXP-old.lifetime_xp);
      for(const [field,column] of [['name','name'],['goal','goal'],['waterGoal','water_goal_ml'],['activityGoal','activity_goal_minutes'],['fastPreset','fast_target_hours']])if(data.profile[field]===old[column])data.profile[field]=user[column];
      data.baseline={...user};
    }
  }
  userStates[user.user_id]=data;return data;
}
function totalForState(data,type){const base=data.baseline;const initial=base?.snapshot_date===dayKey()?base[{water:'water_ml',meal:'calories_kcal',activity:'activity_minutes'}[type]]||0:0;return initial+data.logs.filter(l=>l.type===type&&dayKey(l.at)===dayKey()).reduce((sum,l)=>sum+l.amount,0);}
function loadActiveState(){const user=csvUsers.find(u=>u.user_id===selectedUserId)||csvUsers[0];state=user?userStateFor(user):defaults();}
function saveLiveState(){
  const id=state.baseline?.user_id;if(!id)return;state.lastUpdated=Date.now();userStates[id]=state;
  try{localStorage.setItem(LIVE_KEY,JSON.stringify(userStates));}catch{toast('Browser storage is unavailable. Your changes last while this page stays open.');}
}
function effectiveUsers(){return csvUsers.map(user=>{
  const data=userStateFor(user);if(!data.lastUpdated)return user;
  const result={...user,name:data.profile.name,goal:data.profile.goal,available_xp:data.xp,lifetime_xp:data.totalXP,completed_fasts:data.baseline.completed_fasts+data.history.filter(f=>f.completed).length,streak_days:streak(data),water_ml:totalForState(data,'water'),water_goal_ml:data.profile.waterGoal,activity_minutes:totalForState(data,'activity'),activity_goal_minutes:data.profile.activityGoal,calories_kcal:totalForState(data,'meal'),meals_logged:(data.baseline.snapshot_date===dayKey()?data.baseline.meals_logged:0)+data.logs.filter(l=>l.type==='meal'&&dayKey(l.at)===dayKey()).length,snapshot_date:dayKey(),last_active:new Date(data.lastUpdated).toISOString()};
  if(data.fast){result.fasting_status='active';result.fast_target_hours=data.fast.hours;result.fast_elapsed_hours=Math.round((Date.now()-data.fast.start)/3600000*100)/100;}
  else if(data.history.length){result.fasting_status=data.history[0].completed?'completed':'idle';result.fast_target_hours=data.history[0].hours;result.fast_elapsed_hours=Math.round((data.history[0].end-data.history[0].start)/3600000*100)/100;}
  return result;
});}
