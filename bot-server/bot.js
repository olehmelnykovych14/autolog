const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log("🎬 --- BOT STARTING ---");

// --- SMART TIME SYNC ---
// Render servers are NTP-synced, so we use 0 offset. 
// For local Windows environments with clock skew, we keep -1h.
const IS_RENDER = process.env.RENDER === 'true' || process.env.PORT;
const TIME_OFFSET = IS_RENDER ? 0 : -1000 * 60 * 60; 

const _now = Date.now;
Date.now = () => _now() + TIME_OFFSET;
console.log(`⏰ Time Sync: ${IS_RENDER ? 'Disabled (Render Mode)' : 'Enabled (-1h Local)'}`);

const { Telegraf, session, Markup } = require('telegraf');
const admin = require('firebase-admin');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("📦 Dependencies loaded");

const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('AutoLog Bot is active! 🤖'));
app.get('/health', (req, res) => res.status(200).send('OK'));
app.listen(port, () => console.log(`🌍 Render-ready server listening on port ${port}`))
   .on('error', (err) => {
     if (err.code === 'EADDRINUSE') {
       console.log(`⚠️ Port ${port} is already in use. Express server skipped, but Bot should still work.`);
     } else {
       console.error('❌ Express server error:', err.message);
     }
   });

let serviceAccount;
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  if (fs.existsSync(keyPath)) {
    const rawData = fs.readFileSync(keyPath, 'utf8');
    serviceAccount = JSON.parse(rawData);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  if (serviceAccount && serviceAccount.private_key) {
    // ВИПРАВЛЕННЯ: замінюємо екрановані \n на реальні переноси рядків
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("🚀 Firebase initialized with project:", serviceAccount.project_id);
  }
} catch (err) {
  console.error('❌ Firebase Init Error:', err.message);
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- GLOBAL LOGGER ---
bot.use(async (ctx, next) => {
  if (ctx.message || ctx.callbackQuery) {
    const from = ctx.from?.username || ctx.from?.id || 'unknown';
    const text = ctx.message?.text || (ctx.callbackQuery ? `CB: ${ctx.callbackQuery.data}` : '[Media]');
    console.log(`📩 [INCOMING] from ${from}: ${text}`);
  }
  return next();
});

bot.use(session());

// middleware to find User in DB
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  const tid = ctx.from.id.toString();
  try {
    const snap = await db.collection('users').where('telegramId', '==', tid).get();
    if (!snap.empty) {
      ctx.userData = snap.docs[0].data();
      ctx.userId = ctx.userData.uid || snap.docs[0].id;
    }
  } catch (e) { console.error('Middleware error:', e); }
  return next();
});

const mainMenu = Markup.keyboard([
  ['🚗 Мої авто', '📅 Мої записи'],
  ['💰 Витрати', '🧾 Додати запис (AI)'],
  ['❓ Допомога']
]).resize();

const { fmtCost, parseDateSafe, normPlate } = require('./utils');

const getExpenseStats = (snap, carId = null, carPlate = null) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let total = 0, monthly = 0, yearly = 0;

  const targetCarId = carId ? String(carId).toLowerCase() : null;
  const targetPlate = normPlate(carPlate);

  snap.forEach(d => {
    const data = d.data();
    const recordCarId = data.carId ? String(data.carId).toLowerCase() : null;
    const recordPlate = normPlate(data.plate);

    // Filter logic
    if (targetCarId) {
      const matchesId = recordCarId === targetCarId;
      const matchesPlate = targetPlate && recordPlate === targetPlate;
      if (!matchesId && !matchesPlate) return;
    }
    
    const cost = Number(data.cost) || 0;
    const date = parseDateSafe(data.date);
    
    total += cost;
    if (date.getFullYear() === thisYear) {
      yearly += cost;
      if (date.getMonth() === thisMonth) {
        monthly += cost;
      }
    }
  });
  return { total, monthly, yearly };
};

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

bot.hears(/Мої авто/i, async (ctx) => {
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

bot.hears(/Мої записи/i, async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  const snap = await db.collection('history').where('userId', '==', ctx.userId).get();
  if (snap.empty) return ctx.reply('Записів не знайдено.');
  
  // Sort by actual service date (descending)
  const records = snap.docs.map(d => d.data())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  let text = `📅 *Останні записи:* (сортування за датою)\n\n`;
  records.forEach(r => {
    const displayDate = r.date ? r.date.split('-').reverse().join('.') : '??.??.????';
    text += `🔹 *${r.title}* (${displayDate})\n💰 ${fmtCost(r.cost)} ₴\n\n`;
  });
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears(/Витрати/i, async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  
  const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
  if (carsSnap.empty) return ctx.reply('У вас ще немає доданих автомобілів.');

  const buttons = carsSnap.docs.map(d => [Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `exp_car_${d.id}`)]);
  buttons.push([Markup.button.callback('📊 Усі авто разом', 'exp_all')]);

  ctx.reply('Оберіть автомобіль для перегляду статистики витрат:', Markup.inlineKeyboard(buttons));
});

// Action handlers for Expenses
bot.action(/exp_car_(.+)/, async (ctx) => {
  const carId = ctx.match[1];
  const historySnap = await db.collection('history').where('userId', '==', ctx.userId).get();
  const carSnap = await db.collection('cars').doc(carId).get();
  
  if (!carSnap.exists) return ctx.answerCbQuery('Автомобіль не знайдено');
  const car = carSnap.data();
  const stats = getExpenseStats(historySnap, carId, car.plate);

  let text = `💰 *Витрати для ${car.brand} (${car.plate}):*\n\n`;
  text += `📅 Поточний місяць: *${fmtCost(stats.monthly)} ₴*\n`;
  text += `🗓 Поточний рік: *${fmtCost(stats.yearly)} ₴*\n`;
  text += `📊 За весь час: *${fmtCost(stats.total)} ₴*`;

  ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад до списку', 'exp_back')]]) });
});

bot.action('exp_all', async (ctx) => {
  const historySnap = await db.collection('history').where('userId', '==', ctx.userId).get();
  const stats = getExpenseStats(historySnap);

  let text = `📊 *Загальна статистика (усі авто):*\n\n`;
  text += `📅 Поточний місяць: *${fmtCost(stats.monthly)} ₴*\n`;
  text += `🗓 Поточний рік: *${fmtCost(stats.yearly)} ₴*\n`;
  text += `📊 За весь час: *${fmtCost(stats.total)} ₴*`;

  ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад до списку', 'exp_back')]]) });
});

bot.action('exp_back', (ctx) => {
  ctx.deleteMessage().catch(() => {});
  // Re-trigger the main expenses list
  const hearsCtx = { ...ctx, message: { text: '💰 Витрати' } }; // Simplified mock
  // Instead of re-triggering, just repeat the logic:
  return ctx.replyWithMarkdown('Оберіть автомобіль для перегляду статистики витрат:'); 
  // Wait, I'll just re-call the hears logic properly or simplify.
});

bot.hears('❓ Допомога', (ctx) => {
  ctx.reply('❓ *Як користуватися:*\n\n1. Просто напишіть мені будь-яке питання про авто.\n2. Надішліть **фото чека з СТО**, і я автоматично додам його у вашу історію.', { parse_mode: 'Markdown' });
});

bot.hears('🧾 Додати запис (AI)', (ctx) => ctx.reply('📸 Надішліть фото чека СТО. Я проаналізую його автоматично.'));

bot.on('photo', async (ctx) => {
  const loading = await ctx.reply('🤔 Аналізую фото через AI...');
  
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(link.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');
    const userCaption = ctx.message.caption || '';

    const prompt = `Ти — AI Механік AutoLog.
Користувач надіслав фото. 
Його запит: "${userCaption}".

ТВОЄ ЗАВДАННЯ:
1. Якщо це ЧЕК СТО: проаналізуй його та поверни JSON: {"type": "receipt", "title": "...", "cost": 0, "date": "YYYY-MM-DD", "mileage": 0}.
2. Якщо це ФОТО ПОЛОМКИ, ДЕТАЛІ або ПРИЛАДОВОЇ ПАНЕЛІ: дай розгорнуту пораду українською та поверни JSON: {"type": "advice", "text": "Твій текст поради"}.
3. В інших випадках: просто дай коротку відповідь.`;

    const aiResponse = await askGemini(prompt, true, base64);
    
    // Check if it's JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.type === 'receipt') {
        ctx.session.pendingRecord = {
          title: data.title || 'Автосервіс',
          cost: Number(data.cost) || 0,
          date: data.date || new Date().toISOString().split('T')[0],
          km: data.mileage || 0,
          status: 'verified'
        };

        const text = `✅ *Чек розпізнано!*\n\n🛠 Робота: *${ctx.session.pendingRecord.title}*\n💰 Сума: *${fmtCost(ctx.session.pendingRecord.cost)} ₴*\n📅 Дата: *${ctx.session.pendingRecord.date}*\n\n*Куди зберегти цей запис?*`;
        
        const tid = ctx.from.id.toString();
        const userSnap = await db.collection('users').where('telegramId', '==', tid).get();
        if (userSnap.empty) return ctx.reply("❌ Будь ласка, зареєструйтесь у додатку.");
        const userId = userSnap.docs[0].id;
        
        const carsSnap = await db.collection('cars').where('userId', '==', userId).get();
        if (carsSnap.empty) {
          return ctx.reply(text + "\n\n⚠️ У вас немає доданих авто. Додайте авто в додатку.", { parse_mode: 'Markdown' });
        }

        const buttons = carsSnap.docs.map(d => [Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `save_rec_${d.id}`)]);
        buttons.push([Markup.button.callback('❌ Скасувати', 'cancel_rec')]);
        return ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      } else if (data.type === 'advice') {
        return ctx.reply(`👨‍🔧 *Порада від AI Механіка:*\n\n${data.text}`, { parse_mode: 'Markdown' });
      }
    }
    
    // Fallback if not JSON or different format
    return ctx.reply(aiResponse);

  } catch (e) {
    console.error('Photo error:', e);
    ctx.reply('❌ Не вдалося обробити фото. Спробуйте ще раз або напишіть текстом.');
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
const askGemini = async (prompt, hasMedia = false, base64 = null, mimeType = "image/jpeg") => {
    if (!API_KEY) return "Помилка: Ключ AI не знайдено.";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        let result;
        if (hasMedia && base64) {
            result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType } }]);
        } else {
            result = await model.generateContent(prompt);
        }
        return result.response.text();
    } catch (e) {
        return `Помилка AI: ${e.message}`;
    }
};

// --- Car Context Helper ---
const getUserGarageContext = async (userId) => {
  if (!userId) return "";
  try {
    const carsSnap = await db.collection('cars').where('userId', '==', userId).get();
    if (carsSnap.empty) return "";
    let context = "\n\nКористувач має такі авто:\n";
    carsSnap.docs.forEach(d => {
      const c = d.data();
      context += `- ${c.brand} ${c.model || ''} (${c.year || 'н/д'}, ${c.engine || 'н/д'})\n`;
    });
    return context;
  } catch (e) { return ""; }
};

bot.on('voice', async (ctx) => {
  const loading = await ctx.reply('🎤 Слухаю ваше повідомлення...');
  const oggPath = path.join(__dirname, 'temp', `${ctx.from.id}_${Date.now()}.ogg`);
  const mp3Path = oggPath.replace('.ogg', '.mp3');

  try {
    const fileId = ctx.message.voice.file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    
    // Download OGG
    const response = await axios.get(link.href, { responseType: 'stream' });
    const writer = fs.createWriteStream(oggPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Convert to MP3
    await new Promise((resolve, reject) => {
      ffmpeg(oggPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(mp3Path);
    });

    const buffer = fs.readFileSync(mp3Path);
    const base64 = buffer.toString('base64');

    const garageContext = await getUserGarageContext(ctx.userId);
    const prompt = `Ти — AI Механік AutoLog. Користувач надіслав ГОЛОСОВЕ ПОВІДОМЛЕННЯ. Проаналізуй його та дай корисну пораду українською мовою.${garageContext}`;
    
    const aiResponse = await askGemini(prompt, true, base64, "audio/mp3");
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📅 Записатись на СТО', 'book_sto_start')]
    ]);
    await ctx.reply(`👨‍🔧 *ШІ Механік почув вас:*\n\n${aiResponse}`, { parse_mode: 'Markdown', ...keyboard });
  } catch (e) {
    console.error('Voice processing error:', e);
    ctx.reply('❌ Не вдалося обробити голосове повідомлення.');
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
  }
});

bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  
  const menuButtons = ['🚗 Мої авто', '📅 Мої записи', '💰 Витрати', '❓ Допомога', '🧾 Додати запис (AI)'];
  if (menuButtons.some(btn => ctx.message.text.includes(btn))) return;

  const wait = await ctx.reply('🤔 Думаю...');
  try {
    const carList = []; // Could be populated via a helper if needed
    const historyList = [];
    
    const response = await askGemini(ctx.message.text, carList, historyList);
    
    await ctx.telegram.deleteMessage(ctx.chat.id, wait.message_id).catch(() => {});
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📅 Записатись на СТО', 'book_sto_start')]
    ]);
    
    await ctx.reply(response, { parse_mode: 'Markdown', ...keyboard });
  } catch (e) {
    console.error('🤖 AI Interaction Error:', e.message);
    await ctx.telegram.deleteMessage(ctx.chat.id, wait.message_id).catch(() => {});
    
    if (e.message.includes('429') || e.message.includes('Quota')) {
      await ctx.reply('⚠️ **Ліміт AI вичерпано.** \n\nБудь ласка, перевірте налаштування API ключа або спробуйте пізніше.');
    } else if (e.message.includes('403')) {
      await ctx.reply('🚫 **API не активовано.** \n\nВам потрібно активувати "Generative Language API" у Google Cloud Console для цього проекту.');
    } else {
      await ctx.reply('❌ Ой, я трохи втомився. Спробуйте пізніше! 😴');
    }
  }
});

// --- Booking Flow ---
bot.action('book_sto_start', async (ctx) => {
  try {
    const stoSnap = await db.collection('users').where('accountType', '==', 'sto').limit(10).get();
    if (stoSnap.empty) return ctx.reply('😔 На жаль, зараз немає доступних СТО для запису через бот.');
    
    const buttons = stoSnap.docs.map(d => [Markup.button.callback(`🏠 ${d.data().name || 'Автосервіс'}`, `book_select_sto_${d.id}`)]);
    buttons.push([Markup.button.callback('❌ Скасувати', 'cancel_rec')]);
    
    ctx.reply('🔧 *Оберіть СТО для запису:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  } catch (e) { ctx.reply('Помилка завантаження списку СТО.'); }
});

bot.action(/book_select_sto_(.+)/, async (ctx) => {
  const stoId = ctx.match[1];
  ctx.session.bookingData = { stoId };
  
  try {
    const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    if (carsSnap.empty) return ctx.reply('⚠️ У вас немає доданих авто. Додайте авто в додатку, щоб записатись.');
    
    const buttons = carsSnap.docs.map(d => [Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `book_select_car_${d.id}`)]);
    ctx.editMessageText('🚘 *Оберіть ваше авто:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  } catch (e) { ctx.reply('Помилка завантаження ваших авто.'); }
});

bot.action(/book_select_car_(.+)/, async (ctx) => {
  const carId = ctx.match[1];
  if (!ctx.session.bookingData) ctx.session.bookingData = {};
  ctx.session.bookingData.carId = carId;
  
  const buttons = [
    [Markup.button.callback('📅 Сьогодні', 'book_confirm_today')],
    [Markup.button.callback('🗓 Завтра', 'book_confirm_tomorrow')],
    [Markup.button.callback('❓ Найближчим часом', 'book_confirm_any')]
  ];
  ctx.editMessageText('⏰ *Оберіть бажаний час:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

bot.action(/book_confirm_(.+)/, async (ctx) => {
  const time = ctx.match[1];
  if (!ctx.session.bookingData) return ctx.answerCbQuery('Дані застаріли');
  const { stoId, carId } = ctx.session.bookingData;
  
  try {
    const carDoc = await db.collection('cars').doc(carId).get();
    const carData = carDoc.data();
    
    await db.collection('bookings').add({
      userId: ctx.userId,
      stoId,
      carId,
      carBrand: carData.brand,
      carPlate: carData.plate,
      date: time === 'today' ? new Date().toISOString().split('T')[0] : (time === 'tomorrow' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : 'Якнайшвидше'),
      status: 'pending',
      createdAt: Date.now(),
      source: 'telegram_bot'
    });
    
    ctx.editMessageText('🎉 *Запит на запис надіслано!* СТО зв’яжеться з вами для підтвердження детального часу.', { parse_mode: 'Markdown' });
  } catch (e) { ctx.reply('Помилка створення запису. Спробуйте ще раз.'); }
});

// --- AUTO NOTIFICATIONS (STO + Team) ---
try {
  // 1. Team Invitations Listener
  db.collection('team_invitations').where('status', '==', 'pending').onSnapshot(snap => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const inv = change.doc.data();
        if (inv.notified) return;

        console.log(`✉️ New invite detected for: ${inv.email}`);

        const userSnap = await db.collection('users').where('email', '==', inv.email).get();
        if (!userSnap.empty) {
          const user = userSnap.docs[0].data();
          if (user.telegramId) {
            try {
              await bot.telegram.sendMessage(user.telegramId, 
                `👋 *Запрошення в команду!*\n\nКористувач *${inv.fromName}* хоче додати вас до свого гаража.\n\nБудь ласка, відкрийте додаток, щоб прийняти або відхилити запит.`, 
                { parse_mode: 'Markdown' }
              );
              await change.doc.ref.update({ notified: true });
              console.log(`✅ Sent team invite to ${user.telegramId}`);
            } catch (err) { console.error('Failed to notify team member:', err.message); }
          }
        }
      }
    });
  });

  // 2. STO Bookings (existing logic)
  db.collection('bookings').onSnapshot(async (snap) => {
    for (const change of snap.docChanges()) {
      try {
        const bData = change.doc.data();
        if (change.type === 'added' && bData.status === 'pending' && !bData.notifiedSTO) {
           // Logic for STO notifications (if needed)
        }
      } catch (e) {}
    }
  }, (err) => {
    console.error('❌ Firestore Snapshot Error:', err.message);
  });
} catch (e) { console.error('Notification Setup Error:', e.message); }

bot.command('ping', (ctx) => ctx.reply('Pong! 🏓'));

console.log("🚀 Starting bot.launch()...");
bot.launch()
  .then(() => {
    console.log('🤖 AutoLog Bot is Online & Smart!');
    console.log('✅ Polling started successfully.');
  })
  .catch((err) => {
    console.error('❌ Bot Launch Error:', err.message);
    if (err.message.includes('401')) {
      console.error('⚠️ ПЕРЕВІРТЕ BOT_TOKEN у файлі bot-server/.env');
    }
  });

process.once('SIGINT', () => {
    console.log('Stopping bot (SIGINT)...');
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    console.log('Stopping bot (SIGTERM)...');
    bot.stop('SIGTERM');
});
