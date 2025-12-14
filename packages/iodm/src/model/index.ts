import type {
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndUpdateOptions,
} from 'iodm-query';
import type {
  QueryExecutorUpdateManyUpdater,
  QueryRootFilter,
} from 'iodm-query/dist/QueryExecutor/type';
import type { Schema } from '../schema';
import type { InferSchemaType, ObtainSchemaGeneric } from '../schema/types';
import type {
  IModel,
  ModelInstance,
  ModelOptions,
  ModelSaveOptions,
} from './types';

import { Query } from 'iodm-query';
import { models } from '../models';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods
  private $_isNew: boolean;

  constructor(defaultValues: any, options?: ModelOptions) {
    this.$_isNew = options?.isNew ?? true;

    if (defaultValues && typeof defaultValues === 'object') {
      for (const key in defaultValues) {
        (this as any)[key] = defaultValues[key];
      }
    }
  }

  async save(options?: ModelSaveOptions): Promise<any> {
    const transaction = options?.transaction
      ? options.transaction
      : this.createInstanceTransaction('readwrite');

    try {
      this.validate();

      await this.getInstanceSchema().save(this, {
        transaction,
        ...this.getSchemaMethodOptions(),
      });

      let queryResult: unknown;

      if (this.$_isNew) {
        queryResult = await new Query(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).insertOne(this.toJSON(), {
          transaction,
          throwOnError: true,
        });

        this.$_isNew = false;
      } else {
        queryResult = await new Query(
          this.getInstanceDB(),
          this.getInstanceStoreName()
        ).replaceOne(this.toJSON(), {
          transaction,
        });
      }

      return queryResult;
    } catch (e) {
      if (!(e instanceof Event && e.type === 'error')) {
        transaction.abort();
      }
      throw e;
    }
  }

  validate(): boolean {
    return this.getInstanceSchema().validate(
      this,
      this.getSchemaMethodOptions()
    );
  }

  toJSON() {
    return this.getInstanceSchema().castFrom(
      this,
      this.getSchemaMethodOptions()
    );
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

  createInstanceTransaction(mode?: IDBTransactionMode) {
    return this.getInstanceDB().transaction(
      [this.getInstanceStoreName(), ...this.getInstanceSchema().getRefNames()],
      mode
    );
  }

  getSchemaMethodOptions() {
    return {
      modelInstance: this,
    };
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
      idb.createObjectStore(this._storeName, {
        keyPath: this.getSchema().getSchemaOptions().keyPath,
      });
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
  static find(filter?: QueryRootFilter) {
    return new Query<any[], any>(this.getDB(), this.getStoreName()).find(
      filter,
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
    payload: QueryExecutorUpdateManyUpdater<any>,
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

  static deleteOne(filter?: QueryRootFilter) {
    return new Query<any, any>(this.getDB(), this.getStoreName()).deleteOne(
      filter,
      {
        transaction: this.createTransaction('readwrite'),
      }
    );
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
