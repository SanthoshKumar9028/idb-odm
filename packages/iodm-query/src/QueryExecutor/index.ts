import type { BaseQueryExecutorCommonOptions, ISearchKey } from "./type"

export class BaseQueryExecutor {
    find<ResultType>(query: { $query: ISearchKey; }, options?: BaseQueryExecutorCommonOptions): Promise<ResultType> {
        return new Promise((res, rej) => {
            const { idb, storeNames, transaction } = options || {};
            if (!idb) {
                return rej(new Error('idb is requred'));
            }
            if (!storeNames) {
                return rej(new Error('store name is requred'));
            }
            let tnx = transaction;

            if (!tnx) {
                tnx = idb.transaction(storeNames);
            }

            const objectStore = tnx.objectStore(storeNames);

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

    findById<ResultType>(id: Exclude<ISearchKey, | null | undefined>, options?: BaseQueryExecutorCommonOptions): Promise<ResultType> {
        return new Promise((res, rej) => {
            const { idb, storeNames, transaction } = options || {};
            if (!idb) {
                return rej(new Error('idb is requred'));
            }
            if (!storeNames) {
                return rej(new Error('store name is requred'));
            }
            let tnx = transaction;

            if (!tnx) {
                tnx = idb.transaction(storeNames);
            }

            const objectStore = tnx.objectStore(storeNames);

            const getReq = objectStore.get(id);

            getReq.onsuccess = (event) => {
                let result = undefined as ResultType;

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
}