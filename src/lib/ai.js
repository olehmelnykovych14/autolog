import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Функція-детектор: перевіряє, що взагалі бачить цей ключ
const checkModels = async () => {
  if (!API_KEY) return;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    const data = await res.json();
    console.log("🛠 AI DIAGNOSTIC: Доступні моделі для вашого ключа:", data.models?.map(m => m.name) || "ЖОДНОЇ (Ключ недійсний)");
  } catch (e) {
    console.error("🛠 AI DIAGNOSTIC ERROR:", e);
  }
};
checkModels();

export const askGemini = async (userInput, carList, historyList) => {
  if (!API_KEY) return "Помилка: API Ключ не знайдено!";

  const promptText = `Ти автомеханік. Авто: ${JSON.stringify(carList)}. Питання: ${userInput}`;

  // Список моделей для тесту
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      return result.response.text();
    } catch (e) {
      console.warn(`🤖 SDK Error (${modelName}):`, e.message);
    }
  }

  // Fallback
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      }
    );

    const data = await response.json();
    if (response.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text;

    return `❌ КЛЮЧ НЕМАЄ ДОСТУПУ (404). \n\n**РІШЕННЯ:** Зайдіть на aistudio.google.com і створіть НОВИЙ ключ у НОВОМУ проекті ("Create API key in new project"). Поточний ключ не працює з Gemini.`;
  } catch (error) {
    return "Помилка мережі AI.";
  }
};
