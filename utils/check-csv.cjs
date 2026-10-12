const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
const storage=new Map([['aurafit.workspace.v2',JSON.stringify({view:'user',selectedId:'legacy-user'})]]);
function element(){let content='';const classes=new Set();return {get innerHTML(){return content},set innerHTML(value){content=value;this.children=[]},textContent:'',hidden:false,value:'',children:[],attributes:{},listeners:{},scrollHeight:100,scrollTop:0,classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key)},contains:key=>classes.has(key)},style:{properties:{},setProperty(key,value){this.properties[key]=value}},setAttribute(key,value){this.attributes[key]=value},addEventListener(name,handler){this.listeners[name]=handler},appendChild(child){this.children.push(child)},focus(){},click(){}};}
const elements=new Map();
let fetchResponse={ok:true,status:200,text:async()=>fs.readFileSync(path.join(root,'data/users.csv'),'utf8')};
const context={console,Date,Math,Number,String,JSON,Set,Blob,URL,Error,setTimeout(){},clearTimeout(){},setInterval(){},confirm:()=>true,location:{protocol:'file:'},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},fetch:async()=>fetchResponse,document:{documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll:()=>[],addEventListener(){},createElement:()=>element()},window:{addEventListener(){},scrollTo(){}}};
vm.createContext(context);vm.runInContext(source,context);
const run=code=>vm.runInContext(code,context);
const sample=fs.readFileSync(path.join(root,'data/users.csv'),'utf8');
assert.equal(run('csvUsers.length'),3);assert.equal(run('selectedUserId'),'');assert(elements.get('#main').innerHTML.includes('User directory'));assert.equal(elements.get('#navigation').hidden,false);assert.equal(elements.get('#coach').hidden,false);
assert.equal(run('BUNDLED_USER_CSV'),sample);assert.equal(run('csvUsers[0].available_xp'),340);
assert.equal(run('appView'),'owner');run('setAppView("user")');assert.equal(run('appView'),'user');assert.equal(run('selectedUserId'),'AF001');assert(!elements.get('#main').innerHTML.includes('User directory'));assert(!elements.get('#main').innerHTML.includes('Community XP'));assert(!elements.get('#main').innerHTML.includes('id="csv-file"'));run('setAppView("owner")');assert.equal(run('selectedUserId'),'');
assert(html.includes('#theme-select option{background-color:#FFFFFF;color:#172033}'));
for(const id of ['AF001','AF002','AF003']){
  run(`selectCSVUser('${id}')`);assert.equal(run('selectedCSVUser().user_id'),id);
  const detail=run('renderSelectedUser(selectedCSVUser())');assert(detail.includes(run('selectedCSVUser().name')));
  for(const other of ['AF001','AF002','AF003'].filter(v=>v!==id))assert(!detail.includes(run(`csvUsers.find(u=>u.user_id==='${other}').name`)));
  assert(!detail.includes('Community XP'));
}
run('selectCSVUser("missing")');assert.equal(run('selectedUserId'),'AF003');run('selectCSVUser("")');assert(elements.get('#main').innerHTML.includes('User directory'));
assert(run('reply("water").includes("Select a user")'));assert(run('reply("STARVING").includes("Appetite")'));assert(run('reply("DONT add milk").includes("Milk")'));assert(run('MANTRAS.includes(reply("MOTIVATION"))'));
run('selectCSVUser("AF001")');assert(run('reply("water").includes("1750 ml")'));assert(!run('reply("water").includes("Jordan")'));
elements.get('#chat-input').value='Show my STATS';elements.get('#chat-form').listeners.submit({preventDefault(){}});assert.equal(elements.get('#chat-input').value,'');assert(elements.get('#chat-log').children.at(-1).textContent.includes('Alex Morgan'));
run('selectCSVUser("AF002")');assert(!elements.get('#chat-log').children.some(c=>c.textContent.includes('Alex Morgan')));assert(run('reply("movement").includes("60 movement minutes")'));
run('selectCSVUser("AF001")');assert(elements.get('#chat-log').children.some(c=>c.textContent==='Show my STATS'));
elements.get('#motivation').listeners.click();assert(run('MANTRAS.includes(coachConversations.get("AF001").at(-1).text)'));
elements.get('#coach-toggle').listeners.click();assert.equal(elements.get('#coach-toggle').attributes['aria-expanded'],'false');assert(elements.get('#coach').classList.contains('collapsed'));elements.get('#coach-toggle').listeners.click();assert.equal(elements.get('#coach-toggle').attributes['aria-expanded'],'true');
run('chatMessage("<script>alert(1)</script>",true)');assert.equal(elements.get('#chat-log').children.at(-1).textContent,'<script>alert(1)</script>');assert.equal(elements.get('#chat-log').children.at(-1).innerHTML,'');
context.sample=sample;
assert.equal(run('parseCSV("\\uFEFF"+sample.replace(/\\n/g,"\\r\\n")).length'),3);
context.quotedCSV=sample.replace('Alex Morgan','"Alex, ""Ace"" Morgan"');
assert.equal(run('parseCSV(quotedCSV)[0].name'),'Alex, "Ace" Morgan');
assert.equal(run('parseCSV(sample.replace("Build consistent habits",\'"Build\\nconsistent habits"\'))[0].goal'),'Build\nconsistent habits');
for(const code of ['parseCSV(sample.replace("available_xp","bad_header"))','parseCSV(sample.replace("340,840","-1,840"))','parseCSV(sample.replace("AF002,","AF001,"))','parseCSV(sample.replace("2026-10-12,","2026-02-30,"))','parseCSV(sample.replace("active,16","unknown,16"))','parseCSV(sample+\'"broken\')'])assert.throws(()=>run(code));
run('selectCSVUser("AF001");applyCSV(sample.replace("340,840","400,840"),"Test CSV")');assert.equal(run('selectedCSVUser().available_xp'),400);assert.equal(run('selectedUserId'),'AF001');
assert.throws(()=>run('applyCSV("bad","broken")'));assert.equal(run('selectedCSVUser().available_xp'),400);assert.equal(run('csvSource'),'Test CSV');
run('applyCSV(sample.replace("Alex Morgan","<img src=x onerror=alert(1)>"),"Escape test")');assert(!run('renderSelectedUser(selectedCSVUser())').includes('<img'));assert(run('renderSelectedUser(selectedCSVUser())').includes('&lt;img'));
for(const theme of ['obsidian','ocean','forest','rose','amber','daylight']){run(`setTheme('${theme}')`);assert.equal(storage.get('aurafit.theme.v1'),theme);assert.equal(context.document.documentElement.style.properties['--bg'],run(`THEMES.${theme}.bg`));}
assert.equal(context.document.documentElement.style.properties['color-scheme'],'light');
assert(!html.includes('{{STYLES}}'));assert(!html.includes('{{SCRIPT}}'));
run('setAppView("user");selectCSVUser("AF003");setAppView("owner")');assert.equal(run('appView'),'owner');assert.equal(run('selectedUserId'),'AF001');
async function asyncChecks(){
  context.location.protocol='http:';
  await run('reloadCSV()');assert.equal(run('csvSource'),'Live data/users.csv');assert.equal(run('selectedCSVUser().available_xp'),340);
  fetchResponse={ok:false,status:404};await run('reloadCSV()');assert.equal(run('csvUsers.length'),3);assert(elements.get('#toast').textContent.includes('404'));assert.equal(run('csvBusy'),false);
  context.file={name:'edited.csv',size:100,text:async()=>sample.replace('340,840','450,840')};await run('importCSV(file)');assert.equal(run('selectedCSVUser().available_xp'),450);assert.equal(run('csvSource'),'Imported edited.csv');assert(run('activeCSVText.includes("450,840")'));
  context.file={name:'bad.csv',size:100,text:async()=>'bad'};await run('importCSV(file)');assert.equal(run('selectedCSVUser().available_xp'),450);assert(elements.get('#toast').textContent.includes('Import rejected'));
  context.file={name:'huge.csv',size:3000000,text:async()=>sample};await run('importCSV(file)');assert.equal(run('selectedCSVUser().available_xp'),450);
  let release;context.file={name:'slow.csv',size:100,text:()=>new Promise(resolve=>{release=resolve})};const slow=run('importCSV(file)');context.file={name:'new.csv',size:100,text:async()=>sample.replace('340,840','500,840')};await run('importCSV(file)');release(sample);await slow;assert.equal(run('selectedCSVUser().available_xp'),500);
  run('applyCSV(sample.split("\\n").filter(line=>!line.startsWith("AF001,")).join("\\n"),"Removed selected user")');assert.equal(run('selectedUserId'),'');assert.equal(run('csvUsers.length'),2);
  assert.equal(JSON.parse(storage.get('aurafit.workspace.v2')).selectedId,'legacy-user');
  console.log('PASS: owner CSV dashboard, isolated user data, six themes, CSV validation/loading, chat submission and selected-user replies, separate conversations, motivation, collapse/expand, safe chat text, error handling, legacy data untouched.');
}
asyncChecks().catch(error=>{console.error(error);process.exitCode=1});
