import type { Schema } from '../Schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../Schema/types';
import type { IModel } from './types';

class AbstractModelTemp {
  /**
   * Model find method that overrieds the IQuery find method
   * @returns empty array
   */
  static find() {
    console.log('finding with update for browser IModel...');
    return [];
  }

  static findById() {
    console.log('findById with update for browser IModel...');
    return [];
  }
}

const AbstractModel = AbstractModelTemp as IModel;

function model<TSchema extends Schema = any>(
  name: string,
  schema?: TSchema
): IModel<
  InferSchemaType<TSchema>,
  ObtainSchemaGeneric<TSchema, 'TInstanceMethods'>
> &
  ObtainSchemaGeneric<TSchema, 'TStaticMethods'> {
  class NewModel extends AbstractModel {}

  return NewModel as any;
}

export { AbstractModel, model };
