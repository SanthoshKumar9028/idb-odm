import type { SchemaMethodOptions } from '../types';

export interface ThrowMessageArgs {
  value: any;
}

export interface ValidationRuleOptions {
  validator?: (value: any) => boolean;
  message: string | ((props: ThrowMessageArgs) => string);
}

export class ValidationRule {
  validator: ValidationRuleOptions['validator'];
  message: ValidationRuleOptions['message'];

  constructor(options: ValidationRuleOptions) {
    this.validator = options.validator;
    this.message = options.message;
  }

  validate(value: any, _: SchemaMethodOptions): boolean {
    if (this.validator && this.validator(value)) {
      return true;
    }

    this.throwMessage({ value });
  }

  throwMessage(args: ThrowMessageArgs): never {
    if (typeof this.message === 'string') {
      throw new Error(this.message);
    }

    throw new Error(this.message(args));
  }
}
