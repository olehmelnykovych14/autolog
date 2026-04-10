import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const askGemini = async (userInput, carList, historyList) => {
  if (!genAI) {
    return "Помилка: API Ключ не налаштований. Будь ласка, додайте VITE_GEMINI_API_KEY у .env.local";
  }

  const context = `
Ти — професійний автомеханік зі стажем 20 років. Твоє ім'я — AutoLog AI.
Зараз ти консультуєш користувача додатку AutoLog.
Ось автомобілі користувача: ${JSON.stringify(carList)}.
Ось історія обслуговування (ТО та ремонти): ${JSON.stringify(historyList)}.

Твоя задача: надавати чіткі, професійні поради українською мовою.
Використовуй Markdown для форматування:
- **Жирний текст** для назв запчастин, вузлів авто та важливих термінів.
- Використовуй **марковані списки** для переліку порад.
- Якщо запит стосується діагностики, намагайся посилатись на дані його авто та пробіг.
- Якщо бачиш, що остання заміна масла була більше 10к км назад, обов'язково нагадай.
- Відповідай лаконічно, але структуровано.
- Користувач — твій клієнт, будь ввічливим.
    `;

  const prompt = `${context}\n\nКлієнт: ${userInput}\nМеханік:`;

  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Список найбільш стабільних моделей Gemini
  const modelsToTry = [
    "gemini-1.5-flash", 
    "gemini-1.5-pro", 
    "gemini-1.0-pro" 
  ];
  
  let lastErrorMsg = "";

  for (const modelName of modelsToTry) {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🤖 AI checking model: ${modelName} (${4 - retries} attempt)...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`✅ AI success with model: ${modelName}`);
        return text;
      } catch (error) {
        retries--;
        lastErrorMsg = error.message || String(error);
        const msg = lastErrorMsg.toLowerCase();
        
        const isTemporary = 
          msg.includes("429") || 
          msg.includes("503") || 
          msg.includes("500") || 
          msg.includes("quota") || 
          msg.includes("demand") || 
          msg.includes("overloaded") ||
          msg.includes("busy");

        if (isTemporary && retries > 0) {
          console.warn(`⏳ Model ${modelName} busy, retrying in 1.5s...`);
          await delay(1500);
          continue;
        }
        
        console.warn(`⚠️ Model ${modelName} failed or exhausted, moving on:`, msg);
        break; 
      }
    }
  }
  return `Помилка: Не вдалося отримати відповідь від AI. Технічна причина: ${lastErrorMsg}. Спробуйте оновити сторінку або перевірте API Ключ.`;
};
