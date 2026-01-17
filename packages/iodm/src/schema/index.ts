import type { MiddlewareFn, QueryExecutorGetCommonOptions } from 'iodm-query';
import type {
  FindMiddlewareContext,
  InjectFunctionContext,
  PluginFn,
  SchemaMethodOptions,
  SchemaOptions,
  SchemaSaveMethodOptions,
} from './types.ts';
import type { BaseSchemaConstructorOptions } from './base-schema';
import type { NumberSchemaConstructorOptions } from './primitive/number.ts';
import type { IModel } from '../model/types.ts';
import type { MiddlewareKeys } from './constants.ts';

import { MiddlewareExecutor } from 'iodm-query';
import { BaseSchema } from './base-schema';
import { ArraySchema } from './non-primitive/array/index.ts';
import { RefSchema } from './non-primitive/ref/index.ts';
import { NumberSchema } from './primitive/number.ts';
import { StringSchema } from './primitive/string.ts';
import { RefArraySchema } from './non-primitive/ref-array/index.ts';
import { VirtualType } from './virtual-type/VirtualType.ts';
import { middlewareKeys } from './constants.ts';

type SchemaDefinitionValue =
  | Schema
  | typeof String
  | typeof Number
  | SchemaDefinitionValue[]
  | { type: typeof String; required?: boolean; ref?: string }
  | { type: typeof Number; required?: boolean; min?: number; ref?: string }
  | { type: SchemaDefinitionValue[]; required?: boolean };

type SchemaDefinition<RawDocType> = Partial<
  Record<keyof RawDocType, SchemaDefinitionValue>
>;

export class Schema<
  RawDocType = any,
  TInstanceMethods = {},
  TStaticMethods = {},
  HydratedDoc = RawDocType & TInstanceMethods
> extends BaseSchema {
  virtuals: Record<string, VirtualType<RawDocType>>;
  methods: {
    [K in keyof TInstanceMethods]?: InjectFunctionContext<
      RawDocType & TInstanceMethods,
      TInstanceMethods[K]
    >;
  };
  statics: {
    [K in keyof TStaticMethods]?: InjectFunctionContext<
      IModel<RawDocType, TInstanceMethods>,
      TStaticMethods[K]
    >;
  };
  middleware: MiddlewareExecutor;
  plugins: Array<{
    fn: PluginFn<RawDocType, TInstanceMethods, TStaticMethods, HydratedDoc>;
    opt?: any;
  }>;
  private refNames: Set<string>;
  private tree: Record<string, BaseSchema>;
  private rawDefinition: SchemaDefinition<RawDocType>;

  constructor(
    definition: SchemaDefinition<RawDocType>,
    options?: Partial<SchemaOptions>
  ) {
    super({}, options);

    this.rawDefinition = definition;
    this.tree = {};
    this.refNames = new Set();
    this.virtuals = {};
    this.methods = {};
    this.statics = {};
    this.plugins = [];
    this.middleware = new MiddlewareExecutor();

    for (let prop in definition) {
      if (this.rawDefinition?.[prop] && 'type' in this.rawDefinition[prop]) {
        this.rawDefinition[prop] = {
          ...this.rawDefinition[prop],
        } as SchemaDefinitionValue;
      }

      if (definition[prop]) {
        this.tree[prop] = this.parseSchemaDefinition(prop, definition[prop]);
      }
    }

    if (!this.tree[this.schemaOptions.keyPath]) {
      this.tree['_id'] = new StringSchema({ name: '_id', required: true });
    }
  }

  private parseSchemaDefinition(
    prop: string,
    definition: SchemaDefinitionValue
  ): BaseSchema {
    const constructor = 'type' in definition ? definition.type : definition;

    const schemaOptions: BaseSchemaConstructorOptions = {
      name: prop,
      required: undefined,
    };

    if ('type' in definition) {
      schemaOptions.required = definition.required;
    }

    if (constructor === String) {
      if ('ref' in definition && definition['ref']) {
        this.refNames.add(definition.ref);

        return new RefSchema({
          name: prop,
          ref: definition.ref,
          valueSchema: new StringSchema(schemaOptions),
          required: definition.required,
        });
      }

      return new StringSchema(schemaOptions);
    } else if (constructor === Number) {
      const numberSchemaOptions: NumberSchemaConstructorOptions = schemaOptions;

      if ('min' in definition) {
        numberSchemaOptions.min = definition.min;
      }

      if ('ref' in definition && definition['ref']) {
        this.refNames.add(definition.ref);

        return new RefSchema({
          name: prop,
          ref: definition.ref,
          valueSchema: new NumberSchema(numberSchemaOptions),
          required: definition.required,
        });
      }

      return new NumberSchema(numberSchemaOptions);
    } else if (Array.isArray(constructor)) {
      if (constructor.length === 0) {
        throw new Error(`Array type must have a value type`);
      }

      if ('ref' in constructor[0] && constructor[0].ref) {
        this.refNames.add(constructor[0].ref);

        return new RefArraySchema({
          name: prop,
          ref: constructor[0].ref,
          valueSchema: this.parseSchemaDefinition(prop, constructor[0].type),
          required: constructor[0].required,
        });
      }

      return new ArraySchema({
        valueSchema: this.parseSchemaDefinition(prop, constructor[0]),
        ...schemaOptions,
      });
    } else if (constructor instanceof Schema) {
      return constructor.clone();
    }

    throw new Error(`Type for ${prop} is not supported`);
  }

  getRefNames(): string[] {
    return [...this.refNames.values()];
  }

  clone() {
    const newSchema = new Schema<RawDocType, TInstanceMethods, TStaticMethods>(
      this.rawDefinition,
      this.schemaOptions
    );

    newSchema.virtuals = Object.entries(this.virtuals).reduce(
      (acc, [key, value]) => {
        acc[key] = value.clone();
        return acc;
      },
      {} as typeof this.virtuals
    );

    newSchema.methods = { ...this.methods };
    newSchema.statics = { ...this.statics };
    newSchema.middleware = this.middleware.clone();
    newSchema.plugins = [...this.plugins];

    return newSchema;
  }

  async save(value: unknown, options: SchemaSaveMethodOptions) {
    if (!value || typeof value !== 'object') {
      throw new Error('value must be an Object');
    }

    for (const prop in this.tree) {
      await this.tree[prop].save(value[prop as keyof typeof value], options);
    }
  }

  validate(value: unknown, options: SchemaMethodOptions) {
    if (!value || typeof value !== 'object') {
      throw new Error('value must be an Object');
    }

    for (const prop in this.tree) {
      this.tree[prop].validate(value[prop as keyof typeof value], options);
    }

    return true;
  }

  async preProcess(
    doc: Record<string, unknown>,
    options: QueryExecutorGetCommonOptions
  ) {
    const newDoc: Record<string, unknown> = {};

    for (const key in doc) {
      if (this.tree[key]) {
        newDoc[key] = await this.tree[key].preProcess(doc, options);
      }
    }
    return newDoc;
  }

  castFrom(value: unknown, options: SchemaMethodOptions) {
    if (!value || typeof value !== 'object') {
      throw new Error('Cant cast value to object schema');
    }

    const obj: Record<string, any> = {};

    for (const key in this.tree) {
      if (this.tree[key].isVirtual) continue;

      obj[key] = this.tree[key].castFrom(
        value[key as keyof typeof value],
        options
      );
    }

    return obj;
  }

  virtual(key: string): VirtualType<RawDocType> {
    if (this.tree[key]) {
      throw new Error('Creating virtual for the existing key');
    }

    const virtualProp = new VirtualType<RawDocType>({
      name: key,
    });

    this.tree[key] = virtualProp;
    this.virtuals[key] = virtualProp;

    return virtualProp;
  }

  pre<E extends MiddlewareKeys | RegExp | MiddlewareKeys[] | RegExp[]>(
    name: E,
    fn: MiddlewareFn<FindMiddlewareContext<E, HydratedDoc>>
  ): Schema {
    if (Array.isArray(name)) {
      name.forEach((e) => this.pre<MiddlewareKeys | RegExp>(e, fn));
      return this;
    }

    if (name instanceof RegExp) {
      this.pre(middlewareKeys.filter((key) => name.test(key)) as any, fn);
      return this;
    }

    this.middleware.pre(name, fn);

    return this;
  }

  post<E extends MiddlewareKeys | RegExp | MiddlewareKeys[] | RegExp[]>(
    name: E,
    fn: MiddlewareFn<FindMiddlewareContext<E, HydratedDoc>>
  ): Schema {
    if (Array.isArray(name)) {
      name.forEach((e) => this.post<RegExp | MiddlewareKeys>(e, fn));
      return this;
    }

    if (name instanceof RegExp) {
      return this.post(
        middlewareKeys.filter((key) => name.test(key)) as any,
        fn
      );
    }

    this.middleware.post(name, fn);

    return this;
  }

  plugin(
    fn: PluginFn<RawDocType, TInstanceMethods, TStaticMethods, HydratedDoc>,
    opt?: any
  ) {
    this.plugins.push({ fn, opt });
    fn(this, opt);
  }
}
