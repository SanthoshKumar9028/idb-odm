import { BaseSchema } from '../../base-schema';

export class StringSchema extends BaseSchema {
  castFrom(value: unknown) {
    return String(value);
  }
}
