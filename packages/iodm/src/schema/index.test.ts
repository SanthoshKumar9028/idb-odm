import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Schema } from './index';

describe('Schema', () => {
  it('should create schema with definition', () => {
    const schema = new Schema({ name: String, age: Number });

    expect(schema).toBeDefined();
    expect(
      schema.castFrom({ name: 'Alice', age: 30, _id: '1' }, {} as any)
    ).toEqual({
      name: 'Alice',
      age: 30,
      _id: '1',
    });
  });

  it('should add default _id field if keyPath not provided', () => {
    const schema = new Schema({ name: String });
    const result = schema.castFrom({ name: 'Bob', _id: 'x' }, {} as any);

    expect(result).toHaveProperty('_id');
    expect(result).toHaveProperty('name');
  });

  it('should parse Number type in definition', () => {
    const schema = new Schema({ email: { type: Number, required: true } });
    expect(() => schema.validate({}, {} as any)).toThrow();
  });

  it('should parse Number type with min constraint', () => {
    const schema = new Schema({ age: { type: Number, min: 18 } });

    expect(schema.validate({ _id: 1, age: 18 }, {} as any)).toBe(true);
    expect(() => schema.validate({ age: 17 }, {} as any)).toThrow(
      'must be greater then or equal to 18'
    );
  });

  it('should parse Array type', () => {
    const schema = new Schema({ tags: [String] });
    const result = schema.castFrom({ tags: ['a', 'b'], _id: '1' }, {} as any);

    expect(result.tags).toEqual(['a', 'b']);
  });

  it('should throw for empty array type', () => {
    expect(() => new Schema({ items: [] })).toThrow(
      'Array type must have a value type'
    );
  });

  it('should parse ref field', () => {
    const schema = new Schema({ authorId: { type: String, ref: 'User' } });

    expect(schema.getRefNames()).toContain('User');
  });

  it('should parse ref array field', () => {
    const schema = new Schema({
      tags: [{ type: String, ref: 'Tag' }],
    });

    expect(schema.getRefNames()).toContain('Tag');
  });

  it('should throw for unsupported type', () => {
    expect(() => new Schema({ x: Boolean as any })).toThrow(
      'Type for x is not supported'
    );
  });

  it('clone should copy schema properties', () => {
    const schema = new Schema({ name: String });
    schema.virtual('fullName');

    const cloned = schema.clone();

    expect(cloned).not.toBe(schema);
    expect(cloned.getRefNames()).toEqual(schema.getRefNames());
    expect(Object.keys(cloned.virtuals)).toEqual(Object.keys(schema.virtuals));
  });

  it('validate should call all tree validators', () => {
    const schema = new Schema({ name: String, age: { type: Number, min: 0 } });

    expect(schema.validate({ _id: 1, name: 'x', age: 5 }, {} as any)).toBe(
      true
    );
    expect(() =>
      schema.validate({ _id: 1, name: 'x', age: -1 }, {} as any)
    ).toThrow();
  });

  it('validate should throw if value is not object', () => {
    const schema = new Schema({ name: String });

    expect(() => schema.validate(null, {} as any)).toThrow(
      'value must be an Object'
    );
    expect(() => schema.validate('string', {} as any)).toThrow(
      'value must be an Object'
    );
  });

  it('castFrom should skip virtual fields', () => {
    const schema = new Schema({ name: String });
    schema.virtual('upper').get(function () {
      return (this as any).name?.toUpperCase();
    });

    const result = schema.castFrom({ name: 'alice', _id: '1' }, {} as any);

    expect(result).not.toHaveProperty('upper');
    expect(result).toHaveProperty('name');
  });

  it('castFrom should throw if value is not object', () => {
    const schema = new Schema({ name: String });

    expect(() => schema.castFrom(null, {} as any)).toThrow(
      'Cant cast value to object schema'
    );
  });

  it('virtual should add virtual field to schema', () => {
    const schema = new Schema({ first: String, last: String });
    const virtual = schema.virtual('full');

    expect(schema.virtuals['full']).toBe(virtual);
  });

  it('virtual should throw if creating virtual for existing key', () => {
    const schema = new Schema({ name: String });

    expect(() => schema.virtual('name')).toThrow(
      'Creating virtual for the existing key'
    );
  });

  it('pre should register pre middleware', () => {
    const schema = new Schema({ name: String });
    const fn = vi.fn();

    schema.pre('validate', fn);

    expect(schema.middleware).toBeDefined();
  });

  it('post should register post middleware', () => {
    const schema = new Schema({ name: String });
    const fn = vi.fn();

    schema.post('save', fn);

    expect(schema.middleware).toBeDefined();
  });

  it('plugin should execute immediately', () => {
    const schema = new Schema({ name: String });
    const pluginFn = vi.fn();

    schema.plugin(pluginFn);

    expect(pluginFn).toHaveBeenCalledWith(schema, undefined);
  });

  it('plugin should accept options', () => {
    const schema = new Schema({ name: String });
    const pluginFn = vi.fn();

    schema.plugin(pluginFn, { option: 'value' });

    expect(pluginFn).toHaveBeenCalledWith(schema, { option: 'value' });
  });

  it('should support async save', async () => {
    const schema = new Schema({ name: String });
    const transaction = {} as any;

    const result = await schema.save(
      { name: 'test', _id: '1' },
      {
        transaction,
        modelInstance: {} as any,
      }
    );

    expect(result).toBeUndefined();
  });

  it('save should throw if value not object', async () => {
    const schema = new Schema({ name: String });

    expect(
      schema.save(null, { transaction: {} as any, modelInstance: {} as any })
    ).rejects.toThrow('value must be an Object');
  });

  it('preProcess should process each field', async () => {
    const schema = new Schema({ name: String, age: Number });

    const result = await schema.preProcess(
      { name: 'Alice', age: 30, _id: '1' },
      {
        idb: {} as any,
        populateFields: {},
        transaction: {} as any,
      } as any
    );

    expect(result).toEqual({ name: 'Alice', age: 30, _id: '1' });
  });

  it('enableBroadcastFor should register broadcast event', () => {
    const schema = new Schema({ name: String });

    schema.enableBroadcastFor('save', {
      type: 'post',
      prepare: (p) => p,
    });

    expect(schema.broadcastEnabledEvents['save']).toBeDefined();
  });

  it('broadcastHook should register broadcast hook', () => {
    const schema = new Schema({ name: String });
    const fn = vi.fn();

    schema.broadcastHook(fn);

    expect(schema.broadcastMiddleware).toBeDefined();
  });
});
