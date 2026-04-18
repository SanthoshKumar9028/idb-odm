import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MaxLengthValidationRuleOptions extends ValidationRuleOptions {
  maxLength: number;
}

export class MaxLengthValidationRule extends ValidationRule {
  maxLength: number;

  constructor(options: MaxLengthValidationRuleOptions) {
    super(options);
    this.maxLength = options.maxLength;
  }

  validate(value: unknown): boolean {
    if (typeof value === 'string' && value.length > this.maxLength) {
      this.throwMessage({ value });
    }

    return true;
  }
}
