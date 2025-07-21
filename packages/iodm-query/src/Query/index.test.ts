import { describe, it, expect } from 'vitest';
import { Query } from './index';

interface ITestUser {
  name: string;
  age: number
}

describe("IQuery", () => {
  it('should find empty result', async () => {
    const query = new Query<ITestUser[]>(null as unknown as IDBDatabase);
    const data = await query.findById({$query: ""});

    expect(data).toEqual([]);
  });
});

