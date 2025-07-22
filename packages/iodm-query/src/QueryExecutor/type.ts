export type ISearchKey = IDBValidKey | IDBKeyRange | undefined | null;

export interface BaseQueryExecutorCommonOptions { idb: IDBDatabase; storeNames: string; transaction?: IDBTransaction }