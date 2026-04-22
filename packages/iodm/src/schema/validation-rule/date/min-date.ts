import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MinDateValidationRuleOptions extends ValidationRuleOptions {
  min: Date;
}

export class MinDateValidationRule extends ValidationRule {
  min: Date;

  constructor(options: MinDateValidationRuleOptions) {
    super(options);
    this.min = options.min;
  }

  validate(value: unknown): boolean {
    if (value instanceof Date && value < this.min) {
      this.throwMessage({ value });
    }

    return true;
  }
}
