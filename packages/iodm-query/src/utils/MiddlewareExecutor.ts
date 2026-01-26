import { MiddlewareStore, type MiddlewareFn } from './MiddlewareStore';

export class MiddlewareExecutor {
  protected store: {
    pre: MiddlewareStore;
    post: MiddlewareStore;
  };

  constructor() {
    this.store = {
      pre: new MiddlewareStore(),
      post: new MiddlewareStore(),
    };
  }

  pre(event: string, fn: MiddlewareFn): MiddlewareExecutor {
    this.store.pre.hook(event, fn);
    return this;
  }

  post(event: string, fn: MiddlewareFn): MiddlewareExecutor {
    this.store.post.hook(event, fn);
    return this;
  }

  execPre(event: string, ctx: any, result?: any, ...args: any[]): any {
    return this.store.pre.exec(event, ctx, result, ...args);
  }

  execPost(event: string, ctx: any, result?: any, ...args: any[]): any {
    return this.store.post.exec(event, ctx, result, ...args);
  }

  removePre(event: string, fn: MiddlewareFn): MiddlewareExecutor {
    this.store.pre.removeHook(event, fn);
    return this;
  }

  removePost(event: string, fn: MiddlewareFn): MiddlewareExecutor {
    this.store.post.removeHook(event, fn);
    return this;
  }

  clear(): MiddlewareExecutor {
    this.store.pre = new MiddlewareStore();
    this.store.post = new MiddlewareStore();
    return this;
  }

  clone(): MiddlewareExecutor {
    const emitter = new MiddlewareExecutor();

    emitter.store.pre = this.store.pre.clone();
    emitter.store.post = this.store.post.clone();

    return emitter;
  }

  filter(cb: (event: string, fn: MiddlewareFn) => boolean): MiddlewareExecutor {
    const emitter = new MiddlewareExecutor();

    emitter.store.pre = this.store.pre.filter(cb);
    emitter.store.post = this.store.post.filter(cb);

    return emitter;
  }
}
export default MiddlewareExecutor;
