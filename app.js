
(function(){
var $=function(i){return document.getElementById(i)},Q=function(s){return document.querySelectorAll(s)};
var FN=["","Auriculaire gauche","Annulaire gauche","Majeur gauche","Index gauche","Index droit","Majeur droit","Annulaire droit","Auriculaire droit","Pouces"];
var S={bad:{},badc:0,canBack:false,free:false,ks:{},kall:{},rep:[],catch:false,last:0,stage:0,acc:{ok:0,err:0,ms:0},les:0,text:"",i:0,err:0,start:0,done:true,game:"Pêche au trésor",filter:"Tous",fs:{}};
for(var f=1;f<=9;f++)S.fs[f]={ok:0,err:0};

function go(v){stopGame();document.body.classList.toggle("fit",v==="lessons"||v==="games");Q(".view").forEach(function(s){s.classList.toggle("on",s.id==="v-"+v)});Q(".nb[data-v]").forEach(function(b){if(b.dataset.v===v)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});if(v==="lessons")focusText();if(v==="stats"){bars();lb()}window.scrollTo(0,0)}
Q(".nb[data-v]").forEach(function(b){b.onclick=function(){go(b.dataset.v)}});
Q("[data-go]").forEach(function(b){b.onclick=function(){go(b.dataset.go)}});
document.addEventListener("click",function(e){var b=e.target.closest("button");if(b)b.blur()});
$("theme").onclick=function(){if(!prof())return;prof().set.theme=isDark()?"light":"dark";dbSave();applySet()};

/* Clavier */
function E(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
var KR=[["²|&1|é2|\"3|'4|(5|-6|è7|_8|ç9|à0|)°|=+",[1,1,2,3,4,4,5,5,6,7,8,8,8]],["a|z|e|r|t|y|u|i|o|p|^¨|$£",[1,2,3,4,4,5,5,6,7,8,8,8]],["q|s|d|f|g|h|j|k|l|m|ù%|*µ",[1,2,3,4,4,5,5,6,7,8,8,8]],["<>|w|x|c|v|b|n|,?|;.|:/|!§",[1,1,2,3,4,4,5,6,7,8,8]]];
var ALT={'"':"#","'":"{","(":"[","-":"|","_":"\\","à":"@",")":"]","=":"}"};
var MAP={" ":9},POS={" ":{k:" "}},KE={},kh="";
KR.forEach(function(r,ri){kh+='<div class="kr">';if(ri===3)kh+='<div class="key f1 wide" data-k="sl">Maj</div>';
 r[0].split("|").forEach(function(s,j){var b=s[0],low=/[a-z]/.test(b),sh=s[1]||(low?b.toUpperCase():""),f=r[1][j];
  MAP[b]=f;POS[b]={k:b};if(sh){MAP[sh]=f;POS[sh]={k:b,s:1}}if(ALT[b]){MAP[ALT[b]]=f;POS[ALT[b]]={k:b,a:1}}
  kh+='<div class="key f'+f+(b==="f"||b==="j"?" mark":"")+'" data-k="'+E(b)+'">'+(low?b.toUpperCase():E(b))+(sh&&!low?'<small>'+E(sh)+'</small>':"")+'</div>'});
 if(ri===3)kh+='<div class="key f8 wide" data-k="sr">Maj</div>';kh+="</div>"});
kh+='<div class="kr"><div class="key space f9" data-k=" ">espace</div><div class="key f9 wide" data-k="ag">AltGr</div></div>';
$("kb").innerHTML=kh;Q("#kb .key").forEach(function(e){KE[e.dataset.k]=e});
var lg="";for(var i=1;i<=9;i++)lg+='<span><i class="f'+i+'"></i>'+FN[i]+'</span>';$("leg").innerHTML=lg;

/* Leçons */
var AL="azertyuiopqsdfghjklmwxcvbn",LES=[["Milieu · main gauche","qsdf","qsdf"],["Milieu · main droite","jklm","jklm"],["Index : g et h","gh","qsdfjklm"],["Haut · main gauche","azert","qsdfjklm"],["Haut · main droite","yuiop","qsdfjklm"],["Rangée du haut complète","azertyuiop","qsdfghjklm"],["Rangée du bas","wxcvbn",AL],["Virgule ; deux-points","y,;:",AL],["Point, ?, ! et /",".?!/",AL],["Majuscules","AZERTYUIOPQSDFGHJKLM",AL],["Accents é è à ç ù","éèàçù",AL],["Chiffres 0 à 9","1234567890","azertyuiop"],["Symboles courants","&\"'(-_)=+*%$<>","azertyuiop"],["Touches AltGr","@#{[|]}\\","azertyuiop"],["Parcours complet","","ALL"]];
var LV=[null,{n:"Débutant",a:92,c:80},{n:"Intermédiaire",a:95,c:150},{n:"Avancé",a:98,c:225}];
function lvl(){var p=prof();return p&&p.set&&p.set.level||1}
function lvlUI(){var l=lvl();Q("#lvl .chip").forEach(function(b){b.setAttribute("aria-pressed",+b.dataset.l===l)});$("goal").textContent="Objectif : "+LV[l].a+" % · "+LV[l].c+" CPM"+(S.free?" · Retour arrière : dernière lettre seulement":"")}
var STN=["Nouvelles touches","Drills","Mots","Phrases","Paragraphe","Exercice texte"],STL=[0,56,60,90,190,260];
var WL="le la les un une des du de et en au aux ce se sa son ses mon ma mes ton ta tes te me ne si ou où mais donc car que qui quoi dont par pour sur sous dans avec sans chez vers elle il on je tu nous vous ils elles est été sont fait dit va fut très bien mal plus moins tout tous toute toutes même autre aussi encore déjà jamais toujours alors puis après avant depuis pendant comme quand pourquoi comment ici là loin près haut bas gauche droite jour nuit matin soir temps année mois semaine heure minute vie mort monde pays ville rue maison porte fenêtre table chaise lit livre page mot phrase texte lettre clavier souris écran musique film photo école classe travail projet idée question réponse chose homme femme enfant père mère frère ami amie nom prénom main pied tête yeux bras doigt voix pluie soleil vent neige mer lac terre ciel feu eau air pain lait sel sucre café thé fruit pomme poire rouge bleu vert jaune noir blanc grand petit beau belle bon bonne long courte rapide lent simple facile calme fort doux chaud froid vrai faux premier dernier nouveau vieux jeune seul avoir être faire dire voir aller venir prendre donner mettre savoir pouvoir vouloir devoir parler penser trouver aimer jouer lire écrire taper compter chanter danser manger boire dormir marcher courir partir arriver rester passer porter montrer ouvrir fermer".split(" ");
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function chars(l){return l[2]==="ALL"?Object.keys(POS).filter(function(c){return c!==" "&&c!=="^"&&c!=="¨"}):(l[1]+l[2]).split("")}
function newK(l){return l[2]==="ALL"?[]:l[1].split("")}
function pseudo(l){var nw=l[2]==="ALL"?chars(l):l[1].split(""),b=l[2]==="ALL"?nw:l[2].split(""),pool=nw.concat(nw,nw,b),w="",k=2+Math.floor(Math.random()*3);for(var j=0;j<k;j++)w+=rnd(pool);return w}
function wpool(l){var al=chars(l).join(""),nk=newK(l).join(""),ok=WL.filter(function(w){for(var i=0;i<w.length;i++)if(al.indexOf(w[i])<0)return false;return true}),hit=ok.filter(function(w){for(var i=0;i<w.length;i++)if(nk.indexOf(w[i])>=0)return true;return false});return{ok:ok,hit:hit,al:al,sym:newK(l).some(function(c){return !/[a-zàâäéèêëîïôöùûüç]/i.test(c)})}}
function oneWord(l,wp){if(wp.ok.length<6||(wp.sym&&Math.random()<.6))return pseudo(l);return Math.random()<.7&&wp.hit.length?rnd(wp.hit):rnd(wp.ok)}
function capit(w,wp){var c=w[0]&&w[0].toUpperCase();return c&&c!==w[0]&&wp.al.indexOf(c)>=0?c+w.slice(1):w}
function sentence(l,wp){var a=[],n=3+Math.floor(Math.random()*3);for(var i=0;i<n;i++)a.push(oneWord(l,wp));var s=capit(a.join(" "),wp);if(wp.al.indexOf(".")>=0)s+=".";return s}
var BANK=["Il était une fois un vieux marin qui vivait près de la mer.", "Chaque matin, il marchait sur la plage avec son chien.", "Le soleil se levait doucement derrière les grandes montagnes.", "Un jour, il trouva une petite boîte dans le sable.", "La boîte était lourde et couverte de coquillages.", "Il la porta jusque chez lui et la posa sur la table.", "Dans la boîte, il y avait une carte très ancienne.", "Elle montrait une île cachée au milieu de la mer.", "Le marin sourit, car il aimait les belles aventures.", "Il prépara son bateau, du pain et assez de fruits.", "Le vent soufflait fort, mais le bateau avançait bien.", "Pendant trois jours, il naviguait sans voir la terre.", "Le quatrième matin, une île verte apparut devant lui.", "Le chien sauta sur le sable en aboyant de joie.", "Ils marchèrent longtemps entre les arbres et les fleurs.", "Enfin, ils arrivèrent devant un grand rocher rouge.", "Sous le rocher, un coffre brillait dans la lumière.", "Le marin ouvrit le coffre avec beaucoup de calme.", "Il ne contenait ni or ni bijoux, seulement des livres.", "Le vieil homme comprit que le vrai trésor était le savoir.", "Il rentra chez lui, heureux, avec son chien fidèle.", "Depuis ce jour, il lit chaque soir près du feu."];
function gen(l,st){var wp=wpool(l),o=[],n=0,T=STL[st],w;
 if(st===5){var fl=BANK.filter(function(s){return s.split("").every(function(c){return c===" "||wp.al.indexOf(c)>=0})});if(fl.length>=6){if(S.sIdx==null||S.sNew){S.sIdx=Math.floor(Math.random()*fl.length);S.sNew=false}while(n<T){w=fl[S.sIdx++%fl.length];o.push(w);n+=w.length+1}return o.join(" ")}}
 if(st===1){var nk=newK(l),hb=l[2]==="ALL"?chars(l):l[2].split("");if(!nk.length)nk=[rnd(hb),rnd(hb),rnd(hb),rnd(hb)];while(n<T){var k=rnd(nk),pp=hb.filter(function(x){return x!==k}),p=pp.length?rnd(pp):k;w=Math.random()<.25?k+k+k:k+p+k+p;o.push(w);n+=w.length+1}}
 else if(st===2){while(n<T){w=oneWord(l,wp);if(Math.random()<.4)w=capit(w,wp);o.push(w);n+=w.length+1}}
 else{while(n<T){w=sentence(l,wp);o.push(w);n+=w.length+1}}
 return o.join(" ")}
function lchips(){var s="";LES.forEach(function(l,i){s+='<button class="li'+(i===S.les?" on":"")+'" data-i="'+i+'"'+(i===S.les?' aria-current="true"':"")+'><span>'+(i+1)+'</span>'+E(l[0])+'</button>'});$("llist").innerHTML=s;$("ltitle").textContent="Leçon "+(S.les+1)+" / "+LES.length+" · "+LES[S.les][0];$("lprev").disabled=S.les<=0;$("lnext").disabled=S.les>=LES.length-1}
function lpanel(o){$("lpanel").classList.toggle("on",o);$("lback").classList.toggle("on",o);if(o){var c=$("llist").querySelector(".on");if(c)c.scrollIntoView({block:"center"})}else focusText()}
$("lvl").onclick=function(e){var b=e.target.closest("[data-l]");if(!b||!prof())return;prof().set.level=+b.dataset.l;dbSave();lvlUI();if(S.stage>0)startStage(S.stage);else focusText()};$("lopen").onclick=function(){lpanel(true)};$("lclose").onclick=function(){lpanel(false)};$("lback").onclick=function(){lpanel(false)};$("llist").onclick=function(e){var b=e.target.closest("[data-i]");if(!b)return;S.les=+b.dataset.i;lchips();begin();lpanel(false)};document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("lpanel").classList.contains("on"))lpanel(false)});$("lprev").onclick=function(){S.les=Math.max(0,S.les-1);lchips();begin()};$("lnext").onclick=function(){S.les=Math.min(LES.length-1,S.les+1);lchips();begin()};
$("aide").onclick=function(e){var b=e.target.closest("[data-a]");if(!b)return;Q("#aide .chip").forEach(function(c){c.setAttribute("aria-pressed",c===b)});var a=b.dataset.a;$("hands").classList.toggle("hide",a!=="full");$("kb").classList.toggle("hide",a==="none");$("leg").classList.toggle("hide",a==="none");focusText()};
function paint(){var s="";for(var j=0;j<S.text.length;j++){var c=S.text[j],f=MAP[c],cl=(j<S.i?(S.bad[j]?"done wrong ":"done "):j===S.i?"cur ":"")+(f&&f<9?"b"+f:"");s+='<span class="'+cl+'">'+(c===" "?"&nbsp;":E(c))+'</span>'}$("txt").innerHTML=s;var cu=$("txt").querySelector(".cur");if(cu)$("txt").scrollTop=Math.max(0,cu.offsetTop-$("txt").clientHeight/3);hint()}
function hint(){Q(".key.next").forEach(function(k){k.classList.remove("next")});Q("#hands .fg.act").forEach(function(r){r.classList.remove("act")});var c=S.text[S.i],p=c&&POS[c];if(window.H3&&H3.set)H3.set([]);if(!p)return;var fs=[MAP[c]];function on(k){if(KE[k])KE[k].classList.add("next")}on(p.k);if(p.s){var l=MAP[c]<=4;on(l?"sr":"sl");fs.push(l?8:1)}if(p.a){on("ag");fs.push(9)}if(window.H3&&H3.set)H3.set(fs);fs.forEach(function(f){Q('#hands .fg[data-f="'+f+'"]').forEach(function(r){r.classList.add("act")})})}
function focusText(){setTimeout(function(){$("txt").focus({preventScroll:true})},30)}
function steps(){$("steps").innerHTML=STN.map(function(n,i){return'<span class="st'+(i===S.stage?" on":i<S.stage?" ok":"")+'"><i>'+(i+1)+'</i>'+E(n)+'</span>'}).join("")}
function intro(l){var nk=newK(l),h='<div class="intro"><b>Nouvelles touches</b><div class="nks">';if(!nk.length)h+='<span class="nk0">Toutes les touches du clavier</span>';else nk.forEach(function(c){var f=MAP[c];h+='<span class="nk'+(f&&f<9?" b"+f:"")+'">'+E(c)+'</span>'});return h+'</div><p>Repère ces touches et leur doigt sur le clavier. Pas de frappe ici.</p><button class="btn p" id="introGo">Continuer (Entrée)</button></div>'}
function introHint(nk){Q(".key.next").forEach(function(k){k.classList.remove("next")});Q("#hands .fg.act").forEach(function(r){r.classList.remove("act")});var fs=[];nk.forEach(function(c){var p=POS[c];if(!p)return;if(KE[p.k])KE[p.k].classList.add("next");if(p.s){var sk=KE[MAP[c]<=4?"sr":"sl"];if(sk)sk.classList.add("next")}if(p.a&&KE.ag)KE.ag.classList.add("next");var f=MAP[c];if(f&&fs.indexOf(f)<0)fs.push(f)});if(window.H3&&H3.set)H3.set(fs);fs.forEach(function(f){Q('#hands .fg[data-f="'+f+'"]').forEach(function(r){r.classList.add("act")})})}
function startStage(st,keys){var l=LES[S.les];S.catch=!!keys;S.catchKeys=keys||[];S.free=st===5&&!keys;S.bad={};S.badc=0;S.canBack=false;if(S.free)S.sNew=true;S.ks={};S.last=0;S.stage=st;S.i=0;S.err=0;S.start=0;S.lessonEnd=false;$("res").classList.add("hide");$("wpm").textContent="0";$("acc").textContent="100%";$("prog").textContent="0%";steps();$("clock").textContent="5:00";lvlUI();$("chr").classList.toggle("hide",st===0);$("chr").classList.remove("low");if(st===0){S.text="";S.done=true;$("txt").innerHTML=intro(l);$("txt").scrollTop=0;introHint(newK(l))}else{S.text=S.catch?genCatch():gen(l,st);S.done=false;paint()}focusText()}
function begin(){S.acc={ok:0,err:0,ms:0};S.rep=[];S.kall={};$("s1").textContent="Leçon "+(S.les+1)+" · "+LES[S.les][0];startStage(0)}
function met(){var m=S.start?(Date.now()-S.start)/60000:0,ci=S.i-S.badc,t=ci+S.err;return{w:m>0?Math.round(ci/5/m):0,c:m>0?Math.round(ci/m):0,a:t?Math.round(ci/t*100):100}}
function upd(){var m=met();$("wpm").textContent=m.w;$("acc").textContent=m.a+"%";$("prog").textContent=Math.round(S.i/S.text.length*100)+"%"}
$("restart").onclick=begin;$("again").onclick=function(){if(S.lessonEnd)begin();else if(S.catch)startStage(S.stage,S.catchKeys);else startStage(S.stage)};$("catchB").onclick=function(){startStage(S.stage,S.lastCrit)};$("nextS").onclick=function(){startStage(S.stage+1)};$("txt").onclick=function(e){if(e.target.closest("#introGo"))startStage(1)};document.addEventListener("keydown",function(e){if(S.stage===0&&(e.key==="Enter"||e.key===" ")&&$("v-lessons").classList.contains("on")&&!$("lpanel").classList.contains("on")&&!$("login").classList.contains("on")){e.preventDefault();startStage(1)}});$("nextL").onclick=function(){S.les=Math.min(LES.length-1,S.les+1);lchips();begin()};
document.addEventListener("keydown",function(e){
 if(!$("v-lessons").classList.contains("on")||$("lpanel").classList.contains("on")||S.done||e.key.length!==1||e.metaKey||((e.ctrlKey||e.altKey)&&!(e.getModifierState&&e.getModifierState("AltGraph"))))return;
 e.preventDefault();var k=e.key,el=KE[POS[k]?POS[k].k:k];
 if(el){el.classList.add("hit");setTimeout(function(){el.classList.remove("hit")},90)}
 if(!S.start)S.start=Date.now();
 var exp=S.text[S.i],f=MAP[exp]||9,now=Date.now(),ke=S.ks[exp]||(S.ks[exp]={ok:0,err:0,ms:0,n:0,sub:{}});
 if(k===exp){ke.ok++;if(S.last&&now-S.last<3000){ke.ms+=now-S.last;ke.n++}S.last=now;S.fs[f].ok++;sfx("ok");mood("ok");if(window.H3&&H3.press)H3.press(f);S.i++;S.canBack=true;if(S.text.length-S.i<40)S.text+=" "+(S.catch?genCatch():gen(LES[S.les],S.stage))}
 else{ke.err++;ke.sub[k]=(ke.sub[k]||0)+1;S.fs[f].err++;sfx("bad");mood("bad");S.err++;var sp=$("txt").children[S.i];if(sp){sp.classList.add("err");setTimeout(function(){sp.classList.remove("err")},200)}if(S.free){S.bad[S.i]=1;S.badc++;S.i++;S.canBack=true;if(S.text.length-S.i<40)S.text+=" "+gen(LES[S.les],S.stage)}}
 paint();upd()});
document.addEventListener("keydown",function(e){if(e.key!=="Backspace"||!S.free||S.done||!$("v-lessons").classList.contains("on")||$("lpanel").classList.contains("on"))return;e.preventDefault();if(!S.canBack||S.i<=0)return;S.i--;if(S.bad[S.i]){delete S.bad[S.i];S.badc--}S.canBack=false;paint();upd()});
var TL=300000,lastT=Date.now();
function fmt(ms){var s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+("0"+s%60).slice(-2)}
setInterval(function(){var n=Date.now(),d=n-lastT;lastT=n;if(S.done||!S.start||S.stage===0)return;if(!$("v-lessons").classList.contains("on")||$("lpanel").classList.contains("on")||$("login").classList.contains("on")){S.start+=d;return}var rem=TL-(n-S.start);$("clock").textContent=fmt(rem);$("chr").classList.toggle("low",rem<=30000);var el=n-S.start;if(el>=180000&&el<TL){var L=LV[lvl()],ci=S.i-S.badc,t=ci+S.err,ac=t?ci/t*100:100,cp=ci/(el/60000);if(ac>=L.a&&cp>=L.c*(el<240000?1:.8)){upd();stageEnd();return}}if(rem<=0){S.start=n-TL;upd();stageEnd()}},250);
function kn(c){return c===" "?"espace":c}
function genCatch(){var l=LES[S.les],hb=l[2]==="ALL"?chars(l):l[2].split(""),ks=S.catchKeys.filter(function(c){return c!==" "}),o=[],n=0,w;if(!ks.length)ks=hb;while(n<60){var k=rnd(ks),pp=hb.filter(function(x){return x!==k}),p=pp.length?rnd(pp):k;w=Math.random()<.25?k+k+k:k+p+k+p;o.push(w);n+=w.length+1}return o.join(" ")}
function crit(ks){return Object.keys(ks).filter(function(c){return ks[c].err>0}).sort(function(x,y){return ks[y].err-ks[x].err}).slice(0,5)}
function slow(ks){return Object.keys(ks).filter(function(c){return c!==" "&&ks[c].n>=3}).sort(function(x,y){return ks[y].ms/ks[y].n-ks[x].ms/ks[x].n}).slice(0,3)}
function subs(o){return Object.keys(o).sort(function(x,y){return o[y]-o[x]}).slice(0,3).map(function(k){return E(kn(k))+" ×"+o[k]}).join(", ")}
function keysHTML(ks){var c=crit(ks),s=slow(ks),h='<h4>Caractères critiques</h4>';h+=c.length?'<ul>'+c.map(function(k){return'<li><b>'+E(kn(k))+'</b> : '+ks[k].err+' erreur'+(ks[k].err>1?"s":"")+' (tapé : '+subs(ks[k].sub)+')</li>'}).join("")+'</ul>':'<p class="rn">Aucune erreur. Bravo !</p>';h+='<h4>Touches lentes</h4>';h+=s.length?'<ul>'+s.map(function(k){return'<li><b>'+E(kn(k))+'</b> : '+Math.round(ks[k].ms/ks[k].n)+' ms en moyenne</li>'}).join("")+'</ul>':'<p class="rn">Pas assez de données.</p>';return h}
function mergeKs(ks){Object.keys(ks).forEach(function(c){var d=S.kall[c]||(S.kall[c]={ok:0,err:0,ms:0,n:0,sub:{}}),s=ks[c];d.ok+=s.ok;d.err+=s.err;d.ms+=s.ms;d.n+=s.n;Object.keys(s.sub).forEach(function(k){d.sub[k]=(d.sub[k]||0)+s.sub[k]})})}
function row(l,v,ok){return'<tr><td>'+l+'</td><td>'+v+'</td><td>'+(ok===null?"":ok?"✅":"❌")+'</td></tr>'}
function stageEnd(){S.done=true;var m=met(),L=LV[lvl()],el=Math.min(TL,Date.now()-S.start),pa=m.a>=L.a,pv=m.c>=L.c,ok=pa&&pv,ci=S.i-S.badc,t=ci+S.err;sfx("win");
 if(!S.catch){S.acc.ok+=ci;S.acc.err+=S.err;S.acc.ms+=el;mergeKs(S.ks);S.rep[S.stage]={c:m.c,w:m.w,a:m.a,ok:ok,t:el}}
 var nm=S.catch?"Rattrapage":"Étape "+(S.stage+1)+" · "+STN[S.stage];
 $("resT").textContent=nm+" — Niveau "+lvl()+(ok?" atteint ✅":" non atteint ❌");
 var v=ok?"Objectif du niveau atteint.":!pa&&!pv?"Il manque de la précision (≥ "+L.a+" %) et de la vitesse (≥ "+L.c+" CPM).":!pa?"Il manque de la précision : "+m.a+" % pour "+L.a+" % requis. Ralentis un peu.":"Précision atteinte. Il manque de la vitesse : "+m.c+" CPM pour "+L.c+" requis.";
 $("resP").textContent=v;
 $("rep").innerHTML='<table class="rt">'+row("Précision",m.a+" % <small>(seuil "+L.a+" %)</small>",pa)+row("Vitesse",m.c+" CPM · "+m.w+" MPM <small>(objectif "+L.c+" CPM)</small>",pv)+row("Temps utilisé",fmt(el-999)+" <small>sur 5:00</small>",null)+row("Caractères","<b>"+t+"</b> tapés · "+ci+" corrects · "+S.err+" erreurs",null)+'</table>'+keysHTML(S.ks);
 S.lastCrit=crit(S.ks);$("catchB").classList.toggle("hide",!S.lastCrit.length);
 $("again").textContent=S.catch?"Refaire le rattrapage":"Recommencer";
 $("nextS").classList.toggle("hide",S.stage>=STN.length-1);$("nextS").textContent="Étape suivante : "+STN[Math.min(S.stage+1,STN.length-1)];$("nextL").classList.toggle("hide",!(S.catch&&S.stage>=STN.length-1&&S.les<LES.length-1));
 if(S.stage>=STN.length-1&&!S.catch){S.lessonEnd=false;lessonEnd();return}
 S.lessonEnd=false;$("res").classList.remove("hide")}
function lessonEnd(){var t=S.acc.ok+S.acc.err,m={w:S.acc.ms>0?Math.round(S.acc.ok/5/(S.acc.ms/60000)):0,a:t?Math.round(S.acc.ok/t*100):100},L=LV[lvl()],cc=S.acc.ms>0?Math.round(S.acc.ok/(S.acc.ms/60000)):0,ok=m.a>=L.a&&cc>=L.c;S.lessonEnd=true;recLes(m);sfx("win");
 $("resT").textContent="Leçon terminée — Niveau "+lvl()+(ok?" atteint ✅":" non atteint ❌");
 $("resP").textContent=m.a+" % de précision · "+cc+" CPM ("+m.w+" MPM) sur toute la leçon.";
 var h='<table class="rt"><tr><th>Étape</th><th>CPM</th><th>Préc.</th><th></th></tr>';S.rep.forEach(function(r,i){if(!r)return;h+='<tr><td>'+(i+1)+'. '+E(STN[i])+'</td><td>'+r.c+'</td><td>'+r.a+' %</td><td>'+(r.ok?"✅":"❌")+'</td></tr>'});h+='</table>'+keysHTML(S.kall);$("rep").innerHTML=h;
 S.lastCrit=crit(S.kall);$("catchB").classList.toggle("hide",!S.lastCrit.length);$("again").textContent="Recommencer la leçon";
 $("nextS").classList.add("hide");$("nextL").classList.toggle("hide",S.les>=LES.length-1);$("res").classList.remove("hide");bars()}

/* Jeux */
var RW="le la les un une des du de et en que qui dans pour sur avec son sa ses mais ou donc car ce cette nous vous ils elle il je tu on pas plus tout bien faire dire voir aller venir jour temps vie main nuit monde pays ville maison porte table livre ecole classe travail projet idee mot phrase texte clavier souris ecran lettre rapide lent simple facile calme grand petit beau long haut bas matin soir pluie soleil vent mer terre ciel feu eau pain lait route velo train avion bateau musique".split(" ");
var GAMES=[["car","Course de voitures","4 voitures : votre frappe fait la vitesse, les erreurs abîment la voiture.",["Solo","Multi"],"race"],["castle","Défense du château","Détruisez les gobelins avant qu’ils n’atteignent la porte.",["Solo","Coop"],"words","chateau"],["skull","Zombies","Survivez à la nuit, mot après mot.",["Solo","Coop"],"words","zombie"],["fish","Pêche au trésor","Attrapez les poissons avant qu’ils s’échappent.",["Débutant"],"words","peche"],["balloon","Ballons","Éclatez les ballons avant qu’ils s’envolent.",["Débutant"],"words","ballon"],["rocket","Fusée spatiale","Détruisez les astéroïdes pour protéger la fusée.",["Solo","Coop"],"words","fusee"],["plane","Pilote d’avion","Dissipez les nuages d’orage sur votre trajectoire.",["Solo"],"words","avion"],["pizza","Pizzeria express","Les clients attendent : bientôt jouable.",["Débutant"],0],["mountain","Alpiniste","Grimpez prise après prise : bientôt jouable.",["Solo"],0],["swords","Duel de ninjas","Affrontez un ami : bientôt jouable.",["Multi"],0]];
var SK={chateau:{b:["#9ad0ff","#d9f0c4"],d:"L"},zombie:{b:["#141a34","#2b3a3a"],d:"L"},peche:{b:["#4aa8d8","#0f4f7a"],d:"L"},ballon:{b:["#bfe3ff","#fff0d6"],d:"U"},fusee:{b:["#050818","#1a2250"],d:"D"},avion:{b:["#7cc4ff","#d8efff"],d:"L"}};
function ic(n,c){return pxsvg(n,c)}
function gf(){var s="";["Tous","Débutant","Solo","Coop","Multi"].forEach(function(t){s+='<button class="chip" data-t="'+t+'" aria-pressed="'+(t===S.filter)+'">'+t+'</button>'});$("gf").innerHTML=s}
function gl(){var s="";GAMES.forEach(function(g,i){if(S.filter!=="Tous"&&g[3].indexOf(S.filter)<0)return;s+='<button class="gc" data-i="'+i+'"'+(g[4]?"":" disabled")+'>'+ic(g[0],"big")+'<b>'+g[1]+'</b><small>'+g[2]+'</small><div class="tags">'+g[3].map(function(t){return'<span class="tag">'+t+'</span>'}).join("")+(g[4]?'<span class="tag" style="background:var(--acc);color:#fff">Jouable</span>':'<span class="tag">Bientôt</span>')+'</div></button>'});$("gl").innerHTML=s||'<p class="note">Aucun jeu dans cette catégorie.</p>'}
$("gf").onclick=function(e){var b=e.target.closest("[data-t]");if(!b)return;S.filter=b.dataset.t;gf();gl()};
$("gl").onclick=function(e){var b=e.target.closest("[data-i]");if(b&&!b.disabled)startGame(+b.dataset.i)};
function pick(n){S.game=n;$("s2").textContent=n}
$("rand").onclick=function(){var p=[];GAMES.forEach(function(g,i){if(g[4])p.push(i)});go("games");startGame(p[Math.floor(Math.random()*p.length)])};

var cv=$("cv"),cx=cv.getContext("2d"),W=900,H=420,G=null,CC=["#5b5bf0","#e0a100","#c93d78","#2fa36b"],NM=["Vous","Léo","Mia","Sam"];
function words(n){var o=[];while(n--)o.push(RW[Math.floor(Math.random()*RW.length)]);return o.join(" ")}
function hideList(h){["gh1","glead","gf","gl"].forEach(function(i){$(i).classList.toggle("hide",h)})}
function stopGame(){if(G){cancelAnimationFrame(G.raf);G=null}if(window.R3)R3.stop();$("stage").classList.add("hide");hideList(false)}
$("gq").onclick=stopGame;$("gback").onclick=stopGame;$("gagain").onclick=function(){if(G)startGame(G.gi)};
function startGame(i){var g=GAMES[i];if(!g[4])return;stopGame();hideList(true);$("stage").classList.remove("hide");$("gres").classList.add("hide");pick(g[1]);
 G={gi:i,race:g[4]==="race",skin:g[5],t:0,last:performance.now(),start:0,ok:0,err:0,hit:0,done:false,fx:[]};
 $("gt").textContent=g[1];$("gtext").classList.toggle("hide",!G.race);G.race?initRace():initWords();if(G.race&&window.R3)R3.start();
 G.raf=requestAnimationFrame(loop);window.scrollTo(0,0)}
function loop(n){if(!G)return;var dt=Math.min(.05,(n-G.last)/1000);G.last=n;G.t+=dt;cx.textBaseline="alphabetic";cx.textAlign="left";
 if(G.race){stepRace(dt);drawRace()}else{stepWords(dt);drawWords()}drawParts(dt);hud();G.raf=requestAnimationFrame(loop)}
function stats(){var m=G.start?(Date.now()-G.start)/60000:0,t=G.ok+G.err;return{w:m>0?Math.round(G.ok/5/m):0,a:t?Math.round(G.ok/t*100):100}}
function hud(){var m=stats();$("gw").textContent=m.w;$("ga").textContent=m.a+"%";$("gv").textContent=Math.max(0,Math.round(G.race?G.hp:G.lives));$("gvl").textContent=G.race?"état voiture %":"vies"}
function showRes(t){var m=stats();recGame(m);sfx("win");$("gresT").textContent=t;$("gresP").textContent=m.w+" mots/min · "+m.a+" % de précision";$("gres").classList.remove("hide")}
document.addEventListener("keydown",function(e){if(!G||G.done||e.key.length!==1||e.metaKey||((e.ctrlKey||e.altKey)&&!(e.getModifierState&&e.getModifierState("AltGraph"))))return;e.preventDefault();if(!G.start)G.start=Date.now();G.race?keyRace(e.key):keyWords(e.key)});
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function ready(){if(G.start)return;cx.fillStyle="rgba(8,12,28,.66)";rr(W/2-250,H/2-34,500,68,14);cx.fill();cx.fillStyle="#fff";cx.font="600 20px sans-serif";cx.textAlign="center";cx.textBaseline="middle";cx.fillText(G.race?"Tapez la première lettre : le départ est lancé":"Tapez une lettre pour commencer",W/2,H/2);cx.textAlign="left";cx.textBaseline="alphabetic"}

/* Course */
function initRace(){G.text=words(24);G.L=G.text.length;G.i=0;G.hp=100;G.p=[0,0,0,0];G.disp=[0,0,0,0];G.fin=[0,0,0,0];G.n=0;G.bots=[22,30,40];G.shake=0;G.win=[];G.wpm=0;G.off=0;G.pt=[];G.st=0;txt()}
function txt(){var s="";for(var j=0;j<G.text.length;j++){var c=G.text[j];s+='<span class="'+(j<G.i?"done":j===G.i?"cur":"")+'">'+(c===" "?"&nbsp;":E(c))+'</span>'}$("gtext").innerHTML=s;var cu=$("gtext").querySelector(".cur");if(cu)$("gtext").scrollTop=Math.max(0,cu.offsetTop-8)}
function keyRace(k){var exp=G.text[G.i],f=MAP[exp]||9;
 if(k===exp){S.fs[f].ok++;sfx("ok");mood("ok");G.i++;G.ok++;G.st=(G.st||0)+1;G.hp=Math.min(100,G.hp+.6);G.win.push(Date.now());G.p[0]=Math.min(1,G.p[0]+(1/G.L)*(.55+.45*G.hp/100)*(G.st>=8?1.15:1));if(G.i>G.text.length-12)G.text+=" "+words(6);txt()}
 else{S.fs[f].err++;sfx("bad");mood("bad");G.err++;G.st=0;G.hp=Math.max(0,G.hp-7);G.shake=.3;(window.R3&&R3.on?R3.hit():burst(G.disp[0]*(W-150)+110,62,"#FFB347"))}}
function stepRace(dt){if(G.shake>0)G.shake-=dt;var now=Date.now();G.win=G.win.filter(function(t){return now-t<4000});G.wpm=G.win.length/5/4*60;
 G.off=(G.off+(G.start?60+G.wpm*3:0)*dt)%60;if(!G.start)return;
 for(var b=1;b<4;b++)if(G.p[b]<1){G.p[b]=Math.min(1,G.p[b]+G.bots[b-1]*5/60*(1+.25*Math.sin(G.t*.8+b*2))/G.L*dt);if(G.p[b]>=1)G.fin[b]=++G.n}
 for(var j=0;j<4;j++)G.disp[j]+=(G.p[j]-G.disp[j])*Math.min(1,dt*6);
 if(G.p[0]>=1&&!G.done){G.done=true;G.disp[0]=1;var r=1;for(var k=1;k<4;k++)if(G.fin[k])r++;G.won=r===1;showRes(r===1?"Victoire ! Vous finissez 1er":"Vous finissez "+r+"e sur 4 · voiture à "+Math.round(G.hp)+" %")}}
/* Rendu pixel art */
var SP={};
SP.car=".......oooooooooo......./......ouuuuBuuuuuo....../.....oBBBBBBBBBBBBo...../.oooBBBBBBBBBBBBBBBBBoo./oBBBBBBBBBBBBBBBBBBBBBBo/oBBBBBBBBBBBBBBBBBBBByyo/oBBBBBBBBBBBBBBBBBBBBBBo/oooooooooooooooooooooooo/..ooddoo......ooddoo..../..oddddo......oddddo..../..ooddoo......ooddoo..../....oooo........oooo....".split("/");
SP.gob="...oooo.../..ogggo.../..owkgo.../..ogggo.../...ogo..../..orrrro../.orrrrrro./.orrrrrro./..orrrro../..oo..oo../..oo..oo../.ooo..ooo.".split("/");
SP.zom="...oooo.../..ogggo.../..owkgo.../..ogggo.../...ogo..../gggorrrro./.orrrrrro./.orrrrrro./..orrrro../..oo..oo../..oo..oo../.ooo..ooo.".split("/");
SP.fish="...oooo...../..oBBBBo..oy/.oBBBBBBooyy/oBwkBBBBBoyy/.oBBBBBBooyy/..oBBBBo..oy/...oooo.....".split("/");
SP.bal="..ooooo../.oBBBBBo./oBwBBBBBo/oBwBBBBBo/oBBBBBBBo/oBBBBBBBo/.oBBBBBo./..oBBBo../...ooo.../....o..../...o...../....o..../...o.....".split("/");
SP.ast="...oooo.../..okkkko../.okkdkkko./okkkkkkdko/okdkkkkkko/okkkkdkkko/okkkkkkkko/.okkdkkko./..okkkko../...oooo...".split("/");
SP.cld="....oooo....../..ooddddoooo../.oddddddddddo./oddddddddddddo/.oddddddddddo./..oo..yy..oo../......yy......".split("/");
SP.rock="...o.../..owo../.owwwo./.owwwo./.owuwo./.owuwo./.owwwo./.owwwo./orwwwro/orwwwro/ooo.ooo/...y.../..yyy../...y...".split("/");
SP.plane="......oo......../.....owwo......./..oooowwwwoooo../orrwwwwwwwwwuuwo/.oooowwwwwwooo../.....owwo......./......oo........".split("/");
function PL(x){var o={o:"#3A2F45",w:"#FFFFFF",y:"#FFE066",u:"#BFE6FF",d:"#4A4A5A",k:"#9AA3B8",r:"#E85D75"};for(var k in x)o[k]=x[k];return o}
function spr(n,x,y,s,pal){var g=SP[n],w=g[0].length;x=Math.round(x/s)*s;y=Math.round(y/s)*s;g.forEach(function(r,j){var i=0;while(i<w){var ch=r[i],k=1;while(i+k<w&&r[i+k]===ch)k++;var c=ch!=="."&&pal[ch];if(c){cx.fillStyle=c;cx.fillRect(x+i*s,y+j*s,k*s,s)}i+=k}})}
function burst(x,y,c){G.pt=G.pt||[];for(var i=0;i<14;i++)G.pt.push({x:x,y:y,vx:(Math.random()-.5)*320,vy:-Math.random()*240-40,t:0,c:i%3?c:"#FFFFFF"})}
function drawParts(dt){if(G.pt){G.pt.forEach(function(p){p.t+=dt;p.vy+=700*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;cx.globalAlpha=Math.max(0,1-p.t/.7);cx.fillStyle=p.c;cx.fillRect(Math.round(p.x/4)*4,Math.round(p.y/4)*4,8,8)});cx.globalAlpha=1;G.pt=G.pt.filter(function(p){return p.t<.7})}
 if(G.st>=3){cx.font='400 14px "Press Start 2P",monospace';cx.fillStyle=G.st>=8&&Math.floor(G.t*8)%2?"#FF9F43":"#FFE066";cx.textAlign="right";cx.fillText((G.st>=8?"TURBO ":"SÉRIE ")+"x"+G.st,W-14,G.race?17:32);cx.textAlign="left"}}

/* Course */
function car(x,y,c,d,tb){x=Math.round(x/4)*4;spr("car",x,y,4,PL({B:c}));
 if(tb){var fl=Math.floor(G.t*30)%2;cx.fillStyle="#FF9F43";cx.fillRect(x-24-fl*8,y+24,24+fl*8,8);cx.fillStyle="#FFE066";cx.fillRect(x-12,y+28,12+fl*4,4)}
 cx.fillStyle="#2A2433";if(d>.15){var w=4*Math.min(3,Math.ceil(d*4));cx.fillRect(x+92-w,y+16,w,16)}
 if(d>.3){cx.fillRect(x+32,y+4,4,4);cx.fillRect(x+36,y+8,4,4)}
 if(d>.45){cx.fillRect(x+24,y+16,4,4);cx.fillRect(x+28,y+20,4,4);cx.fillRect(x+32,y+24,4,4)}
 if(d>.5)for(var k=0;k<4;k++){var o=(G.t*50+k*14)%56,sz=4*(1+k%2);cx.globalAlpha=Math.max(0,.7-o/90);cx.fillStyle="#9AA3B8";cx.fillRect(Math.round((x+72-k*8-o*.2)/4)*4,Math.round((y+8-o)/4)*4,sz,sz)}
 cx.globalAlpha=1}
function drawRace(){if(window.R3&&R3.on){cx.clearRect(0,0,W,H);R3.draw(G,cx,W,H,NM);ready();return}var sh=G.shake>0?(Math.random()-.5)*8:0;cx.save();cx.translate(Math.round(sh),0);
 cx.fillStyle="#9BD36B";cx.fillRect(-10,0,W+20,H);
 for(var i=0;i<W+24;i+=24){var gx=Math.round(i-(G.off%24));cx.fillStyle=(i/24)%2?"#8FCB5E":"#B2E283";cx.fillRect(gx,0,12,12);cx.fillRect(gx,H-12,12,12)}
 for(var l=0;l<4;l++){var y=24+l*96;cx.fillStyle="#394152";cx.fillRect(0,y,W,84);cx.fillStyle="#4A5368";cx.fillRect(0,y,W,4);cx.fillStyle="#2E3442";cx.fillRect(0,y+80,W,4);cx.fillStyle="rgba(255,255,255,.55)";for(var x=-Math.round(G.off);x<W;x+=60)cx.fillRect(x,y+40,30,4);
  car(18+G.disp[l]*(W-150),y+18,CC[l],l?0:(100-G.hp)/100,l===0&&G.st>=8);
  cx.fillStyle="#fff";cx.font='400 10px "Press Start 2P",monospace';cx.fillText(NM[l]+(G.fin[l]?" OK":""),10,y+16)}
 for(var r=0;r<16;r++)for(var c2=0;c2<2;c2++){cx.fillStyle=(r+c2)%2?"#fff":"#222";cx.fillRect(W-24+c2*12,24+r*24,12,24)}
 cx.restore();ready()}

/* Jeux de mots */
var SKY={chateau:[[154,208,255],[217,240,196]],zombie:[[20,26,52],[43,58,58]],peche:[[74,168,216],[15,79,122]],ballon:[[191,227,255],[255,240,214]],fusee:[[5,8,24],[26,34,80]],avion:[[124,196,255],[216,239,255]]};
function clouds(n,sp,y0,a){cx.fillStyle="rgba(255,255,255,"+a+")";var wd=W+160;for(var i=0;i<n;i++){var x=((i*277-G.t*sp*(1+i%3*.4))%wd+wd)%wd-80,y=y0+(i*53)%110;x=Math.round(x/6)*6;y=Math.round(y/6)*6;cx.fillRect(x,y,72,12);cx.fillRect(x+12,y-12,42,12);cx.fillRect(x+24,y-24,18,12)}}
function stars(n){for(var i=0;i<n;i++){cx.fillStyle=Math.floor(G.t*2+i)%3?"#FFFFFF":"#9FB0FF";var x=(i*191)%W,y=(i*97)%(H-60);cx.fillRect(x-x%4,y-y%4,4,4)}}
function hills(col,base,amp,seed){cx.fillStyle=col;for(var x=0;x<W;x+=12){var h=base-Math.round((Math.sin(x*.011+seed)*amp+Math.sin(x*.027+seed*2)*amp*.5)/6)*6;cx.fillRect(x,h,12,H-h)}}
function scene(s){var a=SKY[s][0],b=SKY[s][1];for(var i=0;i<10;i++){var t=i/9;cx.fillStyle="rgb("+[0,1,2].map(function(k){return Math.round(a[k]+(b[k]-a[k])*t)}).join(",")+")";cx.fillRect(0,i*42,W,42)}
 if(s==="chateau"||s==="avion"||s==="ballon"){clouds(s==="avion"?7:5,s==="avion"?60:14,40,.85);if(s!=="ballon")hills("#7FC46B",s==="avion"?H-40:H-90,24,1)}
 if(s==="zombie"){stars(40);cx.fillStyle="#F2E4A6";cx.fillRect(780,36,36,36);cx.fillRect(768,48,60,12);cx.fillRect(792,24,12,60);hills("#1F2C2E",H-80,22,3)}
 if(s==="fusee"){stars(60);cx.fillStyle="#6B5BA8";cx.fillRect(120,60,36,36);cx.fillRect(108,72,60,12);cx.fillRect(132,48,12,60)}
 if(s==="peche"){cx.fillStyle="rgba(255,255,255,.5)";for(var j=0;j<8;j++){var bx=(j*131)%W,by=H-((G.t*30+j*57)%H);cx.fillRect(bx-bx%4,by-by%4,8,8)}cx.fillStyle="#E8CF8B";for(var x=0;x<W;x+=12){var h=H-30-((x*7)%24);cx.fillRect(x,h-h%6,12,H)}for(var q=0;q<6;q++){var sx=100+q*140,sw=Math.round(Math.sin(G.t*2+q)*2)*3;cx.fillStyle="#3FA36B";for(var k=0;k<5;k++)cx.fillRect(sx+(k%2?sw:0),H-60-k*12,6,12)}}}
function baseDraw(s){
 if(s==="chateau"){cx.fillStyle="#9AA1AE";cx.fillRect(0,96,72,H-96);cx.fillStyle="#7F8795";for(var y=108;y<H;y+=24)cx.fillRect(0,y,72,3);cx.fillStyle="#9AA1AE";for(var k=0;k<3;k++)cx.fillRect(k*30,72,18,24);cx.fillStyle="#5B4636";cx.fillRect(24,300,30,H-300);cx.fillStyle="#E85D75";cx.fillRect(30,36,24,18);cx.fillRect(24,36,6,60)}
 else if(s==="zombie"){cx.fillStyle="#4B3A2E";cx.fillRect(0,100,60,H-100);cx.fillStyle="#6A5444";for(var y2=112;y2<H;y2+=36)cx.fillRect(4,y2,52,12);cx.fillStyle="#FFE066";cx.fillRect(18,150,24,24)}
 else if(s==="peche"){cx.fillStyle="#B9763D";cx.fillRect(0,H-132,84,12);cx.fillRect(6,H-120,72,12);cx.fillRect(18,H-108,48,12);cx.fillStyle="#fff";cx.fillRect(36,H-192,6,60);cx.fillRect(42,H-186,30,48)}
 else if(s==="ballon"){cx.fillStyle="#E85D75";for(var x=0;x<W;x+=24){cx.fillRect(x+6,0,12,12);cx.fillRect(x+9,12,6,12)}}
 else if(s==="fusee"){cx.fillStyle="#2C3350";cx.fillRect(0,H-26,W,26);cx.fillStyle="#3C4468";for(var x2=0;x2<W;x2+=24)cx.fillRect(x2,H-26,12,6);spr("rock",W/2-14,H-26-56,4,PL({}))}
 else spr("plane",8,H/2-16,4,PL({}))}
function ent(e){var s=G.skin,x=e.x,y=e.y;
 if(s==="chateau")spr("gob",x-20,y,4,PL({g:"#63BF72",r:"#B07A45",k:"#1B1B1B"}));
 else if(s==="zombie")spr("zom",x-20,y,4,PL({g:"#8FAF86",r:"#4B6A9A",k:"#B3261E"}));
 else if(s==="peche")spr("fish",x-24,y,4,PL({B:e.c,k:"#1B1B1B"}));
 else if(s==="ballon")spr("bal",x-18,y-26,4,PL({B:e.c}));
 else if(s==="fusee")spr("ast",x-20,y,4,PL({}));
 else spr("cld",x-28,y,4,PL({}))}
function pill(x,y,e){cx.font='700 17px "JetBrains Mono",monospace';cx.textBaseline="middle";var w=Math.round(cx.measureText(e.w).width+20);x=Math.round(x-w/2);y=Math.round(y-14);cx.fillStyle="#3A2F45";cx.fillRect(x-3,y-3,w+6,34);cx.fillStyle=G.tgt===e?"#FFF3B0":"#FFFFFF";cx.fillRect(x,y,w,28);var d=e.w.slice(0,e.i),tw=cx.measureText(d).width;cx.fillStyle="#2E9E62";cx.fillText(d,x+10,y+15);cx.fillStyle="#2B2335";cx.fillText(e.w.slice(e.i),x+10+tw,y+15);cx.textBaseline="alphabetic"}
function drawWords(){var s=G.skin,sh=G.hit>.2?(Math.random()-.5)*10:0;cx.save();cx.translate(Math.round(sh),0);scene(s);baseDraw(s);
 G.ents.forEach(function(e){ent(e);pill(e.x,e.y+(s==="ballon"?0:s==="peche"?-14:-28),e)});
 G.fx.forEach(function(f){var r=Math.round((10+f.t*160)/4)*4;cx.strokeStyle="rgba(255,255,255,"+(1-f.t/.35)+")";cx.lineWidth=4;cx.strokeRect(Math.round(f.x-r),Math.round(f.y+8-r),r*2,r*2);if(s==="fusee"&&f.t<.15){cx.fillStyle="#FF6B6B";for(var i=1;i<12;i++)cx.fillRect(Math.round((W/2+(f.x-W/2)*i/12)/4)*4,Math.round(((H-90)+(f.y-(H-90))*i/12)/4)*4,8,8)}});
 if(G.hit>0){cx.fillStyle="rgba(217,101,79,"+Math.min(.3,G.hit)+")";cx.fillRect(-20,0,W+40,H)}cx.restore();ready()}

/* Jeux de mots */
function initWords(){G.ents=[];G.lives=5;G.tgt=null;G.sp=0;G.score=0;G.pt=[];G.st=0;G.stars=[];for(var k=0;k<50;k++)G.stars.push([Math.random()*W,Math.random()*H,Math.random()*1.6+.4])}
function spawn(){var d=Math.floor(G.score/6),len=3+Math.min(4,Math.floor(d/2)),dir=SK[G.skin].d,w,t=0;
 do{var c=RW.filter(function(x){return x.length>=len-1&&x.length<=len+1});w=c[Math.floor(Math.random()*c.length)]}while(G.ents.some(function(e){return e.w[0]===w[0]})&&++t<12);
 var e={w:w,i:0,c:CC[Math.floor(Math.random()*4)],x:0,y:0,vx:0,vy:0},v=36+d*4;
 if(dir==="L"){e.x=W+50;e.y=50+Math.random()*(H-160);e.vx=-v}else{e.x=60+Math.random()*(W-120);e.y=dir==="U"?H+40:-30;e.vy=dir==="U"?-v:v}
 G.ents.push(e)}
function keyWords(k){var t=G.tgt,d=SK[G.skin].d;
 if(!t){t=G.ents.filter(function(e){return e.w[0]===k}).sort(function(a,b){return d==="L"?a.x-b.x:d==="U"?a.y-b.y:b.y-a.y})[0];if(t)G.tgt=t}
 var f=MAP[t?t.w[t.i]:k]||9;
 if(t&&k===t.w[t.i]){t.i++;G.ok++;S.fs[f].ok++;sfx("ok");mood("ok");G.st=(G.st||0)+1;if(t.i>=t.w.length){G.ents.splice(G.ents.indexOf(t),1);G.tgt=null;G.score++;G.fx.push({x:t.x,y:t.y,t:0});burst(t.x,t.y+8,t.c)}}
 else{G.err++;S.fs[f].err++;G.hit=.15;G.st=0;sfx("bad");mood("bad")}}
function stepWords(dt){G.hit=Math.max(0,G.hit-dt);G.fx.forEach(function(f){f.t+=dt});G.fx=G.fx.filter(function(f){return f.t<.35});if(!G.start||G.done)return;
 G.sp-=dt;if(G.sp<=0){spawn();G.sp=Math.max(.9,2.5-G.score*.03)}
 var d=SK[G.skin].d;
 G.ents.slice().forEach(function(e){e.x+=e.vx*dt;e.y+=e.vy*dt;var out=d==="L"?e.x<80:d==="U"?e.y<8:e.y>H-100;
  if(out){G.ents.splice(G.ents.indexOf(e),1);if(G.tgt===e)G.tgt=null;G.lives--;G.hit=.35;if(G.lives<=0){G.done=true;showRes("Partie terminée · "+G.score+" mots détruits")}}})}
/* Multijoueur */
var P=[{n:"Vous",c:"f5",r:false,me:1},{n:"Léo",c:"f3",r:false},{n:"Mia",c:"f7",r:false},{n:"Bot Sam",c:"f9",r:true,bot:1}];
function lobby(){var s="";P.forEach(function(p){s+='<div class="slot'+(p.me?" me":"")+'"><b>'+p.n+'</b><div class="car '+p.c+'"></div>'+(p.bot?'<span class="pill ok">Bot</span>':'<span class="pill'+(p.r?" ok":"")+'">'+(p.r?"Prêt":"En attente")+'</span>')+'</div>'});$("lobby").innerHTML=s;var all=P.every(function(p){return p.r});$("launch").disabled=!all;$("lmsg").textContent=all?"Tout le monde est prêt !":"En attente des joueurs…";$("ready").textContent=P[0].r?"Je ne suis plus prêt":"Je suis prêt"}
var tm=[];function sim(){tm.forEach(clearTimeout);tm=[setTimeout(function(){P[1].r=true;lobby()},1800),setTimeout(function(){P[2].r=true;lobby()},3400)]}
$("ready").onclick=function(){P[0].r=!P[0].r;lobby()};
$("copy").onclick=function(){var u="dactylo.app/salon/"+$("code").textContent;function ok(){$("cmsg").textContent="Lien copié"}try{navigator.clipboard.writeText(u).then(ok,function(){$("cmsg").textContent=u})}catch(e){$("cmsg").textContent=u}};
$("newc").onclick=function(){var A="ABCDEFGHJKLMNPQRSTUVWXYZ";$("code").textContent=A[Math.floor(Math.random()*24)]+A[Math.floor(Math.random()*24)]+A[Math.floor(Math.random()*24)]+"-"+(100+Math.floor(Math.random()*900));P.forEach(function(p){if(!p.bot)p.r=false});$("cmsg").textContent="";lobby();sim()};
$("launch").onclick=function(){var n=3;$("ov").classList.add("on");$("cd").textContent=n;$("cdp").textContent="La course démarre…";var t=setInterval(function(){n--;if(n>0)$("cd").textContent=n;else{clearInterval(t);$("cd").textContent="🏁";$("cdp").textContent="Départ ! (la course jouable arrive à l’étape suivante)";setTimeout(function(){$("ov").classList.remove("on")},1800)}},900)};

/* Bilan */
function bars(){var s="",w=null,wa=101;for(var f=1;f<=8;f++){var d=S.fs[f],t=d.ok+d.err,a=t?Math.round(d.ok/t*100):0;if(t>=3&&a<wa){wa=a;w=f}s+='<div class="br"><span>'+FN[f]+'</span><div class="t"><i class="f'+f+'" style="width:'+a+'%;background:var(--f'+f+')"></i></div><b>'+(t?a+"%":"–")+'</b></div>'}
$("bars").innerHTML=s;$("weak").textContent=w?"Doigt à retravailler en priorité : "+FN[w].toLowerCase()+" ("+wa+" %).":"Pas encore de données : faites une leçon."}

/* Pixel art, profils, réglages, PWA */
var PAL={o:"var(--po)",r:"#F28B9B",y:"#F8D56B",g:"#8FD19E",u:"#8EC5F0",p:"#B9A4EA",s:"#F8D2B0",w:"#FFFFFF",k:"#A8B0C4",n:"#C9976A",d:"#5A4A6A"};
var CATP={o:"var(--po)",p:"#F6C77A",c:"#FBE3B0",w:"#FFFFFF",k:"#3B2A14",n:"#F29AA8"};
var CAT=["................","..oo........oo..",".oppo......oppo.",".oppppppppppppo.",".oppppppppppppo.",".opwwppppppwwpo.",".opwkppppppwkpo.",".oppppppnnppppo.",".oppppppooppppo.","..oppppppppppo..","..oppppppppppo..",".oppppccccppppo.",".oppppccccppppo.",".oppppccccppppo.",".ooo.oo..oo.ooo.","................"];
var ICONS={};"home=....oo..../...orro.../..orrrro../.orrrrrro./orrrrrrrro/.oyyyyyyo./.oyyooyyo./.oyyooyyo./.oyyooyyo./.oooooooo.;kb=........../oooooooooo/okwkwkwkko/okkkkkkkko/okwkwkwkko/okkkkkkkko/okwwwwwwko/oooooooooo/........../..........;pad=........../.oooooooo./ouuuuuuuuo/ouuwuuuyuo/ouwwwuyuyo/ouuwuuuyuo/ouuuuuuuuo/.oouuuuoo./..oo..oo../..........;flag=.o......../.orrrrr.../.orrrrrrr./.orrrrrr../.orrrrr.../.o......../.o......../.o......../oooo....../..........;chart=........../.......yy./.......yy./.......yy./....uu.yy./....uu.yy./.rr.uu.yy./.rr.uu.yy./.rr.uu.yy./oooooooooo;moon=...ooo..../..oyyyo.../.oyyo...../.oyyo...../.oyyo...../.oyyo...../.oyyyo..oo/..oyyyooyo/...oyyyyo./....oooo..;sun=....yy..../.y..yy..y./..oooooo../y.oyyyyo.y/yyoyyyyoyy/yyoyyyyoyy/y.oyyyyo.y/..oooooo../.y..yy..y./....yy....;gear=....kk..../.k.kkkk.k./..kkkkkk../.kkk..kkk./kkk....kkk/kkk....kkk/.kkk..kkk./..kkkkkk../.k.kkkk.k./....kk....;user=...oooo.../..osssso../..osssso../..osssso.../...oooo.../.oouuuuoo./ouuuuuuuuo/ouuuuuuuuo/ouuuuuuuuo/oooooooooo;car=...oooo.../..ouuuuo../.orruurro./orrrrrrrro/orrrrrrrro/oooooooooo/.oddo.oddo/.oddo.oddo/..oo...oo./..........;rocket=....oo..../...owwo.../..owwwwo../..owuuwo../..owuuwo../..owwwwo../.orowworo./.rr.oo.rr./....yy..../....y.....;castle=o.o.oo.o.o/oooooooooo/okkkkkkkko/okukkkkuko/okkkddkkko/okkkddkkko/okkkddkkko/okkkddkkko/oooooooooo/..........;fish=........../..oooo..../.ouuuuo.oy/ouwkuuuoyy/ouuuuuuoyy/.ouuuuo.oy/..oooo..../........../........../..........;balloon=...oooo.../..orrrro../.orwrrrro./.orwrrrro./.orrrrrro./..orrrro../...orro.../....oo..../....o...../.....o....;plane=....oo..../...owwo.../...owuo.../oooowwoooo/owwwwwwwwo/..oowwoo../....ww..../...owwo.../..owwwwo../..oooooo..;skull=..oooooo../.owwwwwwo./owwwwwwwwo/owddwwddwo/owddwwddwo/owwwwwwwwo/.owwwwwwo./..owowwo../..oooooo../..........;pizza=onnnnnnnno/.oyyyyyyo./.oyryyryo./..oyyyyo../..oyyryo../...oyyo.../....oro.../.....o..../........../..........;mountain=....oo..../...owwo.../..owwwwo../..okwwko../.okkkkkko./.okkkkkko./okkkkkkkko/okkkkkkkko/okkkkkkkko/oooooooooo;swords=ww......ww/.ww....ww./..ww..ww../...wwww.../....ww..../...wwww.../..rw..wr../.nr....rn./nn......nn/n........n;trophy=.oyyyyyyo./oyyyyyyyyo/oyyyyyyyyo/.oyyyyyyo./..oyyyyo../...oyyo.../....yy..../....yy..../..nnnnnn../.nnnnnnnn.".split(";").forEach(function(s){var i=s.indexOf("=");ICONS[s.slice(0,i)]=s.slice(i+1).split("/")});
function pix(g,pal,cls){var h=g.length,w=g[0].length,s='<svg class="'+cls+'" viewBox="0 0 '+w+' '+h+'" shape-rendering="crispEdges" aria-hidden="true">';g.forEach(function(r,y){var x=0;while(x<w){var ch=r[x],n=1;while(x+n<w&&r[x+n]===ch)n++;if(ch!=="."&&pal[ch])s+='<rect x="'+x+'" y="'+y+'" width="'+n+'" height="1" fill="'+pal[ch]+'"/>';x+=n}});return s+"</svg>"}
function pxsvg(n,c){return pix(ICONS[n]||ICONS.star||ICONS.home,PAL,"px "+(c||""))}
function handsSVG(){var out={},sp={1:[1,5],2:[5,2],3:[9,0],4:[13,3]};
 function put(id,x,y,w,h,nail){out[id]=(out[id]||"")+'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"'+(nail?' fill="#fff" fill-opacity=".5"':"")+'/>'}
 [0,1].forEach(function(m){function X(x,w){return m?46-x-w:x}
  for(var f=1;f<=4;f++){var id=m?9-f:f,x0=sp[f][0],t=sp[f][1];put(id,X(x0+1,1),t,1,1);put(id,X(x0,3),t+1,3,13-t);put(id,X(x0,3),t+1,3,1,1)}
  put(9,X(16,3),15,3,4);put(9,X(18,3),12,3,4);put(9,X(19,3),10,3,3);put(0,X(1,15),14,15,6);put(0,X(2,13),20,13,1)});
 var s='<svg viewBox="0 0 46 21" shape-rendering="crispEdges" role="img" aria-label="Mains">';
 [0,1,2,3,4,5,6,7,8,9].forEach(function(id){s+='<g class="fg"'+(id?' data-f="'+id+'"':"")+' style="fill:var(--f'+id+')">'+out[id]+'</g>'});return s+"</svg>"}
function mood(m){Q("[data-m]").forEach(function(e){e.classList.remove("ok","bad");void e.offsetWidth;e.classList.add(m);clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove(m)},320)})}
var AC=null;function sfx(t){try{if(!prof()||!prof().set.snd)return;AC=AC||new(window.AudioContext||window.webkitAudioContext)();var tt=AC.currentTime,q={ok:[[660,.04,"square"]],bad:[[130,.12,"sawtooth"]],win:[[523,.1,"square"],[659,.1,"square"],[784,.18,"square"]]}[t];q.forEach(function(s){var o=AC.createOscillator(),g=AC.createGain();o.type=s[2];o.frequency.value=s[0];g.gain.setValueAtTime(.05,tt);g.gain.exponentialRampToValueAtTime(.001,tt+s[1]);o.connect(g);g.connect(AC.destination);o.start(tt);o.stop(tt+s[1]);tt+=s[1]})}catch(e){}}

/* Profils et mémoire */
var KEY="dactylo.v1",DB={cur:null,profiles:{}};
function dbLoad(){try{var d=JSON.parse(localStorage.getItem(KEY));if(d&&d.profiles)DB=d}catch(e){}}
function dbSave(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}}
function newProf(){var fs={};for(var f=1;f<=9;f++)fs[f]={ok:0,err:0};return{fs:fs,les:{},games:{},plays:0,wins:0,best:0,set:{theme:"auto",font:"douceur",size:100,snd:true}}}
function prof(){return DB.profiles[DB.cur]}
function isDark(){var t=document.documentElement.getAttribute("data-theme");return t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches)}
function setUI(){var s=prof().set;Q("#cth .chip").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.th===s.theme)});Q("#cft .chip").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.ft===s.font)});Q("#csn .chip").forEach(function(b){b.setAttribute("aria-pressed",(b.dataset.sn==="1")===!!s.snd)});$("sz").value=s.size;$("szv").textContent=s.size+" %"}
function applySet(){var s=prof().set,d=document.documentElement;if(s.theme==="auto")d.removeAttribute("data-theme");else d.setAttribute("data-theme",s.theme);d.setAttribute("data-font",s.font);d.style.setProperty("--scale",s.size/100);$("theme").innerHTML=pxsvg(isDark()?"sun":"moon")+"Thème";setUI();lvlUI();if(window.H3&&H3.recolor)H3.recolor();if(window.R3)R3.theme(isDark())}
function plist(){var n=Object.keys(DB.profiles),h="";n.forEach(function(x){h+='<button class="chip" data-n="'+E(x)+'">'+E(x)+'</button>'});$("plist").innerHTML=h;$("plist").classList.toggle("hide",!n.length)}
function whoUpdate(){$("who").innerHTML=pxsvg("user")+E(DB.cur);$("who2").textContent=DB.cur}
function enter(name){name=String(name).trim().slice(0,16);if(!name)return;if(!DB.profiles[name])DB.profiles[name]=newProf();DB.cur=name;dbSave();S.fs=prof().fs;S.les=0;applySet();whoUpdate();$("login").classList.remove("on");lchips();bars();lb();begin();go("home")}
function lb(){var a=Object.keys(DB.profiles).map(function(n){var p=DB.profiles[n];return{n:n,b:p.best||0,p:p.plays||0,w:p.wins||0}}).sort(function(x,y){return y.b-x.b}),h='<table class="tb"><tr><th>#</th><th>Joueur</th><th>Record</th><th>Parties</th><th>Victoires</th></tr>';a.forEach(function(r,i){h+='<tr'+(r.n===DB.cur?' class="me"':"")+'><td>'+(i+1)+'</td><td>'+E(r.n)+'</td><td>'+r.b+' mot/min</td><td>'+r.p+'</td><td>'+r.w+'</td></tr>'});$("lb").innerHTML=h+"</table>"}
function recLes(m){var p=prof();if(!p)return;var o=p.les[S.les]||{w:0,a:0,n:0};p.les[S.les]={w:Math.max(o.w,m.w),a:Math.max(o.a,m.a),n:o.n+1};p.plays++;p.best=Math.max(p.best||0,m.w);dbSave()}
function recGame(m){var p=prof();if(!p)return;var k=GAMES[G.gi][1],o=p.games[k]||{w:0,s:0,n:0};p.games[k]={w:Math.max(o.w,m.w),s:Math.max(o.s,G.score||0),n:o.n+1};p.plays++;if(G.won)p.wins=(p.wins||0)+1;p.best=Math.max(p.best||0,m.w);dbSave()}
function sure(b,fn){if(b._a){clearTimeout(b._t);b._a=0;b.textContent=b._o;fn();return}b._o=b.textContent;b._a=1;b.textContent="Cliquez pour confirmer";b._t=setTimeout(function(){b._a=0;b.textContent=b._o},4000)}
$("pgo").onclick=function(){enter($("pseudo").value)};$("pseudo").onkeydown=function(e){if(e.key==="Enter")enter(this.value)};
$("plist").onclick=function(e){var b=e.target.closest("[data-n]");if(b)enter(b.dataset.n)};
$("who").onclick=function(){go("settings")};
$("switch").onclick=function(){plist();$("login").classList.add("on");setTimeout(function(){$("pseudo").focus()},50)};
$("cth").onclick=function(e){var b=e.target.closest("[data-th]");if(b){prof().set.theme=b.dataset.th;dbSave();applySet()}};
$("cft").onclick=function(e){var b=e.target.closest("[data-ft]");if(b){prof().set.font=b.dataset.ft;dbSave();applySet()}};
$("csn").onclick=function(e){var b=e.target.closest("[data-sn]");if(b){prof().set.snd=b.dataset.sn==="1";dbSave();setUI();sfx("ok")}};
$("sz").oninput=function(){prof().set.size=+this.value;applySet()};$("sz").onchange=function(){dbSave()};
$("exp").onclick=function(){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(DB)],{type:"application/json"}));a.download="dactylo-sauvegarde.json";a.click()};
$("imp").onclick=function(){$("impf").click()};
$("impf").onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!d.profiles)throw 0;Object.keys(d.profiles).forEach(function(n){DB.profiles[n]=d.profiles[n]});dbSave();plist();$("dmsg").textContent="Sauvegarde importée : "+Object.keys(d.profiles).length+" profil(s)."}catch(e){$("dmsg").textContent="Fichier invalide."}};r.readAsText(f)};
$("rp").onclick=function(){sure(this,function(){var s=prof().set,n=newProf();n.set=s;DB.profiles[DB.cur]=n;dbSave();S.fs=n.fs;S.les=0;lchips();bars();lb();begin();$("dmsg").textContent="Profil réinitialisé."})};
$("ra").onclick=function(){sure(this,function(){try{localStorage.removeItem(KEY)}catch(e){}DB={cur:null,profiles:{}};S.fs=newProf().fs;plist();$("login").classList.add("on")})};
var inst=null;addEventListener("beforeinstallprompt",function(e){e.preventDefault();inst=e;$("install").classList.remove("hide")});
$("install").onclick=function(){if(inst){inst.prompt();inst=null;this.classList.add("hide")}};
function net(){$("offl").textContent=navigator.onLine?"Connexion : en ligne.":"Connexion : hors ligne. Tout fonctionne quand même."}
addEventListener("online",net);addEventListener("offline",net);addEventListener("pagehide",dbSave);document.addEventListener("visibilitychange",dbSave);
function boot(){dbLoad();Q("i.pxi").forEach(function(e){e.outerHTML=pxsvg(e.dataset.i)});Q("[data-m]").forEach(function(e){e.innerHTML=pix(CAT,CATP,"cat")});$("hands").innerHTML=handsSVG();if(window.H3&&H3.init($("hands")))$("hands").classList.add("h3d");net();
 lchips();gf();gl();lobby();sim();plist();
 if(DB.cur&&prof()){enter(DB.cur)}else{S.fs=newProf().fs;bars();begin();$("login").classList.add("on");setTimeout(function(){$("pseudo").focus()},100)}
 try{if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js")}catch(e){}}

boot();
})();
