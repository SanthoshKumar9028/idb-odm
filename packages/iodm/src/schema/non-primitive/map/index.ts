import { BaseSchema } from '../../base-schema';

export class MapSchema extends BaseSchema {
  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    if (!(value instanceof Map)) {
        throw new Error('value is not a map');
    }
    return value;
  }
}
