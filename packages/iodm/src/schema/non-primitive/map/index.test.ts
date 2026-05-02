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
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
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

    it('should return default value for undefined or null value', () => {
      const schema = new MapSchema({
        default: new Map([[1, 2]]),
      });
      expect(schema.castFrom(undefined)).toEqual(new Map([[1, 2]]));
      expect(schema.castFrom(null)).toEqual(new Map([[1, 2]]));
    });

    it('should execute and return default value for undefined or null value when function is given', () => {
      const schema = new MapSchema({
        default: () => new Map([[1, 2]]),
      });
      expect(schema.castFrom(undefined)).toEqual(new Map([[1, 2]]));
      expect(schema.castFrom(null)).toEqual(new Map([[1, 2]]));
    });
  });

  describe('clone', () => {
    it('clone should returns cloned schema', () => {
      const schema = new MapSchema({ name: 'test' });
      expect(schema.clone()).toBeInstanceOf(MapSchema);
    });
  });
});
