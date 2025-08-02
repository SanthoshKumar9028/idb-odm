import { describe, it, expect, vi, MockedFunction } from 'vitest';
import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import { Query } from './index';

vi.mock('../QueryExecutor/QueryExecutorFactory');

interface ITestUser {
  _id: string;
  name: string;
  age?: number;
}

describe('Query', () => {
  const mockIdb: any = {
    transaction: () => ({
      objectStore() {
        return {
          getAll() {
            const event = { onsuccess(...params: any[]) {} };
            setTimeout(
              () =>
                event.onsuccess({
                  target: { result: [{ name: 'test', age: 20 }] },
                }),
              0
            );
            return event;
          },
        };
      },
    }),
  };

  it('should throw error is one of the query operations is not called', async () => {
    await expect(new Query<ITestUser[]>(mockIdb, 'test')).rejects.toThrow(
      'operations must be called'
    );
  });

  describe('find', () => {
    it('should call queryExecutor find method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ find: () => [] }));

      const res = await new Query<ITestUser[]>(mockIdb, 'test').find();

      expect(res).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should validate arguments', async () => {
      const query = new Query<ITestUser[]>(mockIdb, 'test');

      await expect(query.findById('')).rejects.toThrow(
        'search key is required'
      );
    });

    it('should call queryExecutor findById method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ findById: () => ({ id: '123' }) }));

      const res = await new Query<ITestUser>(mockIdb, 'test').findById('123');

      expect(res).toEqual({ id: '123' });
    });
  });

  describe('insertOne', () => {
    it('should validate arguments', async () => {
      const query = new Query<ITestUser[]>(mockIdb, 'test');

      await expect(query.insertOne(null)).rejects.toThrow(
        'At least one document is required to perform insertOne operations'
      );
    });

    it('should call queryExecutor insertOne method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        insertOne: () => ({ status: 'success' }),
      }));

      const res = await new Query<ITestUser, ITestUser>(
        mockIdb,
        'test'
      ).insertOne({
        _id: '123',
        name: 'test',
      });

      expect(res).toEqual({ status: 'success' });
    });
  });

  describe('replaceOne', () => {
    it('should call queryExecutor replaceOne method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        replaceOne: () => '123',
      }));

      const res = await new Query<ITestUser, ITestUser>(
        mockIdb,
        'test'
      ).replaceOne({
        _id: '123',
        name: 'test',
      });

      expect(res).toEqual('123');
    });
  });
});
