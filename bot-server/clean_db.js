const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const _now = Date.now; 
Date.now = () => _now() - (1000 * 60 * 60 * 2);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clean() {
  console.log('🔄 Глибоке очищення дублікатів...');
  const snap = await db.collection('history').get();
  const seen = new Set();
  let deleted = 0;

  for (const doc of snap.docs) {
    const r = doc.data();
    // Unique key: User + Date + Cost
    const key = `${r.userId}|${r.date}|${String(r.cost).trim()}`;
    
    if (seen.has(key)) {
      await doc.ref.delete();
      deleted++;
    } else {
      seen.add(key);
    }
  }
  
  console.log(`✅ Очищення завершено! Видалено: ${deleted} запису(ів).`);
  process.exit(0);
}

clean().catch(e => {
  console.error(e);
  process.exit(1);
});
