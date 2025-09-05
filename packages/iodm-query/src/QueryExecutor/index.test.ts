import { describe, it, expect, vi, afterEach } from 'vitest';
import { BaseQueryExecutor } from '.';
import {
  QueryExecutorInsertManyResponse,
  QueryExecutorInsertOneResponse,
} from './type';

describe('BaseQueryExecutor', () => {
  const queryExecutor = new BaseQueryExecutor();

  describe('openCursor', () => {
    const mockOpenCursor = vi.fn();
    const testDocs = [
      { value: 1, status: 'one' },
      { value: 2, status: 'two' },
      { value: 3, status: 'three' },
    ];

    mockOpenCursor.mockImplementation(() => {
      let i = 0;
      const event: any = {};

      const reuc = () => {
        event.result = {
          value: testDocs[i++],
          continue() {
            reuc();
          },
        };
        event.onsuccess({});
      };

      setTimeout(reuc, 0);
      return event;
    });

    const transaction: any = {
      objectStore() {
        return {
          openCursor: mockOpenCursor,
        };
      },
    };

    afterEach(() => mockOpenCursor.mockClear());

    const mockIdb: any = {
      transaction,
    };

    it('should work with for await of loop', async () => {
      const itr = await queryExecutor.openCursor<any>(
        {},
        {
          idb: mockIdb,
          storeName: 'test',
          transaction,
        }
      );

      const openCursorDocs: any[] = [];
      for await (const doc of itr) {
        openCursorDocs.push(doc);
      }

      expect(openCursorDocs).toEqual(testDocs);
    });

    it('should handle error', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror(new Event('error')), 0);
        return event;
      });

      const itr = await queryExecutor.openCursor<any>(
        { $key: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      await expect(() =>
        itr[Symbol.asyncIterator]().next()
      ).rejects.toThrowError(Event);
    });
  });

  describe('find', () => {
    const mockOpenCursor = vi.fn();
    const testDocs = [
      { value: 1, status: 'one' },
      { value: 2, status: 'two' },
      { value: 3, status: 'three' },
    ];

    mockOpenCursor.mockImplementation(() => {
      let i = 0;
      const event: any = {};

      const reuc = () => {
        event.result = {
          value: testDocs[i++],
          continue() {
            reuc();
          },
        };
        event.onsuccess({});
      };

      setTimeout(reuc, 0);
      return event;
    });

    const transaction: any = {
      objectStore() {
        return {
          openCursor: mockOpenCursor,
        };
      },
    };

    afterEach(() => mockOpenCursor.mockClear());

    const mockIdb: any = {
      transaction,
    };

    it('should return array', async () => {
      const data = await queryExecutor.find(
        { $key: '' },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual(testDocs);
    });

    it('should work with $and operator', async () => {
      const data = await queryExecutor.find(
        { $and: [{ value: { $gte: 2 } }, { value: { $lte: 2 } }] },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ value: 2, status: 'two' }]);
    });

    it('should work with $or operator', async () => {
      const data = await queryExecutor.find(
        { $or: [{ value: 1 }, { value: { $eq: 2 } }] },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([
        { value: 1, status: 'one' },
        { value: 2, status: 'two' },
      ]);
    });

    it('should work with equality operator', async () => {
      const data = await queryExecutor.find(
        { value: { $eq: 1, $nq: 2 } },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ value: 1, status: 'one' }]);
    });

    it('should work with logical operator', async () => {
      const data = await queryExecutor.find(
        { value: { $gt: 1, $gte: 1, $lt: 3, $lte: 3 } },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ value: 2, status: 'two' }]);
    });

    it('should work with regular expression', async () => {
      const data = await queryExecutor.find(
        { status: /two/i },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([{ value: 2, status: 'two' }]);
    });

    it('should work with $not operator', async () => {
      const data = await queryExecutor.find(
        { value: { $not: { $eq: 2 } } },
        { idb: mockIdb, storeName: 'test', transaction }
      );
      expect(data).toEqual([
        { value: 1, status: 'one' },
        { value: 3, status: 'three' },
      ]);
    });

    it('should handle error', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
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
        { _id: string; test: string }
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
        { _id: string; test: string }
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

    it('should update with $set operator', async () => {
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
        { $set: { desc: 'test' } },
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123', desc: 'test' });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });

    it('should update with $unset operator', async () => {
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
        { $unset: { desc: '' } },
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123' });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });

    it('should update with $push operator', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () =>
            event.onsuccess({
              target: {
                result: {
                  value: { test: '123', skills: [] },
                  update: mockUpdate,
                },
              },
            }),
          0
        );
        return event;
      });

      const updateRes = await queryExecutor.updateMany<any, any>(
        { $key: '123' },
        { $push: { skills: 1 } },
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123', skills: [1] });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });

    it('should update with $pop operator', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () =>
            event.onsuccess({
              target: {
                result: {
                  value: { test: '123', skills: [1] },
                  update: mockUpdate,
                },
              },
            }),
          0
        );
        return event;
      });

      const updateRes = await queryExecutor.updateMany<any, any>(
        { $key: '123' },
        { $pop: { skills: 1 } },
        { idb: mockIdb, storeName: 'test', transaction, updateLimit: 1 }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123', skills: [] });
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

  describe('updateOne', () => {
    const mockUpdate = vi.fn().mockImplementation(() => {
      const event = { onsuccess(...params: any[]) {} };
      setTimeout(() => event.onsuccess({}), 0);
      return event;
    });

    const mockOpenCursor = vi.fn();

    const transaction: any = {
      objectStore() {
        return {
          openCursor: mockOpenCursor,
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should update with payload', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () => event.onsuccess({ target: { result: { update: mockUpdate } } }),
          0
        );
        return event;
      });

      const updateRes = await queryExecutor.updateOne<unknown>(
        { $key: '123' },
        () => ({ test: '123' }),
        { idb: mockIdb, storeName: 'test', transaction }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ test: '123' });
      expect(updateRes).toEqual({ modifiedCount: 1, matchedCount: 1 });
    });
  });

  describe('deleteMany', () => {
    const mockDelete = vi.fn().mockImplementation(() => {
      const event = { onsuccess(...params: any[]) {} };
      setTimeout(() => event.onsuccess({}), 0);
      return event;
    });

    afterEach(() => mockDelete.mockClear());

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

      const deleteRes = await queryExecutor.deleteMany(
        { $key: '123' },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      expect(mockDelete).toHaveBeenCalledTimes(0);
      expect(deleteRes).toEqual({ deletedCount: 0, matchedCount: 0 });
    });

    it('should call delete method 2 times', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        const continueFunc = () =>
          event.onsuccess({
            target: { result: { delete: mockDelete, continue: continueFunc } },
          });
        setTimeout(continueFunc, 0);
        return event;
      });

      const deleteRes = await queryExecutor.deleteMany(
        { $key: '123' },
        { idb: mockIdb, storeName: 'test', transaction, deleteLimit: 2 }
      );

      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(deleteRes).toEqual({ deletedCount: 2, matchedCount: 2 });
    });

    it('should handle error', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(
          () =>
            event.onerror({
              target: { result: { delete: mockDelete } },
              preventDefault: () => {},
            }),
          0
        );
        return event;
      });

      const deleteRes = await queryExecutor.deleteMany(
        { $key: '123' },
        { idb: mockIdb, storeName: 'test', transaction, deleteLimit: 1 }
      );

      expect(mockDelete).toHaveBeenCalledTimes(0);
      expect(deleteRes).toEqual({ deletedCount: 0, matchedCount: 0 });
    });

    it('should throw error if throwOnError option is true', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(
          () =>
            event.onerror({
              target: { result: { delete: mockDelete } },
              preventDefault: () => {},
            }),
          0
        );
        return event;
      });

      const deletePromise = queryExecutor.deleteMany(
        { $key: '123' },
        {
          idb: mockIdb,
          storeName: 'test',
          transaction,
          deleteLimit: 1,
          throwOnError: true,
        }
      );

      await expect(deletePromise).rejects.toThrowError();
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });
  });

  describe('deleteOne', () => {
    const mockDelete = vi.fn().mockImplementation(() => {
      const event = { onsuccess(...params: any[]) {} };
      setTimeout(() => event.onsuccess({}), 0);
      return event;
    });

    const mockOpenCursor = vi.fn();

    const transaction: any = {
      objectStore() {
        return {
          openCursor: mockOpenCursor,
        };
      },
    };
    const mockIdb: any = { transaction };

    it('should call delete', async () => {
      mockOpenCursor.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () => event.onsuccess({ target: { result: { delete: mockDelete } } }),
          0
        );
        return event;
      });

      const deleteRes = await queryExecutor.deleteOne<unknown>(
        { $key: '123' },
        { idb: mockIdb, storeName: 'test', transaction }
      );

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(deleteRes).toEqual({ deletedCount: 1, matchedCount: 1 });
    });
  });

  describe('findByIdAndDelete', () => {
    const mockGet = vi.fn();
    const mockDelete = vi.fn();

    afterEach(() => {
      mockGet.mockClear();
      mockDelete.mockClear();
    });

    const transaction: any = {
      objectStore() {
        return {
          get: mockGet,
          delete: mockDelete,
        };
      },
    };

    const mockIdb: any = { transaction };

    it('should return undefined if document not found', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndDelete('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      expect(doc).toBe(undefined);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });

    it('should call delete if document found', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () =>
            event.onsuccess({
              target: { result: { _id: '123', name: 'test' } },
            }),
          0
        );
        return event;
      });

      mockDelete.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndDelete('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      expect(doc).toEqual({ _id: '123', name: 'test' });
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('should throw if error occurs', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault: () => {} }), 0);
        return event;
      });

      const docPromise = queryExecutor.findByIdAndDelete('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      await expect(docPromise).rejects.toThrowError();
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });

    it('should return undefined if error occured and throwOnError is false', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault: () => {} }), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndDelete('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
        throwOnError: false,
      });

      expect(doc).toBe(undefined);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });
  });

  describe('findByIdAndUpdate', () => {
    const mockGet = vi.fn();
    const mockPut = vi.fn();

    afterEach(() => {
      mockGet.mockClear();
      mockPut.mockClear();
    });

    const transaction: any = {
      objectStore() {
        return {
          get: mockGet,
          put: mockPut,
        };
      },
    };

    const mockIdb: any = { transaction };

    it('should return undefined if document not found', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndUpdate('123', (doc) => doc, {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      expect(doc).toBe(undefined);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledTimes(0);
    });

    it('should call update if document found', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(
          () => event.onsuccess({ target: { result: { _id: '123' } } }),
          0
        );
        return event;
      });

      mockPut.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {} };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndUpdate<any, { _id: string }>(
        '123',
        (doc) => ({ ...doc, name: 'test' }),
        {
          idb: mockIdb,
          storeName: 'test',
          transaction,
        }
      );

      expect(doc).toEqual({ _id: '123', name: 'test' });
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledTimes(1);
    });

    it('should throw if error occurs', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({}), 0);
        return event;
      });

      const updatePromise = queryExecutor.findByIdAndUpdate(
        '123',
        (doc) => doc,
        {
          idb: mockIdb,
          storeName: 'test',
          transaction,
        }
      );

      await expect(updatePromise).rejects.toThrowError();
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledTimes(0);
    });

    it('should return undefined if error occured and throwOnError is false', async () => {
      mockGet.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault: () => {} }), 0);
        return event;
      });

      const doc = await queryExecutor.findByIdAndUpdate('123', (doc) => doc, {
        idb: mockIdb,
        storeName: 'test',
        transaction,
        throwOnError: false,
      });

      expect(doc).toBe(undefined);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledTimes(0);
    });
  });

  describe('countDocuments', () => {
    const mockCount = vi.fn();

    afterEach(() => {
      mockCount.mockClear();
    });

    const transaction: any = {
      objectStore() {
        return {
          count: mockCount,
        };
      },
    };

    const mockIdb: any = { transaction };

    it('should return document counts', async () => {
      mockCount.mockImplementationOnce(() => {
        const event = { onsuccess(...params: any[]) {}, result: 10 };
        setTimeout(() => event.onsuccess({}), 0);
        return event;
      });

      const count = await queryExecutor.countDocuments('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      expect(count).toBe(10);
      expect(mockCount).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if error occurs', async () => {
      mockCount.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault: () => {} }), 0);
        return event;
      });

      const count = await queryExecutor.countDocuments('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
      });

      expect(count).toBe(undefined);
      expect(mockCount).toHaveBeenCalledTimes(1);
    });

    it('should throw error if throwOnError option is true', async () => {
      mockCount.mockImplementationOnce(() => {
        const event = { onerror(...params: any[]) {} };
        setTimeout(() => event.onerror({ preventDefault: () => {} }), 0);
        return event;
      });

      const countPromise = queryExecutor.countDocuments('123', {
        idb: mockIdb,
        storeName: 'test',
        transaction,
        throwOnError: true,
      });

      await expect(countPromise).rejects.toThrowError();
      expect(mockCount).toHaveBeenCalledTimes(1);
    });
  });
});
