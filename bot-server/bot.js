const { Telegraf, Markup, session } = require('telegraf');
const admin = require('firebase-admin');
const LocalSession = require('telegraf-session-local');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

// --- Configuration ---
const MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_LOGIN || 'your_merchant_login';
const MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET || 'your_merchant_secret';
const MERCHANT_DOMAIN = process.env.MERCHANT_DOMAIN_NAME || 'your_domain.com';

// --- Firebase ---
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require("./serviceAccountKey.json");
  }
} catch (e) {
  console.error("Firebase Key Error:", e.message);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- Bot ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(cors()); // Дозволяємо CORS для фронтенду
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Middleware: Session ---
const localSession = new LocalSession({ database: 'sessions.json' });
bot.use(localSession.middleware());

const checkAuth = async (ctx, next) => {
  if (ctx.chat.type === 'private') {
    const snapshot = await db.collection('users').where('telegramId', '==', ctx.chat.id.toString()).get();
    if (snapshot.empty && !ctx.message?.text?.startsWith('/start')) {
      return ctx.reply('⚠️ Ваш акаунт не підключено.');
    }
    ctx.userDoc = !snapshot.empty ? snapshot.docs[0] : null;
    ctx.userData = ctx.userDoc ? ctx.userDoc.data() : null;
    ctx.userId = ctx.userDoc ? ctx.userDoc.id : null;
  }
  return next();
};
bot.use(checkAuth);

// --- Signature Generator ---
const generateSignature = (dataList) => {
  const baseString = dataList.join(';');
  return crypto.createHmac('md5', MERCHANT_SECRET).update(baseString).digest('hex');
};

// --- API: Create Payment Request ---
app.post('/api/payment/create', async (req, res) => {
  console.log('--- Incoming Request ---', req.body);
  const { userId, email, planName, amount: reqAmount } = req.body;
  if (!userId) return res.status(400).send('Missing ID');
  const clientEmail = email || 'guest@autolog.ua';

  const orderReference = `SUBS_${userId}_${Date.now()}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const amount = reqAmount || 250;
  const currency = 'UAH';
  const productName = planName || 'AutoLog Subscription';
  const productCount = 1;
  const productPrice = amount;

  // Поля для підпису
  const sigFields = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderReference,
    orderDate,
    amount,
    currency,
    productName,
    productCount,
    productPrice
  ];

  const merchantSignature = generateSignature(sigFields);

  console.log('--- Payment Debug ---');
  console.log('Fields for signature:', sigFields.join(';'));
  console.log('Generated Signature:', merchantSignature);

  const paymentData = {
    merchantAccount: MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    merchantSignature,
    orderReference,
    orderDate,
    amount,
    currency,
    productName: [productName],
    productCount: [productCount],
    productPrice: [productPrice],
    clientEmail: email,
    regularMode: 'monthly',
    regularAmount: amount,
    regularOn: 'Y',
    serviceUrl: `https://${req.headers.host || MERCHANT_DOMAIN}/api/webhook/wayforpay`
  };

  res.json(paymentData);
});

// --- Webhook: WayForPay Status ---
app.post('/api/webhook/wayforpay', async (req, res) => {
  const data = req.body;
  console.log(`📩 WayForPay Webhook: ${data.transactionStatus} for ${data.orderReference}`);

  // Відповідь WayForPay для підтвердження
  const responseData = {
    orderReference: data.orderReference,
    status: 'accept',
    time: Math.floor(Date.now() / 1000)
  };

  const responseSigFields = [responseData.orderReference, responseData.status, responseData.time];
  responseData.signature = generateSignature(responseSigFields);

  if (data.transactionStatus === 'Approved') {
    // Екстракція userId з orderReference (SUBS_userId_timestamp)
    const userId = data.orderReference.split('_')[1];
    
    try {
      if (userId) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          await userRef.update({
            plan: 'Business',
            updatedAt: Date.now(),
            billingStatus: 'active'
          });

          const userData = userDoc.data();
          if (userData.telegramId) {
            bot.telegram.sendMessage(userData.telegramId, 
              `🌟 *Дякуємо за підписку!*\n\nВаш тариф успішно оновлено до *Business*. Тепер AI-аналіз доступний вам без лімітів! 🚀`,
              { parse_mode: 'Markdown' }
            ).catch(e => console.error('TG Send Error:', e));
          }
        }
      }
    } catch (e) {
      console.error('Firestore Update Error:', e);
    }
  }

  res.json(responseData);
});

// --- API: Public Share Report ---
app.get('/api/share/:carId', async (req, res) => {
  const { carId } = req.params;
  try {
    const carDoc = await db.collection('cars').doc(carId).get();
    if (!carDoc.exists) return res.status(404).json({ error: 'Car not found' });
    
    const carData = carDoc.data();
    if (!carData.isPublic) return res.status(403).json({ error: 'This report is private' });

    // Fetch history
    const historySnap = await db.collection('history').where('carId', '==', carId).get();
    const historyData = historySnap.docs.map(d => ({ ...d.data(), id: d.id }));

    // Fetch owner profile to display name
    let userProfile = null;
    if (carData.userId) {
      const userDoc = await db.collection('users').doc(carData.userId).get();
      if (userDoc.exists) {
        userProfile = userDoc.data();
      }
    }

    res.json({
      car: { id: carDoc.id, ...carData },
      historyList: historyData,
      userProfile: userProfile
    });
  } catch (e) {
    console.error('Share Fetch Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- API: B2B CRM Push Record ---
app.post('/api/b2b/push-record', async (req, res) => {
  const { stoId, plate, title, cost, mileage, category, date } = req.body;
  if (!stoId || !plate) return res.status(400).json({ error: 'Missing data' });
  
  try {
    const stoDoc = await db.collection('users').doc(stoId).get();
    if (!stoDoc.exists) return res.status(404).json({ error: 'STO not found' });
    const stoData = stoDoc.data();
    if (stoData.accountType !== 'sto' || stoData.plan !== 'Business') return res.status(403).json({ error: 'Not a premium STO' });

    // Пошук авто
    const normalizedPlate = plate.toUpperCase().replace(/\s/g, '');
    const carSnap = await db.collection('cars').where('plate', '==', normalizedPlate).get();
    if (carSnap.empty) return res.status(404).json({ error: 'Car not found' });
    
    const carDoc = carSnap.docs[0];
    const carData = carDoc.data();

    // Створення запису напряму в історії (без підтвердження)
    const newRecord = {
      title,
      cost: Number(cost) || 0,
      mileage: Number(mileage) || 0,
      category: category || 'other',
      date: date || new Date().toISOString().split('T')[0],
      garage: stoData.stoName || 'AutoLog Partner',
      carId: carDoc.id,
      userId: carData.userId,
      createdAt: Date.now(),
      status: 'verified', // Відразу підтверджено
      source: 'sto_push',
      stoId: stoId
    };

    const docRef = await db.collection('history').add(newRecord);

    // Сповіщення водію
    if (carData.userId) {
      const driverDoc = await db.collection('users').doc(carData.userId).get();
      if (driverDoc.exists && driverDoc.data().telegramId) {
        bot.telegram.sendMessage(
          driverDoc.data().telegramId, 
          `🔧 *Новий сервісний запис!*\n\nСТО *${stoData.stoName || 'Партнер'}* додало запис для вашого *${carData.brand}* (${carData.plate}):\n\n📌 *${title}*\n💰 ${fmtCost(newRecord.cost)} ₴\n📅 ${newRecord.date}`,
          { parse_mode: 'Markdown' }
        ).catch(e => console.error('TG Driver Push Error:', e));
      }
    }

    res.json({ success: true, recordId: docRef.id });
  } catch(e) {
    console.error('B2B Push Error:', e);
    res.status(500).json({ error: 'Internal Error' });
  }
});

// --- API: B2B Booking ---
app.post('/api/b2b/book', async (req, res) => {
  const { stoId, userId, carId, date, time, issue } = req.body;
  
  try {
    const booking = {
      stoId, userId, carId, date, time, issue,
      status: 'pending',
      createdAt: Date.now()
    };
    const docRef = await db.collection('bookings').add(booking);

    // Знайдемо СТО
    const stoDoc = await db.collection('users').doc(stoId).get();
    // Знайдемо Авто та Водія для гарного тексту
    const carDoc = await db.collection('cars').doc(carId).get();
    const driverDoc = await db.collection('users').doc(userId).get();

    if (stoDoc.exists && stoDoc.data().telegramId) {
      bot.telegram.sendMessage(
        stoDoc.data().telegramId, 
        `📅 *Нова заявка на ремонт!*\n\nКлієнт: *${driverDoc.exists ? driverDoc.data().displayName || 'Клієнт' : 'Клієнт'}* (${driverDoc.exists ? driverDoc.data().email : ''})\nАвто: *${carDoc.exists ? carDoc.data().brand + ' ' + carDoc.data().plate : 'Невідомо'}*\nЧас: *${date} ${time}*\nПроблема: ${issue}`,
        { parse_mode: 'Markdown' }
      ).catch(e => console.error('TG Booking STO Notification Error:', e));
    }

    res.json({ success: true, bookingId: docRef.id });
  } catch (e) {
    res.status(500).json({ error: 'Internal Error' });
  }
});

// --- API: Booking Status Update ---
app.post('/api/b2b/booking-status', async (req, res) => {
  const { bookingId, status } = req.body;
  try {
    const bDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bDoc.exists) return res.status(404).json({ error: 'Booking not found' });
    await bDoc.ref.update({ status });

    const bData = bDoc.data();
    const driverDoc = await db.collection('users').doc(bData.userId).get();
    const stoDoc = await db.collection('users').doc(bData.stoId).get();
    
    if (driverDoc.exists && driverDoc.data().telegramId) {
      const stoName = stoDoc.exists ? stoDoc.data().stoName : 'СТО';
      const msg = status === 'confirmed' 
        ? `✅ Ваш запис на СТО *${stoName}* підтверджено!\n📅 ${bData.date} о ${bData.time}`
        : `❌ Ваш запис на СТО *${stoName}* на ${bData.date} о ${bData.time} було відхилено.`;
      
      bot.telegram.sendMessage(driverDoc.data().telegramId, msg, { parse_mode: 'Markdown' })
        .catch(e => null);
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Internal Error' });
  }
});

// --- Helpers ---
const fmtCost = (v) => v ? v.toLocaleString() : '0';
const normalizePlate = (p) => {
  if (!p) return '';
  const map = { 'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 'I': 'І', 'K': 'К', 'M': 'М', 'O': 'О', 'P': 'Р', 'T': 'Т', 'X': 'Х', 'Y': 'У' };
  let res = p.toUpperCase().replace(/\s/g, '');
  Object.keys(map).forEach(key => { res = res.split(key).join(map[key]); });
  return res;
};

const mainMenu = Markup.keyboard([
  ['🚗 Мої авто', '📜 Останні записи'],
  ['💰 Витрати 2024', '🧾 Додати запис (AI)'],
  ['👤 Мій профіль', '❓ Допомога']
]).resize();

// --- Bot Commands ---
bot.command(['start', 'menu'], async (ctx) => {
  if (ctx.startPayload) {
    try {
      const snapshot = await db.collection('users').where('tgLinkingToken.token', '==', ctx.startPayload).get();
      if (snapshot.empty) return ctx.reply('❌ Помилка: Код недійсний.');
      const userDoc = snapshot.docs[0];
      const data = userDoc.data();
      if (Date.now() > data.tgLinkingToken.expires) return ctx.reply('❌ Термін дії вичерпано.');
      await userDoc.ref.update({ telegramId: ctx.chat.id.toString(), tgLinkingToken: admin.firestore.FieldValue.delete() });
      return ctx.reply(`✅ Вітаємо! Акаунт підключено.`, mainMenu);
    } catch (e) { return ctx.reply('Помилка підключення.'); }
  }
  if (ctx.userData) return ctx.reply(`Привіт, ${ctx.userData.displayName || 'Драйвер'}! 👋`, mainMenu);
  ctx.reply('👋 Ласкаво просимо! Підключіть Telegram у Налаштуваннях додатка.');
});

bot.hears('🚗 Мої авто', async (ctx) => {
  const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
  if (carsSnap.empty) return ctx.reply('Гараж порожній.');
  let text = `🚗 *Ваш Гараж:*\n\n`;
  carsSnap.forEach(doc => {
    const car = doc.data(); text += `📍 *${car.brand} ${car.model || ''}*\n🔢 Номер: ${car.plate}\n\n`;
  });
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears('👤 Мій профіль', (ctx) => {
  const { displayName, email, plan } = ctx.userData;
  ctx.reply(`👤 *Мій профіль:*\n\n🔹 *Email:* ${email || '—'}\n🔹 *Тариф:* ${plan || 'Free'}\n🔹 *ID:* ${ctx.userId}`, { parse_mode: 'Markdown' });
});

bot.hears('📜 Останні записи', async (ctx) => {
  const historySnap = await db.collection('history').where('userId', '==', ctx.userId).get();
  if (historySnap.empty) return ctx.reply('У вас ще немає записів.');
  let text = `📜 *Ваші останні записи:*\n\n`;
  const records = historySnap.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  records.forEach(r => {
    text += `🔹 *${r.title}* (${r.date})\n💰 ${fmtCost(r.cost)} ₴\n\n`;
  });
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears('💰 Витрати 2024', async (ctx) => {
  const historySnap = await db.collection('history').where('userId', '==', ctx.userId).get();
  let total = 0;
  historySnap.forEach(d => total += (d.data().cost || 0));
  ctx.reply(`💰 *Загальні витрати:*\n\nВи витратили: *${fmtCost(total)} ₴*`, { parse_mode: 'Markdown' });
});

bot.hears('❓ Допомога', (ctx) => {
  ctx.reply('❓ *Допомога:*\n\nЯ - ваш AI помічник AutoLog. Я вмію розпізнавати чеки з СТО та зберігати вашу сервісну історію.\nНадішліть мені фото чека натиснувши "Додати запис (AI)".', { parse_mode: 'Markdown' });
});

bot.hears('🧾 Додати запис (AI)', (ctx) => ctx.reply('📸 Надішліть фото чека СТО.'));

bot.on('photo', async (ctx) => {
  const loadingMsg = await ctx.reply('🤖 Аналізую фото...');
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(link.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');
    const prompt = `Analyze this car service receipt or dashboard. Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "type": "receipt",
  "data": {
    "title": "Service name",
    "cost": 1000,
    "date": "YYYY-MM-DD",
    "plate": "AA0000AA",
    "garage": "Service Station"
  }
}`;
    const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return ctx.reply('❌ Помилка AI.');
    const aiData = JSON.parse(jsonMatch[0]);
    if (aiData.type === 'receipt') {
      const d = aiData.data || {};
      ctx.session.pendingRecord = { 
        title: d.title || 'Сервіс', 
        cost: Number(d.cost) || 0, 
        date: (d.date && d.date !== 'YYYY-MM-DD') ? d.date : new Date().toISOString().split('T')[0], 
        plate: d.plate && d.plate !== 'AA0000AA' ? d.plate : '', 
        garage: d.garage && d.garage !== 'Service Station' ? d.garage : 'AI' 
      };
      ctx.reply(`🧾 *Чек:* ${ctx.session.pendingRecord.title}\n💰 ${fmtCost(ctx.session.pendingRecord.cost)} ₴\n✅ Зберегти?`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('Так, зберегти ✅', 'select_car_for_record')], [Markup.button.callback('Скасувати ❌', 'cancel_ai_record')]])
      });
    } else ctx.reply(`💡 *AI Аналіз:* ${aiData.description}`);
  } catch (e) { 
    console.error('📸 Photo Analysis Error:', e);
    ctx.reply('❌ Помилка.'); 
  }
  finally { ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {}); }
});

bot.action('select_car_for_record', async (ctx) => {
  const carsSnap = await db.collection('cars').where('userId', '==', ctx.userId).get();
  if (carsSnap.empty) return ctx.reply('❌ У гаражі немає авто.');
  let buttons = carsSnap.docs.map(d => [Markup.button.callback(`${d.data().brand} (${d.data().plate})`, `save_to_car_${d.id}`)]);
  ctx.editMessageText('🔎 Оберіть авто:', { reply_markup: { inline_keyboard: buttons } });
});

bot.action(/save_to_car_(.+)/, async (ctx) => {
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
    const bData = change.doc.data();
    
    if (change.type === 'added') {
      // Сповіщення СТО про нове бронювання від водія
      if (bData.status === 'pending' && !bData.notifiedSTO) {
        await change.doc.ref.update({ notifiedSTO: true });
        
        const stoDocId = String(bData.stoId || 'unknown');
        const carDocId = String(bData.carId || 'unknown');
        const driverDocId = String(bData.userId || 'unknown');
        
        try {
          const stoDoc = await db.collection('users').doc(stoDocId).get();
          const carDoc = await db.collection('cars').doc(carDocId).get();
          const driverDoc = await db.collection('users').doc(driverDocId).get();

          if (stoDoc.exists && stoDoc.data().telegramId) {
            bot.telegram.sendMessage(
              stoDoc.data().telegramId, 
              `📅 *Нова заявка на ремонт!*\n\nКлієнт: *${driverDoc.exists ? driverDoc.data().displayName || 'Клієнт' : 'Клієнт'}*\nАвто: *${carDoc.exists ? carDoc.data().brand + ' ' + carDoc.data().plate : 'Невідомо'}*\nЧас: *${bData.date} ${bData.time}*\nПроблема: ${bData.issue}`,
              { parse_mode: 'Markdown' }
            ).catch(e => console.error(e));
          }
        } catch(e) { console.error('Error sending STO notif:', e) }
      }
      
      // Сповіщення водія про те, що СТО самостійно додало запис
      if (bData.status === 'confirmed' && bData.creator === 'sto' && !bData.notifiedClient) {
        await change.doc.ref.update({ notifiedClient: true, notifiedConfirmed: true });
        
        const driverDocId = String(bData.userId || 'unknown');
        const stoDocId = String(bData.stoId || 'unknown');
        
        try {
          const driverDoc = await db.collection('users').doc(driverDocId).get();
          const stoDoc = await db.collection('users').doc(stoDocId).get();
          
          if (driverDoc.exists && driverDoc.data().telegramId) {
            const stoName = stoDoc.exists ? stoDoc.data().stoName : 'СТО';
            bot.telegram.sendMessage(
              driverDoc.data().telegramId, 
              `✅ СТО *${stoName}* створило запис для вас!\n📅 ${bData.date} о ${bData.time}\n📌 ${bData.issue}`, 
              { parse_mode: 'Markdown' }
            ).catch(e => null);
          }
        } catch(e) { console.error('Error sending Client notif:', e) }
      }
    }

    if (change.type === 'modified') {
      // Сповіщення водію, якщо статус заявки змінено СТО
      const driverDocId = String(bData.userId || 'unknown');
      const stoDocId = String(bData.stoId || 'unknown');
      
      try {
        const driverDoc = await db.collection('users').doc(driverDocId).get();
        const stoDoc = await db.collection('users').doc(stoDocId).get();
        
        if (driverDoc.exists && driverDoc.data().telegramId) {
          const stoName = stoDoc.exists ? stoDoc.data().stoName : 'СТО';
          
          if (bData.status === 'confirmed' && !bData.notifiedConfirmed) {
            await change.doc.ref.update({ notifiedConfirmed: true });
            bot.telegram.sendMessage(driverDoc.data().telegramId, `✅ Ваш запис на СТО *${stoName}* підтверджено!\n📅 ${bData.date} о ${bData.time}`, { parse_mode: 'Markdown' }).catch(e => null);
          }
          
          if (bData.status === 'rejected' && !bData.notifiedRejected) {
            await change.doc.ref.update({ notifiedRejected: true });
            bot.telegram.sendMessage(driverDoc.data().telegramId, `❌ Ваш запис на СТО *${stoName}* було відхилено.`, { parse_mode: 'Markdown' }).catch(e => null);
          }
        }
      } catch(e) { console.error('Error sending modification notif:', e) }
    }
  }
});

// --- Server Launch ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`📡 Server port: ${PORT}`));
bot.launch().then(() => console.log('🚀 Bot is online!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
