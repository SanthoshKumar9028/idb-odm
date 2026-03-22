import { beforeEach, describe, expect, it } from 'vitest';
import { SetSchema } from './index';

describe('SetSchema', () => {
  let schema: SetSchema;

  beforeEach(() => {
    schema = new SetSchema();
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

    it('should return the Set when value is a valid Set instance', () => {
      const set = new Set(['value1', 'value2', 'value3']);
      const result = schema.castFrom(set);
      expect(result).toBe(set);
    });

    it('should throw an error when value is not a Set instance', () => {
      expect(() => schema.castFrom({})).toThrow('value is not a set');
      expect(() => schema.castFrom([])).toThrow('value is not a set');
      expect(() => schema.castFrom('string')).toThrow('value is not a set');
      expect(() => schema.castFrom(123)).toThrow('value is not a set');
      expect(() => schema.castFrom(true)).toThrow('value is not a set');
      expect(() => schema.castFrom(new Date())).toThrow('value is not a set');
      expect(() => schema.castFrom(new Map())).toThrow('value is not a set');
    });
  });
});
