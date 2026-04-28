import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { AbstractModel } from './index';
import { Schema } from '../schema';
import iodm from '../iodm';

vi.mock('iodm-query', async () => {
  const actual = await vi.importActual('iodm-query');
  return {
    ...actual,
    Query: class Query {
      insertOne() {}
      replaceOne() {}
    },
  };
});

const schema = new Schema({ name: String });
const TestModel = iodm.model('testStore', schema);

const createFakeDB = () => {
  const transactionMock = {
    objectStore: () => ({
      indexNames: {
        contains: () => false,
        length: 0,
      },
      deleteIndex: () => {},
      createIndex: () => {},
    }),
  } as any;
  return {
    objectStoreNames: { contains: vi.fn(() => false) } as any,
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => transactionMock),
  } as unknown as IDBDatabase;
};

describe('AbstractModel', () => {
  let mockDB: IDBDatabase;
  let mockQueryInstance: any;

  beforeEach(() => {
    // Reset static state
    (TestModel as any).Query = undefined;
    vi.clearAllMocks();

    // Setup for query methods

    mockDB = createFakeDB();
    TestModel.setDB(mockDB);

    // Mock Query class
    mockQueryInstance = {
      openCursor: vi.fn().mockReturnValue('openCursorResult'),
      find: vi.fn().mockReturnValue('findResult'),
      findById: vi.fn().mockReturnValue('findByIdResult'),
      findByIdAndUpdate: vi.fn().mockReturnValue('findByIdAndUpdateResult'),
      findByIdAndDelete: vi.fn().mockReturnValue('findByIdAndDeleteResult'),
      deleteOne: vi.fn().mockReturnValue('deleteOneResult'),
      deleteMany: vi.fn().mockReturnValue('deleteManyResult'),
      updateMany: vi.fn().mockReturnValue('updateManyResult'),
      updateOne: vi.fn().mockReturnValue('updateOneResult'),
      countDocuments: vi.fn().mockReturnValue('countDocumentsResult'),
      insertOne: vi.fn().mockReturnValue('insertOneResult'),
      insertMany: vi.fn().mockResolvedValue([]),
      replaceOne: vi.fn().mockReturnValue('replaceOneResult'),
    };

    const MockQuery = vi.fn().mockImplementation(() => mockQueryInstance);
    (TestModel as any).Query = MockQuery;
  });

  it('should throw when schema/db/store is missing', () => {
    (TestModel as any).schema = null;
    (TestModel as any).db = null;
    (TestModel as any).storeName = null;

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

  describe('save', () => {
    let originalChannel: any;

    beforeEach(() => {
      originalChannel = iodm.channel;
      (iodm as any).channel = {
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      } as any;
    });

    afterEach(() => {
      (iodm as any).channel = originalChannel;
    });

    it('should save new document with middleware and validation', async () => {
      const schema = new Schema({ name: String });
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';
      TestModel.setDB(mockDB);

      const instance = new TestModel(
        { _id: '1', name: 'Test' },
        { isNew: true }
      );

      // Mock middleware
      const mockMiddleware = {
        execPre: vi.fn(),
        execPost: vi.fn().mockReturnValue('postResult'),
      };
      (instance as any).documentMiddleware = mockMiddleware;

      // Mock schema methods
      const mockSchema = {
        save: vi.fn().mockResolvedValue(undefined),
        validate: vi.fn().mockReturnValue(true),
        castFrom: vi.fn().mockReturnValue({ _id: '1', name: 'Test' }),
        getRefNames: vi.fn().mockReturnValue([]),
      };
      vi.spyOn(instance as any, 'getInstanceSchema').mockReturnValue(
        mockSchema as any
      );
      vi.spyOn(instance as any, 'getInstanceDB').mockReturnValue(mockDB);
      vi.spyOn(instance as any, 'getInstanceStoreName').mockReturnValue(
        'testStore'
      );

      const result = await instance.save();

      expect(mockMiddleware.execPre).toHaveBeenCalled();
      expect(mockMiddleware.execPost).toHaveBeenCalled();
      expect(result).toBe('postResult');
      expect((instance as any).$_isNew).toBe(false);
    });

    it('should save existing document', async () => {
      const schema = new Schema({ name: String });
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';
      TestModel.setDB(mockDB);

      const instance = new TestModel(
        { _id: '1', name: 'Test' },
        { isNew: false }
      );

      // Mock middleware
      const mockMiddleware = {
        execPre: vi.fn(),
        execPost: vi.fn().mockReturnValue('postResult'),
      };
      (instance as any).documentMiddleware = mockMiddleware;

      // Mock schema methods

      const mockSchema = {
        save: vi.fn().mockResolvedValue(undefined),
        validate: vi.fn().mockReturnValue(true),
        castFrom: vi.fn().mockReturnValue({ _id: '1', name: 'Test' }),
        getRefNames: vi.fn().mockReturnValue([]),
      };
      vi.spyOn(instance as any, 'getInstanceSchema').mockReturnValue(
        mockSchema as any
      );

      const result = await instance.save();

      expect(result).toBe('postResult');
    });
  });

  describe('handlePreExec', () => {
    let originalChannel: any;

    beforeEach(() => {
      originalChannel = iodm.channel;
      (iodm as any).channel = {
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      } as any;
    });

    afterEach(() => {
      (iodm as any).channel = originalChannel;
    });

    it('should post message for pre event', () => {
      const schema = new Schema({ name: String });
      schema.broadcastEnabledEvents = {
        testEvent: {
          type: 'pre',
          prepare: (payload: any) => ({ prepared: payload }),
        },
      };
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePreExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).toHaveBeenCalledWith({
        model: 'testStore',
        type: 'pre',
        event: 'testEvent',
        payload: { prepared: 'testPayload' },
      });
    });

    it('should not post message if event not enabled', () => {
      const schema = new Schema({ name: String });
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePreExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).not.toHaveBeenCalled();
    });

    it('should not post message if event type is post', () => {
      const schema = new Schema({ name: String });
      schema.broadcastEnabledEvents = {
        testEvent: {
          type: 'post',
          prepare: (payload: any) => ({ prepared: payload }),
        },
      };
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePreExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePostExec', () => {
    let originalChannel: any;

    beforeEach(() => {
      originalChannel = iodm.channel;
      (iodm as any).channel = {
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      } as any;
    });

    afterEach(() => {
      (iodm as any).channel = originalChannel;
    });

    it('should post message for post event', () => {
      const schema = new Schema({ name: String });
      schema.broadcastEnabledEvents = {
        testEvent: {
          type: 'post',
          prepare: (payload: any) => ({ prepared: payload }),
        },
      };
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePostExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).toHaveBeenCalledWith({
        model: 'testStore',
        type: 'post',
        event: 'testEvent',
        payload: { prepared: 'testPayload' },
      });
    });

    it('should not post message if event not enabled', () => {
      const schema = new Schema({ name: String });
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePostExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).not.toHaveBeenCalled();
    });

    it('should not post message if event type is pre', () => {
      const schema = new Schema({ name: String });
      schema.broadcastEnabledEvents = {
        testEvent: {
          type: 'pre',
          prepare: (payload: any) => ({ prepared: payload }),
        },
      };
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      (TestModel as any).handlePostExec('testEvent', 'testPayload');

      expect(iodm.channel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('syncModelToSchema', () => {
    let originalChannel: any;

    beforeEach(() => {
      originalChannel = iodm.channel;
      (iodm as any).channel = {
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      } as any;
    });

    afterEach(() => {
      (iodm as any).channel = originalChannel;
    });

    it('should set schema and storeName', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ name: String });
      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect(SyncModel.getStoreName()).toBe('syncStore');
      expect(SyncModel.getSchema()).not.toBe(schema); // cloned
    });

    it('should define virtual properties', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ first: String, last: String });
      schema.virtual('fullName').get(function (this: any) {
        return `${this.first} ${this.last}`;
      });

      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      const instance = new SyncModel({ first: 'John', last: 'Doe' });
      expect((instance as any).fullName).toBe('John Doe');
    });

    it('should define instance methods', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema<any, { greet: () => string }>({ name: String });
      schema.method('greet', function (this: any) {
        return `Hello, ${this.name}`;
      });

      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      const instance = new SyncModel({ name: 'John' });
      expect((instance as any).greet()).toBe('Hello, John');
    });

    it('should define static methods', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema<
        any,
        any,
        any,
        { findByName: (name: string) => { name: string } }
      >({
        name: String,
      });
      schema.static('findByName', function (name: string) {
        return { name };
      });

      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect((SyncModel as any).findByName('test')).toEqual({ name: 'test' });
    });

    it('should set document middleware on prototype', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ name: String });
      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect((SyncModel.prototype as any).documentMiddleware).toBeDefined();
    });

    it('should set Query class', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ name: String });
      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect((SyncModel as any).Query).toBeDefined();
    });

    it('should add event listener to channel', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ name: String });
      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      expect(iodm.channel.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should not sync again if schema already exists', () => {
      class SyncModel extends AbstractModel {}

      const schema = new Schema({ name: String });
      SyncModel.syncModelToSchema({ name: 'syncStore', schema });

      const newSchema = new Schema({ age: Number });
      SyncModel.syncModelToSchema({ name: 'syncStore2', schema: newSchema });

      expect(SyncModel.getStoreName()).toBe('syncStore');
      expect((SyncModel.getSchema() as any).tree.name).toBeDefined();
      expect((SyncModel.getSchema() as any).tree.age).toBeUndefined();
    });
  });

  describe('openCursor', () => {
    it('should create Query and call openCursor', () => {
      const filter = { name: 'test' };
      const options = {};

      const result = TestModel.openCursor(filter, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.openCursor).toHaveBeenCalledWith(filter, {
        Constructor: TestModel,
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('openCursorResult');
    });
  });

  describe('find', () => {
    it('should create Query and call find', () => {
      const filter = { name: 'test' };
      const options = {};

      const result = TestModel.find(filter, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.find).toHaveBeenCalledWith(filter, {
        Constructor: TestModel,
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('findResult');
    });
  });

  describe('findById', () => {
    it('should create Query and call findById', () => {
      const id = '123';
      const options = {
        populateFields: { field: { path: 'field' } },
      };

      const result = TestModel.findById(id, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.findById).toHaveBeenCalledWith(id, {
        Constructor: TestModel,
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('findByIdResult');
    });
  });

  describe('insertOne', () => {
    it('should create Query and call insertOne with a single document', async () => {
      const doc = { _id: 1, name: 'testDoc', value: 42 };
      const options = { throwOnError: true };

      const result = await TestModel.insertOne(doc, options);

      expect(result).toEqual('insertOneResult');
    });
  });

  describe('insertMany', () => {
    it('should create Query and call insertMany with an array of documents', async () => {
      const docs = [
        { _id: 1, name: 'doc1', value: 1 },
        { _id: 2, name: 'doc2', value: 2 },
        { _id: 3, name: 'doc3', value: 3 },
      ];

      mockQueryInstance.insertMany = vi.fn().mockResolvedValue(docs);

      const options = { throwOnError: true };

      const result = await TestModel.insertMany(docs, options);

      expect(result).toEqual(docs);
    });

    it('should create Query and call insertMany with empty array', async () => {
      const docs: any[] = [];
      const options = {};

      const result = await TestModel.insertMany(docs, options);

      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should create Query and call findByIdAndUpdate', () => {
      const id = '123';
      const payload = { $set: { name: 'updated' } };
      const options = { new: true };

      const result = TestModel.findByIdAndUpdate(id, payload, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        payload,
        {
          Constructor: TestModel,
          transaction: expect.any(Object),
          ...options,
        }
      );
      expect(result).toBe('findByIdAndUpdateResult');
    });
  });

  describe('findByIdAndDelete', () => {
    it('should create Query and call findByIdAndDelete', () => {
      const id = '123';
      const options = {
        populateFields: { field: { path: 'field' } },
      };

      const result = TestModel.findByIdAndDelete(id, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.findByIdAndDelete).toHaveBeenCalledWith(id, {
        Constructor: TestModel,
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('findByIdAndDeleteResult');
    });
  });

  describe('deleteOne', () => {
    it('should create Query and call deleteOne', () => {
      const filter = { name: 'test' };
      const options = {};

      const result = TestModel.deleteOne(filter, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.deleteOne).toHaveBeenCalledWith(filter, {
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('deleteOneResult');
    });
  });

  describe('deleteMany', () => {
    it('should create Query and call deleteMany', () => {
      const filter = { active: false };
      const options = {};

      const result = TestModel.deleteMany(filter, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.deleteMany).toHaveBeenCalledWith(filter, {
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('deleteManyResult');
    });

    it('should create Query and call deleteMany without filter', () => {
      const options = {};

      const result = TestModel.deleteMany(undefined, options);

      expect(mockQueryInstance.deleteMany).toHaveBeenCalledWith(undefined, {
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('deleteManyResult');
    });
  });

  describe('updateMany', () => {
    it('should create Query and call updateMany', () => {
      const filter = { status: 'pending' };
      const payload = { $set: { status: 'complete' } };
      const options = {};

      const result = TestModel.updateMany(filter, payload, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.updateMany).toHaveBeenCalledWith(
        filter,
        payload,
        {
          transaction: expect.any(Object),
          ...options,
        }
      );
      expect(result).toBe('updateManyResult');
    });
  });

  describe('updateOne', () => {
    it('should create Query and call updateOne', () => {
      const filter = { status: 'pending' };
      const payload = { $set: { status: 'complete' } };
      const options = {};

      const result = TestModel.updateOne(filter, payload, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.updateOne).toHaveBeenCalledWith(
        filter,
        payload,
        {
          transaction: expect.any(Object),
          ...options,
        }
      );
      expect(result).toBe('updateOneResult');
    });
  });

  describe('countDocuments', () => {
    it('should create Query and call countDocuments', () => {
      const filter = { archived: true };
      const options = {};

      const result = TestModel.countDocuments(filter, options);

      expect((TestModel as any).Query).toHaveBeenCalledWith(
        mockDB,
        'testStore'
      );
      expect(mockQueryInstance.countDocuments).toHaveBeenCalledWith(filter, {
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('countDocumentsResult');
    });

    it('should create Query and call countDocuments without filter', () => {
      const options = {};

      const result = TestModel.countDocuments(undefined, options);

      expect(mockQueryInstance.countDocuments).toHaveBeenCalledWith(undefined, {
        transaction: expect.any(Object),
        ...options,
      });
      expect(result).toBe('countDocumentsResult');
    });
  });

  describe('replaceOne', () => {
    it('should instantiate model with isNew false and call save with options', async () => {
      const doc = { _id: '123', name: 'updatedDoc', value: 100 };
      const options = {};
      const saveSpy = vi
        .spyOn(TestModel.prototype as any, 'save')
        .mockImplementation(function (this: any, receivedOptions: any) {
          expect(this.$_isNew).toBe(false);
          expect(receivedOptions).toBe(options);
          return Promise.resolve('saveResult');
        });

      const result = await TestModel.replaceOne(doc, options);

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('saveResult');
    });

    it('should instantiate model with isNew false and call save without options', async () => {
      const doc = {
        _id: '789',
        name: 'complex',
        nested: { prop: 'value' },
        array: [1, 2, 3],
      };
      const saveSpy = vi
        .spyOn(TestModel.prototype as any, 'save')
        .mockImplementation(function (this: any, receivedOptions: any) {
          expect(this.$_isNew).toBe(false);
          expect(receivedOptions).toBeUndefined();
          return Promise.resolve('saveResult');
        });

      const result = await TestModel.replaceOne(doc);

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('saveResult');
    });
  });

  describe('onUpgradeNeeded', () => {
    it('should create object store when missing', () => {
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

    it('should not create object store when already exists', () => {
      const db = createFakeDB();
      db.objectStoreNames.contains = vi.fn(() => true);

      const schema = new Schema({ name: String });
      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      TestModel.onUpgradeNeeded(db);

      expect(db.createObjectStore).not.toHaveBeenCalled();
    });

    it('should create index if objectStore is not present', () => {
      const db = createFakeDB();
      db.objectStoreNames.contains = vi.fn(() => false);
      const createIndexMock = vi.fn();
      db.createObjectStore = vi.fn(
        () =>
          ({
            createIndex: createIndexMock,
          }) as any
      );

      const schema = new Schema({
        name: { type: String, index: true },
        age: { type: Number, unique: true },
        items: { type: Number, multiEntry: true },
      });

      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      TestModel.onUpgradeNeeded(db);

      expect(createIndexMock).toHaveBeenCalledTimes(2);
      expect(createIndexMock.mock.calls).toEqual([
        [
          'name',
          'name',
          {
            unique: undefined,
            multiEntry: undefined,
          },
        ],
        [
          'age',
          'age',
          {
            unique: true,
            multiEntry: undefined,
          },
        ],
      ]);
    });

    it('should not create index if objectStore is present', () => {
      const db = createFakeDB();
      db.objectStoreNames.contains = vi.fn(() => true);
      const createIndexMock = vi.fn();
      db.createObjectStore = vi.fn(
        () =>
          ({
            createIndex: createIndexMock,
          }) as any
      );

      const schema = new Schema({
        name: { type: String, index: true },
        age: { type: Number, unique: true },
        items: { type: Number, multiEntry: true },
      });

      (TestModel as any).schema = schema;
      (TestModel as any).storeName = 'testStore';

      TestModel.onUpgradeNeeded(db);

      expect(createIndexMock).toHaveBeenCalledTimes(0);
    });
  });
});
