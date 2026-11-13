/* Piano : de vraies notes de piano jouées avec le clavier de l'ordinateur.
   Échantillons : FluidR3_GM (licence MIT) via midi-js-soundfonts, 24 notes (Do3 à Mi6), les autres sont transposées.

   Plan du fichier :
     1. Constantes et données (touches, mélodies, leçons)
     2. Interface injectée dans le site
     3. Audio (échantillons, lecture, relâchement, pédale de sustain, écho)
     4. État du jeu et règles (libre, apprendre, rythme)
     5. Dessin du canvas
     6. Boucle et commandes (clavier, souris, tactile avec glissando)
     7. Métronome, accordage, écho
     8. Moteur des leçons
     9. API publique (window.Piano) */
(function () {
  if (window.Piano) return;
  var main = document.querySelector("main"), aside = document.querySelector("aside");
  if (!main || !aside) return;

  /* ================= 1. Constantes et données ================= */

  var W = 900, H = 460;       // taille du canvas
  var KEY_Y = 330;            // haut du clavier dessiné
  var HIT_Y = 318;            // ligne dorée où les notes doivent être jouées
  var SPEED = 190;            // vitesse de chute des notes (pixels par seconde)
  var LEAD = 2.8;             // délai avant la première note (secondes)
  var HIT_WINDOW = .22;       // tolérance en mode Rythme (secondes)
  var BASE = "sounds/piano/"; // dossier des échantillons

  /* Relâchement : une note jouée ne s'arrête jamais avant MIN_HOLD, puis elle s'éteint
     progressivement (constante de temps RELEASE_TC, environ 1 s pour disparaître). */
  var MIN_HOLD = .3;
  var RELEASE_TC = .12;

  /* Disposition : touches blanches sur la rangée du milieu, dièses sur celle du haut
     (positions physiques du clavier : [code, note, nom français]). */
  var WHITE_KEYS = [
    ["KeyA", "C4", "Do"], ["KeyS", "D4", "Ré"], ["KeyD", "E4", "Mi"], ["KeyF", "F4", "Fa"], ["KeyG", "G4", "Sol"],
    ["KeyH", "A4", "La"], ["KeyJ", "B4", "Si"], ["KeyK", "C5", "Do"], ["KeyL", "D5", "Ré"], ["Semicolon", "E5", "Mi"]
  ];
  /* [code, note, position entre les blanches, nom français] */
  var BLACK_KEYS = [
    ["KeyW", "Db4", 1, "Do#"], ["KeyE", "Eb4", 2, "Ré#"], ["KeyT", "Gb4", 4, "Fa#"], ["KeyY", "Ab4", 5, "Sol#"],
    ["KeyU", "Bb4", 6, "La#"], ["KeyO", "Db5", 8, "Do#"], ["KeyP", "Eb5", 9, "Ré#"]
  ];
  /* doigt conseillé, qui donne la couleur de la note */
  var FINGER = {
    KeyA: 1, KeyS: 2, KeyD: 3, KeyF: 4, KeyG: 4, KeyH: 5, KeyJ: 5, KeyK: 6, KeyL: 7, Semicolon: 8,
    KeyW: 2, KeyE: 3, KeyT: 4, KeyY: 5, KeyU: 5, KeyO: 7, KeyP: 8
  };
  /* étiquettes par défaut (disposition AZERTY) */
  var DEFAULT_LABEL = {
    KeyA: "q", KeyS: "s", KeyD: "d", KeyF: "f", KeyG: "g", KeyH: "h", KeyJ: "j", KeyK: "k", KeyL: "l", Semicolon: "m",
    KeyW: "z", KeyE: "e", KeyT: "t", KeyY: "y", KeyU: "u", KeyO: "o", KeyP: "p"
  };
  var PASTEL = {
    1: "#F7C6D0", 2: "#F9D5B0", 3: "#F8EAA8", 4: "#CBE8B8",
    5: "#BFE0F0", 6: "#D8CCF0", 7: "#B8E8DC", 8: "#F4BDB5"
  };
  var PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  /* "Eb4" -> numéro MIDI (60 = Do4) */
  function noteToMidi(note) {
    var base = note.slice(0, -1);
    var accidental = base.length > 1 ? (base[1] === "b" ? -1 : 1) : 0;
    return 12 * (+note.slice(-1) + 1) + PITCH_CLASS[base[0]] + accidental;
  }

  var keys = [], keyByCode = {}, keyByNote = {};
  WHITE_KEYS.forEach(function (w, i) {
    keys.push({
      code: w[0], note: w[1], fr: w[2], white: true, midi: noteToMidi(w[1]),
      x: 50 + i * 80, w: 80, cx: 90 + i * 80, f: FINGER[w[0]], label: DEFAULT_LABEL[w[0]]
    });
  });
  BLACK_KEYS.forEach(function (b) {
    var cx = 50 + b[2] * 80;
    keys.push({
      code: b[0], note: b[1], fr: b[3], white: false, midi: noteToMidi(b[1]),
      x: cx - 23, w: 46, cx: cx, f: FINGER[b[0]], label: DEFAULT_LABEL[b[0]]
    });
  });
  keys.forEach(function (k) { keyByCode[k.code] = k; keyByNote[k.note] = k; });

  /* Mélodies du domaine public. Notation : Note[:temps], R = silence. [titre, tempo, notes] */
  var SONGS = [
    ["Ode à la joie", 100, "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2"],
    ["Au clair de la lune", 96, "C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4 C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4"],
    ["Ah ! vous dirai-je, maman", 100, "C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2"],
    ["Frère Jacques", 100, "G4 A4 B4 G4 G4 A4 B4 G4 B4 C5 D5:2 B4 C5 D5:2 D5:.5 E5:.5 D5:.5 C5:.5 B4 G4 D5:.5 E5:.5 D5:.5 C5:.5 B4 G4 G4 D4 G4:2 G4 D4 G4:2"],
    ["Jingle Bells", 120, "E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2"],
    ["Für Élise (début)", 96, "E5 D#5 E5 D#5 E5 B4 D5 C5 A4:2 R C4 E4 A4 B4:2 R E4 G#4 B4 C5:2 R E4 E5 D#5 E5 D#5 E5 B4 D5 C5 A4:2 R C4 E4 A4 B4:2 R E4 C5 B4 A4:3"]
  ];
  var SHARP = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };

  /* "E4 D#5:2 R" -> { notes: [{n, t, b}], len } (t et b en temps) */
  function parseMelody(s) {
    var t = 0, out = [];
    s.split(" ").forEach(function (token) {
      var parts = token.split(":"), beats = parts[1] ? parseFloat(parts[1]) : 1;
      if (parts[0] !== "R") {
        var head = parts[0].slice(0, 2);
        var name = SHARP[head] ? SHARP[head] + parts[0].slice(2) : parts[0];
        if (keyByNote[name]) out.push({ n: name, t: t, b: beats });
      }
      t += beats;
    });
    return { notes: out, len: t };
  }

  /* Leçons d'accords : suites générales, aucun morceau sous droits d'auteur */
  var CHORDS = { C: ["C4", "E4", "G4"], G: ["G4", "B4", "D5"], Am: ["A4", "C5", "E5"], F: ["F4", "A4", "C5"] };
  var CHORD_NAMES = { C: "Do majeur", G: "Sol majeur", Am: "La mineur", F: "Fa majeur" };
  /* une note à la fois */
  function lessonSingle(s) {
    return s.split(" ").map(function (n) { return { t: keyByNote[n].fr, n: [n] }; });
  }
  /* un accord = plusieurs touches pressées ensemble */
  function lessonChords(s) {
    return s.split(" ").map(function (x) { return { t: CHORD_NAMES[x], n: CHORDS[x] }; });
  }
  /* les notes de chaque accord, une par une */
  function lessonArpeggio(s) {
    var out = [];
    s.split(" ").forEach(function (x) {
      CHORDS[x].forEach(function (n) {
        out.push({ t: CHORD_NAMES[x] + " · " + keyByNote[n].fr, n: [n] });
      });
    });
    return out;
  }
  var LESSONS = [
    { name: "1 · Do majeur, une main", desc: "Appuyez sur la touche qui s'allume : Do Ré Mi Fa Sol, puis on redescend.", steps: lessonSingle("C4 D4 E4 F4 G4 F4 E4 D4 C4") },
    { name: "2 · L'accord de Do", desc: "Un accord = 3 touches pressées presque en même temps (Do, Mi, Sol). Relâchez entre chaque accord.", steps: lessonChords("C C C C C C") },
    { name: "3 · Les 4 accords pop", desc: "Do, Sol, La mineur, Fa : les 4 accords de beaucoup de chansons pop. Deux fois chacun.", steps: lessonChords("C C G G Am Am F F") },
    { name: "4 · La suite Do – Sol – La mineur – Fa", desc: "La suite d'accords la plus courante en pop, jouée 3 fois sans pression de temps.", steps: lessonChords("C G Am F C G Am F C G Am F") },
    { name: "5 · La suite en arpèges", desc: "Les mêmes accords, mais les notes une par une, de la plus grave à la plus aiguë (2 tours).", steps: lessonArpeggio("C G Am F C G Am F") },
    { name: "6 · La suite avec le tic-tac", desc: "Le tic-tac démarre : un temps de mesure pour se préparer, puis un accord tous les 2 temps. Tempo réglable avec le métronome.", timed: true, steps: lessonChords("C G Am F C G Am F") }
  ];
  /* état de la leçon en cours : étape, touches pressées récemment, durée d'un temps, temps de préparation */
  var lessonState = { i: 0, got: [], spb: .6, bars: 4 };

  /* ================= 2. Interface injectée dans le site ================= */

  /* petite icône de piano en pixels (10 x 10) */
  var ICON_ROWS = "oooooooooo/owwdwwdwwo/owwdwwdwwo/owwdwwdwwo/owwowwowwo/owwowwowwo/owwowwowwo/oooooooooo/........../..........";
  function pixelIcon(extraClass) {
    var rows = ICON_ROWS.split("/");
    var palette = { o: "var(--po)", w: "#FFFFFF", d: "#5A4A6A" };
    var svg = '<svg class="px ' + (extraClass || "") + '" viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">';
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < 10) {
        var ch = row[x], run = 1;
        while (x + run < 10 && row[x + run] === ch) run++;
        if (ch !== "." && palette[ch]) svg += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + palette[ch] + '"/>';
        x += run;
      }
    });
    return svg + "</svg>";
  }

  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "#v-piano h1{margin-bottom:8px}",
    ".pcard{padding:14px}",
    /* panneau de commandes : un piano de scène, graphite, écran ambre, boutons ronds */
    ".ppanel{display:grid;gap:12px;margin-bottom:12px;padding:14px;border-radius:20px;border:3px solid #0f0c14;color:#e9e3f2;background:linear-gradient(180deg,#2d2738 0,#1a1622 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.1),inset 0 -4px 0 rgba(0,0,0,.35),0 6px 0 var(--line2)}",
    ".ptop{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}",
    ".plcd{display:grid;gap:5px;min-width:0;padding:12px 14px;border-radius:10px;border:3px solid #0a0703;background:#1d1409;color:#ffb347;font:400 .72rem/1.35 var(--fs),monospace;text-shadow:0 0 7px rgba(255,179,71,.55);box-shadow:inset 0 3px 10px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.12)}",
    ".plcd div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".plcd .l1{font-size:.9rem}",
    ".plcd .l3{opacity:.6}",
    ".pgrid{display:flex;flex-wrap:wrap;gap:10px}",
    ".pgrp{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:rgba(0,0,0,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 0 0 2px rgba(0,0,0,.25)}",
    ".pbtns{display:flex;flex-wrap:wrap;align-items:center;gap:6px}",
    /* boutons de piano : touche carrée avec voyant, qui s'enfonce quand on appuie */
    ".pbtn{position:relative;padding:8px 12px 8px 27px;border:2px solid #0f0c14;border-radius:8px;background:linear-gradient(180deg,#4b4359,#2f2a3a);color:#e9e3f2;font:600 .8rem var(--fb);cursor:pointer;box-shadow:0 3px 0 #0f0c14,inset 0 1px 0 rgba(255,255,255,.2);transition:transform .05s,box-shadow .05s}",
    ".pbtn:active{transform:translateY(2px);box-shadow:0 1px 0 #0f0c14,inset 0 1px 0 rgba(255,255,255,.2)}",
    ".pbtn .led{position:absolute;left:10px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:#3a2a12;box-shadow:inset 0 1px 2px rgba(0,0,0,.7)}",
    ".pbtn[aria-pressed=true] .led{background:#ffb347;box-shadow:0 0 8px 2px rgba(255,179,71,.7)}",
    ".pbtn.round{width:34px;height:34px;padding:0;border-radius:50%;font-size:1.1rem;line-height:1}",
    ".pbtn.go{padding-left:14px;background:linear-gradient(180deg,#5fcb7d,#2b8a48);color:#06210f}",
    ".pbtn:disabled{opacity:.4;cursor:default}",
    ".pbtn:focus-visible,.knob:focus-visible,.psel:focus-visible{outline:3px solid #fff;outline-offset:2px}",
    ".psel{max-width:220px;padding:7px 10px;border:2px solid #0f0c14;border-radius:8px;background:#16121c;color:#ffb347;font:600 .85rem var(--fb)}",
    ".poct{min-width:92px;text-align:center;color:#ffb347;font:400 .7rem var(--fs)}",
    /* boutons rotatifs */
    ".pk{display:grid;justify-items:center;gap:1px;width:76px}",
    ".pk .knob{width:64px;height:64px;border-radius:50%;cursor:ns-resize;touch-action:none}",
    ".pk.big{width:96px}",
    ".pk.big .knob{width:84px;height:84px}",
    ".knob svg{display:block;width:100%;height:100%}",
    ".pklab{color:#b7aeca;font:600 .72rem var(--fb)}",
    ".pkval{min-height:1em;color:#ffb347;font:400 .62rem var(--fs)}",
    /* métronome */
    ".pmetro{flex:1 1 380px}",
    ".mowrap{display:grid;flex:none;justify-items:center;gap:6px}",
    ".mo{width:104px;height:148px;cursor:pointer}",
    ".mo svg{display:block;width:100%;height:100%;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35))}",
    ".pmctl{display:flex;flex:1;flex-wrap:wrap;align-items:center;gap:8px}",
    ".pdots{display:inline-flex;gap:6px}",
    ".pdots i{display:inline-block;width:12px;height:12px;border-radius:50%;background:#3a2a12;box-shadow:inset 0 1px 2px rgba(0,0,0,.7)}",
    ".pdots i.on{background:#ffb347;box-shadow:0 0 8px 2px rgba(255,179,71,.7)}",
    ".pdots i.ac.on{background:#ff6a3d;box-shadow:0 0 8px 2px rgba(255,106,61,.7)}",
    /* compteurs et scène */
    ".pstats{display:flex;gap:22px;flex-wrap:wrap;margin:4px 0 8px}",
    ".pstats strong{font:400 1rem var(--fs);display:block;line-height:1.4}",
    ".pstats span{font-size:.75rem;color:var(--mute)}",
    ".pstage{position:relative;display:flex;justify-content:center;border-radius:16px;overflow:hidden;border:3px solid #0f0c14;background:#0d0a12}",
    "#pn_cv{display:block;max-width:100%;max-height:min(58vh,520px);width:auto;height:auto;touch-action:none;cursor:pointer}",
    ".pstage .res{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:5;background:var(--card);text-align:center;min-width:min(330px,90%);margin:0;box-shadow:0 8px 0 var(--line2)}",
    ".pn_load{position:absolute;left:0;right:0;top:8px;text-align:center;font-size:.8rem;color:#fff;opacity:.9;pointer-events:none}",
    "#pn_help{margin:8px 0 0}",
    /* page unique, sans défilement : le panneau est compact et le clavier prend toute la place restante */
    "body.fit #v-piano .pcard{flex:1;min-height:0;display:flex;flex-direction:column;overflow:auto;margin-bottom:0}",
    "body.fit .ppanel{flex:none}",
    "body.fit .pstage{flex:1 1 auto;min-height:230px}",
    ".ptoast{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:92%;padding:8px 14px;border-radius:12px;background:rgba(16,14,24,.95);color:#ffe9b8;border:2px solid #ffb347;font:600 .85rem Poppins,Arial,sans-serif;z-index:6;text-align:center}.ptoast.err{border-color:#f0948c;color:#ffd5d0}.ptoast[hidden]{display:none}",
    "body.fit #pn_cv{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:none;max-height:none}",
    "body.fit #pn_help{display:none}",
    "body.fit .ppanel{display:flex;flex-wrap:wrap;align-items:stretch}",
    "body.fit .pgrid{display:contents}",
    "body.fit .ptop{flex:1 1 260px;min-width:0}",
    "body.fit .pstats{margin:0 0 0 auto;gap:16px;align-self:center;padding:6px 12px;border-radius:12px;background:rgba(0,0,0,.22)}",
    "body.fit .pstats strong{color:#ffb347}body.fit .pstats span{color:#b7aeca}",
    "@media(max-height:900px){body.fit #v-piano h1{display:none}body.fit .pcard{padding:8px}body.fit .ppanel{gap:8px;padding:8px 10px;margin-bottom:8px}body.fit .ptop{gap:10px}body.fit .plcd{padding:7px 10px;gap:3px}body.fit .plcd .l3{display:none}body.fit .pgrid{gap:8px}body.fit .pgrp{padding:6px 8px;gap:6px}body.fit .pbtn{padding:6px 10px 6px 25px}body.fit .pbtn.round{padding:0}body.fit .pk{width:60px}body.fit .pk .knob{width:48px;height:48px}body.fit .pk.big{width:72px}body.fit .pk.big .knob{width:60px;height:60px}body.fit .mo{width:60px;height:86px}body.fit .pmetro{flex:1 1 300px}body.fit .pstats strong{font-size:.9rem;line-height:1.2}body.fit .pstats span{font-size:.68rem}}",
    "@media(max-height:760px){body.fit .pk{width:52px}body.fit .pk .knob{width:40px;height:40px}body.fit .pk.big{width:60px}body.fit .pk.big .knob{width:50px;height:50px}body.fit .mo{width:50px;height:72px}body.fit .pkval{display:none}body.fit .plcd .l2{display:none}body.fit .pstage{min-height:190px}}",
    "@media(max-width:760px){body.fit .ppanel{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;-webkit-overflow-scrolling:touch}body.fit .ppanel>*{flex:none}body.fit .ptop{flex:0 0 270px}body.fit .pgrp{flex-wrap:nowrap}body.fit .pstats{margin-left:0}body.fit .pstage{min-height:150px}}",
    "@media(max-width:560px){.ptop{grid-template-columns:1fr}.pk.big{justify-self:end}.plcd{font-size:.66rem}}"
  ].join("");
  document.head.appendChild(styleEl);

  /* bouton du menu */
  var navBtn = document.createElement("button");
  navBtn.className = "nb";
  navBtn.dataset.v = "piano";
  navBtn.innerHTML = pixelIcon() + "Piano";
  var gamesBtn = aside.querySelector('.nb[data-v="games"]');
  if (gamesBtn && gamesBtn.after) gamesBtn.after(navBtn);
  else aside.insertBefore(navBtn, aside.querySelector(".sp"));

  /* page du piano */
  var sec = document.createElement("section");
  sec.className = "view";
  sec.id = "v-piano";
  sec.innerHTML = [
    '<h1>Piano</h1>',
    '<div class="card pcard">',
      '<div class="ppanel">',
        '<div class="ptop">',
          '<div class="plcd" role="status" aria-label="Écran du piano"><div class="l1" id="lcd1"></div><div class="l2" id="lcd2"></div><div class="l3" id="lcd3"></div></div>',
          '<div class="pk big" id="kn_vol"></div>',
        '</div>',
        '<div class="pgrid">',
          '<div class="pgrp"><div class="pbtns" id="pn_mode">',
            '<button class="pbtn" data-mode="free" aria-pressed="true"><i class="led"></i>Libre</button>',
            '<button class="pbtn" data-mode="learn" aria-pressed="false"><i class="led"></i>Apprendre</button>',
            '<button class="pbtn" data-mode="rhythm" aria-pressed="false"><i class="led"></i>Rythme</button>',
            '<button class="pbtn" data-mode="lesson" aria-pressed="false"><i class="led"></i>Leçons</button>',
          '</div></div>',
          '<div class="pgrp" id="pg_play">',
            '<select class="psel" id="pn_song" aria-label="Mélodie"></select>',
            '<button class="pbtn" id="pn_imp" type="button" style="display:none" aria-label="Importer un fichier MIDI"><i class="led"></i>Importer</button>',
            '<button class="pbtn" id="pn_del" type="button" style="display:none" aria-label="Supprimer ce morceau importé"><i class="led"></i>Supprimer</button>',
            '<input type="file" id="pn_file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden>',
            '<select class="psel" id="pn_les" aria-label="Leçon" style="display:none"></select>',
            '<div class="pbtns" id="pn_spd">',
              '<button class="pbtn" data-s=".7" aria-pressed="false"><i class="led"></i>Lent</button>',
              '<button class="pbtn" data-s="1" aria-pressed="true"><i class="led"></i>Normal</button>',
              '<button class="pbtn" data-s="1.3" aria-pressed="false"><i class="led"></i>Rapide</button>',
            '</div>',
            '<button class="pbtn go" id="pn_go">▶ Jouer</button>',
          '</div>',
          '<div class="pgrp">',
            '<div class="pbtns" id="pn_oct">',
              '<button class="pbtn round" data-o="-1" aria-label="Octave plus grave">−</button>',
              '<span class="poct" id="pn_octl">Octaves 4–5</span>',
              '<button class="pbtn round" data-o="1" aria-label="Octave plus aiguë">+</button>',
            '</div>',
            '<button class="pbtn" id="pn_ped" aria-pressed="false" title="Pédale de sustain (barre Espace)"><i class="led"></i>Pédale</button>',
          '</div>',
          '<div class="pgrp">',
            '<button class="pbtn" id="pe_on" aria-pressed="false" title="Ajoute des répétitions du son, comme dans une grande salle"><i class="led"></i>Écho</button>',
            '<div class="pk" id="kn_ed"></div><div class="pk" id="kn_ef"></div>',
          '</div>',
          '<div class="pgrp">',
            '<div class="pk" id="kn_tu"></div>',
            '<button class="pbtn" id="pt_la" title="Joue le La pour accorder">♪ La</button>',
            '<button class="pbtn" id="pt_rs" title="Remettre le La à 440 Hz">440</button>',
          '</div>',
          '<div class="pgrp pmetro">',
            '<div class="mowrap"><div class="mo" id="mo" title="Cliquez pour démarrer ou arrêter le métronome"><svg viewBox="0 0 120 170" role="img" aria-label="Métronome"><path d="M24 164 L96 164 L77 22 L43 22 Z" fill="#7a4a2d" stroke="#25150a" stroke-width="3" stroke-linejoin="round"/><path d="M33 152 L87 152 L73 36 L47 36 Z" fill="#a46a41" opacity=".6"/><g stroke="#2a190d" stroke-width="1.5" opacity=".55"><line x1="52" y1="52" x2="68" y2="52"/><line x1="50" y1="72" x2="70" y2="72"/><line x1="48" y1="92" x2="72" y2="92"/><line x1="46" y1="112" x2="74" y2="112"/><line x1="44" y1="132" x2="76" y2="132"/></g><rect x="18" y="160" width="84" height="9" rx="3" fill="#3a2314" stroke="#25150a" stroke-width="2"/><g id="mo_arm" transform="rotate(0 60 140)"><rect x="58.5" y="2" width="3" height="140" rx="1.5" fill="#dcd6e8" stroke="#6d6580" stroke-width="1"/><rect id="mo_w" x="52" y="14" width="16" height="14" rx="3" fill="#e0b04a" stroke="#6b4a10" stroke-width="1.5"/></g><circle cx="60" cy="140" r="7" fill="#e0b04a" stroke="#6b4a10" stroke-width="2"/></svg></div><span class="pdots" id="pm_dots"></span></div>',
            '<div class="pmctl">',
              '<div class="pk" id="kn_bpm"></div><div class="pk" id="kn_mv"></div>',
              '<div class="pbtns">',
                '<button class="pbtn" id="pm_go" aria-pressed="false"><i class="led"></i>Tic-tac</button>',
                '<button class="pbtn round" id="pm_dn" aria-label="Plus lent">−</button>',
                '<button class="pbtn round" id="pm_up" aria-label="Plus rapide">+</button>',
              '</div>',
              '<select class="psel" id="pm_beats" aria-label="Mesure"><option value="2">2 temps</option><option value="3">3 temps</option><option value="4" selected>4 temps</option><option value="6">6 temps</option></select>',
              '<select class="psel" id="pm_snd" aria-label="Son du tic-tac"><option value="wood">Son : Bois</option><option value="click">Son : Clic</option><option value="bell">Son : Cloche</option></select>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="pstats">',
        '<div><strong id="pn_score">0</strong><span>score</span></div>',
        '<div><strong id="pn_combo">0</strong><span>série</span></div>',
        '<div><strong id="pn_acc">100%</strong><span>précision</span></div>',
        '<div><strong id="pn_prog">0%</strong><span>avancement</span></div>',
      '</div>',
      '</div>',
      '<div class="pstage">',
        '<canvas id="pn_cv" width="' + W + '" height="' + H + '" aria-label="Piano"></canvas>',
        '<div class="pn_load" id="pn_load"></div>',
        '<div class="res hide" id="pn_res"></div>',
        '<div class="ptoast" id="pn_toast" role="status" aria-live="polite" hidden></div>',
      '</div>',
      '<p class="note" id="pn_help"></p>',
    '</div>'
  ].join("");
  main.appendChild(sec);

  var $ = function (id) { return document.getElementById(id); };
  var cv = $("pn_cv"), ctx = cv.getContext("2d");

  /* ---------- Boutons rotatifs ----------
     Glisser vers le haut ou la droite augmente, vers le bas ou la gauche diminue (Maj = réglage fin).
     Molette, flèches (Page haut/bas : grands pas, Début/Fin : min/max) et double-clic (valeur d'origine) marchent aussi. */
  var KNOB_FROM = -135, KNOB_SPAN = 270;   // le bouton tourne de -135° à +135°
  function polar(r, deg) {
    var a = deg * Math.PI / 180;
    return (50 + r * Math.sin(a)).toFixed(2) + " " + (50 - r * Math.cos(a)).toFixed(2);
  }
  function knobSvg() {
    var ticks = "", i;
    for (i = 0; i <= 10; i++) {
      var d = KNOB_FROM + KNOB_SPAN * i / 10, a = polar(41, d).split(" "), b = polar(47, d).split(" ");
      ticks += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#7b7190" stroke-width="' + (i % 5 ? 1.4 : 2.4) + '" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + ticks +
      '<path d="M ' + polar(37, KNOB_FROM) + ' A 37 37 0 1 1 ' + polar(37, KNOB_FROM + KNOB_SPAN) + '" fill="none" stroke="#0e0b13" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="karc" d="" fill="none" stroke="#ffb347" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="50" cy="50" r="29" fill="#16121d" stroke="#08060b" stroke-width="2"/>' +
      '<g class="kcap"><circle cx="50" cy="50" r="25" fill="#3b3548"/>' +
      '<circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>' +
      '<line x1="50" y1="28" x2="50" y2="39" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g>' +
      '<ellipse cx="43" cy="40" rx="12" ry="7" fill="rgba(255,255,255,.1)"/></svg>';
  }
  /* o : { label, min, max, step, def, fmt(v) -> texte, onChange(v) } ; renvoie { el, get, set (sans onChange), change (avec onChange) } */
  function makeKnob(host, o) {
    var min = o.min, max = o.max, step = o.step || 1, val = o.def, fmt = o.fmt || String;
    var coarse = Math.max(1, Math.round((max - min) / step / 50));   // pas de la molette
    host.innerHTML = '<div class="knob" tabindex="0" role="slider" aria-label="' + o.label + '" aria-valuemin="' + min + '" aria-valuemax="' + max + '">' + knobSvg() +
      '</div><span class="pklab">' + o.label + '</span><span class="pkval"></span>';
    var el = host.firstChild, cap = el.querySelector(".kcap"), arc = el.querySelector(".karc"), out = host.querySelector(".pkval");
    function snap(v) {
      var n = Math.round((Math.max(min, Math.min(max, +v)) - min) / step) * step + min;
      return Math.max(min, Math.min(max, Math.round(n * 1e6) / 1e6));
    }
    function render() {
      var frac = (val - min) / (max - min), deg = KNOB_FROM + KNOB_SPAN * frac;
      cap.setAttribute("transform", "rotate(" + deg.toFixed(1) + " 50 50)");
      arc.setAttribute("d", frac > .001 ? "M " + polar(37, KNOB_FROM) + " A 37 37 0 " + (KNOB_SPAN * frac > 180 ? 1 : 0) + " 1 " + polar(37, deg) : "");
      el.setAttribute("aria-valuenow", val);
      el.setAttribute("aria-valuetext", fmt(val));
      out.textContent = fmt(val);
    }
    function set(v, silent) {
      v = snap(v);
      if (v === val) return;
      val = v;
      render();
      if (!silent && o.onChange) o.onChange(val);
    }
    var drag = null;
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      el.focus();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, v: val };
    });
    el.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = (drag.y - e.clientY) + (e.clientX - drag.x);
      set(drag.v + d / (e.shiftKey ? 600 : 150) * (max - min));
    });
    function stop(e) { if (drag && e.pointerId === drag.id) drag = null; }
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    el.addEventListener("wheel", function (e) { e.preventDefault(); set(val + (e.deltaY < 0 ? 1 : -1) * step * coarse); }, { passive: false });
    el.addEventListener("dblclick", function () { set(o.def); });
    el.addEventListener("keydown", function (e) {
      var k = e.key, v = null;
      if (k === "ArrowUp" || k === "ArrowRight") v = val + step;
      else if (k === "ArrowDown" || k === "ArrowLeft") v = val - step;
      else if (k === "PageUp") v = val + step * 10;
      else if (k === "PageDown") v = val - step * 10;
      else if (k === "Home") v = min;
      else if (k === "End") v = max;
      if (v === null) return;
      e.preventDefault();
      e.stopPropagation();   // les flèches règlent le bouton, elles ne changent pas l'octave
      set(v);
    });
    render();
    return { el: el, get: function () { return val; }, set: function (v) { set(v, true); }, change: function (v) { set(v); } };
  }

  var knobs = {};
  function pct(v) { return v + " %"; }
  knobs.volume = makeKnob($("kn_vol"), { label: "Volume", min: 0, max: 100, step: 1, def: 80, fmt: pct,
    onChange: function (v) { volume = v / 100; if (master) master.gain.value = volume; } });
  knobs.echoTime = makeKnob($("kn_ed"), { label: "Délai", min: 100, max: 800, step: 10, def: 300, fmt: function (v) { return v + " ms"; },
    onChange: function (v) { setEcho({ time: v / 1000 }); } });
  knobs.echoFb = makeKnob($("kn_ef"), { label: "Répétitions", min: 0, max: 70, step: 5, def: 40, fmt: pct,
    onChange: function (v) { setEcho({ fb: v / 100 }); } });
  knobs.tune = makeKnob($("kn_tu"), { label: "Accord", min: 430, max: 450, step: 1, def: 440, fmt: function (v) { return v + " Hz"; },
    onChange: function (v) { setTune(v); } });
  knobs.bpm = makeKnob($("kn_bpm"), { label: "Tempo", min: 40, max: 220, step: 1, def: 100, fmt: function (v) { return v + " BPM"; },
    onChange: function (v) { setBpm(v); } });
  knobs.metroVol = makeKnob($("kn_mv"), { label: "Tic-tac", min: 0, max: 100, step: 1, def: 60, fmt: pct,
    onChange: function (v) { metro.vol = v / 100; if (metroGain) metroGain.gain.value = metro.vol; saveMetro(); } });

  /* carte dans le catalogue des jeux */
  var gamesList = $("gl");
  function addCatalogCard() {
    if (!gamesList || gamesList.querySelector("[data-piano]")) return;
    var activeFilter = document.querySelector("#gf .chip[aria-pressed=true]");
    var filterName = activeFilter ? activeFilter.textContent : "Tous";
    if (filterName !== "Tous" && filterName !== "Solo" && filterName !== "Débutant") return;
    var card = document.createElement("button");
    card.className = "gc";
    card.dataset.piano = "1";
    card.innerHTML = pixelIcon("big") + '<b>Piano</b><small>Jouez de vraies notes de piano avec votre clavier : mélodies à suivre ou mode libre.</small><div class="tags"><span class="tag">Solo</span><span class="tag">Musique</span><span class="tag" style="background:var(--acc);color:var(--onacc)">Jouable</span></div>';
    card.onclick = function () { navBtn.click(); };
    gamesList.appendChild(card);
  }
  if (gamesList) {
    new MutationObserver(addCatalogCard).observe(gamesList, { childList: true });
    addCatalogCard();
  }

  /* ================= 3. Audio ================= */

  var audioCtx = null, master = null;
  var buffers = {};            // échantillons décodés, par nom de note
  var loadedCount = 0;         // échantillons traités (réussis ou non)
  var loading = false;         // chargement lancé
  var failed = false;          // au moins un échantillon manque : sons de secours
  var noAudio = false;         // le navigateur n'a pas du tout de Web Audio
  var volume = .8;
  var TUNE = 440;              // fréquence du La4 (réglable de 430 à 450 Hz)
  var voices = {};             // note en cours par touche : { s: source, g: gain, t: début }
  var sustainOn = false;       // pédale de sustain enfoncée
  var heldVoices = [];         // notes relâchées mais maintenues par la pédale
  var echo = { on: false, time: .3, fb: .4 };   // écho : délai (secondes) et répétitions (0 à .7)
  var echoSend = null, echoWet = null, echoDelayL = null, echoDelayR = null, echoFbL = null, echoFbR = null;
  var outNode = null;   // limiteur de sortie : tout passe par lui pour que les accords + l'écho ne saturent pas

  var SAMPLE_NAMES = "C3 Eb3 Gb3 A3 C4 Db4 D4 Eb4 E4 F4 Gb4 G4 Ab4 A4 Bb4 B4 C5 Db5 D5 Eb5 E5 A5 C6 Eb6".split(" ");

  /* limiteur : compresseur réglé pour ne rien laisser dépasser 0 dB (sans lui, un accord + l'écho peuvent craquer) */
  function makeLimiter() {
    try {
      var lim = audioCtx.createDynamicsCompressor();
      lim.threshold.value = -4;
      lim.knee.value = 0;
      lim.ratio.value = 20;
      lim.attack.value = .002;
      lim.release.value = .12;
      lim.connect(audioCtx.destination);
      return lim;
    } catch (e) {
      return audioCtx.destination;
    }
  }

  /* Crée le contexte audio au premier appel. Renvoie null si le navigateur n'a pas Web Audio. */
  function getAudio() {
    if (!audioCtx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        audioCtx = new Ctor();
        master = audioCtx.createGain();
        master.gain.value = volume;
        outNode = makeLimiter();
        master.connect(outNode);
        buildEcho();
      } catch (e) {
        audioCtx = null;
        master = null;
        return null;
      }
    }
    if (audioCtx.state === "suspended" && audioCtx.resume) audioCtx.resume();
    return audioCtx;
  }

  /* Écho « ping-pong » : le son passe par deux lignes à retard qui se renvoient l'une à l'autre.
     La 1re répétition sort à gauche, la 2e à droite, la 3e à gauche… Chaque répétition est plus faible
     (réglage « Répétitions », 70 % au maximum pour rester stable) et plus sourde (filtre passe-bas) ;
     un filtre passe-haut dans la boucle empêche les graves de s'empiler.
     Désactiver l'écho coupe seulement l'envoi : les répétitions déjà parties s'éteignent naturellement.
     Le tic-tac du métronome ne passe pas par l'écho. Si le navigateur ne sait pas le faire,
     le piano marche quand même, sans écho. */
  function buildEcho() {
    try {
      var c = audioCtx;
      var filt = function (type, f) { var n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; return n; };
      echoSend = c.createGain();
      echoWet = c.createGain();
      echoDelayL = c.createDelay(2);
      echoDelayR = c.createDelay(2);
      echoFbL = c.createGain();
      echoFbR = c.createGain();
      var hpL = filt("highpass", 160), lpL = filt("lowpass", 3200);
      var hpR = filt("highpass", 160), lpR = filt("lowpass", 3200);
      master.connect(echoSend);
      echoSend.connect(echoDelayL);
      echoDelayL.connect(hpL); hpL.connect(lpL); lpL.connect(echoFbL); echoFbL.connect(echoDelayR);
      echoDelayR.connect(hpR); hpR.connect(lpR); lpR.connect(echoFbR); echoFbR.connect(echoDelayL);
      var toWet = function (src, pan) {
        if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan; src.connect(p); p.connect(echoWet); }
        else src.connect(echoWet);
      };
      toWet(lpL, -.7);
      toWet(lpR, .7);
      echoWet.connect(outNode);
      applyEcho(true);
    } catch (e) {
      echoSend = echoWet = echoDelayL = echoDelayR = echoFbL = echoFbR = null;
    }
  }

  /* applique les réglages de l'écho. Le délai change doucement (sinon la hauteur des répétitions se déforme) */
  function applyEcho(instant) {
    if (!echoSend) return;
    var t = audioCtx.currentTime, tc = instant ? .001 : .2;
    echoDelayL.delayTime.setTargetAtTime(echo.time, t, tc);
    echoDelayR.delayTime.setTargetAtTime(echo.time, t, tc);
    echoFbL.gain.setTargetAtTime(echo.fb, t, .05);
    echoFbR.gain.setTargetAtTime(echo.fb, t, .05);
    echoWet.gain.setTargetAtTime(.5, t, .05);
    echoSend.gain.setTargetAtTime(echo.on ? 1 : 0, t, .02);
  }

  function decode(arrayBuffer) {
    return new Promise(function (ok, ko) {
      var p = audioCtx.decodeAudioData(arrayBuffer, ok, ko);
      if (p && p.then) p.then(ok, ko);
    });
  }

  function loadSamples() {
    if (loading) return;
    loading = true;
    if (!getAudio()) {
      /* pas de Web Audio : rien à charger, on le dit au lieu de planter */
      noAudio = true;
      failed = true;
      loadedCount = SAMPLE_NAMES.length;
      refreshUI();
      return;
    }
    refreshUI();
    SAMPLE_NAMES.forEach(function (n) {
      fetch(BASE + n + ".mp3")
        .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(decode)
        .then(function (d) { buffers[n] = d; loadedCount++; refreshUI(); })
        .catch(function () { failed = true; loadedCount++; refreshUI(); });
    });
  }

  /* décalage d'octave : seulement en mode Libre */
  function octShift() { return game.mode === "free" ? game.oct : 0; }

  /* échantillon le plus proche d'une note MIDI + vitesse de lecture pour la transposer */
  function pickSample(m) {
    var best = null, bestDist = 99;
    SAMPLE_NAMES.forEach(function (n) {
      if (!buffers[n]) return;
      var d = Math.abs(noteToMidi(n) - m);
      if (d < bestDist) { bestDist = d; best = n; }
    });
    return best ? { n: best, rate: Math.pow(2, (m - noteToMidi(best)) / 12) } : null;
  }

  /* Joue une touche (ou une note MIDI m0). Renvoie la « voix » à relâcher plus tard, ou null sans audio. */
  function play(k, vel, m0) {
    var a = getAudio();
    if (!a) return null;
    var t = a.currentTime, g = a.createGain();
    var m = m0 == null ? k.midi + 12 * octShift() : m0;
    var sample = pickSample(m);
    g.gain.value = vel || 1;
    g.connect(master);
    if (sample) {
      var src = a.createBufferSource();
      src.buffer = buffers[sample.n];
      src.playbackRate.value = sample.rate * TUNE / 440;
      src.connect(g);
      src.start(t);
      return { s: src, g: g, t: t };
    }
    /* son de secours : 4 harmoniques qui s'éteignent */
    var f = TUNE * Math.pow(2, (m - 69) / 12), oscs = [], i;
    for (i = 1; i <= 4; i++) {
      var osc = a.createOscillator(), og = a.createGain();
      osc.frequency.value = f * i;
      og.gain.setValueAtTime(.3 / i, t);
      og.gain.exponentialRampToValueAtTime(.0005, t + 1.8 / i + .3);
      osc.connect(og);
      og.connect(g);
      osc.start(t);
      osc.stop(t + 2.2);
      oscs.push(osc);
    }
    return { s: oscs[0], g: g, t: t };
  }

  /* Relâche une voix : elle sonne au moins MIN_HOLD secondes, puis s'éteint en douceur. */
  function release(v) {
    if (!v || !audioCtx) return;
    try {
      var now = audioCtx.currentTime;
      var start = Math.max(now, v.t + MIN_HOLD);
      var gain = v.g.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.setTargetAtTime(0, start, RELEASE_TC);
      if (v.s && v.s.stop) v.s.stop(start + RELEASE_TC * 8);
    } catch (e) {}
  }

  /* Pédale de sustain : tant qu'elle est enfoncée, les notes relâchées continuent de sonner. */
  function setSustain(on) {
    on = !!on;
    if (on === sustainOn) return;
    sustainOn = on;
    if (!on) {
      heldVoices.forEach(function (v) { release(v); });
      heldVoices = [];
    }
    $("pn_ped").setAttribute("aria-pressed", on);
    refreshLcd();
  }

  /* arrête tout (changement de page, fenêtre qui perd le focus) */
  function releaseAll() {
    setSustain(false);
    Object.keys(voices).forEach(function (code) {
      release(voices[code]);
      delete voices[code];
      delete game.down[code];
    });
  }

  /* ================= 4. État du jeu et règles ================= */

  /* mode : free | learn | rhythm | lesson ; phase : idle | play | done
     notes : notes à jouer ; clock : temps de la partie ; pop / pt : textes et particules à l'écran
     down : touches enfoncées ; oct : décalage d'octave ; les : leçon choisie ; lt : nombre d'étapes */
  var game = {
    mode: "free", song: 0, spd: 1, phase: "idle", clock: 0, notes: [], idx: 0,
    score: 0, combo: 0, maxc: 0, hits: 0, miss: 0, wrong: 0, press: 0,
    pop: [], pt: [], down: {}, done: 0, spdm: 1, oct: 0, les: 0, lt: 0, timed: false
  };

  function songData() {
    var d = SONGS[game.song], p = parseMelody(d[2]), beat = 60 / d[1] / game.spd;
    return {
      name: d[0],
      list: p.notes.map(function (n) {
        return {
          n: n.n, time: LEAD + n.t * beat, b: n.b,
          h: Math.max(26, SPEED * n.b * beat * .86),
          hit: false, miss: false, k: keyByNote[n.n]
        };
      }),
      end: LEAD + p.len * beat
    };
  }

  /* total de notes comptées pour la précision */
  function accuracyTotal() {
    return (game.mode === "rhythm" || game.mode === "lesson")
      ? game.hits + game.miss + game.wrong
      : game.hits + game.wrong;
  }

  function refreshUI() {
    var loadEl = $("pn_load");
    if (!loadEl) return;
    var status = "";
    if (loadedCount < SAMPLE_NAMES.length) status = "Chargement des notes de piano… " + loadedCount + "/" + SAMPLE_NAMES.length;
    else if (noAudio) status = "Audio non pris en charge par ce navigateur";
    else if (failed) status = "Sons de secours (échantillons indisponibles hors ligne)";
    loadEl.textContent = status;
    $("pn_score").textContent = game.score;
    $("pn_combo").textContent = game.combo;
    var total = accuracyTotal();
    $("pn_acc").textContent = (total ? Math.round(game.hits / total * 100) : 100) + "%";
    var count = game.mode === "lesson" ? game.lt : game.notes.length;
    $("pn_prog").textContent = (count ? Math.round(game.done / count * 100) : 0) + "%";
  }

  /* étiquette d'une touche selon la vraie disposition du clavier, si le navigateur la donne */
  var layout = null;
  function keyLabel(code) { return (layout && layout[code]) || DEFAULT_LABEL[code]; }
  try {
    if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
      navigator.keyboard.getLayoutMap().then(function (m) {
        layout = {};
        keys.forEach(function (k) {
          var v = m.get(k.code);
          if (v) { layout[k.code] = v; k.label = v; }
        });
        helpText();
      }).catch(function () {});
    }
  } catch (e) {}

  function helpText() {
    var m = game.mode, intro;
    if (m === "free") intro = "Jouez librement. ";
    else if (m === "learn") intro = "La mélodie attend que vous appuyiez sur la bonne touche. ";
    else if (m === "lesson") intro = "Appuyez en même temps (en moins d'une demi-seconde) sur les touches qui s'allument. ";
    else intro = "Appuyez sur la touche quand la note touche la ligne dorée. ";
    var whites = WHITE_KEYS.map(function (w) { return keyLabel(w[0]).toUpperCase(); }).join(" ");
    var blacks = BLACK_KEYS.map(function (b) { return keyLabel(b[0]).toUpperCase(); }).join(" ");
    $("pn_help").innerHTML = intro +
      "Touches blanches : <b>" + whites + "</b> (Do à Mi). Dièses : <b>" + blacks + "</b>. La souris et le tactile marchent aussi." +
      (m === "lesson" ? "<br><b>" + LESSONS[game.les].name + "</b> : " + LESSONS[game.les].desc : "") +
      (m === "free" ? " Flèches <b>↑ ↓</b> ou boutons − / + : changer d'octave (3 à 6). Glissez la souris ou le doigt sur les touches pour un glissando." : "") +
      " <b>Espace</b> : pédale de sustain (les notes continuent de résonner).";
  }

  /* écran du piano : mode, morceau, tempo, octaves, accordage, écho */
  function refreshLcd() {
    var names = { free: "Mode libre", learn: "Apprendre", rhythm: "Rythme", lesson: "Leçons" };
    var l1 = names[game.mode];
    if (game.mode === "learn" || game.mode === "rhythm") l1 += " · " + SONGS[game.song][0];
    else if (game.mode === "lesson") l1 += " · " + LESSONS[game.les].name;
    $("lcd1").textContent = l1;
    $("lcd2").textContent = metro.bpm + " BPM · " + metro.beats + " temps" + (metro.on ? " · tic-tac" : "");
    $("lcd3").textContent = "Octaves " + (4 + game.oct) + "–" + (5 + game.oct) + " · La " + TUNE + " Hz · écho " +
      (echo.on ? Math.round(echo.time * 1000) + " ms" : "non") + (sustainOn ? " · Pédale" : "");
  }

  /* --- records, enregistrés par joueur --- */
  function currentName() { return game.mode === "lesson" ? LESSONS[game.les].name : SONGS[game.song][0]; }

  function currentUser() {
    try {
      var d = JSON.parse(localStorage.getItem("dactylo.v1"));
      return d && d.cur && d.profiles && d.profiles[d.cur] ? d.cur : null;
    } catch (e) { return null; }
  }

  function saveRecord(r) {
    var user = currentUser();
    if (!user) return null;
    var all;
    try { all = JSON.parse(localStorage.getItem("dactylo.piano.v1")) || {}; } catch (e) { all = {}; }
    var key = currentName() + "|" + game.mode + "|" + game.spd;
    var mine = all[user] = all[user] || {};
    var old = mine[key] || { s: 0, a: 0, st: 0 };
    var best = r.s > old.s;
    if (best) mine[key] = { s: r.s, a: r.a, st: r.st };
    try { localStorage.setItem("dactylo.piano.v1", JSON.stringify(all)); } catch (e) {}
    return { best: best, old: old };
  }

  /* --- parties --- */
  function start() {
    if (game.mode === "free") {
      game.phase = "idle";
      game.notes = [];
      $("pn_res").classList.add("hide");
      refreshUI();
      return;
    }
    if (game.mode === "lesson") { startLesson(); return; }
    var d = songData();
    game.notes = d.list;
    game.end = d.end;
    game.idx = 0;
    game.score = 0; game.combo = 0; game.maxc = 0;
    game.hits = 0; game.miss = 0; game.wrong = 0; game.done = 0;
    game.clock = 0; game.fin = 0;
    game.pop = [];
    game.phase = "play";
    $("pn_res").classList.add("hide");
    loadSamples();
    refreshUI();
    runLoop(true);
  }

  function finish() {
    game.phase = "done";
    var total = accuracyTotal();
    var acc = total ? Math.round(game.hits / total * 100) : 100;
    var stars;
    if (game.mode === "rhythm" || game.timed) stars = acc >= 90 && game.miss <= 2 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
    else stars = acc >= 95 ? 3 : acc >= 85 ? 2 : acc >= 65 ? 1 : 0;
    var r = saveRecord({ s: game.score, a: acc, st: stars });
    var recordLine = "";
    if (r) {
      if (r.best && r.old.s) recordLine = "<br>Nouveau record !";
      else if (r.old.s) recordLine = "<br>Record : " + r.old.s;
    }
    var el = $("pn_res");
    el.innerHTML =
      '<b style="font-size:1.2rem">' + currentName() + "</b>" +
      '<div style="font-size:1.6rem;letter-spacing:.2em;margin:4px 0">' + "★".repeat(stars) + "☆".repeat(3 - stars) + "</div>" +
      '<p style="margin:4px 0 8px">Score <b>' + game.score + "</b> · précision <b>" + acc + " %</b> · meilleure série <b>" + game.maxc + "</b>" + recordLine + "</p>" +
      '<button class="btn p" id="pn_again">Rejouer</button> <button class="btn" id="pn_free">Mode libre</button>';
    el.classList.remove("hide");
    $("pn_again").onclick = start;
    $("pn_free").onclick = function () { setMode("free"); };
    refreshUI();
  }

  /* texte qui monte au-dessus d'une touche */
  function addPopup(k, txt, col) { game.pop.push({ x: k.cx, y: HIT_Y - 20, t: 0, txt: txt, col: col }); }
  /* gerbe de particules */
  function addBurst(k, col) {
    for (var i = 0; i < 14; i++) {
      game.pt.push({
        x: k.cx, y: HIT_Y, vx: (Math.random() - .5) * 300, vy: -Math.random() * 260 - 40,
        t: 0, c: i % 3 ? col : "#FFFFFF"
      });
    }
  }
  function registerHit(note, pts, txt, col) {
    note.hit = true;
    game.hits++; game.done++; game.combo++;
    game.maxc = Math.max(game.maxc, game.combo);
    game.score += Math.round(pts * (1 + Math.min(game.combo, 30) / 30));
    addPopup(note.k, txt, col);
    addBurst(note.k, PASTEL[note.k.f] || "#F2A93B");
  }

  /* règles quand une touche est pressée */
  function onPress(k) {
    if (game.phase === "play" && game.mode === "lesson") {
      lessonPress(k);
      refreshUI();
      return;
    }
    if (game.phase === "play") {
      if (game.mode === "rhythm") {
        /* on cherche la note de cette touche la plus proche de la ligne dorée */
        var best = null, bestDist = 9;
        game.notes.forEach(function (n) {
          if (!n.hit && !n.miss && n.n === k.note) {
            var d = Math.abs(game.clock - n.time);
            if (d <= HIT_WINDOW && d < bestDist) { best = n; bestDist = d; }
          }
        });
        if (best) {
          if (bestDist < .07) registerHit(best, 100, "Parfait !", "#FFE066");
          else if (bestDist < .14) registerHit(best, 60, "Bien", "#BFE0F0");
          else registerHit(best, 30, "Ok", "#F8EAA8");
        } else {
          game.wrong++; game.combo = 0;
          addPopup(k, "✗", "#F0948C");
        }
      } else if (game.mode === "learn") {
        var next = game.notes[game.idx];
        if (next) {
          if (k.note === next.n) {
            if (next.time - game.clock <= 1) {
              game.clock = Math.max(game.clock, next.time);
              registerHit(next, 100, "Bien !", "#BFE0F0");
              game.idx++;
            }
          } else {
            game.wrong++; game.combo = 0;
            addPopup(k, "✗", "#F0948C");
          }
        }
      }
    }
    refreshUI();
  }

  /* avance la partie de dt secondes */
  function update(dt) {
    game.pop.forEach(function (p) { p.t += dt; });
    game.pop = game.pop.filter(function (p) { return p.t < .8; });
    game.pt.forEach(function (p) { p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    game.pt = game.pt.filter(function (p) { return p.t < .7; });
    if (game.phase !== "play") return;
    if (game.mode === "lesson") { lessonTick(dt); return; }
    if (game.mode === "rhythm") {
      game.clock += dt;
      game.notes.forEach(function (n) {
        if (!n.hit && !n.miss && game.clock > n.time + HIT_WINDOW) {
          n.miss = true; game.miss++; game.done++; game.combo = 0;
        }
      });
      if (game.clock > game.end + 1.2) finish();
    } else {
      /* mode Apprendre : l'horloge attend la prochaine note */
      var next = game.notes[game.idx];
      if (next) {
        game.clock = Math.min(next.time, game.clock + dt);
      } else {
        game.fin += dt;
        game.clock += dt;
        if (game.fin > .8) finish();
      }
    }
    if (game.phase === "play") refreshUI();
  }

  /* ================= 5. Dessin (style pixel : rectangles à bords nets) ================= */

  function drawBackground(t) {
    var i, f;
    for (i = 0; i < 8; i++) {
      f = i / 7;
      ctx.fillStyle = "rgb(" + [22 + 14 * f | 0, 18 + 12 * f | 0, 32 + 24 * f | 0] + ")";
      ctx.fillRect(0, i * KEY_Y / 8, W, KEY_Y / 8 + 1);
    }
    /* colonnes des 10 touches blanches */
    for (i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.07)";
      ctx.fillRect(50 + i * 80, 0, 80, KEY_Y);
    }
    /* ligne dorée */
    ctx.fillStyle = "rgba(242,169,59,.9)";
    for (i = 50; i < 850; i += 24) ctx.fillRect(i, HIT_Y, 14, 4);
  }

  function drawFallingNotes(hint) {
    game.notes.forEach(function (n, j) {
      if (n.hit) return;
      var yb = HIT_Y - (n.time - game.clock) * SPEED, yt = yb - n.h;
      if (yb < -8 || yt > KEY_Y) return;
      var k = n.k, w = k.white ? 64 : 40, x = k.cx - w / 2;
      var col = n.miss ? "#6f748a" : PASTEL[k.f];
      var isNext = game.mode === "learn" && j === game.idx;
      if (!n.miss && n.time - game.clock < 1.3 && n.time - game.clock > -HIT_WINDOW) hint[k.code] = 1;
      ctx.fillStyle = isNext ? "#FFFFFF" : "#3A2F45";
      ctx.fillRect(x - 3, yt - 3, w + 6, n.h + 6);
      ctx.fillStyle = col;
      ctx.fillRect(x, yt, w, n.h);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(x + 4, yt + 4, w - 8, 6);
      ctx.fillStyle = "#3A2F45";
      ctx.font = '700 20px Poppins,Arial,sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(k.label.toUpperCase(), k.cx, yb - Math.min(n.h / 2, 18));
    });
  }

  /* dégradés du clavier, créés une seule fois */
  var gradWhite = null, gradBlack = null, gradPressed = null, gradCheek = null;
  function makeGradients() {
    function grad(y0, y1, stops) {
      var g = ctx.createLinearGradient(0, y0, 0, y1);
      stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
      return g;
    }
    gradWhite = grad(KEY_Y, H, [[0, "#e3dccb"], [.1, "#fffdf6"], [.8, "#fbf7ec"], [1, "#d6cfbd"]]);
    gradBlack = grad(KEY_Y, KEY_Y + 80, [[0, "#4d475b"], [.8, "#18141f"], [1, "#050407"]]);
    gradPressed = grad(KEY_Y, H, [[0, "#ffd58a"], [1, "#f2a93b"]]);
    gradCheek = grad(KEY_Y, H, [[0, "#2c2635"], [1, "#0d0a12"]]);
  }

  /* clavier de piano de concert : joues noires, feutre rouge, touches ivoire et ébène */
  function drawKeyboard(hint) {
    if (!gradWhite) makeGradients();
    ctx.fillStyle = "#0d0a12";
    ctx.fillRect(0, KEY_Y, W, H - KEY_Y);
    ctx.fillStyle = gradCheek;
    ctx.fillRect(0, KEY_Y, 50, H - KEY_Y);
    ctx.fillRect(850, KEY_Y, 50, H - KEY_Y);
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(0, KEY_Y, 50, 2);
    ctx.fillRect(850, KEY_Y, 50, 2);
    ctx.fillStyle = "#d9a441";
    ctx.font = '700 11px Poppins,Arial,sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Dactylo", 25, KEY_Y + 24);
    ctx.globalAlpha = .6;
    ctx.fillText("Piano", 25, KEY_Y + 40);
    ctx.globalAlpha = 1;
    /* feutre rouge au-dessus des touches */
    ctx.fillStyle = "#7d1d2b";
    ctx.fillRect(50, KEY_Y - 5, 800, 5);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(50, KEY_Y - 5, 800, 1);
    /* touches blanches */
    keys.forEach(function (k) {
      if (!k.white) return;
      var pressed = game.down[k.code], dy = pressed ? 3 : 0;
      ctx.fillStyle = "#1c1722";
      ctx.fillRect(k.x, KEY_Y, k.w, H - KEY_Y);
      ctx.fillStyle = pressed ? gradPressed : hint[k.code] ? PASTEL[k.f] : gradWhite;
      ctx.fillRect(k.x + 1, KEY_Y + dy, k.w - 2, H - KEY_Y - 5 - dy);
      ctx.fillStyle = "rgba(60,48,40,.2)";
      ctx.fillRect(k.x + 1, H - 17, k.w - 2, 12);
      ctx.fillStyle = "#3A2F45";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '700 24px Poppins,Arial,sans-serif';
      ctx.fillText(k.label.toUpperCase(), k.cx, KEY_Y + 104);
      ctx.font = '600 13px Poppins,Arial,sans-serif';
      ctx.globalAlpha = .7;
      ctx.fillText(k.fr + (Math.floor((k.midi + 12 * octShift()) / 12) - 1), k.cx, KEY_Y + 124);
      ctx.globalAlpha = 1;
    });
    /* touches noires, par-dessus */
    keys.forEach(function (k) {
      if (k.white) return;
      var pressed = game.down[k.code], dy = pressed ? 3 : 0;
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(k.x - 2, KEY_Y, k.w + 4, 86);
      ctx.fillStyle = pressed ? "#F2A93B" : hint[k.code] ? PASTEL[k.f] : gradBlack;
      ctx.fillRect(k.x, KEY_Y + dy, k.w, 80 - dy);
      if (!pressed && !hint[k.code]) {
        ctx.fillStyle = "rgba(255,255,255,.16)";
        ctx.fillRect(k.x + 4, KEY_Y + 4, 5, 56);
        ctx.fillStyle = "rgba(255,255,255,.07)";
        ctx.fillRect(k.x + 3, KEY_Y + 62, k.w - 6, 14);
      }
      ctx.fillStyle = pressed || hint[k.code] ? "#3A2F45" : "#FFFDF6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '700 17px Poppins,Arial,sans-serif';
      ctx.fillText(k.label.toUpperCase(), k.cx, KEY_Y + 56);
    });
  }

  /* voyant de la pédale de sustain, sur la joue droite du clavier */
  function drawPedal() {
    ctx.fillStyle = "#08060b";
    ctx.beginPath();
    ctx.arc(875, KEY_Y + 24, 11, 0, Math.PI * 2);
    ctx.fill();
    if (sustainOn) {
      ctx.fillStyle = "rgba(255,179,71,.28)";
      ctx.beginPath();
      ctx.arc(875, KEY_Y + 24, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = sustainOn ? "#ffb347" : "#3a2a12";
    ctx.beginPath();
    ctx.arc(875, KEY_Y + 24, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cfc7d8";
    ctx.font = '600 10px Poppins,Arial,sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pédale", 875, KEY_Y + 48);
  }

  function drawEffects() {
    game.pt.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / .7);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, 8, 8);
    });
    ctx.globalAlpha = 1;
    game.pop.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / .8);
      ctx.fillStyle = p.col;
      ctx.font = '400 14px "Press Start 2P",Poppins,monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.txt, p.x, p.y - p.t * 50);
    });
    ctx.globalAlpha = 1;
  }

  function drawOverlays() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    /* compte à rebours avant le début du mode Rythme */
    if (game.phase === "play" && game.mode === "rhythm" && game.clock < LEAD - .4) {
      ctx.fillStyle = "#fff";
      ctx.font = '400 56px "Press Start 2P",Poppins,monospace';
      ctx.fillText(String(Math.ceil(LEAD - .4 - game.clock)), W / 2, 150);
    }
    /* message d'accueil */
    if (game.mode === "free" || game.phase === "idle") {
      ctx.fillStyle = "rgba(8,12,28,.55)";
      ctx.fillRect(150, 120, 600, 70);
      ctx.fillStyle = "#fff";
      ctx.font = '600 20px Poppins,Arial,sans-serif';
      var msg = game.mode === "free" ? "Jouez avec votre clavier : Q S D F G H J K L M…"
        : game.mode === "lesson" ? "Choisissez une leçon puis cliquez sur Jouer"
        : "Choisissez une mélodie puis cliquez sur Jouer";
      ctx.fillText(msg, W / 2, 155);
    }
    ctx.textAlign = "left";
  }

  function draw(t) {
    var hint = {};   // touches à allumer (notes qui arrivent)
    drawBackground(t);
    if (game.phase === "play" && game.mode === "lesson") drawLesson(hint);
    if (game.phase === "play" && game.mode !== "lesson") drawFallingNotes(hint);
    drawKeyboard(hint);
    drawPedal();
    drawEffects();
    drawOverlays();
  }

  /* ================= 6. Boucle et commandes ================= */

  var rafId = 0, lastTime = 0;
  function nowSec() { return performance.now() / 1000; }
  function frame() {
    rafId = requestAnimationFrame(frame);
    var t = nowSec(), dt = Math.min(.05, t - lastTime);
    lastTime = t;
    update(dt);
    draw(t);
    drawMetroObject();
  }
  function runLoop(on) {
    if (on && !rafId) { lastTime = nowSec(); rafId = requestAnimationFrame(frame); }
    else if (!on && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  /* le clavier garde ses proportions et prend toute la place restante (la souris et le tactile restent justes : le calcul des touches suit la taille affichée) */
  function fitCanvas() {
    if (!sec.classList.contains("on") || !document.body.classList.contains("fit")) return;
    var st = cv.parentNode, aw = st.clientWidth, ah = st.clientHeight;
    if (!aw || !ah) return;
    var w = Math.max(120, Math.floor(Math.min(aw, ah * W / H)));
    cv.style.width = w + "px";
    cv.style.height = Math.round(w * H / W) + "px";
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(cv.parentNode);
  window.addEventListener("resize", fitCanvas);

  function visible() { return sec.classList.contains("on"); }
  new MutationObserver(function () {
    if (visible()) {
      loadSamples();
      helpText();
      refreshUI();
      runLoop(true);
      fitCanvas();
      requestAnimationFrame(fitCanvas);
    } else {
      runLoop(false);
      metroStop();
      if (game.mode === "lesson" && game.phase === "play") game.phase = "idle";
      releaseAll();
    }
  }).observe(sec, { attributes: true, attributeFilter: ["class"] });
  /* si la fenêtre perd le focus, on lâche tout (évite une pédale ou une touche « coincée ») */
  window.addEventListener("blur", releaseAll);

  function setMode(m) {
    if (game.timed && metro.on) metroStop();
    game.timed = false;
    game.mode = m;
    if (m !== "free") game.oct = 0;
    $("pn_oct").style.display = m === "free" ? "" : "none";
    setOct(0);
    game.phase = "idle";
    game.notes = [];
    Array.prototype.forEach.call(document.querySelectorAll("#pn_mode [data-mode]"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.mode === m);
    });
    $("pn_spd").style.display = m === "rhythm" ? "" : "none";
    $("pn_song").style.display = m === "learn" || m === "rhythm" ? "" : "none";
    updateSongTools();
    $("pn_les").style.display = m === "lesson" ? "" : "none";
    $("pg_play").style.display = m === "free" ? "none" : "";
    $("pn_res").classList.add("hide");
    game.score = 0; game.combo = 0;
    game.hits = game.miss = game.wrong = game.done = 0;
    helpText();
    refreshUI();
    refreshLcd();
  }

  function setOct(d) {
    game.oct = Math.max(-1, Math.min(1, game.oct + d));
    $("pn_octl").textContent = "Octaves " + (4 + game.oct) + "–" + (5 + game.oct);
    Array.prototype.forEach.call(document.querySelectorAll("#pn_oct [data-o]"), function (b) {
      b.disabled = (+b.dataset.o < 0 && game.oct <= -1) || (+b.dataset.o > 0 && game.oct >= 1);
    });
    refreshLcd();
  }

  /* ================= Import de morceaux MIDI ================= */

  /* Le fichier est lu sur l'appareil, rien n'est envoyé. La mélodie principale devient une mélodie comme les autres
     (Apprendre et Rythme). Les notes hors de la plage jouable (Do4 à Mi5) sont décalées d'octaves entières. */
  var BUILTIN_SONGS = SONGS.length, MAX_USER_SONGS = 20, MAX_NOTES = 400, SONG_KEY = "dactylo.piano.songs.v1";
  var LOW_MIDI = 60, HIGH_MIDI = 76;   // Do4 … Mi5
  var PC_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  function midiName(m) { return PC_NAMES[m % 12] + (Math.floor(m / 12) - 1); }
  function cleanTitle(s) {
    s = String(s || "").replace(/\.(mid|midi)$/i, "").replace(/[<>&"'`\\]/g, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim();
    return (s || "Morceau importé").slice(0, 40);
  }
  function fail(msg) { var e = new Error(msg); e.user = true; return e; }

  /* lit un fichier MIDI standard : renvoie { ppq, tempos: [{tick, us}], parts: { clé: { notes: [{s, e, p}] } } } */
  function readMidi(buf) {
    var d = new DataView(buf), len = buf.byteLength, pos = 0;
    function u8() { if (pos >= len) throw fail("Fichier MIDI illisible ou corrompu."); return d.getUint8(pos++); }
    function tag() { var s = "", i; for (i = 0; i < 4; i++) s += String.fromCharCode(u8()); return s; }
    function varlen() { var v = 0, i, b; for (i = 0; i < 4; i++) { b = u8(); v = (v << 7) | (b & 127); if (!(b & 128)) return v; } throw fail("Fichier MIDI illisible ou corrompu."); }
    if (len < 14 || tag() !== "MThd") throw fail("Ce fichier n'est pas un fichier MIDI valide.");
    var hl = d.getUint32(4), div = d.getUint16(12);
    if (div & 0x8000) throw fail("Ce MIDI utilise un minutage SMPTE, non pris en charge.");
    if (!div) throw fail("Ce fichier n'est pas un fichier MIDI valide.");
    pos = 8 + hl;
    var parts = {}, tempos = [], trk = 0;
    while (pos + 8 <= len && trk < 64) {
      var t = tag(), l = d.getUint32(pos); pos += 4;
      var end = Math.min(len, pos + l);
      if (t !== "MTrk") { pos = end; continue; }
      var tick = 0, running = 0, open = {};
      var close = function (key, at) {
        var st = open[key] && open[key].shift();
        if (st == null) return;
        var part = parts[trk + ":" + (key >> 7)] || (parts[trk + ":" + (key >> 7)] = { notes: [] });
        part.notes.push({ s: st, e: Math.max(st + 1, at), p: key & 127 });
      };
      while (pos < end) {
        tick += varlen();
        var st = u8();
        if (st < 0x80) { if (!running) throw fail("Fichier MIDI illisible ou corrompu."); pos--; st = running; }
        else if (st < 0xF0) running = st;
        if (st === 0xFF) {
          var type = u8(), ml = varlen();
          if (type === 0x51 && ml === 3 && pos + 3 <= len) tempos.push({ tick: tick, us: (d.getUint8(pos) << 16) | (d.getUint8(pos + 1) << 8) | d.getUint8(pos + 2) });
          pos += ml;
        } else if (st === 0xF0 || st === 0xF7) {
          pos += varlen();
        } else {
          var kind = st & 0xF0, ch = st & 15, a = u8(), b = (kind === 0xC0 || kind === 0xD0) ? 0 : u8();
          if (a > 127 || b > 127) throw fail("Fichier MIDI illisible ou corrompu.");
          var key = (ch << 7) | a;
          if (kind === 0x90 && b > 0) { if (ch !== 9) (open[key] = open[key] || []).push(tick); }
          else if (kind === 0x80 || kind === 0x90) close(key, tick);
        }
      }
      Object.keys(open).forEach(function (k) { while (open[k].length) close(+k, tick); });
      pos = end;
      trk++;
    }
    return { ppq: div, tempos: tempos.sort(function (x, y) { return x.tick - y.tick; }), parts: parts };
  }

  /* fichier MIDI -> { title, bpm, notation, … } ; lève une erreur avec un message pour l'utilisateur */
  function midiToSong(buf, filename) {
    var m;
    try { m = readMidi(buf); }
    catch (e) { throw e && e.user ? e : fail("Fichier MIDI illisible ou corrompu."); }
    /* piste de mélodie : beaucoup de notes, et plutôt aiguës */
    var best = null, bestScore = 0;
    Object.keys(m.parts).forEach(function (k) {
      var n = m.parts[k].notes;
      if (n.length < 4) return;
      var avg = n.reduce(function (a, x) { return a + x.p; }, 0) / n.length;
      var score = n.length * Math.max(.25, Math.min(1.5, (avg - 36) / 36));
      if (score > bestScore) { bestScore = score; best = n; }
    });
    if (!best) throw fail("Aucune mélodie trouvée dans ce fichier (moins de 4 notes).");
    var ppq = m.ppq, eps = ppq / 16, seq = [], gs = -1e9;
    best.slice().sort(function (a, b) { return a.s - b.s || b.p - a.p; }).forEach(function (n) {
      if (seq.length && n.s - gs < eps) { if (n.p > seq[seq.length - 1].p) seq[seq.length - 1] = n; return; }
      seq.push(n); gs = n.s;
    });
    /* positions en temps, calées sur 1/8 de temps */
    var q = function (x) { return Math.round(x / ppq * 8) / 8; };
    var items = [];
    seq.forEach(function (n) {
      var b0 = q(n.s);
      if (items.length && b0 <= items[items.length - 1].b0) return;
      items.push({ b0: b0, bd: Math.max(.125, q(n.e - n.s)), p: n.p });
    });
    var truncated = items.length > MAX_NOTES;
    if (truncated) items = items.slice(0, MAX_NOTES);
    if (items.length < 4) throw fail("Aucune mélodie trouvée dans ce fichier (moins de 4 notes).");
    /* décalage d'octaves : celui qui laisse le moins de notes hors de la plage ; le reste est ramené dans la plage */
    var shift = 0, bestOut = 1e9, k;
    for (k = -5; k <= 5; k++) {
      var out = items.filter(function (it) { var v = it.p + 12 * k; return v < LOW_MIDI || v > HIGH_MIDI; }).length;
      if (out < bestOut || (out === bestOut && Math.abs(k) < Math.abs(shift))) { bestOut = out; shift = k; }
    }
    var folded = 0;
    items.forEach(function (it) {
      var v = it.p + 12 * shift;
      if (v < LOW_MIDI || v > HIGH_MIDI) { folded++; while (v < LOW_MIDI) v += 12; while (v > HIGH_MIDI) v -= 12; }
      it.m = v;
    });
    /* notation : silences (R) et durées */
    var fmt = function (x) { return String(Math.round(x * 1000) / 1000); };
    var first = items[0].b0, cursor = 0, toks = [];
    items.forEach(function (it, i) {
      var start = it.b0 - first;
      if (start > cursor + 1e-9) toks.push("R:" + fmt(start - cursor));
      var next = i + 1 < items.length ? items[i + 1].b0 - first : start + it.bd;
      var avail = next - start, dur = avail - it.bd < .25 ? avail : it.bd;
      toks.push(midiName(it.m) + (dur === 1 ? "" : ":" + fmt(dur)));
      cursor = start + dur;
    });
    var bpm = m.tempos.length ? Math.round(6e7 / m.tempos[0].us) : 120, clamped = false;
    if (bpm < 40 || bpm > 220) { bpm = Math.max(40, Math.min(220, bpm)); clamped = true; }
    var changes = m.tempos.some(function (t) { return t.us !== m.tempos[0].us; });
    return { title: cleanTitle(filename), bpm: bpm, notation: toks.join(" "), count: items.length,
             shift: shift, folded: folded, truncated: truncated, tempoChanges: changes, clamped: clamped };
  }

  var toastTimer = 0;
  function toast(msg, isErr) {
    var el = $("pn_toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("err", !!isErr);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, isErr ? 7000 : 6500);
  }
  function saveUserSongs() {
    try { localStorage.setItem(SONG_KEY, JSON.stringify(SONGS.slice(BUILTIN_SONGS))); return true; } catch (e) { return false; }
  }
  function fillSongs() {
    var sel = $("pn_song"), i;
    sel.innerHTML = "";
    for (i = 0; i < SONGS.length; i++) {
      var o = document.createElement("option");
      o.value = i;
      o.textContent = (i >= BUILTIN_SONGS ? "★ " : "") + SONGS[i][0];
      sel.appendChild(o);
    }
    sel.value = game.song;
  }
  function updateSongTools() {
    var on = game.mode === "learn" || game.mode === "rhythm";
    $("pn_imp").style.display = on ? "" : "none";
    $("pn_del").style.display = on && game.song >= BUILTIN_SONGS ? "" : "none";
  }

  /* morceaux importés gardés sur l'appareil (on revérifie tout ce qu'on relit) */
  try {
    var savedSongs = JSON.parse(localStorage.getItem(SONG_KEY));
    if (Array.isArray(savedSongs)) savedSongs.slice(0, MAX_USER_SONGS).forEach(function (s) {
      var okTok = /^(R|[A-G][b#]?[0-9])(:[0-9]+(\.[0-9]+)?)?$/;
      if (Array.isArray(s) && typeof s[0] === "string" && typeof s[2] === "string" && s[2].length < 8000 &&
          +s[1] >= 40 && +s[1] <= 220 && s[2].split(" ").every(function (t) { return okTok.test(t); })) {
        SONGS.push([cleanTitle(s[0]), Math.round(+s[1]), s[2]]);
      }
    });
  } catch (e) {}

  function importMidiBuffer(buf, filename) {
    var r;
    try { r = midiToSong(buf, filename); }
    catch (e) { return { ok: false, error: e && e.user ? e.message : "Fichier MIDI illisible ou corrompu." }; }
    if (SONGS.length - BUILTIN_SONGS >= MAX_USER_SONGS) return { ok: false, error: "Limite de " + MAX_USER_SONGS + " morceaux importés : supprimez-en un d'abord." };
    SONGS.push([r.title, r.bpm, r.notation]);
    r.stored = saveUserSongs();
    game.song = SONGS.length - 1;
    game.phase = "idle";
    fillSongs();
    updateSongTools();
    refreshLcd();
    var msg = "« " + r.title + " » importé : " + r.count + " notes, " + r.bpm + " BPM.";
    if (r.shift) msg += " Décalé de " + Math.abs(r.shift) + " octave" + (Math.abs(r.shift) > 1 ? "s" : "") + (r.shift > 0 ? " vers le haut." : " vers le bas.");
    if (r.folded) msg += " " + r.folded + " note" + (r.folded > 1 ? "s" : "") + " hors plage ramenée" + (r.folded > 1 ? "s" : "") + " dans Do4–Mi5.";
    if (r.truncated) msg += " Tronqué aux " + MAX_NOTES + " premières notes.";
    if (r.tempoChanges) msg += " Tempo variable : seul le tempo de départ est gardé.";
    if (r.clamped) msg += " Tempo ramené entre 40 et 220 BPM.";
    if (!r.stored) msg += " Mémoire pleine : le morceau sera perdu à la fermeture.";
    toast(msg, false);
    r.ok = true;
    return r;
  }
  $("pn_imp").onclick = function () { $("pn_file").click(); };
  $("pn_file").onchange = function () {
    var f = this.files && this.files[0];
    this.value = "";
    if (!f) return;
    if (f.size > 1048576) { toast("Fichier trop gros (1 Mo maximum).", true); return; }
    var rd = new FileReader();
    rd.onload = function () { var r = importMidiBuffer(rd.result, f.name); if (!r.ok) toast(r.error, true); };
    rd.onerror = function () { toast("Impossible de lire ce fichier.", true); };
    rd.readAsArrayBuffer(f);
  };
  $("pn_del").onclick = function () {
    var i = game.song;
    if (i < BUILTIN_SONGS || !SONGS[i]) return;
    if (!window.confirm("Supprimer « " + SONGS[i][0] + " » ?")) return;
    SONGS.splice(i, 1);
    saveUserSongs();
    game.song = 0;
    game.phase = "idle";
    fillSongs();
    updateSongTools();
    refreshLcd();
    toast("Morceau supprimé.", false);
    this.blur();
  };
  fillSongs();
  $("pn_les").innerHTML = LESSONS.map(function (l, i) { return '<option value="' + i + '">' + l.name + "</option>"; }).join("");

  $("pn_oct").onclick = function (e) {
    var b = e.target.closest("[data-o]");
    if (b && !b.disabled) { setOct(+b.dataset.o); b.blur(); }
  };
  $("pn_les").onchange = function () {
    game.les = +this.value;
    game.phase = "idle";
    $("pn_res").classList.add("hide");
    helpText();
    refreshLcd();
    this.blur();
  };
  $("pn_song").onchange = function () { game.song = +this.value; game.phase = "idle"; updateSongTools(); refreshLcd(); this.blur(); };
  $("pn_mode").onclick = function (e) {
    var b = e.target.closest("[data-mode]");
    if (b) { setMode(b.dataset.mode); b.blur(); }
  };
  $("pn_spd").onclick = function (e) {
    var b = e.target.closest("[data-s]");
    if (!b) return;
    game.spd = +b.dataset.s;
    Array.prototype.forEach.call(document.querySelectorAll("#pn_spd [data-s]"), function (x) { x.setAttribute("aria-pressed", x === b); });
    b.blur();
  };
  $("pn_go").onclick = function () { getAudio(); start(); this.blur(); };
  $("pn_ped").onclick = function () { setSustain(!sustainOn); this.blur(); };

  /* touche enfoncée / relâchée (clavier, souris ou tactile) */
  function keyDown(k) {
    if (game.down[k.code]) return;
    game.down[k.code] = 1;
    voices[k.code] = play(k, 1);
    onPress(k);
  }
  function keyUp(k) {
    delete game.down[k.code];
    var v = voices[k.code];
    delete voices[k.code];
    if (!v) return;
    if (sustainOn) heldVoices.push(v);   // la pédale maintient la note
    else release(v);
  }

  /* touche du piano correspondant à un événement clavier (par position physique, sinon par lettre) */
  function keyFromEvent(e) {
    var k = keyByCode[e.code];
    if (!k) {
      var ch = (e.key || "").toLowerCase();
      keys.forEach(function (q) { if (q.label === ch) k = q; });
    }
    return k;
  }

  document.addEventListener("keydown", function (e) {
    if (!visible() || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" && e.target.type !== "range" || tag === "TEXTAREA") return;
    /* Espace = pédale de sustain (sauf si un bouton ou une liste a le focus : Espace sert alors à l'activer) */
    if (e.code === "Space" && tag !== "BUTTON" && tag !== "SELECT" && tag !== "A") {
      e.preventDefault();
      setSustain(true);
      return;
    }
    if (game.mode === "free" && (e.code === "ArrowUp" || e.code === "ArrowDown")) {
      e.preventDefault();
      setOct(e.code === "ArrowUp" ? 1 : -1);
      return;
    }
    var k = keyFromEvent(e);
    if (!k) return;
    e.preventDefault();
    keyDown(k);
  });
  document.addEventListener("keyup", function (e) {
    if (!visible()) return;
    if (e.code === "Space") { setSustain(false); return; }
    var k = keyFromEvent(e);
    if (k) keyUp(k);
  });

  /* touche du dessin sous un point de l'écran (noires d'abord, car elles sont au-dessus) */
  function keyAtEvent(ev) {
    var r = cv.getBoundingClientRect();
    var x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
    if (y < KEY_Y) return null;
    var i, k;
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      if (!k.white && x >= k.x && x <= k.x + k.w && y < KEY_Y + 80) return k;
    }
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      if (k.white && x >= k.x && x < k.x + k.w) return k;
    }
    return null;
  }

  /* Souris et tactile : un pointeur par doigt (id -> touche tenue), pour jouer à plusieurs doigts.
     En mode Libre, glisser d'une touche à l'autre fait un glissando. */
  var pointers = {};
  function otherPointerHolds(k) {
    return Object.keys(pointers).some(function (id) { return pointers[id] === k; });
  }
  function pointerStop(id) {
    var k = pointers[id];
    delete pointers[id];
    if (k && !otherPointerHolds(k)) keyUp(k);
  }
  cv.addEventListener("pointerdown", function (e) {
    var k = keyAtEvent(e);
    if (!k) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}   // on continue de suivre le doigt hors du canvas
    pointers[e.pointerId] = k;
    keyDown(k);
  });
  cv.addEventListener("pointermove", function (e) {
    if (!(e.pointerId in pointers) || game.mode !== "free") return;
    var k = keyAtEvent(e), cur = pointers[e.pointerId];
    if (k === cur) return;
    pointers[e.pointerId] = k;   // peut être null (le doigt est sorti du clavier)
    if (cur && !otherPointerHolds(cur)) keyUp(cur);
    if (k) keyDown(k);
  });
  window.addEventListener("pointerup", function (e) { pointerStop(e.pointerId); });
  window.addEventListener("pointercancel", function (e) { pointerStop(e.pointerId); });
  cv.addEventListener("lostpointercapture", function (e) { pointerStop(e.pointerId); });

  /* ================= 7. Métronome et accordage ================= */

  /* Métronome (tic-tac) : indépendant des modes, réglable de 40 à 220 BPM.
     Les clics sont programmés un peu à l'avance sur l'horloge audio, donc le rythme reste régulier. */
  var metro = { on: false, bpm: 100, beats: 4, vol: .6, snd: "wood", next: 0, beat: 0, q: [], tm: 0, lastT: null, swings: 0 };
  var metroGain = null;
  /* vrais sons de tic-tac : deux petits échantillons par son (accent = 1er temps, et temps normal), joués à l'instant exact.
     Si un fichier manque ou ne se décode pas, l'ancien bip synthétique prend le relais. */
  var METRO_SOUNDS = ["wood", "click", "bell"], METRO_BASE = "sounds/metro/", metroBuf = {}, metroLoading = {};
  function loadMetroSound(name) {
    if (!audioCtx || metroLoading[name]) return;
    metroLoading[name] = true;
    ["hi", "lo"].forEach(function (k) {
      fetch(METRO_BASE + name + "_" + k + ".wav")
        .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(decode)
        .then(function (d) { metroBuf[name + "_" + k] = d; })
        .catch(function () { metroLoading[name] = false; });
    });
  }

  /* L'objet métronome : un balancier qui touche un côté à chaque clic. lastT = instant du dernier clic joué,
     swings = nombre de clics joués (pair ou impair = côté du balancier). Le poids monte quand le tempo ralentit. */
  var moArm = $("mo_arm"), moWeight = $("mo_w"), moAngle = 0, MO_AMP = 28;
  function updateMetroWeight() {
    if (moWeight) moWeight.setAttribute("y", (14 + (metro.bpm - 40) / 180 * 90).toFixed(1));
  }
  function drawMetroObject() {
    if (!moArm) return;
    if (metro.on && audioCtx) {
      if (metro.lastT == null) {
        moAngle = MO_AMP;   // départ : balancier à droite, prêt à partir
      } else {
        var nextT = metro.q.length ? metro.q[0].t : metro.next;
        var span = Math.max(.05, nextT - metro.lastT);
        var phase = Math.max(0, Math.min(1, (audioCtx.currentTime - metro.lastT) / span));
        moAngle = (metro.swings % 2 ? 1 : -1) * MO_AMP * Math.cos(Math.PI * phase);
      }
    } else {
      moAngle += (0 - moAngle) * .25;   // à l'arrêt, le balancier revient doucement au centre
      if (Math.abs(moAngle) < .05) moAngle = 0;
    }
    moArm.setAttribute("transform", "rotate(" + moAngle.toFixed(2) + " 60 140)");
  }

  function clampNum(v, lo, hi) { v = +v; return isNaN(v) ? lo : Math.max(lo, Math.min(hi, v)); }

  try {
    var savedMetro = JSON.parse(localStorage.getItem("dactylo.piano.metro.v1"));
    if (savedMetro) {
      metro.bpm = Math.round(clampNum(savedMetro.bpm, 40, 220));
      metro.beats = [2, 3, 4, 6].indexOf(savedMetro.beats) >= 0 ? savedMetro.beats : 4;
      metro.vol = clampNum(savedMetro.vol, 0, 1);
      if (METRO_SOUNDS.indexOf(savedMetro.snd) >= 0) metro.snd = savedMetro.snd;
    }
  } catch (e) {}
  function saveMetro() {
    try { localStorage.setItem("dactylo.piano.metro.v1", JSON.stringify({ bpm: metro.bpm, beats: metro.beats, vol: metro.vol, snd: metro.snd })); } catch (e) {}
  }

  /* voyants : un par temps de la mesure, le premier est l'accent */
  function drawDots() {
    var html = "", i;
    for (i = 0; i < metro.beats; i++) html += '<i class="' + (i ? "" : "ac") + '"></i>';
    $("pm_dots").innerHTML = html;
  }
  function lightDot(beat) {
    var dots = $("pm_dots").children, i;
    for (i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i === beat);
  }
  function setBpm(v) {
    metro.bpm = Math.round(clampNum(v, 40, 220));
    knobs.bpm.set(metro.bpm);
    updateMetroWeight();
    refreshLcd();
    saveMetro();
  }

  function metroClick(t, accent) {
    var buf = metroBuf[metro.snd + (accent ? "_hi" : "_lo")];
    if (buf) {
      var s = audioCtx.createBufferSource();
      s.buffer = buf;
      s.connect(metroGain);
      s.start(t);
      return;
    }
    /* secours : ancien bip synthétique */
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? 1 : .6, t + .002);
    g.gain.exponentialRampToValueAtTime(.001, t + .06);
    o.connect(g);
    g.connect(metroGain);
    o.start(t);
    o.stop(t + .08);
  }
  function metroTick() {
    if (!metro.on || !audioCtx) return;
    var spb = 60 / metro.bpm;
    while (metro.next < audioCtx.currentTime + .12) {
      metroClick(metro.next, metro.beat === 0);
      metro.q.push({ t: metro.next, b: metro.beat });
      metro.next += spb;
      metro.beat = (metro.beat + 1) % metro.beats;
    }
    while (metro.q.length && metro.q[0].t <= audioCtx.currentTime) {
      var click = metro.q.shift();
      lightDot(click.b);
      metro.lastT = click.t;
      metro.swings++;
    }
  }
  function ensureMetroGain() {
    var a = getAudio();
    if (!a) return null;
    if (!metroGain) { metroGain = a.createGain(); metroGain.connect(outNode || a.destination); }
    metroGain.gain.value = metro.vol;
    return metroGain;
  }
  function metroStart() {
    var a = getAudio();
    if (!a) return;
    ensureMetroGain();
    loadMetroSound(metro.snd);
    metro.on = true;
    metro.beat = 0;
    metro.q = [];
    metro.lastT = null;
    metro.swings = 0;
    metro.next = a.currentTime + .08;
    metro.t0 = metro.next;   // instant du premier temps (sert aux leçons chronométrées)
    metroTick();
    if (!metro.tm) metro.tm = setInterval(metroTick, 25);
    $("pm_go").setAttribute("aria-pressed", true);
    refreshLcd();
  }
  function metroStop() {
    metro.on = false;
    if (metro.tm) { clearInterval(metro.tm); metro.tm = 0; }
    metro.q = [];
    lightDot(-1);
    $("pm_go").setAttribute("aria-pressed", false);
    refreshLcd();
  }
  $("pm_go").onclick = function () { if (metro.on) metroStop(); else metroStart(); this.blur(); };
  $("mo").onclick = function () { if (metro.on) metroStop(); else metroStart(); };
  $("pm_dn").onclick = function () { setBpm(metro.bpm - 1); this.blur(); };
  $("pm_up").onclick = function () { setBpm(metro.bpm + 1); this.blur(); };
  $("pm_beats").onchange = function () { metro.beats = +this.value; metro.beat = 0; drawDots(); saveMetro(); refreshLcd(); this.blur(); };
  $("pm_beats").value = metro.beats;
  $("pm_snd").value = metro.snd;
  /* choisir un son : on l'entend tout de suite (accent puis temps normal) */
  $("pm_snd").onchange = function () {
    metro.snd = this.value;
    saveMetro();
    this.blur();
    if (!ensureMetroGain()) return;
    loadMetroSound(metro.snd);
    if (!metro.on) setTimeout(function () {
      if (metro.on || !audioCtx) return;
      var t = audioCtx.currentTime + .03;
      metroClick(t, true); metroClick(t + .45, false);
    }, 250);
  };
  knobs.metroVol.set(Math.round(metro.vol * 100));
  drawDots();
  setBpm(metro.bpm);

  /* Accordage : fréquence du La4 réglable de 430 à 450 Hz (440 par défaut), appliquée à toutes les notes */
  try {
    var savedTune = +JSON.parse(localStorage.getItem("dactylo.piano.tune.v1"));
    if (savedTune >= 430 && savedTune <= 450) TUNE = Math.round(savedTune);
  } catch (e) {}
  function setTune(v) {
    TUNE = Math.round(clampNum(v, 430, 450));
    knobs.tune.set(TUNE);
    refreshLcd();
    try { localStorage.setItem("dactylo.piano.tune.v1", JSON.stringify(TUNE)); } catch (e) {}
  }
  $("pt_rs").onclick = function () { setTune(440); this.blur(); };
  $("pt_la").onclick = function () {
    getAudio();
    var v = play(null, 1, 69);
    setTimeout(function () { release(v); }, 1500);
    this.blur();
  };
  setTune(TUNE);

  /* Écho : réglages mémorisés ; opts = { on, time (s), fb (0 à .7) } */
  try {
    var savedEcho = JSON.parse(localStorage.getItem("dactylo.piano.echo.v1"));
    if (savedEcho) {
      echo.on = !!savedEcho.on;
      echo.time = clampNum(savedEcho.time, .1, .8);
      echo.fb = clampNum(savedEcho.fb, 0, .7);
    }
  } catch (e) {}
  function setEcho(opts) {
    if (opts) {
      if ("on" in opts) echo.on = !!opts.on;
      if ("time" in opts) echo.time = clampNum(opts.time, .1, .8);
      if ("fb" in opts) echo.fb = clampNum(opts.fb, 0, .7);
    }
    var ms = Math.round(echo.time * 1000), pct = Math.round(echo.fb * 100);
    $("pe_on").setAttribute("aria-pressed", echo.on);
    knobs.echoTime.set(ms);
    knobs.echoFb.set(pct);
    refreshLcd();
    applyEcho();
    try { localStorage.setItem("dactylo.piano.echo.v1", JSON.stringify({ on: echo.on, time: echo.time, fb: echo.fb })); } catch (e) {}
  }
  $("pe_on").onclick = function () { getAudio(); setEcho({ on: !echo.on }); this.blur(); };
  setEcho();

  /* ================= 8. Moteur des leçons ================= */

  /* instant visé pour l'étape i d'une leçon chronométrée : préparation, puis un accord tous les 2 temps */
  function targetTime(i) { return metro.t0 + (lessonState.bars + 2 * i) * lessonState.spb; }

  function startLesson() {
    var L = LESSONS[game.les];
    game.notes = [];
    game.score = 0; game.combo = 0; game.maxc = 0;
    game.hits = 0; game.miss = 0; game.wrong = 0; game.done = 0;
    game.pop = [];
    game.fin = 0;
    /* sans Web Audio il n'y a pas de tic-tac : la leçon se joue alors sans chrono */
    game.timed = !!L.timed && !!getAudio();
    game.lt = L.steps.length;
    lessonState.i = 0;
    lessonState.got = [];
    game.phase = "play";
    $("pn_res").classList.add("hide");
    loadSamples();
    if (game.timed) {
      metroStop();
      lessonState.spb = 60 / metro.bpm;
      lessonState.bars = metro.beats;
      metroStart();
    }
    refreshUI();
    runLoop(true);
  }

  function lessonPress(k) {
    var L = LESSONS[game.les], step = L.steps[lessonState.i];
    if (!step) return;
    var t = nowSec();
    /* leçon chronométrée : on ignore les touches pressées bien avant le temps visé */
    if (game.timed && audioCtx.currentTime < targetTime(lessonState.i) - .5 * lessonState.spb) return;
    if (step.n.indexOf(k.note) < 0) {
      game.wrong++; game.combo = 0;
      lessonState.got = [];
      addPopup(k, "✗", "#F0948C");
      return;
    }
    /* un accord est validé quand toutes ses touches ont été pressées en moins de 0,3 s */
    lessonState.got = lessonState.got.filter(function (g) { return t - g.t <= .3 && g.n !== k.note; });
    lessonState.got.push({ n: k.note, t: t });
    var complete = step.n.every(function (n) {
      return lessonState.got.some(function (g) { return g.n === n; });
    });
    if (!complete) return;
    var d = game.timed ? Math.abs(audioCtx.currentTime - targetTime(lessonState.i)) / lessonState.spb : 0;
    var pts = 100, txt = "Bien !", col = "#BFE0F0";
    if (game.timed) {
      if (d < .15) { txt = "Parfait !"; col = "#FFE066"; }
      else if (d < .3) { pts = 60; txt = "Bien"; }
      else { pts = 30; txt = "Ok"; col = "#F8EAA8"; }
    }
    game.hits++; game.done++; game.combo++;
    game.maxc = Math.max(game.maxc, game.combo);
    game.score += Math.round(pts * (1 + Math.min(game.combo, 30) / 30));
    addPopup(keyByNote[step.n[0]], txt, col);
    step.n.forEach(function (n) { addBurst(keyByNote[n], PASTEL[keyByNote[n].f] || "#F2A93B"); });
    lessonState.i++;
    lessonState.got = [];
  }

  function lessonTick(dt) {
    var L = LESSONS[game.les], n = L.steps.length;
    /* leçon chronométrée : étape ratée si on dépasse le temps visé d'un demi-temps */
    if (game.timed && lessonState.i < n && audioCtx && audioCtx.currentTime > targetTime(lessonState.i) + .5 * lessonState.spb) {
      game.miss++; game.done++; game.combo = 0;
      addPopup(keyByNote[L.steps[lessonState.i].n[0]], "Raté", "#F0948C");
      lessonState.i++;
      lessonState.got = [];
      refreshUI();
    }
    if (lessonState.i >= n) {
      game.fin += dt;
      if (game.fin > .7) {
        if (game.timed) metroStop();
        finish();
      }
    }
  }

  function drawLesson(hint) {
    var L = LESSONS[game.les], step = L.steps[lessonState.i], i;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    /* numéro de l'étape */
    ctx.fillStyle = "#fff";
    ctx.font = '600 16px Poppins,Arial,sans-serif';
    ctx.globalAlpha = .7;
    ctx.fillText(Math.min(lessonState.i + 1, game.lt) + " / " + game.lt, 70, 28);
    ctx.globalAlpha = 1;
    if (!step) return;
    step.n.forEach(function (n) { hint[keyByNote[n].code] = 1; });
    /* consigne : nom, touches, notes */
    ctx.fillStyle = "#fff";
    ctx.font = '400 26px "Press Start 2P",Poppins,monospace';
    ctx.fillText(step.t, 350, 80);
    ctx.fillStyle = "#FFE066";
    ctx.font = '700 34px Poppins,Arial,sans-serif';
    ctx.fillText(step.n.map(function (n) { return keyByNote[n].label.toUpperCase(); }).join(" + "), 350, 140);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = .7;
    ctx.font = '600 18px Poppins,Arial,sans-serif';
    ctx.fillText(step.n.map(function (n) { return keyByNote[n].fr; }).join(" + "), 350, 184);
    ctx.globalAlpha = 1;
    /* les 3 étapes suivantes */
    ctx.font = '600 16px Poppins,Arial,sans-serif';
    ctx.fillText("Ensuite", 730, 40);
    for (i = 1; i <= 3; i++) {
      var next = L.steps[lessonState.i + i];
      if (next) {
        ctx.globalAlpha = .8 - i * .2;
        ctx.font = '600 20px Poppins,Arial,sans-serif';
        ctx.fillText(next.t, 730, 40 + i * 36);
      }
    }
    ctx.globalAlpha = 1;
    /* barre de temps : le trait blanc avance vers la zone dorée */
    if (game.timed && audioCtx) {
      var from = targetTime(lessonState.i) - 2 * lessonState.spb;
      var f = Math.max(0, Math.min(1, (audioCtx.currentTime - from) / (2.5 * lessonState.spb)));
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(100, 250, 700, 14);
      ctx.fillStyle = "rgba(242,169,59,.9)";
      ctx.fillRect(100 + 700 * .8 - 9, 246, 18, 22);
      ctx.fillStyle = "#fff";
      ctx.fillRect(100 + 700 * f - 3, 242, 6, 30);
    }
    ctx.textAlign = "left";
  }

  /* ================= 9. API publique ================= */

  window.Piano = {
    les: LESSONS, LS: lessonState, lessonPress: lessonPress,
    tune: function () { return TUNE; }, setTune: setTune,
    play: play,
    metro: metro, mstart: metroStart, mstop: metroStop, setBpm: setBpm,
    keys: keys, songs: SONGS, state: game,
    press: keyDown, release: keyUp,
    start: start, setMode: setMode, parse: parseMelody,
    _buf: buffers, pick: pickSample, setOct: setOct, oct: octShift,
    setSustain: setSustain, sustain: function () { return sustainOn; },
    setEcho: setEcho, echo: echo, knobs: knobs,
    importMidi: importMidiBuffer, songTools: updateSongTools,
    _draw: draw, _update: update
  };

  setMode("free");
  helpText();
  refreshUI();

  /* préchargement discret : les sons sont mis en cache pour jouer hors ligne */
  if (navigator.onLine !== false && !(navigator.connection && navigator.connection.saveData)) {
    setTimeout(function () {
      SAMPLE_NAMES.forEach(function (n) { fetch(BASE + n + ".mp3").catch(function () {}); });
    }, 5000);
  }
})();
