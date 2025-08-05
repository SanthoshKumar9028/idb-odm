import type {
  SearchKey,
  QueryExecutorCommonOptions,
  QueryExecutorInsertOptions,
  QueryExecutorReplaceOneOptions,
  QueryExecutorUpdateManyOptions,
  QueryExecutorUpdateOneOptions,
  QueryExecutorUpdateQuery,
  QueryExecutorDeleteManyOptions,
  QueryExecutorDeleteQuery,
  QueryExecutorDeleteOneOptions,
  QueryExecutorFindByIdAndDeleteOptions,
  QueryExecutorFindByIdAndUpdateOptions,
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

type QueryExecutorCommonKeys = keyof QueryExecutorCommonOptions;

type QueryFunctionOptions<Options> = Prettify<
  IQueryOptions & Omit<Options, QueryExecutorCommonKeys>
>;

export type QueryInsertOneOptions =
  QueryFunctionOptions<QueryExecutorInsertOptions>;

export type QueryInsertManyOptions =
  QueryFunctionOptions<QueryExecutorInsertOptions>;

export type QueryReplaceOneOptions =
  QueryFunctionOptions<QueryExecutorReplaceOneOptions>;

export type QueryUpdateManyOptions =
  QueryFunctionOptions<QueryExecutorUpdateManyOptions>;

export type QueryUpdateOneOptions =
  QueryFunctionOptions<QueryExecutorUpdateOneOptions>;

export type QueryDeleteManyOptions =
  QueryFunctionOptions<QueryExecutorDeleteManyOptions>;

export type QueryDeleteOneOptions =
  QueryFunctionOptions<QueryExecutorDeleteOneOptions>;

export type QueryFindByIdAndDeleteOptions =
  QueryFunctionOptions<QueryExecutorFindByIdAndDeleteOptions>;

export type QueryFindByIdAndUpdateOptions =
  QueryFunctionOptions<QueryExecutorFindByIdAndUpdateOptions>;

export type QueryOptions<DocumentType = unknown> =
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
      execOptions: QueryInsertOneOptions;
    }
  | {
      type: '_insertMany';
      insertList: DocumentType[];
      execOptions: QueryInsertManyOptions;
    }
  | {
      type: '_replaceOne';
      payload: DocumentType;
      execOptions: QueryReplaceOneOptions;
    }
  | {
      type: '_updateMany';
      query: QueryExecutorUpdateQuery;
      payload: (param: DocumentType) => DocumentType;
      execOptions: QueryUpdateManyOptions;
    }
  | {
      type: '_updateOne';
      query: QueryExecutorUpdateQuery;
      payload: DocumentType | ((param: DocumentType) => DocumentType);
      execOptions: QueryUpdateOneOptions;
    }
  | {
      type: '_deleteMany';
      query: QueryExecutorDeleteQuery;
      execOptions: QueryDeleteManyOptions;
    }
  | {
      type: '_deleteOne';
      query: QueryExecutorDeleteQuery;
      execOptions: QueryDeleteOneOptions;
    }
  | {
      type: '_findByIdAndDelete';
      id: IDBValidKey;
      execOptions: QueryFindByIdAndDeleteOptions;
    }
  | {
      type: '_findByIdAndUpdate';
      id: IDBValidKey;
      payload: (param: DocumentType) => DocumentType;
      execOptions: QueryFindByIdAndUpdateOptions;
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
    options?: QueryInsertOneOptions
  ): IBaseQuery<ResultType>;
  insertMany(
    payload: unknown[],
    options?: QueryInsertManyOptions
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
  deleteMany(
    query: QueryExecutorDeleteQuery,
    options: QueryDeleteManyOptions
  ): IBaseQuery<ResultType>;
  deleteOne(
    query: QueryExecutorDeleteQuery,
    options: QueryDeleteOneOptions
  ): IBaseQuery<ResultType>;
  findByIdAndDelete(
    id: IDBValidKey,
    options: QueryFindByIdAndDeleteOptions
  ): IBaseQuery<ResultType>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: DocumentType) => DocumentType,
    options: QueryFindByIdAndUpdateOptions
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
