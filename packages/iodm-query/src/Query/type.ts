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
  QueryExecutorCountDocumentsOptions,
  CountDocumentsSearchKey,
  QueryRootFilter,
  QueryExecutorOpenCursorOptions,
} from '../QueryExecutor/type';
import type { Prettify } from '../utils/type';

export interface IQueryOptions {
  transaction?: IDBTransaction;
}

type QueryExecutorCommonKeys = keyof QueryExecutorCommonOptions;

type QueryFunctionOptions<Options> = Prettify<
  IQueryOptions & Omit<Options, QueryExecutorCommonKeys>
>;

export type QueryOpenCursorOptions =
  QueryFunctionOptions<QueryExecutorOpenCursorOptions>;

export type TQueryFindOptions = IQueryOptions;

export type TQueryFindByIdOptions = IQueryOptions;

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

export type QueryCountDocumentsOptions =
  QueryFunctionOptions<QueryExecutorCountDocumentsOptions>;

export type QueryOptions<DocumentType = unknown> =
  | {
      type: '_openCursor';
      query: QueryRootFilter;
      execOptions: QueryOpenCursorOptions;
    }
  | {
      type: '_find';
      query: Partial<QueryRootFilter>;
      execOptions: TQueryFindOptions;
    }
  | {
      type: '_findById';
      query: { $key: IDBValidKey };
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
    }
  | {
      type: '_countDocuments';
      query: CountDocumentsSearchKey;
      execOptions: QueryCountDocumentsOptions;
    };

export interface IBaseQuery<ResultType, DocumentType = unknown> {
  openCursor(
    query: QueryRootFilter,
    options: QueryOpenCursorOptions
  ): IBaseQuery<ResultType>;
  find(
    query: QueryRootFilter,
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
  countDocuments(
    query: CountDocumentsSearchKey,
    options: QueryCountDocumentsOptions
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
