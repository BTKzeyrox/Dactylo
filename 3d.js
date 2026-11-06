(function(){
if(!window.THREE)return;
var T=THREE;
function css(n){return (getComputedStyle(document.documentElement).getPropertyValue(n)||"").trim()||"#cccccc"}
function gl(cv){try{return new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true})}catch(e){return null}}
function isDark(){var t=document.documentElement.getAttribute("data-theme");return t==="dark"||(!t&&window.matchMedia&&matchMedia("(prefers-color-scheme:dark)").matches)}
function pm(c,o){var m=new T.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.6,metalness:0},o||{}));return m}

/* ---------- Mains 3D ---------- */
var H3=window.H3={};
var REST=[-.12,-.26,-.2],UP=[.34,-.04,-.05],DN=[-.55,-.5,-.35];
H3.init=function(box){
 var cv=document.createElement("canvas"),r=gl(cv);if(!r)return false;
 box.innerHTML="";box.appendChild(cv);r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 var sc=new T.Scene(),cam=new T.PerspectiveCamera(32,2,.1,100);
 sc.add(new T.HemisphereLight(0xffffff,0x8892a8,1.05));var dl=new T.DirectionalLight(0xffffff,.9);dl.position.set(2,6,4);sc.add(dl);
 var mats={};for(var i=0;i<=9;i++)mats[i]=new T.MeshStandardMaterial({color:css("--f"+i),roughness:.55,metalness:0,emissive:0x000000});
 var nailM=new T.MeshStandardMaterial({color:0xffffff,roughness:.3,transparent:true,opacity:.7});
 var grp=new T.Group(),fing={},act={},accent=new T.Color(css("--acc"));
 function finger(len,rad,mat){var g=new T.Group(),segs=[],par=g;
  for(var k=0;k<3;k++){var L=len[k],pv=new T.Group();pv.position.z=k?-len[k-1]:0;
   var m=new T.Mesh(new T.CapsuleGeometry(rad*(1-k*.08),L,4,8),mat);m.rotation.x=Math.PI/2;m.position.z=-L/2;pv.add(m);par.add(pv);par=pv;segs.push(pv)}
  var n=new T.Mesh(new T.SphereGeometry(rad*.7,8,6),nailM);n.scale.set(1,.35,1.15);n.position.set(0,rad*.6,-len[2]*.6);segs[2].add(n);
  return {g:g,segs:segs,cur:REST.slice(),p:0}}
 var spec={1:[-.66,.78],2:[-.3,.94],3:[.06,1],4:[.42,.92]};
 [0,1].forEach(function(h){var s=h?-1:1,hg=new T.Group();
  var palm=new T.Mesh(new T.SphereGeometry(1,18,12),mats[0]);palm.scale.set(.98,.3,.82);palm.position.set(0,0,.3);hg.add(palm);
  for(var f=1;f<=4;f++){var id=h?9-f:f,k=spec[f][1],fg=finger([.5*k,.36*k,.3*k],.15,mats[id]);fg.g.position.set(s*spec[f][0],0,-.38);hg.add(fg.g);(fing[id]=fing[id]||[]).push(fg)}
  var th=finger([.42,.34,.28],.18,mats[9]);th.g.position.set(s*.86,0,.18);th.g.rotation.y=-s*.7;hg.add(th.g);(fing[9]=fing[9]||[]).push(th);
  hg.position.x=s*-1.95;hg.rotation.y=s*.08;grp.add(hg)});
 sc.add(grp);
 var bb=new T.Box3().setFromObject(grp),size=bb.getSize(new T.Vector3()),ctr=bb.getCenter(new T.Vector3()),lw=0,lh=0,last=0;
 function fit(){var v=cam.fov*Math.PI/360,hh=(size.y+.9)/2,hw=size.x/2*1.06,d=Math.max(hh/Math.tan(v),hw/(Math.tan(v)*cam.aspect));var dir=new T.Vector3(0,.82,.6).normalize();cam.position.copy(ctr).addScaledVector(dir,d*1.12+size.z*.4);cam.lookAt(ctr)}
 function loop(t){requestAnimationFrame(loop);if(!box.offsetParent)return;var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
  if(w!==lw||h!==lh){lw=w;lh=h;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();fit()}
  var dt=Math.min(.05,(t-last)/1000||.016);last=t;
  for(var id in fing)fing[id].forEach(function(f){var tg=f.p>0?DN:(act[id]?UP:REST);for(var k=0;k<3;k++){f.cur[k]+=(tg[k]-f.cur[k])*Math.min(1,dt*14);f.segs[k].rotation.x=f.cur[k]}f.p-=dt});
  for(var m=1;m<=9;m++){var on=!!act[m];mats[m].emissive.copy(on?accent:new T.Color(0));mats[m].emissiveIntensity=on?.35+.2*Math.sin(t/110):0}
  r.render(sc,cam)}
 requestAnimationFrame(loop);
 H3.set=function(ids){act={};(ids||[]).forEach(function(i){act[i]=1})};
 H3.press=function(id){(fing[id]||[]).forEach(function(f){f.p=.14})};
 H3.recolor=function(){for(var i=0;i<=9;i++)mats[i].color.set(css("--f"+i));accent.set(css("--acc"))};
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
