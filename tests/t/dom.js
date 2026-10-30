const els={};
const ctx=new Proxy({},{get(t,k){if(k==='measureText')return s=>({width:String(s).length*6});if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern')return()=>({addColorStop(){}});if(k==='getImageData')return()=>({data:new Uint8ClampedArray(4)});if(k==='getLineDash')return()=>[];if(k in t)return t[k];return function(){}},set(t,k,v){t[k]=v;return true}});
function mk(name){
  const L={}; const store={dataset:{},style:{setProperty(){},getPropertyValue(){return ''}},classList:{add(){},remove(){},toggle(){},contains(){return false}},hidden:false,value:'',textContent:'',innerHTML:'',checked:false,children:[],
    addEventListener(t,f){(L[t]=L[t]||[]).push(f)},removeEventListener(){},_L:L,_name:name,
    getBoundingClientRect(){return{left:0,top:0,right:1000,bottom:600,width:1000,height:600}},
    clientWidth:1000,clientHeight:600,offsetWidth:100,offsetHeight:20,width:1000,height:600,scrollTop:0,
    setPointerCapture(){},releasePointerCapture(){},focus(){},blur(){},click(){},appendChild(c){return c},removeChild(){},append(){},remove(){},
    setAttribute(){},getAttribute(){return null},removeAttribute(){},matches(){return false},closest(){return null},contains(){return false},
    querySelector:(s)=>q(name+' '+s),querySelectorAll:()=>[],insertAdjacentHTML(){},scrollIntoView(){},
    getContext(){return ctx},play(){return Promise.resolve()},pause(){},load(){}};
  return new Proxy(store,{get(t,k){if(k in t)return t[k];if(typeof k==='symbol')return undefined;if(k.startsWith('on'))return t[k];if(['parentElement','parentNode','previousElementSibling','nextElementSibling','firstElementChild','lastElementChild','firstChild','lastChild','offsetParent','options','content','sheet'].includes(k))return t[k]=mk(name+'.'+k);return t[k]=undefined},set(t,k,v){t[k]=v;return true}});
}
function q(s){return els[s]||(els[s]=mk(s));}
const DL={};
global.document={querySelector:q,querySelectorAll:()=>[],getElementById:id=>q('#'+id),createElement:t=>mk('new:'+t),body:mk('body'),documentElement:mk('html'),
  addEventListener(t,f){(DL[t]=DL[t]||[]).push(f)},activeElement:null,hidden:false,fonts:{load:()=>Promise.resolve(),ready:Promise.resolve()},elementFromPoint:()=>null};
global.window=global; window.addEventListener=(t,f)=>{(DL['w'+t]=DL['w'+t]||[]).push(f)}; window.devicePixelRatio=1; global.innerWidth=1400; global.innerHeight=900;
global.location={protocol:'file:',search:process.env.ALL?'?steps=all':'',hash:''}; global.navigator={userAgent:'node',clipboard:{}};
global.localStorage={getItem(){return null},setItem(){}}; global.requestAnimationFrame=f=>0; global.cancelAnimationFrame=()=>{};
global.ResizeObserver=class{observe(){}}; global.matchMedia=()=>({matches:false,addEventListener(){}});
global.getComputedStyle=()=>({getPropertyValue:()=>''}); global.Image=class{}; global.AudioContext=undefined; global.performance=global.performance||{now:()=>Date.now()};
module.exports={els,DL,q};
