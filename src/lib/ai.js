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

Питання: ${userInput || "Проаналізуй надіслані дані"}`;

  const modelName = "gemini-2.0-flash";
  try {
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
    
    let content;
    if (mediaData) {
      // mediaData expected: { data: 'base64...', mimeType: 'image/jpeg' }
      content = [promptText, { inlineData: mediaData }];
    } else {
      content = promptText;
    }

    const result = await model.generateContent(content);
    return result.response.text();
  } catch (e) {
    console.error(`🤖 SDK Error:`, e.message);
    
    // Fallback approach (Direct fetch)
    try {
      const parts = [{ text: promptText }];
      if (mediaData) {
        parts.push({ inlineData: mediaData });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }] })
        }
      );

      const data = await response.json();
      if (response.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text;
      return `❌ AI Error: ${data.error?.message || 'Unknown error'}`;
    } catch (error) {
      return "Помилка мережі AI.";
    }
  }
};
