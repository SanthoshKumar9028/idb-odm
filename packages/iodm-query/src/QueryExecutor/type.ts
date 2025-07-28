export type ISearchKey = IDBValidKey | IDBKeyRange | undefined | null;

export interface QueryExecutorCommonOptions {
  idb: IDBDatabase;
  storeName: string;
  transaction: IDBTransaction;
}

export interface QueryExecutorInsertOptions extends QueryExecutorCommonOptions {
  throwOnError?: boolean;
}

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
