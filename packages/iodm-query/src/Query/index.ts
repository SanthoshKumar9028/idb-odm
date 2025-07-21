import { QueryExecutorFactory } from "../QueryExecutor/QueryExecutorFactory";
import type { IQuery, TQueryKeys } from "./type";

/**
 * Query wrapper for IndexedDB
 * 
 */
export class Query<ResultType = unknown> implements IQuery<ResultType> {
  private type: TQueryKeys;
  private idb: IDBDatabase;

  constructor(idb: IDBDatabase) {
    this.idb = idb;
    this.type = '_find';
  }

  find({ $query }, { transaction } = {}) {
    this.type = '_find';
    return this;
  }

  private async _find(): Promise<ResultType> {
    return QueryExecutorFactory.get().find<ResultType>({ $query: "" });
  }

  findById(id, { transaction } = {}) {
    this.type = '_findById';
    return this;
  }

  private async _findById(): Promise<ResultType> {
    return null as ResultType;
  }

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
