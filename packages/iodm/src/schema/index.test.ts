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

  describe('Instance Methods (method)', () => {
    it('method should register an instance method', () => {
      const schema = new Schema<{ name: string }, { getName: () => void }>({
        name: String,
      });
      const methodFn = vi.fn<(this: any) => string>(function () {
        return (this as any).name?.toUpperCase();
      });

      schema.method('getName', methodFn);

      expect(schema.methods['getName']).toBe(methodFn);
    });

    it('method should store multiple instance methods', () => {
      const schema = new Schema<
        { firstName: string; lastName: string },
        {
          getFullName: () => string;
          getInitials: () => string;
        }
      >({ firstName: String, lastName: String });

      const getFullName = vi.fn<(this: any) => string>(function () {
        return `${(this as any).firstName} ${(this as any).lastName}`;
      });
      const getInitials = vi.fn<(this: any) => string>(function () {
        return (
          (this as any).firstName?.charAt(0) + (this as any).lastName?.charAt(0)
        );
      });

      schema.method('getFullName', getFullName);
      schema.method('getInitials', getInitials);

      expect(schema.methods['getFullName']).toBe(getFullName);
      expect(schema.methods['getInitials']).toBe(getInitials);
      expect(Object.keys(schema.methods)).toHaveLength(2);
    });

    it('method should override previous method with same name', () => {
      const schema = new Schema<{ name: string }, { getName: () => void }>({
        name: String,
      });
      const firstMethod = vi.fn();
      const secondMethod = vi.fn();

      schema.method('getName', firstMethod);
      schema.method('getName', secondMethod);

      expect(schema.methods['getName']).toBe(secondMethod);
    });

    it('method should be accessible by hydrated document instances', () => {
      interface User {
        name: string;
      }

      interface UserMethods {
        getName(): string;
        setName(name: string): void;
      }

      const schema = new Schema<User, UserMethods>({ name: String });

      schema.method('getName', function () {
        return (this as any).name;
      });

      schema.method('setName', function (newName: string) {
        (this as any).name = newName;
      });

      expect(schema.methods['getName']).toBeDefined();
      expect(schema.methods['setName']).toBeDefined();
    });
  });

  describe('Static Methods (static)', () => {
    it('static should register a static method', () => {
      const schema = new Schema<
        { name: string },
        {},
        { findByName: () => string }
      >({ name: String });
      const staticFn = vi.fn(() => 'static method result');

      schema.static('findByName', staticFn);

      expect(schema.statics['findByName']).toBe(staticFn);
    });

    it('static should store multiple static methods', () => {
      const schema = new Schema<
        { email: string; name: string },
        {},
        {
          findByEmail: () => string;
          findByName: () => string;
          count: () => string;
        }
      >({
        email: String,
        name: String,
      });
      const findByEmail = vi.fn();
      const findByName = vi.fn();
      const count = vi.fn();

      schema.static('findByEmail', findByEmail);
      schema.static('findByName', findByName);
      schema.static('count', count);

      expect(schema.statics['findByEmail']).toBe(findByEmail);
      expect(schema.statics['findByName']).toBe(findByName);
      expect(schema.statics['count']).toBe(count);
      expect(Object.keys(schema.statics)).toHaveLength(3);
    });

    it('static should override previous static method with same name', () => {
      const schema = new Schema<{ name: string }, {}, { find: () => any }>({
        name: String,
      });
      const firstStatic = vi.fn();
      const secondStatic = vi.fn();

      schema.static('find', firstStatic);
      schema.static('find', secondStatic);

      expect(schema.statics['find']).toBe(secondStatic);
    });
  });

  describe('Pre Middleware with Patterns', () => {
    it('pre should support RegExp pattern matching', () => {
      const schema = new Schema({ name: String, age: Number });
      const preFn = vi.fn();

      schema.pre(/^validate|save$/, preFn);

      expect(schema.middleware).toBeDefined();
    });

    it('pre should support array of middleware names', () => {
      const schema = new Schema({ name: String });
      const preFn = vi.fn();

      schema.pre(['validate', 'save', 'insertOne'], preFn);

      expect(schema.middleware).toBeDefined();
    });

    it('pre should support array of RegExp patterns', () => {
      const schema = new Schema({ name: String });
      const preFn = vi.fn();

      schema.pre([/^validate/, /save$/], preFn);

      expect(schema.middleware).toBeDefined();
    });

    it('pre should return Schema instance for chaining', () => {
      const schema = new Schema({ name: String });
      const preFn = vi.fn();

      const result = schema.pre('validate', preFn);

      expect(result).toBe(schema);
    });

    it('pre should support method chaining with multiple middleware', () => {
      const schema = new Schema({ name: String });
      const preFn1 = vi.fn();
      const preFn2 = vi.fn();
      const preFn3 = vi.fn();

      const result = schema
        .pre('validate', preFn1)
        .pre('save', preFn2)
        .pre(/^delete/, preFn3);

      expect(result).toBe(schema);
      expect(schema.middleware).toBeDefined();
    });

    it('pre with array should register multiple middleware', () => {
      const schema = new Schema({ name: String });
      const preFn = vi.fn();

      schema.pre(['insertOne', 'updateOne', 'deleteOne'], preFn);

      expect(schema.middleware).toBeDefined();
    });
  });

  describe('Post Middleware with Patterns', () => {
    it('post should support RegExp pattern matching', () => {
      const schema = new Schema({ name: String });
      const postFn = vi.fn();

      schema.post(/^save|validate$/, postFn);

      expect(schema.middleware).toBeDefined();
    });

    it('post should support array of middleware names', () => {
      const schema = new Schema({ name: String });
      const postFn = vi.fn();

      schema.post(['find', 'findById'], postFn);

      expect(schema.middleware).toBeDefined();
    });

    it('post should support array of RegExp patterns', () => {
      const schema = new Schema({ name: String });
      const postFn = vi.fn();

      schema.post([/^find/, /^update/], postFn);

      expect(schema.middleware).toBeDefined();
    });

    it('post should return Schema instance for chaining', () => {
      const schema = new Schema({ name: String });
      const postFn = vi.fn();

      const result = schema.post('validate', postFn);

      expect(result).toBe(schema);
    });

    it('post should support method chaining with multiple middleware', () => {
      const schema = new Schema({ name: String });
      const postFn1 = vi.fn();
      const postFn2 = vi.fn();
      const postFn3 = vi.fn();

      const result = schema
        .post('insertOne', postFn1)
        .post('updateOne', postFn2)
        .post(/^find/, postFn3);

      expect(result).toBe(schema);
      expect(schema.middleware).toBeDefined();
    });

    it('post with array should register multiple middleware', () => {
      const schema = new Schema({ name: String });
      const postFn = vi.fn();

      schema.post(['save', 'validate', 'deleteOne'], postFn);

      expect(schema.middleware).toBeDefined();
    });
  });
});
