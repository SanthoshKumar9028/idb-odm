import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RefSchema } from './index';
import { NumberSchema } from '../../primitive/number';
import iodm from '../../../iodm';

vi.mock('../../../iodm', () => ({
  default: {
    models: {},
  },
}));

vi.mock('iodm-query', () => ({
  Query: vi.fn(),
}));

describe('RefSchema', () => {
  beforeEach(() => {
    iodm.models = {};
  });

  it('should constructor store ref and valueSchema', () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
      name: 'author',
    });

    expect(refSchema.name).toBe('author');
  });

  it('getRefModel should throw if model not found', () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    expect(() => refSchema.getRefModel()).toThrow(
      'Ref User model is not created'
    );
  });

  it('getRefModel should return model if found', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    const model = refSchema.getRefModel();

    expect(model).toBe(mockModel);
  });

  it('castFrom should extract keyPath value and cast', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    const result = refSchema.castFrom({ _id: 10, name: 'John' }, {} as any);

    expect(result).toBe(10);
  });

  it('castFrom should pass through primitive values', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    const result = refSchema.castFrom(5, {} as any);

    expect(result).toBe(5);
  });

  it('validate should extract keyPath value and validate', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id', min: 1 });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    expect(refSchema.validate({ _id: 5, name: 'John' }, {} as any)).toBe(true);
    expect(() =>
      refSchema.validate({ _id: -1, name: 'John' }, {} as any)
    ).toThrow();
  });

  it('validate should pass through primitive values', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    expect(refSchema.validate(5, {} as any)).toBe(true);
  });

  it('save should instantiate RefModel and call save', async () => {
    const mockSave = vi.fn(() => Promise.resolve({ id: 1 }));
    const mockRefModelInstance = {
      save: mockSave,
    };

    const mockRefModelConstructor = vi.fn(() => mockRefModelInstance);
    mockRefModelConstructor.prototype = {};

    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    vi.spyOn(refSchema, 'getRefModel').mockReturnValue(
      mockRefModelConstructor as any
    );

    const mockTransaction = {
      abort: vi.fn(),
    };

    await refSchema.save({ _id: 1, name: 'John' }, {
      transaction: mockTransaction as any,
    } as any);

    expect(mockRefModelConstructor).toHaveBeenCalledWith({
      _id: 1,
      name: 'John',
    });
    expect(mockSave).toHaveBeenCalledWith({ transaction: mockTransaction });
  });

  it('save should handle null/undefined values gracefully', async () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    const mockTransaction = {
      abort: vi.fn(),
    };

    const result = await refSchema.save(null, {
      transaction: mockTransaction as any,
    } as any);

    expect(result).toBeUndefined();
  });

  it('save should abort transaction on validation error', async () => {
    const mockValidateError = new Error('validation failed');
    const mockRefModelInstance = {
      save: vi.fn(() => {
        throw mockValidateError;
      }),
    };

    const mockRefModelConstructor = vi.fn(() => mockRefModelInstance);

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    vi.spyOn(refSchema, 'getRefModel').mockReturnValue(
      mockRefModelConstructor as any
    );

    const mockTransaction = {
      abort: vi.fn(),
    };

    try {
      await refSchema.save({ _id: 1 }, {
        transaction: mockTransaction as any,
      } as any);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBe(mockValidateError);
      expect(mockTransaction.abort).toHaveBeenCalled();
    }
  });

  it('preProcess should return populated ref data when populateFields is set', async () => {
    const { Query } = await import('iodm-query');
    const mockQueryInstance = {
      findById: vi.fn(() => Promise.resolve({ _id: 1, name: 'John' })),
    };

    vi.mocked(Query).mockReturnValue(mockQueryInstance as any);

    const mockRefModel = vi.fn();

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
      name: 'author',
    });

    vi.spyOn(refSchema, 'getRefModel').mockReturnValue(mockRefModel as any);

    const result = await refSchema.preProcess({ author: 1, title: 'Post' }, {
      idb: {} as any,
      populateFields: { author: true },
      transaction: {} as any,
    } as any);

    expect(result).toEqual({ _id: 1, name: 'John' });
    expect(mockQueryInstance.findById).toHaveBeenCalledWith(1, {
      Constructor: mockRefModel,
      transaction: {},
    });
  });

  it('preProcess should return field value when populateFields not set', async () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
      name: 'author',
    });

    const result = await refSchema.preProcess({ author: 1, title: 'Post' }, {
      idb: {} as any,
      transaction: {} as any,
    } as any);

    expect(result).toBe(1);
  });

  it('preProcess should return full doc when name not set', async () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refSchema = new RefSchema({
      ref: 'User',
      valueSchema,
    });

    const doc = { author: 1, title: 'Post' };
    const result = await refSchema.preProcess(doc, {
      idb: {} as any,
      transaction: {} as any,
    } as any);

    expect(result).toBe(doc);
  });

  it('should return default value for undefined or null value', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;
    const schema = new RefSchema({
      valueSchema: new NumberSchema({ name: 'item' }),
      default: 1,
      ref: 'User',
    });
    expect(schema.castFrom(undefined, {})).toBe(1);
    expect(schema.castFrom(null, {})).toBe(1);

    const schema2 = new RefSchema({
      valueSchema: new NumberSchema({ name: 'item' }),
      default: { _id: 2 },
      ref: 'User',
    });
    expect(schema2.castFrom(undefined, {})).toBe(2);
    expect(schema2.castFrom(null, {})).toBe(2);
  });

  it('should execute and return default value for undefined or null value when function is given', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;
    const schema = new RefSchema({
      valueSchema: new NumberSchema({ name: 'item' }),
      default: () => 1,
      ref: 'User',
    });
    expect(schema.castFrom(undefined, {})).toBe(1);
    expect(schema.castFrom(null, {})).toBe(1);

    const schema2 = new RefSchema({
      valueSchema: new NumberSchema({ name: 'item' }),
      default: () => ({ _id: 2 }),
      ref: 'User',
    });
    expect(schema2.castFrom(undefined, {})).toBe(2);
    expect(schema2.castFrom(null, {})).toBe(2);
  });
});
