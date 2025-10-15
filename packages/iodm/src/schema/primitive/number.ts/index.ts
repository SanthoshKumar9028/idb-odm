import {
  BaseSchema,
  type BaseSchemaConstructorOptions,
} from '../../base-schema';
import { MinValidationRule } from '../../validation-rule/min';

export interface NumberSchemaConstructorOptions
  extends BaseSchemaConstructorOptions {
  min?: number;
}

export class NumberSchema extends BaseSchema {
  constructor(options: NumberSchemaConstructorOptions) {
    super(options);

    if (typeof options.min === 'number') {
      this.validationRules.push(
        new MinValidationRule({
          message: `${options.name} must be greater then or equal to ${options.min}`,
          min: options.min,
        })
      );
    }
  }

  castFrom(value: unknown) {
    if (value === undefined || value === null) return value;

    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('cant cast to a number');
    }

    return Number(value);
  }
}
