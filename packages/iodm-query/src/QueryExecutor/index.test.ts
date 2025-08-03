import { describe, it, expect, vi, afterEach } from 'vitest';
import { BaseQueryExecutor } from '.';
import {
  QueryExecutorInsertManyResponse,
  QueryExecutorInsertOneResponse,
  QueryExecutorReplaceOneOptions,
} from './type';

describe('BaseQueryExecutor', () => {
  const queryExecutor = new BaseQueryExecutor();

  describe('find', () => {
    const mockGetAll = vi.fn();

    const transaction: any = {
      objectStore() {
        return {
          getAll: mockGetAll,
        };
      },
    };

    const mockIdb: any = {
      transaction,
    };

    it('should return array', async () => {
      mockGetAll.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () => event.onsuccess({ target: { result: [{ one: 1 }] } }),
          0
        );
        return event;
      });

      const data = await queryExecutor.find(
        { $key: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ one: 1 }]);
    });

    it('should handle error', async () => {
      mockGetAll.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror(new Event('error')), 0);
        return event;
      });

      const data = queryExecutor.find(
        { $key: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      await expect(data).rejects.toThrowError(Event);
    });
  });

  describe('findById', () => {
    const transaction: any = {
      objectStore() {
        return {
          get() {
            const event = { onsuccess(...params: any[]) {} };
            setTimeout(
              () => event.onsuccess({ target: { result: { one: 1 } } }),
              0
            );
            return event;
          },
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should return value', async () => {
      const data = await queryExecutor.findById('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });
      expect(data).toEqual({ one: 1 });
    });
  });

  describe('insertMany', () => {
    const transaction: any = {
      objectStore() {
        return {
          add: vi
            .fn()
            .mockImplementationOnce(() => {
              const event = { onsuccess(...params: any[]) {} };
              setTimeout(() => event.onsuccess({}), 0);
              return event;
            })
            .mockImplementation(() => {
              const event = { onerror(...params: any[]) {} };
              setTimeout(() => event.onerror({ preventDefault() {} }), 0);
              return event;
            }),
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should return both success and error response', async () => {
      const insertRes =
        await queryExecutor.insertMany<QueryExecutorInsertManyResponse>(
          [{ one: 1 }, { two: 2 }],
          {
            idb: mockIdb,
            storeName: 'test',
            transaction,
          }
        );

      expect(insertRes.result[0].status).toBe('success');
      expect(insertRes.result[1].status).toBe('error');
    });

    it('should error', async () => {
      const insertPromise =
        queryExecutor.insertMany<QueryExecutorInsertManyResponse>(
          [{ one: 1 }, { two: 2 }],
          {
            idb: mockIdb,
            storeName: 'test',
            transaction,
            throwOnError: true,
          }
        );

      await expect(insertPromise).rejects.toThrow();
    });
  });

  describe('insertOne', () => {
    const mockAdd = vi
      .fn()
      .mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      })
      .mockImplementation(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault() {} }), 0);
        return event;
      });

    const transaction: any = {
      objectStore() {
        return {
          add: mockAdd,
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should return both success and error response', async () => {
      const insertRes =
        await queryExecutor.insertOne<QueryExecutorInsertOneResponse>(
          { one: 1 },
          {
            idb: mockIdb,
            storeName: 'test',
            transaction,
          }
        );

      expect(insertRes.result.status).toBe('success');
    });

    it('should error', async () => {
      const insertPromise2 =
        queryExecutor.insertOne<QueryExecutorInsertOneResponse>(
          { one: 1 },
          {
            idb: mockIdb,
            storeName: 'test',
            transaction,
            throwOnError: true,
          }
        );

      await expect(insertPromise2).rejects.toThrow();
    });
  });

  describe('replaceOne', () => {
    const mockPut = vi
      .fn()
      .mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({ target: { result: '123' } }), 0);
        return event;
      })
      .mockImplementation(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror(new Event('Error')), 0);
        return event;
      });

    const transaction: any = {
      objectStore() {
        return {
          put: mockPut,
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should call put method', async () => {
      const replaceRes1 = await queryExecutor.replaceOne<
        string | undefined,
        { test: string }
      >(
        {
          _id: '123',
          test: 'value',
        },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      expect(replaceRes1).toBe('123');

      const replaceRes2 = queryExecutor.replaceOne<
        string | undefined,
        { test: string }
      >(
        {
          _id: '123',
          test: 'value',
        },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      await expect(replaceRes2).rejects.toThrowError(Event);
    });
  });

  describe('updateMany', () => {
    const mockUpdate = vi.fn().mockImplementation(() => {
      const event = { onsuccess(...params: any[]) {} };
      setTimeout(() => event.onsuccess({}), 0);
      return event;
    });

    afterEach(() => mockUpdate.mockClear());

    const mockOpenCursor = vi.fn();

    const transaction: any = {
      objectStore() {
        return {
          openCursor: mockOpenCursor,
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should return response if initial cursor is not present', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({ target: { result: undefined } }), 0);
        return event;
      });

      const updateRes = await queryExecutor.updateMany<unknown>(
        { $key: '123' },
        () => ({ test: '123' }),
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(updateRes).toEqual({ modifiedCount: 0, matchedCount: 0 });
    });

    it('should update with payload', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () => event.onsuccess({ target: { result: { update: mockUpdate } } }),
          0
        );
        return event;
      });

      const updateRes = await queryExecutor.updateMany<unknown>(
        { $key: '123' },
        () => ({ test: '123' }),
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123' });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });

    it('should update with function payload', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () =>
            event.onsuccess({
              target: {
                result: { value: { test: '123' }, update: mockUpdate },
              },
            }),
          0
        );
        return event;
      });

      const updateRes = await queryExecutor.updateMany<any, any>(
        { $key: '123' },
        (doc) => ({ ...doc, desc: 'test' }),
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123', desc: 'test' });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });

    it('should handle error', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror(new Event('Error')), 0);
        return event;
      });

      const updateRes1 = queryExecutor.updateMany<unknown>(
        { $key: '123' },
        () => ({ test: '123' }),
        {
          idb: mockIdb,
          storeName: 'test',
          transaction,
          updateLimit: 1,
          throwOnError: true,
        }
      );
      await expect(updateRes1).rejects.toThrowError(Event);
    });
  });
});
