const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();

export const askGemini = async (userInput, carList, historyList) => {
  if (!API_KEY) {
    return "Помилка: API Ключ не налаштований. Додайте VITE_GEMINI_API_KEY у .env.local";
  }

  const context = `
Ти — професійний автомеханік AutoLog AI.
Користувач має такі авто: ${JSON.stringify(carList)}.
Історія обслуговування: ${JSON.stringify(historyList)}.
Надавай поради українською, лаконічно, використовуючи Markdown.
    `;

  const prompt = {
    contents: [
      {
        parts: [
          { text: `${context}\n\nКлієнт: ${userInput}\nМеханік:` }
        ]
      }
    ]
  };

  try {
    console.log("🤖 AI: Sending raw fetch request...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const err = data.error?.message || response.statusText;
      console.error("❌ AI Raw Error:", data);
      
      if (response.status === 404) {
        return `Помилка 404: Модель не знайдена. Це означає, що ваш проект в Google AI Studio не підтримує gemini-1.5-flash. Спробуйте створити новий API Ключ у новому проекті.`;
      }
      
      return `Помилка AI (${response.status}): ${err}`;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Відповідь від AI порожня (можливо, цензура або помилка генерації).");
    
    return text;

  } catch (error) {
    console.error("❌ AI Network Error:", error);
    return `Помилка мережі AI: ${error.message}`;
  }
};
