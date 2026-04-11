require('dotenv').config();
const _now = Date.now;
Date.now = () => _now() - (1000 * 60 * 60); // -60 minutes (1 hour)
const admin = require('firebase-admin');

async function test() {
    const sa = require('./serviceAccountKey.json');
    console.log(`🔍 Тестуємо акаунт: ${sa.client_email}`);
    
    try {
        if (!admin.apps.length) {
            admin.initializeApp({ credential: admin.credential.cert(sa) });
        }
        
        console.log("⏳ Спроба отримати список користувачів (Auth)... ");
        const authResult = await admin.auth().listUsers(1);
        console.log("✅ Auth: ПРАЦЮЄ!");

        console.log("⏳ Спроба отримати дані Firestore...");
        await admin.firestore().collection('users').limit(1).get();
        console.log("✅ Firestore: ПРАЦЮЄ!");
        
        console.log("🎉 ВСЕ ПРАЦЮЄ!");
        process.exit(0);
    } catch (e) {
        console.error("❌ ПОМИЛКА:", e.message);
        if (e.message.includes('UNAUTHENTICATED')) {
            console.error("⚠️ ВИСНОВОК: Google відхиляє цей ключ. Будь ласка, згенеруйте ключ для ОФІЦІЙНОГО акаунта (firebase-adminsdk-xxxxx@...).");
        }
        process.exit(1);
    }
}

test();
