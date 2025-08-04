import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import type { QueryExecutorUpdateQuery } from '../QueryExecutor/type';
import type {
  IQuery,
  IQuerySelectors,
  TQueryOptions,
  IQueryInsertOneOptions,
  IQueryInsertManyOptions,
  TQueryFindByIdOptions,
  TQueryFindOptions,
  IQueryReplaceOneOptions,
  IQueryUpdateManyOptions,
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
 */
export class Query<ResultType = unknown, DocumentType = unknown>
  implements IQuery<ResultType, DocumentType>
{
  private idb: IDBDatabase;
  private storeName: string;
  private options?: TQueryOptions<DocumentType>;

  /**
   *
   * @param idb Instance of the IndexedDB database
   * @param storeName Query operations will be performed on store object that having this store name
   */
  constructor(idb: IDBDatabase, storeName: string) {
    this.idb = idb;
    this.storeName = storeName;
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
   * @param querySelectors Search query object
   * @param options Query options
   *
   * @returns
   */
  find(
    querySelectors: IQuerySelectors = { $key: null },
    options: TQueryFindOptions = {}
  ) {
    this.options = { type: '_find', querySelectors, execOptions: options };
    return this;
  }

  private async _find(): Promise<ResultType> {
    if (this.options?.type !== '_find') {
      throw new Error('Invalid find method options');
    }

    const { querySelectors, execOptions } = this.options;

    let transaction = execOptions?.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().find<ResultType>(
      { $key: querySelectors.$key },
      {
        ...execOptions,
        idb: this.idb,
        transaction,
        storeName: this.storeName,
      }
    );
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
   * @param id Search id
   * @param options Query options
   * @returns
   */
  findById(id: IDBValidKey, options: TQueryFindByIdOptions = {}) {
    this.options = {
      type: '_findById',
      querySelectors: { $key: id },
      execOptions: options,
    };
    return this;
  }

  private async _findById(): Promise<ResultType> {
    if (this.options?.type !== '_findById') {
      throw new Error('Invalid findById method options');
    }

    if (!this.options.querySelectors.$key) {
      throw new Error('search key is required');
    }

    const { querySelectors, execOptions } = this.options;

    let transaction = execOptions.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().findById<ResultType>(
      querySelectors.$key,
      {
        idb: this.idb,
        transaction: transaction,
        storeName: this.storeName,
      }
    );
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
   * @param payload Document to insert
   * @param options Query options
   * @returns
   */
  insertOne(payload: DocumentType, options: IQueryInsertOneOptions = {}) {
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
   * @param payload Array of documents
   * @param options Query options
   * @returns
   */
  insertMany(payload: DocumentType[], options: IQueryInsertManyOptions = {}) {
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
   * @param payload Document object to override
   * @param options Query options
   * @returns
   */
  replaceOne(
    payload: DocumentType & { _id: string | number },
    options: IQueryReplaceOneOptions = {}
  ) {
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
   * @param query Update query to find match
   * @param payload Callback to update the found document
   * @param options Query options
   * @returns
   */
  updateMany(
    query: QueryExecutorUpdateQuery,
    payload: (param: DocumentType) => DocumentType,
    options: IQueryUpdateManyOptions = {}
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
   * @param query Update query to find match
   * @param payload New document or Callback to update the found document
   * @param options Query options
   * @returns
   */
  updateOne(
    query: QueryExecutorUpdateQuery,
    payload: DocumentType | ((param: DocumentType) => DocumentType),
    options: IQueryUpdateManyOptions = {}
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
