import { BaseSchema } from '../../base-schema';

export class MapSchema extends BaseSchema {
  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    if (!(val instanceof Map)) {
      throw new Error('value is not a map');
    }

    return val;
  }

  clone(): MapSchema {
    return new MapSchema(this.constructorOptions);
  }
}
