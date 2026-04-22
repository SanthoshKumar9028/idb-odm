import { BaseSchema } from '../../base-schema';

export class SetSchema extends BaseSchema {
  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    if (!(val instanceof Set)) {
      throw new Error('value is not a set');
    }

    return val;
  }
}
