import { BaseSchema } from '../../base-schema';

export class DateSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    if (!(value instanceof Date)) {
        throw new Error('value is not a date');
    }
    return value;
  }
}
