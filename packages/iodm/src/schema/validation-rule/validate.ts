import type { SchemaMethodOptions } from '../types';

export interface ThrowMessageArgs {
  value: any;
  path?: string;
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

  validate(value: any, options: SchemaMethodOptions): boolean {
    if (this.validator && this.validator(value)) {
      return true;
    }

    this.throwMessage(value, options);
  }

  throwMessage(value: unknown, options: SchemaMethodOptions): never {
    if (typeof this.message === 'string') {
      let message = this.message;
      if (options.path) {
        message = message.replaceAll('{KEY}', options.path);
      }

      throw new Error(message);
    }

    throw new Error(this.message({ value, path: options.path }));
  }
}
