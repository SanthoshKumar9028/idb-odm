import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiddlewareExecutor } from './MiddlewareExecutor';

describe('MiddlewareExecutor', () => {
  let executor: MiddlewareExecutor;

  beforeEach(() => {
    executor = new MiddlewareExecutor();
  });

  describe('constructor', () => {
    it('should initialize with empty pre and post stores', () => {
      expect(executor).toBeInstanceOf(MiddlewareExecutor);
      // We can't directly access store, but we can test behavior
    });
  });

  describe('pre', () => {
    it('should add a pre middleware and return the executor', () => {
      const fn = vi.fn();
      const result = executor.pre('test', fn);
      expect(result).toBe(executor);
      // Test execution later
    });
  });

  describe('post', () => {
    it('should add a post middleware and return the executor', () => {
      const fn = vi.fn();
      const result = executor.post('test', fn);
      expect(result).toBe(executor);
    });
  });

  describe('execPre', () => {
    it('should execute pre middlewares in order', () => {
      const fn1 = vi.fn((res) => res + 1);
      const fn2 = vi.fn((res) => res * 2);
      executor.pre('test', fn1).pre('test', fn2);

      const ctx = {};
      const result = executor.execPre('test', ctx, 1, 'arg1', 'arg2');

      expect(fn1).toHaveBeenCalledWith(1, 'arg1', 'arg2');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledWith(2, 'arg1', 'arg2'); // fn1 returned 2
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(result).toBe(4); // 2 * 2
    });

    it('should return the original result if no middlewares modify it', () => {
      const fn = vi.fn();
      executor.pre('test', fn);

      const result = executor.execPre('test', {}, 'original');
      expect(result).toBe('original');
    });

    it('should handle no middlewares for the event', () => {
      const result = executor.execPre('nonexistent', {}, 'original');
      expect(result).toBe('original');
    });
  });

  describe('execPost', () => {
    it('should execute post middlewares in order', () => {
      const fn1 = vi.fn((res) => res + 1);
      const fn2 = vi.fn((res) => res * 2);
      executor.post('test', fn1).post('test', fn2);

      const ctx = {};
      const result = executor.execPost('test', ctx, 1, 'arg1', 'arg2');

      expect(fn1).toHaveBeenCalledWith(1, 'arg1', 'arg2');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledWith(2, 'arg1', 'arg2');
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(result).toBe(4);
    });

    it('should return the original result if no middlewares modify it', () => {
      const fn = vi.fn();
      executor.post('test', fn);

      const result = executor.execPost('test', {}, 'original');
      expect(result).toBe('original');
    });

    it('should handle no middlewares for the event', () => {
      const result = executor.execPost('nonexistent', {}, 'original');
      expect(result).toBe('original');
    });
  });

  describe('removePre', () => {
    it('should remove a pre middleware and return the executor', () => {
      const fn = vi.fn();
      executor.pre('test', fn);
      const result = executor.removePre('test', fn);
      expect(result).toBe(executor);

      // After removal, exec should not call the function
      executor.execPre('test', {}, 'result');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should not affect other middlewares', () => {
      const fn1 = vi.fn((res) => res + 1);
      const fn2 = vi.fn((res) => res * 2);
      executor.pre('test', fn1).pre('test', fn2);
      executor.removePre('test', fn1);

      const result = executor.execPre('test', {}, 1);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith(1);
      expect(result).toBe(2);
    });
  });

  describe('removePost', () => {
    it('should remove a post middleware and return the executor', () => {
      const fn = vi.fn();
      executor.post('test', fn);
      const result = executor.removePost('test', fn);
      expect(result).toBe(executor);

      executor.execPost('test', {}, 'result');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should not affect other middlewares', () => {
      const fn1 = vi.fn((res) => res + 1);
      const fn2 = vi.fn((res) => res * 2);
      executor.post('test', fn1).post('test', fn2);
      executor.removePost('test', fn1);

      const result = executor.execPost('test', {}, 1);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith(1);
      expect(result).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all pre and post middlewares and return the executor', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      executor.pre('test1', fn1).post('test2', fn2);
      const result = executor.clear();
      expect(result).toBe(executor);

      executor.execPre('test1', {}, 'result');
      executor.execPost('test2', {}, 'result');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe('clone', () => {
    it('should return a new MiddlewareExecutor with cloned stores', () => {
      const fn = vi.fn((res) => res + 1);
      executor.pre('test', fn);
      const cloned = executor.clone();

      expect(cloned).toBeInstanceOf(MiddlewareExecutor);
      expect(cloned).not.toBe(executor);

      // Original should still work
      const originalResult = executor.execPre('test', {}, 1);
      expect(originalResult).toBe(2);

      // Clone should have the same middlewares
      const clonedResult = cloned.execPre('test', {}, 1);
      expect(clonedResult).toBe(2);
    });

    it('should not share state with the original', () => {
      const fn = vi.fn();
      executor.pre('test', fn);
      const cloned = executor.clone();

      cloned.removePre('test', fn);

      // Original should still have the middleware
      executor.execPre('test', {}, 'result');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('filter', () => {
    it('should return a new MiddlewareExecutor with filtered middlewares', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      executor.pre('test1', fn1).pre('test2', fn2);

      const filtered = executor.filter((event, fn) => event === 'test1');

      expect(filtered).toBeInstanceOf(MiddlewareExecutor);
      expect(filtered).not.toBe(executor);

      // Filtered should only have test1
      filtered.execPre('test1', {}, 'result');
      expect(fn1).toHaveBeenCalled();

      filtered.execPre('test2', {}, 'result');
      expect(fn2).not.toHaveBeenCalled();
    });

    it('should not affect the original executor', () => {
      const fn = vi.fn();
      executor.pre('test', fn);
      const filtered = executor.filter(() => false);

      // Original should still have the middleware
      executor.execPre('test', {}, 'result');
      expect(fn).toHaveBeenCalled();
    });
  });
});
