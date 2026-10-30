module.exports=(T,fire,fireDoc,q)=>{
 const res=[]; let nFail=0;
 const tab=w=>q('#layerTabs')._L.click[0]({target:{closest:()=>({dataset:{ltab:w}})}});
 const wp=id=>{ (document.__L=document.__L||0); const btn={dataset:{wp:id}}; /* use the delegated click handler */ };
 // the preset click handler is delegated on document: call it through the DOM listeners
 const DL=require('/sessions/vibrant-tender-fermat/mnt/outputs/v3/t/dom.js').DL;
 const press=id=>(DL.click||[]).forEach(f=>{ try{ f({target:{closest:s=>s==='[data-wp]'?{dataset:{wp:id}}:null}}); }catch(e){} });
 const smooth=(P,step)=>{ const f=[]; if(!P.cam||P.cam.length<2) return f; const a=Math.floor(P.startF||0), b=Math.ceil(P.end); const xs=[]; for(let t=a;t<=b;t++) xs.push(T.ev(P.cam,t,[0,0])[0]);
   const v=[]; for(let i=1;i<xs.length;i++) v.push(xs[i]-xs[i-1]); const av=v.map(Math.abs).sort((x,y)=>x-y), p95=av[Math.floor(av.length*.95)]||0, mx=av[av.length-1]||0; let acc=0; for(let i=1;i<v.length;i++) acc=Math.max(acc,Math.abs(v[i]-v[i-1]));
   if(!step&&mx>Math.max(60,5*p95)) f.push(`cam jump ${Math.round(mx)}`); if(!step&&acc>Math.max(40,2.5*p95)) f.push(`cam jerk ${Math.round(acc)}`); return f; };
 const check=(label,fn)=>{ try{ const f=fn()||[]; if(f.length){ nFail++; res.push(`✗ ${label}: ${f.join(' · ')}`);} else res.push(`✓ ${label}`); }catch(e){ nFail++; res.push(`✗ ${label}: THROW ${e.message} ${(e.stack.split('\n')[1]||'').trim()}`); } };
 const MAIN=['stay','hold-off','through','quick-long','slow','fade-out','trail','step'], L2=['pin-stay','pin-both','hold-feature','behind-big','accent'];
 for(let seed=0;seed<3;seed++) for(const id of MAIN){
  check(`main ${id} #${seed}`,()=>{ T.resetDefaults(false); const D=T.D; T.generateLine(true); D.fill.on=true; D.bmedia.on=seed===1; press(id); T.refresh();
   const G=T.geom(), P=T.plan(G), f=[], n=P.seq.length, wf=P.walkFrom!=null?P.walkFrom:n, lastB=Math.max(...P.T.slice(0,wf));
   if(!n) return ['no blocks'];
   f.push(...smooth(P,id==='step'));
   const ex=P.exitT||[];
   if(id==='stay'&&ex.some(x=>x!=null)) f.push('blocks leave but should stay');
   if(id==='hold-off'||id==='quick-long'||id==='slow'||id==='step'){ if(P.walkT==null) f.push('no walk-off'); else { const hold=P.walkT-lastB; if(hold<Math.min(+D.exit.walkHold,40)*0.5) f.push(`hold only ${hold}f (want ~${D.exit.walkHold})`); } if(!ex.some(x=>x!=null)) f.push('nothing leaves'); }
   if(id==='through'){ if(P.walkT==null) f.push('no walk-off'); else if(P.walkT-lastB>Math.max(18,(+D.anim.pace)*4)) f.push(`unexpected hold ${P.walkT-lastB}f`); }
   if(id==='fade-out'){ const e2=ex.slice(0,wf).filter(x=>x!=null); if(e2.length<wf*0.9) f.push('not all fade'); if(e2.some(x=>x<=lastB)) f.push('fade starts before the build ends'); }
   if(id==='trail'){ const d=ex.map((x,i)=>x!=null?x-P.T[i]:null).filter(x=>x!=null); if(!d.length) f.push('no exits'); else { const mx=Math.max(...d), mn=Math.min(...d); if(mn<5) f.push(`a block leaves after only ${mn}f`); if(mx>200) f.push(`a block stays ${mx}f`); } }
   // content never outlives its block
   if(P.fillEnd) P.seq.forEach((b,i)=>{ const fe=P.fillEnd[b.id]; if(ex[i]!=null&&fe!=null&&fe>ex[i]+1) f.push(`content outlives block ${i} (${fe}>${ex[i]})`); });
   // everything visible at some point, nothing before reveal
   let inv=0; P.seq.forEach((b,i)=>{ const qq=T.cellRect(G,b.c,b.r,b.w,b.h), tt=P.T[i]+Math.max(2,Math.round(+D.anim.trans||1)+1); if(ex[i]!=null&&ex[i]<=tt) return; const st=T.blockState(P.tracks[b.id],tt,qq), st0=T.blockState(P.tracks[b.id],P.T[i]-2,qq); if(!(st.op>0.5&&st.w>1)) inv++; if(st0.op>0.01&&st0.w>1&&st0.sx>0.01) f.push('visible before reveal'); }); if(inv) f.push(`never visible x${inv}`);
   // trims
   const PC=P.c||P, cut=Math.round((PC.T[1]+Math.max(...PC.T.slice(0,wf)))/2); D.anim.cutAt=cut; T.refresh(); const Pc=T.plan(G); const wf2=Pc.walkFrom!=null?Pc.walkFrom:Pc.seq.length; if((Pc.c||Pc).T.slice(0,wf2).some(t=>t>cut+1)) f.push('cut: late blocks still there (block clock)'); { let mv=0; Pc.seq.slice(0,wf2).forEach((b,i)=>{ const j=P.seq.findIndex(x=>x.id===b.id); if(j>=0&&Math.abs(P.T[j]-Pc.T[i])>(id==='step'?99:3)) mv++; }); if(mv) f.push(`cut: ${mv} kept blocks moved`); } f.push(...smooth(Pc,id==='step').map(x=>'after cut: '+x));
   D.anim.cutAt=null; D.anim.skip=[P.seq[2].id]; T.refresh(); const Ps=T.plan(G); if(Ps.seq.some(b=>b.id===P.seq[2].id)) f.push('skip: block still there');
   D.anim.skip=[]; T.refresh(); const pl=T.payload(); if(!pl.blocks.length) f.push('no payload blocks'); if(seed===1&&!pl.blocks.some(b=>b.media)) f.push('media missing in export');
   pl.blocks.forEach((b,i)=>{ if(b.tOut!=null&&b.tIn!=null&&b.tOut<=b.tIn) f.push(`export: block ${i} leaves before it arrives`); });
   return [...new Set(f)]; });
 }
 for(const mid of ['hold-off','stay','through']) for(const id of L2){
  check(`L2 ${id} over main ${mid}`,()=>{ T.resetDefaults(false); const D=T.D; T.generateLine(true); press(mid); T.refresh(); const Mp=T.plan(T.geom()); const mainStart=Mp.startF, mainHold=Mp.holdT!=null?Mp.holdT:Mp.landT, mainWalk=Mp.walkT;
   tab('l2'); press(id); T.refresh(); const G=T.geom(), P=T.plan(G), f=[];
   if(!P.seq.length) f.push('layer 2 empty');
   if(P.T[0]<mainStart-1) f.push('layer 2 starts before the main walk');
   if(id==='hold-feature'){ if(P.seq.filter(b=>!b.stack).length!==3) f.push(`want 3 blocks, got ${P.seq.length}`); if(mainHold!=null&&P.T[0]<mainHold-12) f.push(`lands before the hold (${P.T[0]} < ${mainHold})`); }
   if(id==='pin-both'&&mid!=='stay'){ const ex=(P.exitT||[]).filter(x=>x!=null); if(!ex.length) f.push('layer 2 never walks off'); }
   if(id==='behind-big'&&D.L2.z!=='behind') f.push('not behind');
   // the camera comes from the main walk
   T.tlSetT(Math.round(P.end/2)); T.drawDope();
   const pl=T.payload(); if(!pl.layer2||!pl.layer2.blocks.length) f.push('layer 2 missing from export'); if(pl.blocks.length!==Mp.seq.length) f.push(`main export changed (${pl.blocks.length} vs ${Mp.seq.length})`);
   tab('main'); const Pm2=T.plan(T.geom()); if(Pm2.seq.length!==Mp.seq.length) f.push('main walk changed by layer 2');
   return f; });
 }
 console.log(res.filter(r=>r[0]==='✗').join('\n')||'(no failures)'); console.log(`\n${res.length} checks · ${nFail} failing`); process.exit(0);
};
