import type { ModelInstance } from '../../model/types';

export interface ValidateOptions {
  modelInstance: ModelInstance;
}

export abstract class ValidationRule {
  message: string;
  constructor(message: string) {
    this.message = message;
  }

  abstract validate(value: any, options: ValidateOptions): boolean;
}
