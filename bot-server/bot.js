const { Telegraf, Markup, session } = require('telegraf');
const admin = require('firebase-admin');
const LocalSession = require('telegraf-session-local');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- Firebase Configuration ---
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Gemini AI Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- Bot Initialization ---
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- Middleware: Local Session ---
const localSession = new LocalSession({ database: 'sessions.json' });
bot.use(localSession.middleware());

// --- Middleware: Check if user is linked ---
const checkAuth = async (ctx, next) => {
  if (ctx.chat.type === 'private') {
    const snapshot = await db.collection('users').where('telegramId', '==', ctx.chat.id.toString()).get();
    if (snapshot.empty && !ctx.message?.text?.startsWith('/start')) {
      return ctx.reply('⚠️ Ваш акаунт не підключено. \nПерейдіть у додаток AutoLog (Налаштування -> Telegram) та згенеруйте код.');
    }
    ctx.userDoc = !snapshot.empty ? snapshot.docs[0] : null;
    ctx.userData = ctx.userDoc ? ctx.userDoc.data() : null;
    ctx.userId = ctx.userDoc ? ctx.userDoc.id : null;
  }
  return next();
};

bot.use(checkAuth);

// --- Helpers ---
const fmtCost = (v) => v ? v.toLocaleString() : '0';

// Нормалізація номерів (заміна схожих латинських літер на кириличні)
const normalizePlate = (p) => {
  if (!p) return '';
  const map = {
    'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 'I': 'І', 'K': 'К', 'M': 'М', 'O': 'О', 'P': 'Р', 'T': 'Т', 'X': 'Х', 'Y': 'У'
  };
  // Замінюємо латинські на кириличні для пошуку в базі (бо в базі зазвичай кирилиця)
  let res = p.toUpperCase().replace(/\s/g, '');
  // Але в вашій базі П - це П. Давайте зробимо універсально.
  // Більшість водіїв в Україні пишуть кирилицею.
  Object.keys(map).forEach(key => {
    res = res.split(key).join(map[key]);
  });
  // Спеціальний випадок для П (яка в латиниці часто розпізнається як P)
  // В українській мові "П" - це "P" в латиниці.
  return res;
};

const mainMenu = Markup.keyboard([
  ['🚗 Мої авто', '📜 Останні записи'],
  ['💰 Витрати 2024', '🧾 Додати запис (AI)'],
  ['👤 Мій профіль', '❓ Допомога']
]).resize();

const hideMenu = Markup.removeKeyboard();

// --- Commands & Handlers ---

bot.command(['start', 'menu'], async (ctx) => {
  const payload = ctx.startPayload;
  
  if (payload) {
    // Linking logic
    try {
      const snapshot = await db.collection('users').where('tgLinkingToken.token', '==', payload).get();
      if (snapshot.empty) return ctx.reply('❌ Помилка: Код недійсний.');

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();
      
      if (Date.now() > data.tgLinkingToken.expires) {
        return ctx.reply('❌ Термін дії коду вичерпано. Згенеруйте новий.');
      }

      await userDoc.ref.update({
        telegramId: ctx.chat.id.toString(),
        tgLinkingToken: admin.firestore.FieldValue.delete()
      });

      const name = data.displayName || (data.email ? data.email.split('@')[0] : 'Драйвер');
      return ctx.reply(`✅ Вітаємо, ${name}! \n\nВаш акаунт AutoLog успішно підключено.`, mainMenu);
    } catch (e) {
      console.error(e);
      return ctx.reply('Помилка підключення.');
    }
  }

  if (ctx.userData) {
    const name = ctx.userData.displayName || (ctx.userData.email ? ctx.userData.email.split('@')[0] : 'Драйвер');
    return ctx.reply(`Привіт, ${name}! 👋\nЧим я можу допомогти?`, mainMenu);
  }

  ctx.reply('👋 Ласкаво просимо до AutoLog! \n\nДля підключення акаунта згенеруйте код у додатку (Налаштування -> Telegram).');
});

bot.hears('🚗 Мої авто', async (ctx) => {
  try {
    const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    if (carsSnap.empty) return ctx.reply('У вашому гаражі порожньо.');

    let text = `🚗 *Ваш Гараж (${carsSnap.size}):*\n\n`;
    carsSnap.forEach(doc => {
      const car = doc.data();
      const carName = `${car.brand} ${car.model && car.model !== 'undefined' ? car.model : ''}`.trim();
      text += `📍 *${carName}*${car.year ? ` (${car.year})` : ''}\n`;
      text += `📟 Пробіг: ${car.mileage?.toLocaleString() || '0'} км\n`;
      text += `🔢 Номер: ${car.plate}\n\n`;
    });
    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('Помилка завантаження гаража.');
  }
});

bot.hears('📜 Останні записи', async (ctx) => {
  try {
    const histSnap = await db.collection('history').where('userId', '==', ctx.userId).get();
    if (histSnap.empty) return ctx.reply('Записів не знайдено.');

    const records = histSnap.docs.map(d => d.data())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    let text = `📜 *Останні 5 записів:*\n\n`;
    records.forEach(h => {
      text += `📅 ${h.date} | *${h.title}*\n💰 ${fmtCost(h.cost)} ₴ | ${h.mileage || '—'} км\n\n`;
    });
    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('Помилка завантаження історії.');
  }
});

bot.hears('💰 Витрати 2024', async (ctx) => {
  try {
    const year = new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const histSnap = await db.collection('history').where('userId', '==', ctx.userId).get();

    let total = 0;
    histSnap.forEach(d => {
      const data = d.data();
      if (data.date >= startOfYear) total += (data.cost || 0);
    });

    ctx.reply(`💰 *Статистика за ${year} рік:*\n\nЗагальна сума витрат: *${fmtCost(total)} ₴*`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('Помилка розрахунку витрат.');
  }
});

bot.hears('👤 Мій профіль', (ctx) => {
  const { displayName, email, plan, phone } = ctx.userData;
  const name = displayName || (email ? email.split('@')[0] : 'Драйвер');
  ctx.reply(`👤 *Мій профіль AutoLog:*\n\n🔹 *Ім'я:* ${name}\n🔹 *Email:* ${email || '—'}\n🔹 *Тариф:* ${plan || 'Free'}\n🔹 *ID:* ${ctx.userId}`, { parse_mode: 'Markdown' });
});

bot.hears('🧾 Додати запис (AI)', (ctx) => {
  ctx.reply('📸 Надішліть мені фото чека або квитанції зі СТО.\n\nAI розпізнає суму, дату та деталі робіт і запропонує створити запис.');
});

bot.hears('❓ Допомога', (ctx) => {
  ctx.reply('⚙️ Використовуйте кнопки знизу для навігації. \n\nВи також можете скидати фото приладової панелі для діагностики ламп.');
});

// --- AI Analysis Logic ---

bot.on('photo', async (ctx) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return ctx.reply('⚠️ AI не налаштовано. Напишіть адміністратору, щоб він додав GEMINI_API_KEY у файл .env');
  }

  const loadingMsg = await ctx.reply('🤖 Аналізую фото через AI...');

  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    
    // Download image for Gemini
    const response = await axios.get(link.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');

    const prompt = `Identify if this photo is a car service receipt (invoice) or a car dashboard warning lamp. 
    If it's a receipt, extract: 
    1. Plate (try to find a car number plate)
    2. Title (what kind of service - oil change, filters, repair, etc.)
    3. Cost (total amount as a number)
    4. Date (YYYY-MM-DD format)
    5. Mileage (as a number, if present)
    6. Garage (name of the service station/STO, company name like "СТО АВТОМАЙСТЕР")
    
    If it's a dashboard lamp, identify the lamp and suggest what to check.
    
    Return output in JSON format only:
    { "type": "receipt" | "dashboard", "data": { ...extracted fields... }, "description": "Brief summary in Ukrainian" }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const rawText = result.response.text();
    console.log("--- Gemini Raw Response ---\n", rawText);

    // Шукаємо JSON у відповіді (може бути оточений ```json ... ```)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ AI не повернув JSON:", rawText);
      return ctx.reply('❌ Помилка: AI не зміг структурувати дані. Спробуйте інше фото.');
    }

    const aiData = JSON.parse(jsonMatch[0]);
    console.log("✅ Парсинг успішний:", aiData);

    if (aiData.type === 'receipt') {
      const d = aiData.data;
      ctx.session.pendingRecord = {
        title: d.title || 'Сервіс (AI)',
        cost: d.cost || 0,
        date: d.date || new Date().toISOString().split('T')[0],
        plate: d.plate || '',
        mileage: d.mileage || 0,
        garage: d.garage || 'Telegram AI'
      };

      let msg = `🧾 *Знайдено чек:*\n\n`;
      msg += `🔹 *Опис:* ${ctx.session.pendingRecord.title}\n`;
      msg += `🔹 *Сума:* ${fmtCost(ctx.session.pendingRecord.cost)} ₴\n`;
      msg += `🔹 *Дата:* ${ctx.session.pendingRecord.date}\n`;
      msg += `🔹 *СТО:* ${ctx.session.pendingRecord.garage}\n`;
      msg += `🔹 *Номер авто:* ${ctx.session.pendingRecord.plate || '—'}\n`;
      msg += `🔹 *Пробіг:* ${ctx.session.pendingRecord.mileage || '—'} км\n\n`;
      msg += `✅ Зберегти цей запис у сервісну книжку?`;

      ctx.reply(msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Так, зберегти ✅', 'select_car_for_record')],
          [Markup.button.callback('Скасувати ❌', 'cancel_ai_record')]
        ])
      });
    } else {
      ctx.reply(`💡 *AI Аналіз (Панель приладів):*\n\n${aiData.description || 'Не вдалося розпізнати деталі.'}`);
    }
  } catch (e) {
    console.error(e);
    ctx.reply('❌ Помилка AI аналізу. Перевірте, чи фото чітке, або спробуйте пізніше.');
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
  }
});

bot.action('select_car_for_record', async (ctx) => {
  try {
    const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
    if (carsSnap.empty) return ctx.reply('❌ У вашому гаражі немає авто.');

    const rec = ctx.session.pendingRecord;
    const searchPlate = normalizePlate(rec.plate);
    
    // Спробуємо знайти найкращий збіг
    const matchedCar = carsSnap.docs.find(d => normalizePlate(d.data().plate) === searchPlate);
    
    if (matchedCar) {
      // Якщо знайшли чіткий збіг - зберігаємо одразу
      ctx.session.selectedCarId = matchedCar.data().id || matchedCar.id;
      return saveFinalRecord(ctx);
    }

    // Якщо номер не збігся - даємо вибір
    let buttons = carsSnap.docs.map(d => {
      const c = d.data();
      const label = `${c.brand} ${c.model && c.model !== 'undefined' ? c.model : ''} (${c.plate || '—'})`.trim();
      return [Markup.button.callback(label, `save_to_car_${d.id}`)];
    });

    ctx.editMessageText('🔎 Номер не знайдено. Оберіть авто для запису:', {
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (e) {
    ctx.answerCbQuery('Помилка вибору авто.');
  }
});

bot.action(/save_to_car_(.+)/, async (ctx) => {
  const carDocId = ctx.match[1];
  try {
    const carSnap = await db.collection('cars').doc(carDocId).get();
    if (!carSnap.exists) return ctx.reply('Авто не знайдено.');
    
    const carData = carSnap.data();
    ctx.session.selectedCarId = carData.id || carSnap.id;
    await saveFinalRecord(ctx, carData);
  } catch (e) {
    ctx.answerCbQuery('Помилка збереження.');
  }
});

async function saveFinalRecord(ctx, forcedCarData = null) {
  const rec = ctx.session.pendingRecord;
  const carId = ctx.session.selectedCarId;
  
  if (!rec || !carId) return ctx.reply('Дані застаріли.');

  try {
    let carData = forcedCarData;
    if (!carData) {
      // Якщо carData не передано (був чіткий збіг), шукаємо його
      const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
      const carDoc = carsSnap.docs.find(d => (d.data().id || d.id) === carId);
      if (carDoc) carData = carDoc.data();
    }

    const finalRecord = {
      ...rec,
      carId,
      userId: ctx.userId,
      createdAt: Date.now(),
      status: 'verified',
      garage: rec.garage // Використовуємо розпізнану назву СТО
    };

    await db.collection('history').add(finalRecord);
    const carName = carData ? `${carData.brand} ${carData.model && carData.model !== 'undefined' ? carData.model : ''}`.trim() : 'Авто';
    // Використовуємо окрему відповідь з клавіатурою, бо editMessageText не підтримує зміну ReplyKeyboard
    await ctx.editMessageText(`✅ Запис «${rec.title}» успішно збережено для *${carName}*!`, { parse_mode: 'Markdown' });
    await ctx.reply('Ви повернулися в головне меню:', mainMenu);
    
    ctx.session.pendingRecord = null;
    ctx.session.selectedCarId = null;
  } catch (e) {
    console.error(e);
    ctx.reply('❌ Помилка при збереженні запису.');
  }
}

bot.action('save_ai_record', async (ctx) => {
  // Ця дія тепер замінена на select_car_for_record для безпеки
  ctx.answerCbQuery('Використовуйте оновлену кнопку');
});

bot.action('cancel_ai_record', (ctx) => {
  ctx.session.pendingRecord = null;
  ctx.editMessageText('❌ Аналіз скасовано.');
});

// --- Cleanup & Launch ---

bot.launch().then(() => console.log('🚀 AutoLog AI Bot is live with Interactive Menus!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
