import type { SchemaMethodOptions } from '../../types';
import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MaxDateValidationRuleOptions extends ValidationRuleOptions {
  max: Date;
}

export class MaxDateValidationRule extends ValidationRule {
  max: Date;

  constructor(options: MaxDateValidationRuleOptions) {
    super(options);
    this.max = options.max;
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    if (value instanceof Date && value > this.max) {
      this.throwMessage(value, options);
    }

    return true;
  }
}
