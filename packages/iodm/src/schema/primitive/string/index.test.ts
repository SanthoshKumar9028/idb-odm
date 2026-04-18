import { describe, expect, it } from 'vitest';
import { StringSchema } from './index';
import { MinLengthValidationRule } from '../../validation-rule/string/min-length';
import { MaxLengthValidationRule } from '../../validation-rule/string/max-length';
import { MatchValidationRule } from '../../validation-rule/string/match';
import { EnumValidationRule } from '../../validation-rule/enum';

describe('StringSchema', () => {
  it('should return null and undefined as-is', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom(null)).toBe(null);
    expect(schema.castFrom(undefined)).toBe(undefined);
  });

  it('should cast string values as-is', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom('test123')).toBe('test123');
  });

  it('should cast other values as string', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom(100)).toBe('100');
  });

  it('should add MinLengthValidationRule when minLength option is provided', () => {
    const schema = new StringSchema({
      name: 'age',
      minLength: 10,
    });

    expect(
      schema.validationRules.some(
        (rule) => rule instanceof MinLengthValidationRule
      )
    ).toBe(true);
  });

  it('should add MaxLengthValidationRule when maxLength option is provided', () => {
    const schema = new StringSchema({
      name: 'age',
      maxLength: 10,
    });

    expect(
      schema.validationRules.some(
        (rule) => rule instanceof MaxLengthValidationRule
      )
    ).toBe(true);
  });

  it('should add EnumValidationRule when enum option is provided', () => {
    const schema = new StringSchema({
      name: 'age',
      enum: {
        values: ['one', 'two'],
        message: 'test',
      },
    });

    expect(
      schema.validationRules.some((rule) => rule instanceof EnumValidationRule)
    ).toBe(true);
  });

  it('should add MatchValidationRule when match option is provided', () => {
    const schema = new StringSchema({
      name: 'age',
      match: /abc/i,
    });

    expect(
      schema.validationRules.some((rule) => rule instanceof MatchValidationRule)
    ).toBe(true);
  });
});
