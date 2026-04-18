import type { ValidationRuleOptions } from './validate';
import { ValidationRule } from './validate';

interface EnumValidationRuleOptions<T> extends ValidationRuleOptions {
  enumValues: T[];
}

export class EnumValidationRule<T> extends ValidationRule {
  enumValues: T[];

  constructor(options: EnumValidationRuleOptions<T>) {
    super(options);
    this.enumValues = options.enumValues;
  }

  validate(value: any): boolean {
    if (!this.enumValues.includes(value)) {
      this.throwMessage({ value });
    }

    return true;
  }
}
