import { beforeEach, describe, expect, it } from 'vitest';
import { MapSchema } from './index';

describe('MapSchema', () => {
  let schema: MapSchema;

  beforeEach(() => {
    schema = new MapSchema();
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

    it('should return the Map when value is a valid Map instance', () => {
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      const result = schema.castFrom(map);
      expect(result).toBe(map);
    });

    it('should throw an error when value is not a Map instance', () => {
      expect(() => schema.castFrom({})).toThrow('value is not a map');
      expect(() => schema.castFrom([])).toThrow('value is not a map');
      expect(() => schema.castFrom('string')).toThrow('value is not a map');
      expect(() => schema.castFrom(123)).toThrow('value is not a map');
      expect(() => schema.castFrom(true)).toThrow('value is not a map');
      expect(() => schema.castFrom(new Date())).toThrow('value is not a map');
    });
  });
});
