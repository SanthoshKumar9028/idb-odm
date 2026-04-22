import { describe, expect, it } from 'vitest';
import { Schema } from '.';
import { DateSchema } from './non-primitive/date';

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

  describe('String', () => {
    it('should validate values with minLength rule and throw when below minLength', () => {
      const schema = new Schema({ name: { type: String, minLength: 4 } });

      expect(schema.validate({ _id: 1, name: 'test123' }, {} as any)).toBe(
        true
      );
      expect(schema.validate({ _id: 1, name: 'test123678' }, {} as any)).toBe(
        true
      );
      expect(() => schema.validate({ _id: 1, name: 'tes' }, {} as any)).toThrow(
        'name length must be greater then or equal to 4'
      );
    });

    it('should validate values with minLength rule using array syntax and throw when below minLength', () => {
      const schema = new Schema({
        name: { type: String, minLength: [4, 'invalid length'] },
      });

      expect(schema.validate({ _id: 1, name: 'test123' }, {} as any)).toBe(
        true
      );
      expect(schema.validate({ _id: 1, name: 'test123678' }, {} as any)).toBe(
        true
      );
      expect(() => schema.validate({ _id: 1, name: 'tes' }, {} as any)).toThrow(
        'invalid length'
      );
    });

    it('should validate values with maxLength rule and throw when above maxLength', () => {
      const schema = new Schema({ name: { type: String, maxLength: 4 } });

      expect(schema.validate({ _id: 1, name: 'te' }, {} as any)).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('name length must be less then or equal to 4');
    });

    it('should validate values with maxLength rule using array syntax and throw when above maxLength', () => {
      const schema = new Schema({
        name: { type: String, maxLength: [4, 'invalid name'] },
      });

      expect(schema.validate({ _id: 1, name: 'te' }, {} as any)).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('invalid name');
    });

    it('should validate values with enum rule', () => {
      const schema = new Schema({
        name: {
          type: String,
          enum: {
            values: ['one', 'two'],
            message(props) {
              return `should be one of (one, two) but got ${props.value}`;
            },
          },
        },
      });

      expect(schema.validate({ _id: 1, name: 'one' }, {} as any)).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('should be one of (one, two) but got test1234');
    });

    it('should validate values with match rule', () => {
      const schema = new Schema({ name: { type: String, match: /abc/i } });

      expect(schema.validate({ _id: 1, name: '1234abce' }, {} as any)).toBe(
        true
      );
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('name is failed to match the RegExp');
    });

    it('should validate values with match rule using array syntax', () => {
      const schema = new Schema({
        name: { type: String, match: [/abc/i, 'invalid name'] },
      });

      expect(schema.validate({ _id: 1, name: '1234abce' }, {} as any)).toBe(
        true
      );
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('invalid name');
    });
  });

  describe('Date', () => {
    it('should validate values with min rule and throw when below min', () => {
      const schema = new Schema({
        dob: {
          type: Date,
          required: true,
          min: [
            new Date(2026, 6, 6),
            'dob must be greater then or equal to 2026-6-6',
          ],
        },
      });

      expect(
        schema.validate({ _id: 1, dob: new Date(2026, 6, 6) }, {} as any)
      ).toBe(true);
      expect(
        schema.validate({ _id: 1, dob: new Date(2028, 6, 6) }, {} as any)
      ).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, dob: new Date(2020, 6, 6) }, {} as any)
      ).toThrow('dob must be greater then or equal to 2026-6-6');
    });

    it('should validate values with max rule and throw when above max', () => {
      const schema = new Schema({
        dob: {
          type: Date,
          required: true,
          max: [
            new Date(2026, 6, 6),
            'dob must be less then or equal to 2026-6-6',
          ],
        },
      });

      expect(
        schema.validate({ _id: 1, dob: new Date(2026, 6, 6) }, {} as any)
      ).toBe(true);
      expect(
        schema.validate({ _id: 1, dob: new Date(2020, 6, 6) }, {} as any)
      ).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, dob: new Date(2028, 6, 6) }, {} as any)
      ).toThrow('dob must be less then or equal to 2026-6-6');
    });
  });
});
