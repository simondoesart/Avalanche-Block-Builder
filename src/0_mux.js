/* ================================================================ VIDEO EXPORT: a small MP4 / QuickTime writer
   One video track (H.264 'avc1' from WebCodecs, or PNG frames 'png ' — QuickTime, keeps alpha) and optionally one
   audio track (AAC 'mp4a'). Samples are streamed out as they arrive (sink(bytes) in order); the moov goes at the end
   and the mdat size is patched at finish via patch(offset, bytes) — or, without patch, the header is returned first. */
const GBMux=(()=>{
  const u8=n=>new Uint8Array(n);
  const be32=v=>{const b=u8(4);new DataView(b.buffer).setUint32(0,v>>>0);return b;};
  const be16=v=>{const b=u8(2);new DataView(b.buffer).setUint16(0,v&0xffff);return b;};
  const be64=v=>{const b=u8(8),d=new DataView(b.buffer);d.setUint32(0,Math.floor(v/4294967296));d.setUint32(4,v>>>0);return b;};
  const str=s=>{const b=u8(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i)&255;return b;};
  const cat=parts=>{let n=0;parts.forEach(p=>n+=p.length);const o=u8(n);let k=0;parts.forEach(p=>{o.set(p,k);k+=p.length;});return o;};
  const box=(type,...parts)=>{const body=cat(parts.flat());return cat([be32(body.length+8),str(type),body]);};
  const full=(type,ver,flags,...parts)=>box(type,u8([ver,(flags>>16)&255,(flags>>8)&255,flags&255]),...parts);
  const zeros=n=>u8(n);
  const MATRIX=cat([be32(0x00010000),be32(0),be32(0),be32(0),be32(0x00010000),be32(0),be32(0),be32(0),be32(0x40000000)]);
  function create(o){
    /* o: {qt:bool, width,height, fps, video:{codec:'avc1'|'png ', description?:Uint8Array, depth}, audio?:{sampleRate,channels,description}, sink(bytes), patch?(offset,bytes)} */
    const qt=!!o.qt, vts=Math.max(1,Math.round(o.fps*1000)), vdur=1000;   // video timescale & per-frame duration
    const V={sizes:[],offs:[],sync:[],n:0}, A=o.audio?{sizes:[],offs:[],n:0,durs:[]}:null;
    let pos=0; const emit=b=>{o.sink(b);pos+=b.length;};
    const ftyp=qt?box('ftyp',str('qt  '),be32(0x200),str('qt  ')):box('ftyp',str('isom'),be32(0x200),str('isom'),str('iso2'),str('avc1'),str('mp41'));
    emit(ftyp); const mdatAt=pos; emit(cat([be32(1),str('mdat'),be64(0)]));   // 64-bit size, patched at the end
    function addVideo(bytes,key){ V.offs.push(pos); V.sizes.push(bytes.length); if(key) V.sync.push(V.n+1); V.n++; emit(bytes); }
    function addAudio(bytes,dur){ if(!A) return; A.offs.push(pos); A.sizes.push(bytes.length); A.durs.push(dur||1024); A.n++; emit(bytes); }
    function stbl(T,entry,isV){
      const stts=(()=>{ if(isV) return full('stts',0,0,be32(1),be32(T.n),be32(vdur)); const runs=[]; T.durs.forEach(d=>{ const r=runs[runs.length-1]; if(r&&r[1]===d) r[0]++; else runs.push([1,d]); });
        return full('stts',0,0,be32(runs.length),...runs.map(r=>cat([be32(r[0]),be32(r[1])]))); })();
      const stsc=full('stsc',0,0,be32(1),be32(1),be32(1),be32(1));   // one sample per chunk
      const stsz=full('stsz',0,0,be32(0),be32(T.n),...T.sizes.map(be32));
      const big=T.offs.some(x=>x>4294967295);
      const stco=big?full('co64',0,0,be32(T.n),...T.offs.map(be64)):full('stco',0,0,be32(T.n),...T.offs.map(be32));
      const parts=[full('stsd',0,0,be32(1),entry),stts,stsc,stsz,stco];
      if(isV&&V.sync.length&&V.sync.length<T.n) parts.splice(2,0,full('stss',0,0,be32(V.sync.length),...V.sync.map(be32)));
      return box('stbl',...parts); }
    function hdlr(kind,name,ct){ return qt?full('hdlr',0,0,str(ct||'mhlr'),str(kind),str('appl'),be32(0),be32(0),u8([name.length]),str(name)):full('hdlr',0,0,be32(0),str(kind),zeros(12),str(name),u8([0])); }
    function videoEntry(){ const v=o.video, nm=v.codec==='png '?'PNG':'AVC Coding', cn=u8(32); cn[0]=Math.min(31,nm.length); cn.set(str(nm).slice(0,31),1);
      const parts=[zeros(6),be16(1),be16(0),be16(0),qt?str('appl'):be32(0),be32(qt?512:0),be32(qt?512:0),be16(o.width),be16(o.height),be32(0x00480000),be32(0x00480000),be32(0),be16(1),cn,be16(v.depth||24),be16(0xffff)];
      if(v.codec==='avc1'&&v.description) parts.push(box('avcC',v.description));
      return box(v.codec,...parts); }
    function audioEntry(){ const a=o.audio, asc=a.description;
      const desc=asc?cat([u8([0x05,asc.length]),asc]):u8(0);
      const dcd=cat([u8([0x04,13+desc.length,0x40,0x15,0,0,0]),be32(0),be32(0),desc]);
      const es=cat([u8([0x03,3+dcd.length+3]),be16(1),u8([0]),dcd,u8([0x06,1,2])]);
      return box('mp4a',zeros(6),be16(1),zeros(8),be16(a.channels),be16(16),be16(0),be16(0),be32((a.sampleRate&0xffff)*65536),full('esds',0,0,es)); }
    function trak(id,isV,ts,dur,mvDur){
      const tk=full('tkhd',0,3,be32(0),be32(0),be32(id),be32(0),be32(mvDur),zeros(8),be16(0),be16(0),be16(isV?0:0x0100),be16(0),MATRIX,be32(isV?o.width*65536:0),be32(isV?o.height*65536:0));
      const md=full('mdhd',0,0,be32(0),be32(0),be32(ts),be32(dur),be16(qt?0:0x55c4),be16(0));
      const mh=isV?full('vmhd',0,1,be16(0),zeros(6)):full('smhd',0,0,be16(0),be16(0));
      const dinf=box('dinf',full('dref',0,0,be32(1),full(qt?'alis':'url ',0,1)));
      const minf=box('minf',mh,...(qt?[hdlr('alis','Data Handler','dhlr')]:[]),dinf,stbl(isV?V:A,isV?videoEntry():audioEntry(),isV));
      return box('trak',tk,box('mdia',md,hdlr(isV?'vide':'soun',isV?'VideoHandler':'SoundHandler'),minf)); }
    function finish(){
      const mdatSize=pos-mdatAt, vDurMv=Math.round(V.n*vdur/vts*1000);
      const aTot=A?A.durs.reduce((s,d)=>s+d,0):0, aDurMv=A?Math.round(aTot/o.audio.sampleRate*1000):0, mvDur=Math.max(vDurMv,aDurMv);
      const mvhd=full('mvhd',0,0,be32(0),be32(0),be32(1000),be32(mvDur),be32(0x00010000),be16(0x0100),zeros(10),MATRIX,zeros(24),be32(A?3:2));
      const moov=box('moov',mvhd,trak(1,true,vts,V.n*vdur,vDurMv),...(A&&A.n?[trak(2,false,o.audio.sampleRate,aTot,aDurMv)]:[]));
      emit(moov); const hdr=cat([be32(1),str('mdat'),be64(mdatSize)]);
      if(o.patch) o.patch(mdatAt,hdr); return {mdatAt,hdr,size:pos}; }
    return {addVideo,addAudio,finish};
  }
  /* Annex B → AVCC (for tests and for encoders that hand out start codes) */
  function annexToAvcc(b){ const out=[]; let i=0, st=-1; const nal=(a,z)=>{ let e=z; while(e>a&&b[e-1]===0) e--; if(e>a){ const n=b.subarray(a,e); out.push(be32(n.length),n); } };
    while(i+3<=b.length){ const sc3=b[i]===0&&b[i+1]===0&&b[i+2]===1; if(sc3){ if(st>=0) nal(st,i); st=i+3; i+=3; } else i++; }
    if(st>=0) nal(st,b.length); return cat(out); }
  return {create,annexToAvcc,cat,str};
})();
