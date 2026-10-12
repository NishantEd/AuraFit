const MANTRAS=['Progress is built in small moments. Make this one count.','You don’t need a perfect day. You just need a kind next step.','Consistency is a promise you keep to yourself, one day at a time.','Rest, reset, and return. Your rhythm is yours to find.','Celebrate the effort. Every small habit is a vote for your future self.'];
function motivation(){return MANTRAS[Math.floor(Math.random()*MANTRAS.length)];}
function reply(text){
  const query=text.toLowerCase().replace(/[’']/g,'');
  if(/\b(hunger|hungry|starving|appetite)\b/.test(query))return 'Appetite can come in waves. Take a pause, sip water, or consider plain black coffee if it suits you. Check in with your body; it’s always okay to end your fast and eat when you need to.';
  if(/\b(rules|do|dont|beverage|break|allowed)\b/.test(query))return 'For a simple calorie-free fasting window, beverages usually mean water, unsweetened tea, or plain black coffee. Milk, sugar, juice, and food add calories. Choose a routine that works for you and follow any guidance from your clinician.';
  if(/\b(quote|motivation|motivate|inspire)\b/.test(query))return motivation();
  if(/\b(water|hydration|drink|thirsty)\b/.test(query))return `Keep water within reach and log it as you go. Your personal goal is ${state.profile.waterGoal} ml, and you’ve logged ${totalFor('water')} ml today. Adjust your goal in Profile to fit your needs.`;
  if(/\b(fitness|exercise|movement|workout)\b/.test(query))return 'A small movement break can be a good place to begin. Choose something you enjoy and log your minutes in the Logger. Consistency starts with showing up.';
  return 'I’m here for the small steps. Ask me about water intake, fitness motivation, managing hunger, or fasting rules — or tap Random Motivation for a little encouragement.';
}
function chatMessage(text,user=false){const bubble=document.createElement('div');bubble.className=`bubble${user?' user':''}`;bubble.textContent=text;$('#chat-log').appendChild(bubble);while($('#chat-log').children.length>60)$('#chat-log').firstElementChild.remove();$('#chat-log').scrollTop=$('#chat-log').scrollHeight;}
function setCoach(open,save=true){state.profile.coachOpen=open;$('#coach').classList.toggle('collapsed',!open);$('#coach-toggle').textContent=open?'−':'+';$('#coach-toggle').setAttribute('aria-expanded',String(open));$('#coach-toggle').setAttribute('aria-label',open?'Collapse coach':'Expand coach');if(save)persist();}
