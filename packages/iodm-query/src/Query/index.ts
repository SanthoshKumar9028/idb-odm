import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import type { ISearchKey } from '../QueryExecutor/type';
import type {
  IQuery,
  IQuerySelectors,
  IQueryOptions,
  TQueryOptions,
  IQueryInsertOneOptions,
  IQueryInsertManyOptions,
} from './type';

/**
 * Query builder for IndexedDB
 *
 * @example
 * ```ts
 * const query = new Query(idb, "store-name");
 * const list = await query.find({ $query: "text" });
 * const item = await query.findById(id);
 * ```
 */
export class Query<ResultType = unknown> implements IQuery<ResultType> {
  private idb: IDBDatabase;
  private storeName: string;
  private options?: TQueryOptions;

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
   * const data = await query.find({ $query: "text" });
   * ``` 
   *
   * @param querySelectors Search query object
   * @param options Query options
   * 
   * @returns
   */
  find(
    querySelectors: IQuerySelectors = { $query: null },
    options: IQueryOptions = {}
  ) {
    this.options = { type: '_find', ...options, querySelectors };
    return this;
  }

  private async _find(): Promise<ResultType> {
    if (this.options?.type !== '_find') {
      throw new Error('Invalid find method options');
    }

    let transaction = this.options?.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().find<ResultType>(
      { $query: this.options.querySelectors.$query },
      {
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
  findById(
    id: Exclude<ISearchKey, null | undefined>,
    options: IQueryOptions = {}
  ) {
    this.options = {
      type: '_findById',
      ...options,
      querySelectors: { $query: id },
    };
    return this;
  }

  private async _findById(): Promise<ResultType> {
    if (this.options?.type !== '_findById') {
      throw new Error('Invalid findById method options');
    }

    if (!this.options.querySelectors.$query) {
      throw new Error('search key is required');
    }

    let transaction = this.options.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().findById<ResultType>(
      this.options.querySelectors.$query,
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
  insertOne(payload: unknown, options: IQueryInsertOneOptions = {}) {
    this.options = { type: '_insertOne', ...options, insertList: [payload] };
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

    let transaction = this.options.transaction;

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
  insertMany(payload: unknown[], options: IQueryInsertManyOptions = {}) {
    this.options = { type: '_insertMany', ...options, insertList: payload };
    return this;
  }

  private async _insertMany(): Promise<ResultType> {
    if (this.options?.type !== '_insertMany') {
      throw new Error('Invalid insertMany method options');
    }

    const payload = this.options.insertList.slice();

    this.options.insertList = [];

    let transaction = this.options.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readwrite');
    }

    return QueryExecutorFactory.getInstance().insertMany<ResultType>(payload, {
      idb: this.idb,
      transaction: transaction,
      storeName: this.storeName,
      throwOnError: this.options.throwOnError,
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
