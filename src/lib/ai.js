import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

if (API_KEY) {
  console.log(`🤖 AI: Checked key prefix: ${API_KEY.substring(0, 4)}...`);
}

export const askGemini = async (userInput, carList, historyList) => {
  if (!API_KEY) {
    return "Помилка: API Ключ не налаштований у Vercel/Vite.";
  }

  const context = `
Ти — професійний автомеханік AutoLog AI. 
Користувач має такі авто: ${JSON.stringify(carList)}.
Історія обслуговування: ${JSON.stringify(historyList)}.
Надавай поради українською, лаконічно, використовуючи Markdown.
    `;

  const promptText = `${context}\n\nКлієнт: ${userInput}\nМеханік:`;

  // --- Спроба 1: SDK (Сучасні моделі) ---
  const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
  
  for (const modelName of models) {
    try {
      console.log(`🤖 AI (SDK) trying: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      return result.response.text();
    } catch (e) {
      console.warn(`⚠️ SDK failed for ${modelName}: ${e.message}`);
    }
  }

  // --- Спроба 2: Прямий FETCH (План Б) ---
  console.log("🚀 AI: SDK failed. Switching to direct HTTP fallback...");
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    const data = await response.json();
    if (response.ok) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI повернув порожню відповідь.";
    }

    console.error("❌ AI Direct Fetch Error:", data);
    const errDetail = data.error?.message || response.statusText;
    return `Помилка AI (404/Direct): ${errDetail}. \n\n**Важливо:** Якщо ви бачите це повідомлення, перевірте кабінет Google AI Studio — можливо, ваш ключ не активований для цього проекту.`;

  } catch (error) {
    return `Критична помилка мережі AI: ${error.message}`;
  }
};
