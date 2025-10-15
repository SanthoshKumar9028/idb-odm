import type { ValidationRuleOptions } from './type';
import { ValidationRule } from './type';

interface MinValidationRuleOptions extends ValidationRuleOptions {
  min: number;
}

export class MinValidationRule extends ValidationRule {
  min: number;

  constructor(options: MinValidationRuleOptions) {
    super(options);
    this.min = options.min;
  }

  validate(value: unknown): boolean {
    if (typeof value === 'number' && value < this.min) {
      throw new Error(this.message);
    }

    return true;
  }
}
