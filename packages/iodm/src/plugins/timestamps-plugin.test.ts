import { timestampsPlugin } from './timestamps-plugin';
import { DateSchema } from '../schema/non-primitive/date';
import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('../schema/non-primitive/date', () => {
  return {
    DateSchema: vi.fn().mockImplementation(({ name }) => ({ name })),
  };
});

describe('timestampsPlugin', () => {
  let schema: any;

  beforeEach(() => {
    schema = {
      pre: vi.fn(),
      setSchemaFor: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('when opts is falsy', () => {
    it('should do nothing', () => {
      timestampsPlugin(schema, undefined);

      expect(schema.pre).not.toHaveBeenCalled();
      expect(schema.setSchemaFor).not.toHaveBeenCalled();
    });
  });

  describe('when opts is true', () => {
    it('should enable both createdAt and updatedAt', () => {
      timestampsPlugin(schema, true);

      expect(schema.pre).toHaveBeenCalledWith(
        'insertMany',
        expect.any(Function)
      );
      expect(schema.pre).toHaveBeenCalledWith(
        'insertOne',
        expect.any(Function)
      );

      expect(schema.pre).toHaveBeenCalledWith(
        'updateMany',
        expect.any(Function)
      );
      expect(schema.pre).toHaveBeenCalledWith(
        'updateOne',
        expect.any(Function)
      );
      expect(schema.pre).toHaveBeenCalledWith(
        'replaceOne',
        expect.any(Function)
      );
      expect(schema.pre).toHaveBeenCalledWith(
        'findByIdAndUpdate',
        expect.any(Function)
      );

      expect(schema.setSchemaFor).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom field names', () => {
    it('should use custom key names', () => {
      timestampsPlugin(schema, {
        createdAt: 'created_on',
        updatedAt: 'updated_on',
      });

      expect(DateSchema).toHaveBeenCalledWith({ name: 'created_on' });
      expect(DateSchema).toHaveBeenCalledWith({ name: 'updated_on' });
    });
  });

  describe('addCreatedAt hook', () => {
    it('should add timestamps to inserted docs', () => {
      timestampsPlugin(schema, true);

      const insertHook = schema.pre.mock.calls.find(
        ([event]: any) => event === 'insertMany'
      )[1];

      const docs = [{}, {}];

      const ctx: any = {
        options: {
          type: 'insertMany',
          insertList: docs,
        },
      };

      insertHook.call(ctx);

      docs.forEach((doc) => {
        expect((doc as any).createdAt).toBeInstanceOf(Date);
        expect((doc as any).updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('addUpdatedAt hook (object payload)', () => {
    it('should add $set.updatedAt for update queries', () => {
      timestampsPlugin(schema, true);

      const updateHook = schema.pre.mock.calls.find(
        ([event]: any) => event === 'updateOne'
      )[1];

      const ctx: any = {
        options: {
          type: 'updateOne',
          payload: {},
        },
      };

      updateHook.call(ctx);

      expect(ctx.options.payload.$set.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('addUpdatedAt hook (function payload)', () => {
    it('should wrap payload function and inject updatedAt', () => {
      timestampsPlugin(schema, true);

      const updateHook = schema.pre.mock.calls.find(
        ([event]: any) => event === 'updateOne'
      )[1];

      const originalFn = vi.fn().mockReturnValue({});

      const ctx: any = {
        options: {
          type: 'updateOne',
          payload: originalFn,
        },
      };

      updateHook.call(ctx);

      const result = ctx.options.payload();

      expect(originalFn).toHaveBeenCalled();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('replaceOne behavior', () => {
    it('should set updatedAt directly on payload', () => {
      timestampsPlugin(schema, true);

      const replaceHook = schema.pre.mock.calls.find(
        ([event]: any) => event === 'replaceOne'
      )[1];

      const payload: any = {};

      const ctx: any = {
        options: {
          type: 'replaceOne',
          payload,
        },
      };

      replaceHook.call(ctx);

      expect(payload.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('partial options', () => {
    it('should enable only createdAt', () => {
      timestampsPlugin(schema, { createdAt: true });

      expect(schema.setSchemaFor).toHaveBeenCalledTimes(1);
      expect(DateSchema).toHaveBeenCalledWith({ name: 'createdAt' });
    });

    it('should enable only updatedAt', () => {
      timestampsPlugin(schema, { updatedAt: true });

      expect(schema.setSchemaFor).toHaveBeenCalledTimes(1);
      expect(DateSchema).toHaveBeenCalledWith({ name: 'updatedAt' });
    });
  });
});
