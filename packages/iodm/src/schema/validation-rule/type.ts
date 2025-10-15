import type { ModelInstance } from '../../model/types';

export interface ValidateOptions {
  modelInstance: ModelInstance;
}

export interface ValidationRuleOptions {
  message: string;
}

export abstract class ValidationRule {
  message: string;
  constructor(options: ValidationRuleOptions) {
    this.message = options.message;
  }

  abstract validate(value: any, options: ValidateOptions): boolean;
}
