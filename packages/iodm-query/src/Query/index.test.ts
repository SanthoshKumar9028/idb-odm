import { it, expect } from 'vitest';
import { IQuery } from './index';

it('should create instance', () => {
  const query = new IQuery();
  const data = query.find();
  expect(data).toEqual([]);
});
