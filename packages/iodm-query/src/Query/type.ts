import type { ISearchKey } from "../QueryExecutor/type";

export interface IQuerySelectors {
  $query: ISearchKey
}

export interface IQueryBaseOptions { transaction?: IDBTransaction }

export interface IBaseQuery<ResultType> {
  find(query: IQuerySelectors, options?: IQueryBaseOptions): IBaseQuery<ResultType>;
  findById(id: ISearchKey, options?: IQueryBaseOptions): IBaseQuery<ResultType>;
}

export type TQueryKeys = keyof { [K in keyof IBaseQuery<unknown> as `_${K}`]: unknown };

export interface IQuery<ResultType> extends IBaseQuery<ResultType> {
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>
}