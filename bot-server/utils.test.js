const { normPlate, parseDateSafe, fmtCost } = require('./utils');

describe('Bot Utils', () => {
  describe('normPlate', () => {
    it('should map Latin characters to Cyrillic', () => {
      expect(normPlate('BC4554EP')).toBe('ВС4554ЕП');
      expect(normPlate('p')).toBe('П');
      expect(normPlate('a')).toBe('А');
    });

    it('should handle mixed cases and spaces', () => {
      expect(normPlate(' bc4554ep ')).toBe('ВС4554ЕП');
    });

    it('should return empty string for null/undefined', () => {
      expect(normPlate(null)).toBe('');
    });
  });

  describe('parseDateSafe', () => {
    it('should parse DD.MM.YYYY', () => {
      const d = parseDateSafe('12.04.2026');
      expect(d.getDate()).toBe(12);
      expect(d.getMonth()).toBe(3); // April is 3
      expect(d.getFullYear()).toBe(2026);
    });

    it('should parse YYYY-MM-DD', () => {
      const d = parseDateSafe('2026-04-12');
      expect(d.getDate()).toBe(12);
      expect(d.getMonth()).toBe(3);
    });

    it('should return current date for empty string', () => {
      const d = parseDateSafe('');
      expect(d instanceof Date).toBe(true);
    });
  });

  describe('fmtCost', () => {
    it('should format numbers with spaces', () => {
      expect(fmtCost(1500)).toContain('1\u00A0500'); // Note: toLocaleString uses non-breaking space
    });
    
    it('should return 0 for zero or null', () => {
      expect(fmtCost(0)).toBe('0');
      expect(fmtCost(null)).toBe('0');
    });
  });
});
