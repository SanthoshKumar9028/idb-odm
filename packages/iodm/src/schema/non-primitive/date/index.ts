import type {
  BaseSchemaConstructorOptions,
  BaseSchemaValidateOptions,
} from '../../base-schema';

import { BaseSchema } from '../../base-schema';
import { MaxDateValidationRule } from '../../validation-rule/date/max-date';
import { MinDateValidationRule } from '../../validation-rule/date/min-date';

export interface DateSchemaValidationOptions extends BaseSchemaValidateOptions {
  min?: Date | [Date, string];
  max?: Date | [Date, string];
}

export interface DateSchemaConstructorOptions
  extends BaseSchemaConstructorOptions, DateSchemaValidationOptions {}

export class DateSchema extends BaseSchema {
  constructor(options: DateSchemaConstructorOptions = {}) {
    super(options);

    if (options.min instanceof Date) {
      this.validationRules.push(
        new MinDateValidationRule({
          message: `${options.name} must be greater then or equal to ${options.min}`,
          min: options.min,
        })
      );
    } else if (Array.isArray(options.min)) {
      this.validationRules.push(
        new MinDateValidationRule({
          message: options.min[1],
          min: options.min[0],
        })
      );
    }

    if (options.max instanceof Date) {
      this.validationRules.push(
        new MaxDateValidationRule({
          message: `${options.name} must be less then or equal to ${options.max}`,
          max: options.max,
        })
      );
    } else if (Array.isArray(options.max)) {
      this.validationRules.push(
        new MaxDateValidationRule({
          message: options.max[1],
          max: options.max[0],
        })
      );
    }
  }

  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    if (!(val instanceof Date)) {
      throw new Error('value is not a date');
    }

    return val;
  }
}
