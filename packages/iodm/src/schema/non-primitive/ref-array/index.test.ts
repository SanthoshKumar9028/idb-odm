import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RefArraySchema } from './index';
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

describe('RefArraySchema', () => {
  beforeEach(() => {
    iodm.models = {};
    vi.clearAllMocks();
  });

  it('should construct with ref and valueSchema', () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    expect(refArraySchema.name).toBe('authors');
  });

  it('validate should validate all array elements', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id', min: 1 });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    expect(refArraySchema.validate([{ _id: 5 }, { _id: 10 }], {} as any)).toBe(
      true
    );
  });

  it('validate should fail if any element is invalid', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id', min: 1 });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    expect(() =>
      refArraySchema.validate([{ _id: 5 }, { _id: -1 }], {} as any)
    ).toThrow();
  });

  it('validate should return true for undefined/null values', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    expect(refArraySchema.validate(undefined, {} as any)).toBe(true);
    expect(refArraySchema.validate(null, {} as any)).toBe(true);
  });

  it('validate should throw error for non-array values', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    expect(() => refArraySchema.validate('not-array', {} as any)).toThrow(
      'cant cast to a array'
    );
    expect(() => refArraySchema.validate(123, {} as any)).toThrow(
      'cant cast to a array'
    );
    expect(() => refArraySchema.validate({}, {} as any)).toThrow(
      'cant cast to a array'
    );
  });

  it('validate should apply base validation rules to array', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      required: true,
      name: 'authors',
    });

    expect(() => refArraySchema.validate(null, {} as any)).toThrow(
      'authors is required!'
    );
  });

  it('castFrom should cast all array elements', () => {
    const mockModel = {
      getSchema: vi.fn(() => ({
        getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
      })),
    };

    iodm.models['User'] = mockModel as any;

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    const result = refArraySchema.castFrom(
      [
        { _id: 5, name: 'John' },
        { _id: 10, name: 'Jane' },
      ],
      {} as any
    );

    expect(result).toEqual([5, 10]);
  });

  it('save should save all array elements', async () => {
    const mockSave = vi.fn(() => Promise.resolve({ id: 1 }));
    const mockValidate = vi.fn();

    const mockRefModelInstance1 = {
      save: mockSave,
      validate: mockValidate,
    };

    const mockRefModelInstance2 = {
      save: mockSave,
      validate: mockValidate,
    };

    const mockRefModelConstructor = vi
      .fn()
      .mockReturnValueOnce(mockRefModelInstance1)
      .mockReturnValueOnce(mockRefModelInstance2);

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    vi.spyOn(refArraySchema, 'getRefModel').mockReturnValue(
      mockRefModelConstructor as any
    );

    const mockTransaction = {
      abort: vi.fn(),
    };

    const result = await refArraySchema.save(
      [
        { _id: 1, name: 'John' },
        { _id: 2, name: 'Jane' },
      ],
      { transaction: mockTransaction as any } as any
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('save should return undefined for non-array values', async () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    const mockTransaction = {
      abort: vi.fn(),
    };

    const result = await refArraySchema.save('not-array', {
      transaction: mockTransaction as any,
    } as any);

    expect(result).toBeUndefined();
  });

  it('preProcess should populate all matching refs when populateFields set', async () => {
    const { Query } = await import('iodm-query');
    const mockQueryInstance = {
      findById: vi
        .fn()
        .mockReturnValueOnce(Promise.resolve({ _id: 1, name: 'John' }))
        .mockReturnValueOnce(Promise.resolve({ _id: 2, name: 'Jane' })),
    };

    vi.mocked(Query).mockReturnValue(mockQueryInstance as any);

    const mockRefModel = vi.fn();

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    vi.spyOn(refArraySchema, 'getRefModel').mockReturnValue(
      mockRefModel as any
    );

    iodm.models['User'] = mockRefModel as any;

    const result = (await refArraySchema.preProcess(
      { authors: [1, 2], title: 'Post' },
      {
        idb: {} as any,
        populateFields: { authors: true },
        transaction: {} as any,
      } as any
    )) as unknown[];

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ _id: 1, name: 'John' });
    expect(result[1]).toEqual({ _id: 2, name: 'Jane' });
    expect(mockQueryInstance.findById).toHaveBeenCalledTimes(2);
  });

  it('preProcess should populate only specific indices when populateFields has nested path', async () => {
    const { Query } = await import('iodm-query');
    const mockQueryInstance = {
      findById: vi
        .fn()
        .mockReturnValueOnce(Promise.resolve({ _id: 2, name: 'Jane' })),
    };

    vi.mocked(Query).mockReturnValue(mockQueryInstance as any);

    const mockRefModel = vi.fn();

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    vi.spyOn(refArraySchema, 'getRefModel').mockReturnValue(
      mockRefModel as any
    );

    iodm.models['User'] = mockRefModel as any;

    const result = (await refArraySchema.preProcess(
      { authors: [1, 2, 3], title: 'Post' },
      {
        idb: {} as any,
        populateFields: { 'authors.1': true },
        transaction: {} as any,
      } as any
    )) as unknown[];

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBe(1);
    expect(result[1]).toEqual({ _id: 2, name: 'Jane' });
    expect(result[2]).toBe(3);
    expect(mockQueryInstance.findById).toHaveBeenCalledTimes(1);
  });

  it('preProcess should return non-primitive values without populating', async () => {
    const mockRefModel = vi.fn();

    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    vi.spyOn(refArraySchema, 'getRefModel').mockReturnValue(
      mockRefModel as any
    );

    iodm.models['User'] = mockRefModel as any;

    const objArray = [
      { _id: 1, name: 'John' },
      { _id: 2, name: 'Jane' },
    ];

    const result = await refArraySchema.preProcess(
      { authors: objArray, title: 'Post' },
      {
        idb: {} as any,
        populateFields: { authors: true },
        transaction: {} as any,
      } as any
    );

    expect(result).toEqual(objArray);
  });

  it('preProcess should return field value when populateFields not set', async () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    const result = await refArraySchema.preProcess(
      { authors: [1, 2], title: 'Post' },
      {
        idb: {} as any,
        transaction: {} as any,
      } as any
    );

    expect(result).toEqual([1, 2]);
  });

  it('preProcess should return full doc when name not set', async () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
    });

    const doc = [1, 2, 3];

    const result = await refArraySchema.preProcess(
      doc as any,
      {
        idb: {} as any,
        transaction: {} as any,
      } as any
    );

    expect(result).toEqual(doc);
  });

  it('preProcess should throw if ref model not found during population', async () => {
    const valueSchema = new NumberSchema({ name: 'id' });
    const refArraySchema = new RefArraySchema({
      ref: 'User',
      valueSchema,
      name: 'authors',
    });

    try {
      await refArraySchema.preProcess({ authors: [1, 2], title: 'Post' }, {
        idb: {} as any,
        populateFields: { authors: true },
        transaction: {} as any,
      } as any);
      expect.fail('should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('Ref User model is not created');
    }
  });
});
