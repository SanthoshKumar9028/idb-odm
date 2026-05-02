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

export interface BaseSchemaIndexOptions {
  index?: boolean;
  unique?: boolean;
  multiEntry?: boolean;
}

export interface BaseSchemaConstructorOptions
  extends BaseSchemaValidateOptions, BaseSchemaIndexOptions {
  name?: string;
  isVirtual?: boolean;
  validationRules?: Array<ValidationRule>;
}

export abstract class BaseSchema<
  ConstructorOptions extends BaseSchemaConstructorOptions =
    BaseSchemaConstructorOptions,
> {
  name?: string;
  isVirtual: boolean;
  defVal: any;
  index?: boolean;
  unique?: boolean;
  multiEntry?: boolean;
  validationRules: Array<ValidationRule>;
  protected constructorOptions: ConstructorOptions;
  protected schemaOptions: SchemaOptions;

  constructor(
    constructorOptions: ConstructorOptions = {} as ConstructorOptions,
    options?: Partial<SchemaOptions>
  ) {
    const {
      name,
      isVirtual = false,
      validationRules = [],
      required,
      validate,
      index,
      unique,
      multiEntry,
      default: dft,
    } = constructorOptions;

    this.name = name;
    this.isVirtual = isVirtual;
    this.defVal = dft;
    this.index = index;
    this.unique = unique;
    this.multiEntry = multiEntry;
    this.validationRules = validationRules;
    this.schemaOptions = applySchemaOptionsDefaults(options);
    this.constructorOptions = { ...constructorOptions };

    if (validate) {
      this.validationRules.push(new ValidationRule(validate));
    }

    if (required) {
      this.validationRules.push(
        new RequiredValidationRule({ message: `${name} is required!` })
      );
    }
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

  abstract clone(): BaseSchema;
  abstract castFrom(value: unknown, options: SchemaMethodOptions): unknown;
}
