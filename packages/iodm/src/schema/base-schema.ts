import type { QueryExecutorGetCommonOptions } from 'iodm-query';
import type { ValidationRuleOptions } from './validation-rule/validate';
import type {
  SchemaMethodOptions,
  SchemaOptions,
  SchemaSaveMethodOptions,
} from './types';

import { ValidationRule } from './validation-rule/validate';
import { RequiredValidationRule } from './validation-rule/required';
import { applySchemaOptionsDefaults } from './helpers';

export interface BaseSchemaValidateOptions {
  required?: boolean;
  default?: any;
  validate?: Required<ValidationRuleOptions>;
}

export interface BaseSchemaConstructorOptions extends BaseSchemaValidateOptions {
  name?: string;
  isVirtual?: boolean;
  validationRules?: Array<ValidationRule>;
}

export abstract class BaseSchema {
  name?: string;
  isVirtual: boolean;
  defVal: any;
  validationRules: Array<ValidationRule>;
  protected schemaOptions: SchemaOptions;

  constructor(
    {
      name,
      isVirtual = false,
      validationRules = [],
      required,
      validate,
      default: dft,
    }: BaseSchemaConstructorOptions = {},
    options?: Partial<SchemaOptions>
  ) {
    this.name = name;
    this.isVirtual = isVirtual;
    this.defVal = dft;
    this.validationRules = validationRules;
    this.schemaOptions = applySchemaOptionsDefaults(options);

    if (validate) {
      this.validationRules.push(new ValidationRule(validate));
    }

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

  getSchemaOptions() {
    return this.schemaOptions;
  }

  async preProcess(
    _doc: Record<string, unknown>,
    _options: QueryExecutorGetCommonOptions
  ) {
    return this.name ? _doc[this.name] : _doc;
  }

  async save(
    _value: unknown,
    _options: SchemaSaveMethodOptions
  ): Promise<any> {}

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const castedValue = this.castFrom(value, options);
    this.validationRules.forEach((rule) => rule.validate(castedValue, options));
    return true;
  }

  protected getDefaultValue() {
    return typeof this.defVal === 'function' ? this.defVal() : this.defVal;
  }

  protected getFinalValue(value: unknown) {
    if (value === undefined || value === null) {
      const defaultValue = this.getDefaultValue();
      return defaultValue === undefined ? value : defaultValue;
    }
    return value;
  }

  abstract castFrom(value: unknown, options: SchemaMethodOptions): unknown;
}
