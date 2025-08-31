import { isEmptyValue, isRegExp } from "../utils/type-guards";
import type { QueryRootFilter, QuerySelector } from "./type";

export const operators = [
  '$eq',
  '$nq',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$not',
  '$regex',
] as const;

export const isSelector = (value: unknown): value is QuerySelector => {
  if (typeof value !== 'object' || !value) return false;
  return operators.some((key) => key in value);
};

export const evalSelector = (key: string, selector: QuerySelector, doc: any) => {
  if ('$eq' in selector && !(selector['$eq'] === doc[key])) {
    return false;
  }

  if ('$nq' in selector && !(selector['$nq'] !== doc[key])) {
    return false;
  }

  if (!isEmptyValue(selector['$gt']) && !(selector['$gt'] < doc[key])) {
    return false;
  }

  if (!isEmptyValue(selector['$gte']) && !(selector['$gte'] <= doc[key])) {
    return false;
  }

  if (!isEmptyValue(selector['$lt']) && !(selector['$lt'] > doc[key])) {
    return false;
  }

  if (!isEmptyValue(selector['$lte']) && !(selector['$lte'] >= doc[key])) {
    return false;
  }

  if (
    !isEmptyValue(selector['$not']) &&
    evalSelector(key, selector['$not'], doc)
  ) {
    return false;
  }

  if (!isEmptyValue(selector['$regex']) && !selector['$regex'].test(doc[key])) {
    return false;
  }

  return true;
};

export const evalFilter = (filter: QueryRootFilter, doc: any) => {
  if (typeof doc !== 'object' || !doc) return true;

  const keys = Object.keys(filter).filter((key) => key != '$key');

  for (const key of keys) {
    const value = filter[key];
    if (key === '$and' && filter['$and']) {
      if (!filter['$and'].every((selector) => evalFilter(selector, doc)))
        return false;
    } else if (key === '$or' && filter['$or']) {
      if (!filter['$or'].some((selector) => evalFilter(selector, doc)))
        return false;
    } else {
      if (isSelector(value)) {
        if (!evalSelector(key, value, doc)) return false;
      } else {
        if (isRegExp(filter[key])) {
          if (!filter[key].test(doc[key])) return false;
        } else if (filter[key] !== doc[key]) return false;
      }
    }
  }

  return true;
};
