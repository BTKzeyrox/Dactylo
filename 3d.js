(function(){
if(!window.THREE)return;
var T=THREE;
(function(){if(!document.head)return;var s=document.createElement("style");s.textContent=".hands.h3d{height:clamp(180px,41vh,480px)!important;max-width:920px!important;width:100%}.hands.h3d canvas{display:block;width:100%;height:100%}@media (min-width:1001px){.lgrid.in0 .lhelp .hands.h3d{display:flex!important;height:clamp(170px,36vh,420px)!important}}";document.head.appendChild(s)})();
function css(n){return (getComputedStyle(document.documentElement).getPropertyValue(n)||"").trim()||"#cccccc"}
function gl(cv){try{return new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true})}catch(e){return null}}
function isDark(){var t=document.documentElement.getAttribute("data-theme");return t==="dark"||(!t&&window.matchMedia&&matchMedia("(prefers-color-scheme:dark)").matches)}
function pm(c,o){var m=new T.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.6,metalness:0},o||{}));return m}

/* ---------- Mains 3D sur clavier ---------- */
var H3=window.H3={};
var KP=.45,KT=.2,KW=.42;
var KS=[["²|&1|é2|\"3|'4|(5|-6|è7|_8|ç9|à0|)°|=+",0,[1,1,2,3,4,4,5,5,6,7,8,8,8]],["a|z|e|r|t|y|u|i|o|p|^¨|$£",1.5,[1,2,3,4,4,5,5,6,7,8,8,8]],["q|s|d|f|g|h|j|k|l|m|ù%|*µ",1.75,[1,2,3,4,4,5,5,6,7,8,8,8]],["<>|w|x|c|v|b|n|,?|;.|:/|!§",1.25,[1,1,2,3,4,4,5,6,7,8,8]]];
var HOME={1:"q",2:"s",3:"d",4:"f",5:"j",6:"k",7:"l",8:"m"};
var PAST={1:"#F7C6D0",2:"#F9D5B0",3:"#F8EAA8",4:"#CBE8B8",5:"#BFE0F0",6:"#D8CCF0",7:"#B8E8DC",8:"#F4BDB5",9:"#EBDDC8"};
function toonMap(){var d=new T.DataTexture(new Uint8Array([215,238,255]),3,1,T.LuminanceFormat);d.minFilter=d.magFilter=T.NearestFilter;d.needsUpdate=true;return d}
function rbox(w,h,d,r,seg,tap){var g=new T.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,v=new T.Vector3(),c=new T.Vector3(),hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(var i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(Math.max(-hw,Math.min(hw,v.x)),Math.max(-hh,Math.min(hh,v.y)),Math.max(-hd,Math.min(hd,v.z)));v.sub(c).normalize().multiplyScalar(r);var x=c.x+v.x,y=c.y+v.y,z=c.z+v.z;
  if(tap){var t=(1-z/(d/2))/2;x*=.66+.34*t;y*=.78+.22*t}p.setXYZ(i,x,y,z)}
 g.computeVertexNormals();return g}
/* Cinématique inverse d'un doigt (3 phalanges, longueurs constantes) */
function ik(l,r,dy){var D=Math.hypot(r,dy),ang=Math.atan2(dy,r),best=null;
 for(var a2=-1.9;a2<=.06;a2+=.01){var a3=.67*a2,ux=l[0]+l[1]*Math.cos(a2)+l[2]*Math.cos(a2+a3),uy=l[1]*Math.sin(a2)+l[2]*Math.sin(a2+a3),e=Math.abs(Math.hypot(ux,uy)-D);if(!best||e<best.e)best={e:e,a2:a2,a3:a3,ux:ux,uy:uy}}
 var a1=Math.max(-1.25,Math.min(.9,ang-Math.atan2(best.uy,best.ux))),tx,ty,b=a1;
 tx=l[0]*Math.cos(b);ty=l[0]*Math.sin(b);b+=best.a2;tx+=l[1]*Math.cos(b);ty+=l[1]*Math.sin(b);b+=best.a3;tx+=l[2]*Math.cos(b);ty+=l[2]*Math.sin(b);
 return {a:[a1,best.a2,best.a3],err:Math.hypot(tx-r,ty-dy)}}
H3.init=function(box){
 var cv=document.createElement("canvas"),r=gl(cv);if(!r)return false;r.localClippingEnabled=true;
 box.innerHTML="";box.appendChild(cv);r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 var sc=new T.Scene(),cam=new T.PerspectiveCamera(24,2,.1,100);
 var hemi=new T.HemisphereLight(0xffffff,isDark()?0x9aa6c2:0xe6d8c0,1.3);sc.add(hemi,new T.AmbientLight(0xffffff,.55));var dl=new T.DirectionalLight(0xffffff,.8);dl.position.set(-2,6,4);sc.add(dl);
 var gm=toonMap(),accent=new T.Color(css("--acc")),SKIN=function(){return isDark()?"#CDA382":"#E6BFA1"},OUT=function(){return isDark()?0x6e4a36:0x8f5f40};
 var outM=new T.MeshBasicMaterial({color:OUT(),side:T.BackSide}),kOutM=new T.MeshBasicMaterial({color:0xbfae92,side:T.BackSide}),preM=new T.MeshBasicMaterial({colorWrite:false});
 var skins=[];function sk(){var m=new T.MeshToonMaterial({color:SKIN(),gradientMap:gm,transparent:true,opacity:.84,depthWrite:false});skins.push(m);return m}
 var nailM=new T.MeshToonMaterial({color:0xf3dccd,gradientMap:gm,transparent:true,opacity:.92,depthWrite:false}),cuffM=new T.MeshToonMaterial({color:isDark()?0xcfd6ea:0xfff5e6,gradientMap:gm,transparent:true,opacity:.78,depthWrite:false});
 function part(geo,mat,parent,t,o2,ghost,ro){var m=new T.Mesh(geo,mat);geo.computeBoundingSphere();if(o2!=="none"){var o=new T.Mesh(geo,o2||outM);o.scale.setScalar(1+(t||.05)/Math.max(.1,geo.boundingSphere.radius));m.add(o)}if(ghost)m.add(new T.Mesh(geo,ghost===true?preM:ghost));if(ro)m.renderOrder=ro;parent.add(m);return m}
 /* clavier complet */
 var keys={},kg=new T.Group(),baseM=new T.MeshToonMaterial({color:isDark()?0x9aa6c2:0xf1e8d2,gradientMap:gm,transparent:true,opacity:.45,depthWrite:false});
 var base=part(rbox(7.2,.14,3.1,.1,4),baseM,kg,.03,"none",false,1);base.position.set(3.15,KT-.2,.1);
 function capCol(fid,neutral){return new T.Color(isDark()?0xe4e9f5:0xfff7e8).lerp(new T.Color(PAST[fid]),neutral?.04:.2)}
 function lab(c,main,small){var g=c.getContext("2d"),w=c.width,h=c.height;g.clearRect(0,0,w,h);g.fillStyle="#3A2F45";g.textAlign="center";g.textBaseline="middle";g.font="700 "+(main.length>5?30:main.length>2?40:78)+"px Poppins,Arial,sans-serif";g.fillText(main,w/2,small?h*.58:h*.54);
  if(small){g.font="700 38px Poppins,Arial,sans-serif";g.textAlign="left";g.textBaseline="top";g.globalAlpha=.75;g.fillText(small,12,6);g.globalAlpha=1}}
 function mkKey(name,x,z,w,fid,main,small,mark,dp,neutral){dp=dp||KW;var geo=rbox(w,.16,dp,.05,3),m=new T.MeshToonMaterial({color:capCol(fid,neutral),gradientMap:gm,transparent:true,opacity:.9}),mesh=part(geo,m,kg,.022,kOutM,false,2);mesh.position.set(x,KT-.08,z);
  var c=document.createElement("canvas");c.width=Math.round(128*w/KW);c.height=Math.round(128*dp/KW);lab(c,main,small);var tex=new T.CanvasTexture(c);
  var top=new T.Mesh(new T.PlaneGeometry(w*.94,dp*.94),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));top.rotation.x=-Math.PI/2;top.position.y=.083;top.renderOrder=3;mesh.add(top);
  if(mark){var bar=new T.Mesh(new T.BoxGeometry(.16,.02,.035),new T.MeshBasicMaterial({color:0x3a2f45}));bar.position.set(0,.085,.16);mesh.add(bar)}
  keys[name]={mesh:mesh,m:m,fid:fid,neutral:neutral,x:x,z:z,w:w,d:dp,y0:KT-.08,c:c,main:main,small:small,tex:tex,dep:0}}
 KS.forEach(function(rw,ri){rw[0].split("|").forEach(function(s,j){var b=s[0],low=/[a-z]/.test(b),sh=s[1]||(low?b.toUpperCase():"");mkKey(b,(rw[1]+j)*KP,(ri-2)*KP,KW,rw[2][j],low?b.toUpperCase():b,sh&&!low?sh:"",b==="f"||b==="j")})});
 function ex(name,left,wu,row,fid,label,dp,neutral){mkKey(name,(left+wu/2-.5)*KP,row*KP,wu*KP-.03,fid,label,"",false,dp,neutral)}
 ex("sl",0,1.25,1,1,"Maj");ex("sr",12.25,2.75,1,8,"Maj");ex(" ",3.75,6.25,2,9,"espace");ex("ag",10,1.25,2,9,"AltGr");
 ex("bks",13,2,-2,8,"Retour",0,1);ex("tab",0,1.5,-1,1,"Tab",0,1);ex("caps",0,1.75,0,1,"Verr. Maj",0,1);ex("ent",13.75,1.25,-.5,8,"Entrée",KW+KP,1);
 ex("ctrl1",0,1.25,2,1,"Ctrl",0,1);ex("win1",1.25,1.25,2,1,"Win",0,1);ex("alt1",2.5,1.25,2,2,"Alt",0,1);ex("win2",11.25,1.25,2,8,"Win",0,1);ex("menu",12.5,1.25,2,8,"Menu",0,1);ex("ctrl2",13.75,1.25,2,8,"Ctrl",0,1);
 /* anneaux visibles à travers les mains */
 var rings=[];for(var q=0;q<10;q++){var rg=new T.Mesh(new T.RingGeometry(.84,1,32),new T.MeshBasicMaterial({color:accent,transparent:true,opacity:.95,depthTest:false,depthWrite:false,side:T.DoubleSide}));rg.rotation.x=-Math.PI/2;rg.renderOrder=999;rg.visible=false;sc.add(rg);rings.push(rg)}
 /* mains */
 var grp=new T.Group(),hands=[],F={},acts={},hl={},REST=[-.04,-.16,-.12];
 grp.add(kg);
 function finger(k,rb,mat,om,gh){var g=new T.Group(),segs=[],par=g,len=[.66*k,.48*k,.38*k],rad=[rb,rb*.88,rb*.78,rb*.68];
  for(var s=0;s<3;s++){var pv=new T.Group();pv.position.z=s?-len[s-1]:0;par.add(pv);par=pv;segs.push(pv);
   var cyl=new T.CylinderGeometry(rad[s],rad[s+1],len[s],14);cyl.rotateX(Math.PI/2);cyl.translate(0,0,-len[s]/2);part(cyl,mat,pv,.045,om||null,gh||true,4);part(new T.SphereGeometry(rad[s]*.98,14,10),mat,pv,.045,om||null,gh||true,4)}
  var tip=part(new T.SphereGeometry(rad[3],14,10),mat,segs[2],.045,om||null,gh||true,4);tip.position.z=-len[2];
  var n=new T.Mesh(new T.SphereGeometry(rad[3]*.86,12,8),nailM);n.scale.set(.95,.3,1.35);n.position.set(0,rad[3]*.72,-len[2]*.72);n.renderOrder=5;segs[2].add(n);
  return {g:g,segs:segs,len:len,L:len[0]+len[1]+len[2],rt:rad[3],ang:REST.slice(),yaw:0,p:0,mat:mat}}
 /* Découpe sous le pouce : le bord intérieur de la main suit une ligne droite, du bas du clavier jusqu'au poignet.
   Tout ce qui dépasse de cette ligne vers le centre (bosse sous le pouce, base du pouce, coins de la paume) est coupé.
   Repère de la main : u = distance vers le centre du clavier, z = vers l'utilisateur.
   La ligne va de (u0,z0), au bord de la main au niveau du bas du clavier, à (u1,z1), en haut du poignet. */
var CUT={u0:1.146,z0:.047,u1:.646,z1:1.42},outHs=[];
function cutMats(s){var pa=new T.Plane(),pb=new T.Plane(new T.Vector3(0,0,1),0),cl=function(m){m.clippingPlanes=[pa,pb];m.clipIntersection=true;return m};
 var o=cl(new T.MeshBasicMaterial({color:OUT(),side:T.BackSide}));outHs.push(o);
 return {pa:pa,pb:pb,s:s,cl:cl,out:o,pre:cl(new T.MeshBasicMaterial({colorWrite:false}))}}
/* les plans sont en coordonnées du monde : on les replace à chaque image avec la main (qui ne fait que se déplacer) */
function cutStrip(s){var zs=.15,us=CUT.u0+(CUT.u1-CUT.u0)*(zs-CUT.z0)/(CUT.z1-CUT.z0),dx=s*(CUT.u1-us),dz=CUT.z1-zs,mt=new T.MeshBasicMaterial({color:OUT()});outHs.push(mt);
 var m=new T.Mesh(new T.BoxGeometry(.05,.5,Math.hypot(dx,dz)),mt);m.position.set(s*(us+CUT.u1)/2,0,(zs+CUT.z1)/2);m.rotation.y=Math.atan2(dx,dz);m.renderOrder=4;return m}
function cutUpdate(H){var c=H.cut,P=H.g.position,n=new T.Vector3(-c.s*(CUT.z1-CUT.z0),0,CUT.u1-CUT.u0).normalize();
 c.pa.normal.copy(n);c.pa.constant=-(n.x*(P.x+c.s*CUT.u0)+n.z*(P.z+CUT.z0));c.pb.constant=-(P.z+CUT.z1)}
var spec={1:[-.78,.8,.9],2:[-.33,.96,1],3:[.12,1,1.03],4:[.56,.94,1]};
 [0,1].forEach(function(h){var s=h?-1:1,hg=new T.Group(),H={g:hg,objs:[],ox:0,oz:0,right:h},pm0=sk(),ct=H.cut=cutMats(s);ct.cl(pm0);
  var palm=part(rbox(2,.46,2,.22,8,true),pm0,hg,.06,ct.out,ct.pre,4);palm.position.set(0,0,.4);
  for(var f=1;f<=4;f++){var id=h?9-f:f,sp=spec[f],fg=finger(sp[1]*1.12,.15*sp[2],sk());fg.g.position.set(s*sp[0],.03,-.6);hg.add(fg.g);fg.id=id;fg.H=H;(F[id]=F[id]||[]).push(fg);H.objs.push(fg);
   var kn=part(new T.SphereGeometry(.19*sp[2],12,8),fg.mat,hg,.045,null,true,4);kn.position.set(s*sp[0],.17,-.5);kn.scale.set(1,.55,1)}
  var mound=part(new T.SphereGeometry(.5,14,10),pm0,hg,.05,ct.out,ct.pre,4);mound.scale.set(.8,.5,1.35);mound.position.set(s*.78,-.04,.55);mound.rotation.y=s*.25;
  var th=finger(1.1,.19,ct.cl(sk()),ct.out,ct.pre);th.g.position.set(s*.93,0,.62);th.id=9;th.H=H;th.right=!!h;th.thumb=true;hg.add(th.g);(F[9]=F[9]||[]).push(th);H.objs.push(th);hg.add(cutStrip(s));
  var wg=new T.CylinderGeometry(.62,.5,1.5,18);wg.rotateX(Math.PI/2);var wr=part(wg,pm0,hg,.05,null,true,4);wr.position.set(0,-.02,2.1);wr.scale.y=.74;
  var cg=new T.CylinderGeometry(.7,.7,.6,20);cg.rotateX(Math.PI/2);var cu=part(cg,cuffM,hg,.04,null,false,5);cu.position.set(0,-.02,2.75);cu.scale.y=.85;
  H.home=new T.Vector3(h?keys.m.x-.78:keys.q.x+.78,.62,1.75);hg.position.copy(H.home);grp.add(hg);hands.push(H)});
 sc.add(grp);
 function homeT(o){if(o.thumb)return new T.Vector3(o.right?3.05:2.6,KT+o.rt+.02,.8);var k=keys[HOME[o.id]];return new T.Vector3(k.x,KT+o.rt+.01,k.z)}
 var all=[];hands.forEach(function(H){H.objs.forEach(function(o){o.tp=homeT(o);o.want=o.tp.clone();all.push(o)})});
 var ctr=new T.Vector3(3.15,.3,.9),size=new T.Vector3(7.2,1.2,3.9),lw=0,lh=0,last=0,dirN=new T.Vector3(0,.96,.28).normalize();
 function fit(){var v=cam.fov*Math.PI/360,se=dirN.y,ce=Math.sqrt(1-se*se),hh=(size.z*se+size.y*ce)/2*1.04,hw=size.x/2*1.02,d=Math.max(hh/Math.tan(v),hw/(Math.tan(v)*cam.aspect));cam.position.copy(ctr).addScaledVector(dirN,d);cam.lookAt(ctr)}
 function step(dt,t){
  all.forEach(function(o){var lst=acts[o.id],k=lst&&(o.id!==9||o.right)?keys[lst[Math.floor(t/1500)%lst.length]]:null;o.key=k;o.want.copy(k?new T.Vector3(k.x,KT+o.rt+(o.p>0?0:.17),k.z):homeT(o))});
  hands.forEach(function(H){var ox=0,oz=0;H.objs.forEach(function(o){if(!o.key||o.thumb)return;var kx=H.home.x+o.g.position.x,kz=H.home.z+o.g.position.z,dx=o.want.x-kx,dz=o.want.z-kz,rr=Math.hypot(dx,dz),lim=o.L*.96;if(rr>lim){var e=rr-lim;ox=dx/rr*e;oz=dz/rr*e}});
   var q=Math.min(1,dt*9);H.ox+=(ox-H.ox)*q;H.oz+=(oz-H.oz)*q;H.g.position.set(H.home.x+H.ox,H.home.y,H.home.z+H.oz);cutUpdate(H)});
  all.forEach(function(o){o.tp.lerp(o.want,1-Math.exp(-dt*16));var Hp=o.H.g.position,kx=Hp.x+o.g.position.x,ky=Hp.y+o.g.position.y,kz=Hp.z+o.g.position.z,dx=o.tp.x-kx,dz=o.tp.z-kz,dy=o.tp.y-ky,rr=Math.hypot(dx,dz),yaw=0,ang=REST;
   if(dz<-.05){var res=ik(o.len,rr,dy),ok=res.err<.05;
    if(!ok&&o.thumb){var D=Math.hypot(rr,dy),s2=Math.max(.5*o.L,Math.min(.995*o.L,D))/D;res=ik(o.len,rr*s2,dy*s2);ok=true}
    if(ok){ang=res.a;yaw=Math.max(-.8,Math.min(.8,Math.atan2(-dx,-dz)))}}
   var a=Math.min(1,dt*18);o.yaw+=(yaw-o.yaw)*a;o.g.rotation.y=o.yaw;for(var j=0;j<3;j++){o.ang[j]+=(ang[j]-o.ang[j])*a;o.segs[j].rotation.x=o.ang[j]}o.p-=dt;
   var on=!!(o.key&&(o.id!==9||o.right));o.glow=(o.glow||0)+((on?1:0)-(o.glow||0))*Math.min(1,dt*12);o.mat.emissive.copy(accent).multiplyScalar(o.glow*(.28+.1*Math.sin(t/130)));o.mat.color.set(SKIN()).lerp(accent,o.glow*.14)});
  var ri=0;for(var n in keys){var K=keys[n],pr=false;for(var m=0;m<all.length;m++)if(all[m].p>0&&all[m].key===K)pr=true;K.dep+=((pr?1:0)-K.dep)*Math.min(1,dt*30);K.mesh.position.y=K.y0-.06*K.dep;
   var h1=hl[n]?1:0;K.hv=(K.hv||0)+(h1-(K.hv||0))*Math.min(1,dt*14);K.m.color.copy(capCol(K.fid,K.neutral)).lerp(accent,.92*K.hv).lerp(new T.Color(1,1,1),.35*K.dep*K.hv);
   if(h1&&ri<rings.length){var rg=rings[ri++],pu=1+.1*Math.sin(t/140);rg.visible=true;rg.position.set(K.x,KT+.1,K.z);rg.scale.set(K.w*.46+.015*pu,K.d*.46+.015*pu,1);rg.material.color.copy(accent)}}
  for(;ri<rings.length;ri++)rings[ri].visible=false}
 var kbEl=document.getElementById("kb"),kbHid=null;
 function loop(t){requestAnimationFrame(loop);var vis=!!box.offsetParent;if(kbEl&&kbHid!==vis){kbHid=vis;kbEl.style.display=vis?"none":""}if(!vis)return;var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
  if(w!==lw||h!==lh){lw=w;lh=h;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();fit()}
  var dt=Math.min(.05,(t-last)/1000||.016);last=t;step(dt,t);r.render(sc,cam)}
 requestAnimationFrame(loop);
 function add(f,k){(acts[f]=acts[f]||[]);if(acts[f].indexOf(k)<0)acts[f].push(k);hl[k]=1}
 H3.keys=function(list){acts={};hl={};(list||[]).forEach(function(x){if(x&&keys[x.k])add(x.f,x.k)})};
 H3.set=function(ids){acts={};hl={};var els=document.querySelectorAll("#kb .key.next");for(var q=0;q<els.length;q++){var k=els[q].dataset.k,m=/(?:^|\s)f(\d)(?:\s|$)/.exec(els[q].className);if(m&&keys[k])add(+m[1],k)}};
 H3.press=function(id){(F[id]||[]).forEach(function(o){if(!o.thumb||o.right)o.p=.16})};
 H3.recolor=function(){accent.set(css("--acc"));outM.color.set(OUT());outHs.forEach(function(m){m.color.set(OUT())});hemi.groundColor.set(isDark()?0x9aa6c2:0xe6d8c0);cuffM.color.set(isDark()?0xcfd6ea:0xfff5e6);baseM.color.set(isDark()?0x9aa6c2:0xf1e8d2)};
 return true};

/* ---------- Course 3D ---------- */
var R3=window.R3={on:false},st=null,dark=isDark();
var CCOL=["#5b5bf0","#e0a100","#c93d78","#2fa36b"],LEN=44,LZ=2.2;
function mkCar(col){var g=new T.Group(),bg=new T.BoxGeometry(2.6,.55,1.2,4,2,3),bm=pm(col),body=new T.Mesh(bg,bm);body.position.y=.55;g.add(body);
 var cm=pm(0xbfe6ff,{roughness:.2}),cab=new T.Mesh(new T.BoxGeometry(1.2,.45,.98),cm);cab.position.set(-.1,1.02,0);g.add(cab);
 var wh=[],wm=pm(0x222233);[[.85,.62],[.85,-.62],[-.85,.62],[-.85,-.62]].forEach(function(p){var w=new T.Mesh(new T.CylinderGeometry(.32,.32,.28,10),wm);w.rotation.x=Math.PI/2;w.position.set(p[0],.32,p[1]);g.add(w);wh.push(w)});
 var hm=pm(0xffe066,{emissive:0xffcc33,emissiveIntensity:.8});[-.4,.4].forEach(function(z){var l=new T.Mesh(new T.BoxGeometry(.06,.14,.28),hm);l.position.set(1.31,.62,z);g.add(l)});
 var sp=new T.Mesh(new T.BoxGeometry(.18,.06,1.1),pm(0x3a2f45));sp.position.set(-1.2,1.05,0);g.add(sp);
 [-.4,.4].forEach(function(z){var p=new T.Mesh(new T.BoxGeometry(.06,.3,.06),pm(0x3a2f45));p.position.set(-1.2,.9,z);g.add(p)});
 var sh=new T.Mesh(new T.PlaneGeometry(3,1.6),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;g.add(sh);
 var n=[];for(var i=0;i<bg.attributes.position.count;i++)n.push([Math.random(),Math.random(),Math.random()]);
 var fl=new T.Mesh(new T.ConeGeometry(.28,1.3,6),new T.MeshBasicMaterial({color:0xff9f43}));fl.rotation.z=Math.PI/2;fl.position.set(-2.1,.6,0);fl.visible=false;g.add(fl);
 g.userData={bm:bm,cab:cab,cm:cm,base:new T.Color(col),orig:Float32Array.from(bg.attributes.position.array),n:n,bg:bg,wheels:wh,flame:fl,d:0};return g}
function dent(car,d){var u=car.userData,a=u.bg.attributes.position,o=u.orig;for(var i=0;i<a.count;i++){var x=o[i*3],y=o[i*3+1],z=o[i*3+2],w=Math.max(0,Math.min(1,(x-.2)/1.1)),q=u.n[i];
  a.setXYZ(i,x-w*d*.55*(.5+q[0])+(q[0]-.5)*d*.1,y-w*d*.14*q[1]+(q[1]-.5)*d*.08,z+(q[2]-.5)*d*.12)}
 a.needsUpdate=true;u.bg.computeVertexNormals();u.bm.color.copy(u.base).lerp(new T.Color(0x3a3340),d*.45);u.cab.rotation.z=d*.12;u.cm.color.set(d>.3?0x7f8a99:0xbfe6ff);u.d=d}
function build(){
 var host=document.querySelector("#stage .stagebox"),cv=document.createElement("canvas");if(!host)return null;cv.className="cv3";var r=gl(cv);if(!r)return null;
 host.insertBefore(cv,host.firstChild);r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 var sc=new T.Scene(),cam=new T.PerspectiveCamera(35,2.14,.5,300),hemi=new T.HemisphereLight(0xffffff,0x88aa66,1),sun=new T.DirectionalLight(0xffffff,.9);sun.position.set(10,20,12);sc.add(hemi,sun);
 var ground=new T.Mesh(new T.PlaneGeometry(260,90),pm(0x9bd36b,{flatShading:false}));ground.rotation.x=-Math.PI/2;ground.position.set(22,0,0);sc.add(ground);
 var road=pm(0x394152,{flatShading:false});for(var i=0;i<4;i++){var s=new T.Mesh(new T.BoxGeometry(LEN+16,.06,LZ),road);s.position.set(LEN/2,.03,(i-1.5)*LZ);sc.add(s)}
 var dm=new T.InstancedMesh(new T.BoxGeometry(1.2,.02,.1),new T.MeshBasicMaterial({color:0xffffff}),3*16),mt=new T.Matrix4(),c=0;for(var b=0;b<3;b++)for(var k=0;k<16;k++){mt.setPosition(k*3.2-3,.07,(b-1)*LZ);dm.setMatrixAt(c++,mt)}sc.add(dm);
 var cm=new T.InstancedMesh(new T.BoxGeometry(1.6,.22,.4),new T.MeshStandardMaterial({flatShading:true}),60),cc=0;[-1,1].forEach(function(sd){for(var k=0;k<30;k++){mt.setPosition(k*1.8-3,.11,sd*(2*LZ+.35));cm.setMatrixAt(cc,mt);cm.setColorAt(cc++,new T.Color(k%2?0xffffff:0xe85d75))}});sc.add(cm);
 var ck=document.createElement("canvas");ck.width=ck.height=64;var x2=ck.getContext("2d");if(x2){for(var yy=0;yy<8;yy++)for(var xx=0;xx<8;xx++){x2.fillStyle=(xx+yy)%2?"#fff":"#222";x2.fillRect(xx*8,yy*8,8,8)}}
 var tex=new T.CanvasTexture(ck);tex.magFilter=T.NearestFilter;var fin=new T.Mesh(new T.PlaneGeometry(1.2,4*LZ+.4),new T.MeshBasicMaterial({map:tex}));fin.rotation.x=-Math.PI/2;fin.position.set(LEN+1.9,.08,0);sc.add(fin);
 var st0=new T.Mesh(new T.PlaneGeometry(.2,4*LZ),new T.MeshBasicMaterial({color:0xffffff}));st0.rotation.x=-Math.PI/2;st0.position.set(-1.5,.08,0);sc.add(st0);
 [-1,1].forEach(function(sd){var p=new T.Mesh(new T.CylinderGeometry(.18,.18,4.4,8),pm(0xe85d75));p.position.set(LEN+1.9,2.2,sd*(2*LZ+.6));sc.add(p)});
 var ban=new T.Mesh(new T.BoxGeometry(.5,.9,4*LZ+1.6),new T.MeshBasicMaterial({map:tex}));ban.position.set(LEN+1.9,4.5,0);sc.add(ban);
 var g1=new T.ConeGeometry(.9,2.4,6),g2=new T.CylinderGeometry(.18,.22,.9,6),tm=pm(0x7a5a3a),tg=pm(0x4fa86a);
 for(var t=0;t<34;t++){var sd=t%2?1:-1,tr=new T.Group(),cn=new T.Mesh(g1,tg),tk=new T.Mesh(g2,tm);cn.position.y=2;tk.position.y=.45;tr.add(cn,tk);var sc2=.8+((t*37)%10)/12;tr.scale.setScalar(sc2);tr.position.set(((t*53)%62)-6,0,sd*(2*LZ+3.2+((t*29)%5)));sc.add(tr)}
 var cl=pm(0xffffff,{flatShading:false,transparent:true,opacity:.9}),cls=new T.Group();for(var q=0;q<7;q++){var cg=new T.Group();for(var j=0;j<3;j++){var sp=new T.Mesh(new T.SphereGeometry(1.4-j*.2,8,6),cl);sp.position.set(j*1.4,j%2*.5,0);cg.add(sp)}cg.position.set(q*10-4,10+(q%3)*1.5,-26);cls.add(cg)}sc.add(cls);
 var cars=[];for(var n=0;n<4;n++){var cr=mkCar(CCOL[n]);cr.position.z=(1.5-n)*LZ;sc.add(cr);cars.push(cr)}
 var smoke=[],sm=new T.MeshBasicMaterial({color:0x9aa3b8,transparent:true,opacity:.5,depthWrite:false});for(var m=0;m<8;m++){var sp2=new T.Mesh(new T.SphereGeometry(.2,6,5),sm.clone());sp2.visible=false;sc.add(sp2);smoke.push(sp2)}
 var sparks=[],spm=new T.MeshBasicMaterial({color:0xffb347});for(var e=0;e<24;e++){var sk=new T.Mesh(new T.BoxGeometry(.12,.12,.12),spm);sk.visible=false;sk.userData={v:new T.Vector3(),t:0};sc.add(sk);sparks.push(sk)}
 var o={cv:cv,r:r,sc:sc,cam:cam,hemi:hemi,sun:sun,ground:ground,cars:cars,smoke:smoke,sparks:sparks,cls:cls,cx:LEN/2,w:30,lw:0,lh:0,lt:0,px:[0,0,0,0]};
 o.apply=function(){sc.background=new T.Color(dark?0x141a29:0xcdebff);sc.fog=new T.Fog(dark?0x141a29:0xcdebff,60,140);ground.material.color.set(dark?0x2d4a3a:0x9bd36b);hemi.intensity=dark?.55:1;hemi.color.set(dark?0xaab4d8:0xffffff);sun.intensity=dark?.5:.9;sun.color.set(dark?0xf2e4a6:0xffffff);cls.visible=!dark};
 o.apply();return o}
R3.start=function(){if(!st)st=build();if(!st){R3.on=false;return false}st.cv.style.display="block";st.cars.forEach(function(c){dent(c,0)});st.px=[0,0,0,0];st.cx=LEN/2;st.w=30;R3.on=true;return true};
R3.stop=function(){R3.on=false;if(st)st.cv.style.display="none"};
R3.theme=function(d){dark=d;if(st)st.apply()};
R3.hit=function(){if(!st)return;var c=st.cars[0],n=0;st.sparks.forEach(function(s){if(n<10&&!s.visible){n++;s.visible=true;s.userData.t=.5;s.position.set(c.position.x+1.4,.8,c.position.z);s.userData.v.set((Math.random()-.2)*5,Math.random()*4+1,(Math.random()-.5)*4)}})};
R3.draw=function(G,cx,W,H,NM){var o=st,cvo=document.getElementById("cv");if(!o||!cvo)return;
 var w=cvo.clientWidth,h=cvo.clientHeight;if(w&&h&&(w!==o.lw||h!==o.lh)){o.lw=w;o.lh=h;o.r.setSize(w,h,false);o.cam.aspect=w/h;o.cam.updateProjectionMatrix();o.cv.style.width=w+"px";o.cv.style.height=h+"px"}
 o.cv.style.left=cvo.offsetLeft+"px";o.cv.style.top=cvo.offsetTop+"px";
 var dt=Math.min(.05,Math.max(.001,G.t-o.lt));o.lt=G.t;var mn=1e9,mx=-1e9;
 o.cars.forEach(function(c,i){var x=G.disp[i]*LEN;c.position.x=x;c.position.y=G.start?Math.sin(G.t*20+i*2)*.015:0;var dx=x-o.px[i];o.px[i]=x;c.userData.wheels.forEach(function(wh){wh.rotation.z-=dx*3.1});mn=Math.min(mn,x);mx=Math.max(mx,x)});
 var d=(100-G.hp)/100,pl=o.cars[0];if(Math.abs(d-pl.userData.d)>.03||(d===0&&pl.userData.d))dent(pl,d);
 pl.userData.flame.visible=G.st>=8;if(G.st>=8)pl.userData.flame.scale.set(.8+Math.random()*.5,1,1);
 o.smoke.forEach(function(s,k){if(d>.5){var t=(G.t*.8+k/8)%1;s.visible=true;s.position.set(pl.position.x+.9-t*.4,.95+t*1.8,pl.position.z+(k%3-1)*.15);s.scale.setScalar(.6+t*1.4);s.material.opacity=(1-t)*.55}else s.visible=false});
 o.sparks.forEach(function(s){if(!s.visible)return;var u=s.userData;u.t-=dt;u.v.y-=12*dt;s.position.addScaledVector(u.v,dt);if(u.t<=0||s.position.y<0)s.visible=false});
 var cxT=(mn+mx)/2+1.5,wT=Math.max(22,mx-mn+10);o.cx+=(cxT-o.cx)*Math.min(1,dt*3);o.w+=(wT-o.w)*Math.min(1,dt*3);
 var D=o.w/(2*Math.tan(17.5*Math.PI/180)*o.cam.aspect),sh=G.shake>0?(Math.random()-.5)*.25:0;
 o.cam.position.set(o.cx+sh,D*.5,D*.86);o.cam.lookAt(o.cx,0,0);
 o.r.render(o.sc,o.cam);
 cx.font='400 10px "Press Start 2P",monospace';cx.textAlign="center";o.cars.forEach(function(c,i){var v=new T.Vector3(c.position.x,2.1,c.position.z).project(o.cam);cx.fillStyle="#fff";cx.strokeStyle="#3A2F45";cx.lineWidth=4;var tx=NM[i]+(G.fin[i]?" OK":""),px=(v.x*.5+.5)*W,py=(-v.y*.5+.5)*H;cx.strokeText(tx,px,py);cx.fillText(tx,px,py)});cx.textAlign="left"};
})();
