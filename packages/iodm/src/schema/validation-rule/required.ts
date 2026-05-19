import type { SchemaMethodOptions } from '../types';
import { ValidationRule } from './validate';

export class RequiredValidationRule extends ValidationRule {
  validate(value: unknown, options: SchemaMethodOptions): boolean {
    if (value === null || value === undefined || value === '') {
      this.throwMessage(value, options);
    }

    return true;
  }
}
