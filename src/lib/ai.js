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

  // Список найбільш стабільних моделей Gemini
  const modelsToTry = [
    "gemini-1.5-flash", 
    "gemini-1.5-pro", 
    "gemini-1.0-pro" // Найнадійніший бекап
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 AI is checking (v1): ${modelName}...`);
      // Примусово використовуємо стабільну версію v1, щоб уникнути 404 у v1beta
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`✅ AI success with model: ${modelName}`);
      return text;
    } catch (error) {
      const msg = (error.message || String(error)).toLowerCase();
      console.warn(`⚠️ Model ${modelName} failed:`, msg);
      
      const isTemporary = 
        msg.includes("404") || 
        msg.includes("429") || 
        msg.includes("503") || 
        msg.includes("500") || 
        msg.includes("quota") || 
        msg.includes("demand") || 
        msg.includes("overloaded") ||
        msg.includes("busy");

      if (isTemporary) {
        continue;
      }
      
      return `Помилка зв'язку з AI (${modelName}): ${error.message || 'Unknown error'}`;
    }
  }
  return "Помилка: Всі доступні моделі Gemini тимчасово перевантажені або недоступні. Спробуйте через хвилину.";
};
