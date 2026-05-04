import type {
  SearchKey,
  QueryExecutorCommonOptions,
  QueryExecutorInsertOptions,
  QueryExecutorReplaceOneOptions,
  QueryExecutorUpdateManyOptions,
  QueryExecutorUpdateOneOptions,
  QueryExecutorDeleteManyOptions,
  QueryExecutorDeleteOneOptions,
  QueryExecutorFindByIdAndDeleteOptions,
  QueryExecutorFindByIdAndUpdateOptions,
  QueryExecutorCountDocumentsOptions,
  QueryRootFilter,
  QueryExecutorOpenCursorOptions,
  QueryExecutorUpdateManyUpdater,
  QueryExecutorFindOptions,
  QueryExecutorFindByIdOptions,
} from '../QueryExecutor/type';
import type MiddlewareExecutor from '../utils/MiddlewareExecutor';
import type { MiddlewareFn } from '../utils/MiddlewareStore';
import type { Prettify } from '../utils/type';

export interface QueryOptionsWithTransaction {
  transaction?: IDBTransaction;
}

export type QueryExecutorCommonKeys = keyof QueryExecutorCommonOptions;

export type QueryFunctionOptions<Options> = Prettify<
  QueryOptionsWithTransaction & Omit<Options, QueryExecutorCommonKeys>
>;

export type QueryOpenCursorOptions =
  QueryFunctionOptions<QueryExecutorOpenCursorOptions>;

export type QueryFindOptions = QueryFunctionOptions<QueryExecutorFindOptions>;

export type QueryFindByIdOptions =
  QueryFunctionOptions<QueryExecutorFindByIdOptions>;

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
      type: 'openCursor';
      query: QueryRootFilter;
      execOptions: QueryOpenCursorOptions;
    }
  | {
      type: 'find';
      query: Partial<QueryRootFilter>;
      execOptions: QueryFindOptions;
    }
  | {
      type: 'findById';
      query: { $key: IDBValidKey };
      execOptions: QueryFindByIdOptions;
    }
  | {
      type: 'insertOne';
      insertList: DocumentType[];
      execOptions: QueryInsertOneOptions;
    }
  | {
      type: 'insertMany';
      insertList: DocumentType[];
      execOptions: QueryInsertManyOptions;
    }
  | {
      type: 'replaceOne';
      payload: DocumentType;
      execOptions: QueryReplaceOneOptions;
    }
  | {
      type: 'updateMany';
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocumentType>;
      execOptions: QueryUpdateManyOptions;
    }
  | {
      type: 'updateOne';
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocumentType>;
      execOptions: QueryUpdateOneOptions;
    }
  | {
      type: 'deleteMany';
      query: QueryRootFilter;
      execOptions: QueryDeleteManyOptions;
    }
  | {
      type: 'deleteOne';
      query: QueryRootFilter;
      execOptions: QueryDeleteOneOptions;
    }
  | {
      type: 'findByIdAndDelete';
      id: IDBValidKey;
      execOptions: QueryFindByIdAndDeleteOptions;
    }
  | {
      type: 'findByIdAndUpdate';
      id: IDBValidKey;
      payload: QueryExecutorUpdateManyUpdater<DocumentType>;
      execOptions: QueryFindByIdAndUpdateOptions;
    }
  | {
      type: 'countDocuments';
      query: QueryRootFilter;
      execOptions: QueryCountDocumentsOptions;
    };

export interface IBaseQuery<ResultType, DocumentType> {
  openCursor(
    query: QueryRootFilter,
    options: QueryOpenCursorOptions
  ): IBaseQuery<ResultType, DocumentType>;
  find(
    query: QueryRootFilter,
    options?: QueryFindOptions
  ): IBaseQuery<ResultType, DocumentType>;
  findById(
    id: SearchKey,
    options?: QueryFindByIdOptions
  ): IBaseQuery<ResultType, DocumentType>;
  insertOne(
    payload: unknown,
    options?: QueryInsertOneOptions
  ): IBaseQuery<ResultType, DocumentType>;
  insertMany(
    payload: unknown[],
    options?: QueryInsertManyOptions
  ): IBaseQuery<ResultType, DocumentType>;
  replaceOne(
    payload: DocumentType,
    options: QueryReplaceOneOptions
  ): IBaseQuery<ResultType, DocumentType>;
  updateMany(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options: QueryUpdateManyOptions
  ): IBaseQuery<ResultType, DocumentType>;
  updateOne(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options: QueryUpdateOneOptions
  ): IBaseQuery<ResultType, DocumentType>;
  deleteMany(
    query: QueryRootFilter,
    options: QueryDeleteManyOptions
  ): IBaseQuery<ResultType, DocumentType>;
  deleteOne(
    query: QueryRootFilter,
    options: QueryDeleteOneOptions
  ): IBaseQuery<ResultType, DocumentType>;
  findByIdAndDelete(
    id: IDBValidKey,
    options: QueryFindByIdAndDeleteOptions
  ): IBaseQuery<ResultType, DocumentType>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: DocumentType) => DocumentType,
    options: QueryFindByIdAndUpdateOptions
  ): IBaseQuery<ResultType, DocumentType>;
  countDocuments(
    query: QueryRootFilter,
    options: QueryCountDocumentsOptions
  ): IBaseQuery<ResultType, DocumentType>;
}

export type QueryKeys = keyof IBaseQuery<unknown, unknown> & {};

export type QueryInternalKeys = keyof {
  [K in QueryKeys]: unknown;
};

export interface IQuery<ResultType, DocumentType> extends IBaseQuery<
  ResultType,
  DocumentType
> {
  idb: IDBDatabase;
  storeName: string;
  options: QueryOptions<DocumentType>;
  middleware: MiddlewareExecutor;
  populate(path: string): IQuery<ResultType, DocumentType>;
  index(idx: string): IQuery<ResultType, DocumentType>;
  pre(name: string, fn: MiddlewareFn): IQuery<ResultType, DocumentType>;
  post(name: string, fn: MiddlewareFn): IQuery<ResultType, DocumentType>;
  exec(): Promise<ResultType>;
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>;
}
