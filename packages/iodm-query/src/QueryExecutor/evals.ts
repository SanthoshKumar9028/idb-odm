import { isEmptyValue, isRegExp } from '../utils/type-guards';
import type { QueryRootFilter, QuerySelector, UpdaterOptions } from './type';

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

export const evalSelector = (
  key: string,
  selector: QuerySelector,
  doc: any
) => {
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

const recursivelyApplySet = (doc: any, setObj: UpdaterOptions['$set']) => {
  for (const key in setObj) {
    if (key.includes('.')) {
      const [firstKey, ...restKeys] = key.split('.');

      if (!doc[firstKey]) doc[firstKey] = {};
      recursivelyApplySet(doc[firstKey], { [restKeys.join('.')]: setObj[key] });
    } else {
      doc[key] = setObj[key];
    }
  }
};

const recursivelyApplyUnset = (
  doc: any,
  unsetObj: UpdaterOptions['$unset']
) => {
  for (const key in unsetObj) {
    if (key.includes('.')) {
      const [firstKey, ...restKeys] = key.split('.');

      if (doc[firstKey]) {
        recursivelyApplyUnset(doc[firstKey], { [restKeys.join('.')]: '' });
      }
    } else {
      delete doc[key];
    }
  }
};

const recursivelyApplyPush = (doc: any, pushObj: UpdaterOptions['$push']) => {
  for (const key in pushObj) {
    if (key.includes('.')) {
      const [firstKey, ...restKeys] = key.split('.');

      if (!doc[firstKey]) doc[firstKey] = {};

      recursivelyApplyPush(doc[firstKey], {
        [restKeys.join('.')]: pushObj[key],
      });
    } else {
      if (Array.isArray(doc[key])) {
        doc[key].push(pushObj[key]);
      }
    }
  }
};

const recursivelyApplyPop = (doc: any, popObj: UpdaterOptions['$pop']) => {
  for (const key in popObj) {
    if (key.includes('.')) {
      const [firstKey, ...restKeys] = key.split('.');

      if (!doc[firstKey]) doc[firstKey] = {};

      recursivelyApplyPop(doc[firstKey], {
        [restKeys.join('.')]: popObj[key],
      });
    } else {
      if (Array.isArray(doc[key])) {
        if (popObj[key] == 1) {
          doc[key].pop();
        } else {
          doc[key].shift();
        }
      }
    }
  }
};

const recursivelyApplyInc = (doc: any, incObj: UpdaterOptions['$inc']) => {
  for (const key in incObj) {
    if (key.includes('.')) {
      const [firstKey, ...restKeys] = key.split('.');

      if (doc[firstKey]) {
        recursivelyApplyInc(doc[firstKey], {
          [restKeys.join('.')]: incObj[key],
        });
      }
    } else {
      if (typeof doc[key] === 'number') {
        doc[key] += incObj[key];
      }
    }
  }
};

export const applyUpdates = (doc: any, updateOptions: UpdaterOptions) => {
  if (typeof doc !== 'object' || !doc) return doc;

  if (updateOptions.$set) {
    recursivelyApplySet(doc, updateOptions.$set);
  }

  if (updateOptions.$inc) {
    recursivelyApplyInc(doc, updateOptions.$inc);
  }

  if (updateOptions.$unset) {
    recursivelyApplyUnset(doc, updateOptions.$unset);
  }

  if (updateOptions.$push) {
    recursivelyApplyPush(doc, updateOptions.$push);
  }

  if (updateOptions.$pop) {
    recursivelyApplyPop(doc, updateOptions.$pop);
  }

  return doc;
};
