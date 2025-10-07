import type { Schema } from '../schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../schema/types';
import type { IModel, ModelInstance } from './types';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods
  new: boolean;
  constructor() {
    this.new = false;
  }
  save(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  validate(): boolean {
    return AbstractModelTemp.schema.validate(this, {
      modelInstance: this,
    });
  }

  // static properties and methods
  static schema: Schema<any, {}, {}>;
  static storeName: String;
  static db: IDBDatabase;

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
};

function model<TSchema extends Schema = any>(
  name: string,
  schema: TSchema
): IModel<
  InferSchemaType<TSchema>,
  ObtainSchemaGeneric<TSchema, 'TInstanceMethods'>
> &
  ObtainSchemaGeneric<TSchema, 'TStaticMethods'> {
  class NewModel extends AbstractModel {}

  NewModel.storeName = name;
  NewModel.schema = schema.clone();

  return NewModel as any;
}

export { AbstractModel, model };
