import type {
  SearchKey,
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

export type QueryExecutorCommonKeys = 'idb' | 'storeName' | 'transaction';

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

export type QueryOptions<DocType = unknown> =
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
      insertList: DocType[];
      execOptions: QueryInsertOneOptions;
    }
  | {
      type: 'insertMany';
      insertList: DocType[];
      execOptions: QueryInsertManyOptions;
    }
  | {
      type: 'replaceOne';
      payload: DocType;
      execOptions: QueryReplaceOneOptions;
    }
  | {
      type: 'updateMany';
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocType>;
      execOptions: QueryUpdateManyOptions;
    }
  | {
      type: 'updateOne';
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocType>;
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
      payload: QueryExecutorUpdateManyUpdater<DocType>;
      execOptions: QueryFindByIdAndUpdateOptions;
    }
  | {
      type: 'countDocuments';
      query: QueryRootFilter;
      execOptions: QueryCountDocumentsOptions;
    };

export interface IBaseQuery<ResultType, DocType> {
  openCursor(
    query: QueryRootFilter,
    options: QueryOpenCursorOptions
  ): IBaseQuery<ResultType, DocType>;
  find(
    query: QueryRootFilter,
    options?: QueryFindOptions
  ): IBaseQuery<ResultType, DocType>;
  findById(
    id: SearchKey,
    options?: QueryFindByIdOptions
  ): IBaseQuery<ResultType, DocType>;
  insertOne(
    payload: unknown,
    options?: QueryInsertOneOptions
  ): IBaseQuery<ResultType, DocType>;
  insertMany(
    payload: unknown[],
    options?: QueryInsertManyOptions
  ): IBaseQuery<ResultType, DocType>;
  replaceOne(
    payload: DocType,
    options: QueryReplaceOneOptions
  ): IBaseQuery<ResultType, DocType>;
  updateMany(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocType>,
    options: QueryUpdateManyOptions
  ): IBaseQuery<ResultType, DocType>;
  updateOne(
    query: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocType>,
    options: QueryUpdateOneOptions
  ): IBaseQuery<ResultType, DocType>;
  deleteMany(
    query: QueryRootFilter,
    options: QueryDeleteManyOptions
  ): IBaseQuery<ResultType, DocType>;
  deleteOne(
    query: QueryRootFilter,
    options: QueryDeleteOneOptions
  ): IBaseQuery<ResultType, DocType>;
  findByIdAndDelete(
    id: IDBValidKey,
    options: QueryFindByIdAndDeleteOptions
  ): IBaseQuery<ResultType, DocType>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: DocType) => DocType,
    options: QueryFindByIdAndUpdateOptions
  ): IBaseQuery<ResultType, DocType>;
  countDocuments(
    query: QueryRootFilter,
    options: QueryCountDocumentsOptions
  ): IBaseQuery<ResultType, DocType>;
}

export type QueryKeys = keyof IBaseQuery<unknown, unknown> & {};

export type QueryInternalKeys = keyof {
  [K in QueryKeys]: unknown;
};

export interface IQuery<ResultType, DocType> extends IBaseQuery<
  ResultType,
  DocType
> {
  idb: IDBDatabase;
  storeName: string;
  options: QueryOptions<DocType>;
  middleware: MiddlewareExecutor;
  populate(path: string): IQuery<ResultType, DocType>;
  index(idx: string): IQuery<ResultType, DocType>;
  pre(name: string, fn: MiddlewareFn): IQuery<ResultType, DocType>;
  post(name: string, fn: MiddlewareFn): IQuery<ResultType, DocType>;
  exec(): Promise<ResultType>;
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>;
}
