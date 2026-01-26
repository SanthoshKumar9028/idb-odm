import type { Schema } from '.';

import { MiddlewareExecutor, type MiddlewareFn } from 'iodm-query';

class CustomMiddlewareExecutor extends MiddlewareExecutor {
  schema: Schema;

  constructor(schema: Schema) {
    super();
    this.schema = schema;
  }

  execPre(event: string, ctx: any, result?: any, ...args: any[]): any {
    const payload = super.execPre(event, ctx, result, ...args);

    this.schema.onExecPreResult(event, payload);

    return payload;
  }

  execPost(event: string, ctx: any, result?: any, ...args: any[]): any {
    const payload = super.execPost(event, ctx, result, ...args);

    this.schema.onExecPostResult(event, payload);

    return payload;
  }

  clone(): CustomMiddlewareExecutor {
    const emitter = new CustomMiddlewareExecutor(this.schema);

    emitter.store.pre = this.store.pre.clone();
    emitter.store.post = this.store.post.clone();

    return emitter;
  }

  filter(
    cb: (event: string, fn: MiddlewareFn) => boolean
  ): CustomMiddlewareExecutor {
    const emitter = new CustomMiddlewareExecutor(this.schema);

    emitter.store.pre = this.store.pre.filter(cb);
    emitter.store.post = this.store.post.filter(cb);

    return emitter;
  }
}

export default CustomMiddlewareExecutor;
