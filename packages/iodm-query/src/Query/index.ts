import { QueryExecutorFactory } from "../QueryExecutor/QueryExecutorFactory";
import type { ISearchKey } from "../QueryExecutor/type";
import type { IQuery, TQueryKeys, IQuerySelectors, IQueryBaseOptions } from "./type";

/**
 * Query wrapper for IndexedDB
 * 
 * @example
 * const query = new Query(idb, "store-name");
 * const data = await query.find({ $search: "text" });
 */
export class Query<ResultType = unknown> implements IQuery<ResultType> {
  private type: TQueryKeys;
  private idb: IDBDatabase;
  private storeName: string;
  private querySelectors: Partial<IQuerySelectors>;
  private transaction?: IDBTransaction;

  constructor(idb: IDBDatabase, storeName: string) {
    this.idb = idb;
    this.storeName = storeName;
    this.type = '_find';
    this.querySelectors = {};
  }

  /**
   * Used to find list of item from the IndexedDB
   * 
   * @example
   * const query = new Query(idb, "store-name");
   * const data = await query.find({ $search: "text" });
   * 
   * @param param0 Search query object
   * @param param1 Query options
   * @returns this
   */
  find({ $query }: IQuerySelectors, { transaction }: IQueryBaseOptions = {}) {
    this.type = '_find';
    this.querySelectors.$query = $query;
    this.transaction = transaction;
    return this;
  }

  private async _find(): Promise<ResultType> {
    return QueryExecutorFactory.get().find<ResultType>({ $query: this.querySelectors.$query }, {
      idb: this.idb,
      transaction: this.transaction,
      storeNames: this.storeName,
    });
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
  findById(id: Exclude<ISearchKey, null | undefined>, { transaction }: IQueryBaseOptions = {}) {
    this.type = '_findById';
    this.querySelectors.$query = id;
    this.transaction = transaction;
    return this;
  }

  private async _findById(): Promise<ResultType> {
    if (!this.querySelectors.$query) throw new Error("search key is required");

    return QueryExecutorFactory.get().findById<ResultType>(this.querySelectors.$query, {
      idb: this.idb,
      transaction: this.transaction,
      storeNames: this.storeName,
    });
  }


  /**
   * Executes the query and return the result
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
