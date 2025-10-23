import { Query } from 'iodm-query';
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

  async save(): Promise<any> {
    this.validate();

    return new Query(
      this.getInstanceDB(),
      this.getInstanceStoreName()
    ).replaceOne(this.toJSON());
  }

  validate(): boolean {
    return this.getInstanceSchema().validate(this, {
      modelInstance: this,
    });
  }

  toJSON() {
    return this.getInstanceSchema().castFrom(this);
  }

  getInstanceSchema() {
    return AbstractModelTemp.getSchema(this);
  }

  getInstanceDB() {
    return AbstractModelTemp.getDB(this);
  }

  getInstanceStoreName() {
    return AbstractModelTemp.getStoreName(this);
  }

  // static properties and methods

  static _schema: Schema<any, {}, {}> | null;
  static _storeName: string | null;
  static _db: IDBDatabase | null;

  static getSchema(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _schema: Schema<any, {}, {}> | undefined = thisPrototype._schema;

    if (!_schema) {
      throw new Error('Schema is required');
    }
    return _schema;
  }

  static getDB(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _db: IDBDatabase | undefined = thisPrototype._db;

    if (!_db) {
      throw new Error('db is required');
    }
    return _db;
  }

  static getStoreName(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _storeName: string | undefined = thisPrototype._storeName;

    if (!_storeName) {
      throw new Error('db is required');
    }
    return _storeName;
  }

  /**
   * Model find method that overrieds the IQuery find method
   * @returns empty array
   */
  static find() {
    return new Query<any[], any>(this.getDB(), this.getStoreName()).find(
      undefined,
      {
        Constructor: this,
      }
    );
  }

  static findById(id: IDBValidKey) {
    return new Query<any, any>(this.getDB(), this.getStoreName()).findById(id, {
      Constructor: this,
    });
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
