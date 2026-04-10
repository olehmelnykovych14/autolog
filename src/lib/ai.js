import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const askGemini = async (userInput, carList, historyList) => {
  if (!genAI) {
    return "Помилка: API Ключ не налаштований. Додайте VITE_GEMINI_API_KEY у .env.local";
  }

  const context = `
Ти — професійний автомеханік AutoLog AI. 
Користувач має такі авто: ${JSON.stringify(carList)}.
Історія обслуговування: ${JSON.stringify(historyList)}.
Твоя задача: надавати чіткі, професійні поради українською мовою. 
Використовуй Markdown, списки та жирний текст. Будь ввічливим.
    `;

  const prompt = `${context}\n\nКлієнт: ${userInput}\nМеханік:`;
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Список моделей для черги (від найшвидшої до найнадійнішої)
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  
  let lastErrorMsg = "";

  for (const modelName of models) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        console.log(`🤖 AI checking model: ${modelName} (${4 - attempts} attempt)...`);
        // Використовуємо стабільну версію v1
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        attempts--;
        lastErrorMsg = error.message || String(error);
        const msg = lastErrorMsg.toLowerCase();
        
        // Якщо модель не знайдена (404), відразу переходимо до наступної
        if (msg.includes("404") || msg.includes("not found")) {
          console.warn(`❌ Model ${modelName} not available, skipping...`);
          break;
        }

        // Якщо сервер зайнятий, чекаємо і пробуємо знову
        const isTemporary = 
          msg.includes("429") || msg.includes("503") || msg.includes("500") || 
          msg.includes("quota") || msg.includes("overloaded") || msg.includes("busy");

        if (isTemporary && attempts > 0) {
          console.warn(`⏳ Server busy, retrying in 1.5s...`);
          await delay(1500);
          continue;
        }
        
        console.warn(`⚠️ Model ${modelName} failed, moving on to next.`);
        break; 
      }
    }
  }

  return `Помилка: Не вдалося отримати відповідь. Технічна причина: ${lastErrorMsg}. \n\n**Порада:** Спробуйте перевантажити сторінку через хвилину.`;
};
