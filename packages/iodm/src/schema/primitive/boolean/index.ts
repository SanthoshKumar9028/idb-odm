import { BaseSchema } from '../../base-schema';

export class BooleanSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    return !!value;
  }
}
