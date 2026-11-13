/* Service worker de Dactylo

   Hors ligne : tout le site est mis en cache à l'installation.

   Mises à jour automatiques : les fichiers du site (SHELL) sont revérifiés auprès du serveur à chaque ouverture
   et sur demande de la page (message "check"). Si l'un d'eux a changé, le cache est mis à jour et les pages ouvertes
   reçoivent le message "dactylo-update" : update.js recharge alors la page dès que c'est possible.
   Il n'y a donc plus de numéro de version à changer à la main quand on modifie app.js, piano.js, style.css, etc.

   Les gros fichiers qui ne changent presque jamais (STATIC : sons, polices, icônes, three.min.js) sont servis depuis
   le cache sans revérification. Si vous en remplacez un en gardant le même nom, changez V : cela relance tout. */
const V = "dactylo-v42";

const SHELL = ["./", "index.html", "style.css", "app.js", "piano.js", "3d.js", "update.js", "manifest.webmanifest"];
const STATIC = [
  "three.min.js", "icons/icon-192.png", "icons/icon-512.png",
  "fonts/jetbrains-mono-latin-400-normal.woff2", "fonts/jetbrains-mono-latin-700-normal.woff2",
  "fonts/pixelify-sans-latin-400-normal.woff2", "fonts/pixelify-sans-latin-700-normal.woff2",
  "fonts/poppins-latin-400-normal.woff2", "fonts/poppins-latin-600-normal.woff2",
  "fonts/press-start-2p-latin-400-normal.woff2",
  "sounds/piano/A3.mp3", "sounds/piano/A4.mp3", "sounds/piano/A5.mp3", "sounds/piano/Ab4.mp3",
  "sounds/piano/B4.mp3", "sounds/piano/Bb4.mp3",
  "sounds/piano/C3.mp3", "sounds/piano/C4.mp3", "sounds/piano/C5.mp3", "sounds/piano/C6.mp3",
  "sounds/piano/D4.mp3", "sounds/piano/D5.mp3", "sounds/piano/Db4.mp3", "sounds/piano/Db5.mp3",
  "sounds/piano/E4.mp3", "sounds/piano/E5.mp3",
  "sounds/piano/Eb3.mp3", "sounds/piano/Eb4.mp3", "sounds/piano/Eb5.mp3", "sounds/piano/Eb6.mp3",
  "sounds/piano/F4.mp3", "sounds/piano/G4.mp3", "sounds/piano/Gb3.mp3", "sounds/piano/Gb4.mp3"
];

const scope = self.registration.scope;
const url = (p) => new URL(p, scope).href;
const SHELL_URLS = SHELL.map(url);

/* fichier du site (ou page ouverte) : revérifié ; le reste : cache d'abord */
function isShell(req) {
  const u = new URL(req.url);
  u.search = "";
  u.hash = "";
  return req.mode === "navigate" || SHELL_URLS.indexOf(u.href) >= 0;
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(V);
    /* cache:"reload" : on ne se contente pas de la copie du navigateur. Un fichier absent n'empêche pas l'installation. */
    await Promise.all(SHELL.concat(STATIC).map((p) =>
      cache.add(new Request(url(p), { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();   // la nouvelle version prend la main tout de suite
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.url.indexOf(scope) !== 0) return;
  e.respondWith(respond(req, e));
});

async function respond(req, e) {
  const cache = await caches.open(V);
  const cached = await cache.match(req);
  if (isShell(req)) {
    /* on répond tout de suite avec la copie en cache, et on vérifie en arrière-plan si le serveur a du nouveau */
    const refresh = revalidate(req, cache, cached && cached.clone());
    e.waitUntil(refresh.catch(() => {}));
    if (cached) return cached;
    try { return await refresh; }
    catch (err) { return (await cache.match(url("index.html"))) || Response.error(); }
  }
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (req.mode === "navigate" && (await cache.match(url("index.html")))) || Response.error();
  }
}

/* redemande le fichier au serveur (requête conditionnelle : 304 si rien n'a changé), met le cache à jour,
   et prévient les pages ouvertes si le contenu est différent de la copie en cache */
async function revalidate(req, cache, cached) {
  const res = await fetch(new Request(req.url, { cache: "no-cache" }));
  if (!res.ok) return res;
  const changed = cached ? !(await sameBody(cached, res.clone())) : false;
  await cache.put(req, res.clone());
  if (changed) await notifyClients();
  return res;
}

async function sameBody(a, b) {
  return (await a.text()) === (await b.text());
}

async function notifyClients() {
  for (const c of await self.clients.matchAll({ type: "window" })) c.postMessage({ type: "dactylo-update" });
}

/* la page demande une vérification (au retour sur l'appli, toutes les 5 minutes…) */
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "check") e.waitUntil(checkAll());
});

async function checkAll() {
  const cache = await caches.open(V);
  await Promise.all(SHELL_URLS.map(async (u) => {
    const req = new Request(u);
    try { await revalidate(req, cache, await cache.match(req)); } catch (err) {}
  }));
}
