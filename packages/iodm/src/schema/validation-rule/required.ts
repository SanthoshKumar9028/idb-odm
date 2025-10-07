import { ValidationRule } from './type';

export class RequiredValidationRule extends ValidationRule {
  constructor(message?: string) {
    super(message || 'Required');
  }

  validate(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      throw new Error(this.message);
    }

    return true;
  }
}
