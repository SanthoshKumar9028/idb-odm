import type {
  BaseSchemaConstructorOptions,
  BaseSchemaValidateOptions,
} from '../../base-schema';
import type { ValidationRuleOptions } from '../../validation-rule/validate';

import { BaseSchema } from '../../base-schema';
import { EnumValidationRule } from '../../validation-rule/enum';
import { MatchValidationRule } from '../../validation-rule/string/match';
import { MaxLengthValidationRule } from '../../validation-rule/string/max-length';
import { MinLengthValidationRule } from '../../validation-rule/string/min-length';

export interface StringSchemaValidationOptions extends BaseSchemaValidateOptions {
  minLength?: number | [number, string];
  maxLength?: number | [number, string];
  match?: RegExp | [RegExp, string];
  enum?: {
    values: string[];
    message: ValidationRuleOptions['message'];
  };
}

export interface StringSchemaConstructorOptions
  extends BaseSchemaConstructorOptions, StringSchemaValidationOptions {}

export class StringSchema extends BaseSchema<StringSchemaConstructorOptions> {
  constructor(options: StringSchemaConstructorOptions) {
    super(options);

    if (typeof options.minLength === 'number') {
      this.validationRules.push(
        new MinLengthValidationRule({
          message: `${options.name} length must be greater then or equal to ${options.minLength}`,
          minLength: options.minLength,
        })
      );
    } else if (Array.isArray(options.minLength)) {
      this.validationRules.push(
        new MinLengthValidationRule({
          message: options.minLength[1],
          minLength: options.minLength[0],
        })
      );
    }

    if (typeof options.maxLength === 'number') {
      this.validationRules.push(
        new MaxLengthValidationRule({
          message: `${options.name} length must be less then or equal to ${options.maxLength}`,
          maxLength: options.maxLength,
        })
      );
    } else if (Array.isArray(options.maxLength)) {
      this.validationRules.push(
        new MaxLengthValidationRule({
          message: options.maxLength[1],
          maxLength: options.maxLength[0],
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

    if (options.match instanceof RegExp) {
      this.validationRules.push(
        new MatchValidationRule({
          match: options.match,
          message: `${options.name} is failed to match the RegExp`,
        })
      );
    } else if (Array.isArray(options.match)) {
      this.validationRules.push(
        new MatchValidationRule({
          match: options.match[0],
          message: options.match[1],
        })
      );
    }
  }

  castFrom(value: unknown) {
    let val = this.getFinalValue(value);
    if (val === undefined || val === null) return val;
    return String(val);
  }

  clone(): StringSchema {
    return new StringSchema(this.constructorOptions);
  }
}
