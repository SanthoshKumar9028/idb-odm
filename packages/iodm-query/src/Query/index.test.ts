import { describe, it, expect, vi, afterEach, MockedFunction } from 'vitest';
import { QueryExecutorFactory } from '../QueryExecutor/QueryExecutorFactory';
import { Query } from './index';
import { QueryExecutorUpdateManyResponse } from '../QueryExecutor/type';

vi.mock('../QueryExecutor/QueryExecutorFactory');

interface ITestUser {
  _id: string;
  name: string;
  age?: number;
}

describe('Query', () => {
  const mockTransaction = vi.fn().mockImplementation(() => ({
    objectStore() {
      return {};
    },
  }));

  afterEach(() => mockTransaction.mockClear());

  const mockIdb: any = {
    transaction: mockTransaction,
  };

  it('should throw error is one of the query operations is not called', async () => {
    await expect(new Query<ITestUser[]>(mockIdb, 'test')).rejects.toThrow(
      'operations must be called'
    );
  });

  describe('openCursor', () => {
    it('should call queryExecutor openCursor method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ openCursor: () => ({}) }));

      const res = await new Query<any>(mockIdb, 'test').openCursor();

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ openCursor: () => ({}) }));

      await new Query<any>(mockIdb, 'test').openCursor(
        {},
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('find', () => {
    it('should call queryExecutor find method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ find: () => [] }));

      const res = await new Query<ITestUser[]>(mockIdb, 'test').find();

      expect(res).toEqual([]);
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ find: () => [] }));

      await new Query<ITestUser[]>(mockIdb, 'test').find(
        {},
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
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

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({ findById: () => ({ id: '123' }) }));

      await new Query<ITestUser>(mockIdb, 'test').findById('123', {
        transaction: {} as IDBTransaction,
      });

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('insertMany', () => {
    it('should call queryExecutor insertMany method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        insertMany: () => [{ status: 'success' }],
      }));

      const res = await new Query<ITestUser, ITestUser>(
        mockIdb,
        'test'
      ).insertMany([
        {
          _id: '123',
          name: 'test',
        },
      ]);

      expect(res).toEqual([{ status: 'success' }]);
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        insertMany: () => ({ status: 'success' }),
      }));

      await new Query<ITestUser, ITestUser>(mockIdb, 'test').insertMany(
        [
          {
            _id: '123',
            name: 'test',
          },
        ],
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
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

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        insertOne: () => ({ status: 'success' }),
      }));

      await new Query<ITestUser, ITestUser>(mockIdb, 'test').insertOne(
        {
          _id: '123',
          name: 'test',
        },
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
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

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        replaceOne: () => '123',
      }));

      await new Query<ITestUser, ITestUser>(mockIdb, 'test').replaceOne(
        {
          _id: '123',
          name: 'test',
        },
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('updateMany', () => {
    it('should call queryExecutor updateMany method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        updateMany: () => ({}),
      }));

      const res = await new Query<QueryExecutorUpdateManyResponse, ITestUser>(
        mockIdb,
        'test'
      ).updateMany({ $key: '123' }, () => ({
        _id: '123',
        name: 'test',
      }));

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        updateMany: () => ({}),
      }));

      await new Query<QueryExecutorUpdateManyResponse, ITestUser>(
        mockIdb,
        'test'
      ).updateMany(
        { $key: '123' },
        () => ({
          _id: '123',
          name: 'test',
        }),
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('updateOne', () => {
    it('should call queryExecutor updateOne method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        updateOne: () => ({}),
      }));

      const res = await new Query<QueryExecutorUpdateManyResponse, ITestUser>(
        mockIdb,
        'test'
      ).updateOne({ $key: '123' }, () => ({
        _id: '123',
        name: 'test',
      }));

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        updateOne: () => ({}),
      }));

      await new Query<QueryExecutorUpdateManyResponse, ITestUser>(
        mockIdb,
        'test'
      ).updateOne(
        { $key: '123' },
        () => ({
          _id: '123',
          name: 'test',
        }),
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('deleteMany', () => {
    it('should call queryExecutor deleteMany method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        deleteMany: () => ({}),
      }));

      const res = await new Query(mockIdb, 'test').deleteMany({ $key: '123' });

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        deleteMany: () => ({}),
      }));

      await new Query(mockIdb, 'test').deleteMany(
        { $key: '123' },
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('deleteOne', () => {
    it('should call queryExecutor deleteOne method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        deleteOne: () => ({}),
      }));

      const res = await new Query(mockIdb, 'test').deleteOne({ $key: '123' });

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        deleteOne: () => ({}),
      }));

      await new Query(mockIdb, 'test').deleteOne(
        { $key: '123' },
        { transaction: {} as IDBTransaction }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('findByIdAndDelete', () => {
    it('should call queryExecutor findByIdAndDelete method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        findByIdAndDelete: () => ({}),
      }));

      const res = await new Query(mockIdb, 'test').findByIdAndDelete('123');

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        findByIdAndDelete: () => ({}),
      }));

      await new Query(mockIdb, 'test').findByIdAndDelete('123', {
        transaction: {} as IDBTransaction,
      });

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should call queryExecutor findByIdAndUpdate method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        findByIdAndUpdate: () => ({}),
      }));

      const res = await new Query(mockIdb, 'test').findByIdAndUpdate(
        '123',
        (doc) => doc
      );

      expect(res).toEqual({});
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        findByIdAndUpdate: () => ({}),
      }));

      await new Query(mockIdb, 'test').findByIdAndUpdate('123', (doc) => doc, {
        transaction: {} as IDBTransaction,
      });

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('countDocuments', () => {
    it('should call queryExecutor countDocuments method', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        countDocuments: () => 1,
      }));

      const res = await new Query(mockIdb, 'test').countDocuments({
        $key: '123',
      });

      expect(res).toEqual(1);
    });

    it('should not call idb transaction if transaction options is provided', async () => {
      (
        QueryExecutorFactory.getInstance as MockedFunction<any>
      ).mockImplementation(() => ({
        countDocuments: () => 1,
      }));

      await new Query(mockIdb, 'test').countDocuments(
        { $key: '123' },
        {
          transaction: {} as IDBTransaction,
        }
      );

      expect(mockTransaction).toHaveBeenCalledTimes(0);
    });
  });
});
