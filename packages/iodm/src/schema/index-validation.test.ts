import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Schema } from '.';
import { DateSchema } from './non-primitive/date';
import iodm from '../iodm';

describe('Schema validation', () => {
  beforeEach(() => {
    iodm.models = {};
  });

  it('should validate values with custom validate rule', () => {
    const schema = new Schema({
      age: {
        type: Number,
        validate: {
          validator(value) {
            return value == 1;
          },
          message(props) {
            return `should be 1 but got ${props.value} for ${props.path} key`;
          },
        },
      },
    });

    expect(schema.validate({ _id: 1, age: 1 }, {} as any)).toBe(true);
    expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
      'should be 1 but got 20 for age key'
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
        age: { type: Number, min: [18, '{KEY} key should be less 18'] },
      });

      expect(schema.validate({ _id: 1, age: 18 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 20 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 17 }, {} as any)).toThrow(
        'age key should be less 18'
      );
    });

    it('should validate values with max rule using array syntax and throw when above max', () => {
      const schema = new Schema({
        age: { type: Number, max: [18, '{KEY} key should be less 18'] },
      });

      expect(schema.validate({ _id: 1, age: 17 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 0 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
        'age key should be less 18'
      );
    });

    it('should validate values with enum rule', () => {
      const schema = new Schema({
        age: {
          type: Number,
          enum: {
            values: [1, 2, 3],
            message(args) {
              return `For ${args.path} key it should be one of (1, 2, 3) but got ${args.value}`;
            },
          },
        },
      });

      expect(schema.validate({ _id: 1, age: 1 }, {} as any)).toBe(true);
      expect(schema.validate({ _id: 1, age: 2 }, {} as any)).toBe(true);
      expect(() => schema.validate({ _id: 1, age: 20 }, {} as any)).toThrow(
        'For age key it should be one of (1, 2, 3) but got 20'
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
        name: { type: String, minLength: [4, 'invalid length for {KEY} key'] },
      });

      expect(schema.validate({ _id: 1, name: 'test123' }, {} as any)).toBe(
        true
      );
      expect(schema.validate({ _id: 1, name: 'test123678' }, {} as any)).toBe(
        true
      );
      expect(() => schema.validate({ _id: 1, name: 'tes' }, {} as any)).toThrow(
        'invalid length for name key'
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
        name: { type: String, maxLength: [4, 'invalid {KEY}'] },
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
              return `should be one of (one, two) but got ${props.value} for ${props.path} key`;
            },
          },
        },
      });

      expect(schema.validate({ _id: 1, name: 'one' }, {} as any)).toBe(true);
      expect(() =>
        schema.validate({ _id: 1, name: 'test1234' }, {} as any)
      ).toThrow('should be one of (one, two) but got test1234 for name key');
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
        name: { type: String, match: [/abc/i, 'invalid {KEY}'] },
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
            '{KEY} must be greater then or equal to 2026-6-6',
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
            '{KEY} must be less then or equal to 2026-6-6',
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

  describe('Array', () => {
    it('should validate values with min rule and throw when below min', () => {
      const schema = new Schema({
        marks: { type: [{ type: Number, min: 50 }], required: true },
      });

      expect(schema.validate({ _id: 1, marks: [50, 90] }, {} as any)).toBe(
        true
      );
      expect(() =>
        schema.validate({ _id: 1, marks: [0, 90] }, {} as any)
      ).toThrow('marks.0 must be greater then or equal to 50');
    });

    it('should validate values with max rule and throw when above max', () => {
      const schema = new Schema({
        marks: { type: [{ type: Number, max: 50 }], required: true },
      });

      expect(schema.validate({ _id: 1, marks: [50, 30] }, {} as any)).toBe(
        true
      );
      expect(() =>
        schema.validate({ _id: 1, marks: [0, 90] }, {} as any)
      ).toThrow('marks.1 must be less then or equal to 50');
    });

    it('should validate nested arrays', () => {
      const rowSchema = new Schema({
        data: [{ type: Number, min: 50 }],
      });
      const schema = new Schema({
        matrix: { type: [rowSchema], required: true },
      });

      expect(
        schema.validate(
          {
            _id: 1,
            matrix: [
              { _id: 2, data: [50, 60] },
              { _id: 2, data: [51, 62] },
            ],
          },
          {} as any
        )
      ).toBe(true);
      expect(() =>
        schema.validate(
          {
            _id: 1,
            matrix: [
              { _id: 2, data: [50, 60] },
              { _id: 2, data: [51, 2] },
            ],
          },
          {} as any
        )
      ).toThrow('matrix.1.data.1 must be greater then or equal to 50');
    });
  });

  describe('Ref', () => {
    it('should validate ref object', () => {
      const mockModel = {
        getSchema: vi.fn(() => ({
          getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
        })),
      };

      iodm.models['User'] = mockModel as any;

      const schema = new Schema(
        {
          userId: {
            type: Number,
            ref: 'User',
            min: 1,
            required: true,
          },
        },
        { keyPath: 'userId' }
      );

      expect(
        schema.validate({ userId: { _id: 5, name: 'John' } }, {} as any)
      ).toBe(true);
      expect(() =>
        schema.validate({ userId: { _id: -1, name: 'John' } }, {} as any)
      ).toThrow('userId._id must be greater then or equal to 1');
    });

    it('should validate nested ref object', () => {
      const mockModel = {
        getSchema: vi.fn(() => ({
          getSchemaOptions: vi.fn(() => ({ keyPath: '_id' })),
        })),
      };

      iodm.models['User'] = mockModel as any;

      const schema = new Schema(
        {
          nodeId: {
            type: Number,
            ref: 'User',
            min: 1,
            required: true,
          },
        },
        { keyPath: 'nodeId' }
      );
      const roots = new Schema({
        children: {
          type: [{ type: schema, required: true }],
          required: true,
        },
      });

      expect(
        roots.validate(
          { _id: 1, children: [{ nodeId: { _id: 5, name: 'John' } }] },
          {} as any
        )
      ).toBe(true);
      expect(() =>
        roots.validate({ _id: 1, children: [{}] }, {} as any)
      ).toThrow('children.0.nodeId is required!');
      expect(() =>
        roots.validate({ _id: 1, children: [{ nodeId: -1 }] }, {} as any)
      ).toThrow('children.0.nodeId must be greater then or equal to 1');
    });
  });

  describe('ArrayRef', () => {
    it('should validate ref objects', () => {
      const mockModel = {
        getSchema: vi.fn(() => ({
          getSchemaOptions: vi.fn(() => ({ keyPath: 'orderId' })),
        })),
      };

      iodm.models['User'] = mockModel as any;

      const schema = new Schema({
        orders: [
          {
            type: Number,
            ref: 'User',
            min: 1,
            required: true,
          },
        ],
      });

      expect(
        schema.validate(
          { _id: 1, orders: [{ orderId: 1, name: 'test order 1' }] },
          {} as any
        )
      ).toBe(true);
      expect(() =>
        schema.validate(
          { _id: 1, orders: [{ orderId: -1, name: 'test order 2' }] },
          {} as any
        )
      ).toThrow('orders.0.orderId must be greater then or equal to 1');
    });
  });
});
