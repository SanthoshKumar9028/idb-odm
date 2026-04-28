import type {
  QueryFindOptions,
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndUpdateOptions,
  QueryOpenCursorOptions,
  QueryDeleteOneOptions,
  QueryFindByIdOptions,
  QueryFindByIdAndDeleteOptions,
  QueryInsertOneOptions,
  QueryReplaceOneOptions,
  QueryUpdateManyOptions,
  QueryUpdateOneOptions,
  QueryDeleteManyOptions,
  QueryCountDocumentsOptions,
} from 'iodm-query';
import type {
  QueryExecutorUpdateManyUpdater,
  QueryRootFilter,
} from 'iodm-query/dist/QueryExecutor/type';
import type { Schema } from '../schema';
import type {
  IModel,
  ModelInstance,
  ModelOptions,
  ModelSaveOptions,
} from './types';
import type CustomMiddlewareExecutor from '../schema/custom-middleware-executor';

import { AbstractQuery, Query } from 'iodm-query';
import {
  documentMiddlewareKeys,
  queryMiddlewareKeys,
} from '../schema/constants';
import iodm from '../iodm';
import { isPostMessage } from './helpers';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods
  private $_isNew: boolean;
  private documentMiddleware: CustomMiddlewareExecutor;

  constructor(defaultValues: any, options?: ModelOptions) {
    this.$_isNew = options?.isNew ?? true;
    this.documentMiddleware = Object.getPrototypeOf(this).documentMiddleware;

    if (defaultValues && typeof defaultValues === 'object') {
      for (const key in defaultValues) {
        (this as any)[key] = defaultValues[key];
      }
    }
  }

  async save(options?: ModelSaveOptions): Promise<any> {
    const transaction = options?.transaction
      ? options.transaction
      : this.createInstanceTransaction('readwrite');

    try {
      this.documentMiddleware.execPre('save', this, null);
      this.documentMiddleware.execPre('validate', this, null);

      try {
        this.validate();
      } catch (err) {
        this.documentMiddleware.execPost('validate', this, err);
        throw err;
      }

      this.documentMiddleware.execPost('validate', this, null);

      await this.getInstanceSchema().save(this, {
        transaction,
        ...this.getSchemaMethodOptions(),
      });

      let queryResult: unknown;
      const QueryClass = AbstractModelTemp.getQueryClass(this);

      if (this.$_isNew) {
        queryResult = await new QueryClass(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).insertOne(this.toJSON(), {
          throwOnError: true,
          ...options,
          transaction,
        });

        this.$_isNew = false;
      } else {
        queryResult = await new QueryClass(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).replaceOne(this.toJSON(), {
          ...options,
          transaction,
        });
      }

      queryResult = this.documentMiddleware.execPost(
        'save',
        this,
        null,
        queryResult
      );

      return queryResult;
    } catch (err) {
      if (!(err instanceof Event && err.type === 'error')) {
        try {
          transaction.abort();
        } catch {}
      }
      this.documentMiddleware.execPost('save', this, err);
      throw err;
    }
  }

  validate(): boolean {
    return this.getInstanceSchema().validate(
      this,
      this.getSchemaMethodOptions()
    );
  }

  toJSON() {
    return this.getInstanceSchema().castFrom(
      this,
      this.getSchemaMethodOptions()
    );
  }

  getInstanceSchema() {
    return AbstractModelTemp.getSchema(this);
  }

  getInstanceDB() {
    return AbstractModelTemp.getDB(this);
  }

  getInstanceStoreName() {
    return AbstractModelTemp.getStoreName(this);
  }

  createInstanceTransaction(mode?: IDBTransactionMode) {
    return this.getInstanceDB().transaction(
      [this.getInstanceStoreName(), ...this.getInstanceSchema().getRefNames()],
      mode
    );
  }

  getSchemaMethodOptions() {
    return {};
  }

  // static properties and methods

  private static schema: Schema<any, {}, {}> | null;
  private static storeName: string | null;
  private static db: IDBDatabase | null;
  private static Query: typeof Query<any, any>;

  static getSchema(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _schema: Schema<any, {}, {}> | undefined = thisPrototype.schema;

    if (!_schema) {
      throw new Error('Schema is required');
    }
    return _schema;
  }

  static getDB(obj?: any): IDBDatabase {
    const _db = obj ? Object.getPrototypeOf(obj).constructor.db : this.db;

    if (!_db) {
      throw new Error('db is required');
    }
    return _db;
  }

  static setDB(idb: IDBDatabase) {
    this.db = idb;
  }

  static getStoreName(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _storeName: string | undefined = thisPrototype.storeName;

    if (!_storeName) {
      throw new Error('db is required');
    }
    return _storeName;
  }

  static getQueryClass(obj?: any): typeof Query {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const QueryClass: typeof Query | undefined = thisPrototype.Query;

    if (!QueryClass) {
      throw new Error('Query is required');
    }
    return QueryClass;
  }

  static init(idb: IDBDatabase) {
    this.setDB(idb);
  }

  static onUpgradeNeeded(idb: IDBDatabase) {
    if (!this.storeName || idb.objectStoreNames.contains(this.storeName)) {
      return;
    }

    const objectStore = idb.createObjectStore(this.storeName, {
      keyPath: this.getSchema().getSchemaOptions().keyPath,
    });

    const createIndexFor: {
      name: string;
      unique?: boolean;
      multiEntry?: boolean;
    }[] = [];

    this.getSchema().treeEntries(([key, value]) => {
      if (value.index || value.unique) {
        createIndexFor.push({
          name: key,
          unique: value.unique,
          multiEntry: value.multiEntry,
        });
      }
    });

    createIndexFor.forEach(({ name, multiEntry, unique }) => {
      objectStore.createIndex(name, name, {
        multiEntry,
        unique,
      });
    });
  }

  static async preProcess(doc: any, options: QueryExecutorGetCommonOptions) {
    if (!doc || typeof doc !== 'object') return doc;

    return this.getSchema().preProcess(doc, options);
  }

  static createTransaction(mode?: IDBTransactionMode) {
    return this.getDB().transaction(
      [this.getStoreName(), ...this.getSchema().getRefNames()],
      mode
    );
  }

  static openCursor(
    filter?: QueryRootFilter,
    options?: QueryOpenCursorOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).openCursor(
      filter,
      {
        Constructor: this,
        transaction: this.createTransaction('readonly'),
        ...options,
      }
    );
  }

  static find(filter?: QueryRootFilter, options?: QueryFindOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).find(filter, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
      ...options,
    });
  }

  static findById(id: IDBValidKey, options?: QueryFindByIdOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).findById(id, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
      ...options,
    });
  }

  /**
   * nested schema values will be saved
   */
  static async insertOne(doc: any, options?: ModelSaveOptions) {
    const obj = new this(doc);
    return obj.save(options);
  }

  /**
   * nested schema values will not be saved
   */
  static async insertMany(docs: any[], options?: QueryInsertOneOptions) {
    const transaction =
      options?.transaction ?? this.createTransaction('readwrite');
    const schema = this.getSchema();
    const validationErrors: any[] = [];
    const validationErrorsMap = new Map<number, any>();

    const validDocs: any[] = [];
    const validDocsIndex = new Map<number, number>();

    docs.forEach((doc, i) => {
      try {
        schema.validate(doc, {});
        validDocsIndex.set(i, validDocs.length);
        validDocs.push(doc);
      } catch (err) {
        validationErrors.push(err);
        validationErrorsMap.set(i, err);
      }
    });

    if (options?.throwOnError && validationErrors.length) {
      try {
        transaction.abort();
      } catch {}

      throw docs.map((_, i) => {
        return validationErrorsMap.get(i);
      });
    }

    if (validDocs.length === 0) {
      return validationErrors;
    }

    return new this.Query(this.getDB(), this.getStoreName())
      .insertMany(validDocs, {
        Constructor: this,
        ...options,
        transaction,
      })
      .then((res) => {
        return docs.map((_, i) => {
          if (validationErrorsMap.has(i)) {
            return validationErrorsMap.get(i);
          }

          return res[validDocsIndex.get(i)!];
        });
      });
  }

  /**
   * nested schema values will be saved
   */
  static replaceOne(doc: any, options?: QueryReplaceOneOptions) {
    const obj = new this(doc, { isNew: false });
    return obj.save(options);
  }

  static updateMany(
    filter: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options?: QueryUpdateManyOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).updateMany(
      filter,
      payload,
      {
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static updateOne(
    filter: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options?: QueryUpdateOneOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).updateOne(
      filter,
      payload,
      {
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static deleteMany(
    filter?: QueryRootFilter,
    options?: QueryDeleteManyOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).deleteMany(
      filter,
      {
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static deleteOne(filter?: QueryRootFilter, options?: QueryDeleteOneOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).deleteOne(filter, {
      transaction: this.createTransaction('readwrite'),
      ...options,
    });
  }

  static findByIdAndDelete(
    id: IDBValidKey,
    options?: QueryFindByIdAndDeleteOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).findByIdAndDelete(
      id,
      {
        Constructor: this,
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static findByIdAndUpdate(
    id: IDBValidKey,
    payload: QueryExecutorUpdateManyUpdater<any>,
    options?: QueryFindByIdAndUpdateOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).findByIdAndUpdate(
      id,
      payload,
      {
        Constructor: this,
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static countDocuments(
    filter?: QueryRootFilter,
    options?: QueryCountDocumentsOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).countDocuments(
      filter,
      {
        transaction: this.createTransaction('readonly'),
        ...options,
      }
    );
  }

  static handlePreExec(event: string, payload: any) {
    const options = this.schema?.broadcastEnabledEvents?.[event];

    if (!options || options.type === 'post') return;

    iodm.channel.postMessage({
      model: this.storeName,
      type: 'pre',
      event,
      payload: options.prepare(payload),
    });
  }

  static handlePostExec(event: string, payload: any) {
    const options = this.schema?.broadcastEnabledEvents?.[event];

    if (!options || options.type === 'pre') return;

    iodm.channel.postMessage({
      model: this.storeName,
      type: 'post',
      event,
      payload: options.prepare(payload),
    });
  }

  static onBroadCastMessage(ev: MessageEvent<any>) {
    const message = ev.data;

    if (
      this.schema &&
      isPostMessage(message) &&
      message.model === this.storeName
    ) {
      this.schema.execBroadcastHooks(this, null, ev);
    }
  }

  static syncModelToSchema({ name, schema }: { name: string; schema: Schema }) {
    if (this.schema) return;

    const newSchema = schema.clone();
    this.schema = newSchema;
    this.storeName = name;

    // defining all virtual props
    Object.entries(newSchema.virtuals).forEach(([key, virtualType]) => {
      Object.defineProperty(this.prototype, key, {
        get() {
          return virtualType.applyGetters(this, {});
        },
        set(value) {
          return virtualType.applySetters(this, {
            value,
          });
        },
      });
    });

    // defining all instance method props
    Object.entries(newSchema.methods).forEach(([key, func]) => {
      Object.defineProperty(this.prototype, key, {
        value: func,
      });
    });

    // defining all statics method props
    Object.entries(newSchema.statics).forEach(([key, func]) => {
      Object.defineProperty(this, key, {
        value: func,
      });
    });

    // defining document middleware executor for the model
    this.prototype.documentMiddleware = newSchema.middleware.filter((name) => {
      return documentMiddlewareKeys.includes(name);
    });

    // defining new Query constructor for the model
    this.Query = class extends AbstractQuery {
      // Query middleware executor
      middleware: CustomMiddlewareExecutor = newSchema.middleware.filter(
        (name) => {
          return queryMiddlewareKeys.includes(name);
        }
      );
    };

    iodm.channel.addEventListener(
      'message',
      this.onBroadCastMessage.bind(this)
    );

    newSchema.onExecPostResult = this.handlePostExec.bind(this);
    newSchema.onExecPreResult = this.handlePreExec.bind(this);
  }
};

export { AbstractModel };
