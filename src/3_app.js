(function(){
'use strict';
/* =====================================================================
   Grid Blocks — panel UI. Runs in a browser and as a CEP panel in AE.
   ===================================================================== */
const $=(s,e)=>(e||document).querySelector(s);
const $$=(s,e)=>Array.prototype.slice.call((e||document).querySelectorAll(s));
const cep=window.__adobe_cep__;
const inAE=!!(cep&&cep.evalScript);
const inWeb=!inAE&&typeof location!=='undefined'&&/^https?:$/.test(location.protocol);
const webGet=k=>{if(!inWeb)return null;try{return localStorage.getItem('gridblocks.'+k);}catch(e){return null;}};
const webSet=(k,v)=>{if(!inWeb)return;try{localStorage.setItem('gridblocks.'+k,v);}catch(e){}};
const HOST=$('#host-src').textContent;
/* Avalanche brand palette (2026): red is the accent; slate, darks and blue support it */
const PALETTE=[
  '#E6212F','#B20F2A','#820419','#3D000A','#FF7F7B','#FEAFAC',            // red family
  '#1F1F1F','#16261C','#121212','#000000','#3B484B','#A2AFB2','#EBF0FA',  // neutrals & darks
  '#0061E2','#0E4DA0','#0C3F83','#05295B','#3176D3','#749DD3','#C5CFF5'   // blue family
];
const BRAND={red:'#E6212F',slate:'#A2AFB2',steel:'#3B484B',bg:'#1F1F1F',dark:'#121212',light:'#EBF0FA',blue:'#0061E2'};
const clone=o=>JSON.parse(JSON.stringify(o));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hexRgb=h=>{h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const lum=h=>{const c=hexRgb(h);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contrast=h=>lum(h)>.55?'#121212':'#EBF0FA';
const r3=v=>Math.round(v*1000)/1000;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const LS1=String.fromCharCode(0x2028), LS2=String.fromCharCode(0x2029);
const jsStr=s=>JSON.stringify(s).split(LS1).join('\\u2028').split(LS2).join('\\u2029');

/* ------------------------------------------------------------------ document (saved) */
const DEF={
  v:5,
  comp:{w:1920,h:1080,fps:24,dur:10,follow:true},
  grid:{rows:7,colsMode:'bleed',cols:12,gutter:1,margin:0,offsetX:0,snap:true,overX:8,overY:1},
  look:{bgOn:true,bg:'#1F1F1F',linesOn:true,line:'#3B484B',lineW:1,border:false,cellsMode:'none',cell:'#3B484B',
        rulesOn:false,rule:'#3B484B',ruleW:1,ruleEvery:4,ruleStart:1,ruleLayer:'top',ruleParallax:100,ruleEnd:'stay',ruleFadeAt:0,ruleFadeLen:24},
  block:{w:3,h:1,color:'#E6212F',color2:'#A2AFB2',color3:'#0061E2',color4:'#FF7F7B',upColor:'#FF7F7B',downColor:'#A2AFB2',ncol:2,sync:true,mix:'single',mixPct:25},
  palette:PALETTE.slice(),
  trans:{in:{on:false,mode:'clear',start:0,atEnd:false,dur:24,pattern:'walk',blockColors:true,dir:'fwd',w:0,h:0,len:8,appear:'wipe',curve:[0.33,0,0.67,1],cover:false,color:'#E6212F',output:'blocks',seed:3},
         out:{on:false,mode:'build',start:72,atEnd:false,dur:24,pattern:'walk',blockColors:true,dir:'fwd',w:0,h:0,len:8,appear:'wipe',curve:[0.33,0,0.67,1],cover:false,color:'#E6212F',output:'blocks',seed:5}},
  fill:{on:true,seed:7,density:'medium',family:'Aeonik Fono',style:'Regular',font:'AeonikFono-Regular',size:8,leading:100,caps:'upper',
        textColor:'#121212',outlinePct:0,outlineW:2,skipText:true,textPct:60,patternPct:40,dotSpacing:8,iconPct:20,iconSize:24,iconLib:'pixel',buildDur:12,graphW:1.5,look:'custom',
        mix:{text:45,graph:30,combo:25},graphs:{line:true,step:false,area:true,bars:true,hist:false,candles:true,meter:true,heat:true,network:true,wave:false,depth:false},
        combos:{stat:true,badge:true,iconrow:true,labelgraph:true,frame:false},pats:{cross:true,hatch:false,scan:false},
        pxSet:{cube:true,blocks:true,chain:true,lock:true,key:false,shield:true,bolt:true,check:true,hash:true,server:true,network:true,globe:true,wallet:false,db:true,chart:true,transfer:true,clock:true,pulse:true,snow:true,peak:true,term:true,stack:true,view:true,token:true,coin:false,doc:false,bank:false,up:true},
        mods:{kv:true,status:true,hashes:true,block:true,log:false,counter:true,dev:true,barcode:true,phrase:true,term:true,mempool:true,validator:true,latency:true,rpc:false,progress:true,consensus:true,stream:false,dots:true,ring:false,logo:true,icons:true},
        iconSet:{node:true,cube:true,chain:true,check:true,chevrons:true,peak:true,lock:false,network:true,signal:true,target:false,snow:true,arrow:true,plus:false,bars:true},dotSize:2.2,dotShape:'circle',
        anim:{inMode:'type',inDur:8,outMode:'typeoff',hold:36,outDur:12,typeAll:true,cps:69,ellipsis:true,count:true,countDur:36,scramble:true,scrMode:'settle',scrDur:30,scrRate:12,stagger:4,delay:9,live:false,liveTick:true,liveHash:true,liveGlitch:false,liveRate:6,glitchAmt:15,liveGraph:true,liveBlink:true,anchor:'block'},win:{on:null,off:null},
        gap:{on:true,amount:3,seed:0,color:'#E6212F',win:{on:null,off:null},anim:{own:true,anchor:'block',delay:12,jitter:10,leaveWith:true,inMode:'type',cps:60,inDur:8,buildDur:12,outMode:'fade',hold:48,outDur:12},mods:{log:true,phrase:true,barcode:true,hashes:false,dots:true,logo:true,icons:true,graph:true,stream:false,rpc:false}}},
  echo:{on:false,dx:0,dy:2,last:0,fill:true,color:'#A2AFB2',opacity:100,stroke:false,sw:4,scolor:'#A2AFB2',align:'center',dash:false,dashL:12,dashG:8,content:false,
        timing:'with',offset:6,appear:'fade',out:'stay',hold:12,outF:8},
  rand:{endSingle:false,pattern:'walk',count:0,gap:0,rise:1,gapMin:0,gapMax:2,startRow:0,startCol:null,startR:null,bleed:true,mode:'replace',echo:false,echoDX:0,echoDY:2,echoLast:0,seed:1337,
        wander:1,climb:0,stackPct:20,stackGap:0,stairPct:15,jumpPct:5,multiCol:true},
  text:{family:'Aeonik Fono',style:'Regular',font:'AeonikFono-Regular',size:48,align:'center',pad:24,offX:0,offY:0,tracking:0,leading:0,kern:'metrics',caps:'none'},
  anim:{seed:0,landLead:12,outLead:12,skip:[],cutAt:null,dt:{},dx:{},remapLen:0,camEase:8,paceUnit:'f',settleX:50,endFix:'reroute',reroutePct:30,mode:'camera',order:'ltr',orderSeed:7,groupCol:false,startF:0,lenF:72,toEnd:false,countMode:'fill',pace:5,total:24,trans:1,motion:'smooth',camMove:'curve',stepEvery:2,appear:'wipe',
        axis:'x',lazy:true,snap:true,smooth:1.5,settle:18,settleEase:true,motionBlurF:4,revealWhen:'arrive',revealX:75,revealY:100,relOn:false,relAt:85,relSlow:36,tail:24,
        sceneCurve:[0.42,0,0.58,1],curvePh:null,sceneEase:{on:true,hd:null,holdH:null,onAt:null,holdAt:null,start:40,land:75,landOut:50,leaveIn:50,leave:60,end:40,mid:'point'},camCurve:[0.33,0,0.67,1],zoomCurve:[0.65,0,0.35,1],revCurve:[0.25,0.1,0.25,1],endX:50,endY:50,finalMove:30,
        zoomOn:false,extendOn:true,extendMode:'walk',ending:'count',extendN:16,endAt:null,endRow:3,unpicked:'hidden',wrap:true,zoom:[{on:true,closed:false,rows:14,mode:'frames',f0:4,f1:28,at:1,off:0,dur:24,rev:true,sx:0,sy:0,ex:0,ey:0}]},
  lab:{flicker:{on:false,frames:8,seed:3},
       pulse:{on:false,scale:1.35,len:18,width:2,color:'#E6212F'},
       trail:{on:false,count:3,length:1.2,len:12,width:2,color:'#A2AFB2'},
       bar:{on:false,height:3,len:24,color:'#121212'},
       ticker:{on:false,y:94,size:14,speed:160,color:'#A2AFB2',band:true,bandColor:'#121212'},
       snow:{on:false,count:90,speed:240,size:2,stretch:6,dir:'left',color:'#EBF0FA',opacity:55,seed:9}},
  num:{on:true,fmt:'01',start:1,color:'#121212',size:12,opacity:100},
  timing:{beats:[],markers:[],use:'beats',offset:0,sync:false,sens:1.3,minGap:4,media:null,video:true,videoOpacity:60,sound:true},
  exit:{on:false,holdOn:true,walkHold:24,walkPace:1,walkLen:48,walkFollow:60,trail:3,slide:1.5,mode:'hold',hold:36,at:24,stagger:3,order:'same',line:10,style:'wipe',dir:'same',len:8,curve:[0.5,0,0.75,0],content:true,echo:true},
  out:{replace:true,lock:true,fitDur:true,rig:'camera',mb:true,mbAngle:180,folder:true,preGrid:true,preBlocks:true,preTrans:true,shy:true,trim:true,markers:true},
  blocks:[]
};
/* the Avalanche HUD example (what used to be the default): rules, starter walk, transitions, grid zoom */
const EXAMPLE={look:{rulesOn:true},trans:{in:{on:true},out:{on:true}},anim:{zoomOn:true},
  blocks:[{"id": 1, "c": 0, "r": 1, "w": 3, "h": 1, "color": "#E6212F"}, {"id": 2, "c": 0, "r": 3, "w": 3, "h": 1, "color": "#E6212F", "stack": true}, {"id": 3, "c": 3, "r": 2, "w": 3, "h": 1, "color": "#E6212F"}, {"id": 4, "c": 6, "r": 3, "w": 3, "h": 1, "color": "#E6212F"}, {"id": 5, "c": 9, "r": 2, "w": 3, "h": 1, "color": "#E6212F"}, {"id": 6, "c": 12, "r": 2, "w": 3, "h": 1, "color": "#E6212F"}]};
let D=clone(DEF);
let uid=1;
/* UI state (not saved) */
const U={step:0,ctx:null,ctab:'hud',dopeSel:[],mbPrev:true,tool:'select',sel:null,selIds:[],hover:null,t:null,playing:false,live:false,genBase:null,
  compLive:false,aeName:'',moNext:1,showOrder:true,editing:null,space:false,drag:null,lib:[],help:true,loop:true,picking:false,fonts:null};

const SI=id=>STEPS.findIndex(s=>s.id===id);
/* steps shown while we workshop the UX one step at a time — add ids to bring a step back.
   ?steps=all in the URL (or localStorage gridblocks.steps='all') shows everything */
const VISIBLE_STEPS=['grid','layout','animate','content'];
const stepVisible=i=>{try{if(/[?&]steps=all/.test(location.search||'')||localStorage.getItem('gridblocks.steps')==='all')return true;}catch(e){} return !!STEPS[i]&&VISIBLE_STEPS.indexOf(STEPS[i].id)>=0;};
const nextVisible=(i,d)=>{for(let j=i+d;j>=0&&j<STEPS.length;j+=d) if(stepVisible(j)) return j; return -1;};
const STEPS=[
  {id:'grid',name:'Setup',title:'Comp, grid & look',desc:'Rows always fit the comp height. Squares can run off the sides.',tools:['hand'],tool:'hand',insp:false},
  {id:'layout',name:'Blocks',title:'Generate the line',desc:'Pick a block size and generate a walking line from a seed. Then drag any block on the canvas, or retime it on the timeline.',tools:['select','stamp','draw','hand'],tool:'select',insp:true},
  {id:'animate',name:'Motion',title:'Camera, reveal & exit',desc:'How the view moves and how blocks appear and leave. When things happen lives on the timeline.',tools:['select','hand'],tool:'select',insp:true},
  {id:'content',name:'Content',title:'Content overlays',desc:'Each overlay has its own tab. They show up as rows on the timeline.',tools:['select','hand'],tool:'select',insp:true},
  {id:'transitions',name:'Transitions',title:'Transition in & out',desc:'Blocks that fill the frame to bring the scene in and take it out. “Walk” transitions grow out of the line itself.',tools:['hand'],tool:'hand',insp:false},
  {id:'lab',name:'Lab',title:'Lab · experiments',desc:'Momentum effects to try out. Each card says how far along it is and whether it builds in After Effects.',tools:['hand'],tool:'hand',insp:false},
  {id:'build',name:'Output',title:'Build it',desc:'',tools:['select','hand'],tool:'select',insp:true}
];
const RAIL_ICON={
  grid:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M2.5 8h15M2.5 12h15M7.5 3.5v13M12.5 3.5v13"/></svg>',
  layout:'<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="1.5" y="11" width="6" height="4" rx="1"/><rect x="7.5" y="7" width="6" height="4" rx="1" opacity=".7"/><rect x="13.5" y="3" width="5" height="4" rx="1" opacity=".45"/></svg>',
  animate:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2.5" y="5" width="10" height="10" rx="2"/><path d="M15 10h3.5m-1.5-2 2 2-2 2"/></svg>',
  content:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M5.5 7.5h6M5.5 10.5h9M5.5 13.5h4"/></svg>',
  transitions:'<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="3" width="4" height="14" rx="1"/><rect x="8" y="3" width="4" height="14" rx="1" opacity=".6"/><rect x="14" y="3" width="4" height="14" rx="1" opacity=".3"/></svg>',
  lab:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 2.5h4M8.5 2.5v5L4 16a1 1 0 0 0 .9 1.5h10.2A1 1 0 0 0 16 16l-4.5-8.5v-5"/><path d="M6 13h8"/></svg>',
  build:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v9m-3.5-3.5L10 12l3.5-3.5M4 16h12"/></svg>'
};
/* contexts: what the properties panel shows when you click a timeline row */
const CTX={
  scene:{t:'Scene · time remap',e:'Timeline · Scene',d:'A layer over the blocks: its length is the scene, and its curve speeds up or slows down the whole block timeline (In · Hold · Out) — like time remapping in AE.'},
  camera:{t:'Camera',e:'Timeline · Camera',d:'How the view travels with the line. The Camera row shows its speed.'},
  inout:{t:'Blocks · On, Hold, Off',e:'Timeline · Blocks',d:'The blocks run on their own steady clock: On (the build), Hold, Off. The Scene layer above then re-times all of it.'},
  sound:{t:'Sync to sound',e:'Timeline · Sound',d:'Load audio or video, or read markers from After Effects, and snap the reveals to the beat.'},
  'trans-in':{t:'Transition in',e:'Timeline · Transitions',d:'Drag the green clip on the timeline to move it; drag its ends to change its length.'},
  'trans-out':{t:'Transition out',e:'Timeline · Transitions',d:'Drag the yellow clip on the timeline to move it; drag its ends to change its length.'}
};
const ICON={
  select:'<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 1.8v11.4l3-2.9 1.9 4.3 1.8-.8-1.9-4.2h4.2z"/></svg>',
  stamp:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="5" width="13" height="6" rx="1" fill="currentColor" fill-opacity=".3"/><path d="M8 1v3M6.5 2.5h3"/></svg>',
  draw:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="10" rx="1" stroke-dasharray="2 1.6"/><path d="M8 6v4M6 8h4"/></svg>',
  erase:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M9.5 2.5 14 7l-6 6H4.5L2 10.5z"/><path d="M6 6l4.5 4.5M8 13h6"/></svg>',
  order:'<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="4" r="2.6"/><circle cx="12" cy="12" r="2.6"/><path d="M6 5.5l4.5 4.5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>',
  paint:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2.5 7.5 8 2l5.5 5.5L8 13z"/><path d="M2.5 7.5h11"/><path d="M14 10.5c0 1-.7 1.8-1 2.5-.3-.7-1-1.5-1-2.5a1 1 0 0 1 2 0z" fill="currentColor"/></svg>',
  hand:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5v13M1.5 8h13M8 1.5 6 3.5M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2"/></svg>'
};
const TOOLS={
  select:{key:'V',name:'Select & move',desc:'Click to select, drag to move. Drag over empty squares to select an area.'},
  stamp:{key:'S',name:'Stamp',desc:'Click or drag to place blocks at your chosen size.'},
  draw:{key:'B',name:'Draw block',desc:'Drag a rectangle to make a block of any size.'},
  erase:{key:'E',name:'Unmerge',desc:'Drag over blocks to break those squares back out.'},
  order:{key:'O',name:'Order',desc:'Click blocks in the order they should appear.'},
  paint:{key:'C',name:'Paint colour',desc:'Click or drag over blocks to paint them the main colour. Alt-click a block to pick up its colour.'},
  hand:{key:'H',name:'Pan',desc:'Drag to move around. Hold Space and drag for this anytime (tap Space to play / pause).'}
};

/* ------------------------------------------------------------------ fonts */
const FALLBACK_FONTS=[
  ['Aeonik',[['Air','Aeonik-Air'],['Air Italic','Aeonik-AirItalic'],['Thin','Aeonik-Thin'],['Thin Italic','Aeonik-ThinItalic'],['Light','Aeonik-Light'],['Light Italic','Aeonik-LightItalic'],['Regular','Aeonik-Regular'],['Italic','Aeonik-RegularItalic'],['Medium','Aeonik-Medium'],['Medium Italic','Aeonik-MediumItalic'],['Bold','Aeonik-Bold'],['Bold Italic','Aeonik-BoldItalic'],['Black','Aeonik-Black'],['Black Italic','Aeonik-BlackItalic']]],
  ['Aeonik Fono',[['Air','AeonikFono-Air'],['Thin','AeonikFono-Thin'],['Light','AeonikFono-Light'],['Regular','AeonikFono-Regular'],['Medium','AeonikFono-Medium'],['Bold','AeonikFono-Bold'],['Black','AeonikFono-Black']]],
  ['Arial',[['Regular','ArialMT'],['Bold','Arial-BoldMT'],['Italic','Arial-ItalicMT'],['Bold Italic','Arial-BoldItalicMT'],['Black','Arial-Black']]],
  ['Helvetica Neue',[['Light','HelveticaNeue-Light'],['Regular','HelveticaNeue'],['Medium','HelveticaNeue-Medium'],['Bold','HelveticaNeue-Bold']]],
  ['Inter',[['Light','Inter-Light'],['Regular','Inter-Regular'],['Medium','Inter-Medium'],['SemiBold','Inter-SemiBold'],['Bold','Inter-Bold'],['Black','Inter-Black']]],
  ['Roboto',[['Light','Roboto-Light'],['Regular','Roboto-Regular'],['Medium','Roboto-Medium'],['Bold','Roboto-Bold'],['Black','Roboto-Black']]],
  ['Montserrat',[['Regular','Montserrat-Regular'],['Medium','Montserrat-Medium'],['SemiBold','Montserrat-SemiBold'],['Bold','Montserrat-Bold'],['ExtraBold','Montserrat-ExtraBold']]],
  ['Avenir Next',[['Regular','AvenirNext-Regular'],['Medium','AvenirNext-Medium'],['Demi Bold','AvenirNext-DemiBold'],['Bold','AvenirNext-Bold'],['Heavy','AvenirNext-Heavy']]],
  ['Futura',[['Medium','Futura-Medium'],['Bold','Futura-Bold'],['Condensed ExtraBold','Futura-CondensedExtraBold']]],
  ['Gill Sans',[['Light','GillSans-Light'],['Regular','GillSans'],['SemiBold','GillSans-SemiBold'],['Bold','GillSans-Bold']]],
  ['Georgia',[['Regular','Georgia'],['Bold','Georgia-Bold'],['Italic','Georgia-Italic']]],
  ['Times New Roman',[['Regular','TimesNewRomanPSMT'],['Bold','TimesNewRomanPS-BoldMT'],['Italic','TimesNewRomanPS-ItalicMT']]],
  ['Courier New',[['Regular','CourierNewPSMT'],['Bold','CourierNewPS-BoldMT']]]
].map(f=>({family:f[0],styles:f[1].map(s=>({style:s[0],ps:s[1]}))}));
const BRAND_FONTS=['Aeonik','Aeonik Fono'];
function fontList(){
  if(!U.fonts) return FALLBACK_FONTS;
  // the installed list from AE, plus the brand families if they're missing (so they can still be chosen)
  const have=new Set(U.fonts.map(f=>f.family.toLowerCase()));
  return FALLBACK_FONTS.filter(f=>BRAND_FONTS.indexOf(f.family)>=0&&!have.has(f.family.toLowerCase())).concat(U.fonts);
}
/* are the brand fonts usable? AE: in the installed font list. Browser: installed locally or in /fonts. */
U.fontState={};
async function checkBrandFonts(){
  for(const fam of BRAND_FONTS){
    let st='unknown';
    if(inAE){ st=U.fonts?(U.fonts.some(f=>f.family.toLowerCase()===fam.toLowerCase())?'ok':'missing'):'unknown'; }
    else { try{ const r=await document.fonts.load(`400 16px "${fam}"`); st=r&&r.length?'ok':'missing'; }catch(e){ st='unknown'; } }
    U.fontState[fam]=st;
  }
  renderFontStatus();
}
function renderFontStatus(){
  const s=f=>{const v=U.fontState[f];return v==='ok'?`<b class="ok">✓ ${f}</b>`:v==='missing'?`<b class="no">✗ ${f}</b>`:`${f} ?`;};
  const miss=BRAND_FONTS.filter(f=>U.fontState[f]==='missing');
  const tip=miss.length?(inAE?' — not installed on this computer, so After Effects will swap in another font. Install it, restart AE, then reopen the panel.':' — not installed here. The preview uses a stand-in; install the fonts (or drop them in the fonts/ folder) to see them.'):'';
  $$('[data-fontstatus]').forEach(el=>{el.innerHTML='Brand fonts: '+BRAND_FONTS.map(s).join(' · ')+tip;});
}
function parseFonts(tsv){
  const map={};
  String(tsv).split('\n').forEach(l=>{const p=l.split('\t');if(p.length<3||!p[0])return;(map[p[0]]=map[p[0]]||[]).push({style:p[1],ps:p[2]});});
  const out=Object.keys(map).sort((a,b)=>a.localeCompare(b)).map(f=>({family:f,styles:map[f]}));
  return out.length?out:null;
}
function findFamily(name){const n=String(name||'').toLowerCase();return fontList().find(f=>f.family.toLowerCase()===n)||null;}
function pickStyle(fam,want){
  if(!fam) return null;
  const w=String(want||'').toLowerCase();
  return fam.styles.find(s=>s.style.toLowerCase()===w)||fam.styles.find(s=>/^(regular|roman|book|normal)$/i.test(s.style))||fam.styles[0];
}
function styleWeight(st){
  st=String(st||'').toLowerCase();
  if(/\bair\b/.test(st))return 100; if(/thin|hairline/.test(st))return 150; if(/extra ?light|ultra ?light/.test(st))return 200; if(/light/.test(st))return 300;
  if(/semi ?bold|demi/.test(st))return 600; if(/extra ?bold|ultra ?bold|heavy/.test(st))return 800; if(/black/.test(st))return 900;
  if(/bold/.test(st))return 700; if(/medium/.test(st))return 500; return 400;
}
function cssFont(family,style,size){
  const it=/italic|oblique/i.test(style||'')?'italic ':'';
  return `${it}${styleWeight(style)} ${size}px "${family||'Aeonik Fono'}", "Aeonik Fono", Inter, -apple-system, Helvetica, Arial, sans-serif`;
}
function casedText(b){const t=b.text||'';return b.caps==='upper'?t.toUpperCase():b.caps==='lower'?t.toLowerCase():t;}
/* draws block text the way After Effects lays it out (tracking in 1/1000 em, leading in px) */
/* a block's text style: its own (ownStyle) or the global one from Content → Your text */
function txtStyle(b){ if(!b||b.ownStyle) return b; const o=Object.assign({},b,{fontSize:D.text.size,align:D.text.align,pad:D.text.pad,offX:+D.text.offX||0,offY:+D.text.offY||0}); TEXT_KEYS.forEach(k=>o[k]=D.text[k]); return o; }
/* text position in the block: 3×3 (tl tc tr / ml center mr / bl bc br) */
function posOf(al){al=al||'center'; if(al==='center') return {h:'c',v:'m'}; const v=al[0]==='m'?'m':al[0]==='b'?'b':'t', h=al[1]==='c'?'c':al[1]==='r'?'r':'l'; return {h,v};}
function drawText(g,b,qx,qy,qw,qh){
  b=txtStyle(b);
  const fs=b.fontSize, tr=(+b.tracking||0)/1000*fs, lh=b.leading>0?b.leading:fs*1.2, pad=+b.pad||0, ox=+b.offX||0, oy=+b.offY||0, ps=posOf(b.align);
  g.font=cssFont(b.family,b.style,fs); g.fillStyle=b.textColor; g.textBaseline='middle'; g.textAlign='left';
  const lines=casedText(b).split('\n');
  const widthOf=l=>{let w=0;for(let i=0;i<l.length;i++)w+=g.measureText(l[i]).width;return w+tr*Math.max(0,l.length-1);};
  const total=(lines.length-1)*lh;
  const y0=(ps.v==='m'?qy+qh/2-total/2:ps.v==='b'?qy+qh-pad-lh/2-total:qy+pad+lh/2)+oy;
  lines.forEach((l,li)=>{
    const w=widthOf(l); let x=(ps.h==='c'?qx+qw/2-w/2:ps.h==='r'?qx+qw-pad-w:qx+pad)+ox; const y=y0+li*lh;
    if(!tr){g.fillText(l,x,y);return;}
    for(let i=0;i<l.length;i++){g.fillText(l[i],x,y);x+=g.measureText(l[i]).width+tr;}
  });
}
function fontFamilyOptions(){return fontList().map(f=>`<option value="${esc(f.family)}"></option>`).join('');}
function fontStyleOptions(family,cur){
  const f=findFamily(family); if(!f) return `<option>${esc(cur||'Regular')}</option>`;
  return f.styles.map(s=>`<option value="${esc(s.style)}"${s.style===cur?' selected':''}>${esc(s.style)}</option>`).join('');
}
async function loadFonts(){
  if(!inAE) return;
  const r=String(await evalHost('GB_getFonts()'));
  if(r&&r!=='NONE'&&r.indexOf('EvalScript')<0){U.fonts=parseFonts(r);}
  renderFontUI(); checkBrandFonts();
}
function renderFontUI(){
  const dl=$('#fontFamilies'); if(dl) dl.innerHTML=fontFamilyOptions();
  const fam=$('#fontFam'), st=$('#fontStyle');
  if(fam&&document.activeElement!==fam) fam.value=D.text.family;
  if(st) st.innerHTML=fontStyleOptions(D.text.family,D.text.style);
  const n=$('#fontNote'); if(n) n.innerHTML=`PostScript name: <b>${esc(D.text.font)}</b>${U.fonts?` · ${U.fonts.length} families installed`:inAE?' · font list needs After Effects 2024 or newer, so type any family name':' · browser preview shows common fonts'}`;
}
/* apply a family/style change to an object holding family/style/font */
function setFamily(o,family){
  const f=findFamily(family);
  if(f){const s=pickStyle(f,o.style);o.family=f.family;o.style=s.style;o.font=s.ps;}
  else{o.family=family;o.font=String(family).replace(/\s+/g,'')+(o.style&&!/regular/i.test(o.style)?'-'+o.style.replace(/\s+/g,''):'');}
}
function setStyle(o,style){
  const f=findFamily(o.family), s=f&&f.styles.find(x=>x.style===style);
  o.style=style; if(s) o.font=s.ps;
}

/* ==================================================================== BLOCK CONTENT: AUTO-FILL
   Each block gets a small HUD layout in its corners built from Avalanche / blockchain text bits.
   Items are generated deterministically (seed + block id) so they don't change between redraws. */
const BITS={"hashes": ["0xb00a4e4b2e577097ff1ce87dc7f966e07d3a32556f26b09758f992ce465df2b4", "0xc02430784571c5434250d625dd79a3300eb3f5b4272fccc953b82f3e4caae9f9", "0xeb9379ab2261033ffe9d637d767005a2a69fec7dba71a6fedc3174da8c36e761", "0x4d309b3c16809e0e991a3a1095168758df35d569acc0e432654323fd5f07cf95", "0xbdb7015ef6984b53fe054d0cc9149ab805180ce5a33ae57b790842a4fd6b065f", "0xa0f645d958084153312aa694bd2ced67ed3fb5a56a200eebfe3ef26666f803a9", "0x3a346cc38271b7aeff8addab2c9b848d0a9c7b978bfb8a8d96a71df6dab1a9a0", "0xf36ba3d3aa303e93fb46ef75265e1551a86909cc2963c8d309217901de89b1c4", "0xec9a72ae43a284c7529adccc684d5eabee86b9292546e7ec0e7965b73ad8c5dd", "0xa84ab17c88bc787ce04e1833c0772d113e1bc9f050ba5ccafa7c26882045d6de", "0x15eb2c782799e4cade8b88ca4b5e4010d0c20c6aae45c43b8e44627905d90b5d", "0x279e2d4682c026b2403621ffef3a4b14fff6ddfa1f8b3126016ac402b1fe7e96", "0x8646cd871ec4892684b85374901e484c735b7ea9ba852bc4b04d859a848247e6", "0x7817612ec5300130de9c0af48106220944fc35accaf59982db65b619dbc0939e", "0x68c1739648643b6e6e3b218aa7bdf57ad103939a5ec040689e22a3e0a93e0288", "0x305ca312d0d7ae606eaee012c1c37982ce28bd8ca5d3237c62ee9dd1b70a8c2b", "0x35c3f8f858ee9168e9e24d1f26be8b3288e49b17ba7813fc364571424bfcd3cc", "0xcf70a72b59d4af698baf820a242a7da94372996a406ee7d912732023b703a934", "0x4cd8edd27fae35980068c61290378741be4464c7ae9f102c330d3f7b5fcb2a2a", "0xbb13f07e580fbfc088978f6f2e2ec61811986543bdf260533ce75642d493702f", "0x3e72288086e2431facc0ae7ae6cd944d8d9af27b5488b8f3100c1fcbe04e2e32", "0x89ddc711d6c788886d95dee47578c5c17aa30cc2a0bc088b1872e2a5a04d1a53", "0x5a0b2669f74b944cac8153bcc3c302bd54e08d31100ed184703e87eb4e87dcdb", "0x4e5071570d93b4d2e0296b25a7d69d2d3957af712cfdb51791c4e847af54556f", "0xd4e129541eda3387ae4df7af2e7ab96a21d2d4f6fe5202d99140ef4465018cab"], "shortTx": ["0xbbe608…97fa", "0x3c5411…04d6", "0x0c8d2d…6e4a", "0x99097c…2b96", "0xea02bb…d535", "0x022b0a…c976", "0xf7540c…abc8", "0x9f9f42…0e7f", "0x496cab…e8d2", "0x66377a…c111", "0xaf8c6c…df3d", "0x616e16…1ca6", "0x2c11cd…47a5", "0x35d904…5978", "0x03f010…30a9", "0x37f4c3…2938", "0xc63a42…fc4e", "0xcc1556…c0e4", "0x4fafa9…9adc", "0xab2219…9d98", "Tx: EFkxD6…gGM9", "Tx: mXjLHb…Ar1o", "Tx: Qpj1xJ…BsZZ", "Tx: mgwoVS…dGYf", "Tx: QivTKn…di1b", "Tx: C2N35S…pZnH", "Tx: aKQ4DA…tAUr", "Tx: Aubzq9…QYvx", "Tx: tkC7Rg…ykRH", "Tx: E1Hfdj…rTcZ"], "cb58": ["C32qPSqqBCMhhZWUoBzxrkEMnKpx8Sgp6acki6EREKV2LAg5E", "ZEcVnkp8nFagiCBZFdFwiQFU16eUHQGAfQHXwaa99ai9WTac3", "uMZfVYLg7nEwidMHtuUzfKsHcWBdcPANevA55MukoVffrvhMi", "CqJ8NXPg32g2TMmg14iQJhR7XfNqobD9YWWV73Wjw1JbHSy1RU", "JSELK1rZ8YsyjmdfnWeuZNozwbYGfRH1FAkUSgpm1hfWiEhkS", "td5dG5fkYXngHbDGZtE4jg4ux2D3Mojcg8aoeqmbix6YLoF1M", "cJ1R4DAdcYqti7QAP2Yg1JB562m6KwXiwbnDMoqopijMb2ACs", "USGQijECtVgyy878eYNbQgWr6F55ScWvke1FfmTB1uqgoKLt5r", "GJAA8WZwYfCvZ7wqVffpTptmX7phVmRVHekfSkER3xXS9Sqni9", "JfmSomCc1cU7bhiMoTKaXbNehFLYtLrPA5V6zj2tKHSQ5sDY8j", "6PveyFcir54jo3YEDQUmUfQ6FXjFHwEqmSTLEeqm2gffzo4shb", "pNGUjrrHcQx9HhDWWTuR1sgtzJgLQJoLAzR1jMUUSJNEiUDcZh", "3ecvg31dypwwLVLfuc4cDHr8j6hFmHovn3Qcx2XUXQJHr5Z2y", "qzs78tsKnPB4aH74kJbeEXZn9HNruYfiR5xqbALGQ4CYcHZfTx", "TSkLE5qJJmFpWDW5fogWtAxvGHumiHBi6BVevEdDGE4J7oMgQH"], "wallets": ["0xcbd041bdad19c6acb416fc4f3097c3609fe8ae52", "0xb90ff3342c20b63a1881cca946842019212249ba", "0x8833e018cab43f36e486f959716bb11cd15abb83", "0xa79c3791e12c21558cf34bdad8ad8ce593fb854e", "0xdf9953505b8873fcc1b6911dde83daca838fadde", "0xaadbfcf2e9ee00f53d2f27a9f9d19ba885dd640b", "0x25369462a7a6b706faa68c5e7a22c8fd51bb4e99", "0xcb562aeff3717ec9b7c99f74f476cd738c1ac8ea", "0x9f6b528e3e3fa0ec3b8c19d880363b9d4717ca54", "0x55c735f7ffbfdce4cf00a3903f4ea68bf49d7132", "0xdb059c3d13a5427cc6652c3d24ded0db392b9b52", "0xbbb05eb0c32b6549672bf01d1657a9652273364e", "P-avax1y28wnla9672dtt34l46hxv94yg9q8pj5y46ycv", "P-avax1e4lsjf6wxgwf8wfrdpqcem8xcuqrlq334lnhp0", "P-avax1tg0kgjk8fl2ft9ccm7wx79ag6gam6hc45yz6vu", "P-avax14t3ev5avv8uzmylfkewf0n48wts09l7mjdch6d", "P-avax144mlj3rndch4ttqqdrcdmdjs9fjvwcfnwruhs0", "P-avax18ak4waa6dlw8zndyse3vs2qdmlqzf9hygxrult", "X-avax1e7zfej6r9t8ctmhh3lx5ctdzvzxl450ea8n47a", "X-avax12jqaxwg7wxws9gyyxhfxtll24x749ud7f0kg7a", "X-avax1607prsjzvfxdg7tgure9c98hnlf26h6enfu94v", "X-avax19req7cpckdfqps8a3lyqqzevnzj5lels7lxj97", "X-avax1r8n4g55wdxmk2a7pgn526xmrcvvztmgpe530n8", "X-avax1j25d2xwsm8rewsdym0085a4lun0hzhh54xhnhl"], "nodes": ["NodeID-GDjfjWJYzhXTAEqtQBF68q7VdQYM1a9aP", "NodeID-ech9ijaVEsEPRKP6asntq51MebGRwiEUt", "NodeID-a5Go6ER5997EBD5cyF8W12d4CSqoos1mV", "NodeID-B54nfn4cfQujkGJnD2ukPZDfz2DaUd6YZ", "NodeID-Savtpd3QgVqv1KAbxfjPUkV4zQQqaiyax", "NodeID-yZbu45dXuyq9Htf9caFLWsnaN5YnekrMG", "NodeID-p4T7P1QGdQUoETwdyc9xQPLvkreqAVmn1", "NodeID-sLmqwNvNgJz5e4mP31oVhuPrUa4VCnn6W", "NodeID-dRDf92Zg1uvyVTSHAoRxQEpxoCESrZuEp", "NodeID-F19CmtaX2PaYVjEUMqAFFygPMNh5pR2Gm", "NodeID-DKcQn1QmfD14HFhG181N7Ntj9ge2t3RwE", "NodeID-DHVZP21beKvxaYsSfkqhj5Sa6TyP2nqBG", "NodeID-YPieuRKUZsEAAgwWrZN5Siv3AWP875HY3", "NodeID-XhFj98o8jmbUeM5cojpq3ZACCDcZLufBD", "NodeID-WFp3jjEZEo6q9XQiVSAW93xCdBQVMr8b6"], "blocks": ["BLOCK #70,075,438  |  91 txns  |  1319 ms", "BLOCK #70,269,059  |  75 txns  |  1039 ms", "BLOCK #70,615,881  |  40 txns  |  1399 ms", "BLOCK #70,184,304  |  64 txns  |  310 ms", "BLOCK #69,193,931  |  111 txns  |  306 ms", "BLOCK #69,939,585  |  129 txns  |  293 ms", "BLOCK #70,354,292  |  223 txns  |  578 ms", "BLOCK #68,993,350  |  226 txns  |  1747 ms", "BLOCK #69,783,883  |  74 txns  |  1050 ms", "BLOCK #69,501,609  |  76 txns  |  672 ms", "BLOCK #69,794,064  |  92 txns  |  1278 ms", "BLOCK #68,987,023  |  161 txns  |  933 ms", "BLOCK #68,348,821  |  65 txns  |  1810 ms", "BLOCK #71,561,580  |  227 txns  |  518 ms", "BLOCK #68,999,574  |  151 txns  |  1065 ms", "blockHash: 0x35a0f4d5e761d5914078758f60713de6abb00c9aeac25d9d2f024748c57bb4a6", "blockHash: 0x60137c7c1178fbf5478348dcb98151ccbbff72163a0311dc55525a5df1a2e706", "blockHash: 0xdf1b764b645129bbb6f8c40168da8057d52ea817d3a90f19bcc469423fd2b29b", "blockHash: 0xebe9d96ed415d7f08a21857eca3cd730db9728c06d05e8a77c386af6e2178975", "blockHash: 0x5c49e8deb4d579275171152dd14912b9077552f011102fc86e65c4dbee5d2c0e", "parentHash: 0x7fe985f4d890b4db15386e83028e4d6fcda1e3728f19a61c6910cf4486db6301", "parentHash: 0x4e3b762efcf08a28ef6055c4c28529cfaf4e23f34361a93b7a1eba6eda8878eb", "parentHash: 0xf1447bd791424ce4e7514ae062f3cc46163aebd3d0c7c5649e588e4ff3b4bca4", "stateRoot: 0x45ad3cf2b33d19d0dcdcf6b4e12311453f597c5d4febae61b5d6bafe8d42f9ba", "stateRoot: 0x062b7f175a581cb2796f43ed4c80bab796727fa8ff4e7401882c997945f738a8", "stateRoot: 0xd00348eaff2d0b9b4bb1a7b01db6f1bb98a979a44b645969b34bb12664556ba5"], "logs": ["[2026-10-09 09:30:00.632] INFO  <P Chain> mempool cleared", "[2026-10-09 09:30:01.443] INFO  <P Chain> state sync complete", "[2026-10-09 09:30:02.047] INFO  <P Chain> peer connected", "[2026-10-09 09:30:02.926] INFO  <P Chain> state sync complete", "[2026-10-09 09:30:03.042] INFO  <X Chain> tx accepted", "[2026-10-09 09:30:03.898] INFO  <X Chain> ICM message delivered", "[2026-10-09 09:30:04.254] INFO  <C Chain> health check: healthy", "[2026-10-09 09:30:04.780] INFO  <C Chain> peer connected", "[2026-10-09 09:30:05.113] INFO  <X Chain> warp signature aggregated", "[2026-10-09 09:30:05.264] INFO  <X Chain> tx accepted", "[2026-10-09 09:30:05.673] INFO  <C Chain> warp signature aggregated", "[2026-10-09 09:30:06.278] INFO  <X Chain> ICM message delivered", "[2026-10-09 09:30:06.653] INFO  <X Chain> consensus finalized", "[2026-10-09 09:30:07.406] INFO  <C Chain> state sync complete", "[2026-10-09 09:30:07.721] INFO  <P Chain> peer connected", "[2026-10-09 09:30:07.811] INFO  <X Chain> block accepted", "[2026-10-09 09:30:08.020] INFO  <P Chain> consensus finalized", "[2026-10-09 09:30:08.543] INFO  <C Chain> health check: healthy", "[2026-10-09 09:30:09.112] INFO  <P Chain> state sync complete", "[2026-10-09 09:30:09.578] INFO  <P Chain> settlement confirmed", "[2026-10-09 09:30:10.093] INFO  <P Chain> bootstrapping complete", "[2026-10-09 09:30:10.257] INFO  <C Chain> peer connected", "[2026-10-09 09:30:10.594] INFO  <P Chain> ICM message delivered", "[2026-10-09 09:30:11.290] INFO  <P Chain> settlement confirmed", "[2026-10-09 09:30:11.648] INFO  <X Chain> tx accepted"], "gas": ["gasUsed: 457,239", "gasUsed: 380,153", "gasUsed: 283,334", "gasUsed: 440,992", "gasUsed: 327,031", "gasUsed: 322,798", "gasUsed: 31,358", "gasUsed: 400,974", "gasUsed: 393,884", "gasUsed: 141,239", "baseFee: 17.81 nAVAX", "baseFee: 18.30 nAVAX", "baseFee: 14.57 nAVAX", "baseFee: 14.07 nAVAX", "baseFee: 19.05 nAVAX", "baseFee: 17.52 nAVAX", "baseFee: 22.09 nAVAX", "baseFee: 6.92 nAVAX", "value: 8,466.8234 AVAX", "value: 5,902.5222 AVAX", "value: 13,672.7802 AVAX", "value: 11,009.1972 AVAX", "value: 11,920.0313 AVAX", "value: 8,856.0369 AVAX", "value: 17,839.6460 AVAX", "value: 21,737.9585 AVAX", "value: 18,648.4473 AVAX", "value: 22,885.9235 AVAX", "fee: < $0.02", "fee: < $0.05", "fee: < $0.02", "fee: < $0.03", "fee: < $0.08", "fee: < $0.07", "fee: < $0.07", "fee: < $0.03", "settled: $55,387,990.90", "settled: $79,007,148.39", "settled: $14,381,215.53", "settled: $27,083,559.75", "settled: $83,788,968.26", "settled: $84,026,322.29", "settled: $39,476,293.15", "settled: $46,144,340.74", "nonce: 68377", "nonce: 29560", "nonce: 99218", "nonce: 9552", "nonce: 50300", "nonce: 44679"], "status": ["STATUS: FINALIZED", "STATUS: ACCEPTED", "STATUS: PENDING", "STATUS: CONFIRMED", "STATUS: SETTLED", "FINALITY: < 1s", "FINALITY: SUB-SECOND", "UPTIME: 99.99%", "NETWORK: MAINNET", "NETWORK: FUJI TESTNET", "CONSENSUS: SNOWMAN", "VALIDATORS: ACTIVE", "SYNC: 100%", "HEALTH: OK", "CHAIN ID: 43114", "CHAIN ID: 43113 (FUJI)", "EVM COMPATIBLE", "KYC: VERIFIED", "AML: CLEARED", "PERMISSIONED: TRUE", "INTEROP: ENABLED", "SIGNATURE: VALID", "BLS SIGNATURE: AGGREGATED", "SETTLEMENT: T+0"], "json": ["\"jsonrpc\": \"2.0\"", "\"method\": \"eth_sendRawTransaction\"", "\"method\": \"eth_getBlockByNumber\"", "\"method\": \"platform.getCurrentValidators\"", "\"method\": \"avm.getTxStatus\"", "\"method\": \"info.getNodeID\"", "\"chainId\": \"0xa86a\"", "\"status\": \"0x1\"", "\"type\": \"0x2\"", "\"confirmations\": 1", "\"finalized\": true", "\"blockNumber\": \"0x2306c1\"", "\"from\": \"0xad8c12353b51e443b96cc3b020737e27fb3ef5e8\"", "\"to\": \"0x2166b469b8577a87aae4ea4ffcff221021e94372\"", "\"maxFeePerGas\": \"25000000000\"", "\"maxPriorityFeePerGas\": \"1000000000\"", "\"weight\": 2000000000000", "\"delegationFee\": \"2.0000\"", "\"uptime\": \"99.9800\"", "\"connected\": true"], "rpc": ["https://api.avax.network/ext/bc/C/rpc", "https://api.avax-test.network/ext/bc/C/rpc", "/ext/bc/P", "/ext/bc/X", "/ext/info", "/ext/health", "wss://api.avax.network/ext/bc/C/ws", "snowtrace.io/tx/0x…", "avalanchego --network-id=mainnet", "avalanchego --network-id=fuji"], "chainIds": ["P-Chain ID: 11111111111111111111111111111111LpoYY", "X-Chain ID: 2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM", "C-Chain ID: 2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5", "EVM Chain ID: 43114"], "l1": ["L1 ID: vVPNM66BrUvFG5TDLLUqMiRDduwhXtx8sitkSu2gzm3i69a2jQ", "L1 ID: EaPtHMt9qP4EN4K6EReAWa6Ey96s7j3p5JcfEtaUQmPp45GnXa", "L1 ID: FGrSXupb5fFNpT5owA49JeDKoowsUCtnQcSe3TxZnJEk8iaVeb", "L1 ID: QWGBYgCVpugFbiPjSW7TEHj2A4j4cCyzcCjK2647SdtkWh8j5q", "L1 ID: 2G4Ltu1E16sRb1tAPvg4AV3hgDfPGDZ3U5m6Zfw9e6U8cnSuC8", "L1 ID: MSUwCQvHAdFz2ZKLHqJVct89DGxveWDqw3XdHdidQvqCTmND73", "blockchainID: 1xmE7upfD1kCyaQ5wC57kiBZJh94T2SjP7eeVX29gK89DD5J5M", "blockchainID: suELdmi7hZsC5x6dCy8Wh5eZbpaiAxKsxAFeX82w5E9RE3xKKa", "blockchainID: 829azG52RofDmKdahJfSJfhVTegyta2kbu26R9pnpG8nnaBkxJ", "blockchainID: hyvBrfTheQ4WSSpr8ht7Bd5xQJ9LBsP4S9BaeCsQskbqDW8jHp", "blockchainID: m5XscF3Ro1DFKGg9T2z1LH1xnsaP7CD81229n6sT3eN4VxTvZp", "blockchainID: Etgi2i2SKMqUmYQSgjEKZWmc61meCEoVmc4AZ4bLM4V6xuiTX7"], "terms": ["Avalanche L1", "Avalanche L1s", "Primary Network", "C-Chain", "P-Chain", "X-Chain", "Snowman Consensus", "Avalanche Consensus", "Snowball", "Sub-second finality", "Avalanche Interchain Messaging (ICM)", "Avalanche Warp Messaging", "Interchain Token Transfer (ICTT)", "Teleporter", "AvalancheGo", "Subnet-EVM", "HyperSDK", "Avalanche CLI", "Core Wallet", "Snowtrace", "Validator Manager", "Proof of Stake", "Proof of Authority", "Permissioned L1", "Sovereign L1", "Custom gas token", "Native interoperability", "EVM compatible", "AVAX", "nAVAX", "Fuji Testnet", "Mainnet", "Avalanche9000", "ACP-77", "Builder Hub", "Validator set", "Staking rewards", "Delegation", "BLS public key", "Proof of possession"], "jargon": ["Onchain settlement", "Atomic settlement", "Tokenized securities", "Tokenized treasuries", "Real-world assets (RWA)", "Stablecoin rails", "Programmable money", "Smart contract", "ERC-20", "ERC-721", "ERC-1155", "Merkle root", "Hash function", "Keccak-256", "secp256k1", "Digital signature", "Public key", "Private key (never shared)", "Multisig", "Account abstraction", "Gas limit", "Mempool", "Nonce", "Block height", "State root", "Light client", "Node", "Full node", "Archive node", "RPC endpoint", "Oracle feed", "Liquidity pool", "Order book", "Custody", "Collateral", "Counterparty risk", "Delivery vs payment (DvP)", "T+0 settlement", "Compliance layer", "KYC / AML", "OFAC screening", "Allowlist", "Audit trail", "Immutable ledger", "Byzantine fault tolerance", "Finality", "Throughput", "Latency", "Interoperability", "Cross-chain message"], "phrases": ["Technology Built for Business", "Built for production", "Settles in seconds", "Finality in < 1s", "Infrastructure, not hype", "Private. Compliant. Connected.", "Your chain. Your rules.", "From pilot to production", "Connection where valuable, isolation where required", "Predictable performance", "Production-grade reliability", "Live in production", "Global settlement", "Embedded finance", "Institutional grade", "Always on. 24/7/365", "Verifiable by design", "Interoperable by default", "Built to scale", "Build what lasts"], "tags": ["[OK]", "[ACCEPTED]", "[FINALIZED]", "[SYNCED]", "[VERIFIED]", "[SIGNED]", "[BROADCAST]", "[CONFIRMED]", "[SETTLED]", "[HEALTHY]", ">> submitting tx…", ">> awaiting finality…", ">> finalized in 0.8s", ">> validator set updated", ">> warp message relayed", "$ avalanche blockchain deploy", "$ avalanche node status", "$ cast send --rpc-url $AVAX_RPC", "> eth_chainId → 0xa86a", "> net_version → 43114"], "numbers": ["5,944 TPS", "33,021 TPS", "4,470 TPS", "83,944 TPS", "82,482 TPS", "35,525 TPS", "1,447 TPS", "17,140 TPS", "84,374 TPS", "74,935 TPS", "58,597 TPS", "75,205 TPS", "1,799 validators", "1,641 validators", "1,753 validators", "2,228 validators", "1,739 validators", "1,402 validators", "TVL $0.75B", "TVL $3.41B", "TVL $0.58B", "TVL $0.59B", "TVL $5.82B", "TVL $3.98B", "465 ms", "661 ms", "257 ms", "918 ms", "483 ms", "781 ms"]};
const DEV_LINES=['INITIALIZING','BLASTING OFF','SYNCING VALIDATORS','AWAITING FINALITY','COMPILING','BOOTSTRAPPING','BROADCASTING TX','AGGREGATING SIGNATURES','RELAYING WARP MESSAGE','DEPLOYING L1','CONNECTING PEERS','VERIFYING PROOF','STRAPPING IN','WARMING UP NODES'];
const FILL_MODULES=[
  ['kv','Key / values'],['status','Status'],['hashes','TO / FROM hashes'],['block','Block data'],['log','Log lines'],
  ['counter','Counters'],['dev','Dev text …'],['barcode','Barcodes'],['phrase','Phrases & tags'],['term','Terms'],
  ['mempool','Mempool'],['validator','Validators'],['latency','Latency / TPS'],['rpc','RPC calls'],['progress','Progress bars'],['consensus','Consensus'],['stream','Hex stream'],
  ['dots','Dot pattern'],['ring','Ring icon'],['logo','Avalanche logo'],['icons','Icon set']
];
/* icon set: original line icons in a 1×1 box. p = polyline (closed?), c = circle, r = rect; f = filled */
const ICONS={
  node:{name:'Node',prims:[{t:'p',pts:[[.5,.04],[.9,.27],[.9,.73],[.5,.96],[.1,.73],[.1,.27]],closed:true},{t:'c',cx:.5,cy:.5,r:.12,f:true}]},
  cube:{name:'Block',prims:[{t:'p',pts:[[.5,.06],[.92,.28],[.92,.72],[.5,.94],[.08,.72],[.08,.28]],closed:true},{t:'p',pts:[[.08,.28],[.5,.5],[.92,.28]]},{t:'p',pts:[[.5,.5],[.5,.94]]}]},
  chain:{name:'Chain',prims:[{t:'r',x:.04,y:.32,w:.52,h:.36,rr:.18},{t:'r',x:.44,y:.32,w:.52,h:.36,rr:.18}]},
  check:{name:'Check',prims:[{t:'c',cx:.5,cy:.5,r:.44},{t:'p',pts:[[.3,.52],[.45,.66],[.72,.36]]}]},
  chevrons:{name:'Speed',prims:[{t:'p',pts:[[.06,.2],[.26,.5],[.06,.8]]},{t:'p',pts:[[.37,.2],[.57,.5],[.37,.8]]},{t:'p',pts:[[.68,.2],[.88,.5],[.68,.8]]}]},
  peak:{name:'Peak',prims:[{t:'p',pts:[[.02,.86],[.36,.26],[.52,.54],[.66,.36],[.98,.86]],closed:true}]},
  lock:{name:'Lock',prims:[{t:'r',x:.18,y:.44,w:.64,h:.5},{t:'p',pts:[[.3,.44],[.3,.28],[.36,.14],[.5,.08],[.64,.14],[.7,.28],[.7,.44]]},{t:'c',cx:.5,cy:.66,r:.06,f:true}]},
  network:{name:'Network',prims:[{t:'p',pts:[[.18,.22],[.5,.5],[.84,.2]]},{t:'p',pts:[[.5,.5],[.24,.84]]},{t:'p',pts:[[.5,.5],[.8,.8]]},{t:'c',cx:.18,cy:.22,r:.09,f:true},{t:'c',cx:.84,cy:.2,r:.09,f:true},{t:'c',cx:.24,cy:.84,r:.09,f:true},{t:'c',cx:.8,cy:.8,r:.09,f:true},{t:'c',cx:.5,cy:.5,r:.12,f:true}]},
  signal:{name:'Signal',prims:[{t:'r',x:.06,y:.68,w:.14,h:.26,f:true},{t:'r',x:.3,y:.5,w:.14,h:.44,f:true},{t:'r',x:.54,y:.3,w:.14,h:.64,f:true},{t:'r',x:.78,y:.08,w:.14,h:.86,f:true}]},
  target:{name:'Target',prims:[{t:'c',cx:.5,cy:.5,r:.36},{t:'p',pts:[[.5,0],[.5,.3]]},{t:'p',pts:[[.5,.7],[.5,1]]},{t:'p',pts:[[0,.5],[.3,.5]]},{t:'p',pts:[[.7,.5],[1,.5]]},{t:'c',cx:.5,cy:.5,r:.05,f:true}]},
  snow:{name:'Snow',prims:[0,60,120].map(a=>{const r=a*Math.PI/180,dx=Math.cos(r)*.46,dy=Math.sin(r)*.46;return {t:'p',pts:[[.5-dx,.5-dy],[.5+dx,.5+dy]]};}).concat([0,60,120,180,240,300].map(a=>{const r=a*Math.PI/180,cx=.5+Math.cos(r)*.32,cy=.5+Math.sin(r)*.32,o=.1;return {t:'p',pts:[[cx+Math.cos(r+2.3)*o,cy+Math.sin(r+2.3)*o],[cx,cy],[cx+Math.cos(r-2.3)*o,cy+Math.sin(r-2.3)*o]]};}))},
  arrow:{name:'Arrow',prims:[{t:'p',pts:[[.04,.5],[.94,.5]]},{t:'p',pts:[[.7,.26],[.94,.5],[.7,.74]]}]},
  plus:{name:'Plus',prims:[{t:'p',pts:[[.5,.12],[.5,.88]]},{t:'p',pts:[[.12,.5],[.88,.5]]}]},
  bars:{name:'Bars',prims:[{t:'r',x:.04,y:.14,w:.92,h:.12,f:true},{t:'r',x:.04,y:.38,w:.66,h:.12,f:true},{t:'r',x:.04,y:.62,w:.8,h:.12,f:true},{t:'r',x:.04,y:.86,w:.42,h:.1,f:true}]}
};
const ICON_KEYS=Object.keys(ICONS);
/* icon → canvas */
function drawIcon(g,name,x,y,s,color){
  const I=ICONS[name]; if(!I) return; const lw=Math.max(1,s*.07);
  g.save(); g.lineWidth=lw; g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=color; g.fillStyle=color;
  I.prims.forEach(p=>{
    g.beginPath();
    if(p.t==='c'){g.arc(x+p.cx*s,y+p.cy*s,p.r*s,0,7);}
    else if(p.t==='r'){const rr=(p.rr||0)*s;if(rr&&g.roundRect)g.roundRect(x+p.x*s,y+p.y*s,p.w*s,p.h*s,rr);else g.rect(x+p.x*s,y+p.y*s,p.w*s,p.h*s);}
    else {p.pts.forEach((q,i)=>i?g.lineTo(x+q[0]*s,y+q[1]*s):g.moveTo(x+q[0]*s,y+q[1]*s)); if(p.closed) g.closePath();}
    p.f?g.fill():g.stroke();
  });
  g.restore();
}
const GAP_MODULES=[['log','Log lines'],['phrase','Phrases & tags'],['barcode','Barcodes'],['hashes','Hashes'],['dots','Dot fields'],['logo','Avalanche logo'],['icons','Icons'],['graph','Mini graphs'],['stream','Hex stream'],['rpc','RPC calls']];
/* Avalanche logo (24×22 viewBox) */
const AVAX_LOGO={w:24,h:22,d:['M15.0399 21.1035H23.0791C23.7889 21.1035 24.2319 20.3358 23.877 19.7214L19.8574 12.7601C19.5025 12.1457 18.6165 12.1457 18.2616 12.7601L14.242 19.7214C13.8871 20.3358 14.3313 21.1035 15.0399 21.1035Z',
  'M16.0454 6.15766L12.7416 0.433646C12.4084 -0.144549 11.5719 -0.144549 11.2387 0.433646L0.128698 19.6783C-0.237049 20.312 0.220437 21.1026 0.950726 21.1026H7.56678C8.27172 21.1026 8.92354 20.726 9.27601 20.1152L16.0454 8.38957C16.4449 7.69911 16.4449 6.84811 16.0454 6.15645V6.15766Z']};
/* absolute SVG path (M L H V C Z) → AE-style subpaths: vertices + in/out tangents */
function svgToAE(d){
  const tok=d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi)||[]; let i=0, cmd='', x=0, y=0, cur=null; const out=[];
  const num=()=>parseFloat(tok[i++]);
  const push=(px,py)=>{cur.v.push([px,py]);cur.i.push([0,0]);cur.o.push([0,0]);};
  while(i<tok.length){
    if(/[a-z]/i.test(tok[i])) cmd=tok[i++].toUpperCase();
    if(cmd==='M'){x=num();y=num();cur={v:[],i:[],o:[],closed:false};out.push(cur);push(x,y);cmd='L';}
    else if(cmd==='L'){x=num();y=num();push(x,y);}
    else if(cmd==='H'){x=num();push(x,y);}
    else if(cmd==='V'){y=num();push(x,y);}
    else if(cmd==='C'){const x1=num(),y1=num(),x2=num(),y2=num();const nx=num(),ny=num();const k=cur.v.length-1;cur.o[k]=[x1-x,y1-y];x=nx;y=ny;cur.v.push([x,y]);cur.i.push([x2-x,y2-y]);cur.o.push([0,0]);}
    else if(cmd==='Z'){cur.closed=true;
      // drop a duplicated closing vertex
      const n=cur.v.length; if(n>1&&Math.abs(cur.v[0][0]-cur.v[n-1][0])<1e-3&&Math.abs(cur.v[0][1]-cur.v[n-1][1])<1e-3){cur.i[0]=cur.i[n-1];cur.v.pop();cur.i.pop();cur.o.pop();}
      cmd='';}
    else i++;
  }
  return out;
}
const AVAX_AE=AVAX_LOGO.d.map(svgToAE).reduce((a,b)=>a.concat(b),[]);
let avaxPath2D=null;
const dotD=sp=>Math.max(.5,Math.min(sp*.95,+D.fill.dotSize>0?+D.fill.dotSize:sp*.28));
function pickR(rnd,a){return a[Math.floor(rnd()*a.length)];}
function hexR(rnd,n){let s='';for(let i=0;i<n;i++)s+='0123456789abcdef'[Math.floor(rnd()*16)];return s;}
function fillHash(a,b){let x=((a|0)*2654435761^((b|0)+0x9e3779b9))>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;x^=x>>>13;return x>>>0;}
function isOutline(b){const F=D.fill;return !!(F&&F.on&&F.outlinePct>0&&!b.echo&&(fillHash(b.id,F.seed+11)%100)<F.outlinePct);}
function fillCase(s){return D.fill.caps==='upper'?String(s).toUpperCase():String(s);}
function splitKV(s){const i=s.indexOf(':');return i>0?[s.slice(0,i+1).trim(),s.slice(i+1).trim()]:[s,''];}
/* one module → text/pattern items inside a slot {x,y,w,h,ax:'l'|'r',ay:'t'|'b'} */
function buildModule(mod,slot,rnd,met,color){
  const cols=Math.max(4,Math.floor(slot.w/met.cw)), rows=Math.max(1,Math.floor(slot.h/met.lh));
  const fit=s=>{s=fillCase(s);return s.length>cols?s.slice(0,Math.max(1,cols-1))+'…':s;};
  const T=(lines,align,extra)=>Object.assign({kind:'text',x:align==='r'?slot.x+slot.w:slot.x,y:slot.y,ay:slot.ay,align,lines:lines.slice(0,rows).map(fit),color},extra||{});
  const half=Math.max(4,Math.floor(cols/2)-1);
  const fitH=s=>{s=fillCase(s);return s.length>half?s.slice(0,half):s;};
  switch(mod){
    case 'kv': case 'status':{
      const src=mod==='kv'?BITS.gas.concat(BITS.json):BITS.status, n=Math.min(rows,2+Math.floor(rnd()*2)), pairs=[];
      for(let i=0;i<n;i++){let kv=splitKV(pickR(rnd,src).replace(/"/g,''));if(!kv[1])kv=[kv[0],'TRUE'];pairs.push(kv);}
      if(cols<14) return [T(pairs.map(p=>p[0]+' '+p[1]),slot.ax)];
      return [T(pairs.map(p=>fitH(p[0])),'l',{x:slot.x}),T(pairs.map(p=>fitH(p[1])),'r',{x:slot.x+slot.w,scr:mod==='kv'})];
    }
    case 'hashes':{
      const a='0X'+hexR(rnd,40), b='0X'+hexR(rnd,40), w=Math.max(6,Math.min(8,half)), n=Math.max(2,Math.min(rows,7));
      const chunk=s=>{const o=[];for(let i=0;i<s.length&&o.length<n-1;i+=w)o.push(s.slice(i,i+w));return o;};
      const L=['"TO":'].concat(chunk(a).map((c,i)=>(i===0?'"':'')+c)), R=['"FROM":'].concat(chunk(b).map((c,i)=>(i===0?'"':'')+c));
      L[L.length-1]+='"'; R[R.length-1]+='"';
      if(cols<16) return [T(L,slot.ax,{scr:true})];
      return [T(L,'l',{x:slot.x,scr:true}),T(R,'l',{x:slot.x+Math.min(slot.w*.55,(w+3)*met.cw*1.6),scr:true})];
    }
    case 'block':{
      const p=pickR(rnd,BITS.blocks.filter(s=>/^BLOCK/.test(s))).split('|').map(s=>s.trim());
      const num=p[0].replace('BLOCK','').trim(), to=+num.replace(/[#,]/g,'');
      return [T(['BLOCK',num+' |',p[1]+' |',p[2]],slot.ax,{count:{line:1,from:Math.max(0,to-Math.round(200+rnd()*3000)),to,dec:0,pre:'#',suf:' |'}})];
    }
    case 'log':{
      const n=Math.min(rows,3), L=[];
      for(let i=0;i<n;i++) L.push(pickR(rnd,BITS.logs).replace(/\s+/g,' '));
      return [T(L,slot.ax,{type:true})];
    }
    case 'counter':{
      const src=pickR(rnd,BITS.numbers), m=src.match(/^([^0-9]*)([\d,.]+)(.*)$/);
      const label=pickR(rnd,['VALIDATING','THROUGHPUT','SYNC','FINALITY','UPTIME','STAKED','TVL','LATENCY']);
      if(rnd()<.4){const pct=Math.round(40+rnd()*60);return [T([label,pct+'%'],slot.ax,{count:{line:1,from:0,to:pct,dec:0,pre:'',suf:'%'}})];}
      const to=parseFloat(m[2].replace(/,/g,'')), dec=(m[2].split('.')[1]||'').length;
      return [T([label,src],slot.ax,{count:{line:1,from:0,to,dec,pre:fillCase(m[1]),suf:fillCase(m[3])}})];
    }
    case 'dev':{
      const L=[pickR(rnd,DEV_LINES)];
      if(rows>1&&rnd()<.6) L.push(pickR(rnd,BITS.tags.filter(s=>/^>>/.test(s))).replace(/…$/,''));
      return [T(L,slot.ax,{type:true,ell:true})];
    }
    case 'barcode':{
      const n=Math.max(6,Math.floor(cols*(0.55+rnd()*0.4)));
      return [T([rnd()<.5?'|'.repeat(n):'.'.repeat(n-1)+'|'],slot.ax)];
    }
    case 'phrase':{
      if(rnd()<.45) return [T(['****** '+fillCase(pickR(rnd,['STRAP IN','LIVE IN PRODUCTION','BUILT TO SCALE','SETTLES IN SECONDS','FINALITY < 1S','ALWAYS ON']))+' ******'],slot.ax)];
      return [T([pickR(rnd,BITS.tags.filter(s=>/^\[/.test(s))),pickR(rnd,BITS.phrases)].slice(0,rows),slot.ax,{type:true})];
    }
    case 'mempool':{
      const n=Math.round(200+rnd()*4800), bar=Math.max(4,Math.min(cols-12,18)), k=Math.floor(bar*(.3+rnd()*.6));
      return [T(['MEMPOOL','|'.repeat(k)+'.'.repeat(bar-k)+' '+n.toLocaleString('en-US')+' TX'],slot.ax,{count:{line:1,from:0,to:n,dec:0,pre:'|'.repeat(k)+'.'.repeat(bar-k)+' ',suf:' TX'}})];
    }
    case 'validator':{
      const id='NODEID-'+hexR(rnd,6).toUpperCase()+'…'+hexR(rnd,4).toUpperCase(), up=(99+rnd()*.99).toFixed(2);
      return [T(['VALIDATOR '+(rnd()<.5?'ONLINE':'ACTIVE'),id,'UPTIME '+up+'%'].slice(0,Math.max(1,rows)),slot.ax,{scr:true})];
    }
    case 'latency':{
      const p50=(0.3+rnd()*.4).toFixed(2), p99=(0.8+rnd()*.6).toFixed(2), tps=Math.round(900+rnd()*4100);
      if(rnd()<.5) return [T(['TPS',tps.toLocaleString('en-US')],slot.ax,{count:{line:1,from:0,to:tps,dec:0,pre:'',suf:''}})];
      return [T(['P50 '+p50+'S','P99 '+p99+'S'],slot.ax)];
    }
    case 'rpc':{
      const m=pickR(rnd,['ETH_GETBLOCKBYNUMBER','ETH_SENDRAWTRANSACTION','ETH_CALL','AVAX.GETUTXOS','PLATFORM.GETCURRENTVALIDATORS','ETH_GETLOGS','ETH_CHAINID']);
      return [T(['> POST /EXT/BC/C/RPC','{"METHOD":"'+m+'"}','200 OK · '+Math.round(8+rnd()*60)+'MS'].slice(0,Math.max(1,rows)),slot.ax,{type:true})];
    }
    case 'progress':{
      const pct=Math.round(35+rnd()*65), bar=Math.max(6,Math.min(cols-6,20)), k=Math.round(bar*pct/100);
      const lab=pickR(rnd,['SYNCING','FINALIZING','BOOTSTRAPPING','INDEXING','VERIFYING']);
      return [T([lab,'['+'#'.repeat(k)+'.'.repeat(bar-k)+'] '+pct+'%'],slot.ax,{count:{line:1,from:0,to:pct,dec:0,pre:'['+'#'.repeat(k)+'.'.repeat(bar-k)+'] ',suf:'%'}})];
    }
    case 'consensus':{
      return [T([pickR(rnd,['SNOWMAN','SNOWBALL']),'K=20 A=15 B=20','QUERY '+Math.round(1+rnd()*9)+'/20 OK'].slice(0,Math.max(1,rows)),slot.ax,{type:true})];
    }
    case 'stream':{
      const n=Math.min(rows,3), w=Math.max(4,Math.floor((cols+1)/3)), L=[];
      for(let i=0;i<n;i++){const o=[];for(let j=0;j<w;j++)o.push(hexR(rnd,2).toUpperCase());L.push(o.join(' '));}
      return [T(L,slot.ax,{scr:true})];
    }
    case 'term':{
      const a=pickR(rnd,BITS.terms), b=pickR(rnd,BITS.rpc.filter(s=>s.length<20));
      if(cols<18) return [T([a],slot.ax)];
      return [T([fitH(a),fitH(b)],'l',{x:slot.x}),T(['VERIF','TRUE'],'r',{x:slot.x+slot.w})];
    }
  }
  return [];
}
/* ==================================================================== CONTENT v2: pixel icons · graphs · combos · patterns
   Every new graphic is a 'shape' item: primitives in absolute px, each with a build window [a,b] (0..1).
   type-on = the graphic builds (pixels pop in, lines draw, bars grow); preview and AE share the description. */
const PX_ICONS={
  cube:{name:'Block',b:'............/....########/...#......##/..#......#.#/.########..#/.#......#..#/.#......#..#/.#......#..#/.#......#.#./.#......##../.########.../............'},
  blocks:{name:'Blocks',b:'............/.######...../.#....#...../.#....#...../.#....######/.######....#/......#....#/......#....#/......######/............/............/............'},
  chain:{name:'Chain',b:'............/............/............/.###....###./#...#..#...#/#..######..#/#...#..#...#/.###....###./............/............/............/............'},
  lock:{name:'Lock',b:'...######.../..##....##../..##....##../..##....##../.##########./.##########./.####..####./.####..####./.####..####./.##########./.##########./............'},
  key:{name:'Key',b:'............/............/.####......./##..##....../##..########/##..##...#.#/.####....#.#/............/............/............/............/............'},
  shield:{name:'Shield',b:'.##########./.##########./.#######.##./.##.###.###./.###.#.####./.####.#####./.##########./..########../...######.../....####..../.....##...../............'},
  bolt:{name:'Bolt',b:'.......###../......###.../.....###..../....###...../...#######../..#######.../.....###..../....###...../...###....../..##......../.##........./............'},
  check:{name:'Check',b:'............/............/..........##/.........##./........##../.##....##.../..##..##..../...####...../....##....../............/............/............'},
  hash:{name:'Hash',b:'............/...##..##.../...##..##.../############/############/...##..##.../...##..##.../############/############/...##..##.../...##..##.../............'},
  server:{name:'Server',b:'############/#..........#/#.##.....#.#/#..........#/############/#..........#/#.##.....#.#/#..........#/############/....####..../..########../............'},
  network:{name:'Network',b:'##........##/##........##/..#......#../...#....#.../....####..../....####..../....####..../....####..../...#....#.../..#......#../##........##/##........##'},
  globe:{name:'Globe',b:'....####..../..##.##.##../.#...##...#./.#...##...#./############/#....##....#/#....##....#/############/.#...##...#./.#...##...#./..##.##.##../....####....'},
  wallet:{name:'Wallet',b:'............/..########../.##........./############/#..........#/#.......####/#.......#.##/#.......####/#..........#/############/............/............'},
  db:{name:'Database',b:'..########../##........##/#.########.#/#..........#/##........##/#.########.#/#..........#/##........##/#.########.#/#..........#/.##......##./..########..'},
  chart:{name:'Chart',b:'............/............/............/..........##/..........##/.......##.##/.......##.##/....##.##.##/....##.##.##/.##.##.##.##/.##.##.##.##/############'},
  transfer:{name:'Transfer',b:'............/........#.../........##../############/........##../........#.../...#......../..##......../############/..##......../...#......../............'},
  clock:{name:'Clock',b:'...######.../..#......#../.#...##...#./#....##....#/#....##....#/#....####..#/#....####..#/#..........#/#..........#/.#........#./..#......#../...######...'},
  pulse:{name:'Pulse',b:'............/............/....#......./....#......./...#.#....../...#.#....../##.#.#..####/..#...#.#.../......#.#.../.......#..../............/............'},
  snow:{name:'Snow',b:'.....##...../.##..##..##./.###.##.###./..########../....####..../############/############/....####..../..########../.###.##.###./.##..##..##./.....##.....'},
  peak:{name:'Peak',b:'............/............/............/............/....##....../...####...../..######.##./.##########./############/............/............/............'},
  term:{name:'Terminal',b:'############/#..........#/#.#........#/#..#.......#/#...#......#/#..#.......#/#.#...####.#/#..........#/############/............/............/............'},
  stack:{name:'Layers',b:'............/..########../..########../............/.##########./.##########./............/############/############/............/............/............'},
  view:{name:'Viewfinder',b:'###......###/#..........#/#..........#/............/............/.....##...../.....##...../............/............/#..........#/#..........#/###......###'},
  token:{name:'Token',b:'.....##...../....####..../...######.../..###..###../.###....###./###......###/###......###/.###....###./..###..###../...######.../....####..../.....##.....'},
  coin:{name:'Coin',b:'............/...######.../.##########./.##......##./##..####..##/##.##..##.##/##.##..##.##/##..####..##/.##......##./.##########./...######.../............'},
  doc:{name:'Contract',b:'.#######..../.#.....##.../.#.....#.#../.#.....####./.#.###....#./.#........#./.#.######.#./.#........#./.#.######.#./.#........#./.##########./............'},
  bank:{name:'Institution',b:'.....##...../...######.../.##########./............/.##..##..##./.##..##..##./.##..##..##./.##..##..##./............/############/############/............'},
  up:{name:'Growth',b:'....########/.....#######/......######/.....#######/....####.###/...####...##/..####.....#/.####......./####......../###........./##........../............'}
};
const PX_KEYS=Object.keys(PX_ICONS);
const pxRunCache={};
function pxRuns(k){
  if(pxRunCache[k]) return pxRunCache[k];
  const rows=(PX_ICONS[k]||PX_ICONS.cube).b.split('/'), out=[];
  rows.forEach((r,y)=>{let x=0;while(x<r.length){if(r[x]==='#'){let x1=x;while(x1+1<r.length&&r[x1+1]==='#')x1++;out.push([x,y,x1-x+1]);x=x1+1;}else x++;}});
  return pxRunCache[k]=out;
}
const pxSnap=s=>Math.max(12,Math.round((+s||24)/12)*12);
function pickW(rnd,list){const tot=list.reduce((a,c)=>a+Math.max(0,c[1]),0);if(!list.length)return null;if(tot<=0)return list[0][0];let r=rnd()*tot;for(const c of list){r-=Math.max(0,c[1]);if(r<0)return c[0];}return list[list.length-1][0];}
const q16=v=>Math.round(v*16)/16;
function shapeItem(name,prims,color,extra){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  prims.forEach(p=>{const pts=p.t==='r'?[[p.x,p.y],[p.x+p.w,p.y+p.h]]:p.pts;pts.forEach(q=>{x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);});
    if(p.live){x0=Math.min(x0,p.live.x);y0=Math.min(y0,p.live.y);x1=Math.max(x1,p.live.x+p.live.w);y1=Math.max(y1,p.live.y+p.live.h);}});
  return Object.assign({kind:'shape',name,prims,color,bb:[x0,y0,Math.max(0,x1-x0),Math.max(0,y1-y0)]},extra||{});
}
/* a pixel icon at x,y; size snaps to whole pixels (12 px grid) so it stays crisp */
function pxIcon(k,x,y,size,color,rnd,extra){
  const s=pxSnap(size), u=s/12, runs=pxRuns(k), n=runs.length;
  const order=runs.map((r,i)=>i); const mode=rnd()<.5?'scan':'rand';
  if(mode==='rand') order.sort(()=>rnd()-.5);
  const rank=new Array(n); order.forEach((ri,i)=>rank[ri]=i);
  const prims=runs.map((r,i)=>({t:'r',x:x+r[0]*u,y:y+r[1]*u,w:r[2]*u,h:u,f:1,a:q16(rank[i]/n*.9),b:q16(rank[i]/n*.9)}));
  return shapeItem('Icon · '+(PX_ICONS[k]||{}).name,prims,color,Object.assign({icon:k,s},extra||{}));
}
function pxOn(){const F=D.fill;return PX_KEYS.filter(k=>!F.pxSet||F.pxSet[k]!==false);}
/* ---- data series (0..1), long enough to scroll when live */
function series(rnd,n,kind){
  const L=Math.max(n*3,24), v=[]; let x=.5, ph=rnd()*6;
  for(let i=0;i<L;i++){
    if(kind==='wave') x=.5+.32*Math.sin(i*.55+ph)+.12*Math.sin(i*1.7+ph*2)+(rnd()-.5)*.08;
    else { x+= (rnd()-.5)*.28 + (.5-x)*.08 + (kind==='up'?.012:0); }
    v.push(x);
  }
  const lo=Math.min(...v), hi=Math.max(...v), sp=Math.max(1e-6,hi-lo);
  return v.map(t=>.08+.84*(t-lo)/sp);
}
function ptsFrom(vals,n,k,box,step){
  const out=[], dx=box.w/Math.max(1,n-1);
  for(let i=0;i<n;i++){const v=vals[(i+k)%vals.length], x=box.x+i*dx, y=box.y+box.h-v*box.h;
    if(step&&i){out.push([x,out[out.length-1][1]]);} out.push([x,y]);}
  return out;
}
const GRAPHS=[['line','Line'],['step','Step line'],['area','Area'],['bars','Bars'],['hist','Volume'],['candles','Candles'],['meter','Meter'],['heat','Heat grid'],['network','Network'],['wave','Waveform'],['depth','Order book']];
/* a graph filling box {x,y,w,h} */
function graphPrims(type,B,rnd,sw){
  const P=[], hw=Math.max(1,sw);
  const line=(step,area)=>{
    const n=Math.max(6,Math.min(48,Math.round(B.w/(step?10:7)))), vals=series(rnd,n,rnd()<.5?'up':'walk');
    const pts=ptsFrom(vals,n,0,B,step);
    if(area){ P.push({t:'p',pts:pts.concat([[B.x+B.w,B.y+B.h],[B.x,B.y+B.h]]),closed:true,f:1,o:.28,a:.85,b:.85,live:{vals,n,x:B.x,y:B.y,w:B.w,h:B.h,step,area:true}}); }
    P.push({t:'p',pts,sw:hw,trim:1,a:0,b:.85,live:{vals,n,x:B.x,y:B.y,w:B.w,h:B.h,step}});
    const e=pts[pts.length-1], m=hw*3; P.push({t:'r',x:e[0]-m/2,y:e[1]-m/2,w:m,h:m,f:1,a:.9,b:.9});
    P.push({t:'r',x:B.x,y:B.y+B.h-Math.max(1,hw*.5),w:B.w,h:Math.max(1,hw*.5),f:1,o:.4,a:0,b:0});
  };
  switch(type){
    case 'line': line(false,false); break;
    case 'step': line(true,false); break;
    case 'area': line(false,true); break;
    case 'wave':{ const n=Math.max(12,Math.min(64,Math.round(B.w/4))), vals=series(rnd,n,'wave'); P.push({t:'p',pts:ptsFrom(vals,n,0,B,false),sw:hw,trim:1,a:0,b:.9,live:{vals,n,x:B.x,y:B.y,w:B.w,h:B.h}});
      P.push({t:'r',x:B.x,y:B.y+B.h/2-.5,w:B.w,h:1,f:1,o:.3,a:0,b:0}); break; }
    case 'bars': case 'hist':{
      const gap=type==='bars'?Math.max(2,hw*2):Math.max(1,hw), bw=type==='bars'?Math.max(3,Math.min(B.w/6,hw*5)):Math.max(1,hw*1.2);
      const n=Math.max(3,Math.floor((B.w+gap)/(bw+gap))), vals=series(rnd,n,type==='bars'?'up':'walk');
      for(let i=0;i<n;i++){const h=Math.max(1,vals[i]*B.h), a=q16(i/n*.7); P.push({t:'r',x:B.x+i*(bw+gap),y:B.y+B.h-h,w:bw,h,f:1,grow:1,a,b:Math.min(1,a+.3)});}
      break; }
    case 'candles':{
      const bw=Math.max(3,hw*4), gap=Math.max(2,hw*2), n=Math.max(3,Math.floor((B.w+gap)/(bw+gap))), vals=series(rnd,n+1,'walk');
      for(let i=0;i<n;i++){const o=vals[i],c=vals[i+1],hi=Math.min(1,Math.max(o,c)+rnd()*.12),lo=Math.max(0,Math.min(o,c)-rnd()*.12),x=B.x+i*(bw+gap),Y=v=>B.y+B.h-v*B.h,a=q16(i/n*.85);
        P.push({t:'r',x:x+bw/2-Math.max(1,hw*.5)/2,y:Y(hi),w:Math.max(1,hw*.5),h:Math.max(1,Y(lo)-Y(hi)),f:1,a,b:a});
        const top=Y(Math.max(o,c)), bh=Math.max(1.5,Math.abs(Y(o)-Y(c)));
        P.push(c>=o?{t:'r',x,y:top,w:bw,h:bh,f:1,a,b:a}:{t:'r',x:x+hw/2,y:top+hw/2,w:Math.max(1,bw-hw),h:Math.max(1,bh-hw),sw:hw,a,b:a});}
      break; }
    case 'meter':{
      const n=Math.max(5,Math.min(24,Math.floor(B.w/Math.max(6,hw*6)))), gap=Math.max(1.5,hw*1.5), sw2=(B.w-gap*(n-1))/n, h=Math.min(B.h,Math.max(6,sw2*1.6)), k=Math.round(n*(.35+rnd()*.6)), y=B.y+B.h-h;
      for(let i=0;i<n;i++){const a=q16(i/n*.9); P.push(i<k?{t:'r',x:B.x+i*(sw2+gap),y,w:sw2,h,f:1,a,b:a}:{t:'r',x:B.x+i*(sw2+gap)+hw/2,y:y+hw/2,w:Math.max(1,sw2-hw),h:Math.max(1,h-hw),sw:hw,o:.6,a,b:a});}
      break; }
    case 'heat':{
      const c=Math.max(4,Math.min(28,Math.floor(B.w/Math.max(5,hw*5)))), cs=B.w/c, r=Math.max(2,Math.floor(B.h/cs)), g=Math.max(1,cs*.18);
      for(let j=0;j<r;j++)for(let i=0;i<c;i++){const v=rnd(); if(v<.38) continue; const a=q16(rnd()*.9);
        P.push({t:'r',x:B.x+i*cs,y:B.y+j*cs,w:cs-g,h:cs-g,f:1,o:v<.62?.35:v<.84?.65:1,a,b:a});}
      break; }
    case 'network':{
      const m=Math.max(4,Math.min(9,Math.round(B.w*B.h/2600))), nodes=[], ns=Math.max(3,hw*3.2);
      for(let i=0;i<m;i++) nodes.push([B.x+ns+rnd()*(B.w-ns*2),B.y+ns+rnd()*(B.h-ns*2)]);
      nodes.sort((p,q)=>p[0]-q[0]);
      for(let i=1;i<m;i++){const p=nodes[i]; let bj=0,bd=1e9; for(let j=0;j<i;j++){const d=Math.hypot(nodes[j][0]-p[0],nodes[j][1]-p[1]); if(d<bd){bd=d;bj=j;}}
        const a=q16(i/m*.8); P.push({t:'p',pts:[nodes[bj],p],sw:Math.max(1,hw*.6),trim:1,o:.7,a,b:Math.min(1,a+.2)});
        if(i>2&&rnd()<.35){const j2=Math.floor(rnd()*i); if(j2!==bj) P.push({t:'p',pts:[nodes[j2],p],sw:Math.max(1,hw*.6),trim:1,o:.4,a,b:Math.min(1,a+.2)});}}
      nodes.forEach((p,i)=>{const a=q16(i/m*.8), s=i===0||rnd()<.25?ns*1.6:ns; P.push({t:'r',x:p[0]-s/2,y:p[1]-s/2,w:s,h:s,f:1,a,b:a});});
      break; }
    case 'depth':{
      const n=12, mid=B.x+B.w/2, gap=Math.max(2,hw*2), L=[], R=[]; let v=0,v2=0;
      for(let i=0;i<=n;i++){v+=rnd()*.12;v2+=rnd()*.12; L.push([mid-gap-i*(B.w/2-gap)/n,v]); R.push([mid+gap+i*(B.w/2-gap)/n,v2]);}
      const mx=Math.max(v,v2), Y=t=>B.y+B.h-t/mx*B.h*.95;
      [L,R].forEach((S,si)=>{const pts=[]; S.forEach((p,i)=>{if(i)pts.push([p[0],Y(S[i-1][1])]);pts.push([p[0],Y(p[1])]);});
        P.push({t:'p',pts:pts.concat([[S[S.length-1][0],B.y+B.h],[S[0][0],B.y+B.h]]),closed:true,f:1,o:si?.25:.5,a:.8,b:.8});
        P.push({t:'p',pts,sw:hw,trim:1,a:0,b:.8});});
      break; }
  }
  return P;
}
function graphItem(type,B,rnd,color){ const sw=Math.max(.5,+D.fill.graphW||1.5); return shapeItem('Graph · '+((GRAPHS.find(g=>g[0]===type)||[])[1]||type),graphPrims(type,B,rnd,sw),color,{graph:type}); }
/* ---- combos: icon + Aeonik Fono readouts, built in absolute coords */
const COMBOS=[['stat','Stat: icon + number'],['badge','Status badge'],['iconrow','Icon row'],['labelgraph','Label + graph'],['frame','Viewfinder frame']];
const STAT_LABELS=[['TPS',900,6000,0,''],['VALIDATORS',1200,2400,0,''],['FINALITY',0.4,0.95,2,'S'],['UPTIME',99,99.99,2,'%'],['BLOCK',70000000,71900000,0,''],['L1S',40,180,0,''],['TVL',0.5,6,2,'B'],['FEE',0.01,0.08,3,'$']];
function textIt(lines,x,y,align,color,extra){return Object.assign({kind:'text',x,y,ay:'t',align,lines:lines.map(fillCase),color},extra||{});}
function comboItems(kind,S,rnd,met,color,inv){
  const out=[], lh=met.lh, cw=met.cw, bottom=S.ay==='b', right=S.ax==='r';
  const icK=()=>pickR(rnd,pxOn().length?pxOn():PX_KEYS);
  const place=(h)=>bottom?S.y+S.h-h:S.y;
  switch(kind){
    case 'stat':{
      const big=Math.max(met.size*1.6,Math.min(met.size*3.2,S.h-lh*1.2)), bigLH=big*lh/met.size, H=Math.min(S.h,lh+bigLH);
      const isz=pxSnap(Math.min(H,Math.max(12,H))), y=place(Math.max(H,isz));
      const L=pickR(rnd,STAT_LABELS), to=L[1]+(L[2]-L[1])*rnd(), txt=fmtNum(to,L[3]);
      if(S.w<isz+cw*Math.max(8,txt.length+2)) return [];
      const ix=right?S.x+S.w-isz:S.x, tx=right?ix-cw*1.2:S.x+isz+cw*1.2;
      out.push(pxIcon(icK(),ix,y,isz,color,rnd));
      out.push(textIt([L[0]],tx,y,right?'r':'l',color));
      out.push(textIt([L[4]==='$'?'$'+txt:txt+L[4]],tx,y+lh,right?'r':'l',color,{sz:big,count:{line:0,from:L[1],to,dec:L[3],pre:L[4]==='$'?'$':'',suf:L[4]==='$'?'':L[4]}}));
      break; }
    case 'badge':{
      const word=pickR(rnd,['FINALIZED','ACCEPTED','VERIFIED','SETTLED','LIVE','SYNCED','SIGNED','CONFIRMED','HEALTHY']);
      const isz=12, ph=Math.max(isz+4,lh+6), padx=cw*.9, bw=padx*2+isz+cw*.8+word.length*cw;
      if(bw>S.w||ph>S.h) return [];
      const x=right?S.x+S.w-bw:S.x, y=place(ph+(S.h>ph+lh*1.4?lh*1.3:0));
      out.push(shapeItem('Badge',[{t:'r',x,y,w:bw,h:ph,f:1,a:0,b:0}],color));
      out.push(pxIcon(pickR(rnd,['check','shield','lock','bolt','blocks','cube'].filter(k=>pxOn().indexOf(k)>=0).concat(['check'])),x+padx,y+(ph-isz)/2,isz,inv,rnd));
      out.push(textIt([word],x+padx+isz+cw*.8,y+(ph-lh)/2+lh*.08,'l',inv,{type:true}));
      if(S.h>ph+lh*1.4) out.push(textIt(['0X'+hexR(rnd,6).toUpperCase()+'…'+hexR(rnd,4).toUpperCase()],right?S.x+S.w:S.x,y+ph+lh*.3,right?'r':'l',color,{scr:true}));
      break; }
    case 'iconrow':{
      const isz=pxSnap(Math.min(S.h,Math.max(12,lh*2))), gap=Math.max(4,isz*.35), n=Math.max(2,Math.min(5,Math.floor((S.w+gap)/(isz+gap))));
      if(n<2||isz>S.h) return [];
      const keys=(pxOn().length?pxOn():PX_KEYS).slice().sort(()=>rnd()-.5).slice(0,n), on=Math.floor(rnd()*n), y=place(isz+(S.h>isz+lh*1.3?lh*1.2:0)), w=n*isz+(n-1)*gap, x0=right?S.x+S.w-w:S.x;
      keys.forEach((k,i)=>out.push(pxIcon(k,x0+i*(isz+gap),y,isz,color,rnd,i===on?{blink:1}:{o:.35})));
      if(S.h>isz+lh*1.3) out.push(textIt([pickR(rnd,['NODE ','STEP ','PHASE ','SLOT '])+(on+1)+'/'+n],right?S.x+S.w:S.x,y+isz+lh*.25,right?'r':'l',color,{type:true}));
      break; }
    case 'labelgraph':{
      if(S.h<lh*2.6||S.w<cw*12) return [];
      const L=pickR(rnd,STAT_LABELS), to=L[1]+(L[2]-L[1])*rnd(), y=S.y, gh=Math.min(S.h-lh*1.4,Math.max(lh*1.6,S.h*.7));
      out.push(textIt([L[0]+' · '+pickR(rnd,['24H','1H','LIVE','7D'])],S.x,y,'l',color,{type:true}));
      out.push(textIt([fmtNum(to,L[3])+L[4]],S.x+S.w,y,'r',color,{count:{line:0,from:L[1],to,dec:L[3],pre:'',suf:L[4]}}));
      const gs=(()=>{const g=Object.keys(D.fill.graphs||{}).filter(k=>D.fill.graphs[k]);return g.length?g:['line'];})();
      const gs2=gs.filter(g=>g!=='network'&&g!=='depth'&&g!=='heat');
      out.push(graphItem(pickR(rnd,gs2.length?gs2:['line']),{x:S.x,y:y+lh*1.35,w:S.w,h:gh},rnd,color));
      break; }
    case 'frame':{
      const m=Math.min(S.w,S.h)*.22, sw=Math.max(1,+D.fill.graphW||1.5), x0=S.x,y0=S.y,x1=S.x+S.w,y1=S.y+S.h;
      const P=[[[x0,y0+m],[x0,y0],[x0+m,y0]],[[x1-m,y0],[x1,y0],[x1,y0+m]],[[x1,y1-m],[x1,y1],[x1-m,y1]],[[x0+m,y1],[x0,y1],[x0,y1-m]]].map((pts,i)=>({t:'p',pts,sw,trim:1,a:q16(i*.15),b:q16(i*.15+.4)}));
      const c=Math.max(2,sw*2); P.push({t:'r',x:(x0+x1)/2-c/2,y:(y0+y1)/2-c/2,w:c,h:c,f:1,a:.8,b:.8});
      out.push(shapeItem('Frame',P,color));
      if(S.w>cw*14&&S.h>lh*2.5) out.push(textIt(['X '+String(Math.round(rnd()*9999)).padStart(4,'0')+'  Y '+String(Math.round(rnd()*9999)).padStart(4,'0')],x0+m*.6,y0+m*.5,'l',color,{scr:true}));
      break; }
  }
  return out;
}
/* ---- patterns for the empty space in a block */
const PATTERNS=[['dots','Dots'],['cross','Crosses'],['hatch','Hatching'],['scan','Scanlines']];
function patternItem(kind,free,sp,d,color,x0,W){
  const P=[], wipe=x=>q16(Math.max(0,Math.min(.95,(x-x0)/Math.max(1,W)*.9)));
  if(kind==='cross'){ const g=sp*2, arm=Math.max(2,sp*.45), th=Math.max(1,d*.5); let n=0;
    free.forEach(f=>{for(let y=f.y;y<=f.y+f.h+.1&&n<600;y+=g)for(let x=f.x;x<=f.x+f.w+.1&&n<600;x+=g){n++;const a=wipe(x);P.push({t:'r',x:x-arm,y:y-th/2,w:arm*2,h:th,f:1,a,b:a},{t:'r',x:x-th/2,y:y-arm,w:th,h:arm*2,f:1,a,b:a});}}); }
  else if(kind==='scan'){ const th=Math.max(1,d*.45);
    free.forEach(f=>{for(let y=f.y;y<=f.y+f.h+.1;y+=sp*2){P.push({t:'r',x:f.x,y:y-th/2,w:Math.max(th,f.w),h:th,f:1,o:.5,trimX:1,a:0,b:.9});}}); }
  else if(kind==='hatch'){ const g=sp*1.4, th=Math.max(1,d*.45);
    free.forEach(f=>{ if(f.w<g||f.h<g) return; for(let c=-f.h;c<=f.w;c+=g){ // line x - y = c inside the rect
      const xa=Math.max(f.x,f.x+c), ya=xa-(f.x+c)+f.y, xb=Math.min(f.x+f.w,f.x+c+f.h), yb=xb-(f.x+c)+f.y;
      if(xb-xa<1) continue; const a=wipe(xa); P.push({t:'p',pts:[[xa,ya],[xb,yb]],sw:th,trim:1,a,b:Math.min(1,a+.1)});}}); }
  return P.length?shapeItem('Pattern · '+kind,P,color,{pat:kind}):null;
}
/* ---- canvas: draw a shape item at build progress u (0..1) */
function trimPts(pts,k){
  if(k>=1) return pts; let L=0; for(let i=1;i<pts.length;i++) L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  let want=L*k; const out=[pts[0]];
  for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); if(want>=s){out.push(pts[i]);want-=s;continue;}
    const t=s?want/s:0; out.push([pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t]); break;}
  return out;
}
function livePts(lv,k){const pts=ptsFrom(lv.vals,lv.n,k,lv,lv.step); return lv.area?pts.concat([[lv.x+lv.w,lv.y+lv.h],[lv.x,lv.y+lv.h]]):pts;}
function drawShapeItem(g,it,dx,dy,st,alpha){
  const u=st?st.u:1, a0=alpha*(st?st.a:1)*(it.o==null?1:it.o), lk=st&&st.liveK!=null?st.liveK:null;
  g.save(); g.lineJoin='miter'; g.lineCap='butt'; g.fillStyle=it.color; g.strokeStyle=it.color;
  it.prims.forEach(p=>{
    let k=1; if(u<1){ k=p.b>p.a?Math.max(0,Math.min(1,(u-p.a)/(p.b-p.a))):(u>0&&u>=p.a?1:0); }
    if(k<=0) return;
    g.globalAlpha=a0*(p.o==null?1:p.o);
    if(p.t==='r'){
      let x=p.x,y=p.y,w=p.w,h=p.h; if(k<1&&p.grow){h=p.h*k;y=p.y+p.h-h;} if(k<1&&p.trimX){w=p.w*k;}
      if(p.f) g.fillRect(x+dx,y+dy,w,h); else {g.lineWidth=p.sw||1; g.strokeRect(x+dx,y+dy,w,h);}
      return;
    }
    let pts=p.live&&lk!=null?livePts(p.live,lk):p.pts; if(p.trim&&k<1) pts=trimPts(pts,k);
    if(pts.length<2) return;
    g.beginPath(); pts.forEach((q,i)=>i?g.lineTo(q[0]+dx,q[1]+dy):g.moveTo(q[0]+dx,q[1]+dy)); if(p.closed) g.closePath();
    if(p.f) g.fill(); else {g.lineWidth=p.sw||1; g.stroke();}
  });
  g.restore();
}
/* timing for shapes: type-on builds them over 'Build' frames; type-off un-builds */
function shapeTiming(it,fps){
  const A=it.A||D.fill.anim, build=A.inMode==='type';
  const on=build?Math.max(1,+(A.buildDur||D.fill.buildDur)||12)/fps:A.inMode==='fade'?Math.max(1,+A.inDur||8)/fps:0;
  let mode=A.outMode, off=(mode==='stay'||A.anchor==='phases'||A.anchor==='leave')?Infinity:on+Math.max(0,+A.hold||0)/fps, outLen=mode==='cut'?0:Math.max(1,+A.outDur||10)/fps;
  if(it.tEnd!=null&&isFinite(it.tEnd)){ if(mode==='stay'){mode='fade';outLen=Math.max(1,+A.outDur||10)/fps;} off=Math.min(off,Math.max(0,(it.tEnd-it.t0)/fps-outLen)); }
  return {build,on,off,outLen,mode};
}
function shapeAt(it,tf,fps){
  const A=it.A||D.fill.anim, el=(tf-it.t0)/fps; if(el<0) return null;
  const T=shapeTiming(it,fps); let u=1,a=1;
  if(T.build) u=Math.min(1,el/T.on); else if(A.inMode==='fade') a=Math.min(1,el/Math.max(1e-3,T.on));
  if(el>=T.off){ if(T.mode==='cut') return null; const w=(el-T.off)/Math.max(1e-3,T.outLen); if(w>=1) return null; if(T.mode==='typeoff'&&T.build) u=Math.min(u,1-w); else a*=1-w; }
  const live=A.live&&el>=T.on&&el<T.off, rate=+A.liveRate||6;
  if(live&&it.blink&&A.liveBlink!==false&&Math.floor((el-T.on)*rate)%2) a*=.2;
  return {u,a,liveK:live&&A.liveGraph!==false?Math.floor((el-T.on)*rate):null};
}
/* AE: one payload per shape item; prims sharing a build step merge into one group */
function payShape(it,t0,tEnd,fps){
  const t=Object.assign({},it,{t0}); if(tEnd!=null) t.tEnd=tEnd;
  const T=shapeTiming(t,fps), A=it.A||D.fill.anim, ts=r3(Math.max(0,t0)/fps);
  const uX=T.build?'var gbE=time-'+ts+';var gbU=gbE<0?0:Math.min(1,gbE/'+r3(T.on)+');'+(T.mode==='typeoff'&&isFinite(T.off)?'if(gbE>='+r3(T.off)+')gbU=Math.min(gbU,Math.max(0,1-(gbE-'+r3(T.off)+')/'+r3(T.outLen)+'));':''):null;
  const kX=p=>p.b>p.a?'Math.max(0,Math.min(1,(gbU-'+p.a+')/'+r3(p.b-p.a)+'))':'(gbU>0&&gbU>='+p.a+'?1:0)';
  const groups=[], byKey={};
  it.prims.forEach(p=>{
    const shape=p.t==='r'?{t:'r',x:r3(p.x),y:r3(p.y),w:r3(p.w),h:r3(p.h)}:{t:'p',pts:p.pts.map(q=>[r3(q[0]),r3(q[1])]),closed:!!p.closed};
    const solo=p.grow||p.trim||p.trimX||(p.live&&A.live&&A.liveGraph!==false);
    const key=[p.t==='r'?'r':'p',p.f?1:0,p.sw||0,p.o==null?1:p.o,uX?p.a:0,uX?p.b:0].join('|');
    if(!solo&&byKey[key]){byKey[key].shapes.push(shape);return;}
    const grp={shapes:[shape],f:p.f?1:0,sw:r3(p.sw||1),o:p.o==null?100:Math.round(p.o*100)};
    if(uX){
      if(p.trim) grp.tx=uX+'var gbK='+kX(p)+';gbK*100;';
      else if(p.grow&&p.t==='r'){grp.grow=[r3(p.x),r3(p.y+p.h)];grp.gx=uX+'var gbK='+kX(p)+';[100,gbK*100];';}
      else if(p.trimX&&p.t==='r'){grp.grow=[r3(p.x),r3(p.y+p.h/2)];grp.gx=uX+'var gbK='+kX(p)+';[gbK*100,100];';}
      else grp.ox=uX+'var gbK='+kX(p)+';value*(gbK>0?1:0);';
    }
    if(p.live&&A.live&&A.liveGraph!==false){ const lv=p.live, n=lv.n, on=r3(t0/fps+T.on);
      grp.px='var gbD='+JSON.stringify(lv.vals.map(v=>r3(v)))+';var gbK=time<'+on+'?0:Math.floor((time-'+on+')*'+(+A.liveRate||6)+');var gbP=[];var gbN='+n+';'+
        'for(var i=0;i<gbN;i++){var v=gbD[(i+gbK)%gbD.length],x='+r3(lv.x)+'+i*'+r3(lv.w/Math.max(1,n-1))+',y='+r3(lv.y+lv.h)+'-v*'+r3(lv.h)+';'+(lv.step?'if(i>0)gbP.push([x,gbP[gbP.length-1][1]]);':'')+'gbP.push([x,y]);}'+
        (lv.area?'gbP.push(['+r3(lv.x+lv.w)+','+r3(lv.y+lv.h)+']);gbP.push(['+r3(lv.x)+','+r3(lv.y+lv.h)+']);':'')+'createPath(gbP,[],[],'+(lv.area?'true':'false')+');'; }
    groups.push(grp); if(!solo) byKey[key]=grp;
  });
  // layer opacity: fades, cut, blink
  let e=null; const fadeIn=A.inMode==='fade', fadeOut=isFinite(T.off)&&(T.mode==='fade'||(T.mode==='typeoff'&&!T.build)), cutOut=isFinite(T.off)&&T.mode==='cut', blink=it.blink&&A.live&&A.liveBlink!==false;
  if(fadeIn||fadeOut||cutOut||blink||it.o!=null){
    e='var gbE=time-'+ts+';var gbA=gbE<0?0:1;\n';
    if(fadeIn) e+='if(gbE>=0)gbA=Math.min(1,gbE/'+r3(Math.max(1e-3,T.on))+');\n';
    if(blink) e+='if(gbE>='+r3(T.on)+(isFinite(T.off)?'&&gbE<'+r3(T.off):'')+'&&Math.floor((gbE-'+r3(T.on)+')*'+(+A.liveRate||6)+')%2==1)gbA*=0.2;\n';
    if(fadeOut) e+='if(gbE>='+r3(T.off)+')gbA*=Math.max(0,1-(gbE-'+r3(T.off)+')/'+r3(T.outLen)+');\n';
    if(cutOut) e+='if(gbE>='+r3(T.off)+')gbA=0;\n';
    e+='value*gbA;';
  }
  return {kind:'shape',name:it.name,groups,color:hexRgb(it.color),t0:ts,opx:e,op:it.o==null?100:Math.round(it.o*100)};
}
let fontCW={};
function fillMetrics(){
  const F=D.fill, size=Math.max(6,+F.size||14), k=F.family+'|'+F.style;
  if(fontCW[k]==null){
    // measure the real average character width once (falls back to 0.6em if the font isn't installed)
    let r=0.6;
    try{const c=document.createElement('canvas').getContext('2d');c.font=cssFont(F.family,F.style,100);const w=c.measureText('0X9A7F3C BLOCK #70,075 STATUS: OK').width/33;if(w>20&&w<90)r=Math.max(.5,Math.min(.75,w/100));}catch(e){}
    fontCW[k]=r;
  }
  return {size,cw:size*fontCW[k],lh:size*(Math.max(80,+F.leading||100)/100)};
}
const fillCache=new Map();
/* items for one block/echo rect: corners for text, the middle for a pattern */
function fillItems(G,b,rect,isEcho){
  const F=D.fill; if(!F||!F.on) return [];
  if(!isEcho&&(b.noFill||(F.skipText&&b.text))) return [];
  const mods=FILL_MODULES.map(m=>m[0]).filter(m=>F.mods[m]);
  const gOn=GRAPHS.map(g=>g[0]).filter(k=>F.graphs&&F.graphs[k]), cOn=COMBOS.map(c=>c[0]).filter(k=>F.combos&&F.combos[k]);
  const pOn=(F.mods.dots?['dots']:[]).concat(PATTERNS.map(q=>q[0]).filter(k=>k!=='dots'&&F.pats&&F.pats[k]));
  if(!mods.length&&!gOn.length&&!cOn.length&&!pOn.length) return [];
  const solid=!isEcho&&!isOutline(b);
  const color=isEcho?(D.echo.stroke?D.echo.scolor:D.echo.color):solid?F.textColor:b.color;
  const inv=isEcho?(D.echo.fill?D.echo.color:D.look.bg):solid?b.color:(D.look.bg||'#1F1F1F');
  const key=[b.id,b.fillSeed||0,rect.x|0,rect.y|0,rect.w|0,rect.h|0,isEcho?1:0,color,inv,JSON.stringify(F),!isEcho&&numOn(b)?JSON.stringify(D.num):''].join('|');
  const hit=fillCache.get(key); if(hit) return hit;
  const rnd=rng(fillHash(b.id+(isEcho?77777:0),(F.seed|0)+(b.fillSeed||0)*131));
  const met=fillMetrics(), pad=Math.max(8,Math.min(28,Math.min(rect.w,rect.h)*.08));
  const W=rect.w-2*pad, H=rect.h-2*pad; if(W<met.cw*5||H<met.lh) {fillCache.set(key,[]);return [];}
  const two=W>met.cw*30, tall=H>met.lh*6;
  const nb=!isEcho&&numOn(b)?numLayout(rect,numStr(88)):null, nW=nb?nb.w+met.cw*2:0;
  const slots=[{x:0,y:0,w:two?W*.46:Math.max(0,W-nW),h:tall?H*.45:H,ax:'l',ay:'t'}];
  if(two&&!nb) slots.push({x:W*.54,y:0,w:W*.46,h:tall?H*.45:H,ax:'r',ay:'t'});
  if(tall){slots.push({x:0,y:H*.55,w:two?W*.46:W,h:H*.45,ax:'l',ay:'b'}); if(two) slots.push({x:W*.54,y:H*.55,w:W*.46,h:H*.45,ax:'r',ay:'b'});}
  const want={light:2,medium:3,busy:4}[F.density]||3;
  // only a share of blocks get readouts / graphs / combos (the rest can be pure pattern or icon)
  const hasText=(fillHash(b.id+(isEcho?77777:0),(F.seed|0)+23+(b.fillSeed||0))%100)<(F.textPct==null?100:+F.textPct);
  const textMods=hasText?mods.filter(m=>m!=='dots'&&m!=='ring'&&m!=='logo'&&m!=='icons'):[];
  const MX=F.mix||{text:100,graph:0,combo:0};
  const order=slots.map((s,i)=>i).sort(()=>rnd()-.5).slice(0,Math.min(want,slots.length));
  let items=[], idx=0, usedG={};
  order.sort((a,b)=>a-b).forEach(si=>{
    const s=slots[si], S={x:s.x+rect.x+pad,y:s.y+rect.y+pad,w:s.w,h:s.h,ax:s.ax,ay:s.ay};
    const cats=[]; if(textMods.length) cats.push(['text',+MX.text||0]);
    if(hasText&&gOn.length&&S.w>=met.cw*8&&S.h>=met.lh*1.6) cats.push(['graph',+MX.graph||0]);
    if(hasText&&cOn.length&&S.w>=met.cw*9&&S.h>=met.lh*1.2) cats.push(['combo',+MX.combo||0]);
    const cat=pickW(rnd,cats); if(!cat) return;
    let its=[];
    if(cat==='graph'){
      let gt=pickR(rnd,gOn); if(usedG[gt]&&gOn.length>1) gt=pickR(rnd,gOn); usedG[gt]=1;
      const gh=Math.min(S.h,Math.max(met.lh*2,Math.min(S.h,met.lh*(tall?5:3.2)))), gy=S.ay==='b'?S.y+S.h-gh:S.y;
      its=[graphItem(gt,{x:S.x,y:gy,w:S.w,h:gh},rnd,color)];
    } else if(cat==='combo'){
      its=comboItems(pickR(rnd,cOn),S,rnd,met,color,inv);
    }
    if(cat==='text'||!its.length){
      if(!textMods.length) return;
      let m=pickR(rnd,textMods);
      if(s.ay==='b'&&textMods.indexOf('block')>=0&&rnd()<.5) m='block';
      its=buildModule(m,{x:s.x,y:s.y,w:s.w,h:s.h,ax:s.ax,ay:s.ay},rnd,met,color);
      its.forEach(it=>{it.x+=rect.x+pad;it.y+=rect.y+pad;if(it.kind==='text'&&it.ay==='b'){it.y=rect.y+rect.h-pad-it.lines.length*met.lh;}});
    }
    its.forEach(it=>{it.slot=idx;items.push(it);}); if(its.length) idx++;
  });
  // an icon (pixel set, line set, ring, Avalanche logo) in the largest open space
  const lineOn=ICON_KEYS.filter(k=>!F.iconSet||F.iconSet[k]!==false), px=F.iconLib!=='line';
  const icons=mods.filter(m=>m==='ring'||m==='logo').concat(mods.indexOf('icons')>=0?(px?pxOn().map(k=>'p:'+k):lineOn.map(k=>'i:'+k)):[]);
  const isz=px?pxSnap(F.iconSize):Math.max(8,+F.iconSize||28);
  if(icons.length&&rnd()<(F.iconPct==null?15:+F.iconPct)/100){
    const avoid=nb?items.concat([{kind:'box',x:nb.x-nb.w,y:nb.y,w:nb.w,h:nb.h}]):items;
    const free0=freeRects(rect.x+pad,rect.y+pad,W,H,Math.max(3,+F.dotSpacing||8),avoid,met);
    const big=free0.filter(f=>f.w>=isz&&f.h>=isz).sort((a,c)=>c.w*c.h-a.w*a.h)[0];
    if(big){
      const ic=pickR(rnd,icons), cx=big.x+big.w/2, cy=big.y+big.h/2;
      if(ic==='ring') items.push({kind:'ring',cx,cy,r:isz/2,w:Math.max(1.2,isz*.06),color,slot:idx++});
      else if(ic.indexOf('p:')===0){ const u=isz/12; items.push(Object.assign(pxIcon(ic.slice(2),Math.round((cx-isz/2)/u)*u,Math.round((cy-isz/2)/u)*u,isz,color,rnd),{slot:idx++})); }
      else if(ic.indexOf('i:')===0) items.push({kind:'icon',name:ic.slice(2),x:cx-isz/2,y:cy-isz/2,w:isz,h:isz,s:isz,color,slot:idx++});
      else items.push({kind:'logo',x:cx-isz*AVAX_LOGO.w/AVAX_LOGO.h/2,y:cy-isz/2,s:isz/AVAX_LOGO.h,color,slot:idx++});
    }
  }
  // a pattern in all the space the rest doesn't use
  if(pOn.length&&rnd()<(F.patternPct==null?40:+F.patternPct)/100){
    const pk=pickR(rnd,pOn), sp=Math.max(3,+F.dotSpacing||8), d=dotD(sp);
    const free=freeRects(rect.x+pad,rect.y+pad,W,H,pk==='cross'?sp*2:sp,nb?items.concat([{kind:'box',x:nb.x-nb.w,y:nb.y,w:nb.w,h:nb.h}]):items,met);
    if(free.length){
      if(pk==='dots') items.push({kind:'dots',rects:free.map(f=>({x:f.x,y:f.y,cols:f.cols,rows:f.rows})),sp,d,sq:F.dotShape==='square',color,slot:idx++});
      else { const it=patternItem(pk,free,sp,d,color,rect.x+pad,W); if(it){it.slot=idx++;items.push(it);} }
    }
  }
  fillCache.set(key,items); if(fillCache.size>4000) fillCache.clear();
  return items;
}
/* empty space for a dot field: a dot grid over the area, minus anything near text, merged into rectangles */
function freeRects(x0,y0,W,H,sp,items,met){
  const cols=Math.max(0,Math.floor(W/sp)+1), rows=Math.max(0,Math.floor(H/sp)+1); if(!cols||!rows) return [];
  const m=met.size*.6, used=new Uint8Array(cols*rows);
  items.forEach(it=>{
    let bx0,bx1,by0,by1;
    if(it.kind==='text'){const k=it.sz?it.sz/met.size:1,w=Math.max(...it.lines.map(l=>l.length))*met.cw*k;bx0=(it.align==='r'?it.x-w:it.x)-m;bx1=(it.align==='r'?it.x:it.x+w)+m;by0=it.y-m;by1=it.y+it.lines.length*met.lh*k+m;}
    else if(it.kind==='shape'){bx0=it.bb[0]-m;bx1=it.bb[0]+it.bb[2]+m;by0=it.bb[1]-m;by1=it.bb[1]+it.bb[3]+m;}
    else if(it.kind==='ring'){bx0=it.cx-it.r-m;bx1=it.cx+it.r+m;by0=it.cy-it.r-m;by1=it.cy+it.r+m;}
    else if(it.kind==='logo'){bx0=it.x-m;bx1=it.x+AVAX_LOGO.w*it.s+m;by0=it.y-m;by1=it.y+AVAX_LOGO.h*it.s+m;}
    else if(it.kind==='box'||it.kind==='icon'){bx0=it.x-m;bx1=it.x+it.w+m;by0=it.y-m;by1=it.y+it.h+m;}
    else return;
    for(let r=0;r<rows;r++){const y=y0+r*sp; if(y<by0||y>by1) continue;
      for(let c=0;c<cols;c++){const x=x0+c*sp; if(x>=bx0&&x<=bx1) used[r*cols+c]=1;}}
  });
  const out=[], done=new Uint8Array(cols*rows);
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const i=r*cols+c; if(used[i]||done[i]) continue;
    let c1=c; while(c1+1<cols&&!used[r*cols+c1+1]&&!done[r*cols+c1+1]) c1++;
    let r1=r; outer: while(r1+1<rows){for(let k=c;k<=c1;k++){const j=(r1+1)*cols+k;if(used[j]||done[j])break outer;} r1++;}
    for(let rr=r;rr<=r1;rr++)for(let k=c;k<=c1;k++)done[rr*cols+k]=1;
    const n=(c1-c+1)*(r1-r+1); if(n<4) continue;          // skip specks
    out.push({x:x0+c*sp,y:y0+r*sp,cols:c1-c+1,rows:r1-r+1,w:(c1-c)*sp,h:(r1-r)*sp});
  }
  return out;
}
/* Between-blocks timing: its own on / hold / off, or the Text HUD's */
function gapA(){ const GA=(D.fill.gap&&D.fill.gap.anim)||{}; if(GA.own===false) return D.fill.anim;
  return Object.assign({},D.fill.anim,{anchor:GA.anchor||'block',inMode:GA.inMode,cps:GA.cps,inDur:GA.inDur,buildDur:GA.buildDur,outMode:GA.outMode,hold:GA.hold,outDur:GA.outDur}); }
/* one colour per timeline layer */
const LAYER_COL={hud:'#E6212F',gaps:'#F5A524',numbers:'#8FA2FF',echo:'#3FC7B5',text:'#EBF0FA',none:'#686871'};
/* text in empty grid areas between blocks */
function gapItems(G,list){
  const F=D.fill, Gp=F.gap; if(!F.on||!Gp||!Gp.on||!list.length) return [];
  const mods=GAP_MODULES.map(m=>m[0]).filter(m=>Gp.mods[m]); if(!mods.length) return [];
  const occ=new Set(); list.forEach(b=>{for(let c=b.c;c<b.c+b.w;c++)for(let r=b.r;r<b.r+b.h;r++)occ.add(c+','+r);});
  if(D.echo.on) list.forEach(b=>{const dx=Math.round(+D.echo.dx||0),dy=Math.round(+D.echo.dy||0);for(let c=b.c+dx;c<b.c+dx+b.w;c++)for(let r=b.r+dy;r<b.r+dy+b.h;r++)occ.add(c+','+r);});
  const c0=Math.min(...list.map(b=>b.c)), c1=Math.max(...list.map(b=>b.c+b.w-1));
  const rnd=rng(fillHash(4242,(F.seed|0)+(Gp.seed|0))), met=fillMetrics(), out=[];
  const n=Math.max(1,Math.round((c1-c0+1)/10*(+Gp.amount||3)));
  for(let k=0,tries=0;k<n&&tries<n*30;tries++){
    const m=pickR(rnd,mods), wc=m==='dots'?2+Math.floor(rnd()*3):m==='log'?3+Math.floor(rnd()*2):2+Math.floor(rnd()*2), hc=m==='dots'?1+Math.floor(rnd()*2):1;
    const c=c0+Math.floor(rnd()*(c1-c0+1)), r=Math.floor(rnd()*Math.max(1,G.R-hc+1));
    let free=true; for(let x=c;x<c+wc&&free;x++)for(let y=r;y<r+hc;y++) if(occ.has(x+','+y)) {free=false;break;}
    if(!free) continue;
    for(let x=c;x<c+wc;x++)for(let y=r;y<r+hc;y++) occ.add(x+','+y);
    const q=cellRect(G,c,r,wc,hc), pad=Math.max(8,G.s*.1), color=Gp.color||D.block.color;
    if(m==='icons'&&F.iconLib!=='line'){const on=pxOn(),isz=Math.min(pxSnap(F.iconSize),Math.max(12,Math.floor((q.h-pad*2)/12)*12));if(on.length){const it=pxIcon(pickR(rnd,on),q.x+pad,q.y+pad,isz,color,rnd);it.col=c;it.slot=0;out.push(it);k++;}continue;}
    if(m==='graph'){const gs=GRAPHS.map(g=>g[0]).filter(t=>F.graphs&&F.graphs[t]&&t!=='network'&&t!=='depth'),it=graphItem(gs.length?pickR(rnd,gs):'line',{x:q.x+pad,y:q.y+pad,w:q.w-2*pad,h:Math.max(6,q.h-2*pad)},rnd,color);it.col=c;it.slot=0;out.push(it);k++;continue;}
    if(m==='icons'){const isz=Math.min(Math.max(8,+F.iconSize||28),q.h-pad*2),on=ICON_KEYS.filter(k=>!F.iconSet||F.iconSet[k]!==false);if(on.length){out.push({kind:'icon',name:pickR(rnd,on),x:q.x+pad,y:q.y+pad,w:isz,h:isz,s:isz,color,col:c,slot:0});k++;}continue;}
    if(m==='logo'){const isz=Math.min(Math.max(8,+F.iconSize||28),q.h-pad*2);out.push({kind:'logo',x:q.x+pad,y:q.y+pad,s:isz/AVAX_LOGO.h,color,col:c,slot:0});k++;continue;}
    if(m==='dots'){const sp=Math.max(3,+F.dotSpacing||8);out.push({kind:'dots',rects:[{x:q.x+pad*.5,y:q.y+pad*.5,cols:Math.max(1,Math.floor((q.w-pad)/sp)+1),rows:Math.max(1,Math.floor((q.h-pad)/sp)+1)}],sp,d:dotD(sp),sq:D.fill.dotShape==='square',color,col:c,slot:0});k++;continue;}
    const its=buildModule(m==='hashes'?'hashes':m,{x:q.x+pad,y:q.y+pad,w:q.w-2*pad,h:q.h-2*pad,ax:'l',ay:'t'},rnd,met,color);
    its.forEach(it=>{it.col=c;it.slot=0;out.push(it);}); k++;
  }
  return out;
}
/* ---- animated text state (same maths as the AE expressions) */
function fmtNum(v,dec){const p=Math.abs(v).toFixed(dec).split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return (v<0?'-':'')+p.join('.');}
function scrambleLine(s,k){const r=rng(k*7919+s.length);return s.replace(/[0-9A-Fa-f]/g,ch=>{const h='0123456789ABCDEF'[Math.floor(r()*16)];return ch===ch.toLowerCase()&&/[a-f]/.test(ch)?h.toLowerCase():h;});}
/* when an item is fully on / starts going / is gone (seconds from its start) */
function fillTiming(it,fullLen,fps){
  const A=it.A||D.fill.anim, typed=it.kind==='text'&&A.inMode==='type'&&(it.type||A.typeAll);
  const on=typed?fullLen/Math.max(1,+A.cps||40):A.inMode==='fade'?Math.max(1,+A.inDur||8)/fps:0;
  let mode=A.outMode, off=(mode==='stay'||A.anchor==='phases'||A.anchor==='leave')?Infinity:on+Math.max(0,+A.hold||0)/fps;
  let outLen=mode==='cut'?0:Math.max(1,+A.outDur||10)/fps;
  if(it.tEnd!=null&&isFinite(it.tEnd)){   // its block leaves at tEnd: the content is gone by then
    if(mode==='stay'){mode='fade';outLen=Math.max(1,+A.outDur||10)/fps;}
    off=Math.min(off,Math.max(0,(it.tEnd-it.t0)/fps-outLen));
  }
  return {typed,on,off,outLen,mode};
}
/* text + opacity at frame tf (same maths as the AE expressions) — null = not visible */
function fillTextAt(it,tf,fps){
  const F=D.fill, A=it.A||F.anim, el=(tf-it.t0)/fps;
  if(el<0) return null;
  let L=it.lines.slice();
  if(it.count&&A.count){const c=it.count,u=Math.min(1,el/Math.max(.05,(+A.countDur||36)/fps)),e=u*u*(3-2*u);L[c.line]=c.pre+fmtNum(c.from+(c.to-c.from)*e,c.dec)+c.suf;}
  if(it.scr&&A.scramble&&(A.scrMode==='always'||el<(+A.scrDur||30)/fps)){const k=Math.floor(tf/fps*(+A.scrRate||12));L=L.map((l,i)=>scrambleLine(l,k+i*31));}
  if(it.ell&&A.ellipsis){L[L.length-1]=L[L.length-1]+'.'.repeat(Math.floor(el*4)%4);}
  const full=it.lines.join('\n').length, T=fillTiming(it,full,fps);
  if(A.live&&el>=T.on&&el<T.off) L=liveLines(it,L,el,T,fps);
  let s=L.join('\n');
  let a=1;
  if(T.typed){const n=Math.floor(el*(+A.cps||40)+1e-6);if(n<s.length)s=s.slice(0,n);}
  else if(A.inMode==='fade') a=Math.min(1,el/Math.max(1e-3,T.on));
  if(el>=T.off){
    if(T.mode==='cut') return null;
    const u=(el-T.off)/T.outLen; if(u>=1) return null;
    if(T.mode==='typeoff') s=s.slice(0,Math.floor(s.length*(1-u)+1e-6));
    else a*=1-u;
  }
  return {s,a};
}
/* hold: numbers tick, hashes keep scrambling, letters glitch — same rules as the AE expression */
const GLITCH='#%&*/<>[]=+01';
function liveLines(it,L,el,T,fps){
  const A=it.A||D.fill.anim, rate=Math.max(.1,+A.liveRate||6), k=Math.floor((el-T.on)*rate);
  L=L.slice();
  if(A.liveTick&&it.count&&A.count!==false){const c=it.count, cd=(+A.countDur||36)/fps, kk=Math.max(0,Math.floor((el-Math.max(T.on,cd))*rate));
    let v=c.to; if(kk>0){ if(c.suf==='%'){const r=rng(kk*131+c.to)();v=Math.max(0,Math.min(100,c.to+Math.round((r-.5)*6)));} else if(c.pre==='#'){v=c.to+kk*2;} else {const r=rng(kk*977+Math.round(c.to))();v=c.to*(1+(r-.5)*.04);} }
    L[c.line]=c.pre+fmtNum(v,c.dec)+c.suf;}
  if(A.liveHash&&it.scr){const kk=Math.floor(el*rate);L=L.map((l,i)=>scrambleLine(l,kk*13+i*31));}
  if(A.liveGlitch&&k>=0){const amt=clamp(+A.glitchAmt||15,1,100)/100;L=L.map((l,i)=>{const r=rng(k*7331+i*97+l.length);if(r()>=amt||!l.length)return l;const p=Math.floor(r()*l.length);return l.slice(0,p)+GLITCH[Math.floor(r()*GLITCH.length)]+l.slice(p+1);});}
  return L;
}
/* opacity factor for shapes (dots, rings, logo) */
function fillShapeAlpha(it,tf,fps){
  const A=it.A||D.fill.anim, el=(tf-it.t0)/fps; if(el<0) return 0;
  const T=fillTiming(it,0,fps); let a=A.inMode==='fade'?Math.min(1,el/Math.max(1e-3,T.on)):1;
  if(el>=T.off){if(T.mode==='cut')return 0;const u=(el-T.off)/T.outLen;if(u>=1)return 0;a*=1-u;}
  return a;
}
/* AE Source Text expression (ES3-safe; works in both expression engines) */
function fillExpr(it,fps){
  const F=D.fill, A=it.A||F.anim, js=v=>JSON.stringify(v), t0=r3(it.t0/fps), T=fillTiming(it,it.lines.join('\r').length,fps);
  let e='var gbL='+js(it.lines)+';\nvar gbE=time-'+t0+';\nvar gbO="";\nif(gbE>=0){\n';
  if(it.count&&A.count){const c=it.count;
    e+='var gbU=Math.min(1,gbE/'+r3(Math.max(.05,(+A.countDur||36)/fps))+');gbU=gbU*gbU*(3-2*gbU);var gbV=('+c.from+')+('+(c.to-c.from)+')*gbU;\n'+
       'var gbP=Math.abs(gbV).toFixed('+c.dec+').split(".");var gbA=gbP[0],gbQ="";while(gbA.length>3){gbQ=","+gbA.substr(gbA.length-3)+gbQ;gbA=gbA.substr(0,gbA.length-3);}gbP[0]=gbA+gbQ;\n'+
       'gbL['+c.line+']='+js(c.pre)+'+(gbV<0?"-":"")+gbP.join(".")+'+js(c.suf)+';\n';}
  if(it.scr&&A.scramble){
    e+='if('+(A.scrMode==='always'?'true':'gbE<'+r3((+A.scrDur||30)/fps))+'){seedRandom(Math.floor(time*'+(+A.scrRate||12)+'),true);var gbH="0123456789ABCDEF";\n'+
       'for(var gbI=0;gbI<gbL.length;gbI++){var gbS=gbL[gbI],gbR="";for(var gbJ=0;gbJ<gbS.length;gbJ++){var gbC=gbS.charAt(gbJ);gbR+=/[0-9A-Fa-f]/.test(gbC)?gbH.charAt(Math.floor(random(16))):gbC;}gbL[gbI]=gbR;}}\n';}
  if(it.ell&&A.ellipsis) e+='var gbD=Math.floor(gbE*4)%4;for(var gbK=0;gbK<gbD;gbK++)gbL[gbL.length-1]+=".";\n';
  if(A.live&&(A.liveTick&&it.count&&A.count!==false||A.liveHash&&it.scr||A.liveGlitch)){
    const rate=Math.max(.1,+A.liveRate||6);
    e+='if(gbE>='+r3(T.on)+(isFinite(T.off)?'&&gbE<'+r3(T.off):'')+'){var gbR8='+rate+',gbKk=Math.floor((gbE-'+r3(T.on)+')*gbR8);\n';
    if(A.liveTick&&it.count&&A.count!==false){const c=it.count, cd=r3(Math.max(T.on,(+A.countDur||36)/fps));
      e+='var gbT=Math.max(0,Math.floor((gbE-'+cd+')*gbR8));if(gbT>0){seedRandom(gbT*131+7,true);var gbV2='+c.to+';'+
        (c.suf==='%'?'gbV2=Math.max(0,Math.min(100,'+c.to+'+Math.round((random()-0.5)*6)));':c.pre==='#'?'gbV2='+c.to+'+gbT*2;':'gbV2='+c.to+'*(1+(random()-0.5)*0.04);')+
        'var gbP2=Math.abs(gbV2).toFixed('+c.dec+').split(".");var gbA2=gbP2[0],gbQ2="";while(gbA2.length>3){gbQ2=","+gbA2.substr(gbA2.length-3)+gbQ2;gbA2=gbA2.substr(0,gbA2.length-3);}gbP2[0]=gbA2+gbQ2;gbL['+c.line+']='+js(c.pre)+'+gbP2.join(".")+'+js(c.suf)+';}\n';}
    if(A.liveHash&&it.scr) e+='seedRandom(Math.floor(gbE*gbR8)*13+3,true);var gbH2="0123456789ABCDEF";for(var gbI2=0;gbI2<gbL.length;gbI2++){var gbS2=gbL[gbI2],gbX="";for(var gbJ2=0;gbJ2<gbS2.length;gbJ2++){var gbC2=gbS2.charAt(gbJ2);gbX+=/[0-9A-Fa-f]/.test(gbC2)?gbH2.charAt(Math.floor(random(16))):gbC2;}gbL[gbI2]=gbX;}\n';
    if(A.liveGlitch) e+='var gbG="'+GLITCH+'";for(var gbI3=0;gbI3<gbL.length;gbI3++){seedRandom(gbKk*7331+gbI3*97+11,true);if(random()<'+r3(clamp(+A.glitchAmt||15,1,100)/100)+'&&gbL[gbI3].length){var gbPp=Math.floor(random(gbL[gbI3].length));gbL[gbI3]=gbL[gbI3].substr(0,gbPp)+gbG.charAt(Math.floor(random(gbG.length)))+gbL[gbI3].substr(gbPp+1);}}\n';
    e+='}\n';
  }
  e+='gbO=gbL.join("\\r");\n';
  if(T.typed) e+='var gbN=Math.floor(gbE*'+(+A.cps||40)+'+0.000001);if(gbN<gbO.length)gbO=gbO.substr(0,gbN);\n';
  if(T.mode==='cut'&&isFinite(T.off)) e+='if(gbE>='+r3(T.off)+')gbO="";\n';
  if(T.mode==='typeoff'&&isFinite(T.off)) e+='if(gbE>='+r3(T.off)+'){var gbW=Math.max(0,1-(gbE-'+r3(T.off)+')/'+r3(T.outLen)+');gbO=gbO.substr(0,Math.floor(gbO.length*gbW+0.000001));}\n';
  e+='}\ngbO;';
  return e;
}
/* AE Opacity expression for fades in / out (text and shapes); null if not needed */
function fillOpacityExpr(it,fps,isText){
  const A=it.A||D.fill.anim, T=fillTiming(it,isText?it.lines.join('\r').length:0,fps), t0=r3(it.t0/fps);
  const fadeIn=A.inMode==='fade', fadeOut=isFinite(T.off)&&(T.mode==='fade'||(!isText&&T.mode==='typeoff')), cutOut=!isText&&isFinite(T.off)&&T.mode==='cut';
  if(!fadeIn&&!fadeOut&&!cutOut) return null;
  let e='var gbE=time-'+t0+';var gbA=gbE<0?0:1;\n';
  if(fadeIn) e+='if(gbE>=0)gbA=Math.min(1,gbE/'+r3(Math.max(1e-3,T.on))+');\n';
  if(fadeOut) e+='if(gbE>='+r3(T.off)+')gbA*=Math.max(0,1-(gbE-'+r3(T.off)+')/'+r3(T.outLen)+');\n';
  if(cutOut) e+='if(gbE>='+r3(T.off)+')gbA=0;\n';
  return e+'value*gbA;';
}
/* assign start frames: block reveal end + stagger per slot */
function timeFill(items,base,fps){
  const st=Math.max(0,+D.fill.anim.stagger||0);
  items.forEach(it=>{it.t0=Math.round(base+(it.slot||0)*st);});
  return items;
}

/* ------------------------------------------------------------------ path helpers */
const getP=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],D);
const setP=(p,v)=>{const k=p.split('.'),l=k.pop();k.reduce((o,x)=>o[x],D)[l]=v;};
function merge(def,src){
  if(!src||typeof src!=='object') return def;
  Object.keys(def).forEach(k=>{
    if(!(k in src)) return;
    const dv=def[k];
    if(dv&&typeof dv==='object'&&!Array.isArray(dv)) def[k]=merge(dv,src[k]);
    else if(typeof dv===typeof src[k]||dv===null||src[k]===null) def[k]=src[k];
    else if(Array.isArray(dv)&&Array.isArray(src[k])) def[k]=src[k];
  });
  return def;
}

/* ------------------------------------------------------------------ grid geometry */
function geom(){
  const W=Math.max(16,+D.comp.w||1920),H=Math.max(16,+D.comp.h||1080),g=D.grid;
  const R=Math.max(1,Math.round(g.rows)||1), gut=Math.max(0,+g.gutter||0), m=Math.max(0,+g.margin||0);
  let s=(H-2*m-(R-1)*gut)/R;
  if(g.snap) s=Math.floor(s);
  s=Math.max(1,s);
  const p=s+gut, gridH=R*s+(R-1)*gut;
  let y0=(H-gridH)/2; if(g.snap) y0=Math.floor(y0);
  let C;
  if(g.colsMode==='bleed'){C=2*Math.ceil((W+gut)/(2*p));while(C*p-gut<W)C+=2;}
  else if(g.colsMode==='fit'){C=Math.max(1,Math.floor((W-2*m+gut)/p));}
  else C=Math.max(1,Math.round(g.cols)||1);
  const gridW=C*s+(C-1)*gut;
  let x0=(W-gridW)/2+(+g.offsetX||0); if(g.snap) x0=Math.round(x0);
  let firstFull=0,lastFull=C-1;
  while(firstFull<C-1&&x0+firstFull*p<-0.01) firstFull++;
  while(lastFull>0&&x0+lastFull*p+s>W+0.01) lastFull--;
  // the grid is effectively infinite: blocks can sit anywhere off frame (only what's on screen gets drawn)
  const INF=20000;
  return {W,H,R,C,s,p,gut,m,x0,y0,gridW,gridH,firstFull,lastFull,cLo:-INF,cHi:C-1+INF,rLo:-INF,rHi:R-1+INF};
}
const cellRect=(G,c,r,w,h)=>({x:G.x0+c*G.p,y:G.y0+r*G.p,w:(w||1)*G.p-G.gut,h:(h||1)*G.p-G.gut});
const inRange=(G,c,r)=>c>=G.cLo&&c<=G.cHi&&r>=G.rLo&&r<=G.rHi;
const valid=(b,G)=>b.w>=1&&b.h>=1&&b.c>=G.cLo&&b.r>=G.rLo&&b.c+b.w-1<=G.cHi&&b.r+b.h-1<=G.rHi;
const hits=(a,b)=>a.c<b.c+b.w&&b.c<a.c+a.w&&a.r<b.r+b.h&&b.r<a.r+a.h;
const blockAt=(c,r)=>{for(let i=D.blocks.length-1;i>=0;i--){const b=D.blocks[i];if(c>=b.c&&c<b.c+b.w&&r>=b.r&&r<b.r+b.h)return b;}return null;};
const byId=id=>D.blocks.find(b=>b.id===id)||null;
const selBlocks=()=>U.selIds.map(byId).filter(Boolean);
/* the selection as real blocks: generated (virtual) blocks get baked first so they can hold text and styles */
function ensureReal(){
  let sel=selBlocks(); if(sel.length) return sel;
  const ids=tlSelIds(); if(!ids.length||!isGenerated()) return [];
  const map=materialize(); if(!map) return [];
  const nid=ids.map(id=>map[id]!=null?map[id]:id); U.selIds=nid; U.dopeSel=nid.slice();
  return selBlocks();
}
const normSel=()=>{const s=U.sel;return{c:Math.min(s.c0,s.c1),r:Math.min(s.r0,s.r1),w:Math.abs(s.c1-s.c0)+1,h:Math.abs(s.r1-s.r0)+1};};
const colLabel=c=>'C'+(c+1);
const rowLabel=r=>'R'+(r+1);

/* lines inside gutters for a cell range (rows: horizontal lines only between rows r0..r1) */
function linesFor(G,c0,c1,r0,r1,lwOverride){
  const lw=Math.max(0,lwOverride!=null?lwOverride:(+D.look.lineW||0)); if(!lw||!D.look.linesOn) return [];
  const out=[], bd=D.look.border;
  const top=G.y0+r0*G.p-(bd?G.gut/2+lw/2:0), bot=G.y0+(r1+1)*G.p-G.gut+(bd?G.gut/2+lw/2:0);
  const left=G.x0+c0*G.p-(bd?G.gut/2+lw/2:0), right=G.x0+(c1+1)*G.p-G.gut+(bd?G.gut/2+lw/2:0);
  for(let c=c0-(bd?1:0);c<=c1-(bd?0:1);c++){const x=G.x0+(c+1)*G.p-G.gut/2;out.push([x-lw/2,top,lw,bot-top]);}
  for(let r=r0-(bd?1:0);r<=r1-(bd?0:1);r++){const y=G.y0+(r+1)*G.p-G.gut/2;out.push([left,y-lw/2,right-left,lw]);}
  return out;
}

/* vertical rules at column breaks: every N columns starting at a column (1-based) */
function rulesFor(G,c0,c1,r0,r1,lwOverride){
  const L=D.look; if(!L.rulesOn) return [];
  const lw=Math.max(0.1,lwOverride!=null?lwOverride:(+L.ruleW||1)), N=Math.max(1,Math.round(L.ruleEvery)||1), S=Math.round(L.ruleStart||1)-1;
  const top=G.y0+r0*G.p-G.gut/2, bot=G.y0+(r1+1)*G.p-G.gut/2, out=[];
  for(let c=c0;c<=c1+1;c++){ if((((c-S)%N)+N)%N) continue; const x=G.x0+c*G.p-G.gut/2; out.push([x-lw/2,top,lw,bot-top]); }
  return out;
}

/* ------------------------------------------------------------------ blocks */
const TEXT_KEYS=['family','style','font','tracking','leading','kern','caps'];
function newBlock(c,r,w,h,color){
  const b={id:uid++,c,r,w,h,color,name:'',text:'',fontSize:D.text.size,textColor:contrast(color),align:D.text.align,pad:D.text.pad,echo:false,mo:0,order:0};
  TEXT_KEYS.forEach(k=>b[k]=D.text[k]);
  return b;
}
function normBlock(b){
  const n=Object.assign(newBlock(0,0,1,1,b.color||D.block.color),b);
  n.id=b.id||uid++;
  return n;
}
const bname=b=>b.name||('Block '+String(b.order).padStart(2,'0'));
/* ---- block numbers (top-right corner) ---- */
const numOn=b=>!!(D.num&&!b.echo&&(b.num===true||(b.num!==false&&D.num.on)));
function numStr(n){
  const N=D.num||{}, v=Math.max(0,Math.round((+N.start||1)-1+n)), p=k=>String(v).padStart(k,'0');
  switch(N.fmt){case '1':return String(v);case '001':return p(3);case '#01':return '#'+p(2);case 'BLK 001':return 'BLK '+p(3);case 'height':return '#'+v.toLocaleString('en-US');default:return p(2);}
}
/* where the number sits: right-aligned at the block's top-right, inside the content padding */
function numLayout(rect,str){
  const N=D.num, size=Math.max(4,+N.size||12), pad=Math.max(8,Math.min(28,Math.min(rect.w,rect.h)*.08)), cw=size*(fillMetrics().cw/Math.max(1,fillMetrics().size));
  return {x:rect.x+rect.w-pad,y:rect.y+pad,size,w:str.length*cw,h:size*1.15,pad};
}
/* number for each block: its place in the reveal sequence (animated) or in the layout order (static) */
function blockNumbers(G){
  const m={};
  if(D.anim.mode!=='static'){const P=plan(G);let n=0;P.seq.forEach(b=>{if(!b.echo)m[b.id]=++n;});(P.statics||[]).forEach(b=>{if(m[b.id]==null)m[b.id]=++n;});}
  else{let n=0;ordered(G).forEach(b=>{m[b.id]=++n;});}
  return m;
}
function hash(n,seed){let x=(n*2654435761+seed*97531)>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;x^=x>>>13;return x;}
function sortedForOrder(list){
  const a=list.slice(), o=D.anim.order;
  const ltr=(x,y)=>x.c-y.c||x.r-y.r;
  if(o==='rtl') a.sort((x,y)=>(y.c+y.w)-(x.c+x.w)||x.r-y.r);
  else if(o==='ttb') a.sort((x,y)=>x.r-y.r||x.c-y.c);
  else if(o==='random') a.sort((x,y)=>hash(x.id,D.anim.orderSeed)-hash(y.id,D.anim.orderSeed));
  else if(o==='manual') a.sort((x,y)=>((x.mo||1e9)-(y.mo||1e9))||ltr(x,y));
  else a.sort(ltr);
  return a;
}
function reorder(){sortedForOrder(D.blocks).forEach((b,i)=>b.order=i+1);}
function ordered(G){return D.blocks.filter(b=>valid(b,G)).sort((a,b)=>a.order-b.order);}

/* subtract rect s from block b → remaining rectangles */
function subtract(b,s){
  if(!hits(b,s)) return [b];
  const out=[], bR=b.r+b.h, bC=b.c+b.w, sR=s.r+s.h, sC=s.c+s.w;
  const piece=(c,r,w,h)=>{if(w>0&&h>0){const n=Object.assign({},b,{id:uid++,c,r,w,h,text:'',name:''});out.push(n);}};
  piece(b.c,b.r,b.w,s.r-b.r);
  piece(b.c,sR,b.w,bR-sR);
  const mr=Math.max(b.r,s.r), mh=Math.min(bR,sR)-mr;
  piece(b.c,mr,s.c-b.c,mh);
  piece(sC,mr,bC-sC,mh);
  if(out.length&&b.text){out[0].text=b.text;out[0].name=b.name;}
  return out;
}
function splitBlock(b,how){
  const out=[];
  const mk=(c,r,w,h)=>{const n=Object.assign({},b,{id:uid++,c,r,w,h,text:'',name:''});out.push(n);};
  if(how==='cells'){for(let r=0;r<b.h;r++)for(let c=0;c<b.w;c++)mk(b.c+c,b.r+r,1,1);}
  else if(how==='cols'){for(let c=0;c<b.w;c++)mk(b.c+c,b.r,1,b.h);}
  else if(how==='rows'){for(let r=0;r<b.h;r++)mk(b.c,b.r+r,b.w,1);}
  else if(how==='halfH'){const a=Math.ceil(b.w/2);mk(b.c,b.r,a,b.h);mk(b.c+a,b.r,b.w-a,b.h);}
  else if(how==='halfV'){const a=Math.ceil(b.h/2);mk(b.c,b.r,b.w,a);mk(b.c,b.r+a,b.w,b.h-a);}
  if(out.length&&b.text){out[0].text=b.text;out[0].name=b.name;}
  return out;
}

/* ------------------------------------------------------------------ history */
const H={u:[],r:[]};
const snap=()=>JSON.stringify(D);
function pushHist(keepLive){H.u.push(snap());if(H.u.length>150)H.u.shift();H.r=[];if(!keepLive)U.live=false;updUndo();}
function setDoc(obj){
  U._mediaUI=0;
  if(obj&&obj.anim){ // older layouts
    if(obj.anim.motion==='step'){obj.anim.motion='smooth';obj.anim.camMove='step';}
    if(obj.anim.extendFill){obj.anim.ending='fill';}
    if(obj.anim.camMove==='steady'||obj.anim.camMove==='follow') obj.anim.camMove='curve';   // 'Glide behind' retired: the camera moves with the blocks
    if(obj.anim.ending==='fill'){obj.anim.ending='count';obj.anim.toEnd=true;}
    if(obj.anim.sceneLen==null&&obj.anim.interval!=null){
      const fps=(obj.comp&&obj.comp.fps)||30, n=(obj.blocks?obj.blocks.filter(b=>!b.echo).length:8)+(obj.anim.extendN||0);
      obj.anim.total=n; obj.anim.lenF=Math.max(2,Math.round(n*obj.anim.interval)); obj.anim.startF=Math.round(obj.anim.start||0);
    }
    if(obj.anim.lenF==null&&obj.anim.sceneLen!=null){
      const fps=(obj.comp&&obj.comp.fps)||30;
      obj.anim.lenF=Math.max(2,Math.round(obj.anim.sceneLen*fps)); obj.anim.startF=Math.round((obj.anim.sceneStart||0)*fps);
    }
    if(obj.anim.ramp&&obj.anim.ramp!=='none'&&!obj.anim.sceneCurve) obj.anim.sceneCurve={up:[0.6,0,1,1],down:[0,0,0.4,1],mid:[0.6,0,0.4,1]}[obj.anim.ramp]||[0,0,1,1];
  }
  if(obj&&obj.rand&&obj.rand.echo&&!obj.echo){
    obj.echo=Object.assign(clone(DEF.echo),{on:true,dx:obj.rand.echoDX||0,dy:obj.rand.echoDY||2,last:obj.rand.echoLast||0,color:(obj.block&&obj.block.color2)||'#EBF0FA'});
    if(Array.isArray(obj.blocks)) obj.blocks=obj.blocks.filter(b=>!b.echo);
  }
  if(obj&&obj.anim&&obj.anim.endAt&&obj.anim.endRow==null) obj.anim.endRow=(obj.anim.endAt.r|0)+1;
  if(obj&&obj.fill&&obj.fill.anim&&obj.fill.anim.inMode==null&&obj.fill.anim.type!=null) obj.fill.anim.inMode=obj.fill.anim.type?'type':'cut';
  if(obj&&obj.fill&&obj.fill.anim&&obj.fill.anim.scrMode==='always'){obj.fill.anim.scrMode='settle';obj.fill.anim.live=true;obj.fill.anim.liveHash=true;}
  const toFono=o=>{if(o&&(!o.family||/^arial/i.test(o.family))){o.family='Aeonik Fono';o.style='Regular';o.font='AeonikFono-Regular';}};
  if(obj&&obj.text) toFono(obj.text);
  if(obj&&Array.isArray(obj.blocks)) obj.blocks.forEach(toFono);
  if(obj&&obj.fill&&obj.fill.font==='CourierNewPSMT'){obj.fill.family='Aeonik Fono';obj.fill.style='Regular';obj.fill.font='AeonikFono-Regular';}
  D=merge(clone(DEF),obj);
  if(obj&&(obj.v|0)<5&&D.rand&&+D.rand.stackGap===1) D.rand.stackGap=0;   // older layouts: pair gap follows the block height
  D.v=DEF.v;
  D.blockColors=obj&&obj.blockColors&&typeof obj.blockColors==='object'?Object.assign({},obj.blockColors):{};
  if(obj&&obj.anim) ['dt','dx'].forEach(k=>{const m=obj.anim[k];D.anim[k]=m&&typeof m==='object'&&!Array.isArray(m)?Object.assign({},m):{};});
  if(!Array.isArray(D.palette)||!D.palette.length) D.palette=PALETTE.slice();
  D.blocks=(Array.isArray(obj.blocks)?obj.blocks:[]).map(normBlock);
  uid=D.blocks.reduce((m,b)=>Math.max(m,b.id),0)+1;
  U.sel=null;U.selIds=U.selIds.filter(id=>byId(id));
  U.moNext=D.blocks.reduce((m,b)=>Math.max(m,b.mo||0),0)+1;
}
function undo(){U._mediaUI=0;if(!H.u.length)return;H.r.push(snap());setDoc(JSON.parse(H.u.pop()));U.live=false;afterDocChange();}
function redo(){if(!H.r.length)return;H.u.push(snap());setDoc(JSON.parse(H.r.pop()));U.live=false;afterDocChange();}
function updUndo(){$('#btnUndo').disabled=!H.u.length;$('#btnRedo').disabled=!H.r.length;}
function afterDocChange(){syncInputs(true);syncPalettes();refresh();updUndo();}

/* ------------------------------------------------------------------ edit actions */
function select(ids){U.selIds=ids;U.dopeSel=ids.slice();U.sel=null;if(ids.length)U.ctx=null;}
function addBlocks(list){list.forEach(b=>D.blocks.push(b));}
function mergeRect(s){
  pushHist();
  D.blocks=D.blocks.filter(b=>!hits(b,s));
  const nb=newBlock(s.c,s.r,s.w,s.h,D.block.color);
  D.blocks.push(nb); select([nb.id]); refresh();
}
function eraseRect(s){
  const touched=D.blocks.filter(b=>hits(b,s));
  if(!touched.length){U.sel=null;refresh();return toast('No blocks there to unmerge');}
  pushHist();
  let next=[];
  D.blocks.forEach(b=>{next=next.concat(subtract(b,s));});
  D.blocks=next; U.sel=null; U.selIds=[]; refresh();
  toast(`Unmerged ${s.w*s.h} square${s.w*s.h>1?'s':''}`,'',true);
}
function mergeSel(){if(!U.sel)return toast('Drag over squares first to select them');mergeRect(normSel());}
function deleteSelected(){
  if(U.sel){ U.sel=null; refresh(); return; }
  const ids=U.selIds; if(!ids.length) return;
  pushHist(); D.blocks=D.blocks.filter(b=>ids.indexOf(b.id)<0); U.selIds=[]; refresh();
  toast(`Deleted ${ids.length} block${ids.length>1?'s':''}`,'',true);
}
function splitSelected(how){
  const sel=selBlocks(); if(!sel.length) return;
  pushHist();
  let made=[];
  sel.forEach(b=>{const parts=splitBlock(b,how);if(parts.length>1){D.blocks=D.blocks.filter(x=>x!==b);made=made.concat(parts);}else made.push(b);});
  D.blocks=D.blocks.concat(made.filter(b=>D.blocks.indexOf(b)<0));
  select(made.map(b=>b.id)); refresh();
}
function duplicate(){
  const sel=selBlocks(); if(!sel.length) return; const G=geom();
  const minC=Math.min.apply(null,sel.map(b=>b.c)), maxC=Math.max.apply(null,sel.map(b=>b.c+b.w));
  const dc=maxC-minC;
  const copies=sel.map(b=>Object.assign({},b,{id:uid++,c:b.c+dc,name:'',mo:0}));
  if(copies.some(b=>!valid(b,G))) return toast('No room to the right — add off-screen columns in Grid');
  if(copies.some(b=>D.blocks.some(x=>hits(x,b)))) return toast('The space to the right is taken');
  pushHist(); addBlocks(copies); select(copies.map(b=>b.id)); refresh();
}
function nudge(dc,dr){
  const sel=selBlocks(); if(!sel.length) return; const G=geom();
  const moved=sel.map(b=>({c:b.c+dc,r:b.r+dr,w:b.w,h:b.h}));
  if(moved.some(m=>!valid(m,G))) return;
  if(moved.some(m=>D.blocks.some(x=>sel.indexOf(x)<0&&hits(x,m)))) return;
  pushHist(); sel.forEach((b,i)=>{b.c=moved[i].c;b.r=moved[i].r;}); refresh();
}
/* where a stamp at this cell lands: the block covers the clicked square, sliding left/up if it would
   overlap a neighbour or run off the grid. null if nothing covering the square fits. */
function stampSpot(cell,G){
  G=G||geom(); const w=Math.max(1,D.block.w|0), h=Math.max(1,D.block.h|0);
  if(blockAt(cell.c,cell.r)) return null;
  let best=null;
  for(let dr=0;dr<h;dr++)for(let dc=0;dc<w;dc++){
    const b={c:cell.c-dc,r:cell.r-dr,w,h};
    if(!valid(b,G)||D.blocks.some(x=>hits(x,b))) continue;
    const cost=dc+dr*w*0.9; if(!best||cost<best.cost) best={c:b.c,r:b.r,w,h,cost};
  }
  return best;
}
function tryStamp(cell){
  const b=stampSpot(cell); if(!b) return false;
  const nb=newBlock(b.c,b.r,b.w,b.h,D.block.color); D.blocks.push(nb);
  return true;
}
function resizeAllQuiet(){
  const G=geom(), w=D.block.w|0, h=D.block.h|0; let n=0, skip=0;
  ordered(G).forEach(b=>{
    if(b.w===w&&b.h===h) return;
    const t={c:b.c,r:b.r,w,h};
    if(valid(t,G)&&!D.blocks.some(x=>x!==b&&hits(x,t))){b.w=w;b.h=h;n++;}else skip++;
  });
  return {n,skip};
}
function resizeAll(){
  const G=geom(), w=D.block.w|0, h=D.block.h|0; let n=0, skip=0;
  pushHist();
  ordered(G).forEach(b=>{
    const t={c:b.c,r:b.r,w,h};
    if(valid(t,G)&&!D.blocks.some(x=>x!==b&&hits(x,t))){b.w=w;b.h=h;n++;}else skip++;
  });
  refresh(); toast(`Resized ${n} block${n===1?'':'s'}${skip?` · ${skip} skipped (no room)`:''}`,'',true);
}

/* ------------------------------------------------------------------ randomizer */
function generate(fromLive){
  const G=geom(), R=D.rand, rnd=rng(R.seed);
  const ri=(a,b)=>b<=a?a:a+Math.floor(rnd()*(b-a+1));
  const bw=clamp(Math.round(D.block.w)||1,1,G.C), bh=clamp(Math.round(D.block.h)||1,1,G.R);
  const cMin=R.bleed?0:G.firstFull;
  const cMax=Math.max(cMin,(R.bleed?G.C-1:G.lastFull)-bw+1);
  const rMax=G.R-bh;
  const fixedRow=R.startRow>0?clamp(R.startRow-1,0,rMax):-1;
  const list=[];
  const put=(c,r,color,echo,stack)=>{const b=newBlock(c,r,bw,bh,color);b.echo=!!echo;b.stack=!!stack;list.push(b);};
  let mi=0; const mc=()=>mixColor(mi++,rnd);

  if(R.pattern==='walk'){
    const step=bw+Math.max(0,Math.round(R.gap)||0), walker=makeWalker(rnd,rMax,bh);
    const n=R.count>0?R.count:Math.floor((cMax-cMin)/step)+1;
    let c=cMin, r=fixedRow>=0?fixedRow:ri(0,rMax);
    for(let i=0;i<n&&c+bw-1<=G.cHi;i++){
      put(c,r,mc());
      const sr=stackRow(r,bh,rMax,rnd); if(sr!==null) put(c,sr,mc(),false,true);
      const w=walker(r); c+=step+w.extra; r=w.r;
    }
  } else if(R.pattern==='stairUp'||R.pattern==='stairDown'){
    const sx=bw+Math.max(0,Math.round(R.gap)||0), sy=Math.max(0,Math.round(R.rise)||0), dir=R.pattern==='stairUp'?-1:1;
    let n=R.count>0?R.count:Math.floor((cMax-cMin)/sx)+1;
    if(sy>0&&!(R.count>0)) n=Math.min(n,Math.floor(rMax/sy)+1);
    n=Math.max(1,n);
    const span=(n-1)*sx, vspan=Math.min((n-1)*sy,rMax);
    const c0=cMax-span>=cMin?ri(cMin,cMax-span):cMin;
    const r0=fixedRow>=0?fixedRow:(dir<0?ri(vspan,rMax):ri(0,Math.max(0,rMax-vspan)));
    for(let i=0;i<n;i++){
      const c=c0+i*sx; let r=r0+dir*i*sy;
      if(c+bw-1>G.cHi) break;
      if(r<0||r>rMax){ if(R.count>0){ r=((r%(rMax+1))+(rMax+1))%(rMax+1); } else break; }
      put(c,r,mc());
    }
  } else {
    const gMin=Math.max(0,Math.round(R.gapMin)||0), gMax=Math.max(gMin,Math.round(R.gapMax)||0);
    const n=R.count>0?R.count:999;
    const rowFixed=R.pattern==='row'?(fixedRow>=0?fixedRow:ri(0,rMax)):fixedRow;
    let c=cMin+ri(0,gMax), prev=-1;
    while(list.length<n&&(c<=cMax||(R.count>0&&c+bw-1<=G.cHi))){
      let r=rowFixed;
      if(r<0){let t=0;do{r=ri(0,rMax);}while(rMax>0&&r===prev&&t++<12);}
      put(c,r,mc()); prev=r;
      c+=bw+ri(gMin,gMax);
    }
  }
  { const pr=pruneStacks(list,[]); list.length=0; pr.forEach(b=>list.push(b)); }
  if(!fromLive){pushHist();U.genBase=clone(D.blocks);}
  const next=R.mode==='add'?clone(U.genBase||[]):[];
  list.forEach(b=>{if(!next.some(x=>hits(x,b)))next.push(b);});
  D.blocks=next; U.sel=null; U.selIds=[]; U.live=true;
  refresh();
  $('#seedNote').innerHTML=`Seed <b>${R.seed}</b> · ${list.length} block${list.length===1?'':'s'}. Change any setting above and the layout updates straight away.`;
}
function shuffle(){D.rand.seed=Math.floor(Math.random()*99999)+1;generate(false);}
/* colour for the i-th block under the colour-mix rule */
function modeColors(){const B=D.block,n=B.mix==='alternate'?2:clamp(Math.round(+B.ncol||2),2,4);return [B.color,B.color2,B.color3||B.color,B.color4||B.color2].slice(0,n);}
function mixColor(i,rnd){const B=D.block;if(B.mix==='alternate'||B.mix==='cycle'){const cs=modeColors();return cs[i%cs.length];}if(B.mix==='random'){const cs=modeColors();return cs[Math.floor(rnd()*cs.length)%cs.length];}return B.color;}
/* colour modes applied to the whole line (after its rows are final): one colour · up/down by step direction · cycle · random.
   Colours picked for single blocks (blockColors) always win. Real blocks get copies so the doc isn't touched. */
function applyColourMode(seq){
  const B=D.block, BC=D.blockColors||{}, mode=B.mix==='alternate'?'cycle':B.mix, cs=modeColors(), rnd=rng(((D.rand.seed|0)+(D.anim.seed|0)*7919)*13+5);
  let prev=null, k=0; const mainCol={};
  return seq.map(b=>{
    let col;
    if(b.stack&&mainCol[b.c]) col=mainCol[b.c];
    else if(mode==='updown'){ col=!prev?B.color:b.r<prev.r?(B.upColor||B.color):b.r>prev.r?(B.downColor||B.color):B.color; }
    else if(mode==='cycle') col=cs[k%cs.length];
    else if(mode==='random') col=cs[Math.floor(rnd()*cs.length)%cs.length];
    else col=B.color;
    if(!b.stack){prev=b;k++;mainCol[b.c]=col;}
    if(BC[b.id]) col=BC[b.id];
    if(String(b.color).toUpperCase()===String(col).toUpperCase()) return b;
    if(b.virtual){ b.color=col; b.textColor=contrast(col); return b; }
    return Object.assign({},b,{color:col,textColor:contrast(col)});
  });
}
/* walk: next row is the same, or up/down by up to "wander" rows (biased by "climb") */
/* walk: the next block is beside the last (same row) or steps a whole block height up/down, so it always
   touches at a side or a corner — never half-overlapping. Tall blocks (3×2, 3×3…) step by their height. */
/* rows a walking block may use. Normally it stays inside the frame. If the block is too tall to step a whole
   block up or down inside the frame (e.g. 3×5 in 7 rows), it may run partly off the top/bottom (cropped by the
   frame) — at least half the frame's rows stay covered — so the line can still climb and fall. */
function walkBounds(G,h){ h=Math.max(1,h|0); if(G.R-h>=h) return {lo:0,hi:Math.max(0,G.R-h),ext:false}; const mv=Math.max(1,Math.floor(G.R/2)); return {lo:mv-h,hi:G.R-mv,ext:true}; }
function walkRow(r,rMax,rnd,h,rMin){
  rMin=rMin||0; const R=D.rand, w=clamp(Math.round(R.wander)||0,0,4); h=Math.max(1,h||D.block.h||1); if(!w||rMax<=rMin) return r;
  const b=clamp((+R.climb||0)/100,-1,1), pU=(1+b)/3, pD=(1-b)/3, u=rnd();
  let dir=u<pU?-1:u<pU+pD?1:0; if(!dir) return r;
  const mag=h===1?1+Math.floor(rnd()*w):1;   // 1-row blocks may wander up to `w` rows; taller blocks step exactly one block height
  let n=r+dir*mag*h; if(n<rMin||n>rMax) n=r-dir*mag*h;
  return n<rMin||n>rMax?r:n;
}
/* sometimes add a second block in the same column, "stackGap" rows away */
function stackRow(r,bh,rMax,rnd,rMin){ rMin=rMin||0;
  const R=D.rand, g=Math.round(+R.stackGap||0)>0?Math.round(R.stackGap):Math.max(1,bh|0);   // pair gap: 0/empty = the block's own height
  if(R.multiCol===false||!(R.stackPct>0)||rnd()>=R.stackPct/100) return null;
  const opts=[r-(bh+g),r+(bh+g)].filter(x=>x>=rMin&&x<=rMax);
  return opts.length?opts[Math.floor(rnd()*opts.length)]:null;
}
/* recolour existing blocks with the current mix rule */
function recolourByRule(){
  pushHist(); const rnd=rng(D.rand.seed+31); let i=0;
  ordered(geom()).forEach(b=>{if(b.echo)return;const c=mixColor(i++,rnd);const auto=b.textColor===contrast(b.color);b.color=c;if(auto)b.textColor=contrast(c);});
  refresh(); toast('Recoloured blocks','',true);
}

/* ------------------------------------------------------------------ animation plan (shared by preview + AE build) */

function ev(list,t,def){
  if(!list||!list.length) return def;
  if(t<=list[0][0]) return list[0][1];
  let k=list.length-1; while(k>0&&list[k][0]>t) k--;
  if(k===list.length-1) return list[k][1];
  const a=list[k], b=list[k+1];
  if(a[2]==='h') return a[1];
  let u=(t-a[0])/Math.max(1e-6,b[0]-a[0]);
  if(a[2]==='e') u=curveFn(a[3])(u);
  if(Array.isArray(a[1])) return a[1].map((v,i)=>v+(b[1][i]-v)*u);
  return a[1]+(b[1]-a[1])*u;
}
/* speed ramp: relative speed at progress u (0..1) */
function speedAt(u){
  const A=D.anim, R=Math.max(1,+A.rampAmt||1);
  if(A.ramp==='up') return 1+(R-1)*u;
  if(A.ramp==='down') return R+(1-R)*u;
  if(A.ramp==='mid') return 1+(R-1)*Math.sin(Math.PI*u);
  return 1;
}
/* "Keep building": virtual blocks that continue the layout */
/* shared walker: mostly a walk (next to the last block, same row or ±wander),
   mixed with short stair runs and occasional jumps */
function makeWalker(rnd,rMax,h,rMin){ rMin=rMin||0;
  const R=D.rand; let run=0, runDir=-1; h=Math.max(1,h||D.block.h||1);
  return r=>{
    let extra=0;
    if(run>0){run--; const n=r+runDir*h; if(n<rMin||n>rMax){run=0;return {r,extra};} r=n; if(r-h<rMin||r+h>rMax) run=0; return {r,extra};}
    const u=rnd();
    if(u<(R.stairPct||0)/100&&rMax>rMin){
      const b=clamp((+R.climb||0)/100,-1,1); runDir=rnd()<(1+b)/2?-1:1;
      if(r+runDir*h<rMin||r+runDir*h>rMax) runDir=-runDir;
      run=1+Math.floor(rnd()*3); const n=r+runDir*h; if(n>=rMin&&n<=rMax) r=n; return {r,extra};
    }
    if(u<((R.stairPct||0)+(R.jumpPct||0))/100&&rMax>rMin){
      // corner hop: a full block-height step up or down, still touching at the corner
      let j=rnd()<.5?-h:h; if(r+j<rMin||r+j>rMax) j=-j; if(r+j>=rMin&&r+j<=rMax) r+=j; return {r,extra};
    }
    return {r:walkRow(r,rMax,rnd,h,rMin),extra};
  };
}
/* "Keep building": virtual blocks that continue the layout in the order's direction */
/* a second block in the same column (a 'pair') is only kept if it touches — at a side or a corner — the block
   before or after it in the line. Otherwise it would float on its own. */
const touches=(a,b)=>!hits(a,b)&&a.c<=b.c+b.w&&b.c<=a.c+a.w&&a.r<=b.r+b.h&&b.r<=a.r+a.h;
function pruneStacks(out,base){
  const all=base.concat(out), mains=all.filter(b=>!b.stack), drop=new Set();
  all.forEach((s,i)=>{ if(!s.stack) return;
    let k=-1; for(let j=i-1;j>=0;j--){ if(!all[j].stack){ k=mains.indexOf(all[j]); break; } }
    const prev=k>=1?mains[k-1]:null, next=k>=0&&k+1<mains.length?mains[k+1]:null;
    if(!((prev&&touches(s,prev))||(next&&touches(s,next)))) drop.add(s); });
  if(!drop.size) return out;
  const res=out.filter(b=>!drop.has(b)); ['__endCol','__reach','__endRow'].forEach(k=>{if(k in out) res[k]=out[k];}); return res;
}
function extension(G,base,capOverride){ return pruneStacks(extensionRaw(G,base,capOverride),base); }
function extensionRaw(G,base,capOverride){
  const A=D.anim; if(!A.extendOn||!base.length) return [];
  const spot=A.ending==='spot';
  const cap=capOverride!=null?capOverride:Math.max(0,Math.round(A.extendN)||0); if(!cap) return [];
  const rnd=rng((D.rand.seed|0)+977+(A.seed|0)*7919);
  const out=[], all=base.slice(); let vid=-1;
  const mk=(src,c,r,color)=>{const b={id:vid--,c,r,w:src.w,h:src.h,color:color||src.color,text:'',fontSize:src.fontSize,textColor:contrast(color||src.color),align:src.align,pad:src.pad,virtual:true,name:'',mo:0,order:0};TEXT_KEYS.forEach(k=>b[k]=src[k]);return b;};
  const add=n=>{if(all.some(x=>hits(x,n)))return false;out.push(n);all.push(n);return true;};
  const dir=A.order==='rtl'?-1:1;
  // continue from the block furthest along in the build direction
  const main=base.filter(b=>!b.stack).slice().sort((a,b)=>dir*(a.c-b.c)||a.order-b.order);
  const last=main[main.length-1]||base[base.length-1], prev=main[main.length-2];
  const WB=walkBounds(G,last.h), rMax=WB.hi, rMin=WB.lo;
  const mode=spot?'steer':A.extendMode;
  if(mode==='repeat'){
    const m=base.filter(b=>!b.stack).sort((a,b)=>a.c-b.c);
    const minC=Math.min.apply(null,base.map(b=>b.c)), maxC=Math.max.apply(null,base.map(b=>b.c+b.w));
    const gaps=[]; for(let i=1;i<m.length;i++) gaps.push(Math.max(0,m[i].c-(m[i-1].c+m[i-1].w)));
    const gap=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):0;
    const dx=Math.max(1,maxC-minC+gap)*dir;
    const src=base.slice().sort((a,b)=>dir*(a.c-b.c));
    for(let k=1;out.length<cap&&k<400;k++)
      for(let i=0;i<src.length&&out.length<cap;i++){const b=src[i];add(mk(b,b.c+dx*k,b.r,b.color));}
    return out;
  }
  const step=(last.w+Math.max(0,Math.round(D.rand.gap)||0))*dir;
  let dc=prev?last.c-prev.c:step, dr=prev?last.r-prev.r:0; if(!dc&&!dr) dc=step;
  let c=last.c, r=last.r, i=main.length;
  const walker=makeWalker(rnd,rMax,last.h,rMin);
  if(mode==='steer'){
    // exactly `cap` more blocks, evenly stepped (no gaps), steering the rows to land on the chosen end row
    let tr=clamp(Math.round((A.endRow||1)-1),rMin,rMax); const wmax=last.h>1?last.h:Math.max(1,Math.round(D.rand.wander)||1);
    if(last.h>1){ tr=r+Math.round((tr-r)/last.h)*last.h; while(tr>rMax) tr-=last.h; while(tr<rMin) tr+=last.h; }   // tall blocks: the end row sits on the line's own lattice
    out.__endRow=tr; out.__reach=Math.abs(tr-r)<=cap*wmax;
    for(let j=1;j<=cap;j++){
      c+=step; const rem=cap-j;
      const pr=r; let nr;
      if(last.h>1){ const d=tr-r; nr=Math.abs(d)>=rem*last.h+last.h?r+Math.sign(d)*last.h:(j===cap?tr:walkRow(r,rMax,rnd,last.h,rMin)); if(Math.abs(tr-nr)>rem*last.h) nr=r+Math.sign(tr-r)*last.h; }
      else nr=j===cap?(out.__reach?tr:r+Math.sign(tr-r)*wmax):clamp(walkRow(r,rMax,rnd,last.h,rMin),Math.max(rMin,tr-rem*wmax),Math.min(rMax,tr+rem*wmax));
      r=clamp(clamp(nr,pr-wmax,pr+wmax),rMin,rMax);   // never more than one block height from the last one
      const nb=mk(last,c,r,mixColor(i++,rnd));
      if(add(nb)&&j<cap){const sr=stackRow(r,last.h,rMax,rnd,rMin);if(sr!==null){const p2=mk(last,c,sr,mixColor(i++,rnd));p2.stack=true;add(p2);}}
    }
    out.__endCol=c;
    return out;
  }
  for(let n=0;n<cap;n++){
    if(mode==='continue'){c+=dc;r+=dr;if(A.wrap&&A.axis==='x'){if(r<0)r=rMax;else if(r>rMax)r=0;}}
    else {const w=walker(r);c+=step+w.extra*dir;r=w.r;}
    const nb=mk(last,c,r,mixColor(i++,rnd));
    if(add(nb)&&mode!=='continue'){const sr=stackRow(r,last.h,rMax,rnd,rMin);if(sr!==null){const p=mk(last,c,sr,mixColor(i++,rnd));p.stack=true;add(p);}}
  }
  return out;
}
const curveCache={};
const isH=c=>Array.isArray(c)&&c.length>=13&&+c[0]===-2&&(c.length-1)%6===0;
const isPts=c=>Array.isArray(c)&&(isH(c)||(c.length>=6&&!(c.length===4)));
const ptsFlags=c=>(!isH(c)&&c.length%2===1)?(+c[0]|0):0;
function hOf(c){const o=[];for(let i=1;i<c.length;i+=6)o.push({x:+c[i],y:+c[i+1],ix:+c[i+2],iy:+c[i+3],ox:+c[i+4],oy:+c[i+5]});return o.sort((a,b)=>a.x-b.x);}
function hPack(h){return [-2].concat(h.reduce((o,p)=>o.concat([r3(p.x),r3(p.y),r3(p.ix),r3(p.iy),r3(p.ox),r3(p.oy)]),[]));}
/* any curve → points with bezier handles (exactly the same shape for a 2-handle curve) */
function toH(c){
  if(isH(c)) return hOf(c);
  if(!isPts(c)){const x1=+c[0],y1=+c[1],x2=+c[2],y2=+c[3];return [{x:0,y:0,ix:0,iy:0,ox:x1,oy:y1},{x:1,y:1,ix:x2-1,iy:y2-1,ox:0,oy:0}];}
  const p=ptsOf(c), n=p.length, fl=ptsFlags(c), dx=[], m=[], tg=new Array(n).fill(0);
  for(let i=0;i<n-1;i++){dx.push(Math.max(1e-6,p[i+1][0]-p[i][0]));m.push((p[i+1][1]-p[i][1])/dx[i]);}
  tg[0]=(fl&1)?0:m[0]; tg[n-1]=(fl&2)?0:m[n-2];
  for(let i=1;i<n-1;i++) tg[i]=(m[i-1]*m[i]<=0)?0:3*(dx[i-1]+dx[i])/((dx[i-1]+2*dx[i])/m[i-1]+(2*dx[i-1]+dx[i])/m[i]);
  return p.map((q,i)=>{const hp=i>0?dx[i-1]:0,hn=i<n-1?dx[i]:0;return {x:q[0],y:q[1],ix:-hp/3,iy:-tg[i]*hp/3,ox:hn/3,oy:tg[i]*hn/3};});
}
function hFn(c){
  const h=hOf(c), n=h.length;
  return u=>{ if(u<=h[0].x) return h[0].y; if(u>=h[n-1].x) return h[n-1].y;
    let k=0; while(k<n-2&&u>h[k+1].x) k++;
    const A=h[k], B=h[k+1], x0=A.x, x1=A.x+A.ox, x2=B.x+B.ix, x3=B.x, y0=A.y, y1=A.y+A.oy, y2=B.y+B.iy, y3=B.y;
    const bx=s=>{const t=1-s;return t*t*t*x0+3*t*t*s*x1+3*t*s*s*x2+s*s*s*x3;};
    let lo=0,hi=1,s=.5; for(let i=0;i<30;i++){s=(lo+hi)/2; if(bx(s)<u) lo=s; else hi=s;}
    const t=1-s; return t*t*t*y0+3*t*t*s*y1+3*t*s*s*y2+s*s*s*y3; };
}
function ptsOf(c){if(isH(c))return hOf(c).map(p=>[p.x,p.y]);const o=c.length%2===1?1:0,p=[];for(let i=o;i<c.length;i+=2)p.push([+c[i],+c[i+1]]);return p.sort((a,b)=>a[0]-b[0]);}
function ptsPack(p,flags){const flat=p.reduce((o,q)=>o.concat([r3(q[0]),r3(q[1])]),[]);return flags?[flags].concat(flat):flat;}
/* smooth curve through points (monotone cubic — no overshoot between points) */
function ptsFn(c){
  const p=ptsOf(c), n=p.length, dx=[], m=[], tg=new Array(n).fill(0);
  for(let i=0;i<n-1;i++){dx.push(Math.max(1e-6,p[i+1][0]-p[i][0]));m.push((p[i+1][1]-p[i][1])/dx[i]);}
  const fl=ptsFlags(c); tg[0]=(fl&1)?0:m[0]; tg[n-1]=(fl&2)?0:m[n-2];
  for(let i=1;i<n-1;i++) tg[i]=(m[i-1]*m[i]<=0)?0:3*(dx[i-1]+dx[i])/((dx[i-1]+2*dx[i])/m[i-1]+(2*dx[i-1]+dx[i])/m[i]);   // harmonic-mean tangents
  return u=>{ if(u<=p[0][0]) return p[0][1]; if(u>=p[n-1][0]) return p[n-1][1];
    let k=0; while(k<n-2&&u>p[k+1][0]) k++;
    const h=dx[k], s=(u-p[k][0])/h, s2=s*s, s3=s2*s;
    return (2*s3-3*s2+1)*p[k][1]+(s3-2*s2+s)*h*tg[k]+(-2*s3+3*s2)*p[k+1][1]+(s3-s2)*h*tg[k+1]; };
}
function curveFn(c){
  c=c||[0.33,0,0.67,1]; const k=c.join(','); if(curveCache[k]) return curveCache[k];
  if(isH(c)) return curveCache[k]=hFn(c);
  if(isPts(c)) return curveCache[k]=ptsFn(c);
  const x1=c[0],y1=c[1],x2=c[2],y2=c[3];
  const bx=s=>3*(1-s)*(1-s)*s*x1+3*(1-s)*s*s*x2+s*s*s, by=s=>3*(1-s)*(1-s)*s*y1+3*(1-s)*s*s*y2+s*s*s;
  const f=u=>{if(u<=0)return 0;if(u>=1)return 1;let lo=0,hi=1,s=u;for(let i=0;i<24;i++){s=(lo+hi)/2;if(bx(s)<u)lo=s;else hi=s;}return by(s);};
  return curveCache[k]=f;
}
/* turn runs of identical camera targets into one point, so the camera never stalls mid-move */
function collapse(T,offs){
  const pts=[], n=T.length; let i=0;
  while(i<n){
    let j=i; while(j+1<n&&offs[j+1][0]===offs[i][0]&&offs[j+1][1]===offs[i][1]) j++;
    pts.push([i===0?T[j]:j===n-1?T[i]:(T[i]+T[j])/2,offs[i]]); i=j+1;
  }
  return pts;
}
/* Ramer–Douglas–Peucker on [frame,[x,y]] samples */
function simplify(pts,tol){
  if(pts.length<3) return pts;
  const keep=new Uint8Array(pts.length); keep[0]=keep[pts.length-1]=1;
  const st=[[0,pts.length-1]];
  while(st.length){
    const [a,b]=st.pop(); let mx=0,mi=-1;
    for(let i=a+1;i<b;i++){
      const u=(pts[i][0]-pts[a][0])/(pts[b][0]-pts[a][0]);
      const ex=Math.abs(pts[a][1][0]+(pts[b][1][0]-pts[a][1][0])*u-pts[i][1][0]);
      const ey=Math.abs(pts[a][1][1]+(pts[b][1][1]-pts[a][1][1])*u-pts[i][1][1]);
      const e=Math.max(ex,ey); if(e>mx){mx=e;mi=i;}
    }
    if(mx>tol&&mi>0){keep[mi]=1;st.push([a,mi],[mi,b]);}
  }
  return pts.filter((p,i)=>keep[i]);
}
/* continuous camera: piecewise-linear target through each step, then smoothed (box filter ×2) */
function smoothPath(T,offs){
  const n=T.length;
  const avg=n>1?(T[n-1]-T[0])/(n-1):Math.max(4,D.anim.trans|0);
  const win=Math.max(2,Math.round(Math.max(1,avg)*Math.max(.5,+D.anim.smooth||2)));
  const a=Math.max(0,Math.floor(T[0]-win*2)), b=Math.ceil(T[n-1]+win*2), N=b-a+1;
  const xs=new Float64Array(N), ys=new Float64Array(N);
  let k=0;
  for(let i=0;i<N;i++){
    const f=a+i;
    while(k<n-1&&T[k+1]<=f) k++;
    let x,y;
    if(f<=T[0]){x=offs[0][0];y=offs[0][1];}
    else if(k>=n-1){x=offs[n-1][0];y=offs[n-1][1];}
    else{const u=(f-T[k])/Math.max(1e-6,T[k+1]-T[k]);x=offs[k][0]+(offs[k+1][0]-offs[k][0])*u;y=offs[k][1]+(offs[k+1][1]-offs[k][1])*u;}
    xs[i]=x; ys[i]=y;
  }
  const box=(arr,h)=>{const o=new Float64Array(N),pre=new Float64Array(N+1);for(let i=0;i<N;i++)pre[i+1]=pre[i]+arr[i];
    for(let i=0;i<N;i++){const lo=Math.max(0,i-h),hi=Math.min(N-1,i+h);o[i]=(pre[hi+1]-pre[lo])/(hi-lo+1);}return o;};
  const h=Math.max(1,Math.round(win/2));
  const sx=box(box(xs,h),h), sy=box(box(ys,h),h);
  const pts=[]; for(let i=0;i<N;i++) pts.push([a+i,[sx[i],sy[i]]]);
  return simplify(pts,.15).map(p=>[p[0],[r3(p[1][0]),r3(p[1][1])],'l']);
}
/* camera that only ever moves toward blocks already on screen:
   target = latest revealed block (a step), smoothed with a trailing (look-back only) filter */
function followPath(T,offs,fin,fm,CC){
  const n=T.length, A=D.anim;
  const avg=n>1?Math.max(1,(T[n-1]-T[0])/(n-1)):Math.max(4,A.trans|0);
  const h=Math.max(1,Math.round(avg*Math.max(.5,+A.smooth||1.5)/2));
  const a=Math.max(0,Math.floor(T[0])), tf=fin?T[n-1]+fm:T[n-1], b=Math.ceil(tf+2*h+2), N=b-a+1;
  const xs=new Float64Array(N), ys=new Float64Array(N), ef=curveFn(CC);
  let k=0;
  for(let i=0;i<N;i++){
    const f=a+i; while(k<n-1&&T[k+1]<=f) k++;
    let o=f<T[0]?offs[0]:offs[k];
    if(fin&&f>=T[n-1]){const u=ef(clamp((f-T[n-1])/fm,0,1));o=[offs[n-1][0]+(fin[0]-offs[n-1][0])*u,offs[n-1][1]+(fin[1]-offs[n-1][1])*u];}
    xs[i]=o[0]; ys[i]=o[1];
  }
  const trail=arr=>{const o=new Float64Array(N),pre=new Float64Array(N+1);for(let i=0;i<N;i++)pre[i+1]=pre[i]+arr[i];
    for(let i=0;i<N;i++){const lo=Math.max(0,i-h);o[i]=(pre[i+1]-pre[lo])/(i-lo+1);}return o;};
  const sx=trail(trail(xs)), sy=trail(trail(ys));
  const pts=[]; for(let i=0;i<N;i++) pts.push([a+i,[sx[i],sy[i]]]);
  return simplify(pts,.15).map(p=>[p[0],[r3(p[1][0]),r3(p[1][1])],'l']);
}
/* inverse of a time→progress curve (monotone lookup), used by scene easing */
const invCache={};
function invCurve(c){
  c=c||[0,0,1,1]; const key=c.join(','); if(invCache[key]) return invCache[key];
  const f=curveFn(c), N=256, ys=[]; let m=0;
  for(let i=0;i<=N;i++){m=Math.max(m,clamp(f(i/N),0,1));ys.push(m);}
  const top=ys[N]||1;
  return invCache[key]=p=>{
    p=clamp(p,0,1)*top; if(p<=0) return 0;
    let lo=0,hi=N; while(hi-lo>1){const mid=(lo+hi)>>1; if(ys[mid]<p) lo=mid; else hi=mid;}
    const y0=ys[lo],y1=ys[hi]; return (lo+(y1>y0?(p-y0)/(y1-y0):0))/N;
  };
}
/* monotone cubic (Fritsch–Butland): smooth through every point, never overshoots between them.
   flatEnds = zero speed at the first and last point (eases out of the start, into the end) */
function monoSpline(ts,ys,flatEnds){
  const n=ts.length; if(n===1) return ()=>ys[0];
  const d=[], m=new Array(n);
  for(let i=0;i<n-1;i++) d.push((ys[i+1]-ys[i])/Math.max(1e-9,ts[i+1]-ts[i]));
  m[0]=flatEnds?0:d[0]; m[n-1]=flatEnds?0:d[n-2];
  for(let i=1;i<n-1;i++){
    if(d[i-1]*d[i]<=0) m[i]=0;
    else{const h0=ts[i]-ts[i-1],h1=ts[i+1]-ts[i],w1=2*h1+h0,w2=h1+2*h0;m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}
  }
  return t=>{
    if(t<=ts[0]) return ys[0]; if(t>=ts[n-1]) return ys[n-1];
    let lo=0,hi=n-1; while(hi-lo>1){const mid=(lo+hi)>>1; if(ts[mid]<=t) lo=mid; else hi=mid;}
    const h=ts[hi]-ts[lo], u=(t-ts[lo])/h, u2=u*u, u3=u2*u;
    return (2*u3-3*u2+1)*ys[lo]+(u3-2*u2+u)*h*m[lo]+(-2*u3+3*u2)*ys[hi]+(u3-u2)*h*m[hi];
  };
}
let planCache={k:'',v:null};
/* ---- SIMPLE SCENE EASING: the scene curve is built from where On ends / Off starts on the scene,
   and four ease amounts (start, landing into the hold, leaving the hold, end). */
function phaseBounds(Pc){
  const c0=Pc.startF, X2=D.exit; let on=Pc.onEnd!=null?Pc.onEnd:null, hold=null;
  if(X2.on&&X2.mode==='walk'&&Pc.walkT!=null) hold=Pc.walkT;
  else if(X2.on&&Pc.exitT&&Pc.exitT.some(v=>v!=null)){const ex=Pc.exitT.filter(v=>v!=null); hold=Math.min(...ex);}
  return {c0,on,hold};
}
/* the simple scene curve: points (start · hold starts · out starts · end) with ease amounts.
   Returns the packed curve; easeModel() also returns which ease each handle controls (for the timeline). */
function easeModel(yOn,yHold,E){
  const xa=v=>(v==null||v===''||!(+v>0))?null:clamp(+v/100,.04,.96);
  const hasOn=yOn!=null&&yOn>.02&&yOn<.98, hasHold=hasOn&&yHold!=null&&yHold>yOn+.01&&yHold<.995;
  const pts=[{x:0,y:0,eo:E.start,ko:'start',role:'start'}];
  if(hasHold){ let xOn=xa(E.onAt)!=null?xa(E.onAt):yOn, xH=xa(E.holdAt)!=null?xa(E.holdAt):yHold; xH=clamp(xH,xOn+.03,.97);
    const HH=E.holdH||{}; pts.push(Object.assign({x:xOn,y:yOn,ei:E.land,ki:'land',role:'hold'},HH.landOut?{ko:'landOut'}:{lin:'o'}),Object.assign({x:xH,y:yHold,eo:E.leave,ko:'leave',role:'out'},HH.leaveIn?{ki:'leaveIn'}:{lin:'i'})); }   // the hold is a straight line unless handles were added (⌥-click the point)
  else if(false&&hasOn&&E.mid!=='smooth'){ /* no hold → no middle easing point (one smooth move) */ const xOn=xa(E.onAt)!=null?xa(E.onAt):yOn; pts.push({x:xOn,y:yOn,ei:E.land,eo:E.leave,ki:'land',ko:'leave',role:'mid'}); }
  pts.push({x:1,y:1,ei:E.end,ki:'end',role:'end'});
  const n=pts.length, sl=[]; for(let i=0;i<n-1;i++) sl.push((pts[i+1].y-pts[i].y)/Math.max(1e-6,pts[i+1].x-pts[i].x));
  const ef=v=>clamp((+v||0)/100,0,1);
  const h=pts.map((p,i)=>{ const sIn=i>0?sl[i-1]:null, sOut=i<n-1?sl[i]:null, eI=ef(p.ei), eO=ef(p.eo);
    const base=sIn==null?sOut:sOut==null?sIn:Math.min(sIn,sOut), eAvg=(i===0?eO:i===n-1?eI:(eI+eO)/2), slope=(1-eAvg)*base;
    const q={x:p.x,y:p.y,ix:0,iy:0,ox:0,oy:0,ki:p.ki,ko:p.ko,role:p.role};
    const HD=Object.assign({land:[.3,.12],leave:[.3,.12],landOut:[1/3,1/3],leaveIn:[1/3,1/3]},E.hd||{});   // default: a soft (not stopped) arrival into the hold and departure from it
    if(i>0){const dx=p.x-pts[i-1].x, dy=p.y-pts[i-1].y, len=dx*(.06+.42*eI); q.ix=-len; q.iy=-clamp(slope*len,0,dy*.95); q.segI=dx; q.segIy=dy;
      const r=HD[p.ki]; if(p.lin==='i'){ q.ix=-dx/3; q.iy=-dy/3; } else if(r){ q.ix=-clamp(Math.abs(+r[0]),0,1)*dx; q.iy=-clamp(Math.abs(+r[1]),0,1)*dy; } }
    if(i<n-1){const dx=pts[i+1].x-p.x, dy=pts[i+1].y-p.y, len=dx*(.06+.42*eO); q.ox=len; q.oy=clamp(slope*len,0,dy*.95); q.segO=dx; q.segOy=dy;
      const r=HD[p.ko]; if(p.lin==='o'){ q.ox=dx/3; q.oy=dy/3; } else if(r){ q.ox=clamp(Math.abs(+r[0]),0,1)*dx; q.oy=clamp(Math.abs(+r[1]),0,1)*dy; } }
    return q; });
  return {h,curve:hPack(h)};
}
function easeCurve(yOn,yHold,E){return easeModel(yOn,yHold,E).curve;}
let easeSync={k:''};
/* custom curve: keep its points with In · Hold · Out when those phases change length (e.g. adding a walk-off),
   instead of everything bunching up at the start. Interior points are re-mapped phase by phase. */
let phSync={k:''};
function phaseFracs(G){ let P; const sv=D.anim.sceneCurve; D.anim.sceneCurve=[0,0,1,1]; try{P=computePlan(G);}finally{D.anim.sceneCurve=sv;}
  if(!P.seq.length) return null; const tail=Math.max(0,Math.round(D.anim.tail)||0), C=Math.max(1,P.end-tail-P.startF), B=phaseBounds(P);
  return {on:B.on!=null?r3((B.on-B.c0)/C):null, hold:B.hold!=null?r3((B.hold-B.c0)/C):null, P}; }
function syncCustomCurve(G){
  if(D.anim.mode==='static') return;
  const sv=D.anim.sceneCurve, ph=D.anim.curvePh; D.anim.sceneCurve=null; D.anim.curvePh=null; const k=JSON.stringify(D)+'|'+G.W+'|'+G.H; D.anim.sceneCurve=sv; D.anim.curvePh=ph;
  if(phSync.k===k) return; phSync.k=k;
  const F=phaseFracs(G); if(!F) return; const now={on:F.on,hold:F.hold};
  if(!ph){ D.anim.curvePh=now; return; }
  const same=(a,b)=>(a==null&&b==null)||(a!=null&&b!=null&&Math.abs(a-b)<.004);
  if(same(ph.on,now.on)&&same(ph.hold,now.hold)) return;
  const c=sv||[0,0,1,1];
  if(isH(c)&&hOf(c).length>2){
    const ko=[0], kn=[0]; if(ph.on!=null&&now.on!=null){ko.push(ph.on);kn.push(now.on);} if(ph.hold!=null&&now.hold!=null&&ph.hold>(ph.on||0)&&now.hold>(now.on||0)){ko.push(ph.hold);kn.push(now.hold);} ko.push(1); kn.push(1);
    const m=v=>{ v=clamp(v,0,1); for(let i=0;i<ko.length-1;i++){ if(v<=ko[i+1]||i===ko.length-2){ const t=(v-ko[i])/Math.max(1e-6,ko[i+1]-ko[i]); return kn[i]+t*(kn[i+1]-kn[i]); } } return v; };
    const h=hOf(c).map(q=>{ const x=m(q.x), y=m(q.y), ix=m(q.x+q.ix)-x, iy=m(q.y+q.iy)-y, ox=m(q.x+q.ox)-x, oy=m(q.y+q.oy)-y; return {x,y,ix,iy,ox,oy}; });
    h[0].x=0;h[0].y=0;h[h.length-1].x=1;h[h.length-1].y=1;
    D.anim.sceneCurve=hPack(h);
  }
  D.anim.curvePh=now;
}
function syncSceneEase(G){
  const E=D.anim.sceneEase; if(!E||!E.on){ syncCustomCurve(G); return; } if(D.anim.mode==='static') return;
  const sv=D.anim.sceneCurve, cph=D.anim.curvePh; D.anim.sceneCurve=null; D.anim.curvePh=null; const k=JSON.stringify(D)+'|'+G.W+'|'+G.H; D.anim.sceneCurve=sv; D.anim.curvePh=cph;
  if(easeSync.k===k&&easeSync.c&&JSON.stringify(sv)===easeSync.c) return;
  let P; D.anim.sceneCurve=[0,0,1,1]; try{P=computePlan(G);}finally{D.anim.sceneCurve=sv;}
  if(!P.seq.length){easeSync={k,c:JSON.stringify(sv),m:null};return;}
  const tail=Math.max(0,Math.round(D.anim.tail)||0), C=Math.max(1,P.end-tail-P.startF), B=phaseBounds(P);
  const M=easeModel(B.on!=null?(B.on-B.c0)/C:null,B.hold!=null?(B.hold-B.c0)/C:null,E), c=M.curve;
  D.anim.sceneCurve=c; D.anim.curvePh={on:B.on!=null?r3((B.on-B.c0)/C):null,hold:B.hold!=null?r3((B.hold-B.c0)/C):null}; easeSync={k,c:JSON.stringify(c),m:M};
}
function plan(G){
  syncSceneEase(G);
  const key=JSON.stringify(D)+'|'+G.W+'|'+G.H;
  if(planCache.k===key) return planCache.v;
  const v=remappedPlan(G); planCache={k:key,v}; return v;
}
/* ---- TIME REMAP: the scene layer on top.
   The blocks are timed on their own clock (ON · HOLD · OFF, all at a steady pace). The scene layer then maps
   that whole story onto the scene length with the scene easing — like time-remapping a precomp in AE.
   Everything that has a time (reveals, exits, camera, grid changes, content start/end, lab) is re-timed. */
let DENSE_CAM=false;
const isLinearCurve=c=>{c=c||[0,0,1,1];return !isPts(c)&&Math.abs(+c[0]-+c[1])<1e-6&&Math.abs(+c[2]-+c[3])<1e-6;};
function remapActive(){return D.anim.mode!=='static'&&(!isLinearCurve(D.anim.sceneCurve)||+D.anim.remapLen>0);}
function remappedPlan(G){
  const A=D.anim, ident=P=>{const tail=Math.max(0,Math.round(A.tail)||0);P.toReal=P.toContent=t=>t;P.C=P.R=Math.max(1,(P.end||0)-tail-(P.startF||0));P.cEnd=(P.startF||0)+P.C;P.c=P;return P;};
  if(!remapActive()) return ident(computePlan(G));
  const curve=A.sceneCurve; let P;
  A.sceneCurve=[0,0,1,1]; DENSE_CAM=true;
  try{ P=computePlan(G); } finally { A.sceneCurve=curve; DENSE_CAM=false; }
  if(!P.seq.length) return ident(P);
  // keep the blocks' own timing (for the timeline rows under the Scene layer), then re-time the plan
  P.c={startF:P.startF,L:P.L,T:P.T.slice(),T0:P.T0?P.T0.slice():null,done:P.done?P.done.slice():null,exitT:P.exitT?P.exitT.slice():null,
    onEnd:P.onEnd,landT:P.landT,fillOut:P.fillOut,holdT:P.holdT,walkT:P.walkT,walkEnd:P.walkEnd,relT:P.relT,end:P.end,cam:P.cam,camPh:P.camPh?Object.assign({},P.camPh):null,cutAt:P.cutAt,cutN:P.cutN,
    fillBase:Object.assign({},P.fillBase||{}),fillEnd:Object.assign({},P.fillEnd||{}),gaps:(P.gaps||[]).map(it=>({t0:it.t0,tEnd:it.tEnd})),
    echo:(P.echo||[]).map(e=>({K:{op:e.K.op}}))};
  remapPlan(P,curve); return P;
}
function remapPlan(P,curve){
  const tail=Math.max(0,Math.round(D.anim.tail)||0), c0=P.startF, cEnd=Math.max(c0+2,P.end-tail), C=cEnd-c0, R=+D.anim.remapLen>0?Math.max(2,Math.round(+D.anim.remapLen)):C;
  const f=curveFn(curve), inv=invCurve(curve);
  const toReal=c=>c<=c0?c:c>=cEnd?c0+R+(c-cEnd):c0+R*inv((c-c0)/C);
  const toContent=t=>t<=c0?t:t>=c0+R?cEnd+(t-c0-R):c0+C*clamp(f((t-c0)/R),0,1);
  const ks=list=>{ if(!list||!list.length) return list; let prev=-1e9; return list.map(k=>{const n=k.slice(); let t=r3(toReal(k[0])); if(t<=prev) t=r3(prev+.001); prev=t; n[0]=t; return n;}); };
  const rn=v=>v==null?v:Math.round(toReal(v));
  P.T=P.T.map(rn); if(P.T0) P.T0=P.T0.map(rn); if(P.done) P.done=P.done.map(rn); if(P.exitT) P.exitT=P.exitT.map(rn);
  Object.values(P.tracks).forEach(K=>Object.keys(K).forEach(k=>{if(Array.isArray(K[k])) K[k]=ks(K[k]);}));
  (P.echo||[]).forEach(e=>Object.keys(e.K).forEach(k=>{e.K[k]=ks(e.K[k]);}));
  if(P.lab){['pulses','trails','bars'].forEach(n=>(P.lab[n]||[]).forEach(x=>{x.t0=rn(x.t0);Object.keys(x.K).forEach(k=>{x.K[k]=ks(x.K[k]);});})); if(P.lab.end) P.lab.end=rn(P.lab.end);}
  P.cam=ks(P.cam); P.zs=ks(P.zs); P.pan=ks(P.pan); P.ruleOp=ks(P.ruleOp);
  ['fillBase','fillEnd'].forEach(n=>{const m=P[n]||{}; Object.keys(m).forEach(id=>{m[id]=rn(m[id]);});});
  (P.gaps||[]).forEach(it=>{it.t0=rn(it.t0); if(it.tEnd!=null) it.tEnd=rn(it.tEnd);});
  ['relT','walkT','holdT','walkEnd','onEnd','landT','fillOut'].forEach(n=>{if(P[n]!=null) P[n]=rn(P[n]);});
  if(P.camPh) P.camPh={start:rn(P.camPh.start),stop:rn(P.camPh.stop),go:rn(P.camPh.go)};
  P.end=Math.ceil(toReal(cEnd))+tail; P.C=C; P.R=R; P.cEnd=cEnd; P.toReal=toReal; P.toContent=toContent; P.remapped=true;
}
function clip0(list){
  if(!list||!list.length||list[0][0]>=0) return list;
  let i=0; while(i<list.length&&list[i][0]<0) i++;
  if(i>=list.length){const l=list[list.length-1];return [[0,l[1],'h']];}
  if(list[i][0]===0) return list.slice(i);
  const prev=list[i-1], val=ev(list,0,prev[1]);
  return [[0,Array.isArray(val)?val.map(r3):r3(val),prev[2]==='h'?'h':'l']].concat(list.slice(i));
}
function computePlan(G){
  const A=D.anim, fps=D.comp.fps||30, allB=ordered(G), manual=A.order==='manual';
  const base=manual?allB.filter(b=>b.mo>0):allB;
  const P={seq:base,T:base.map(()=>0),tr:[],cam:[],zs:[],tracks:{},end:0,mode:A.mode,offs:[],ext:0,groups:0,sMin:1,startF:0,L:0,baseMain:0,echo:[],
    statics:manual&&A.unpicked==='visible'?allB.filter(b=>!(b.mo>0)):[], unpicked:manual?allB.filter(b=>!(b.mo>0)):[], ghosts:[]};
  if(A.mode==='static') return P;
  if(manual){ // ghost continuation the user can click to add
    const am=allB.filter(b=>!b.stack).length, wantG=A.countMode==='exact'?Math.round(A.total||0):Math.max(1,Math.round((A.toEnd?Math.round((D.comp.dur||10)*fps)-Math.round(+A.startF||0):Math.round(+A.lenF||180))/Math.max(1,+A.pace||6)));
    const sv=A.order; A.order='ltr'; P.ghosts=extension(G,allB,Math.max(6,wantG-am)); A.order=sv;
  }
  if(!base.length) return P;
  const tr0=Math.max(1,Math.round(+A.trans||1)), st=Math.max(1,Math.round(A.stepEvery)||1), stop=A.motion==='stop';
  const startF=Math.round(+A.startF||0), compF=Math.round((D.comp.dur||10)*fps);
  const L=Math.max(2,A.toEnd?compF-startF:Math.round(+A.lenF||180));
  P.startF=startF; P.L=L;
  const baseMain=base.filter(b=>!b.echo&&!b.stack).length; P.baseMain=baseMain;
  // how many blocks: fill the length at the chosen pace, or an exact number
  const cuesIn=(D.timing&&D.timing.sync)?timingCues().filter(c=>c>=startF&&c<=startF+L).length:0;
  const want=A.countMode==='exact'?Math.round(A.total||0):cuesIn?cuesIn:Math.max(1,Math.round(L/Math.max(1,+A.pace||6)));   // synced to sound: one block per cue
  // walk-off: after the build holds, the line keeps walking — extra blocks continue the pattern
  const WO=!!(D.exit&&D.exit.on&&D.exit.mode==='walk'&&!manual&&A.mode!=='static');
  const pace2=Math.max(1,(+A.pace||6)*Math.max(.1,+D.exit.walkPace||1)), woLen=Math.max(0,Math.round(+D.exit.walkLen||48)), woK=Math.max(1,Math.round(+D.exit.trail||6));
  // blocks while the camera follows + enough for the head to run off frame with its whole trail after the camera lets go
  const woOff=Math.ceil(.45*G.W/Math.max(1,Math.max(1,D.block.w|0)*G.p))+woK+2;
  const woN=WO?Math.max(1,Math.round(woLen/pace2))+(A.mode==='camera'||A.mode==='push'?woOff:0):0;
  const woH=WO&&D.exit.holdOn!==false?Math.max(0,Math.round(+D.exit.walkHold||0)):0;
  // phases on the content clock: ON (the build, length L) · HOLD (woH) · OFF (the walk-off, at its own pace)
  const wantB=want;
  P.woN=woN;
  const exts=manual?[]:extension(G,base,Math.max(0,wantB-baseMain)); P.endCol=exts.__endCol; P.endReach=exts.__reach; P.endRowUsed=exts.__endRow;
  if(WO&&!manual){ // the walk-off continues the pattern from where the build ended (an end row only applies to the build)
    const sv=A.ending, svOn=A.extendOn; A.ending='count'; A.extendOn=true;
    const more=extension(G,base.concat(exts),woN); A.ending=sv; A.extendOn=svOn;
    more.forEach((b,k)=>{b.id=-100000-k; exts.push(b);}); P._woMore=more.length;   // own ids (the build's virtual blocks already use -1, -2, …)
  }
  const skip=new Set((A.skip||[]).map(Number));
  let seq=base.concat(exts.filter(b=>!skip.has(b.id)));
  { const BC=D.blockColors||{}; seq.forEach(b=>{ if(b.virtual&&BC[b.id]){ b.color=BC[b.id]; b.textColor=contrast(b.color); } }); }   // colours picked for single generated blocks
  if(skip.size&&WO&&P._woMore!=null) P._woMore=exts.filter(b=>b.id<=-100000&&!skip.has(b.id)).length;
  seq.forEach((b,i)=>{if(b.virtual)b.order=i+1;});
  let gi=[], ng=0;
  if(A.groupCol){const m={};seq.forEach(b=>{if(!(b.c in m))m[b.c]=ng++;gi.push(m[b.c]);});}
  else seq.forEach(()=>gi.push(ng++));
  let used=ng;
  // which groups belong to the walk-off (the last woN blocks)
  const nBuildBlocks=Math.max(1,seq.length-(WO?(P._woMore||0):0));
  let usedB=WO?Math.max(1,Math.max(...gi.slice(0,nBuildBlocks))+1):used;
  P.walkFrom=WO?nBuildBlocks:null;
  const CC=(A.camCurve||[0.33,0,0.67,1]).map(Number), RC=(A.revCurve||[0.25,0.1,0.25,1]).map(Number), ZC=(A.zoomCurve||[0.65,0,0.35,1]).map(Number);
  const camOn=(A.mode==='camera'||A.mode==='push');

  /* ---- scene clock --------------------------------------------------------------
     Everything is first laid out on a straight (linear) scene timeline s = 0…L.
     The scene easing curve then re-times all of it at once:  real t = start + L·inv(s/L).
     Reveals, their durations, camera moves and grid changes are all re-timed together;
     nothing inside a block is time-warped.                                          */
  const sceneF=curveFn(A.sceneCurve||[0,0,1,1]), inv=invCurve(A.sceneCurve);
  const W=s=>s<=0?startF+s:s>=L?startF+L+(s-L):startF+L*inv(s/L);          // linear → real
  const S=t=>t<=startF?t-startF:t>=startF+L?L+(t-startF-L):L*sceneF((t-startF)/L); // real → linear

  // camera targets
  const cx=G.W/2, cy=G.H/2; let tg=[], fin=null;
  const cm=stop?'stop':(A.camMove||'follow');
  if(camOn){
    // the camera follows the frontier: the block furthest along in the build direction so far
    const dirO=A.order==='rtl'?-1:1; let front=null; const ctr=[];
    for(let g=0;g<used;g++){
      const mem=seq.filter((b,i)=>gi[i]===g), main=mem.filter(b=>!b.stack), use=main.length?main:mem;
      use.forEach(b=>{const r=cellRect(G,b.c,b.r,b.w,b.h),c=[r.x+r.w/2,r.y+r.h/2];if(!front||dirO*c[0]>dirO*front[0]+1e-6)front=c;});
      ctr.push(front.slice());
    }
    const dirX=ctr[used-1][0]<ctr[0][0]?-1:1, dirY=ctr[used-1][1]<ctr[0][1]?-1:1;
    const qd=(v,dir)=>(A.snap&&(cm==='step'||cm==='stop'))?(dir>0?Math.ceil(v/G.p-1e-9):Math.floor(v/G.p+1e-9))*G.p:v;
    let pv=[0,0];
    ctr.forEach(c=>{
      let ox=qd(cx-c[0],dirX), oy=A.axis==='xy'?qd(cy-c[1],dirY):0;
      if(A.mode==='camera'&&A.lazy){ox=dirX>0?Math.min(pv[0],ox):Math.max(pv[0],ox);if(A.axis==='xy')oy=dirY>0?Math.min(pv[1],oy):Math.max(pv[1],oy);}
      P.offs.push([ox,oy]); pv=[ox,oy];
    });
    tg=P.offs.slice();
    if(A.extendOn&&A.ending==='spot'&&!manual&&A.camMove!=='curve'){   // 'With the blocks' handles the landing itself ('Last block ends up'), end row only shapes the walk
      const mains=seq.filter(b=>!b.stack), lb=mains.length?mains[mains.length-1]:seq[seq.length-1], r=cellRect(G,lb.c,lb.r,lb.w,lb.h);
      fin=[r3(G.W*clamp(+A.endX||0,-200,300)/100-(r.x+r.w/2)),A.axis==='xy'?r3(G.H*clamp(+A.endY||0,-200,300)/100-(r.y+r.h/2)):0];
      P.fin=fin; tg.push(fin);
    }
  }
  const M=Math.max(0,tg.length-1), lag=camOn?Math.max(1,+A.smooth||1.5):0;
  // camera modes: the camera trails the newest block by `lagSteps` steps and then eases to rest over `settle` frames,
  // so the reveals are spaced to leave exactly that much room before the scene ends
  let step, lagSteps=0, settleF=0, finalF=0;
  // camera release: follow for the first relAt% of the scene, then coast to a stop while the blocks keep building past
  const relOn=camOn&&A.relOn&&(cm==='follow'||cm==='stop'||cm==='curve')&&!(A.extendOn&&A.ending==='spot')&&clamp(+A.relAt||85,5,100)<100;
  P.relT=relOn?Math.round(startF+L*clamp(+A.relAt||85,5,100)/100):null;
  if(relOn||cm==='curve'){ step=Math.max(.25,(L-tr0)/Math.max(1,usedB-1)); }   // curve camera: reveals spread over the whole scene (the camera follows the easing, not the blocks)
  else if(camOn){
    let maxGap=1, prevG=0; for(let g=1;g<usedB;g++){const a=tg[g-1],b=tg[g];if(Math.abs(a[0]-b[0])>1e-6||Math.abs(a[1]-b[1])>1e-6){maxGap=Math.max(maxGap,g-prevG);prevG=g;}}
    lagSteps=Math.max(lag,maxGap);
    const tau=cm==='follow'?Math.max(0,+A.motionBlurF):0;
    settleF=cm==='follow'?Math.max(Math.round(+A.settle||0),Math.ceil(4*tau),2):Math.max(4,Math.round((D.comp.fps||30)*.25));   // step & settle: room for the last move
    finalF=(A.extendOn&&A.ending==='spot'&&!manual&&A.camMove!=='curve')?Math.max(1,Math.round(A.finalMove)||30):0;
    // reveals leave room for: the camera's follow distance (lag steps) + the final framing move + the settle
    step=(L-finalF-settleF)/Math.max(1,usedB-1+lagSteps);
    if(step<1){ // not enough room: shrink the settle first, never below 2 frames
      settleF=Math.max(2,Math.floor(L-finalF-(usedB-1+lagSteps)));
      step=Math.max(.25,(L-finalF-settleF)/Math.max(1,usedB-1+lagSteps));
    }
    step=Math.min(step,(L-tr0)/Math.max(1,usedB-1));
  } else step=Math.max(1,L-tr0)/Math.max(1,usedB-1);
  // walk-off inside the scene: build steps, then the hold, then the walk at its own pace — all on the one linear clock
  const wp=Math.max(.1,+D.exit.walkPace||1), nW=used-usedB;
  let sWalk=null;
  const lead=Math.max(0,Math.round(+A.landLead||0));   // the last block lands this long before the hold starts (so easing into the hold never slows the last arrival)
  const olead=WO?Math.max(0,Math.round(+A.outLead||0)):0;   // Out settle: the camera gets going this long before the first block walks off
  if(WO&&nW>0){ sWalk=(usedB-1)*step+tr0+lead+woH+olead; }
  // reveal times on the linear clock, then re-timed by the scene curve (one at a time, in order)
  const sg=[], Tg=[]; const spread=(used-1)<=L;
  for(let g=0;g<used;g++){
    const walkG=g>=usedB&&sWalk!=null, s=walkG?sWalk+(g-usedB)*pace2:Math.min(L,step*g); sg.push(s);
    let t=Math.round(W(s)); if(spread&&g>0&&t<=Tg[g-1]) t=Tg[g-1]+1; Tg.push(walkG?t:Math.min(t,startF+L));
  }
  // drop the late blocks: everything in the build landing after cutAt goes, the rest keep their timing exactly
  const cutAt=A.cutAt!=null&&A.cutAt!==''?+A.cutAt:null; P.cutAt=null;
  if(cutAt!=null&&isFinite(cutAt)){
    let gCut=usedB; for(let g=1;g<usedB;g++){ if(Tg[g]>cutAt){gCut=g;break;} }
    const k=usedB-gCut;
    if(k>0){
      // the walk-off continues from the new last block: move it back into place so there's no empty stretch to cross
      let dc=0, dr=0; { const lk=seq.filter((b,i)=>gi[i]<gCut&&!b.stack).pop(), ld=seq.filter((b,i)=>gi[i]>=gCut&&gi[i]<usedB&&!b.stack).pop(); if(lk&&ld){dc=lk.c-ld.c; dr=lk.r-ld.r;} }
      const nseq=[], ngi=[]; seq.forEach((b,i)=>{const g=gi[i]; if(g>=gCut&&g<usedB) return; nseq.push(g>=usedB&&(dc||dr)?Object.assign({},b,{c:b.c+dc,r:b.r+dr}):b); ngi.push(g>=usedB?g-k:g);});
      seq=nseq; gi=ngi; Tg.splice(gCut,k); sg.splice(gCut,k); if(camOn){tg.splice(gCut,k); P.offs.splice(gCut,k);}
      used-=k; usedB=gCut; P.cutAt=cutAt; P.cutN=k;
      // the walk-off follows the new last block: pull it earlier by the time the dropped blocks took (the hold keeps its length)
      if(sWalk!=null&&used>usedB){ const sNew=Math.max(sg[usedB-1]+tr0+lead+woH+olead,(usedB-1)*step+tr0+lead+woH+olead), want=Math.max(Tg[usedB-1]+1,Math.round(W(sNew))), dT=Tg[usedB]-want, dS=sg[usedB]-sNew;
        if(dT>0){ for(let g=usedB;g<used;g++){ sg[g]-=dS; Tg[g]=Math.max(Tg[g-1]+1,Tg[g]-dT); } sWalk=sNew; } }
      if(WO){ P.walkFrom=seq.findIndex((b,i)=>gi[i]>=usedB); if(P.walkFrom<0) P.walkFrom=seq.length; }
    }
  }
  // ending on a chosen row: if blocks were dropped (removed / cut), the line's last block moved — slide the whole
  // line up or down so the build still ends on that row (blocks may run off the frame; they're cropped)
  P.lineShift=0;
  if(A.extendOn&&A.ending==='spot'&&!manual&&(skip.size||P.cutAt!=null)){
    const nB=P.walkFrom!=null?P.walkFrom:seq.length, mb=seq.slice(0,nB).filter(b=>!b.stack), lastB=mb[mb.length-1];
    const tr=P.endRowUsed!=null?P.endRowUsed:clamp(Math.round((A.endRow||1)-1),0,G.R-1);
    const dr=lastB?tr-lastB.r:0;
    if(dr&&A.endFix==='shift'){ seq=seq.map(b=>{ if(b.virtual){b.r+=dr;return b;} return Object.assign({},b,{r:b.r+dr,_shift:dr}); }); P.lineShift=dr; }
    else if(dr){
      /* re-route the tail: keep the start (and most of the line) where it is, and re-walk the last X% of the build
         so the new last block lands on the end row. Columns stay put; only rows change. */
      const mains=seq.slice(0,nB).filter(b=>!b.stack), h=lastB.h, WB=walkBounds(G,h), maxStep=h>1?h:Math.max(1,Math.round(D.rand.wander)||1);
      let trq=tr; if(h>1){ const r0=mains[0].r; trq=r0+Math.round((tr-r0)/h)*h; while(trq>WB.hi) trq-=h; while(trq<WB.lo) trq+=h; }
      let k=Math.max(1,Math.min(mains.length-1,Math.ceil(mains.length*clamp(+A.reroutePct||30,5,100)/100)));
      while(k<mains.length-1&&Math.abs(trq-mains[mains.length-1-k].r)>k*maxStep) k++;
      const s0=mains.length-1-k, rnd=rng(((D.rand.seed|0)+(A.seed|0)*7919)*31+7), oldLastR=lastB.r, tail=new Set();
      let r=mains[s0].r;
      for(let j=1;j<=k;j++){
        const b=mains[s0+j], rem=k-j; if(!b||!b.virtual) continue;
        let nr;
        if(rem===0) nr=trq;
        else { nr=walkRow(r,WB.hi,rnd,h,WB.lo); nr=clamp(nr,trq-rem*maxStep,trq+rem*maxStep); if(Math.abs(nr-r)>maxStep) nr=r+Math.sign(nr-r)*maxStep; if(h>1) nr=r+Math.round((nr-r)/h)*h; }
        b.r=nr; r=nr; tail.add(b.c);
      }
      // pairs in the re-walked part go (they were placed for the old rows); the walk-off follows the new end
      const delta=lastB.r-oldLastR, keep=seq.map((b,i)=>!(b.stack&&i<nB&&tail.has(b.c)));
      seq.forEach((b,i)=>{ if(i>=nB&&b.virtual) b.r+=delta; });
      seq=seq.filter((b,i)=>keep[i]); gi=gi.filter((g,i)=>keep[i]);
      if(WO){ P.walkFrom=seq.findIndex((b,i)=>gi[i]>=usedB); if(P.walkFrom<0) P.walkFrom=seq.length; }
      P.rerouted=k;
    }
  }
  // the build never ends on a pair: drop pair blocks in the last build block's column
  if(D.rand.endSingle&&!manual){ const nB=P.walkFrom!=null?P.walkFrom:seq.length, mains=seq.slice(0,nB).filter(b=>!b.stack), lb=mains[mains.length-1];
    if(lb){ const keep=seq.map((b,i)=>!(i<nB&&b.stack&&b.c<lb.c+lb.w&&b.c+b.w>lb.c)); if(keep.some(k=>!k)){ seq=seq.filter((b,i)=>keep[i]); gi=gi.filter((g,i)=>keep[i]); if(WO){ P.walkFrom=seq.findIndex((b,i)=>gi[i]>=usedB); if(P.walkFrom<0) P.walkFrom=seq.length; } } } }
  P.walkT=WO?(sWalk!=null?Math.max(Tg[usedB-1]+1,Math.round(W(sWalk-olead))):Tg[usedB-1]+tr0+lead+woH):null;   // Out starts (hold ends)
  P.holdT=WO?Tg[usedB-1]+tr0+lead:null;
  P.landT=Math.round(Math.max(startF+1,...Tg.slice(0,usedB))+tr0); P.onEnd=P.landT+lead;   // end of the ON phase (content clock)
  P.walkEnd=WO?Tg[used-1]+tr0:null;
  // sync to sound: each reveal moves to the nearest cue (beat / marker), keeping the order
  const CUES=timingCues();
  if(D.timing&&D.timing.sync&&CUES.length){
    let prev=-1e9;
    for(let g=0;g<usedB;g++){
      const want=Tg[g], cand=CUES.filter(c=>c>prev&&c<=startF+L);
      let best=null; cand.forEach(c=>{if(best==null||Math.abs(c-want)<Math.abs(best-want))best=c;});
      Tg[g]=best!=null?best:Math.max(want,prev+1); prev=Tg[g];
    }
  }
  if(isGenerated()) seq=applyColourMode(seq);
  P.seq=seq; P.T=seq.map((b,i)=>Tg[gi[i]]); P.tr=seq.map(()=>tr0); P.ext=seq.filter(b=>b.virtual).length; P.groups=used;
  let lastT=startF+L;
  const warpKeys=list=>{const out=[];list.forEach(k=>{let t=Math.round(W(k[0]));if(out.length&&t<=out[out.length-1][0])t=out[out.length-1][0]+1;out.push([t,k[1],k[2],k[3]]);});return out;};
  const dedupe=list=>{const c=[];list.forEach(k=>{if(c.length&&k[0]<=c[c.length-1][0])c[c.length-1]=[c[c.length-1][0],k[1],k[2],k[3]];else c.push(k);});return c;};

  // grid size over time (linear clock, then re-timed)
  const zStart=z=>z.mode==='frames'?(+z.f0||0):(Tg[clamp(Math.round(z.at)||1,1,Math.max(1,used))-1]||0)+(+z.off||0);
  const zl=(A.zoomOn===false?[]:(A.zoom||[])).filter(z=>z&&z.rows>0&&z.on!==false).slice().sort((a,b)=>zStart(a)-zStart(b));
  P.pan=[];
  if(zl.length&&used){
    let s=100; const zs=[], pn=[];
    zl.forEach(z=>{
      // real start/end frames: at a step (+offset) for a length, or exact frames; then mapped onto the scene clock
      let f0,f1;
      if(z.mode==='frames'){f0=Math.round(+z.f0||0);f1=Math.max(f0+1,Math.round(+z.f1||f0+1));}
      else{f0=Math.round(W(sg[clamp(Math.round(z.at)||1,1,used)-1])+(+z.off||0));f1=f0+Math.max(1,Math.round(z.dur)||1);}
      const s0=S(f0), dur=Math.max(1e-3,S(f1)-s0), ns=r3(100*G.R/Math.max(1,z.rows));
      // normal: current size → this size.  Reversed: start at this size → back to the current size
      const from=z.rev?ns:s, to=z.rev?s:ns;
      if(from!==to){
        if(stop){zs.push([s0,from,'h']);zs.push([s0+1,to,'h']);}
        else{zs.push([s0,from,'e',ZC]);zs.push([s0+dur,to,'e',ZC]);}
      }
      P.sMin=Math.min(P.sMin,ns/100,s/100); s=to;
      // positioning: shift the whole frame (as % of the comp) at the start and end of this change
      const px=v=>r3((+v||0)*G.W/100), py=v=>r3((+v||0)*G.H/100);
      if(z.sx||z.sy||z.ex||z.ey||pn.length){
        pn.push([s0,[px(z.sx),py(z.sy)],stop?'h':'e',ZC]); pn.push([s0+(stop?1:dur),[px(z.ex),py(z.ey)],stop?'h':'e',ZC]);
      }
    });
    const w=warpKeys(dedupe(zs)); P.zs=clip0(w); if(w.length) lastT=Math.max(lastT,w[w.length-1][0]);
    if(pn.length){const wp=warpKeys(dedupe(pn)); P.pan=clip0(wp); lastT=Math.max(lastT,wp[wp.length-1][0]);}
  }

  // camera / conveyor
  if(camOn){
    const endF=WO?Math.max(startF+L,P.walkEnd+2):startF+L;
    // linear time at which each step actually appears (after the one-at-a-time spacing)
    const sEff=Tg.map(t=>S(t));
    // distinct camera targets in order (pairs / echoes in the same column don't make the camera stall)
    const UT=[]; for(let g=0;g<used;g++){const o=tg[g];const l=UT[UT.length-1];if(!l||Math.abs(l.o[0]-o[0])>1e-6||Math.abs(l.o[1]-o[1])>1e-6)UT.push({s:sEff[g],o});}
    const last=UT.length-1;
    /* GLIDE CAMERA (real frames)
       goal(t): a point moving along the revealed targets, `lag` targets behind the newest (never toward an unrevealed one);
       camera:  goal smoothed by a causal critically-damped kernel (a weighted average of where the goal has been → can't get ahead, no overshoot);
       end:     blended into the final position over the settle with zero speed, landing exactly at the scene end. */
    const uT=[], uO=[]; { let prev=null; for(let g=0;g<used;g++){const o=tg[g]; if(!prev||Math.abs(prev[0]-o[0])>1e-6||Math.abs(prev[1]-o[1])>1e-6){uT.push(Tg[g]);uO.push(o);prev=o;}} }
    if(fin){uO.push(fin);}
    const nU=uT.length, lastU=nU-1, extraU=fin?1:0, lagU=Math.max(1,+A.smooth||1.5);
    const tReach=Math.max(uT[lastU]+1,endF-settleF);
    const prog=t=>{                       // fractional index of the newest revealed target, continuing smoothly after the last one
      if(t<=uT[0]) return 0;
      if(t>=uT[lastU]){   // after the last reveal: carry on at the current pace, then ease to a stop (no sudden halt)
        const Tt=Math.max(1,tReach-uT[lastU]), Dd=lagU+extraU, u=clamp((t-uT[lastU])/Tt,0,1);
        const v0=lastU>0?1/Math.max(1,uT[lastU]-uT[lastU-1]):Dd/Tt, m=clamp(v0*Tt/Dd,0,3);
        return lastU+Dd*((u*u*u-2*u*u+u)*m+(3*u*u-2*u*u*u));
      }
      let lo=0,hi=lastU; while(hi-lo>1){const m=(lo+hi)>>1; if(uT[m]<=t) lo=m; else hi=m;}
      return lo+(t-uT[lo])/Math.max(1e-6,uT[hi]-uT[lo]);
    };
    const along=x=>{x=clamp(x,0,uO.length-1);const i=Math.min(uO.length-2,Math.floor(x)),f=x-i;if(uO.length===1)return uO[0];return[uO[i][0]+(uO[i+1][0]-uO[i][0])*f,uO[i][1]+(uO[i+1][1]-uO[i][1])*f];};
    const goal=t=>along(prog(t)-lagU);
    const finalO=uO[uO.length-1];
    let cam=[];
    if(cm==='follow'||cm==='stop'||cm==='curve'){
      const a=startF, b=endF, N=b-a+1, xs=new Float64Array(N), ys=new Float64Array(N);
      if(cm==='curve'){
        /* CURVE CAMERA: no lag, no reaction. The newest block is kept on the reveal line, so the camera's speed is
           exactly the pace of the reveals — which is the scene easing curve. Corners are rounded with a light
           symmetric blur; it doesn't move until the blocks reach the line, and holds once the last one lands. */
        const line=G.W*(A.revealWhen==='arrive'?clamp(+A.revealX||75,50,120)/100:0.62), dirO=A.order==='rtl'?-1:1;
        const lineX=dirO>0?line:G.W-line;
        let lastFrontX=null; for(let g=0;g<usedB;g++){ seq.forEach((b,i)=>{ if(gi[i]!==g||b.stack) return; const r=cellRect(G,b.c,b.r,b.w,b.h), cx2=r.x+r.w/2; if(lastFrontX==null||dirO*cx2>dirO*lastFrontX) lastFrontX=cx2; }); }
        const key=[]; let pvx=0,pvy=0, front=null;
        for(let g=0;g<used;g++){
          const mem=seq.filter((b,i)=>gi[i]===g), main=mem.filter(b=>!b.stack), use=main.length?main:mem;
          use.forEach(b=>{const r=cellRect(G,b.c,b.r,b.w,b.h),c=[r.x+r.w/2,r.y+r.h/2];if(!front||dirO*c[0]>dirO*front[0]+1e-6)front=c;});
          let ox=lineX-front[0], oy=A.axis==='xy'?(cy-front[1]):0;
          ox=dirO>0?Math.min(pvx,ox):Math.max(pvx,ox);      // only ever moves forward, never before the blocks reach the line
          // the line finishes building: the camera carries on until the last block sits at the settle point (centre by
          // default), so the last block pops in on rhythm inside the frame instead of late at the right-hand edge
          if(!fin&&g<usedB){ const sl=G.W*clamp(A.endX!=null?+A.endX:50,-200,300)/100, sx=dirO>0?sl:G.W-sl;
            if(g===usedB-1){ const so=sx-front[0]; ox=dirO>0?Math.min(ox,so):Math.max(ox,so); }
            // past the reveal line (Right, Off right): the camera stops early so the end of the line runs on off the frame
            if(dirO>0?sx>lineX:sx<lineX){ const soF=sx-lastFrontX; ox=dirO>0?Math.max(ox,soF):Math.min(ox,soF); } }   // 'Last block ends up' (Off left … Right)
          key.push([Tg[g],ox,oy]); pvx=ox; pvy=oy;
        }
        if(fin) key.push([endF,fin[0],fin[1]]);
        const keyAll=key.slice(); if(WO) key.length=Math.min(key.length,usedB);
        // the path the frame travels (frontier on the line), walked by distance so uneven block spacing doesn't jerk it
        const pts=[]; key.forEach(k=>{const l=pts[pts.length-1];if(!l||Math.hypot(l[0]-k[1],l[1]-k[2])>1e-6)pts.push([k[1],k[2]]);});
        const cum=[0]; for(let k=1;k<pts.length;k++) cum.push(cum[k-1]+Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]));
        const tot=cum[cum.length-1];
        let kStart=0; while(kStart+1<key.length&&Math.abs(key[kStart+1][1]-key[0][1])<1e-6&&Math.abs(key[kStart+1][2]-key[0][2])<1e-6) kStart++;
        const t0c=key[kStart][0], t1c=Math.max(t0c+1,key[key.length-1][0]), E=curveFn((A.sceneCurve||[0,0,1,1]).map(Number));
        // the scene easing is applied over the camera's own travel time (first move → last block), from its matching point on the curve
        // the whole easing curve is laid over the camera's travel (first move → last block)
        const at=dd=>{if(pts.length<2||tot<=0)return pts[0];let k=1;while(k<cum.length-1&&cum[k]<dd)k++;const seg=Math.max(1e-9,cum[k]-cum[k-1]),f=clamp((dd-cum[k-1])/seg,0,1);return[pts[k-1][0]+(pts[k][0]-pts[k-1][0])*f,pts[k-1][1]+(pts[k][1]-pts[k-1][1])*f];};
        for(let i=0;i<N;i++){const t=a+i, u=clamp((t-t0c)/Math.max(1,t1c-t0c),0,1), o=at(tot*clamp(E(u),0,1)); xs[i]=o[0]; ys[i]=o[1];}
        if(!fin&&keyAll.length>1){
          /* camera = the blocks (In · Hold · Out): one path for the frame (frontier on the line) through build → hold → walk.
             Distance runs evenly on the scene's linear clock (so the real speed follows the scene easing, and pairs or
             stairs never make it stall), easing out into the hold and back up to speed into the walk. */
          const pA=[], cA=[0], kd=[];
          keyAll.forEach(k=>{const l=pA[pA.length-1]; if(!l){pA.push([k[1],k[2]]);} else {const d=Math.hypot(l[0]-k[1],l[1]-k[2]); if(d>1e-6){pA.push([k[1],k[2]]);cA.push(cA[cA.length-1]+d);}} kd.push(cA[cA.length-1]);});
          const totA=cA[cA.length-1], DB=kd[usedB-1], DW=Math.max(0,totA-DB);
          let g0=0; while(g0+1<usedB&&kd[g0+1]<=1e-6) g0++;
          // steady speed on the blocks' clock while they build and while they walk, still while they hold.
          // Only a short ease at each start/stop (anim.camEase); everything else comes from the Scene curve.
          const ez=Math.max(0,+A.camEase||0);
          const sB0=sg[g0], sB1=Math.max(sB0+1,sg[usedB-1]), Rb=Math.max(.5,Math.min((sB1-sB0)/2,ez));
          const hasW=WO&&used>usedB, sW1=hasW?sg[used-1]:Infinity, Rw=Math.max(.5,ez), sW0=hasW?Math.max(sB1,sg[usedB]-Math.max(Rw,+A.outLead||0)):Infinity, TW=hasW?Math.max(1,sW1-sW0):1;
          P.camPh={start:Math.round(W(sB0)),stop:Math.round(W(sB1)),go:hasW?Math.round(W(sW0)):null};
          const trap=(e,T,Dd,R)=>{ if(T<=0||Dd<=0) return e>0?Dd:0; e=clamp(e,0,T); const v=Dd/Math.max(1e-6,T-R); return e<R?v*e*e/(2*R):e<T-R?v*(e-R/2):Dd-v*(T-e)*(T-e)/(2*R); };
          const accel=(e,T,Dd,R)=>{ if(e<=0) return 0; const v=Dd/Math.max(1e-6,T-R/2); return Math.min(Dd,e<R?v*e*e/(2*R):v*(e-R/2)); };
          const dAt=t=>{ const sl=S(t); if(sl<=sB0) return 0; if(sl<=sB1) return trap(sl-sB0,sB1-sB0,DB,Rb); if(sl<=sW0) return DB; return DB+accel(sl-sW0,TW,DW,Rw); };
          const atA=dd=>{if(pA.length<2||totA<=0)return pA[0];let k=1;while(k<cA.length-1&&cA[k]<dd)k++;const sgm=Math.max(1e-9,cA[k]-cA[k-1]),q=clamp((dd-cA[k-1])/sgm,0,1);return[pA[k-1][0]+(pA[k][0]-pA[k-1][0])*q,pA[k-1][1]+(pA[k][1]-pA[k-1][1])*q];};
          for(let i=0;i<N;i++){const o=atA(clamp(dAt(a+i),0,totA)); xs[i]=o[0]; ys[i]=o[1];}
        }
        P.curveLine=lineX;
        const gsg=A.axis==='xy'?Math.max(1,(+A.motionBlurF||4)*.5):0.8, R=Math.ceil(3*gsg), kk=[]; let ks=0; for(let j=-R;j<=R;j++){const v=Math.exp(-j*j/(2*gsg*gsg));kk.push(v);ks+=v;}
        const sm=arr=>{const o=new Float64Array(N);for(let i=0;i<N;i++){let acc=0;for(let j=-R;j<=R;j++)acc+=arr[clamp(i+j,0,N-1)]*kk[j+R];o[i]=acc/ks;}return o;};
        const sx=sm(xs), sy=sm(ys); for(let i=0;i<N;i++){xs[i]=sx[i];ys[i]=sy[i];}
      } else {
      // goal sampled at sub-frame resolution, smoothed causally, then blended to rest
      const tau=Math.max(0,+A.motionBlurF), sub=4, NS=(N-1)*sub+1, gx=new Float64Array(NS), gy=new Float64Array(NS);
      for(let i=0;i<NS;i++){const o=goal(a+i/sub);gx[i]=o[0];gy[i]=o[1];}
      let cx=gx, cy=gy;
      if(tau>0){
        const R=Math.ceil(10*tau*sub), ker=new Float64Array(R+1); let ks=0;
        for(let j=0;j<=R;j++){const u=j/(tau*sub);ker[j]=u*Math.exp(-u);ks+=ker[j];}   // critically damped (2nd order) — smooth speed, no overshoot
        if(ks<=0){ker[0]=1;ks=1;}
        const conv=src=>{const o=new Float64Array(NS);for(let i=0;i<NS;i++){let acc=0;for(let j=0;j<=R;j++){acc+=src[Math.max(0,i-j)]*ker[j];}o[i]=acc/ks;}return o;};
        cx=conv(gx); cy=conv(gy);
      }
      const sS=Math.max(1,settleF), t0s=endF-sS;
      for(let i=0;i<N;i++){
        const t=a+i, j=i*sub; let x=cx[j], y=cy[j];
        if(t>t0s){const u=clamp((t-t0s)/sS,0,1), w=u*u*u*(u*(u*6-15)+10); x+= (finalO[0]-x)*w; y+=(finalO[1]-y)*w;}  // smootherstep: zero speed at the end
        xs[i]=x; ys[i]=y;
      }
      }
      if(WO){P.relT=Math.round(P.walkT+woLen);}   // walk-off: the camera follows for 'Keeps walking' frames, then lets the line run off
      if((relOn||WO)&&P.relT>a&&P.relT<b){
        // keep the velocity it has at the release point, then let it bleed away smoothly (no jolt) over relSlow frames
        const i0=P.relT-a, S=Math.max(2,Math.round(+A.relSlow||36));
        const vx=xs[i0]-xs[i0-1], vy=ys[i0]-ys[i0-1], x0=xs[i0], y0=ys[i0];
        for(let i=i0+1;i<N;i++){
          const u=Math.min(1,(i-i0)/S), f=S*(u-u*u*u+u*u*u*u/2);   // ∫(1-3u²+2u³): speed eases from v0 to 0
          xs[i]=x0+vx*f; ys[i]=y0+vy*f;
        }
      }
      if(cm==='follow'||cm==='curve'){
        // sampled every frame; only near-straight runs are merged (≤0.02px error) so the motion stays exact in AE
        const pts=[]; for(let i=0;i<N;i++) pts.push([a+i,[xs[i],ys[i]]]);
        cam=(DENSE_CAM?pts:simplify(pts,.02)).map(p=>[p[0],[r3(p[1][0]),r3(p[1][1])],'l']);
      } else {
        for(let i=0;i<N;i+=st) cam.push([a+i,[r3(xs[i]),r3(ys[i])],'h']);
        cam.push([b,[r3(xs[N-1]),r3(ys[N-1])],'h']);
      }
    } else {
      // step & settle (real frames): when a block appears, ease over to it and come to rest.
      // Blocks that arrive in quick succession are taken in one move (to the latest one), so moves never stutter.
      const fps=D.comp.fps||30, mm=Math.max(4,Math.round(fps*.25)), finLen=fin?Math.max(1,Math.round(A.finalMove)||30):0;
      const tEndAll=endF-(fin?finLen:0), keys=[[uT[0],uO[0],'e',CC]];
      let pos=uO[0], tFree=uT[0], k=1;
      while(k<=lastU){
        let j=k; while(j<lastU&&uT[j+1]<Math.max(uT[k],tFree)+mm) j++;      // gather the burst
        const t0=Math.max(uT[j],tFree); if(t0>=tEndAll) {pos=uO[lastU];break;}
        const nxt=j<lastU?uT[j+1]:tEndAll, dur=Math.max(mm,Math.min(tEndAll-t0,(nxt-t0)*.85));
        const t1=Math.min(tEndAll,t0+dur);
        if(t1-t0<1){pos=uO[j];k=j+1;continue;}
        keys.push([t0,pos,'e',CC],[t1,uO[j],'e',CC]); pos=uO[j]; tFree=t1; k=j+1;
      }
      if(pos!==uO[lastU]){const t0=Math.max(tFree,Math.min(uT[lastU],tEndAll-1)),t1=Math.max(t0+1,tEndAll);keys.push([t0,pos,'e',CC],[t1,uO[lastU],'e',CC]);tFree=t1;}
      if(fin){const t0=Math.max(tFree,endF-finLen);keys.push([t0,uO[lastU],'e',CC],[Math.max(t0+1,endF),fin,'e',CC]);}
      cam=dedupe(keys.map(q=>[Math.round(q[0]),q[1],q[2],q[3]]));
    }
    if(cam.every(k=>k[1][0]===0&&k[1][1]===0)) cam=[];
    P.cam=clip0(cam); if(cam.length) lastT=Math.max(lastT,cam[cam.length-1][0]);
    // reveal timing vs the camera: 'lead' = on schedule (blocks appear ahead, the camera follows them in);
    // 'arrive' = a block waits until the camera has brought it inside the reveal band of the frame, then appears
    if(cm==='curve'&&P.cam.length&&!(D.timing&&D.timing.sync)){
      /* curve camera: the camera leads, so each block appears while it's on screen — on its schedule if that's
         when it's visible, otherwise as soon as it enters (arrive: the reveal zone; ahead: the frame), before it leaves */
      const band=A.revealWhen==='arrive'?clamp(+A.revealX||70,50,120)/100:1, bandY=A.axis==='xy'?(A.revealWhen==='arrive'?clamp(+A.revealY||100,50,120)/100:1):1e6;
      const xl=G.W*(1-band), xr=G.W*band, yt=G.H*(1-bandY), yb=G.H*bandY;
      const scrAt=(t,px,py)=>{const off=ev(P.cam,t,[0,0]),s=ev(P.zs,t,100)/100,pn=ev(P.pan,t,[0,0]);return [G.W/2+s*(px+off[0]-G.W/2)+pn[0],G.H/2+s*(py+off[1]-G.H/2)+pn[1]];};
      const tBuild=Math.min(endF-1,Math.floor(W(L-Math.max(1,tr0))));   // build blocks are all in by the scene end
      let prev=-1e9;
      seq.forEach((b,i)=>{
        const walk=P.walkFrom!=null&&i>=P.walkFrom, tMax=walk?endF-1:tBuild;
        if(walk&&P.relT!=null&&P.T[i]>=P.relT){ P.T[i]=Math.max(P.T[i],prev); prev=P.T[i]; return; }   // after the camera lets go: keep the walk's rhythm
        const r=cellRect(G,b.c,b.r,b.w,b.h), px=r.x+r.w/2, py=r.y+r.h/2;
        // the camera carries each block onto the reveal line: it appears the frame it gets there
        // on its schedule if it's in the reveal zone then; otherwise the first frame the camera has it in the zone
        const inZ=t=>{const q=scrAt(t,px,py);return q[0]>=xl&&q[0]<=xr*1.015+2&&q[1]>=yt&&q[1]<=yb;};
        const lo=Math.max(startF,Math.round(prev)), sched=Math.max(lo,P.T[i]);
        let t=Math.max(lo,Math.min(sched,tMax));   // on its schedule (the build's last one right at the end), if it's in the zone then
        if(!inZ(t)){ let found=null; for(let k=walk?t:lo;k<=tMax;k++){ if(inZ(k)){found=k;break;} } if(found!=null) t=found; }   // walking blocks never come in before their schedule
        t=Math.min(tMax,Math.max(t,prev)); P.T[i]=Math.round(t); prev=P.T[i];
      });
    } else
    if(A.revealWhen==='arrive'&&P.cam.length){
      const band=clamp(+A.revealX||70,50,120)/100, bandY=A.axis==='xy'?clamp(+A.revealY||100,50,120)/100:1e6;  // sideways-only camera: height doesn't matter
      const xl=G.W*(1-band), xr=G.W*band, yt=G.H*(1-bandY), yb=G.H*bandY;
      const scrAt=(t,px,py)=>{const off=ev(P.cam,t,[0,0]),s=ev(P.zs,t,100)/100,pn=ev(P.pan,t,[0,0]);return [G.W/2+s*(px+off[0]-G.W/2)+pn[0],G.H/2+s*(py+off[1]-G.H/2)+pn[1]];};
      const tMax=WO?endF-1:Math.min(endF-1,Math.floor(W(L-Math.max(1,tr0))));   // a delayed reveal still finishes by the scene end
      let prev=-1e9; const T0=P.T.slice();
      seq.forEach((b,i)=>{
        if(P.relT!=null&&P.T[i]>=P.relT){ const gap=i>0?Math.max(0,T0[i]-T0[i-1]):0; P.T[i]=Math.min(tMax,Math.max(P.T[i],prev+gap)); prev=P.T[i]; return; }   // after the release: keep the schedule's rhythm
        const r=cellRect(G,b.c,b.r,b.w,b.h), px=r.x+r.w/2, py=r.y+r.h/2;
        let t=Math.max(P.T[i], A.revealOrder!==false?prev:-1e9), hit=false;
        // first frame its centre is inside the zone (or crosses it between frames); if it never gets there,
        // the frame it comes closest (never its off-screen schedule)
        let q0=null, best=null, bestD=1e18; const t0=t;
        for(;t<=tMax;t++){
          const q=scrAt(t,px,py), inX=q[0]>=xl&&q[0]<=xr, inY=q[1]>=yt&&q[1]<=yb;
          const crossX=q0&&((q0[0]<xl&&q[0]>xr)||(q0[0]>xr&&q[0]<xl)), crossY=q0&&((q0[1]<yt&&q[1]>yb)||(q0[1]>yb&&q[1]<yt));
          if((inX||crossX)&&(inY||crossY)){hit=true;break;}
          const dd=Math.max(inX||crossX?0:Math.min(Math.abs(q[0]-xl),Math.abs(q[0]-xr)), inY||crossY?0:Math.min(Math.abs(q[1]-yt),Math.abs(q[1]-yb)));
          if(dd<bestD-.5){bestD=dd;best=t;}
          q0=q;
        }
        if(!hit) t=best!=null?best:Math.max(t0,Math.min(tMax,prev));
        P.T[i]=Math.round(t); prev=P.T[i];
      });
    }
  }

  // per-block timing: hand offsets from the timeline (frames, keyed by block id) shift single reveals
  P.T0=P.T.slice();
  { const DT=A.dt||{}; if(Object.keys(DT).length) seq.forEach((b,i)=>{const d=+DT[b.id]||0; if(d) P.T[i]=Math.round(P.T[i]+d);}); }
  // per-block reveal keys: built on the linear clock (so reveal speed follows the scene easing), then re-timed
  const steps=m=>{const o=[];for(let j=1;j<=m;j++)o.push(j/m);return o;};
  const zeroS=S(0);
  seq.forEach((b,i)=>{
    const s0=sg[gi[i]], tR=P.T[i], tr=tr0, r=cellRect(G,b.c,b.r,b.w,b.h), K={op:[],sc:[],rs:[],rp:[],top:[]}, pre=tR>0;
    // shift so the re-timed start lands exactly on the (one-at-a-time) reveal frame
    const sOff=S(tR)-s0, s=s0+sOff;
    const hide=Math.min(zeroS,s-1);
    if(A.appear==='cut'){ if(pre) K.op=[[hide,0,'h'],[s,100,'h']]; }
    else if(A.appear==='fade'){
      if(stop){const m=Math.max(1,Math.round(tr/st));if(pre)K.op.push([hide,0,'h']);steps(m).forEach((u,j)=>K.op.push([s+j*st,r3(100*u),'h']));}
      else K.op=[[s,0,'e',RC],[s+tr,100,'e',RC]];
    } else if(A.appear==='scale'){
      if(stop){const m=Math.max(1,Math.round(tr/st));if(pre)K.sc.push([hide,[0,0],'h']);steps(m).forEach((u,j)=>K.sc.push([s+j*st,[r3(100*u),r3(100*u)],'h']));}
      else K.sc=[[s,[0,0],'e',RC],[s+tr,[100,100],'e',RC]];
    } else if(A.appear==='wipe'){
      if(stop){
        if(pre){K.rs.push([hide,[0,r3(r.h)],'h']);K.rp.push([hide,[r3(-r.w/2),0],'h']);}
        for(let j=1;j<=b.w;j++){const sw=j*G.p-G.gut,t=s+(j-1)*st;K.rs.push([t,[r3(sw),r3(r.h)],'h']);K.rp.push([t,[r3(-(r.w-sw)/2),0],'h']);}
      } else {
        K.rs=[[s,[0,r3(r.h)],'e',RC],[s+tr,[r3(r.w),r3(r.h)],'e',RC]];
        K.rp=[[s,[r3(-r.w/2),0],'e',RC],[s+tr,[0,0],'e',RC]];
      }
    }
    ['op','sc','rs','rp'].forEach(k=>{K[k]=warpKeys(K[k]);});
    const done=Math.max(tR,...['op','sc','rs'].map(k=>K[k].length?K[k][K[k].length-1][0]:tR));
    if(b.text){
      if(A.appear==='cut'||A.appear==='fade') K.top=K.op.slice();
      else if(A.appear==='wipe') K.top=done>0?[[0,0,'h'],[done,100,'h']]:[];
    }
    ['op','sc','rs','rp','top'].forEach(k=>{K[k]=clip0(K[k]); if(K[k].length===1&&!(tR>0)) K[k]=[];});
    P.tracks[b.id]=K; P.done=P.done||[]; P.done[i]=done;
    lastT=Math.max(lastT,done);
  });
  // exits (un-reveal): appended after the reveal, in real frames
  P.exitT=exitTimes(P,G,seq,P.done||[]);
  // a retimed block takes its exit with it (it moves as a whole); 'Shift out' (dx) moves just the exit
  if(P.exitT){ const XM=D.exit.mode; seq.forEach((b,i)=>{ if(P.exitT[i]==null) return; const sh=(XM==='walk'||XM==='end')?(P.T[i]-P.T0[i]):0, d=+((A.dx||{})[b.id])||0;
    if(sh||d) P.exitT[i]=Math.max(Math.round(((P.done||[])[i]||P.T[i]))+1,Math.round(P.exitT[i]+sh+d)); }); }
  if(P.exitT){
    seq.forEach((b,i)=>{const tE=P.exitT[i]; if(tE==null) return; const K=P.tracks[b.id], r=cellRect(G,b.c,b.r,b.w,b.h);
      const fin=exitKeys(K,tE,r,D.exit,stop,st,!!b.text); lastT=Math.max(lastT,fin); });
  }
  // block numbers: visible with the block; with a wipe they wait until the wipe has reached the corner
  seq.forEach((b,i)=>{
    const K=P.tracks[b.id]; if(!K) return; const done=(P.done||[])[i]||P.T[i], tE=P.exitT?P.exitT[i]:null, X=D.exit;
    let nk=[];
    if(A.appear==='wipe') nk=done>0?[[Math.min(0,done-1),0,'h'],[done,100,'h']]:[];
    else if(A.appear==='cut') nk=K.op.filter(k=>k[2]==='h'&&(tE==null||k[0]<tE)).map(k=>k.slice());
    else if(A.appear==='fade') nk=K.op.filter(k=>tE==null||k[0]<tE).map(k=>k.slice());
    if(tE!=null){
      if(X.style==='fade'&&!stop){const XC=(X.curve||[0.5,0,0.75,0]).map(Number);nk.push([tE,100,'e',XC],[tE+Math.max(1,+X.len||8),0,'e',XC]);}
      else if(X.style==='wipe'&&X.dir!=='back') nk.push([tE+Math.max(1,+X.len||8)-1,0,'h']);
      else { if(!nk.length) nk.push([Math.min(0,tE-1),100,'h']); nk.push([tE,0,'h']); }
    }
    K.num=clip0(nk); if(K.num.length===1&&!(P.T[i]>0)&&tE==null) K.num=[];
  });
  P.lab=labPlan(P,G,seq,stop,st);
  // column rules: stay, or fade off once the walk-off starts (or after the scene)
  P.ruleOp=[];
  if(D.look.rulesOn&&D.look.ruleEnd==='fade'){const t0=Math.round((P.walkT!=null?P.walkT:startF+L)+(+D.look.ruleFadeAt||0)), len=Math.max(1,Math.round(+D.look.ruleFadeLen||24));
    P.ruleOp=clip0([[Math.min(0,t0-1),100,'h'],[t0,100,'e',[0.4,0,0.6,1]],[t0+len,0,'e',[0.4,0,0.6,1]]]); lastT=Math.max(lastT,t0+len);}
  // every track: time-sorted, one key per frame (a later key at the same frame wins)
  const tidy=tr=>{if(!tr||tr.length<2)return tr;const s=tr.map((k,i)=>[k,i]).sort((x,y)=>x[0][0]-y[0][0]||x[1]-y[1]).map(x=>x[0]);const o=[];s.forEach(k=>{if(o.length&&Math.abs(o[o.length-1][0]-k[0])<1e-6)o[o.length-1]=k;else o.push(k);});return o;};
  Object.values(P.tracks).forEach(K=>Object.keys(K).forEach(k=>{K[k]=tidy(K[k]);}));
  P.echo.forEach(e=>Object.keys(e.K).forEach(k=>{e.K[k]=tidy(e.K[k]);}));
  P.lab.pulses.concat(P.lab.trails,P.lab.bars).forEach(x=>Object.keys(x.K).forEach(k=>{x.K[k]=tidy(x.K[k]);}));
  if(P.lab.end) lastT=Math.max(lastT,P.lab.end);
  // echoes: a styled copy behind each block, appearing with, before (lead) or after (trail) it
  if(D.echo.on){
    const E=D.echo, op=clamp(+E.opacity||0,0,100)/100;
    echoTargets(seq).forEach(b=>{
      const i=seq.indexOf(b), tB=P.T[i], off=Math.max(0,Math.round(+E.offset||0));
      const te=E.timing==='before'?tB-off:E.timing==='after'?tB+off:tB, r=echoRect(G,b);
      const K=revealKeys(E.appear,te,tr0,r,b.w,G,stop,st,RC);
      K.op=K.op.map(k=>[k[0],r3(k[1]*op),k[2],k[3]]);
      if(E.out!=='stay'){
        const tIn=te+(E.appear==='cut'?0:tr0);
        let tOut=tIn+Math.max(0,Math.round(+E.hold||0));
        const lastK=K.op.length?K.op[K.op.length-1][0]:-1e9; if(tOut<=lastK) tOut=lastK+1;
        if(E.out==='fade') K.op.push([tOut,r3(100*op),'e',RC],[tOut+Math.max(1,Math.round(+E.outF||1)),0,'e',RC]);
        else K.op.push([tOut,r3(100*op),'h'],[tOut+1,0,'h']);
        lastT=Math.max(lastT,tOut+Math.max(1,Math.round(+E.outF||1)));
      }
      ['op','sc','rs','rp'].forEach(k=>{K[k]=clip0(K[k]); if(K[k].length===1&&!(te>0)&&!(k==='op'&&E.out!=='stay')) K[k]=[];});
      if(P.exitT&&D.exit.echo!==false&&E.out==='stay'){const tE=P.exitT[i]; if(tE!=null){exitKeys(K,tE,r,D.exit,stop,st,false); lastT=Math.max(lastT,tE+(+D.exit.len||8));}}
      P.echo.push({id:'e'+b.id,src:b,rect:r,K});
      lastT=Math.max(lastT,te+tr0);
    });
  }
  // content (auto-fill) starts once each block has finished appearing
  P.fillBase={}; P.fillEnd={};
  if(D.fill.on){
    const dl=Math.max(0,Math.round(+D.fill.anim.delay||0));
    seq.forEach((b,i)=>{P.fillBase[b.id]=P.T[i]+tr0+dl;});
    if(P.exitT&&D.exit.content!==false){seq.forEach((b,i)=>{if(P.exitT[i]!=null){P.fillEnd[b.id]=P.exitT[i];P.fillEnd['e'+b.id]=P.exitT[i];}});}
    P.echo.forEach(e=>{const i=seq.indexOf(e.src);P.fillBase[e.id]=(e.K.op.length?e.K.op[0][0]:P.T[i])+tr0+dl;});
    // 'Until Out': content holds through In and Hold and goes when the blocks' Out starts
    { const X=D.exit; let fo=null; if(X.on&&X.mode==='walk'&&P.walkT!=null) fo=P.walkT; else if(X.on&&P.exitT&&P.exitT.some(v=>v!=null)) fo=Math.min(...P.exitT.filter(v=>v!=null)); P.fillOut=fo;
      if(D.fill.anim.anchor==='leave'&&P.exitT){ seq.forEach((b,i)=>{ if(P.exitT[i]!=null){ P.fillEnd[b.id]=P.exitT[i]; P.fillEnd['e'+b.id]=P.exitT[i]; } }); }
      if(fo!=null&&D.fill.anim.anchor==='phases'){ seq.forEach(b=>{ P.fillEnd[b.id]=Math.min(P.fillEnd[b.id]!=null?P.fillEnd[b.id]:Infinity,fo); P.fillEnd['e'+b.id]=Math.min(P.fillEnd['e'+b.id]!=null?P.fillEnd['e'+b.id]:Infinity,fo); }); } }
    // global window (timeline knobs): nothing comes on before 'all on', everything is gone by 'all off'
    { const WN=D.fill.win||{}; if(WN.on!=null) Object.keys(P.fillBase).forEach(id=>{P.fillBase[id]=Math.max(P.fillBase[id],+WN.on);});
      if(WN.off!=null){ const ids=seq.map(b=>b.id).concat(seq.map(b=>'e'+b.id)).concat(P.echo.map(e=>e.id)); ids.forEach(id=>{P.fillEnd[id]=Math.min(P.fillEnd[id]!=null?P.fillEnd[id]:Infinity,+WN.off);}); } }
    if(D.fill.gap.on){
      const gl=gapItems(G,seq).map(it=>Object.assign({},it));
      const GA=D.fill.gap.anim||{}, own=GA.own!==false, gdl=own?Math.round(+GA.delay||0):dl, jit=own?Math.max(0,Math.round(+GA.jitter||0)):0, A2=gapA();
      gl.forEach((it,k)=>{let best=null;seq.forEach((b,i)=>{const d=Math.abs(b.c-it.col);if(!best||d<best.d)best={d,t:P.T[i],e:P.exitT&&(D.exit.content!==false||A2.anchor==='leave')?P.exitT[i]:null};});
        it.t0=(best?best.t:0)+tr0+gdl+(jit?Math.round(rng(k*7919+31+(D.fill.gap.seed|0))()*jit):0); it.A=A2; if(best&&best.e!=null&&(!own||GA.leaveWith!==false||A2.anchor==='leave'))it.tEnd=best.e; if(A2.anchor==='phases'&&P.fillOut!=null) it.tEnd=Math.min(it.tEnd!=null?it.tEnd:Infinity,P.fillOut); { const GW=D.fill.gap.win||{}; if(GW.on!=null) it.t0=Math.max(it.t0,+GW.on); if(GW.off!=null) it.tEnd=Math.min(it.tEnd!=null?it.tEnd:Infinity,+GW.off); }});
      P.gaps=gl;
    }
  }
  P.end=Math.max(1,Math.ceil(lastT)+Math.max(0,Math.round(A.tail)||0));
  return P;
}
/* ------------------------------------------------------------------ transitions (screen-space, fill the frame) */
function transPlan(G){
  const fps=D.comp.fps||30, compF=Math.round((D.comp.dur||10)*fps), out={tiles:[],end:0,groups:[]};
  ['in','out'].forEach(k=>{
    const T=D.trans&&D.trans[k]; if(!T||!T.on) return;
    const bw=Math.max(1,Math.round(T.w)||Math.round(D.block.w)||1), bh=Math.max(1,Math.round(T.h)||Math.round(D.block.h)||1);
    const c0=Math.floor((0-G.x0)/G.p)-1, c1=Math.ceil((G.W-G.x0)/G.p)+1, r0=Math.floor((0-G.y0)/G.p)-1, r1=Math.ceil((G.H-G.y0)/G.p)+1;
    const tiles=[], walk=T.pattern==='walk';
    // walk: tiles sit on the scene's own grid (where the camera has it when the transition starts),
    // and sweep in the direction the line walks with a stepped, block-shaped front
    let sx=0, sy=0;
    if(walk&&D.anim.mode!=='static'){ const P=plan(G), st0=k==='out'&&T.atEnd?compF-Math.max(1,Math.round(T.dur)||24):Math.round(+T.start||0), o=ev(P.cam,st0,[0,0]);
      sx=((o[0]%G.p)+G.p)%G.p; sy=D.anim.axis==='xy'?((o[1]%G.p)+G.p)%G.p:0; }
    for(let r=r0;r<r1+1;r+=bh) for(let c=c0-1;c<c1;c+=bw){
      const q=cellRect(G,c,r,bw,bh); q.x+=sx; q.y+=sy;
      const x=T.cover?q.x-G.gut/2:q.x, y=T.cover?q.y-G.gut/2:q.y, w=T.cover?q.w+G.gut:q.w, h=T.cover?q.h+G.gut:q.h;
      if(x>G.W||y>G.H||x+w<0||y+h<0) continue;
      tiles.push({c,r,x,y,w,h,cells:bw});
    }
    if(!tiles.length) return;
    const rev=T.dir==='rev'||(walk&&D.anim.order==='rtl'), cx=G.W/2, cy=G.H/2, rnd=rng(fillHash(77,T.seed|0));
    // walk: each row-band lags the one above by a random step (±1 block), like the line's own walk
    const lag={}; if(walk){ let v=0; for(let r=r0;r<r1+1;r+=bh){ lag[r]=v; const u=rnd(); v+=u<.36?-1:u<.72?1:0; } }
    tiles.forEach(t=>{const mx=t.x+t.w/2,my=t.y+t.h/2;
      t.v=T.pattern==='rows'?t.r:T.pattern==='diag'?t.c/bw+t.r/bh:T.pattern==='center'?Math.hypot((mx-cx)/G.W,(my-cy)/G.H):T.pattern==='random'?rnd():walk?t.c/bw+lag[t.r]*1.2+rnd()*.35:t.c;
      if(rev) t.v=-t.v;});
    const vmin=Math.min(...tiles.map(t=>t.v)), vmax=Math.max(...tiles.map(t=>t.v)), inv=invCurve(T.curve||[0.33,0,0.67,1]);
    const dur=Math.max(1,Math.round(T.dur)||24), len=Math.max(1,Math.min(dur,Math.round(T.len)||8));
    const start=k==='out'&&T.atEnd?compF-dur:Math.round(+T.start||0);
    const color=T.output==='matte'?'#FFFFFF':T.color, crnd=rng(fillHash(91,T.seed|0)); let ci=0;
    tiles.forEach(t=>{ const tc=T.output!=='matte'&&T.blockColors?mixColorFor(ci++,crnd,T.color):color;
      const u=vmax>vmin?(t.v-vmin)/(vmax-vmin):0, t0=Math.round(start+(dur-len)*inv(u)), r={x:t.x,y:t.y,w:t.w,h:t.h,k:0};
      const K=T.mode==='build'?revealKeys(T.appear,t0,len,r,t.cells,G,false,1,[0.25,0.1,0.25,1]):vanishKeys(T.appear,t0,len,r);
      out.tiles.push({g:k,x:t.x,y:t.y,w:t.w,h:t.h,color:tc,K});
    });
    out.groups.push({k,output:T.output,start,dur,count:tiles.length});
    out.end=Math.max(out.end,start+dur);
  });
  return out;
}
/* the reverse of a reveal: blocks start on screen and go */
function vanishKeys(appear,t0,len,r){
  const K={op:[],sc:[],rs:[],rp:[],top:[]}, RC=[0.25,0.1,0.25,1];
  if(appear==='cut') K.op=t0>0?[[0,100,'h'],[t0,0,'h']]:[[0,0,'h']];
  else if(appear==='fade') K.op=[[t0,100,'e',RC],[t0+len,0,'e',RC]];
  else if(appear==='scale') K.sc=[[t0,[100,100],'e',RC],[t0+len,[0,0],'e',RC]];
  else { K.rs=[[t0,[r3(r.w),r3(r.h)],'e',RC],[t0+len,[0,r3(r.h)],'e',RC]]; K.rp=[[t0,[0,0],'e',RC],[t0+len,[r3(r.w/2),0],'e',RC]]; }
  ['op','sc','rs','rp'].forEach(k=>{K[k]=clip0(K[k]);});
  return K;
}
let transCache={k:'',v:null};
/* a tile colour under the block colour-mix rule (transition 'use the block colours') */
function mixColorFor(i,rnd,fallback){const B=D.block;if(B.mix==='alternate'||B.mix==='cycle'){const cs=modeColors();return cs[i%cs.length];}if(B.mix==='random'||B.mix==='updown'){const cs=B.mix==='updown'?[B.color,B.upColor,B.downColor]:modeColors();return cs[Math.floor(rnd()*cs.length)%cs.length];}return B.color||fallback;}
function transP(G){const walkT=D.trans&&((D.trans.in&&D.trans.in.pattern==='walk')||(D.trans.out&&D.trans.out.pattern==='walk'));
  const key=JSON.stringify(D.trans)+JSON.stringify(D.block)+JSON.stringify(D.grid)+D.comp.w+D.comp.h+D.comp.fps+D.comp.dur+(walkT?JSON.stringify(D.anim)+JSON.stringify(D.exit):'');if(transCache.k!==key)transCache={k:key,v:transPlan(G)};return transCache.v;}
function sceneEnd(G){const P=plan(G),T=transP(G);return Math.max(P.end||0,T.end?T.end+12:0,1);}
function transOn(){return !!(D.trans&&((D.trans.in&&D.trans.in.on)||(D.trans.out&&D.trans.out.on)));}

/* ------------------------------------------------------------------ echo helpers */
function echoTargets(list){
  const E=D.echo; if(!E.on) return [];
  const l=list.slice().sort((a,b)=>a.order-b.order);
  return E.last>0?l.slice(Math.max(0,l.length-E.last)):l;
}
function echoRect(G,b){
  const E=D.echo, q=cellRect(G,b.c+Math.round(+E.dx||0),b.r+Math.round(+E.dy||0),b.w,b.h);
  const k=E.stroke?(E.align==='outer'?1:E.align==='inner'?-1:0)*(+E.sw||0):0;
  return {x:q.x-k/2,y:q.y-k/2,w:q.w+k,h:q.h+k,k,src:b};
}
/* reveal keys in real frames for a rect (used by echoes) */
function revealKeys(appear,t0,tr,r,cellsW,G,stop,st,RC){
  const K={op:[],sc:[],rs:[],rp:[],top:[]}, pre=t0>0, steps=m=>{const o=[];for(let j=1;j<=m;j++)o.push(j/m);return o;};
  if(appear==='cut'){ if(pre) K.op=[[0,0,'h'],[t0,100,'h']]; }
  else if(appear==='fade'){
    if(stop){const m=Math.max(1,Math.round(tr/st));if(pre)K.op.push([0,0,'h']);steps(m).forEach((u,j)=>K.op.push([t0+j*st,r3(100*u),'h']));}
    else K.op=[[t0,0,'e',RC],[t0+tr,100,'e',RC]];
  } else if(appear==='scale'){
    if(stop){const m=Math.max(1,Math.round(tr/st));if(pre)K.sc.push([0,[0,0],'h']);steps(m).forEach((u,j)=>K.sc.push([t0+j*st,[r3(100*u),r3(100*u)],'h']));}
    else K.sc=[[t0,[0,0],'e',RC],[t0+tr,[100,100],'e',RC]];
  } else if(appear==='wipe'){
    if(stop){
      if(pre){K.rs.push([0,[0,r3(r.h)],'h']);K.rp.push([0,[r3(-r.w/2),0],'h']);}
      for(let j=1;j<=cellsW;j++){const sw=j*G.p-G.gut+(r.k||0),t=t0+(j-1)*st;K.rs.push([t,[r3(sw),r3(r.h)],'h']);K.rp.push([t,[r3(-(r.w-sw)/2),0],'h']);}
    } else {
      K.rs=[[t0,[0,r3(r.h)],'e',RC],[t0+tr,[r3(r.w),r3(r.h)],'e',RC]];
      K.rp=[[t0,[r3(-r.w/2),0],'e',RC],[t0+tr,[0,0],'e',RC]];
    }
  }
  return K;
}
/* exit (un-reveal): append keys that take a fully shown block away at tE. r = rect of the block. */
function exitKeys(K,tE,r,X,stop,st,hasText){
  const len=Math.max(1,Math.round(+X.len||8)), XC=(X.curve||[0.5,0,0.75,0]).map(Number), sty=X.style||'fade';
  const after=(tr)=>!tr.length||tr[tr.length-1][0]<tE;
  const steps=m=>{const o=[];for(let j=1;j<=m;j++)o.push(j/m);return o;};
  if(sty==='cut'){ if(after(K.op)){ if(!K.op.length) K.op.push([Math.min(tE-1,0),100,'h']); K.op.push([tE,0,'h']); } }
  else if(sty==='fade'){
    if(after(K.op)){ if(stop){const m=Math.max(1,Math.round(len/st));K.op.push([tE,100,'h']);steps(m).forEach((u,j)=>K.op.push([tE+(j+1)*st,r3(100*(1-u)),'h']));}
      else K.op.push([tE,100,'e',XC],[tE+len,0,'e',XC]); }
  } else if(sty==='scale'){
    if(after(K.sc)){ if(stop){const m=Math.max(1,Math.round(len/st));K.sc.push([tE,[100,100],'h']);steps(m).forEach((u,j)=>K.sc.push([tE+(j+1)*st,[r3(100*(1-u)),r3(100*(1-u))],'h']));}
      else K.sc.push([tE,[100,100],'e',XC],[tE+len,[0,0],'e',XC]); }
  } else if(sty==='slide'){ // the block keeps travelling: slides onward (or back) and fades away at the end
    const sgn=X.dir==='back'?-1:1, dist=sgn*r.w*Math.max(.1,+X.slide||1.5);
    if(after(K.rp)){ if(stop){const m=Math.max(1,Math.round(len/st));K.rp.push([tE,[0,0],'h']);steps(m).forEach((u,j)=>K.rp.push([tE+(j+1)*st,[r3(dist*u),0],'h']));}
      else K.rp.push([tE,[0,0],'e',XC],[tE+len,[r3(dist),0],'e',XC]); }
    if(after(K.op)){ const f0=tE+Math.round(len*.55); if(!K.op.length) K.op.push([Math.min(0,tE-1),100,'h']); K.op.push([f0,100,'e',XC],[tE+len,0,'e',XC]); }
  } else { // wipe: the block collapses toward the travel direction ('same') or back where it came from
    const sgn=X.dir==='back'?-1:1;
    if(after(K.rs)&&after(K.rp)){
      if(stop){const m=Math.max(1,Math.round(len/st));K.rs.push([tE,[r3(r.w),r3(r.h)],'h']);K.rp.push([tE,[0,0],'h']);
        steps(m).forEach((u,j)=>{K.rs.push([tE+(j+1)*st,[r3(r.w*(1-u)),r3(r.h)],'h']);K.rp.push([tE+(j+1)*st,[r3(sgn*r.w*u/2),0],'h']);});}
      else { K.rs.push([tE,[r3(r.w),r3(r.h)],'e',XC],[tE+len,[0,r3(r.h)],'e',XC]); K.rp.push([tE,[0,0],'e',XC],[tE+len,[r3(sgn*r.w/2),0],'e',XC]); }
    }
  }
  if(hasText){ // the block's own text goes when the exit starts (or fades with it)
    if(sty==='fade'&&!stop) K.top.push([tE,100,'e',XC],[tE+len,0,'e',XC]);
    else { if(!K.top.length) K.top.push([Math.min(tE-1,0),100,'h']); K.top.push([tE,0,'h']); }
  }
  return tE+(sty==='cut'?0:len);
}
/* ---- LAB: experimental momentum effects. Everything is keyed in real frames, same keys drive preview + AE ---- */
const EO=[0.16,0.84,0.3,1];   // fast attack, soft settle
function labPlan(P,G,seq,stop,st){
  const LB=D.lab||{}, out={pulses:[],trails:[],bars:[],end:0}; if(D.anim.mode==='static') return out;
  const hid=t=>Math.min(0,t-1);
  seq.forEach((b,i)=>{
    if(b.echo) return;
    const K=P.tracks[b.id], r=cellRect(G,b.c,b.r,b.w,b.h), tR=P.T[i], done=(P.done||[])[i]||tR, tE=P.exitT?P.exitT[i]:null;
    // flicker: the block stutters on like a bad signal before it holds
    if(LB.flicker&&LB.flicker.on&&K){
      const F=Math.max(2,Math.round(+LB.flicker.frames||8)), rnd=rng(fillHash(b.id,(+LB.flicker.seed||3)*977)), keep=K.op.filter(k=>k[0]>done+F);
      const fk=[[hid(tR),0,'h']]; let v=1; for(let f=0;f<F;f++){fk.push([tR+f,v?100:Math.round(rnd()*25),'h']); v=rnd()<(f<F/2?.55:.75)?1:0;} fk.push([tR+F,100,'h']);
      K.op=clip0(fk.concat(keep)); if(D.anim.appear==='fade') K.top=K.op.slice();
    }
    if(LB.pulse&&LB.pulse.on){ const L=Math.max(2,Math.round(+LB.pulse.len||18)), t0=Math.round(done), S=Math.max(1,+LB.pulse.scale||1.35)*100;
      out.pulses.push({id:b.id,r,t0,len:L,K:{op:clip0([[hid(t0),0,'h'],[t0,100,'e',EO],[t0+L,0,'e',EO]]),sc:clip0([[t0,[100,100],'e',EO],[t0+L,[r3(S),r3(S*(1+(S/100-1)*r.w/Math.max(1,r.h)*.0))],'e',EO]])}}); out.end=Math.max(out.end,t0+L); }
    if(LB.trail&&LB.trail.on){ const L=Math.max(2,Math.round(+LB.trail.len||12)), t0=Math.round(tR), n=Math.max(1,Math.round(+LB.trail.count||3)), len=r.w*Math.max(.1,+LB.trail.length||1.2), gap=Math.max(2,G.gut*2), lw=Math.max(1,+LB.trail.width||2);
      const lines=[]; for(let k=0;k<n;k++){const y=r.y+r.h*(k+1)/(n+1), f=1-.25*((k*7+b.id)%3); lines.push([r3(r.x-gap-len*f),r3(y-lw/2),r3(len*f),lw]);}
      out.trails.push({id:b.id,r,t0,len:L,anchor:[r3(r.x-gap),r3(r.y+r.h/2)],lines,K:{op:clip0([[hid(t0),0,'h'],[t0,100,'e',EO],[t0+L,0,'e',EO]]),sc:clip0([[t0,[100,100],'e',EO],[t0+L,[0,100],'e',EO]])}}); out.end=Math.max(out.end,t0+L); }
    if(LB.bar&&LB.bar.on){ const L=Math.max(2,Math.round(+LB.bar.len||24)), t0=Math.round(done), h=Math.max(1,+LB.bar.height||3), pad=Math.max(8,Math.min(28,Math.min(r.w,r.h)*.08));
      const opk=[[hid(t0),0,'h'],[t0,100,'h']]; if(tE!=null) opk.push([tE,0,'h']);
      out.bars.push({id:b.id,r,t0,len:L,x:r3(r.x+pad),y:r3(r.y+r.h-pad-h),w:r3(r.w-2*pad),h,K:{op:clip0(opk),sc:clip0([[t0,[0,100],'e',[0.65,0,0.35,1]],[t0+L,[100,100],'e',[0.65,0,0.35,1]]])}}); out.end=Math.max(out.end,t0+L); }
  });
  return out;
}
/* screen-space lab layers (ticker + snow) at frame t */
function tickerText(){const s=[];const r=rng(4242);for(let i=0;i<14;i++){s.push(pickR(r,BITS.shortTx)+'  '+pickR(r,BITS.status));s.push(pickR(r,BITS.blocks.filter(x=>/^BLOCK/.test(x))).replace(/\s+/g,' '));}return fillCase(s.join('   ///   '));}
function snowParts(G){const S=D.lab.snow, r=rng(fillHash(77,(+S.seed||9))), n=Math.max(1,Math.min(400,Math.round(+S.count||90))), o=[];
  for(let i=0;i<n;i++) o.push({x0:r()*G.W,y0:r()*G.H,v:(+S.speed||240)*(.45+r()*.9),s:Math.max(.5,(+S.size||2)*(.5+r())),ph:r()*6.28,amp:4+r()*10});
  return o;}
function drawLabWorld(g,L,t,dx,dy,alpha){
  if(!L) return; const LB=D.lab;
  g.save();
  L.trails.forEach(T=>{const op=ev(T.K.op,t,0)/100, sx=ev(T.K.sc,t,[100,100])[0]/100; if(op<=0.002||sx<=0.002) return;
    g.globalAlpha=alpha*op; g.fillStyle=LB.trail.color; const ax=T.anchor[0]+dx;
    T.lines.forEach(l=>{const w=l[2]*sx; g.fillRect(ax-w,l[1]+dy,w,l[3]);});});
  L.pulses.forEach(Pp=>{const op=ev(Pp.K.op,t,0)/100, s=ev(Pp.K.sc,t,[100,100])[0]/100; if(op<=0.002) return;
    const r=Pp.r, cx=r.x+r.w/2+dx, cy=r.y+r.h/2+dy, lw=Math.max(.5,+LB.pulse.width||2);
    g.globalAlpha=alpha*op; g.strokeStyle=LB.pulse.color; g.lineWidth=lw; g.strokeRect(cx-r.w*s/2,cy-r.h*s/2,r.w*s,r.h*s);});
  L.bars.forEach(B=>{const op=ev(B.K.op,t,0)/100, sx=ev(B.K.sc,t,[0,100])[0]/100; if(op<=0.002||sx<=0.002) return;
    g.globalAlpha=alpha*op; g.fillStyle=LB.bar.color; g.fillRect(B.x+dx,B.y+dy,B.w*sx,B.h);});
  g.restore();
}
const labScreenOn=()=>!!(D.lab&&((D.lab.ticker&&D.lab.ticker.on)||(D.lab.snow&&D.lab.snow.on)));
function drawLabScreen(g,G,t){
  const LB=D.lab||{}, fps=D.comp.fps||30, sec=(t||0)/fps;
  if(LB.snow&&LB.snow.on){const S=LB.snow, Wd=G.W+40, dir=S.dir==='right'?1:-1, k=Math.max(1,+S.stretch||1);
    g.save(); g.globalAlpha=clamp(+S.opacity||55,0,100)/100; g.fillStyle=S.color;
    snowParts(G).forEach(p=>{let x=p.x0+dir*p.v*sec; x=((x%Wd)+Wd)%Wd-20; const y=p.y0+Math.sin(sec*.9+p.ph)*p.amp; g.fillRect(x-p.s*k/2,y-p.s/2,p.s*k,p.s);});
    g.restore();}
  if(LB.ticker&&LB.ticker.on){const T=LB.ticker, sz=Math.max(6,+T.size||14), y=G.H*clamp(+T.y||94,0,100)/100, txt=tickerText();
    g.save(); g.font=cssFont(D.fill.family,D.fill.style,sz); const w=g.measureText(txt).width;
    if(T.band){g.fillStyle=T.bandColor;g.fillRect(0,y-sz*.9,G.W,sz*1.8);}
    const x=G.W-((sec*(+T.speed||160))%(w+G.W)); g.fillStyle=T.color; g.textBaseline='middle'; g.fillText(txt,x,y); g.restore();}
}
/* ==================================================================== ASSISTANT (Claude, with tools)
   Talks to Claude through the Vercel proxy (/api/assistant, key kept on the server) or directly with a personal API key.
   The model can read the current setup, change settings by path, and run actions — every change is one undo step. */
const AI={busy:false,msgs:[],log:[],errors:[]};
const aiStore={get(k){try{return localStorage.getItem('gridblocks.ai.'+k);}catch(e){return null;}},set(k,v){try{localStorage.setItem('gridblocks.ai.'+k,v);}catch(e){}}};
window.addEventListener&&window.addEventListener('error',e=>{AI.errors.push(String(e.message||e.error||e).slice(0,300));if(AI.errors.length>20)AI.errors.shift();});
const _toast=toast; toast=function(msg,kind,u){AI.log.push(String(msg).slice(0,200));if(AI.log.length>20)AI.log.shift();return _toast(msg,kind,u);};
const AI_MODELS=[['claude-sonnet-5-5','Sonnet 5.5 (balanced)'],['claude-opus-5-5','Opus 5.5 (smartest)'],['claude-haiku-5-5','Haiku 5.5 (fastest)']];
const AI_SECTIONS={comp:'composition size, fps, duration',grid:'rows, gutter, margin, columns mode (bleed/fit/custom), off-screen area',look:'background, grid lines, square tiles, column rules',
  block:'default block size and colours',rand:'layout generator (walk/stairs/scatter…, count, seed, stairs/jumps/pairs %)',echo:'echo copies behind blocks',
  fill:'auto-fill content: modules, icons, density, font, dots, content animation (fill.anim.*: on / hold / off, live hold)',num:'block numbers (top-right)',
  anim:'animation: mode (static/reveal/camera/push), scene start/length/easing (sceneCurve = cubic-bezier [x1,y1,x2,y2]), camera (camMove curve/follow/step, axis, smoothing, let-go relOn/relAt/relSlow), reveal style (appear/trans/revCurve), reveal zone (revealWhen/revealX), keep building (extendOn/extendMode/ending), order, grid zoom',
  exit:'blocks leaving: on, mode (hold/walk/behind/end), style (cut/fade/wipe/slide/scale), timings',trans:'full-frame transitions in/out',lab:'experimental effects (flicker, pulse, trail, bar, ticker, snow)',
  timing:'sound sync (beats/markers/offset/sync)',out:'After Effects build options (precomps, folders, motion blur, rig)'};
function aiSystem(){
  return `You are the built-in assistant for "Grid Blocks", Ava Labs' tool for building animated block-grid overlays (Avalanche brand) that export to After Effects.
You can see and change the user's current setup through tools. Work like a careful motion designer:
- Before changing anything, call get_state (and list_settings for the section you need) so you use exact paths and valid values.
- Change settings with set_values (several at once is fine). Use exact paths like "anim.lenF". Keep value types (numbers stay numbers, booleans stay booleans, curves are 4-number arrays).
- Use run_action for things that aren't a single setting (generate a layout, shuffle content, play the preview, retime, jump to a step…).
- Frames are in the comp's fps (D.comp.fps). Times like "2 seconds" → frames.
- After changes, say briefly what you did and how to see it (e.g. "press ▶"). Everything is undoable with ⌘Z.
- For troubleshooting, read get_state (it includes warnings, recent messages and errors) and explain the cause in plain words, then offer or apply a fix.
- Brand: dark #1F1F1F, Avalanche Red #E6212F, slate #A2AFB2; fonts Aeonik / Aeonik Fono. Don't use #E84142.
Sections of the setup: ${Object.keys(AI_SECTIONS).map(k=>k+' = '+AI_SECTIONS[k]).join('; ')}.
Steps of the tool, in order: ${STEPS.map((s,i)=>i+':'+s.id+' ('+s.name+')').join(', ')}.
The timeline under the canvas is the main editing surface: the Scene row (build length + easing), Camera, Transitions, content overlay rows, then one row per block. Per-block timing offsets live in anim.dt / anim.dx (frames, keyed by block id). A line is generated from a seed (anim.extendOn=true, one seed block); it becomes editable blocks once the user drags one.`;
}
const AI_TOOLS=[
  {name:'get_state',description:'Current setup summary: key settings, how many blocks, scene timing, camera, warnings, recent messages and errors.',input_schema:{type:'object',properties:{}}},
  {name:'list_settings',description:'List every setting under a section prefix (e.g. "anim", "fill.anim", "exit") with its current value and what it does.',input_schema:{type:'object',properties:{prefix:{type:'string'}},required:['prefix']}},
  {name:'set_values',description:'Change one or more settings by exact path. Applied together as one undo step.',input_schema:{type:'object',properties:{changes:{type:'array',items:{type:'object',properties:{path:{type:'string'},value:{}},required:['path','value']}}},required:['changes']}},
  {name:'run_action',description:'Run an action. generate_layout (new walk layout from the rules), shuffle_layout (new random seed), shuffle_content, clear_blocks, reset_defaults (blank canvas), load_example (Avalanche HUD example), go_to_step (value = step index or id), play, stop, set_playhead (value = frame), retime (value = factor, e.g. 1.5 = 50% longer), fit_to_comp.',
   input_schema:{type:'object',properties:{action:{type:'string',enum:['generate_layout','shuffle_layout','shuffle_content','clear_blocks','reset_defaults','load_example','go_to_step','play','stop','set_playhead','retime','fit_to_comp']},value:{}},required:['action']}}
];
function aiState(){
  const G=geom(), P=plan(G), fps=D.comp.fps||30, warn=[];
  const A=D.anim;
  if(A.mode!=='static'&&A.camMove==='follow') warn.push('Camera is "Glide behind": it trails the blocks and always eases in gently, ignoring a fast-start easing. "Follow the easing" (anim.camMove="curve") follows the scene curve exactly.');
  if(!D.blocks.length) warn.push('No blocks in the layout yet.');
  if(A.mode!=='static'&&P.end>(D.comp.dur||10)*fps) warn.push(`Animation (${P.end}f) is longer than the comp (${Math.round((D.comp.dur||10)*fps)}f).`);
  if(A.extendOn&&A.ending==='spot'&&P.endReach===false) warn.push('End row can\'t be reached with this many blocks.');
  const missing=Object.keys(U.fontState||{}).filter(k=>U.fontState[k]==='missing'); if(missing.length) warn.push('Fonts not available: '+missing.join(', '));
  const pick=(o,keys)=>{const r={};keys.forEach(k=>{r[k]=o[k];});return r;};
  return {step:STEPS[U.step].id, playhead:U.t, inAfterEffects:inAE,
    comp:D.comp, grid:D.grid, look:D.look,
    blocks:{inLayout:D.blocks.length, animated:P.seq?P.seq.length:0, sizes:[...new Set(D.blocks.map(b=>b.w+'x'+b.h))].slice(0,6), colours:[...new Set(D.blocks.map(b=>b.color))].slice(0,6)},
    anim:pick(A,['mode','order','startF','lenF','toEnd','countMode','pace','total','trans','appear','motion','camMove','axis','sceneCurve','revealWhen','revealX','relOn','relAt','relSlow','extendOn','extendMode','ending','zoomOn','lazy','smooth','motionBlurF','settle']),
    scene:{startF:P.startF,endF:P.startF+P.L,previewEnd:P.end,firstReveal:P.T&&P.T[0],lastReveal:P.T&&P.T[P.T.length-1],cameraLetGoAt:P.relT},
    exit:D.exit, fill:{on:D.fill.on,density:D.fill.density,font:D.fill.family+' '+D.fill.style,anim:D.fill.anim}, num:D.num, trans:{in:pick(D.trans.in,['on','mode','start','dur']),out:pick(D.trans.out,['on','mode','start','dur','atEnd'])},
    lab:Object.keys(D.lab||{}).filter(k=>D.lab[k].on), timing:{cues:timingCues().length,sync:D.timing.sync,media:D.timing.media},
    warnings:warn, recentMessages:AI.log.slice(-6), errors:AI.errors.slice(-6)};
}
function aiListSettings(prefix){
  const out=[]; prefix=String(prefix||'').replace(/^D\./,'');
  const walk=(o,p)=>{Object.keys(o).forEach(k=>{const v=o[k],path=p?p+'.'+k:k;
    if(v&&typeof v==='object'&&!Array.isArray(v)) walk(v,path);
    else if(path.indexOf(prefix)===0&&!/^blocks|^palette/.test(path)){const h=HELP[path];out.push(path+' = '+JSON.stringify(v)+(h?' — '+String(h).replace(/<[^>]+>/g,''):''));}});};
  walk(D,''); return out.slice(0,220).join('\n')||'No settings under "'+prefix+'". Sections: '+Object.keys(AI_SECTIONS).join(', ');
}
function aiSetValues(changes){
  const ok=[],bad=[]; if(!Array.isArray(changes)||!changes.length) return 'No changes given.';
  pushHist();
  changes.forEach(c=>{const p=String(c.path||'').replace(/^D\./,''), cur=getP(p);
    if(cur===undefined||/^blocks/.test(p)){bad.push(p+' (unknown setting)');return;}
    let v=c.value;
    if(typeof cur==='number'){v=+v;if(!isFinite(v)){bad.push(p+' (needs a number)');return;}}
    else if(typeof cur==='boolean'){v=v===true||v==='true'||v===1;}
    else if(Array.isArray(cur)){if(!Array.isArray(v)){bad.push(p+' (needs a list)');return;}}
    else if(typeof cur==='string'){v=String(v);if(/^#[0-9a-f]{6}$/i.test(cur)&&!/^#[0-9a-f]{6}$/i.test(v)){bad.push(p+' (needs a #RRGGBB colour)');return;}}
    setP(p,v); ok.push(p+' → '+JSON.stringify(v)); try{onChange(p);}catch(e){}
  });
  planCache.k=''; fillCache.clear(); syncInputs(true); syncPalettes(); refresh(); U._mediaUI=0;
  return (ok.length?'Changed: '+ok.join('; '):'')+(bad.length?(ok.length?'\n':'')+'Not changed: '+bad.join('; '):'');
}
function aiAction(a,v){
  switch(a){
    case 'generate_layout': if(STEPS[U.step].id!=='layout'){U.ctx=null;goStep(SI('layout'));} generateLine(false); return 'Generated a new walking line ('+plan(geom()).seq.length+' blocks, seed '+D.rand.seed+').';
    case 'shuffle_layout': generateLine(true); return 'New seed '+D.rand.seed+' ('+plan(geom()).seq.length+' blocks).';
    case 'shuffle_content': pushHist(true); D.fill.seed=(D.fill.seed|0)+1; fillCache.clear(); refresh(); return 'Shuffled the content.';
    case 'clear_blocks': pushHist(); D.blocks=[]; U.selIds=[]; refresh(); return 'Cleared all blocks.';
    case 'reset_defaults': resetDefaults(); return 'Reset to the blank default.';
    case 'load_example': loadExample(); return 'Loaded the Avalanche HUD example.';
    case 'go_to_step': {const i=typeof v==='number'?v:STEPS.findIndex(s=>s.id===v||s.name.toLowerCase()===String(v).toLowerCase()); if(i<0||i>=STEPS.length) return 'Unknown step.'; goStep(i); return 'Now on '+STEPS[i].name+'.';}
    case 'play': play(); return 'Playing the preview.';
    case 'stop': stopPlay(); return 'Stopped.';
    case 'set_playhead': stopPlay(); U.t=Math.max(0,Math.round(+v||0)); render(); try{drawDope();}catch(e){} return 'Playhead at frame '+U.t+'.';
    case 'retime': {const k=+v; if(!(k>0)) return 'retime needs a factor > 0.'; retime(k); return 'Retimed ×'+k+'; scene is '+D.anim.lenF+' frames.';}
    case 'fit_to_comp': {const fps=D.comp.fps||30,t=Math.round((D.comp.dur||10)*fps)-Math.max(0,D.anim.startF); retime(t/Math.max(1,D.anim.lenF)); return 'Scene now fills the comp ('+D.anim.lenF+' frames).';}
  }
  return 'Unknown action.';
}
async function aiCall(body){
  const key=aiStore.get('key')||'', pass=aiStore.get('pass')||'', model=aiStore.get('model')||AI_MODELS[0][0];
  body.model=model;
  const direct=!!key||!inWeb;
  const url=direct?'https://api.anthropic.com/v1/messages':'api/assistant';
  const headers={'content-type':'application/json'};
  if(direct){ if(!key) throw new Error('Add your Anthropic API key in the assistant settings (⚙).'); headers['x-api-key']=key; headers['anthropic-version']='2023-06-01'; headers['anthropic-dangerous-direct-browser-access']='true'; }
  else if(pass) headers['x-gb-pass']=pass;
  const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
  const txt=await r.text(); let j=null; try{j=JSON.parse(txt);}catch(e){}
  if(!r.ok) throw new Error((j&&j.error&&(j.error.message||j.error))||('HTTP '+r.status+(direct?'':' from the site’s /api/assistant — set ANTHROPIC_API_KEY in Vercel, or add your own key in ⚙')));
  return j;
}
async function aiSend(text){
  if(AI.busy||!text.trim()) return;
  AI.busy=true; AI.msgs.push({role:'user',content:text}); aiRender(); aiAddUI('user',text);
  try{
    for(let round=0;round<10;round++){
      const res=await aiCall({max_tokens:2048,system:aiSystem(),tools:AI_TOOLS,messages:AI.msgs});
      AI.msgs.push({role:'assistant',content:res.content});
      const texts=(res.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n').trim(); if(texts) aiAddUI('assistant',texts);
      const uses=(res.content||[]).filter(c=>c.type==='tool_use'); if(res.stop_reason!=='tool_use'||!uses.length) break;
      const results=uses.map(u=>{let out='';try{
        if(u.name==='get_state') out=JSON.stringify(aiState());
        else if(u.name==='list_settings') out=aiListSettings(u.input.prefix);
        else if(u.name==='set_values'){out=aiSetValues(u.input.changes);aiAddUI('tool',out);}
        else if(u.name==='run_action'){out=aiAction(u.input.action,u.input.value);aiAddUI('tool',out);}
        else out='Unknown tool';}catch(e){out='Error: '+e.message;}
        return {type:'tool_result',tool_use_id:u.id,content:String(out).slice(0,12000)};});
      AI.msgs.push({role:'user',content:results});
    }
  }catch(e){ aiAddUI('error',e.message); AI.msgs.pop(); }
  // keep the conversation small: drop old turns (always starting on a plain user message)
  while(AI.msgs.length>24){AI.msgs.shift();while(AI.msgs.length&&!(AI.msgs[0].role==='user'&&typeof AI.msgs[0].content==='string'))AI.msgs.shift();}
  AI.busy=false; aiRender();
}
function aiAddUI(kind,text){
  const box=$('#aiMsgs'); if(!box) return;
  const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>');
  box.insertAdjacentHTML('beforeend',`<div class="aim ${kind}">${kind==='tool'?'⚙ ':''}${md(text)}</div>`); box.scrollTop=box.scrollHeight;
}
function aiRender(){
  const d=$('#aiDrawer'); if(!d) return;
  $('#aiSend').disabled=AI.busy; $('#aiBusy').hidden=!AI.busy;
  const via=aiStore.get('key')?'your API key':inWeb?'the team proxy (Vercel)':'— add an API key in ⚙';
  $('#aiVia').textContent='Claude · '+((AI_MODELS.find(m=>m[0]===(aiStore.get('model')||AI_MODELS[0][0]))||AI_MODELS[0])[1])+' · via '+via;
}
function aiInit(){
  const d=$('#aiDrawer'); if(!d||!d.addEventListener) return;
  $('#btnAI').onclick=()=>{d.hidden=!d.hidden; if(!d.hidden){aiRender(); setTimeout(()=>$('#aiIn').focus(),50); if(!$('#aiMsgs').children.length) aiAddUI('assistant','Hi! Tell me what to build ("a walking line of red blocks that ends on row 3, then walks off") or ask why something looks wrong. I can change settings, generate layouts and play the preview — everything is one ⌘Z away.');}};
  $('#aiClose').onclick=()=>{d.hidden=true;};
  $('#aiSend').onclick=()=>{const t=$('#aiIn').value;$('#aiIn').value='';aiSend(t);};
  $('#aiIn').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#aiSend').click();} e.stopPropagation();});
  $('#aiQuick').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b)aiSend(b.dataset.q);});
  $('#aiGear').onclick=()=>{const s=$('#aiSettings');s.hidden=!s.hidden;$('#aiKey').value=aiStore.get('key')||'';$('#aiPass').value=aiStore.get('pass')||'';$('#aiModel').innerHTML=AI_MODELS.map(m=>`<option value="${m[0]}"${m[0]===(aiStore.get('model')||AI_MODELS[0][0])?' selected':''}>${m[1]}</option>`).join('');};
  $('#aiSave').onclick=()=>{aiStore.set('key',$('#aiKey').value.trim());aiStore.set('pass',$('#aiPass').value.trim());aiStore.set('model',$('#aiModel').value);$('#aiSettings').hidden=true;aiRender();toast('Assistant settings saved');};
  $('#aiReset').onclick=()=>{AI.msgs=[];$('#aiMsgs').innerHTML='';aiAddUI('assistant','New conversation. What should we make?');};
}

/* ==================================================================== SOUND / MEDIA SYNC */
function timingCues(){
  const T=D.timing; if(!T) return [];
  const off=Math.round(+T.offset||0), src=(T.use==='markers'?T.markers:T.use==='both'?(T.beats||[]).concat(T.markers||[]):T.beats)||[];
  return [...new Set(src.map(f=>Math.round(f+off)))].sort((x,y)=>x-y);
}
/* onsets from a per-frame energy envelope: rises well above the local average, at least minGap frames apart */
function detectBeats(env,sens,minGap){
  const n=env.length, out=[], W=12; if(n<3) return out;
  const flux=env.map((v,i)=>i?Math.max(0,v-env[i-1]):0);
  for(let i=1;i<n-1;i++){
    let s=0,s2=0,c=0; for(let j=Math.max(0,i-W);j<=Math.min(n-1,i+W);j++){s+=flux[j];s2+=flux[j]*flux[j];c++;}
    const m=s/c, sd=Math.sqrt(Math.max(0,s2/c-m*m));
    if(flux[i]>m+sens*sd&&flux[i]>=flux[i-1]&&flux[i]>=flux[i+1]&&flux[i]>1e-4){
      if(out.length&&i-out[out.length-1]<minGap){ if(flux[i]>flux[out[out.length-1]]) out[out.length-1]=i; }
      else out.push(i);
    }
  }
  return out;
}
U.media=null;
async function loadMediaFile(file){
  if(!file) return; const fps=D.comp.fps||30, url=URL.createObjectURL(file), isV=/^video\//.test(file.type);
  const el=document.createElement(isV?'video':'audio'); el.src=url; el.preload='auto'; el.muted=false; if(isV){el.playsInline=true;}
  await new Promise(res=>{el.onloadedmetadata=res;el.onerror=res;});
  const m={name:file.name,kind:isV?'video':'audio',el,dur:el.duration||0,peaks:null,env:null};
  U.media=m;
  try{ // waveform + per-frame energy (needs the audio track)
    const buf=await file.arrayBuffer(), AC=window.AudioContext||window.webkitAudioContext, ac=new AC(), ab=await ac.decodeAudioData(buf);
    const ch=ab.getChannelData(0), sr=ab.sampleRate, nF=Math.ceil(ab.duration*fps), env=new Array(nF).fill(0), per=sr/fps;
    for(let f=0;f<nF;f++){let s=0;const a0=Math.floor(f*per),a1=Math.min(ch.length,Math.floor((f+1)*per));for(let k=a0;k<a1;k+=2)s+=ch[k]*ch[k];env[f]=Math.sqrt(s/Math.max(1,(a1-a0)/2));}
    const mx=Math.max(1e-6,...env); m.env=env.map(v=>v/mx); m.peaks=m.env; m.dur=ab.duration; try{ac.close();}catch(e){}
  }catch(e){ m.peaks=null; }
  pushHist(true); D.timing.media={name:file.name,dur:r3(m.dur),kind:m.kind};
  if(m.env){D.timing.beats=detectBeats(m.env,+D.timing.sens||1.3,+D.timing.minGap||4);}
  renderMedia(); refresh(); toast(`Loaded ${file.name}`,m.env?`${D.timing.beats.length} beats found`:'no audio track to analyse',true);
}
function reBeat(){ if(U.media&&U.media.env){ pushHist(true); D.timing.beats=detectBeats(U.media.env,+D.timing.sens||1.3,+D.timing.minGap||4); planCache.k=''; renderMedia(); refresh(); } }
/* preview playback: keep the media in step with the preview clock */
function mediaSync(playing){
  const m=U.media; if(!m||!m.el) return; const fps=D.comp.fps||30, t=((U.t||0)-(+D.timing.offset||0))/fps;
  try{
    m.el.muted=!D.timing.sound;
    if(playing){ if(t>=0&&t<m.dur){ if(Math.abs(m.el.currentTime-t)>.08) m.el.currentTime=t; if(m.el.paused) m.el.play().catch(()=>{}); } else if(!m.el.paused) m.el.pause(); }
    else { if(!m.el.paused) m.el.pause(); if(m.kind==='video'&&t>=0&&t<m.dur) m.el.currentTime=t; }
  }catch(e){}
}
function drawMediaBg(g,G){
  const m=U.media; if(!m||m.kind!=='video'||!D.timing.video||!m.el||m.el.readyState<2) return;
  g.save(); g.globalAlpha=clamp(+D.timing.videoOpacity||60,0,100)/100;
  const vw=m.el.videoWidth||16, vh=m.el.videoHeight||9, s=Math.max(G.W/vw,G.H/vh); g.drawImage(m.el,(G.W-vw*s)/2,(G.H-vh*s)/2,vw*s,vh*s); g.restore();
}
/* AE: read the active comp — markers, length, frame rate, and (optionally) the beat of its audio */
async function readAEComp(analyse){
  const r=String(await evalHost('GB_readComp('+(analyse?'true':'false')+')'));
  if(r.indexOf('OK|')!==0){toast(r.replace(/^ERR\|/,''),'','err');return;}
  let o=null; try{o=JSON.parse(r.slice(3));}catch(e){toast('Could not read the comp','','err');return;}
  const fps=D.comp.fps||o.fps||30; pushHist(true);
  D.timing.markers=(o.markers||[]).map(t=>Math.round(t*fps));
  if(o.amp&&o.amp.length){const mx=Math.max(1e-6,...o.amp);const env=o.amp.map(v=>v/mx);U.media={name:o.audioName||'comp audio',kind:'audio',el:null,dur:o.amp.length/fps,peaks:env,env};D.timing.beats=detectBeats(env,+D.timing.sens||1.3,+D.timing.minGap||4);D.timing.media={name:U.media.name+' (from AE)',dur:r3(U.media.dur),kind:'audio'};}
  if(!D.timing.beats.length&&D.timing.markers.length) D.timing.use='markers';
  renderMedia(); refresh();
  toast(`Read “${o.name}”`,`${D.timing.markers.length} markers${o.amp?` · ${D.timing.beats.length} beats`:''}`,true);
}
function renderMedia(){
  const box=$('#mediaBox'); if(!box) return; const T=D.timing, m=U.media, fps=D.comp.fps||30, cues=timingCues();
  box.innerHTML=`
    <div class="row-btns"><button class="btn" id="btnMedia">${m?'Replace':'Load'} audio / video…</button>${inAE?'<button class="btn" id="btnReadAE" title="Comp markers, length, and the beat of the first audio layer">Use the AE timeline</button>':''}</div>
    ${T.media?`<div class="note"><b style="color:var(--text)">${esc(T.media.name)}</b> · ${(+T.media.dur||0).toFixed(2)}s${m?'':' · reload the file to hear / see it again'}</div>`:'<div class="note">Load a music track, VO or reference cut. It plays with the preview and its beats can drive the reveals.'+(inAE?' In After Effects, “Use the AE timeline” reads your comp’s markers and the beat of its audio.':'')+'</div>'}
    ${m&&m.kind==='video'?`<label class="check"><input type="checkbox" data-bind="timing.video"> Show the video behind the grid</label><div class="field" data-show="timing.video=true"><span class="lbl scrub">Video</span><div class="num"><input type="number" data-bind="timing.videoOpacity" min="0" max="100" step="5"><span class="unit">%</span></div></div>`:''}
    ${m&&m.el?'<label class="check"><input type="checkbox" data-bind="timing.sound"> Play sound with the preview</label>':''}
    <div class="field2"><div class="field"><span class="lbl scrub" title="Shift the media (and its cues) in frames">Offset</span><div class="num"><input type="number" data-bind="timing.offset" min="-99999" max="99999" step="1"><span class="unit">fr</span></div></div>
      <div class="field"><span class="lbl scrub" title="Higher = only the strongest hits count as beats">Beat strictness</span><div class="num"><input type="number" data-bind="timing.sens" min="0.3" max="4" step="0.1"></div></div></div>
    <div class="field"><span class="lbl scrub" title="Minimum frames between two beats">Min beat gap</span><div class="num"><input type="number" data-bind="timing.minGap" min="1" max="120" step="1"><span class="unit">fr</span></div></div>
    <div class="field stack"><span class="lbl">Cues</span><div class="seg" data-seg="timing.use"><button data-v="beats">Beats (${(T.beats||[]).length})</button><button data-v="markers">Markers (${(T.markers||[]).length})</button><button data-v="both">Both</button></div></div>
    <label class="check"><input type="checkbox" data-bind="timing.sync"${cues.length?'':' disabled'}> Snap block reveals to the cues</label>
    <div class="row-btns">${T.media?'<button class="btn" id="btnMediaLen" title="Scene runs for the length of the media">Scene = media length</button>':''}${cues.length?'<button class="btn" id="btnClearCues">Clear cues</button>':''}</div>
    <div class="note">${cues.length?`${cues.length} cues (blue lines on the timeline)${T.sync?' — reveals snap to them':''}.`:'No cues yet.'} ${m&&m.kind==='video'?'':''}</div>`;
  bindIn(box);
  const bm=box.querySelector('#btnMedia'); if(bm) bm.onclick=()=>$('#mediaIn').click();
  const ba=box.querySelector('#btnReadAE'); if(ba) ba.onclick=()=>readAEComp(confirm('Also analyse the beat of the first audio layer? (Adds a temporary keyframe layer, then removes it.)'));
  const bl=box.querySelector('#btnMediaLen'); if(bl) bl.onclick=()=>{pushHist();D.anim.lenF=Math.max(2,Math.round(D.timing.media.dur*fps)-Math.max(0,D.anim.startF)+(+D.timing.offset||0));D.anim.toEnd=false;syncInputs(true);refresh();};
  const bc=box.querySelector('#btnClearCues'); if(bc) bc.onclick=()=>{pushHist();D.timing.beats=[];D.timing.markers=[];D.timing.sync=false;renderMedia();refresh();};
  syncInputs(true);
}

/* ==================================================================== TIMING: master retime + dope sheet */
const TIME_PATHS=['anim.startF','anim.lenF','anim.remapLen','anim.trans','anim.settle','anim.relSlow','anim.finalMove','anim.stepEvery',
  'trans.in.start','trans.in.dur','trans.in.len','trans.out.start','trans.out.dur','trans.out.len',
  'exit.hold','exit.at','exit.stagger','exit.len','exit.walkHold','exit.walkLen','look.ruleFadeAt','look.ruleFadeLen',
  'fill.anim.delay','fill.anim.stagger','fill.anim.hold','fill.anim.outDur','fill.anim.inDur','fill.anim.countDur','fill.anim.scrDur',
  'echo.offset','echo.hold','echo.outF',
  'lab.flicker.frames','lab.pulse.len','lab.trail.len','lab.bar.len'];
/* stretch every timing in the piece by k (reveal pace follows the scene length); speeds scale the other way */
function retime(k){
  if(!(k>0)||Math.abs(k-1)<1e-4) return;
  pushHist();
  TIME_PATHS.forEach(p=>{const v=getP(p); if(typeof v==='number'&&isFinite(v)) setP(p,p==='anim.lenF'||p==='trans.in.dur'||p==='trans.out.dur'?Math.max(2,Math.round(v*k)):Math.round(v*k));});
  D.anim.pace=Math.max(1,Math.round((+D.anim.pace||5)*k));
  D.fill.anim.cps=Math.max(1,Math.round((+D.fill.anim.cps||40)/k));
  D.fill.anim.liveRate=Math.max(.5,Math.round((+D.fill.anim.liveRate||6)/k*2)/2);
  (D.anim.zoom||[]).forEach(z=>{['f0','f1','dur','off'].forEach(f=>{if(typeof z[f]==='number')z[f]=Math.round(z[f]*k);});});
  if(D.lab&&D.lab.ticker) D.lab.ticker.speed=Math.round((+D.lab.ticker.speed||160)/k);
  if(D.timing&&Array.isArray(D.timing.beats)) {} // beats are real-time cues, they don't stretch
  planCache.k=''; fillCache.clear(); syncInputs(true); refresh();
  const fps=D.comp.fps||30; toast(`Retimed ×${(+k).toFixed(2)} — scene is now ${D.anim.lenF}f (${(D.anim.lenF/fps).toFixed(2)}s)`,'⌘Z to undo',true);
}
/* Pace & holds readout: rhythm → block count → camera speed */
function renderPace(){
  const el=$('#paceRead'), cp=$('#camPair'); if(!el) return;
  const G=geom(), P=plan(G), fps=D.comp.fps||30, A=D.anim;
  if(A.mode==='static'||!P.seq||!P.seq.length){el.innerHTML='Pick an animation style and add blocks to see the pace.';if(cp)cp.innerHTML='';return;}
  let dist=0,moving=0; if(P.cam.length){for(let f=P.startF;f<P.startF+P.L;f++){const a=ev(P.cam,f,[0,0]),b=ev(P.cam,f+1,[0,0]);const s=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s>.05){dist+=s;moving++;}}}
  const build=P.walkFrom!=null?P.seq.slice(0,P.walkFrom):P.seq, n=build.filter(b=>!b.echo&&!b.stack).length, nW=P.walkFrom!=null?P.seq.length-P.walkFrom:0, sp=moving?dist/moving*fps:0;
  el.innerHTML=`<b>${n}</b> blocks over ${(P.L/fps).toFixed(2)}s · one every <b>${(P.L/Math.max(1,n)).toFixed(1)}f</b>${nW?` · then <b>${nW}</b> more walking off`:''}`+(P.cam.length?`<br>Camera ≈ <b>${Math.round(sp)} px/s</b> (${(sp/G.p).toFixed(1)} columns a second) while moving`:'');
  if(cp){ if(A.mode==='camera'||A.mode==='push'){
      cp.innerHTML=A.camMove==='curve'?'<div class="note">✓ Camera paired to the blocks — its speed follows the rhythm and the scene easing.</div>':'<div class="row-btns"><button class="btn" id="btnPair">Pair the camera to the blocks</button></div><div class="note">The camera is on “'+(A.camMove==='step'?'Step &amp; settle':'Glide behind')+'”, so it reacts to the blocks instead of moving with them.</div>';
      const b=cp.querySelector('#btnPair'); if(b) b.onclick=()=>{pushHist();D.anim.camMove='curve';D.anim.motion='smooth';syncInputs(true);refresh();};
    } else cp.innerHTML=''; }
}
/* ==================================================================== TIMELINE (v3: the main editing surface)
   Rows: ruler · sound · scene (build bar + easing you can drag) · camera · transitions · content overlays · blocks.
   One row per block underneath: drag a bar to retime that block, drag its right end to change when it leaves.
   Clicking a row opens its settings in the properties panel. */
const TL={f0:null,f1:null,scrollY:0,blocksOpen:true,drag:null,hover:null,LW:150,items:[],rows:[],frozen:null};
const DOPE=TL;   // older name, still used by a few helpers
const BLOCK_RH=13, ROWS={ruler:22,sound:30,scene:92,phases:24,camera:30,trans:26,content:20,blocks:24};
function dopeRange(){const G=geom(),fps=D.comp.fps||30,Pq=plan(G);return Math.max(sceneEnd(G),Pq.c&&Pq.c.end?Pq.c.end:0,Math.round((D.comp.dur||10)*fps),D.timing&&D.timing.media?Math.round(D.timing.media.dur*fps):0,10);}
function tlView(){
  if(TL.frozen) return TL.frozen;
  const N=dopeRange(), P=plan(geom()), lo=Math.min(0,P.startF||0,D.trans&&D.trans.in&&D.trans.in.on?+D.trans.in.start||0:0);
  if(TL.f0==null||TL.f1==null){ const NN=Math.max(N,TL.autoN||0); TL.autoN=NN; return {f0:lo-Math.max(2,NN*.01),f1:NN+Math.max(4,NN*.02)}; }
  return {f0:TL.f0,f1:TL.f1};
}
function tlFit(){TL.f0=TL.f1=null;TL.autoN=0;drawDope();try{updTlZoom();}catch(e){}}
const tlSelIds=()=>{const s=new Set((U.dopeSel||[]).concat(U.selIds||[]));return [...s];};
function tlContentRows(){
  const r=[];
  if(D.fill.on) r.push({k:'hud',name:'Text HUD',tab:'hud'});
  if(D.fill.on&&D.fill.gap&&D.fill.gap.on) r.push({k:'gaps',name:'Between blocks',tab:'gaps'});
  if(D.num&&D.num.on) r.push({k:'numbers',name:'Numbers',tab:'numbers'});
  if(D.echo&&D.echo.on) r.push({k:'echo',name:'Echo',tab:'echo'});
  if(!r.length) r.push({k:'none',name:'Content',tab:'hud'});
  return r;
}
function drawDope(){
  const c=$('#dopeCv'); if(!c) return; const r=c.getBoundingClientRect(); if(!r.width||!r.height) return;
  const dpr=window.devicePixelRatio||1; if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}
  const g=c.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,r.width,r.height);
  const G=geom(), P=plan(G), Pc=P.c||P, fps=D.comp.fps||30, N=dopeRange(), LW=TL.LW, Wt=Math.max(40,r.width-LW-8), V0=tlView();
  const X=f=>LW+(f-V0.f0)/(V0.f1-V0.f0)*Wt, F=x=>V0.f0+(x-LW)/Wt*(V0.f1-V0.f0);
  TL.X=X; TL.F=F; TL.N=N; TL.P=P; TL.items=[]; TL.rows=[]; TL.W=r.width; TL.H=r.height;
  const item=o=>TL.items.push(o);
  const anim=D.anim.mode!=='static', camOn=anim&&(D.anim.mode==='camera'||D.anim.mode==='push'), media=U.media&&U.media.peaks;
  // ---- layout of rows
  let y=0; const row=(k,h,o)=>{const R=Object.assign({k,y0:y,y1:y+h,h},o||{});TL.rows.push(R);y+=h;return R;};
  row('ruler',ROWS.ruler);
  if(media) row('sound',ROWS.sound,{name:'Sound',ctx:'sound'});
  row('scene',ROWS.scene,{name:'Scene · time remap',ctx:'scene'});
  row('trans',ROWS.trans,{name:'Transitions',ctx:'trans'});
  TL.contentY0=y;
  if(anim) row('phases',ROWS.phases,{name:'Blocks · in hold out',ctx:'inout'});
  if(camOn) row('camera',ROWS.camera,{name:'Camera',ctx:'camera'});
  tlContentRows().forEach(cr=>row('content',ROWS.content,{name:cr.name,tab:cr.tab,ck:cr.k}));
  const hdr=row('blocks',ROWS.blocks,{name:'Blocks',stage:'layout'});
  // everything under the ruler scrolls up/down together (wheel over the block rows, or Space-drag)
  const n=P.seq.length, listH=TL.blocksOpen?n*BLOCK_RH+6:0, totalH=y+listH;
  TL.scrollY=clamp(TL.scrollY,0,Math.max(0,totalH-r.height+4));
  if(TL.scrollY){ TL.rows.forEach(R=>{ if(R.k==='ruler') return; R.y0-=TL.scrollY; R.y1-=TL.scrollY; }); TL.contentY0-=TL.scrollY; }
  const top=hdr.y1, bottom=r.height;
  TL.listY0=Math.max(top,ROWS.ruler); TL.listTop=top; TL.listY1=bottom; TL.totalH=totalH;
  // ---- backgrounds + labels
  g.font='11px sans-serif'; g.textBaseline='middle';
  TL.rows.forEach((R,i)=>{ if(R.k==='ruler') return;
    const on=(U.ctx&&R.ctx&&(R.ctx===U.ctx||(R.ctx==='trans'&&/^trans/.test(U.ctx))))||(R.k==='content'&&STEPS[U.step].id==='content'&&U.ctab===R.tab&&!U.ctx);
    g.fillStyle=on?'rgba(230,33,47,.09)':(i%2?'rgba(255,255,255,.018)':'rgba(255,255,255,.034)'); g.fillRect(0,R.y0,r.width,R.h);
    g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(0,R.y1-1,r.width,1);
    g.fillStyle=on?'#ececef':'#a2a2ab'; g.font=(R.k==='scene'||R.k==='blocks'?'600 ':'')+'11px sans-serif';
    let lab=R.name; if(R.k==='blocks') lab=`${TL.blocksOpen?'▾':'▸'}  Blocks · ${P.seq.length}`;
    if(R.k==='content'&&LAYER_COL[R.ck]){g.fillStyle=LAYER_COL[R.ck];g.fillRect(0,R.y0+3,3,R.h-6);g.fillStyle=on?'#ececef':'#a2a2ab';}
    g.fillText(lab,10,R.k==='scene'?R.y0+14:R.y0+R.h/2);
    if(R.k==='scene'){g.fillStyle='#686871';g.font='10px sans-serif';g.fillText('length + easing for all',10,R.y0+30);g.fillText(D.anim.sceneEase&&D.anim.sceneEase.on?'drag the squares':'dbl-click adds a point',10,R.y0+43);}
  });
  g.fillStyle='#17171a'; g.fillRect(LW-1,ROWS.ruler,1,r.height);
  // ---- clip to the track area
  g.save(); g.beginPath(); g.rect(LW,0,r.width-LW,r.height); g.clip();
  const compF=Math.round((D.comp.dur||10)*fps);
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(X(compF),ROWS.ruler,Math.max(0,r.width-X(compF)),r.height); g.fillRect(LW,ROWS.ruler,Math.max(0,X(0)-LW),r.height);
  const knob=(f,y0,h,col)=>{const x=X(f);g.fillStyle=col;g.beginPath();if(g.roundRect)g.roundRect(x-3.5,y0+2,7,h-4,3);else g.rect(x-3.5,y0+2,7,h-4);g.fill();g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x-.5,y0+h/2-4,1,8);};
  const H=(f,R,cur,apply,tip)=>item({type:'handle',x:X(f),y0:R.y0,y1:R.y1,cur,apply,tip,f});
  const label=(t,x,yy,col)=>{g.fillStyle=col||'#ececef';g.font='600 10px sans-serif';g.fillText(t,x,yy);};
  // ---- sound
  const RS=TL.rows.find(R=>R.k==='sound');
  if(RS){const pk=U.media.peaks, d=U.media.dur*fps, off=+(D.timing.offset||0); g.fillStyle='rgba(162,175,178,.6)';
    for(let px=LW;px<r.width;px++){const f=F(px)-off; if(f<0||f>d) continue; const v=pk[Math.min(pk.length-1,Math.floor(f/d*pk.length))]||0; g.fillRect(px,RS.y0+RS.h/2-v*RS.h*.42,1,Math.max(1,v*RS.h*.84));}}
  // ---- SCENE = the time-remap layer: its length is the scene, its curve maps scene time → block time
  const RSc=TL.rows.find(R=>R.k==='scene'), RPh=TL.rows.find(R=>R.k==='phases');
  if(anim&&P.seq.length){
    const s0=P.startF, s1=P.startF+P.R, yb=RSc.y0+6, hb=RSc.h-12, rem=!!P.remapped;
    g.fillStyle='rgba(230,33,47,.18)'; g.fillRect(X(s0),yb,X(s1)-X(s0),hb); g.strokeStyle='rgba(230,33,47,.8)'; g.lineWidth=1; g.strokeRect(X(s0)+.5,yb+.5,X(s1)-X(s0)-1,hb-1);
    const sp=P.C/Math.max(1,P.R);
    if(X(s1)-X(s0)>60) label(`Scene ${(P.R/fps).toFixed(2)}s${Math.abs(sp-1)>.02?` · plays the ${(P.C/fps).toFixed(1)}s of blocks at ×${sp.toFixed(2)}`:''}`,X(s0)+6,yb+10,'#ffd5d3');
    // curve: x = scene time, y = how far through the blocks' timeline
    const cy0=yb+hb-3, ch=hb-18, cxp=u=>X(s0+(s1-s0)*u), cyp=v=>cy0-ch*v;
    const sf=curveFn(D.anim.sceneCurve||[0,0,1,1]);
    // phase boundaries projected onto the curve (where ON ends, where OFF starts)
    if(P.C>0){ const tick=(c,col)=>{const v=clamp((c-P.startF)/P.C,0,1); g.strokeStyle=col; g.setLineDash([3,3]); g.lineWidth=1; g.beginPath(); g.moveTo(cxp(0),cyp(v)); g.lineTo(cxp(1),cyp(v)); g.stroke(); g.setLineDash([]);};
      const PB=phaseBounds(Pc), cOn=PB.on!=null?PB.on:P.startF+P.C, cHold=PB.hold;
      tick(cOn,'rgba(230,33,47,.45)'); if(cHold!=null) tick(cHold,'rgba(116,157,211,.55)');
      // where the curve reaches each phase: a marker + the scene time it happens
      const inv2=invCurve(D.anim.sceneCurve||[0,0,1,1]);
      const mark=(c,txt,col)=>{const v=clamp((c-P.startF)/P.C,0,1), u=inv2(v), x=cxp(u), y=cyp(v); g.fillStyle=col; g.fillRect(x-.5,yb,1,hb); g.beginPath(); g.arc(x,y,3,0,7); g.fill();
        const t=`${txt} ${((P.startF+P.R*u)/fps).toFixed(1)}s`; g.font='600 10px sans-serif'; const w=g.measureText(t).width; label(t,clamp(x+4,X(s0)+4,X(s1)-w-4),Math.max(yb+22,y-8),col);};
      if(!(D.anim.sceneEase&&D.anim.sceneEase.on)){ mark(cOn,'On done',"#FF7F7B"); if(cHold!=null) mark(cHold,'Off starts','#9fbbe6'); } }
    g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=1.6; g.beginPath(); for(let k=0;k<=80;k++){const u=k/80,xx=cxp(u),yy=cyp(clamp(sf(u),-.2,1.2));k?g.lineTo(xx,yy):g.moveTo(xx,yy);} g.stroke();
    const SE=D.anim.sceneEase, simple=SE&&SE.on;
    if(simple&&X(s1)-X(s0)>50&&P.C>0&&easeSync.m){ const M=easeSync.m, hs=M.h, W=Math.max(1,cxp(1)-cxp(0));
      const COL={hold:'#FF7F7B',out:'#9fbbe6',mid:'#c9a7ff'}, NAME={hold:'Hold starts',out:'Hold ends',mid:'Out starts'};
      // segment names along the top
      const segName=(u0,u1,t)=>{const xa=cxp(u0),xb=cxp(u1); if(xb-xa>34){g.font='600 10px sans-serif';const w=g.measureText(t).width;label(t,(xa+xb)/2-w/2,yb+24,'rgba(255,255,255,.55)');}};
      const byRole=r=>hs.find(q=>q.role===r);
      const pH=byRole('hold'), pO=byRole('out'), pM=byRole('mid');
      if(pH&&pO){segName(0,pH.x,'In');segName(pH.x,pO.x,'Hold');segName(pO.x,1,'Out');} else if(pM){segName(0,pM.x,'In');segName(pM.x,1,'Out');} else segName(0,1,'In · Out');
      // vertical position lines with a square knob at the top
      hs.forEach(q=>{ if(!COL[q.role]) return; const x=cxp(q.x), col=COL[q.role];
        g.strokeStyle=col; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,yb+2); g.lineTo(x,yb+hb-2); g.stroke();
        g.fillStyle=col; g.fillRect(x-6,yb+1,12,12); g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x-.5,yb+4,1,6);
        const t=`${NAME[q.role]} ${((P.startF+P.R*q.x)/fps).toFixed(1)}s`; g.font='600 10px sans-serif'; const w=g.measureText(t).width; label(t,q.role==='hold'?clamp(x-9-w,X(s0)+4,X(s1)-w-4):clamp(x+9,X(s0)+4,X(s1)-w-4),yb+8,col);
        const key=q.role==='out'?'holdAt':'onAt', other=q.role==='out'?hs.find(z=>z.role==='hold'):hs.find(z=>z.role==='out');
        const rm=q.role==='mid'?{alt:()=>{pushHist(true);D.anim.sceneEase.mid='smooth';syncInputs(true);refresh();toast('Middle point removed','Double-click the Scene row to add it back',true);}}:{};
        item(Object.assign({type:'point',x,y:yb+7,cur:'ew-resize',tip:`${NAME[q.role]} — drag left/right to move it${q.role==='mid'?' · ⌥-click removes the point':''}`,drag:(fx)=>{const uu=(fx-cxp(0))/W; let lo=4,hi=96; if(other){ if(q.role==='out') lo=other.x*100+3; else hi=other.x*100-3; } D.anim.sceneEase[key]=Math.round(clamp(uu*100,lo,hi));}},rm));
        item(Object.assign({type:'point',x,y:yb+hb/2,cur:'ew-resize',tip:`${NAME[q.role]} — drag left/right to move it${q.role==='mid'?' · ⌥-click removes the point':''}`,drag:(fx)=>{const uu=(fx-cxp(0))/W; let lo=4,hi=96; if(other){ if(q.role==='out') lo=other.x*100+3; else hi=other.x*100-3; } D.anim.sceneEase[key]=Math.round(clamp(uu*100,lo,hi));}},rm));
      });
      // ease handles (AE-style influence): drag along the time axis — longer = softer
      const EN={start:'Start · out handle',land:'Hold start · in handle',landOut:'Hold start · out handle (into the hold)',leaveIn:'Hold end · in handle (inside the hold)',leave:'Hold end · out handle',end:'End · in handle'};
      hs.forEach(q=>{ [['i',q.ki,q.ix,q.iy,q.segI,q.segIy],['o',q.ko,q.ox,q.oy,q.segO,q.segOy]].forEach(([side,key,dx,dy,seg,segy])=>{ if(!key||!seg) return;
          const ax=cxp(q.x), ay=cyp(q.y), hx=cxp(q.x+dx), hy=cyp(q.y+dy), a0=Math.atan2(dy,dx);
          g.strokeStyle='rgba(255,127,123,.7)'; g.lineWidth=1; g.beginPath(); g.moveTo(ax,ay); g.lineTo(hx,hy); g.stroke();
          g.fillStyle='#FF7F7B'; g.beginPath(); g.arc(hx,hy,4,0,7); g.fill();
          item({type:'point',x:hx,y:hy,cur:'move',tip:`${EN[key]} — drag the handle (angle + length) · hold ⇧ to keep its angle`,drag:(fx,fy,sh)=>{
            let u=(fx-cxp(0))/W-q.x, v=(cy0-fy)/Math.max(1,ch)-q.y;
            if(sh&&(dx||dy)){const cx=Math.cos(a0), cy=Math.sin(a0), len=Math.max(0,u*cx+v*cy); u=cx*len; v=cy*len;}
            const rx=clamp(Math.abs(u)/Math.max(1e-6,seg),0,1), ry=clamp((side==='o'?v:-v)/Math.max(1e-6,segy),0,1);
            const SE=D.anim.sceneEase; SE.hd=Object.assign({},SE.hd||{}); SE.hd[key]=[r3(rx),r3(ry)]; }}); }); });
      hs.forEach(q=>{g.fillStyle='#fff';g.beginPath();g.arc(cxp(q.x),cyp(q.y),3.5,0,7);g.fill();
        if(q.role==='hold'||q.role==='out'){ const key=q.role==='hold'?'landOut':'leaveIn';
          item({type:'point',x:cxp(q.x),y:cyp(q.y),cur:'pointer',tip:`${q.role==='hold'?'Hold starts':'Hold ends'} point — ⌥-click to ${((D.anim.sceneEase.holdH||{})[key])?'remove the handle inside the hold (straight again)':'add a handle inside the hold'}`,drag:()=>{},
            alt:()=>{pushHist(true);const SE=D.anim.sceneEase;SE.holdH=Object.assign({},SE.holdH||{});SE.holdH[key]=!SE.holdH[key];if(!SE.holdH[key]&&SE.hd){SE.hd=Object.assign({},SE.hd);delete SE.hd[key];}refresh();}}); } });
    }
    if(!simple&&X(s1)-X(s0)>50){
      const Hs=toH(D.anim.sceneCurve||[0,0,1,1]);
      const save=h=>{D.anim.sceneCurve=hPack(h);};
      Hs.forEach((p,k)=>{
        const ax=cxp(p.x), ay=cyp(p.y);
        const hd=(dx,dy,which)=>{const hx=cxp(p.x+dx), hy=cyp(p.y+dy); g.strokeStyle='rgba(255,127,123,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(ax,ay); g.lineTo(hx,hy); g.stroke();
          g.fillStyle='#FF7F7B'; g.beginPath(); g.arc(hx,hy,3.5,0,7); g.fill();
          const a0=Math.atan2(dy,dx);
          item({type:'point',x:hx,y:hy,cur:'move',tip:'easing handle — drag to shape the curve · hold ⇧ to keep its angle',drag:(fx,fy,sh)=>{const h=toH(D.anim.sceneCurve||[0,0,1,1]),q=h[k]; if(!q) return;
            const u=(fx-cxp(0))/Math.max(1,cxp(1)-cxp(0)), v=(cy0-fy)/Math.max(1,ch);
            let ddx=u-q.x, ddy=v-q.y;
            if(sh&&(dx||dy)){const cx=Math.cos(a0), cy=Math.sin(a0), len=Math.max(0,ddx*cx+ddy*cy); ddx=cx*len; ddy=cy*len;}
            if(which==='o'){const mx=(k<h.length-1?h[k+1].x:1)-q.x, ny=k<h.length-1?h[k+1].y:1; if(sh&&ddx>mx&&ddx>0){ddy*=mx/ddx;ddx=mx;} q.ox=clamp(ddx,0,mx); q.oy=clamp(ddy,0,Math.max(0,ny-q.y));}
            else {const mn=-(q.x-(k>0?h[k-1].x:0)), py=k>0?h[k-1].y:0; if(sh&&ddx<mn&&ddx<0){ddy*=mn/ddx;ddx=mn;} q.ix=clamp(ddx,mn,0); q.iy=clamp(ddy,-Math.max(0,q.y-py),0);}
            save(h);}});};
        if(k>0) hd(p.ix,p.iy,'i'); if(k<Hs.length-1) hd(p.ox,p.oy,'o');
        g.fillStyle='#fff'; g.beginPath(); g.arc(ax,ay,4,0,7); g.fill(); g.strokeStyle='#E6212F'; g.lineWidth=1.5; g.stroke();
        const end=k===0||k===Hs.length-1;
        if(!end) item({type:'point',x:ax,y:ay,cur:'move',tip:'easing point — drag it · ⌥-click removes it',
          drag:(fx,fy)=>{const h=toH(D.anim.sceneCurve||[0,0,1,1]),q=h[k]; if(!q) return; let u=(fx-cxp(0))/Math.max(1,cxp(1)-cxp(0)); const v=clamp((cy0-fy)/Math.max(1,ch),h[k-1].y,h[k+1].y);   // never goes backwards
            u=clamp(u,h[k-1].x+.01,h[k+1].x-.01); q.ox=Math.min(q.ox,h[k+1].x-u); q.ix=Math.max(q.ix,-(u-h[k-1].x)); q.x=u; q.y=v;
            q.oy=clamp(q.oy,0,h[k+1].y-v); q.iy=clamp(q.iy,-(v-h[k-1].y),0); h[k-1].oy=clamp(h[k-1].oy,0,v-h[k-1].y); h[k+1].iy=clamp(h[k+1].iy,-(h[k+1].y-v),0); save(h);},
          alt:()=>{const h=toH(D.anim.sceneCurve||[0,0,1,1]); pushHist(true);h.splice(k,1);save(h);planCache.k='';refresh();}});
      });
      item({type:'curve',x0:cxp(0),x1:cxp(1),y0:yb,y1:yb+hb,cy:u=>cyp(sf(u)),u:x=>(x-cxp(0))/Math.max(1,cxp(1)-cxp(0)),cur:'copy',tip:'click the line (or double-click the row) to add an easing point'});
    }
    knob(s0,RSc.y0+4,RSc.h-8,'#E6212F'); knob(s1,RSc.y0+4,RSc.h-8,'#E6212F');
    H(s0,RSc,'ew-resize',f=>{D.anim.startF=Math.round(f);},'scene start (moves everything)');
    const C0=P.C; H(s1,RSc,'ew-resize',f=>{const r=Math.max(2,Math.round(f-D.anim.startF)); D.anim.remapLen=Math.abs(r-C0)<=1?0:r;},'scene length — squeezes or stretches the whole block timeline into it');
    // ---- the blocks' own timeline, three phases: ON · HOLD · OFF (shown where they land in the scene)
    if(RPh){ const X2=D.exit, yp=RPh.y0+4, hp=RPh.h-8, cs=P.startF;
      const onEnd=Pc.onEnd!=null?Pc.onEnd:s1, WOn=X2.on&&X2.mode==='walk'&&Pc.walkT!=null;
      let holdEnd=null, offEnd=null;
      if(WOn){ holdEnd=Pc.walkT; offEnd=Math.max(Pc.walkT+1,(Pc.walkEnd||Pc.end)); }
      else if(X2.on&&Pc.exitT&&Pc.exitT.some(v=>v!=null)){ const ex=Pc.exitT.filter(v=>v!=null); holdEnd=Math.max(onEnd,Math.min(...ex)); offEnd=Math.max(holdEnd+1,Math.max(...ex)+(+X2.len||8)); }
      const seg=(f0,f1,col,txt,tcol)=>{if(f1==null||f1<=f0)return;g.fillStyle=col;g.fillRect(X(f0),yp,X(f1)-X(f0),hp);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(X(f1)-1,yp,1,hp);if(X(f1)-X(f0)>30){g.font='600 10px sans-serif';label(txt,X(f0)+5,yp+hp/2,tcol||'#fff');}};
      { const lt=Pc.landT!=null?Math.min(Pc.landT,onEnd):onEnd; seg(cs,lt,'rgba(230,33,47,.55)','In'); if(onEnd>lt) seg(lt,onEnd,'rgba(230,33,47,.28)','settle','#ffd5d3'); }
      if(holdEnd!=null){ seg(onEnd,holdEnd,'rgba(236,236,239,.16)','Hold','#ececef'); if(WOn){ const w0=(P.walkFrom!=null&&Pc.T[P.walkFrom]!=null)?Math.max(holdEnd,Pc.T[P.walkFrom]):holdEnd; if(w0>holdEnd) seg(holdEnd,w0,'rgba(116,157,211,.25)','settle','#cfe0f7'); seg(w0,offEnd,'rgba(116,157,211,.5)','Out · walks off'); } else seg(holdEnd,offEnd,'rgba(116,157,211,.5)','Out'); }
      else seg(onEnd,Math.max(onEnd+1,Pc.end),'rgba(236,236,239,.08)','Stays','#a2a2ab');
      // handles work on the blocks' own clock (converted from the scene time under the pointer)
      const Lc=D.anim.lenF, onC=(onEnd);
      knob(onEnd,RPh.y0,RPh.h,'#E6212F'); H(onEnd,RPh,'ew-resize',f=>{D.anim.lenF=Math.max(2,Math.round(Lc+((f)-onC)));D.anim.toEnd=false;},'end of On — how long the line takes to build');
      if(WOn){ const h0=+X2.walkHold||0, hC=(holdEnd); knob(holdEnd,RPh.y0,RPh.h,'#FFFFFF'); H(holdEnd,RPh,'ew-resize',f=>{X2.walkHold=Math.max(0,Math.round(h0+((f)-hC)));},'end of Hold — how long the built line waits');
        const wl=+X2.walkLen||48, rC=Pc.relT!=null?(Pc.relT):null; if(Pc.relT!=null){knob(Pc.relT,RPh.y0,RPh.h,'#749DD3'); H(Pc.relT,RPh,'ew-resize',f=>{X2.walkLen=Math.max(6,Math.round(wl+((f)-rC)));},'camera lets go of the walking line');}}
      else if(X2.on&&X2.mode==='end'&&holdEnd!=null){ const a0=+X2.at||0, hC=(holdEnd); knob(holdEnd,RPh.y0,RPh.h,'#FFFFFF'); H(holdEnd,RPh,'ew-resize',f=>{X2.at=Math.round(a0+((f)-hC));},'end of Hold — when the clear-out starts'); }
      else if(X2.on&&X2.mode==='hold'&&holdEnd!=null){ const h0=+X2.hold||0, hC=(holdEnd); knob(holdEnd,RPh.y0,RPh.h,'#FFFFFF'); H(holdEnd,RPh,'ew-resize',f=>{X2.hold=Math.max(1,Math.round(h0+((f)-hC)));},'how long each block stays'); }
      // Off: end-of-Off knob (how long each block takes to leave) — or, while blocks stay, a ghost knob that turns the clear-out on
      if(X2.on&&!WOn&&offEnd!=null){ const l0=+X2.len||8, oC=offEnd; knob(offEnd,RPh.y0,RPh.h,'#749DD3'); H(offEnd,RPh,'ew-resize',f=>{X2.len=clamp(Math.round(l0+(f-oC)),1,600);},'end of Off — how long each block takes to leave'); }
      if(!X2.on){ const gk=onEnd+Math.max(12,Math.round(fps)); g.globalAlpha=.55; knob(gk,RPh.y0,RPh.h,'#FFFFFF'); g.globalAlpha=1;
        let base=null; H(gk,RPh,'ew-resize',f=>{ if(base==null){ X2.on=true; X2.mode='end'; X2.at=0; const P2=plan(geom()), Q=P2.c||P2, ex=(Q.exitT||[]).filter(v=>v!=null); base=ex.length?Math.min(...ex):onEnd; }
          X2.at=Math.round(f-base); },'drag to make the blocks leave — sets when the clear-out starts (Hold), then Off appears'); }
      item({type:'row',row:RPh,x0:LW,x1:r.width,y0:RPh.y0,y1:RPh.y1,cur:'pointer',tip:'Blocks: On · Hold · Off — click for their settings'});
    }
  } else {g.fillStyle='#686871';g.font='11px sans-serif';g.fillText(anim?'Generate a line to start — Blocks step, or press G':'Static — pick an animation style in Motion',LW+8,RSc.y0+RSc.h/2);}
  // ---- camera
  const RC=TL.rows.find(R=>R.k==='camera');
  if(RC){ if(Pc.cam.length){const v=[];let mx=1;const a0=Math.floor(V0.f0),a1=Math.ceil(V0.f1);for(let f=a0;f<=a1;f++){const a=ev(Pc.cam,f,[0,0]),b=ev(Pc.cam,f+1,[0,0]);const s=Math.hypot(b[0]-a[0],b[1]-a[1]);v.push(s);mx=Math.max(mx,s);}
      g.fillStyle='rgba(116,157,211,.5)'; v.forEach((s,i)=>{const f=a0+i,hh=s/mx*(RC.h-8);g.fillRect(X(f),RC.y1-4-hh,Math.max(1,X(f+1)-X(f)),hh);});}
    else {g.fillStyle='#686871';g.font='11px sans-serif';g.fillText('camera is still',LW+8,RC.y0+RC.h/2);}
    if(Pc.camPh){ const ph=Pc.camPh, lb=(f0,f1,t,col)=>{if(f1==null||f0==null||X(f1)-X(f0)<46)return; g.font='600 10px sans-serif'; label(t,X(f0)+5,RC.y0+9,col);};
      lb(Pc.startF,ph.start,'waits for the line','#8a8a94'); lb(ph.start,ph.stop,'moves with the build','#C5CFF5'); if(ph.go!=null){lb(ph.stop,ph.go,'holds','#8a8a94'); lb(ph.go,Pc.relT!=null?Pc.relT:ph.go+200,'moves with the walk','#C5CFF5');} }
    if(D.anim.relOn&&Pc.relT!=null&&!(D.exit.on&&D.exit.mode==='walk')){knob(Pc.relT,RC.y0,RC.h,'#749DD3'); label('let go',X(Pc.relT)+6,RC.y0+9,'#C5CFF5');
      H(Pc.relT,RC,'ew-resize',f=>{D.anim.relAt=clamp(Math.round(((f)-D.anim.startF)/Math.max(1,D.anim.lenF)*100),5,99);},'camera let-go');}}
  // ---- transitions: clips you can drag
  const RT=TL.rows.find(R=>R.k==='trans'), TP=transP(G);
  if(TP.groups.length){TP.groups.forEach(gr=>{const T=D.trans[gr.k], col=gr.k==='in'?'rgba(43,217,143,.5)':'rgba(255,194,26,.5)', sel=U.ctx==='trans-'+gr.k;
      g.fillStyle=col; g.fillRect(X(gr.start),RT.y0+4,Math.max(2,X(gr.start+gr.dur)-X(gr.start)),RT.h-8);
      if(sel){g.strokeStyle='#fff';g.lineWidth=1.5;g.strokeRect(X(gr.start)+.5,RT.y0+4.5,Math.max(2,X(gr.start+gr.dur)-X(gr.start))-1,RT.h-9);}
      if(X(gr.start+gr.dur)-X(gr.start)>44) label((gr.k==='in'?'In':'Out')+(T.pattern==='walk'?' · walk':''),X(gr.start)+6,RT.y0+RT.h/2,'#111');
      knob(gr.start,RT.y0+2,RT.h-4,'#ececef'); knob(gr.start+gr.dur,RT.y0+2,RT.h-4,'#ececef');
      H(gr.start,RT,'ew-resize',f=>{const e=T.start+T.dur;T.atEnd=false;T.start=Math.round(f);T.dur=Math.max(2,e-T.start);},'transition '+gr.k+' start');
      H(gr.start+gr.dur,RT,'ew-resize',f=>{T.atEnd=false;T.dur=Math.max(2,Math.round(f-T.start));},'transition '+gr.k+' end');
      item({type:'clip',x0:X(gr.start),x1:X(gr.start+gr.dur),y0:RT.y0,y1:RT.y1,cur:'grab',tip:'transition '+gr.k+' — drag to move, click for its settings',ctx:'trans-'+gr.k,start:T.start,
        drag:(f,f0,st)=>{T.atEnd=false;T.start=Math.round(st+(f-f0));}});});}
  else {g.fillStyle='#686871';g.font='11px sans-serif';g.fillText('none — click to add a transition in or out',LW+8,RT.y0+RT.h/2);}
  // ---- content overlays
  const FB=Pc.fillBase||{}, FE=Pc.fillEnd||{};
  TL.rows.filter(R=>R.k==='content').forEach(R=>{
    const A=D.fill.anim;
    item({type:'row',row:R,x0:LW,x1:r.width,y0:R.y0,y1:R.y1,cur:'pointer',tip:R.name+' — click for its settings',tab:R.tab});
    if(R.ck==='none'){g.fillStyle='#686871';g.font='11px sans-serif';g.fillText('no overlays — click to add content',LW+8,R.y0+R.h/2);return;}
    const col=LAYER_COL[R.ck]||'#a2a2ab', rgba=(hx,a)=>{const n=parseInt(hx.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
    /* on / hold / off of one representative item, with a draggable hold end (and start for gaps) */
    /* one representative item (the first block's content): [animate on] ▮ fully on … hold … ▮ out starts [animate off]
       The animation lengths come from the settings; the two knobs only place things in time:
       ▮ fully on — drag to move when the content is fully on (changes the delay)
       ▮ out starts — drag to change how long it holds (drop it on the dashed Out line = hold until Out) */
    const phases=(it,AA,onHold,onDelay)=>{ const T0=fillTiming(Object.assign({kind:'text',type:true},it),24,fps), t0=it.t0, onLen=T0.on*fps, on=t0+onLen, off=isFinite(T0.off)?t0+T0.off*fps:N, end=isFinite(T0.off)?off+T0.outLen*fps:N;
      g.fillStyle=rgba(col,.75); g.fillRect(X(t0),R.y0+7,Math.max(2,X(on)-X(t0)),R.h-11);
      g.fillStyle=AA.live?'rgba(116,157,211,.55)':rgba(col,.28); g.fillRect(X(on),R.y0+7,Math.max(1,X(off)-X(on)),R.h-11);
      if(isFinite(T0.off)){g.fillStyle=rgba(col,.75);g.fillRect(X(off),R.y0+7,Math.max(1,X(end)-X(off)),R.h-11);}
      if(onDelay){knob(on,R.y0,R.h,col);H(on,R,'ew-resize',(st=>f=>onDelay(Math.round(f-onLen-st)))(t0-(+onDelay.cur||0)),`fully on (animate-on ${Math.round(onLen)}f before it) — drag to move when it's fully on`);}
      if(isFinite(T0.off)){knob(off,R.y0,R.h,col);H(off,R,'ew-resize',f=>onHold(Math.max(0,Math.round(f-on)),f),AA.anchor==='leave'?'out starts — each block\'s content stays until that block leaves (through the walk-out) · drag left to change':AA.anchor==='phases'?'out starts — holding until the blocks go Out · drag right past the Out line to keep it through the walk-out, left for a set hold':`out starts (animate-off ${Math.round(T0.outLen*fps)}f after it) — drag to change the hold · drop on the dashed Out line to hold until Out`);}
      if(X(off)-X(on)>50) label((AA.anchor==='phases'?'until Out':AA.anchor==='leave'?'until each block leaves':'hold')+(AA.live?' · live':''),X(on)+6,R.y0+R.h/2+2,'rgba(236,236,239,.85)'); };
    const outLine=Pc.fillOut!=null?Pc.fillOut:null, exits=(Pc.exitT||[]).filter(v=>v!=null), lastExit=exits.length?Math.max(...exits):null, snapHold=(obj,v,f)=>{ if(outLine!=null&&lastExit!=null&&f>=outLine+Math.max(6,(lastExit-outLine)*.15)){obj.anchor='leave';} else if(outLine!=null&&f>=outLine-3){obj.anchor='phases';} else {obj.anchor='block';obj.hold=v;} };
    if(outLine!=null){g.strokeStyle='rgba(159,187,230,.55)';g.setLineDash([3,3]);g.lineWidth=1;g.beginPath();g.moveTo(X(outLine)+.5,R.y0);g.lineTo(X(outLine)+.5,R.y1);g.stroke();g.setLineDash([]);}
    /* each layer: thin lines = every item's own timing (from the content settings); the bar = the layer's global window.
       ◀ all on: nothing comes on before it · all off ▶: everything is gone by it. ⌥-click a knob = back to automatic. */
    const winBar=(items,WN,name)=>{ if(!items.length) return;
      items.forEach((q,i)=>{ g.fillStyle=rgba(col,.4); g.fillRect(X(q.a),R.y0+3+(i%4)*1.6,Math.max(1,X(q.b)-X(q.a)),1.2); });
      const a=WN.on!=null?+WN.on:Math.min(...items.map(q=>q.a)), b=WN.off!=null?+WN.off:Math.max(...items.map(q=>q.b)), bb=Math.min(b,N);
      g.fillStyle=rgba(col,.22); g.fillRect(X(a),R.y0+6,Math.max(2,X(bb)-X(a)),R.h-10); g.strokeStyle=rgba(col,.8); g.lineWidth=1; g.strokeRect(X(a)+.5,R.y0+6.5,Math.max(2,X(bb)-X(a))-1,R.h-11);
      if(X(bb)-X(a)>110) label(`${name}${WN.on!=null||WN.off!=null?' · set':' · auto'}`,X(a)+8,R.y0+R.h/2+2,'rgba(236,236,239,.85)');
      const mk=(f,key,tip)=>{ knob(f,R.y0,R.h,col); if(WN[key]!=null){ g.fillStyle='#fff'; g.fillRect(X(f)-1,R.y0+3,2,2); }
        item({type:'point',x:X(f),y:R.y0+R.h/2,cur:'ew-resize',tip,drag:(fx)=>{ const v=Math.round(F(fx)); if(key==='on') WN.on=Math.min(v,(WN.off!=null?+WN.off:b)-2); else WN.off=Math.max(v,(WN.on!=null?+WN.on:a)+2); },
          alt:()=>{pushHist(true);WN[key]=null;refresh();}}); };
      mk(a,'on',`all on — nothing in ${name} comes on before here (each item still uses its own animate-on/delay) · ⌥-click = automatic`);
      mk(Math.min(bb,N-1),'off',`all off — everything in ${name} is gone by here (each item still uses its own animate-off) · ⌥-click = automatic`);
    };
    if(R.ck==='hud'){
      const its=[]; P.seq.forEach(b=>{const t0=FB[b.id]; if(t0==null) return; const T1=fillTiming({kind:'text',type:true,t0,tEnd:FE[b.id],lines:['x'.repeat(24)]},24,fps); its.push({a:t0,b:isFinite(T1.off)?t0+(T1.off+T1.outLen)*fps:(FE[b.id]!=null?FE[b.id]:N)});});
      D.fill.win=D.fill.win||{on:null,off:null}; winBar(its,D.fill.win,'Text HUD');
    } else if(R.ck==='gaps'){
      const gl=Pc.gaps||[], AA=gapA(), its=gl.map(it=>{const T1=fillTiming(Object.assign({kind:'text',type:true},it,{A:AA}),24,fps); return {a:it.t0,b:isFinite(T1.off)?it.t0+(T1.off+T1.outLen)*fps:(it.tEnd!=null?it.tEnd:N)};});
      D.fill.gap.win=D.fill.gap.win||{on:null,off:null}; winBar(its,D.fill.gap.win,'Between blocks');
    }
    else if(R.ck==='numbers'){ P.seq.forEach((b,i)=>{if(!numOn(b)) return; const t0=(Pc.done||[])[i]||Pc.T[i], e=Pc.exitT&&Pc.exitT[i]!=null?Pc.exitT[i]:N; g.fillStyle=rgba(col,.55); g.fillRect(X(t0),R.y0+5+(i%3)*3,Math.max(1,X(e)-X(t0)),2);}); }
    else if(R.ck==='echo'){ Pc.echo.forEach((e,i)=>{const t0=e.K.op.length?e.K.op[0][0]:0, t1=e.K.op.length?e.K.op[e.K.op.length-1][0]:N, end=e.K.op.length&&e.K.op[e.K.op.length-1][1]===0?t1:N; g.fillStyle=rgba(col,.55); g.fillRect(X(t0),R.y0+5+(i%3)*3,Math.max(1,X(end)-X(t0)),2);}); }
  });
  // ---- blocks header: summary + the end-of-build handle
  if(anim&&n){
    const nb=P.walkFrom!=null?P.walkFrom:n;
    P.seq.forEach((b,i)=>{g.fillStyle=i<nb?'rgba(255,255,255,.6)':'rgba(116,157,211,.8)'; g.fillRect(X(Pc.T[i]),hdr.y0+hdr.h-8,1,5);});
    if(isGenerated()&&nb>1){const tl=Pc.T[nb-1], tdn=(Pc.done||[])[nb-1]||tl;
      g.strokeStyle='rgba(255,194,26,.5)'; g.setLineDash([2,3]); g.lineWidth=1; g.beginPath(); g.moveTo(X(tdn)+.5,TL.contentY0||hdr.y0-60); g.lineTo(X(tdn)+.5,hdr.y1); g.stroke(); g.setLineDash([]);
      { const t=`last block lands ${(tdn/fps).toFixed(2)}s`; g.font='600 10px sans-serif'; const w=g.measureText(t).width; if(X(tl)-w-10>LW) label(t,X(tl)-w-8,hdr.y0+hdr.h/2,'#FFC21A'); }
      knob(tl,hdr.y0+2,hdr.h-4,'#FFC21A'); H(tl,hdr,'ew-resize',f=>{D.anim.cutAt=Math.max(Math.round((Pc.T[0]))+1,Math.round((f)));},'end of the build — drag left to drop the late blocks (the rest keep their timing)');
      if(Pc.cutAt!=null){g.fillStyle='rgba(255,194,26,.12)';g.fillRect(X(tl)+4,hdr.y0,Math.max(0,X(P.startF+P.L)-X(tl)-4),hdr.h);if(X(P.startF+P.L)-X(tl)>60)label(`${Pc.cutN} dropped`,X(tl)+8,hdr.y0+hdr.h/2,'#FFC21A');}}
  }
  // ---- one row per block (scrolls)
  g.save(); g.beginPath(); g.rect(0,top,r.width,bottom-top); g.clip();
  if(TL.blocksOpen&&anim){
    const sel=new Set(tlSelIds()), exitLen=+D.exit.len||8, dt=D.anim.dt||{};
    P.seq.forEach((b,i)=>{
      const yy=top+3+i*BLOCK_RH; if(yy<ROWS.ruler-BLOCK_RH||yy>bottom) return;
      const t0=Pc.T[i], done=(Pc.done||[])[i]||t0, tE=Pc.exitT&&Pc.exitT[i]!=null?Pc.exitT[i]:null, t1=tE!=null?tE+exitLen:N, isSel=sel.has(b.id), walk=P.walkFrom!=null&&i>=P.walkFrom;
      if(isSel){g.fillStyle='rgba(255,255,255,.06)';g.fillRect(LW,yy-1,r.width-LW,BLOCK_RH);}
      const a=b.virtual?.75:1;
      g.globalAlpha=a; g.fillStyle=b.color; g.fillRect(X(t0),yy+2,Math.max(2,X(done)-X(t0)),BLOCK_RH-4);
      g.globalAlpha=a*.42; g.fillRect(X(done),yy+3,Math.max(1,X(tE!=null?tE:t1)-X(done)),BLOCK_RH-6);
      if(tE!=null){g.globalAlpha=a*.8; g.fillRect(X(tE),yy+2,Math.max(1,X(t1)-X(tE)),BLOCK_RH-4);}
      g.globalAlpha=1;
      if(isSel){g.strokeStyle='#fff';g.lineWidth=1.5;g.strokeRect(X(t0)+.5,yy+1.5,Math.max(2,X(t1)-X(t0))-1,BLOCK_RH-3);}
      if((dt[b.id]||(D.anim.dx||{})[b.id])&&Pc.T0){const x0=X(Pc.T0[i]); g.strokeStyle='rgba(255,255,255,.45)'; g.setLineDash([3,2]); g.lineWidth=1; g.strokeRect(x0+.5,yy+2.5,Math.max(2,X(t1-(t0-Pc.T0[i]))-x0)-1,BLOCK_RH-5); g.setLineDash([]);}
      if(isSel){g.fillStyle='#fff'; g.fillRect(X(t0)-1,yy+1,2.5,BLOCK_RH-2); if(tE!=null) g.fillRect(X(tE)-1,yy+1,2.5,BLOCK_RH-2);}
      const lab=`${bname(b)}${b.virtual?' (generated)':''} — in f${t0}${tE!=null?` · out f${tE}`:''}${dt[b.id]?` · moved ${dt[b.id]>0?'+':''}${dt[b.id]}f`:''}`;
      item({type:'block',id:b.id,i,x0:X(t0)-3,x1:X(t1)+2,y0:yy,y1:yy+BLOCK_RH,cur:'grab',tip:`${lab} · drag to move it (in and out together) · right-click for more`,t0});
      item({type:'inedge',id:b.id,i,x:X(t0),y0:yy,y1:yy+BLOCK_RH,cur:'ew-resize',tip:`${lab} · drag to change when it comes in`});
      if(tE!=null) item({type:'exit',id:b.id,i,x:X(tE),y0:yy,y1:yy+BLOCK_RH,cur:'ew-resize',tip:`${lab} · drag to change when it leaves`,dx0:+(D.anim.dx||{})[b.id]||0});
      if(walk&&i===P.walkFrom){g.fillStyle='rgba(116,157,211,.6)';g.fillRect(LW,yy-1,r.width-LW,1);}
    });
  }
  g.restore();
  g.restore();
  // block labels (left column, scrolled)
  g.save(); g.beginPath(); g.rect(0,top,LW-1,bottom-top); g.clip();
  if(TL.blocksOpen&&anim){const sel=new Set(tlSelIds());P.seq.forEach((b,i)=>{const yy=top+3+i*BLOCK_RH; if(yy<ROWS.ruler-BLOCK_RH||yy>bottom) return;
    if(sel.has(b.id)){g.fillStyle='rgba(230,33,47,.18)';g.fillRect(0,yy-1,LW-1,BLOCK_RH);}
    g.fillStyle=b.color; g.fillRect(12,yy+3,8,BLOCK_RH-6); g.fillStyle=sel.has(b.id)?'#fff':(b.virtual?'#7c7c86':'#a2a2ab'); g.font='10px sans-serif'; g.textBaseline='middle';
    g.fillText(`${String(i+1).padStart(2,'0')}  ${P.walkFrom!=null&&i>=P.walkFrom?'walk-off':b.virtual?'generated':(b.name||b.w+'×'+b.h)}${(D.anim.dt||{})[b.id]?'  ⟷':''}`,26,yy+BLOCK_RH/2);});}
  g.restore();
  if(totalH>r.height){const vis=r.height-ROWS.ruler, th=Math.max(20,vis*vis/(totalH-ROWS.ruler)), ty=ROWS.ruler+(vis-th)*TL.scrollY/Math.max(1,totalH-r.height+4); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(r.width-5,ty,3,th);}
  // ---- ruler, cues, playhead (on top of the tracks)
  g.save(); g.beginPath(); g.rect(LW,0,r.width-LW,r.height); g.clip();
  g.fillStyle='#19191c'; g.fillRect(LW,0,r.width,ROWS.ruler); g.fillStyle='rgba(255,255,255,.06)'; g.fillRect(LW,ROWS.ruler-1,r.width,1);
  const spanS=(V0.f1-V0.f0)/fps, stepS=[.1,.25,.5,1,2,5,10,30,60].find(s=>spanS/s<=Math.max(4,Wt/70))||60, sub=stepS/5;
  g.fillStyle='#5c5c66'; for(let s=Math.ceil(V0.f0/fps/sub)*sub;s*fps<=V0.f1;s+=sub) g.fillRect(X(s*fps),ROWS.ruler-4,1,4);
  g.fillStyle='#9a9aa3'; g.font='10px sans-serif'; g.textBaseline='middle'; for(let s=Math.ceil(V0.f0/fps/stepS)*stepS;s*fps<=V0.f1;s+=stepS){const x=X(s*fps); g.fillRect(x,ROWS.ruler-9,1,9); g.fillText((+s.toFixed(2))+'s',x+3,8);}
  if(anim&&P.seq.length){g.fillStyle='rgba(230,33,47,.8)'; g.fillRect(X(P.startF),ROWS.ruler-3,Math.max(1,X(P.startF+(P.R||P.L))-X(P.startF)),3);}
  g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(X(compF),0,1,r.height);
  const cues=timingCues(); g.fillStyle=D.timing&&D.timing.sync?'rgba(116,157,211,.7)':'rgba(116,157,211,.32)'; cues.forEach(f=>{g.fillRect(X(f),ROWS.ruler,1,r.height-ROWS.ruler);});
  if(U.t!=null&&anim&&P.remapped&&TL.contentY0!=null){ const x=X(U.t), xc=X(P.toContent(U.t)), yC=TL.contentY0;
    g.fillStyle='#E6212F'; g.fillRect(x-.5,0,1.5,yC-6); g.strokeStyle='#E6212F'; g.lineWidth=1.5; g.setLineDash([]); g.beginPath(); g.moveTo(x,yC-6); g.lineTo(xc,yC+2); g.stroke();
    g.setLineDash([4,3]); g.beginPath(); g.moveTo(xc,yC+2); g.lineTo(xc,r.height); g.stroke(); g.setLineDash([]);
    const fps2=D.comp.fps||30, lab=`${Math.round(U.t)}f · ${(U.t/fps2).toFixed(2)}s`; g.font='600 10px sans-serif'; const w=g.measureText(lab).width+10; const lx=clamp(x-w/2,LW,r.width-w); g.fillStyle='#E6212F'; if(g.roundRect){g.beginPath();g.roundRect(lx,2,w,17,4);g.fill();}else g.fillRect(lx,2,w,17); g.fillStyle='#fff'; g.fillText(lab,lx+5,11);
  } else
  if(U.t!=null){const x=X(U.t); g.fillStyle='#E6212F'; g.fillRect(x-.5,0,1.5,r.height); const lab=`${Math.round(U.t)}f · ${(U.t/fps).toFixed(2)}s`; g.font='600 10px sans-serif'; const w=g.measureText(lab).width+10; const lx=clamp(x-w/2,LW,r.width-w); g.fillStyle='#E6212F'; if(g.roundRect){g.beginPath();g.roundRect(lx,2,w,17,4);g.fill();}else g.fillRect(lx,2,w,17); g.fillStyle='#fff'; g.fillText(lab,lx+5,11);}
  if(TL.hover&&!TL.drag&&TL.hover.x>LW){g.fillStyle='rgba(255,255,255,.22)';g.fillRect(TL.hover.x,ROWS.ruler,1,r.height-ROWS.ruler);}
  if(TL.drag&&TL.drag.marquee){const m=TL.drag.marquee; g.fillStyle='rgba(230,33,47,.12)'; g.strokeStyle='rgba(255,127,123,.9)'; g.lineWidth=1; g.fillRect(Math.min(m.x0,m.x1),Math.min(m.y0,m.y1),Math.abs(m.x1-m.x0),Math.abs(m.y1-m.y0)); g.strokeRect(Math.min(m.x0,m.x1)+.5,Math.min(m.y0,m.y1)+.5,Math.abs(m.x1-m.x0),Math.abs(m.y1-m.y0));}
  g.restore();
  g.fillStyle='#19191c'; g.fillRect(0,0,LW-1,ROWS.ruler); g.fillStyle='#9a9aa3'; g.font='600 10px sans-serif'; g.textBaseline='middle'; g.fillText(anim&&P.seq.length?`${P.seq.length} blocks · ${((P.R||P.L)/fps).toFixed(1)}s scene`:'Timeline',10,ROWS.ruler/2);
}
/* what's under the pointer */
function tlHit(x,y){
  const inList=y>=TL.listY0;
  let best=null;
  TL.items.forEach(it=>{
    if((it.type==='block'||it.type==='exit'||it.type==='inedge')&&!inList) return;
    if(it.type==='point'){const d=Math.hypot(it.x-x,it.y-y); if(d<=7&&(!best||best.pr<4||d<best.d)) best=Object.assign({pr:4,d},it);}
    else if(it.type==='handle'){const d=Math.abs(it.x-x); if(y>=it.y0&&y<=it.y1&&d<=6&&(!best||best.pr<3||(best.pr===3&&d<best.d))) best=Object.assign({pr:3,d},it);}
    else if(it.type==='exit'||it.type==='inedge'){const d=Math.abs(it.x-x); if(y>=it.y0&&y<it.y1&&d<=4&&(!best||best.pr<2.5||(best.pr===2.5&&d<best.d))) best=Object.assign({pr:2.5,d},it);}
  });
  if(best) return best;
  TL.items.forEach(it=>{
    if(best) return;
    if(it.type==='block'&&inList&&x>=it.x0&&x<=it.x1&&y>=it.y0&&y<it.y1) best=Object.assign({pr:2},it);
    else if(it.type==='clip'&&x>=it.x0&&x<=it.x1&&y>=it.y0&&y<it.y1) best=Object.assign({pr:2},it);
  });
  if(best) return best;
  const cvv=TL.items.find(it=>it.type==='curve'&&x>=it.x0&&x<=it.x1&&y>=it.y0&&y<=it.y1);
  if(cvv){const u=cvv.u(x); if(Math.abs(cvv.cy(u)-y)<=8) return Object.assign({pr:1},cvv);}
  if(y<ROWS.ruler) return {type:'ruler',cur:'col-resize',tip:'drag to scrub'};
  if(inList){ if(TL.blocksOpen&&TL.P){const i=Math.floor((y-TL.listTop-3)/BLOCK_RH); if(TL.P.seq[i]&&x<TL.LW) return {type:'blabel',i,id:TL.P.seq[i].id,cur:'pointer',tip:'click to select this block (⇧ to add)'};} return {type:'empty',cur:'default'}; }
  const R=TL.rows.find(R=>y>=R.y0&&y<R.y1);
  if(R&&R.k==='blocks') return {type:'bhdr',cur:'pointer',tip:x<TL.LW?'show / hide the block rows':'Blocks — click to open the Blocks step'};
  if(R&&R.k!=='ruler') return {type:'row',row:R,cur:'pointer',tip:(R.name||'')+' — click for its settings',tab:R.tab};
  return {type:'empty',cur:'default'};
}
function tlInfo(x,y,h){
  const fps=D.comp.fps||30, f=Math.round(TL.F(x)), tc=`f${f} · ${(f/fps).toFixed(2)}s`;
  if(x<TL.LW) return h&&h.tip?h.tip:'';
  return h&&h.tip?`${tc} — ${h.tip}`:tc;
}
function updTC(){const el=$('#tc'); if(!el) return; const fps=D.comp.fps||30; el.textContent=U.t==null?'layout':`${Math.round(U.t)}f · ${(U.t/fps).toFixed(2)}s`;}
function tlSetT(f){stopPlay();U.preview=true;U.t=Math.round(f);$('#scrub').value=U.t;mediaSync(false);updTC();updViewBadge();render();drawDope();drawSpeedGraph();}
function tlSelect(id,add){
  let s=add?tlSelIds():[];
  if(add&&s.indexOf(id)>=0) s=s.filter(x=>x!==id); else if(s.indexOf(id)<0) s.push(id);
  U.dopeSel=s; U.selIds=s.filter(x=>byId(x)); U.ctx=null; U.sel=null; refresh();
}
/* pick a block on the timeline: plain = just it, toggle (⌘) = add/remove, range (⇧) = everything from the last pick */
function tlPick(id,mode){
  const P=TL.P||plan(geom()); let s=tlSelIds();
  if(mode==='range'&&TL.anchor!=null){ const a=P.seq.findIndex(b=>b.id===TL.anchor), b=P.seq.findIndex(x=>x.id===id);
    if(a>=0&&b>=0){ const lo=Math.min(a,b), hi=Math.max(a,b); s=[...new Set(s.concat(P.seq.slice(lo,hi+1).map(x=>x.id)))]; } else s=[id]; }
  else if(mode==='toggle'||mode==='range'){ s=s.indexOf(id)>=0?s.filter(x=>x!==id):s.concat([id]); TL.anchor=id; }
  else { s=[id]; TL.anchor=id; }
  U.dopeSel=s; U.selIds=s.filter(x=>byId(x)); U.ctx=null; U.sel=null; refresh();
}
/* add a point to the scene easing at u (0–1 across the scene), on the curve, with a smooth tangent */
function tlAddPoint(u){
  const cur=D.anim.sceneCurve||[0,0,1,1], hh=toH(cur); u=clamp(u,.02,.98);
  if(hh.some(q=>Math.abs(q.x-u)<.025)) return;
  pushHist(true); const fn=curveFn(cur), v=fn(u);
  let k=hh.findIndex(q=>q.x>u); if(k<1)k=hh.length-1; const a=hh[k-1], b=hh[k], w=Math.min(u-a.x,b.x-u)/3, sl=(fn(Math.min(1,u+.01))-fn(Math.max(0,u-.01)))/.02;
  a.ox=Math.min(a.ox,(u-a.x)*.9); b.ix=Math.max(b.ix,-(b.x-u)*.9);
  hh.splice(k,0,{x:u,y:v,ix:-w,iy:-w*sl,ox:w,oy:w*sl}); D.anim.sceneCurve=hPack(hh); planCache.k=''; refresh();
  toast('Added an easing point — drag it on the Scene row','⌥-click a point to remove it',true);
}
function initDope(){
  const c=$('#dopeCv'); if(!c||!c.addEventListener) return;
  const tip=$('#dopeTip');
  const showTip=t=>{if(!tip)return;tip.textContent=t||'';tip.hidden=!t;}; TL.showTip=showTip;
  const rect=e=>{const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  c.addEventListener('pointermove',e=>{ if(TL.drag) return; const p=rect(e), h=tlHit(p.x,p.y); c.style.cursor=U.space?'grab':(h.cur||'default'); TL.hover=p.x>TL.LW?{x:p.x}:null; showTip(tlInfo(p.x,p.y,h)); drawDope(); });
  c.addEventListener('pointerleave',()=>{if(TL.drag)return;TL.hover=null;showTip('');drawDope();});
  c.addEventListener('contextmenu',e=>{e.preventDefault(); const p=rect(e), h=tlHit(p.x,p.y); tlMenu(e,h);});
  c.addEventListener('dblclick',e=>{const p=rect(e), h=tlHit(p.x,p.y); const R=TL.rows.find(R=>R.k==='scene'); const cvv=TL.items.find(it=>it.type==='curve');
    if(R&&cvv&&p.y>=R.y0&&p.y<R.y1&&h.type!=='handle'&&h.type!=='point'&&p.x>=cvv.x0&&p.x<=cvv.x1) tlAddPoint(cvv.u(p.x));
    const SE=D.anim.sceneEase; if(R&&SE&&SE.on&&SE.mid==='smooth'&&D.exit.holdOn===false&&p.y>=R.y0&&p.y<R.y1&&h.type!=='point'){ const P=plan(geom()), V=tlView(), Wt=Math.max(40,c.getBoundingClientRect().width-TL.LW-8), f=V.f0+(p.x-TL.LW)/Wt*(V.f1-V.f0), u=(f-P.startF)/Math.max(1,P.R);
      if(u>.04&&u<.96){pushHist(true);SE.mid='point';SE.onAt=Math.round(u*100);syncInputs(true);refresh();} } });
  c.addEventListener('pointerdown',e=>{
    const p0=rect(e);
    // hand: hold Space (or use the middle button) and drag to pan the timeline — sideways through time, up/down through the block rows
    if(U.space||e.button===1){ e.preventDefault(); U.spacePanned=true; c.setPointerCapture&&c.setPointerCapture(e.pointerId); const V0=tlView(); TL.drag={pan:true,x0:p0.x,y0:p0.y,f0:V0.f0,f1:V0.f1,sy:TL.scrollY}; c.style.cursor='grabbing'; return; }
    if(e.button!==0) return; const p=p0, h=tlHit(p.x,p.y); closeTlMenu();
    c.setPointerCapture&&c.setPointerCapture(e.pointerId);
    const freeze=()=>{TL.frozen=tlView();};
    if(h.type==='ruler'){ freeze(); TL.drag={scrub:true}; tlSetT(TL.F(p.x)); return; }
    if(U.t!=null&&h.type!=='point'&&h.type!=='handle'&&h.type!=='exit'&&h.type!=='inedge'){ const content=p.y>=TL.contentY0&&TL.P&&TL.P.remapped, px=content?TL.X(TL.P.toContent(U.t)):TL.X(U.t);
      if(Math.abs(p.x-px)<=5&&p.x>TL.LW){ freeze(); TL.drag={scrub:true,content}; return; } }
    if(h.type==='point'){ if(e.altKey&&h.alt){h.alt();return;} pushHist(true); freeze(); TL.drag={point:h}; return; }
    if(h.type==='curve'){ tlAddPoint(h.u(p.x)); return; }
    if(h.type==='handle'){ pushHist(true); freeze(); TL.drag={handle:h}; return; }
    const mods=e.shiftKey?'range':(e.metaKey||e.ctrlKey)?'toggle':null;
    const grab=(kind)=>{ pushHist(true); freeze(); TL.dragP=TL.P; const ids=tlSelIds(), dt=D.anim.dt||{}, dx=D.anim.dx||{}; TL.drag={kind,blocks:ids,f0:TL.F(p.x),base:ids.map(id=>+dt[id]||0),baseX:ids.map(id=>+dx[id]||0),moved:false,anchorId:h.id}; };
    if(h.type==='exit'||h.type==='inedge'){ if(tlSelIds().indexOf(h.id)<0) tlPick(h.id,null); grab(h.type==='exit'?'out':'in'); return; }
    if(h.type==='block'||h.type==='blabel'){
      if(mods||tlSelIds().indexOf(h.id)<0) tlPick(h.id,mods);
      if(h.type==='block'&&!mods){ grab('move'); c.style.cursor='grabbing'; }
      return; }
    if(h.type==='clip'){ pushHist(true); freeze(); TL.drag={clip:h,f0:TL.F(p.x),moved:false}; return; }
    if(h.type==='bhdr'){ if(p.x<TL.LW){TL.blocksOpen=!TL.blocksOpen;drawDope();} else setCtx(D.anim.mode==='static'?null:'inout'); return; }
    if(h.type==='row'){ tlOpenRow(h.row||{},h.tab); return; }
    if(p.y>=TL.listY0&&TL.blocksOpen){ freeze(); TL.drag={marquee:{x0:p.x,y0:p.y,x1:p.x,y1:p.y},keep:mods?tlSelIds():[]}; return; }   // drag a box to select several blocks
    if(tlSelIds().length){U.dopeSel=[];U.selIds=[];refresh();} else { freeze(); TL.drag={scrub:true,content:p.y>=TL.contentY0}; tlSetT(TL.drag.content?TL.P.toReal(TL.F(p.x)):TL.F(p.x)); }
  });
  c.addEventListener('pointermove',e=>{const d=TL.drag; if(!d) return; const p=rect(e);
    if(d.pan){ const span=d.f1-d.f0, df=(p.x-d.x0)/Math.max(1,TL.W-TL.LW)*span; TL.f0=d.f0-df; TL.f1=d.f1-df; TL.scrollY=d.sy-(p.y-d.y0); drawDope(); try{updTlZoom();}catch(x){} return; }
    const f=TL.F(p.x);
    if(d.scrub){tlSetT(d.content&&TL.P?TL.P.toReal(f):f);return;}
    if(d.marquee){ const m=d.marquee; m.x1=p.x; m.y1=p.y; const x0=Math.min(m.x0,m.x1),x1=Math.max(m.x0,m.x1),y0=Math.min(m.y0,m.y1),y1=Math.max(m.y0,m.y1);
      const hit=TL.items.filter(it=>it.type==='block'&&it.x1>=x0&&it.x0<=x1&&it.y1>=y0&&it.y0<=y1).map(it=>it.id);
      const ids=[...new Set(d.keep.concat(hit))]; U.dopeSel=ids; U.selIds=ids.filter(id=>byId(id)); drawDope(); showTip(`${ids.length} block${ids.length===1?'':'s'} selected`); return; }
    if(d.point){d.point.drag(p.x,p.y,e.shiftKey);}
    else if(d.handle){d.handle.apply(f);}
    else if(d.blocks){
      const df=Math.round(f-d.f0); if(df) d.moved=true; D.anim.dt=D.anim.dt||{}; D.anim.dx=D.anim.dx||{};   // block offsets live on the blocks' own clock
      const keepOut=d.kind==='in'&&D.exit.mode!=='behind';
      d.blocks.forEach((id,k)=>{
        if(d.kind==='out'){const v=d.baseX[k]+df; if(v) D.anim.dx[id]=v; else delete D.anim.dx[id]; return;}
        const v=d.base[k]+df; if(v) D.anim.dt[id]=v; else delete D.anim.dt[id];
        if(keepOut){const w=d.baseX[k]-df; if(w) D.anim.dx[id]=w; else delete D.anim.dx[id];}
      });
      // show the change: put the playhead where this block now comes in (or leaves)
      planCache.k=''; const P2=plan(geom()), i2=P2.seq.findIndex(b=>b.id===d.anchorId);
      if(i2>=0){ const tt=d.kind==='out'&&P2.exitT&&P2.exitT[i2]!=null?P2.exitT[i2]+Math.round((+D.exit.len||8)/2):P2.T[i2]+Math.max(1,Math.round((+D.anim.trans||1)*.6)); U.t=Math.round(tt); updTC(); updViewBadge(); }
    }
    else if(d.clip){if(Math.abs(f-d.f0)>.5) d.moved=true; d.clip.drag(f,d.f0,d.clip.start);}
    planCache.k=''; syncInputs(); render(); drawDope(); drawSpeedGraph();
    const fps=D.comp.fps||30, df=Math.round(f-(d.f0||0));
    showTip(d.blocks?`${d.kind==='out'?'leave':d.kind==='in'?'come in':'move'} ${d.blocks.length>1?d.blocks.length+' blocks ':''}${df>=0?'+':''}${df}f${d.kind==='move'?' (in and out together)':''}`:d.handle?`${d.handle.tip} → f${Math.round(f)} (${(f/fps).toFixed(2)}s)`:d.exit?`leaves ${df>=0?'+':''}${df}f`:d.point?d.point.tip:'');
  });
  const up=()=>{const d=TL.drag; TL.drag=null; TL.frozen=null; if(!d) return;
    if(d.pan){ c.style.cursor=U.space?'grab':''; return; }
    if(d.marquee){ const m=d.marquee; if(Math.abs(m.x1-m.x0)<3&&Math.abs(m.y1-m.y0)<3&&!d.keep.length){U.dopeSel=[];U.selIds=[];} TL.anchor=(U.dopeSel||[])[0]; refresh(); return; }
    if(d.clip&&!d.moved){ H.u.pop(); updUndo(); setCtx(d.clip.ctx); return; }
    if(d.blocks&&!d.moved){ H.u.pop(); updUndo(); drawDope(); return; }
    if(!d.scrub) refresh(); else drawDope(); };
  c.addEventListener('pointerup',up); c.addEventListener('pointercancel',up);
  c.addEventListener('wheel',e=>{
    e.preventDefault(); const p=rect(e), V0=tlView(), span=V0.f1-V0.f0;
    if(e.ctrlKey||e.metaKey){ const f=TL.F(p.x), k=Math.exp(clamp(e.deltaY,-60,60)*.01), s=clamp(span*k,10,1e6); TL.f0=f-(f-V0.f0)*s/span; TL.f1=TL.f0+s; }
    else if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){ const d=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)/Math.max(1,TL.W-TL.LW)*span; TL.f0=V0.f0+d; TL.f1=V0.f1+d; }
    else if(p.y>=TL.listY0||TL.totalH>TL.H){ TL.scrollY+=e.deltaY; }
    else { const d=e.deltaY/Math.max(1,TL.W-TL.LW)*span; TL.f0=V0.f0+d; TL.f1=V0.f1+d; }
    drawDope(); updTlZoom();
  },{passive:false});
  // splitter: drag to resize the timeline
  const sp=$('#tlSplit'), ctr=document.querySelector('.center');
  if(sp&&ctr){ sp.addEventListener('pointerdown',e=>{e.preventDefault(); sp.classList.add('drag'); const y0=e.clientY, h0=$('#tl').getBoundingClientRect().height;
      const mv=ev=>{const h=clamp(h0-(ev.clientY-y0),120,Math.max(160,innerHeight-220)); ctr.style.setProperty('--tlh',h+'px'); resize();};
      const upp=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',upp);sp.classList.remove('drag');try{localStorage.setItem('gridblocks.tlh',String($('#tl').getBoundingClientRect().height));}catch(x){}};
      addEventListener('pointermove',mv); addEventListener('pointerup',upp);});
    try{const h=+localStorage.getItem('gridblocks.tlh'); if(h>100) ctr.style.setProperty('--tlh',h+'px');}catch(x){} }
}
function tlOpenRow(R,tab){
  if(R.ctx==='trans'){ const TPg=transP(geom()).groups; setCtx(TPg.length?'trans-'+TPg[0].k:'trans-in'); return; }
  if(R.ctx){ setCtx(R.ctx); return; }
  if(tab){ U.ctx=null; U.dopeSel=[]; U.selIds=[]; U.ctab=tab; goStep(SI('content')); refresh(); return; }
  if(R.stage){ U.ctx=null; goStep(SI(R.stage)); refresh(); }
}
/* right-click menu on the timeline */
function closeTlMenu(){const m=$('#tlMenu'); if(m) m.hidden=true;}
function tlMenu(e,h){
  const m=$('#tlMenu'); if(!m) return; let html='';
  if(h.type==='block'||h.type==='blabel'||h.type==='exit'){ if(tlSelIds().indexOf(h.id)<0) tlSelect(h.id,false);
    const ids=tlSelIds(), n=ids.length, virt=ids.some(id=>id<0);
    html=`<div class="mh">${n>1?n+' blocks':'Block'}</div><button data-tm="reset">Reset timing</button><button data-tm="nudge-6">Earlier 6f <kbd>⌥←</kbd></button><button data-tm="nudge6">Later 6f <kbd>⌥→</kbd></button><div class="msep"></div>`+
      (virt&&isGenerated()?'<button data-tm="edit">Make the line editable</button>':'')+`<button data-tm="del" class="danger">Remove <kbd>Del</kbd></button><button data-tm="delafter" class="danger">Remove this and all after <kbd>⇧Del</kbd></button>`;
  } else if(h.type==='point'||h.type==='curve'||(h.row&&h.row.k==='scene')){
    html='<div class="mh">Scene easing</div><button data-tm="easelin">Linear — blocks at their own speed</button><button data-tm="easereset">Ease in-out</button><button data-tm="easephase">Ease each phase (In · Hold · Out)</button><div class="msep"></div><button data-tm="ease">Open the big editor…</button><button data-tm="scene">Scene settings…</button>';
  } else return;
  m.innerHTML=html; m.hidden=false; m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,e.clientX))+'px'; m.style.top=Math.max(8,Math.min(innerHeight-m.offsetHeight-8,e.clientY))+'px';
}
function tlNudge(df){ const ids=tlSelIds(); if(!ids.length) return; pushHist(true); D.anim.dt=D.anim.dt||{}; ids.forEach(id=>{const v=(+D.anim.dt[id]||0)+df; if(v) D.anim.dt[id]=v; else delete D.anim.dt[id];}); planCache.k=''; refresh(); }
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#tlMenu [data-tm]'); if(!b) return; closeTlMenu(); const a=b.dataset.tm, ids=tlSelIds();
  if(a==='reset'){pushHist(true);ids.forEach(id=>{delete D.anim.dt[id];delete D.anim.dx[id];});planCache.k='';refresh();}
  else if(a.indexOf('nudge')===0) tlNudge(+a.slice(5));
  else if(a==='edit'){materialize();refresh();}
  else if(a==='del') dopeRemove(false); else if(a==='delafter') dopeRemove(true);
  else if(a==='ease') openCurveEditor('anim.sceneCurve',0,1,'Scene easing · re-times the whole scene');
  else if(a==='easereset'){pushHist(true);D.anim.sceneEase.on=false;D.anim.sceneCurve=[0.42,0,0.58,1];planCache.k='';refresh();}
  else if(a==='easelin'){pushHist(true);D.anim.sceneEase.on=false;D.anim.sceneCurve=[0,0,1,1];planCache.k='';refresh();}
  else if(a==='easephase'){ // a point at each phase boundary, at the same place in scene time as in block time, flat (eased) through each
    const P=plan(geom()), Pc=P.c||P, C=Math.max(1,P.C), v1=clamp(((Pc.onEnd||P.startF+C)-P.startF)/C,.05,.95), v2=Pc.walkT!=null?clamp((Pc.walkT-P.startF)/C,v1+.02,.97):null;
    const pts=[{x:0,y:0}].concat([{x:v1,y:v1}],v2!=null?[{x:v2,y:v2}]:[],[{x:1,y:1}]);
    const h=pts.map((p,i)=>{const pv=pts[i-1],nx=pts[i+1];return {x:p.x,y:p.y,ix:pv?-(p.x-pv.x)*.45:0,iy:0,ox:nx?(nx.x-p.x)*.45:0,oy:0};});
    pushHist(true); D.anim.sceneEase.on=false; D.anim.sceneCurve=hPack(h); planCache.k=''; refresh(); }
  else if(a==='scene') setCtx('scene');
});
document.addEventListener('pointerdown',e=>{const m=$('#tlMenu'); if(m&&!m.hidden&&!(e.target.closest&&e.target.closest('#tlMenu'))) closeTlMenu();});
/* remove the selected timeline blocks: a layout block is deleted, a generated one is skipped.
   with shift: it and everything after it in the build go (the build gets shorter) */
function dopeRemove(after){
  const P=plan(geom()), ids=tlSelIds(); if(!ids.length) return;
  const idx=ids.map(id=>P.seq.findIndex(b=>b.id===id)).filter(i=>i>=0).sort((a,b)=>a-b); if(!idx.length){U.dopeSel=[];return;}
  pushHist();
  if(after&&(P.walkFrom==null||idx[0]<P.walkFrom)){
    const i=idx[0];
    if(isGenerated()){ D.anim.cutAt=Math.max(P.T[0]+1,P.T[i]-1); toast('The build now ends before that block','',true); }
    else { const drop=new Set(P.seq.slice(i,P.walkFrom!=null?P.walkFrom:P.seq.length).map(b=>b.id)); D.blocks=D.blocks.filter(b=>!drop.has(b.id)); toast(`Removed ${drop.size} blocks`,'',true); }
  } else {
    let k=0;
    idx.forEach(i=>{const b=P.seq[i]; if(b.id>0) D.blocks=D.blocks.filter(x=>x.id!==b.id); else D.anim.skip=(D.anim.skip||[]).concat([b.id]); k++;});
    toast(`Removed ${k} block${k===1?'':'s'}`,'',true);
  }
  U.dopeSel=[]; U.selIds=[]; planCache.k=''; refresh();
}
/* when each block leaves (real frames), or null */
function exitTimes(P,G,seq,done){
  const X=D.exit; if(!X||!X.on||!seq.length) return null;
  const out=new Array(seq.length).fill(null), fps=D.comp.fps||30;
  const TB=P.T0||P.T, done0=done.map((d,i)=>d-((P.T[i]||0)-(TB[i]||0)));   // exits are worked out on the un-retimed schedule
  if(X.mode==='hold'){ seq.forEach((b,i)=>{out[i]=Math.round(done[i]+(X.holdOn===false?1:Math.max(1,+X.hold||0)));}); }
  else if(X.mode==='end'){
    const t0=Math.round(P.startF+P.L+(X.holdOn===false?Math.min(0,+X.at||0):(+X.at||0))), stg=Math.max(0,+X.stagger||0);
    const order=seq.map((b,i)=>i); if(X.order==='reverse') order.reverse();
    order.forEach((i,k)=>{out[i]=Math.max(done0[i]+1,Math.round(t0+k*stg));});
  } else if(X.mode==='walk'){
    // walk-off: after the hold the line keeps walking; the oldest blocks leave first so only a short trail follows the head
    // snake: a block leaves when the block K places ahead of it lands, so exactly K follow the head.
    // At the start of the walk the surplus old blocks peel away quickly, oldest first.
    const tW=P.walkT!=null?P.walkT:Math.round(Math.max(...done)+(X.holdOn===false?0:Math.max(0,+X.walkHold||0))), pc=Math.max(1,(+D.anim.pace||6)*Math.max(.1,+X.walkPace||1));
    const K=Math.max(1,Math.round(+X.trail||6)), n=seq.length, Nb=P.walkFrom!=null?P.walkFrom:n, surplus=Math.max(0,Nb-K), peel=Math.max(8,Math.round(pc*3));
    const lastT=TB[n-1];
    seq.forEach((b,i)=>{
      let t;
      if(i<surplus) t=tW+Math.round(i/Math.max(1,surplus)*peel);
      else t=i+K<n?TB[i+K]:lastT+(i+K-n+1)*pc;
      out[i]=Math.max(Math.round(done0[i]!=null?done0[i]+1:TB[i]+1),Math.round(Math.max(t,tW)));
    });
  } else if(X.mode==='behind'){
    // leaves when its right edge passes the exit line (X% of the frame from the left) — blocks trail away behind the camera
    const line=G.W*clamp(+X.line||10,-50,100)/100, maxT=Math.round(P.startF+P.L+600);
    seq.forEach((b,i)=>{
      const r=cellRect(G,b.c,b.r,b.w,b.h); let t=Math.ceil(done[i]), hit=null;
      for(;t<=maxT;t++){const off=ev(P.cam,t,[0,0]),s=ev(P.zs,t,100)/100,pn=ev(P.pan,t,[0,0]);const xr=G.W/2+s*(r.x+r.w+off[0]-G.W/2)+pn[0];if(xr<line){hit=t;break;}
        if(P.cam.length&&t>P.cam[P.cam.length-1][0]+1&&t>(P.zs.length?P.zs[P.zs.length-1][0]:0)) break;}
      out[i]=hit;
    });
  }
  return out;
}
function animOn(){return D.anim.mode!=='static'||transOn();}
function animActive(){return animOn()&&U.t!==null&&!(STEPS[U.step].id==='layout'&&!U.playing&&!U.preview);}
/* current preview state: null (editing), ghost (animate step, layout view), or live (scrubbing/playing) */
function animState(G){
  if(!animOn()) return null;
  const P=plan(G);
  if(STEPS[U.step].id==='layout'&&!U.playing&&!U.preview) return {P,live:false,t:0,off:[0,0],s:1,pan:[0,0]};   // Blocks step: see every block, wherever the playhead is
  if(U.t===null) return {P,live:false,t:0,off:[0,0],s:1,pan:[0,0]};
  return {P,live:true,t:U.t,off:ev(P.cam,U.t,[0,0]),s:ev(P.zs,U.t,100)/100,pan:ev(P.pan,U.t,[0,0])};
}

/* ------------------------------------------------------------------ canvas + view */
const cv=$('#cv'), wrap=$('#wrap'); let ctx=cv.getContext('2d');
const V={sc:1,ox:0,oy:0,cw:0,ch:0,dpr:1,fit:'comp'};
let checker=null;
function makeChecker(){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.fillStyle='#28282c';x.fillRect(0,0,16,16);x.fillStyle='#202023';x.fillRect(0,0,8,8);x.fillRect(8,8,8,8);checker=ctx.createPattern(c,'repeat');}
function resize(){
  try{if(!$('#dope').hidden)drawDope();}catch(e){}
  const r=wrap.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  V.cw=r.width;V.ch=r.height;V.dpr=dpr;
  cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));
  makeChecker(); if(V.fit) fitView(V.fit); render();
}
/* the 'whole area' view: the frame with half a frame all round (2× the frame), grown to fit every block */
function extBounds(G){
  let x0=-G.W/2,y0=-G.H/2,x1=G.W*1.5,y1=G.H*1.5;
  let list=D.blocks.slice(); try{ if(D.anim.mode!=='static'&&planCache.v) list=list.concat(planCache.v.seq||[]); }catch(e){}
  list.forEach(b=>{const q=cellRect(G,b.c,b.r,b.w,b.h);x0=Math.min(x0,q.x-G.p);y0=Math.min(y0,q.y-G.p);x1=Math.max(x1,q.x+q.w+G.p);y1=Math.max(y1,q.y+q.h+G.p);});
  return{x:x0,y:y0,w:x1-x0,h:y1-y0};
}
function fitView(kind){
  const G=geom(); const b=kind==='all'?extBounds(G):{x:0,y:0,w:G.W,h:G.H};
  const padX=Math.min(70,Math.max(20,V.cw*.06)), padY=Math.min(70,Math.max(20,V.ch*.08));
  V.sc=Math.max(.005,Math.min((V.cw-2*padX)/b.w,(V.ch-2*padY)/b.h));
  V.ox=(V.cw-b.w*V.sc)/2-b.x*V.sc; V.oy=(V.ch-b.h*V.sc)/2-b.y*V.sc; V.fit=kind;
  updZoom();
}
function zoomAt(f,sx,sy){
  const ns=clamp(V.sc*f,.005,8); const wx=(sx-V.ox)/V.sc, wy=(sy-V.oy)/V.sc;
  V.sc=ns; V.ox=sx-wx*ns; V.oy=sy-wy*ns; V.fit=null; updZoom(); render();
}
function updZoom(){$('#zPct').textContent=Math.round(V.sc*100)+'%';}
function viewBounds(){return{x:-V.ox/V.sc,y:-V.oy/V.sc,w:V.cw/V.sc,h:V.ch/V.sc};}

/* preview motion blur: average a few sub-frames across the shutter (matches the AE build's motion blur) */
let mbOC=null, mbMax=12;
function mbWanted(A){return U.mbPrev&&D.out.mb&&A&&A.live&&D.anim.mode!=='static'&&D.anim.motion!=='stop';}
function render(){
  const G0=geom(), A0=animState(G0);
  if(!mbWanted(A0)) return renderFrame(ctx,true);
  const t0=U.t, fr=U.playing?Math.floor(t0):t0, sh=clamp((+D.out.mbAngle||180)/360,0,2);
  if(!mbOC) mbOC=document.createElement('canvas');
  if(mbOC.width!==cv.width||mbOC.height!==cv.height){mbOC.width=cv.width;mbOC.height=cv.height;}
  const oc=mbOC.getContext('2d'), t1=performance.now();
  // samples: enough that the streak (in screen pixels) has no visible gaps; nothing to blur → plain frame
  const P=A0.P, sp=t=>{const a=ev(P.cam,t-.5,[0,0]),b=ev(P.cam,t+.5,[0,0]),s=ev(P.zs,t,100)/100;return Math.hypot(b[0]-a[0],b[1]-a[1])*s;};
  const zs=Math.abs(ev(P.zs,fr+.5,100)-ev(P.zs,fr-.5,100))/100*Math.max(G0.W,G0.H)/2;
  const streak=(sp(fr)+zs)*sh*V.sc*V.dpr;
  const mbN=Math.round(clamp(streak/2.5,1,mbMax));
  if(mbN<2){U.t=fr;renderFrame(ctx,true);U.t=t0;return;}
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
  for(let k=0;k<mbN;k++){
    U.t=fr+sh*((k+.5)/mbN-.5);
    renderFrame(oc,false);
    ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1/(k+1); ctx.drawImage(mbOC,0,0);
  }
  ctx.globalAlpha=1; U.t=t0;
  // overlays (order numbers, outlines) drawn once, sharp, at the shown frame
  const G=geom(), A=animState(G); ctx.setTransform(V.dpr,0,0,V.dpr,0,0); ctx.save(); ctx.translate(V.ox,V.oy); ctx.scale(V.sc,V.sc);
  ctx.lineWidth=1/V.sc; ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.strokeRect(0,0,G.W,G.H);
  drawOverlays(G,A); ctx.restore(); updBackBtn(G);
  const ms=performance.now()-t1; if(ms>40&&mbMax>3) mbMax--; else if(ms<16&&mbMax<16) mbMax++;
}
function renderFrame(target,overlays){
  const saved=ctx; ctx=target;
  try{
  const G=geom(), sc=V.sc, A=animState(G);
  ctx.setTransform(V.dpr,0,0,V.dpr,0,0);
  ctx.clearRect(0,0,V.cw,V.ch);
  ctx.save(); ctx.translate(V.ox,V.oy); ctx.scale(sc,sc);
  drawWorld(ctx,G,{alpha:.2,sc,A,inside:false});
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,G.W,G.H); ctx.clip();
  drawWorld(ctx,G,{alpha:1,sc,A,inside:true});
  ctx.restore();
  ctx.globalAlpha=1;
  // lab: ticker + momentum particles, in screen space
  if(A&&A.live&&labScreenOn()){ctx.save();ctx.beginPath();ctx.rect(0,0,G.W,G.H);ctx.clip();drawLabScreen(ctx,G,A.t);ctx.restore();}
  // transitions sit on top, in screen space (not affected by the camera)
  if(transOn()&&(A&&A.live||STEPS[U.step].id==='transitions')){
    const TP=transP(G); ctx.save(); ctx.beginPath(); ctx.rect(0,0,G.W,G.H); ctx.clip();
    TP.tiles.forEach(tl=>{
      if(A&&A.live){const q={x:tl.x,y:tl.y,w:tl.w,h:tl.h};const st=blockState(tl.K,A.t,q);if(st.op<=0.001||st.w<=0.01||st.sx<=0.001)return;
        ctx.globalAlpha=st.op;const cx=st.x+st.w/2,cy=st.y+st.h/2;ctx.save();ctx.translate(cx,cy);ctx.scale(st.sx,st.sy);ctx.translate(-cx,-cy);ctx.fillStyle=tl.color;ctx.fillRect(st.x,st.y,st.w,st.h);ctx.restore();}
      else {ctx.globalAlpha=1;ctx.lineWidth=1/sc;ctx.strokeStyle=tl.g==='in'?'rgba(43,217,143,.55)':'rgba(255,194,26,.55)';ctx.strokeRect(tl.x+2/sc,tl.y+2/sc,tl.w-4/sc,tl.h-4/sc);}
    });
    ctx.restore(); ctx.globalAlpha=1;
  }
  if(overlays){ctx.lineWidth=1/sc; ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.strokeRect(0,0,G.W,G.H);
  drawOverlays(G,A);}
  ctx.restore();
  if(overlays) updBackBtn(G);
  } finally { ctx=saved; }
}
function zoomXf(g,G,s,pan){if(pan&&(pan[0]||pan[1]))g.translate(pan[0],pan[1]);if(s!==1){g.translate(G.W/2,G.H/2);g.scale(s,s);g.translate(-G.W/2,-G.H/2);}}
function blockState(K,t,q){
  const st={op:1,tp:1,sx:1,sy:1,x:q.x,y:q.y,w:q.w,h:q.h};
  if(!K) return st;
  st.op=ev(K.op,t,100)/100; st.tp=ev(K.top,t,100)/100;
  const s=ev(K.sc,t,[100,100]); st.sx=s[0]/100; st.sy=s[1]/100;
  if(K.rs.length){const rs=ev(K.rs,t,[q.w,q.h]), rp=ev(K.rp,t,[0,0]); const cx=q.x+q.w/2+rp[0]; st.w=rs[0]; st.h=rs[1]; st.x=cx-st.w/2; st.y=q.y+(q.h-st.h)/2+rp[1];}
  return st;
}
function drawBlock(g,G,b,o,dx,dy,st,ghost){
  const q=cellRect(G,b.c,b.r,b.w,b.h);
  if(!st) st={op:1,tp:1,sx:1,sy:1,x:q.x,y:q.y,w:q.w,h:q.h};
  if(st.op<=0.001||st.w<=0.01||st.sx<=0.001) return;
  const x=st.x+dx, y=st.y+dy, w=st.w, h=st.h;
  g.save();
  g.globalAlpha=o.alpha*st.op*(ghost?.38:1);
  const cx=x+w/2, cy=y+h/2;
  g.translate(cx,cy); g.scale(st.sx,st.sy); g.translate(-cx,-cy);
  if(isOutline(b)){const lw=Math.max(1/o.sc,+D.fill.outlineW||2);g.strokeStyle=b.color;g.lineWidth=lw;g.strokeRect(x+lw/2,y+lw/2,w-lw,h-lw);}
  else {g.fillStyle=b.color; g.fillRect(x,y,w,h);}
  if(o.inside&&!ghost&&D.fill.on){
    const items=fillItems(G,b,q,false);
    if(items.length){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();drawFillItems(g,items,dx,dy,o.fillT!=null&&o.fillBase?o.fillBase[b.id]:null,o.fillT,o.alpha*st.op,o.fillEnd?o.fillEnd[b.id]:undefined);g.restore();}
  }
  if(o.inside&&!ghost&&o.nums&&o.nums[b.id]!=null&&numOn(b)){
    const K=o.tracks?o.tracks[b.id]:null, na=K&&K.num&&K.num.length?ev(K.num,o.fillT,100)/100:1;
    if(na>0){
      const str=numStr(o.nums[b.id]), L=numLayout({x:q.x+dx,y:q.y+dy,w:q.w,h:q.h},str);
      g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
      g.globalAlpha=o.alpha*st.op*na*clamp(+D.num.opacity||100,0,100)/100; g.fillStyle=D.num.color;
      g.font=cssFont(D.fill.family,D.fill.style,L.size); g.textBaseline='top'; g.textAlign='right'; g.fillText(str,L.x,L.y);
      g.restore();
    }
  }
  if(ghost){g.globalAlpha=o.alpha*.8;g.setLineDash([5/o.sc,4/o.sc]);g.lineWidth=1.2/o.sc;g.strokeStyle='#fff';g.strokeRect(x,y,w,h);g.setLineDash([]);}
  if(b.text&&o.inside&&st.tp>0&&!ghost){
    g.globalAlpha=o.alpha*st.op*st.tp;
    g.beginPath(); g.rect(x,y,w,h); g.clip();
    drawText(g,b,q.x+dx,q.y+dy,q.w,q.h);
  }
  g.restore();
}
function drawFillItems(g,items,dx,dy,base,tf,alpha,tEnd){
  const met=fillMetrics(), fps=D.comp.fps||30, F=D.fill;
  g.save(); g.globalAlpha=alpha;
  items.forEach(it=>{
    const t0=base!=null?base+(it.slot||0)*Math.max(0,+F.anim.stagger||0):null;
    if(t0!=null&&tf<t0) return;
    g.fillStyle=it.color; g.strokeStyle=it.color;
    if(it.kind==='shape'){ const st=t0!=null?shapeAt(Object.assign({},it,{t0,tEnd}),tf,fps):null; if(t0!=null&&!st) return; drawShapeItem(g,it,dx,dy,st,alpha); return; }
    if(it.kind!=='text'&&t0!=null){const sa=fillShapeAlpha(Object.assign({},it,{t0,tEnd}),tf,fps);if(sa<=0)return;g.globalAlpha=alpha*sa;} else g.globalAlpha=alpha;
    if(it.kind==='logo'){
      if(!avaxPath2D&&typeof Path2D!=='undefined') avaxPath2D=AVAX_LOGO.d.map(d=>new Path2D(d));
      if(avaxPath2D){g.save();g.translate(it.x+dx,it.y+dy);g.scale(it.s,it.s);avaxPath2D.forEach(p=>g.fill(p));g.restore();}
      return;
    }
    if(it.kind==='dots'){
      const d=it.d;
      if(it.sq) it.rects.forEach(f=>{for(let r=0;r<f.rows;r++)for(let c=0;c<f.cols;c++)g.fillRect(f.x+dx+c*it.sp-d/2,f.y+dy+r*it.sp-d/2,d,d);});
      else it.rects.forEach(f=>{for(let r=0;r<f.rows;r++)for(let c=0;c<f.cols;c++){g.beginPath();g.arc(f.x+dx+c*it.sp,f.y+dy+r*it.sp,d/2,0,7);g.fill();}});
      return;
    }
    if(it.kind==='icon'){drawIcon(g,it.name,it.x+dx,it.y+dy,it.s,it.color);return;}
    if(it.kind==='ring'){
      g.lineWidth=it.w; g.beginPath(); g.arc(it.cx+dx,it.cy+dy,it.r,0,7); g.stroke();
      g.beginPath(); g.arc(it.cx+dx,it.cy+dy,it.r*.32,0,7); g.stroke();
      g.beginPath(); g.moveTo(it.cx+dx-it.r,it.cy+dy); g.lineTo(it.cx+dx-it.r*.32,it.cy+dy); g.moveTo(it.cx+dx+it.r*.32,it.cy+dy); g.lineTo(it.cx+dx+it.r,it.cy+dy); g.stroke();
      g.beginPath(); g.arc(it.cx+dx,it.cy+dy,it.r,Math.PI,0); g.closePath(); g.globalAlpha=alpha*.9; g.fill(); g.globalAlpha=alpha;
      return;
    }
    const res=t0!=null?fillTextAt(Object.assign({},it,{t0,tEnd}),tf,fps):{s:it.lines.join('\n'),a:1};
    if(!res||!res.s||res.a<=0) return;
    g.globalAlpha=alpha*res.a; const txt=res.s;
    const fs=it.sz||met.size, flh=it.sz?met.lh*it.sz/met.size:met.lh;
    g.font=cssFont(F.family,F.style,fs); g.textBaseline='top'; g.textAlign=it.align==='r'?'right':'left';
    txt.split('\n').forEach((l,i)=>g.fillText(l,it.x+dx,it.y+dy+i*flh));
  });
  g.restore();
}
function drawEcho(g,r,st,o,dx,dy,ghost){
  const E=D.echo;
  if(!st) st={op:clamp(+E.opacity||0,0,100)/100,sx:1,sy:1,x:r.x,y:r.y,w:r.w,h:r.h};
  if(r.src&&!st.src) st.src=r.src;
  if(st.op<=0.001||st.w<=0.01||st.sx<=0.001) return;
  const x=st.x+dx, y=st.y+dy, w=st.w, h=st.h, cx=x+w/2, cy=y+h/2;
  g.save(); g.globalAlpha=o.alpha*st.op*(ghost?.4:1);
  g.translate(cx,cy); g.scale(st.sx,st.sy); g.translate(-cx,-cy);
  if(E.fill){g.fillStyle=E.color;g.fillRect(x,y,w,h);}
  if(E.content&&D.fill.on&&!ghost&&o.inside&&st.src){const items=fillItems(geom(),st.src,r,true);if(items.length){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();drawFillItems(g,items,dx,dy,o.fillT!=null&&o.fillBase?o.fillBase['e'+st.src.id]:null,o.fillT,o.alpha*st.op,o.fillEnd?o.fillEnd['e'+st.src.id]:undefined);g.restore();}}
  if(E.stroke&&+E.sw>0){
    g.strokeStyle=E.scolor; g.lineWidth=+E.sw; g.setLineDash(E.dash?[Math.max(1,+E.dashL||1),Math.max(1,+E.dashG||1)]:[]);
    g.strokeRect(x,y,w,h); g.setLineDash([]);
  }
  g.restore();
}
function drawWorld(g,G,o){
  const sc=o.sc, A=o.A, live=!!(A&&A.live), camMode=live&&D.anim.mode==='camera';
  const s=live?A.s:1, off=live?A.off:[0,0], gridOff=camMode?off:[0,0];
  g.globalAlpha=o.alpha;
  const vb=viewBounds(), ext=extBounds(G);
  const bgR=vb;
  if(D.look.bgOn){g.fillStyle=D.look.bg;g.fillRect(bgR.x,bgR.y,bgR.w,bgR.h);}
  if(o.inside) drawMediaBg(g,G);
  else if(o.inside){g.save();g.fillStyle=checker||'#222';g.scale(1/sc,1/sc);g.fillRect(0,0,G.W*sc,G.H*sc);g.restore();}
  const pan=live?A.pan:[0,0];
  g.save(); zoomXf(g,G,s,pan);
  // which cells to draw
  // which cells to draw: whatever is in view (the grid goes on forever), coarser when zoomed far out
  let c0,c1,r0,r1;
  { const lv=live?{x:G.W/2+(vb.x-pan[0]-G.W/2)/s,y:G.H/2+(vb.y-pan[1]-G.H/2)/s,w:vb.w/s,h:vb.h/s}:vb;
    c0=Math.floor((lv.x-gridOff[0]-G.x0)/G.p)-1; c1=Math.ceil((lv.x+lv.w-gridOff[0]-G.x0)/G.p)+1;
    r0=Math.floor((lv.y-gridOff[1]-G.y0)/G.p)-1; r1=Math.ceil((lv.y+lv.h-gridOff[1]-G.y0)/G.p)+1;
    if((c1-c0)*(r1-r0)>60000){const k=Math.sqrt(60000/((c1-c0)*(r1-r0)));const cm=(c0+c1)/2,rm=(r0+r1)/2;c0=Math.floor(cm-(c1-c0)*k/2);c1=Math.ceil(cm+(c1-c0)*k/2);r0=Math.floor(rm-(r1-r0)*k/2);r1=Math.ceil(rm+(r1-r0)*k/2);} }
  g.save(); g.translate(gridOff[0],gridOff[1]);
  if(D.look.cellsMode!=='none'){
    g.fillStyle=D.look.cell;
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const q=cellRect(G,c,r);g.fillRect(q.x,q.y,q.w,q.h);}
  }
  if(D.look.linesOn){
    g.fillStyle=D.look.line; const min=1/(sc*s);
    linesFor(G,c0,c1,r0,r1,(+D.look.lineW||0)/s).forEach(a=>{let x=a[0],y=a[1],w=a[2],h=a[3];if(w<min){x+=(w-min)/2;w=min;}if(h<min){y+=(h-min)/2;h=min;}g.fillRect(x,y,w,h);});
  }
  const drawRules=()=>{
    if(!D.look.rulesOn) return;
    const k=clamp((+D.look.ruleParallax||100)/100,0,4), ro=[gridOff[0]*k,gridOff[1]*k], dc=Math.round((gridOff[0]-ro[0])/G.p);
    g.save(); g.translate(ro[0],ro[1]); g.globalAlpha=o.alpha*(live&&A.P&&A.P.ruleOp&&A.P.ruleOp.length?ev(A.P.ruleOp,A.t,100)/100:1);
    g.fillStyle=D.look.rule; const min=1/(sc*s);
    rulesFor(G,c0+dc-2,c1+dc+2,r0,r1,(+D.look.ruleW||1)/s).forEach(a=>{let x=a[0],w=a[2];if(w<min){x+=(w-min)/2;w=min;}g.fillRect(x,a[1],w,a[3]);});
    g.restore();
  };
  g.restore();
  if(D.look.ruleLayer!=='top') drawRules();
  // content timing for the preview
  o.fillT=live?A.t:null; o.fillBase=A&&A.P?A.P.fillBase:null; o.fillEnd=live&&A.P?A.P.fillEnd:null; o.tracks=live&&A.P?A.P.tracks:null; o.nums=D.num&&(D.num.on||D.blocks.some(b=>b.num))?blockNumbers(G):null;
  // echoes (behind everything else), then blocks
  if(live){
    A.P.echo.forEach(e=>{const st=blockState(e.K,A.t,e.rect);st.src=e.src;drawEcho(g,e.rect,st,o,off[0],off[1]);});
    A.P.statics.forEach(b=>drawBlock(g,G,b,o,off[0],off[1],null,false));
    A.P.seq.forEach(b=>{const q=cellRect(G,b.c,b.r,b.w,b.h);drawBlock(g,G,b,o,off[0],off[1],blockState(A.P.tracks[b.id],A.t,q),false);});
    drawLabWorld(g,A.P.lab,A.t,off[0],off[1],o.alpha);
  } else {
    const realB=A&&(A.P.lineShift||isGenerated())?A.P.seq.filter(b=>!b.virtual):D.blocks.filter(b=>valid(b,G));   // the whole line slid to keep its end row
    if(D.echo.on) echoTargets(A?A.P.seq:realB).forEach(b=>{const r=echoRect(G,b);drawEcho(g,r,null,o,0,0,b.virtual);});
    const dimmed=A&&D.anim.order==='manual'&&D.anim.unpicked!=='visible';
    realB.forEach(b=>{ if(dimmed&&!(b.mo>0)){g.save();g.globalAlpha=.35;drawBlock(g,G,b,o,0,0,null,true);g.restore();} else drawBlock(g,G,b,o,0,0,null,false); });
    // generated blocks: solid in the Blocks step (they're the line you're editing), ghosted elsewhere; walk-off blocks always ghosted
    if(A){ const solid=STEPS[U.step].id==='layout'&&D.anim.order!=='manual', wf=A.P.walkFrom;
      (D.anim.order==='manual'?A.P.ghosts:A.P.seq.filter(b=>b.virtual)).forEach(b=>{const walk=wf!=null&&A.P.seq.indexOf(b)>=wf; drawBlock(g,G,b,o,0,0,null,!(solid&&!walk));}); }
  }
  // text in the gaps between blocks
  if(D.fill.on&&D.fill.gap.on&&o.inside){
    const gl=A&&A.P&&A.P.gaps?A.P.gaps:gapItems(G,D.blocks.filter(b=>valid(b,G)));
    gl.forEach(it=>drawFillItems(g,[it],live?off[0]:0,live?off[1]:0,live&&it.t0!=null?it.t0-(it.slot||0)*Math.max(0,+D.fill.anim.stagger||0):null,live?A.t:null,o.alpha,live?it.tEnd:undefined));
  }
  if(D.look.ruleLayer==='top') drawRules();
  g.restore();
  g.globalAlpha=1;
}
const HANDLE=7; // px
function handlesFor(G,b){
  const q=cellRect(G,b.c,b.r,b.w,b.h);
  const xs=[q.x,q.x+q.w/2,q.x+q.w], ys=[q.y,q.y+q.h/2,q.y+q.h], out=[];
  const map=[['nw',0,0],['n',1,0],['ne',2,0],['e',2,1],['se',2,2],['s',1,2],['sw',0,2],['w',0,1]];
  map.forEach(m=>out.push({k:m[0],x:xs[m[1]],y:ys[m[2]]}));
  return out;
}
function drawOverlays(G,A){
  const sc=V.sc, tool=U.tool, live=!!(A&&A.live), s=live?A.s:1, bo=live?A.off:[0,0];
  // reveal zone (camera modes, 'when the camera arrives')
  if(STEPS[U.step].id==='animate'&&(D.anim.mode==='camera'||D.anim.mode==='push')&&D.anim.revealWhen==='arrive'){
    const bx=clamp(+D.anim.revealX||70,50,120)/100, by=D.anim.axis==='xy'?clamp(+D.anim.revealY||100,50,120)/100:1;
    ctx.save(); ctx.setLineDash([6/sc,5/sc]); ctx.lineWidth=1.25/sc; ctx.strokeStyle='rgba(43,217,143,.75)';
    ctx.strokeRect(G.W*(1-bx),G.H*(1-by),G.W*(2*bx-1),G.H*(2*by-1));
    ctx.setLineDash([]); ctx.fillStyle='rgba(43,217,143,.9)'; ctx.font=`${11/sc}px sans-serif`; ctx.fillText('reveal zone',G.W*(1-bx)+6/sc,G.H*(1-by)+14/sc);
    ctx.restore();
  }
  if(!live&&U.pickStart&&U.hover){ const q=cellRect(G,U.hover.c,U.hover.r,Math.max(1,D.block.w|0),Math.max(1,D.block.h|0));
    ctx.fillStyle='rgba(43,217,143,.35)'; ctx.fillRect(q.x,q.y,q.w,q.h); ctx.lineWidth=2/sc; ctx.strokeStyle='#2BD98F'; ctx.strokeRect(q.x,q.y,q.w,q.h); pill('first block',q.x+q.w/2,q.y-14/sc,sc,'#2BD98F','#000',true); }
  else if(!live&&STEPS[U.step].id==='layout'&&D.rand.startCol!=null){ const q=cellRect(G,+D.rand.startCol,D.rand.startR!=null?+D.rand.startR:Math.max(0,(D.rand.startRow|0)-1),Math.max(1,D.block.w|0),Math.max(1,D.block.h|0));
    ctx.setLineDash([6/sc,4/sc]); ctx.lineWidth=2/sc; ctx.strokeStyle='#2BD98F'; ctx.strokeRect(q.x,q.y,q.w,q.h); ctx.setLineDash([]); pill('START',q.x+5/sc,q.y+q.h-24/sc,sc,'#2BD98F','#000',false); }
  if(!live&&U.hover&&!U.drag&&!U.space&&!U.pickStart){
    const h=U.hover;
    if(tool==='stamp'){
      const sp=stampSpot(h,G);
      const b=sp||{c:h.c,r:h.r,w:Math.max(1,D.block.w|0),h:Math.max(1,D.block.h|0)};
      const ok=!!sp;
      const q=cellRect(G,b.c,b.r,b.w,b.h);
      ctx.fillStyle=hexA(D.block.color,ok?.5:.15); ctx.fillRect(q.x,q.y,q.w,q.h);
      ctx.lineWidth=1.5/sc; ctx.setLineDash(ok?[]:[5/sc,4/sc]); ctx.strokeStyle=ok?'rgba(255,255,255,.85)':'#ffb44d'; ctx.strokeRect(q.x,q.y,q.w,q.h); ctx.setLineDash([]);
      if(STEPS[U.step].id==='layout') pill(`${b.w} × ${b.h}  ·  ${Math.round(q.w)} × ${Math.round(q.h)} px`,q.x+q.w/2,q.y-14/sc,sc,'rgba(0,0,0,.8)','#fff',true);
    } else if((tool==='select'||tool==='draw'||tool==='erase')&&!blockAt(h.c,h.r)){
      const q=cellRect(G,h.c,h.r); ctx.fillStyle='rgba(230,33,47,.18)'; ctx.fillRect(q.x,q.y,q.w,q.h);
    }
  }
  if(U.sel&&!live){
    const ss=normSel(), q=cellRect(G,ss.c,ss.r,ss.w,ss.h);
    const er=(U.drag&&U.drag.type==='erase')||tool==='erase';
    ctx.fillStyle=er?'rgba(0,0,0,.35)':hexA(D.block.color,.35); ctx.fillRect(q.x,q.y,q.w,q.h);
    ctx.setLineDash([6/sc,4/sc]); ctx.lineWidth=2/sc; ctx.strokeStyle=er?'#ffb44d':'#fff'; ctx.strokeRect(q.x,q.y,q.w,q.h); ctx.setLineDash([]);
    pill(`${er?'Unmerge ':''}${ss.w} × ${ss.h}`,q.x+q.w/2,q.y+q.h/2,sc,'rgba(0,0,0,.78)','#fff',true);
  }
  ctx.save(); zoomXf(ctx,G,s,live?A.pan:null);
  const ssc=sc*s;
  const bad=U.drag&&(U.drag.type==='move'||U.drag.type==='resize')&&U.drag.bad;
  const list=live||(A&&A.P.lineShift)?A.P.seq:(A?D.blocks.filter(b=>valid(b,G)).concat(A.P.seq.filter(b=>b.virtual)):D.blocks.filter(b=>valid(b,G)));
  const selSet=new Set(tlSelIds());
  list.forEach(b=>{
    const q=cellRect(G,b.c,b.r,b.w,b.h), x=q.x+bo[0], y=q.y+bo[1];
    if(live){const K=A.P.tracks[b.id];if(K&&ev(K.op,A.t,100)<=0)return;if(K&&K.rs.length&&ev(K.rs,A.t,[1,1])[0]<=0)return;if(K&&K.sc.length&&ev(K.sc,A.t,[1,1])[0]<=0)return;}
    if(selSet.has(b.id)){
      ctx.lineWidth=4/ssc; ctx.strokeStyle='rgba(0,0,0,.5)'; ctx.strokeRect(x,y,q.w,q.h);
      ctx.lineWidth=2/ssc; ctx.strokeStyle=bad?'#ffb44d':'#fff'; if(bad)ctx.setLineDash([6/ssc,4/ssc]);
      ctx.strokeRect(x,y,q.w,q.h); ctx.setLineDash([]);
    }
    if(U.showOrder||tool==='order'){
      const man=D.anim.order==='manual'&&tool==='order'&&!b.virtual;
      pill(String(b.order),x+5/ssc,y+5/ssc,ssc,man&&!b.mo?'rgba(255,180,77,.9)':b.virtual?'rgba(0,0,0,.4)':'rgba(0,0,0,.65)',man&&!b.mo?'#000':'#fff',false);
    }
  });
  if(A&&STEPS[U.step].id==='animate'&&D.anim.ending==='spot'&&D.anim.extendOn&&A.P.endCol!=null){
    const mains=A.P.seq.filter(b=>!b.stack), lb=mains[mains.length-1]||{w:D.block.w|0,h:D.block.h|0};
    const ec=A.P.endCol, rMax=Math.max(0,G.R-lb.h);
    if(U.picking&&!live){
      // eligible end positions: the end column the grid rules lead to, any row
      for(let r=0;r<=rMax;r++){const q=cellRect(G,ec,r,lb.w,lb.h);ctx.fillStyle=U.hover&&U.hover.r===r?'rgba(43,217,143,.55)':'rgba(43,217,143,.16)';ctx.fillRect(q.x,q.y,q.w,q.h);ctx.lineWidth=1/ssc;ctx.strokeStyle='rgba(43,217,143,.7)';ctx.strokeRect(q.x,q.y,q.w,q.h);}
      const q0=cellRect(G,ec,0,lb.w,lb.h); pill('pick a row',q0.x+q0.w/2,q0.y-14/ssc,ssc,'#2BD98F','#000',true);
    }
    const q=cellRect(G,ec,A.P.endRowUsed!=null?A.P.endRowUsed:0,lb.w,lb.h), x=q.x+bo[0], y=q.y+bo[1];
    ctx.setLineDash([8/ssc,5/ssc]); ctx.lineWidth=2.5/ssc; ctx.strokeStyle='#2BD98F'; ctx.strokeRect(x,y,q.w,q.h); ctx.setLineDash([]);
    pill('END',x+q.w-30/ssc,y+5/ssc,ssc,'#2BD98F','#000',false);
  }
  // manual order: show the frame (safe area) clearly over the expanded grid
  if(A&&!live&&D.anim.order==='manual'){
    ctx.restore(); ctx.save();
    ctx.lineWidth=2/sc; ctx.strokeStyle='#FFC21A'; ctx.strokeRect(0,0,G.W,G.H);
    ctx.setLineDash([6/sc,5/sc]); ctx.lineWidth=1/sc; ctx.strokeStyle='rgba(255,194,26,.7)'; ctx.strokeRect(G.W*.05,G.H*.05,G.W*.9,G.H*.9); ctx.setLineDash([]);
    pill('FRAME',8/sc,-24/sc,sc,'#FFC21A','#000',false); pill('90% safe',G.W*.05+6/sc,G.H*.05+6/sc,sc,'rgba(0,0,0,.6)','#FFC21A',false);
    ctx.restore(); ctx.save(); zoomXf(ctx,G,s,live?A.pan:null);
  }
  ctx.restore();
  // resize handles (single selection, select tool, editing)
  const sel=selBlocks();
  if(!live&&tool==='select'&&sel.length===1&&(!U.drag||U.drag.type==='resize')){
    const hs=HANDLE/sc;
    handlesFor(G,sel[0]).forEach(h=>{ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1/sc;ctx.fillRect(h.x-hs/2,h.y-hs/2,hs,hs);ctx.strokeRect(h.x-hs/2,h.y-hs/2,hs,hs);});
  }
}
function hexA(h,a){const c=hexRgb(h);return`rgba(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0},${a})`;}
function pill(t,x,y,sc,bg,fg,center){
  ctx.save(); ctx.globalAlpha=1; const fs=11/sc; ctx.font=`600 ${fs}px Inter,-apple-system,Helvetica,Arial`;
  const w=Math.max(18/sc,ctx.measureText(t).width+12/sc), h=18/sc;
  const px=center?x-w/2:x, py=center?y-h/2:y;
  ctx.fillStyle=bg; rr(ctx,px,py,w,h,h/2); ctx.fill();
  ctx.fillStyle=fg; ctx.textBaseline='middle'; ctx.textAlign='center'; ctx.fillText(t,px+w/2,py+h/2+.5/sc);
  ctx.restore();
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

/* thumbnail for the library */
function thumb(){
  const G=geom(), tw=240, th=Math.max(1,Math.round(tw*G.H/G.W));
  const c=document.createElement('canvas'); c.width=tw; c.height=th;
  const g=c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,tw,th);
  const s=tw/G.W; g.scale(s,s);
  const keep=V.sc; V.sc=s;
  drawWorld(g,G,{alpha:1,sc:s,A:null,inside:true});
  V.sc=keep;
  try{return c.toDataURL('image/jpeg',.82);}catch(e){return '';}
}

/* ------------------------------------------------------------------ pointer */
function toWorld(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left-V.ox)/V.sc,y:(e.clientY-r.top-V.oy)/V.sc};}
function localPt(G,w){const A=animState(G);if(A&&A.live)return{x:G.W/2+(w.x-A.pan[0]-G.W/2)/A.s-A.off[0],y:G.H/2+(w.y-A.pan[1]-G.H/2)/A.s-A.off[1]};return w;}
function cellAt(G,w){return{c:Math.floor((w.x-G.x0)/G.p),r:Math.floor((w.y-G.y0)/G.p)};}
function handleAt(G,w){
  const sel=selBlocks(); if(U.tool!=='select'||sel.length!==1||animActive()) return null;
  const lim=(HANDLE+3)/V.sc;
  const h=handlesFor(G,sel[0]).find(h=>Math.abs(w.x-h.x)<=lim&&Math.abs(w.y-h.y)<=lim);
  return h?{k:h.k,b:sel[0]}:null;
}
const HCURSOR={n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize',ne:'nesw-resize',sw:'nesw-resize',nw:'nwse-resize',se:'nwse-resize'};
function clampCell(G,c){return{c:clamp(c.c,G.cLo,G.cHi),r:clamp(c.r,G.rLo,G.rHi)};}

cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);
  if(U.preview&&!U.playing&&STEPS[U.step].id==='layout'&&!U.space&&e.button===0&&U.tool!=='hand'&&U.tool!=='select'){U.preview=false;refresh();}   // back to every block for editing
  if(U.space) U.spacePanned=true;
  if(e.button===1||e.button===2||U.space||U.tool==='hand'){
    U.drag={type:'pan',x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY};cv.classList.add('grabbing');return;
  }
  if(e.button!==0) return;
  if(U.playing) stopPlay();
  const G=geom(), w=localPt(G,toWorld(e)), cell=cellAt(G,w), inR=inRange(G,cell.c,cell.r);
  const hd=handleAt(G,w);
  if(hd){U.drag={type:'resize',k:hd.k,id:hd.b.id,orig:{c:hd.b.c,r:hd.b.r,w:hd.b.w,h:hd.b.h},moved:false};return;}
  let b=inR?blockAt(cell.c,cell.r):null;
  if(b&&isGenerated()&&(plan(G).lineShift||0)) b=null;   // the line is drawn slid up/down: hit-test the drawn blocks instead
  const tool=U.tool;
  if(U.pickStart){ finishPickStart(cell); return; }
  if((tool==='stamp'||tool==='draw'||tool==='erase')&&isGenerated()&&e.button===0){ if(materialize()){ U.preview=false; b=inR?blockAt(cell.c,cell.r):null; } }
  if(tool==='select'&&!b&&inR&&!e.shiftKey){ const vb=virtualAt(G,cell);
    if(vb){ U.dopeSel=[vb.id]; U.selIds=[]; U.sel=null; U.ctx=null;
      if(!animActive()) U.drag={type:'vmove',vid:vb.id,sc:cell.c,sr:cell.r};
      refresh(); return; } }
  if(U.picking){ finishPick(cell); return; }
  if(tool==='paint'){
    if(b&&(e.altKey||e.shiftKey)){pushHist(true);D.block.color=b.color;syncPalettes();refresh();toast('Picked up '+b.color);return;}
    U.drag={type:'paint',before:snap(),any:false,seen:{}};
    if(b) paintBlock(b,U.drag);
    return;
  }
  if(tool==='order'){
    if(D.anim.order!=='manual'){pushHist(true);D.blocks.forEach(x=>x.mo=0);U.moNext=1;D.anim.order='manual';syncInputs();refresh();}
    if(b){
      pushHist(true);
      if(b.mo>0){const m=b.mo;b.mo=0;D.blocks.forEach(x=>{if(x.mo>m)x.mo--;});U.moNext=Math.max(1,U.moNext-1);toast('Removed from the sequence');}
      else b.mo=U.moNext++;
      select([b.id]); refresh(); return;
    }
    // a ghost from the continuation → make it a real block and add it
    const P=plan(G), gh=(P.ghosts||[]).find(x=>cell.c>=x.c&&cell.c<x.c+x.w&&cell.r>=x.r&&cell.r<x.r+x.h);
    if(gh){
      pushHist(true);
      if(gh.c+gh.w-1>G.cHi||gh.c<G.cLo) D.grid.overX=Math.max(D.grid.overX,gh.c+gh.w-G.C,-gh.c);
      const nb=newBlock(gh.c,gh.r,gh.w,gh.h,gh.color); nb.mo=U.moNext++; nb.stack=!!gh.stack; D.blocks.push(nb); select([nb.id]); syncInputs(); refresh();
    }
    return;
  }
  if(tool==='select'){
    if(b){
      if(e.shiftKey){const i=U.selIds.indexOf(b.id);if(i>=0)U.selIds.splice(i,1);else U.selIds.push(b.id);U.sel=null;refresh();return;}
      if(U.selIds.indexOf(b.id)<0) select([b.id]); else U.sel=null;
      if(animActive()){refresh();return;}
      const ids=U.selIds.slice();
      U.drag={type:'move',ids,sc:cell.c,sr:cell.r,orig:ids.map(id=>{const x=byId(id);return[x.c,x.r];}),moved:false,bad:false};
      cv.classList.add('grabbing'); refresh(); return;
    }
    if(!inR){select([]);refresh();return;}
    if(!e.shiftKey) U.selIds=[];
    U.sel={c0:cell.c,r0:cell.r,c1:cell.c,r1:cell.r}; U.drag={type:'sel'}; refresh(); return;
  }
  if(!inR) return;
  if(tool==='stamp'){
    const before=snap(); const ok=tryStamp(cell);
    if(ok){H.u.push(before);H.r=[];U.live=false;updUndo();}
    else if(b) select([b.id]); else toast(`A ${D.block.w} × ${D.block.h} block doesn’t fit there`);
    U.drag={type:'stamp',last:cell,any:ok,before}; refresh(); return;
  }
  if(tool==='draw'||tool==='erase'){
    U.selIds=[]; U.sel={c0:cell.c,r0:cell.r,c1:cell.c,r1:cell.r}; U.drag={type:tool}; refresh(); return;
  }
});
cv.addEventListener('pointermove',e=>{
  const G=geom(); let d=U.drag;
  if(d&&d.type==='pan'){V.ox+=e.clientX-d.x;V.oy+=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;V.fit=null;render();return;}
  const w=localPt(G,toWorld(e)), raw=cellAt(G,w), cell=clampCell(G,raw);
  if(d){
    if(d.type==='sel'||d.type==='draw'||d.type==='erase'){U.sel.c1=cell.c;U.sel.r1=cell.r;render();updPos(raw);updCtx();return;}
    if(d.type==='paint'){const pb=inRange(G,raw.c,raw.r)?blockAt(raw.c,raw.r):null;if(pb)paintBlock(pb,d);return;}
    if(d.type==='stamp'){
      if(cell.c!==d.last.c||cell.r!==d.last.r){d.last=cell;if(tryStamp(cell)){if(!d.any){H.u.push(d.before);H.r=[];U.live=false;updUndo();}d.any=true;render();}}
      return;
    }
    if(d.type==='vmove'){   // dragging a generated block: make the line editable, then it's a normal move
      if(cell.c===d.sc&&cell.r===d.sr) return;
      const map=materialize(); const nid=map&&map[d.vid]; const nb=nid!=null?byId(nid):null;
      if(!nb){U.drag=null;refresh();return;}
      H.r=[]; U.selIds=[nb.id]; U.dopeSel=[nb.id]; U.preview=false;
      U.drag={type:'move',ids:[nb.id],sc:d.sc,sr:d.sr,orig:[[nb.c,nb.r]],moved:true,bad:false}; cv.classList.add('grabbing');
      d=U.drag;
    }
    if(d.type==='resize'){
      const b=byId(d.id); if(!b) return; const o=d.orig;
      const bx=Math.round((w.x-G.x0+G.gut/2)/G.p), by=Math.round((w.y-G.y0+G.gut/2)/G.p);
      let L=o.c,R=o.c+o.w,T=o.r,B=o.r+o.h;
      if(d.k.indexOf('e')>=0) R=Math.max(L+1,bx); if(d.k.indexOf('w')>=0) L=Math.min(R-1,bx);
      if(d.k.indexOf('s')>=0) B=Math.max(T+1,by); if(d.k.indexOf('n')>=0) T=Math.min(B-1,by);
      const n={c:L,r:T,w:R-L,h:B-T};
      if((n.c!==b.c||n.r!==b.r||n.w!==b.w||n.h!==b.h)&&valid(n,G)&&!D.blocks.some(x=>x!==b&&hits(x,n))){
        if(!d.moved){pushHist();d.moved=true;}
        Object.assign(b,n); render(); renderInsp(); $('#hPos').textContent=`${n.w} × ${n.h}`;
      }
      return;
    }
    if(d.type==='move'){
      const dc=cell.c-d.sc, dr=cell.r-d.sr;
      const moved=d.ids.map((id,i)=>{const b=byId(id);return{b,c:d.orig[i][0]+dc,r:d.orig[i][1]+dr};});
      // clamp group to range
      let lo=0,hi=0,lo2=0,hi2=0;
      moved.forEach(m=>{lo=Math.max(lo,G.cLo-m.c);hi=Math.min(hi,G.cHi-(m.c+m.b.w-1));lo2=Math.max(lo2,G.rLo-m.r);hi2=Math.min(hi2,G.rHi-(m.r+m.b.h-1));});
      const fx=lo>0?lo:hi<0?hi:0, fy=lo2>0?lo2:hi2<0?hi2:0;
      let changed=false;
      moved.forEach(m=>{const nc=m.c+fx,nr=m.r+fy;if(m.b.c!==nc||m.b.r!==nr){changed=true;}});
      if(changed){
        if(!d.moved){pushHist();d.moved=true;}
        moved.forEach(m=>{m.b.c=m.c+fx;m.b.r=m.r+fy;});
        d.bad=moved.some(m=>D.blocks.some(x=>d.ids.indexOf(x.id)<0&&hits(x,m.b)));
        render(); updPos(raw);
      }
      return;
    }
  }
  const hd=handleAt(G,w); cv.style.cursor=hd?HCURSOR[hd.k]:'';
  const h=(U.picking||inRange(G,raw.c,raw.r))?raw:null;
  if(JSON.stringify(h)!==JSON.stringify(U.hover)){U.hover=h;render();updPos(h);}
});
function paintBlock(b,d){
  if(d.seen[b.id]||b.color===D.block.color) return;
  if(!d.any){H.u.push(d.before);H.r=[];U.live=false;updUndo();d.any=true;}
  d.seen[b.id]=1; const auto=b.textColor===contrast(b.color); b.color=D.block.color; if(auto)b.textColor=contrast(b.color);
  render();
}
function startPick(){
  pushHist(true); D.anim.ending='spot'; D.anim.extendOn=true; if(D.anim.order==='manual') D.anim.order='ltr';
  U.picking=true; U.t=null; stopPlay(); U.tool='hand';
  fitView('all'); syncInputs(); refresh();
  toast('Pan tool on. The green column is where your pattern ends. Click any row in it.');
}
function finishPick(cell){
  const rMax=Math.max(0,geom().R-Math.max(1,D.block.h|0));
  D.anim.endRow=clamp(cell.r,0,rMax)+1; U.picking=false; U.tool='select';
  fitView('comp'); syncInputs(); refresh();
  toast(`The pattern will end on row ${D.anim.endRow}. Switched back to the Select tool.`);
}
/* pick where the first block goes (before generating) */
function startPickStart(){ U.pickStart=true; U.preview=false; stopPlay(); refresh(); toast('Click where the first block should go','Esc to cancel'); }
function finishPickStart(cell){ U.pickStart=false; pushHist(true); D.rand.startCol=cell.c; D.rand.startR=cell.r; D.rand.startRow=clamp(cell.r+1,0,60);
  if(isGenerated()||!D.blocks.length) generateLine(false,false); else refresh(); syncInputs(true); toast(`The line starts at column ${cell.c+1}, row ${cell.r+1}`,'⌘Z to undo',true); }
function clearPickStart(){ pushHist(true); D.rand.startCol=null; D.rand.startR=null; D.rand.startRow=0; if(isGenerated()) generateLine(false,true); syncInputs(true); refresh(); }
function cancelPick(){U.picking=false;U.tool='select';refresh();toast('End spot picking cancelled');}
function endDrag(e){
  const d=U.drag; if(!d) return; U.drag=null; cv.classList.remove('grabbing');
  if(d.type==='pan'&&U.picking&&e&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<5){
    const G=geom(); finishPick(cellAt(G,localPt(G,toWorld(e)))); return;
  }
  if(d.type==='move'){
    if(d.bad){d.ids.forEach((id,i)=>{const b=byId(id);b.c=d.orig[i][0];b.r=d.orig[i][1];});H.u.pop();updUndo();toast('That spot overlaps another block');}
    refresh();
  } else if(d.type==='sel'&&U.sel&&U.sel.c0===U.sel.c1&&U.sel.r0===U.sel.r1){ U.sel=null; refresh(); }
  else if(d.type==='draw'){ const s=normSel(); U.sel=null; mergeRect(s); }
  else if(d.type==='erase'){ eraseRect(normSel()); }
  else refresh();
}
cv.addEventListener('pointerup',endDrag);
cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('pointerleave',()=>{if(!U.drag&&U.hover){U.hover=null;render();updPos(null);}});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('dblclick',e=>{
  const G=geom(), c=cellAt(G,localPt(G,toWorld(e))); const b=inRange(G,c.c,c.r)?blockAt(c.c,c.r):null;
  if(!b) return;
  select([b.id]);
  if(STEPS[U.step].id!=='content') goStep(SI('content'));
  refresh(); setTimeout(()=>{const t=$('#insp textarea');if(t){t.focus();t.select();}},30);
});
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=cv.getBoundingClientRect();
  if(e.ctrlKey||e.metaKey){zoomAt(Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top);}
  else{V.ox-=e.deltaX;V.oy-=e.deltaY;V.fit=null;render();}
},{passive:false});
function updPos(c){
  const s=U.sel&&U.drag?normSel():null;
  $('#hPos').textContent=s?`${s.w}×${s.h} at ${colLabel(s.c)} ${rowLabel(s.r)}`:c?`${colLabel(c.c)} · ${rowLabel(c.r)}`:'—';
}

/* ------------------------------------------------------------------ swatches */
function swatchHTML(cur,key){
  return (D.palette||PALETTE).map(c=>`<button class="swatch${c.toLowerCase()===String(cur).toLowerCase()?' on':''}" style="background:${c}" data-sw="${key}" data-c="${c}" title="${c}"></button>`).join('')
   +`<label class="colorbtn swatch custom" title="Pick any colour" style="width:20px;height:20px"><input type="color" data-swc="${key}" value="${/^#[0-9a-f]{6}$/i.test(cur)?cur:'#ff0000'}"></label>`;
}
/* content module checkboxes + icon set, generated from the lists */
function iconSVG(name){
  const I=ICONS[name]; if(!I) return ''; const s=24, lw=1.7;
  return `<svg viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round">${I.prims.map(p=>{
    const f=p.f?' fill="currentColor" stroke="none"':'';
    if(p.t==='c') return `<circle cx="${p.cx*s}" cy="${p.cy*s}" r="${p.r*s}"${f}/>`;
    if(p.t==='r') return `<rect x="${p.x*s}" y="${p.y*s}" width="${p.w*s}" height="${p.h*s}" rx="${(p.rr||0)*s}"${f}/>`;
    return `<${p.closed?'polygon':'polyline'} points="${p.pts.map(q=>(q[0]*s).toFixed(2)+','+(q[1]*s).toFixed(2)).join(' ')}"${f}/>`;}).join('')}</svg>`;
}
function pxSVG(k){const u=2;return `<svg viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges">${pxRuns(k).map(r=>`<rect x="${r[0]*u}" y="${r[1]*u}" width="${r[2]*u}" height="${u}"/>`).join('')}</svg>`;}
/* tiny chip glyphs for graphs / combos / patterns */
const GLYPH={line:'M1 10 L5 6 L8 8 L15 2',step:'M1 10 H5 V6 H9 V8 H12 V3 H15',area:'M1 11 L1 8 L5 5 L9 7 L15 2 L15 11 Z',bars:'M2 11V7M5 11V5M8 11V8M11 11V3M14 11V6',hist:'M1 11V8M3 11V6M5 11V9M7 11V5M9 11V7M11 11V4M13 11V8M15 11V6',
  candles:'M3 2V10M8 3V11M13 1V8',meter:'M1 4H4V9H1ZM6 4H9V9H6Z',heat:'M1 1H4V4H1ZM6 6H9V9H6ZM11 1H14V4H11ZM1 8H4V11H1Z',network:'M2 2L8 7L14 3M8 7L5 11',wave:'M1 6 Q3 0 5 6 T9 6 T13 6 T16 6',depth:'M1 3 H4 V6 H7 V10 M9 10 V7 H12 V4 H15'};
const TEXT_MODS=FILL_MODULES.filter(m=>['dots','ring','logo','icons'].indexOf(m[0])<0);
function chipBtn(key,label,glyph){return `<button data-chip="${key}">${glyph?`<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.4">${glyph}</svg>`:''}${label}</button>`;}
const LOOKS={
  dashboard:{name:'Dashboard',sub:'stats + charts',text:['counter','latency','progress','kv','block','mempool','status'],graph:['line','area','bars','meter','candles'],combo:['stat','labelgraph','badge'],pat:['dots','cross'],mix:[40,30,30],density:'medium',iconPct:20,patternPct:35},
  terminal:{name:'Terminal',sub:'logs + hex',text:['log','rpc','dev','hashes','stream','status','consensus','phrase','barcode'],graph:['wave'],combo:['badge','frame'],pat:['scan'],mix:[80,5,15],density:'busy',iconPct:10,patternPct:55},
  charts:{name:'Charts',sub:'graph heavy',text:['counter','latency','block'],graph:['line','step','candles','hist','depth','wave','heat'],combo:['labelgraph'],pat:['cross'],mix:[15,65,20],density:'busy',iconPct:5,patternPct:30},
  iconic:{name:'Iconic',sub:'pixel icons',text:['status','phrase','term'],graph:['meter','heat'],combo:['stat','badge','iconrow'],pat:['dots'],mix:[25,15,60],density:'medium',iconPct:65,patternPct:30},
  network:{name:'Network',sub:'nodes + consensus',text:['validator','consensus','status','log','latency'],graph:['network','heat','wave'],combo:['iconrow','badge','frame'],pat:['hatch','dots'],mix:[40,35,25],density:'medium',iconPct:30,patternPct:40},
  minimal:{name:'Minimal',sub:'one thing each',text:['status','phrase','counter'],graph:['line','meter'],combo:['frame','stat'],pat:[],mix:[45,25,30],density:'light',iconPct:20,patternPct:0}
};
function catKeys(cat){return cat==='text'?TEXT_MODS.map(m=>m[0]):cat==='graph'?GRAPHS.map(g=>g[0]):cat==='combo'?COMBOS.map(c=>c[0]):cat==='pat'?PATTERNS.map(q=>q[0]):cat==='icons'?(D.fill.iconLib==='line'?ICON_KEYS:PX_KEYS):[];}
function catGet(cat,k){const F=D.fill;return cat==='text'?!!F.mods[k]:cat==='graph'?!!F.graphs[k]:cat==='combo'?!!F.combos[k]:cat==='pat'?(k==='dots'?!!F.mods.dots:!!F.pats[k]):cat==='icons'?(D.fill.iconLib==='line'?(!F.iconSet||F.iconSet[k]!==false):(!F.pxSet||F.pxSet[k]!==false)):false;}
function catSet(cat,k,v){const F=D.fill;if(cat==='text')F.mods[k]=v;else if(cat==='graph')F.graphs[k]=v;else if(cat==='combo')F.combos[k]=v;else if(cat==='pat'){if(k==='dots')F.mods.dots=v;else F.pats[k]=v;}
  else if(cat==='icons'){if(F.iconLib==='line'){F.iconSet=F.iconSet||{};F.iconSet[k]=v;}else{F.pxSet=F.pxSet||{};F.pxSet[k]=v;}}}
function rollCat(cat,r){
  const keys=catKeys(cat), R=r||Math.random, sh=keys.slice().sort(()=>R()-.5);
  const n=cat==='text'?3+Math.floor(R()*6):cat==='graph'?2+Math.floor(R()*4):cat==='combo'?1+Math.floor(R()*3):cat==='pat'?(R()<.25?0:1+(R()<.3?1:0)):cat==='icons'?6+Math.floor(R()*12):keys.length;
  keys.forEach(k=>catSet(cat,k,sh.indexOf(k)<n));
  if(cat==='pat') D.fill.patternPct=n?Math.round(20+R()*45):D.fill.patternPct;
  if(cat==='icons'){D.fill.iconPct=Math.round(10+R()*55);D.fill.mods.icons=true;}
}
function rollAll(){
  const R=Math.random, F=D.fill; ['text','graph','combo','pat','icons'].forEach(c=>rollCat(c,R));
  const m=[R(),R(),R()].map(v=>Math.round(10+v*60/5)*5); F.mix={text:m[0],graph:m[1],combo:m[2]};
  F.density=['light','medium','medium','busy'][Math.floor(R()*4)]; F.textPct=Math.round(55+R()*45/5)*5; F.seed=Math.floor(R()*99999);
  F.look='custom';
}
function applyLook(id){
  const L=LOOKS[id]; if(!L) return; const F=D.fill;
  ['text','graph','combo','pat'].forEach(c=>catKeys(c).forEach(k=>catSet(c,k,L[c].indexOf(k)>=0)));
  F.mix={text:L.mix[0],graph:L.mix[1],combo:L.mix[2]}; F.density=L.density; F.iconPct=L.iconPct; F.patternPct=L.patternPct; F.mods.icons=true; F.look=id;
}
function buildModUI(){
  const ck=(key,label)=>`<label class="check"><input type="checkbox" data-bind="${key}"> ${label}</label>`;
  const gp=$('#modGridGap'); if(gp) gp.innerHTML=GAP_MODULES.map(m=>ck('fill.gap.mods.'+m[0],m[1])).join('');
  const set=(id,h)=>{const el=$(id); if(el) el.innerHTML=h;};
  set('#chipText',TEXT_MODS.map(m=>chipBtn('text:'+m[0],m[1])).join(''));
  set('#chipGraph',GRAPHS.map(g=>chipBtn('graph:'+g[0],g[1],`<path d="${GLYPH[g[0]]||''}"/>`)).join(''));
  set('#chipCombo',COMBOS.map(c=>chipBtn('combo:'+c[0],c[1])).join(''));
  set('#chipPat',PATTERNS.map(q=>chipBtn('pat:'+q[0],q[1])).join(''));
  set('#lookRow',Object.keys(LOOKS).map(k=>`<button data-look="${k}" title="${LOOKS[k].name}: ${LOOKS[k].sub}">${LOOKS[k].name}<small>${LOOKS[k].sub}</small></button>`).join(''));
  buildIconSet();
}
function buildIconSet(){
  const is=$('#iconSet'); if(!is) return; const px=D.fill.iconLib!=='line'; is.classList.toggle('px',px); is.dataset.lib=px?'px':'line';
  is.innerHTML=px?PX_KEYS.map(k=>`<button data-icon="${k}" title="${PX_ICONS[k].name}">${pxSVG(k)}<span>${PX_ICONS[k].name}</span></button>`).join('')
                 :ICON_KEYS.map(k=>`<button data-icon="${k}" title="${ICONS[k].name}">${iconSVG(k)}<span>${ICONS[k].name}</span></button>`).join('');
}
function syncIconSet(){
  const is=$('#iconSet'); if(is&&is.dataset.lib!==(D.fill.iconLib!=='line'?'px':'line')) buildIconSet();
  $$('#iconSet [data-icon]').forEach(b=>b.classList.toggle('on',catGet('icons',b.dataset.icon)));
  $$('[data-chip]').forEach(b=>{const p=b.dataset.chip.split(':');b.classList.toggle('on',catGet(p[0],p[1]));});
  $$('[data-cnt]').forEach(el=>{const c=el.dataset.cnt, ks=catKeys(c==='pat'?'pat':c); el.textContent=ks.filter(k=>catGet(c,k)).length+'/'+ks.length;});
  $$('#lookRow [data-look]').forEach(b=>b.classList.toggle('on',D.fill.look===b.dataset.look));
  const ln=$('#lookName'); if(ln) ln.textContent=LOOKS[D.fill.look]?LOOKS[D.fill.look].name:'custom';
  const mb=$('#mixBar'); if(mb){const M=D.fill.mix||{}, t=(+M.text||0)+(+M.graph||0)+(+M.combo||0)||1; mb.innerHTML=[['text','var(--muted)'],['graph','var(--accent)'],['combo','#0061E2']].map(c=>`<i style="width:${(+M[c[0]]||0)/t*100}%;background:${c[1]}"></i>`).join('');}
}
function syncPalettes(){
  $$('[data-pal]').forEach(el=>{el.innerHTML=swatchHTML(getP(el.dataset.pal),el.dataset.pal);});
  const pe=$('#paletteEdit'); if(pe) pe.innerHTML=(D.palette||[]).map((c,i)=>`<button class="swatch" style="background:${c}" data-pal-i="${i}" title="${c} — click to use, Alt-click to remove"></button>`).join('');
}
let swPushed=null;
function applySwatch(key,c,fromPicker){
  c=c.toUpperCase();
  if(!fromPicker||swPushed!==key){pushHist(key.indexOf('block.')===0||key.indexOf('echo.')===0||key.indexOf('fill.')===0||key.indexOf('trans.')===0||key.indexOf('num.')===0||key.indexOf('lab.')===0);swPushed=fromPicker?key:null;}
  if(key.indexOf('echo.')===0||key.indexOf('fill.')===0||key.indexOf('trans.')===0||key.indexOf('num.')===0||key.indexOf('lab.')===0){ setP(key,c); fillCache.clear(); if(!fromPicker) syncPalettes(); syncInputs(); render(); return; }
  if(key.indexOf('block.')===0&&key!=='block.color'&&key!=='block.color2'){ setP(key,c); planCache.k=''; }
  else if(key==='block.color'||key==='block.color2'){
    const old=getP(key); setP(key,c);
    const sync=U.live||D.block.sync;
    if(sync) D.blocks.forEach(b=>{if(b.color.toUpperCase()===String(old).toUpperCase()&&(key==='block.color'?!b.echo:true)){const auto=b.textColor===contrast(b.color);b.color=c;if(auto)b.textColor=contrast(c);}});
  } else {
    const sel=key==='sel.textColor'?ensureReal():selBlocks();
    if(key==='sel.color'){ D.blockColors=D.blockColors||{}; tlSelIds().forEach(id=>{ if(!byId(id)||isGenerated()) D.blockColors[id]=c; }); planCache.k=''; }
    sel.forEach(b=>{
      if(key==='sel.color'){const auto=b.textColor===contrast(b.color);b.color=c;if(auto)b.textColor=contrast(c);}
      if(key==='sel.textColor') b.textColor=c;
    });
  }
  if(!fromPicker) syncPalettes();
  syncInputs(); render(); if(!fromPicker) renderInsp();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-sw]');if(t){applySwatch(t.dataset.sw,t.dataset.c);}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.swc)applySwatch(t.dataset.swc,t.value,true);});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.swc){swPushed=null;syncPalettes();renderInsp();}});

/* ------------------------------------------------------------------ inspector */
function numF(l,f,v,min){return`<div class="field"><span class="lbl scrub">${l}</span><div class="num"><button data-d="-1">−</button><input type="number" data-f="${f}" value="${v}" step="1"${min!=null?` min="${min}"`:''}><button data-d="1">+</button></div></div>`;}
const SPLIT_ICONS={
  cells:'<svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect width="5" height="4"/><rect x="6.5" width="5" height="4"/><rect x="13" width="5" height="4"/><rect y="6" width="5" height="4"/><rect x="6.5" y="6" width="5" height="4"/><rect x="13" y="6" width="5" height="4"/></svg>',
  cols:'<svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect width="5" height="10"/><rect x="6.5" width="5" height="10"/><rect x="13" width="5" height="10"/></svg>',
  rows:'<svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect width="18" height="4"/><rect y="6" width="18" height="4"/></svg>',
  halfH:'<svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect width="8" height="10"/><rect x="10" width="8" height="10"/></svg>',
  halfV:'<svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect width="18" height="4"/><rect y="6" width="18" height="4" opacity=".6"/></svg>'
};
function splitButtons(bs){
  const can={cells:bs.some(b=>b.w*b.h>1),cols:bs.some(b=>b.w>1),rows:bs.some(b=>b.h>1),halfH:bs.some(b=>b.w>1),halfV:bs.some(b=>b.h>1)};
  const nm={cells:'Squares',cols:'Columns',rows:'Rows',halfH:'Halves ↔',halfV:'Halves ↕'};
  return `<div class="splits">${Object.keys(nm).map(k=>`<button data-split="${k}" ${can[k]?'':'disabled'} title="Split into ${nm[k].toLowerCase()}">${SPLIT_ICONS[k]}${nm[k]}</button>`).join('')}</div>`;
}
function cardCells(G){
  const s=normSel(), q=cellRect(G,s.c,s.r,s.w,s.h), n=D.blocks.filter(b=>hits(b,s)).length;
  return `<div class="card"><div class="card-h">Area selected</div>
    <div class="big">${s.w} × ${s.h} <span>squares</span></div>
    <div class="note">${Math.round(q.w)} × ${Math.round(q.h)} px · from ${colLabel(s.c)} ${rowLabel(s.r)}${n?` · covers ${n} block${n>1?'s':''}`:''}</div>
    <div class="row-btns"><button class="btn primary" data-act="merge">Merge into one block <kbd>M</kbd></button></div>
    <div class="note">Makes one block from these squares (it swallows any blocks inside).</div></div>`;
}
function cardBlock(G,b){
  const q=cellRect(G,b.c,b.r,b.w,b.h);
  const off=b.c+b.w-1<0||b.c>G.C-1||b.r+b.h-1<0||b.r>G.R-1;
  return `<div class="card"><div class="card-h">${esc(bname(b))}<span class="count">#${b.order}</span><span class="r note">${Math.round(q.w)}×${Math.round(q.h)}px</span></div>
    ${off?'<div class="note warn">This block is off screen.</div>':''}
    <input class="text-in" data-f="name" placeholder="Name (optional)" value="${esc(b.name)}">
    <div class="field2">${numF('Col','c',b.c+1)}${numF('Row','r',b.r+1)}${numF('W','w',b.w,1)}${numF('H','h',b.h,1)}</div>
    <div class="swatches">${swatchHTML(b.color,'sel.color')}</div>
    <button class="btn" data-act="samecol">Select all blocks this colour</button>
    <div class="card-h" style="margin-top:2px">Split into</div>
    ${splitButtons([b])}
    <div class="row-btns"><button class="btn" data-act="dup">Duplicate → <kbd>D</kbd></button><button class="btn danger" data-act="del">Delete</button></div>
  </div>`;
}
function cardMulti(sel){
  const sameW=sel.every(b=>b.w===sel[0].w), sameH=sel.every(b=>b.h===sel[0].h);
  return `<div class="card"><div class="card-h">${sel.length} blocks selected</div>
    <div class="field2">${numF('W','mw',sameW?sel[0].w:'',1)}${numF('H','mh',sameH?sel[0].h:'',1)}</div>
    <div class="swatches">${swatchHTML(sel[0].color,'sel.color')}</div>
    <div class="row-btns"><button class="btn" data-act="alt">Alternate main / second</button></div>
    <div class="card-h" style="margin-top:2px">Split all into</div>
    ${splitButtons(sel)}
    <div class="row-btns"><button class="btn" data-act="dup">Duplicate →</button><button class="btn danger" data-act="del">Delete</button></div>
    <div class="note">Arrow keys move them together. Shift-click to add or remove a block.</div></div>`;
}
function cardTips(){
  const t=STEPS[U.step].tools.filter(x=>x!=='hand');
  return `<div class="card"><div class="card-h">Tools</div><div class="tips">
    ${t.map(k=>`<div><kbd>${TOOLS[k].key}</kbd><span><b style="color:var(--text)">${TOOLS[k].name}</b> — ${TOOLS[k].desc}</span></div>`).join('')}
    <div><kbd>⌫</kbd><span>Delete selected blocks, or unmerge a selected area</span></div>
    <div><kbd>⌘Z</kbd><span>Undo anything</span></div>
  </div></div>`;
}
function typeControls(b,multi){
  const kern=b.kern||'metrics', caps=b.caps||'none';
  const on=(v,c)=>v===c?' class="on"':'';
  return `<div class="fontrow"><input class="text-in" data-tf="family" list="fontFamilies" value="${esc(b.family||'')}" placeholder="Font family" autocomplete="off" spellcheck="false"><select data-tf="style">${fontStyleOptions(b.family,b.style)}</select></div>
    <div class="field3">
      <div class="field"><span class="lbl scrub">Size</span><div class="num"><input type="number" data-f="fontSize" value="${b.fontSize}" min="4" step="1"></div></div>
      <div class="field"><span class="lbl scrub">Leading</span><div class="num"><input type="number" data-f="leading" value="${+b.leading||0}" min="0" step="1"></div></div>
      <div class="field"><span class="lbl scrub">Tracking</span><div class="num"><input type="number" data-f="tracking" value="${+b.tracking||0}" step="5"></div></div>
    </div>
    <div class="seg" data-bseg="kern"><button data-v="metrics"${on(kern,'metrics')}>Metrics</button><button data-v="optical"${on(kern,'optical')}>Optical</button><button data-v="none"${on(kern,'none')}>No kern</button></div>
    <div class="seg" data-bseg="caps"><button data-v="none"${on(caps,'none')}>As typed</button><button data-v="upper"${on(caps,'upper')}>UPPER</button><button data-v="lower"${on(caps,'lower')}>lower</button></div>
    <div class="field"><span class="lbl">Position</span>${posGrid(b.align,'data-bseg="align"')}</div>
    <div class="field3">
      <div class="field"><span class="lbl scrub" title="Distance from the block edge">Padding</span><div class="num"><input type="number" data-f="pad" value="${+b.pad||0}" min="0" step="1"></div></div>
      <div class="field"><span class="lbl scrub" title="Nudge right (+) or left (−)">Offset X</span><div class="num"><input type="number" data-f="offX" value="${+b.offX||0}" step="1"></div></div>
      <div class="field"><span class="lbl scrub" title="Nudge down (+) or up (−)">Offset Y</span><div class="num"><input type="number" data-f="offY" value="${+b.offY||0}" step="1"></div></div>
    </div>`;
}
function posGrid(cur,attr){cur=cur||'center';const ks=['tl','tc','tr','ml','center','mr','bl','bc','br'],nm={tl:'Top left',tc:'Top centre',tr:'Top right',ml:'Middle left',center:'Centre',mr:'Middle right',bl:'Bottom left',bc:'Bottom centre',br:'Bottom right'};
  return `<div class="posgrid" ${attr}>${ks.map(k=>`<button data-v="${k}" title="${nm[k]}"${k===cur?' class="on"':''}><i></i></button>`).join('')}</div>`;}
function globalStyleLine(){const t=D.text;return `${esc(t.family)} ${esc(t.style)} · ${t.size}px · ${({tl:'top left',tc:'top centre',tr:'top right',ml:'middle left',center:'centre',mr:'middle right',bl:'bottom left',bc:'bottom centre',br:'bottom right'})[t.align]||t.align}${t.caps==='upper'?' · UPPER':''}`;}
function styleBlock(b,multi){
  const own=multi?multi.every(x=>x.ownStyle):!!b.ownStyle;
  return `<label class="check"><input type="checkbox" data-bown="1"${own?'':' checked'}> Use the global text style</label>
    ${own?`<div class="note">Text settings below change ${multi?'the selected blocks':'this block'} only.</div>${typeControls(b,!!multi)}`
         :`<div class="readout">${globalStyleLine()} <a href="#" data-act="editglobal" style="color:var(--accent2)">Edit global</a></div>`}
    <div class="field stack"><span class="lbl">Text colour</span><div class="swatches">${swatchHTML(b.textColor||contrast(b.color),'sel.textColor')}</div></div>`;
}
function cardContent(b,virt){
  return `<div class="card"><div class="card-h">${esc(bname(b))}<span class="count">${b.w}×${b.h}</span></div>
    <div class="field stack"><span class="lbl">Block colour</span><div class="swatches">${swatchHTML(b.color,'sel.color')}</div></div>
    <div class="tabs"><button class="on">Text</button><button disabled>Image <span class="soon">soon</span></button><button disabled>Video <span class="soon">soon</span></button></div>
    <textarea data-f="text" placeholder="Type to add a text layer inside this block…">${esc(b.text||'')}</textarea>
    ${virt?'<div class="note">This block is part of the generated line. Typing or changing its text style makes the line editable (⌘Z undoes).</div>':''}
    ${styleBlock(b)}
    <details class="sub" data-sub="blk-auto"><summary>Auto content <span class="note">${D.fill.on?(b.noFill?'off for this block':'on'):'off'}</span></summary><div class="subbody">
      ${D.fill.on?`<div class="row-btns"><label class="check" style="flex:1"><input type="checkbox" data-bfill="1"${b.noFill?'':' checked'}> Auto-fill this block</label><button class="btn" data-act="reroll" title="New random content for this block">↻ Re-roll</button></div>`:'<div class="note">Auto-fill is off (Text HUD tab).</div>'}
      <label class="check"><input type="checkbox" data-bnum="1"${numOn(b)?' checked':''}> Block number in the top-right${b.num!=null?' <a href="#" data-act="numreset" class="note">(use default)</a>':''}</label>
    </div></details>
  </div>`;
}
function cardContentMulti(sel,virt){
  return `<div class="card"><div class="card-h">${sel.length} blocks</div>
    <div class="field stack"><span class="lbl">Block colour</span><div class="swatches">${swatchHTML(sel[0].color,'sel.color')}</div></div>
    ${virt?'<div class="note">Changing text style here makes the generated line editable (⌘Z undoes).</div>':''}
    ${styleBlock(sel[0],sel)}
    <div class="note">Changes apply to every selected block.</div></div>`;
}
function cardSequence(G){
  const P=plan(G), seq=P.seq, sel=U.selIds;
  if(!seq.length) return `<div class="card"><div class="card-h">Sequence</div><div class="note">Add some blocks in Layout first.</div></div>`;
  const fps=D.comp.fps||30;
  return `<div class="card"><div class="card-h">Sequence<span class="count">${seq.length}</span><span class="r note">${D.anim.mode==='static'?'static':fmtT(P.end,fps)+' total'}</span></div>
    <div class="list">${seq.map((b,i)=>`<button class="item${sel.indexOf(b.id)>=0?' on':''}" data-pick="${b.id}" data-time="${P.T[i]}"><span class="ord">${b.order}</span><span class="sw" style="background:${b.color}"></span><span class="nm">${esc(bname(b))}</span><span class="dim">${D.anim.mode==='static'?b.w+'×'+b.h:'f '+P.T[i]}</span></button>`).join('')}</div>
    <div class="note">Click a row to jump the preview to that block.</div></div>`;
}
function cardList(G){
  const bad=D.blocks.filter(x=>!valid(x,G)).length;
  const list=ordered(G);
  return `<div class="card listcard"><div class="card-h">Blocks <span class="count">${list.length}</span>${list.length?'<button class="btn ghost r" style="height:22px" data-act="selall">Select all</button>':''}</div>
    ${bad?`<div class="note warn">${bad} block${bad>1?'s are':' is'} outside the grid area and hidden. Add more off-screen area in Grid to bring ${bad>1?'them':'it'} back.</div>`:''}
    ${list.length?`<div class="list">${list.map(x=>`<button class="item${U.selIds.indexOf(x.id)>=0?' on':''}" data-pick="${x.id}"><span class="ord">${x.order}</span><span class="sw" style="background:${x.color}"></span><span class="nm">${esc(bname(x))}${x.text?' · <span class="dim">“'+esc(x.text.split('\n')[0].slice(0,16))+'”</span>':''}</span><span class="dim">${x.w}×${x.h}</span></button>`).join('')}</div>`
    :'<div class="note">No blocks yet.</div>'}
  </div>`;
}
function renderInsp(){
  const el=$('#insp'), st=STEPS[U.step], ids=tlSelIds();
  if(U.ctx||(!ids.length&&!U.sel)){el.innerHTML='';return;}
  const a=document.activeElement;
  if(a&&el.contains(a)&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!/^(color|checkbox|radio|button)$/.test(a.type)))) return;
  const G=geom(), sel=selBlocks(); let h='';
  if(U.sel) h+=cardCells(G);
  else {
    if(st.id==='content'){
      if(sel.length===1) h+=cardContent(sel[0]); else if(sel.length>1) h+=cardContentMulti(sel);
      else { const P=plan(G), px=ids.map(id=>P.seq.find(x=>x.id===id)).filter(Boolean); if(px.length===1) h+=cardContent(px[0],true); else if(px.length>1) h+=cardContentMulti(px,true); } }
    else { if(sel.length===1) h+=cardBlock(G,sel[0]); else if(sel.length>1) h+=cardMulti(sel);
      else { const P=plan(G), b0=P.seq.find(x=>x.id===ids[0]); h+=`<div class="card"><div class="card-h">Colour<span class="r note">${ids.length>1?ids.length+' blocks':''}</span></div><div class="swatches">${swatchHTML(b0?b0.color:D.block.color,'sel.color')}</div>${Object.keys(D.blockColors||{}).some(k=>ids.indexOf(+k)>=0)?'<button class="btn ghost" data-act="colreset">Back to the line colour</button>':''}</div>`; } }
    h+=cardTiming(G,ids);
  }
  el.innerHTML=h;
}
/* timing of the selected block(s): when it appears / leaves, as offsets you can type or drag on the timeline */
function cardTiming(G,ids){
  const P=plan(G), fps=D.comp.fps||30, rows=ids.map(id=>{const i=P.seq.findIndex(b=>b.id===id);return i<0?null:{i,b:P.seq[i]};}).filter(Boolean);
  if(!rows.length) return '';
  const dt=D.anim.dt||{}, dx=D.anim.dx||{}, one=rows.length===1?rows[0]:null, virt=rows.some(r=>r.b.virtual);
  const sec=f=>`${(f/fps).toFixed(2)}s`;
  let h=`<div class="card"><div class="card-h">Timing<span class="r">${one?`#${one.i+1} of ${P.seq.length}`:rows.length+' blocks'}</span></div>`;
  if(one){const i=one.i, t0=P.T[i], base=P.T0?P.T0[i]:t0, tE=P.exitT&&P.exitT[i]!=null?P.exitT[i]:null;
    h+=`<div class="readout">Appears <b>f${t0}</b> (${sec(t0)})${dt[one.b.id]?` · moved <b>${dt[one.b.id]>0?'+':''}${dt[one.b.id]}f</b> from f${base}`:''}${tE!=null?`<br>Leaves <b>f${tE}</b> (${sec(tE)})`:''}</div>`;}
  const val=k=>one?(+(k==='dt'?dt:dx)[one.b.id]||0):'';
  h+=`<div class="field2"><div class="field"><span class="lbl">Shift in</span><div class="num"><button data-d="-1">−</button><input type="number" data-tm2="dt" value="${val('dt')}" placeholder="±" step="1" min="-9999" max="9999"><span class="unit">fr</span><button data-d="1">+</button></div></div>`+
     (D.exit.on?`<div class="field"><span class="lbl">Shift out</span><div class="num"><button data-d="-1">−</button><input type="number" data-tm2="dx" value="${val('dx')}" placeholder="±" step="1" min="-9999" max="9999"><span class="unit">fr</span><button data-d="1">+</button></div></div>`:'<span></span>')+`</div>`;
  h+=`<div class="row-btns"><button class="btn" data-tmact="reset">Reset timing</button><button class="btn" data-tmact="go">Go to it</button></div>`;
  if(virt&&isGenerated()) h+=`<div class="note">This block is generated from the seed. Retiming works as is — to move it, drag it on the canvas (the line becomes editable), or <a href="#" data-tmact="edit" style="color:var(--accent2)">make the line editable</a>.</div>`;
  h+=`<div class="row-btns"><button class="btn danger" data-tmact="del">Remove</button><button class="btn danger" data-tmact="delafter" title="This block and every block after it in the build">Remove this &amp; after</button></div>`;
  h+=`<div class="note">Tip: drag bars on the timeline · ⌥← / ⌥→ nudges by a frame (⇧ = 10).</div></div>`;
  return h;
}
$('#insp').addEventListener('click',e=>{const b=e.target.closest('[data-tmact]'); if(!b) return; e.preventDefault(); const a=b.dataset.tmact, ids=tlSelIds();
  if(a==='reset'){pushHist(true);ids.forEach(id=>{delete D.anim.dt[id];delete D.anim.dx[id];});planCache.k='';refresh();}
  else if(a==='go'){const P=plan(geom()),i=P.seq.findIndex(x=>x.id===ids[0]);if(i>=0)tlSetT(P.T[i]+Math.max(1,D.anim.trans|0));}
  else if(a==='edit'){materialize();refresh();}
  else if(a==='del') dopeRemove(false); else if(a==='delafter') dopeRemove(true);
});
$('#insp').addEventListener('input',e=>{const t=e.target, k=t.dataset&&t.dataset.tm2; if(!k) return; const v=Math.round(parseFloat(t.value)); if(isNaN(v)&&t.value!=='') return;
  if(!U._tmEdit){pushHist(true);U._tmEdit=true;} D.anim[k]=D.anim[k]||{}; tlSelIds().forEach(id=>{if(v) D.anim[k][id]=v; else delete D.anim[k][id];}); planCache.k=''; render(); drawDope();});
$('#insp').addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.tm2){U._tmEdit=false;refresh();}});
let inspPending=false;
$('#insp').addEventListener('focusin',e=>{if(e.target.matches('[data-f]'))inspPending=true;});
$('#insp').addEventListener('input',e=>{
  const t=e.target, f=t.dataset.f; if(!f) return;
  const sel=ensureReal(); if(!sel.length) return;
  if(inspPending){pushHist();inspPending=false;}
  if(f==='name'||f==='text'){sel[0][f]=t.value;render();const lc=$('#insp .listcard');if(lc)lc.outerHTML=cardList(geom());return;}
  let v=Math.round(parseFloat(t.value)); if(isNaN(v)) return;
  if(f==='fontSize'){sel.forEach(b=>b.fontSize=clamp(v,4,1000));render();return;}
  if(f==='leading'){sel.forEach(b=>b.leading=clamp(v,0,5000));render();return;}
  if(f==='tracking'){sel.forEach(b=>b.tracking=clamp(v,-1000,5000));render();return;}
  if(f==='pad'){sel.forEach(b=>b.pad=clamp(v,0,2000));render();return;}
  if(f==='offX'||f==='offY'){sel.forEach(b=>b[f]=clamp(v,-5000,5000));render();return;}
  if(f==='mw'||f==='mh'){
    const G=geom(); let skip=0;
    sel.forEach(b=>{const n={c:b.c,r:b.r,w:f==='mw'?Math.max(1,v):b.w,h:f==='mh'?Math.max(1,v):b.h};
      if(valid(n,G)&&!D.blocks.some(x=>x!==b&&hits(x,n)))Object.assign(b,n);else skip++;});
    t.style.color=skip?'var(--warn)':''; render(); return;
  }
  const b=sel[0], G=geom(), n={c:b.c,r:b.r,w:b.w,h:b.h};
  if(f==='c')n.c=v-1; if(f==='r')n.r=v-1; if(f==='w')n.w=Math.max(1,v); if(f==='h')n.h=Math.max(1,v);
  if(!valid(n,G)||D.blocks.some(x=>x!==b&&hits(x,n))){t.style.color='var(--warn)';return;}
  t.style.color=''; Object.assign(b,n); render();
});
$('#insp').addEventListener('change',e=>{
  if(e.target.dataset&&e.target.dataset.bnum){const s2=ensureReal();pushHist();s2.forEach(b=>b.num=e.target.checked);fillCache.clear();refresh();return;}
  if(e.target.dataset&&e.target.dataset.bfill){const s2=ensureReal();pushHist();s2.forEach(b=>b.noFill=!e.target.checked);fillCache.clear();refresh();return;}
  if(e.target.dataset&&e.target.dataset.bown){const s2=ensureReal();if(!s2.length)return;pushHist();const own=!e.target.checked;
    s2.forEach(b=>{ if(own&&!b.ownStyle){ b.fontSize=D.text.size;b.align=D.text.align;b.pad=D.text.pad;b.offX=+D.text.offX||0;b.offY=+D.text.offY||0;TEXT_KEYS.forEach(k=>b[k]=D.text[k]); } b.ownStyle=own; });
    renderInsp();render();return;}
  const tf=e.target.dataset&&e.target.dataset.tf;
  if(tf){const sel=ensureReal();if(!sel.length)return;pushHist();
    sel.forEach(b=>{if(tf==='family')setFamily(b,e.target.value.trim());else setStyle(b,e.target.value);});
    renderInsp();render();return;}if(e.target.matches('input[type=number][data-f]')){inspPending=false;e.target.blur&&0;refresh();}});
$('#insp').addEventListener('focusout',e=>{if(e.target.matches('[data-f]')){inspPending=false;setTimeout(()=>{if(!$('#insp').contains(document.activeElement))refresh();},0);}});
$('#insp').addEventListener('click',e=>{
  const t=e.target.closest('button,a[data-act]'); if(!t||t.disabled) return; if(t.tagName==='A') e.preventDefault();
  if(t.dataset.pick){
    const id=+t.dataset.pick;
    if(e.shiftKey){const i=U.selIds.indexOf(id);if(i>=0)U.selIds.splice(i,1);else U.selIds.push(id);}else select([id]);
    if(t.dataset.time&&D.anim.mode!=='static'){U.t=+t.dataset.time+Math.max(1,D.anim.trans|0);stopPlay();}
    refresh(); return;
  }
  if(t.dataset.split){splitSelected(t.dataset.split);return;}
  const seg=t.closest('[data-bseg]');
  if(seg&&t.dataset.v){const s2=ensureReal();pushHist();s2.forEach(b=>b[seg.dataset.bseg]=t.dataset.v);refresh();return;}
  const a=t.dataset.act;
  if(a==='colreset'){pushHist(true);tlSelIds().forEach(id=>{if(D.blockColors)delete D.blockColors[id];});planCache.k='';refresh();return;}
  if(a==='editglobal'){e.preventDefault();U.ctab='text';select([]);refresh();try{const g=$('#left .pane[data-pane="content"] .group[data-ctab="text"]');g&&g.scrollIntoView({block:'start'});}catch(x){}return;}
  if(a==='numreset'){pushHist();ensureReal().forEach(b=>{delete b.num;});fillCache.clear();refresh();return;}
  if(a==='reroll'){const s2=ensureReal();pushHist();s2.forEach(b=>b.fillSeed=(b.fillSeed||0)+1);fillCache.clear();refresh();return;}
  if(a==='samecol'){const c=(selBlocks()[0]||{}).color;select(D.blocks.filter(b=>b.color===c).map(b=>b.id));refresh();return;}
  if(a==='alt'){pushHist();selBlocks().sort((x,y)=>x.order-y.order).forEach((b,i)=>{const c=i%2?D.block.color2:D.block.color;const auto=b.textColor===contrast(b.color);b.color=c;if(auto)b.textColor=contrast(c);});refresh();return;}
  if(a==='merge')mergeSel(); else if(a==='erase')eraseRect(normSel()); else if(a==='del')deleteSelected();
  else if(a==='dup')duplicate(); else if(a==='selall'){select(D.blocks.map(b=>b.id));refresh();}
});

/* ------------------------------------------------------------------ bindings */
function onChange(path){
  if(path==='comp.w'||path==='comp.h') syncPreset();
  if(path==='comp.dur'||path==='comp.fps'){TL.autoN=0;TL.f0=TL.f1=null;}
  if(path==='comp.follow'&&D.comp.follow) detect();
  if(path.indexOf('grid.')===0||path.indexOf('comp.')===0){if(V.fit)fitView(V.fit);}
  if(path.indexOf('fill.')===0) fillCache.clear();
  if(path==='timing.sens'||path==='timing.minGap') reBeat();
  if(path==='timing.use'||path==='timing.offset') {planCache.k='';renderMedia();}
  if(path==='anim.zoomOn'){planCache.k='';$('#zoomList').innerHTML='';}
  if(path==='anim.mode'||path==='anim.order'){reorder();}
  if(path==='anim.order'&&D.anim.order==='manual'){U.t=null;stopPlay();U.tool='order';fitView('all');toast('Manual order: the whole grid is shown. Click blocks in the order they should appear.');}
  syncInputs();
  if(path.indexOf('text.')===0&&STEPS[U.step].id==='content'&&$('#chkStyleSel').checked){
    const k=path.split('.')[1], map={size:'fontSize'}; selBlocks().forEach(b=>{b[map[k]||k]=D.text[k];});
  }
  if(path==='rand.startRow'&&D.rand.startCol!=null){ if(+D.rand.startRow>0) D.rand.startR=Math.round(D.rand.startRow)-1; else {D.rand.startCol=null;D.rand.startR=null;} }
  if(isGenerated()&&D.blocks.length===1&&(path==='block.w'||path==='block.h'||path==='rand.startRow')){generateLine(false,true);return;}
  if(isGenerated()&&D.blocks.length===1&&(path==='block.color'||path==='block.mix'||path==='block.color2')){const b0=D.blocks[0];b0.color=mixColor(0,rng(D.rand.seed));b0.textColor=contrast(b0.color);}
  if(path.indexOf('rand.')===0&&U.live){generate(true);return;}
  if(path==='block.w'||path==='block.h'){
    if(U.live){generate(true);return;}
    if(D.block.sync&&D.blocks.length){const r=resizeAllQuiet();if(r.skip)toast(`${r.skip} block${r.skip>1?'s':''} kept their size (no room)`);}
  }
  refresh();
}
buildModUI();
function bindIn(root){
$$('[data-bind]',root).forEach(el=>{
  if(el._gbBound) return; el._gbBound=true;
  el.addEventListener('input',()=>{
    const p=el.dataset.bind;
    let v=el.type==='checkbox'?el.checked:el.type==='number'?parseFloat(el.value):el.value;
    if(el.type==='number'&&el.dataset.zero!=null&&el.value.trim()==='') v=0;
    if(el.type==='number'){if(isNaN(v))return;if(el.min!=='')v=Math.max(+el.min,v);if(el.max!=='')v=Math.min(+el.max,v);}
    if(el.type==='color')v=v.toUpperCase();
    if(U.editing!==el){pushHist(true);U.editing=el;}
    setP(p,v); onChange(p);
  });
  el.addEventListener('change',()=>{U.editing=null;if(el.type==='number')syncInputs(true);});
  el.addEventListener('blur',()=>{U.editing=null;});
});
$$('[data-seg]',root).forEach(seg=>{ if(seg._gbBound) return; seg._gbBound=true; seg.addEventListener('click',e=>{
  const b=e.target.closest('button[data-v]'); if(!b) return;
  if(String(getP(seg.dataset.seg))===b.dataset.v) return;
  pushHist(true); setP(seg.dataset.seg,b.dataset.v==='true'?true:b.dataset.v==='false'?false:b.dataset.v); onChange(seg.dataset.seg);
});});
}
bindIn(document);
document.addEventListener('click',e=>{
  const b=e.target.closest('.num button[data-d]'); if(!b) return;
  const inp=b.parentElement.querySelector('input'); if(!inp||inp.disabled) return;
  const step=+(inp.step||1)*(e.shiftKey?10:1);
  let v=(parseFloat(inp.value)||0)+(+b.dataset.d)*step;
  if(inp.min!=='')v=Math.max(+inp.min,v); if(inp.max!=='')v=Math.min(+inp.max,v);
  inp.value=v; U.editing=null;
  inp.dispatchEvent(new Event('focusin',{bubbles:true}));
  inp.dispatchEvent(new Event('input',{bubbles:true}));
  inp.dispatchEvent(new Event('change',{bubbles:true}));
});
/* click-and-drag on a number field: up/right = more, down/left = less (Shift ×10, Alt ×0.1). A click without dragging lets you type. */
document.addEventListener('pointerdown',e=>{
  const inp=e.target.closest&&e.target.closest('.num input[type=number]'); if(!inp||inp.disabled||e.button!==0) return;
  if(document.activeElement===inp) return;            // already typing in it
  e.preventDefault();
  const x0=e.clientX, y0=e.clientY, v0=parseFloat(inp.value)||0, step=+(inp.step)||1; let drag=false;
  const mv=ev=>{
    const dx=ev.clientX-x0, dy=y0-ev.clientY;
    if(!drag){ if(Math.abs(dx)<3&&Math.abs(dy)<3) return; drag=true; U.editing=null; inp.dispatchEvent(new Event('focusin',{bubbles:true})); document.body.style.cursor='ns-resize'; inp.classList.add('scrubbing'); }
    const k=ev.shiftKey?10:ev.altKey?0.1:1, px=Math.abs(dy)>=Math.abs(dx)?dy:dx;
    let v=v0+Math.round(px/4)*step*k;
    const dec=(String(step*k).split('.')[1]||'').length; v=+v.toFixed(Math.min(4,dec));
    if(inp.min!=='')v=Math.max(+inp.min,v); if(inp.max!=='')v=Math.min(+inp.max,v);
    if(+inp.value!==v){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));}
  };
  const up=()=>{
    removeEventListener('pointermove',mv); removeEventListener('pointerup',up);
    document.body.style.cursor=''; inp.classList.remove('scrubbing');
    if(drag){U.editing=null;inp.dispatchEvent(new Event('change',{bubbles:true}));}
    else {inp.focus();inp.select();}
  };
  addEventListener('pointermove',mv); addEventListener('pointerup',up);
},true);
document.addEventListener('pointerdown',e=>{
  const l=e.target.closest('.scrub'); if(!l) return;
  const inp=l.parentElement.querySelector('input[type=number]'); if(!inp||inp.disabled) return;
  e.preventDefault();
  const x0=e.clientX, v0=parseFloat(inp.value)||0; let moved=false; U.editing=null;
  inp.dispatchEvent(new Event('focusin',{bubbles:true}));
  const mv=ev2=>{
    const d=Math.round((ev2.clientX-x0)/(ev2.shiftKey?1:5))*(ev2.shiftKey?10:1)*(+(inp.step)||1); if(!d&&!moved) return; moved=true;
    let v=v0+d; if(inp.min!=='')v=Math.max(+inp.min,v); if(inp.max!=='')v=Math.min(+inp.max,v);
    if(+inp.value!==v){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));}
  };
  const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);U.editing=null;inp.dispatchEvent(new Event('change',{bubbles:true}));document.body.style.cursor='';};
  addEventListener('pointermove',mv); addEventListener('pointerup',up); document.body.style.cursor='ew-resize';
});
function syncInputs(force){
  $$('[data-bind]').forEach(el=>{
    if(!force&&document.activeElement===el) return;
    const v=getP(el.dataset.bind);
    if(el.type==='checkbox') el.checked=!!v;
    else if(el.dataset.zero!=null&&+v===0){ if(el.value!=='') el.value=''; el.placeholder=el.dataset.zero; }
    else if(el.value!==String(v)) el.value=v;
  });
  $$('[data-seg]').forEach(seg=>{const v=getP(seg.dataset.seg);$$('[data-v]',seg).forEach(b=>b.classList.toggle('on',b.dataset.v===String(v)));});
  $$('[data-swatch]').forEach(l=>l.style.background=getP(l.dataset.swatch));
  $$('[data-show]').forEach(el=>{
    el.hidden=!el.dataset.show.split('&').every(cond=>{const parts=cond.split('=');return parts[1].split('|').indexOf(String(getP(parts[0])))>=0;});
  });
  renderCurves(); renderFontUI(); renderFillFont();
  const en=$('#endNote'); if(en) en.textContent=`Ends on row ${D.anim.endRow}`;
  const lp=$('#chkLoop'); if(lp) lp.checked=U.loop;
  const mbx=$('#chkMB'); if(mbx){mbx.checked=U.mbPrev!==false; mbx.parentElement.hidden=!D.out.mb||D.anim.mode==='static';}
  $$('#camPreset [data-p]').forEach(b=>{const p=b.dataset.p.split(',').map(Number);b.classList.toggle('on',+D.anim.smooth===p[0]&&+D.anim.motionBlurF===p[1]&&+D.anim.settle===p[2]);});
  syncIconSet();
  {const ub=$('#btnUnskip'); if(ub) ub.hidden=!((D.anim.skip&&D.anim.skip.length)||D.anim.cutAt!=null);}
  $$('#afterSeg [data-after]').forEach(b=>b.classList.toggle('on',D.exit.on?b.dataset.after===D.exit.mode:b.dataset.after==='stay'));
  $$('#zonePreset [data-z]').forEach(b=>b.classList.toggle('on',+b.dataset.z===+D.anim.revealX));
  $$('#endPreset [data-ex]').forEach(b=>b.classList.toggle('on',+b.dataset.ex===+D.anim.endX));
  $$('[data-layer]').forEach(el=>{const v=getP(el.dataset.layer);el.classList.toggle('off',!v||v==='none');});
  const lock=inAE&&D.comp.follow&&U.compLive;
  $$('[data-bind="comp.w"],[data-bind="comp.h"],[data-bind="comp.fps"],[data-bind="comp.dur"]').forEach(i=>i.disabled=lock);
  try{updTlZoom();}catch(e){}
  $('#preset').disabled=lock;
  $('#countUnit').textContent=D.rand.count>0?'':'auto';
  $('#rowUnit').textContent=D.rand.startRow>0?'':'random';
  $('#chkOrder').checked=U.showOrder;
}
function syncPreset(){const k=D.comp.w+'x'+D.comp.h;$('#preset').value=$$('#preset option').some(o=>o.value===k)?k:'custom';}
$('#preset').addEventListener('change',e=>{const v=e.target.value;if(v==='custom')return;pushHist(true);const p=v.split('x').map(Number);D.comp.w=p[0];D.comp.h=p[1];syncInputs(true);if(V.fit)fitView(V.fit);refresh();});

/* ------------------------------------------------------------------ steps & tools */
function buildStepper(){
  $('#rail').innerHTML=STEPS.map((st,i)=>!stepVisible(i)?'':(st.id==='lab'?'<div class="railsep"></div>':'')+`<button class="railbtn" data-step="${i}" title="${st.name} — ${st.title}">${RAIL_ICON[st.id]||''}<span>${st.name}</span></button>`).join('');
  $('#rail').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;U.ctx=null;U.dopeSel=[];U.selIds=[];U.sel=null;goStep(+b.dataset.step);refresh();});
}
/* contexts: a timeline row's settings in the properties panel */
function setCtx(c){ if(c==='after'||c==='reveal') c='inout'; U.ctx=c||null; if(c){U.dopeSel=[];U.selIds=[];U.sel=null;} const sb=$('#left .step-body'); if(sb) sb.scrollTop=0; refresh(); }
function renderProps(){
  const left=$('#left'), st=STEPS[U.step], sel=tlSelIds(), blk=(sel.length>0||!!U.sel)&&!U.ctx;
  left.classList.toggle('ctxmode',!!U.ctx&&!blk); left.classList.toggle('blockmode',blk);
  $$('#left .pane').forEach(p=>{p.classList.remove('ctxhost');});
  $$('#left .group.ctxshow').forEach(g=>g.classList.remove('ctxshow'));
  if(U.ctx&&!blk){ $$('#left .group[data-ctx]').forEach(g=>{ if(g.dataset.ctx.split(' ').indexOf(U.ctx)>=0){g.classList.add('ctxshow');g.parentElement.classList.add('ctxhost');} }); }
  const back=$('#ctxBack');
  if(blk){ const P=plan(geom()), b=sel.length===1?(byId(sel[0])||P.seq.find(x=>x.id===sel[0])):null;
    $('#stepEyebrow').textContent=sel.length?'Selected':'Cells';
    $('#stepTitle').textContent=U.sel?'Squares':b?bname(b)+(b.virtual?' · generated':''):sel.length+' blocks';
    $('#stepDesc').textContent=U.sel?'Merge them into a block, or unmerge.':'Drag it on the timeline to change when it appears. Esc to go back.';
    back.hidden=false; back.title='Back to '+st.name; }
  else if(U.ctx){ const C=CTX[U.ctx]||{t:U.ctx,e:'',d:''}; $('#stepEyebrow').textContent=C.e; $('#stepTitle').textContent=C.t; $('#stepDesc').textContent=C.d; back.hidden=false; back.title='Back to '+st.name; }
  else { $('#stepEyebrow').textContent=`${U.step+1} · ${st.name}`; $('#stepTitle').textContent=st.title; $('#stepDesc').textContent=st.id==='build'?(inAE?'Create the layers in your active comp.':'Export a script, then run it in After Effects.'):st.desc; back.hidden=true; }
  // content tabs
  const cp=$('#left .pane[data-pane="content"]'); if(cp){ ['hud','gaps','numbers','echo','text'].forEach(t=>cp.classList.toggle('tab-'+t,U.ctab===t));
    const on={hud:D.fill.on,gaps:D.fill.on&&D.fill.gap.on,numbers:D.num&&D.num.on,echo:D.echo&&D.echo.on,text:D.blocks.some(b=>b.text)};
    $$('#ctabs [data-ctab-btn]').forEach(b=>{const k=b.dataset.ctabBtn; b.classList.toggle('on',U.ctab===k); if(!b._lab) b._lab=b.textContent; b.innerHTML=`<span class="d${on[k]?' on':''}"></span>${b._lab}`;}); }
}
$('#ctxBack').onclick=()=>{U.ctx=null;U.dopeSel=[];U.selIds=[];U.sel=null;refresh();};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ctab-btn]'); if(!b) return; U.ctab=b.dataset.ctabBtn; refresh(); drawDope();});
/* saved step → index (older saves had a separate Block size step at index 1) */
function savedStep(o){if(o.stepId&&SI(o.stepId)>=0)return SI(o.stepId);const i=o.step|0;return clamp(i>=2?i-1:i,0,STEPS.length-1);}
function goStep(i){
  i=clamp(i,0,STEPS.length-1);
  if(!stepVisible(i)){ const j=nextVisible(i,i>U.step?1:-1); i=j>=0?j:U.step; }
  if(i===U.step){refresh();return;}
  stopPlay();
  U.step=i; const st=STEPS[i];
  if(st.tools.indexOf(U.tool)<0||U.tool==='hand'||i<=1) U.tool=st.tool;  // each step opens on its own tool (Space still pans anywhere)
  U.sel=null;
  if(st.id==='animate') U.showOrder=true;
  $('#left .step-body').scrollTop=0;
  syncInputs(); refresh(); autosave();
}
function setTool(t){
  if(t==='order'&&STEPS[U.step].id==='animate'){setTimeout(()=>{fitView('all');render();},0);}
  if(STEPS[U.step].tools.indexOf(t)<0){
    // jump to the step that owns this tool
    if(t==='order') goStep(SI('animate')); else if(['stamp','draw'].indexOf(t)>=0) goStep(SI('layout')); else return;
  }
  U.tool=t; U.sel=t==='select'?U.sel:null; refresh();
}
function setHTML(el,h){if(el&&el._h!==h){el.innerHTML=h;el._h=h;}}
function renderStepUI(){
  const st=STEPS[U.step];
  $$('.railbtn').forEach((b,i)=>{b.classList.toggle('on',i===U.step);});
  $$('.pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===st.id));
  renderProps();
  $('#btnBack').disabled=nextVisible(U.step,-1)<0;
  const nxI=nextVisible(U.step,1), nx=nxI>=0?STEPS[nxI]:null; $('#btnNext').hidden=!nx&&!(STEPS[U.step].id==='build');
  $('#btnNext').innerHTML=nx?`Next: ${nx.name} →`:(inAE?'Build in After Effects':'Export .jsx');
  setHTML($('#toolbox'),st.tools.map((t,i)=>(t==='hand'&&i?'<div class="sepH"></div>':'')+`<button data-tool="${t}" class="${U.tool===t?'on':''}" title="${TOOLS[t].name} (${TOOLS[t].key}) — ${TOOLS[t].desc}">${ICON[t]}<span>${TOOLS[t].key}</span></button>`).join(''));
  const tp=$('#toolPill');
  if(tp){tp.className='toolpill'+(U.picking?' pick':'');tp.innerHTML=U.picking?`<span class="ic">◎</span>Picking end spot <span class="k">click a square</span>`:`<span class="ic">${ICON[U.tool]}</span>${TOOLS[U.tool].name} <span class="k">${TOOLS[U.tool].key}</span>`;}
  cv.className='t-'+U.tool+(U.space?' panning':'')+(U.drag&&(U.drag.type==='move'||U.drag.type==='pan')?' grabbing':'');
  setHTML($('#toolcards'),['select','stamp','draw'].map(t=>`<button class="toolcard${U.tool===t?' on':''}" data-tool="${t}"><span class="ic">${ICON[t]}</span><span><div class="t">${TOOLS[t].name}</div><div class="d">${TOOLS[t].desc}</div></span><kbd>${TOOLS[t].key}</kbd></button>`).join(''));

  if(U.ctx==='sound'&&!U._mediaUI){U._mediaUI=1;renderMedia();}
  $('#hint').textContent=st.id==='grid'?'Scroll to pan · ⌘/Ctrl + scroll or pinch to zoom':TOOLS[U.tool].desc;
}
/* the little badge under the canvas: which frame you're looking at */
function updViewBadge(){const el=$('#viewBadge'); if(!el) return; const fps=D.comp.fps||30;
  if(STEPS[U.step].id==='layout'&&!U.playing&&!U.preview&&animOn()){el.innerHTML='<b>All blocks</b> · scrub the timeline or press Space to preview';return;}
  if(STEPS[U.step].id==='layout'&&U.preview&&!U.playing&&U.t!=null){el.innerHTML=`<b>f${Math.round(U.t)}</b> · ${(U.t/fps).toFixed(2)}s · Esc or click the canvas for all blocks`;return;}
  if(D.anim.mode==='static'&&!transOn()){el.innerHTML='';return;}
  el.innerHTML=U.t==null?'<b>Layout view</b> · Space to preview':`<b>f${Math.round(U.t)}</b> · ${(U.t/fps).toFixed(2)}s · Esc = layout view`;}
document.addEventListener('pointerdown',e=>{if(e.button)return;const b=e.target.closest&&e.target.closest('[data-tool]');if(b){e.preventDefault();setTool(b.dataset.tool);}});
$('#btnBack').onclick=()=>{const j=nextVisible(U.step,-1);if(j>=0){U.ctx=null;goStep(j);refresh();}};
$('#btnNext').onclick=()=>{const j=nextVisible(U.step,1);if(j>=0){U.ctx=null;goStep(j);refresh();}else build();};

/* size picker (Blocks step) */
function buildPicker(){
  const p=$('#picker'); let h='';
  for(let r=0;r<4;r++)for(let c=0;c<8;c++)h+=`<i data-c="${c+1}" data-r="${r+1}"></i>`;
  p.innerHTML=h;
  const paint=(w,hh,cls)=>$$('i',p).forEach(i=>i.classList.toggle(cls,+i.dataset.c<=w&&+i.dataset.r<=hh));
  p.addEventListener('mousemove',e=>{const i=e.target.closest('i');if(i)paint(+i.dataset.c,+i.dataset.r,'h');});
  p.addEventListener('mouseleave',()=>paint(0,0,'h'));
  p.addEventListener('click',e=>{const i=e.target.closest('i');if(!i)return;pushHist(true);D.block.w=+i.dataset.c;D.block.h=+i.dataset.r;onChange('block.w');});
  const presets=[[1,1],[2,1],[3,1],[4,1],[2,2],[3,2],[4,2],[6,2]];
  $('#sizeChips').innerHTML=presets.map(s=>`<button class="chipbtn" data-w="${s[0]}" data-h="${s[1]}">${s[0]}×${s[1]}</button>`).join('');
  $('#sizeChips').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;pushHist(true);D.block.w=+b.dataset.w;D.block.h=+b.dataset.h;onChange('block.w');});
}
function renderBlockStep(G){
  const w=D.block.w|0,h=D.block.h|0, q=cellRect(G,0,0,w,h);
  $('#pickBig').textContent=`${w} × ${h}`;
  $('#pickPx').textContent=`${Math.round(q.w)} × ${Math.round(q.h)} px`;
  $$('#picker i').forEach(i=>i.classList.toggle('on',+i.dataset.c<=w&&+i.dataset.r<=h));
  $$('#sizeChips [data-w]').forEach(b=>b.classList.toggle('on',+b.dataset.w===w&&+b.dataset.h===h));
  const diff=D.blocks.filter(b=>b.w!==w||b.h!==h).length;
  const btn=$('#btnResizeAll'); btn.textContent=diff?`Resize ${diff} existing block${diff>1?'s':''} to ${w} × ${h}`:'All blocks are this size';
  btn.disabled=!diff;
  $('#sizeTag').textContent=`${w}×${h} blocks · size above`;
}

/* ------------------------------------------------------------------ context bar */
function updCtx(){
  const el=$('#ctxbar'), st=STEPS[U.step].id, sel=selBlocks();
  let h='', quiet=true;
  if(U.sel&&U.tool==='select'&&!U.drag){
    const s=normSel(); quiet=false;
    h=`<span class="msg"><b>${s.w} × ${s.h}</b> selected</span><button class="btn primary" data-act2="merge">Merge <kbd>M</kbd></button><button class="btn ghost icon" data-act2="desel" title="Deselect (Esc)">✕</button>`;
  } else if(U.drag&&U.sel){
    const s=normSel(); h=`<span class="msg"><b>${s.w} × ${s.h}</b> · let go to ${U.drag.type==='draw'?'make a block':U.drag.type==='erase'?'unmerge':'select'}</span>`;
  } else if(U.pickStart){
    h=`<span class="msg"><b>Pick the start</b> · click the square where the first block goes</span>`; quiet=false;
  } else if(U.picking){
    h=`<span class="msg"><b>Picking the end spot</b> · drag to pan · scroll/pinch to zoom · <b>click a square</b> to set it</span><button class="btn ghost" data-act2="cancelpick">Cancel <kbd>Esc</kbd></button>`; quiet=false;
  } else if(U.tool==='paint'){
    h=`<span class="msg">Painting with <span style="display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;background:${D.block.color};border:1px solid rgba(255,255,255,.3)"></span> · Alt-click a block to pick up its colour</span>`;
  } else if(st==='grid'){
    const G=geom(); h=`<span class="msg"><b>${G.C}</b> columns × <b>${G.R}</b> rows · squares <b>${+G.s.toFixed(1)}px</b></span>`;
  } else if(st==='layout'&&U.tool==='stamp'&&!sel.length){
    h=`<span class="msg">Click or drag to stamp <b>${D.block.w} × ${D.block.h}</b> blocks</span>${D.blocks.length?'<button class="btn ghost" data-act2="clearlayout">Clear layout</button>':''}`;
  } else if(U.tool==='order'){
    h=`<span class="msg">Click blocks in the order they should appear · next is <b>#${U.moNext}</b></span>`;
  } else if(sel.length&&st!=='animate'){
    h=`<span class="msg"><b>${sel.length===1?esc(bname(sel[0])):sel.length+' blocks'}</b> · drag to move · arrows nudge</span>`;
  } else if(st==='layout'){
    h=`<span class="msg"><b>${TOOLS[U.tool].name}</b> — ${TOOLS[U.tool].desc}</span>`;
  } else if(st==='animate'&&D.anim.mode!=='static'){
    h=`<span class="msg">Press <b>Space</b> or ▶ to preview</span>`;
  } else { el.hidden=true; return; }
  el.hidden=false; el.className='ctxbar'+(quiet?' quiet':''); el.innerHTML=h;
}
$('#ctxbar').addEventListener('click',e=>{const b=e.target.closest('[data-act2]');if(!b)return;const a=b.dataset.act2;if(a==='merge')mergeSel();else if(a==='erase')eraseRect(normSel());else if(a==='cancelpick'){cancelPick();}else if(a==='clearlayout'){clearLayout();}else{U.sel=null;refresh();}});

/* ------------------------------------------------------------------ refresh */
function fmtT(f,fps){const s=f/fps;return s<60?`${(+s.toFixed(2))}s`:`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
function refresh(){
  const G=geom();
  reorder();
  U.selIds=U.selIds.filter(id=>byId(id));
  const vis=G.lastFull-G.firstFull+1, part=G.C-vis;
  $('#gridReadout').innerHTML=`<b>${G.C}</b> columns × <b>${G.R}</b> rows<br>Square <b>${+G.s.toFixed(2)} px</b> · step ${+G.p.toFixed(2)} px<br>${vis} full column${vis===1?'':'s'}${part>0?` + ${part} cut off at the edges`:''}${G.s<4?'<br><span class="warn">Squares are very small. Try fewer rows.</span>':''}`;
  const c=D.comp;
  $('#compName').textContent=inAE?(U.compLive?U.aeName:'No active comp'):'Browser preview';
  $('#compMeta').textContent=`${c.w}×${c.h} · ${+(+c.fps).toFixed(2)}fps`;
  $('#liveDot').classList.toggle('live',inAE&&U.compLive);
  renderStepUI(); renderBlockStep(G); renderGenStatus(G);
  // animation readout + timeline
  { const P=plan(G); const sc=$('#scrub'); sc.max=sceneEnd(G); if(U.t!==null) sc.value=U.t; updTC(); updViewBadge(); $('#btnLayoutView').hidden=U.t===null; }
  if(STEPS[U.step].id==='animate'){
    const P=plan(G), fps=c.fps||30;
    renderZoomList(P);
    if($('#animReadout')) $('#animReadout').innerHTML=P.seq.length?`Preview length <b>${fmtT(P.end,fps)}</b> (${P.end} frames, includes a short hold at the end)${P.zs.length?`<br>Grid goes to ${Math.round(G.R/(P.sMin||1))} rows at its widest`:''}${c.dur*fps<P.end?`<br><span class="warn">Longer than the comp (${fmtT(c.dur*fps,fps)}).</span>${D.out.fitDur?' The comp will be lengthened.':''}`:''}`:'Add some blocks first.';
    $('#camHead').textContent=D.anim.mode==='push'?'· conveyor (grid slides, view stays)':'';
  }
  if(STEPS[U.step].id==='build') renderBuildSummary(G);
  render(); renderInsp(); updCtx(); updPos(U.hover); renderCurves(); updPaceTotal(); updRuleNote(G);
  drawSpeedGraph(); drawDope();
  $('#btnRemoveAE').hidden=!inAE;
  autosave();
}

/* ------------------------------------------------------------------ playback */
let raf=0, lastTs=0;
function play(){
  if(!animOn()) return toast('Pick an animation style in Motion first');
  let P=plan(geom()); if(!P.seq.length&&!transOn()) return toast('Add some blocks first'); P={seq:P.seq,end:sceneEnd(geom())};
  if(U.t===null||U.t>=P.end) U.t=0;
  U.playing=true; lastTs=0; $('#icoPlay').innerHTML='<path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/>';
  const fps=D.comp.fps||30;
  const tick=ts=>{
    if(!U.playing) return;
    if(lastTs) U.t+=(ts-lastTs)/1000*fps;
    lastTs=ts;
    if(U.t>=P.end){if($('#chkLoop').checked){U.t=0;lastTs=ts;P={end:sceneEnd(geom())};$('#scrub').max=P.end;}else{U.t=P.end;stopPlay();refresh();return;}}
    $('#scrub').value=U.t; updTC(); $('#btnLayoutView').hidden=false;
    mediaSync(true); render(); if(Math.round(U.t)%3===0) drawSpeedGraph(); drawDope(); raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
}
function stopPlay(){const was=U.playing;U.playing=false;cancelAnimationFrame(raf);mediaSync(false);$('#icoPlay').innerHTML='<path d="M4 2.5v11l9-5.5z"/>';if(was)updViewBadge();}
$('#btnPlay').onclick=()=>U.playing?stopPlay():play();
$('#scrub').addEventListener('input',e=>{tlSetT(+e.target.value);});
$('#btnLayoutView').onclick=()=>{stopPlay();U.t=null;refresh();};
$('#btnToStart').onclick=()=>{const P=plan(geom());tlSetT(Math.min(0,P.startF||0));};
$('#tlFit').onclick=()=>tlFit();
/* timeline zoom: a slider from "whole piece" (0) to ~1 second across (100), centred on the playhead */
function tlFull(){const N=dopeRange();return {lo:Math.min(0,(plan(geom()).startF||0))-Math.max(2,N*.01),hi:N+Math.max(4,N*.02)};}
function tlZoomTo(span,centre){const F=tlFull(), full=F.hi-F.lo, s=clamp(span,Math.max(8,(D.comp.fps||30)*.5),full); const V0=tlView();
  const c=centre!=null?centre:(U.t!=null&&U.t>=V0.f0&&U.t<=V0.f1?U.t:(V0.f0+V0.f1)/2);
  if(s>=full-1){tlFit();updTlZoom();return;} let f0=c-s/2; f0=clamp(f0,F.lo,F.hi-s); TL.f0=f0; TL.f1=f0+s; drawDope(); updTlZoom();}
function updTlZoom(){const r=$('#tlZoomRange'); if(!r) return; const F=tlFull(), full=F.hi-F.lo, V0=tlView(), mn=Math.max(8,(D.comp.fps||30)*.5);
  const k=Math.log(full/Math.max(mn,V0.f1-V0.f0))/Math.log(full/mn||2); if(document.activeElement!==r) r.value=Math.round(clamp(k,0,1)*100);
  const lf=$('#tlLenF'); if(lf){const fps=D.comp.fps||30; lf.textContent=Math.round((D.comp.dur||0)*fps)+'f';}}
$('#tlZoomRange').addEventListener('input',e=>{const F=tlFull(), full=F.hi-F.lo, mn=Math.max(8,(D.comp.fps||30)*.5); tlZoomTo(full*Math.pow(mn/full,(+e.target.value)/100));});
$('#tlZoomIn').onclick=()=>{const V0=tlView();tlZoomTo((V0.f1-V0.f0)/1.5);};
$('#tlZoomOut').onclick=()=>{const V0=tlView();tlZoomTo((V0.f1-V0.f0)*1.5);};
($('#btnHandlesReset')||{}).onclick=()=>{pushHist(true);D.anim.sceneEase.hd=null;refresh();};
($('#btnEaseAuto')||{}).onclick=()=>{pushHist(true);D.anim.sceneEase.onAt=null;D.anim.sceneEase.holdAt=null;syncInputs(true);refresh();};
$('#btnEase').onclick=()=>{ if(D.anim.sceneEase&&D.anim.sceneEase.on){setCtx('scene');refresh();return;} openCurveEditor('anim.sceneCurve',0,1,'Scene easing · re-times the whole scene'); };
$('#btnSound').onclick=()=>setCtx('sound');
$('#btnRetimeMenu').onclick=e=>{e.stopPropagation();const m=$('#retimeMenu');if(!m.hidden){m.hidden=true;return;}m.hidden=false;const r=e.currentTarget.getBoundingClientRect();m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.left))+'px';m.style.top=Math.max(8,r.top-m.offsetHeight-6)+'px';};
document.addEventListener('pointerdown',e=>{const m=$('#retimeMenu');if(m&&!m.hidden&&!(e.target.closest&&(e.target.closest('#retimeMenu')||e.target.closest('#btnRetimeMenu'))))m.hidden=true;});
$('#mRetimeMore').onclick=()=>{$('#retimeMenu').hidden=true;setCtx('scene');};
$('#btnGenLine').onclick=()=>generateLine(true);
/* Generate panel status: live generated line vs hand-edited */
function renderGenStatus(G){
  const el=$('#genStatus'); if(!el) return; const P=plan(G), fps=D.comp.fps||30, n=P.walkFrom!=null?P.walkFrom:P.seq.length;
  const gen=isGenerated(), ed=!gen&&D.blocks.length>1;
  el.classList.toggle('edited',ed);
  el.innerHTML=!D.blocks.length?'Nothing yet. Pick a size and press <b>Generate</b> (G).':
    gen?`<b>${n}</b> blocks over <b>${(P.L/fps).toFixed(2)}s</b> · seed <b>${D.rand.seed}${D.anim.seed?'·'+D.anim.seed:''}</b>`:
    `<b>${D.blocks.length}</b> blocks, edited by hand${Object.keys(D.anim.dt||{}).length?` · ${Object.keys(D.anim.dt).length} retimed`:''}`;
  el.title=!D.blocks.length?'':gen?'Live — change any setting and the line regenerates. Drag a block on the canvas to start editing by hand.':'Edited by hand. Press Generate to start over from the settings.';
  const t=$('#genTag'); if(t) t.textContent=gen?'live':ed?'edited':'';
  const bk=$('#btnBake'); if(bk) bk.hidden=!gen; paceShow();
  const ps=$('#btnPickStart'); if(ps){ ps.classList.toggle('primary',!!U.pickStart); ps.textContent=U.pickStart?'Click a square…':'◎ Pick start spot'; ps.classList.toggle('on',D.rand.startCol!=null&&!U.pickStart); }
  const sa=$('#btnStartAuto'); if(sa) sa.hidden=D.rand.startCol==null;
}

/* ------------------------------------------------------------------ extend pattern */
function bakeExtension(){
  let G=geom(); const P=plan(G); const v=P.seq.filter(b=>b.virtual);
  if(!v.length) return toast('There are no extra blocks to add');
  pushHist();
  let ox=D.grid.overX, oy=D.grid.overY;
  v.forEach(b=>{
    ox=Math.max(ox,b.c+b.w-1-(G.C-1),-b.c); oy=Math.max(oy,-b.r,b.r+b.h-1-(G.R-1));
    const n=newBlock(b.c,b.r,b.w,b.h,b.color); n.echo=b.echo; n.textColor=b.textColor;
    if(D.anim.order==='manual') n.mo=U.moNext++;
    D.blocks.push(n);
  });
  D.grid.overX=ox; D.grid.overY=oy; D.anim.extendOn=false;
  syncInputs(); refresh(); toast(`Added ${v.length} blocks to the layout`,'',true);
}
$('#btnBake').onclick=bakeExtension;
/* ---- v3: generate the whole line from a seed, then edit it ----
   Generate = one seed block + the walk continues it (live: every setting change regenerates).
   The first time you move, resize or delete a generated block, the line is made editable (materialize):
   the generated blocks become normal blocks, keeping their timing and any per-block offsets. */
function generateLine(newSeed,quiet){
  const G=geom(); if(!quiet) pushHist();
  if(newSeed){D.rand.seed=Math.floor(Math.random()*99999)+1; D.anim.seed=0;}
  const rnd=rng(D.rand.seed), bw=clamp(Math.round(D.block.w)||1,1,G.C), bh=Math.max(1,Math.round(D.block.h)||1), WB=walkBounds(G,bh), rMax=WB.hi;
  const hiStart=WB.ext?Math.max(WB.lo,WB.hi-bh):rMax;
  const row=D.rand.startCol!=null&&D.rand.startR!=null?Math.round(+D.rand.startR):D.rand.startRow>0?clamp(D.rand.startRow-1,WB.lo,rMax):WB.lo+Math.floor(rnd()*(hiStart-WB.lo+1));
  if(['manual','ttb','random'].indexOf(D.anim.order)>=0) D.anim.order='ltr';
  const dir=D.anim.order==='rtl'?-1:1;
  const c0=D.rand.startCol!=null&&isFinite(+D.rand.startCol)?Math.round(+D.rand.startCol):(dir>0?Math.max(G.cLo,G.firstFull):Math.min(G.cHi-bw+1,G.lastFull-bw+1));   // a picked start spot, or the frame edge the line walks from
  uid=1; D.blocks=[newBlock(c0,row,bw,bh,mixColor(0,rnd))];
  Object.assign(D.anim,{extendOn:true,extendMode:'walk'}); if(!quiet) Object.assign(D.anim,{skip:[],cutAt:null,dt:{},dx:{}});
  if(D.anim.mode==='static') D.anim.mode='camera';
  U.selIds=[]; U.dopeSel=[]; U.sel=null; U.live=false; U.preview=false; planCache.k=''; fillCache.clear();
  syncInputs(true); refresh();
  if(!quiet){const P=plan(G); toast(`Generated ${P.seq.length} blocks · seed ${D.rand.seed}`,'Drag any block to edit it',true);}
}
function isGenerated(){return !!(D.anim.extendOn&&D.anim.mode!=='static');}
function materialize(){
  const G=geom(), P=plan(G), v=P.seq.filter(b=>b.virtual&&b.id>-100000);
  if(!v.length) return null;
  pushHist();
  const map={}; let ox=D.grid.overX, oy=D.grid.overY;
  if(P.lineShift){ D.blocks.forEach(b=>{b.r+=P.lineShift; map[b.id]=b.id;}); }
  P.seq.forEach(x=>{ if(!x.virtual){ const rb=byId(x.id); if(rb&&rb.color!==x.color){rb.color=x.color;rb.textColor=x.textColor;} } });   // keep the slid line where it's drawn
  v.forEach(b=>{
    ox=Math.max(ox,b.c+b.w-1-(G.C-1),-b.c); oy=Math.max(oy,-b.r,b.r+b.h-1-(G.R-1));
    const n=newBlock(b.c,b.r,b.w,b.h,b.color); n.stack=!!b.stack; n.textColor=b.textColor; map[b.id]=n.id; D.blocks.push(n);
  });
  ['dt','dx'].forEach(k=>{const m=D.anim[k]||{};Object.keys(m).forEach(id=>{if(map[id]!=null){m[map[id]]=m[id];delete m[id];}});});
  if(D.blockColors) Object.keys(D.blockColors).forEach(id=>{ if(+id<0) delete D.blockColors[id]; });   // baked into the new blocks
  U.dopeSel=(U.dopeSel||[]).map(id=>map[id]!=null?map[id]:id);
  D.grid.overX=ox; D.grid.overY=oy; D.anim.extendOn=false; D.anim.skip=[]; D.anim.cutAt=null;
  planCache.k=''; syncInputs(true);
  toast('The generated line is now editable','⌘Z to undo',true);
  return map;
}
/* generated (virtual) block under a cell in the current view, or null */
function virtualAt(G,cell){
  if(!isGenerated()) return null; const P=plan(G);
  return P.seq.find(b=>(b.virtual||b._shift)&&cell.c>=b.c&&cell.c<b.c+b.w&&cell.r>=b.r&&cell.r<b.r+b.h)||null;
}
($('#lnkRestartOrder')||{}).onclick=e=>{e.preventDefault();pushHist(true);D.blocks.forEach(b=>b.mo=0);U.moNext=1;U.tool='order';refresh();};
($('#lnkReshuffleOrder')||{}).onclick=e=>{e.preventDefault();pushHist(true);D.anim.orderSeed=Math.floor(Math.random()*1e5);refresh();};

/* ------------------------------------------------------------------ content quick actions */
$('#btnNumber').onclick=()=>{pushHist();ordered(geom()).forEach(b=>b.text=String(b.order).padStart(2,'0'));refresh();};
$('#btnClearText').onclick=()=>{if(!D.blocks.some(b=>b.text))return toast('No text to clear');pushHist();D.blocks.forEach(b=>b.text='');refresh();toast('Cleared all text','',true);};
$('#btnApplyStyle').onclick=()=>{pushHist();D.blocks.forEach(b=>{b.fontSize=D.text.size;b.align=D.text.align;b.pad=D.text.pad;b.offX=D.text.offX;b.offY=D.text.offY;TEXT_KEYS.forEach(k=>b[k]=D.text[k]);});refresh();toast('Applied to all blocks','',true);};
$('#fontFam').addEventListener('change',e=>{pushHist(true);setFamily(D.text,e.target.value.trim());
  if($('#chkStyleSel').checked&&STEPS[U.step].id==='content') selBlocks().forEach(b=>setFamily(b,D.text.family));
  renderFontUI();refresh();});
$('#fontStyle').addEventListener('change',e=>{pushHist(true);setStyle(D.text,e.target.value);
  if($('#chkStyleSel').checked&&STEPS[U.step].id==='content') selBlocks().forEach(b=>{b.family=D.text.family;b.style=D.text.style;b.font=D.text.font;});
  renderFontUI();refresh();});
{const rb=$('#btnRecolour'); if(rb) rb.onclick=recolourByRule;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-transshuffle]');if(!b)return;pushHist(true);D.trans[b.dataset.transshuffle].seed=Math.floor(Math.random()*99999);refresh();});
$('#fillFam').addEventListener('change',e=>{pushHist(true);setFamily(D.fill,e.target.value.trim());fillCache.clear();renderFillFont();refresh();});
$('#fillStyle').addEventListener('change',e=>{pushHist(true);setStyle(D.fill,e.target.value);fillCache.clear();renderFillFont();refresh();});
$('#btnFillShuffle').onclick=()=>{pushHist(true);D.fill.seed=Math.floor(Math.random()*99999);fillCache.clear();refresh();toast('New content','',true);};
$('#btnGapShuffle').onclick=()=>{pushHist(true);D.fill.gap.seed=Math.floor(Math.random()*99999);refresh();};
function renderFillFont(){const f=$('#fillFam'),st=$('#fillStyle');if(f&&document.activeElement!==f)f.value=D.fill.family;if(st)st.innerHTML=fontStyleOptions(D.fill.family,D.fill.style);}
$('#btnPalAdd').onclick=()=>{const c=D.block.color.toUpperCase();if(D.palette.indexOf(c)>=0)return toast('Already in the palette');pushHist(true);D.palette.push(c);syncPalettes();renderInsp();};
$('#btnPalReset').onclick=()=>{pushHist(true);D.palette=PALETTE.slice();syncPalettes();renderInsp();};
$('#paletteEdit').addEventListener('click',e=>{const b=e.target.closest('[data-pal-i]');if(!b)return;const i=+b.dataset.palI;
  if(e.altKey){if(D.palette.length<=1)return;pushHist(true);D.palette.splice(i,1);syncPalettes();renderInsp();return;}
  applySwatch('block.color',D.palette[i]);});
$('#btnPickEnd').onclick=startPick;
$('#chkMB').onchange=e=>{U.mbPrev=e.target.checked;savePrefs();render();};
$('#chkLoop').onchange=e=>{U.loop=e.target.checked;savePrefs();toast(U.loop?'Preview will loop':'Preview plays once');};
$('#iconSet').addEventListener('click',e=>{const b=e.target.closest('[data-icon]');if(!b)return;pushHist(true);const k=b.dataset.icon;catSet('icons',k,!catGet('icons',k));D.fill.look='custom';fillCache.clear();syncIconSet();refresh();});
/* What appears: chips, looks, dice, all/none */
document.addEventListener('click',e=>{
  const t=e.target.closest&&e.target.closest('[data-chip],[data-look],[data-dice],[data-all],#btnRollAll'); if(!t||!t.closest('#left')) return;
  if(t.closest('summary')){e.preventDefault();e.stopPropagation();}
  pushHist(true);
  if(t.id==='btnRollAll'){ rollAll(); toast('New look rolled','',true); }
  else if(t.dataset.chip){ const p=t.dataset.chip.split(':'); catSet(p[0],p[1],!catGet(p[0],p[1])); D.fill.look='custom'; }
  else if(t.dataset.look){ applyLook(t.dataset.look); toast(LOOKS[t.dataset.look].name+' look','',true); }
  else if(t.dataset.dice){ rollCat(t.dataset.dice); D.fill.seed=Math.floor(Math.random()*99999); D.fill.look='custom'; }
  else if(t.dataset.all){ const c=t.dataset.all, ks=catKeys(c), on=ks.every(k=>catGet(c,k)); ks.forEach(k=>catSet(c,k,!on)); D.fill.look='custom'; }
  fillCache.clear(); syncInputs(true); refresh();
},true);
($('#camPreset')||{addEventListener(){}}).addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;const p=b.dataset.p.split(',').map(Number);pushHist(true);Object.assign(D.anim,{smooth:p[0],motionBlurF:p[1],settle:p[2]});syncInputs();refresh();});
($('#zonePreset')||{addEventListener(){}}).addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(!b)return;pushHist(true);D.anim.revealX=+b.dataset.z;syncInputs();refresh();});
$('#endPreset').addEventListener('click',e=>{const b=e.target.closest('[data-ex]');if(!b)return;pushHist(true);D.anim.endX=+b.dataset.ex;syncInputs();refresh();});
$('#btnResetAnim').onclick=()=>{pushHist(true);const keepZoom=D.anim.zoom;D.anim=clone(DEF.anim);U.t=null;syncInputs(true);refresh();toast('Animation settings reset','',true);};
$('#btnResizeAll').onclick=resizeAll;
function clearLayout(){
  if(!D.blocks.length){toast('The layout is already empty');return;}
  const n=Math.max(D.blocks.length,(plan(geom()).seq||[]).length); pushHist(); D.blocks=[]; U.selIds=[]; U.sel=null; U.moNext=1;
  if(STEPS[U.step].id==='layout') U.tool='stamp';
  syncInputs(); refresh(); toast(`Cleared ${n} block${n===1?'':'s'}`,'',true);
}
$('#btnClearLayout').onclick=clearLayout;
$('#btnPickStart').onclick=()=>{U.pickStart?(U.pickStart=false,refresh()):startPickStart();};
$('#btnStartAuto').onclick=clearPickStart;
/* 'One every': stored in frames (anim.pace), shown in frames, seconds or % of the scene */
function paceScene(){ return Math.max(1,+D.anim.lenF||72); }   // % of the On (build) bar — the blocks' own clock, before the Scene remap
function paceShow(){ const inp=$('#paceIn'), sel=$('#paceUnit'); if(!inp||!sel) return; const u=D.anim.paceUnit||'f', f=+D.anim.pace||5, fps=D.comp.fps||30;
  sel.value=u; inp.step=u==='f'?'1':u==='s'?'0.05':'0.5';
  if(document.activeElement!==inp) inp.value=u==='f'?f:u==='s'?+(f/fps).toFixed(3):+(f/paceScene()*100).toFixed(2); }
$('#paceIn').addEventListener('input',e=>{ const v=parseFloat(e.target.value); if(!(v>0)) return; const u=D.anim.paceUnit||'f', fps=D.comp.fps||30;
  const f=u==='f'?v:u==='s'?v*fps:v/100*paceScene(); if(U.editing!==e.target){pushHist(true);U.editing=e.target;}
  D.anim.pace=Math.max(1,Math.round(f*100)/100); planCache.k=''; refresh(); });
$('#paceIn').addEventListener('change',()=>{U.editing=null;paceShow();});
$('#paceUnit').addEventListener('change',e=>{ D.anim.paceUnit=e.target.value; paceShow(); autosave(); });
/* recolour every block (hand-placed / edited ones too) with the current colour mode; single-block picks are cleared */
function applyColourToAll(){
  const G=geom(), P=plan(G); if(!P.seq.length&&!D.blocks.length) return toast('No blocks to colour');
  pushHist(); D.blockColors={}; planCache.k='';
  const seq=P.seq.length?P.seq:ordered(G), col=applyColourMode(seq.map(b=>Object.assign({},b,{virtual:false})));
  let n=0; col.forEach(c=>{ const rb=byId(c.id); if(rb&&rb.color!==c.color){ const auto=rb.textColor===contrast(rb.color); rb.color=c.color; if(auto) rb.textColor=contrast(c.color); n++; } });
  planCache.k=''; syncPalettes(); refresh(); toast(`Recoloured ${isGenerated()?'the line':n+' block'+(n===1?'':'s')}`,'⌘Z to undo',true);
}
$('#btnApplyColour').onclick=applyColourToAll;
$('#btnGenClear').onclick=()=>{if(!D.blocks.length)return toast('No blocks to clear');D.anim.dt={};D.anim.dx={};D.anim.skip=[];D.anim.cutAt=null;clearLayout();};
$('#btnGen').onclick=()=>generate(false);
$('#btnShuffle').onclick=shuffle;
$('#chkOrder').onchange=e=>{U.showOrder=e.target.checked;render();};

/* ------------------------------------------------------------------ zoom buttons */
$('#zIn').onclick=()=>zoomAt(1.25,V.cw/2,V.ch/2);
$('#zOut').onclick=()=>zoomAt(.8,V.cw/2,V.ch/2);
$('#zPct').onclick=()=>{fitView('comp');render();};
function backToFrame(){fitView('comp');render();}
$('#zFit').onclick=backToFrame; $('#backBtn').onclick=backToFrame;
/* show "Back to frame" when the comp is mostly out of view or tiny/huge on screen */
function updBackBtn(G){
  const b=$('#backBtn'); if(!b) return;
  const x0=V.ox, y0=V.oy, x1=V.ox+G.W*V.sc, y1=V.oy+G.H*V.sc;
  const vis=Math.max(0,Math.min(x1,V.cw)-Math.max(x0,0))*Math.max(0,Math.min(y1,V.ch)-Math.max(y0,0));
  const area=Math.max(1,(x1-x0)*(y1-y0)), frac=vis/area, cover=vis/Math.max(1,V.cw*V.ch);
  b.hidden=!(frac<0.6||(cover<0.08&&!V.fit));
}
$('#zAll').onclick=()=>{fitView('all');render();};

/* ------------------------------------------------------------------ keyboard */
document.addEventListener('pointerdown',e=>{const a=document.activeElement; if(a&&a!==document.body&&e.target&&e.target.tagName==='CANVAS'&&a.blur) a.blur();},true);
document.addEventListener('keydown',e=>{
  const t=e.target;
  const typing=t.matches&&t.matches('input:not([type=checkbox]):not([type=color]):not([type=range]),textarea,select');
  const mod=e.metaKey||e.ctrlKey, k=e.key, kl=k.length===1?k.toLowerCase():k;
  if(mod&&kl==='z'&&U.curveEd&&!$('#curveModal').hidden){e.preventDefault();U.curveEd.step(e.shiftKey?1:-1);return;}
  const textTyping=t.matches&&t.matches('input[type=text],input:not([type]),input[type=search],textarea');   // number fields / selects: ⌘Z is the app's undo
  if(mod&&kl==='z'){if(textTyping)return;e.preventDefault();if(typing&&t.blur)t.blur();e.shiftKey?redo():undo();return;}
  if(mod&&kl==='y'){if(textTyping)return;e.preventDefault();redo();return;}
  if(mod&&kl==='s'){e.preventDefault();openLib(true);return;}
  if(typing){if(k==='Escape')t.blur();return;}
  if(!$('#libModal').hidden){if(k==='Escape')closeLib();return;}
  if(!$('#curveModal').hidden&&k==='Escape'){$('#curveModal').hidden=true;U.curveEd=null;refresh();return;}
  if(k===' '){e.preventDefault();if(!U.space&&!e.repeat){U.space=true;U.spacePanned=false;cv.classList.add('panning');}return;}   // tap = play/pause, hold + drag = pan
  if(mod) return;
  const tsel=tlSelIds(), virtSel=tsel.some(id=>!byId(id));
  if(kl==='m'||k==='Enter'){if(U.sel){e.preventDefault();mergeSel();}}
  else if((k==='Delete'||k==='Backspace')&&tsel.length&&(virtSel||e.shiftKey||(U.dopeSel||[]).length)){e.preventDefault();dopeRemove(e.shiftKey);}
  else if(k==='Delete'||k==='Backspace'){e.preventDefault();deleteSelected();}
  else if(k==='Escape'){if(!$('#clearMenu').hidden){closeMenu();return;}if(U.picking){cancelPick();return;}if(U.pickStart){U.pickStart=false;refresh();return;}closeTlMenu();
    if(tsel.length||U.sel){U.sel=null;U.selIds=[];U.dopeSel=[];refresh();} else if(U.preview&&STEPS[U.step].id==='layout'){U.preview=false;stopPlay();refresh();} else if(U.ctx){U.ctx=null;refresh();} else if(U.t!=null){stopPlay();U.t=null;refresh();}}
  else if(kl==='d'){duplicate();}
  else if(kl==='g'){if(STEPS[U.step].id!=='layout'){U.ctx=null;goStep(SI('layout'));}generateLine(true);}
  else if(kl==='r'){if(STEPS[U.step].id!=='layout'){U.ctx=null;goStep(SI('layout'));}animSeed();}
  else if(kl==='p'){U.playing?stopPlay():play();}
  else if(kl==='f'){if(e.shiftKey){tlFit();}else{fitView('comp');render();}}
  else if(k==='+'||k==='='){zoomAt(1.25,V.cw/2,V.ch/2);}
  else if(k==='-'||k==='_'){zoomAt(.8,V.cw/2,V.ch/2);}
  else if(k==='Home'){e.preventDefault();const P=plan(geom());tlSetT(Math.min(0,P.startF||0));}
  else if(k==='End'){e.preventDefault();tlSetT(sceneEnd(geom()));}
  else if(k===','||k==='.'){tlSetT((U.t==null?0:U.t)+(k===','?-1:1)*(e.shiftKey?10:1));}
  else if(k==='['){U.ctx=null;goStep(U.step-1);refresh();} else if(k===']'){U.ctx=null;goStep(U.step+1);refresh();}
  else if(k.indexOf('Arrow')===0&&e.altKey&&tsel.length&&(k==='ArrowLeft'||k==='ArrowRight')){e.preventDefault();tlNudge((k==='ArrowLeft'?-1:1)*(e.shiftKey?10:1));}
  else if(k.indexOf('Arrow')===0&&tsel.length){e.preventDefault();if(virtSel&&isGenerated()){const map=materialize();if(map){U.selIds=tsel.map(id=>map[id]!=null?map[id]:id).filter(id=>byId(id));U.dopeSel=U.selIds.slice();}}const s2=e.shiftKey?D.block.w||1:1;nudge(k==='ArrowLeft'?-s2:k==='ArrowRight'?s2:0,k==='ArrowUp'?-1:k==='ArrowDown'?1:0);}
  else{const tool=Object.keys(TOOLS).find(x=>TOOLS[x].key.toLowerCase()===kl&&x!=='erase'&&x!=='paint');if(tool)setTool(tool);}
});
window.addEventListener('blur',()=>{if(U.space){U.space=false;cv.classList.remove('panning');refresh();}});
document.addEventListener('keyup',e=>{if(e.key===' '){
  const t=e.target, typing=t&&t.matches&&t.matches('input:not([type=checkbox]):not([type=color]):not([type=range]),textarea,select');
  const was=U.space; U.space=false; cv.classList.remove('panning');
  if(typing||!was) return; e.preventDefault();
  if(!U.spacePanned&&$('#libModal').hidden){ if(U.playing) stopPlay(); else if(D.anim.mode!=='static'||transOn()) play(); }
}});



/* ------------------------------------------------------------------ easing curve editor */
const CURVE_PRESETS=[['Linear',[0,0,1,1]],['Ease',[0.33,0,0.67,1]],['Ease out',[0,0,0.2,1]],['Ease in',[0.8,0,1,1]],['Strong',[0.7,0,0.15,1]],['Snappy',[0.1,0.8,0.2,1]],['Overshoot',[0.3,0,0.2,1.25]]];
function curveGeo(c){const r=c.getBoundingClientRect(),pad=14,span=r.height-2*pad;return{r,x0:pad,x1:r.width-pad,y0:r.height-pad-span*.14,y1:pad+span*.14};}
const cToPx=(g,x,y)=>[g.x0+(g.x1-g.x0)*x,g.y0+(g.y1-g.y0)*y];
const SCENE_PRESETS=[['Linear',[0,0,1,1]],['Ease in-out',[0.45,0,0.55,1]],['Slow start',[0.6,0,1,1]],['Slow end',[0,0,0.4,1]],['Gentle',[0.25,0.1,0.25,1]],['Strong',[0.8,0,0.2,1]]];
function buildCurves(){
  $$('[data-curve]').forEach(el=>{
    const path=el.dataset.curve, scene=el.dataset.ymin!=null;
    const ymin=scene?+el.dataset.ymin:-0.5, ymax=scene?+el.dataset.ymax:1.5;
    const presets=scene?SCENE_PRESETS:CURVE_PRESETS;
    el._presets=presets;
    el.innerHTML=`<div class="lbl">${el.dataset.title}${scene?'<button class="chipbtn cv-pop" title="Open a big editor where you can add points">⤢ Big editor</button>':''}</div><canvas></canvas><div class="cv-row">${presets.map((p,i)=>`<button class="chipbtn" data-cp="${i}">${p[0]}</button>`).join('')}<button class="chipbtn" data-creset="1" title="Back to default">↺ Reset</button></div><div class="cv-val"></div>`;
    const c=el.querySelector('canvas'); let drag=-1;
    const move=e=>{
      if(drag<0) return; const g=curveGeo(c);
      let px=e.clientX-g.r.left, py=e.clientY-g.r.top;
      if(e.shiftKey||e.metaKey||e.ctrlKey){
        // snap the handle direction to 0°, 45° or 90° (as seen on screen)
        const an=drag===0?cToPx(g,0,0):cToPx(g,1,1);
        const vx=px-an[0], vy=py-an[1], len=Math.hypot(vx,vy), step=Math.PI/4;
        const ang=Math.round(Math.atan2(vy,vx)/step)*step;
        px=an[0]+Math.cos(ang)*len; py=an[1]+Math.sin(ang)*len;
      }
      const x=clamp((px-g.x0)/(g.x1-g.x0),0,1), y=clamp((py-g.y0)/(g.y1-g.y0),ymin,ymax);
      const cur=getP(path).slice(); cur[drag*2]=r3(x); cur[drag*2+1]=r3(y); setP(path,cur);
      planCache.k=''; drawCurve(el); render(); updPaceTotal();
    };
    if(scene) c.addEventListener('dblclick',()=>openCurveEditor(path,ymin,ymax,el.dataset.title));
    c.addEventListener('pointerdown',e=>{
      const g=curveGeo(c), cur=getP(path), mx=e.clientX-g.r.left, my=e.clientY-g.r.top;
      if(isPts(cur)){openCurveEditor(path,ymin,ymax,el.dataset.title);return;}
      const p1=cToPx(g,cur[0],cur[1]), p2=cToPx(g,cur[2],cur[3]);
      drag=Math.hypot(mx-p1[0],my-p1[1])<=Math.hypot(mx-p2[0],my-p2[1])?0:1;
      c.setPointerCapture(e.pointerId); pushHist(true); move(e);
    });
    c.addEventListener('pointermove',move);
    const up=()=>{if(drag>=0){drag=-1;refresh();}};
    c.addEventListener('pointerup',up); c.addEventListener('pointercancel',up);
    const pop=el.querySelector('.cv-pop'); if(pop) pop.addEventListener('click',()=>openCurveEditor(path,ymin,ymax,el.dataset.title));
    el.querySelector('.cv-row').addEventListener('click',e=>{
      const b=e.target.closest('[data-cp],[data-creset]'); if(!b) return;
      pushHist(true);
      const v=b.dataset.creset?clone(defOf(path)):presets[+b.dataset.cp][1].slice();
      setP(path,v); refresh();
      toast(b.dataset.creset?'Curve reset':`${presets[+b.dataset.cp][0]} applied`,'',true);
    });
  });
}
/* ---- big curve editor: drag points, click to add, double-click / Alt-click to remove ---- */
function openCurveEditor(path,ymin,ymax,title){
  if(path==='anim.sceneCurve'&&D.anim.sceneEase&&D.anim.sceneEase.on){D.anim.sceneEase.on=false;toast('Switched to a custom curve','Turn Simple easing back on in Scene',true);}
  const m=$('#curveModal'), c=$('#cvBig'), sp=$('#cvSpeed'); if(!m) return;
  $('#cvBigTitle').textContent=title||'Easing';
  m.hidden=false; let drag=null, pushedGlobal=false;
  const CE=U.curveEd={path,undo:[],redo:[]};
  const snap=()=>JSON.stringify(getP(path));
  const remember=()=>{ if(!pushedGlobal){pushHist(true);pushedGlobal=true;} CE.undo.push(snap()); if(CE.undo.length>200)CE.undo.shift(); CE.redo=[]; };
  CE.step=dir=>{ const from=dir<0?CE.undo:CE.redo, to=dir<0?CE.redo:CE.undo; if(!from.length) return; to.push(snap()); setP(path,JSON.parse(from.pop())); planCache.k=''; draw(); refresh(); };
  const H=()=>toH(getP(path));
  const save=h=>{h.sort((a,b)=>a.x-b.x);h[0].x=0;h[h.length-1].x=1;h[0].ix=0;h[0].iy=0;h[h.length-1].ox=0;h[h.length-1].oy=0;
    // keep handles inside their segment so time never runs backwards
    for(let i=0;i<h.length;i++){const hp=i>0?h[i].x-h[i-1].x:0,hn=i<h.length-1?h[i+1].x-h[i].x:0;h[i].ix=clamp(h[i].ix,-hp,0);h[i].ox=clamp(h[i].ox,0,hn);}
    setP(path,hPack(h));planCache.k='';};
  const geo=()=>{const r=c.getBoundingClientRect(),pad=28;return{r,x0:pad,x1:r.width-pad,y0:r.height-pad,y1:pad};};
  const toPx=(g,u,v)=>[g.x0+(g.x1-g.x0)*u,g.y0+(g.y1-g.y0)*v];
  const fromPx=(g,px,py)=>[(px-g.x0)/(g.x1-g.x0),(py-g.y0)/(g.y1-g.y0)];
  function draw(){
    const g=geo(),dpr=window.devicePixelRatio||1; c.width=Math.round(g.r.width*dpr); c.height=Math.round(g.r.height*dpr);
    const x=c.getContext('2d'); x.scale(dpr,dpr); x.clearRect(0,0,g.r.width,g.r.height);
    x.strokeStyle='#2a2a30'; x.lineWidth=1; for(let i=0;i<=10;i++){const a1=toPx(g,i/10,0),b1=toPx(g,i/10,1);x.beginPath();x.moveTo(a1[0],a1[1]);x.lineTo(b1[0],b1[1]);x.stroke();const c2=toPx(g,0,i/10),d2=toPx(g,1,i/10);x.beginPath();x.moveTo(c2[0],c2[1]);x.lineTo(d2[0],d2[1]);x.stroke();}
    x.strokeStyle='#3a3a42'; x.strokeRect(g.x0,g.y1,g.x1-g.x0,g.y0-g.y1);
    x.fillStyle='#8a8a94'; x.font='11px sans-serif'; x.fillText('time →',g.x1-40,g.y0+18); x.fillText('progress',g.x0-22,g.y1-10);
    if(path==='anim.sceneCurve'){try{const P=plan(geom());x.fillStyle='rgba(255,255,255,.35)';[...new Set(P.T)].forEach(t=>{const u=(t-P.startF)/Math.max(1,P.L);if(u>=0&&u<=1){const q=toPx(g,u,0);x.fillRect(q[0],g.y0-6,1,6);}});}catch(e){}}
    const cu=getP(path), f=curveFn(cu); x.strokeStyle='#E6212F'; x.lineWidth=2.5; x.beginPath();
    for(let i=0;i<=240;i++){const u=i/240,p=toPx(g,u,f(u));i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);} x.stroke();
    const h=H();
    h.forEach((p,i)=>{const P0=toPx(g,p.x,p.y);
      [['in',p.ix,p.iy,i>0],['out',p.ox,p.oy,i<h.length-1]].forEach(([k,dx,dy,on])=>{ if(!on) return; const q=toPx(g,p.x+dx,p.y+dy);
        x.strokeStyle='rgba(255,255,255,.45)';x.lineWidth=1;x.beginPath();x.moveTo(P0[0],P0[1]);x.lineTo(q[0],q[1]);x.stroke();
        x.fillStyle=drag&&drag.i===i&&drag.k===k?'#E6212F':'#c9c9cf';x.beginPath();x.arc(q[0],q[1],4.5,0,7);x.fill();});
      x.fillStyle=drag&&drag.i===i&&drag.k==='pt'?'#E6212F':'#fff';x.strokeStyle='#E6212F';x.lineWidth=2;x.beginPath();x.rect(P0[0]-5,P0[1]-5,10,10);x.fill();x.stroke();});
    if(CE.alt&&CE.mouse){const mp=CE.mouse;x.strokeStyle='#fff';x.lineWidth=1.6;x.beginPath();x.moveTo(mp[0]+8,mp[1]+16);x.lineTo(mp[0]+13,mp[1]+9);x.lineTo(mp[0]+18,mp[1]+16);x.stroke();x.fillStyle='#ececef';x.font='10px sans-serif';x.fillText('convert',mp[0]+21,mp[1]+16);}
    if(CE.hover){const p=toPx(g,CE.hover[0],CE.hover[1]);x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=1.5;x.beginPath();x.arc(p[0],p[1],6,0,7);x.stroke();x.beginPath();x.moveTo(p[0]-3,p[1]);x.lineTo(p[0]+3,p[1]);x.moveTo(p[0],p[1]-3);x.lineTo(p[0],p[1]+3);x.stroke();}
    const r2=sp.getBoundingClientRect(); sp.width=Math.round(r2.width*dpr); sp.height=Math.round(r2.height*dpr);
    const y=sp.getContext('2d'); y.scale(dpr,dpr); y.clearRect(0,0,r2.width,r2.height);
    const v=[]; for(let i=0;i<200;i++){v.push(Math.max(0,(f((i+1)/200)-f(i/200))*200));} const mx=Math.max(1e-6,...v);
    y.fillStyle='rgba(116,157,211,.45)'; v.forEach((s,i)=>{const hh=s/mx*(r2.height-6);y.fillRect(g.x0+(g.x1-g.x0)*i/200,r2.height-hh,Math.max(1,(g.x1-g.x0)/200+.5),hh);});
    y.fillStyle='#8a8a94'; y.font='10px sans-serif'; y.fillText('speed',4,12);
    $('#cvBigInfo').textContent=`${h.length} points · click the line to add · drag points / handles · hold ⌥ for the convert tool: ⌥-click a point = corner ↔ smooth, ⌥-drag a point = pull out new handles, ⌥-drag a handle = break it · double-click a point to remove · Shift = flat handle · ⌘Z undoes here`;
  }
  const hit=(g,mx,my)=>{const h=H();let best=null,bd=9;
    h.forEach((p,i)=>{const P0=toPx(g,p.x,p.y);let d=Math.hypot(P0[0]-mx,P0[1]-my);if(d<bd){bd=d;best={k:'pt',i};}
      if(i>0){const q=toPx(g,p.x+p.ix,p.y+p.iy);d=Math.hypot(q[0]-mx,q[1]-my);if(d<bd){bd=d;best={k:'in',i};}}
      if(i<h.length-1){const q=toPx(g,p.x+p.ox,p.y+p.oy);d=Math.hypot(q[0]-mx,q[1]-my);if(d<bd){bd=d;best={k:'out',i};}}});return best;};
  const onLine=(g,mx,my)=>{const u=clamp((mx-g.x0)/(g.x1-g.x0),0,1),f=curveFn(getP(path)),p=toPx(g,u,f(u));return Math.abs(p[1]-my)<=10&&mx>=g.x0-4&&mx<=g.x1+4?[u,f(u)]:null;};
  // split the segment under u exactly (de Casteljau) so adding a point never changes the shape
  const addAt=u=>{const h=H();let k=0;while(k<h.length-2&&u>h[k+1].x)k++;const A=h[k],B=h[k+1];
    const P0=[A.x,A.y],P1=[A.x+A.ox,A.y+A.oy],P2=[B.x+B.ix,B.y+B.iy],P3=[B.x,B.y];
    const bx=s=>{const t=1-s;return t*t*t*P0[0]+3*t*t*s*P1[0]+3*t*s*s*P2[0]+s*s*s*P3[0];};
    let lo=0,hi=1,s=.5;for(let i=0;i<30;i++){s=(lo+hi)/2;if(bx(s)<u)lo=s;else hi=s;}
    const L=(p,q)=>[p[0]+(q[0]-p[0])*s,p[1]+(q[1]-p[1])*s];
    const Q0=L(P0,P1),Q1=L(P1,P2),Q2=L(P2,P3),R0=L(Q0,Q1),R1=L(Q1,Q2),S=L(R0,R1);
    A.ox=Q0[0]-A.x;A.oy=Q0[1]-A.y; B.ix=Q2[0]-B.x;B.iy=Q2[1]-B.y;
    h.splice(k+1,0,{x:S[0],y:S[1],ix:R0[0]-S[0],iy:R0[1]-S[1],ox:R1[0]-S[0],oy:R1[1]-S[1]}); save(h); return k+1;};
  c.onpointerdown=e=>{
    const g=geo(), mx=e.clientX-g.r.left, my=e.clientY-g.r.top; let t=hit(g,mx,my);
    if(t&&t.k==='pt'&&e.altKey){ // ⌥ convert tool: click toggles corner / smooth, drag pulls out fresh handles
      remember(); drag={k:'pull',i:t.i,moved:false}; c.setPointerCapture(e.pointerId); draw(); return; }
    if(!t){const q=onLine(g,mx,my); if(!q) return; remember(); t={k:'pt',i:addAt(q[0])};}
    else remember();
    drag=t; if(t.k==='out'||t.k==='in'){const p0=H()[t.i]; if(p0){const vx=t.k==='out'?p0.ox:p0.ix, vy=t.k==='out'?p0.oy:p0.iy; drag.a0=Math.hypot(vx,vy)>1e-6?Math.atan2(vy,vx):null;}}
    CE.hover=null; c.setPointerCapture(e.pointerId); draw();
  };
  c.onpointermove=e=>{ const g=geo(), mx=e.clientX-g.r.left, my=e.clientY-g.r.top;
    CE.mouse=[mx,my]; CE.alt=e.altKey;
    if(!drag){ const t=hit(g,mx,my); const q=t?null:onLine(g,mx,my); CE.hover=q; c.style.cursor=e.altKey&&t?'cell':t?'grab':q?'copy':'default'; draw(); return; }
    const q=fromPx(g,mx,my), h=H(), p=h[drag.i]; if(!p) return;
    if(drag.k==='pull'){ drag.moved=true; let dx=Math.max(0,q[0]-p.x), dy=q[1]-p.y; if(e.shiftKey) dy=0;
      if(drag.i<h.length-1){p.ox=dx;p.oy=dy;} if(drag.i>0){p.ix=-dx;p.iy=-dy;}
      if(drag.i===h.length-1){p.ix=Math.min(0,q[0]-p.x);p.iy=dy;}
      save(h); draw(); render(); return; }
    if(drag.k==='pt'){ const lo=drag.i>0?h[drag.i-1].x+.01:0, hi=drag.i<h.length-1?h[drag.i+1].x-.01:1;
      p.x=drag.i===0?0:drag.i===h.length-1?1:clamp(q[0],lo,hi); p.y=clamp(q[1],ymin,ymax); }
    else { let dx=q[0]-p.x, dy=q[1]-p.y;
      if(e.shiftKey){ if(drag.a0!=null){const cx=Math.cos(drag.a0),cy=Math.sin(drag.a0),L=Math.max(0,dx*cx+dy*cy);dx=cx*L;dy=cy*L;} else dy=0; }   // ⇧ keeps the handle's angle
      if(drag.k==='out'){p.ox=Math.max(0,dx);p.oy=dy; if(!e.altKey&&drag.i>0){const L=Math.hypot(p.ix,p.iy),a=Math.atan2(dy,Math.max(1e-6,dx));p.ix=-L*Math.cos(a);p.iy=-L*Math.sin(a);}}
      else {p.ix=Math.min(0,dx);p.iy=dy; if(!e.altKey&&drag.i<h.length-1){const L=Math.hypot(p.ox,p.oy),a=Math.atan2(-dy,Math.max(1e-6,-dx));p.ox=L*Math.cos(a);p.oy=L*Math.sin(a);}} }
    save(h); draw(); render(); try{drawDope();}catch(x){} };
  c.onpointerup=()=>{ if(!drag) return;
    if(drag.k==='pull'&&!drag.moved){ // plain ⌥-click: corner ↔ smooth
      const h=H(), p=h[drag.i], n=h.length, has=Math.hypot(p.ix,p.iy)+Math.hypot(p.ox,p.oy)>1e-4;
      if(has){p.ix=p.iy=p.ox=p.oy=0;}
      else { const a0=h[Math.max(0,drag.i-1)], a1=h[Math.min(n-1,drag.i+1)], sl=(a1.y-a0.y)/Math.max(1e-6,a1.x-a0.x);
        const hp=drag.i>0?(p.x-h[drag.i-1].x)/3:0, hn=drag.i<n-1?(h[drag.i+1].x-p.x)/3:0; p.ix=-hp;p.iy=-sl*hp;p.ox=hn;p.oy=sl*hn; }
      save(h); }
    drag=null; refresh(); draw(); };
  // ⌥ held: show the convert (caret) tool
  CE.redraw=draw;
  if(!window.__gbCvAlt){window.__gbCvAlt=1; const altKey=e=>{const ce=U.curveEd; if(!ce||m.hidden) return; ce.alt=e.altKey; ce.redraw&&ce.redraw();};
    window.addEventListener('keydown',altKey); window.addEventListener('keyup',altKey);}
  c.onpointerleave=()=>{CE.hover=null;draw();};
  c.ondblclick=e=>{const g=geo(),t=hit(g,e.clientX-g.r.left,e.clientY-g.r.top),h=H();if(t&&t.k==='pt'&&t.i>0&&t.i<h.length-1){remember();h.splice(t.i,1);save(h);draw();refresh();}};
  const P=(arr)=>hPack(toH(arr));
  $('#cvBigPresets').innerHTML=[['Linear',[0,0,1,1]],['Ease in-out',[0.45,0,0.55,1]],['Fast start, long settle',[0,0,0.2,1]],['Burst, hold, burst',[3,0,0,.25,.45,.5,.55,.75,.6,1,1]],['Slow build, punch',[1,0,0,.5,.18,.8,.5,1,1]],['Two-step',[3,0,0,.3,.5,.55,.52,1,1]]]
    .map(p=>`<button class="chipbtn" data-bp="${P(p[1]).join(',')}">${p[0]}</button>`).join('')+'<button class="chipbtn" data-bsimple="1" title="Back to the default two-handle curve">↺ Reset</button>';
  $('#cvBigPresets').onclick=e=>{const b=e.target.closest('[data-bp],[data-bsimple]');if(!b)return;remember();
    if(b.dataset.bsimple) setP(path,clone(defOf(path))); else setP(path,b.dataset.bp.split(',').map(Number));
    planCache.k=''; draw(); refresh();};
  const close=()=>{m.hidden=true;U.curveEd=null;refresh();};
  $('#cvBigClose').onclick=close;
  m.onclick=null;
  requestAnimationFrame(draw);
}
/* camera speed over the scene: a quick visual check of smoothness (flat and round = smooth) */
function drawSpeedGraph(){
  const c=$('#speedCv'); if(!c) return; const r=c.getBoundingClientRect(); if(!r.width) return;
  const dpr=window.devicePixelRatio||1; c.width=Math.round(r.width*dpr); c.height=Math.round(r.height*dpr);
  const g=c.getContext('2d'); g.scale(dpr,dpr); g.clearRect(0,0,r.width,r.height);
  const P=plan(geom()), end=sceneEnd(geom()), v=[];
  for(let f=0;f<end;f++){const a=ev(P.cam,f,[0,0]),b=ev(P.cam,f+1,[0,0]);v.push(Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const mx=Math.max(1,...v), pad=6, W=r.width-2*pad, H=r.height-2*pad, X=f=>pad+f/Math.max(1,end)*W, Y=val=>pad+H-val/mx*H;
  // scene span + block reveal ticks
  g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(X(P.startF),pad,X(P.startF+P.L)-X(P.startF),H);
  g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=1; [...new Set(P.T)].forEach(t=>{g.beginPath();g.moveTo(X(t)+.5,pad+H-4);g.lineTo(X(t)+.5,pad+H);g.stroke();});
  // speed curve
  g.beginPath(); v.forEach((val,f)=>{const x=X(f),y=Y(val);f?g.lineTo(x,y):g.moveTo(x,y);});
  g.strokeStyle='#E6212F'; g.lineWidth=1.8; g.stroke();
  g.lineTo(X(v.length-1),pad+H); g.lineTo(X(0),pad+H); g.closePath(); g.fillStyle='rgba(230,33,47,.12)'; g.fill();
  if(P.relT!=null){g.save();g.setLineDash([3,3]);g.strokeStyle='rgba(116,157,211,.8)';g.beginPath();g.moveTo(X(P.relT)+.5,pad);g.lineTo(X(P.relT)+.5,pad+H);g.stroke();g.restore();g.fillStyle='rgba(116,157,211,.9)';g.font='9px sans-serif';g.fillText('let go',X(P.relT)+3,pad+9);}
  if(U.t!=null){g.strokeStyle='#fff';g.beginPath();g.moveTo(X(U.t)+.5,pad);g.lineTo(X(U.t)+.5,pad+H);g.stroke();}
  // smoothness readout: biggest frame-to-frame change in speed, relative to the peak
  let jump=0; for(let i=1;i<v.length;i++) jump=Math.max(jump,Math.abs(v[i]-v[i-1]));
  const n=$('#speedNote'); if(n) n.textContent=P.cam.length?`peak ${Math.round(mx)} px/f · ${jump/mx<.08?'very smooth':jump/mx<.18?'smooth':'abrupt changes — raise Smoothness or soften the scene easing'}`:'camera is still';
}
function updPaceTotal(){
  const el=$('#paceNote'); if(!el) return;
  if(D.anim.mode==='static'){el.textContent='';return;}
  const P=plan(geom()), fps=D.comp.fps||30, n=P.groups;
  const sec=f=>`f${f} (${+(f/fps).toFixed(2)}s)`;
  const total=(P.walkFrom!=null?P.seq.slice(0,P.walkFrom):P.seq).filter(b=>!b.echo&&!b.stack).length;
  el.innerHTML=n?`<b>${total}</b> blocks${P.ext?(isGenerated()?' (generated)':` (${P.baseMain} in your layout + ${total-P.baseMain} more)`):''} over <b>${sec(P.L)}</b> · about one every <b>${Math.max(1,Math.round(P.L/Math.max(1,total)))}</b> frames${P.walkFrom!=null?` · then ${P.seq.length-P.walkFrom} more walk off`:""}<br>Scene runs ${sec(P.startF)} → ${sec(P.startF+P.L)}${P.startF<0?' · already running at frame 0':''}${D.anim.ending==='spot'&&P.endReach===false?'<br><span class="warn">That row is too far to reach with this many blocks — the pattern gets as close as it can. Raise Wander or add blocks.</span>':''}${D.anim.order==='manual'?`<br>Manual: <b>${P.seq.length}</b> picked block${P.seq.length===1?'':'s'} animate${P.unpicked.length?`, ${P.unpicked.length} ${D.anim.unpicked==='visible'?'stay visible':'stay hidden'}`:''}.`:''}${D.anim.countMode==='exact'&&D.anim.total<P.baseMain&&D.anim.ending==='count'?'<br><span class="warn">Your layout has more blocks than this, so all of them are used.</span>':''}`:'Add some blocks first.';
}
function updRuleNote(G){
  const el=$('#ruleNote'); if(!el) return;
  const N=Math.max(1,Math.round(D.look.ruleEvery)||1);
  el.textContent=N===1?'A rule at every column break.':`A rule every ${N} columns (skipping ${N-1}), starting at column ${Math.round(D.look.ruleStart)}.`;
}
function renderCurves(){$$('[data-curve]').forEach(el=>{if(!el.hidden)drawCurve(el);});}
function drawCurve(el){
  const c=el.querySelector('canvas'); if(!c) return;
  const g=curveGeo(c); if(!g.r.width) return;
  const dpr=window.devicePixelRatio||1; c.width=Math.round(g.r.width*dpr); c.height=Math.round(g.r.height*dpr);
  const x=c.getContext('2d'); x.scale(dpr,dpr);
  const cur=getP(el.dataset.curve)||[0.33,0,0.67,1];
  // guides
  x.strokeStyle='#2f2f35'; x.lineWidth=1;
  [0,0.25,0.5,0.75,1].forEach(v=>{const a=cToPx(g,v,0),b=cToPx(g,v,1);x.beginPath();x.moveTo(a[0],g.y0+6);x.lineTo(a[0],g.y1-6);x.stroke();});
  [0,1].forEach(v=>{const a=cToPx(g,0,v),b=cToPx(g,1,v);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();});
  x.fillStyle='#686871'; x.font='9px Inter,Helvetica,Arial'; x.fillText('time →',g.x1-34,g.y0+11); x.save(); x.translate(g.x0-5,g.y0); x.rotate(-Math.PI/2); x.fillText('value →',0,0); x.restore();
  if(isPts(cur)){
    const f=curveFn(cur); x.strokeStyle='#E6212F'; x.lineWidth=2.2; x.beginPath();
    for(let i=0;i<=120;i++){const u=i/120,p=cToPx(g,u,f(u));i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);} x.stroke();
    ptsOf(cur).forEach(q=>{const p=cToPx(g,q[0],q[1]);x.fillStyle='#fff';x.strokeStyle='#E6212F';x.lineWidth=2;x.beginPath();x.arc(p[0],p[1],4,0,7);x.fill();x.stroke();});
    el.querySelector('.cv-val').textContent=`${ptsOf(cur).length} points · click the graph or “Big editor” to edit`;
    $$('[data-cp]',el).forEach(b=>b.classList.remove('on')); return;
  }
  // handles
  const P0=cToPx(g,0,0),P3=cToPx(g,1,1),P1=cToPx(g,cur[0],cur[1]),P2=cToPx(g,cur[2],cur[3]);
  x.strokeStyle='rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(P0[0],P0[1]); x.lineTo(P1[0],P1[1]); x.moveTo(P3[0],P3[1]); x.lineTo(P2[0],P2[1]); x.stroke();
  // curve
  x.strokeStyle='#E6212F'; x.lineWidth=2.2; x.beginPath(); x.moveTo(P0[0],P0[1]); x.bezierCurveTo(P1[0],P1[1],P2[0],P2[1],P3[0],P3[1]); x.stroke();
  // speed dots (equal time steps) — closer dots = slower
  const f=curveFn(cur); x.fillStyle='rgba(255,255,255,.55)';
  for(let i=0;i<=16;i++){const u=i/16,p=cToPx(g,u,f(u));x.beginPath();x.arc(p[0],p[1],1.4,0,7);x.fill();}
  [P1,P2].forEach(p=>{x.fillStyle='#fff';x.strokeStyle='#E6212F';x.lineWidth=2;x.beginPath();x.arc(p[0],p[1],5,0,7);x.fill();x.stroke();});
  el.querySelector('.cv-val').textContent=`cubic-bezier(${cur.map(v=>+(+v).toFixed(2)).join(', ')}) · drag the dots · ⇧ keeps a handle's angle`;
  const pr=el._presets||CURVE_PRESETS;
  $$('[data-cp]',el).forEach(b=>{const pc=pr[+b.dataset.cp][1];b.classList.toggle('on',pc.every((v,i)=>Math.abs(v-cur[i])<1e-3));});
}

/* ------------------------------------------------------------------ grid size over time */
function zTimes(z,P){
  if(z.mode==='frames'){const a=Math.round(+z.f0||0);return [a,Math.max(a+1,Math.round(+z.f1||a+1))];}
  const t=(P.T&&P.groups?(()=>{const sorted=[...new Set(P.T)].sort((x,y)=>x-y);return sorted[clamp(Math.round(z.at)||1,1,sorted.length)-1];})():0)+(+z.off||0);
  return [t,t+Math.max(1,Math.round(z.dur)||1)];
}
function renderZoomList(P){
  const el=$('#zoomList'); if(!el) return;
  const a=document.activeElement; if(a&&el.contains(a)) return;
  const z=D.anim.zoom||[];
  const zc=$('[data-curve="anim.zoomCurve"]'); if(zc){const was=zc.hidden; zc.hidden=!z.filter(x=>x.on!==false).length||D.anim.motion==='stop'||D.anim.zoomOn===false; if(was&&!zc.hidden) setTimeout(()=>drawCurve(zc),0);}
  const nf=(lbl,key,val,min,max,title)=>`<div class="field"><span class="lbl scrub"${title?` title="${title}"`:''}>${lbl}</span><div class="num"><input type="number" data-z="${key}" min="${min}" max="${max}" step="1" value="${val}"></div></div>`;
  el.classList.toggle('zdis',D.anim.zoomOn===false);
  el.innerHTML=z.length?z.map((k,i)=>`<div class="zcard${k.on===false?' off':''}${k.closed?' closed':''}" data-zi="${i}">
      <div class="zhead"><button class="chev" data-ztog="${i}" title="Show / hide settings"><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3h8L5 8z"/></svg></button><b>Change ${i+1}</b><span class="note">${k.rev?`${k.rows} rows → main`:`main → ${k.rows} rows`}</span><label class="switch" title="Turn this change on or off"><input type="checkbox" data-zc="on"${k.on!==false?' checked':''}><span></span></label><button class="btn icon ghost" data-zdel="${i}" title="Delete this change">✕</button></div>
      <div class="field2">${nf('Rows','rows',k.rows,1,200)}<div class="field"><span class="lbl">Timing</span><select data-zs="mode"><option value="step"${k.mode!=='frames'?' selected':''}>At a step</option><option value="frames"${k.mode==='frames'?' selected':''}>Exact frames</option></select></div></div>
      ${k.mode==='frames'
        ?`<div class="field2">${nf('Start fr','f0',k.f0!=null?k.f0:0,-9999,99999,'Frame the change starts on')}${nf('End fr','f1',k.f1!=null?k.f1:24,-9999,99999,'Frame the change is finished by')}</div>`
        :`<div class="field3">${nf('At step','at',k.at,1,Math.max(1,P.groups),'Starts when this block appears')}${nf('Offset','off',k.off||0,-9999,9999,'Frames before (−) or after (+) that block')}${nf('Length','dur',k.dur,1,2000,'Frames the change takes')}</div>`}
      <div class="note">Runs f${zTimes(k,P)[0]} → f${zTimes(k,P)[1]}</div>
      <label class="check"><input type="checkbox" data-zc="rev"${k.rev?' checked':''}> Reverse: start at ${k.rows} rows and go to the main size</label>
      <div class="lbl" style="margin-top:2px">Position <span class="note">(shift the frame, % of comp)</span></div>
      <div class="field2">${nf('Start X','sx',k.sx||0,-200,200,'Horizontal shift when this change starts')}${nf('Start Y','sy',k.sy||0,-200,200,'Vertical shift when this change starts')}</div>
      <div class="field2">${nf('End X','ex',k.ex||0,-200,200,'Horizontal shift when this change ends')}${nf('End Y','ey',k.ey||0,-200,200,'Vertical shift when this change ends')}</div>
    </div>`).join('')
    :'<div class="note">None yet. Add one to zoom the grid in or out as the blocks build. More rows means smaller squares and more of the grid on screen.</div>';
}
$('#btnAddZoom').onclick=()=>{
  pushHist(true); const G=geom(), P=plan(G), z=D.anim.zoom||(D.anim.zoom=[]);
  const last=z.length?z[z.length-1]:null;
  z.push({at:Math.min(Math.max(1,P.groups),last?last.at+6:Math.max(2,Math.round(P.groups/2))),on:true,closed:false,rows:last?last.rows*2:G.R*2,dur:24,off:0,mode:'step',f0:0,f1:24,rev:false,sx:0,sy:0,ex:0,ey:0});
  $('#zoomList').innerHTML=''; refresh();
};
$('#zoomList').addEventListener('click',e=>{
  const t=e.target.closest('[data-ztog]');
  if(t){const z=D.anim.zoom[+t.dataset.ztog];z.closed=!z.closed;t.blur();$('#zoomList').innerHTML='';renderZoomList(plan(geom()));return;}
  const b=e.target.closest('[data-zdel]'); if(!b) return;
  pushHist(true); D.anim.zoom.splice(+b.dataset.zdel,1); b.blur(); planCache.k='';
  $('#zoomList').innerHTML=''; refresh(); toast('Grid change removed','',true);
});
$('#zoomList').addEventListener('input',e=>{
  const t=e.target, row=t.closest('[data-zi]'); if(!row||!t.dataset.z) return;
  const v=parseFloat(t.value); if(isNaN(v)) return;
  if(U.editing!==t){pushHist(true);U.editing=t;}
  const key=t.dataset.z; D.anim.zoom[+row.dataset.zi][key]=/^(sx|sy|ex|ey)$/.test(key)?clamp(Math.round(v),-200,200):/^(off|f0|f1)$/.test(key)?Math.round(v):Math.max(1,Math.round(v));
  planCache.k=''; render(); const P=plan(geom()); $('#animReadout') && refreshReadoutOnly(P);
});
$('#zoomList').addEventListener('change',e=>{
  U.editing=null;
  const t=e.target, row=t.closest('[data-zi]');
  if(row&&t.dataset.zc){pushHist(true);D.anim.zoom[+row.dataset.zi][t.dataset.zc]=t.checked;planCache.k='';t.blur();$('#zoomList').innerHTML='';refresh();}
  if(row&&t.dataset.zs){
    pushHist(true); const z=D.anim.zoom[+row.dataset.zi], P=plan(geom());
    if(t.value==='frames'&&z.mode!=='frames'){const tt=zTimes(z,P);z.f0=tt[0];z.f1=tt[1];}
    if(t.value==='step'&&z.mode==='frames'){z.off=0;z.dur=Math.max(1,(z.f1||0)-(z.f0||0));}
    z.mode=t.value; planCache.k=''; $('#zoomList').innerHTML=''; refresh();
  }
});
function refreshReadoutOnly(){ const a=document.activeElement; refresh(); if(a&&a.isConnected) a.focus(); }

/* ------------------------------------------------------------------ per-section reset */
const NO_RESET=['comp.w','comp.h','comp.follow','comp.fps'];
function defOf(path){return path.split('.').reduce((o,k)=>o==null?o:o[k],DEF);}
function sectionPaths(group){
  const set=new Set();
  $$('[data-bind],[data-seg],[data-curve],[data-pal]',group).forEach(el=>{const p=el.dataset.bind||el.dataset.seg||el.dataset.curve||el.dataset.pal;if(p&&NO_RESET.indexOf(p)<0&&defOf(p)!==undefined)set.add(p);});
  // shortcut copies of grid controls inside Animate › Order shouldn't reset the grid
  if(group.closest('[data-pane="animate"]')) [...set].forEach(p=>{if(p.indexOf('grid.')===0)set.delete(p);});
  if(group.querySelector('#fontFam')) ['text.family','text.style','text.font'].forEach(p=>set.add(p));
  if(group.querySelector('#zoomList')) set.add('anim.zoom');
  if(group.querySelector('#paletteEdit')) set.add('palette');
  if(group.querySelector('#btnPickEnd')) set.add('anim.endRow');
  return [...set];
}
function addCollapse(){
  $$('#left .group').forEach((g,i)=>{
    const h=g.querySelector(':scope > .group-h'); if(!h||h.querySelector('.colbtn')) return;
    const pane=g.closest('[data-pane]'), key=(pane?pane.dataset.pane:'')+':'+String((h.childNodes[0]&&h.childNodes[0].textContent.trim())||h.textContent||i).trim().slice(0,40);
    g.dataset.ckey=key;
    h.insertAdjacentHTML('afterbegin','<button class="colbtn" title="Show / hide this section"><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3h8L5 8z"/></svg></button>');
    if(U.collapsed&&U.collapsed[key]) g.classList.add('collapsed');
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('#left .colbtn'); if(!b) return;
  const g=b.closest('.group'); g.classList.toggle('collapsed');
  U.collapsed=U.collapsed||{}; U.collapsed[g.dataset.ckey]=g.classList.contains('collapsed'); savePrefs();
  if(!g.classList.contains('collapsed')) renderCurves();
});
function addResets(){
  $$('#left .group').forEach(g=>{
    const h=g.querySelector(':scope > .group-h'); if(!h||h.querySelector('[data-reset]')||g.querySelector('#btnResetAnim')||g.querySelector('#btnPalReset')) return;
    if(!sectionPaths(g).length) return;
    h.insertAdjacentHTML('beforeend',`<button class="btn ghost secreset" data-reset="1" title="Reset this section to its defaults (⌘Z to undo)">↺ Reset</button>`);
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-reset]'); if(!b) return;
  const g=b.closest('.group'), paths=sectionPaths(g); if(!paths.length) return;
  pushHist(true);
  paths.forEach(p=>setP(p,clone(defOf(p))));
  planCache.k='';
  syncInputs(true); syncPalettes(); renderFontUI();
  if(paths.some(p=>p.indexOf('grid.')===0||p==='comp.fps')&&V.fit) fitView(V.fit);
  if(paths.some(p=>p.indexOf('rand.')===0)&&U.live){generate(true);}
  else if(paths.some(p=>p.indexOf('block.')===0)&&D.block.sync&&D.blocks.length){resizeAllQuiet();refresh();}
  else refresh();
  const name=(g.querySelector('.group-h').childNodes[0]||{}).textContent||'Section';
  toast(`${name.trim()} reset to defaults`,'',true);
});

/* ------------------------------------------------------------------ help tips */
const HELP={
  'comp.follow':'When on, the grid always matches the size and frame rate of the comp that is open in After Effects.',
  'comp.w':'Composition width in pixels.','comp.h':'Composition height in pixels.',
  'comp.fps':'Frame rate used for timing the animation and for any new comp.',
  'grid.rows':'How many rows of squares fit the comp height. Square size = height ÷ rows (minus gutters and margins).',
  'grid.gutter':'Gap between squares in pixels. Grid lines sit inside these gaps.',
  'grid.margin':'Space above and below the grid.',
  'grid.colsMode':'<b>Bleed</b> fills the whole width so squares run off both sides. <b>Fit</b> keeps only whole squares. <b>Custom</b> lets you set the count.',
  'grid.cols':'Number of columns when Columns is set to Custom.',
  'grid.offsetX':'Slide the whole grid left or right.',
  'grid.snap':'Rounds square size and position to whole pixels so edges stay sharp.',
  'grid.overX':'Extra columns beyond each side of the frame, so blocks can sit off screen and slide in.',
  'grid.overY':'Extra rows above and below the frame.',
  'look.bgOn':'Adds a solid background layer.','look.bg':'Background colour.',
  'look.linesOn':'One shape layer of lines drawn in the gutters.','look.line':'Grid line colour.',
  'look.lineW':'Line thickness in pixels. It stays the same on screen even when the grid zooms.',
  'look.border':'Also draw lines around the outside of the grid (useful with a margin).',
  'look.cellsMode':'Builds the squares themselves as shape layers: all in one layer, or one layer per square.',
  'look.cell':'Square tile colour.',
  'block.w':'Block width in squares.','block.h':'Block height in squares.',
  'block.color':'Colour for new blocks.','block.color2':'Colour for echo-trail blocks.',
  'block.sync':'When on, changing the size or colour here updates the blocks already on the canvas.',
  'rand.pattern':'<b>Stairs</b> step diagonally. <b>Scatter</b> places blocks in random rows, left to right. <b>Row</b> keeps them on one row.',
  'rand.count':'How many blocks to make. 0 = as many as fit across the frame.',
  'rand.gap':'Empty columns between blocks. Leave at 0 so each block connects to the next.','rand.rise':'Rows climbed (or dropped) per step.',
  'rand.gapMin':'Smallest number of empty columns between blocks.','rand.gapMax':'Largest number of empty columns between blocks.',
  'rand.startRow':'Row the pattern starts on. 0 = random.',
  'rand.bleed':'Let blocks sit on the half-visible columns at the left and right edges.',
  'rand.echo':'Adds an offset copy of each block in the second colour, like a shadow or trail.',
  'rand.echoDX':'Columns to shift the echo.','rand.echoDY':'Rows to shift the echo.','rand.echoLast':'Only echo the last N blocks. 0 = all.',
  'rand.mode':'<b>Replace</b> clears existing blocks first. <b>Add</b> keeps them and fills around them.',
  'text.size':'Default font size for new text.','text.align':'Where text sits inside the block.','text.pad':'Space between the text and the block edge.',
  'anim.mode':'<b>Reveal</b>: blocks appear, view still. <b>Camera</b>: the view glides along with new blocks. <b>Conveyor</b>: grid stays still while blocks slide through the centre.',
  'anim.extendOn':'Keeps building past your layout using the same pattern. Extra blocks show as dashed outlines until you play.',
  'anim.extendMode':'<b>Repeat</b> copies your whole layout again and again to the right. <b>Continue</b> keeps taking the same step as your last two blocks.',
  'anim.extendN':'How many extra blocks to add.','anim.extendFill':'Ignore the count and keep adding blocks until the comp ends.',
  'anim.wrap':'When stairs climb off the top, start again from the bottom row.',
  'anim.order':'The order blocks appear in. The camera always follows the block furthest along. R→L builds and extends to the left. Manual: pick exactly which blocks animate, in your order.',
  'anim.groupCol':'Blocks that start in the same column appear at the same moment (e.g. a block and its echo).',
  'anim.start':'Frame the first block appears on.','anim.interval':'Frames between one step and the next.',
  'anim.trans':'How many frames each block takes to appear.',
  'anim.ramp':'Changes the pace across the whole animation. Speed up starts slow and gets faster. Slow down does the opposite. Fast middle is quick in the middle.',
  'anim.rampAmt':'How much faster the fastest part is than the slowest.',
  'anim.motion':'<b>Smooth</b>: one continuous glide. <b>Step &amp; settle</b>: the view eases to a stop at each block. <b>Stop-motion</b>: everything jumps in whole frames and whole squares.',
  'anim.ease':'How gentle the starts and stops are.','anim.stepEvery':'In stop-motion, how many frames each pose holds (2 = “on twos”).',
  'anim.appear':'How each block comes on: cut, fade, wipe from the left, or scale up.',
  'anim.axis':'Follow blocks sideways only, or up and down too.',
  'anim.smooth':'How many blocks the camera trails behind the newest one (at least 1, so it never moves ahead of what has appeared). Larger = calmer, floatier camera.',
  'anim.motionBlurF':'Softens changes in camera speed (in frames). Higher = rounder, smoother acceleration; 0 = follows the pace exactly.',
  'anim.revealWhen':'Ahead of the camera: blocks appear on their schedule and the camera follows them in (they can pop in off to the side or off screen). When the camera arrives: each block waits until the camera has carried it into the reveal zone, so you always see it appear.',
  'anim.revealX':'Width of the reveal zone, centred in the frame. A block appears once its centre is inside. 50% = only at the centre line, 100% = anywhere on screen.',
  'anim.revealY':'Height of the reveal zone (when the camera also follows up/down).',
  'anim.relOn':'The camera follows for the first part of the scene, then stops chasing and coasts to a halt (keeping its speed and letting it bleed away), while new blocks keep arriving and run off the edge of frame. Great for overlays that “keep going”.',
  'anim.relAt':'Where in the scene the camera lets go, as % of the scene length.',
  'anim.relSlow':'How many frames the camera takes to coast to a stop after letting go. Longer = more drift.',
  'exit.mode':'After a hold: every block leaves a fixed time after it appeared, so a trail of blocks travels with the camera. Walk off: once the build is complete it holds, then leaves block by block in the same order and rhythm it arrived — the line walks off. Behind the camera: a block leaves once it has slid past the exit line. All at the end: the whole build clears out, one block after another.',
  'exit.hold':'How long a block stays fully visible before it starts to leave.',
  'exit.line':'Blocks leave when their right edge passes this line. 0 = left edge of frame, negative = once fully off screen.',
  'exit.at':'When the clear-out starts, in frames relative to the scene end. Negative starts before the scene ends.',
  'exit.walkLen':'How long the camera travels with the walking line before it lets go. After that the line, with its short trail, carries on and walks off the edge of frame.',
  'exit.walkFollow':'How much of the walk-off the camera follows before it lets go and the line runs off screen. 100% = follows to the end.',
  'exit.trail':'How many blocks stay visible behind the head of the line as it walks off.',
  'look.ruleParallax':'How fast the column rules move with the camera. 100% = locked to the grid. Lower = they drift slower, like a layer further back; higher = faster, like a layer in front. Camera follow only.',
  'look.ruleEnd':'Column rules stay for the whole piece, or fade off when the walk-off starts (or after the scene if there is no walk-off).',
  'look.ruleFadeAt':'Frames after the walk-off starts (negative = before) when the rules begin to fade.',
  'look.ruleFadeLen':'How long the rules take to fade off.',
  'exit.walkHold':'How long the finished build holds before the first block walks off.',
  'exit.walkPace':'Rhythm of the walk-off compared with the walk-on. 1 = same rhythm, 0.5 = twice as fast, 2 = half speed.',
  'exit.slide':'How far a block slides as it leaves, in block widths.',
  'exit.stagger':'Frames between one block leaving and the next.',
  'exit.style':'How a block disappears. Wipe collapses it sideways; the other options match the reveal styles.',
  'exit.dir':'Onward collapses toward the direction of travel (keeps the momentum); Back collapses toward where it came from.',
  'exit.len':'How long each exit takes.',
  'exit.content':'The text, dots and icons on a block finish leaving by the time the block does (using the content “goes off” style, or a fade if content normally stays).',
  'exit.echo':'Echo copies leave with their block.',
  'num.on':'Adds a number layer to every block, right-aligned in its top-right corner (its own text layer in AE, parented to the block). Auto-fill content keeps clear of it.',
  'num.fmt':'How the number is written. #4,812,337 reads like a block height — set Start at to a big number.',
  'num.start':'The number of the first block in the reveal order.',
  'num.size':'Number size in pixels (uses the content font).',
  'num.opacity':'Number opacity.',
  'fill.dotSize':'Dot diameter in pixels (dot grids inside blocks and in the gaps).',
  'fill.dotShape':'Round dots or square pixels.',
  'fill.mods.icons':'Line icons from the icon set below (nodes, blocks, chains, momentum chevrons, peaks, snowflakes…), placed in open space like the logo.',
  'fill.anim.live':'While content is fully on, keep it moving a little — numbers tick, hashes re-scramble, letters glitch — so the HUD feels live. Built as Source Text expressions in AE.',
  'fill.anim.liveTick':'Counters drift after counting up: block heights keep climbing, percentages wobble by a point or two, other values jitter slightly.',
  'fill.anim.liveHash':'Hex characters keep re-scrambling for as long as the text holds.',
  'fill.anim.liveGlitch':'Now and then a character flips to a glyph (#%&*/<>[]=+01) for one update.',
  'fill.anim.liveRate':'How many times per second the live text updates.',
  'fill.anim.glitchAmt':'Chance a line glitches on each update.',
  'anim.camMove':'Follow the easing: the camera travels the line at exactly the pace of the Scene easing curve — a fast-start curve starts fast, a slow-end curve glides to a stop. Glide behind: the camera trails the newest block and reacts to it, so it always eases in gently. Step & settle: hops from block to block.',
  'anim.settle':'Frames the camera takes to glide to a complete stop at the end of the scene (never less than about 4× Smoothness). The last reveals are spaced to leave room for it, so nothing gets rushed.',
  'anim.lazy':'The camera holds still until the newest block reaches the middle of the frame.',
  'anim.snap':'The camera aims at whole-square positions so the grid stays aligned with the frame.',
  'out.replace':'Delete the layers from your last build before building again.',
  'out.lock':'Lock the background, lines and tiles so you don’t move them by accident.',
  'out.fitDur':'If the animation is longer than the comp, make the comp longer.',
  'out.preGrid':'Puts the tiles, grid lines and column rules (and their wrap helper) in one “GB · Grid” precomp. With the AE camera it is collapsed + 3D, so the main camera still moves it.',
  'out.preBlocks':'Puts every block, its text and content, echoes and gap content in one “GB · Blocks” precomp. Open it to tweak a block; the main comp stays short.',
  'out.preTrans':'Each transition (in / out) becomes its own precomp instead of dozens of tiles in your comp. Matte transitions are always precomps.',
  'out.folder':'Files the precomps and the background solid under Grid Blocks › your comp name in the Project panel. Rebuilding cleans up the old ones.',
  'out.shy':'Marks the wrap and framing helper nulls as shy and turns on “hide shy layers”, so the timeline shows only what you animate.',
  'out.trim':'Starts each block, echo and content layer (and transition precomp) where it first appears, so the timeline reads as a staircase.',
  'out.markers':'Adds comp markers for the scene start/end and each transition, named “GB · …”. Rebuilding replaces them.',
  'out.mb':'Turns on motion blur for the comp and every moving Grid Blocks layer, so fast camera moves read as smooth streaks instead of strobing. Strongly recommended for camera follow.',
  'out.mbAngle':'How long the virtual shutter stays open. 180° looks natural; 90° is crisper; 270–360° gives long, dreamy streaks.',
  'anim.startF':'Frame the scene starts on. Use a negative number to start the comp part-way through: blocks that would already be on screen are there at frame 0, and the camera is already moving.',
  'anim.lenF':'Total length of the scene in frames, from the first block to the camera coming to rest. Nothing moves after this. With “Fill the length” a shorter scene simply has fewer blocks.',
  'anim.toEnd':'Stretch the scene so it ends exactly when the comp ends.',
  'anim.total':'Exact number of blocks in the scene. If it is more than your layout, the pattern keeps building to make up the rest.',
  'anim.countMode':'<b>Fill the length</b>: the scene makes as many blocks as fit its length at the pace below, so a shorter scene simply has fewer blocks. <b>Exact number</b>: you pick the count and they are squeezed or spread to fit.',
  'anim.pace':'On average, one new block every this many frames. The scene easing then speeds up or slows down parts of the scene around this average.',
  'anim.zoomOn':'Turns every grid size change on or off at once without deleting them.',
  'anim.zoomCurve':'Easing for every grid size change (and its start/end positioning). Hold Shift or ⌘ while dragging to snap the handles.',
  'anim.sceneCurve':'Re-times the whole scene at once: block arrivals, how fast each block wipes/fades on, the camera, and grid changes. Flat parts = slow, steep parts = fast. Everything still ends when the scene ends. Content inside blocks (future video or images) is never re-timed.',
  'anim.endX':'Where the last block’s centre sits across the frame when the animation ends. 0 = left edge, 50 = centre, 100 = right edge. Negative values push it off the left, above 100 off the right (−200 to 300). Drag the label to scrub; Shift = ×10.',
  'anim.endY':'Where the last block’s centre sits vertically (0 = top, 100 = bottom, outside that = off screen). Only used when the camera follows up and down too.',
  'anim.finalMove':'How long the final camera move takes, in frames. Uses the Move easing curve.',
  'look.rulesOn':'Adds vertical lines on the column breaks, as their own shape layer.',
  'look.rule':'Rule colour.','look.ruleW':'Rule thickness in pixels.',
  'look.ruleEvery':'1 = a rule at every column break, 2 = every other one (skip 1), 3 = skip 2, and so on.',
  'look.ruleStart':'The column whose left edge gets the first rule. The pattern repeats both ways from there.',
  'look.ruleLayer':'Draw rules above the blocks or tucked underneath them.',
  'echo.on':'Adds a styled copy behind each block, offset by Shift X / Y. It can overlap its block (e.g. Shift X −1) and never takes up grid squares.',
  'echo.dx':'Columns to shift the echo (negative = left).','echo.dy':'Rows to shift the echo (negative = up).','echo.last':'Only echo the last N blocks. 0 = all.',
  'echo.opacity':'Overall opacity of the echo.','echo.fill':'Fill the echo with a colour.','echo.color':'Echo fill colour.',
  'echo.stroke':'Draw an outline around the echo.','echo.scolor':'Outline colour.','echo.sw':'Outline thickness in pixels.',
  'echo.align':'Where the outline sits: inside the block edge, centred on it, or outside it.',
  'echo.dash':'Dashed outline.','echo.dashL':'Dash length in pixels.','echo.dashG':'Gap between dashes in pixels.',
  'echo.timing':'<b>Leads</b>: the echo appears first and the block follows. <b>Trails</b>: the block appears first and the echo follows. Set by how many frames below.',
  'echo.offset':'Frames between the echo and its block.','echo.appear':'How the echo comes on.',
  'echo.out':'Whether the echo stays, fades away or disappears after it has been on screen for the hold time.',
  'echo.hold':'Frames the echo stays fully on before it goes.','echo.outF':'Frames the fade-out takes.',
  'echo.content':'Marks echoes as places that can hold images or video once that feature arrives (saved in the layer comment).',
  'rand.multiCol':'When on, a column can hold a second block (a pair) above or below the main one. Turn off for strictly one block per column.',
  'rand.stairPct':'Chance the walk breaks into a short staircase (2–4 steps climbing or dropping).',
  'rand.jumpPct':'Chance the walk hops a full block height up or down. Blocks still touch at a corner.',
  'anim.endRow':'Row the very last block lands on. The column is set by the grid and block count so spacing stays even.',
  'anim.unpicked':'In manual order, blocks you didn’t click can stay hidden or remain visible the whole time.',
  'fill.on':'Fills each block with a small HUD layout: blockchain text, numbers and patterns in its corners. Built as real text and shape layers in After Effects.',
  'fill.mods.kv':'Key / value pairs like gasUsed, baseFee, nonce.','fill.mods.status':'Status lines like STATUS: FINALIZED, NETWORK: MAINNET.',
  'fill.mods.hashes':'Two columns of “TO” / “FROM” hex, like a transaction.','fill.mods.block':'BLOCK #70,075,438 | 91 TXNS | 1319 MS — the number counts up.',
  'fill.mods.log':'Timestamped node log lines.','fill.mods.counter':'A label with a number that counts up (TPS, %, TVL…).',
  'fill.mods.dev':'Dev status text like INITIALIZING / BLASTING OFF with animated ellipses.','fill.mods.barcode':'Bars ||||| or dotted leaders ……|',
  'fill.mods.phrase':'Taglines and terminal tags, e.g. ****** STRAP IN ****** or [FINALIZED].','fill.mods.term':'Avalanche terms and endpoints.',
  'fill.mods.dots':'A grid of small dots (shape repeater in AE).','fill.mods.ring':'A small ring icon.',
  'fill.textPct':'Share of blocks that get text. The rest are left plain, or filled with a dot field if patterns are on.',
  'fill.density':'How many corners of each block get content.','fill.patternPct':'Chance a block gets a dot field, filling all the space the text and icon don’t use.',
  'fill.size':'Text size in pixels.','fill.leading':'Line spacing as % of the text size.','fill.dotSpacing':'Distance between dots in pixels.',
  'fill.caps':'Show content in capitals or as written.','fill.textColor':'Text colour on solid blocks.',
  'fill.outlinePct':'Share of blocks drawn as outlines (stroke only) with coloured text, like the reference.','fill.outlineW':'Outline thickness.',
  'fill.skipText':'Blocks where you typed your own text are left alone.',
  'fill.anim.inMode':'How content comes on once its block has appeared: types on letter by letter, fades in, or just cuts on.','fill.anim.typeAll':'Type on every line, not just logs, tags and dev text (others cut on).',
  'fill.anim.inDur':'Frames the fade-in takes.','fill.anim.outMode':'What happens after the hold: content stays, fades out, types off (deletes letter by letter) or cuts off.',
  'fill.anim.hold':'Frames content stays fully on before it goes.','fill.anim.outDur':'Frames the fade-out or type-off takes.',
  'fill.mods.logo':'The Avalanche logo, placed in open space (shape layer in AE).','fill.gap.mods.logo':'The Avalanche logo in empty grid areas.',
  'fill.iconPct':'Chance a block gets a ring or logo icon.','fill.iconSize':'Icon size in pixels.',
  'fill.anim.cps':'Typing speed in characters per second.','fill.anim.ellipsis':'Dev text gets a looping … after it.',
  'fill.anim.count':'Numbers count up from zero (or a lower block number) to their value.','fill.anim.countDur':'How long counting takes.',
  'fill.anim.scramble':'Hex hashes flicker through random characters.','fill.anim.scrMode':'Settle on the real value, or keep changing forever.',
  'fill.anim.scrRate':'Changes per second.','fill.anim.scrDur':'How long the scramble lasts before settling.',
  'fill.anim.delay':'Frames after a block has appeared before its content starts.','fill.anim.stagger':'Frames between each item in the same block.',
  'fill.gap.on':'Adds content in empty grid areas between blocks, appearing as the nearby blocks do.',
  'fill.gap.mods.log':'Timestamped log lines.','fill.gap.mods.phrase':'Taglines and terminal tags.','fill.gap.mods.barcode':'Bars and dotted leaders.',
  'fill.gap.mods.hashes':'TO / FROM hash columns.','fill.gap.mods.dots':'Dot fields.','fill.gap.amount':'Roughly how many items per 10 columns.','fill.gap.color':'Colour of the gap content.',
  'trans.in.on':'Blocks fill the frame at the start of the comp and clear away to reveal the scene.','trans.out.on':'Blocks build up to cover the frame at the end.',
  'trans.in.mode':'Clear away: start covered, blocks disappear. Build up: blocks appear until the frame is covered.','trans.out.mode':'Clear away: start covered, blocks disappear. Build up: blocks appear until the frame is covered.',
  'trans.in.start':'Frame the transition starts on.','trans.out.start':'Frame the transition starts on.','trans.out.atEnd':'Time it so the frame is fully covered on the last frame of the comp.',
  'trans.in.dur':'Frames from the first block to the last.','trans.out.dur':'Frames from the first block to the last.',
  'trans.in.len':'Frames each block takes to appear or go.','trans.out.len':'Frames each block takes to appear or go.',
  'trans.in.pattern':'The order blocks go in: by column, diagonally, by row, from the centre out, or randomly.','trans.out.pattern':'The order blocks go in: by column, diagonally, by row, from the centre out, or randomly.',
  'trans.in.dir':'Reverse flips the order (e.g. right to left).','trans.out.dir':'Reverse flips the order (e.g. right to left).',
  'trans.in.appear':'How each block appears or goes.','trans.out.appear':'How each block appears or goes.',
  'trans.in.w':'Transition block width in cells. 0 = same as your blocks.','trans.out.w':'Transition block width in cells. 0 = same as your blocks.',
  'trans.in.h':'Transition block height in cells. 0 = same as your blocks.','trans.out.h':'Transition block height in cells. 0 = same as your blocks.',
  'trans.in.cover':'Grow blocks over the gutters so the frame is solid when covered (good for mattes).','trans.out.cover':'Grow blocks over the gutters so the frame is solid when covered (good for mattes).',
  'trans.in.output':'Blocks in the comp: coloured layers on top. Matte precomp: white blocks inside their own precomp, ready to use as a track matte.','trans.out.output':'Blocks in the comp: coloured layers on top. Matte precomp: white blocks inside their own precomp, ready to use as a track matte.',
  'trans.in.color':'Block colour (matte precomps are always white).','trans.out.color':'Block colour (matte precomps are always white).',
  'trans.in.curve':'Shapes the pace of the transition.','trans.out.curve':'Shapes the pace of the transition.',
  'out.rig':'<b>After Effects camera</b>: adds a real one-node camera and makes the grid and blocks 3D, so you can keep animating the camera yourself. <b>2D null rig</b>: keeps everything 2D and moves a null instead.',
  'block.mix':'How new blocks are coloured: all main colour, alternating main and second, or a random mix.',
  'block.mixPct':'In a random mix, roughly what share of blocks use the second colour.',
  'rand.wander':'How many rows a block can move up or down from the previous one (never more than one block height, so neighbours always touch at least at a corner). 0 keeps them on one row.',
  'rand.climb':'Tilts the walk. Positive values drift upward, negative drift downward, 0 is balanced.',
  'rand.stackPct':'Chance that a column gets a second block above or below, so two blocks share the column.',
  'rand.stackGap':'Rows between the two blocks in a pair. Empty (auto) = the same as the block height, so the gap is one block tall.',
  'text.kern':'Kerning between letter pairs: the font’s own metrics, Optical (spacing judged by shape), or none.',
  'text.caps':'Show text as typed, in capitals, or in lowercase.',
  'text.leading':'Space between lines in pixels. 0 = automatic.',
  'text.tracking':'Even spacing between all letters, in thousandths of an em (same units as After Effects).',
  'anim.ending':'<b>After a number of blocks</b>: set the total under Scene. <b>On a chosen spot</b>: the pattern steers so its last block lands on a square you pick, and the camera frames it where you choose.',
  'anim.camCurve':'Easing for each camera move in Step &amp; settle and for the final move to the end row. Dots close together = slow, far apart = fast. Hold Shift or ⌘ while dragging to snap the handle to 0°, 45° or 90°.',
  'anim.revCurve':'Shapes how each individual block wipes, fades or scales on. Independent of scene pacing.'
};
const HELP_ID={
  btnResetAnim:'Puts every animation setting back to its default. ⌘Z brings your settings back.',
  btnFillShuffle:'New random content for every block.',btnGapShuffle:'New random placement for the gap content.',
  btnRecolour:'Re-applies the colour mix to every block (echo blocks keep their colour).',btnPickEnd:'Click, then click a square on the canvas. The pattern will steer so its final block lands there.',
  btnGen:'Make a layout from the rules above. Press G anytime.',btnShuffle:'Same rules, new random layout. Press R.',
  btnResizeAll:'Set every existing block to the size above. Blocks without room keep their size.',
  btnBake:'Turns the dashed extra blocks into normal blocks so you can edit them.',
  btnAddZoom:'Change how many rows the grid has partway through. The camera zooms, so more rows means smaller squares and more grid on screen.',
  btnNumber:'Puts 01, 02, 03… in each block in order.',btnApplyStyle:'Copies the default text style to every block.',
  btnExportJsx:'Saves a script that rebuilds this exact layout on any machine.',btnRemoveAE:'Deletes every Grid Blocks layer from the active comp.'
};
function qm(t){return `<span class="qm" data-help="${t.replace(/"/g,'&quot;')}">?</span>`;}
function addHelp(){
  const done=new Set();
  $$('[data-bind],[data-seg]').forEach(el=>{
    const p=el.dataset.bind||el.dataset.seg, t=HELP[p]; if(!t||done.has(p)) return;
    let target=null;
    const f=el.closest('.field'), ck=el.closest('label.check'), ly=el.closest('.layer');
    if(ck) target=ck;
    else if(f&&f.querySelector('.lbl')) target=f.querySelector('.lbl');
    else if(ly&&ly.querySelector('.ln')) target=ly.querySelector('.ln');
    else { const g=el.closest('.group'); target=g&&g.querySelector('.group-h'); }
    if(!target||target.querySelector('.qm')) return;
    target.insertAdjacentHTML('beforeend',qm(t)); done.add(p);
  });
  $$('[data-curve]').forEach(el=>{const t=HELP[el.dataset.curve];const l=el.querySelector('.lbl');if(t&&l&&!l.querySelector('.qm'))l.insertAdjacentHTML('beforeend',qm(t));});
  const ff=$('#fontFam'), fh=ff&&ff.closest('.group')&&ff.closest('.group').querySelector('.group-h'); if(fh&&!fh.querySelector('.qm')) fh.insertAdjacentHTML('beforeend',qm('Pick any installed font. In After Effects 2024 or newer the list shows every font on your computer. You can also type a family name.'));
  Object.keys(HELP_ID).forEach(id=>{const b=$('#'+id);if(b&&b.parentElement&&!b.dataset.helped){b.dataset.helped='1';b.title=HELP_ID[id].replace(/<[^>]+>/g,'');}});
}
const tipEl=$('#tip'); let tipT=0, tipW=0, tipFor=null;
/* one tooltip style everywhere: native title="" tips are moved to data-tip and shown in the styled box (no double tips) */
function showTipFor(q,html){
  tipFor=q; tipEl.innerHTML=html;
  const r=q.getBoundingClientRect(); tipEl.className='tip';
  const w=Math.min(260,innerWidth-16);
  tipEl.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left-20))+'px';
  const below=r.bottom+8; tipEl.style.top=below+'px';
  requestAnimationFrame(()=>{const th=tipEl.offsetHeight;if(below+th>innerHeight-8)tipEl.style.top=(r.top-th-8)+'px';tipEl.className='tip show';});
}
document.addEventListener('mouseover',e=>{
  const q=e.target.closest&&e.target.closest('.qm');
  if(q){ clearTimeout(tipT); clearTimeout(tipW); let p=q.parentElement; while(p&&p!==document.body){ if(p.hasAttribute&&p.hasAttribute('title')){const v=p.getAttribute('title');p.removeAttribute('title');if(v)p.dataset.tip=v;} p=p.parentElement; }
    showTipFor(q,q.dataset.help); return; }
  const el=e.target.closest&&e.target.closest('[title],[data-tip]'); if(!el||el===tipFor) return;
  if(el.hasAttribute('title')){ const v=el.getAttribute('title'); el.removeAttribute('title'); if(v) el.dataset.tip=v; else delete el.dataset.tip; }
  const t=el.dataset.tip; if(!t) return;
  clearTimeout(tipT); clearTimeout(tipW);
  const esc=t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  tipW=setTimeout(()=>{ if(el.isConnected&&el.matches(':hover')) showTipFor(el,esc); },tipEl.classList.contains('show')?60:450);
});
document.addEventListener('mouseout',e=>{const q=e.target.closest&&e.target.closest('.qm,[data-tip]');if(!q)return;if(e.relatedTarget&&q.contains(e.relatedTarget))return;clearTimeout(tipW);tipT=setTimeout(()=>{tipEl.className='tip';tipFor=null;},60);});
document.addEventListener('mousedown',()=>{clearTimeout(tipW);tipEl.className='tip';tipFor=null;},true);
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.qm')){e.preventDefault();e.stopPropagation();}},true);
function setHelp(on){U.help=on;document.body.classList.toggle('nohelp',!on);$('#btnHelp').classList.toggle('on',on);$('#btnHelp').title=on?'Hide the ? help tips':'Show ? help tips next to each setting';}
$('#btnHelp').onclick=()=>{setHelp(!U.help);toast(U.help?'Help tips on: hover any ?':'Help tips hidden');savePrefs();};
function savePrefs(){const pr=JSON.stringify({help:U.help,loop:U.loop,mb:U.mbPrev!==false,adv:!!U.adv,subs:U.subs||{},collapsed:U.collapsed||{}});webSet('prefs',pr);if(inAE)evalHost('GB_writeText("prefs.json",'+jsStr(pr)+')');}

/* ------------------------------------------------------------------ toast */
let tt=0;
function toast(msg,kind,withUndo){
  const t=$('#toast');$('#toastMsg').textContent=msg;t.className='toast show '+(kind||'');
  $('#toastBtn').hidden=!withUndo;
  clearTimeout(tt);tt=setTimeout(()=>t.className='toast',kind==='err'?7000:withUndo?4500:2600);
}
$('#toastBtn').onclick=()=>{undo();$('#toast').className='toast';};

/* ------------------------------------------------------------------ clear menu */
function openMenu(){const m=$('#clearMenu'),b=$('#btnClear').getBoundingClientRect();m.hidden=false;
  $$('[data-ae]',m).forEach(x=>x.hidden=!inAE);
  m.style.top=(b.bottom+6)+'px';m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,b.right-m.offsetWidth))+'px';}
function closeMenu(){$('#clearMenu').hidden=true;}
$('#btnClear').onclick=e=>{e.stopPropagation();$('#clearMenu').hidden?openMenu():closeMenu();};
document.addEventListener('pointerdown',e=>{if(!$('#clearMenu').hidden&&!e.target.closest('#clearMenu')&&!e.target.closest('#btnClear'))closeMenu();});
$('#clearMenu').addEventListener('click',e=>{
  const b=e.target.closest('[data-clear]'); if(!b) return; closeMenu();
  const k=b.dataset.clear;
  if(k==='sel'){U.sel=null;U.selIds=[];refresh();return;}
  if(k==='ae'){removeFromComp();return;}
  pushHist();
  if(k==='blocks'){D.blocks=[];U.selIds=[];}
  else if(k==='text'){D.blocks.forEach(x=>x.text='');}
  else if(k==='order'){D.blocks.forEach(x=>x.mo=0);U.moNext=1;if(D.anim.order==='manual')D.anim.order='ltr';}
  else if(k==='grid'){D.grid=clone(DEF.grid);D.look=clone(DEF.look);}
  else if(k==='anim'){D.anim=clone(DEF.anim);U.t=null;}
  else if(k==='all'){resetDefaults(false);return;}
  else if(k==='example'){loadExample();return;}
  syncInputs(true);syncPalettes();if(V.fit)fitView(V.fit);refresh();
  toast({blocks:'Cleared all blocks',text:'Cleared all text',order:'Cleared manual order',grid:'Grid & look reset',anim:'Animation reset',all:'Started over'}[k],'',true);
});

/* back to the default look (Avalanche brand), keeping the comp size. One undo step. */
function resetDefaults(withHist){
  if(withHist!==false) pushHist();
  const keep={w:D.comp.w,h:D.comp.h,follow:D.comp.follow};
  D=clone(DEF); Object.assign(D.comp,keep);
  D.blocks=D.blocks.map(b=>normBlock(b)); uid=D.blocks.reduce((m,b)=>Math.max(m,b.id),0)+1;
  U.selIds=[];U.sel=null;U.t=null;U.live=false;planCache.k='';
  syncInputs(true);syncPalettes();renderFontUI();goStep(0);if(V.fit)fitView(V.fit);refresh();
  toast('Back to the default look','⌘Z to undo',true);
}
$('#btnDefaults').onclick=()=>resetDefaults();
initDope();
const animSeed=()=>{pushHist();D.anim.seed=(D.anim.seed|0)+1;D.anim.skip=[];if(isGenerated()){D.anim.dt={};D.anim.dx={};D.anim.cutAt=null;U.dopeSel=[];}planCache.k='';refresh();toast(isGenerated()?'New walk':'New continuation of the walk','⌘Z to undo',true);};
$('#btnAnimSeed').onclick=animSeed;
$('#btnUnskip').onclick=()=>{pushHist();D.anim.skip=[];D.anim.cutAt=null;planCache.k='';refresh();};
$('#cvPlay').onclick=()=>{U.playing?stopPlay():play();};
document.addEventListener('click',e=>{const l=e.target.closest('[data-goto]');if(!l)return;e.preventDefault();const g=l.dataset.goto;if(g==='timing'){setCtx(/After the build/.test(l.textContent)?'inout':'scene');return;}const i=STEPS.findIndex(s=>s.id===g);if(i>=0){U.ctx=null;goStep(i);refresh();}});
$('#afterSeg').addEventListener('click',e=>{const b=e.target.closest('[data-after]');if(!b)return;const v=b.dataset.after;pushHist();
  const wasWalk=D.exit.on&&D.exit.mode==='walk'; planCache.k=''; const woBefore=plan(geom()).woN||0;
  if(v==='stay') D.exit.on=false; else Object.assign(D.exit,{on:true,mode:v});
  planCache.k='';syncInputs(true);refresh();});
aiInit();
$('#mediaIn').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(f)loadMediaFile(f);e.target.value='';});
$$('[data-retime]').forEach(b=>b.addEventListener('click',()=>{const m=$('#retimeMenu');if(m)m.hidden=true;retime(+b.dataset.retime);}));
$('#btnRetimeComp').onclick=$('#mRetimeComp').onclick=()=>{$('#retimeMenu').hidden=true;const fps=D.comp.fps||30,tgt=Math.round((D.comp.dur||10)*fps)-Math.max(0,+D.anim.startF||0);if(tgt>1){pushHist(true);D.anim.remapLen=tgt;planCache.k='';syncInputs(true);refresh();toast(`Scene fits the comp: ${(tgt/fps).toFixed(2)}s`,'',true);}};
$('#btnSceneAuto').onclick=()=>{pushHist(true);D.anim.remapLen=0;planCache.k='';syncInputs(true);refresh();};
/* collapsible sub-sections: remember what's open, redraw canvases that were hidden */
U.subs=U.subs||{};
document.addEventListener('toggle',e=>{const d=e.target; if(!d||!d.matches||!d.matches('details.sub')) return;
  U.subs[d.dataset.sub]=d.open; savePrefs(); if(d.open){try{renderCurves();}catch(x){} if(d.querySelector('#speedCv')) drawSpeedGraph();}},true);
function applySubs(){$$('details.sub').forEach(d=>{const v=U.subs[d.dataset.sub]; if(v!=null) d.open=!!v;});}
function loadExample(){
  pushHist(); const keep={w:D.comp.w,h:D.comp.h,follow:D.comp.follow};
  D=merge(clone(DEF),clone(EXAMPLE)); Object.assign(D.comp,keep);
  D.blocks=EXAMPLE.blocks.map(b=>normBlock(clone(b))); uid=D.blocks.reduce((m,b)=>Math.max(m,b.id),0)+1;
  U.selIds=[];U.sel=null;U.t=null;U.live=false;planCache.k='';fillCache.clear();
  syncInputs(true);syncPalettes();renderFontUI();goStep(SI('animate'));if(V.fit)fitView(V.fit);refresh();
  toast('Loaded the Avalanche HUD example','⌘Z to undo',true);
}
/* Essential / All controls */
function setAdv(on){U.adv=!!on;document.body.classList.toggle('simple',!U.adv);$$('#advSeg [data-adv-v]').forEach(b=>b.classList.toggle('on',(b.dataset.advV==='1')===U.adv));try{renderCurves();}catch(e){}}
$('#advSeg').addEventListener('click',e=>{const b=e.target.closest('[data-adv-v]');if(!b)return;setAdv(b.dataset.advV==='1');savePrefs();toast(U.adv?'Showing every control':'Showing the essentials','',true);});
setAdv(false);

/* ------------------------------------------------------------------ library + files */
function libLoad(){
  if(!inAE){try{const a=JSON.parse(webGet('library')||'null');if(Array.isArray(a))U.lib=a;}catch(e){}return Promise.resolve();}
  return evalHost('GB_readText("library.json")').then(s=>{try{const a=JSON.parse(s);if(Array.isArray(a))U.lib=a;}catch(e){}});
}
function libSaveStore(){webSet('library',JSON.stringify(U.lib));if(inAE) evalHost('GB_writeText("library.json",'+jsStr(JSON.stringify(U.lib))+')');}
function openLib(focusName){
  $('#libModal').hidden=false;
  $('#libWhere').textContent=inAE?'Stored on this computer':inWeb?'Saved in this browser. Save to a file to share or back up.':'Kept until you close this tab. Save to a file to keep a copy.';
  renderLib(); if(focusName) setTimeout(()=>$('#libName').focus(),20);
}
function closeLib(){$('#libModal').hidden=true;}
function renderLib(){
  const el=$('#libList');
  if(!U.lib.length){el.innerHTML='<div class="empty-lib">No saved layouts yet.<br>Name this one above and click <b>Save current</b>.</div>';return;}
  el.innerHTML=U.lib.map((x,i)=>`<div class="libitem"><img src="${x.thumb||''}" alt="" data-lload="${i}" title="Load"><div class="meta"><div class="nm">${esc(x.name)}</div><div class="note">${new Date(x.date).toLocaleString()} · ${(x.doc.blocks||[]).length} blocks</div></div>
    <div class="row-btns"><button class="btn primary" data-lload="${i}">Load</button><button class="btn" data-lover="${i}" title="Replace with the current layout">Update</button><button class="btn danger" data-ldel="${i}">Delete</button></div></div>`).join('');
}
$('#libList').addEventListener('click',e=>{
  const t=e.target.closest('[data-lload],[data-ldel],[data-lover]'); if(!t) return;
  if(t.dataset.lload!=null){const x=U.lib[+t.dataset.lload];pushHist();setDoc(clone(x.doc));closeLib();if(V.fit)fitView(V.fit);afterDocChange();toast(`Loaded “${x.name}”`,'ok',true);}
  else if(t.dataset.lover!=null){const i=+t.dataset.lover;U.lib[i]=Object.assign(U.lib[i],{doc:clone(D),thumb:thumb(),date:Date.now()});libSaveStore();renderLib();toast('Layout updated','ok');}
  else{const i=+t.dataset.ldel;if(t.dataset.armed){U.lib.splice(i,1);libSaveStore();renderLib();}else{t.dataset.armed='1';t.textContent='Sure?';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;t.textContent='Delete';}},2500);}}
});
function saveToLib(name){
  name=(name||'').trim()||`Layout ${U.lib.length+1}`;
  U.lib.unshift({id:Date.now(),name,date:Date.now(),thumb:thumb(),doc:clone(D)});
  libSaveStore(); renderLib(); $('#libName').value=''; toast(`Saved “${name}”`,'ok');
}
$('#libSave').onclick=()=>saveToLib($('#libName').value);
$('#libName').addEventListener('keydown',e=>{if(e.key==='Enter')saveToLib(e.target.value);});
$('#libClose').onclick=closeLib;
$('#libModal').addEventListener('pointerdown',e=>{if(e.target.id==='libModal')closeLib();});
$('#btnLib').onclick=()=>openLib(false);
$('#btnSaveLib').onclick=()=>openLib(true);

function exportFile(){
  const json=JSON.stringify({app:'GridBlocks',v:2,doc:D},null,1);
  const name=`GridBlocks_${D.comp.w}x${D.comp.h}.json`;
  if(inAE){evalHost('GB_saveDialog('+jsStr(json)+','+jsStr(name)+')').then(r=>{const p=String(r).split('|');if(p[0]==='OK')toast('Saved to '+p.slice(1).join('|'),'ok');else if(p[0]==='ERR')toast(p.slice(1).join('|'),'err');});}
  else download(name,json,'application/json');
}
/* the layout travels inside every exported .jsx, between these markers */
const LAYOUT_BEGIN='// GRIDBLOCKS_LAYOUT_BEGIN', LAYOUT_END='// GRIDBLOCKS_LAYOUT_END';
function layoutBlock(){return LAYOUT_BEGIN+'\nvar GB_LAYOUT='+JSON.stringify({app:'GridBlocks',v:2,doc:D}).split(LS1).join('\\u2028').split(LS2).join('\\u2029')+';\n'+LAYOUT_END+'\n';}
/* pull the JSON object that starts at position i (respects strings) */
function jsonAt(s,i){
  let depth=0,inStr=false,esc=false;
  for(let k=i;k<s.length;k++){const ch=s[k];
    if(inStr){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inStr=false;continue;}
    if(ch==='"')inStr=true;else if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return s.slice(i,k+1);}}
  return null;
}
const rgbHex=c=>'#'+(c||[0,0,0]).slice(0,3).map(v=>('0'+Math.round(clamp(+v||0,0,1)*255).toString(16)).slice(-2)).join('').toUpperCase();
/* best-effort: rebuild an editable layout from an older .jsx build script (no layout inside) */
function payloadToDoc(d){
  const doc=clone(DEF), mostly=a=>{const m={};a.forEach(x=>m[x]=(m[x]||0)+1);return Object.keys(m).sort((x,y)=>m[y]-m[x])[0];};
  doc.comp.w=d.comp.w; doc.comp.h=d.comp.h; doc.comp.fps=d.fps||doc.comp.fps; doc.comp.dur=d.comp.dur||doc.comp.dur;
  Object.assign(doc.out,{replace:!!d.replace,lock:!!d.lock,fitDur:!!d.fitDur,rig:d.rig||'camera'});
  doc.look.bgOn=!!d.bg; if(d.bg) doc.look.bg=rgbHex(d.bg.color);
  doc.look.linesOn=!!d.lines;
  if(d.lines){doc.look.line=rgbHex(d.lines.color);doc.look.lineW=d.lines.lw||(d.lines.rects&&d.lines.rects[0]?Math.min(d.lines.rects[0][2],d.lines.rects[0][3]):1);}
  const B=d.blocks||[];
  // grid: work out the cell pitch from a block, then rows from the comp height
  if(B.length){const b=B[0], gut=1, p=(b.bh+gut)/b.h; doc.grid.gutter=gut; doc.grid.rows=Math.max(1,Math.round((d.comp.h+gut)/p));}
  const p=B.length?(B[0].bh+1)/B[0].h:154;
  doc.look.rulesOn=!!d.rules;
  if(d.rules){doc.look.rule=rgbHex(d.rules.color);doc.look.ruleW=d.rules.lw||1;doc.look.ruleLayer=d.rules.top?'top':'bottom';doc.look.ruleEvery=Math.max(1,Math.round(d.rules.period/p));}
  doc.look.cellsMode=d.cells?d.cells.mode:'none'; if(d.cells) doc.look.cell=rgbHex(d.cells.color);
  if(B.length){const sz=mostly(B.map(b=>b.w+'x'+b.h)).split('x');doc.block.w=+sz[0];doc.block.h=+sz[1];doc.block.color=rgbHex(B[0].color);}
  let id=1;
  doc.blocks=B.filter(b=>b.order>0||!d.anim).map(b=>({id:id++,c:b.c-1,r:b.r-1,w:b.w,h:b.h,color:rgbHex(b.color),text:(b.text||'').replace(/\r/g,'\n'),
    fontSize:b.fontSize||48,textColor:rgbHex(b.textColor||[1,1,1]),align:b.align||'center',pad:b.pad||24,tracking:b.tracking||0,leading:b.leading||0,kern:b.kern||'metrics',font:b.font||'',mo:0,order:0}));
  // every block from the build is now a real block, so don't keep building on top
  doc.anim.extendOn=false;
  // make the off-screen area big enough to hold every block
  if(doc.blocks.length){
    const C=2*Math.ceil((doc.comp.w+1)/(2*p));
    const maxC=Math.max(...doc.blocks.map(b=>b.c+b.w)), minC=Math.min(...doc.blocks.map(b=>b.c));
    const maxR=Math.max(...doc.blocks.map(b=>b.r+b.h)), minR=Math.min(...doc.blocks.map(b=>b.r));
    doc.grid.overX=Math.max(doc.grid.overX,maxC-C+2,-minC+2);
    doc.grid.overY=Math.max(doc.grid.overY,maxR-doc.grid.rows+1,-minR+1);
  }
  const fills=[].concat(...B.map(b=>b.fill||[])), ft=fills.find(x=>x.kind==='text');
  doc.fill.on=fills.length>0;
  if(ft){doc.fill.size=ft.size;doc.fill.font=ft.font;doc.fill.textColor=rgbHex(ft.color);
    const fam=fontList().find(f=>f.styles.some(st=>st.ps===ft.font)); if(fam){doc.fill.family=fam.family;doc.fill.style=fam.styles.find(st=>st.ps===ft.font).style;}
    const m=(ft.expr||'').match(/gbE\*(\d+(?:\.\d+)?)\+0\.000001\);if\(gbN/); if(m) doc.fill.anim.cps=+m[1];}
  doc.fill.gap.on=!!(d.gaps&&d.gaps.length); if(d.gaps&&d.gaps[0]&&d.gaps[0].color) doc.fill.gap.color=rgbHex(d.gaps[0].color);
  doc.echo.on=!!(d.echoes&&d.echoes.length);
  const A=d.anim;
  if(!A) doc.anim.mode='static';
  else{
    doc.anim.mode=/conveyor/.test(A.label)?'push':/reveal/.test(A.label)?'reveal':'camera';
    const lastCam=(A.camX&&A.camX.length?A.camX:A.cam||[]).slice(-1)[0]; if(lastCam) doc.anim.lenF=Math.max(2,Math.round(lastCam[0]));
    const z=A.zoomPct&&A.zoomPct.length?A.zoomPct:(A.zoom?A.zoom.keys.map(k=>[k[0],k[1][0],k[2],k[3]]):[]);
    doc.anim.zoom=[];
    for(let i=0;i+1<z.length;i+=2){const a=z[i],b=z[i+1],rev=a[1]<b[1],small=rev?a[1]:b[1];
      doc.anim.zoom.push({on:true,closed:false,rows:Math.round(doc.grid.rows*100/Math.max(1,small)),mode:'frames',f0:a[0],f1:b[0],at:1,off:0,dur:b[0]-a[0],rev,sx:0,sy:0,ex:0,ey:0});}
    if(z.length&&z[0][3]) doc.anim.zoomCurve=z[0][3];
    doc.anim.zoomOn=doc.anim.zoom.length>0;
  }
  // transitions
  ['in','out'].forEach(k=>{const T=doc.trans[k]; T.on=false;});
  ((d.trans&&d.trans.groups)||[]).forEach(g=>{
    const T=doc.trans[g.k]; if(!T) return; T.on=true; T.output=g.output;
    const t0s=g.tiles.map(t=>{const K=t.keys||{};const l=(K.rs&&K.rs.length?K.rs:K.op&&K.op.length?K.op:K.sc)||[[0]];return l[0][0];});
    const K0=g.tiles[0].keys||{}, l0=(K0.rs&&K0.rs.length?K0.rs:K0.op&&K0.op.length?K0.op:K0.sc)||[[0],[8]];
    T.len=Math.max(1,(l0[1]?l0[1][0]:8)-l0[0][0]);
    T.start=Math.min(...t0s); T.dur=Math.max(...t0s)-T.start+T.len; T.atEnd=false;
    T.appear=K0.rs&&K0.rs.length?'wipe':K0.sc&&K0.sc.length?'scale':(K0.op&&K0.op.length===2&&K0.op[0][2]==='h')?'cut':'fade';
    T.mode=K0.rs&&K0.rs.length?(K0.rs[0][1][0]>0?'clear':'build'):K0.op&&K0.op.length?(K0.op[0][1]>0?'clear':'build'):'build';
    if(g.tiles[0].color) T.color=rgbHex(g.tiles[0].color);
    T.cover=Math.round(g.tiles[0].w+1)%Math.round(p)===0||Math.round(g.tiles[0].w)%Math.round(p)===0;
  });
  return doc;
}
function importText(s,name){
  let doc=null, rebuilt=false;
  try{const o=JSON.parse(s);doc=o.doc||o;}catch(e){
    // a .jsx: use the layout saved inside it, or rebuild one from the build data
    const i=s.indexOf('var GB_LAYOUT=');
    if(i>=0){try{const o=JSON.parse(jsonAt(s,s.indexOf('{',i)));doc=o.doc||o;}catch(e2){}}
    if(!doc){const j=s.lastIndexOf('GB_build(');if(j>=0){try{doc=payloadToDoc(JSON.parse(jsonAt(s,s.indexOf('{',j))));rebuilt=true;}catch(e3){doc=null;}}}
  }
  if(!doc||!doc.grid) return toast('That file isn’t a Grid Blocks layout or build script','err');
  pushHist(); setDoc(doc); if(V.fit)fitView(V.fit); afterDocChange(); closeLib();
  toast(rebuilt?'Layout rebuilt from an older build script — check the settings':'Layout opened','ok',true);
}
function importFile(){
  if(inAE){evalHost('GB_openDialog()').then(r=>{r=String(r);if(r.indexOf('OK|')===0)importText(r.slice(3));else if(r.indexOf('ERR|')===0)toast(r.slice(4),'err');});}
  else $('#fileIn').click();
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>importText(String(rd.result),f.name);rd.readAsText(f);e.target.value='';});
$('#libExport').onclick=exportFile; $('#btnExportFile').onclick=exportFile; $('#libImport').onclick=importFile;
document.addEventListener('dragover',e=>{if(e.dataTransfer&&Array.from(e.dataTransfer.types||[]).indexOf('Files')>=0)e.preventDefault();});
document.addEventListener('drop',e=>{const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(!f||!/\.(json|jsx)$/i.test(f.name))return;e.preventDefault();const rd=new FileReader();rd.onload=()=>importText(String(rd.result),f.name);rd.readAsText(f);});
function download(name,text,type){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();a.remove();
}

/* autosave (AE only — browser preview keeps nothing between sessions) */
let asT=0;
function autosave(){
  if(!inAE){ if(inWeb){clearTimeout(asT);asT=setTimeout(()=>webSet('autosave',JSON.stringify({doc:D,step:U.step,stepId:STEPS[U.step].id})),800);} return; }
  clearTimeout(asT);
  asT=setTimeout(()=>evalHost('GB_writeText("autosave.json",'+jsStr(JSON.stringify({doc:D,step:U.step,stepId:STEPS[U.step].id}))+')'),1200);
}

/* ------------------------------------------------------------------ build payload */
function payload(){
  const G=geom(), A=D.anim, P=plan(G), fps=D.comp.fps||30;
  const animOn=A.mode!=='static'&&P.seq.length>0;
  const camMode=animOn&&A.mode==='camera'&&P.cam.length>0;
  const zoomOn=animOn&&P.zs.length>0;
  const CX=G.W/2, CY=G.H/2;
  const inside=a=>a[0]<G.W&&a[1]<G.H&&a[0]+a[2]>0&&a[1]+a[3]>0;
  const clip=a=>{const nx=Math.max(0,a[0]),ny=Math.max(0,a[1]);return[r3(nx),r3(ny),r3(Math.min(G.W,a[0]+a[2])-nx),r3(Math.min(G.H,a[1]+a[3])-ny)];};
  let c0=0, c1=G.C-1, r0=0, r1=G.R-1;
  (animOn?P.seq:D.blocks).forEach(b=>{c0=Math.min(c0,b.c-2);c1=Math.max(c1,b.c+b.w+1);});
  const free=camMode||zoomOn;
  if(free){
    const sMin=Math.min(1,P.sMin||1), hw=G.W/2/sMin+2*G.p, hh=G.H/2/sMin+2*G.p;
    c0=Math.floor((CX-hw-G.x0)/G.p); c1=Math.ceil((CX+hw-G.x0)/G.p);
    if(zoomOn||(camMode&&A.axis==='xy')){r0=Math.floor((CY-hh-G.y0)/G.p);r1=Math.ceil((CY+hh-G.y0)/G.p);}
  }
  let cells=null;
  if(D.look.cellsMode!=='none'){
    const rects=[];
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const q=cellRect(G,c,r),a=[q.x,q.y,q.w,q.h];if(free||inside(a))rects.push([r3(q.x),r3(q.y),r3(q.w),r3(q.h),c+1,r+1]);}
    cells={mode:(D.look.cellsMode==='layers'&&rects.length>600)?'single':D.look.cellsMode,color:hexRgb(D.look.cell),rects};
  }
  let lines=null;
  if(D.look.linesOn){
    let lr=linesFor(G,c0,c1,r0,r1);
    lr=free?lr.map(a=>a.map(r3)):lr.filter(inside).map(clip);
    if(zoomOn){
      const segs=lr.map(a=>a[2]<=a[3]?[r3(a[0]+a[2]/2),a[1],r3(a[0]+a[2]/2),r3(a[1]+a[3])]:[a[0],r3(a[1]+a[3]/2),r3(a[0]+a[2]),r3(a[1]+a[3]/2)]);
      lines={mode:'strokes',color:hexRgb(D.look.line),segs,lw:+D.look.lineW||1};
    } else lines={mode:'rects',color:hexRgb(D.look.line),rects:lr};
  }
  let rules=null;
  if(D.look.rulesOn){
    const N=Math.max(1,Math.round(D.look.ruleEvery)||1);
    let rr=rulesFor(G,c0-N,c1+N,r0,r1);
    rr=free?rr.map(a=>a.map(r3)):rr.filter(inside).map(clip);
    const lwR=+D.look.ruleW||1;
    rules={color:hexRgb(D.look.rule),lw:lwR,top:D.look.ruleLayer==='top',period:r3(N*G.p),parallax:r3(clamp((+D.look.ruleParallax||100)/100,0,4)),op:animOn&&P.ruleOp&&P.ruleOp.length?P.ruleOp:null,
      mode:zoomOn?'strokes':'rects', rects:zoomOn?null:rr,
      segs:zoomOn?rr.map(a=>[r3(a[0]+a[2]/2),a[1],r3(a[0]+a[2]/2),r3(a[1]+a[3])]):null};
  }
  const NUMS=blockNumbers(G);
  const blocks=P.seq.map(b=>{
    const q=cellRect(G,b.c,b.r,b.w,b.h);
    return{name:bname(b),order:b.order,c:b.c+1,r:b.r+1,w:b.w,h:b.h,x:r3(q.x),y:r3(q.y),bw:r3(q.w),bh:r3(q.h),
      color:hexRgb(b.color),text:casedText(txtStyle(b)).replace(/\n/g,'\r'),fontSize:txtStyle(b).fontSize,textColor:hexRgb(b.textColor),align:txtStyle(b).align,pad:txtStyle(b).pad,offX:+txtStyle(b).offX||0,offY:+txtStyle(b).offY||0,
      font:txtStyle(b).font||'',tracking:+txtStyle(b).tracking||0,leading:+txtStyle(b).leading||0,kern:txtStyle(b).kern||'metrics',
      num:numOn(b)?(()=>{const s=numStr(NUMS[b.id]||0),q2=cellRect(G,b.c,b.r,b.w,b.h),L=numLayout(q2,s);return {text:s,x:r3(L.x),y:r3(L.y),size:L.size,color:hexRgb(D.num.color),font:D.fill.font,opacity:clamp(+D.num.opacity||100,0,100),keys:animOn&&P.tracks[b.id]&&P.tracks[b.id].num&&P.tracks[b.id].num.length?P.tracks[b.id].num.map(k=>[k[0],r3(k[1]*clamp(+D.num.opacity||100,0,100)/100),k[2],k[3]]):null};})():null,
      keys:animOn?P.tracks[b.id]:null, tIn:animOn?Math.round(P.T[P.seq.indexOf(b)]):null, tOut:exitEnd(P,P.seq.indexOf(b),animOn)};
  });
  // ---- content: auto-fill items → AE-ready descriptions
  const F=D.fill, met=fillMetrics();
  const payItem=(it,t0,tEnd)=>{
    const t=Object.assign({},it,{t0}); if(tEnd!=null) t.tEnd=tEnd;
    if(it.kind==='shape') return payShape(it,t0,tEnd,fps);
    if(it.kind==='icon') return {kind:'icon',name:it.name,label:(ICONS[it.name]||{}).name||it.name,x:r3(it.x),y:r3(it.y),s:r3(it.s),prims:(ICONS[it.name]||{prims:[]}).prims,lw:r3(Math.max(1,it.s*.07)),color:hexRgb(it.color),t0:r3(Math.max(0,t0)/fps),opx:fillOpacityExpr(t,fps,false)};
    if(it.kind==='dots') return {kind:'dots',sq:!!it.sq,rects:it.rects.map(f=>({x:r3(f.x),y:r3(f.y),cols:f.cols,rows:f.rows})),sp:it.sp,d:r3(it.d),color:hexRgb(it.color),t0:r3(Math.max(0,t0)/fps),opx:fillOpacityExpr(t,fps,false)};
    if(it.kind==='ring') return {kind:'ring',cx:r3(it.cx),cy:r3(it.cy),r:r3(it.r),w:r3(it.w),color:hexRgb(it.color),t0:r3(Math.max(0,t0)/fps),opx:fillOpacityExpr(t,fps,false)};
    if(it.kind==='logo') return {kind:'logo',x:r3(it.x),y:r3(it.y),s:r3(it.s),paths:AVAX_AE,color:hexRgb(it.color),t0:r3(Math.max(0,t0)/fps),opx:fillOpacityExpr(t,fps,false)};
    const FA=it.A||F.anim; const animd=t.tEnd!=null||(FA.live&&(FA.liveGlitch||(FA.liveTick&&it.count)||(FA.liveHash&&it.scr)))||(FA.inMode==='type'&&(it.type||FA.typeAll))||(FA.count&&it.count)||(FA.scramble&&it.scr)||(FA.ellipsis&&it.ell)||t0>0||FA.outMode==='cut'||FA.outMode==='typeoff';
    return {kind:'text',t0:r3(Math.max(0,t0)/fps),text:it.lines.join('\r'),x:r3(it.x),y:r3(it.y),align:it.align,size:it.sz?r3(it.sz):met.size,leading:r3(it.sz?met.lh*it.sz/met.size:met.lh),font:F.font,color:hexRgb(it.color),expr:animd?fillExpr(t,fps):null,opx:fillOpacityExpr(t,fps,true)};
  };
  const blockFill=(b,rect,base,isEcho,tEnd)=>{
    if(!F.on) return null;
    const st=Math.max(0,+F.anim.stagger||0);
    const its=fillItems(G,b,rect,isEcho).map(it=>payItem(it,base==null?(it.slot||0)*st:base+(it.slot||0)*st,tEnd));
    return its.length?its:null;
  };
  blocks.forEach((pb,i)=>{const b=P.seq[i]; if(!b) return; const q=cellRect(G,b.c,b.r,b.w,b.h);
    pb.fill=blockFill(b,q,animOn?P.fillBase[b.id]:null,false,animOn&&P.fillEnd?P.fillEnd[b.id]:null);
    if(isOutline(b)) pb.outline={w:+F.outlineW||2};
  });
  // manual order: blocks you didn't pick but chose to keep visible
  P.statics.forEach(b=>{const q=cellRect(G,b.c,b.r,b.w,b.h);blocks.push({name:bname(b),order:0,c:b.c+1,r:b.r+1,w:b.w,h:b.h,x:r3(q.x),y:r3(q.y),bw:r3(q.w),bh:r3(q.h),
    color:hexRgb(b.color),text:casedText(txtStyle(b)).replace(/\n/g,'\r'),fontSize:txtStyle(b).fontSize,textColor:hexRgb(b.textColor),align:txtStyle(b).align,pad:txtStyle(b).pad,offX:+txtStyle(b).offX||0,offY:+txtStyle(b).offY||0,font:txtStyle(b).font||'',tracking:+txtStyle(b).tracking||0,leading:+txtStyle(b).leading||0,kern:txtStyle(b).kern||'metrics',keys:null});});
  // echoes
  const E=D.echo; let echoes=[];
  if(E.on&&(E.fill||(E.stroke&&+E.sw>0))){
    const src=animOn?P.echo.map(e=>({b:e.src,r:e.rect,K:e.K})):echoTargets(D.blocks.filter(b=>valid(b,G))).map(b=>({b,r:echoRect(G,b),K:null}));
    echoes=src.map(e=>({name:bname(e.b)+' · Echo',x:r3(e.r.x),y:r3(e.r.y),w:r3(e.r.w),h:r3(e.r.h),
      fill:E.fill?hexRgb(E.color):null, opacity:clamp(+E.opacity||0,0,100),
      stroke:E.stroke&&+E.sw>0?{w:+E.sw,color:hexRgb(E.scolor),dash:E.dash?[Math.max(1,+E.dashL||1),Math.max(1,+E.dashG||1)]:null}:null,
      content:!!E.content, keys:e.K, tOut:exitEnd(P,P.seq.indexOf(e.b),animOn), tIn:e.K&&e.K.op&&e.K.op.length?Math.round(e.K.op[0][0]):null,
      fill:E.content?blockFill(e.b,e.r,animOn?P.fillBase['e'+e.b.id]:null,true,animOn&&P.fillEnd?P.fillEnd['e'+e.b.id]:null):null}));
  }
  let gaps=null;
  if(F.on&&F.gap.on){
    const gl=animOn&&P.gaps?P.gaps:gapItems(G,(animOn?P.seq:D.blocks.filter(b=>valid(b,G)))).map(it=>Object.assign({},it,{t0:0}));
    gaps=gl.map(it=>payItem(it,it.t0||0,it.tEnd));
  }
  const endSec=animOn?P.end/fps:0;
  const labels={reveal:'reveal animation',camera:'camera-follow animation',push:'conveyor animation'};
  const rel=zoomOn?k=>[k[0],[r3(k[1][0]-CX),r3(k[1][1]-CY)],k[2],k[3]]:k=>k;
  const rig=D.out.rig==='null'?'null':'camera';
  let camRig=null;
  if(animOn&&rig==='camera'){
    camRig={
      camX:A.mode==='camera'?P.cam.map(k=>[k[0],r3(CX-k[1][0]),k[2],k[3]]):[],
      camY:(A.mode==='camera'&&A.axis==='xy')?P.cam.map(k=>[k[0],r3(CY-k[1][1]),k[2],k[3]]):[],
      zoomPct:zoomOn?P.zs:[],
      conv:A.mode==='push'?P.cam:[],
      wrap3:camMode?{px:r3(G.p),py:(A.axis==='xy'||zoomOn)?r3(G.p):0}:null
    };
  }
  return{
    v:3, fps,
    comp:{w:G.W,h:G.H,name:'Grid Blocks '+G.W+'x'+G.H,dur:Math.max(D.comp.dur||10,D.out.fitDur?Math.ceil(Math.max(endSec,transOn()?transP(G).end/fps:0)*100)/100:0)},
    replace:D.out.replace, lock:D.out.lock, fitDur:D.out.fitDur, rig, mb:D.out.mb?{angle:+D.out.mbAngle||180}:null,
    bg:D.look.bgOn?{color:hexRgb(D.look.bg)}:null,
    cells, lines, rules, echoes, blocks, gaps,
    trans:transOn()?(()=>{const TP=transP(G);return {groups:TP.groups.map(g=>({k:g.k,output:g.output,name:g.k==='in'?'GB · Transition In':'GB · Transition Out',
      vis:transVis(TP,g.k),
      tiles:TP.tiles.filter(t=>t.g===g.k).map(t=>({x:r3(t.x),y:r3(t.y),w:r3(t.w),h:r3(t.h),color:hexRgb(t.color),keys:t.K}))}))};})():null,
    org:orgPayload(P,animOn,G),
    lab:labPayload(P,G,animOn),
    fontsUsed:fontsUsed(),
    anim:animOn?Object.assign({label:labels[A.mode]+(zoomOn?' + grid zoom':''),camName:A.mode==='camera'?'GB · Camera':'GB · Conveyor',
      cam:P.cam.map(rel), needCam:P.cam.length>0||zoomOn,
      wrap:camMode?{px:r3(G.p),py:(A.axis==='xy'||zoomOn)?r3(G.p):0,cx:zoomOn?CX:0,cy:zoomOn?CY:0}:null,
      zoom:zoomOn?{keys:P.zs.map(k=>[k[0],[k[1],k[1]],k[2],k[3]]),cx:CX,cy:CY,pan:P.pan.length?P.pan.map(k=>[k[0],[r3(k[1][0]+CX),r3(k[1][1]+CY)],k[2],k[3]]):null}:null,
      pan:P.pan.length?P.pan:null},camRig||{}):null
  };
}
function fontsUsed(){const s={};if(D.fill.on)s[D.fill.font]=D.fill.family;D.blocks.forEach(b=>{if(b.text&&b.font)s[b.font]=b.family||b.font;});if(D.num&&D.num.on)s[D.fill.font]=D.fill.family;return Object.keys(s).filter(Boolean).map(k=>[k,s[k]]);}
/* lab → AE-ready description */
function labPayload(P,G,animOn){
  if(!animOn||!P.lab) return null;
  const LB=D.lab, L=P.lab, bi={}; P.seq.forEach((b,i)=>{bi[b.id]=i;});
  const o={
    pulses:L.pulses.map(p=>({bi:bi[p.id],cx:r3(p.r.x+p.r.w/2),cy:r3(p.r.y+p.r.h/2),w:r3(p.r.w),h:r3(p.r.h),lw:+LB.pulse.width||2,color:hexRgb(LB.pulse.color),keys:p.K,t0:p.t0,t1:p.t0+p.len})),
    trails:L.trails.map(t=>({bi:bi[t.id],anchor:t.anchor,lines:t.lines,color:hexRgb(LB.trail.color),keys:t.K,t0:t.t0,t1:t.t0+t.len})),
    bars:L.bars.map(b=>({bi:bi[b.id],x:b.x,y:b.y,w:b.w,h:b.h,color:hexRgb(LB.bar.color),keys:b.K,t0:b.t0})),
    ticker:LB.ticker&&LB.ticker.on?{text:tickerText(),y:r3(G.H*clamp(+LB.ticker.y||94,0,100)/100),size:Math.max(6,+LB.ticker.size||14),speed:+LB.ticker.speed||160,color:hexRgb(LB.ticker.color),band:!!LB.ticker.band,bandColor:hexRgb(LB.ticker.bandColor),font:D.fill.font}:null,
    snow:LB.snow&&LB.snow.on?{parts:snowParts(G).map(p=>[r3(p.x0),r3(p.y0),r3(p.v),r3(p.s),r3(p.ph),r3(p.amp)]),dir:LB.snow.dir==='right'?1:-1,stretch:Math.max(1,+LB.snow.stretch||1),color:hexRgb(LB.snow.color),opacity:clamp(+LB.snow.opacity||55,0,100)}:null
  };
  return (o.pulses.length||o.trails.length||o.bars.length||o.ticker||o.snow)?o:null;
}
/* frame a block has completely left (exit on), for trimming in AE */
function exitEnd(P,i,animOn){
  if(!animOn||!P.exitT||i<0||P.exitT[i]==null) return null;
  return Math.ceil(P.exitT[i]+(D.exit.style==='cut'?0:Math.max(1,+D.exit.len||8))+1);
}
/* first and last frame any tile of a transition group is visible (to trim its precomp) */
function transVis(TP,k){
  const tiles=TP.tiles.filter(t=>t.g===k); if(!tiles.length) return null;
  const end=Math.ceil(TP.end||0)+2; let a=null,b=null;
  for(let f=0;f<=end;f++){
    if(tiles.some(t=>{const st=blockState(t.K,f,{x:t.x,y:t.y,w:t.w,h:t.h});return st.op>0.001&&st.w>0.01&&st.sx>0.001;})){if(a===null)a=f;b=f;}
  }
  return a===null?null:[a,b];
}
/* project / timeline tidiness for the AE build */
function orgPayload(P,animOn,G){
  const O=D.out, mk=[];
  if(O.markers){
    if(animOn){mk.push([P.startF,'Scene start',0]); mk.push([P.startF+P.L,'Scene end',0]);}
    if(transOn()){const TP=transP(G); TP.groups.forEach(g=>{const v=transVis(TP,g.k); if(v) mk.push([v[0],g.k==='in'?'Transition in':'Transition out',v[1]-v[0]]);});}
  }
  return {folder:!!O.folder, preGrid:!!O.preGrid, preBlocks:!!O.preBlocks, preTrans:!!O.preTrans, shy:!!O.shy, trim:!!O.trim, markers:mk.filter(m=>m[0]>=0)};
}
function renderBuildSummary(G){
  const d=payload(), o=d.org||{}, cam3=d.rig==='camera', canPre=cam3||!d.anim;
  const preG=o.preGrid&&canPre, preB=o.preBlocks&&canPre, compName=inAE&&U.compLive?U.aeName:d.comp.name;
  const cells=d.cells?d.cells.rects.length:0;
  const nFill=d.blocks.reduce((n,b)=>n+(b.fill?b.fill.length:0),0)+(d.echoes||[]).reduce((n,e)=>n+(e.fill?e.fill.length:0),0);
  const nGap=d.gaps?d.gaps.length:0, nEcho=d.echoes?d.echoes.length:0, nText=d.blocks.filter(b=>b.text).length;
  const gridBits=[cells?(d.cells.mode==='single'?'tiles':cells+' tiles'):'',d.lines?'grid lines':'',d.rules&&!d.rules.top?'column rules':''].filter(Boolean);
  const blockBits=[d.blocks.length?d.blocks.length+' blocks':'',nText?nText+' text':'',nEcho?nEcho+' echoes':'',nFill+nGap?(nFill+nGap)+' content':'',d.rules&&d.rules.top?'column rules':''].filter(Boolean);
  const gridLayers=(cells?(d.cells.mode==='single'?1:cells):0)+(d.lines?1:0)+(d.rules&&!d.rules.top?1:0);
  const blockLayers=d.blocks.length+nText+nEcho+nFill+nGap+(d.rules&&d.rules.top?1:0);
  const li=(icon,name,detail,cls)=>`<div class="tl ${cls||''}"><span class="ti">${icon}</span><span class="tn">${esc(name)}</span><span class="td">${detail||''}</span></div>`;
  const PC='▣', LY='▭', CM='◉', NL='◇';
  const rows=[];
  if(cam3) rows.push(li(CM,'GB · Camera',d.anim?d.anim.label:'still','cam'));
  else if(d.anim) rows.push(li(NL,d.anim.camName||'GB · Rig',d.anim.label,'cam'));
  if(d.trans) d.trans.groups.slice().reverse().forEach(g=>{
    const pre=g.output==='matte'||o.preTrans;
    rows.push(pre?li(PC,g.name+(g.output==='matte'?' (matte)':''),`precomp · ${g.tiles.length} tiles`,'pre'):li(LY,g.name.replace('GB · ','')+' tiles',`${g.tiles.length} layers`,''));
  });
  if(blockBits.length) rows.push(preB?li(PC,'GB · Blocks','precomp · '+blockBits.join(', '),'pre'):li(LY,'Blocks & content',`${blockLayers} layers in this comp`,'warn'));
  if(gridBits.length) rows.push(preG?li(PC,'GB · Grid','precomp · '+gridBits.join(', '),'pre'):li(LY,'Grid',`${gridLayers} layer${gridLayers===1?'':'s'} in this comp`,gridLayers>20?'warn':''));
  if(d.bg) rows.push(li(LY,'GB · Background','solid',''));
  const mainCount=rows.length;
  const proj=o.folder?`<div class="tl"><span class="ti">📁</span><span class="tn">Grid Blocks</span></div><div class="tl ind"><span class="ti">📁</span><span class="tn">${esc(compName)}</span><span class="td">${[preG&&gridBits.length?'grid':'',preB&&blockBits.length?'blocks':'',d.trans&&(o.preTrans||d.trans.groups.some(g=>g.output==='matte'))?'transitions':'',d.bg?'solid':''].filter(Boolean).join(', ')}</span></div>`:'<div class="note">Precomps and solids go wherever After Effects puts them.</div>';
  const extras=[d.mb?`motion blur ${d.mb.angle}°`:'',o.shy?'helpers shy':'',o.trim?'layers trimmed':'',o.markers&&o.markers.length?o.markers.length+' markers':'',cam3?'3D camera':'2D null rig'].filter(Boolean);
  $('#buildSummary').innerHTML=`<div class="tree-h">Timeline · ${esc(compName)} <span class="note">${mainCount} layer${mainCount===1?'':'s'}</span></div><div class="tree">${rows.join('')}</div>
    <div class="tree-h">Project panel</div><div class="tree">${proj}</div>
    <div class="note">${extras.join(' · ')}${!canPre&&(o.preGrid||o.preBlocks)?'<br><span class="warn">Grid and block precomps need the After Effects camera rig.</span>':''}</div>`;
  $('#buildLabel2').textContent=inAE?'Build in After Effects':'Export .jsx for After Effects';
  $('#btnExportJsx').hidden=!inAE;
  $('#buildNote').innerHTML=inAE
    ?(U.compLive?`Builds into <b>${esc(U.aeName)}</b>.`:'No comp is open, so a new one will be made.')+' Everything goes in one undo step.'
    :'In After Effects choose <b>File › Scripts › Run Script File…</b> and pick the exported file. It builds into the active comp if it’s the same size, or makes a new comp.';
}

/* ------------------------------------------------------------------ AE link */
function evalHost(code){return new Promise(res=>{try{cep.evalScript(code,r=>res(r));}catch(e){res('ERR|'+e);}});}
async function build(){
  const d=payload();
  if(!d.bg&&!d.cells&&!d.lines&&!d.blocks.length) return toast('Nothing to build. Turn on a layer in Grid › Look, or add blocks.','err');
  const json=JSON.stringify(d).split(LS1).join('\\u2028').split(LS2).join('\\u2029');
  if(inAE){
    $('#btnBuild').disabled=true;$('#btnBuild2').disabled=true;
    const r=String(await evalHost('GB_build('+json+')'));
    $('#btnBuild').disabled=false;$('#btnBuild2').disabled=false;
    const p=r.split('|');
    if(p[0]==='OK') toast(p.slice(1).join('|'),'ok');
    else toast(p[0]==='ERR'?p.slice(1).join('|'):'After Effects said: '+r,'err');
    detect();
  } else {
    const code='// Grid Blocks — generated build script\n// After Effects: File › Scripts › Run Script File…\n// Builds into the active comp if it is '+d.comp.w+'×'+d.comp.h+', otherwise makes a new comp.\n// Open this file in Grid Blocks (Layouts › Open from file) to keep editing the layout.\n\n'
      +layoutBlock()+'\n'+HOST+'\n(function(){var r=GB_build('+json+');alert(r.replace(/^OK\\|/,"").replace(/^ERR\\|/,"Error: "));})();\n';
    download(`GridBlocks_${d.comp.w}x${d.comp.h}.jsx`,code);
    toast('Exported. In AE: File › Scripts › Run Script File…','ok');
  }
}
$('#btnBuild').onclick=build; $('#btnBuild2').onclick=build;
$('#btnExportJsx').onclick=()=>{
  const d=payload(), json=JSON.stringify(d).split(LS1).join('\\u2028').split(LS2).join('\\u2029');
  const code='// Grid Blocks — generated build script\n// Open this file in Grid Blocks (Layouts › Open from file) to keep editing the layout.\n\n'+layoutBlock()+'\n'+HOST+'\n(function(){var r=GB_build('+json+');alert(r.replace(/^OK\\|/,"").replace(/^ERR\\|/,"Error: "));})();\n';
  evalHost('(function(){var f=new File(Folder.myDocuments.fsName+"/GridBlocks_build.jsx").saveDlg("Save build script");if(!f)return "CANCEL";f.encoding="UTF-8";f.open("w");f.write('+jsStr(code)+');f.close();return "OK|"+f.fsName;})()')
    .then(r=>{r=String(r);if(r.indexOf('OK|')===0)toast('Saved '+r.slice(3),'ok');});
};
function removeFromComp(){
  if(!inAE) return toast('Only available inside After Effects');
  evalHost('GB_clearActive()').then(r=>{const p=String(r).split('|');toast(p.slice(1).join('|')||r,p[0]==='OK'?'ok':'err');});
}
$('#btnRemoveAE').onclick=removeFromComp;

async function detect(){
  if(!inAE) return;
  let o; try{o=JSON.parse(await evalHost('GB_getComp()'));}catch(e){o={ok:false};}
  const before=[U.compLive,D.comp.w,D.comp.h,U.aeName,D.comp.fps].join('|');
  if(o.ok){
    U.aeName=o.name;
    if(D.comp.follow){D.comp.w=o.w;D.comp.h=o.h;D.comp.fps=Math.round(o.fps*1000)/1000;D.comp.dur=o.dur;U.compLive=true;}
    else U.compLive=false;
  } else U.compLive=false;
  $('#compNote').textContent=o.ok
    ?(D.comp.follow?'The grid matches the active comp and updates when you switch comps.':`Active comp is ${o.w}×${o.h}. If the sizes differ, Build makes a new comp.`)
    :'No comp is open. Build will make a new one at this size.';
  if(before!==[U.compLive,D.comp.w,D.comp.h,U.aeName,D.comp.fps].join('|')){syncPreset();syncInputs();if(V.fit)fitView(V.fit);refresh();}
}

function registerKeys(){
  try{
    const mac=navigator.platform.indexOf('Mac')>=0;
    const codes=mac?[0,1,2,3,4,5,6,9,11,14,15,16,31,35,36,46,49,51,53,117,123,124,125,126,24,27,29,33,30]
                   :[65,66,68,69,70,71,72,77,79,80,82,83,86,89,90,13,32,8,46,27,37,38,39,40,187,189,107,109,219,221];
    const list=[];
    codes.forEach(k=>{list.push({keyCode:k});list.push({keyCode:k,shiftKey:true});list.push({keyCode:k,metaKey:true});list.push({keyCode:k,ctrlKey:true});list.push({keyCode:k,metaKey:true,shiftKey:true});list.push({keyCode:k,ctrlKey:true,shiftKey:true});});
    if(cep.registerKeyEventsInterest) cep.registerKeyEventsInterest(JSON.stringify(list));
  }catch(e){}
}

/* ------------------------------------------------------------------ init */
async function init(){
  D.blocks=D.blocks.map(b=>normBlock(b)); uid=D.blocks.reduce((m,b)=>Math.max(m,b.id),0)+1;   // starter layout
  buildStepper(); buildPicker(); buildCurves(); addHelp(); addResets(); addCollapse(); setHelp(true); renderFontUI();
  $$('.field').forEach(f=>{if(f.querySelector('.seg'))f.classList.add('stack');});
  // draw the panel straight away so it is usable even if After Effects is slow to answer
  if(!D.blocks.length&&U.step===0&&stepVisible(SI('layout'))) U.step=SI('layout');
  if(!stepVisible(U.step)){ const j=nextVisible(-1,1); U.step=j>=0?j:0; }
  const paint=()=>{U.tool=STEPS[U.step].tool;syncPreset();syncInputs(true);syncPalettes();updUndo();resize();fitView('comp');refresh();};
  if(window.ResizeObserver) new ResizeObserver(resize).observe(wrap); else window.addEventListener('resize',resize);
  try{paint();}catch(e){if(window.__gbShowErr)window.__gbShowErr('first draw: '+(e&&(e.stack||e.message)||e));}
  const soon=(p,ms,fb)=>Promise.race([Promise.resolve(p).catch(()=>fb),new Promise(r=>setTimeout(()=>r(fb),ms))]);
  if(inAE){
    $('#compTag').textContent='After Effects';
    $('#buildLabel').textContent='Build';
    registerKeys();
    await soon(evalHost(HOST),15000,'');
    await soon(libLoad(),5000);
    try{const pr=JSON.parse(await soon(evalHost('GB_readText("prefs.json")'),5000,'')||'{}');if(pr.help===false)setHelp(false);if(pr.loop===false)U.loop=false;if(pr.mb===false)U.mbPrev=false;if(pr.adv)setAdv(true);if(pr.subs){U.subs=pr.subs;applySubs();}if(pr.collapsed){U.collapsed=pr.collapsed;$$('#left .group').forEach(g=>g.classList.toggle('collapsed',!!pr.collapsed[g.dataset.ckey]));}}catch(e){}
    try{
      const s=await soon(evalHost('GB_readText("autosave.json")'),5000,'');
      if(s){const o=JSON.parse(s);if(o&&o.doc){setDoc(o.doc);U.step=savedStep(o);U.tool=STEPS[U.step].tool;}}
    }catch(e){}
    await soon(detect(),5000);
    try{loadFonts();}catch(e){}
    setInterval(()=>{if(D.comp.follow&&!document.hidden&&!U.playing)detect();},1500);
  } else {
    $('#buildLabel').textContent='Export .jsx';
    $('#followRow').hidden=true;
    $('#compTag').textContent='browser preview';
    if(inWeb){
      await soon(libLoad(),5000);
      try{const o=JSON.parse(webGet('autosave')||'null');if(o&&o.doc){setDoc(o.doc);U.step=savedStep(o);}}catch(e){}
      try{const pr=JSON.parse(webGet('prefs')||'{}');if(pr.help===false)setHelp(false);if(pr.loop===false)U.loop=false;if(pr.mb===false)U.mbPrev=false;if(pr.adv)setAdv(true);if(pr.subs){U.subs=pr.subs;applySubs();}if(pr.collapsed){U.collapsed=pr.collapsed;$$('#left .group').forEach(g=>g.classList.toggle('collapsed',!!pr.collapsed[g.dataset.ckey]));}}catch(e){}
      const dl=$('#btnPanel'); if(dl) dl.hidden=false;
    }
    $('#compNote').textContent='In the browser, pick a size here. Inside After Effects the panel reads your comp automatically.';
  }
  paint();
  // redraw once web fonts (Aeonik Fono) have loaded so text measures correctly
  try{if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load("400 14px 'Aeonik Fono'"),document.fonts.load("900 14px 'Aeonik'")]).then(()=>{fontCW={};fillCache.clear();refresh();});}}catch(e){}
  if(!inAE) checkBrandFonts(); else renderFontStatus();
  window.__gbReady=true;
}
init().catch(e=>{if(window.__gbShowErr)window.__gbShowErr('startup: '+(e&&(e.stack||e.message)||e));});
})();
