// Test du webhook Paddle avec une signature HMAC valide
// ─────────────────────────────────────────────────────────────────────────────
//
// USAGE PowerShell (Windows) :
//
//   $env:PADDLE_WEBHOOK_SECRET = "<colle la valeur du dashboard Paddle>"
//   $env:TEST_FIREBASE_UID = "TEST_WEBHOOK_LOCAL_001"   # ou ton UID Firebase réel
//   node scripts/test-webhook.js
//
//   # Important : efface le secret de l'env shell après le test
//   Remove-Item Env:PADDLE_WEBHOOK_SECRET
//
// Le script POSTe un faux événement subscription.activated avec une signature
// HMAC-SHA256 valide. La function devrait renvoyer 200 OK et écrire dans
// Firestore users/{TEST_FIREBASE_UID}.subscription_active = true.
//
// ⚠️ Si tu utilises ton UID réel, ta subscription_active sera mise à true
//    dans Firestore en prod — tu peux la repasser à false manuellement
//    dans la Console Firestore après le test, ou supprimer le doc users/{uid}.

const crypto = require('crypto');

// URL stable cloudfunctions.net — alias Firebase garanti permanent.
// L'URL Cloud Run directe (paddlewebhook-<hash>-ew.a.run.app) est REGENEREE
// à chaque redeploy Firebase Functions 2nd gen, ce qui casse Paddle dashboard
// et tout script qui hardcode l'ancien hash. cloudfunctions.net route vers
// le même service et reste fixe pour toujours.
const URL = 'https://europe-west1-manifestmind.cloudfunctions.net/paddleWebhook';
const SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const UID = process.env.TEST_FIREBASE_UID || 'TEST_WEBHOOK_LOCAL_001';

if (!SECRET) {
  console.error('❌ PADDLE_WEBHOOK_SECRET env var manquante.');
  console.error('   PowerShell : $env:PADDLE_WEBHOOK_SECRET = "..."');
  process.exit(1);
}

const body = JSON.stringify({
  event_id: `evt_test_local_${Date.now()}`,
  event_type: 'subscription.activated',
  occurred_at: new Date().toISOString(),
  data: {
    id: 'sub_test_local_001',
    status: 'active',
    customer_id: 'ctm_test_local_001',
    subscription_id: 'sub_test_local_001',
    custom_data: {
      firebase_uid: UID,
      selected_plan: 'annuel',
    },
  },
});

const ts = Math.floor(Date.now() / 1000).toString();
const payload = `${ts}:${body}`;
const h1 = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
const signature = `ts=${ts};h1=${h1}`;

console.log(`→ POST ${URL}`);
console.log(`→ firebase_uid: ${UID}`);
console.log(`→ event_type: subscription.activated`);
console.log('');

fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Paddle-Signature': signature,
  },
  body,
})
  .then(async (res) => {
    const text = await res.text();
    console.log(`← HTTP ${res.status}`);
    console.log(`← Body: ${text || '(empty)'}`);
    console.log('');
    if (res.status === 200) {
      console.log('✅ Webhook a accepté la requête.');
      console.log(`   Vérifie Firestore : users/${UID}.subscription_active === true`);
      console.log('   Vérifie Logs Firebase : "[paddle] users/' + UID + ' updated: subscription_active=true"');
    } else if (res.status === 401) {
      console.log('⚠️  401 → secret invalide. Vérifie que la valeur de PADDLE_WEBHOOK_SECRET');
      console.log('   correspond exactement à celle du dashboard Paddle.');
    } else {
      console.log('⚠️  Réponse inattendue. Consulte les logs Firebase Functions.');
    }
  })
  .catch((e) => {
    console.error('❌ Fetch error:', e.message);
    process.exit(2);
  });
