module.exports=(T,fire,fireDoc,q)=>{
 let D=T.D; const res=[]; let nFail=0;
 const tab=w=>q('#layerTabs')._L.click[0]({target:{closest:()=>({dataset:{ltab:w}})}});
 function analyze(label){
  const G=T.geom(), P=T.plan(G), f=[]; const n=P.seq.length;
  if(!n){ f.push('no blocks'); return f; }
  if(P.T.some(t=>!isFinite(t))) f.push('NaN reveal');
  // reveal order (build part), ignoring per-block shifts
  const wf=P.walkFrom!=null?P.walkFrom:n; let prev=-1e9, bad=0; for(let i=0;i<wf;i++){ if(D.anim.dt&&D.anim.dt[P.seq[i].id]) continue; if(P.T[i]<prev-0.5) bad++; prev=Math.max(prev,P.T[i]); } if(bad) f.push('reveal order x'+bad);
  // camera smoothness
  if(P.cam&&P.cam.length>1){ const a=Math.floor(P.startF||0), b=Math.ceil(P.end); const xs=[]; for(let t=a;t<=b;t++){ const o=T.ev(P.cam,t,[0,0]); xs.push(o[0]); if(!isFinite(o[0])||!isFinite(o[1])) { f.push('NaN cam'); break; } }
    const v=[]; for(let i=1;i<xs.length;i++) v.push(xs[i]-xs[i-1]); const av=v.map(Math.abs).sort((x,y)=>x-y), p95=av[Math.floor(av.length*.95)]||0, mx=av[av.length-1]||0;
    if(mx>Math.max(60,5*p95)) f.push(`cam jump ${Math.round(mx)}px/f (p95 ${Math.round(p95)})`);
    let maxAcc=0; for(let i=1;i<v.length;i++) maxAcc=Math.max(maxAcc,Math.abs(v[i]-v[i-1])); if(maxAcc>Math.max(40,2.5*p95)) f.push(`cam jerk ${Math.round(maxAcc)}px/f² (p95 v ${Math.round(p95)})`);
    if(D.anim.mode==='camera'&&!P.beat){ // camera never runs ahead of the newest block (the frame shouldn't show empty space ahead of the line by more than half a screen)
    } }
  // exits after reveals
  if(P.exitT){ let e=0; P.exitT.forEach((x,i)=>{ if(x!=null&&x<P.T[i]) e++; }); if(e) f.push('exit before reveal x'+e); }
  // each block becomes visible
  let inv=0; P.seq.forEach((b,i)=>{ const qq=T.cellRect(G,b.c,b.r,b.w,b.h), t=P.T[i]+Math.max(1,Math.round(+D.anim.trans||1))+1; if(P.exitT&&P.exitT[i]!=null&&P.exitT[i]<=t) return; const st=T.blockState(P.tracks[b.id],t,qq); if(!(st.op>0.5&&st.w>1&&st.sx>0.5)) inv++; }); if(inv) f.push('never visible x'+inv);
  // hold respected
  if(D.exit.on&&D.exit.mode==='walk'&&D.exit.holdOn!==false&&P.walkT!=null&&!P.beat){ const lastB=Math.max(...P.T.slice(0,wf)); if(P.walkT-lastB<Math.min(12,+D.exit.walkHold||0)*0.5) f.push(`hold too short (${P.walkT-lastB}f)`); }
  if(P.end<Math.max(...P.T)) f.push('end before last reveal');
  return f;
 }
 function run(label,setup,opts){
  try{ T.resetDefaults(false); D=T.D; T.generateLine(true); setup&&setup(D); T.refresh(); const f=analyze(label);
   // preview + timeline + payload
   const G=T.geom(), P=T.plan(G); for(let t=0;t<P.end;t+=Math.max(1,Math.floor(P.end/12))) T.tlSetT(t); T.drawDope();
   const pl=T.payload(); if(!pl||!pl.blocks) f.push('no payload');
   if(f.length){ nFail++; res.push(`✗ ${label}: ${f.join(' · ')}`); } else res.push(`✓ ${label} (${P.seq.length} blocks, ${P.end}f)`);
  }catch(e){ nFail++; res.push(`✗ ${label}: THROW ${e.message} @ ${(e.stack.split('\n')[1]||'').trim()}`); }
  finally{ if(D.L2&&D.L2.active==='l2') tab('main'); }
 }
 const base=D=>{ D.exit=JSON.parse(JSON.stringify(D.exit)); };
 const exits={stay:D=>{D.exit.on=false;}, walkHold:D=>{Object.assign(D.exit,{on:true,mode:'walk',holdOn:true,walkHold:24});}, walkNoHold:D=>{Object.assign(D.exit,{on:true,mode:'walk',holdOn:false});}, eachLeaves:D=>{Object.assign(D.exit,{on:true,mode:'hold',hold:30});}, allLeave:D=>{Object.assign(D.exit,{on:true,mode:'end',at:24,stagger:3});}, behind:D=>{Object.assign(D.exit,{on:true,mode:'behind',line:10});}};
 const cams={curve:D=>{D.anim.mode='camera';D.anim.camMove='curve';}, step:D=>{D.anim.mode='camera';D.anim.camMove='step';}, reveal:D=>{D.anim.mode='reveal';}, push:D=>{D.anim.mode='push';}};
 for(const [ek,ef] of Object.entries(exits)) for(const [ck,cf] of Object.entries(cams)) for(const pace of [3,6]) for(const len of [48,120])
   run(`exit=${ek} cam=${ck} pace=${pace} len=${len}`,D=>{ ef(D); cf(D); D.anim.pace=pace; D.anim.lenF=len; });
 // orders, groups, endings
 run('push + rtl',D=>{cams.push(D);D.anim.order='rtl';exits.walkHold(D);});
 run('push + behind exit',D=>{cams.push(D);exits.behind(D);});
 for(const o of ['ltr','rtl']) for(const gc of [true,false]) for(const es of [true,false]) run(`order=${o} groupCol=${gc} endSingle=${es}`,D=>{D.anim.order=o;D.anim.groupCol=gc;D.rand.endSingle=es;exits.walkHold(D);});
 for(const row of [1,3,6]) run(`end row ${row} walkHold`,D=>{D.anim.ending='spot';D.anim.endRow=row;exits.walkHold(D);});
 // trims
 run('cut late blocks',D=>{exits.walkHold(D); T.refresh(); const P=T.plan(T.geom()); D.anim.cutAt=Math.round((P.T[2]+P.T[P.T.length-1])/2);});
 run('skip blocks',D=>{exits.walkNoHold(D); T.refresh(); const P=T.plan(T.geom()); D.anim.skip=[P.seq[3].id,P.seq[5].id];});
 run('shift blocks dt',D=>{exits.walkHold(D); T.refresh(); const P=T.plan(T.geom()); D.anim.dt={[P.seq[2].id]:8,[P.seq[4].id]:-4};});
 run('shift exits dx',D=>{exits.walkHold(D); T.refresh(); const P=T.plan(T.geom()); D.anim.dx={[P.seq[1].id]:10};});
 run('scene shorter (remapLen)',D=>{exits.walkHold(D); D.anim.remapLen=40;});
 run('scene longer (remapLen)',D=>{exits.walkHold(D); D.anim.remapLen=200;});
 run('start late',D=>{exits.walkHold(D); D.anim.startF=30;});
 run('start before 0',D=>{exits.walkHold(D); D.anim.startF=-20;});
 // extras
 run('zoom follow',D=>{exits.walkHold(D); D.anim.zoomOn=true; D.anim.zm.pts=[{f:0,v:100},{f:40,v:160},{f:90,v:120}];});
 run('z depth',D=>{exits.walkHold(D); D.anim.zd={on:true,pts:[{f:0,v:800},{f:40,v:0},{f:120,v:-200}]};});
 run('reveal zone animated',D=>{exits.walkHold(D); D.anim.rzOn=true; D.anim.rzPts=[{f:0,v:60},{f:60,v:95}];});
 const beats=[]; for(let f=10;f<300;f+=13+((f*7)%5)) beats.push(f);
 run('beat mode',D=>{ D.timing.beats=beats; D.timing.use='beats'; D.timing.sync=true; exits.stay(D); });
 run('beat mode + walk-off 0%',D=>{ D.timing.beats=beats; D.timing.sync=true; exits.walkHold(D); D.timing.outBeat=0; });
 run('beat mode + walk-off 100%',D=>{ D.timing.beats=beats; D.timing.sync=true; exits.walkHold(D); D.timing.outBeat=100; });
 run('beat mode + walk on',D=>{ D.timing.beats=beats.map(b=>b+60); D.timing.sync=true; D.timing.walkOn=true; exits.walkNoHold(D); });
 // layer 2
 run('layer 2 front',D=>{ exits.walkHold(D); D.timing.sync=false; tab('l2'); });
 run('layer 2 behind + xf',D=>{ exits.walkHold(D); tab('l2'); D.L2.z='behind'; const P=T.plan(T.geom()); D.anim.xf={[P.seq[0].id]:{x:20,z:-100,rz:10,s:120}}; D.anim.zord={[P.seq[1].id]:'front'}; });
 run('layer 2 walk-off',D=>{ exits.walkNoHold(D); tab('l2'); exits.walkHold(D); });
 console.log(res.join('\n')); console.log(`\n${res.length} scenarios · ${nFail} with issues`); process.exit(0);
};
