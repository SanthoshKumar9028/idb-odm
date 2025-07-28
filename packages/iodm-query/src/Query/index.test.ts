import { describe, it, expect } from 'vitest';
import { Query } from './index';

interface ITestUser {
  name: string;
  age: number;
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

  describe('findById', () => {
    it('should validate arguments', async () => {
      const query = new Query<ITestUser[]>(mockIdb, 'test');

      await expect(query.findById('')).rejects.toThrow(
        'search key is required'
      );
    });
  });

  describe('insertOne', () => {
    it('should validate arguments', async () => {
      const query = new Query<ITestUser[]>(mockIdb, 'test');

      await expect(query.insertOne(null)).rejects.toThrow(
        'Atleast one document is requred'
      );
    });
  });
});
