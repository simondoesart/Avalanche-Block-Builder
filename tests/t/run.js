const {els,DL,q}=require('./dom.js');
const fs=require('fs');let s=fs.readFileSync(process.argv[2],'utf8');
const i=s.lastIndexOf('<script>');let js=s.slice(i+8,s.lastIndexOf('</script>'));
js=js.replace("init().catch(","window.__T={renderFrame,GBSvgCtx,setEXP:v=>{EXP=v},projFile,exportFile,cardMediaX:cardMedia,bldMake,bldDefaults,routeNudge,lockLayer,lockAllLayers,exportVideo,zoomRoomFn,renderWalkSec,vidApply,l2OwnZoom,cardL2,render,get D(){return D},U,V,geom,cellRect,goStep,setTool,STEPS,tryStamp,refresh,generate,loadExample,resetDefaults,plan,generateLine,materialize,setCtx,tlSelect,tlPick,tlAddPoint,drawDope,TL,dopeRemove,tlNudge,renderInsp,setDoc,virtualAt,isGenerated,payload,tlSetT,transP,sceneEnd,animSeed,applyLook:typeof applyLook!=='undefined'?applyLook:null,fillItems,drawFillItems,cellRect2:null,ev:typeof ev!=='undefined'?ev:null,phaseBounds,undo:typeof undo!=='undefined'?undo:null,pushHist:typeof pushHist!=='undefined'?pushHist:null,H:typeof H!=='undefined'?H:null,applyTransPreset:typeof applyTransPreset!=='undefined'?applyTransPreset:null,TRANS_PRESETS:typeof TRANS_PRESETS!=='undefined'?TRANS_PRESETS:null,transCache:typeof transCache!=='undefined'?transCache:null,blockState:typeof blockState!=='undefined'?blockState:null,rollAll:typeof rollAll!=='undefined'?rollAll:null,fillCache:typeof fillCache!=='undefined'?fillCache:null,withLayer,curLayer,animState,findCues:typeof findCues!=='undefined'?findCues:null,l2ShiftAt,setDocX:setDoc,updatePitch:typeof updatePitch!=='undefined'?updatePitch:null,cuePitches:typeof cuePitches!=='undefined'?cuePitches:null,layerView,localPt,xfPick,xfOf,xfSnap:typeof xfSnap!=='undefined'?xfSnap:null,redo:typeof redo!=='undefined'?redo:null};init().catch(");
q('#host-src').textContent='';
if(process.env.AE)window.__adobe_cep__={evalScript(){},addEventListener(){}};
try{eval(js)}catch(e){console.log('EVAL ERR',e.stack);process.exit(1)}
setTimeout(()=>{
 const T=window.__T, cv=q('#cv');
 const fire=(t,x,y,ex)=>(cv._L[t]||[]).forEach(f=>f(Object.assign({clientX:x,clientY:y,button:0,buttons:1,pointerId:1,shiftKey:false,altKey:false,preventDefault(){},stopPropagation(){},target:cv},ex||{})));
 const fireDoc=(t,x,y)=>(DL['w'+t]||[]).concat(DL[t]||[]).forEach(f=>{try{f({clientX:x,clientY:y,button:0,pointerId:1,target:cv,preventDefault(){},key:''})}catch(e){}});
 require(process.argv[3])(T,fire,fireDoc,q,els,DL);
},50);
