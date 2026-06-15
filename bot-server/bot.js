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
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN || 'https://autolog-q9hd.onrender.com';
const WEBHOOK_PATH = '/tg-webhook';
const USE_WEBHOOK = process.env.USE_WEBHOOK !== 'false';

app.use(express.json());
app.get('/', (req, res) => res.send('AutoLog Bot is active! 🤖'));
app.get('/health', (req, res) => res.status(200).send('OK'));

let serviceAccount;
let credSource = 'none';
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  // ENV має пріоритет (прод на Render), файл serviceAccountKey.json — лише фолбек
  // для локальної розробки. Інакше залишковий файл на сервері перебиває прод-креденшіали.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credSource = 'env (FIREBASE_SERVICE_ACCOUNT)';
  } else if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    credSource = 'file (serviceAccountKey.json)';
  }

  if (serviceAccount && serviceAccount.private_key) {
    // ВИПРАВЛЕННЯ: замінюємо екрановані \n на реальні переноси рядків
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log(`🚀 Firebase initialized with project: ${serviceAccount.project_id} (source: ${credSource})`);
  }
} catch (err) {
  console.error('❌ Firebase Init Error:', err.message);
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- ADMIN GUARD ---
// Деструктивні команди (cleandb, migrate, keepcar) доступні лише адмінам.
// ADMIN_TELEGRAM_IDS — список Telegram user id через кому в .env, напр. "12345,67890".
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || process.env.ADMIN_TELEGRAM_ID || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isAdmin = (ctx) => ADMIN_IDS.includes(String(ctx.from?.id));

// Повертає true і відповідає користувачу, якщо доступ заборонено.
const denyNonAdmin = async (ctx) => {
  if (isAdmin(ctx)) return false;
  console.warn(`⛔ [DENIED] non-admin ${ctx.from?.id} tried: ${ctx.message?.text}`);
  await ctx.reply('⛔ Команда доступна лише адміністратору.');
  return true;
};

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

// Гарантуємо, що ctx.session завжди об'єкт (Telegraf 4 за замовчуванням повертає undefined),
// інакше присвоєння ctx.session.* у майстрах (заправка, запис на СТО) падає з TypeError.
bot.use((ctx, next) => {
  if (ctx.session == null) ctx.session = {};
  return next();
});

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
  ['⛽ Заправка', '💰 Витрати'],
  ['🧾 Додати запис (AI)', '❓ Допомога']
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
  const token = ctx.message.text.split(' ')[1]; // отримуємо токен з /start TOKEN

  // Якщо передано токен синхронізації з веб-додатка
  if (token) {
    try {
      const usersRef = db.collection('users');
      const snap = await usersRef.where('tgLinkingToken.token', '==', token).get();

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userData = userDoc.data();
        
        // Перевіряємо чи токен не протермінувався
        if (userData.tgLinkingToken.expires > Date.now()) {
          const telegramId = ctx.from.id.toString();
          
          await userDoc.ref.update({
            telegramId: telegramId,
            tgLinkingToken: admin.firestore.FieldValue.delete() // видаляємо токен після використання
          });
          
          // Оновлюємо кеш мідлвари
          ctx.userData = { ...userData, telegramId };
          ctx.userId = userDoc.id;

          return ctx.reply('✅ Ваш Telegram успішно підключено до веб-акаунту!', mainMenu);
        } else {
          return ctx.reply('❌ Код підключення застарів. Згенеруйте новий у веб-додатку.');
        }
      }
    } catch (e) {
      console.error('Помилка синхронізації:', e);
    }
  }

  // Звичайна логіка (якщо токену немає або він не підійшов)
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
  try {
    console.log(`🚗 [Мої авто] userId=${ctx.userId} tid=${ctx.from?.id}`);
    if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
    const snap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    console.log(`🚗 [Мої авто] found ${snap.size} cars`);
    if (snap.empty) return ctx.reply('Ваш гараж порожній.');
    let text = `🚗 *Ваш Гараж:*\n\n`;
    snap.forEach(d => {
      const c = d.data();
      text += `📍 *${c.brand} ${c.model || ''}*\n🔢 Номер: \`${c.plate}\`\n\n`;
    });
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('❌ Мої авто error:', e.message, e.stack);
    await ctx.reply('Помилка завантаження гаража. Спробуйте ще раз.');
  }
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
  return ctx.replyWithMarkdown('Оберіть автомобіль для перегляду статистики витрат:');
});

bot.hears('❓ Допомога', (ctx) => {
  ctx.reply('❓ *Як користуватися:*\n\n1. Просто напишіть мені будь-яке питання про авто.\n2. Надішліть **фото чека з СТО**, і я автоматично додам його у вашу історію.\n3. Натисніть **⛽ Заправка**, щоб додати заправку — вкажіть пробіг, літри й суму. Витрату на 100 км побачите в додатку → *Паливо*.', { parse_mode: 'Markdown' });
});

bot.hears('🧾 Додати запис (AI)', (ctx) => ctx.reply('📸 Надішліть фото чека СТО. Я проаналізую його автоматично.'));

// --- FUEL LOG FLOW ---
// Зберігає заправку в ту саму колекцію history (category: 'fuel'), що й веб-додаток.
const saveFuelRecord = async (ctx) => {
  const f = ctx.session?.fuelData;
  if (!f || !ctx.userId) return;
  const pricePerLiter = f.liters ? Math.round((f.cost / f.liters) * 100) / 100 : 0;
  const date = new Date().toISOString().split('T')[0];
  try {
    await db.collection('history').add({
      category: 'fuel',
      title: 'Заправка',
      date,
      carId: f.carId,
      plate: f.carPlate || '',
      mileage: f.mileage,
      liters: f.liters,
      cost: f.cost || 0,
      pricePerLiter,
      fullTank: !!f.fullTank,
      userId: ctx.userId,
      status: 'self_reported',
      createdAt: Date.now(),
    });
    // Підтягуємо пробіг авто, якщо новий більший
    if (f.mileage > (f.currentMileage || 0)) {
      await db.collection('cars').doc(f.carId).update({ mileage: f.mileage }).catch(() => {});
    }
    const msg = `✅ *Заправку збережено!*\n\n🚗 ${f.carBrand} (${f.carPlate})\n📍 Пробіг: *${f.mileage}* км\n⛽ *${f.liters}* л${f.fullTank ? ' (повний бак)' : ' (частково)'}\n💰 *${fmtCost(f.cost)}* ₴${pricePerLiter ? ` · ${pricePerLiter} ₴/л` : ''}\n\nВитрату на 100 км дивіться в додатку → *Паливо*.`;
    if (ctx.callbackQuery) await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
    else await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('Fuel save error:', e);
    await ctx.reply('❌ Помилка збереження заправки. Спробуйте ще раз.');
  } finally {
    ctx.session.fuelData = null;
    ctx.session.fuelStep = null;
  }
};

// Обробляє покрокове введення чисел майстра заправки (викликається з bot.on('text'))
const handleFuelStep = async (ctx) => {
  const step = ctx.session.fuelStep;
  const txt = (ctx.message.text || '').trim();

  if (/^(скасувати|відміна|cancel)$/i.test(txt)) {
    ctx.session.fuelData = null;
    ctx.session.fuelStep = null;
    return ctx.reply('❌ Скасовано.', mainMenu);
  }

  if (step === 'mileage') {
    const m = parseInt(txt.replace(/[^\d]/g, ''), 10);
    if (!m || m <= 0) return ctx.reply('❌ Введіть пробіг числом, напр. `195511`', { parse_mode: 'Markdown' });
    ctx.session.fuelData.mileage = m;
    ctx.session.fuelStep = 'liters';
    return ctx.reply('2️⃣ Скільки *літрів* залили? (напр. `42.5`)', { parse_mode: 'Markdown' });
  }

  if (step === 'liters') {
    const num = parseFloat(txt.replace(',', '.').replace(/[^\d.]/g, ''));
    if (!num || num <= 0) return ctx.reply('❌ Введіть кількість літрів числом, напр. `42.5`', { parse_mode: 'Markdown' });
    ctx.session.fuelData.liters = num;
    ctx.session.fuelStep = 'cost';
    return ctx.reply('3️⃣ Яка *сума* заправки в ₴? (введіть `0`, якщо не вказувати)', { parse_mode: 'Markdown' });
  }

  if (step === 'cost') {
    const num = parseFloat(txt.replace(',', '.').replace(/[^\d.]/g, ''));
    if (isNaN(num) || num < 0) return ctx.reply('❌ Введіть суму числом, напр. `2200`', { parse_mode: 'Markdown' });
    ctx.session.fuelData.cost = num;
    ctx.session.fuelStep = null; // числа введено — чекаємо вибір «повний бак»
    return ctx.reply('4️⃣ Це був *повний бак*?\n_Точна витрата рахується між повними баками._', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Так, повний', 'fuel_full_yes')],
        [Markup.button.callback('🔸 Ні, частково', 'fuel_full_no')],
      ]),
    });
  }
};

bot.hears(/^⛽ Заправка$|^Заправка$/i, async (ctx) => {
  if (!ctx.userId) return ctx.reply('Спершу зареєструйтесь!');
  const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
  if (carsSnap.empty) return ctx.reply('⚠️ У вас немає доданих авто. Додайте авто в додатку, щоб вести журнал пального.');
  const buttons = carsSnap.docs.map(d => [Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `fuel_car_${d.id}`)]);
  buttons.push([Markup.button.callback('❌ Скасувати', 'fuel_cancel')]);
  ctx.reply('⛽ *Нова заправка*\nОберіть авто:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

bot.action(/fuel_car_(.+)/, async (ctx) => {
  const carId = ctx.match[1];
  const carDoc = await db.collection('cars').doc(carId).get();
  if (!carDoc.exists) return ctx.answerCbQuery('Авто не знайдено');
  const c = carDoc.data();
  ctx.session.fuelData = { carId, carBrand: c.brand, carPlate: c.plate, currentMileage: c.mileage || 0 };
  ctx.session.fuelStep = 'mileage';
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⛽ Заправка для *${c.brand} ${c.model || ''}*\n\n1️⃣ Введіть поточний *пробіг* (км):\n_Напишіть «скасувати» щоб вийти._`, { parse_mode: 'Markdown' });
});

bot.action(/fuel_full_(yes|no)/, async (ctx) => {
  if (!ctx.session?.fuelData) return ctx.answerCbQuery('Дані застаріли, почніть заново');
  ctx.session.fuelData.fullTank = ctx.match[1] === 'yes';
  await ctx.answerCbQuery();
  await saveFuelRecord(ctx);
});

bot.action('fuel_cancel', (ctx) => {
  if (ctx.session) { ctx.session.fuelData = null; ctx.session.fuelStep = null; }
  ctx.editMessageText('❌ Скасовано.').catch(() => {});
});

const PLANS_LIMITS = { 'Free': 5, 'Premium': 100, 'Business': 9999 };
const getCurrentMonthStr = () => new Date().toISOString().substring(0, 7);

const handleAILimit = async (ctx) => {
    if (!ctx.userData) return false;
    const plan = ctx.userData.plan || 'Free';
    const limit = PLANS_LIMITS[plan] || 5;
    const currentMonth = getCurrentMonthStr();
    let usage = ctx.userData.aiUsage || 0;
    if (ctx.userData.lastAiResetMonth !== currentMonth) usage = 0;
    if (usage >= limit) {
        await ctx.reply('⚠️ *Ваш ліміт запитів до AI вичерпано!*\nПерейдіть у веб-додаток (розділ Тарифи), щоб збільшити ліміт і розблокувати Механіка.', { parse_mode: 'Markdown' });
        return false;
    }
    return true;
};

const incrementAIUsage = async (ctx) => {
    if (!ctx.userId || !ctx.userData) return;
    const currentMonth = getCurrentMonthStr();
    let usage = ctx.userData.aiUsage || 0;
    if (ctx.userData.lastAiResetMonth !== currentMonth) usage = 0;
    const newUsage = usage + 1;
    ctx.userData.aiUsage = newUsage;
    ctx.userData.lastAiResetMonth = currentMonth;
    try {
        await db.collection('users').doc(ctx.userId).update({ aiUsage: newUsage, lastAiResetMonth: currentMonth });
    } catch (e) {
        console.error("Limit update error:", e);
    }
};

bot.on('photo', async (ctx) => {
  if (!(await handleAILimit(ctx))) return;
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
2. Якщо це ФОТО ПОЛОМКИ, ДЕТАЛІ або ПРИЛАДОВОЇ ПАНЕЛІ: дай розгорнуту пораду українською та поверни JSON: {"type": "advice", "text": "Твій текст поради"}. Важливо: у полі "text" обов'язково додай посилання на покупку деталі, якщо ти її ідентифікував, у форматі Markdown. У самому URL посиланні замінюй пробіли на символ "+". Приклад: [🔎 На Exist.ua](https://www.google.com/search?q=site:exist.ua+[Назва+Деталі]) та [🛒 На Avto.pro](https://www.google.com/search?q=site:avto.pro+[Назва+Деталі]).
3. В інших випадках: просто дай коротку відповідь.`;

    const aiResponse = await askGemini(prompt, true, base64);
    if (!aiResponse.startsWith("Помилка AI")) await incrementAIUsage(ctx);
    
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

// Збереження голосової заправки для обраного авто
bot.action(/save_voice_fuel_(.+)/, async (ctx) => {
  if (!ctx.session?.pendingVoiceFuel) return ctx.answerCbQuery('Дані застаріли, спробуйте знову');
  const carId = ctx.match[1];
  const f = ctx.session.pendingVoiceFuel;

  try {
    const carDoc = await db.collection('cars').doc(carId).get();
    if (!carDoc.exists) return ctx.answerCbQuery('Автомобіль не знайдено');
    const carData = carDoc.data();

    const pricePerLiter = f.liters ? Math.round((f.cost / f.liters) * 100) / 100 : 0;
    const date = new Date().toISOString().split('T')[0];

    await db.collection('history').add({
      category: 'fuel',
      title: 'Заправка (голос)',
      date,
      carId,
      plate: carData.plate || '',
      mileage: f.mileage || 0,
      liters: f.liters || 0,
      cost: f.cost || 0,
      pricePerLiter,
      fullTank: !!f.fullTank,
      userId: ctx.userId,
      status: 'self_reported',
      createdAt: Date.now(),
    });

    if (f.mileage > (carData.mileage || 0)) {
      await db.collection('cars').doc(carId).update({ mileage: f.mileage }).catch(() => {});
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✅ *Заправку збережено!*\n\n` +
      `🚗 ${carData.brand} ${carData.model || ''} (\`${carData.plate}\`)\n` +
      `📍 Пробіг: *${f.mileage || '—'}* км\n` +
      `⛽ Об'єм: *${f.liters || '—'}* л${f.fullTank ? ' (повний бак)' : ''}\n` +
      `💰 Сума: *${fmtCost(f.cost)}* ₴${pricePerLiter ? ` · ${pricePerLiter} ₴/л` : ''}\n\n` +
      `_Витрату на 100 км дивіться в додатку → Паливо._`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('Error saving voice fuel:', e);
    ctx.reply('❌ Помилка збереження заправки.');
  } finally {
    ctx.session.pendingVoiceFuel = null;
  }
});

bot.action('cancel_voice_fuel', (ctx) => {
  if (ctx.session) ctx.session.pendingVoiceFuel = null;
  ctx.answerCbQuery().catch(() => {});
  ctx.editMessageText('❌ Скасовано.').catch(() => {});
});

// AI Mechanic Chat (Catch-all for text)
const askGemini = async (prompt, hasMedia = false, base64 = null, mimeType = "image/jpeg") => {
    if (!API_KEY) return "Помилка: Ключ AI не знайдено.";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        let result;
        // Strict check: hasMedia must be true AND base64 must be a non-empty string
        if (hasMedia && typeof base64 === 'string' && base64.length > 0) {
            result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType } }]);
        } else {
            result = await model.generateContent(prompt);
        }
        return result.response.text();
    } catch (e) {
        console.error("Gemini API Error:", e.message);
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
  if (!(await handleAILimit(ctx))) return;
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
    const prompt = `Ти — AI Механік та розумний асистент автожурналу AutoLog. Користувач надіслав ГОЛОСОВЕ ПОВІДОМЛЕННЯ.${garageContext}
Аналізуй повідомлення та виконуй такі правила:

1. Визначи, чи повідомляє користувач про заправку автомобіля пальним (бензин, дизель, газ тощо).
   Ознаки заправки: вказано кількість літрів (наприклад, 40 літрів), вартість заправки (наприклад, 2000 гривень) або пробіг.
   Якщо це ЗАПРАВКА, розпізнай параметри та обов'язково поверни ТІЛЬКИ JSON-об'єкт:
   {
     "type": "fuel",
     "liters": 40,      // число (літри), або null якщо не вказано
     "cost": 2000,      // число (сума в грн), або null якщо не вказано
     "mileage": 185000, // число (пробіг у км), або null якщо не вказано
     "fullTank": false  // boolean (якщо користувач сказав "до повного", "повний бак" - true, інакше false)
   }

2. Якщо це НЕ заправка (а наприклад, запитання про ремонт, поломку чи пораду):
   Дай корисну та розгорнуту пораду українською мовою. Додай посилання на Exist.ua та Avto.pro за потреби.
   Обов'язково поверни ТІЛЬКИ такий JSON-об'єкт:
   {
     "type": "advice",
     "text": "Твій текст поради українською мовою..."
   }

Важливо: твій результат має бути тільки цим JSON-об'єктом. Жодного іншого тексту навколо JSON.`;
    
    const aiResponse = await askGemini(prompt, true, base64, "audio/mp3");
    if (!aiResponse.startsWith("Помилка AI")) await incrementAIUsage(ctx);
    
    // Спробуємо розпарсити JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        
        if (data.type === 'fuel') {
          const liters = Number(data.liters) || 0;
          const cost = Number(data.cost) || 0;
          const mileage = Number(data.mileage) || 0;
          const fullTank = !!data.fullTank;

          if (!ctx.userId) return ctx.reply('❌ Будь ласка, спочатку зареєструйтесь!');

          const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
          if (carsSnap.empty) {
            return ctx.reply('⚠️ У вас немає доданих автомобілів. Будь ласка, додайте автомобіль у веб-додатку, щоб вести журнал пального.');
          }

          if (carsSnap.size === 1) {
            // Лише 1 автомобіль — записуємо відразу!
            const car = carsSnap.docs[0];
            const carId = car.id;
            const carData = car.data();
            const pricePerLiter = liters ? Math.round((cost / liters) * 100) / 100 : 0;
            const date = new Date().toISOString().split('T')[0];

            await db.collection('history').add({
              category: 'fuel',
              title: 'Заправка (голос)',
              date,
              carId,
              plate: carData.plate || '',
              mileage: mileage || 0,
              liters: liters || 0,
              cost: cost || 0,
              pricePerLiter,
              fullTank,
              userId: ctx.userId,
              status: 'self_reported',
              createdAt: Date.now(),
            });

            if (mileage > (carData.mileage || 0)) {
              await db.collection('cars').doc(carId).update({ mileage }).catch(() => {});
            }

            return ctx.reply(
              `✅ *Заправку збережено!*\n\n` +
              `🚗 ${carData.brand} ${carData.model || ''} (\`${carData.plate}\`)\n` +
              `📍 Пробіг: *${mileage || '—'}* км\n` +
              `⛽ Об'єм: *${liters || '—'}* л\n` +
              `💰 Сума: *${fmtCost(cost)}* ₴${pricePerLiter ? ` · ${pricePerLiter} ₴/л` : ''}\n\n` +
              `_Витрату на 100 км дивіться в додатку → Паливо._`,
              { parse_mode: 'Markdown' }
            );
          } else {
            // Кілька автомобілів — зберігаємо у сесію та запитуємо вибір
            ctx.session.pendingVoiceFuel = { liters, cost, mileage, fullTank };
            
            const buttons = carsSnap.docs.map(d => [
              Markup.button.callback(`🚗 ${d.data().brand} (${d.data().plate})`, `save_voice_fuel_${d.id}`)
            ]);
            buttons.push([Markup.button.callback('❌ Скасувати', 'cancel_voice_fuel')]);

            return ctx.reply(
              `⛽ *Розпізнано заправку!*\n\n` +
              `📍 Пробіг: *${mileage || '—'}* км\n` +
              `⛽ Об'єм: *${liters || '—'}* л${fullTank ? ' (повний бак)' : ''}\n` +
              `💰 Сума: *${fmtCost(cost)}* ₴\n\n` +
              `🚘 *Оберіть автомобіль для збереження:*`,
              { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
            );
          }
        } else if (data.type === 'advice') {
          return ctx.reply(`👨‍🔧 *ШІ Механік почув вас:*\n\n${data.text}`, { parse_mode: 'Markdown' });
        }
      } catch (parseErr) {
        console.error('JSON parsing error for voice response:', parseErr);
      }
    }

    // Fallback якщо ШІ відповів не за правилами або не повернув JSON
    await ctx.reply(`👨‍🔧 *ШІ Механік почув вас:*\n\n${aiResponse}`, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('Voice processing error:', e);
    ctx.reply('❌ Не вдалося обробити голосове повідомлення.');
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
  }
});

bot.on('text', async (ctx, next) => {
  // Пропускаємо слеш-команди далі по ланцюжку, щоб працювали bot.command(...) нижче
  if (ctx.message.text.startsWith('/')) return next();

  // Майстер заправки має пріоритет над AI-чатом
  if (ctx.session?.fuelStep) return handleFuelStep(ctx);

  const menuButtons = ['🚗 Мої авто', '📅 Мої записи', '⛽ Заправка', '💰 Витрати', '❓ Допомога', '🧾 Додати запис (AI)'];
  if (menuButtons.some(btn => ctx.message.text.includes(btn))) return;

  if (!(await handleAILimit(ctx))) return;

  const wait = await ctx.reply('🤔 Думаю...');
  try {
    const promptText = `Ти — AI Механік AutoLog. Дай професійну пораду українською мовою на запит користувача: "${ctx.message.text}".
ПІДБІР ЗАПЧАСТИН: Якщо мова йде про ремонт або заміну конкретної деталі (гальмівні колодки, фільтри, свічки тощо), обов'язково додай в кінці відповіді посилання на покупку у форматі Markdown. У самому URL посиланні замінюй пробіли на символ "+".
- [🔎 Знайти "[Назва]" на Exist.ua](https://www.google.com/search?q=site:exist.ua+[Форматована+Назва+Без+Пробілів])
- [🛒 Знайти на Avto.pro](https://www.google.com/search?q=site:avto.pro+[Форматована+Назва+Без+Пробілів])`;

    const response = await askGemini(promptText);
    if (!response.startsWith("Помилка AI")) await incrementAIUsage(ctx);
    
    await ctx.telegram.deleteMessage(ctx.chat.id, wait.message_id).catch(() => {});
    
    await ctx.reply(response, { parse_mode: 'Markdown' });
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
      } catch { /* ignore individual snapshot change errors */ }
    }
  }, (err) => {
    console.error('❌ Firestore Snapshot Error:', err.message);
  });
} catch (e) { console.error('Notification Setup Error:', e.message); }

bot.command('ping', (ctx) => ctx.reply('Pong! 🏓'))

// Діагностика: який Firebase-проект реально використовується
bot.command('dbcheck', async (ctx) => {
  try {
    const tid = ctx.from.id.toString();
    // Отримуємо project ID напряму з ініціалізованого Firebase app
    const projectId = admin.apps[0]?.options?.credential?.projectId
      || admin.apps[0]?.options?.projectId
      || serviceAccount?.project_id
      || '—';

    // Шукаємо юзера БЕЗ кешу middleware (свіжий запит)
    const freshSnap = await db.collection('users').where('telegramId', '==', tid).get();
    let freshUserId = '—';
    let freshCars = 0;
    if (!freshSnap.empty) {
      const doc = freshSnap.docs[0];
      freshUserId = doc.data().uid || doc.id;
      const carsSnap = await db.collection('cars').where('userId', '==', freshUserId).get();
      freshCars = carsSnap.size;
    }

    await ctx.reply(
      `🔍 *DB Діагностика*\n\n` +
      `Firebase project: \`${projectId}\`\n` +
      `credSource: \`${credSource}\`\n` +
      `telegramId: \`${tid}\`\n` +
      `Знайдено профілів: *${freshSnap.size}*\n` +
      `userId (свіжий): \`${freshUserId}\`\n` +
      `Авто (свіжий запит): *${freshCars}*`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    ctx.reply('❌ dbcheck error: ' + e.message);
  }
})

// Діагностика прив'язки: до якого профілю причеплений бот і скільки авто він бачить
bot.command('whoami', async (ctx) => {
  try {
    const tid = ctx.from.id.toString();
    const dupSnap = await db.collection('users').where('telegramId', '==', tid).get();
    const carsCount = ctx.userId
      ? (await db.collection('cars').where('userId', '==', ctx.userId).get()).size
      : 0;

    let text = `🪪 *Діагностика прив'язки*\n\n`;
    text += `telegramId: \`${tid}\`\n`;
    text += `Профілів із цим telegramId: *${dupSnap.size}*\n`;
    text += `Активний userId: \`${ctx.userId || '—'}\`\n`;
    text += `Ім'я: ${ctx.userData?.displayName || ctx.userData?.name || '—'}\n`;
    text += `Email: ${ctx.userData?.email || '—'}\n`;
    text += `Знайдено авто: *${carsCount}*`;

    if (dupSnap.size > 1) {
      text += `\n\n⚠️ Цей telegramId прив'язаний до *кількох* профілів — саме тому не ті авто:`;
      dupSnap.docs.forEach((d, i) => {
        const u = d.data();
        text += `\n${i + 1}) \`${d.id}\` — ${u.displayName || u.email || u.phone || '?'}`;
      });
    }
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('whoami error:', e);
    await ctx.reply('❌ Помилка діагностики: ' + e.message);
  }
});

// Знімає прив'язку telegramId з усіх профілів (скидання, коли бот сидить на чужому акаунті)
bot.command('unlink', async (ctx) => {
  try {
    const tid = ctx.from.id.toString();
    const snap = await db.collection('users').where('telegramId', '==', tid).get();
    if (snap.empty) return ctx.reply("ℹ️ Цей Telegram ні до кого не прив'язаний.");
    let n = 0;
    for (const d of snap.docs) {
      await d.ref.update({
        telegramId: admin.firestore.FieldValue.delete(),
        tgLinkingToken: admin.firestore.FieldValue.delete(),
      });
      n++;
    }
    await ctx.reply(
      `✅ Відв'язано від *${n}* профіл(ю/ів).\n\nТепер у веб-додатку увійди *правильним* акаунтом → Налаштування → *Підключити Telegram* → і надішли мені \`/start КОД\`.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('unlink error:', e);
    await ctx.reply('❌ Помилка відв\'язки: ' + e.message);
  }
});

// Прив'язує Telegram напряму до профілю за email (надійніше за токен/контакт).
// Знімає telegramId з усіх інших профілів, щоб не було дублів.
bot.command('linkemail', async (ctx) => {
  try {
    const email = (ctx.message.text.split(' ')[1] || '').trim();
    if (!email) return ctx.reply('Використання: `/linkemail ваш@email.com`', { parse_mode: 'Markdown' });
    const tid = ctx.from.id.toString();

    let snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) snap = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    if (snap.empty) return ctx.reply(`❌ Профіль з email *${email}* не знайдено в базі.`, { parse_mode: 'Markdown' });

    const target = snap.docs[0];
    // Зняти telegramId з усіх інших профілів
    const dup = await db.collection('users').where('telegramId', '==', tid).get();
    for (const d of dup.docs) {
      if (d.id !== target.id) await d.ref.update({ telegramId: admin.firestore.FieldValue.delete() });
    }
    await target.ref.update({ telegramId: tid });

    const uid = target.data().uid || target.id;
    const cars = await db.collection('cars').where('userId', '==', uid).get();
    await ctx.reply(
      `✅ Прив'язано до *${email}*\nuserId: \`${uid}\`\nАвто знайдено: *${cars.size}*\n\nНадішли 🚗 *Мої авто* для перевірки.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('linkemail error:', e);
    await ctx.reply('❌ Помилка: ' + e.message);
  }
});

// Прив'язує Telegram напряму за Firebase Auth UID (обходить дубль-профілі за email)
bot.command('linkuid', async (ctx) => {
  try {
    const uid = (ctx.message.text.split(' ')[1] || '').trim();
    if (!uid) return ctx.reply('Використання: `/linkuid ВАШ_FIREBASE_UID`', { parse_mode: 'Markdown' });
    const tid = ctx.from.id.toString();

    const target = await db.collection('users').doc(uid).get();
    if (!target.exists) return ctx.reply(`❌ Документ users/${uid} не знайдено.`);

    // Зняти telegramId з усіх інших профілів
    const dup = await db.collection('users').where('telegramId', '==', tid).get();
    for (const d of dup.docs) {
      if (d.id !== uid) await d.ref.update({ telegramId: admin.firestore.FieldValue.delete() });
    }
    await target.ref.update({ telegramId: tid });

    const cars = await db.collection('cars').where('userId', '==', uid).get();
    const u = target.data();
    await ctx.reply(
      `✅ Прив'язано до профілю \`${uid}\`\nEmail: ${u.email || '—'}\nІм'я: ${u.displayName || u.name || '—'}\nАвто знайдено: *${cars.size}*\n\nНадішли 🚗 *Мої авто* для перевірки.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('linkuid error:', e);
    await ctx.reply('❌ Помилка: ' + e.message);
  }
});

// Переносить telegramId та авто зі старого дубль-профілю на справжній Auth UID
bot.command('migrate', async (ctx) => {
  try {
    if (await denyNonAdmin(ctx)) return;
    const args = ctx.message.text.split(' ');
    const fromId = (args[1] || '').trim();
    const toId   = (args[2] || '').trim();
    if (!fromId || !toId) return ctx.reply('Використання: `/migrate FROM_UID TO_UID`\n\nFROM = старий doc ID (де авто)\nTO = реальний Firebase Auth UID', { parse_mode: 'Markdown' });
    const tid = ctx.from.id.toString();

    const fromDoc = await db.collection('users').doc(fromId).get();
    if (!fromDoc.exists) return ctx.reply(`❌ Документ users/${fromId} не знайдено.`);

    // Копіюємо або оновлюємо профіль у TO
    const fromData = fromDoc.data();
    await db.collection('users').doc(toId).set({
      ...fromData,
      telegramId: tid,
      uid: toId,
    }, { merge: true });

    // Переносимо всі авто з fromId на toId
    const carsSnap = await db.collection('cars').where('userId', '==', fromId).get();
    let carsMoved = 0;
    for (const d of carsSnap.docs) {
      await d.ref.update({ userId: toId });
      carsMoved++;
    }

    // Переносимо history
    const histSnap = await db.collection('history').where('userId', '==', fromId).get();
    for (const d of histSnap.docs) await d.ref.update({ userId: toId });

    // Знімаємо telegramId зі старого
    await fromDoc.ref.update({ telegramId: admin.firestore.FieldValue.delete() });

    await ctx.reply(
      `✅ Міграція завершена!\n\nАвто перенесено: *${carsMoved}*\nНовий профіль: \`${toId}\`\n\nНадішли 🚗 *Мої авто* для перевірки.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('migrate error:', e);
    await ctx.reply('❌ Помилка міграції: ' + e.message);
  }
});

// Видаляє всі дані НЕ пов'язані з вказаним UID (чистить тестові залишки)
bot.command('cleandb', async (ctx) => {
  try {
    if (await denyNonAdmin(ctx)) return;
    const keepUid = (ctx.message.text.split(' ')[1] || '').trim();
    if (!keepUid) return ctx.reply('Використання: `/cleandb UID_ЩО_ЗБЕРЕГТИ`', { parse_mode: 'Markdown' });

    await ctx.reply('🧹 Починаю очистку бази... Це може зайняти хвилину.');

    let deletedCars = 0, deletedHistory = 0, deletedUsers = 0;

    // Видалити авто де userId != keepUid
    const carsSnap = await db.collection('cars').get();
    for (const d of carsSnap.docs) {
      if (d.data().userId !== keepUid) {
        await d.ref.delete();
        deletedCars++;
      }
    }

    // Видалити history де userId != keepUid
    const histSnap = await db.collection('history').get();
    for (const d of histSnap.docs) {
      if (d.data().userId !== keepUid) {
        await d.ref.delete();
        deletedHistory++;
      }
    }

    // Видалити профілі users де doc.id != keepUid (лишити тільки реальний)
    const usersSnap = await db.collection('users').get();
    for (const d of usersSnap.docs) {
      if (d.id !== keepUid) {
        // Видалити підколекції reminders та ai_chats
        const subs = ['reminders', 'ai_chats'];
        for (const sub of subs) {
          const subSnap = await d.ref.collection(sub).get();
          for (const s of subSnap.docs) await s.ref.delete();
        }
        await d.ref.delete();
        deletedUsers++;
      }
    }

    await ctx.reply(
      `✅ *Очистку завершено!*\n\n🚗 Авто видалено: *${deletedCars}*\n📋 Записів history видалено: *${deletedHistory}*\n👤 Профілів видалено: *${deletedUsers}*\n\nЗбережено профіль: \`${keepUid}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('cleandb error:', e);
    await ctx.reply('❌ Помилка очистки: ' + e.message);
  }
});

// Видаляє всі авто та їх history крім авто з вказаним держ. номером
bot.command('keepcar', async (ctx) => {
  try {
    if (await denyNonAdmin(ctx)) return;
    const plate = (ctx.message.text.split(' ')[1] || '').trim().toUpperCase();
    if (!plate) return ctx.reply('Використання: `/keepcar ДЕРЖНОМЕР`\nНаприклад: `/keepcar BC7388XA`', { parse_mode: 'Markdown' });
    if (!ctx.userId) return ctx.reply('❌ Акаунт не визначено.');

    const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    let deleted = 0, kept = 0;

    for (const d of carsSnap.docs) {
      const carPlate = (d.data().plate || '').toUpperCase().trim();
      if (carPlate === plate) { kept++; continue; }

      // Видалити history цього авто
      const histSnap = await db.collection('history').where('carId', '==', d.id).get();
      for (const h of histSnap.docs) await h.ref.delete();

      await d.ref.delete();
      deleted++;
    }

    await ctx.reply(
      `✅ Готово!\n\n🗑 Видалено авто: *${deleted}*\n✅ Збережено: *${kept}* (${plate})\n\nНадішли 🚗 *Мої авто* для перевірки.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.error('keepcar error:', e);
    await ctx.reply('❌ Помилка: ' + e.message);
  }
});

// --- REMINDERS SCHEDULER ---
const checkReminders = async () => {
  console.log('🔔 Checking reminders...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const usersSnap = await db.collection('users').where('telegramId', '!=', null).get();

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      if (!user.telegramId) continue;

      const remindersSnap = await db.collection('users').doc(userDoc.id).collection('reminders')
        .where('enabled', '==', true)
        .where('notifyViaTelegram', '==', true)
        .get();

      for (const remDoc of remindersSnap.docs) {
        const r = remDoc.data();
        if (!r.date) continue;

        const eventDate = new Date(r.date);
        eventDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((eventDate - today) / 86400000);

        // Notify if daysLeft === daysBefore OR daysLeft === 0 (day of) OR daysLeft === 1
        const shouldNotify = daysLeft === r.daysBefore || daysLeft === 1 || daysLeft === 0;
        if (!shouldNotify) continue;

        // Avoid duplicate: check lastNotifiedDate
        const todayStr = today.toISOString().split('T')[0];
        if (r.lastNotifiedDate === todayStr) continue;

        let msg = '';
        if (daysLeft <= 0) {
          msg = `⚠️ *${r.label}* — сьогодні!\n${r.carLabel ? `🚗 ${r.carLabel}\n` : ''}Дата: ${new Date(r.date).toLocaleDateString('uk-UA')}`;
        } else if (daysLeft === 1) {
          msg = `⏰ *${r.label}* — завтра!\n${r.carLabel ? `🚗 ${r.carLabel}\n` : ''}Дата: ${new Date(r.date).toLocaleDateString('uk-UA')}`;
        } else {
          msg = `🔔 *Нагадування: ${r.label}*\n${r.carLabel ? `🚗 ${r.carLabel}\n` : ''}До події: *${daysLeft} днів*\nДата: ${new Date(r.date).toLocaleDateString('uk-UA')}`;
        }

        try {
          await bot.telegram.sendMessage(user.telegramId, msg, { parse_mode: 'Markdown' });
          await remDoc.ref.update({ lastNotifiedDate: todayStr });
          console.log(`✅ Reminder sent to ${user.telegramId}: ${r.label}`);
        } catch (e) {
          console.error(`❌ Failed to send reminder to ${user.telegramId}:`, e.message);
        }
      }
    }
  } catch (e) {
    console.error('❌ Reminders check error:', e.message);
  }
};

// Run once at startup (after 10s delay), then every 24h at 09:00
const scheduleReminders = () => {
  const now = new Date();
  const next9am = new Date();
  next9am.setHours(9, 0, 0, 0);
  if (next9am <= now) next9am.setDate(next9am.getDate() + 1);
  const msUntil9am = next9am - now;

  console.log(`⏰ Next reminder check at ${next9am.toLocaleTimeString('uk-UA')} (in ${Math.round(msUntil9am / 60000)} min)`);

  setTimeout(() => {
    checkReminders();
    setInterval(checkReminders, 24 * 60 * 60 * 1000);
  }, msUntil9am);
};;

scheduleReminders();

// Wire webhook handler on Express
app.use(bot.webhookCallback(WEBHOOK_PATH));

app.listen(port, async () => {
  console.log(`🌍 Server listening on port ${port}`);
  if (USE_WEBHOOK) {
    const url = `${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
    // Try set webhook with retries — inbound API call can also fail temporarily
    for (let i = 1; i <= 6; i++) {
      try {
        console.log(`🪝 Setting webhook (attempt ${i}/6): ${url}`);
        await bot.telegram.setWebhook(url, { drop_pending_updates: false });
        console.log('✅ Webhook set! Bot is online.');
        return;
      } catch (e) {
        console.error(`❌ setWebhook attempt ${i} failed:`, e.message);
        if (i < 6) await new Promise(r => setTimeout(r, 10000));
      }
    }
    console.error('💀 Could not set webhook after 6 attempts');
  } else {
    // Fallback: polling
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});
      await bot.launch();
      console.log('🤖 Polling started');
    } catch (e) {
      console.error('❌ Polling launch error:', e.message);
    }
  }
});

const safeStop = (sig) => {
  console.log(`Stopping bot (${sig})...`);
  try { bot.stop(sig); } catch (e) { /* ignore: not running */ }
  process.exit(0);
};
process.once('SIGINT',  () => safeStop('SIGINT'));
process.once('SIGTERM', () => safeStop('SIGTERM'));
