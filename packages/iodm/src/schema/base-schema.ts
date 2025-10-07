import { RequiredValidationRule } from './validation-rule/required';
import type { ValidateOptions, ValidationRule } from './validation-rule/type';

interface BaseSchemaRequiredOptions {
  flag: boolean;
  message?: string;
}

export abstract class BaseSchema {
  isVirtual: boolean;
  validationRules: Array<ValidationRule>;

  constructor({
    isVirtual = false,
    validationRules = [],
  }: {
    isVirtual?: boolean;
    validationRules?: Array<ValidationRule>;
  } = {}) {
    this.isVirtual = isVirtual;
    this.validationRules = validationRules;
  }

  clone(): unknown {
    return null;
  }
  getIsVirtual() {
    return this.isVirtual;
  }

  validate(value: unknown, options: ValidateOptions): boolean {
    this.validationRules.forEach((rule) => rule.validate(value, options));
    return true;
  }

  required(options: BaseSchemaRequiredOptions) {
    if (options.flag) {
      this.validationRules.push(new RequiredValidationRule(options.message));
    }
  }
}
