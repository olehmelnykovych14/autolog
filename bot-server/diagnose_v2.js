require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

async function test() {
    const sa = require('./serviceAccountKey.json');
    console.log(`✅ Проект: ${sa.project_id}`);
    console.log(`✅ Імейл: ${sa.client_email}`);
    console.log(`✅ Системний час (Local): ${new Date().toLocaleString()}`);
    console.log(`✅ Системний час (ISO): ${new Date().toISOString()}`);
    
    try {
        if (!admin.apps.length) {
            admin.initializeApp({ 
                credential: admin.credential.cert(sa)
            });
        }
        const db = admin.firestore();
        console.log("⏳ Спроба запиту до БД...");
        const snap = await db.collection('users').limit(1).get();
        console.log("🎉 КОННЕКТ ВСТАНОВЛЕНО! Бот працює.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ПОМИЛКА:", e.message);
        if (e.stack) console.error("Деталі:", e.stack.split('\n')[0]);
        process.exit(1);
    }
}

test();
