import type {
  SearchKey,
  QueryExecutorInsertOptions,
  QueryExecutorReplaceOneOptions,
  QueryExecutorUpdateManyOptions,
  QueryExecutorUpdateOneOptions,
  QueryExecutorUpdateQuery,
} from '../QueryExecutor/type';
import type { Prettify } from '../utils/type';

export interface IQuerySelectors {
  $key: SearchKey;
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

export type IQueryUpdateManyOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorUpdateManyOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type IQueryUpdateOneOptions = Prettify<
  IQueryOptions &
    Omit<QueryExecutorUpdateOneOptions, 'idb' | 'storeName' | 'transaction'>
>;

export type TQueryOptions<DocumentType = unknown> =
  | {
      type: '_find';
      querySelectors: Partial<IQuerySelectors>;
      execOptions: TQueryFindOptions;
    }
  | {
      type: '_findById';
      querySelectors: { $key: IDBValidKey };
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
      payload: DocumentType & { _id: string | number };
      execOptions: IQueryReplaceOneOptions;
    }
  | {
      type: '_updateMany';
      query: QueryExecutorUpdateQuery;
      payload: (param: DocumentType) => DocumentType;
      execOptions: IQueryUpdateManyOptions;
    }
  | {
      type: '_updateOne';
      query: QueryExecutorUpdateQuery;
      payload: DocumentType | ((param: DocumentType) => DocumentType);
      execOptions: IQueryUpdateOneOptions;
    };

export interface IBaseQuery<ResultType, DocumentType = unknown> {
  find(
    query: IQuerySelectors,
    options?: TQueryFindOptions
  ): IBaseQuery<ResultType>;
  findById(
    id: SearchKey,
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
  updateMany(
    query: QueryExecutorUpdateQuery,
    payload: (param: DocumentType) => DocumentType,
    options: QueryExecutorUpdateManyOptions
  ): IBaseQuery<ResultType>;
  updateOne(
    query: QueryExecutorUpdateQuery,
    payload: DocumentType | ((param: DocumentType) => DocumentType),
    options: QueryExecutorUpdateOneOptions
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
