/* Mises à jour automatiques de Dactylo (site et application installée).

   Cherche du nouveau au lancement, au retour sur l'appli, au retour du réseau et toutes les 5 minutes.
   Dès qu'une nouvelle version est prête, la page se recharge toute seule, mais jamais en pleine partie :
   on attend que la frappe ou le piano soit au repos. Après 10 minutes sans aucune action, on recharge quand même. */
(function () {
  if (!("serviceWorker" in navigator)) return;

  var CHECK_EVERY = 5 * 60 * 1000;   // vérification régulière
  var MIN_GAP = 30 * 1000;           // pas deux vérifications à moins de 30 s d'écart
  var IDLE_MS = 3000;                // « au repos » = aucune touche ni clic depuis 3 s
  var MAX_WAIT = 10 * 60 * 1000;     // au-delà, on recharge même si une partie semble en cours
  var LOOP_KEY = "dactylo.upd";      // garde-fou contre une boucle de rechargements

  var hadController = !!navigator.serviceWorker.controller;   // faux à la toute première visite
  var reg = null, pending = false, reloading = false;
  var lastInput = Date.now(), lastCheck = 0, debounce = 0, retry = 0;

  ["keydown", "pointerdown", "touchstart", "wheel"].forEach(function (t) {
    addEventListener(t, function () { lastInput = Date.now(); }, { capture: true, passive: true });
  });

  /* une partie de frappe ou de piano est-elle en cours ? */
  function busy() {
    try { if (window.DactyloApp && DactyloApp.busy()) return true; } catch (e) {}
    try { if (window.Piano && Piano.state && Piano.state.phase === "play") return true; } catch (e) {}
    return false;
  }

  /* trop de rechargements d'affilée : on s'arrête pour cette session plutôt que de tourner en boucle */
  function loopGuardOk() {
    try {
      var now = Date.now(), list = JSON.parse(sessionStorage.getItem(LOOP_KEY) || "[]").filter(function (t) { return now - t < 120000; });
      if (list.length >= 3) return false;
      list.push(now);
      sessionStorage.setItem(LOOP_KEY, JSON.stringify(list));
    } catch (e) {}
    return true;
  }

  var toastEl = null;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;max-width:90vw;" +
        "padding:10px 16px;border-radius:12px;border:3px solid #0f0c14;background:#2d2738;color:#ffb347;" +
        "font:600 .85rem Poppins,system-ui,sans-serif;box-shadow:0 4px 0 rgba(0,0,0,.3)";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
  }

  function tryReload() {
    clearTimeout(retry);
    if (!pending || reloading) return;
    var idle = Date.now() - lastInput;
    var ready = (!busy() && (document.hidden || idle >= IDLE_MS)) || idle >= MAX_WAIT;
    if (!ready) { retry = setTimeout(tryReload, 2000); return; }
    if (!loopGuardOk()) return;
    reloading = true;
    try { if (window.DactyloApp) DactyloApp.save(); } catch (e) {}   // on enregistre la progression avant de recharger
    if (!document.hidden) toast("Mise à jour installée, redémarrage…");
    setTimeout(function () { location.reload(); }, document.hidden ? 0 : 800);
  }

  function updateReady() {
    pending = true;
    clearTimeout(debounce);
    debounce = setTimeout(tryReload, 1500);   // on laisse finir les vérifications des autres fichiers
  }

  /* demande au navigateur s'il existe un nouveau sw.js, et au service worker de revérifier les fichiers du site */
  function check(force) {
    var now = Date.now();
    if (!navigator.onLine || (!force && now - lastCheck < MIN_GAP)) return;
    lastCheck = now;
    if (reg) reg.update().catch(function () {});
    var c = navigator.serviceWorker.controller;
    if (c) c.postMessage({ type: "check" });
  }

  navigator.serviceWorker.addEventListener("message", function (e) {
    if (e.data && e.data.type === "dactylo-update") updateReady();
  });
  /* un nouveau service worker a pris la main (sauf à la toute première installation) */
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!hadController) { hadController = true; return; }
    updateReady();
  });

  function start() {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (r) {
      reg = r;
      check(true);
    }).catch(function () {});
    setInterval(function () { check(); }, CHECK_EVERY);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { check(); tryReload(); } });
    addEventListener("online", function () { check(true); });
    addEventListener("focus", function () { check(); });
    addEventListener("pageshow", function (e) { if (e.persisted) check(true); });
  }
  if (document.readyState === "complete") start(); else addEventListener("load", start);

  window.DactyloUpdate = { check: check, pending: function () { return pending; } };
})();
