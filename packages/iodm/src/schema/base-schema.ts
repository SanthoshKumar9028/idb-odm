import type { QueryExecutorGetCommonOptions } from 'iodm-query';
import type { ValidationRule } from './validation-rule/type';
import type { SchemaMethodOptions, SchemaOptions } from './types';

import { RequiredValidationRule } from './validation-rule/required';
import { applySchemaOptionsDefaults } from './helpers';

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
  protected schemaOptions: SchemaOptions;

  constructor(
    {
      name,
      isVirtual = false,
      validationRules = [],
      required,
    }: BaseSchemaConstructorOptions = {},
    options?: Partial<SchemaOptions>
  ) {
    this.name = name;
    this.isVirtual = isVirtual;
    this.validationRules = validationRules;
    this.schemaOptions = applySchemaOptionsDefaults(options);

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

  async save(_value: unknown, _options: SchemaMethodOptions): Promise<any> {}

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const castedValue = this.castFrom(value, options);
    this.validationRules.forEach((rule) => rule.validate(castedValue, options));
    return true;
  }

  abstract castFrom(value: unknown, options: SchemaMethodOptions): unknown;
}
