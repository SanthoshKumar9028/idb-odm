import type { Schema } from '../schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../schema/types';
import type { IModel, ModelInstance } from './types';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods
  _new!: boolean;
  _schema!: Schema<any, {}, {}> | null;
  _storeName!: string | null;
  _db!: IDBDatabase | null;

  constructor(defaultValues: any) {
    const thisPrototype = Object.getPrototypeOf(this);
    this._schema = thisPrototype._schema;
    this._storeName = thisPrototype._storeName;
    this._db = thisPrototype._db;

    if (defaultValues && typeof defaultValues === 'object') {
      for (const key in defaultValues) {
        (this as any)[key] = defaultValues[key];
      }
    }
  }

  save(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  validate(): boolean {
    return this.getSchema().validate(this, {
      modelInstance: this,
    });
  }

  toJSON() {
    console.log('model toJSON is called')
    return this.getSchema().castFrom(this);
  }

  getSchema() {
    if (!this._schema) {
      throw new Error('Schema is required');
    }
    return this._schema;
  }

  // static properties and methods
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

  NewModel.prototype._schema = schema.clone();
  NewModel.prototype._storeName = name;

  return NewModel as any;
}

export { AbstractModel, model };
