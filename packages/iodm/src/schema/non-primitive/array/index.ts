import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { SchemaMethodOptions } from '../../types';

import { BaseSchema } from '../../base-schema';

export interface ArraySchemaConstructorOptions extends BaseSchemaConstructorOptions {
  valueSchema: BaseSchema;
}

export class ArraySchema extends BaseSchema<ArraySchemaConstructorOptions> {
  private valueSchema: BaseSchema;

  constructor(options: ArraySchemaConstructorOptions) {
    super(options);
    this.valueSchema = options.valueSchema;
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const castedValue = this.castFrom(value, options);

    this.validationRules.forEach((rule) => rule.validate(castedValue, options));

    if (castedValue) {
      castedValue.forEach((v, i) => {
        let indexPath = String(i);

        if (options.path) {
          indexPath = `${options.path}.${indexPath}`;
        } else if (this.name) {
          indexPath = `${this.name}.${indexPath}`;
        }

        this.valueSchema.validate(v, { ...options, path: indexPath });
      });
    }

    return true;
  }

  getArrayFinalValue(value: unknown) {
    let val: unknown = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    if (!Array.isArray(val)) {
      throw new Error('cant cast to a array');
    }
    return val;
  }

  applyDefaults(value: unknown, options: SchemaMethodOptions) {
    const val = this.getArrayFinalValue(value);
    return val?.map((v) => this.valueSchema.applyDefaults(v, options));
  }

  castFrom(value: unknown, options: SchemaMethodOptions) {
    const val = this.getArrayFinalValue(value);
    return val?.map((v) => this.valueSchema.castFrom(v, options));
  }

  clone(): ArraySchema {
    return new ArraySchema(this.constructorOptions);
  }
}
