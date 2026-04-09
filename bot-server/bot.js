require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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

// AI Record logic (simplified context)
bot.action(/select_car_(.+)/, async (ctx) => {
  const carDocId = ctx.match[1];
  try {
    const carSnap = await db.collection('cars').doc(carDocId).get();
    const carData = carSnap.data();
    await db.collection('history').add({ ...ctx.session.pendingRecord, carId: carDocId, userId: ctx.userId, createdAt: Date.now() });
    await ctx.editMessageText(`✅ Збережено для *${carData.brand}*!`, { parse_mode: 'Markdown' });
    await ctx.reply('Головне меню:', mainMenu);
  } catch (e) { ctx.reply('❌ Помилка.'); }
});

bot.action('cancel_ai_record', (ctx) => ctx.editMessageText('❌ Скасовано.'));

// --- Background Listeners (Serverless Telegram Push) ---
db.collection('bookings').onSnapshot(async (snap) => {
  for (const change of snap.docChanges()) {
    try {
      const bData = change.doc.data();
      const bId = change.doc.id;

      if (change.type === 'added') {
        // 1. Сповіщення СТО про нове бронювання від водія
        if (bData.status === 'pending' && !bData.notifiedSTO) {
          await change.doc.ref.update({ notifiedSTO: true });
          const stoDoc = await db.collection('users').doc(String(bData.stoId)).get();
          if (stoDoc.exists && stoDoc.data().telegramId) {
            const carDoc = await db.collection('cars').doc(String(bData.carId)).get();
            const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
            bot.telegram.sendMessage(
              stoDoc.data().telegramId, 
              `📅 *Нова заявка на ремонт!*\n\nКлієнт: *${driverDoc.exists ? driverDoc.data().displayName : 'Клієнт'}*\nАвто: *${carDoc.exists ? carDoc.data().brand + ' ' + carDoc.data().plate : 'Невідомо'}*\nЧас: *${bData.date} ${bData.time}*\nПроблема: ${bData.issue}`,
              { parse_mode: 'Markdown' }
            ).catch(e => console.error('STO notify error:', e));
          }
        }

        // 2. Сповіщення водія про те, що СТО самостійно додало запис
        if (bData.status === 'confirmed' && bData.creator === 'sto' && !bData.notifiedClient) {
          await change.doc.ref.update({ notifiedClient: true });
          const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
          if (driverDoc.exists && driverDoc.data().telegramId) {
            bot.telegram.sendMessage(
              driverDoc.data().telegramId, 
              `✅ СТО додало запис для вас!\n\n📅 Дата: *${bData.date}*\n⏰ Час: *${bData.time}*\n🛠 Робота: *${bData.issue}*`, 
              { parse_mode: 'Markdown' }
            ).catch(e => console.error('Client notify error:', e));
          }
        }
      }

      if (change.type === 'modified') {
        const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
        if (driverDoc.exists && driverDoc.data().telegramId) {
          const tid = driverDoc.data().telegramId;
          
          if (bData.status === 'confirmed' && !bData.notifiedConfirmed) {
            await change.doc.ref.update({ notifiedConfirmed: true });
            bot.telegram.sendMessage(tid, `✅ Ваш запис підтверджено!\n📅 ${bData.date} о ${bData.time}`, { parse_mode: 'Markdown' }).catch(e => null);
          }
          
          if (bData.status === 'rejected' && !bData.notifiedRejected) {
            await change.doc.ref.update({ notifiedRejected: true });
            bot.telegram.sendMessage(tid, `❌ Ваш запис було відхилено.`, { parse_mode: 'Markdown' }).catch(e => null);
          }
        }
      }
    } catch (e) {
      console.error('[BOT ERROR] Error processing change:', e);
    }
  }
});

bot.launch();
console.log('🤖 AutoLog Bot started with Firestore Listeners...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
