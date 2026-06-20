import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "../firebase";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const isQuotaError = (msg = '') => /quota|RESOURCE_EXHAUSTED|rate.?limit|\b429\b|exceeded/i.test(String(msg));

// Перетворює технічну помилку Gemini на зрозуміле повідомлення українською —
// користувач ніколи не має бачити сирий текст з URL та англійською.
const friendlyAiError = (msg = '') => {
  const m = String(msg);
  if (isQuotaError(m)) {
    const retry = m.match(/retry in ([\d.]+)\s*s/i) || m.match(/retryDelay["'\s:]+([\d.]+)s/i);
    const secs = retry ? Math.ceil(parseFloat(retry[1])) : null;
    return `🚦 **AI тимчасово перевантажений** — вичерпано ліміт запитів.\n\nСпробуйте ${secs ? `за ~${secs} с` : 'за хвилину'}.`;
  }
  if (/blocked|not.?activated|PERMISSION_DENIED|API.?KEY|API_KEY_INVALID/i.test(m)) {
    return "🚫 **Сервіс AI тимчасово недоступний.** Спробуйте пізніше або зверніться до підтримки.";
  }
  return "⚠️ **AI тимчасово недоступний.** Спробуйте трохи пізніше.";
};

// Викликає бекенд-проксі /api/ai з Firebase ID-токеном (ключ Gemini лишається на сервері).
const callAiProxy = async (payload) => {
  const user = auth?.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  if (!idToken) throw new Error('no-auth');
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`proxy-${res.status}`);
  const data = await res.json();
  return data.text;
};

// Функція-детектор: перевіряє, що взагалі бачить цей ключ
const checkModels = async () => {
  if (!API_KEY) return;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();
    console.log("🛠 AI DIAGNOSTIC: Доступні моделі для вашого ключа:", data.models?.map(m => m.name) || "ЖОДНОЇ (Ключ недійсний)");
  } catch (e) {
    console.error("🛠 AI DIAGNOSTIC ERROR:", e);
  }
};
checkModels();

export const askGemini = async (userInput, carList, historyList, mediaData = null) => {
  // 1) Бекенд-проксі: ключ не у браузері.
  try {
    const text = await callAiProxy({ userInput, carList, historyList, mediaData });
    if (text) return text;
  } catch (proxyErr) {
    console.warn('AI proxy unavailable, fallback to direct:', proxyErr.message);
  }

  // 2) Легасі прямий виклик — лише поки VITE_GEMINI_API_KEY ще в білді (перехідний період).
  // Прибери цю змінну з Vercel → лишиться тільки проксі, ключ зникне з бандла.
  if (!API_KEY) return friendlyAiError('');

  const promptText = `Ти — Професійний AI Механік AutoLog.
Відповідай українською мовою, лаконічно, використовуючи Markdown.

КОНТЕКСТ КОРИСТУВАЧА:
- Автомобілі: ${JSON.stringify(carList)}
- Історія сервісу: ${JSON.stringify(historyList)}

ТВОЄ ЗАВДАННЯ:
1. Якщо користувач надіслав ФОТО:
   - Проаналізуй зображення (панель приладів, деталі, чеки).
   - Дай точну діагностику або пораду.
   - Якщо це ЧЕК, виділи суму та тип робіт.
2. Якщо користувач надіслав ГОЛОСОВЕ або ТЕКСТ:
   - Відповідай, враховуючи специфікації його авто (рік, модель).
   - Давай конкретні поради щодо обслуговування.
3. ПІДБІР ЗАПЧАСТИН (ДЛЯ ВСІХ ТИПІВ ЗАПИТІВ):
   - Якщо ти ідентифікуєш конкретну несправну або зношену деталь (гальмівні колодки, фільтри, акумулятор тощо), обов'язково додай в кінці відповіді прямі посилання на її пошук.
   - Вказуючи посилання, ВАЖЛИВО ЗАМІНИТИ всі пробіли на символ "+" у самій URL-адресі.
   - Формат посилань (використовуй Markdown) — використовуємо пошук Google по сайтах для точності:
     [🔎 Знайти "[Назва Деталі]" на Exist.ua](https://www.google.com/search?q=site:exist.ua+[Назва+Деталі+Для+Пошуку])
     [🛒 Знайти на Avto.pro](https://www.google.com/search?q=site:avto.pro+[Назва+Деталі+Для+Пошуку])

Питання: ${userInput || "Проаналізуй надіслані дані"}`;

  // Пріоритетно використовуємо 1.5-flash, але деякі ключі (як ваш) вимагають "gemini-flash-latest"
  const modelName = "gemini-1.5-flash";
  const fallbackModel = "gemini-flash-latest";
  
  let content;
  if (mediaData) {
    // mediaData expected: { data: 'base64...', mimeType: 'image/jpeg' }
    content = [promptText, { inlineData: mediaData }];
  } else {
    content = promptText;
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
    const result = await model.generateContent(content);
    return result.response.text();
  } catch (e) {
    // Квота/ліміт: фолбек-моделі б'ють у той самий ключ і теж впадуть → одразу зрозуміле повідомлення.
    if (isQuotaError(e?.message)) return friendlyAiError(e.message);
    try {
      const model = genAI.getGenerativeModel({ model: fallbackModel }, { apiVersion: 'v1beta' });
      const result = await model.generateContent(content);
      return result.response.text();
    } catch (fallbackErr) {
      console.error(`🤖 Fallback SDK Error:`, fallbackErr.message);
      
      // Final Direct fetch (Direct API call as absolute fallback)
      try {
        const parts = [{ text: promptText }];
        if (mediaData) parts.push({ inlineData: mediaData });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );

        const data = await response.json();
        if (response.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Лог із сирим текстом — лише в консоль для діагностики, не користувачу.
        console.error('🤖 AI API Error:', data.error?.message || 'Unknown error');
        return friendlyAiError(data.error?.message);
      } catch (error) {
        console.error('🤖 AI network error:', error?.message);
        return "⚠️ **Немає звʼязку з AI.** Перевірте інтернет і спробуйте ще раз.";
      }
    }
  }
};
