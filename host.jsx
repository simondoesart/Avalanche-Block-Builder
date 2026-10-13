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
  td.justification=(b.align=="center")?ParagraphJustification.CENTER_JUSTIFY:ParagraphJustification.LEFT_JUSTIFY;
  p.setValue(td);
  var r=T.sourceRectAtTime(0,false), ap, pos;
  if(b.align=="center"){ap=[r.left+r.width/2,r.top+r.height/2];pos=[b.x+b.bw/2,b.y+b.bh/2];}
  else if(b.align=="bl"){ap=[r.left,r.top+r.height];pos=[b.x+b.pad,b.y+b.bh-b.pad];}
  else{ap=[r.left,r.top];pos=[b.x+b.pad,b.y+b.pad];}
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
  var n=0, pre=[];
  for(var i=comp.numLayers;i>=1;i--){
    var l=comp.layer(i);
    if(l.comment && l.comment.indexOf("GridBlocks")===0){
      if(l.comment.indexOf("precomp")>0){try{if(l.source)pre.push(l.source);}catch(eS){}}
      l.locked=false;l.remove();n++;
    }
  }
  for(var j=0;j<pre.length;j++){try{if(pre[j].usedIn.length===0)pre[j].remove();}catch(eR){}}
  return n;
}
/* full-frame transition blocks: in this comp (2D, on top) or inside a matte precomp */
function GB_trans(comp,d,fps){
  var T=d.trans, n=0; if(!T) return 0;
  for(var g=0;g<T.groups.length;g++){
    var G=T.groups[g], target=comp, pre=null;
    if(G.output=="matte"){pre=app.project.items.addComp(G.name,comp.width,comp.height,comp.pixelAspect,comp.duration,comp.frameRate);target=pre;}
    for(var i=0;i<G.tiles.length;i++){
      var t=G.tiles[i], L=GB_box(target,(G.k=="in"?"In ":"Out ")+(i+1),t.x,t.y,t.w,t.h,t.color,0);
      L.comment="GridBlocks:trans"; L.label=G.k=="in"?9:14;
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
      n++;
    }
    if(pre){var PL=comp.layers.add(pre);PL.name=G.name+" (matte)";PL.comment="GridBlocks:trans|precomp";PL.label=G.k=="in"?9:14;}
  }
  return n;
}
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
  T.name=(it.text.split("\r")[0]).substr(0,28);
  T.comment="GridBlocks:fill"; T.label=11;
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
    var el=c.addProperty("ADBE Vector Shape - Ellipse");
    el.property("ADBE Vector Ellipse Size").setValue([it.d,it.d]);
    el.property("ADBE Vector Ellipse Position").setValue([f.x,f.y]);
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
function GB_fillItems(comp,items,parent,list){
  if(!items) return;
  for(var i=0;i<items.length;i++){
    var it=items[i], L=null;
    try{
      if(it.kind=="dots") L=GB_dots(comp,it);
      else if(it.kind=="ring") L=GB_ring(comp,it);
      else if(it.kind=="logo") L=GB_logo(comp,it);
      else L=GB_fillText(comp,it);
    }catch(eI){L=null;}
    if(L){
      if(it.opx){try{GB_xf(L).property("ADBE Opacity").expression=it.opx;}catch(eO){}}
      if(parent) L.parent=parent; list.push(L);
    }
  }
}

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
  app.beginUndoGroup("Grid Blocks: Build");
  try{
    comp=app.project.activeItem;
    if(!(comp && comp instanceof CompItem) || comp.width!=d.comp.w || comp.height!=d.comp.h){
      comp=app.project.items.addComp(d.comp.name||"Grid Blocks",d.comp.w,d.comp.h,1,Math.max(1,d.comp.dur||10),d.fps||30);
      comp.openInViewer(); made=true;
    }
    if(d.fitDur && d.comp.dur && comp.duration<d.comp.dur) comp.duration=d.comp.dur;
    if(d.replace) GB_clear(comp);
    var locks=[], gridKids=[], linesL=null, rulesL=null;

    if(d.bg){
      L=comp.layers.addSolid(d.bg.color,"GB · Background",comp.width,comp.height,comp.pixelAspect,comp.duration);
      L.comment="GridBlocks:bg"; L.label=0; locks.push(L); out.push("background");
    }
    if(d.cells){
      if(d.cells.mode=="single"){
        L=GB_multi(comp,"GB · Tiles",d.cells.rects,d.cells.color);
        L.comment="GridBlocks:cells"; L.label=0; locks.push(L); gridKids.push(L);
      }else{
        for(i=0;i<d.cells.rects.length;i++){
          var q=d.cells.rects[i];
          L=GB_box(comp,"GB · Tile C"+q[4]+" R"+q[5],q[0],q[1],q[2],q[3],d.cells.color);
          L.comment="GridBlocks:cell"; L.label=0; locks.push(L); gridKids.push(L);
        }
      }
      out.push(d.cells.rects.length+" tiles");
    }
    if(d.lines){
      if(d.lines.mode=="strokes"){
        L=GB_strokes(comp,"GB · Grid Lines",d.lines.segs,d.lines.color,d.lines.lw,
          'var z=1;try{z=thisComp.layer("GB · Zoom").transform.scale[0]/100;}catch(e){}\n'+d.lines.lw+'/Math.max(z,0.01)');
      }else if(d.lines.rects.length){
        L=GB_multi(comp,"GB · Grid Lines",d.lines.rects,d.lines.color);
      }else L=null;
      if(L){L.comment="GridBlocks:lines"; L.label=0; locks.push(L); gridKids.push(L); out.push("grid lines"); linesL=L;}
    }
    if(d.rules && !d.rules.top){rulesL=GB_mkRules(comp,d.rules); if(rulesL){locks.push(rulesL);out.push("column rules");}}

    var blocks=[];
    var fillLayers=[];
    if(d.echoes){for(i=0;i<d.echoes.length;i++){var EL=GB_echoBox(comp,d.echoes[i]);blocks.push({L:EL,T:null,b:{keys:d.echoes[i].keys}});GB_fillItems(comp,d.echoes[i].fill,EL,fillLayers);}}
    var nEcho=blocks.length;
    for(i=0;i<d.blocks.length;i++){
      var b=d.blocks[i];
      var B=GB_box(comp,b.name,b.x,b.y,b.bw,b.bh,b.color,b.outline?b.outline.w:0);
      B.comment="GridBlocks:block|order="+b.order+"|c="+b.c+"|r="+b.r+"|w="+b.w+"|h="+b.h;
      B.label=1;
      var T=b.text?GB_text(comp,B,b):null;
      blocks.push({L:B,T:T,b:b});
      GB_fillItems(comp,b.fill,B,fillLayers);
    }
    if(d.blocks.length) out.push(d.blocks.length+(d.blocks.length==1?" block":" blocks"));
    if(nEcho) out.push(nEcho+(nEcho==1?" echo":" echoes"));
    var gapLayers=[];
    if(d.gaps){GB_fillItems(comp,d.gaps,null,gapLayers); for(i=0;i<gapLayers.length;i++) blocks.push({L:gapLayers[i],T:null,b:{keys:null}});}
    if(fillLayers.length||gapLayers.length) out.push((fillLayers.length+gapLayers.length)+" content layers");
    if(d.rules && d.rules.top){rulesL=GB_mkRules(comp,d.rules); if(rulesL){locks.push(rulesL);out.push("column rules on top");}}

    var A=d.anim, fps=d.fps||comp.frameRate, cam=null, wrap=null, zoom=null, conv=null;
    if(d.rig=="camera"){
      /* ---- real After Effects camera: everything except the background becomes 3D ---- */
      for(i=0;i<gridKids.length;i++) gridKids[i].threeDLayer=true;
      if(rulesL) rulesL.threeDLayer=true;
      for(i=0;i<blocks.length;i++){blocks[i].L.threeDLayer=true; if(blocks[i].T) blocks[i].T.threeDLayer=true;}
      for(i=0;i<fillLayers.length;i++) fillLayers[i].threeDLayer=true;
      cam=comp.layers.addCamera("GB · Camera",[comp.width/2,comp.height/2]);
      cam.comment="GridBlocks:camera"; cam.label=2;
      try{cam.autoOrient=AutoOrientType.NO_AUTO_ORIENT;}catch(eO){}
      var zv=cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").value;
      var cp=GB_xf(cam).property("ADBE Position");
      cp.setValue([comp.width/2,comp.height/2,-zv]);
      if(d.lines && d.lines.mode=="strokes" && linesL){
        linesL.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").expression=
          'var c=thisComp.layer("GB · Camera");\nvar z=Math.abs(c.transform.position[2]);\nvar s=c.cameraOption.zoom/Math.max(1,z);\n'+d.lines.lw+'/Math.max(s,0.01)';
      }
      if(rulesL && d.rules.mode=="strokes"){
        GB_strokeWidth(rulesL).expression='var c=thisComp.layer("GB · Camera");\nvar z=Math.abs(c.transform.position[2]);\nvar s=c.cameraOption.zoom/Math.max(1,z);\n'+d.rules.lw+'/Math.max(s,0.01)';
      }
      if(A){
        if(A.wrap3 && rulesL){
          var rw=GB_null(comp,"GB · Rules Wrap",true); rw.comment="GridBlocks:null";
          rulesL.parent=rw;
          GB_xf(rw).property("ADBE Position").expression='var c=thisComp.layer("GB · Camera").transform.position;\n'+
            'var px='+d.rules.period+', py='+A.wrap3.py+';\n'+
            'var dx=c[0]-'+(comp.width/2)+', dy=c[1]-'+(comp.height/2)+';\n'+
            '[px*Math.round(dx/px), py>0?py*Math.round(dy/py):0, 0]';
          locks.push(rw);
        }
        if(A.conv && A.conv.length){
          conv=GB_null(comp,"GB · Conveyor",true); conv.comment="GridBlocks:null";
          for(i=0;i<blocks.length;i++) blocks[i].L.parent=conv;
        }
        if(A.wrap3 && gridKids.length){
          wrap=GB_null(comp,"GB · Grid Wrap",true); wrap.comment="GridBlocks:null";
          for(i=0;i<gridKids.length;i++) gridKids[i].parent=wrap;
          GB_xf(wrap).property("ADBE Position").expression='var c=thisComp.layer("GB · Camera").transform.position;\n'+
            'var px='+A.wrap3.px+', py='+A.wrap3.py+';\n'+
            'var dx=c[0]-'+(comp.width/2)+', dy=c[1]-'+(comp.height/2)+';\n'+
            '[px*Math.round(dx/px), py>0?py*Math.round(dy/py):0, 0]';
          locks.push(wrap);
        }
        GB_blockKeys(blocks,fps);
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
          var fr=GB_null(comp,"GB · Framing"); fr.comment="GridBlocks:null"; fr.enabled=false;
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
      /* ---- 2D null rig ---- */
      if(A.zoom){
        zoom=GB_null(comp,"GB · Zoom");
        zoom.comment="GridBlocks:null";
        GB_xf(zoom).property("ADBE Position").setValue([A.zoom.cx,A.zoom.cy]);
      }
      if(A.needCam){
        cam=GB_null(comp,A.camName);
        cam.comment="GridBlocks:null";
        for(i=0;i<blocks.length;i++) blocks[i].L.parent=cam;
        if(zoom) cam.parent=zoom;
      }
      if(A.wrap && cam){
        wrap=GB_null(comp,"GB · Grid Wrap");
        wrap.comment="GridBlocks:null";
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
          var rw2=GB_null(comp,"GB · Rules Wrap"); rw2.comment="GridBlocks:null";
          rulesL.parent=rw2; if(zoom) rw2.parent=zoom;
          GB_xf(rw2).property("ADBE Position").expression='var o=thisComp.layer("'+A.camName+'").transform.position;\n'+
            'var cx='+A.wrap.cx+', cy='+A.wrap.cy+', px='+d.rules.period+', py='+A.wrap.py+';\n'+
            'var ox=o[0]+cx, oy=o[1]+cy;\nvar x=ox-px*Math.floor(ox/px);\nvar y=py>0?oy-py*Math.floor(oy/py):oy;\n[x-cx,y-cy]';
          locks.push(rw2);
        }else if(zoom) rulesL.parent=zoom;
        if(d.rules.mode=="strokes") GB_strokeWidth(rulesL).expression='var z=1;try{z=thisComp.layer("GB · Zoom").transform.scale[0]/100;}catch(e){}\n'+d.rules.lw+'/Math.max(z,0.01)';
      }
      GB_blockKeys(blocks,fps);
      if(cam) GB_keys(GB_xf(cam).property("ADBE Position"),A.cam,fps);
      if(zoom) GB_keys(GB_xf(zoom).property("ADBE Scale"),A.zoom.keys,fps);
      if(zoom && A.zoom.pan) GB_keys(GB_xf(zoom).property("ADBE Position"),A.zoom.pan,fps);
      out.push(A.label);
    }
    if(d.trans){var nt=GB_trans(comp,d,d.fps||comp.frameRate); if(nt) out.push(nt+" transition blocks");}
    if(d.mb){
      // motion blur: comp switch + shutter, and the switch on every Grid Blocks layer that can carry it
      try{comp.motionBlur=true; comp.shutterAngle=Math.max(1,Math.min(720,d.mb.angle||180)); comp.shutterPhase=-comp.shutterAngle/2;}catch(eMB){}
      for(i=1;i<=comp.numLayers;i++){
        var mL=comp.layer(i);
        if(String(mL.comment).indexOf("GridBlocks")!==0) continue;
        if(String(mL.comment)=="GridBlocks:bg") continue;
        try{ if(!(mL instanceof CameraLayer) && !mL.nullLayer) mL.motionBlur=true; }catch(eMB2){}
      }
      out.push("motion blur "+Math.round(comp.shutterAngle)+"°");
    }
    if(d.lock){for(i=0;i<locks.length;i++){locks[i].locked=true;}}
    return "OK|"+(made?"New comp “"+comp.name+"” · ":"")+"Built "+out.join(", ")+" in “"+comp.name+"”";
  }catch(e){
    return "ERR|"+e.toString()+(e.line?" (line "+e.line+")":"");
  }finally{
    app.endUndoGroup();
  }
}
