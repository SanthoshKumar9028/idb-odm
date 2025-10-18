import type { Schema } from '../schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../schema/types';
import type { IModel, ModelInstance } from './types';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods

  constructor(defaultValues: any) {
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
    return AbstractModelTemp.getSchema(this).validate(this, {
      modelInstance: this,
    });
  }

  toJSON() {
    return AbstractModelTemp.getSchema(this).castFrom(this);
  }

  // static properties and methods

  static _schema: Schema<any, {}, {}> | null;
  static _storeName: string | null;
  static _db: IDBDatabase | null;

  static getSchema(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _schema = thisPrototype._schema;

    if (!_schema) {
      throw new Error('Schema is required');
    }
    return _schema;
  }

  static getDB(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _db = thisPrototype._db;

    if (!_db) {
      throw new Error('db is required');
    }
    return _db;
  }

  /**
   * Model find method that overrieds the IQuery find method
   * @returns empty array
   */
  static find() {
    console.log('this.getDB()', this.getDB());
    console.log('this.getSchema()', this.getSchema());
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

  NewModel._schema = schema.clone();
  NewModel._storeName = name;

  return NewModel as any;
}

export { AbstractModel, model };
