import { beforeEach, describe, expect, it } from 'vitest';
import { DateSchema } from './index';

describe('DateSchema', () => {
  let schema: DateSchema;

  beforeEach(() => {
    schema = new DateSchema();
  });

  describe('castFrom', () => {
    it('should return undefined when value is undefined', () => {
      const result = schema.castFrom(undefined);
      expect(result).toBeUndefined();
    });

    it('should return null when value is null', () => {
      const result = schema.castFrom(null);
      expect(result).toBeNull();
    });

    it('should return the Date when value is a valid Date instance', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = schema.castFrom(date);
      expect(result).toBe(date);
    });

    it('should throw an error when value is not a Date instance', () => {
      expect(() => schema.castFrom('2023-01-01')).toThrow('value is not a date');
      expect(() => schema.castFrom(123)).toThrow('value is not a date');
      expect(() => schema.castFrom({})).toThrow('value is not a date');
      expect(() => schema.castFrom([])).toThrow('value is not a date');
      expect(() => schema.castFrom(true)).toThrow('value is not a date');
    });
  });
});
