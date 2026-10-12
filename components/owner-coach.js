const MANTRAS=['Progress is built in small moments. Make this one count.','You don’t need a perfect day. You just need a kind next step.','Consistency is a promise you keep to yourself, one day at a time.','Rest, reset, and return. Your rhythm is yours to find.','Celebrate the effort. Every small habit is a vote for your future self.'];
const coachConversations=new Map();
let coachContextKey=null;
let coachOpen=true;
function motivation(){return MANTRAS[Math.floor(Math.random()*MANTRAS.length)];}
function reply(text){
  const query=text.toLowerCase().replace(/[’']/g,'');const user=selectedCSVUser();
  if(/\b(hunger|hungry|starving|appetite)\b/.test(query))return 'Appetite can come in waves. Pause, sip water, or consider plain black coffee if it suits you. Listen to your body; it’s okay to end a fast and eat when you need to.';
  if(/\b(rules|do|dont|beverage|break|allowed)\b/.test(query))return 'For a simple calorie-free fasting window, beverages usually mean water, unsweetened tea, or plain black coffee. Milk, sugar, juice, and food add calories. Follow any guidance from your clinician.';
  if(/\b(quote|motivation|motivate|inspire)\b/.test(query))return motivation();
  if(/\b(water|hydration|drink|thirsty)\b/.test(query))return user?`${user.name} has ${user.water_ml} ml recorded against a ${user.water_goal_ml} ml goal. This includes the applicable CSV starting values and saved browser logs. Add new entries in Logger.`:'Select a user above to see their hydration progress. Keep water within reach, and choose a hydration goal that fits your needs.';
  if(/\b(stats|progress|xp|streak|profile)\b/.test(query))return user?`${user.name} (${user.user_id}): ${user.available_xp} available XP, ${user.completed_fasts} completed fasts, a ${user.streak_days}-day recorded streak, and ${user.activity_minutes} movement minutes in the ${user.snapshot_date} snapshot.`:'Choose Alex, Jordan, or Sam using View user data. I’ll then explain only the selected user’s snapshot.';
  if(/\b(fitness|exercise|movement|workout)\b/.test(query))return user?`${user.name} has ${user.activity_minutes} movement minutes recorded toward a ${user.activity_goal_minutes}-minute goal. Small, enjoyable steps can help build a routine.`:'Start with a small movement break you enjoy. Ask for motivation, or select a user to explore their recorded movement progress.';
  return 'Ask me about water intake, fitness motivation, hunger, fasting rules, or the selected user’s stats. Tap Random Motivation for a little encouragement. I use preset responses, not personalized medical advice.';
}
function appendChatBubble(message){
  const bubble=document.createElement('div');bubble.className=`bubble${message.user?' user':''}`;bubble.textContent=message.text;$('#chat-log').appendChild(bubble);$('#chat-log').scrollTop=$('#chat-log').scrollHeight;
}
function chatMessage(text,user=false){
  const conversation=coachConversations.get(coachContextKey)||[];conversation.push({text,user});if(conversation.length>60)conversation.shift();coachConversations.set(coachContextKey,conversation);
  $('#chat-log').innerHTML='';conversation.forEach(appendChatBubble);
}
function refreshCoachContext(){
  const user=selectedCSVUser();const key=user?user.user_id:'owner-overview';$('#coach-context').textContent=user?`Viewing ${user.name}`:'Owner companion';
  if(key===coachContextKey)return;
  setCoach(user?state.profile.coachOpen:true);
  coachContextKey=key;$('#chat-log').innerHTML='';$('#chat-input').value='';
  const conversation=coachConversations.get(key);
  if(conversation)conversation.forEach(appendChatBubble);
  else chatMessage(user?`Hi, I’m Aura ✧ You’re viewing ${user.name}’s saved data. Ask about their water, movement, or progress, or get a little motivation.`:'Hi, I’m Aura ✧ Your wellness companion is back. Ask about fasting rules, hydration, or motivation. Select a user to explore their saved stats.');
}
function setCoach(open,save=false){coachOpen=open;$('#coach').classList.toggle('collapsed',!open);$('#coach-toggle').textContent=open?'−':'+';$('#coach-toggle').setAttribute('aria-expanded',String(open));$('#coach-toggle').setAttribute('aria-label',open?'Collapse coach':'Expand coach');if(save&&selectedUserId){state.profile.coachOpen=open;persist();}if($('#coach-setting'))$('#coach-setting').checked=open;}
function initializeCoach(){
  setCoach(true);
  $('#chat-form').addEventListener('submit',event=>{event.preventDefault();const text=$('#chat-input').value.trim();if(!text)return;chatMessage(text,true);$('#chat-input').value='';chatMessage(reply(text));});
  $('#motivation').addEventListener('click',()=>chatMessage(motivation()));
  $('#coach-toggle').addEventListener('click',()=>setCoach(!coachOpen,true));
}
