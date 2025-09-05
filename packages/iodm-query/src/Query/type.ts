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
  CountDocumentsSearchKey,
  QueryRootFilter,
  QueryExecutorOpenCursorOptions,
  QueryExecutorUpdateManyUpdater,
} from '../QueryExecutor/type';
import type { Prettify } from '../utils/type';

interface QueryOptionsWithTransaction {
  transaction?: IDBTransaction;
}

type QueryExecutorCommonKeys = keyof QueryExecutorCommonOptions;

type QueryFunctionOptions<Options> = Prettify<
  QueryOptionsWithTransaction & Omit<Options, QueryExecutorCommonKeys>
>;

export type QueryOpenCursorOptions =
  QueryFunctionOptions<QueryExecutorOpenCursorOptions>;

export type QueryFindOptions = QueryOptionsWithTransaction;

export type QueryFindByIdOptions = QueryOptionsWithTransaction;

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
      execOptions: QueryFindOptions;
    }
  | {
      type: '_findById';
      query: { $key: IDBValidKey };
      execOptions: QueryFindByIdOptions;
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
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocumentType>;
      execOptions: QueryUpdateManyOptions;
    }
  | {
      type: '_updateOne';
      query: QueryRootFilter;
      payload: QueryExecutorUpdateManyUpdater<DocumentType>;
      execOptions: QueryUpdateOneOptions;
    }
  | {
      type: '_deleteMany';
      query: QueryRootFilter;
      execOptions: QueryDeleteManyOptions;
    }
  | {
      type: '_deleteOne';
      query: QueryRootFilter;
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
    query: CountDocumentsSearchKey,
    options: QueryCountDocumentsOptions
  ): IBaseQuery<ResultType, DocumentType>;
}

export type QueryKeys = keyof IBaseQuery<unknown, unknown> & {};

export type QueryInternalKeys = keyof {
  [K in QueryKeys as `_${K}`]: unknown;
};

export interface IQuery<ResultType, DocumentType>
  extends IBaseQuery<ResultType, DocumentType> {
  exec(): Promise<ResultType>;
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>;
}
