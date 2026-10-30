module.exports=async(T)=>{ try{ const fs=require('fs');
 const cnt=txt=>{const f={}; for(const m of txt.matchAll(/fill="([^"]+)"/g)) f[m[1]]=(f[m[1]]||0)+1; return JSON.stringify(f);};
 const view=()=>{ const G=T.geom(); const g=T.GBSvgCtx(G.W,G.H); const sv=Object.assign({},T.V); Object.assign(T.V,{sc:1,ox:0,oy:0,dpr:1,cw:G.W,ch:G.H}); T.renderFrame(g,false); Object.assign(T.V,sv); return cnt(g.toSVG()); };
 const exp=async()=>{ let blob=null; global.URL.createObjectURL=b=>{ blob=b; return 'blob:x'; }; await T.exportVideo({fmt:'svg',layers:{bg:true,cells:true,rules:true,main:true,l2:true,content:true,media:true,echo:true,trans:true},size:'1',centreRules:true}); return cnt(await blob.text()); };
 for(const f of [null,'62','52']){ if(f) T.setDocX(JSON.parse(fs.readFileSync('mnt/uploads/GridBlocks_1920x1080 ('+f+').json','utf8')).doc); else T.resetDefaults();
  const m0=T.D.anim.mode; T.D.anim.mode='static'; T.refresh(); T.U.t=1; T.refresh();
  console.log(f||'def','VIEW',view()); console.log('  EXPORT',await exp(), 'mode after',T.D.anim.mode);
  T.D.anim.mode=m0; T.refresh(); console.log('  back to',m0,'seq',T.plan(T.geom()).seq.length); }
}catch(e){console.log('ERR',e.stack);} process.exit(0);};
