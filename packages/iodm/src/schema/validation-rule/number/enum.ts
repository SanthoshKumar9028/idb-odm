import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface EnumValidationRuleOptions extends ValidationRuleOptions {
  enumValues: number[];
}

export class EnumValidationRule extends ValidationRule {
  enumValues: number[];

  constructor(options: EnumValidationRuleOptions) {
    super(options);
    this.enumValues = options.enumValues;
  }

  validate(value: unknown): boolean {
    if (typeof value === 'number' && !this.enumValues.includes(value)) {
      this.throwMessage({ value });
    }

    return true;
  }
}
