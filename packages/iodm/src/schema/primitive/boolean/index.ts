import { BaseSchema } from '../../base-schema';

export class BooleanSchema extends BaseSchema {
  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;

    return !!val;
  }
}
