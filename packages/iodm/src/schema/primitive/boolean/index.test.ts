import { beforeEach, describe, expect, it } from 'vitest';
import { BooleanSchema } from './index';

describe('BooleanSchema', () => {
  let schema: BooleanSchema;

  beforeEach(() => {
    schema = new BooleanSchema();
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

    it('should return true for truthy values', () => {
      expect(schema.castFrom(true)).toBe(true);
      expect(schema.castFrom(1)).toBe(true);
      expect(schema.castFrom(-1)).toBe(true);
      expect(schema.castFrom('string')).toBe(true);
      expect(schema.castFrom(' ')).toBe(true);
      expect(schema.castFrom([])).toBe(true);
      expect(schema.castFrom({})).toBe(true);
      expect(schema.castFrom(new Date())).toBe(true);
      expect(schema.castFrom(Infinity)).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(schema.castFrom(false)).toBe(false);
      expect(schema.castFrom(0)).toBe(false);
      expect(schema.castFrom('')).toBe(false);
      expect(schema.castFrom(NaN)).toBe(false);
    });
  });
});
