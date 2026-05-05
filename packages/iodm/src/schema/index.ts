import type { MiddlewareFn, QueryExecutorGetCommonOptions } from 'iodm-query';
import type {
  BroadcastEnabledEventsOptions,
  FindMiddlewareContext,
  InjectFunctionContext,
  PluginFn,
  SchemaDefinition,
  SchemaDefinitionValue,
  SchemaMethodOptions,
  SchemaOptions,
  SchemaSaveMethodOptions,
} from './types.ts';
import type { BaseSchemaConstructorOptions } from './base-schema';
import type { NumberSchemaConstructorOptions } from './primitive/number/index.ts';
import type { IModel } from '../model/types.ts';
import type { MiddlewareKeys } from './constants.ts';
import type { StringSchemaConstructorOptions } from './primitive/string/index.ts';
import type { DateSchemaConstructorOptions } from './non-primitive/date/index.ts';

import { MiddlewareStore } from 'iodm-query';
import { BaseSchema } from './base-schema';
import { ArraySchema } from './non-primitive/array/index.ts';
import { RefSchema } from './non-primitive/ref/index.ts';
import { NumberSchema } from './primitive/number/index.ts';
import { StringSchema } from './primitive/string/index.ts';
import { RefArraySchema } from './non-primitive/ref-array/index.ts';
import { BooleanSchema } from './primitive/boolean/index.ts';
import { DateSchema } from './non-primitive/date/index.ts';
import { MapSchema } from './non-primitive/map/index.ts';
import { SetSchema } from './non-primitive/set/index.ts';
import { VirtualType } from './virtual-type/VirtualType.ts';
import { middlewareKeys } from './constants.ts';
import CustomMiddlewareExecutor from './custom-middleware-executor.ts';
import { timestampsPlugin } from '../plugins/timestamps-plugin.ts';

/**
 * Schema class represents the structure of the documents in a collection, defining the types of each field, validation rules, default values, and other properties.
 */

export class Schema<
  RawDocType = any,
  TInstanceMethods = {},
  TVirtualProperties = {},
  TStaticMethods = {},
  HydratedDoc = RawDocType & TVirtualProperties & TInstanceMethods,
> extends BaseSchema {
  private refNames: Set<string>;
  private tree: Record<string, BaseSchema>;
  private rawDefinition: SchemaDefinition<RawDocType>;
  virtuals: Record<string, VirtualType<RawDocType>>;
  methods: {
    [K in keyof TInstanceMethods]?: InjectFunctionContext<
      RawDocType & TVirtualProperties & TInstanceMethods,
      TInstanceMethods[K]
    >;
  };
  statics: {
    [K in keyof TStaticMethods]?: InjectFunctionContext<
      IModel<RawDocType, TInstanceMethods, TVirtualProperties>,
      TStaticMethods[K]
    >;
  };
  middleware: CustomMiddlewareExecutor;
  plugins: Array<{
    fn: PluginFn<
      RawDocType,
      TInstanceMethods,
      TVirtualProperties,
      TStaticMethods,
      HydratedDoc
    >;
    opt?: any;
  }>;
  broadcastEnabledEvents: Record<string, BroadcastEnabledEventsOptions>;
  broadcastMiddleware: MiddlewareStore;

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
    this.middleware = new CustomMiddlewareExecutor(this);
    this.broadcastMiddleware = new MiddlewareStore();
    this.broadcastEnabledEvents = {};

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

    if (options?.timestamps) {
      this.plugin(timestampsPlugin, options.timestamps);
    }
  }

  private parseSchemaDefinition(
    prop: string,
    definition: SchemaDefinitionValue
  ): BaseSchema {
    const constructor = 'type' in definition ? definition.type : definition;

    const schemaOptions: BaseSchemaConstructorOptions = {
      name: prop,
    };
    const typeDefinition = Array.isArray(definition)
      ? definition[0]
      : definition;

    if (typeDefinition && 'type' in typeDefinition) {
      schemaOptions.required = typeDefinition.required;
      schemaOptions.default = typeDefinition.default;
      schemaOptions.validate = typeDefinition.validate;
      schemaOptions.index = typeDefinition.index;
      schemaOptions.unique = typeDefinition.unique;
      schemaOptions.multiEntry = typeDefinition.multiEntry;
    }

    if (constructor === String) {
      const stringSchemaOptions: StringSchemaConstructorOptions = schemaOptions;

      if ('minLength' in definition) {
        stringSchemaOptions.minLength = definition.minLength;
      }
      if ('maxLength' in definition) {
        stringSchemaOptions.maxLength = definition.maxLength;
      }
      if ('enum' in definition) {
        stringSchemaOptions.enum = definition.enum as any;
      }
      if ('match' in definition) {
        stringSchemaOptions.match = definition.match;
      }

      if ('ref' in definition && definition['ref']) {
        this.refNames.add(definition.ref);

        return new RefSchema({
          name: prop,
          ref: definition.ref,
          valueSchema: new StringSchema(stringSchemaOptions),
          required: definition.required,
        });
      }

      return new StringSchema(stringSchemaOptions);
    }

    if (constructor === Number) {
      const numberSchemaOptions: NumberSchemaConstructorOptions = schemaOptions;

      if ('min' in definition) {
        numberSchemaOptions.min = definition.min as any;
      }
      if ('max' in definition) {
        numberSchemaOptions.max = definition.max as any;
      }
      if ('enum' in definition) {
        numberSchemaOptions.enum = definition.enum as any;
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
    }

    if (constructor === Boolean) {
      return new BooleanSchema(schemaOptions);
    }

    if (constructor === Date) {
      const dateSchemaOptions: DateSchemaConstructorOptions = schemaOptions;

      if ('min' in definition) {
        dateSchemaOptions.min = definition.min as any;
      }
      if ('max' in definition) {
        dateSchemaOptions.max = definition.max as any;
      }
      return new DateSchema(dateSchemaOptions);
    }

    if (constructor === Map) {
      return new MapSchema(schemaOptions);
    }

    if (constructor === Set) {
      return new SetSchema(schemaOptions);
    }

    if (Array.isArray(constructor)) {
      if (constructor.length !== 1) {
        throw new Error(`Array type must have a value type`);
      }

      if ('ref' in constructor[0] && constructor[0].ref) {
        this.refNames.add(constructor[0].ref);

        return new RefArraySchema({
          ref: constructor[0].ref,
          valueSchema: this.parseSchemaDefinition(prop, constructor[0]),
          ...schemaOptions,
        });
      }

      return new ArraySchema({
        valueSchema: this.parseSchemaDefinition(prop, constructor[0]),
        ...schemaOptions,
      });
    }

    if (constructor instanceof Schema) {
      return constructor.clone();
    }

    throw new Error(`Type for ${prop} is not supported`);
  }

  /**
   * Get all reference names used in the schema, 
   * useful for creating transactions that involve multiple models.
   * 
   * @returns array of reference names used in the schema
   */
  getRefNames(): string[] {
    return [...this.refNames.values()];
  }

  /**
   * Get schema for a specific key
   * 
   * @param key - key of the schema path to get the schema for
   * @returns schema for the key
   */
  getSchemaFor(key: string) {
    return this.tree[key];
  }

  /**
   * Set schema for a specific key, useful for circular references
   * 
   * @param keySchema - schema to set for the key
   * @returns
   */
  setSchemaFor(keySchema: BaseSchema) {
    if (keySchema.name) {
      this.tree[keySchema.name] = keySchema;
    }
  }

  /**
   * Clones the created schema
   * 
   * @returns cloned schema
   */
  clone() {
    const newSchema = new Schema<
      RawDocType,
      TInstanceMethods,
      TVirtualProperties,
      TStaticMethods
    >(this.rawDefinition, this.schemaOptions);

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
    newSchema.middleware.schema = newSchema;
    newSchema.plugins = [...this.plugins];
    newSchema.broadcastEnabledEvents = { ...this.broadcastEnabledEvents };
    newSchema.broadcastMiddleware = this.broadcastMiddleware.clone();

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

  /**
   * Validates the given value against the schema
   * 
   * @param value - value to validate
   * @param options - validation options
   * @returns true if value is valid, otherwise throws an error
   */
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

  /**
   * Casts the given value to the schema types
   * 
   * @param value - value to cast
   * @param options - casting options
   * @returns casted value
   */
  castFrom(value: unknown, options: SchemaMethodOptions) {
    let val = this.getFinalValue(value);
    if (!val || typeof val !== 'object') {
      throw new Error('Cant cast value to object schema');
    }

    const obj: Record<string, any> = {};

    for (const key in this.tree) {
      if (this.tree[key].isVirtual) continue;

      obj[key] = this.tree[key].castFrom(val[key as keyof typeof val], options);
    }

    return obj;
  }

  /**
   * Creates a virtual property on the schema
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.virtual('fullName').get(function() {
   *  return `${this.firstName} ${this.lastName}`;
   * });
   * ```
   * 
   * @param key - name of the virtual property
   * @returns created virtual property
   */
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

  /**
   * Adds an instance method to the schema
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.method('getFullName', function() {
   *  return `${this.firstName} ${this.lastName}`;
   * });
   * ```
   * 
   * @param name - name of the method
   * @param func - function implementation of the method
   * @returns schema instance for chaining
   */
  method<K extends keyof TInstanceMethods>(
    name: K,
    func: InjectFunctionContext<
      RawDocType & TVirtualProperties & TInstanceMethods,
      TInstanceMethods[K]
    >
  ) {
    this.methods[name] = func;
    return this;
  }

  /**
   * Adds a static method to the schema
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.static('getUsers', function() {
   *  return this.find({});
   * });
   * 
   * const User = new Model('User', userSchema);
   * User.getUsers().then(users => console.log(users));
   * ```
   * 
   * @param name - name of the method
   * @param func - function implementation of the method
   * @returns schema instance for chaining
   */
  static<K extends keyof TStaticMethods>(
    name: K,
    func: InjectFunctionContext<
      IModel<RawDocType, TInstanceMethods>,
      TStaticMethods[K]
    >
  ) {
    this.statics[name] = func;
    return this;
  }

  /**
   * Adds a pre middleware for the given event(s)
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.pre('save', function() {
   *  console.log(this.firstName + ' ' + this.lastName, 'User is being saved');
   * });
   * ```
   * 
   * @param name - name of the event(s) to add the middleware for, can be a string, array of strings or regex
   * @param func - middleware function
   * @returns schema instance for chaining
   */
  pre<E extends MiddlewareKeys | RegExp | (MiddlewareKeys | RegExp)[]>(
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

  /**
   * Adds a post middleware for the given event(s)
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.post('save', function() {
   *  console.log(this.firstName + ' ' + this.lastName, 'User has been saved');
   * });
   * ```
   * 
   * @param name - name of the event(s) to add the middleware for, can be a string, array of strings or regex
   * @param func - middleware function
   * @returns schema instance for chaining
   */
  post<E extends MiddlewareKeys | RegExp | (MiddlewareKeys | RegExp)[]>(
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

  onExecPreResult(_event: string, _payload: any) {
    // empty handler, top level model will add custom logic
  }
  onExecPostResult(_event: string, _payload: any) {
    // empty handler, top level model will add custom logic
  }

  /**
   * Adds a plugin to the schema, plugin will not be applied until the applyPlugins method is called.
   * 
   * @example
   * ```ts
   * const pluginFn = (schema, options) => {
   *  // plugin implementation
   * }
   * 
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.plugin(pluginFn, { option1: 'value1' });
   * ```
   * 
   * @remarks
   * applyPlugins method will be called internally by the top level model when the model is initialized, 
   * so there is no need to call it manually in most cases.
   * 
   * @param fn - plugin function to apply to the schema
   * @param opt - options to pass to the plugin function
   * @returns schema instance for chaining
   */
  plugin(
    fn: PluginFn<
      RawDocType,
      TInstanceMethods,
      TVirtualProperties,
      TStaticMethods,
      HydratedDoc
    >,
    opt?: any
  ) {
    this.plugins.push({ fn, opt });
    return this;
  }

  /**
   * Applies all the added plugins to the schema, should be called after adding all plugins and before using the schema to create a model.
   * This method is called internally by the top level model when the model is initialized, so there is no need to call it manually in most cases.
   *
   * @remarks 
   * Calling this method multiple times will re-apply all plugins, 
   * so it should be used with caution.
   */
  applyPlugins() {
    this.plugins.forEach(({ fn, opt }) => {
      fn(this, opt);
    });
  }

  /**
   * Enables broadcasting for the given event, when the event is emitted, the payload prepared by the prepare function 
   * will be sent to the middleware registered with the `broadcastHook` method, in the other tabs or windows,
   * which can be used to implement real-time features.
   * 
   * @remarks
   * The same tab which emitted the event will not receive the broadcast.
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.enableBroadcastFor('save', {
   *  type: 'post',
   *  prepare: (payload) => {
   *    return JSON.stringify(payload);
   *  }
   * });
   * ```
   * @param event - the event for which to enable broadcasting
   * @param data - the broadcast enabled event options
   * @returns schema instance for chaining
   */
  enableBroadcastFor(
    event: MiddlewareKeys,
    data: BroadcastEnabledEventsOptions
  ) {
    this.broadcastEnabledEvents[event] = data;
    return this;
  }

  /**
   * Adds a middleware to be executed when a broadcast is received for the events enabled for broadcasting, 
   * can be used to implement real-time features in the application.
   * 
   * @example
   * ```ts
   * const userSchema = new Schema({
   *  firstName: String,
   *  lastName: String,
   * });
   * 
   * userSchema.enableBroadcastFor('save', {
   *  // options
   * });
   * 
   * userSchema.broadcastHook((payload) => {
   *  console.log('Received broadcast with payload:', payload);
   * });
   * ```
   * 
   * @remarks
   * This middleware will be executed for all the events that are enabled for broadcasting, using the `enableBroadcastFor` method, 
   * so the payload should be checked in the middleware to handle different events accordingly.
   * 
   * @param fn - middleware function to execute when a broadcast is received
   * @returns schema instance for chaining
   */
  broadcastHook(
    fn: MiddlewareFn<IModel<RawDocType, TInstanceMethods>, MessageEvent<any>>
  ) {
    this.broadcastMiddleware.hook('broadcast', fn);
    return this
  }

  /**
   * Executes the broadcast middlewares for the given context, should be called by the top level model when a broadcast is received.
   * 
   * @param ctx - context to pass to the broadcast middlewares
   * @param error - error to pass to the broadcast middlewares, if any
   * @param result - result to pass to the broadcast middlewares, if any
   * @param args - additional arguments to pass to the broadcast middlewares
   * @returns schema instance for chaining
   */
  execBroadcastHooks(ctx: any, error?: any, result?: any, ...args: any[]) {
    this.broadcastMiddleware.exec('broadcast', ctx, error, result, ...args);
    return this;
  }

  /**
   * Iterates over the schema tree entries, useful for recursive operations on the schema tree
   * 
   * @param callbackfn - function to execute for each entry in the schema tree
   */
  treeEntries(
    callbackfn: (
      value: [string, BaseSchema],
      index: number,
      array: [string, BaseSchema][]
    ) => void
  ) {
    return Object.entries(this.tree).forEach(callbackfn);
  }
}
