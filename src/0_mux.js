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

/* ================================================================ SVG CANVAS: a Canvas 2D look-alike that writes SVG
   The preview draws into it exactly as it draws on screen; shapes, text and transforms become vector SVG. */
function GBSvgCtx(W,H){
  const M=()=>[1,0,0,1,0,0], mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const ap=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]], f=v=>Math.round(v*100)/100, esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const out=[], defs=[]; let clipN=0, path=[], st={m:M(),fillStyle:'#000',strokeStyle:'#000',lineWidth:1,globalAlpha:1,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',dash:[],clip:null,lineCap:'butt',lineJoin:'miter'}; const stack=[];
  const meas=(()=>{ try{ return document.createElement('canvas').getContext('2d'); }catch(e){ return null; } })();
  const col=c=>typeof c==='string'?c:'#888';
  const clipA=()=>st.clip?` clip-path="url(#${st.clip})"`:'';
  const op=()=>st.globalAlpha<0.999?` opacity="${f(st.globalAlpha)}"`:'';
  const sc=()=>Math.sqrt(Math.abs(st.m[0]*st.m[3]-st.m[1]*st.m[2]))||1;
  const bb=()=>{ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; path.forEach(p=>{ if(p[0]==='Z') return; x0=Math.min(x0,p[1]); y0=Math.min(y0,p[2]); x1=Math.max(x1,p[1]); y1=Math.max(y1,p[2]); }); return [x0,y0,x1,y1]; };
  const off=b=>b[2]<-2||b[3]<-2||b[0]>W+2||b[1]>H+2;   /* entirely outside the frame: left out of the file */
  const pd=()=>path.map(s=>s[0]==='Z'?'Z':s[0]+f(s[1])+' '+f(s[2])).join('');
  const arcPts=(cx,cy,r,a0,a1,ccw)=>{ let d=a1-a0; if(ccw){ while(d>0) d-=Math.PI*2; } else { while(d<0) d+=Math.PI*2; } if(Math.abs(a1-a0)>=Math.PI*2-1e-6) d=ccw?-Math.PI*2:Math.PI*2; const n=Math.max(4,Math.ceil(Math.abs(d)/(Math.PI/24))), o=[]; for(let i=0;i<=n;i++){ const a=a0+d*i/n; o.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]); } return o; };
  let cur=[0,0]; const seg=(x,y,move)=>{ const p=ap(st.m,x,y); path.push([move?'M':'L',p[0],p[1]]); cur=[x,y]; };
  const ctx={ canvas:{width:W,height:H},
    save(){ stack.push(Object.assign({},st,{m:st.m.slice(),dash:st.dash.slice()})); }, restore(){ if(stack.length) st=stack.pop(); },
    setTransform(a,b,c,d,e,g){ if(a&&typeof a==='object') st.m=[a.a,a.b,a.c,a.d,a.e,a.f]; else st.m=[a,b,c,d,e,g]; }, resetTransform(){ st.m=M(); },
    transform(a,b,c,d,e,g){ st.m=mul(st.m,[a,b,c,d,e,g]); }, translate(x,y){ st.m=mul(st.m,[1,0,0,1,x,y]); }, scale(x,y){ st.m=mul(st.m,[x,0,0,y,0,0]); }, rotate(r){ const c=Math.cos(r),s=Math.sin(r); st.m=mul(st.m,[c,s,-s,c,0,0]); },
    getTransform(){ try{ return new DOMMatrix(st.m); }catch(e){ return {a:st.m[0],b:st.m[1],c:st.m[2],d:st.m[3],e:st.m[4],f:st.m[5]}; } },
    beginPath(){ path=[]; }, moveTo(x,y){ seg(x,y,true); }, lineTo(x,y){ seg(x,y,!path.length); }, closePath(){ path.push(['Z']); },
    rect(x,y,w,h){ seg(x,y,true); seg(x+w,y); seg(x+w,y+h); seg(x,y+h); path.push(['Z']); },
    arc(cx,cy,r,a0,a1,ccw){ arcPts(cx,cy,r,a0,a1,ccw).forEach((p,i)=>seg(p[0],p[1],i===0&&!path.length)); },
    ellipse(cx,cy,rx,ry,rot,a0,a1,ccw){ ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot||0); ctx.scale(rx,ry); ctx.arc(0,0,1,a0,a1,ccw); ctx.restore(); },
    arcTo(x1,y1,x2,y2){ seg(x1,y1); seg(x2,y2); },
    quadraticCurveTo(cx,cy,x,y){ const [x0,y0]=cur; for(let i=1;i<=12;i++){ const t=i/12, u=1-t; seg(u*u*x0+2*u*t*cx+t*t*x,u*u*y0+2*u*t*cy+t*t*y); } },
    bezierCurveTo(c1x,c1y,c2x,c2y,x,y){ const [x0,y0]=cur; for(let i=1;i<=16;i++){ const t=i/16, u=1-t; seg(u*u*u*x0+3*u*u*t*c1x+3*u*t*t*c2x+t*t*t*x,u*u*u*y0+3*u*u*t*c1y+3*u*t*t*c2y+t*t*t*y); } },
    fill(){ if(!path.length||off(bb())) return; out.push(`<path d="${pd()}" fill="${col(st.fillStyle)}"${op()}${clipA()}/>`); },
    stroke(){ if(!path.length||off(bb())) return; out.push(`<path d="${pd()}" fill="none" stroke="${col(st.strokeStyle)}" stroke-width="${f(st.lineWidth*sc())}"${st.dash.length?` stroke-dasharray="${st.dash.map(v=>f(v*sc())).join(' ')}"`:''} stroke-linecap="${st.lineCap}" stroke-linejoin="${st.lineJoin}"${op()}${clipA()}/>`); },
    clip(){ const b=bb(); if(!path.length) return; const c=st.clipBox; st.clipBox=c?[Math.max(c[0],b[0]),Math.max(c[1],b[1]),Math.min(c[2],b[2]),Math.min(c[3],b[3])]:b; },   /* no clip groups on shapes or text — only pictures (media) are cropped to their block */
    fillRect(x,y,w,h){ const p0=path; path=[]; ctx.rect(x,y,w,h); ctx.fill(); path=p0; },
    strokeRect(x,y,w,h){ const p0=path; path=[]; ctx.rect(x,y,w,h); ctx.stroke(); path=p0; },
    clearRect(){},
    setLineDash(a){ st.dash=(a||[]).slice(); }, getLineDash(){ return st.dash.slice(); },
    measureText(t){ if(meas){ meas.font=st.font; return meas.measureText(t); } return {width:String(t).length*6}; },
    fillText(t,x,y){ t=String(t); if(!t.trim()) return; const fm=/(italic\s+)?(\d{3}|bold|normal)?\s*([\d.]+)px\s+(.+)/.exec(st.font)||[], size=+fm[3]||10, fam=String(fm[4]||'sans-serif').split(',')[0].trim().replace(/^["']|["']$/g,'');
      let w=t.length*size*0.6, asc=size*0.8, desc=size*0.2; if(meas){ meas.font=st.font; try{ meas.letterSpacing=st.letterSpacing||'0px'; }catch(e){} const mt=meas.measureText(t), mh=meas.measureText('Hg'); w=mt.width; asc=mh.fontBoundingBoxAscent!=null?mh.fontBoundingBoxAscent:(mh.actualBoundingBoxAscent||asc); desc=mh.fontBoundingBoxDescent!=null?mh.fontBoundingBoxDescent:(mh.actualBoundingBoxDescent||desc); }
      const al=st.textAlign, bl=st.textBaseline; let dx=al==='center'?-w/2:(al==='right'||al==='end')?-w:0, dy=bl==='top'||bl==='hanging'?asc:bl==='middle'?(asc-desc)/2:bl==='bottom'||bl==='ideographic'?-desc:0;
      if(meas){ try{ /* exactly where the canvas puts it: the same text measured with this alignment / baseline vs left / alphabetic */
        meas.textAlign=al; meas.textBaseline=bl; const a1=meas.measureText(t); meas.textAlign='left'; meas.textBaseline='alphabetic'; const a0=meas.measureText(t);
        if(a1.actualBoundingBoxAscent!=null&&a0.actualBoundingBoxAscent!=null){ dy=a0.actualBoundingBoxAscent-a1.actualBoundingBoxAscent; dx=a0.actualBoundingBoxLeft-a1.actualBoundingBoxLeft; } }catch(e){} }
      const m=mul(st.m,[1,0,0,1,x+dx,y+dy]); { const k=Math.hypot(m[0],m[1])||1, x1=m[4]+w*k, yT=m[5]-asc*k, yB=m[5]+desc*k; if(x1<0||m[4]>W||yB<0||yT>H) return; }   /* outside the frame */
      const ls=parseFloat(st.letterSpacing)||0, plain=Math.abs(m[0]-1)<1e-6&&Math.abs(m[3]-1)<1e-6&&!m[1]&&!m[2];
      out.push(`<text ${plain?`x="${f(m[4])}" y="${f(m[5])}"`:`transform="matrix(${m.map(f).join(' ')})"`} font-family="${esc(fam)}" font-size="${f(size)}"${fm[2]&&fm[2]!=='normal'?` font-weight="${fm[2]}"`:''}${fm[1]?' font-style="italic"':''}${ls?` letter-spacing="${f(ls)}"`:''} fill="${col(st.fillStyle)}"${op()} xml:space="preserve">${esc(t)}</text>`); },
    strokeText(t,x,y){ const fs=st.fillStyle; st.fillStyle='none'; ctx.fillText(t,x,y); st.fillStyle=fs; },
    drawImage(img,a,b,c,d,e,g,h,i){ let sx=0,sy=0,sw=img.width||img.videoWidth||img.naturalWidth,sh=img.height||img.videoHeight||img.naturalHeight,dx,dy,dw,dh;
      if(e===undefined){ dx=a; dy=b; dw=c===undefined?sw:c; dh=d===undefined?sh:d; } else { sx=a; sy=b; sw=c; sh=d; dx=e; dy=g; dw=h; dh=i; }
      let url=null; try{ const cv=document.createElement('canvas'); cv.width=Math.max(1,Math.round(Math.min(sw,1600))); cv.height=Math.max(1,Math.round(sh*cv.width/Math.max(1,sw))); cv.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,cv.width,cv.height); url=cv.toDataURL('image/jpeg',.85); }catch(err){ url=null; }
      const m=mul(st.m,[1,0,0,1,dx,dy]);
      let ca=''; const cb=st.clipBox; if(cb&&!(cb[0]<=0.5&&cb[1]<=0.5&&cb[2]>=W-0.5&&cb[3]>=H-0.5)){ const id='c'+(++clipN); defs.push(`<clipPath id="${id}"><rect x="${f(cb[0])}" y="${f(cb[1])}" width="${f(Math.max(0,cb[2]-cb[0]))}" height="${f(Math.max(0,cb[3]-cb[1]))}"/></clipPath>`); ca=` clip-path="url(#${id})"`; }
      if(url) out.push(`<g${ca}><image transform="matrix(${m.map(f).join(' ')})" width="${f(dw)}" height="${f(dh)}" preserveAspectRatio="none" href="${url}"${op()}/></g>`);
      else out.push(`<rect transform="matrix(${m.map(f).join(' ')})" width="${f(dw)}" height="${f(dh)}" fill="#3a3a3a"${op()}${clipA()}><title>media</title></rect>`); },
    createLinearGradient(){ return {addColorStop(){}}; }, createRadialGradient(){ return {addColorStop(){}}; }, createPattern(){ return null; },
    toSVG(bg){ return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<defs>${defs.join('')}</defs>\n${out.join('\n')}\n</svg>`; } };
  ['fillStyle','strokeStyle','lineWidth','globalAlpha','font','textAlign','textBaseline','lineCap','lineJoin','letterSpacing'].forEach(k=>Object.defineProperty(ctx,k,{get:()=>st[k],set:v=>{ st[k]=v; }}));
  ['globalCompositeOperation','imageSmoothingEnabled','shadowBlur','shadowColor','miterLimit','lineDashOffset','filter'].forEach(k=>{ let v; Object.defineProperty(ctx,k,{get:()=>v,set:x=>{ v=x; }}); });
  return ctx; }
