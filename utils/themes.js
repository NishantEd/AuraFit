const THEMES={
  obsidian:{name:'Obsidian Violet',scheme:'dark',bg:'#0B0F19',surface:'#161F30',border:'#24324D',accent:'#8B5CF6',accentText:'#C4AAFF',text:'#F9FAFB',muted:'#9CA3AF',nav:'#0E1421',input:'#0F1726'},
  ocean:{name:'Midnight Ocean',scheme:'dark',bg:'#07141E',surface:'#102736',border:'#214458',accent:'#0891B2',accentText:'#67E8F9',text:'#F0FAFF',muted:'#A0BAC8',nav:'#0A1C28',input:'#0A1D2A'},
  forest:{name:'Forest Emerald',scheme:'dark',bg:'#091611',surface:'#13291F',border:'#294A38',accent:'#047857',accentText:'#6EE7B7',text:'#F0FDF4',muted:'#A5BCAF',nav:'#0D1E16',input:'#0D2017'},
  rose:{name:'Velvet Rose',scheme:'dark',bg:'#180E19',surface:'#2B1B2C',border:'#50314C',accent:'#BE185D',accentText:'#F9A8D4',text:'#FFF1F8',muted:'#C4AAC0',nav:'#201323',input:'#201422'},
  amber:{name:'Golden Hour',scheme:'dark',bg:'#18130B',surface:'#2B2418',border:'#4C4027',accent:'#B45309',accentText:'#FCD34D',text:'#FFFBEB',muted:'#C5B998',nav:'#201A10',input:'#211B10'},
  daylight:{name:'Daylight',scheme:'light',bg:'#F3F5FA',surface:'#FFFFFF',border:'#D6DEEC',accent:'#6D28D9',accentText:'#6D28D9',text:'#172033',muted:'#58657A',nav:'#FFFFFF',input:'#F6F8FC'}
};
const THEME_KEY='aurafit.theme.v1';
function setTheme(id,save=true){
  if(!THEMES[id])id='obsidian';const theme=THEMES[id];const root=document.documentElement;
  for(const key of ['bg','surface','border','accent','text','muted','nav','input'])root.style.setProperty(`--${key}`,theme[key]);
  root.style.setProperty('--accent-text',theme.accentText);root.style.setProperty('color-scheme',theme.scheme);root.setAttribute('data-theme',id);
  $('#theme-select').value=id;$('meta[name="theme-color"]').setAttribute('content',theme.bg);
  if(save)try{localStorage.setItem(THEME_KEY,id);}catch{toast('Theme applied for this session.');}
}
function savedTheme(){try{return localStorage.getItem(THEME_KEY)||'obsidian';}catch{return 'obsidian';}}
