import type {
  QueryExecutorCommonOptions,
  QueryExecutorInsertOptions,
  ISearchKey,
  InsertSuccess,
  InsertError,
  QueryExecutorInsertManyResponse,
} from './type';

export class BaseQueryExecutor {
  find<ResultType>(
    query: { $query: ISearchKey },
    options: QueryExecutorCommonOptions
  ): Promise<ResultType> {
    return new Promise((res, rej) => {
      const { storeName, transaction } = options;

      const objectStore = transaction.objectStore(storeName);

      const getReq = objectStore.getAll(query.$query);

      getReq.onsuccess = (event) => {
        let result = [] as ResultType;

        if (event.target && 'result' in event.target) {
          result = event.target.result as ResultType;
        }
        res(result);
      };
      getReq.onerror = (event) => {
        rej(event);
      };
    });
  }

  findById<ResultType>(
    id: Exclude<ISearchKey, null | undefined>,
    options: QueryExecutorCommonOptions
  ): Promise<ResultType> {
    return new Promise((res, rej) => {
      const { storeName, transaction } = options;

      const objectStore = transaction.objectStore(storeName);

      const getReq = objectStore.get(id);

      getReq.onsuccess = (event) => {
        let result = undefined as ResultType;

        if (event.target && 'result' in event.target) {
          result = event.target.result as ResultType;
        }

        res(result);
      };
      getReq.onerror = (event) => {
        rej(event);
      };
    });
  }

  async insertMany<ResultType>(
    payload: unknown[],
    options: QueryExecutorInsertOptions
  ): Promise<ResultType> {
    const { storeName, transaction, throwOnError } = options;

    const objectStore = transaction.objectStore(storeName);
    const insertRes: QueryExecutorInsertManyResponse = {
      result: [],
    };

    for (let i = 0; i < payload.length; ++i) {
      const addRes = await new Promise<InsertSuccess | InsertError>(
        (res, rej) => {
          const addReq = objectStore.add(payload[i]);

          addReq.onsuccess = (event) => {
            res({ status: 'success', event });
          };
          addReq.onerror = (event) => {
            if (throwOnError) { rej(event); }
            else {
              event.preventDefault();
              res({ status: 'error', event });
            }
          };
        }
      );

      insertRes.result.push(addRes);
    }

    return insertRes as ResultType;
  }

  async insertOne<ResultType>(
    payload: unknown,
    options: QueryExecutorInsertOptions
  ): Promise<ResultType> {
    const insertRes = await this.insertMany<QueryExecutorInsertManyResponse>(
      [payload],
      options
    );

    return { result: insertRes.result[0] } as ResultType;
  }
}
