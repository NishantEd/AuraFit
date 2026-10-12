'use strict';
const $=selector=>document.querySelector(selector);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=value=>new Date(value.length===10?value+'T12:00:00':value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const timeLabel=value=>new Date(value).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
const metric=(label,value,unit,note,icon)=>`<article class="card metric"><div><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${unit}</small></div><div class="metric-note">${note}</div></div><div class="icon-box" aria-hidden="true">${icon}</div></article>`;
function progress(value,label='Goal progress'){const v=Math.max(0,Math.min(100,value));return `<div class="progress" role="progressbar" aria-label="${escapeHTML(label)}" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><span style="--value:${v}%"></span></div>`;}
function heading(eyebrow,title,description){return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><span class="date-pill">♜ &nbsp; Owner workspace</span></div>`;}
let toastTimeout;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').hidden=true,5000);}
