function renderDashboard(){
  const info=fastInfo();const completed=completedFastCount();
  const water=totalFor('water'),activity=totalFor('activity');
  const history=[...state.logs.map(l=>({at:l.at,title:l.type==='water'?`Hydration · ${l.amount} ml`:l.type==='activity'?`${l.label} · ${l.amount} min`:`${l.label} · ${l.amount} kcal`,icon:l.type==='water'?'◉':l.type==='meal'?'♧':'↗'})),...state.history.map(f=>({at:f.end,title:f.completed?'Fast completed · +100 XP':'Fast ended early',icon:'◷'}))].sort((a,b)=>b.at-a.at).slice(0,4);
  const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening';
  return `${heading('YOUR WELLNESS, IN SYNC',`${greeting}, ${escapeHTML(state.profile.name)} <span style="font-size:24px">✦</span>`,'A little intention. A little consistency. A healthier you.')}
  <p class="session-summary">CSV starting snapshot · ${state.baseline?.snapshot_date||'No baseline'}. Today’s goals include same-day CSV totals and your new logs. Start a new live timer in Fasting Engine; a recorded CSV status does not start a timer.</p>
  <section class="grid metrics" aria-label="Your metrics">
    ${metric('Fasting streak',streak(),'days',streak()?'Keep the momentum going':'Your next chapter starts today','♨')}
    ${metric('Available XP',state.xp,'XP',`Level ${level()} · ${state.totalXP} lifetime XP`,'✧')}
    ${metric('Water today',(water/1000).toFixed(1),'L',`${(state.profile.waterGoal/1000).toFixed(1)} L daily goal`,'◉')}
    ${metric('Completed fasts',completed,'fasts',completed?'Every finish counts':'One small step at a time','◷')}
  </section>
  <div class="grid main-grid"><section class="card"><div class="card-head"><h2>Your fasting window</h2><span class="badge ${state.fast?'running':''}" data-fast-status>${state.fast?'● FASTING ACTIVE':'◷ READY WHEN YOU ARE'}</span></div>
    <div class="fast-overview">${ring(info.percent,`<div class="ring-number" data-fast-time>${state.fast?duration(info.elapsed):'00:00:00'}</div><small>${state.fast?'time elapsed':'a fresh start'}</small>`,!!state.fast)}
      <div class="overview-copy"><p class="eyebrow">${state.fast?'IN YOUR FASTING WINDOW':'MAKE SPACE FOR WELLNESS'}</p><h3>${state.fast?`${state.fast.hours}-hour fast`:'Find your fasting rhythm'}</h3><p>${state.fast?'Take it one moment at a time. Your progress is saved, even when you leave.':'Build a routine that fits your day. Choose your window and we’ll keep time.'}</p><button class="button" data-tab="fasting">${state.fast?'View active fast ↗':'Start your journey ↗'}</button></div>
    </div><div class="subrow"><span>◷ &nbsp; ${state.fast?'Target finish: '+timeLabel(state.fast.start+state.fast.hours*3600000):`Your default · ${state.profile.fastPreset}-hour fast`}</span><button class="text-button" data-tab="fasting">View history →</button></div></section>
    <section class="card"><div class="card-head"><h2>Daily intentions</h2><span class="badge">TODAY</span></div>
      <div class="habit"><div class="icon-box">◉</div><div class="habit-info"><strong>Stay hydrated <small>${water} / ${state.profile.waterGoal} ml</small></strong>${progress(water/state.profile.waterGoal*100)}</div></div>
      <div class="habit"><div class="icon-box">↗</div><div class="habit-info"><strong>Move your body <small>${activity} / ${state.profile.activityGoal} min</small></strong>${progress(activity/state.profile.activityGoal*100)}</div></div>
      <div class="habit"><div class="icon-box">◷</div><div class="habit-info"><strong>Follow your rhythm <small>${state.fast?Math.floor(info.percent)+'%':completed?'Ready for the next':'Ready to begin'}</small></strong>${progress(info.percent)}</div></div>
      <div class="subrow"><span>Small habits. Lasting change.</span><button class="text-button" data-action="quick-water">+ 250 ml water</button></div></section></div>
  <section class="card week-card"><div class="card-head"><div><h2>Your week at a glance</h2><p class="section-caption">Fasting hours completed over the last 7 days</p></div><div class="overview-tabs"><span class="selected">This week</span></div></div>${weekChart()}</section>
  <section class="card activity"><div class="card-head"><h2>Recent activity</h2><button class="text-button" data-tab="logger">View log →</button></div>${history.length?history.map(h=>`<div class="activity-row"><span class="icon-box" style="width:29px;height:29px;font-size:16px">${h.icon}</span><span>${escapeHTML(h.title)}</span><span class="muted">${dateLabel(h.at)} · ${timeLabel(h.at)}</span></div>`).join(''):'<p class="empty">Your story starts here. Log a glass of water or begin your first fast.</p>'}</section>`;
}
function weekChart(){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return {label:d.toLocaleDateString(undefined,{weekday:'short'}),hours:state.history.filter(f=>f.completed&&dayKey(f.end)===dayKey(d)).reduce((sum,f)=>sum+f.hours,0)};});
  const max=Math.max(24,...days.map(d=>d.hours));
  return `<div class="chart" role="img" aria-label="Fasting hours: ${days.map(d=>`${d.label} ${d.hours}`).join(', ')}"><div class="chart-axis"><span>${max}h</span><span>${Math.round(max/2)}h</span><span>0h</span></div>${days.map(d=>`<div class="chart-column"><span class="chart-value">${d.hours?d.hours+'h':''}</span><div class="bar" style="height:${d.hours/max*100}%"></div></div>`).join('')}</div><div class="chart-labels">${days.map(d=>`<span>${d.label}</span>`).join('')}</div>`;
}
