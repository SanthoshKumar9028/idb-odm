import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AbstractModel } from './index';
import { Schema } from '../schema';
import iodm from '../iodm';

class TestModel extends AbstractModel {}

const createFakeDB = () => {
  const transactionMock = {} as IDBTransaction;
  return {
    objectStoreNames: { contains: vi.fn(() => false) } as any,
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => transactionMock),
  } as unknown as IDBDatabase;
};

describe('AbstractModel', () => {
  beforeEach(() => {
    // Reset static state
    (TestModel as any).schema = null;
    (TestModel as any).storeName = null;
    (TestModel as any).db = null;
    (TestModel as any).Query = undefined;
    vi.clearAllMocks();
  });

  it('should throw when schema/db/store is missing', () => {
    expect(() => TestModel.getSchema()).toThrow('Schema is required');
    expect(() => TestModel.getDB()).toThrow('db is required');
    expect(() => TestModel.getStoreName()).toThrow('db is required');
  });

  it('should set and get schema, db and storeName', () => {
    const schema = new Schema({ name: String });
    const db = createFakeDB();

    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';
    TestModel.setDB(db);

    expect(TestModel.getSchema()).toBe(schema);
    expect(TestModel.getDB()).toBe(db);
    expect(TestModel.getStoreName()).toBe('testStore');
  });

  it('init should set db', () => {
    const db = createFakeDB();
    TestModel.init(db);
    expect(TestModel.getDB()).toBe(db);
  });

  it('onUpgradeNeeded should create object store when missing', () => {
    const db = createFakeDB();
    db.objectStoreNames.contains = vi.fn(() => false);

    const schema = new Schema({ name: String });
    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';

    TestModel.onUpgradeNeeded(db);

    expect(db.createObjectStore).toHaveBeenCalledWith('testStore', {
      keyPath: '_id',
    });
  });

  it('onUpgradeNeeded should not create object store when already exists', () => {
    const db = createFakeDB();
    db.objectStoreNames.contains = vi.fn(() => true);

    const schema = new Schema({ name: String });
    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';

    TestModel.onUpgradeNeeded(db);

    expect(db.createObjectStore).not.toHaveBeenCalled();
  });

  it('preProcess should return doc from schema preProcess', async () => {
    const schema = new Schema({ name: String });
    (TestModel as any).schema = schema;

    const doc = { name: 'Alice' };
    const result = await TestModel.preProcess(doc as any, {
      storeName: 'testStore',
      idb: {} as any,
      populateFields: {},
      transaction: {} as any,
    });

    expect(result).toEqual({ name: 'Alice' });
  });

  it('getInstanceSchema and getInstanceDB and getInstanceStoreName should work from instance', () => {
    const schema = new Schema({ name: String });
    const db = createFakeDB();

    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';
    TestModel.setDB(db);

    const instance = new TestModel({ name: 'Bob' }, { isNew: true });

    expect(instance).instanceOf(TestModel);
  });

  it('validate and toJSON should delegate to schema', () => {
    const schema = new Schema({ name: String });
    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';

    const instance = new TestModel({ _id: '1', name: 'Bob' }, { isNew: true });

    expect(instance.validate()).toBe(true);
    expect(instance.toJSON()).toEqual({ _id: '1', name: 'Bob' });
  });

  it('syncModelToSchema should set schema and define virtuals', () => {
    const originalChannel = iodm.channel;
    (iodm as any).channel = {
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    } as any;

    try {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ first: String, last: String });
      schema.virtual('fullName').get(function (this: any) {
        return `${this.first} ${this.last}`;
      });

      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect(SyncModel.getStoreName()).toBe('syncStore');
      expect(SyncModel.getSchema()).not.toBe(schema); // cloned

      const instance = new SyncModel({ first: 'John', last: 'Doe' });
      expect((instance as any).fullName).toBe('John Doe');

      // second sync attempt should be noop
      const newSchema = new Schema({ a: String });
      SyncModel.syncModelToSchema({ name: 'syncStore2', schema: newSchema });
      expect(SyncModel.getStoreName()).toBe('syncStore');
    } finally {
      (iodm as any).channel = originalChannel;
    }
  });

  it('createInstanceTransaction should call db.transaction with ref names', () => {
    const mockDB = createFakeDB();
    const schema = new Schema({ name: String });

    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';
    TestModel.setDB(mockDB);

    const instance = new TestModel({ _id: '1', name: 'Bob' }, { isNew: true });
    instance.createInstanceTransaction('readwrite');

    expect(mockDB.transaction).toHaveBeenCalledWith(['testStore'], 'readwrite');
  });

  it('static query helpers should call Query methods', async () => {
    const mockResult = { called: true };
    const queryClass = vi.fn().mockImplementation(() => ({
      find: vi.fn(() => mockResult),
      findById: vi.fn(() => mockResult),
      findByIdAndUpdate: vi.fn(() => mockResult),
      findByIdAndDelete: vi.fn(() => mockResult),
      deleteOne: vi.fn(() => mockResult),
    }));

    const schema = new Schema({ name: String });
    const db = createFakeDB();
    (TestModel as any).schema = schema;
    (TestModel as any).storeName = 'testStore';
    TestModel.setDB(db);
    (TestModel as any).Query = queryClass;

    expect(TestModel.find({ a: 1 } as any)).toBe(mockResult);
    expect(TestModel.findById('x')).toBe(mockResult);
    expect(
      TestModel.findByIdAndUpdate('x', { $set: { name: 'x' } } as any)
    ).toBe(mockResult);
    expect(TestModel.findByIdAndDelete('x')).toBe(mockResult);
    expect(TestModel.deleteOne({ a: 1 } as any)).toBe(mockResult);

    expect(queryClass).toHaveBeenCalledTimes(5);
  });
});
