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
    ".pnbar{gap:10px;margin-bottom:8px}",
    ".pnbar select,.pmet select{font:600 .9rem var(--fb);padding:7px 10px;border-radius:12px;border:3px solid var(--line2);background:var(--solid);color:var(--ink);max-width:100%}",
    ".pstats{display:flex;gap:22px;flex-wrap:wrap;margin:4px 0 8px}",
    ".pstats strong{font:400 1rem var(--fs);display:block;line-height:1.4}",
    ".pstats span{font-size:.75rem;color:var(--mute)}",
    ".pstage{position:relative;display:flex;justify-content:center;border-radius:16px;overflow:hidden;border:3px solid var(--line2);background:#10131f}",
    "#pn_cv{display:block;max-width:100%;max-height:min(58vh,520px);width:auto;height:auto;touch-action:none;cursor:pointer}",
    ".pstage .res{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:5;background:var(--card);text-align:center;min-width:min(330px,90%);margin:0;box-shadow:0 8px 0 var(--line2)}",
    ".pn_load{position:absolute;left:0;right:0;top:8px;text-align:center;font-size:.8rem;color:#fff;opacity:.9;pointer-events:none}",
    "#pn_help{margin:8px 0 0}",
    "#pn_vol{width:110px;accent-color:var(--acc)}",
    ".pmet{gap:10px;margin:0 0 8px;align-items:center}",
    ".pmet input[type=range]{accent-color:var(--acc);width:140px}",
    "#pt_val{min-width:150px}",
    "#pm_val,#pt_val,#pe_val{font:400 .85rem var(--fs);min-width:92px;text-align:center}",
    ".pdots{display:inline-flex;gap:6px}",
    ".pdots i{width:14px;height:14px;border-radius:4px;background:var(--line2);display:inline-block}",
    ".pdots i.on{background:var(--acc)}",
    ".pdots i.ac.on{background:#F2A93B}"
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
      '<div class="row pnbar">',
        '<div class="chips" id="pn_mode" style="margin:0">',
          '<button class="chip" data-m="free" aria-pressed="true">Libre</button>',
          '<button class="chip" data-m="learn" aria-pressed="false">Apprendre</button>',
          '<button class="chip" data-m="rhythm" aria-pressed="false">Rythme</button>',
          '<button class="chip" data-m="lesson" aria-pressed="false">Leçons</button>',
        '</div>',
        '<select id="pn_song" aria-label="Mélodie"></select>',
        '<select id="pn_les" aria-label="Leçon" style="display:none"></select>',
        '<div class="chips" id="pn_oct" style="margin:0;align-items:center">',
          '<button class="chip" data-o="-1" aria-label="Octave plus grave" aria-pressed="false">−</button>',
          '<span class="note" id="pn_octl">Octaves 4–5</span>',
          '<button class="chip" data-o="1" aria-label="Octave plus aiguë" aria-pressed="false">+</button>',
        '</div>',
        '<div class="chips" style="margin:0"><button class="chip" id="pn_ped" aria-pressed="false" title="Pédale de sustain (barre Espace)">Pédale</button></div>',
        '<div class="chips" id="pn_spd" style="margin:0">',
          '<button class="chip" data-s=".7" aria-pressed="false">Lent</button>',
          '<button class="chip" data-s="1" aria-pressed="true">Normal</button>',
          '<button class="chip" data-s="1.3" aria-pressed="false">Rapide</button>',
        '</div>',
        '<button class="btn p" id="pn_go">Jouer</button>',
        '<label class="note" style="margin-left:auto">Volume <input type="range" id="pn_vol" min="0" max="100" value="80" aria-label="Volume"></label>',
      '</div>',
      '<div class="row pmet">',
        '<button class="btn" id="pm_go">▶ Tic-tac</button>',
        '<button class="chip" id="pm_dn" aria-label="Plus lent" aria-pressed="false">−</button>',
        '<input type="range" id="pm_bpm" min="40" max="220" value="100" aria-label="Tempo">',
        '<button class="chip" id="pm_up" aria-label="Plus rapide" aria-pressed="false">+</button>',
        '<strong id="pm_val">100 BPM</strong>',
        '<select id="pm_beats" aria-label="Mesure"><option value="2">2 temps</option><option value="3">3 temps</option><option value="4" selected>4 temps</option><option value="6">6 temps</option></select>',
        '<span class="pdots" id="pm_dots"></span>',
        '<label class="note">Volume tic-tac <input type="range" id="pm_vol" min="0" max="100" value="60" aria-label="Volume du tic-tac"></label>',
      '</div>',
      '<div class="row pmet">',
        '<button class="chip" id="pe_on" aria-pressed="false" title="Ajoute des répétitions du son, comme dans une grande salle">Écho</button>',
        '<label class="note">Délai <input type="range" id="pe_time" min="100" max="800" step="10" value="300" aria-label="Délai de l\'écho"></label>',
        '<label class="note">Répétitions <input type="range" id="pe_fb" min="0" max="80" step="5" value="40" aria-label="Nombre de répétitions de l\'écho"></label>',
        '<strong id="pe_val">300 ms · 40 %</strong>',
      '</div>',
      '<div class="row pmet">',
        '<b class="note">Accordage</b>',
        '<label class="note">La <input type="range" id="pt_hz" min="430" max="450" step="1" value="440" aria-label="Fréquence du La"></label>',
        '<strong id="pt_val">440 Hz (0 cents)</strong>',
        '<button class="chip" id="pt_dn" aria-label="Plus grave" aria-pressed="false">−</button>',
        '<button class="chip" id="pt_up" aria-label="Plus aigu" aria-pressed="false">+</button>',
        '<button class="btn" id="pt_la">♪ Jouer le La</button>',
        '<button class="btn" id="pt_rs">Remettre à 440</button>',
      '</div>',
      '<div class="pstats">',
        '<div><strong id="pn_score">0</strong><span>score</span></div>',
        '<div><strong id="pn_combo">0</strong><span>série</span></div>',
        '<div><strong id="pn_acc">100%</strong><span>précision</span></div>',
        '<div><strong id="pn_prog">0%</strong><span>avancement</span></div>',
      '</div>',
      '<div class="pstage">',
        '<canvas id="pn_cv" width="' + W + '" height="' + H + '" aria-label="Piano"></canvas>',
        '<div class="pn_load" id="pn_load"></div>',
        '<div class="res hide" id="pn_res"></div>',
      '</div>',
      '<p class="note" id="pn_help"></p>',
    '</div>'
  ].join("");
  main.appendChild(sec);

  var $ = function (id) { return document.getElementById(id); };
  var cv = $("pn_cv"), ctx = cv.getContext("2d");

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
  var echo = { on: false, time: .3, fb: .4 };   // écho : délai (secondes) et répétitions (0 à .8)
  var echoDelay = null, echoFeedback = null, echoWet = null;

  var SAMPLE_NAMES = "C3 Eb3 Gb3 A3 C4 Db4 D4 Eb4 E4 F4 Gb4 G4 Ab4 A4 Bb4 B4 C5 Db5 D5 Eb5 E5 A5 C6 Eb6".split(" ");

  /* Crée le contexte audio au premier appel. Renvoie null si le navigateur n'a pas Web Audio. */
  function getAudio() {
    if (!audioCtx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        audioCtx = new Ctor();
        master = audioCtx.createGain();
        master.gain.value = volume;
        master.connect(audioCtx.destination);
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

  /* Écho : le son passe aussi par une ligne à retard dont la sortie est renvoyée vers son entrée.
     Chaque répétition est plus faible (réglage « Répétitions ») et plus sourde (filtre passe-bas).
     Le tic-tac du métronome ne passe pas par l'écho. Si le navigateur ne sait pas le faire,
     le piano marche quand même, sans écho. */
  function buildEcho() {
    try {
      var tone = audioCtx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 3200;
      echoDelay = audioCtx.createDelay(2);
      echoFeedback = audioCtx.createGain();
      echoWet = audioCtx.createGain();
      master.connect(echoDelay);
      echoDelay.connect(tone);
      tone.connect(echoFeedback);
      echoFeedback.connect(echoDelay);
      tone.connect(echoWet);
      echoWet.connect(audioCtx.destination);
      applyEcho(true);
    } catch (e) {
      echoDelay = echoFeedback = echoWet = null;
    }
  }

  /* applique les réglages de l'écho ; désactivé = plus de répétitions ni de signal d'écho */
  function applyEcho(instant) {
    if (!echoDelay) return;
    var t = audioCtx.currentTime, tc = instant ? .001 : .05;
    echoDelay.delayTime.setTargetAtTime(echo.time, t, tc);
    echoFeedback.gain.setTargetAtTime(echo.on ? echo.fb : 0, t, tc);
    echoWet.gain.setTargetAtTime(echo.on ? .5 : 0, t, tc);
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
      ctx.fillStyle = "rgb(" + [27 + 16 * f | 0, 34 + 24 * f | 0, 54 + 49 * f | 0] + ")";
      ctx.fillRect(0, i * KEY_Y / 8, W, KEY_Y / 8 + 1);
    }
    /* étoiles qui scintillent */
    ctx.fillStyle = "#fff";
    for (i = 0; i < 36; i++) {
      var x = (i * 197) % W, y = (i * 83) % KEY_Y;
      ctx.globalAlpha = Math.floor(t * 1.5 + i) % 3 ? .55 : .25;
      ctx.fillRect(x - x % 4, y - y % 4, 4, 4);
    }
    ctx.globalAlpha = 1;
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

  function drawKeyboard(hint) {
    ctx.fillStyle = "#1a1424";
    ctx.fillRect(0, KEY_Y, W, H - KEY_Y);
    /* touches blanches */
    keys.forEach(function (k) {
      if (!k.white) return;
      var pressed = game.down[k.code], dy = pressed ? 4 : 0;
      ctx.fillStyle = "#3A2F45";
      ctx.fillRect(k.x, KEY_Y, k.w, H - KEY_Y);
      ctx.fillStyle = pressed ? "#F2A93B" : hint[k.code] ? PASTEL[k.f] : "#FFFDF6";
      ctx.fillRect(k.x + 2, KEY_Y + dy, k.w - 4, H - KEY_Y - 4 - dy);
      ctx.fillStyle = "rgba(58,47,69,.12)";
      ctx.fillRect(k.x + 2, H - 14, k.w - 4, 10);
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
      ctx.fillStyle = "#1a1424";
      ctx.fillRect(k.x - 2, KEY_Y, k.w + 4, 86);
      ctx.fillStyle = pressed ? "#F2A93B" : hint[k.code] ? PASTEL[k.f] : "#3B3050";
      ctx.fillRect(k.x, KEY_Y + dy, k.w, 80 - dy);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillRect(k.x + 4, KEY_Y + dy + 4, 6, 64);
      ctx.fillStyle = pressed || hint[k.code] ? "#3A2F45" : "#FFFDF6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '700 17px Poppins,Arial,sans-serif';
      ctx.fillText(k.label.toUpperCase(), k.cx, KEY_Y + 56);
    });
  }

  /* voyant de la pédale de sustain, à droite du clavier */
  function drawPedal() {
    ctx.fillStyle = sustainOn ? "#F2A93B" : "#3B3050";
    ctx.fillRect(856, KEY_Y + 10, 38, 22);
    ctx.fillStyle = sustainOn ? "#3A2F45" : "#FFFDF6";
    ctx.font = '700 11px Poppins,Arial,sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PÉD.", 875, KEY_Y + 21);
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
  }
  function runLoop(on) {
    if (on && !rafId) { lastTime = nowSec(); rafId = requestAnimationFrame(frame); }
    else if (!on && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  function visible() { return sec.classList.contains("on"); }
  new MutationObserver(function () {
    if (visible()) {
      loadSamples();
      helpText();
      refreshUI();
      runLoop(true);
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
    Array.prototype.forEach.call(document.querySelectorAll("#pn_mode .chip"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.m === m);
    });
    $("pn_spd").style.display = m === "rhythm" ? "" : "none";
    $("pn_song").style.display = m === "learn" || m === "rhythm" ? "" : "none";
    $("pn_les").style.display = m === "lesson" ? "" : "none";
    $("pn_go").style.display = m === "free" ? "none" : "";
    $("pn_res").classList.add("hide");
    game.score = 0; game.combo = 0;
    game.hits = game.miss = game.wrong = game.done = 0;
    helpText();
    refreshUI();
  }

  function setOct(d) {
    game.oct = Math.max(-1, Math.min(1, game.oct + d));
    $("pn_octl").textContent = "Octaves " + (4 + game.oct) + "–" + (5 + game.oct);
    Array.prototype.forEach.call(document.querySelectorAll("#pn_oct .chip"), function (b) {
      b.disabled = (+b.dataset.o < 0 && game.oct <= -1) || (+b.dataset.o > 0 && game.oct >= 1);
    });
  }

  $("pn_song").innerHTML = SONGS.map(function (s, i) { return '<option value="' + i + '">' + s[0] + "</option>"; }).join("");
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
    this.blur();
  };
  $("pn_song").onchange = function () { game.song = +this.value; game.phase = "idle"; this.blur(); };
  $("pn_mode").onclick = function (e) {
    var b = e.target.closest("[data-m]");
    if (b) { setMode(b.dataset.m); b.blur(); }
  };
  $("pn_spd").onclick = function (e) {
    var b = e.target.closest("[data-s]");
    if (!b) return;
    game.spd = +b.dataset.s;
    Array.prototype.forEach.call(document.querySelectorAll("#pn_spd .chip"), function (x) { x.setAttribute("aria-pressed", x === b); });
    b.blur();
  };
  $("pn_go").onclick = function () { getAudio(); start(); this.blur(); };
  $("pn_vol").oninput = function () { volume = this.value / 100; if (master) master.gain.value = volume; };
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
  var metro = { on: false, bpm: 100, beats: 4, vol: .6, next: 0, beat: 0, q: [], tm: 0 };
  var metroGain = null;

  function clampNum(v, lo, hi) { v = +v; return isNaN(v) ? lo : Math.max(lo, Math.min(hi, v)); }

  try {
    var savedMetro = JSON.parse(localStorage.getItem("dactylo.piano.metro.v1"));
    if (savedMetro) {
      metro.bpm = Math.round(clampNum(savedMetro.bpm, 40, 220));
      metro.beats = [2, 3, 4, 6].indexOf(savedMetro.beats) >= 0 ? savedMetro.beats : 4;
      metro.vol = clampNum(savedMetro.vol, 0, 1);
    }
  } catch (e) {}
  function saveMetro() {
    try { localStorage.setItem("dactylo.piano.metro.v1", JSON.stringify({ bpm: metro.bpm, beats: metro.beats, vol: metro.vol })); } catch (e) {}
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
    $("pm_bpm").value = metro.bpm;
    $("pm_val").textContent = metro.bpm + " BPM";
    saveMetro();
  }

  function metroClick(t, accent) {
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
    while (metro.q.length && metro.q[0].t <= audioCtx.currentTime) lightDot(metro.q.shift().b);
  }
  function metroStart() {
    var a = getAudio();
    if (!a) return;
    if (!metroGain) { metroGain = a.createGain(); metroGain.connect(a.destination); }
    metroGain.gain.value = metro.vol;
    metro.on = true;
    metro.beat = 0;
    metro.q = [];
    metro.next = a.currentTime + .08;
    metro.t0 = metro.next;   // instant du premier temps (sert aux leçons chronométrées)
    metroTick();
    if (!metro.tm) metro.tm = setInterval(metroTick, 25);
    $("pm_go").textContent = "■ Tic-tac";
  }
  function metroStop() {
    metro.on = false;
    if (metro.tm) { clearInterval(metro.tm); metro.tm = 0; }
    metro.q = [];
    lightDot(-1);
    $("pm_go").textContent = "▶ Tic-tac";
  }
  $("pm_go").onclick = function () { if (metro.on) metroStop(); else metroStart(); this.blur(); };
  $("pm_bpm").oninput = function () { setBpm(this.value); };
  $("pm_dn").onclick = function () { setBpm(metro.bpm - 1); this.blur(); };
  $("pm_up").onclick = function () { setBpm(metro.bpm + 1); this.blur(); };
  $("pm_beats").onchange = function () { metro.beats = +this.value; metro.beat = 0; drawDots(); saveMetro(); this.blur(); };
  $("pm_vol").oninput = function () { metro.vol = this.value / 100; if (metroGain) metroGain.gain.value = metro.vol; saveMetro(); };
  $("pm_beats").value = metro.beats;
  $("pm_vol").value = Math.round(metro.vol * 100);
  drawDots();
  setBpm(metro.bpm);

  /* Accordage : fréquence du La4 réglable de 430 à 450 Hz (440 par défaut), appliquée à toutes les notes */
  try {
    var savedTune = +JSON.parse(localStorage.getItem("dactylo.piano.tune.v1"));
    if (savedTune >= 430 && savedTune <= 450) TUNE = Math.round(savedTune);
  } catch (e) {}
  function setTune(v) {
    TUNE = Math.round(clampNum(v, 430, 450));
    $("pt_hz").value = TUNE;
    var cents = Math.round(1200 * Math.log(TUNE / 440) / Math.LN2);
    $("pt_val").textContent = TUNE + " Hz (" + (cents > 0 ? "+" : "") + cents + " cents)";
    try { localStorage.setItem("dactylo.piano.tune.v1", JSON.stringify(TUNE)); } catch (e) {}
  }
  $("pt_hz").oninput = function () { setTune(this.value); };
  $("pt_dn").onclick = function () { setTune(TUNE - 1); this.blur(); };
  $("pt_up").onclick = function () { setTune(TUNE + 1); this.blur(); };
  $("pt_rs").onclick = function () { setTune(440); this.blur(); };
  $("pt_la").onclick = function () {
    getAudio();
    var v = play(null, 1, 69);
    setTimeout(function () { release(v); }, 1500);
    this.blur();
  };
  setTune(TUNE);

  /* Écho : réglages mémorisés ; opts = { on, time (s), fb (0 à .8) } */
  try {
    var savedEcho = JSON.parse(localStorage.getItem("dactylo.piano.echo.v1"));
    if (savedEcho) {
      echo.on = !!savedEcho.on;
      echo.time = clampNum(savedEcho.time, .1, .8);
      echo.fb = clampNum(savedEcho.fb, 0, .8);
    }
  } catch (e) {}
  function setEcho(opts) {
    if (opts) {
      if ("on" in opts) echo.on = !!opts.on;
      if ("time" in opts) echo.time = clampNum(opts.time, .1, .8);
      if ("fb" in opts) echo.fb = clampNum(opts.fb, 0, .8);
    }
    var ms = Math.round(echo.time * 1000), pct = Math.round(echo.fb * 100);
    $("pe_on").setAttribute("aria-pressed", echo.on);
    $("pe_time").value = ms;
    $("pe_fb").value = pct;
    $("pe_val").textContent = ms + " ms · " + pct + " %";
    applyEcho();
    try { localStorage.setItem("dactylo.piano.echo.v1", JSON.stringify({ on: echo.on, time: echo.time, fb: echo.fb })); } catch (e) {}
  }
  $("pe_on").onclick = function () { getAudio(); setEcho({ on: !echo.on }); this.blur(); };
  $("pe_time").oninput = function () { setEcho({ time: this.value / 1000 }); };
  $("pe_fb").oninput = function () { setEcho({ fb: this.value / 100 }); };
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
    setEcho: setEcho, echo: echo,
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
