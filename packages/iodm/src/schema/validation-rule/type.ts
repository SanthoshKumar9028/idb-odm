import type { SchemaMethodOptions } from '../types';

export interface ValidationRuleOptions {
  message: string;
}

export abstract class ValidationRule {
  message: string;
  constructor(options: ValidationRuleOptions) {
    this.message = options.message;
  }

  abstract validate(value: any, options: SchemaMethodOptions): boolean;
}
