import { beforeEach, describe, expect, it } from 'vitest';
import { DateSchema } from './index';
import { MaxDateValidationRule } from '../../validation-rule/date/max-date';
import { MinDateValidationRule } from '../../validation-rule/date/min-date';

describe('DateSchema', () => {
  let schema: DateSchema;

  beforeEach(() => {
    schema = new DateSchema();
  });

  it('should add MinDateValidationRule when maxLength option is provided', () => {
    const schema = new DateSchema({
      name: 'age',
      min: new Date(),
    });

    expect(
      schema.validationRules.some(
        (rule) => rule instanceof MinDateValidationRule
      )
    ).toBe(true);
  });

  it('should add MaxDateValidationRule when maxLength option is provided', () => {
    const schema = new DateSchema({
      name: 'age',
      max: new Date(),
    });

    expect(
      schema.validationRules.some(
        (rule) => rule instanceof MaxDateValidationRule
      )
    ).toBe(true);
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
      expect(() => schema.castFrom('2023-01-01')).toThrow(
        'value is not a date'
      );
      expect(() => schema.castFrom(123)).toThrow('value is not a date');
      expect(() => schema.castFrom({})).toThrow('value is not a date');
      expect(() => schema.castFrom([])).toThrow('value is not a date');
      expect(() => schema.castFrom(true)).toThrow('value is not a date');
    });

    it('should return default value for undefined or null value', () => {
      const schema = new DateSchema({
        default: new Date('2000-2-2'),
      });
      expect(schema.castFrom(undefined)).toEqual(new Date('2000-2-2'));
      expect(schema.castFrom(null)).toEqual(new Date('2000-2-2'));
    });

    it('should execute and return default value for undefined or null value when function is given', () => {
      const schema = new DateSchema({
        default: () => new Date('2000-2-2'),
      });
      expect(schema.castFrom(undefined)).toEqual(new Date('2000-2-2'));
      expect(schema.castFrom(null)).toEqual(new Date('2000-2-2'));
    });
  });

  describe('clone', () => {
    it('clone should returns cloned schema', () => {
      const schema = new DateSchema({ name: 'test' });
      expect(schema.clone()).toBeInstanceOf(DateSchema);
    });
  });
});
