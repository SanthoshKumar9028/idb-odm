import type { QueryKeys } from 'iodm-query';
import { queryKeys } from 'iodm-query';

export type MiddlewareKeys = QueryKeys | 'exec' | 'save' | 'validate';

export const queryMiddlewareKeys = [...queryKeys, 'exec'];
export const documentMiddlewareKeys = ['save', 'validate'];

export const middlewareKeys: string[] = [
  ...queryMiddlewareKeys,
  ...documentMiddlewareKeys,
];
