module.exports=(T,fire,fireDoc,q)=>{
 const host=require('fs').readFileSync('/sessions/vibrant-tender-fermat/mnt/Avalanche Block Builder/host.jsx','utf8');
 let exprErr=[], names=[], ins=[];
 function mk(name){ const store={}; const f=function(){ return mk(name+'()'); };
   return new Proxy(f,{ get(t,k){ if(k in store) return store[k]; if(k===Symbol.toPrimitive) return ()=>0; if(typeof k==='symbol') return undefined;
       if(['numLayers','numProperties','numKeys','numItems','length'].includes(k)) return 0;
       if(k==='duration') return 10; if(k==='width') return 1920; if(k==='height') return 1080; if(k==='frameRate') return 24; if(k==='frameDuration') return 1/24; if(k==='pixelAspect') return 1;
       if(k==='comment'||k==='name'||k==='fsName') return ''; if(k==='value') return [0,0]; if(k==='exists') return false; if(k==='usedIn') return [];
       if(k==='toString') return ()=>name; return mk(name+'.'+String(k)); },
     set(t,k,v){ if(k==='expression'&&v){ try{ new Function('time','value','thisComp','thisLayer','comp','createPath','index','transform','source','cameraOption','effect','text','content',v.replace(/;\s*$/,'')); }catch(e){ exprErr.push(e.message+' :: '+v.slice(0,120)); } }
       if(k==='name') names.push(v); if(k==='inPoint') ins.push(v); store[k]=v; return true; } }); }
 const G={}; ['app','KeyframeInterpolationType','TrackMatteType','AutoKernType','ParagraphJustification','KeyframeEase','MarkerValue','ImportOptions','File','Folder','SolidSource','FootageItem','CameraLayer','CompItem','FolderItem','AutoOrientType','BlendingMode','LayerQuality','Shape','alert'].forEach(n=>G[n]=mk(n));
 G.$={os:'Macintosh',fileName:''};
 const fn=new Function(...Object.keys(G),host+'\n;return GB_build;');
 const GB_build=fn(...Object.values(G));
 const D=T.D; const runs=[];
 const go=(label,setup)=>{ exprErr=[]; names=[]; ins=[]; T.generateLine(true); setup&&setup(D); T.refresh(); const pl=T.payload(); let r; try{ r=GB_build(JSON.parse(JSON.stringify(pl))); }catch(e){ r='THROW '+e.message; }
   console.log(label.padEnd(26),String(r).slice(0,process.env.FULL?2000:150).replace(/\n/g,' '),'| exprErr',exprErr.length,exprErr[0]||'','| headers',names.filter(n=>/━/.test(n)).join(' / '),'| trims',ins.length,'| dims',names.filter(n=>/ · Dim/.test(n)).length); };
 const goV=(label,v)=>{ exprErr=[]; names=[]; T.generateLine(true); T.refresh(); const pl=T.vidApply(T.payload(),v); let r; try{ r=GB_build(JSON.parse(JSON.stringify(pl))); }catch(e){ r='THROW '+e.message; } console.log(label.padEnd(26),String(r).slice(0,150),'| exprErr',exprErr.length,exprErr[0]||'','| replace comps',names.filter(n=>/Replace me/.test(n)).length); };
 const goB=(label,fn)=>{ exprErr=[]; names=[]; T.generateLine(true); const tb=q('#layerTabs'); tb._L.click[0]({target:{closest:()=>({dataset:{ltab:'l2'}})}}); tb._L.click[0]({target:{closest:()=>({dataset:{ltab:'main'}})}}); T.refresh(); const o=T.bldDefaults(); fn(o); const pl=T.bldMake(o); let r; try{ r=GB_build(JSON.parse(JSON.stringify(pl))); }catch(e){ r='THROW '+e.message+' '+(e.stack||'').split('\n')[1]; }
   const L1m=pl.blocks.filter(b=>b.media).length, L2m=pl.layer2?pl.layer2.blocks.filter(b=>b.media).length:0, dims=(pl.blocks.filter(b=>b.dim).length)+'/'+(pl.layer2?pl.layer2.blocks.filter(b=>b.dim).length:0);
   console.log(label.padEnd(26),String(r).slice(0,110),'| exprErr',exprErr.length,exprErr[0]||'','| media L1/L2',L1m+'/'+L2m,'| dims',dims,'| block comps',names.filter(n=>/^GB · L[12] · /.test(n)).length,'| dim comp',names.filter(n=>/Dim colour/.test(n)).length,'| bg',!!pl.bg,'cells',!!pl.cells,'rules',!!pl.rules); };
 const goM=(label,comp,mp)=>{ exprErr=[]; names=[]; T.generateLine(true); T.refresh(); const D=T.D; D.mediaLib='/Users/x/Footage'; D.bmedia.assets=[{id:'mA',name:'a.mp4',type:'video',file:'a.mp4',rel:'shots/a.mp4'},{id:'mB',name:'b.mov',type:'video',file:'b.mov',rel:'b.mov'},{id:'mC',name:'c.png',type:'image',file:'c.png',path:'/Volumes/x/c.png'}];
   const P=T.plan(T.geom()); const id=P.seq[2].id; D.bmedia.per={[id]:{on:true,asset:'mA',more:['mB','mC']}}; T.refresh(); const o=T.bldDefaults(); o.main.comp=comp; o.main.mediaPer=!!mp; o.l2.on=false; const pl=T.bldMake(o); const pb=pl.blocks.find(b=>b.media);
   let r; try{ r=GB_build(JSON.parse(JSON.stringify(pl))); }catch(e){ r='THROW '+e.message; }
   console.log(label.padEnd(24),String(r).slice(0,90),'| exprErr',exprErr.length,'| top',pb&&pb.media.path,'| more',pb&&pb.mediaMore?pb.mediaMore.map(m=>m.path+(m.precomp?' [pre:'+m.compName+']':'')).join(' ; '):'-','| media layers named',names.filter(n=>/Media \d|Top · |· Media$/.test(n)).length,'| names',names.filter(n=>/Top · |· Media$/.test(n)).slice(0,3).join(' / ')); };
 T.loadExample&&T.loadExample();
 go('gaps modules',()=>{ const D=T.D; D.fill.gap.on=true; D.fill.gap.ownLook=false; });
 go('gaps own look',()=>{ const D=T.D; D.fill.gap.on=true; D.fill.gap.ownLook=true; D.fill.gap.style={size:20,font:'Aeonik-Medium',textColor:'#00FF00'}; });
 const pl=T.payload(); const fonts=[...new Set((pl.gaps||[]).filter(i=>i.kind==='text').map(i=>i.font+'@'+i.size))]; console.log('gap fonts in payload',fonts.join(' '),'count',(pl.gaps||[]).length, 'block fonts',[...new Set(pl.blocks.flatMap(b=>(b.fill||[]).filter(i=>i.kind==='text').map(i=>i.font+'@'+i.size)))].join(' '));
 process.exit(0);
};
