import { it, expect } from 'vitest';
import {Query} from "iodm-query"

it('should create instance', () => {
  const query = new Query(null as any, '');
  const data = query.find();
  expect(data).toEqual([]);
});
