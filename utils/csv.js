const CSV_COLUMNS=['user_id','name','email','goal','available_xp','lifetime_xp','completed_fasts','streak_days','water_ml','water_goal_ml','activity_minutes','activity_goal_minutes','calories_kcal','meals_logged','fasting_status','fast_target_hours','fast_elapsed_hours','snapshot_date','last_active','joined_date','mon_hours','tue_hours','wed_hours','thu_hours','fri_hours','sat_hours','sun_hours'];
function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');
  const rows=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c==='"'){if(field||closed)throw Error('Unexpected quote in CSV.');quoted=true;continue;}
    if(c===','||c==='\n'||c==='\r'){
      row.push(field);field='';closed=false;
      if(c!==','){if(row.some(v=>v.trim()))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}continue;
    }
    if(closed)throw Error('Unexpected characters after a quoted CSV field.');field+=c;
  }
  if(quoted)throw Error('Unclosed quote in CSV.');
  row.push(field);if(row.some(v=>v.trim()))rows.push(row);
  if(rows.length<2)throw Error('CSV needs a header and at least one user.');
  const headers=rows.shift().map(h=>h.trim());
  if(new Set(headers).size!==headers.length)throw Error('CSV has duplicate column names.');
  for(const column of CSV_COLUMNS)if(!headers.includes(column))throw Error(`Missing column: ${column}.`);
  const ids=new Set();
  return rows.map((cells,index)=>{
    const line=index+2;if(cells.length!==headers.length)throw Error(`Row ${line} has ${cells.length} fields; expected ${headers.length}.`);
    const u=Object.fromEntries(headers.map((h,i)=>[h,cells[i].trim()]));
    for(const key of ['user_id','name','goal'])if(!u[key]||u[key].length>200)throw Error(`Row ${line}: invalid ${key}.`);
    if(ids.has(u.user_id))throw Error(`Row ${line}: duplicate user_id ${u.user_id}.`);ids.add(u.user_id);
    for(const key of CSV_COLUMNS.filter(c=>!['user_id','name','email','goal','fasting_status','snapshot_date','last_active','joined_date'].includes(c))){
      if(!u[key]||!Number.isFinite(Number(u[key]))||Number(u[key])<0)throw Error(`Row ${line}: ${key} must be a nonnegative number.`);u[key]=Number(u[key]);
    }
    for(const key of ['available_xp','lifetime_xp','completed_fasts','streak_days','water_ml','water_goal_ml','activity_minutes','activity_goal_minutes','calories_kcal','meals_logged'])if(!Number.isSafeInteger(u[key]))throw Error(`Row ${line}: ${key} must be a whole number.`);
    if(u.available_xp>u.lifetime_xp)throw Error(`Row ${line}: available XP exceeds lifetime XP.`);
    if(u.water_goal_ml<250||u.water_goal_ml>10000||u.activity_goal_minutes<1||u.activity_goal_minutes>300||u.fast_target_hours<1||u.fast_target_hours>24)throw Error(`Row ${line}: goals are outside supported ranges.`);
    if(!['active','completed','idle'].includes(u.fasting_status))throw Error(`Row ${line}: fasting_status must be active, completed, or idle.`);
    for(const key of ['snapshot_date','joined_date']){if(!/^\d{4}-\d{2}-\d{2}$/.test(u[key])||Number.isNaN(Date.parse(u[key]))||new Date(u[key]).toISOString().slice(0,10)!==u[key])throw Error(`Row ${line}: ${key} needs a valid YYYY-MM-DD date.`);}
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(u.last_active)||Number.isNaN(Date.parse(u.last_active)))throw Error(`Row ${line}: last_active needs an ISO timestamp with timezone.`);
    return u;
  });
}
let csvUsers=parseCSV(BUNDLED_USER_CSV);
let activeCSVText=BUNDLED_USER_CSV;
let selectedUserId='';
let csvSource='Bundled users.csv snapshot';
let csvBusy=false;
let csvRequest=0;
function applyCSV(text,source){
  const next=parseCSV(text);
  csvUsers=next;activeCSVText=text;csvSource=source;if(!csvUsers.some(u=>u.user_id===selectedUserId))selectedUserId='';loadActiveState();render();
}
async function reloadCSV(){
  if(EMBEDDED_APP){toast('In Streamlit, use Refresh source CSV in the sidebar to reload the file. Import CSV also works here.');return;}
  if(location.protocol==='file:'){toast('Use Import CSV to load an edited file, or run python app.py to read data/users.csv directly.');return;}
  const request=++csvRequest;csvBusy=true;render();
  try{
    const response=await fetch('data/users.csv',{cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);
    const text=await response.text();if(request!==csvRequest)return;
    applyCSV(text,'Live data/users.csv');toast('User data refreshed from CSV.');
  }catch(error){if(request===csvRequest)toast(`CSV could not be loaded: ${error.message} Keeping the displayed data.`);}
  finally{if(request===csvRequest){csvBusy=false;render();}}
}
async function importCSV(file){
  if(!file)return;if(file.size>2*1024*1024){toast('Choose a CSV file smaller than 2 MB.');return;}
  const request=++csvRequest;csvBusy=true;render();
  try{const text=await file.text();if(request!==csvRequest)return;applyCSV(text,`Imported ${file.name}`);toast(`Loaded ${csvUsers.length} users from CSV.`);}
  catch(error){if(request===csvRequest)toast(`Import rejected: ${error.message} Displayed data was kept.`);}
  finally{if(request===csvRequest){csvBusy=false;render();}}
}
