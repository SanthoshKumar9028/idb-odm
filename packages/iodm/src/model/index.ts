import type {
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndUpdateOptions,
} from 'iodm-query';
import { Query } from 'iodm-query';
import type { Schema } from '../schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../schema/types';
import type { IModel, ModelInstance } from './types';
import { models } from '../models';

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

    await this.getInstanceSchema().save(this, {
      modelInstance: this,
    });

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

  static setDB(idb: IDBDatabase) {
    this._db = idb;
  }

  static getStoreName(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _storeName: string | undefined = thisPrototype._storeName;

    if (!_storeName) {
      throw new Error('db is required');
    }
    return _storeName;
  }

  static init(idb: IDBDatabase) {
    this.setDB(idb);
  }

  static onUpgradeNeeded(idb: IDBDatabase) {
    if (this._storeName && !idb.objectStoreNames.contains(this._storeName)) {
      idb.createObjectStore(this._storeName);
    }
  }

  static async preProcess(doc: any, options: QueryExecutorGetCommonOptions) {
    if (!doc || typeof doc !== 'object') return doc;

    return this.getSchema().preProcess(doc, options);
  }

  private static createTransaction(mode?: IDBTransactionMode) {
    return this.getDB().transaction(
      [this.getStoreName(), ...this.getSchema().getRefNames()],
      mode
    );
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
        transaction: this.createTransaction('readonly'),
      }
    );
  }

  static findById(id: IDBValidKey) {
    return new Query<any, any>(this.getDB(), this.getStoreName()).findById(id, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
    });
  }

  static findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: any) => any,
    options?: QueryFindByIdAndUpdateOptions
  ) {
    return new Query<any, any>(
      this.getDB(),
      this.getStoreName()
    ).findByIdAndUpdate(id, payload, {
      Constructor: this,
      transaction: this.createTransaction('readwrite'),
      ...options,
    });
  }

  static findByIdAndDelete(id: IDBValidKey) {
    return new Query<any, any>(
      this.getDB(),
      this.getStoreName()
    ).findByIdAndDelete(id, {
      Constructor: this,
      transaction: this.createTransaction('readwrite'),
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

  return (models[name] = NewModel as any);
}

export { AbstractModel, model };
