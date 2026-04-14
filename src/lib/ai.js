import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
  if (!API_KEY) return "Помилка: API Ключ не знайдено!";

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
   - Формат посилань (використовуй Markdown):
     [🔎 Знайти "[Назва Деталі]" на Exist.ua](https://exist.ua/uk/search/?query=[Назва+Деталі+Для+Пошуку])
     [🛒 Знайти на Avto.pro](https://avto.pro/search/?q=[Назва+Деталі+Для+Пошуку])

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
        
        if (data.error?.message?.includes('blocked')) {
          return "🚫 **API не активовано.** \n\nВам потрібно активувати 'Generative Language API' у Google Cloud Console.";
        }
        
        return `❌ AI Error: ${data.error?.message || 'Unknown error'}`;
      } catch (error) {
        return "Помилка мережі AI.";
      }
    }
  }
};
