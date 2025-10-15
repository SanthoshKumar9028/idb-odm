import { RequiredValidationRule } from './validation-rule/required';
import type { ValidateOptions, ValidationRule } from './validation-rule/type';

export interface BaseSchemaConstructorOptions {
  name?: string;
  isVirtual?: boolean;
  validationRules?: Array<ValidationRule>;
  required?: boolean;
}

export abstract class BaseSchema {
  isVirtual: boolean;
  validationRules: Array<ValidationRule>;

  constructor({
    name,
    isVirtual = false,
    validationRules = [],
    required,
  }: BaseSchemaConstructorOptions = {}) {
    this.isVirtual = isVirtual;
    this.validationRules = validationRules;

    if (required) {
      this.validationRules.push(
        new RequiredValidationRule({ message: `${name} is required!` })
      );
    }
  }

  clone(): unknown {
    return null;
  }

  getIsVirtual() {
    return this.isVirtual;
  }

  validate(value: unknown, options: ValidateOptions): boolean {
    const castedValue = this.castFrom(value);
    this.validationRules.forEach((rule) => rule.validate(castedValue, options));
    return true;
  }

  abstract castFrom(value: unknown): unknown;
}
