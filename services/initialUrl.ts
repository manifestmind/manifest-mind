// Capture de l'URL d'origine AU CHARGEMENT DU MODULE.
//
// Sur web, c'est le SEUL instant où window.location.href contient encore les
// paramètres du magic link (?apiKey=…&oobCode=…&mode=signIn). Dès qu'expo-router
// s'initialise (rendu + effets) ou qu'un guard fait router.replace, ces params
// disparaissent de la barre d'URL. Un `const` au niveau module s'évalue à
// l'import — donc AVANT tout rendu React, tout useEffect et tout routage.
//
// Ce module ne dépend de rien d'autre : il doit être importé le plus tôt
// possible (en tête de app/_layout.tsx et app/index.tsx) pour être évalué
// parmi les tout premiers modules.

export const INITIAL_WEB_HREF: string | null =
  typeof window !== 'undefined' && window.location ? window.location.href : null;

if (__DEV__ && INITIAL_WEB_HREF) {
  // Log tout au début, avant tout routage — confirme qu'on capte bien le href
  // original avec ses params.
  // eslint-disable-next-line no-console
  console.log('[boot] INITIAL_WEB_HREF (module load) =', INITIAL_WEB_HREF);
}
