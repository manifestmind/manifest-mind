// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — Service Worker MINIMAL (3 règles, point 25)
// ─────────────────────────────────────────────────────────────────────────────
//
// 🚨 CONTRAT DE SÉCURITÉ (ne pas « améliorer » sans relire claude_master.md) :
//   RÈGLE 1 — HTML/navigations : RÉSEAU D'ABORD. Le cache ne sert QUE hors
//             ligne → impossible de rester coincé sur une vieille version.
//   RÈGLE 2 — Bundles hashés (/_expo/) + assets + icônes : CACHE D'ABORD.
//             Leurs noms changent à chaque build → cacher est sans risque
//             par construction (un nouveau build = de nouveaux noms).
//   RÈGLE 3 — CROSS-ORIGIN et non-GET : JAMAIS INTERCEPTÉS. Paddle.js,
//             Firestore, Google Auth, fonts ne voient même pas ce SW —
//             le chemin de l'argent et l'auth restent intacts.
//
// Cycle de mise à jour : celui du navigateur par défaut (pas de skipWaiting) —
// un nouveau SW s'active quand tous les onglets de l'ancienne version sont
// fermés. Incrémenter CACHE ('mm-v2', …) si le format du cache change un jour.

const CACHE = 'mm-v1';

self.addEventListener('activate', (event) => {
  // Purge des caches d'anciennes versions.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // RÈGLE 3 — jamais de non-GET, jamais de cross-origin.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // RÈGLE 1 — navigations : réseau d'abord, cache seulement hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // RÈGLE 2 — immuables (bundles hashés, assets, icônes) : cache d'abord.
  if (
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
  }
  // Tout le reste (manifest, robots, etc.) : réseau pur, aucune interception.
});
