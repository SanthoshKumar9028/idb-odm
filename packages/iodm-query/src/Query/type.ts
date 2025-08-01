import type {
  ISearchKey,
  QueryExecutorInsertOptions,
} from '../QueryExecutor/type';
import type { Prettify } from '../utils/type';

export interface IQuerySelectors {
  $key: ISearchKey;
}

export interface IQueryOptions {
  transaction?: IDBTransaction;
}

export type TQueryFindOptions = IQueryOptions;

export type TQueryFindByOptions = IQueryOptions;

export type IQueryInsertOneOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorInsertOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type IQueryInsertManyOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorInsertOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type TQueryOptions =
  | Prettify<
      {
        type: '_find';
        querySelectors: Partial<IQuerySelectors>;
      } & TQueryFindOptions
    >
  | Prettify<
      {
        type: '_findById';
        querySelectors: Partial<IQuerySelectors>;
      } & TQueryFindByOptions
    >
  | Prettify<
      {
        type: '_insertOne';
        insertList: unknown[];
      } & IQueryInsertOneOptions
    >
  | Prettify<
      {
        type: '_insertMany';
        insertList: unknown[];
      } & IQueryInsertManyOptions
    >;

export interface IBaseQuery<ResultType> {
  find(query: IQuerySelectors, options?: IQueryOptions): IBaseQuery<ResultType>;
  findById(id: ISearchKey, options?: IQueryOptions): IBaseQuery<ResultType>;
  insertOne(payload: unknown, options?: IQueryOptions): IBaseQuery<ResultType>;
  insertMany(
    payload: unknown[],
    options?: IQueryOptions
  ): IBaseQuery<ResultType>;
}

export type TQueryKeys = keyof IBaseQuery<unknown> & {};

export type TQueryInternalKeys = keyof {
  [K in TQueryKeys as `_${K}`]: unknown;
};

export interface IQuery<ResultType> extends IBaseQuery<ResultType> {
  exec(): Promise<ResultType>;
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>;
}
