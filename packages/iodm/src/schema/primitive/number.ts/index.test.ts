import { describe, expect, it } from 'vitest';
import { NumberSchema } from './index';
import { MinValidationRule } from '../../validation-rule/min';

describe('NumberSchema', () => {
  it('should cast number values as-is', () => {
    const schema = new NumberSchema({ name: 'num' });
    expect(schema.castFrom(10)).toBe(10);
    expect(schema.castFrom(0)).toBe(0);
    expect(schema.castFrom(-5)).toBe(-5);
  });

  it('should allow undefined/null values through castFrom', () => {
    const schema = new NumberSchema({ name: 'num' });
    expect(schema.castFrom(undefined)).toBeUndefined();
    expect(schema.castFrom(null)).toBeNull();
  });

  it('should throw when castFrom gets non-number input', () => {
    const schema = new NumberSchema({ name: 'num' });
    expect(() => schema.castFrom('1')).toThrow('value is not a number');
    expect(() => schema.castFrom(NaN)).toThrow('value is not a number');
    expect(() => schema.castFrom({})).toThrow('value is not a number');
  });

  it('should add MinValidationRule when min option is provided', () => {
    const schema = new NumberSchema({ name: 'age', min: 18 });

    expect(
      schema.validationRules.some((rule) => rule instanceof MinValidationRule)
    ).toBe(true);
  });

  it('should validate values with min rule and throw when below min', () => {
    const schema = new NumberSchema({ name: 'age', min: 18 });

    expect(schema.validate(18, {} as any)).toBe(true);
    expect(schema.validate(20, {} as any)).toBe(true);
    expect(() => schema.validate(17, {} as any)).toThrow(
      'age must be greater then or equal to 18'
    );
  });

  it('should validate values without min rule', () => {
    const schema = new NumberSchema({ name: 'qty' });
    expect(schema.validate(1, {} as any)).toBe(true);
  });
});
