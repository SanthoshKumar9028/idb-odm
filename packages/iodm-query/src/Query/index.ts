import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import type { ISearchKey } from '../QueryExecutor/type';
import type {
  IQuery,
  TQueryKeys,
  IQuerySelectors,
  IQueryBaseOptions,
} from './type';

/**
 * Query wrapper for IndexedDB
 *
 * @example
 * const query = new Query(idb, "store-name");
 * const list = await query.find({ $query: "text" });
 * const item = await query.findById(id);
 */
export class Query<ResultType = unknown> implements IQuery<ResultType> {
  private type: TQueryKeys;
  private idb: IDBDatabase;
  private storeName: string;
  private querySelectors: Partial<IQuerySelectors>;
  private transaction?: IDBTransaction;
  private insertList: unknown[];

  constructor(idb: IDBDatabase, storeName: string) {
    this.idb = idb;
    this.storeName = storeName;
    this.type = '_find';
    this.querySelectors = {};
    this.insertList = [];
  }

  /**
   * Used to find list of item from the IndexedDB
   *
   * @example
   * const query = new Query(idb, "store-name");
   * const data = await query.find({ $query: "text" });
   *
   * @param param0 Search query object
   * @param param1 Query options
   * @returns this
   */
  find(
    { $query }: IQuerySelectors = { $query: null },
    { transaction }: IQueryBaseOptions = {}
  ) {
    this.type = '_find';
    this.querySelectors.$query = $query;
    this.transaction = transaction;
    return this;
  }

  private async _find(): Promise<ResultType> {
    if (!this.idb) {
      throw new Error('idb is requred');
    }
    if (!this.storeName) {
      throw new Error('store name is requred');
    }

    let transaction = this.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().find<ResultType>(
      { $query: this.querySelectors.$query },
      {
        idb: this.idb,
        transaction,
        storeName: this.storeName,
      }
    );
  }

  /**
   * Used to find single item from the IndexedDB
   *
   * @example
   * const query = new Query(idb, "store-name");
   * const item = await query.findById("id");
   *
   * @param param0 Search id
   * @param param1 Query options
   * @returns this
   */
  findById(
    id: Exclude<ISearchKey, null | undefined>,
    { transaction }: IQueryBaseOptions = {}
  ) {
    this.type = '_findById';
    this.querySelectors.$query = id;
    this.transaction = transaction;
    return this;
  }

  private async _findById(): Promise<ResultType> {
    if (!this.idb) {
      throw new Error('idb is requred');
    }

    if (!this.storeName) {
      throw new Error('store name is requred');
    }

    if (!this.querySelectors.$query) {
      throw new Error('search key is required');
    }

    let transaction = this.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    return QueryExecutorFactory.getInstance().findById<ResultType>(
      this.querySelectors.$query,
      {
        idb: this.idb,
        transaction: transaction,
        storeName: this.storeName,
      }
    );
  }

  insertOne(payload: unknown, { transaction }: IQueryBaseOptions) {
    this.type = '_insertOne';
    this.transaction = transaction;
    this.insertList = [payload];
    return this;
  }

  private async _insertOne(): Promise<ResultType> {
    if (!this.idb) {
      throw new Error('idb is requred');
    }

    if (!this.storeName) {
      throw new Error('store name is requred');
    }

    if (this.insertList.length === 0) {
      throw new Error(
        'atleast one document is requred to perform insertOne operations'
      );
    }

    let transaction = this.transaction;

    if (!transaction) {
      transaction = this.idb.transaction(this.storeName, 'readonly');
    }

    const payload = this.insertList[0];

    this.insertList = [];

    return QueryExecutorFactory.getInstance().insertOne<ResultType>(payload, {
      idb: this.idb,
      transaction: transaction,
      storeName: this.storeName,
    });
  }

  /**
   * Executes the query and return the result
   *
   * @example
   * const query = new Query(idb, "store-name");
   * const item = await query.findById("id").exec();
   *
   * @returns Return the result of the query
   */
  exec() {
    return this[this.type]();
  }

  then(
    onFulfilled?: ((value: ResultType) => any | Promise<any>) | undefined,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType> {
    return this.exec().then(onFulfilled, onRejected);
  }
}
