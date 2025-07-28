import { describe, it, expect, vi } from 'vitest';
import { BaseQueryExecutor } from '.';
import {
  QueryExecutorInsertManyResponse,
  QueryExecutorInsertOneResponse,
} from './type';

describe('BaseQueryExecutor', () => {
  const queryExecutor = new BaseQueryExecutor();

  const transaction: any = {
    objectStore() {
      return {
        getAll() {
          const event = { onsuccess(...params: any[]) {} };
          setTimeout(
            () => event.onsuccess({ target: { result: [{ one: 1 }] } }),
            0
          );
          return event;
        },
      };
    },
  };
  const mockIdb: any = {
    transaction,
  };

  describe('find', () => {
    it('should return array', async () => {
      const data = await queryExecutor.find(
        { $query: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ one: 1 }]);
    });
  });

  describe('findById', () => {
    const transaction: any = {
      objectStore() {
        return {
          getAll() {
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
      const data = await queryExecutor.find(
        { $query: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );
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

      expect(() => insertPromise).rejects.toThrow();
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

      expect(() => insertPromise2).rejects.toThrow();
    });
  });
});
