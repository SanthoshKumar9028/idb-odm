import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import type {
  QueryRootFilter,
  QueryExecutorUpdateManyUpdater,
  PopulateField,
} from '../QueryExecutor/type';
import type {
  IQuery,
  QueryOptions,
  QueryInsertOneOptions,
  QueryInsertManyOptions,
  QueryFindByIdOptions,
  QueryFindOptions,
  QueryReplaceOneOptions,
  QueryUpdateManyOptions,
  QueryDeleteManyOptions,
  QueryDeleteOneOptions,
  QueryFindByIdAndDeleteOptions,
  QueryFindByIdAndUpdateOptions,
  QueryCountDocumentsOptions,
  QueryOpenCursorOptions,
} from './type';

/**
 * Query builder for IndexedDB
 *
 * @example
 * ```ts
 * const query = new Query(idb, "store-name");
 * const list = await query.find({ $key: "text" });
 * const item = await query.findById(id);
 * ```
 *
 * @beta
 */
export class Query<ResultType = unknown, DocumentType = unknown>
  implements IQuery<ResultType, DocumentType>
{
  private idb: IDBDatabase;
  private storeName: string;
  private options?: QueryOptions<DocumentType>;

  /**
   *
   * @param idb - Instance of the IndexedDB database
   * @param storeName - Query operations will be performed on store object that having this store name
   */
  constructor(idb: IDBDatabase, storeName: string) {
    this.idb = idb;
    this.storeName = storeName;
  }

  /**
   * Opens a iterable cursor, with the cursor object it's possible to iterate one document after another
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const itr = await query.openCursor({ $key: "text", value: { $gte: 4 } });
   *
   * for await (const doc of itr) {
   *   console.log(doc);
   * }
   * ```
   *
   * @param query - Search query object
   * @param options - Query options
   * @returns
   */
  openCursor(
    query: QueryRootFilter = { $key: null },
    options: QueryOpenCursorOptions = {}
  ) {
    this.options = { type: '_openCursor', query, execOptions: options };
    return this;
  }

  private _openCursor() {
    if (this.options?.type !== '_openCursor') {
      throw new Error('Invalid openCursor method options');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions?.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().openCursor<ResultType>(query, {
      ...execOptions,
      idb: this.idb,
      transaction,
      storeName: this.storeName,
    });
  }

  /**
   * Finds list of item from the IndexedDB
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const data = await query.find({ $key: "text" });
   * ```
   *
   * @param query - Search query object
   * @param options - Query options
   *
   * @returns
   */
  find(
    query: QueryRootFilter = { $key: null },
    options: QueryFindOptions = {}
  ) {
    this.options = { type: '_find', query, execOptions: options };
    return this;
  }

  private async _find(): Promise<ResultType> {
    if (this.options?.type !== '_find') {
      throw new Error('Invalid find method options');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions?.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().find<ResultType>(query, {
      ...execOptions,
      idb: this.idb,
      transaction,
      storeName: this.storeName,
    });
  }

  /**
   * Finds single item from the IndexedDB
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const item = await query.findById("id");
   * ```
   *
   * @param id - Search id
   * @param options - Query options
   * @returns
   */
  findById(id: IDBValidKey, options: QueryFindByIdOptions = {}) {
    this.options = {
      type: '_findById',
      query: { $key: id },
      execOptions: options,
    };
    return this;
  }

  private async _findById(): Promise<ResultType> {
    if (this.options?.type !== '_findById') {
      throw new Error('Invalid findById method options');
    }

    if (!this.options.query.$key) {
      throw new Error('search key is required');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().findById<ResultType>(query.$key, {
      ...execOptions,
      idb: this.idb,
      transaction: transaction,
      storeName: this.storeName,
    });
  }

  /**
   * Inserts a single Document into IndexedDB object store
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.insertOne(document, options);
   * ```
   *
   * @param payload - Document to insert
   * @param options - Query options
   * @returns
   */
  insertOne(payload: DocumentType, options: QueryInsertOneOptions = {}) {
    this.options = {
      type: '_insertOne',
      insertList: [payload],
      execOptions: options,
    };
    return this;
  }

  private async _insertOne(): Promise<ResultType> {
    if (this.options?.type !== '_insertOne') {
      throw new Error('Invalid insertOne method options');
    }

    const payload = this.options.insertList[0];

    if (!payload) {
      throw new Error(
        'At least one document is required to perform insertOne operations'
      );
    }

    this.options.insertList = [];

    let transaction = this.options.execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().insertOne<ResultType>(payload, {
      idb: this.idb,
      transaction: transaction,
      storeName: this.storeName,
    });
  }

  /**
   * Inserts multiple documents into IndexedDB object store
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.insertMany([document1, document2, ...], options);
   * ```
   *
   * @remarks
   * Insertion operation done using a single transaction,
   * by default when error is thrown during a document insert the entire transaction will not be aborted.
   * This behavior can be changed using the throwOnError option
   *
   * @param payload - Array of documents
   * @param options - Query options
   * @returns
   */
  insertMany(payload: DocumentType[], options: QueryInsertManyOptions = {}) {
    this.options = {
      type: '_insertMany',
      insertList: payload,
      execOptions: options,
    };
    return this;
  }

  private async _insertMany(): Promise<ResultType> {
    if (this.options?.type !== '_insertMany') {
      throw new Error('Invalid insertMany method options');
    }

    const payload = this.options.insertList.slice();

    this.options.insertList = [];

    let transaction = this.options.execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().insertMany<ResultType>(payload, {
      idb: this.idb,
      transaction,
      storeName: this.storeName,
      throwOnError: this.options.execOptions.throwOnError,
    });
  }

  /**
   * To replace existing document with new document, if key is not present new document will be inserted
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.replaceOne({ $key: key }, newDoc, options);
   * ```
   *
   * @param payload - Document object to override
   * @param options - Query options
   * @returns
   */
  replaceOne(payload: DocumentType, options: QueryReplaceOneOptions = {}) {
    this.options = {
      type: '_replaceOne',
      payload: payload,
      execOptions: {
        ...options,
      },
    };
    return this;
  }

  private async _replaceOne() {
    if (this.options?.type !== '_replaceOne') {
      throw new Error('Invalid replaceOne method options');
    }

    const { payload, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().replaceOne<
      ResultType,
      DocumentType
    >(payload, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Based on the query, matched documents will be updated
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.updateMany({ $key: keyRange }, newDoc, options);
   * ```
   *
   * @param query - Update query to find match
   * @param payload - Callback to update the found document
   * @param options - Query options
   * @returns
   */
  updateMany(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options: QueryUpdateManyOptions = {}
  ) {
    this.options = {
      type: '_updateMany',
      query,
      payload,
      execOptions: options,
    };
    return this;
  }

  private async _updateMany() {
    if (this.options?.type !== '_updateMany') {
      throw new Error('Invalid updateMany method options');
    }

    const { query, payload, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().updateMany<
      ResultType,
      DocumentType
    >(query, payload, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Based on the query, first matched document will be updated
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.updateOne({ $key: key }, newDoc, options);
   * ```
   *
   * @param query - Update query to find match
   * @param payload - New document or Callback to update the found document
   * @param options - Query options
   * @returns
   */
  updateOne(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options: QueryUpdateManyOptions = {}
  ) {
    this.options = {
      type: '_updateOne',
      query,
      payload,
      execOptions: options,
    };
    return this;
  }

  private async _updateOne() {
    if (this.options?.type !== '_updateOne') {
      throw new Error('Invalid updateOne method options');
    }

    const { query, payload, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().updateOne<
      ResultType,
      DocumentType
    >(query, payload, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Deletes all matched documents
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.deleteMany({ $key: key }, options);
   * ```
   *
   * @param query - Delete query to match documents
   * @param options - Query options
   * @returns
   */
  deleteMany(
    query: QueryRootFilter = { $key: null },
    options: QueryDeleteManyOptions = {}
  ) {
    this.options = {
      type: '_deleteMany',
      query,
      execOptions: options,
    };
    return this;
  }

  private async _deleteMany() {
    if (this.options?.type !== '_deleteMany') {
      throw new Error('Invalid deleteMany method options');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().deleteMany<ResultType>(query, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Based on the query, first matched document will be deleted
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * await query.deleteOne({ $key: key }, options);
   * ```
   *
   * @remarks
   * This is similar to calling the `deleteMany` with `deleteLimit = 1` option
   *
   * @param query - Delete query to match documents
   * @param options - Query options
   * @returns
   */
  deleteOne(
    query: QueryRootFilter = { $key: null },
    options: QueryDeleteOneOptions = {}
  ) {
    this.options = {
      type: '_deleteOne',
      query,
      execOptions: options,
    };
    return this;
  }

  private async _deleteOne() {
    if (this.options?.type !== '_deleteOne') {
      throw new Error('Invalid deleteOne method options');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().deleteOne<ResultType>(query, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Removes the document with the id and returnes the deleted document.
   * if the document is not present `undefined` will be returned
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const deletedDoc = await query.findByIdAndDelete(id, options);
   * ```
   *
   * @param id - Valid search key to find a document
   * @param options - Query options
   * @returns
   */
  findByIdAndDelete(
    id: IDBValidKey,
    options: QueryFindByIdAndDeleteOptions = {}
  ) {
    this.options = {
      type: '_findByIdAndDelete',
      id,
      execOptions: options,
    };
    return this;
  }

  private async _findByIdAndDelete() {
    if (this.options?.type !== '_findByIdAndDelete') {
      throw new Error('Invalid findByIdAndDelete method options');
    }

    const { id, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().findByIdAndDelete<ResultType>(
      id,
      {
        ...execOptions,
        idb: this.idb,
        storeName: this.storeName,
        transaction,
      }
    );
  }

  /**
   * Updates the document with the id and returns the updated document.
   * if the document is not present `undefined` will be returned
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const updatedDoc = await query.findByIdAndUpdate(
   *  id,
   *  (oldDoc) => newDoc,
   *  options
   * );
   * ```
   *
   * @param id - Valid search key to find a document
   * @param payload - Callback to update the found document
   * @param options - Query options
   * @returns
   */
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: DocumentType) => DocumentType,
    options: QueryFindByIdAndUpdateOptions = {}
  ) {
    this.options = {
      type: '_findByIdAndUpdate',
      id,
      payload,
      execOptions: options,
    };
    return this;
  }

  private async _findByIdAndUpdate() {
    if (this.options?.type !== '_findByIdAndUpdate') {
      throw new Error('Invalid findByIdAndUpdate method options');
    }

    const { id, payload, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().findByIdAndUpdate<
      ResultType,
      DocumentType
    >(id, payload, {
      ...execOptions,
      idb: this.idb,
      storeName: this.storeName,
      transaction,
    });
  }

  /**
   * Returns the documents count that matches the search query
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const count = await query.countDocuments(
   *  query,
   *  options
   * );
   * ```
   *
   * @param query - Search query
   * @param options - Query options
   * @returns
   */
  countDocuments(
    query: QueryRootFilter = { $key: null },
    options: QueryCountDocumentsOptions = {}
  ) {
    this.options = {
      type: '_countDocuments',
      query,
      execOptions: options,
    };
    return this;
  }

  private async _countDocuments() {
    if (this.options?.type !== '_countDocuments') {
      throw new Error('Invalid countDocuments method options');
    }

    const { query, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().countDocuments<ResultType>(
      query,
      {
        ...execOptions,
        idb: this.idb,
        storeName: this.storeName,
        transaction,
      }
    );
  }

  populate(path: string | PopulateField) {
    if (
      this.options?.type === '_find' ||
      this.options?.type === '_findById' ||
      this.options?.type === '_findByIdAndUpdate' ||
      this.options?.type === '_findByIdAndDelete'
    ) {
      this.options.execOptions.populateFields =
        this.options.execOptions.populateFields || {};

      if (typeof path === 'string') {
        this.options.execOptions.populateFields[path] = { path };
      } else {
        this.options.execOptions.populateFields[path.path] = path;
      }
    }

    return this;
  }

  /**
   * Executes the query with accumulated options
   *
   * @example
   * ```ts
   * const query = new Query(idb, "store-name");
   * const item = await query.findById("id").exec();
   * ```
   *
   * @returns
   */
  async exec() {
    if (!this.options?.type) {
      throw new Error(
        'Once of the query operations must be called before calling exec'
      );
    }

    return this[this.options.type]();
  }

  then(
    onFulfilled?: ((value: ResultType) => any | Promise<any>) | undefined,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType> {
    return this.exec().then(onFulfilled, onRejected);
  }
}
