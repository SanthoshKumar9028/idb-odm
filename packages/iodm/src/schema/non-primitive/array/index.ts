import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { SchemaMethodOptions } from '../../types';

import { BaseSchema } from '../../base-schema';

export interface ArraySchemaConstructorOptions extends BaseSchemaConstructorOptions {
  valueSchema: BaseSchema;
}

export class ArraySchema extends BaseSchema {
  private valueSchema: BaseSchema;

  constructor(options: ArraySchemaConstructorOptions) {
    super(options);

    this.valueSchema = options.valueSchema;
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const castedValue = this.castFrom(value, options);

    this.validationRules.forEach((rule) => rule.validate(castedValue, options));

    if (castedValue) {
      castedValue.forEach((v) => {
        this.valueSchema.validate(v, options);
      });
    }

    return true;
  }

  castFrom(value: unknown, options: SchemaMethodOptions) {
    let val: unknown = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    if (!Array.isArray(val)) {
      throw new Error('cant cast to a array');
    }

    return val.map((v) => this.valueSchema.castFrom(v, options));
  }
}
