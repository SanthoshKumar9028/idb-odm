import { it, expect } from 'vitest';
// import { IModel } from './index';
import {IQuery} from "iodm-query"

it('should create instance', () => {
  const query = new IQuery();
  const data = query.find();
  expect(data).toEqual([]);
});
