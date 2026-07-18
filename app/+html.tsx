// Coquille HTML du build WEB (mécanisme officiel expo-router : ce fichier
// n'est PAS une route — il enveloppe chaque page du export statique).
// Créé au point 25 (PWA) : manifest, icônes, theme-color, service worker.
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Enregistrement du service worker — JAMAIS sur le serveur de dev Expo
// (port 8081) : le SW y polluerait le cache pendant le développement.
// Sur le build servi (localhost:autre-port, tunnel, prod) : actif.
const SW_REGISTRATION = `
if ('serviceWorker' in navigator && window.location.port !== '8081') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js');
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>ManifestMind</title>
        <meta
          name="description"
          content="365 cycles de transformation guidée : affirmations, actions, visualisation, journal et vision board."
        />
        {/* PWA — point 25 */}
        <meta name="theme-color" content="#F0EAE0" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ManifestMind" />
        {/* Reset de scroll expo-router (comportement natif du ScrollView web) */}
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTRATION }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
