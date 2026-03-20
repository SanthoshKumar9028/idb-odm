import { describe, expect, it, beforeEach, vi } from 'vitest';

// Ensure BroadcastChannel exists in test environment (node) before module load
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class FakeBroadcastChannel {
    constructor(_name: string) {}
    addEventListener() {}
    postMessage() {}
  }
  (globalThis as any).BroadcastChannel = FakeBroadcastChannel;
}

import iodm from './iodm';
import { Schema } from './schema';

describe('Iodm', () => {
  beforeEach(() => {
    // reset singleton model registry between tests
    iodm.models = {} as any;
  });

  it('should register model in models map and return model class', () => {
    const schema = new Schema({ name: String });
    const Model = iodm.model('User', schema);

    expect(Model).toBeDefined();
    expect(iodm.models['User']).toBe(Model);

    expect(Model.getStoreName()).toBe('User');
    expect(Model.getSchema()).toBeDefined();
  });

//   it('should apply plugin when model is created', () => {
//     const pluginFn = vi.fn((schema: any) => {
//       schema.method('hello', function () {
//         return 'hello';
//       });
//     });

//     iodm.plugin(pluginFn);

//     const schema = new Schema({ name: String });
//     const Model = iodm.model('Author', schema);

//     expect(pluginFn).toHaveBeenCalledTimes(1);
//     expect((Model.prototype as any).hello).toBeInstanceOf(Function);
//     expect((new Model({ name: 'name' }) as any).hello()).toBe('hello');
//   });

  it('should allow calling model multiple times with different names', () => {
    const schemaA = new Schema({ a: Number });
    const schemaB = new Schema({ b: String });

    const ModelA = iodm.model('A', schemaA);
    const ModelB = iodm.model('B', schemaB);

    expect(iodm.models['A']).toBe(ModelA);
    expect(iodm.models['B']).toBe(ModelB);
    expect(ModelA.getStoreName()).toBe('A');
    expect(ModelB.getStoreName()).toBe('B');
  });
});
