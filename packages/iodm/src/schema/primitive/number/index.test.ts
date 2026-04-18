import { describe, expect, it } from 'vitest';
import { NumberSchema } from './index';
import { MinValidationRule } from '../../validation-rule/number/min';
import { MaxValidationRule } from '../../validation-rule/number/max';
import { EnumValidationRule } from '../../validation-rule/enum';

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

  it('should add MaxValidationRule when max option is provided', () => {
    const schema = new NumberSchema({ name: 'age', max: 18 });

    expect(
      schema.validationRules.some((rule) => rule instanceof MaxValidationRule)
    ).toBe(true);
  });

  it('should add EnumValidationRule when enum option is provided', () => {
    const schema = new NumberSchema({
      name: 'age',
      enum: {
        values: [1, 2],
        message: 'message',
      },
    });

    expect(
      schema.validationRules.some((rule) => rule instanceof EnumValidationRule)
    ).toBe(true);
  });
});
