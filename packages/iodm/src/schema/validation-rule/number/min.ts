import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

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
      this.throwMessage({ value });
    }

    return true;
  }
}
