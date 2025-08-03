import type {
  QueryExecutorCommonOptions,
  QueryExecutorInsertOptions,
  ISearchKey,
  InsertSuccess,
  InsertError,
  QueryExecutorInsertManyResponse,
  QueryExecutorReplaceOneOptions,
  QueryExecutorUpdateManyOptions,
  QueryExecutorUpdateOneOptions,
  UpdateQuery,
  QueryExecutorUpdateManyResponse,
} from './type';

export class BaseQueryExecutor {
  find<ResultType>(
    query: { $key: ISearchKey },
    options: QueryExecutorCommonOptions
  ): Promise<ResultType> {
    return new Promise((res, rej) => {
      const { storeName, transaction } = options;

      const objectStore = transaction.objectStore(storeName);

      const getReq = objectStore.getAll(query.$key);

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
            if (throwOnError) {
              rej(event);
            } else {
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

  async replaceOne<ResultType, DocumentType = unknown>(
    payload: DocumentType & { _id: string | number },
    options: QueryExecutorReplaceOneOptions
  ): Promise<ResultType> {
    const { storeName, transaction } = options;

    return new Promise((res, rej) => {
      let objectStore = options.objectStore;

      if (!objectStore) {
        objectStore = transaction.objectStore(storeName);
      }

      const getReq = objectStore.put(payload);

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

  private isFunction(param: unknown): param is Function {
    return typeof param === 'function';
  }

  async updateMany<ResultType, DocumentType = unknown>(
    query: UpdateQuery,
    payload: (param: DocumentType) => DocumentType,
    options: QueryExecutorUpdateManyOptions
  ): Promise<ResultType> {
    const { storeName, transaction, updateLimit, throwOnError } = options;

    const updateRes: QueryExecutorUpdateManyResponse = {
      modifiedCount: 0,
      matchedCount: 0,
    };

    return new Promise((res, rej) => {
      const cursorReq = transaction
        .objectStore(storeName)
        .openCursor(query.$key);

      cursorReq.onsuccess = (event) => {
        if (
          !event.target ||
          !('result' in event.target) ||
          !event.target.result
        ) {
          res(updateRes as ResultType);
          return;
        }

        const cursor = event.target.result as IDBCursorWithValue;

        ++updateRes.matchedCount;

        try {
          const newDoc = this.isFunction(payload)
            ? payload(cursor.value)
            : payload;

          const updateReq = cursor.update(newDoc);

          updateReq.onsuccess = () => {
            ++updateRes.modifiedCount;

            if (updateLimit !== updateRes.modifiedCount) {
              cursor.continue();
            } else {
              res(updateRes as ResultType);
            }
          };

          updateReq.onerror = (event) => {
            if (throwOnError) {
              rej(event);
            } else {
              event.preventDefault();
              cursor.continue();
            }
          };
        } catch (error) {
          if (throwOnError) {
            transaction.abort();
            rej(error);
          } else {
            cursor.continue();
          }
        }
      };

      cursorReq.onerror = (event) => {
        if (throwOnError) {
          return rej(event);
        }

        event.preventDefault();

        res(updateRes as ResultType);
      };
    });
  }

  async updateOne<ResultType, DocumentType>(
    query: UpdateQuery,
    payload: DocumentType | ((param: DocumentType) => DocumentType),
    options: QueryExecutorUpdateOneOptions
  ): Promise<ResultType> {
    return this.updateMany(
      query,
      this.isFunction(payload) ? payload : () => payload,
      {
        ...options,
        updateLimit: 1,
      }
    );
  }
}
