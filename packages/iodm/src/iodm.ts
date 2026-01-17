import type { IModel } from './model/types';
import type { Schema } from './schema';
import type {
  InferSchemaType,
  ObtainSchemaGeneric,
  PluginFn,
} from './schema/types';

import { AbstractModel } from './model';

class Iodm {
  models: Record<string, IModel> = {};
  plugins: Array<{ fn: PluginFn<any, any, any, any>; opt?: any }> = [];

  plugin(fn: PluginFn<any, any, any, any>, opt?: any) {
    this.plugins.push({ fn, opt });
  }

  private applyPlugins(newModel: IModel) {
    this.plugins.forEach((plugin) => {
      newModel.getSchema().plugin(plugin.fn, plugin.opt);
    });
  }

  model<TSchema extends Schema = any>(
    name: string,
    schema: TSchema
  ): IModel<
    InferSchemaType<TSchema>,
    ObtainSchemaGeneric<TSchema, 'TInstanceMethods'>
  > &
    ObtainSchemaGeneric<TSchema, 'TStaticMethods'> {
    const NewModel: IModel = class extends AbstractModel {} as IModel;

    NewModel.syncModelToSchema({ name, schema });

    this.applyPlugins(NewModel);

    return (this.models[name] = NewModel as any);
  }
}

export default new Iodm();
