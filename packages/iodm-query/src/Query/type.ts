import type {
  ISearchKey,
  QueryExecutorInsertOptions,
  QueryExecutorReplaceOneOptions,
} from '../QueryExecutor/type';
import type { Prettify } from '../utils/type';

export interface IQuerySelectors {
  $key: ISearchKey;
}

export interface IQueryOptions {
  transaction?: IDBTransaction;
}

export type TQueryFindOptions = IQueryOptions;

export type TQueryFindByIdOptions = IQueryOptions;

export type IQueryInsertOneOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorInsertOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type IQueryInsertManyOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorInsertOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type IQueryReplaceOneOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorReplaceOneOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type TQueryOptions<DocumentType = unknown> =
  | {
      type: '_find';
      querySelectors: Partial<IQuerySelectors>;
      execOptions: TQueryFindOptions;
    }
  | {
      type: '_findById';
      querySelectors: { $key: Exclude<ISearchKey, null | undefined> };
      execOptions: TQueryFindByIdOptions;
    }
  | {
      type: '_insertOne';
      insertList: DocumentType[];
      execOptions: IQueryInsertOneOptions;
    }
  | {
      type: '_insertMany';
      insertList: DocumentType[];
      execOptions: IQueryInsertManyOptions;
    }
  | {
      type: '_replaceOne';
      // query: QueryExecutorReplaceOneQuery;
      payload: DocumentType & { _id: string | number };
      execOptions: IQueryReplaceOneOptions;
    };

export interface IBaseQuery<ResultType, DocumentType = unknown> {
  find(
    query: IQuerySelectors,
    options?: TQueryFindOptions
  ): IBaseQuery<ResultType>;
  findById(
    id: ISearchKey,
    options?: TQueryFindByIdOptions
  ): IBaseQuery<ResultType>;
  insertOne(
    payload: unknown,
    options?: IQueryInsertOneOptions
  ): IBaseQuery<ResultType>;
  insertMany(
    payload: unknown[],
    options?: IQueryInsertManyOptions
  ): IBaseQuery<ResultType>;
  replaceOne(
    payload: DocumentType,
    options: QueryExecutorReplaceOneOptions
  ): IBaseQuery<ResultType>;
}

export type TQueryKeys = keyof IBaseQuery<unknown> & {};

export type TQueryInternalKeys = keyof {
  [K in TQueryKeys as `_${K}`]: unknown;
};

export interface IQuery<ResultType, DocumentType>
  extends IBaseQuery<ResultType, DocumentType> {
  exec(): Promise<ResultType>;
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>;
}
