import type { IModel } from './model/types';
import type { Schema } from './schema';
import type {
  InferSchemaType,
  ObtainSchemaGeneric,
  PluginFn,
} from './schema/types';

import { AbstractModel } from './model';

/**
 * Iodm is the main class of the package. It is used to create models and apply plugins.
 * 
 * @remarks
 * Iodm is a Singleton class, meaning that there is only one instance of it throughout the application. 
 * This instance is exported as the default export of the package.
 */
export class Iodm {
  readonly BROADCAST_CHANNEL_NAME: string = '__iodm_broadcast_channel__';
  models: Record<string, IModel>;
  plugins: Array<{ fn: PluginFn<any, any, any, any, any>; opt?: any }>;
  channel: BroadcastChannel;

  constructor() {
    this.models = {};
    this.plugins = [];
    this.channel = new BroadcastChannel(this.BROADCAST_CHANNEL_NAME);
  }

  /**
   * Registers a plugin to be applied to all models created after the plugin is registered.
   * 
   * @param fn - The plugin function to be registered. This function will be called with the schema of each model created after the plugin is registered.
   * @param opt - Optional options to be passed to the plugin function when it is called.
   */
  plugin(fn: PluginFn<any, any, any, any, any>, opt?: any) {
    this.plugins.push({ fn, opt });
  }

  private applyPlugins(newSchema: Schema) {
    this.plugins.forEach((plugin) => {
      newSchema.plugin(plugin.fn, plugin.opt);
    });
  }

  /**
   * Creates a new model with the given name and schema.
   * 
   * @example
   * ```ts
   * import iodm from 'iodm';
   * 
   * const userSchema = new Schema({
   *   name: String,
   *   age: Number,
   * });
   * 
   * const UserModel = iodm.model('User', userSchema);
   * UserModel.find({ name: 'John' }).then(users => console.log(users));
   * ```
   * 
   * @param name - The name of the model to be created.
   * @param schema - The schema for the model to be created.
   * @returns The created model.
   */
  model<TSchema extends Schema = any>(
    name: string,
    schema: TSchema
  ): IModel<
    InferSchemaType<TSchema>,
    ObtainSchemaGeneric<TSchema, 'TInstanceMethods'>,
    ObtainSchemaGeneric<TSchema, 'TVirtualProperties'>
  > &
    ObtainSchemaGeneric<TSchema, 'TStaticMethods'> {
    const NewModel: IModel = class extends AbstractModel { } as IModel;

    const newSchema = schema.clone();

    this.applyPlugins(newSchema);

    NewModel.syncModelToSchema({ name, schema: newSchema });

    return (this.models[name] = NewModel as any);
  }
}

/**
 * Instance of Iodm class. This is the default export of the package and can be used to create models and apply plugins.
 * 
 * @example
 * ```ts
 * import iodm from 'iodm';
 * 
 * const userSchema = new Schema({
 *   name: String,
 *   age: Number,
 * });
 * 
 * const UserModel = iodm.model('User', userSchema);
 * UserModel.find({ name: 'John' }).then(users => console.log(users));
 * ```
 */
export default new Iodm();
