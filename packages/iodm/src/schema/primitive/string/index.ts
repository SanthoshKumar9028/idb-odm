import { BaseSchema } from '../../base-schema';

export class StringSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    return String(value);
  }
}
