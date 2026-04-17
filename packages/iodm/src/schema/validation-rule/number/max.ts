import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MaxValidationRuleOptions extends ValidationRuleOptions {
  max: number;
}

export class MaxValidationRule extends ValidationRule {
  max: number;

  constructor(options: MaxValidationRuleOptions) {
    super(options);
    this.max = options.max;
  }

  validate(value: unknown): boolean {
    if (typeof value === 'number' && value > this.max) {
      this.throwMessage({ value });
    }

    return true;
  }
}
