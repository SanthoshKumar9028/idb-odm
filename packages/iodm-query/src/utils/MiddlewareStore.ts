export type MiddlewareFn<C = any, R = any> = (
  this: C,
  res: R,
  ...args: any[]
) => any;

interface MiddlewareOptions {}
export type MiddlewareMap = Map<
  string,
  Array<{ fn: MiddlewareFn; options: MiddlewareOptions }>
>;

export class MiddlewareStore {
  private middleware: MiddlewareMap = new Map();

  constructor({ middleware }: { middleware?: MiddlewareMap } = {}) {
    if (middleware) {
      this.middleware = [...middleware.keys()].reduce((map, key) => {
        map.set(key, [...middleware.get(key)!]);
        return map;
      }, new Map());
    }
  }

  /**
   * Register a hook that executes after an operation
   * @param name - The operation name
   * @param fn - The hook function
   * @param options - Middleware options
   */
  hook(name: string, fn: MiddlewareFn, options: MiddlewareOptions = {}): this {
    if (!this.middleware.has(name)) {
      this.middleware.set(name, []);
    }
    this.middleware.get(name)!.push({ fn, options });
    return this;
  }

  /**
   * Execute middleware for a name
   * @param name - The operation name
   * @param result - The result from the operation
   * @param args - Additional arguments
   */
  exec(name: string, ctx: any, result?: any, ...args: any[]): any {
    const middleware = this.middleware.get(name) || [];
    let currentResult = result;

    for (const { fn } of middleware) {
      const hookResult = fn.call(ctx, currentResult, ...args);
      if (hookResult !== undefined) {
        currentResult = hookResult;
      }
    }

    return currentResult;
  }

  /**
   * Remove a hook
   * @param name - The operation name
   * @param fn - The hook function to remove
   */
  removeHook(name: string, fn: MiddlewareFn): this {
    const middleware = this.middleware.get(name);
    if (middleware) {
      const index = middleware.findIndex((h) => h.fn === fn);
      if (index !== -1) {
        middleware.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Get all middleware for a name
   */
  getHooks(
    name: string
  ): Array<{ fn: MiddlewareFn; options: MiddlewareOptions }> {
    return this.middleware.get(name) || [];
  }

  /**
   * Clear all middleware for a name (or all methods if not specified)
   */
  clearHooks(name?: string): this {
    if (name) {
      this.middleware.delete(name);
    } else {
      this.middleware.clear();
    }
    return this;
  }

  /**
   * Clone the MiddlewareStore instance along with its middleware
   * @returns A new MiddlewareStore instance with the same middleware
   */
  clone(): MiddlewareStore {
    return new MiddlewareStore({ middleware: this.middleware });
  }

  filter(cb: (name: string, fn: MiddlewareFn) => boolean): MiddlewareStore {
    const filteredStore = new MiddlewareStore();

    for (const [name, hooks] of this.middleware.entries()) {
      const filteredHooks = hooks.filter(({ fn }) => cb(name, fn));

      if (filteredHooks.length > 0) {
        filteredStore.middleware.set(name, filteredHooks);
      }
    }

    return filteredStore;
  }
}
