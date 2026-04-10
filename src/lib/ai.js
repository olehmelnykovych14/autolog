import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const askGemini = async (userInput, carList, historyList) => {
  if (!genAI) {
    return "Помилка: API Ключ не налаштований. Додайте VITE_GEMINI_API_KEY у .env.local або налаштування Vercel.";
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

  // Використовуємо -latest версії для максимальної стабільності
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];
  
  let lastErrorMsg = "";

  for (const modelName of models) {
    let attempts = 2;
    while (attempts > 0) {
      try {
        console.log(`🤖 AI trying: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        attempts--;
        lastErrorMsg = error.message || String(error);
        const msg = lastErrorMsg.toLowerCase();
        
        if (msg.includes("404") || msg.includes("not found")) {
          console.warn(`❌ Model ${modelName} not found.`);
          break;
        }

        const isTemporary = 
          msg.includes("429") || msg.includes("503") || msg.includes("500") || 
          msg.includes("quota") || msg.includes("overloaded") || msg.includes("busy");

        if (isTemporary && attempts > 0) {
          console.warn(`⏳ Busy, retrying...`);
          await delay(1000);
          continue;
        }
        break; 
      }
    }
  }

  return `Помилка AI. Технічна причина: ${lastErrorMsg}. \n\n**Важливо:** Переконайтеся, що ви оновили API Ключ у налаштуваннях (Environment Variables) на **Vercel** або **Render** та зробили пере-деплой (Redeploy).`;
};
