import type { BaseQueryExecutorCommonOptions } from "./type"

export class BaseQueryExecutor {
    find<ResultType>(query: { $query: any; }, options?: BaseQueryExecutorCommonOptions): Promise<ResultType> {
        return new Promise((res, rej) => {
            const { idb, objectStoreNames, transaction } = options || {};
            if (!idb) {
                return rej(new Error('idb is requred'));
            }
            if (!objectStoreNames) {
                return rej(new Error('store name is requred'));
            }
            let tnx = transaction;

            if (!tnx) {
                tnx = idb.transaction(objectStoreNames);
            }

            const objectStore = tnx.objectStore(objectStoreNames);

            const getReq = objectStore.getAll(query.$query);

            getReq.onsuccess = (event) => {
                let result = [] as ResultType;

                if ('result' in event) {
                    result = event.result as ResultType
                }
                res(result);
            }
            getReq.onerror = (event) => {
                rej(event);
            }
        })
    }
    findById<ResultType>(id: any, options?: BaseQueryExecutorCommonOptions): Promise<ResultType> {
        throw new Error("Method not implemented.");
    }
}