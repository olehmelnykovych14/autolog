require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
    console.log('📦 Using service account from file.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('☁️ Using service account from environment variables.');
  } else {
    throw new Error('No Firebase service account credentials found!');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('❌ CRITICAL ERROR initializing Firebase Admin:', err.message);
  process.exit(1); 
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🚗 Мої Автомобілі', '📅 Мої Записи'],
      ['💳 Баланс та Оплати', '⚙️ Налаштування']
    ],
    resize_keyboard: true
  }
};

bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const snap = await db.collection('users').where('telegramId', '==', telegramId).get();
  
  if (snap.empty) {
    ctx.reply('Привіт! Ви ще не зареєстровані в AutoLog. Будь ласка, вкажіть ваш номер телефону для реєстрації:', {
      reply_markup: {
        keyboard: [[{ text: '📱 Поділитися контактом', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  } else {
    ctx.reply('З поверненням до AutoLog!', mainMenu);
  }
});

bot.on('contact', async (ctx) => {
  const phone = ctx.message.contact.phone_number.replace('+', '');
  const telegramId = ctx.from.id;
  const displayName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '');
  
  const snap = await db.collection('users').where('phone', '==', phone).get();
  
  if (!snap.empty) {
    const userDoc = snap.docs[0];
    await userDoc.ref.update({ telegramId, displayName });
    ctx.reply('✅ Ваш аккаунт синхронізовано з Telegram!', mainMenu);
  } else {
    await db.collection('users').add({
      phone,
      telegramId,
      displayName,
      role: 'driver',
      createdAt: Date.now()
    });
    ctx.reply('✅ Ви успішно зареєстровані в AutoLog!', mainMenu);
  }
});

// --- Background Listeners (Serverless Telegram Push) ---
db.collection('bookings').onSnapshot(async (snap) => {
  for (const change of snap.docChanges()) {
    try {
      const bData = change.doc.data();
      const bId = change.doc.id;

      if (change.type === 'added') {
        // 1. Нова заявка ДЛЯ СТО від водія
        if (bData.status === 'pending' && !bData.notifiedSTO) {
          await change.doc.ref.update({ notifiedSTO: true });
          const stoDoc = await db.collection('users').doc(String(bData.stoId)).get();
          if (stoDoc.exists && stoDoc.data().telegramId) {
            const carDoc = await db.collection('cars').doc(String(bData.carId)).get();
            const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
            bot.telegram.sendMessage(
              stoDoc.data().telegramId, 
              `📅 *Нова заявка на ремонт!*\n\nКлієнт: *${driverDoc.exists ? (driverDoc.data().displayName || 'Клієнт') : 'Клієнт'}*\nАвто: *${carDoc.exists ? (carDoc.data().brand + ' ' + carDoc.data().plate) : 'Невідомо'}*\nЧас: *${bData.date} ${bData.time}*\nПроблема: ${bData.issue}`,
              { parse_mode: 'Markdown' }
            ).catch(e => console.error('STO notify error:', e));
          }
        }

        // 2. СТО додало запис (сповіщення ВОДІЮ)
        if (bData.status === 'confirmed' && bData.creator === 'sto' && !bData.notifiedClient) {
          await change.doc.ref.update({ notifiedClient: true });
          const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
          if (driverDoc.exists && driverDoc.data().telegramId) {
            const stoDoc = await db.collection('users').doc(String(bData.stoId)).get();
            const stoName = stoDoc.exists ? (stoDoc.data().stoName || 'AutoLog') : 'AutoLog';
            
            bot.telegram.sendMessage(
              driverDoc.data().telegramId, 
              `✅ СТО *${stoName}* додало вас у графік!\n\n📅 Дата: *${bData.date}*\n⏰ Час: *${bData.time}*\n🛠 Робота: *${bData.issue}*`, 
              { parse_mode: 'Markdown' }
            ).catch(e => console.error('Client notify error:', e));
          }
        }
      }

      if (change.type === 'modified') {
        const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
        if (driverDoc.exists && driverDoc.data().telegramId) {
          const tid = driverDoc.data().telegramId;
          const stoDoc = await db.collection('users').doc(String(bData.stoId)).get();
          const stoName = stoDoc.exists ? (stoDoc.data().stoName || 'AutoLog') : 'AutoLog';

          if (bData.status === 'confirmed' && !bData.notifiedConfirmed) {
            await change.doc.ref.update({ notifiedConfirmed: true });
            bot.telegram.sendMessage(tid, `✅ Ваш запис на СТО *${stoName}* підтверджено!\n📅 ${bData.date} о ${bData.time}`, { parse_mode: 'Markdown' }).catch(e => null);
          }
          
          if (bData.status === 'rejected' && !bData.notifiedRejected) {
            await change.doc.ref.update({ notifiedRejected: true });
            bot.telegram.sendMessage(tid, `❌ Ваш запис на СТО *${stoName}* було відхилено.`, { parse_mode: 'Markdown' }).catch(e => null);
          }
        }
      }
    } catch (e) {
      console.error('[BOT ERROR] Processing change:', e);
    }
  }
});

bot.launch().then(() => {
  console.log('🤖 AutoLog Bot started with Firestore Listeners...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
