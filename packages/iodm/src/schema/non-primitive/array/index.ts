import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { ValidateOptions } from '../../validation-rule/type';
import { BaseSchema } from '../../base-schema';

export interface ArraySchemaConstructorOptions
  extends BaseSchemaConstructorOptions {
  valueSchema: BaseSchema;
}

export class ArraySchema extends BaseSchema {
  private valueSchema: BaseSchema;

  constructor(options: ArraySchemaConstructorOptions) {
    super(options);

    this.valueSchema = options.valueSchema;
  }

  validate(value: unknown, options: ValidateOptions): boolean {
    const castedValue = this.castFrom(value);

    this.validationRules.forEach((rule) => rule.validate(castedValue, options));

    if (castedValue) {
      castedValue.forEach((v) => {
        this.valueSchema.validate(v, options);
      });
    }

    return true;
  }

  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;
    if (!Array.isArray(value)) {
      throw new Error('cant cast to a array');
    }

    return value.map((v) => this.valueSchema.castFrom(v));
  }
}
