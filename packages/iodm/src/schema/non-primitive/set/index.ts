import { BaseSchema } from '../../base-schema';

export class SetSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    if (!(value instanceof Set)) {
        throw new Error('value is not a set');
    }
    return value;
  }
}
