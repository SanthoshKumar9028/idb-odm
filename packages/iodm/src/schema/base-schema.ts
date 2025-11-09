import type { QueryExecutorGetCommonOptions } from 'iodm-query';
import { RequiredValidationRule } from './validation-rule/required';
import type { ValidateOptions, ValidationRule } from './validation-rule/type';

export interface BaseSchemaConstructorOptions {
  name?: string;
  isVirtual?: boolean;
  validationRules?: Array<ValidationRule>;
  required?: boolean;
}

export abstract class BaseSchema {
  name?: string;
  isVirtual: boolean;
  validationRules: Array<ValidationRule>;

  constructor({
    name,
    isVirtual = false,
    validationRules = [],
    required,
  }: BaseSchemaConstructorOptions = {}) {
    this.name = name;
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

  async preProcess(
    _doc: Record<string, unknown>,
    _options: QueryExecutorGetCommonOptions
  ) {
    return this.name ? _doc[this.name] : _doc;
  }

  async save(_value: unknown, _options: ValidateOptions): Promise<any> {}

  validate(value: unknown, options: ValidateOptions): boolean {
    const castedValue = this.castFrom(value);
    this.validationRules.forEach((rule) => rule.validate(castedValue, options));
    return true;
  }

  abstract castFrom(value: unknown): unknown;
}
