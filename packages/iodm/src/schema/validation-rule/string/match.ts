import type { SchemaMethodOptions } from '../../types';
import type { ValidationRuleOptions } from '../validate';
import { ValidationRule } from '../validate';

interface MatchValidationRuleOptions extends ValidationRuleOptions {
  match: RegExp;
}

export class MatchValidationRule extends ValidationRule {
  match: RegExp;

  constructor(options: MatchValidationRuleOptions) {
    super(options);
    this.match = options.match;
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    if (typeof value === 'string' && !this.match.test(value)) {
      this.throwMessage(value, options);
    }

    return true;
  }
}
