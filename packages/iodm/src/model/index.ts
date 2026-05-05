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
  QueryExecutorUpdateManyUpdater,
  QueryRootFilter
} from 'iodm-query';
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
import { generateNumberId, generateStringId, isPostMessage } from './helpers';
import { StringSchema } from '../schema/primitive/string';
import { NumberSchema } from '../schema/primitive/number';

/**
 * AbstractModelClass is an abstract class that serves as the base for all models in the ODM.
 * It should not be instantiated directly. Instead, use `iodm.model` to create a model class that extends AbstractModelClass, 
 * and then instantiate that model class to create instances of the model.
 * 
 */
class AbstractModelClass implements ModelInstance {
  private _isNew: boolean;
  private _documentMiddleware: CustomMiddlewareExecutor;

  /**
   * Creates an instance of AbstractModel.
   * 
   * @param defaultValues - An object containing default values for the instance properties.
   * @param options - Optional settings for the instance creation.
   * @param options.isNew - A boolean indicating whether the instance is new (default: true).
   */
  constructor(defaultValues: any, options?: ModelOptions) {
    this._isNew = options?.isNew ?? true;
    this._documentMiddleware = Object.getPrototypeOf(this)._documentMiddleware;

    if (defaultValues && typeof defaultValues === 'object') {
      for (const key in defaultValues) {
        (this as any)[key] = defaultValues[key];
      }
    }
  }

  /**
   * Saves the current instance to the database. If the instance is new, it will be inserted; otherwise, it will be replaced.
   * 
   * @example
   * ```ts
   * const instance = new UserModel({ name: 'John' });
   * await instance.save();
   * ```
   * 
   * @param options - Optional settings for the save operation.
   * @returns A promise that resolves with the result of the save operation.
   * @throws Will throw an error if validation fails or if there is an issue during the save process.
   */
  async save(options?: ModelSaveOptions): Promise<any> {
    const transaction = options?.transaction
      ? options.transaction
      : this.createInstanceTransaction('readwrite');

    try {
      this._documentMiddleware.execPre('save', this, null);
      this._documentMiddleware.execPre('validate', this, null);

      if (this._isNew) {
        AbstractModelClass.insertUniqueKeyIfNotExist(this, this);
      }

      try {
        this.validate();
      } catch (err) {
        this._documentMiddleware.execPost('validate', this, err);
        throw err;
      }

      this._documentMiddleware.execPost('validate', this, null);

      await this.getInstanceSchema().save(this, {
        transaction,
        ...this._getSchemaMethodOptions(),
      });

      let queryResult: unknown;
      const QueryClass = AbstractModelClass.getQueryClass(this);

      if (this._isNew) {
        queryResult = await new QueryClass(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).insertOne(this.toJSON(), {
          throwOnError: true,
          ...options,
          transaction,
        });

        this._isNew = false;
      } else {
        queryResult = await new QueryClass(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).replaceOne(this.toJSON(), {
          ...options,
          transaction,
        });
      }

      queryResult = this._documentMiddleware.execPost(
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
        } catch { }
      }
      this._documentMiddleware.execPost('save', this, err);
      throw err;
    }
  }

  /**
   * Validates the current instance against its schema.
   * 
   * @returns A boolean indicating whether the instance is valid.
   * @throws Will throw an error if validation fails.
   */
  validate(): boolean {
    return this.getInstanceSchema().validate(
      this,
      this._getSchemaMethodOptions()
    );
  }

  /**
   * Converts the instance to a plain JavaScript object, applying schema casting.
   * 
   * @returns A plain JavaScript object representing the instance.
   */
  toJSON() {
    return this.getInstanceSchema().castFrom(
      this,
      this._getSchemaMethodOptions()
    );
  }

  getInstanceSchema() {
    return AbstractModelClass.getSchema(this);
  }

  getInstanceDB() {
    return AbstractModelClass.getDB(this);
  }

  getInstanceStoreName() {
    return AbstractModelClass.getStoreName(this);
  }

  /**
   * Creates an instance of IDBTransaction for the current instance.
   * The transaction will include the storeName for the current instance and all referenced storeNames defined in the schema.
   * 
   * @param mode - The mode for the transaction (default: 'readwrite').
   * @returns An IDBTransaction instance.
   */
  createInstanceTransaction(mode?: IDBTransactionMode) {
    return this.getInstanceDB().transaction(
      [this.getInstanceStoreName(), ...this.getInstanceSchema().getRefNames()],
      mode
    );
  }

  private _getSchemaMethodOptions() {
    return {};
  }

  // static properties and methods

  private static schema: Schema<any, {}, {}> | null;
  private static storeName: string | null;
  private static db: IDBDatabase | null;
  private static Query: typeof Query<any, any>;

  private static insertUniqueKeyIfNotExist(ctx: any, obj?: any) {
    if (!obj || typeof obj !== 'object') return;
    const keyPath = this.getSchema(ctx).getSchemaOptions().keyPath;
    const keySchema = this.getSchema(ctx).getSchemaFor(keyPath);

    if (obj[keyPath]) return;

    if (keySchema instanceof StringSchema) {
      obj[keyPath] = generateStringId();
    } else if (keySchema instanceof NumberSchema) {
      obj[keyPath] = generateNumberId();
    }
  }

  /**
   * Retrieves the schema associated with the model or instance.
   * 
   * @param obj - An optional instance of the model. If provided, the schema will be retrieved based on the instance's constructor; otherwise, it will be retrieved based on the model itself.
   * @returns The schema associated with the model or instance.
   * @throws Will throw an error if the schema is not defined.
   */
  static getSchema(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _schema: Schema<any, {}, {}> | undefined = thisPrototype.schema;

    if (!_schema) {
      throw new Error('Schema is required');
    }
    return _schema;
  }

  /**
   * Retrieves the database instance associated with the model or instance.
   * 
   * @param obj - An optional instance of the model. If provided, the database will be retrieved based on the instance's constructor; otherwise, it will be retrieved based on the model itself.
   * @returns The database instance associated with the model or instance.
   * @throws Will throw an error if the database is not defined.
   */
  static getDB(obj?: any): IDBDatabase {
    const _db = obj ? Object.getPrototypeOf(obj).constructor.db : this.db;

    if (!_db) {
      throw new Error('db is required');
    }
    return _db;
  }

  /**
   * Sets the database instance for the model.
   * 
   * @param idb - The IDBDatabase instance to be set for the model.
   */
  static setDB(idb: IDBDatabase) {
    this.db = idb;
  }

  /**
   * Retrieves the store name associated with the model or instance.
   * 
   * @param obj - An optional instance of the model. If provided, the store name will be retrieved based on the instance's constructor; otherwise, it will be retrieved based on the model itself.
   * @returns The store name associated with the model or instance.
   * @throws Will throw an error if the store name is not defined.
   */
  static getStoreName(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _storeName: string | undefined = thisPrototype.storeName;

    if (!_storeName) {
      throw new Error('db is required');
    }
    return _storeName;
  }

  private static getQueryClass(obj?: any): typeof Query {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const QueryClass: typeof Query | undefined = thisPrototype.Query;

    if (!QueryClass) {
      throw new Error('Query is required');
    }
    return QueryClass;
  }

  /**
   * init method will be called in the onsuccess event of the IndexedDB opening process to initialize the database.
   */
  static init(idb: IDBDatabase) {
    this.setDB(idb);
  }

  /**
   * onUpgradeNeeded method will be called in the onupgradeneeded event of the IndexedDB opening process.
   */
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

  /**
   * Pre-processes a document after retrieving it from the database, applying any necessary transformations defined in the schema.
   */
  static async preProcess(doc: any, options: QueryExecutorGetCommonOptions) {
    if (!doc || typeof doc !== 'object') return doc;

    return this.getSchema().preProcess(doc, options);
  }

  /**
   * Creates a transaction for the model.
   * 
   * @param mode - The mode for the transaction.
   * @returns The transaction instance.
   */
  static createTransaction(mode?: IDBTransactionMode) {
    return this.getDB().transaction(
      [this.getStoreName(), ...this.getSchema().getRefNames()],
      mode
    );
  }

  /**
   * Opens a iterable cursor, with the cursor object it's possible to iterate one document after another
   *
   * @example
   * ```ts
   * const itr = await UserModel.openCursor({ age: { $gt: 18 } });
   *
   * for await (const doc of itr) {
   *   console.log(doc);
   * }
   * ```
   * 
   * @remarks
   * Any opeation that takes time in between the iteration of the cursor will result in an error, because the transaction of the cursor will be closed. 
   * Be cautious when using the cursor to not do any long operation in between the iteration, 
   * if you need to do it, consider using `find` method instead of `openCursor` and iterate the result array.
   *
   * @param query - Search query object
   * @param options - Query options
   * @returns
   */
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

  /**
   * Finds documents in the database that match the specified filter and options.
   * 
   * @example
   * ```ts
   * const users = await UserModel.find({ age: { $gt: 18 } });
   * console.log(users);
   * ```
   * 
   * @param filter - An optional filter object to specify the search criteria.
   * @param options - Optional settings for the find operation.
   * @returns A promise that resolves with an array of documents that match the filter criteria.
   */
  static find(filter?: QueryRootFilter, options?: QueryFindOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).find(filter, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
      ...options,
    });
  }

  /**
   * Finds a single document in the database by its ID.
   * 
   * @example
   * ```ts
   * const user = await UserModel.findById('123');
   * console.log(user);
   * ```
   * 
   * @param id - The ID of the document to find.
   * @param options - Optional settings for the findById operation.
   * @returns A promise that resolves with the document that matches the specified ID, or `undefined` if no document is found.
   */
  static findById(id: IDBValidKey, options?: QueryFindByIdOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).findById(id, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
      ...options,
    });
  }

  /**
   * Inserts a single document into the database.
   * 
   * @example
   * ```ts
   * const user = await UserModel.insertOne({ name: 'John', age: 30 });
   * console.log(user);
   * ```
   * 
   * @remarks
   * Nested schema values will be saved to it's corresponding object stores.
   * 
   * @param doc - The document to be inserted into the database.
   * @param options - Optional settings for the insertOne operation.
   * @returns A promise that resolves with the inserted document, including any default values and generated keys.
   */
  static async insertOne(doc: any, options?: ModelSaveOptions) {
    const obj = new this(doc, { isNew: true });
    return obj.save(options);
  }

  /**
   * Inserts multiple documents into the database. 
   * 
   * @example
   * ```ts
   * const users = await UserModel.insertMany([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 },
   * ]);
   * console.log(users);
   * ```
   * 
   * @remarks
   * Nested schema values will not be saved to its corresponding object stores.
   * 
   * @param docs - An array of documents to be inserted into the database.
   * @param options - Optional settings for the insertMany operation.
   * @returns A promise that resolves with an array of results for each document insertion. Each result will either be the inserted document (including any default values and generated keys) or an error if the insertion failed for that document.
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
        this.insertUniqueKeyIfNotExist(null, doc);
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
      } catch { }

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
   * Replaces a single document in the database. The document to be replaced will be determined based on the unique key defined in the schema.
   * 
   * @example
   * ```ts
   * const user = await UserModel.replaceOne({ _id: '123', name: 'John', age: 30 });
   * console.log(user);
   * ```
   * 
   * @remarks
   * - Nested schema values will be saved to their corresponding object stores.
   * - By default the keyPath will be `_id`, but it can be configured in the schema options.
   * 
   * @param doc - The document to be replaced in the database. It must include the unique key defined in the schema to identify the document to be replaced.
   * @param options - Optional settings for the replaceOne operation.
   * @returns A promise that resolves with the replaced document, including any default values and generated keys.
   */
  static replaceOne(doc: any, options?: QueryReplaceOneOptions) {
    const obj = new this(doc, { isNew: false });
    return obj.save(options);
  }

  /**
   * Updates multiple documents in the database that match the specified filter with the provided update payload.
   * 
   * @example
   * ```ts
   * const result = await UserModel.updateMany(
   *   { age: { $gt: 18 } },
   *   { $set: { isAdult: true } }
   * );
   * console.log(result);
   * ```
   * 
   * @remarks
   * When using updateMany, the values will not be validated against the schema.
   * If the document need to validate, use `schema.validate` method before calling updateMany.
   * 
   * @param filter - The filter object to specify the search criteria for the documents to be updated.
   * @param payload - The update payload specifying the fields to be updated and their new values or a update function.
   * @param options - Optional settings for the updateMany operation.
   * @returns A promise that resolves with the result of the update operation, including information about the number of documents matched and modified.
   */
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

  /**
   * Updates a single document in the database that matches the specified filter with the provided update payload.
   * 
   * @example
   * ```ts
   * const result = await UserModel.updateOne(
   *   { _id: '123' },
   *   { $set: { name: 'John Doe' } }
   * );
   * console.log(result);
   * ```
   * 
   * @remarks
   * When using updateOne, the values will not be validated against the schema.
   * If the document need to validate, use `schema.validate` method before calling updateOne.
   * 
   * @param filter - The filter object to specify the search criteria for the document to be updated.
   * @param payload - The update payload specifying the fields to be updated and their new values or a update function.
   * @param options - Optional settings for the updateOne operation.
   * @returns A promise that resolves with the result of the update operation, including information about whether a document was matched and modified.
   */
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

  /**
   * Deletes multiple documents from the database that match the specified filter.
   * 
   * @example
   * ```ts
   * const result = await UserModel.deleteMany({ age: { $lt: 18 } });
   * console.log(result);
   * ```
   * 
   * @param filter - An optional filter object to specify the search criteria for the documents to be deleted. If no filter is provided, all documents in the store will be deleted.
   * @param options - Optional settings for the deleteMany operation.
   * @returns A promise that resolves with the result of the delete operation, including information about the number of documents deleted.
   */
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

  /**
   * Deletes a single document from the database that matches the specified filter.
   * 
   * @example
   * ```ts
   * const result = await UserModel.deleteOne({ _id: '123' });
   * console.log(result);
   * ```
   * 
   * @param filter - An optional filter object to specify the search criteria for the document to be deleted. If no filter is provided, no document will be deleted.
   * @param options - Optional settings for the deleteOne operation.
   * @returns A promise that resolves with the result of the delete operation, including information about the number of documents deleted.
   */
  static deleteOne(filter?: QueryRootFilter, options?: QueryDeleteOneOptions) {
    return new this.Query(this.getDB(), this.getStoreName()).deleteOne(filter, {
      transaction: this.createTransaction('readwrite'),
      ...options,
    });
  }

  /**
   * Finds a single document by its ID and deletes it from the database.
   * 
   * @example
   * ```ts
   * const user = await UserModel.findByIdAndDelete('123');
   * console.log(user);
   * ```
   * 
   * @param id - The ID of the document to find and delete.
   * @param options - Optional settings for the findByIdAndDelete operation.
   * @returns A promise that resolves with the document that was deleted, or `undefined` if no document was found with the specified ID.
   */
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

  /**
   * Finds a single document by its ID and updates it with the provided update payload.
   * 
   * @example
   * ```ts
   * const user = await UserModel.findByIdAndUpdate(
   *   '123',
   *   { $set: { name: 'John Doe' } }
   * );
   * console.log(user);
   * ```
   * 
   * @remarks
   * When using findByIdAndUpdate, the values will not be validated against the schema.
   * 
   * @param id - The ID of the document to find and update.
   * @param payload - The update payload specifying the fields to be updated and their new values or a update function.
   * @param options - Optional settings for the findByIdAndUpdate operation.
   * @returns A promise that resolves with the updated document, or `undefined` if no document was found with the specified ID.
   */
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

  /**
   * Counts the number of documents in the database that match the specified filter.
   * 
   * @example
   * ```ts
   * const count = await UserModel.countDocuments({ age: { $gt: 18 } });
   * console.log(count);
   * ```
   * 
   * @param filter - An optional filter object to specify the search criteria for the documents to be counted. If no filter is provided, all documents in the store will be counted.
   * @param options - Optional settings for the countDocuments operation.
   * @returns A promise that resolves with the number of documents that match the specified filter criteria.
   */
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

  /**
   * Handles pre-execution events for the model's schema for Broadcast.
   */
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

  /**
   * Handles post-execution events for the model's schema for Broadcast.
   */
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

  /**
   * Handles incoming broadcast messages and executes the corresponding broadcast hooks defined in the schema.
   * 
   * @param ev - The message event containing the broadcast message data.
   */
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

  /**
   * Will be called when creating the model to sync the schema with the model, defining all virtuals, methods, statics and middleware.
   */
  static syncModelToSchema({ name, schema }: { name: string; schema: Schema }) {
    if (this.schema) return;

    const newSchema = schema.clone();
    newSchema.applyPlugins();

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
    this.prototype._documentMiddleware = newSchema.middleware.filter((name) => {
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
}

const AbstractModel: IModel = AbstractModelClass;

export { AbstractModel, AbstractModelClass };
