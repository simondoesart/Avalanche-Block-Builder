module.exports=async(T,fire,fireDoc,q)=>{ try{ const fs=require('fs'); const doc=JSON.parse(fs.readFileSync('mnt/uploads/GridBlocks_1920x1080 (62).json','utf8')).doc; T.setDocX(doc); T.refresh();
 for(const t of [120,300,777]){ T.tlSetT(t); let blob=null; global.URL.createObjectURL=b=>{ blob=b; return 'blob:x'; };
  await T.exportVideo({fmt:'svg',layers:{bg:true,cells:true,rules:true,main:true,l2:true,content:true,media:true,echo:true,trans:true},size:'1',centreRules:true});
  const txt=await blob.text(); const xs=[...txt.matchAll(/<path d="M([\d.-]+) [\d.-]+L([\d.-]+) [\d.-]+L[\d.-]+ [\d.-]+L[\d.-]+ [\d.-]+Z" fill="#3B484B"/g)].map(m=>(+m[1]+ +m[2])/2).filter(x=>x>=0&&x<=1920).sort((a,b)=>a-b);
  console.log('f'+t,'rule x:',xs.map(Math.round).join(','),'| left margin',Math.round(xs[0]),'right margin',Math.round(1920-xs[xs.length-1])); }
}catch(e){console.log('ERR',e.stack);} process.exit(0);};
