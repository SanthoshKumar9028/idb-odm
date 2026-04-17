import { describe, expect, it } from 'vitest';
import { BaseSchema } from './base-schema';
import { ValidationRule } from './validation-rule/validate';
import { RequiredValidationRule } from './validation-rule/required';

class TestSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (typeof value === 'string') return value.trim();
    return value;
  }

  async save(value: unknown) {
    return value;
  }
}

class DummyRule extends ValidationRule {
  validate(value: unknown): boolean {
    if (value !== 'ok') {
      throw new Error('unexpected value');
    }
    return true;
  }
}

describe('BaseSchema', () => {
  it('should set default values in constructor', () => {
    const schema = new TestSchema();

    expect(schema.name).toBeUndefined();
    expect(schema.getIsVirtual()).toBe(false);
    expect(schema.validationRules).toEqual([]);
    expect(schema.getSchemaOptions()).toEqual({ keyPath: '_id' });
  });

  it('should set name, isVirtual and schema options', () => {
    const schema = new TestSchema(
      { name: 'x', isVirtual: true },
      { keyPath: 'id' }
    );

    expect(schema.name).toBe('x');
    expect(schema.getIsVirtual()).toBe(true);
    expect(schema.getSchemaOptions()).toEqual({ keyPath: 'id' });
  });

  it('preProcess should return field value when name is set', async () => {
    const schema = new TestSchema({ name: 'foo' });
    const result = await schema.preProcess(
      { foo: 'hello', bar: 'world' } as any,
      {} as any
    );

    expect(result).toBe('hello');
  });

  it('preProcess should return full doc when name is not set', async () => {
    const schema = new TestSchema();
    const doc = { foo: 'hello' };
    const result = await schema.preProcess(doc as any, {} as any);

    expect(result).toBe(doc);
  });

  it('validate should cast value and apply validation rules', () => {
    const schema = new TestSchema({
      validationRules: [new DummyRule({ message: 'fail' })],
    });

    expect(schema.validate('  ok  ' as unknown, {} as any)).toBe(true);
    expect(() => schema.validate('not-ok', {} as any)).toThrow(
      'unexpected value'
    );
  });

  it('required option should add RequiredValidationRule and throw for empty values', () => {
    const schema = new TestSchema({ required: true, name: 'req' });

    expect(
      schema.validationRules.some(
        (rule) => rule instanceof RequiredValidationRule
      )
    ).toBe(true);
    expect(() => schema.validate('', {} as any)).toThrow('req is required!');
    expect(schema.validate('value', {} as any)).toBe(true);
  });

  it('clone default implementation returns null', () => {
    const schema = new TestSchema();
    expect(schema.clone()).toBeNull();
  });
});
