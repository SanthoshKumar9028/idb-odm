import type { ValidationRuleOptions } from '../../validation-rule/validate';
import type {
  BaseSchemaConstructorOptions,
  BaseSchemaValidateOptions,
} from '../../base-schema';

import { BaseSchema } from '../../base-schema';
import { MaxValidationRule } from '../../validation-rule/number/max';
import { MinValidationRule } from '../../validation-rule/number/min';
import { EnumValidationRule } from '../../validation-rule/enum';

export interface NumberSchemaValidationOptions extends BaseSchemaValidateOptions {
  min?: number | [number, string];
  max?: number | [number, string];
  enum?: {
    values: number[];
    message: ValidationRuleOptions['message'];
  };
}

export interface NumberSchemaConstructorOptions
  extends BaseSchemaConstructorOptions, NumberSchemaValidationOptions {}

export class NumberSchema extends BaseSchema<NumberSchemaConstructorOptions> {
  constructor(options: NumberSchemaConstructorOptions) {
    super(options);

    if (typeof options.min === 'number') {
      this.validationRules.push(
        new MinValidationRule({
          message: `${options.name} must be greater then or equal to ${options.min}`,
          min: options.min,
        })
      );
    } else if (Array.isArray(options.min)) {
      this.validationRules.push(
        new MinValidationRule({
          message: options.min[1],
          min: options.min[0],
        })
      );
    }

    if (typeof options.max === 'number') {
      this.validationRules.push(
        new MaxValidationRule({
          message: `${options.name} must be less then or equal to ${options.max}`,
          max: options.max,
        })
      );
    } else if (Array.isArray(options.max)) {
      this.validationRules.push(
        new MaxValidationRule({
          message: options.max[1],
          max: options.max[0],
        })
      );
    }

    if (options.enum) {
      this.validationRules.push(
        new EnumValidationRule({
          enumValues: options.enum.values,
          message: options.enum.message,
        })
      );
    }
  }

  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;

    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error('value is not a number');
    }

    return val;
  }

  clone(): NumberSchema {
    return new NumberSchema(this.constructorOptions);
  }
}
