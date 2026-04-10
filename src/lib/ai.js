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

  const variants = [
    { name: "gemini-1.5-flash", version: "v1" },
    { name: "gemini-1.5-flash", version: "v1beta" },
    { name: "gemini-1.5-flash-8b", version: "v1" },
    { name: "gemini-1.5-pro", version: "v1" },
    { name: "gemini-2.0-flash-exp", version: "v1beta" }
  ];
  
  let lastErrorMsg = "";

  for (const variant of variants) {
    let retries = 2; // Менше ретраїв, щоб швидше перебрати варіанти
    while (retries > 0) {
      try {
        console.log(`🤖 AI trying: ${variant.name} (${variant.version})...`);
        const model = genAI.getGenerativeModel({ model: variant.name }, { apiVersion: variant.version });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`✅ AI success with: ${variant.name}`);
        return text;
      } catch (error) {
        retries--;
        lastErrorMsg = error.message || String(error);
        const msg = lastErrorMsg.toLowerCase();
        
        // Якщо модель не знайдена, відразу переходимо до наступного варіанту
        if (msg.includes("404") || msg.includes("not found")) {
          console.warn(`❌ ${variant.name} (${variant.version}) not found.`);
          break;
        }

        const isTemporary = 
          msg.includes("429") || 
          msg.includes("503") || 
          msg.includes("500") || 
          msg.includes("quota") || 
          msg.includes("demand") || 
          msg.includes("overloaded") ||
          msg.includes("busy");

        if (isTemporary && retries > 0) {
          console.warn(`⏳ Busy, retrying in 1s...`);
          await delay(1000);
          continue;
        }
        
        console.warn(`⚠️ Failed variant:`, msg);
        break; 
      }
    }
  }
  return `Помилка AI. Причина: МОДЕЛІ НЕДОСТУПНІ. (Остання помилка: ${lastErrorMsg}). Будь ласка, перевірте версію API в Google AI Studio.`;
};
