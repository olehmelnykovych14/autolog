require('dotenv').config();
const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const fs = require('fs');

async function diagnose() {
    console.log("🔍 ПОЧАТОК ДІАГНОСТИКИ БОТА...");
    
    // 1. Check BOT_TOKEN
    const token = process.env.BOT_TOKEN;
    if (!token) {
        console.error("❌ ПОМИЛКА: BOT_TOKEN не знайдено в .env");
    } else {
        console.log(`✅ BOT_TOKEN знайдено: ${token.substring(0, 5)}...`);
        try {
            const bot = new Telegraf(token);
            const me = await bot.telegram.getMe();
            console.log(`✅ Telegram API: OK! Ім'я бота: @${me.username}`);
        } catch (e) {
            console.error(`❌ Telegram API: ПОМИЛКА! ${e.message}`);
        }
    }

    // 2. Check Firebase
    console.log("🔍 Перевірка Firebase...");
    try {
        let serviceAccount;
        if (fs.existsSync('./serviceAccountKey.json')) {
            serviceAccount = require('./serviceAccountKey.json');
            console.log("✅ Файл serviceAccountKey.json знайдено.");
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("✅ FIREBASE_SERVICE_ACCOUNT знайдено в env.");
        }

        if (!serviceAccount) {
            console.error("❌ Firebase Credentials не знайдено.");
        } else {
            if (!admin.apps.length) {
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            }
            const db = admin.firestore();
            console.log("⏳ Спроба прочитати колекцію users...");
            const snap = await db.collection('users').limit(1).get();
            console.log(`✅ Firestore: OK! Знайдено ${snap.size} користувачів.`);
        }
    } catch (e) {
        console.error(`❌ Firebase: ПОМИЛКА! ${e.message}`);
        if (e.message.includes('UNAUTHENTICATED')) {
            console.error("⚠️ Схоже, ключі Firebase заблоковані або невірні.");
        }
    }

    process.exit();
}

diagnose();
