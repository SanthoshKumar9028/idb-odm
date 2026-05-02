import { describe, expect, it } from 'vitest';
import { ArraySchema } from './index';
import { NumberSchema } from '../../primitive/number';

describe('ArraySchema', () => {
  it('should cast arrays using value schema', () => {
    const arraySchema = new ArraySchema({
      name: 'numbers',
      valueSchema: new NumberSchema({ name: 'item' }),
    });

    const result = arraySchema.castFrom([1, 2, 3], {} as any);

    expect(result).toEqual([1, 2, 3]);
  });

  it('should pass through undefined/null for castFrom', () => {
    const arraySchema = new ArraySchema({
      name: 'numbers',
      valueSchema: new NumberSchema({ name: 'item' }),
    });

    expect(arraySchema.castFrom(undefined, {} as any)).toBeUndefined();
    expect(arraySchema.castFrom(null, {} as any)).toBeNull();
  });

  it('should throw for non-array values in castFrom', () => {
    const arraySchema = new ArraySchema({
      name: 'numbers',
      valueSchema: new NumberSchema({ name: 'item' }),
    });

    expect(() => arraySchema.castFrom('not-an-array', {} as any)).toThrow(
      'cant cast to a array'
    );
  });

  it('should validate elements with valueSchema rules', () => {
    const arraySchema = new ArraySchema({
      name: 'numbers',
      valueSchema: new NumberSchema({ name: 'item', min: 5 }),
    });

    expect(arraySchema.validate([5, 10], {} as any)).toBe(true);
    expect(() => arraySchema.validate([4, 10], {} as any)).toThrow(
      'item must be greater then or equal to 5'
    );
  });

  it('should apply base validationRules then element validation', () => {
    const arraySchema = new ArraySchema({
      name: 'numbers',
      valueSchema: new NumberSchema({ name: 'item' }),
      required: true,
    });

    expect(() => arraySchema.validate([], {} as any)).not.toThrow();
    expect(() => arraySchema.validate(null, {} as any)).toThrow(
      'numbers is required!'
    );
  });

  it('should return default value for undefined or null value', () => {
    const schema = new ArraySchema({
      valueSchema: new NumberSchema({ name: 'item', default: 2 }),
      default: [1, undefined],
    });
    expect(schema.castFrom(undefined, {})).toEqual([1, 2]);
    expect(schema.castFrom(null, {})).toEqual([1, 2]);
  });

  it('should execute and return default value for undefined or null value when function is given', () => {
    const schema = new ArraySchema({
      valueSchema: new NumberSchema({ name: 'item' }),
      default: () => [1, 2],
    });
    expect(schema.castFrom(undefined, {})).toEqual([1, 2]);
    expect(schema.castFrom(null, {})).toEqual([1, 2]);
  });

  it('clone should returns cloned schema', () => {
    const schema = new ArraySchema({
      valueSchema: new NumberSchema({ name: 'item' }),
    });
    expect(schema.clone()).toBeInstanceOf(ArraySchema);
  });
});
