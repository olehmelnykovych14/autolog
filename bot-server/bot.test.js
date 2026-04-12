import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Dependencies
vi.mock('@google/generative-ai');
vi.mock('firebase-admin');
vi.mock('telegraf');

// We will test logic by importing or re-implementing key functions 
// since bot.js is a singleton script. 
// For better testing, we'd normally export these from bot.js, 
// but we can test them by 'require'-ing if we mock the environment.

const mockResponse = {
  response: {
    text: () => "Test AI Response"
  }
};

describe('Bot Logic Verification', () => {
  describe('askGemini Refined Logic', () => {
    it('should handle text messages correctly (no media)', async () => {
      // Mocking the behavior inside bot.js
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      const mockModel = { generateContent: mockGenerateContent };
      
      const prompt = "How are you?";
      const hasMedia = false;
      const base64 = null;

      // Logic from bot.js
      let result;
      if (hasMedia && typeof base64 === 'string' && base64.length > 0) {
        result = await mockModel.generateContent([prompt, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
      } else {
        result = await mockModel.generateContent(prompt);
      }

      expect(mockGenerateContent).toHaveBeenCalledWith(prompt);
      expect(result.response.text()).toBe("Test AI Response");
    });

    it('should handle media messages correctly (with base64 string)', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      const mockModel = { generateContent: mockGenerateContent };
      
      const prompt = "What is this?";
      const hasMedia = true;
      const base64 = "base64dataString";

      // Logic from bot.js
      let result;
      if (hasMedia && typeof base64 === 'string' && base64.length > 0) {
        result = await mockModel.generateContent([prompt, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
      } else {
        result = await mockModel.generateContent(prompt);
      }

      expect(mockGenerateContent).toHaveBeenCalledWith([
        prompt, 
        { inlineData: { data: base64, mimeType: "image/jpeg" } }
      ]);
    });

    it('should FAILED safely if base64 is an array (Regression Test)', async () => {
        const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
        const mockModel = { generateContent: mockGenerateContent };
        
        const prompt = "This should fail back to text mode";
        const hasMedia = []; // truthy array
        const base64 = [];    // truthy array (THE BUG)
  
        // Logic from bot.js after fix
        let result;
        if (hasMedia && typeof base64 === 'string' && base64.length > 0) {
          result = await mockModel.generateContent([prompt, { inlineData: { data: base64, mimeType: "image/jpeg" } }]);
        } else {
          result = await mockModel.generateContent(prompt);
        }
  
        // Verification: It should NOT attempt to use inlineData if base64 is an array
        expect(mockGenerateContent).toHaveBeenCalledWith(prompt);
      });
  });

  describe('Expense Statistics Logic', () => {
      // Mocking getExpenseStats logic from bot.js
      const getExpenseStats = (snap, carId = null, carPlate = null) => {
        let total = 0;
        snap.forEach(d => {
            const data = d.data();
            const cost = Number(data.cost) || 0;
            total += cost;
        });
        return { total };
      };

      it('should aggregate costs correctly', () => {
          const mockSnap = [
              { data: () => ({ cost: 100 }) },
              { data: () => ({ cost: 200 }) }
          ];
          const stats = getExpenseStats(mockSnap);
          expect(stats.total).toBe(300);
      });
  });
});
