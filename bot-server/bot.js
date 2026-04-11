const { Telegraf, session, Markup } = require('telegraf');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- AI Setup ---
const API_KEY = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

if (API_KEY) {
  console.log(`🤖 BOT AI: Initialized with key starting with: ${API_KEY.substring(0, 4)}...`);
} else {
  console.warn("🤖 BOT AI: API_KEY is missing in Environment Variables!");
}

const askGemini = async (prompt, isImage = false, base64 = null) => {
  if (!API_KEY) return "Помилка: API Ключ не знайдено в налаштуваннях сервера.";
  
  const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
  const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

  // 1. Спроба через SDK
  if (genAI) {
    for (const modelName of models) {
      try {
        console.log(`🤖 BOT AI (SDK) trying: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
        let result;
        if (isImage && base64) {
          result = await model.generateContent([promptText, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
        } else {
          result = await model.generateContent(promptText);
        }
        return result.response.text();
      } catch (e) {
        console.warn(`⚠️ BOT SDK failed for ${modelName}: ${e.message}`);
      }
    }
  }

  // 2. План Б: Прямий FETCH
  console.log("🚀 BOT AI: SDK failed. Switching to direct HTTP fallback...");
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const payload = {
      contents: [{
        parts: isImage ? [
          { text: promptText },
          { inlineData: { mimeType: "image/jpeg", data: base64 } }
        ] : [{ text: promptText }]
      }]
    };

    const response = await axios.post(url, payload);
    const data = response.data;
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI повернув порожню відповідь.";

  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error("❌ BOT AI Direct Error:", msg);
    return `Помилка AI: ${msg}. Перевірте налаштування ключа в Google AI Studio.`;
  }
};

// Health check server for Render
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('AutoLog Bot is active! 🤖'));
app.listen(port, () => console.log(`🌍 Health check server listening on port ${port}`));

let serviceAccount;
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    throw new Error('No Firebase service account credentials found!');
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (err) {
  console.error('❌ Firebase Init Error:', err.message);
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

// middleware to find User in DB
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  const tid = ctx.from.id.toString();
  try {
    const snap = await db.collection('users').where('telegramId', '==', tid).get();
    if (!snap.empty) {
      ctx.userData = snap.docs[0].data();
      ctx.userId = snap.docs[0].id;
    }
  } catch (e) { console.error('Middleware error:', e); }
  return next();
});

const mainMenu = Markup.keyboard([
  ['🚗 Мої Автомобілі', '📅 Мої Записи'],
  ['💰 Витрати', '🧾 Додати запис (AI)'],
  ['⚙️ Налаштування', '❓ Допомога']
]).resize();

// --- Helpers ---
const fmtCost = (v) => v ? Number(v).toLocaleString('uk-UA') : '0';

bot.start(async (ctx) => {
  if (ctx.userData) {
    return ctx.reply(`З поверненням, ${ctx.userData.displayName || 'водій'}! 👋`, mainMenu);
  }
  ctx.reply('Привіт! Ви ще не зареєстровані в AutoLog. Будь ласка, вкажіть ваш номер телефону для реєстрації:', {
    reply_markup: {
      keyboard: [[{ text: '📱 Поділитися контактом', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('contact', async (ctx) => {
  const phone = ctx.message.contact.phone_number.replace('+', '');
  const telegramId = ctx.from.id.toString();
  const displayName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '');
  
  const snap = await db.collection('users').where('phone', '==', phone).get();
  
  if (!snap.empty) {
    await snap.docs[0].ref.update({ telegramId, displayName });
    ctx.reply('✅ Ваш аккаунт синхронізовано!', mainMenu);
  } else {
    await db.collection('users').add({ phone, telegramId, displayName, role: 'driver', createdAt: Date.now() });
    ctx.reply('✅ Ви успішно зареєстровані!', mainMenu);
  }
});

bot.hears('🚗 Мої Автомобілі', async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  const snap = await db.collection('cars').where('userId', '==', ctx.userId).get();
  if (snap.empty) return ctx.reply('Ваш гараж порожній.');
  let text = `🚗 *Ваш Гараж:*\n\n`;
  snap.forEach(d => {
    const c = d.data();
    text += `📍 *${c.brand} ${c.model || ''}*\n🔢 Номер: \`${c.plate}\`\n\n`;
  });
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears('📅 Мої Записи', async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  const snap = await db.collection('history').where('userId', '==', ctx.userId).get();
  if (snap.empty) return ctx.reply('Записів не знайдено.');
  const records = snap.docs.map(d => d.data()).sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  let text = `📅 *Останні записи:*\n\n`;
  records.forEach(r => {
    text += `🔹 *${r.title}* (${r.date})\n💰 ${fmtCost(r.cost)} ₴\n\n`;
  });
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears('💰 Витрати', async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  const snap = await db.collection('history').where('userId', '==', ctx.userId).get();
  let total = 0;
  snap.forEach(d => total += (Number(d.data().cost) || 0));
  ctx.reply(`💰 *Загальні витрати:*\n\nВи витратили: *${fmtCost(total)} ₴*`, { parse_mode: 'Markdown' });
});

bot.hears('❓ Допомога', (ctx) => {
  ctx.reply('❓ *Як користуватися:*\n\n1. Просто напишіть мені будь-яке питання про авто.\n2. Надішліть **фото чека з СТО**, і я автоматично додам його у вашу історію.', { parse_mode: 'Markdown' });
});

bot.hears('🧾 Додати запис (AI)', (ctx) => ctx.reply('📸 Надішліть фото чека СТО. Я проаналізую його автоматично.'));

bot.on('photo', async (ctx) => {
  if (!ctx.userId) return ctx.reply('❌ Будь ласка, спочатку зареєструйтесь.');
  const loading = await ctx.reply('🤖 Аналізую чек через AI...');
  
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(link.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');

    const prompt = `Аналізуй цей чек СТО. Поверни ТІЛЬКИ JSON:
{
  "title": "Назва сервісу коротко",
  "cost": 1500,
  "date": "YYYY-MM-DD",
  "plate": "НОМЕР_АВТО",
  "mileage": 120000
}`;

    const aiResponse = await askGemini(prompt, true, base64);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI didn't return valid JSON");
    
    const data = JSON.parse(jsonMatch[0]);
    ctx.session.pendingRecord = {
      title: data.title || 'Автосервіс',
      cost: Number(data.cost) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      km: data.mileage || 0,
      status: 'verified'
    };

    const text = `✅ *Чек розпізнано!*\n\n🛠 Робота: *${ctx.session.pendingRecord.title}*\n💰 Сума: *${fmtCost(ctx.session.pendingRecord.cost)} ₴*\n📅 Дата: *${ctx.session.pendingRecord.date}*\n\n*Куди зберегти цей запис?*`;
    
    // Get user cars for buttons
    const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    if (carsSnap.empty) {
      return ctx.reply(text + "\n\n⚠️ У вас немає доданих авто. Додайте авто в додатку.", { parse_mode: 'Markdown' });
    }

    const buttons = carsSnap.docs.map(d => [Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `save_rec_${d.id}`)]);
    buttons.push([Markup.button.callback('❌ Скасувати', 'cancel_rec')]);

    ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });

  } catch (e) {
    console.error('Photo error:', e);
    ctx.reply('❌ Не вдалося розпізнати чек. Спробуйте інше фото або додайте вручну.');
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
  }
});

bot.action(/save_rec_(.+)/, async (ctx) => {
  const carId = ctx.match[1];
  if (!ctx.session.pendingRecord) return ctx.answerCbQuery('Дані застаріли');
  
  try {
    await db.collection('history').add({
      ...ctx.session.pendingRecord,
      carId,
      userId: ctx.userId,
      createdAt: Date.now()
    });
    ctx.editMessageText('✅ Запис успішно додано в історію вашого авто!');
  } catch (e) {
    ctx.reply('❌ Помилка збереження.');
  }
});

bot.action('cancel_rec', (ctx) => ctx.editMessageText('❌ Скасовано.'));

// AI Mechanic Chat (Catch-all for text)
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return; // ignore other cmds
  if (!ctx.userId) return; // ignore unregistered users for chat or keep it?
  
  const wait = await ctx.reply('🤔 Думаю...');
  try {
    const response = await askGemini(`Ти — AI Механік AutoLog. Клієнт питає: "${ctx.message.text}". Дай коротку професійну пораду українською.`);
    ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('Ой, я трохи втомився. Спробуй пізніше! 😴');
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, wait.message_id).catch(() => {});
  }
});

// Notifications listener
db.collection('bookings').onSnapshot(async (snap) => {
  for (const change of snap.docChanges()) {
    try {
      const bData = change.doc.data();
      if (change.type === 'added') {
        if (bData.status === 'pending' && !bData.notifiedSTO) {
          await change.doc.ref.update({ notifiedSTO: true });
          const stoDoc = await db.collection('users').doc(String(bData.stoId)).get();
          if (stoDoc.exists && stoDoc.data().telegramId) {
            const carDoc = await db.collection('cars').doc(String(bData.carId)).get();
            const driverDoc = await db.collection('users').doc(String(bData.userId)).get();
            bot.telegram.sendMessage(
              stoDoc.data().telegramId, 
              `📅 *Нова заявка!*\nКлієнт: *${driverDoc.exists ? (driverDoc.data().displayName || 'Клієнт') : 'Клієнт'}*\nАвто: *${carDoc.exists ? (carDoc.data().brand + ' ' + carDoc.data().plate) : 'Невідомо'}*\nПроблема: ${bData.issue}`,
              { parse_mode: 'Markdown' }
            ).catch(() => null);
          }
        }
      }
    } catch (e) {}
  }
});

bot.launch().then(() => console.log('🤖 AutoLog Bot is Online & Smart!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
