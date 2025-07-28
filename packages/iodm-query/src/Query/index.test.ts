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

  it('should find empty result', async () => {
    const query = new Query<ITestUser[]>(mockIdb, 'test');
    const data = await query.find({ $query: '' });

    expect(data).toEqual([{ name: 'test', age: 20 }]);
  });
});
