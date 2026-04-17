import { ValidationRule } from './validate';

export class RequiredValidationRule extends ValidationRule {
  validate(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      this.throwMessage({ value });
    }

    return true;
  }
}
