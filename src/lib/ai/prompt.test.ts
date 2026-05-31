import { describe, it, expect } from 'vitest';
import { parseFillResponse, parseAnalyzeResponse } from './prompt-parser';

describe('AI Parsing Logic', () => {
  describe('parseFillResponse', () => {
    it('should correctly parse valid JSON', () => {
      const rawResponse = '{"firstName": "Иван", "lastName": "Иванов"}';
      const result = parseFillResponse(rawResponse);
      expect(result).toEqual({ firstName: 'Иван', lastName: 'Иванов' });
    });

    it('should strip markdown code blocks and parse', () => {
      const rawResponse = '```json\n{"age": "25", "gender": "Мужской"}\n```';
      const result = parseFillResponse(rawResponse);
      expect(result).toEqual({ age: '25', gender: 'Мужской' });
    });

    it('should handle missing quotes around keys if standard JSON fails (fallback parse test can be handled if implemented, but currently parseFillResponse uses standard JSON.parse after stripping markdown)', () => {
      const rawResponse = '```\n  {"characterFunction": "Протагонист"}\n```';
      const result = parseFillResponse(rawResponse);
      expect(result).toEqual({ characterFunction: 'Протагонист' });
    });

    it('should throw an error on totally invalid JSON', () => {
      const rawResponse = 'Hello world, I am an AI and I forgot to output JSON.';
      expect(() => parseFillResponse(rawResponse)).toThrow();
    });
  });

  describe('parseAnalyzeResponse', () => {
    it('should parse a valid analyze response', () => {
      const rawResponse = JSON.stringify({
        summary: 'Хороший персонаж',
        categories: [
          {
            title: 'Психология',
            icon: '🧠',
            severity: 'contradiction',
            issues: [
              {
                title: 'Конфликт',
                severity: 'contradiction',
                fields: ['strength', 'weakness'],
                description: 'Описание проблемы',
                suggestion: 'Совет'
              }
            ]
          }
        ]
      });

      const result = parseAnalyzeResponse(rawResponse);
      expect(result.summary).toBe('Хороший персонаж');
      expect(result.categories.length).toBe(1);
      expect(result.categories[0].issues[0].title).toBe('Конфликт');
      // Verify english fields replacement logic
      expect(result.categories[0].issues[0].description).toBe('Описание проблемы');
    });

    it('should fall back to default severity if invalid severity provided', () => {
      const rawResponse = JSON.stringify({
        summary: 'Тест',
        categories: [
          {
            severity: 'invalid_severity',
            issues: [
              { severity: 'unknown', description: 'test' }
            ]
          }
        ]
      });

      const result = parseAnalyzeResponse(rawResponse);
      expect(result.categories[0].severity).toBe('gap');
      expect(result.categories[0].issues[0].severity).toBe('gap');
    });

    it('should replace english field IDs with bold russian labels in description and suggestion', () => {
      // Mocking CHARACTER_SCHEMA replacement
      // If we use 'firstName', it should be replaced with '**Имя**'
      const rawResponse = JSON.stringify({
        summary: 'Тест',
        categories: [
          {
            title: 'Тест',
            issues: [
              {
                title: 'Тест',
                description: 'Проблема в firstName и lastName',
                suggestion: 'Исправь firstName'
              }
            ]
          }
        ]
      });

      const result = parseAnalyzeResponse(rawResponse);
      expect(result.categories[0].issues[0].description).toContain('**Имя**');
      expect(result.categories[0].issues[0].description).toContain('**Фамилия**');
      expect(result.categories[0].issues[0].suggestion).toContain('**Имя**');
    });

    it('should calculate totalIssues correctly', () => {
      const rawResponse = JSON.stringify({
        categories: [
          { issues: [{}, {}] },
          { issues: [{}] }
        ]
      });

      const result = parseAnalyzeResponse(rawResponse);
      expect(result.totalIssues).toBe(3);
    });
  });
});
