/* Piano : de vraies notes de piano jouées avec le clavier de l'ordinateur.
   Échantillons : FluidR3_GM (licence MIT) via midi-js-soundfonts, 24 notes (Do3 à Mi6), les autres sont transposées. */
(function(){
if(window.Piano)return;
var main=document.querySelector("main"),aside=document.querySelector("aside");if(!main||!aside)return;
var W=900,H=460,KY=330,HIT=318,SPEED=190,LEAD=2.8,WIN=.22,BASE="sounds/piano/";
/* disposition : touches blanches sur la rangée du milieu, dièses sur la rangée du haut (positions physiques du clavier) */
var WH=[["KeyA","C4","Do"],["KeyS","D4","Ré"],["KeyD","E4","Mi"],["KeyF","F4","Fa"],["KeyG","G4","Sol"],["KeyH","A4","La"],["KeyJ","B4","Si"],["KeyK","C5","Do"],["KeyL","D5","Ré"],["Semicolon","E5","Mi"]];
var BL=[["KeyW","Db4",1,"Do#"],["KeyE","Eb4",2,"Ré#"],["KeyT","Gb4",4,"Fa#"],["KeyY","Ab4",5,"Sol#"],["KeyU","Bb4",6,"La#"],["KeyO","Db5",8,"Do#"],["KeyP","Eb5",9,"Ré#"]];
var FING={KeyA:1,KeyS:2,KeyD:3,KeyF:4,KeyG:4,KeyH:5,KeyJ:5,KeyK:6,KeyL:7,Semicolon:8,KeyW:2,KeyE:3,KeyT:4,KeyY:5,KeyU:5,KeyO:7,KeyP:8};
var DEF={KeyA:"q",KeyS:"s",KeyD:"d",KeyF:"f",KeyG:"g",KeyH:"h",KeyJ:"j",KeyK:"k",KeyL:"l",Semicolon:"m",KeyW:"z",KeyE:"e",KeyT:"t",KeyY:"y",KeyU:"u",KeyO:"o",KeyP:"p"};
var PAST={1:"#F7C6D0",2:"#F9D5B0",3:"#F8EAA8",4:"#CBE8B8",5:"#BFE0F0",6:"#D8CCF0",7:"#B8E8DC",8:"#F4BDB5"};
var PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11},NN=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
function mid(n){var b=n.slice(0,-1),s=b.length>1?(b[1]==="b"?-1:1):0;return 12*(+n.slice(-1)+1)+PC[b[0]]+s}
var keys=[],byCode={},byNote={};
WH.forEach(function(w,i){keys.push({code:w[0],note:w[1],fr:w[2],white:true,midi:mid(w[1]),x:50+i*80,w:80,cx:90+i*80,f:FING[w[0]],label:DEF[w[0]]})});
BL.forEach(function(b){var cx=50+b[2]*80;keys.push({code:b[0],note:b[1],fr:b[3],white:false,midi:mid(b[1]),x:cx-23,w:46,cx:cx,f:FING[b[0]],label:DEF[b[0]]})});
keys.forEach(function(k){byCode[k.code]=k;byNote[k.note]=k});
/* mélodies du domaine public (notation : Note[:temps], R = silence) */
var SONGS=[
["Ode à la joie",100,"E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2"],
["Au clair de la lune",96,"C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4 C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4"],
["Ah ! vous dirai-je, maman",100,"C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2"],
["Frère Jacques",100,"G4 A4 B4 G4 G4 A4 B4 G4 B4 C5 D5:2 B4 C5 D5:2 D5:.5 E5:.5 D5:.5 C5:.5 B4 G4 D5:.5 E5:.5 D5:.5 C5:.5 B4 G4 G4 D4 G4:2 G4 D4 G4:2"],
["Jingle Bells",120,"E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2"],
["Für Élise (début)",96,"E5 D#5 E5 D#5 E5 B4 D5 C5 A4:2 R C4 E4 A4 B4:2 R E4 G#4 B4 C5:2 R E4 E5 D#5 E5 D#5 E5 B4 D5 C5 A4:2 R C4 E4 A4 B4:2 R E4 C5 B4 A4:3"]];
var SHARP={"C#":"Db","D#":"Eb","F#":"Gb","G#":"Ab","A#":"Bb"};
function parse(s){var t=0,out=[];s.split(" ").forEach(function(tok){var p=tok.split(":"),b=p[1]?parseFloat(p[1]):1;if(p[0]!=="R"){var n=SHARP[p[0].slice(0,2)]?SHARP[p[0].slice(0,2)]+p[0].slice(2):p[0];if(byNote[n])out.push({n:n,t:t,b:b})}t+=b});return {notes:out,len:t}}
/* interface injectée dans le site */
var PIC="oooooooooo/owwdwwdwwo/owwdwwdwwo/owwdwwdwwo/owwowwowwo/owwowwowwo/owwowwowwo/oooooooooo/........../..........";
function pic(c){var g=PIC.split("/"),pal={o:"var(--po)",w:"#FFFFFF",d:"#5A4A6A"},s='<svg class="px '+(c||"")+'" viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">';g.forEach(function(r,y){var x=0;while(x<10){var ch=r[x],n=1;while(x+n<10&&r[x+n]===ch)n++;if(ch!=="."&&pal[ch])s+='<rect x="'+x+'" y="'+y+'" width="'+n+'" height="1" fill="'+pal[ch]+'"/>';x+=n}});return s+"</svg>"}
var st=document.createElement("style");st.textContent="#v-piano h1{margin-bottom:8px}.pcard{padding:14px}.pnbar{gap:10px;margin-bottom:8px}.pnbar select{font:600 .9rem var(--fb);padding:7px 10px;border-radius:12px;border:3px solid var(--line2);background:var(--solid);color:var(--ink);max-width:100%}.pstats{display:flex;gap:22px;flex-wrap:wrap;margin:4px 0 8px}.pstats strong{font:400 1rem var(--fs);display:block;line-height:1.4}.pstats span{font-size:.75rem;color:var(--mute)}.pstage{position:relative;display:flex;justify-content:center;border-radius:16px;overflow:hidden;border:3px solid var(--line2);background:#10131f}#pn_cv{display:block;max-width:100%;max-height:min(58vh,520px);width:auto;height:auto;touch-action:none;cursor:pointer}.pstage .res{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:5;background:var(--card);text-align:center;min-width:min(330px,90%);margin:0;box-shadow:0 8px 0 var(--line2)}.pn_load{position:absolute;left:0;right:0;top:8px;text-align:center;font-size:.8rem;color:#fff;opacity:.9;pointer-events:none}#pn_help{margin:8px 0 0}#pn_vol{width:110px;accent-color:var(--acc)}";document.head.appendChild(st);
var nb=document.createElement("button");nb.className="nb";nb.dataset.v="piano";nb.innerHTML=pic()+"Piano";
var ref=aside.querySelector('.nb[data-v="games"]');if(ref&&ref.after)ref.after(nb);else aside.insertBefore(nb,aside.querySelector(".sp"));
var sec=document.createElement("section");sec.className="view";sec.id="v-piano";
sec.innerHTML='<h1>Piano</h1><div class="card pcard"><div class="row pnbar"><div class="chips" id="pn_mode" style="margin:0"><button class="chip" data-m="free" aria-pressed="true">Libre</button><button class="chip" data-m="learn" aria-pressed="false">Apprendre</button><button class="chip" data-m="rhythm" aria-pressed="false">Rythme</button></div><select id="pn_song" aria-label="Mélodie"></select><div class="chips" id="pn_oct" style="margin:0;align-items:center"><button class="chip" data-o="-1" aria-label="Octave plus grave" aria-pressed="false">−</button><span class="note" id="pn_octl">Octaves 4–5</span><button class="chip" data-o="1" aria-label="Octave plus aiguë" aria-pressed="false">+</button></div><div class="chips" id="pn_spd" style="margin:0"><button class="chip" data-s=".7" aria-pressed="false">Lent</button><button class="chip" data-s="1" aria-pressed="true">Normal</button><button class="chip" data-s="1.3" aria-pressed="false">Rapide</button></div><button class="btn p" id="pn_go">Jouer</button><label class="note" style="margin-left:auto">Volume <input type="range" id="pn_vol" min="0" max="100" value="80" aria-label="Volume"></label></div><div class="pstats"><div><strong id="pn_score">0</strong><span>score</span></div><div><strong id="pn_combo">0</strong><span>série</span></div><div><strong id="pn_acc">100%</strong><span>précision</span></div><div><strong id="pn_prog">0%</strong><span>avancement</span></div></div><div class="pstage"><canvas id="pn_cv" width="'+W+'" height="'+H+'" aria-label="Piano"></canvas><div class="pn_load" id="pn_load"></div><div class="res hide" id="pn_res"></div></div><p class="note" id="pn_help"></p></div>';
main.appendChild(sec);
var $=function(i){return document.getElementById(i)},cv=$("pn_cv"),cx=cv.getContext("2d");
/* carte dans le catalogue des jeux */
var gl=$("gl");
function card(){if(!gl||gl.querySelector("[data-piano]"))return;var f=document.querySelector("#gf .chip[aria-pressed=true]"),ft=f?f.textContent:"Tous";if(ft!=="Tous"&&ft!=="Solo"&&ft!=="Débutant")return;var b=document.createElement("button");b.className="gc";b.dataset.piano="1";b.innerHTML=pic("big")+'<b>Piano</b><small>Jouez de vraies notes de piano avec votre clavier : mélodies à suivre ou mode libre.</small><div class="tags"><span class="tag">Solo</span><span class="tag">Musique</span><span class="tag" style="background:var(--acc);color:var(--onacc)">Jouable</span></div>';b.onclick=function(){nb.click()};gl.appendChild(b)}
if(gl){new MutationObserver(card).observe(gl,{childList:true});card()}
/* sons */
var AC=null,master=null,buf={},loaded=0,loading=false,failed=false,vol=.8,voices={};
var NAMES="C3 Eb3 Gb3 A3 C4 Db4 D4 Eb4 E4 F4 Gb4 G4 Ab4 A4 Bb4 B4 C5 Db5 D5 Eb5 E5 A5 C6 Eb6".split(" ");
function ac(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();master=AC.createGain();master.gain.value=vol;master.connect(AC.destination)}if(AC.state==="suspended"&&AC.resume)AC.resume();return AC}
function freq(n){var m={C:0,D:2,E:4,F:5,G:7,A:9,B:11},o=+n.slice(-1),b=n.slice(0,-1),s=b.length>1?(b[1]==="b"?-1:1):0;return 440*Math.pow(2,((12*(o+1)+m[b[0]]+s)-69)/12)}
function load(){if(loading)return;loading=true;ui();var a=ac();NAMES.forEach(function(n){fetch(BASE+n+".mp3").then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(b){return new Promise(function(ok,ko){var p=AC.decodeAudioData(b,ok,ko);if(p&&p.then)p.then(ok,ko)})}).then(function(d){buf[n]=d;loaded++;ui()}).catch(function(){failed=true;loaded++;ui()})})}
function oct(){return S.mode==="free"?S.oct:0}
function pick(m){var best=null,bd=99;NAMES.forEach(function(n){if(!buf[n])return;var d=Math.abs(mid(n)-m);if(d<bd){bd=d;best=n}});return best?{n:best,rate:Math.pow(2,(m-mid(best))/12)}:null}
function play(k,vel){var a=ac();if(!a)return null;var t=a.currentTime,g=a.createGain(),m=k.midi+12*oct(),p=pick(m);g.gain.value=vel||1;g.connect(master);
 if(p){var s=a.createBufferSource();s.buffer=buf[p.n];s.playbackRate.value=p.rate;s.connect(g);s.start(t);return {s:s,g:g}}
 var f=440*Math.pow(2,(m-69)/12),o=[],i;for(i=1;i<=4;i++){var os=a.createOscillator(),gg=a.createGain();os.frequency.value=f*i;gg.gain.setValueAtTime(.3/i,t);gg.gain.exponentialRampToValueAtTime(.0005,t+1.8/i+.3);os.connect(gg);gg.connect(g);os.start(t);os.stop(t+2.2);o.push(os)}return {s:o[0],g:g}}
function release(v){if(!v||!AC)return;try{var t=AC.currentTime;v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);v.g.gain.linearRampToValueAtTime(0,t+.3)}catch(e){}}
/* état du jeu */
var S={mode:"free",song:0,spd:1,phase:"idle",clock:0,notes:[],idx:0,score:0,combo:0,maxc:0,hits:0,miss:0,wrong:0,press:0,pop:[],pt:[],down:{},done:0,spdm:1,oct:0};
function songData(){var d=SONGS[S.song],p=parse(d[2]),beat=60/d[1]/S.spd;return {name:d[0],list:p.notes.map(function(n){return {n:n.n,time:LEAD+n.t*beat,b:n.b,h:Math.max(26,SPEED*n.b*beat*.86),hit:false,miss:false,k:byNote[n.n]}}),end:LEAD+p.len*beat}}
function ui(){var l=$("pn_load");if(!l)return;l.textContent=loaded<NAMES.length?"Chargement des notes de piano… "+loaded+"/"+NAMES.length:(failed?"Sons de secours (échantillons indisponibles hors ligne)":"");
 $("pn_score").textContent=S.score;$("pn_combo").textContent=S.combo;var tot=S.mode==="rhythm"?S.hits+S.miss+S.wrong:S.hits+S.wrong;$("pn_acc").textContent=(tot?Math.round(S.hits/tot*100):100)+"%";$("pn_prog").textContent=(S.notes.length?Math.round(S.done/S.notes.length*100):0)+"%"}
function helpTxt(){var m=S.mode;$("pn_help").innerHTML=(m==="free"?"Jouez librement. ":m==="learn"?"La mélodie attend que vous appuyiez sur la bonne touche. ":"Appuyez sur la touche quand la note touche la ligne dorée. ")+"Touches blanches : <b>"+WH.map(function(w){return lab(w[0]).toUpperCase()}).join(" ")+"</b> (Do à Mi). Dièses : <b>"+BL.map(function(b){return lab(b[0]).toUpperCase()}).join(" ")+"</b>. La souris et le tactile marchent aussi."+(m==="free"?" Flèches <b>↑ ↓</b> ou boutons − / + : changer d'octave (3 à 6).":"")}
var LAY=null;function lab(c){return (LAY&&LAY[c])||DEF[c]}
try{if(navigator.keyboard&&navigator.keyboard.getLayoutMap)navigator.keyboard.getLayoutMap().then(function(m){LAY={};keys.forEach(function(k){var v=m.get(k.code);if(v){LAY[k.code]=v;k.label=v}});helpTxt()}).catch(function(){})}catch(e){}
/* parties */
function stats(){return {s:S.score,a:+$("pn_acc").textContent.replace("%","")}}
function userKey(){try{var d=JSON.parse(localStorage.getItem("dactylo.v1"));return d&&d.cur&&d.profiles&&d.profiles[d.cur]?d.cur:null}catch(e){return null}}
function rec(r){var u=userKey();if(!u)return null;var all;try{all=JSON.parse(localStorage.getItem("dactylo.piano.v1"))||{}}catch(e){all={}}var key=SONGS[S.song][0]+"|"+S.mode+"|"+S.spd,o=all[u]=all[u]||{},old=o[key]||{s:0,a:0,st:0},best=r.s>old.s;if(best)o[key]={s:r.s,a:r.a,st:r.st};try{localStorage.setItem("dactylo.piano.v1",JSON.stringify(all))}catch(e){}return {best:best,old:old}}
function start(){if(S.mode==="free"){S.phase="idle";S.notes=[];$("pn_res").classList.add("hide");ui();return}var d=songData();S.notes=d.list;S.end=d.end;S.idx=0;S.score=0;S.combo=0;S.maxc=0;S.hits=0;S.miss=0;S.wrong=0;S.done=0;S.clock=0;S.fin=0;S.pop=[];S.phase="play";$("pn_res").classList.add("hide");load();ui();run(true)}
function finish(){S.phase="done";var tot=S.mode==="rhythm"?S.hits+S.miss+S.wrong:S.hits+S.wrong,acc=tot?Math.round(S.hits/tot*100):100,stars=S.mode==="rhythm"?(acc>=90&&S.miss<=2?3:acc>=70?2:acc>=40?1:0):(acc>=95?3:acc>=85?2:acc>=65?1:0),r=rec({s:S.score,a:acc,st:stars}),el=$("pn_res");
 el.innerHTML='<b style="font-size:1.2rem">'+SONGS[S.song][0]+"</b><div style=\"font-size:1.6rem;letter-spacing:.2em;margin:4px 0\">"+"★".repeat(stars)+"☆".repeat(3-stars)+"</div><p style=\"margin:4px 0 8px\">Score <b>"+S.score+"</b> · précision <b>"+acc+" %</b> · meilleure série <b>"+S.maxc+"</b>"+(r?(r.best&&r.old.s?"<br>Nouveau record !":r.old.s?"<br>Record : "+r.old.s:""):"")+'</p><button class="btn p" id="pn_again">Rejouer</button> <button class="btn" id="pn_free">Mode libre</button>';
 el.classList.remove("hide");$("pn_again").onclick=start;$("pn_free").onclick=function(){setMode("free")};ui()}
function pop(k,txt,col){S.pop.push({x:k.cx,y:HIT-20,t:0,txt:txt,col:col})}
function burst(k,col){for(var i=0;i<14;i++)S.pt.push({x:k.cx,y:HIT,vx:(Math.random()-.5)*300,vy:-Math.random()*260-40,t:0,c:i%3?col:"#FFFFFF"})}
function hit(nt,pts,txt,col){nt.hit=true;S.hits++;S.done++;S.combo++;S.maxc=Math.max(S.maxc,S.combo);S.score+=Math.round(pts*(1+Math.min(S.combo,30)/30));pop(nt.k,txt,col);burst(nt.k,PAST[nt.k.f]||"#F2A93B")}
function press(k){if(S.phase==="play"){
  if(S.mode==="rhythm"){var best=null,bd=9;S.notes.forEach(function(n){if(!n.hit&&!n.miss&&n.n===k.note){var d=Math.abs(S.clock-n.time);if(d<=WIN&&d<bd){best=n;bd=d}}});
   if(best){if(bd<.07)hit(best,100,"Parfait !","#FFE066");else if(bd<.14)hit(best,60,"Bien","#BFE0F0");else hit(best,30,"Ok","#F8EAA8")}else{S.wrong++;S.combo=0;pop(k,"✗","#F0948C")}}
  else if(S.mode==="learn"){var nx=S.notes[S.idx];if(nx){if(k.note===nx.n){if(nx.time-S.clock<=1){S.clock=Math.max(S.clock,nx.time);hit(nx,100,"Bien !","#BFE0F0");S.idx++}}else{S.wrong++;S.combo=0;pop(k,"✗","#F0948C")}}}}
 ui()}
function update(dt){var i;S.pop.forEach(function(p){p.t+=dt});S.pop=S.pop.filter(function(p){return p.t<.8});S.pt.forEach(function(p){p.t+=dt;p.vy+=700*dt;p.x+=p.vx*dt;p.y+=p.vy*dt});S.pt=S.pt.filter(function(p){return p.t<.7});
 if(S.phase!=="play")return;
 if(S.mode==="rhythm"){S.clock+=dt;S.notes.forEach(function(n){if(!n.hit&&!n.miss&&S.clock>n.time+WIN){n.miss=true;S.miss++;S.done++;S.combo=0}});if(S.clock>S.end+1.2)finish()}
 else{var nx=S.notes[S.idx];if(nx){S.clock=Math.min(nx.time,S.clock+dt)}else{S.fin+=dt;S.clock+=dt;if(S.fin>.8)finish()}}
 if(S.phase==="play")ui()}
/* dessin (style pixel : rectangles à bords nets) */
function draw(t){var c=cx,i;
 for(i=0;i<8;i++){var f=i/7;c.fillStyle="rgb("+[27+16*f|0,34+24*f|0,54+49*f|0]+")";c.fillRect(0,i*KY/8,W,KY/8+1)}
 c.fillStyle="#fff";for(i=0;i<36;i++){var x=(i*197)%W,y=(i*83)%KY;c.globalAlpha=Math.floor(t*1.5+i)%3?.55:.25;c.fillRect(x-x%4,y-y%4,4,4)}c.globalAlpha=1;
 for(i=0;i<10;i++){c.fillStyle=i%2?"rgba(255,255,255,.03)":"rgba(255,255,255,.07)";c.fillRect(50+i*80,0,80,KY)}
 c.fillStyle="rgba(242,169,59,.9)";for(i=50;i<850;i+=24)c.fillRect(i,HIT,14,4);
 var hint={};
 if(S.phase==="play"){S.notes.forEach(function(n,j){if(n.hit)return;var yb=HIT-(n.time-S.clock)*SPEED,yt=yb-n.h;if(yb<-8||yt>KY)return;var k=n.k,w=k.white?64:40,x=k.cx-w/2,col=n.miss?"#6f748a":PAST[k.f],next=S.mode==="learn"&&j===S.idx;
   if(!n.miss&&n.time-S.clock<1.3&&n.time-S.clock>-WIN)hint[k.code]=1;
   c.fillStyle=next?"#FFFFFF":"#3A2F45";c.fillRect(x-3,yt-3,w+6,n.h+6);c.fillStyle=col;c.fillRect(x,yt,w,n.h);c.fillStyle="rgba(255,255,255,.5)";c.fillRect(x+4,yt+4,w-8,6);
   c.fillStyle="#3A2F45";c.font='700 20px Poppins,Arial,sans-serif';c.textAlign="center";c.textBaseline="middle";c.fillText(k.label.toUpperCase(),k.cx,yb-Math.min(n.h/2,18))})}
 /* clavier */
 c.fillStyle="#1a1424";c.fillRect(0,KY,W,H-KY);
 keys.forEach(function(k){if(!k.white)return;var p=S.down[k.code]?4:0;c.fillStyle="#3A2F45";c.fillRect(k.x,KY,k.w,H-KY);c.fillStyle=S.down[k.code]?"#F2A93B":hint[k.code]?PAST[k.f]:"#FFFDF6";c.fillRect(k.x+2,KY+p,k.w-4,H-KY-4-p);
  c.fillStyle="rgba(58,47,69,.12)";c.fillRect(k.x+2,H-14,k.w-4,10);c.fillStyle="#3A2F45";c.textAlign="center";c.textBaseline="middle";c.font='700 24px Poppins,Arial,sans-serif';c.fillText(k.label.toUpperCase(),k.cx,KY+104);c.font='600 13px Poppins,Arial,sans-serif';c.globalAlpha=.7;c.fillText(k.fr+(Math.floor((k.midi+12*oct())/12)-1),k.cx,KY+124);c.globalAlpha=1});
 keys.forEach(function(k){if(k.white)return;var p=S.down[k.code]?3:0;c.fillStyle="#1a1424";c.fillRect(k.x-2,KY,k.w+4,86);c.fillStyle=S.down[k.code]?"#F2A93B":hint[k.code]?PAST[k.f]:"#3B3050";c.fillRect(k.x,KY+p,k.w,80-p);c.fillStyle="rgba(255,255,255,.18)";c.fillRect(k.x+4,KY+p+4,6,64);
  c.fillStyle=S.down[k.code]||hint[k.code]?"#3A2F45":"#FFFDF6";c.textAlign="center";c.textBaseline="middle";c.font='700 17px Poppins,Arial,sans-serif';c.fillText(k.label.toUpperCase(),k.cx,KY+56)});
 S.pt.forEach(function(p){c.globalAlpha=Math.max(0,1-p.t/.7);c.fillStyle=p.c;c.fillRect(Math.round(p.x/4)*4,Math.round(p.y/4)*4,8,8)});c.globalAlpha=1;
 S.pop.forEach(function(p){c.globalAlpha=Math.max(0,1-p.t/.8);c.fillStyle=p.col;c.font='400 14px "Press Start 2P",Poppins,monospace';c.textAlign="center";c.textBaseline="middle";c.fillText(p.txt,p.x,p.y-p.t*50)});c.globalAlpha=1;
 c.textAlign="center";c.textBaseline="middle";
 if(S.phase==="play"&&S.mode==="rhythm"&&S.clock<LEAD-.4){c.fillStyle="#fff";c.font='400 56px "Press Start 2P",Poppins,monospace';c.fillText(String(Math.ceil(LEAD-.4-S.clock)),W/2,150)}
 if(S.mode==="free"||S.phase==="idle"){c.fillStyle="rgba(8,12,28,.55)";c.fillRect(150,120,600,70);c.fillStyle="#fff";c.font='600 20px Poppins,Arial,sans-serif';c.fillText(S.mode==="free"?"Jouez avec votre clavier : Q S D F G H J K L M…":"Choisissez une mélodie puis cliquez sur Jouer",W/2,155)}
 c.textAlign="left"}
/* boucle */
var raf=0,last=0;function now(){return performance.now()/1000}
function loop(){raf=requestAnimationFrame(loop);var t=now(),dt=Math.min(.05,t-last);last=t;update(dt);draw(t)}
function run(on){if(on&&!raf){last=now();raf=requestAnimationFrame(loop)}else if(!on&&raf){cancelAnimationFrame(raf);raf=0}}
function visible(){return sec.classList.contains("on")}
new MutationObserver(function(){if(visible()){load();helpTxt();ui();run(true)}else{run(false);Object.keys(voices).forEach(function(c){release(voices[c]);delete voices[c];delete S.down[c]})}}).observe(sec,{attributes:true,attributeFilter:["class"]});
/* commandes */
function setMode(m){S.mode=m;if(m!=="free")S.oct=0;$("pn_oct").style.display=m==="free"?"":"none";setOct(0);S.phase="idle";S.notes=[];Array.prototype.forEach.call(document.querySelectorAll("#pn_mode .chip"),function(b){b.setAttribute("aria-pressed",b.dataset.m===m)});$("pn_spd").style.display=m==="rhythm"?"":"none";$("pn_song").style.display=m==="free"?"none":"";$("pn_go").style.display=m==="free"?"none":"";$("pn_res").classList.add("hide");S.score=0;S.combo=0;S.hits=S.miss=S.wrong=S.done=0;helpTxt();ui()}
$("pn_song").innerHTML=SONGS.map(function(s,i){return '<option value="'+i+'">'+s[0]+"</option>"}).join("");
function setOct(d){S.oct=Math.max(-1,Math.min(1,S.oct+d));$("pn_octl").textContent="Octaves "+(4+S.oct)+"–"+(5+S.oct);Array.prototype.forEach.call(document.querySelectorAll("#pn_oct .chip"),function(b){b.disabled=(+b.dataset.o<0&&S.oct<=-1)||(+b.dataset.o>0&&S.oct>=1)})}
$("pn_oct").onclick=function(e){var b=e.target.closest("[data-o]");if(b&&!b.disabled){setOct(+b.dataset.o);b.blur()}};
$("pn_song").onchange=function(){S.song=+this.value;S.phase="idle";this.blur()};
$("pn_mode").onclick=function(e){var b=e.target.closest("[data-m]");if(b){setMode(b.dataset.m);b.blur()}};
$("pn_spd").onclick=function(e){var b=e.target.closest("[data-s]");if(!b)return;S.spd=+b.dataset.s;Array.prototype.forEach.call(document.querySelectorAll("#pn_spd .chip"),function(x){x.setAttribute("aria-pressed",x===b)});b.blur()};
$("pn_go").onclick=function(){ac();start();this.blur()};
$("pn_vol").oninput=function(){vol=this.value/100;if(master)master.gain.value=vol};
function down(k){if(S.down[k.code])return;S.down[k.code]=1;voices[k.code]=play(k,1);press(k)}
function up(k){delete S.down[k.code];release(voices[k.code]);delete voices[k.code]}
document.addEventListener("keydown",function(e){if(!visible()||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;var t=e.target&&e.target.tagName;if(t==="INPUT"&&e.target.type!=="range"||t==="TEXTAREA")return;if(S.mode==="free"&&(e.code==="ArrowUp"||e.code==="ArrowDown")){e.preventDefault();setOct(e.code==="ArrowUp"?1:-1);return}var k=byCode[e.code];if(!k){var ch=(e.key||"").toLowerCase();keys.forEach(function(q){if(q.label===ch)k=q})}if(!k)return;e.preventDefault();down(k)});
document.addEventListener("keyup",function(e){if(!visible())return;var k=byCode[e.code];if(!k){var ch=(e.key||"").toLowerCase();keys.forEach(function(q){if(q.label===ch)k=q})}if(k)up(k)});
function at(ev){var r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)*W/r.width,y=(ev.clientY-r.top)*H/r.height;if(y<KY)return null;var i,k;for(i=0;i<keys.length;i++){k=keys[i];if(!k.white&&x>=k.x&&x<=k.x+k.w&&y<KY+80)return k}for(i=0;i<keys.length;i++){k=keys[i];if(k.white&&x>=k.x&&x<k.x+k.w)return k}return null}
var ptr=null;cv.addEventListener("pointerdown",function(e){var k=at(e);if(k){e.preventDefault();ptr=k;down(k)}});
window.addEventListener("pointerup",function(){if(ptr){up(ptr);ptr=null}});
window.Piano={keys:keys,songs:SONGS,state:S,press:down,release:up,start:start,setMode:setMode,parse:parse,_buf:buf,pick:pick,setOct:setOct,oct:oct,_draw:draw,_update:update};
setMode("free");helpTxt();ui();
/* préchargement discret : les sons sont mis en cache pour jouer hors ligne */
if(navigator.onLine!==false&&!(navigator.connection&&navigator.connection.saveData))setTimeout(function(){NAMES.forEach(function(n){fetch(BASE+n+".mp3").catch(function(){})})},5000);
})();
