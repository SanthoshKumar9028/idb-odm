import type { SchemaMethodOptions } from '../../types';
import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MinLengthValidationRuleOptions extends ValidationRuleOptions {
  minLength: number;
}

export class MinLengthValidationRule extends ValidationRule {
  minLength: number;

  constructor(options: MinLengthValidationRuleOptions) {
    super(options);
    this.minLength = options.minLength;
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    if (typeof value === 'string' && value.length < this.minLength) {
      this.throwMessage(value, options);
    }

    return true;
  }
}
