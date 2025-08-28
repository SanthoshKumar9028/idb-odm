type JSPrimitiveType =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | RegExp;

export type SearchKeyRequired = IDBValidKey | IDBKeyRange;

export interface QuerySelector {
  $eq?: JSPrimitiveType;
  $nq?: JSPrimitiveType;
  $gt?: Exclude<JSPrimitiveType, symbol | null | undefined>;
  $gte?: Exclude<JSPrimitiveType, symbol | null | undefined>;
  $lt?: Exclude<JSPrimitiveType, symbol | null | undefined>;
  $lte?: Exclude<JSPrimitiveType, symbol | null | undefined>;
  $not?: QuerySelector;
  $regex?: RegExp;
}

export interface QueryFilter {
  [key: string]: JSPrimitiveType | QuerySelector | any[];
}

export interface QueryRootSelector {
  $key?: SearchKey;
  $and?: QueryFilter[];
  $or?: QueryFilter[];
}

export type QueryRootFilter = QueryRootSelector & QueryFilter;

export type SearchKey = SearchKeyRequired | undefined | null;

export type CountDocumentsSearchKey = Exclude<SearchKey, null>;

export interface QueryExecutorCommonOptions {
  idb: IDBDatabase;
  storeName: string;
  transaction: IDBTransaction;
}

export interface QueryExecutorCommonOptionsThrownOnError
  extends QueryExecutorCommonOptions {
  throwOnError?: boolean;
}

export interface QueryExecutorOpenCursorOptions
  extends QueryExecutorCommonOptionsThrownOnError {}

export interface QueryExecutorInsertOptions
  extends QueryExecutorCommonOptionsThrownOnError {}

export interface InsertSuccess {
  status: 'success';
  event: Event;
}
export interface InsertError {
  status: 'error';
  event: Event;
}

export interface QueryExecutorInsertManyResponse {
  result: Array<InsertSuccess | InsertError>;
}

export interface QueryExecutorInsertOneResponse {
  result: InsertSuccess | InsertError;
}

export interface QueryExecutorReplaceOneQuery {
  $key: IDBValidKey;
}

export interface QueryExecutorReplaceOneOptions
  extends QueryExecutorCommonOptions {
  objectStore?: IDBObjectStore;
}

export interface QueryExecutorUpdateQuery {
  $key?: SearchKey;
}

export interface QueryExecutorUpdateManyOptions
  extends QueryExecutorCommonOptionsThrownOnError {
  updateLimit?: number;
}

export interface QueryExecutorUpdateManyResponse {
  modifiedCount: number;
  matchedCount: number;
}

export interface QueryExecutorUpdateOneOptions
  extends QueryExecutorCommonOptionsThrownOnError {}

export interface QueryExecutorDeleteQuery extends QueryExecutorUpdateQuery {}

export interface QueryExecutorDeleteManyOptions
  extends QueryExecutorCommonOptionsThrownOnError {
  deleteLimit?: number;
}

export interface QueryExecutorDeleteOneOptions
  extends QueryExecutorCommonOptionsThrownOnError {}

export interface QueryExecutorDeleteManyResponse {
  deletedCount: number;
  matchedCount: number;
}

export interface QueryExecutorFindByIdAndDeleteOptions
  extends QueryExecutorCommonOptionsThrownOnError {}

export interface QueryExecutorFindByIdAndUpdateOptions
  extends QueryExecutorCommonOptionsThrownOnError {
  new?: boolean;
}

export interface QueryExecutorCountDocumentsOptions
  extends QueryExecutorCommonOptionsThrownOnError {}
