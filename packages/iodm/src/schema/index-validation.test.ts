import { describe, expect, it } from 'vitest';
import { Schema } from '.';

describe('Schema validation', () => {
  it('should validate values with custom validate rule', () => {
    const schema = new Schema({
      age: {
        type: Number,
        validate: {
          validator(value) {
            return value == 1;
          },
          message(props) {
            return `should be 1 but got ${props.value}`;
          },
        },
      },
    });

    expect(schema.validate({ _id: 1, age: 1 }, {} as any)).toBe(true);
    expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
      'should be 1 but got 20'
    );
  });

  describe('Number', () => {
    it('should validate values with min rule and throw when below min', () => {
      const schema = new Schema({ age: { type: Number, min: 18 } });

      expect(schema.validate({ _id: 1, age: 18 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 20 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 17 }, {} as any)).toThrow(
        'age must be greater then or equal to 18'
      );
    });

    it('should validate values with min rule using array syntax and throw when below min', () => {
      const schema = new Schema({
        age: { type: Number, min: [18, 'should be less 18'] },
      });

      expect(schema.validate({ _id: 1, age: 18 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 20 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 17 }, {} as any)).toThrow(
        'should be less 18'
      );
    });

    it('should validate values with max rule using array syntax and throw when above max', () => {
      const schema = new Schema({
        age: { type: Number, max: [18, 'should be less 18'] },
      });

      expect(schema.validate({ _id: 1, age: 17 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 0 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
        'should be less 18'
      );
    });

    it('should validate values with enum rule', () => {
      const schema = new Schema({
        age: {
          type: Number,
          enum: {
            values: [1, 2, 3],
            message(args) {
              return `should be one of (1, 2, 3) but got ${args.value}`;
            },
          },
        },
      });

      expect(schema.validate({ _id: 1, age: 1 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 2 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
        'should be one of (1, 2, 3) but got 20'
      );
    });
  });
});
