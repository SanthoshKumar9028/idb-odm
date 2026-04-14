import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureIDB } from './configure';
import type { IModel } from './model/types';

describe('configureIDB', () => {
  let mockDB: Partial<IDBDatabase>;
  let mockOpenRequest: Partial<IDBOpenDBRequest>;
  let mockModel: Partial<IModel>;

  beforeEach(() => {
    // Setup mock model
    mockModel = {
      init: vi.fn(),
      onUpgradeNeeded: vi.fn(),
    };

    // Setup mock database
    mockDB = {} as IDBDatabase;

    // Setup mock open request
    mockOpenRequest = {
      onerror: null as any,
      onsuccess: null as any,
      onupgradeneeded: null as any,
    };

    // Mock indexedDB.open
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => mockOpenRequest),
    });
  });

  describe('onerror', () => {
    it('should reject the promise when onerror callback is triggered', async () => {
      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
      };

      const promise = configureIDB(config);

      const error = new Error('Database open failed');
      (mockOpenRequest as any).onerror.call(null, error);

      await expect(promise).rejects.toBe(error);
    });

    it('should not initialize models when onerror is triggered', async () => {
      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
      };

      const promise = configureIDB(config);

      const error = new Error('Database error');
      (mockOpenRequest as any).onerror.call(error);

      await expect(promise).rejects.toThrow();
      expect(mockModel.init).not.toHaveBeenCalled();
    });
  });

  describe('onsuccess', () => {
    it('should initialize all models when onsuccess callback is triggered', async () => {
      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
      };

      const promise = configureIDB(config);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(mockModel.init).toHaveBeenCalledWith(mockDB);
    });

    it('should resolve with database instance when onsuccess is triggered', async () => {
      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
      };

      const promise = configureIDB(config);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      const result = await promise;

      expect(result).toBe(mockDB);
    });

    it('should call init on multiple models when onsuccess is triggered', async () => {
      const mockModel2: Partial<IModel> = {
        init: vi.fn(),
        onUpgradeNeeded: vi.fn(),
      };

      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel, mockModel2 as IModel],
      };

      const promise = configureIDB(config);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(mockModel.init).toHaveBeenCalledWith(mockDB);
      expect(mockModel2.init).toHaveBeenCalledWith(mockDB);
    });
  });

  describe('onupgradeneeded', () => {
    it('should call model onUpgradeNeeded when onupgradeneeded callback is triggered', async () => {
      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
      };

      const promise = configureIDB(config);

      const mockEvent = { result: mockDB };
      (mockOpenRequest as any).onupgradeneeded.call(mockEvent);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(mockModel.onUpgradeNeeded).toHaveBeenCalledWith(mockDB);
    });

    it('should call onUpgradeNeededPre before model upgrade', async () => {
      const onUpgradeNeededPre = vi.fn();

      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
        onUpgradeNeededPre,
      };

      const promise = configureIDB(config);

      const mockEvent = { result: mockDB };
      (mockOpenRequest as any).onupgradeneeded.call(mockEvent);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(onUpgradeNeededPre).toHaveBeenCalledWith(mockEvent);
    });

    it('should call onUpgradeNeededPost after model upgrade', async () => {
      const onUpgradeNeededPost = vi.fn();

      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
        onUpgradeNeededPost,
      };

      const promise = configureIDB(config);

      const mockEvent = { result: mockDB };
      (mockOpenRequest as any).onupgradeneeded.call(mockEvent);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(onUpgradeNeededPost).toHaveBeenCalledWith(mockEvent);
    });

    it('should execute callbacks in correct order: pre, model, post', async () => {
      const callOrder: string[] = [];
      const onUpgradeNeededPre = vi.fn(() => callOrder.push('pre'));
      const onUpgradeNeededPost = vi.fn(() => callOrder.push('post'));

      (mockModel as any).onUpgradeNeeded = vi.fn(() => callOrder.push('model'));

      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel],
        onUpgradeNeededPre,
        onUpgradeNeededPost,
      };

      const promise = configureIDB(config);

      const mockEvent = { result: mockDB };
      (mockOpenRequest as any).onupgradeneeded.call(mockEvent);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(callOrder).toEqual(['pre', 'model', 'post']);
    });

    it('should handle multiple models during onupgradeneeded', async () => {
      const mockModel2: Partial<IModel> = {
        init: vi.fn(),
        onUpgradeNeeded: vi.fn(),
      };

      const config = {
        db: 'testDB',
        version: 1,
        models: [mockModel as IModel, mockModel2 as IModel],
      };

      const promise = configureIDB(config);

      const mockEvent = { result: mockDB };
      (mockOpenRequest as any).onupgradeneeded.call(mockEvent);

      (mockOpenRequest as any).onsuccess.call({ result: mockDB });

      await promise;

      expect(mockModel.onUpgradeNeeded).toHaveBeenCalledWith(mockDB);
      expect(mockModel2.onUpgradeNeeded).toHaveBeenCalledWith(mockDB);
    });
  });
});
