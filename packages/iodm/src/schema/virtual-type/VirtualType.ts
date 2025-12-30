import { BaseSchema, type BaseSchemaConstructorOptions } from '../base-schema';
import type { SchemaMethodOptions } from '../types';

export interface VirtualTypeApplyMethodOptions extends SchemaMethodOptions {
  value?: any;
}

export interface VirtualTypeConstructorOptions
  extends BaseSchemaConstructorOptions {}

export class VirtualType<Doc> extends BaseSchema {
  private getters: Function[];
  private setters: Function[];

  constructor({ isVirtual = true, ...rest }: VirtualTypeConstructorOptions) {
    super({ ...rest, isVirtual });
    this.getters = [];
    this.setters = [];
  }

  get(fn: (this: Doc, value: any) => any): VirtualType<Doc> {
    this.getters.push(fn);
    return this;
  }

  set(fn: (this: Doc, value: any) => any): VirtualType<Doc> {
    this.setters.push(fn);
    return this;
  }

  applyGetters(
    doc: Record<string, unknown>,
    options: VirtualTypeApplyMethodOptions
  ) {
    let value: unknown = options.value;

    this.getters.forEach((cb) => {
      value = cb.call(doc, value);
    });

    return value;
  }

  applySetters(
    doc: Record<string, unknown>,
    options: VirtualTypeApplyMethodOptions
  ) {
    let value: unknown = options.value;

    this.setters.forEach((cb) => {
      value = cb.call(doc, value);
    });

    return value;
  }

  castFrom(value: unknown) {
    return value;
  }

  clone(): VirtualType<Doc> {
    const newType = new VirtualType({
      isVirtual: true,
      name: this.name,
    });

    newType.setters = [...this.setters];
    newType.getters = [...this.getters];

    return newType;
  }
}
