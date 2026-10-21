/* Grid Blocks — After Effects host script (ExtendScript / ES3).
   Loaded by the panel at startup; also embedded in exported .jsx files. */

function GB_esc(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\r\n\t]/g," ");}

function GB_getComp(){
  try{
    var c=app.project.activeItem;
    if(!(c && c instanceof CompItem)) return '{"ok":false}';
    return '{"ok":true,"name":"'+GB_esc(c.name)+'","w":'+c.width+',"h":'+c.height+',"fps":'+c.frameRate+',"dur":'+c.duration+'}';
  }catch(e){return '{"ok":false,"err":"'+GB_esc(e.toString())+'"}';}
}

/* ---------- fonts (AE 2024+ exposes app.fonts) ---------- */
function GB_clean(s){return String(s).replace(/[\t\r\n]/g," ");}
/* PostScript names AE can't find (AE 2024+: app.fonts; older versions can't tell) */
function GB_missingFonts(list){
  var miss=[], i;
  if(!list||!list.length) return miss;
  try{ if(!app.fonts||!app.fonts.getFontsByPostScriptName) return miss; }catch(e0){ return miss; }
  for(i=0;i<list.length;i++){
    try{ var r=app.fonts.getFontsByPostScriptName(list[i][0]); if(!r||!r.length) miss.push(list[i][1]+" ("+list[i][0]+")"); }catch(e){}
  }
  return miss;
}
/* read the active comp for timing: length, fps, markers; optionally the per-frame loudness of its first audio layer */
/* audio layers in the active comp: file path + where the clip sits in time (for the panel to load and play) */
function GB_compAudio(){
  var c=app.project.activeItem; if(!(c&&c instanceof CompItem)) return "ERR|Open a comp first";
  var out=[], i;
  for(i=1;i<=c.numLayers;i++){ var L=c.layer(i);
    try{ if(!L.hasAudio||(L.comment&&String(L.comment).indexOf("GridBlocks")===0)) continue;
      var src=L.source, path="", kind="other";
      try{ if(src instanceof FootageItem&&src.file){ path=src.file.fsName; kind=src.hasVideo?"video":"audio"; } else if(src instanceof CompItem) kind="comp"; }catch(eS){}
      out.push('{"name":"'+GB_esc(L.name)+'","index":'+i+',"path":"'+GB_esc(path)+'","kind":"'+kind+'","start":'+L.startTime+',"in":'+L.inPoint+',"out":'+L.outPoint+',"stretch":'+L.stretch+',"on":'+(L.audioEnabled?'true':'false')+',"remap":'+(L.timeRemapEnabled?'true':'false')+'}');
    }catch(e){}
  }
  return 'OK|{"name":"'+GB_esc(c.name)+'","fps":'+c.frameRate+',"dur":'+c.duration+',"layers":['+out.join(",")+']}';
}
function GB_readComp(analyse){
  var c=app.project.activeItem; if(!(c&&c instanceof CompItem)) return "ERR|Open a comp first";
  var i, mk=[], mp=c.markerProperty, s;
  for(i=1;i<=mp.numKeys;i++){ var mv=mp.keyValue(i); if(!(mv&&String(mv.comment).indexOf("GB · ")===0)) mk.push(Math.round(mp.keyTime(i)*1000)/1000); }
  var aud=null;
  for(i=1;i<=c.numLayers;i++){ var L=c.layer(i); try{ if(L.hasAudio&&L.audioEnabled&&!(L.comment&&String(L.comment).indexOf("GridBlocks")===0)){aud=L;break;} }catch(e0){} }
  if(aud){ try{ var lm=aud.property("ADBE Marker"); for(i=1;i<=lm.numKeys;i++) mk.push(Math.round(lm.keyTime(i)*1000)/1000); }catch(e1){} }
  s='{"name":"'+GB_esc(c.name)+'","dur":'+c.duration+',"fps":'+c.frameRate+',"markers":['+mk.join(",")+']';
  if(analyse&&aud){
    app.beginUndoGroup("Grid Blocks: read audio");
    var amp=[], tmp=null;
    try{
      for(i=1;i<=c.numLayers;i++) c.layer(i).selected=false;
      aud.selected=true;
      app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes"));
      tmp=c.layer(1);
      var sl=tmp.property("ADBE Effect Parade").property(3).property(1);   // Both Channels › Slider
      var n=Math.floor(c.duration*c.frameRate);
      for(i=0;i<n;i++) amp.push(Math.round(sl.valueAtTime(i/c.frameRate,false)*1000)/1000);
    }catch(e2){ amp=[]; }
    try{ if(tmp&&tmp.name.indexOf("Audio Amplitude")>=0) tmp.remove(); }catch(e3){}
    app.endUndoGroup();
    s+=',"audioName":"'+GB_esc(aud.name)+'","amp":['+amp.join(",")+']';
  }
  return "OK|"+s+"}";
}
function GB_getFonts(){
  try{
    if(!app.fonts) return "NONE";
    var all=app.fonts.allFonts, out=[], i, j, f;
    if(!all||!all.length) return "NONE";
    for(i=0;i<all.length;i++){
      var g=all[i];
      if(g && g.postScriptName){g=[g];}
      for(j=0;j<g.length;j++){f=g[j];out.push(GB_clean(f.familyName)+"\t"+GB_clean(f.styleName)+"\t"+GB_clean(f.postScriptName));}
    }
    return out.join("\n");
  }catch(e){return "NONE";}
}

/* ---------- storage (library, autosave, files) ---------- */
function GB_dir(){
  var f=new Folder(Folder.userData.fsName+"/GridBlocks");
  if(!f.exists) f.create();
  return f;
}
function GB_readText(name){
  try{
    var f=new File(GB_dir().fsName+"/"+name);
    if(!f.exists) return "";
    f.encoding="UTF-8"; f.open("r"); var s=f.read(); f.close(); return s;
  }catch(e){return "";}
}
function GB_writeText(name,s){
  try{
    var f=new File(GB_dir().fsName+"/"+name);
    f.encoding="UTF-8"; f.open("w"); f.write(s); f.close(); return "OK";
  }catch(e){return "ERR|"+e.toString();}
}
function GB_isWin(){return $.os.indexOf("Windows")>=0;}
function GB_saveDialog(s,defName){
  try{
    var f=new File(Folder.myDocuments.fsName+"/"+(defName||"GridBlocks.json"));
    f=f.saveDlg("Save Grid Blocks layout",GB_isWin()?"JSON:*.json":undefined);
    if(!f) return "CANCEL";
    if(!/\.json$/i.test(f.name)) f=new File(f.fsName+".json");
    f.encoding="UTF-8"; f.open("w"); f.write(s); f.close();
    return "OK|"+f.fsName;
  }catch(e){return "ERR|"+e.toString();}
}
function GB_openDialog(){
  try{
    var filt=GB_isWin()?"Grid Blocks layout:*.json;*.jsx":function(f){return (f instanceof Folder)||/\.(json|jsx)$/i.test(f.name);};
    var f=File.openDialog("Open Grid Blocks layout",filt,false);
    if(!f) return "CANCEL";
    f.encoding="UTF-8"; f.open("r"); var s=f.read(); f.close();
    return "OK|"+s;
  }catch(e){return "ERR|"+e.toString();}
}

/* ---------- layer helpers ---------- */
function GB_xf(L){return L.property("ADBE Transform Group");}
function GB_shapeLayer(comp,name,groupName){
  var L=comp.layers.addShape();
  L.name=name;
  var g=L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name=groupName||name;
  return L;
}
function GB_contents(L){return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");}
function GB_addRect(L,w,h,cx,cy){
  var r=GB_contents(L).addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([w,h]);
  r.property("ADBE Vector Rect Position").setValue([cx,cy]);
}
function GB_fill(L,color){
  var f=GB_contents(L).addProperty("ADBE Vector Graphic - Fill");
  f.property("ADBE Vector Fill Color").setValue(color);
}
function GB_multi(comp,name,rects,color){
  var L=GB_shapeLayer(comp,name);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([0,0]);
  for(var i=0;i<rects.length;i++){var q=rects[i];GB_addRect(L,q[2],q[3],q[0]+q[2]/2,q[1]+q[3]/2);}
  GB_fill(L,color);
  return L;
}
function GB_box(comp,name,x,y,w,h,color,outlineW){
  var L=GB_shapeLayer(comp,name,"Box");
  GB_addRect(L,w,h,0,0);
  if(outlineW>0){
    var st=GB_contents(L).addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue(color); st.property("ADBE Vector Stroke Width").setValue(outlineW);
    try{st.property("ADBE Vector Stroke Line Join").setValue(1);}catch(eJ){}
  } else GB_fill(L,color);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([x+w/2,y+h/2]);
  return L;
}
/* grid lines as stroked paths — stroke width can then stay constant while the grid zooms */
function GB_strokes(comp,name,segs,color,lw,widthExpr){
  var L=GB_shapeLayer(comp,name);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([0,0]);
  for(var i=0;i<segs.length;i++){
    var q=segs[i], sh=new Shape();
    sh.vertices=[[q[0],q[1]],[q[2],q[3]]]; sh.inTangents=[[0,0],[0,0]]; sh.outTangents=[[0,0],[0,0]]; sh.closed=false;
    GB_contents(L).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
  }
  var st=GB_contents(L).addProperty("ADBE Vector Graphic - Stroke");
  st.property("ADBE Vector Stroke Color").setValue(color);
  st.property("ADBE Vector Stroke Width").setValue(lw);
  try{st.property("ADBE Vector Stroke Line Cap").setValue(1);}catch(e){}
  if(widthExpr) st.property("ADBE Vector Stroke Width").expression=widthExpr;
  return L;
}
/* parent without AE's compensation: the child keeps its own numbers (its layout in the parent's space) */
function GB_jumpParent(L,P){ try{ if(L.setParentWithJump){ L.setParentWithJump(P); return; } }catch(e){} try{ L.parent=P; }catch(e2){} }
function GB_null(comp,name,threeD){
  var L=comp.layers.addNull();
  L.name=name;
  if(threeD){
    L.threeDLayer=true;
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0,0]);
    GB_xf(L).property("ADBE Position").setValue([0,0,0]);
  }else{
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
    GB_xf(L).property("ADBE Position").setValue([0,0]);
  }
  L.label=2;
  return L;
}
function GB_text(comp,B,b){
  var T=comp.layers.addText(b.text);
  var p=T.property("ADBE Text Properties").property("ADBE Text Document");
  var td=p.value;
  try{td.resetCharStyle();}catch(e1){}
  try{td.resetParagraphStyle();}catch(e2){}
  if(b.font){try{td.font=b.font;}catch(eF){}}
  td.fontSize=b.fontSize;
  td.applyFill=true; td.fillColor=b.textColor; td.applyStroke=false;
  try{td.tracking=b.tracking||0;}catch(eT){}
  try{if(b.leading>0){td.autoLeading=false;td.leading=b.leading;}else{td.autoLeading=true;}}catch(eL){}
  try{
    if(b.kern=="optical") td.autoKernType=AutoKernType.OPTICAL_KERN;
    else if(b.kern=="none") td.autoKernType=AutoKernType.NO_AUTO_KERN;
    else td.autoKernType=AutoKernType.METRIC_KERN;
  }catch(eK){}
  var al=b.align||"center", ph=al=="center"?"c":(al.charAt(1)=="c"?"c":al.charAt(1)=="r"?"r":"l"), pv=al=="center"?"m":(al.charAt(0)=="m"?"m":al.charAt(0)=="b"?"b":"t");
  td.justification=ph=="c"?ParagraphJustification.CENTER_JUSTIFY:ph=="r"?ParagraphJustification.RIGHT_JUSTIFY:ParagraphJustification.LEFT_JUSTIFY;
  p.setValue(td);
  var r=T.sourceRectAtTime(0,false), pad=b.pad||0, ox=b.offX||0, oy=b.offY||0;
  var ap=[ph=="c"?r.left+r.width/2:ph=="r"?r.left+r.width:r.left, pv=="m"?r.top+r.height/2:pv=="b"?r.top+r.height:r.top];
  var pos=[(ph=="c"?b.x+b.bw/2:ph=="r"?b.x+b.bw-pad:b.x+pad)+ox, (pv=="m"?b.y+b.bh/2:pv=="b"?b.y+b.bh-pad:b.y+pad)+oy];
  GB_xf(T).property("ADBE Anchor Point").setValue(ap);
  GB_xf(T).property("ADBE Position").setValue(pos);
  T.parent=B;
  T.name=b.name+" · Text";
  T.comment="GridBlocks:text";
  return T;
}

/* ---------- keyframes ---------- */
function GB_pad(prop,v){
  if(!(v instanceof Array)) return v;
  var cur=prop.value;
  if(cur instanceof Array && cur.length>v.length){
    var o=v.slice(0);
    while(o.length<cur.length) o.push(prop.isSpatial?0:v[v.length-1]);
    return o;
  }
  return v;
}
function GB_dims(prop){
  if(prop.isSpatial) return 1;
  var t=prop.propertyValueType;
  if(t==PropertyValueType.TwoD) return 2;
  if(t==PropertyValueType.ThreeD) return 3;
  return 1;
}
function GB_flat(n){var e=[],i;for(i=0;i<n;i++)e.push(new KeyframeEase(0,33.33));return e;}
/* Convert a cubic-bezier [x1,y1,x2,y2] segment into AE speed/influence */
function GB_segEase(prop,a,b,fps,dims,isOut){
  var c=a[3]||[0.333,0,0.667,1];
  var T=(b[0]-a[0])/fps; if(T<=0) T=1/fps;
  var va=GB_pad(prop,a[1]), vb=GB_pad(prop,b[1]);
  var x=isOut?c[0]:1-c[2], y=isOut?c[1]:1-c[3];
  x=Math.max(0.001,Math.min(1,x));
  var infl=Math.max(0.1,Math.min(100,x*100)), k=y/x, arr=[], d;
  if(!(va instanceof Array)){arr.push(new KeyframeEase(k*(vb-va)/T,infl));}
  else if(dims==1){
    var dist=0; for(d=0;d<va.length;d++) dist+=(vb[d]-va[d])*(vb[d]-va[d]);
    arr.push(new KeyframeEase(Math.max(0,k*Math.sqrt(dist)/T),infl));
  }else{for(d=0;d<dims;d++) arr.push(new KeyframeEase(k*(vb[d]-va[d])/T,infl));}
  return arr;
}
function GB_itype(t){
  if(t=="h") return KeyframeInterpolationType.HOLD;
  if(t=="l") return KeyframeInterpolationType.LINEAR;
  return KeyframeInterpolationType.BEZIER;
}
/* list: [[frame, value, "h"|"e"|"l", curve?], ...] — curve describes the segment that starts at this key */
function GB_keys(prop,list,fps){
  if(!list||!list.length) return;
  var i, n=list.length, idx=[], dims=GB_dims(prop);
  for(i=0;i<n;i++) prop.setValueAtTime(list[i][0]/fps,GB_pad(prop,list[i][1]));
  for(i=0;i<n;i++) idx.push(prop.nearestKeyIndex(list[i][0]/fps));
  for(i=0;i<n;i++){
    var tin=i>0?GB_itype(list[i-1][2]):GB_itype(list[i][2]), tout=GB_itype(list[i][2]);
    try{prop.setInterpolationTypeAtKey(idx[i],tin,tout);}catch(e1){}
  }
  for(i=0;i<n;i++){
    var outE=(list[i][2]=="e"&&i<n-1)?GB_segEase(prop,list[i],list[i+1],fps,dims,true):null;
    var inE=(i>0&&list[i-1][2]=="e")?GB_segEase(prop,list[i-1],list[i],fps,dims,false):null;
    if(outE||inE){try{prop.setTemporalEaseAtKey(idx[i],inE||GB_flat(dims),outE||GB_flat(dims));}catch(e2){}}
    if(prop.isSpatial){
      try{
        prop.setSpatialAutoBezierAtKey(idx[i],false);
        prop.setSpatialContinuousAtKey(idx[i],false);
        var z=(prop.value.length==3)?[0,0,0]:[0,0];
        prop.setSpatialTangentsAtKey(idx[i],z,z);
      }catch(e3){}
    }
  }
}

/* ---------- clear ---------- */
function GB_clear(comp){
  var n=0, pre=[], src=[], i, j;
  for(i=comp.numLayers;i>=1;i--){
    var l=comp.layer(i);
    if(l.comment && l.comment.indexOf("GridBlocks")===0){
      try{if(l.source){ if(l.comment.indexOf("precomp")>0) pre.push(l.source); else src.push(l.source); }}catch(eS){}
      l.locked=false; l.remove(); n++;
    }
  }
  // precomps (and anything inside them), then solids nobody uses any more
  for(j=0;j<pre.length;j++){try{if(pre[j].usedIn.length===0){GB_clearInner(pre[j],src);pre[j].remove();}}catch(eR){}}
  for(j=0;j<src.length;j++){try{if(src[j].usedIn.length===0&&src[j].mainSource&&(src[j].mainSource instanceof SolidSource))src[j].remove();}catch(eR2){}}
  // our comp markers
  try{
    var mk=comp.markerProperty;
    for(i=mk.numKeys;i>=1;i--){var mv=mk.keyValue(i); if(mv&&String(mv.comment).indexOf("GB · ")===0) mk.removeKey(i);}
  }catch(eM){}
  return n;
}
function GB_clearInner(c,src){
  for(var i=c.numLayers;i>=1;i--){var l=c.layer(i);try{if(l.source&&!(l.source instanceof CompItem))src.push(l.source);}catch(e){} l.locked=false;}
}
/* ---------- project tidiness ---------- */
function GB_folder(name,parent){
  var items=app.project.items, i;
  for(i=1;i<=items.length;i++){var it=items[i]; if((it instanceof FolderItem)&&it.name==name&&it.parentFolder&&it.parentFolder.id==(parent||app.project.rootFolder).id) return it;}
  var f=items.addFolder(name); if(parent) f.parentFolder=parent; return f;
}
function GB_compNameUsed(name,except){
  var items=app.project.items;
  for(var i=1;i<=items.length;i++){var it=items[i]; if((it instanceof CompItem)&&(!except||it.id!=except.id)&&it.name==name) return true;}
  return false;
}
function GB_uniqueName(name){
  if(!GB_compNameUsed(name)) return name;
  for(var k=2;k<999;k++) if(!GB_compNameUsed(name+" "+k)) return name+" "+k;
  return name;
}
/* a precomp the same size/length as the main comp, placed in it as one layer.
   With the AE camera rig it's collapsed + 3D, so the 3D layers inside still use the main comp's camera. */
function GB_precomp(main,name,folder,collapse3D,tag,label){
  var pc=app.project.items.addComp(GB_uniqueName(name),main.width,main.height,main.pixelAspect,main.duration,main.frameRate);
  try{pc.bgColor=main.bgColor;}catch(eB){}
  if(folder) pc.parentFolder=folder;
  var L=main.layers.add(pc);
  L.comment="GridBlocks:precomp|"+tag; L.label=label||0;
  if(collapse3D){ try{L.collapseTransformation=true;}catch(eC){} try{L.threeDLayer=true;}catch(e3){} }
  return {comp:pc,layer:L};
}
function GB_trans(comp,d,fps,org,folder,comps,below,camL){
  var T=d.trans, n=0; if(!T) return 0;
  for(var g=0;g<T.groups.length;g++){
    var G=T.groups[g], target=comp, pre=null, matte=G.output=="matte", lab=G.k=="in"?9:14;
    if(matte||(org.preTrans&&!G.world)){
      pre=GB_precomp(comp,(G.k=="in"?"GB Transition In":"GB Transition Out")+(matte?" (matte)":"")+" · "+comp.name,folder,false,"trans",lab);
      pre.layer.name=G.name+(matte?" (matte)":"");
      target=pre.comp; comps.push(target);
    }
    /* solid under the tiles: hides the grid lines once the frame is covered */
    if(G.solid){ try{ var S=GB_box(target,(G.k=="in"?"In":"Out")+" · Solid",0,0,comp.width,comp.height,G.solid.color,0); S.comment="GridBlocks:trans"; S.label=lab;
      GB_keys(GB_xf(S).property("ADBE Opacity"),G.solid.op,fps); if(org.trim) GB_trimByOp(S,G.solid.op,fps,comp); if(G.behind&&below&&!pre) S.moveAfter(below); n++; }catch(eS){} }
    for(var i=0;i<G.tiles.length;i++){
      var t=G.tiles[i], L=GB_box(target,(G.k=="in"?"In ":"Out ")+GB_pad3(i+1),t.x,t.y,t.w,t.h,t.color,0);
      L.comment="GridBlocks:trans"; L.label=lab;
      var k=t.keys;
      if(k){
        GB_keys(GB_xf(L).property("ADBE Opacity"),k.op,fps);
        GB_keys(GB_xf(L).property("ADBE Scale"),k.sc,fps);
        if((k.rs&&k.rs.length)||(k.rp&&k.rp.length)){
          var rect=GB_contents(L).property("ADBE Vector Shape - Rect");
          GB_keys(rect.property("ADBE Vector Rect Size"),k.rs,fps);
          GB_keys(rect.property("ADBE Vector Rect Position"),k.rp,fps);
        }
      }
      if(org.trim&&k) GB_trimByOp(L,k.op,fps,comp);
      if(G.behind&&below&&!pre){ try{L.moveAfter(below);}catch(eB){} }
      if(G.world&&camL&&!pre){ try{L.parent=camL;}catch(eP){} }
      n++;
    }
    if(G.behind&&below&&pre){ try{pre.layer.moveAfter(below);}catch(eB2){} }
    if(!pre&&!G.behind&&org.headers!==false&&G.tiles.length) GB_header(comp,(G.k=="in"?"TRANSITION IN":"TRANSITION OUT")+" ("+G.tiles.length+")",null);
    // trim the precomp layer to when the transition is on screen
    if(pre&&org.trim&&G.vis){
      try{ if(G.vis[0]>0) pre.layer.inPoint=G.vis[0]/fps; if(G.vis[1]+1<comp.duration*fps) pre.layer.outPoint=(G.vis[1]+1)/fps; }catch(eT){}
    }
  }
  return n;
}
/* trim a layer to when its opacity keys make it visible */
function GB_trimByOp(L,op,fps,comp){
  if(!op||!op.length) return; var a=null, j;
  for(j=0;j<op.length;j++){ if(op[j][1]>0){ a=j>0?op[j-1][0]:(op[j][0]>0&&op[j][2]=="h"?op[j][0]:0); break; } }
  if(a==null) return;
  var last=op[op.length-1], b=last[1]<=0?last[0]+1:null;
  try{ if(a>0&&a/fps<comp.duration) L.inPoint=a/fps; }catch(e1){}
  try{ if(b!=null&&b/fps<comp.duration&&b/fps>L.inPoint) L.outPoint=b/fps; }catch(e2){}
}
function GB_pad3(n){n=String(n);while(n.length<2)n="0"+n;return n;}
function GB_clearActive(){
  var c=app.project.activeItem;
  if(!(c && c instanceof CompItem)) return "ERR|No active comp";
  app.beginUndoGroup("Grid Blocks: Remove layers");
  var n=GB_clear(c);
  app.endUndoGroup();
  return "OK|Removed "+n+" Grid Blocks layer"+(n==1?"":"s")+" from “"+c.name+"”";
}

/* ---------- echo: rect with optional dashed stroke (on top) and fill ---------- */
function GB_echoBox(comp,e){
  var L=GB_shapeLayer(comp,e.name,"Echo");
  GB_addRect(L,e.w,e.h,0,0);
  if(e.stroke){
    var st=GB_contents(L).addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue(e.stroke.color);
    st.property("ADBE Vector Stroke Width").setValue(e.stroke.w);
    if(e.stroke.dash){
      try{
        var ds=st.property("ADBE Vector Stroke Dashes");
        ds.addProperty("ADBE Vector Stroke Dash 1").setValue(e.stroke.dash[0]);
        ds.addProperty("ADBE Vector Stroke Gap 1").setValue(e.stroke.dash[1]);
      }catch(eD){}
    }
  }
  if(e.fill) GB_fill(L,e.fill);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([e.x+e.w/2,e.y+e.h/2]);
  if(!(e.keys&&e.keys.op&&e.keys.op.length)) GB_xf(L).property("ADBE Opacity").setValue(e.opacity);
  L.comment="GridBlocks:echo"+(e.content?"|content=1":"");
  L.label=1;
  return L;
}

/* ---------- block content (auto-fill) ---------- */
function GB_fillText(comp,it){
  var T=comp.layers.addText(it.text);
  var p=T.property("ADBE Text Properties").property("ADBE Text Document"), td=p.value;
  try{td.resetCharStyle();}catch(e1){}
  try{td.resetParagraphStyle();}catch(e2){}
  if(it.font){try{td.font=it.font;}catch(eF){}}
  td.fontSize=it.size; td.applyFill=true; td.fillColor=it.color; td.applyStroke=false;
  try{td.autoLeading=false; td.leading=it.leading;}catch(eL){}
  td.justification=(it.align=="r")?ParagraphJustification.RIGHT_JUSTIFY:ParagraphJustification.LEFT_JUSTIFY;
  p.setValue(td);
  var r=T.sourceRectAtTime(0,false);
  GB_xf(T).property("ADBE Anchor Point").setValue([it.align=="r"?r.left+r.width:r.left, r.top]);
  GB_xf(T).property("ADBE Position").setValue([it.x,it.y]);
  if(it.expr){try{p.expression=it.expr;}catch(eX){}}
  if(it.tk&&it.tk.length){ try{ var tms=[], tds=[], q; for(q=0;q<it.tk.length;q++){ var d2=p.value; d2.text=it.tk[q][1]; tms.push(it.tk[q][0]); tds.push(d2); }
      try{ p.setValuesAtTimes(tms,tds); }catch(eV){ for(q=0;q<tms.length;q++) p.setValueAtTime(tms[q],tds[q]); } }catch(eTk){} }
  T.name=(it.text.split("\r")[0]).substr(0,28);
  T.comment="GridBlocks:fill"; T.label=11;
  if(it.t0>0) T.inPoint=it.t0;
  return T;
}
/* block number: right-aligned in the block's top-right corner, parented to the block */
var d_fps_hack=30;
function GB_numText(comp,B,b){
  var n=b.num, T=comp.layers.addText(n.text);
  var p=T.property("ADBE Text Properties").property("ADBE Text Document"), td=p.value;
  try{td.resetCharStyle();}catch(e1){}
  try{td.resetParagraphStyle();}catch(e2){}
  if(n.font){try{td.font=n.font;}catch(eF){}}
  td.fontSize=n.size; td.applyFill=true; td.fillColor=n.color; td.applyStroke=false;
  td.justification=ParagraphJustification.RIGHT_JUSTIFY;
  p.setValue(td);
  var r=T.sourceRectAtTime(0,false);
  GB_xf(T).property("ADBE Anchor Point").setValue([r.left+r.width,r.top]);
  GB_xf(T).property("ADBE Position").setValue([n.x,n.y]);
  if(n.keys&&n.keys.length) GB_keys(GB_xf(T).property("ADBE Opacity"),n.keys,d_fps_hack);
  else if(n.opacity<100) GB_xf(T).property("ADBE Opacity").setValue(n.opacity);
  T.parent=B; T.name=b.name+" · Number"; T.comment="GridBlocks:num"; T.label=1;
  return T;
}
function GB_dots(comp,it){
  /* one shape layer; each empty area is its own group: a dot + two repeaters (columns, rows) */
  var L=comp.layers.addShape(); L.name="Dot field";
  var root=L.property("ADBE Root Vectors Group");
  for(var i=0;i<it.rects.length;i++){
    var f=it.rects[i];
    var g=root.addProperty("ADBE Vector Group"); g.name="Dots "+(i+1);
    var c=root.property(root.numProperties).property("ADBE Vectors Group");
    if(it.sq){var rq=c.addProperty("ADBE Vector Shape - Rect"); rq.property("ADBE Vector Rect Size").setValue([it.d,it.d]); rq.property("ADBE Vector Rect Position").setValue([f.x,f.y]);}
    else{var el=c.addProperty("ADBE Vector Shape - Ellipse");
    el.property("ADBE Vector Ellipse Size").setValue([it.d,it.d]);
    el.property("ADBE Vector Ellipse Position").setValue([f.x,f.y]);}
    c=root.property(root.numProperties).property("ADBE Vectors Group");
    var fl=c.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(it.color);
    c=root.property(root.numProperties).property("ADBE Vectors Group");
    var r1=c.addProperty("ADBE Vector Filter - Repeater");
    r1.property("ADBE Vector Repeater Copies").setValue(f.cols);
    r1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([it.sp,0]);
    c=root.property(root.numProperties).property("ADBE Vectors Group");
    var r2=c.addProperty("ADBE Vector Filter - Repeater");
    r2.property("ADBE Vector Repeater Copies").setValue(f.rows);
    r2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0,it.sp]);
  }
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([0,0]);
  L.comment="GridBlocks:fill"; L.label=11;
  if(it.t0>0) L.inPoint=it.t0;
  return L;
}
/* line icon from the icon set: one group per primitive (path / ellipse / rect), stroked or filled */
function GB_icon(comp,it){
  var L=comp.layers.addShape(); L.name="Icon · "+(it.label||it.name);
  var root=L.property("ADBE Root Vectors Group"), s=it.s, i, j;
  for(i=0;i<it.prims.length;i++){
    var p=it.prims[i];
    root.addProperty("ADBE Vector Group");
    var c=root.property(root.numProperties).property("ADBE Vectors Group");
    if(p.t=="c"){var e=c.addProperty("ADBE Vector Shape - Ellipse"); e.property("ADBE Vector Ellipse Size").setValue([p.r*2*s,p.r*2*s]); e.property("ADBE Vector Ellipse Position").setValue([p.cx*s,p.cy*s]);}
    else if(p.t=="r"){var rr=c.addProperty("ADBE Vector Shape - Rect"); rr.property("ADBE Vector Rect Size").setValue([p.w*s,p.h*s]); rr.property("ADBE Vector Rect Position").setValue([(p.x+p.w/2)*s,(p.y+p.h/2)*s]); if(p.rr) rr.property("ADBE Vector Rect Roundness").setValue(p.rr*s);}
    else{var sh=new Shape(), vv=[], tz=[]; for(j=0;j<p.pts.length;j++){vv.push([p.pts[j][0]*s,p.pts[j][1]*s]);tz.push([0,0]);}
      sh.vertices=vv; sh.inTangents=tz; sh.outTangents=tz; sh.closed=!!p.closed;
      c.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);}
    c=root.property(root.numProperties).property("ADBE Vectors Group");
    if(p.f){var fl=c.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(it.color);}
    else{var st=c.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.color); st.property("ADBE Vector Stroke Width").setValue(it.lw);
      try{st.property("ADBE Vector Stroke Line Cap").setValue(2);st.property("ADBE Vector Stroke Line Join").setValue(2);}catch(eC){}}
  }
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([it.x,it.y]);
  L.comment="GridBlocks:fill"; L.label=11;
  if(it.t0>0) L.inPoint=it.t0;
  return L;
}
/* ---- LAB layers ---- */
function GB_labWorld(comp,lab,blocks,blockLayers,fps,org,main){
  var n=0, i, j, L, c;
  function trim(Lr,t0,t1){ if(org.trim){ try{ if(t0>0) Lr.inPoint=t0/fps; if(t1!=null&&t1/fps<main.duration&&t1/fps>Lr.inPoint) Lr.outPoint=t1/fps; }catch(e){} } }
  for(i=0;i<lab.trails.length;i++){
    var t=lab.trails[i]; L=comp.layers.addShape(); L.name=(blockLayers[t.bi]?blockLayers[t.bi].name+" · ":"")+"Trail";
    var root=L.property("ADBE Root Vectors Group"); root.addProperty("ADBE Vector Group"); c=root.property(1).property("ADBE Vectors Group");
    for(j=0;j<t.lines.length;j++){var q=t.lines[j], rr=c.addProperty("ADBE Vector Shape - Rect"); rr.property("ADBE Vector Rect Size").setValue([q[2],q[3]]); rr.property("ADBE Vector Rect Position").setValue([q[0]-t.anchor[0]+q[2]/2,q[1]-t.anchor[1]+q[3]/2]);}
    c.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(t.color);
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0]); GB_xf(L).property("ADBE Position").setValue(t.anchor);
    L.comment="GridBlocks:lab"; L.label=6; blocks.push({L:L,T:null,b:{keys:t.keys}}); trim(L,t.t0,t.t1); n++;
  }
  for(i=0;i<lab.pulses.length;i++){
    var p=lab.pulses[i]; L=GB_shapeLayer(comp,(blockLayers[p.bi]?blockLayers[p.bi].name+" · ":"")+"Pulse","Pulse");
    GB_addRect(L,p.w,p.h,0,0);
    var st=GB_contents(L).addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(p.color); st.property("ADBE Vector Stroke Width").setValue(p.lw);
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0]); GB_xf(L).property("ADBE Position").setValue([p.cx,p.cy]);
    L.comment="GridBlocks:lab"; L.label=6; blocks.push({L:L,T:null,b:{keys:p.keys}}); trim(L,p.t0,p.t1); n++;
  }
  for(i=0;i<lab.bars.length;i++){
    var b=lab.bars[i]; L=GB_shapeLayer(comp,(blockLayers[b.bi]?blockLayers[b.bi].name+" · ":"")+"Finality bar","Bar");
    GB_addRect(L,b.w,b.h,b.w/2,0); GB_fill(L,b.color);
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0]); GB_xf(L).property("ADBE Position").setValue([b.x,b.y+b.h/2]);
    if(blockLayers[b.bi]) L.parent=blockLayers[b.bi];
    L.comment="GridBlocks:lab"; L.label=6; blocks.push({L:L,T:null,b:{keys:b.keys}}); trim(L,b.t0,null); n++;
  }
  return n;
}
function GB_labScreen(main,lab,fps){
  var L;
  if(lab.snow){
    var S=lab.snow; L=main.layers.addShape(); L.name="GB · Snow drift";
    var root=L.property("ADBE Root Vectors Group");
    for(var i=0;i<S.parts.length;i++){
      var p=S.parts[i]; root.addProperty("ADBE Vector Group"); var g=root.property(root.numProperties);
      var c=g.property("ADBE Vectors Group"); var rr=c.addProperty("ADBE Vector Shape - Rect"); rr.property("ADBE Vector Rect Size").setValue([p[3]*S.stretch,p[3]]);
      c.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(S.color);
      g.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression=
        'var W=thisComp.width+40;var x='+p[0]+'+('+S.dir+')*'+p[2]+'*time;x=((x%W)+W)%W-20;['+'x,'+p[1]+'+Math.sin(time*0.9+'+p[4]+')*'+p[5]+']';
    }
    GB_xf(L).property("ADBE Anchor Point").setValue([0,0]); GB_xf(L).property("ADBE Position").setValue([0,0]);
    GB_xf(L).property("ADBE Opacity").setValue(S.opacity);
    L.comment="GridBlocks:lab"; L.label=6;
  }
  if(lab.ticker){
    var T=lab.ticker;
    if(T.band){ L=main.layers.addShape(); L.name="GB · Ticker band"; var root2=L.property("ADBE Root Vectors Group"); root2.addProperty("ADBE Vector Group");
      var c2=root2.property(1).property("ADBE Vectors Group"); var r2=c2.addProperty("ADBE Vector Shape - Rect"); r2.property("ADBE Vector Rect Size").setValue([main.width,T.size*1.8]); r2.property("ADBE Vector Rect Position").setValue([main.width/2,T.y]);
      c2.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(T.bandColor);
      GB_xf(L).property("ADBE Anchor Point").setValue([0,0]); GB_xf(L).property("ADBE Position").setValue([0,0]); L.comment="GridBlocks:lab"; L.label=6; }
    var X=main.layers.addText(T.text);
    var tp=X.property("ADBE Text Properties").property("ADBE Text Document"), td=tp.value;
    try{td.resetCharStyle();}catch(e1){} try{td.resetParagraphStyle();}catch(e2){}
    if(T.font){try{td.font=T.font;}catch(eF){}}
    td.fontSize=T.size; td.applyFill=true; td.fillColor=T.color; td.applyStroke=false; td.justification=ParagraphJustification.LEFT_JUSTIFY; tp.setValue(td);
    var r=X.sourceRectAtTime(0,false);
    GB_xf(X).property("ADBE Anchor Point").setValue([r.left,r.top+r.height/2]);
    GB_xf(X).property("ADBE Position").setValue([main.width,T.y]);
    GB_xf(X).property("ADBE Position").expression='var w=sourceRectAtTime(0,false).width;var W=thisComp.width;\n[W-((time*'+T.speed+')%(w+W)),value[1]]';
    X.name="GB · Ticker"; X.comment="GridBlocks:lab"; X.label=6;
  }
}
function GB_ring(comp,it){
  var L=GB_shapeLayer(comp,"Ring icon","Ring");
  var c=GB_contents(L);
  var e1=c.addProperty("ADBE Vector Shape - Ellipse"); e1.property("ADBE Vector Ellipse Size").setValue([it.r*2,it.r*2]);
  var e2=c.addProperty("ADBE Vector Shape - Ellipse"); e2.property("ADBE Vector Ellipse Size").setValue([it.r*.64,it.r*.64]);
  var sh=new Shape(); sh.vertices=[[-it.r,0],[it.r,0]]; sh.inTangents=[[0,0],[0,0]]; sh.outTangents=[[0,0],[0,0]]; sh.closed=false;
  c.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
  var st=c.addProperty("ADBE Vector Graphic - Stroke");
  st.property("ADBE Vector Stroke Color").setValue(it.color); st.property("ADBE Vector Stroke Width").setValue(it.w);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([it.cx,it.cy]);
  L.comment="GridBlocks:fill"; L.label=11;
  if(it.t0>0) L.inPoint=it.t0;
  return L;
}
function GB_logo(comp,it){
  var L=comp.layers.addShape(); L.name="Avalanche logo";
  var root=L.property("ADBE Root Vectors Group");
  root.addProperty("ADBE Vector Group").name="Logo";
  for(var i=0;i<it.paths.length;i++){
    var p=it.paths[i], sh=new Shape();
    sh.vertices=p.v; sh.inTangents=p.i; sh.outTangents=p.o; sh.closed=p.closed;
    root.property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
  }
  var fl=root.property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
  fl.property("ADBE Vector Fill Color").setValue(it.color);
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Scale").setValue([it.s*100,it.s*100]);
  GB_xf(L).property("ADBE Position").setValue([it.x,it.y]);
  L.comment="GridBlocks:fill"; L.label=11;
  if(it.t0>0) L.inPoint=it.t0;
  return L;
}
/* content v2 graphic (pixel icon, graph, combo, pattern): one group per build step; fills/strokes; build via
   group opacity / trim paths / scale expressions; live graphs via a path expression */
function GB_shape(comp,it){
  var L=comp.layers.addShape(); L.name=it.name||"Graphic";
  var root=L.property("ADBE Root Vectors Group"), i, j, k;
  for(i=0;i<it.groups.length;i++){
    var gp=it.groups[i];
    root.addProperty("ADBE Vector Group");
    var G=function(){return root.property(root.numProperties);};
    var C=function(){return G().property("ADBE Vectors Group");};
    var ox=0, oy=0; if(gp.grow){ox=gp.grow[0];oy=gp.grow[1];}
    for(j=0;j<gp.shapes.length;j++){
      var q=gp.shapes[j];
      if(q.t=="r"){var rr=C().addProperty("ADBE Vector Shape - Rect"); rr.property("ADBE Vector Rect Size").setValue([q.w,q.h]); rr.property("ADBE Vector Rect Position").setValue([q.x+q.w/2-ox,q.y+q.h/2-oy]);}
      else{var sh=new Shape(), vv=[], tz=[]; for(k=0;k<q.pts.length;k++){vv.push([q.pts[k][0]-ox,q.pts[k][1]-oy]);tz.push([0,0]);}
        sh.vertices=vv; sh.inTangents=tz; sh.outTangents=tz; sh.closed=!!q.closed;
        var pg=C().addProperty("ADBE Vector Shape - Group"); pg.property("ADBE Vector Shape").setValue(sh);
        if(gp.px&&j==0){try{C().property(C().numProperties).property("ADBE Vector Shape").expression=gp.px;}catch(eP){}}
        if(gp.pk&&j==0){try{ var pp=C().property(C().numProperties).property("ADBE Vector Shape"), tms=[], shs=[], m, n2;
          for(m=0;m<gp.pk.length;m++){ var s2=new Shape(), v2=[], t2=[]; for(n2=0;n2<gp.pk[m][1].length;n2++){ v2.push([gp.pk[m][1][n2][0]-ox,gp.pk[m][1][n2][1]-oy]); t2.push([0,0]); }
            s2.vertices=v2; s2.inTangents=t2; s2.outTangents=t2; s2.closed=!!gp.pkc; tms.push(gp.pk[m][0]); shs.push(s2); }
          pp.setValuesAtTimes(tms,shs); for(m=1;m<=pp.numKeys;m++){ try{pp.setInterpolationTypeAtKey(m,KeyframeInterpolationType.HOLD,KeyframeInterpolationType.HOLD);}catch(eH){} }
        }catch(eK){}}}
    }
    if(gp.f){var fl=C().addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(it.color);}
    else{var st=C().addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(it.color); st.property("ADBE Vector Stroke Width").setValue(gp.sw);
      try{st.property("ADBE Vector Stroke Line Cap").setValue(1);st.property("ADBE Vector Stroke Line Join").setValue(1);}catch(eC){}}
    if(gp.tx){try{var tr=C().addProperty("ADBE Vector Filter - Trim"); tr.property("ADBE Vector Trim End").expression=gp.tx;}catch(eT){}}
    if(gp.txk){try{var tr2=C().addProperty("ADBE Vector Filter - Trim"); GB_keys(tr2.property("ADBE Vector Trim End"),gp.txk,GB_FPS);}catch(eT2){}}
    var tf=G().property("ADBE Vector Transform Group");
    if(gp.grow){tf.property("ADBE Vector Position").setValue([ox,oy]);}
    if(gp.o<100) tf.property("ADBE Vector Group Opacity").setValue(gp.o);
    if(gp.ox){try{G().property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression=gp.ox;}catch(eO){}}
    if(gp.gx){try{G().property("ADBE Vector Transform Group").property("ADBE Vector Scale").expression=gp.gx;}catch(eS){}}
    if(gp.oxk){try{GB_keys(G().property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity"),gp.oxk,GB_FPS);}catch(eO2){}}
    if(gp.gxk){try{GB_keys(G().property("ADBE Vector Transform Group").property("ADBE Vector Scale"),gp.gxk,GB_FPS);}catch(eS2){}}
  }
  GB_xf(L).property("ADBE Anchor Point").setValue([0,0]);
  GB_xf(L).property("ADBE Position").setValue([0,0]);
  if(it.op<100) GB_xf(L).property("ADBE Opacity").setValue(it.op);
  L.comment="GridBlocks:fill"; L.label=11;
  if(it.t0>0) L.inPoint=it.t0;
  return L;
}
function GB_fillItems(comp,items,parent,list){
  if(!items) return;
  for(var i=0;i<items.length;i++){
    var it=items[i], L=null;
    try{
      if(it.kind=="dots") L=GB_dots(comp,it);
      else if(it.kind=="ring") L=GB_ring(comp,it);
      else if(it.kind=="logo") L=GB_logo(comp,it);
      else if(it.kind=="icon") L=GB_icon(comp,it);
      else if(it.kind=="shape") L=GB_shape(comp,it);
      else L=GB_fillText(comp,it);
    }catch(eI){L=null;}
    if(L){
      if(GB_TRIM&&it.t0>0){ try{ if(it.t0<L.outPoint) L.inPoint=it.t0; }catch(eTi){} }
      if(it.opx){try{GB_xf(L).property("ADBE Opacity").expression=it.opx;}catch(eO){}}
      if(it.ok&&it.ok.length){try{GB_keys(GB_xf(L).property("ADBE Opacity"),it.ok,GB_FPS);}catch(eOk){}}
      if(parent){ L.parent=parent; L.name=parent.name+" · "+L.name; }
      list.push(L);
    }
  }
}


/* ---------- media clipped to blocks (video / image / precomp) ---------- */
var GB_mediaItems={};
function GB_pickMedia(){
  try{
    var filt=GB_isWin()?"Video or image:*.mp4;*.mov;*.m4v;*.webm;*.avi;*.mxf;*.png;*.jpg;*.jpeg;*.gif;*.tif;*.tiff;*.psd;*.ai":function(f){return (f instanceof Folder)||/\.(mp4|mov|m4v|webm|avi|mxf|png|jpe?g|gif|tiff?|psd|ai)$/i.test(f.name);};
    var fs=File.openDialog("Grid Blocks · add video or image",filt,true); if(!fs) return "CANCEL";
    if(!(fs instanceof Array)) fs=[fs]; var o=[];
    for(var i=0;i<fs.length;i++) o.push(fs[i].fsName+"\t"+decodeURI(fs[i].name));
    return "OK|"+o.join("\n");
  }catch(e){return "ERR|"+e.toString();}
}
function GB_findMedia(m,root){
  var tries=[], base=root||null, nm=String(m.file||m.name||"").split("/").pop(), i;
  if(m.path) tries.push(m.path);
  try{ if(!base&&$.fileName) base=File($.fileName).parent.fsName; }catch(e0){}
  if(base){ if(m.file) tries.push(base+"/"+m.file); tries.push(base+"/"+nm); tries.push(base+"/media/"+nm); }
  for(i=0;i<tries.length;i++){ try{ var f=new File(tries[i]); if(f.exists) return f; }catch(e1){} }
  var p=File.openDialog("Grid Blocks: where is “"+(m.name||nm)+"”? (Cancel to skip it)");
  return p||null;
}
function GB_mediaSource(m,root,folder,main){
  var key=(m.precomp?"C|":"F|")+m.id, i;
  if(GB_mediaItems.hasOwnProperty(key)) return GB_mediaItems[key];
  var ft=GB_mediaItems["F|"+m.id];
  if(!ft){
    var f=GB_findMedia(m,root); if(!f){ GB_mediaItems[key]=null; return null; }
    for(i=1;i<=app.project.numItems;i++){ var it=app.project.item(i); try{ if((it instanceof FootageItem)&&it.file&&it.file.fsName==f.fsName){ ft=it; break; } }catch(e2){} }
    if(!ft) ft=app.project.importFile(new ImportOptions(f));
    if(folder){ try{ft.parentFolder=folder;}catch(e3){} }
    GB_mediaItems["F|"+m.id]=ft;
  }
  if(!m.precomp){ GB_mediaItems[key]=ft; return ft; }
  var still=false; try{ still=ft.mainSource.isStill; }catch(e4){}
  var fr=ft.frameRate>0?ft.frameRate:main.frameRate, dur=(!still&&ft.duration>0)?ft.duration:main.duration;
  var c=app.project.items.addComp(GB_uniqueName("GB Media · "+ft.name),ft.width,ft.height,ft.pixelAspect||1,Math.max(dur,1/fr),fr);
  var inner=c.layers.add(ft); try{ if(still) inner.outPoint=c.duration; }catch(e5){}
  if(folder){ try{c.parentFolder=folder;}catch(e6){} }
  GB_mediaItems[key]=c; return c;
}
function GB_mediaLayer(comp,B,b,m,root,folder,main,fps){
  var src=GB_mediaSource(m,root,folder,main); if(!src) return null;
  var L=comp.layers.add(src); L.moveBefore(B);
  L.name=b.name+" · Media"; L.comment="GridBlocks:media"; L.label=14;
  L.parent=B;
  var sw=src.width, sh=src.height, bw=b.bw, bh=b.bh, us=Math.max(1,m.scale)/100, kx, ky;
  if(m.fit=="contain"){ kx=ky=Math.min(bw/sw,bh/sh); }
  else if(m.fit=="stretch"){ kx=bw/sw; ky=bh/sh; }
  else if(m.fit=="original"){ kx=ky=1; }
  else if(m.fit=="tile"){ kx=ky=bh/sh; }
  else { kx=ky=Math.max(bw/sw,bh/sh); }
  kx*=us; ky*=us;
  var xf=GB_xf(L);
  xf.property("ADBE Anchor Point").setValue([sw/2,sh/2]);
  xf.property("ADBE Position").setValue([m.x*bw/100,m.y*bh/100]);
  xf.property("ADBE Scale").setValue([kx*100*(m.flipX?-1:1),ky*100*(m.flipY?-1:1)]);
  xf.property("ADBE Opacity").setValue(m.opacity);
  if(m.fit=="tile"){ try{
    var fx=L.property("ADBE Effect Parade").addProperty("ADBE Tile");
    fx.property(4).setValue(Math.min(10000,Math.ceil(bw/Math.max(1,sw*kx)*100)+300));
    fx.property(5).setValue(Math.min(10000,Math.ceil(bh/Math.max(1,sh*ky)*100)+300));
  }catch(eT){} }
  var still=false; try{ still=(src instanceof FootageItem)&&src.mainSource.isStill; }catch(eS){}
  if(m.type=="video"&&!still&&src.duration>0){
    try{
      L.timeRemapEnabled=true;
      var d=Math.max(1/fps,src.duration-src.frameDuration);
      var mode=m.loop=="hold"?"Math.min(t,d)":m.loop=="ping"?"(function(){var c=t%(2*d);return c>d?2*d-c:c;})()":"t%d";
      L.property("ADBE Time Remapping").expression='// Grid Blocks: '+(m.loop=="hold"?"plays once, stops on the last frame":m.loop=="ping"?"ping-pong":"loops")+'\nvar st='+(m.startF/fps)+', off='+(m.offset/fps)+', d='+d+';\nvar t=Math.max(0,time-st)+off;\n'+mode+';';
      L.outPoint=comp.duration;
    }catch(eR){}
  } else { try{ L.outPoint=comp.duration; }catch(eO){} }
  /* how the media comes on: fade / scale in / wipe, starting with the clip */
  try{ var t0=m.startF/fps, t1=(m.startF+Math.max(1,m.inLen||12))/fps, op=xf.property("ADBE Opacity");
    if(m.inMode=="fade"||m.inMode=="scale"){ op.setValueAtTime(t0,0); op.setValueAtTime(t1,m.opacity); }
    if(m.inMode=="scale"){ var scp=xf.property("ADBE Scale"), sv=scp.value; scp.setValueAtTime(t0,[sv[0]*1.25,sv[1]*1.25]); scp.setValueAtTime(t1,sv); }
    if(m.inMode=="wipe"){ var lw=L.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe"); lw.property(2).setValue(270); lw.property(1).setValueAtTime(t0,100); lw.property(1).setValueAtTime(t1,0); }
    if(m.inMode&&m.inMode!="block"){ var ease=new KeyframeEase(0,60); try{ for(var pk=1;pk<=op.numKeys;pk++) op.setTemporalEaseAtKey(pk,[ease],[ease]); }catch(eE){} }
  }catch(eIn){}
  if(!m.audio){ try{ L.audioEnabled=false; }catch(eA){} }
  var ok=false; try{ L.setTrackMatte(B,TrackMatteType.ALPHA); ok=true; }catch(eM){ ok=false; }
  return {L:L,ok:ok};
}
/* older After Effects (before track mattes could point at any layer): a copy of the block sits right above as the matte */
function GB_mediaMattes(list){
  for(var i=0;i<list.length;i++){ var L=list[i].L, B=list[i].B; if(!L||list[i].ok) continue;
    try{ var dup=B.duplicate(); dup.name=B.name+" · Media Matte"; dup.moveBefore(L); L.trackMatteType=TrackMatteType.ALPHA; }catch(e){} }
}
/* Z depth: one null moves every block (and echo) along the camera axis; the grid stays at 0 */
function GB_depth3D(comp,layers,keys,fps){
  if(!keys||!keys.length||!layers.length) return null;
  var dn=GB_null(comp,"GB · Block Depth",true); dn.comment="GridBlocks:null"; dn.label=9;
  var par=null, i; for(i=0;i<layers.length;i++){ if(layers[i].parent){ par=layers[i].parent; break; } }
  if(par){ try{ dn.parent=par; }catch(e0){} }
  for(i=0;i<layers.length;i++){ try{ layers[i].parent=dn; }catch(e1){} }
  var zk=[]; for(i=0;i<keys.length;i++) zk.push([keys[i][0],[0,0,keys[i][1]],keys[i][2],keys[i][3]]);
  GB_keys(GB_xf(dn).property("ADBE Position"),zk,fps);
  return dn;
}
function GB_depth2D(main,layers,keys,fps,cam,zoom,zoomK){
  if(!keys||!keys.length||!layers.length) return null;
  var W=main.width, H=main.height, Zc=zoomK*W, i;
  var dn=GB_null(main,"GB · Block Depth"); dn.comment="GridBlocks:null"; dn.label=9;
  GB_xf(dn).property("ADBE Anchor Point").setValue([W/2,H/2]); GB_xf(dn).property("ADBE Position").setValue([W/2,H/2]);
  if(zoom){ try{ dn.parent=zoom; }catch(e0){} }
  var hold=null;
  if(cam){ hold=cam.duplicate(); hold.name="GB · Camera (blocks)"; hold.comment="GridBlocks:null"; try{ hold.parent=dn; }catch(e1){} }
  for(i=0;i<layers.length;i++){ try{ layers[i].parent=hold||dn; }catch(e2){} }
  var sk=[]; for(i=0;i<keys.length;i++){ var k=100*Zc/Math.max(50,Zc+keys[i][1]); sk.push([keys[i][0],[k,k],keys[i][2],keys[i][3]]); }
  GB_keys(GB_xf(dn).property("ADBE Scale"),sk,fps);
  return dn;
}
/* ---------- timeline tidiness: section dividers (disabled, locked nulls) ---------- */
var GB_TRIM=false, GB_FPS=30;
function GB_header(comp,title,folder){
  var h=comp.layers.addNull(); h.name="\u2501\u2501\u2501  "+title+"  \u2501\u2501\u2501"; h.comment="GridBlocks:header"; h.label=0;
  try{h.enabled=false;}catch(e1){} try{h.guideLayer=true;}catch(e2){}
  try{ if(folder&&h.source) h.source.parentFolder=folder; }catch(e3){}
  try{h.locked=true;}catch(e4){}
  return h;
}
function GB_labelAll(list,lab){ for(var i=0;i<list.length;i++){ try{ if(list[i]) list[i].label=lab; }catch(e){} } }
/* ---------- column rules ---------- */
function GB_mkRules(comp,R){
  var L;
  if(R.mode=="strokes") L=GB_strokes(comp,"GB · Column Rules",R.segs,R.color,R.lw,null);
  else if(R.rects&&R.rects.length) L=GB_multi(comp,"GB · Column Rules",R.rects,R.color);
  else return null;
  L.comment="GridBlocks:rules"; L.label=0;
  return L;
}
function GB_strokeWidth(L){
  return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width");
}

/* ---------- build ---------- */
function GB_blockKeys(blocks,fps){
  for(var i=0;i<blocks.length;i++){
    var k=blocks[i].b.keys, BL=blocks[i].L;
    if(!k) continue;
    GB_keys(GB_xf(BL).property("ADBE Opacity"),k.op,fps);
    GB_keys(GB_xf(BL).property("ADBE Scale"),k.sc,fps);
    if((k.rs&&k.rs.length)||(k.rp&&k.rp.length)){
      var rect=GB_contents(BL).property("ADBE Vector Shape - Rect");
      GB_keys(rect.property("ADBE Vector Rect Size"),k.rs,fps);
      GB_keys(rect.property("ADBE Vector Rect Position"),k.rp,fps);
    }
    if(blocks[i].T) GB_keys(GB_xf(blocks[i].T).property("ADBE Opacity"),k.top,fps);
  }
}
function GB_build(d){
  var comp, made=false, out=[], i, L;
  var org=d.org||{folder:false,preGrid:false,preBlocks:false,preTrans:false,shy:false,trim:false,markers:null};
  app.beginUndoGroup("Grid Blocks: Build");
  try{
    comp=app.project.activeItem;
    if(!(comp && comp instanceof CompItem) || comp.width!=d.comp.w || comp.height!=d.comp.h){
      comp=app.project.items.addComp(GB_uniqueName(d.comp.name||"Grid Blocks"),d.comp.w,d.comp.h,1,Math.max(1,d.comp.dur||10),d.fps||30);
      comp.openInViewer(); made=true;
    }
    if(d.fitDur && d.comp.dur && comp.duration<d.comp.dur) comp.duration=d.comp.dur;
    /* in / out points: the comp ends at the out point and the work area covers the range */
    if(d.io){ try{ var fpsI=d.fps||comp.frameRate, ioA=d.io["in"]!=null?d.io["in"]/fpsI:0, ioB=d.io.out!=null?d.io.out/fpsI:comp.duration;
        if(d.io.out!=null&&ioB>ioA) comp.duration=Math.max(ioB,1/fpsI);
        comp.workAreaStart=Math.max(0,Math.min(ioA,comp.duration-1/fpsI)); comp.workAreaDuration=Math.max(1/fpsI,Math.min(ioB,comp.duration)-comp.workAreaStart); }catch(eIO){} }
    if(d.replace) GB_clear(comp);
    var main=comp, fps=d.fps||comp.frameRate, A=d.anim;
    var cam3=(d.rig=="camera");
    // precomps need every link inside them to stay inside them: fine with the AE camera rig (or no animation);
    // the 2D null rig parents the grid and blocks to shared nulls, so it stays flat
    var canPre=cam3||!A;
    var preGrid=org.preGrid&&canPre, preBlocks=org.preBlocks&&canPre;
    var camRefMain='thisComp.layer("GB · Camera")', camRefPre='comp("'+GB_esc(main.name)+'").layer("GB · Camera")';
    if((preGrid||preBlocks)&&GB_compNameUsed(main.name,main)){ preGrid=false; preBlocks=false; out.push("(precomps skipped: another comp is also called “"+main.name+"”)"); }

    // project panel: Grid Blocks / <comp name>
    var folder=null;
    if(org.folder){
      var root=GB_folder("Grid Blocks",null);
      folder=GB_folder(main.name,root);
      if(made) main.parentFolder=root;
    }
    var comps=[main], locks=[], gridKids=[], linesL=null, rulesL=null, shy=[];
    var hdrF=folder?GB_folder("Helpers",folder):null, mediaF=folder?GB_folder("Media",folder):null;
    function inFolder(L){ if(folder){try{if(L.source&&!(L.source instanceof CompItem))L.source.parentFolder=folder;}catch(eF){}} }

    /* ---- background (always in the main comp, 2D) ---- */
    if(d.bg){
      L=main.layers.addSolid(d.bg.color,"GB · Background",main.width,main.height,main.pixelAspect,main.duration);
      L.comment="GridBlocks:bg"; L.label=0; locks.push(L); inFolder(L); out.push("background");
    }

    /* ---- grid: tiles, lines, column rules (under) ---- */
    var gridC=main, gridPre=null;
    if(preGrid&&(d.cells||d.lines||(d.rules&&!d.rules.top))){
      gridPre=GB_precomp(main,"GB Grid · "+main.name,folder,cam3,"grid",15);
      gridPre.layer.name="GB · Grid"; gridC=gridPre.comp; comps.push(gridC); locks.push(gridPre.layer);
    }
    var camRefG=gridC===main?camRefMain:camRefPre;
    if(d.cells){
      if(d.cells.mode=="single"){
        L=GB_multi(gridC,"GB · Tiles",d.cells.rects,d.cells.color);
        L.comment="GridBlocks:cells"; L.label=15; locks.push(L); gridKids.push(L);
      }else{
        for(i=0;i<d.cells.rects.length;i++){
          var q=d.cells.rects[i];
          L=GB_box(gridC,"GB · Tile C"+q[4]+" R"+q[5],q[0],q[1],q[2],q[3],d.cells.color);
          L.comment="GridBlocks:cell"; L.label=15; locks.push(L); gridKids.push(L);
        }
      }
      out.push(d.cells.rects.length+" tiles");
    }
    if(d.lines){
      if(d.lines.mode=="strokes"){
        L=GB_strokes(gridC,"GB · Grid Lines",d.lines.segs,d.lines.color,d.lines.lw,
          'var z=1;try{z=thisComp.layer("GB · Zoom").transform.scale[0]/100;}catch(e){}\n'+d.lines.lw+'/Math.max(z,0.01)');
      }else if(d.lines.rects.length){
        L=GB_multi(gridC,"GB · Grid Lines",d.lines.rects,d.lines.color);
      }else L=null;
      if(L){L.comment="GridBlocks:lines"; L.label=15; locks.push(L); gridKids.push(L); out.push("grid lines"); linesL=L;}
    }
    var rulesC=gridC;
    if(d.rules && !d.rules.top){rulesL=GB_mkRules(gridC,d.rules); if(rulesL){locks.push(rulesL);out.push("column rules");}}
    if(org.headers!==false&&gridC===main&&(linesL||rulesL||d.cells)) GB_header(main,"GRID",hdrF);

    /* ---- blocks, echoes, content ---- */
    var blockC=main, blockPre=null;
    if(preBlocks&&(d.blocks.length||(d.echoes&&d.echoes.length)||d.gaps)){
      blockPre=GB_precomp(main,"GB Blocks · "+main.name,folder,cam3,"blocks",1);
      blockPre.layer.name="GB · Blocks"; blockC=blockPre.comp; comps.push(blockC);
    }
    var camRefB=blockC===main?camRefMain:camRefPre;
    var blocks=[], fillLayers=[], blockLayers=[], mediaL=[]; GB_mediaItems={}; GB_TRIM=!!org.trim; GB_FPS=fps;

    function trimTo(Lr,t){ if(org.trim&&t>0){try{Lr.inPoint=Math.min(main.duration-1/fps,t/fps);}catch(eT){}} }
    function trimOut(Lr,t){ if(org.trim&&t!=null&&t/fps<main.duration){try{if(t/fps>Lr.inPoint)Lr.outPoint=t/fps;}catch(eT2){}} }
    if(d.echoes){for(i=0;i<d.echoes.length;i++){
      var e=d.echoes[i], EL=GB_echoBox(blockC,e); EL.label=4;
      blocks.push({L:EL,T:null,b:{keys:e.keys}});
      if(e.tIn!=null) trimTo(EL,e.tIn);
      var f0e=fillLayers.length; GB_fillItems(blockC,e.fill,EL,fillLayers);
      if(e.tOut!=null){trimOut(EL,e.tOut); for(var fe=f0e;fe<fillLayers.length;fe++) trimOut(fillLayers[fe],e.tOut);}
      for(var fl=f0e;fl<fillLayers.length;fl++){ try{fillLayers[fl].label=4;}catch(eLb){} }
    }
    if(org.headers!==false&&d.echoes.length) GB_header(blockC,"ECHOES ("+d.echoes.length+")",hdrF);
    }
    var nEcho=blocks.length;
    /* one block + everything inside it (media, text, number, content), trimmed and colour-grouped */
    function addBlock(b,i,pre,lab2){
      var B=GB_box(blockC,(pre||"")+b.name,b.x,b.y,b.bw,b.bh,b.color,b.outline?b.outline.w:0);
      B.comment="GridBlocks:block|order="+b.order+"|c="+b.c+"|r="+b.r+"|w="+b.w+"|h="+b.h+(pre?"|layer=2":"");
      B.label=1;
      var ML=null; if(b.media){ var mr=null; try{ mr=GB_mediaLayer(blockC,B,b,b.media,d.mediaRoot,mediaF||folder,main,fps); }catch(eMd){ mr=null; }
        if(mr){ ML=mr.L; mediaL.push({L:ML,B:B,ok:mr.ok}); fillLayers.push(ML); } }
      var T=b.text?GB_text(blockC,B,b):null;
      if(T) T.label=1;
      var NT=null; if(b.num){ d_fps_hack=fps; NT=GB_numText(blockC,B,b); fillLayers.push(NT); }
      blocks.push({L:B,T:T,b:b}); blockLayers.push(B);
      if(b.tIn!=null){trimTo(B,b.tIn); if(T) trimTo(T,b.tIn); if(NT) trimTo(NT,b.tIn); if(ML) trimTo(ML,b.tIn);}
      if(ML&&b.tOut!=null) trimOut(ML,b.tOut);
      var f0=fillLayers.length; GB_fillItems(blockC,b.fill,B,fillLayers);
      if(b.tOut!=null){trimOut(B,b.tOut); if(T) trimOut(T,b.tOut); if(NT) trimOut(NT,b.tOut); for(var fb=f0;fb<fillLayers.length;fb++) trimOut(fillLayers[fb],b.tOut);}
      // one colour per block group (alternating), so each block and everything inside it reads as a band in the timeline
      var grp=[B,T,NT,ML]; for(var fg=f0;fg<fillLayers.length;fg++) grp.push(fillLayers[fg]); GB_labelAll(grp,lab2?(i%2?9:14):(i%2?11:1));
      return {B:B,grp:grp,b:b};
    }
    var firstMainB=null, mainGroups=[];
    for(i=0;i<d.blocks.length;i++){ var gr0=addBlock(d.blocks[i],i,"",false); if(!firstMainB) firstMainB=gr0.B; mainGroups.push(gr0); }
    if(org.headers!==false&&d.blocks.length) GB_header(blockC,"BLOCKS ("+d.blocks.length+")",hdrF);
    if(d.blocks.length) out.push(d.blocks.length+(d.blocks.length==1?" block":" blocks"));
    if(nEcho) out.push(nEcho+(nEcho==1?" echo":" echoes"));
    var gapLayers=[];
    if(d.gaps){GB_fillItems(blockC,d.gaps,null,gapLayers); for(i=0;i<gapLayers.length;i++){gapLayers[i].name="Gap · "+gapLayers[i].name; gapLayers[i].label=2; blocks.push({L:gapLayers[i],T:null,b:{keys:null}});}
      if(org.headers!==false&&gapLayers.length) GB_header(blockC,"BETWEEN BLOCKS ("+gapLayers.length+")",hdrF);}
    /* ---- LAYER 2: a second walk, in front of or behind the main one (per block) ---- */
    var l2groups=[], l2Info=null;
    if(d.layer2&&d.layer2.blocks&&d.layer2.blocks.length){
      var L2=d.layer2, nFront=0;
      if(L2.echoes){ for(i=0;i<L2.echoes.length;i++){ var e2=L2.echoes[i], E2=GB_echoBox(blockC,e2); E2.label=4; E2.name="L2 · "+E2.name; blocks.push({L:E2,T:null,b:{keys:e2.keys}}); if(e2.tIn!=null) trimTo(E2,e2.tIn); if(e2.tOut!=null) trimOut(E2,e2.tOut); if(firstMainB&&L2.z=="behind"){ try{E2.moveAfter(firstMainB);}catch(eE2){} } } }
      var lowL2=null;
      for(i=0;i<L2.blocks.length;i++){ var g2=addBlock(L2.blocks[i],i,"L2 · ",true); l2groups.push(g2);
        var behind=(L2.blocks[i].zz||L2.z)=="behind";
        if(behind&&firstMainB&&!lowL2) lowL2=g2.grp[0];
        if(behind&&firstMainB){ var gg=g2.grp, mo=[gg[0],gg[3],gg[1],gg[2]].concat(gg.slice(4)); for(var gk=0;gk<mo.length;gk++){ var lyr=mo[gk]; if(!lyr) continue; try{ lyr.moveAfter(firstMainB); }catch(eMv){} } }   // bottom-up (block, media, text, number, content) keeps the group's order
        else nFront++; }
      /* main blocks moved in front of / behind layer 2 */
      for(var mg=0;mg<mainGroups.length;mg++){ var mz=mainGroups[mg].b.zz; if(mz!="front"&&mz!="behind") continue; var gm=mainGroups[mg].grp, mo2=[gm[0],gm[3],gm[1],gm[2]].concat(gm.slice(4));
        for(var mk2=0;mk2<mo2.length;mk2++){ var ly=mo2[mk2]; if(!ly) continue; try{ if(mz=="front") ly.moveToBeginning(); else if(lowL2) ly.moveAfter(lowL2); }catch(eMz){} } }
      if(org.headers!==false&&nFront) GB_header(blockC,"LAYER 2 · IN FRONT ("+nFront+")",hdrF);
      out.push(L2.blocks.length+" layer-2 blocks");
      /* layer 2's camera (influence / own camera / no zoom): handled once the rig exists, below */
      l2Info={kids:[],shift:L2.shift,abs:L2.abs,zoom:L2.zoom!==false,ctrl:L2.ctrl||null};
      for(var q2=0;q2<l2groups.length;q2++){ var gq=l2groups[q2].grp; for(var q3=0;q3<gq.length;q3++) if(gq[q3]) l2Info.kids.push(gq[q3]); }
    }
    if(fillLayers.length||gapLayers.length) out.push((fillLayers.length+gapLayers.length)+" content layers");
    if(d.lab){var nl=GB_labWorld(blockC,d.lab,blocks,blockLayers,fps,org,main); if(nl) out.push(nl+" lab layers");}
    if(d.rules && d.rules.top){rulesC=blockC; rulesL=GB_mkRules(blockC,d.rules); if(rulesL){locks.push(rulesL);out.push("column rules on top");}}
    /* per-block order with the column rules (either layer): over rules that sit on top, or under rules that sit below */
    if(rulesL){ try{ var allG=mainGroups.concat(l2groups), nR=0, skipped=0;
      for(var rg=0;rg<allG.length;rg++){ var gz=allG[rg].b&&allG[rg].b.rz; if(!gz) continue; var gL=allG[rg].grp, td=gL.slice(4).reverse().concat([gL[2],gL[1],gL[3],gL[0]]), bu=[gL[0],gL[3],gL[1],gL[2]].concat(gL.slice(4));
        if(gz=="above"&&d.rules.top){ for(var a1=0;a1<td.length;a1++){ if(td[a1]) try{ td[a1].moveBefore(rulesL); }catch(eA){} } nR++; }
        else if(gz=="below"&&!d.rules.top){ if(rulesL.containingComp===blockC){ for(var b1=0;b1<bu.length;b1++){ if(bu[b1]) try{ bu[b1].moveAfter(rulesL); }catch(eB){} } nR++; } else skipped++; } }
      if(nR) out.push(nR+" block"+(nR==1?"":"s")+" reordered with the rules"); if(skipped) out.push("(⚠ "+skipped+" block(s) set behind the rules: the rules are in the grid precomp — turn off the grid precomp to layer blocks under them)");
    }catch(eRz){} }
    if(rulesL&&d.rules.op&&d.rules.op.length){try{GB_keys(GB_xf(rulesL).property("ADBE Opacity"),d.rules.op,fps);}catch(eRo){}}
    var camRefR=rulesC===main?camRefMain:camRefPre;
    /* rules that glide while a choppy camera steps: a hidden null carries the smooth path, and the rules follow it */
    var smoothRef=null;
    if(rulesL&&d.rules&&d.rules.smooth&&d.rules.smooth.length&&A){ try{ var sn=GB_null(main,"GB · Rules camera",cam3), CXs=main.width/2, CYs=main.height/2, sk=[];
        for(var si=0;si<d.rules.smooth.length;si++){ var s0=d.rules.smooth[si]; sk.push([s0[0], cam3?[CXs-s0[1][0],CYs-s0[1][1],0]:(A.zoom?[s0[1][0]-A.zoom.cx,s0[1][1]-A.zoom.cy]:[s0[1][0],s0[1][1]]), "l"]); }
        GB_keys(GB_xf(sn).property("ADBE Position"),sk,fps); sn.comment="GridBlocks:null"; shy.push(sn); try{ sn.enabled=false; }catch(eSe){}
        smoothRef=rulesC===main?'thisComp.layer("GB · Rules camera")':'comp("'+GB_esc(main.name)+'").layer("GB · Rules camera")'; camRefR=smoothRef; out.push("rules glide under the choppy camera"); }catch(eSm){} }

    var cam=null, wrap=null, zoom=null, conv=null;
    if(cam3){
      /* ---- real After Effects camera: everything except the background becomes 3D ---- */
      for(i=0;i<gridKids.length;i++) gridKids[i].threeDLayer=true;
      if(rulesL) rulesL.threeDLayer=true;
      for(i=0;i<blocks.length;i++){blocks[i].L.threeDLayer=true; if(blocks[i].T) blocks[i].T.threeDLayer=true;}
      for(i=0;i<fillLayers.length;i++) fillLayers[i].threeDLayer=true;
      cam=main.layers.addCamera("GB · Camera",[main.width/2,main.height/2]);
      cam.comment="GridBlocks:camera"; cam.label=2;
      try{cam.autoOrient=AutoOrientType.NO_AUTO_ORIENT;}catch(eO){}
      var zv=cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").value;
      var cp=GB_xf(cam).property("ADBE Position");
      cp.setValue([main.width/2,main.height/2,-zv]);
      var zExpr=function(ref,lw){return 'var c='+ref+';\nvar z=Math.abs(c.transform.position[2]);\nvar s=c.cameraOption.zoom/Math.max(1,z);\n'+lw+'/Math.max(s,0.01)';};
      if(d.lines && d.lines.mode=="strokes" && linesL){
        linesL.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").expression=zExpr(camRefG,d.lines.lw);
      }
      if(rulesL && d.rules.mode=="strokes") GB_strokeWidth(rulesL).expression=zExpr(camRefR,d.rules.lw);
      if(A){
        var wrapExpr=function(ref,px,py){return 'var c='+ref+'.transform.position;\n'+
            'var px='+px+', py='+py+';\n'+
            'var dx=c[0]-'+(main.width/2)+', dy=c[1]-'+(main.height/2)+';\n'+
            '[px*Math.round(dx/px), py>0?py*Math.round(dy/py):0, 0]';};
        if(A.wrap3 && rulesL){
          var rw=GB_null(rulesC,"GB · Rules Wrap",true); rw.comment="GridBlocks:null"; shy.push(rw);
          rulesL.parent=rw;
          var rLag=d.rules.lag>0?d.rules.lag/fps:0;
          if((d.rules.parallax!=null&&Math.abs(d.rules.parallax-1)>1e-3)||rLag>0){
            // parallax: the rules move k× the camera (the layer follows the camera by (1-k)), wrapped by whole periods
            // delay: the rules follow where the camera was rLag seconds ago
            GB_xf(rw).property("ADBE Position").expression='var c='+camRefR+'.transform.position;\nvar cL='+camRefR+'.transform.position.valueAtTime(time-'+rLag+');\nvar px='+d.rules.period+', k='+(d.rules.parallax!=null?d.rules.parallax:1)+';\n'+
              'var dx=c[0]-'+(main.width/2)+', dy=c[1]-'+(main.height/2)+';\nvar dxL=cL[0]-'+(main.width/2)+', dyL=cL[1]-'+(main.height/2)+';\nvar sx=dx-k*dxL, sy=dy-k*dyL;\n[sx+px*Math.round((dx-sx)/px), '+(A.wrap3.py>0?'sy+'+A.wrap3.py+'*Math.round((dy-sy)/'+A.wrap3.py+')':'0')+', 0]';
          } else GB_xf(rw).property("ADBE Position").expression=wrapExpr(camRefR,d.rules.period,A.wrap3.py);
          locks.push(rw);
        }
        if(A.conv && A.conv.length){
          conv=GB_null(blockC,"GB · Conveyor",true); conv.comment="GridBlocks:null";
          for(i=0;i<blocks.length;i++) if(!blocks[i].L.parent) blocks[i].L.parent=conv;
        }
        if(A.wrap3 && gridKids.length){
          wrap=GB_null(gridC,"GB · Grid Wrap",true); wrap.comment="GridBlocks:null"; shy.push(wrap);
          for(i=0;i<gridKids.length;i++) gridKids[i].parent=wrap;
          GB_xf(wrap).property("ADBE Position").expression=wrapExpr(camRefG,A.wrap3.px,A.wrap3.py);
          locks.push(wrap);
        }
        GB_blockKeys(blocks,fps);
        if(d.depth&&d.depth.keys){ var dl3=[]; for(i=0;i<nEcho;i++) dl3.push(blocks[i].L); for(i=0;i<blockLayers.length;i++) dl3.push(blockLayers[i]);
          var dn3=GB_depth3D(blockC,dl3,d.depth.keys,fps); if(dn3){ shy.push(dn3); out.push("block depth"); } }
        var hasX=A.camX&&A.camX.length, hasY=A.camY&&A.camY.length, hasZ=A.zoomPct&&A.zoomPct.length;
        if(hasX||hasY||hasZ){
          cp.dimensionsSeparated=true;
          if(hasX) GB_keys(GB_xf(cam).property("ADBE Position_0"),A.camX,fps);
          if(hasY) GB_keys(GB_xf(cam).property("ADBE Position_1"),A.camY,fps);
          if(hasZ){
            var zl=[]; for(i=0;i<A.zoomPct.length;i++){var zk=A.zoomPct[i];zl.push([zk[0],-zv*100/Math.max(0.01,zk[1]),zk[2],zk[3]]);}
            GB_keys(GB_xf(cam).property("ADBE Position_2"),zl,fps);
          }
        }
        if(conv) GB_keys(GB_xf(conv).property("ADBE Position"),A.conv,fps);
        if(A.pan && A.pan.length){
          var fr=GB_null(main,"GB · Framing"); fr.comment="GridBlocks:null"; fr.enabled=false; shy.push(fr);
          GB_keys(GB_xf(fr).property("ADBE Position"),A.pan,fps);
          var shift='var f=thisComp.layer("GB · Framing").transform.position;\nvar z=Math.abs(transform.position[2]);\nvar k=z/cameraOption.zoom;\n';
          if(cp.dimensionsSeparated){
            GB_xf(cam).property("ADBE Position_0").expression=shift+'value-f[0]*k';
            GB_xf(cam).property("ADBE Position_1").expression=shift+'value-f[1]*k';
          }else{
            cp.expression=shift+'[value[0]-f[0]*k,value[1]-f[1]*k,value[2]]';
          }
        }
        out.push(A.label);
      }
      out.push("camera");
    }else if(A){
      /* ---- 2D null rig (everything stays in the main comp) ---- */
      if(A.zoom){
        zoom=GB_null(main,"GB · Zoom");
        zoom.comment="GridBlocks:null";
        GB_xf(zoom).property("ADBE Position").setValue([A.zoom.cx,A.zoom.cy]);
      }
      if(A.needCam){
        cam=GB_null(main,A.camName);
        cam.comment="GridBlocks:null";
        for(i=0;i<blocks.length;i++) blocks[i].L.parent=cam;
        if(zoom) cam.parent=zoom;
      }
      if(A.wrap && cam){
        wrap=GB_null(main,"GB · Grid Wrap");
        wrap.comment="GridBlocks:null"; shy.push(wrap);
        for(i=0;i<gridKids.length;i++) gridKids[i].parent=wrap;
        if(zoom) wrap.parent=zoom;
        var ex='var o=thisComp.layer("'+A.camName+'").transform.position;\n'+
               'var cx='+A.wrap.cx+', cy='+A.wrap.cy+', px='+A.wrap.px+', py='+A.wrap.py+';\n'+
               'var ox=o[0]+cx, oy=o[1]+cy;\n'+
               'var x=ox-px*Math.floor(ox/px);\n'+
               'var y=py>0?oy-py*Math.floor(oy/py):oy;\n[x-cx,y-cy]';
        GB_xf(wrap).property("ADBE Position").expression=ex;
        locks.push(wrap);
      }else if(zoom){
        for(i=0;i<gridKids.length;i++) gridKids[i].parent=zoom;
      }
      if(rulesL){
        if(A.wrap && cam){
          var rw2=GB_null(main,"GB · Rules Wrap"); rw2.comment="GridBlocks:null"; shy.push(rw2);
          rulesL.parent=rw2; if(zoom) rw2.parent=zoom;
          GB_xf(rw2).property("ADBE Position").expression='var o=thisComp.layer("'+(smoothRef?'GB · Rules camera':A.camName)+'").transform.position;\n'+
            'var cx='+A.wrap.cx+', cy='+A.wrap.cy+', px='+d.rules.period+', py='+A.wrap.py+';\n'+
            'var ox=o[0]+cx, oy=o[1]+cy;\nvar x=ox-px*Math.floor(ox/px);\nvar y=py>0?oy-py*Math.floor(oy/py):oy;\n[x-cx,y-cy]';
          locks.push(rw2);
        }else if(zoom) rulesL.parent=zoom;
        if(d.rules.mode=="strokes") GB_strokeWidth(rulesL).expression='var z=1;try{z=thisComp.layer("GB · Zoom").transform.scale[0]/100;}catch(e){}\n'+d.rules.lw+'/Math.max(z,0.01)';
      }
      GB_blockKeys(blocks,fps);
      if(cam) GB_keys(GB_xf(cam).property("ADBE Position"),A.cam,fps);
      if(d.depth&&d.depth.keys){ var dl2=[]; for(i=0;i<nEcho;i++) dl2.push(blocks[i].L); for(i=0;i<blockLayers.length;i++) dl2.push(blockLayers[i]);
        var dn2=GB_depth2D(main,dl2,d.depth.keys,fps,cam,zoom,d.depth.zoomK||1.3889); if(dn2){ shy.push(dn2); out.push("block depth (2D scale)"); } }
      if(zoom) GB_keys(GB_xf(zoom).property("ADBE Scale"),A.zoom.keys,fps);
      /* zoom keeps gaps and text the same size on screen: blocks grow into their gaps, text scales back down */
      if(zoom&&A.zoom.keep){
        var ZX='var z=1;try{z=thisComp.layer("GB · Zoom").transform.scale[0]/100;}catch(e){}\nz=Math.max(z,0.01);\n';
        var keepText=function(L){ try{ if(L&&L.property("ADBE Text Properties")) GB_xf(L).property("ADBE Scale").expression=ZX+'[value[0]/z,value[1]/z];'; }catch(eK){} };
        for(i=0;i<blocks.length;i++){ var bl=blocks[i];
          try{ if(bl.b&&bl.b.bw!=null){ var rs=GB_contents(bl.L).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size"); rs.expression=ZX+'value+['+A.zoom.gut+','+A.zoom.gut+']*(1-1/z);'; } }catch(eR){}
          if(bl.T) keepText(bl.T); keepText(bl.L); }
        for(i=0;i<fillLayers.length;i++) keepText(fillLayers[i]);
      }
      if(zoom && A.zoom.pan) GB_keys(GB_xf(zoom).property("ADBE Position"),A.zoom.pan,fps);
      if(zoom && A.zoom.anchor) GB_keys(GB_xf(zoom).property("ADBE Anchor Point"),A.zoom.anchor,fps);
      out.push(A.label);
    }
    /* ---- layer 2 camera: one null carries layer 2 — by the difference from the main camera (moves with the rig),
       or, when layer 2 ignores the zoom, by its whole offset (outside the rig, 2D) ---- */
    if(l2Info&&l2Info.kids.length){ try{
      var CT=l2Info.ctrl, W2=blockC.width/2, H2=blockC.height/2;
      /* with a control layer in the 2D rig, layer 2 carries its whole camera offset itself (so the control can sit on top
         in screen space: block → camera offset → control → zoom) */
      var useAbs=(!l2Info.zoom||(CT&&!cam3))&&l2Info.abs&&l2Info.abs.length, keysL2=useAbs?l2Info.abs:l2Info.shift, sh=null, ctl=null;
      if(CT){ ctl=GB_null(blockC,"GB · Layer 2 control",false); ctl.comment="GridBlocks:null"; ctl.label=9; GB_xf(ctl).property("ADBE Position").setValue([W2,H2]); }
      if(keysL2&&keysL2.length){
        sh=GB_null(blockC,"GB · Layer 2 camera",false); sh.comment="GridBlocks:null"; sh.label=9;
        for(var q4=0;q4<l2Info.kids.length;q4++){ var kd=l2Info.kids[q4]; try{ if(useAbs&&cam3) kd.threeDLayer=false; if(!kd.parent||(cam&&kd.parent===cam)||(conv&&kd.parent===conv)) GB_jumpParent(kd,sh); }catch(eP){} }
        var shk=keysL2; if(ctl){ shk=[]; for(var q5=0;q5<keysL2.length;q5++){ var kk=keysL2[q5]; shk.push([kk[0],[kk[1][0]-W2,kk[1][1]-H2],kk[2]||"l"]); } GB_jumpParent(sh,ctl); }
        else if(!useAbs&&cam&&!cam3) GB_jumpParent(sh,cam);
        GB_keys(GB_xf(sh).property("ADBE Position"),shk,fps); shy.push(sh); out.push(useAbs&&!CT?"layer 2 outside the zoom":"layer 2 camera offset");
      } else if(ctl){ for(var q6=0;q6<l2Info.kids.length;q6++){ var kd2=l2Info.kids[q6]; try{ if(!kd2.parent||(cam&&kd2.parent===cam)||(conv&&kd2.parent===conv)){ kd2.parent=ctl; } }catch(eP2){} } }
      if(ctl){ var base2=[W2,H2]; if(l2Info.zoom&&zoom&&!cam3&&A&&A.zoom){ GB_jumpParent(ctl,zoom); base2=[W2-(A.zoom.cx!=null?A.zoom.cx:W2),H2-(A.zoom.cy!=null?A.zoom.cy:H2)]; }
        try{ var cp2=GB_xf(ctl).property("ADBE Position"); cp2.setValue([base2[0]+(+CT.x||0),base2[1]+(+CT.y||0)]); if(+CT.r) GB_xf(ctl).property("ADBE Rotate Z").setValue(+CT.r); var cs=(CT.s!=null?+CT.s*100:100);   // payload: s and o are fractions if(Math.abs(cs-100)>1e-3) GB_xf(ctl).property("ADBE Scale").setValue([cs,cs]);
          if(CT.o!=null&&+CT.o<1){ for(var q7=0;q7<l2Info.kids.length;q7++){ try{ var op=GB_xf(l2Info.kids[q7]).property("ADBE Opacity"); if(op.numKeys>0) op.expression='value*'+(+CT.o)+';'; else op.setValue(op.value*(+CT.o)); }catch(eO){} } }
        }catch(eCt){} out.push("layer 2 control layer"); }
    }catch(eSh){} }
    if(d.lab){GB_labScreen(main,d.lab,fps);}
    if(d.trans){var belowL=blockPre?blockPre.layer:(blocks.length?blocks[0].L:null); var nt=GB_trans(main,d,fps,org,folder,comps,belowL,cam); if(nt) out.push(nt+" transition blocks");}
    // the camera (and its framing helper) on top, where animators look for it
    try{ if(cam) cam.moveToBeginning(); }catch(eTop){}

    /* ---- motion blur: every comp we made + every moving layer ---- */
    if(d.mb){
      var ang=Math.max(1,Math.min(720,d.mb.angle||180)), c, k2;
      for(c=0;c<comps.length;c++){
        try{comps[c].motionBlur=true; comps[c].shutterAngle=ang; comps[c].shutterPhase=-ang/2;}catch(eMB){}
        for(k2=1;k2<=comps[c].numLayers;k2++){
          var mL=comps[c].layer(k2);
          if(String(mL.comment).indexOf("GridBlocks")!==0) continue;
          if(String(mL.comment)=="GridBlocks:bg") continue;
          if(/^GridBlocks:(fill|num|text|header|media)/.test(String(mL.comment))) continue;   // content rides on its block: blurring hundreds of text layers is very slow for little gain
          try{ if(!(mL instanceof CameraLayer) && !mL.nullLayer) mL.motionBlur=true; }catch(eMB2){}
        }
      }
      out.push("motion blur "+Math.round(ang)+"°");
    }
    /* ---- tidy: helpers shy, comp markers ---- */
    if(org.shy&&shy.length){
      for(i=0;i<shy.length;i++){try{shy[i].shy=true;}catch(eSh){}}
      for(i=0;i<comps.length;i++){try{comps[i].hideShyLayers=true;}catch(eH){}}
    }
    if(org.markers&&org.markers.length){
      for(i=0;i<org.markers.length;i++){
        try{var m=org.markers[i], mv=new MarkerValue("GB · "+m[1]); if(m[2]) mv.duration=m[2]/fps; main.markerProperty.setValueAtTime(Math.max(0,m[0]/fps),mv);}catch(eMk){}
      }
    }
    /* block transforms (either layer): position / rotation / scale on top of the animation (z = towards / away from camera) */
    var xfGroups=mainGroups.concat(l2groups);
    for(i=0;i<xfGroups.length;i++){ var xb=xfGroups[i].b, XF=xb.xf, BL=xfGroups[i].B; if(!XF) continue;
      try{ var td=BL.threeDLayer, Zc=1.3889*main.width, kz=td?1:Zc/Math.max(50,Zc+(+XF.z||0)), ps=GB_xf(BL).property("ADBE Position"), pv=ps.value;
        if(ps.numKeys===0){ if(td) ps.setValue([pv[0]+(+XF.x||0),pv[1]+(+XF.y||0),(pv[2]||0)+(+XF.z||0)]); else ps.setValue([pv[0]+(+XF.x||0),pv[1]+(+XF.y||0)]); }
        else ps.expression='value+['+(+XF.x||0)+','+(+XF.y||0)+(td?','+(+XF.z||0):'')+']';
        if(+XF.rz) GB_xf(BL).property("ADBE Rotate Z").setValue(+XF.rz);
        if(td){ if(+XF.rx) GB_xf(BL).property("ADBE Rotate X").setValue(+XF.rx); if(+XF.ry) GB_xf(BL).property("ADBE Rotate Y").setValue(+XF.ry); }
        var f=(XF.s!=null?+XF.s:100)/100*kz;
        if(Math.abs(f-1)>1e-4){ var sp=GB_xf(BL).property("ADBE Scale"); if(sp.numKeys>0) sp.expression='value*'+f+';'; else { var sv=sp.value; sp.setValue(td?[sv[0]*f,sv[1]*f,sv[2]*f]:[sv[0]*f,sv[1]*f]); } }
      }catch(eXf){} }
    if(mediaL.length){ GB_mediaMattes(mediaL); out.push(mediaL.length+" media layer"+(mediaL.length>1?"s":"")); }
    if(gridPre||blockPre){var pn=[];if(gridPre)pn.push("grid");if(blockPre)pn.push("blocks");out.push("precomps: "+pn.join(", "));}
    if(d.lock){for(i=0;i<locks.length;i++){try{locks[i].locked=true;}catch(eL){}}}
    var fm=GB_missingFonts(d.fontsUsed); if(fm.length) out.push("⚠ font not installed: "+fm.join(", ")+" (AE used a substitute)");
    if(d.io) out.push("in/out "+(d.io["in"]!=null?"f"+d.io["in"]:"start")+"–"+(d.io.out!=null?"f"+d.io.out:"end"));
    return "OK|"+(made?"New comp “"+main.name+"” · ":"")+"Built "+out.join(", ")+" in “"+main.name+"”"+(folder?" · project items in Grid Blocks › "+folder.name:"");
  }catch(e){
    return "ERR|"+e.toString()+(e.line?" (line "+e.line+")":"");
  }finally{
    app.endUndoGroup();
  }
}
