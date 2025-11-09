import { isFunction } from '../utils/type-guards';
import { applyUpdates, evalFilter } from './evals';
import type {
  QueryExecutorInsertOptions,
  InsertSuccess,
  InsertError,
  QueryExecutorInsertManyResponse,
  QueryExecutorReplaceOneOptions,
  QueryExecutorUpdateManyOptions,
  QueryExecutorUpdateOneOptions,
  QueryExecutorUpdateManyResponse,
  QueryExecutorDeleteManyOptions,
  QueryExecutorDeleteManyResponse,
  QueryExecutorDeleteOneOptions,
  QueryExecutorFindByIdAndDeleteOptions,
  QueryExecutorFindByIdAndUpdateOptions,
  QueryExecutorCountDocumentsOptions,
  QueryRootFilter,
  QueryExecutorOpenCursorOptions,
  QueryExecutorUpdateManyUpdater,
  QueryExecutorFindOptions,
  QueryExecutorFindByIdOptions,
} from './type';

export class BaseQueryExecutor {
  async openCursor<ResultType>(
    query: QueryRootFilter,
    options: QueryExecutorOpenCursorOptions
  ): Promise<ResultType> {
    const { storeName, transaction, throwOnError = true } = options;

    return {
      async *[Symbol.asyncIterator]() {
        const cursorReq = transaction
          .objectStore(storeName)
          .openCursor(query.$key);

        const initReq = () =>
          new Promise<IDBCursorWithValue | null>((res, rej) => {
            cursorReq.onsuccess = function () {
              res(this.result);
            };

            cursorReq.onerror = function (event) {
              if (throwOnError) {
                return rej(event);
              }

              event.preventDefault();
              res(null);
            };
          });

        let fetchReq = initReq();

        try {
          while (true) {
            const cursor = await fetchReq;

            if (cursor && cursor.value) {
              fetchReq = initReq();
              cursor.continue();

              if (evalFilter(query, cursor.value)) {
                yield cursor.value;
              }
            } else {
              break;
            }
          }
        } catch (error) {
          if (throwOnError) {
            throw error;
          }

          return { done: true };
        }
      },
    } as ResultType;
  }

  async find<ResultType>(
    query: QueryRootFilter,
    options: QueryExecutorFindOptions
  ): Promise<ResultType> {
    return new Promise((res, rej) => {
      const { storeName, transaction, Constructor } = options;

      const result: unknown[] = [];
      const cursorReq = transaction
        .objectStore(storeName)
        .openCursor(query.$key);

      cursorReq.onsuccess = async function () {
        const cursor = this.result;

        if (!cursor || !cursor.value) {
          res(result as ResultType);
          return;
        }

        if (evalFilter(query, cursor.value)) {
          const newDoc = cursor.value && Constructor
            ? await Constructor.preProcess(cursor.value, options)
            : cursor.value;

          result.push(Constructor ? new Constructor(newDoc) : newDoc);
        }

        cursor.continue();
      };
      cursorReq.onerror = (event) => {
        rej(event);
      };
    });
  }

  async findById<ResultType>(
    id: IDBValidKey,
    options: QueryExecutorFindByIdOptions
  ): Promise<ResultType> {
    return new Promise((res, rej) => {
      const { storeName, transaction, Constructor } = options;

      const objectStore = transaction.objectStore(storeName);

      const getReq = objectStore.get(id);

      getReq.onsuccess = (event) => {
        let result = null as ResultType;

        if (event.target && 'result' in event.target) {
          result = (
            event.target.result && Constructor
              ? new Constructor(event.target.result)
              : event.target.result
          ) as ResultType;
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
    payload: DocumentType,
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

  async updateMany<ResultType, DocumentType = unknown>(
    query: QueryRootFilter,
    updater: QueryExecutorUpdateManyUpdater<DocumentType>,
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

        if (!evalFilter(query, cursor.value)) {
          cursor.continue();
          return;
        }

        ++updateRes.matchedCount;

        try {
          const newDoc = isFunction(updater)
            ? updater(cursor.value)
            : applyUpdates(cursor.value, updater);

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

  async updateOne<ResultType, DocumentType = unknown>(
    query: QueryRootFilter,
    updater: QueryExecutorUpdateManyUpdater<DocumentType>,
    options: QueryExecutorUpdateOneOptions
  ): Promise<ResultType> {
    return this.updateMany(query, updater, {
      ...options,
      updateLimit: 1,
    });
  }

  async deleteMany<ResultType>(
    query: QueryRootFilter,
    options: QueryExecutorDeleteManyOptions
  ) {
    const { storeName, transaction, deleteLimit, throwOnError } = options;

    const deleteRes: QueryExecutorDeleteManyResponse = {
      deletedCount: 0,
      matchedCount: 0,
    };

    return new Promise<ResultType>((res, rej) => {
      const cursorReq = transaction
        .objectStore(storeName)
        .openCursor(query.$key);

      cursorReq.onsuccess = (event) => {
        if (
          !event.target ||
          !('result' in event.target) ||
          !event.target.result
        ) {
          res(deleteRes as ResultType);
          return;
        }

        const cursor = event.target.result as IDBCursorWithValue;

        if (!evalFilter(query, cursor.value)) {
          cursor.continue();
          return;
        }

        ++deleteRes.matchedCount;

        try {
          const deleteReq = cursor.delete();

          deleteReq.onsuccess = () => {
            ++deleteRes.deletedCount;

            if (deleteLimit !== deleteRes.deletedCount) {
              cursor.continue();
            } else {
              res(deleteRes as ResultType);
            }
          };

          deleteReq.onerror = (event) => {
            if (throwOnError) {
              return rej(event);
            }

            event.preventDefault();
            cursor.continue();
          };
        } catch (error) {
          if (throwOnError) {
            transaction.abort();
            return rej(error);
          }

          cursor.continue();
        }
      };

      cursorReq.onerror = (event) => {
        if (throwOnError) {
          return rej(event);
        }

        event.preventDefault();

        res(deleteRes as ResultType);
      };
    });
  }

  async deleteOne<ResultType>(
    query: QueryRootFilter,
    options: QueryExecutorDeleteOneOptions
  ) {
    return this.deleteMany<ResultType>(query, { ...options, deleteLimit: 1 });
  }

  async findByIdAndDelete<ResultType>(
    id: IDBValidKey,
    options: QueryExecutorFindByIdAndDeleteOptions
  ): Promise<ResultType> {
    const { storeName, transaction, throwOnError = true } = options;
    const objectStore = transaction.objectStore(storeName);

    return new Promise((res, rej) => {
      const getReq = objectStore.get(id);

      getReq.onsuccess = (event) => {
        let doc = undefined;

        if (event.target && 'result' in event.target) {
          doc = event.target.result;
        }

        if (!doc) {
          res(doc as ResultType);
          return;
        }

        try {
          const putReq = objectStore.delete(id);

          putReq.onsuccess = () => {
            res(doc as ResultType);
          };

          putReq.onerror = (event) => {
            if (throwOnError) {
              return rej(event);
            }

            event.preventDefault();

            res(undefined as ResultType);
          };
        } catch (error) {
          if (throwOnError) {
            transaction.abort();
            return rej(event);
          }

          res(undefined as ResultType);
        }
      };
      getReq.onerror = (event) => {
        if (throwOnError) {
          return rej(event);
        }

        event.preventDefault();

        res(undefined as ResultType);
      };
    });
  }

  async findByIdAndUpdate<ResultType, DocumentType = unknown>(
    id: IDBValidKey,
    payload: (param: DocumentType) => DocumentType,
    options: QueryExecutorFindByIdAndUpdateOptions
  ): Promise<ResultType> {
    const {
      storeName,
      transaction,
      throwOnError = true,
      new: returnNewDoc = true,
    } = options;
    const objectStore = transaction.objectStore(storeName);

    return new Promise((res, rej) => {
      const getReq = objectStore.get(id);

      getReq.onsuccess = (event) => {
        let doc = undefined;

        if (event.target && 'result' in event.target) {
          doc = event.target.result;
        }

        if (!doc) {
          res(doc as ResultType);
          return;
        }

        try {
          const updatedDoc = payload(doc as DocumentType);

          const newDoc = objectStore.keyPath
            ? { ...updatedDoc, [objectStore.keyPath.toString()]: id }
            : updatedDoc;

          const putReq = objectStore.put(newDoc);

          putReq.onsuccess = () => {
            if (returnNewDoc) {
              res(newDoc as unknown as ResultType);
            } else {
              res(doc as ResultType);
            }
          };

          putReq.onerror = (event) => {
            if (throwOnError) {
              return rej(event);
            }

            event.preventDefault();

            res(undefined as ResultType);
          };
        } catch (error) {
          if (throwOnError) {
            transaction.abort();
            return rej(event);
          }

          res(undefined as ResultType);
        }
      };
      getReq.onerror = (event) => {
        if (throwOnError) {
          return rej(event);
        }

        event.preventDefault();

        res(undefined as ResultType);
      };
    });
  }

  async countDocuments<ResultType>(
    query: QueryRootFilter,
    options: QueryExecutorCountDocumentsOptions
  ) {
    return new Promise<ResultType>((res, rej) => {
      const { storeName, transaction, throwOnError } = options;

      let count = 0;
      const cursorReq = transaction
        .objectStore(storeName)
        .openCursor(query.$key);

      cursorReq.onsuccess = function () {
        const cursor = this.result;

        if (!cursor || !cursor.value) {
          res(count as ResultType);
          return;
        }

        if (evalFilter(query, cursor.value)) {
          ++count;
        }

        cursor.continue();
      };
      cursorReq.onerror = (event) => {
        if (throwOnError) {
          rej(event);
        } else {
          event.preventDefault();
          res(undefined as ResultType);
        }
      };
    });
  }
}
