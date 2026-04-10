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
Надавай поради українською, лаконічно, використовуючи Markdown.
    `;

  const prompt = `${context}\n\nКлієнт: ${userInput}\nМеханік:`;
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Пробуємо лише дві основні моделі без примусових версій API
  const models = ["gemini-1.5-flash", "gemini-pro"];
  
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
        
        if (msg.includes("404") || msg.includes("not found")) break; // Next model if 404

        if (attempts > 0) {
          await delay(1000);
          continue;
        }
        break;
      }
    }
  }

  return `Помилка AI (404/API). Технічна причина: ${lastErrorMsg}. \n\n**Порада:** Будь ласка, зайдіть у [Google AI Studio](https://aistudio.google.com/app/apikey) і перевірте, чи створено API-ключ саме для проекту "Default Gemini Project" та чи доступні там моделі Gemini 1.5 Flash.`;
};
