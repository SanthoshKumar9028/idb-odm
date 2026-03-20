import { describe, expect, it } from 'vitest';
import { StringSchema } from './index';
import { MinValidationRule } from '../../validation-rule/min';

describe('StringSchema', () => {
  it('should return null and undefined as-is', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom(null)).toBe(null);
    expect(schema.castFrom(undefined)).toBe(undefined);
  });

  it('should cast string values as-is', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom('test123')).toBe('test123');
  });

  it('should cast other values as string', () => {
    const schema = new StringSchema({ name: 'num' });
    expect(schema.castFrom(100)).toBe('100');
  });
});
