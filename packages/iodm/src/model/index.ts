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

import { MiddlewareExecutor, AbstractQuery, Query } from 'iodm-query';
import { models } from '../models';
import {
  documentMiddlewareKeys,
  queryMiddlewareKeys,
} from '../schema/constants';

const AbstractModel: IModel = class AbstractModelTemp implements ModelInstance {
  // instance properties and methods
  private $_isNew: boolean;
  private documentMiddleware: MiddlewareExecutor;

  constructor(defaultValues: any, options?: ModelOptions) {
    this.$_isNew = options?.isNew ?? true;
    this.documentMiddleware = Object.getPrototypeOf(this).documentMiddleware;

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
      this.documentMiddleware.execPre('validate', this);
      this.validate();
      this.documentMiddleware.execPost('validate', this);

      this.documentMiddleware.execPre('save', this);

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

      queryResult = this.documentMiddleware.execPost('save', this, queryResult);

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

  private static schema: Schema<any, {}, {}> | null;
  private static storeName: string | null;
  private static db: IDBDatabase | null;
  private static Query: typeof Query<any, any>;

  static getSchema(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _schema: Schema<any, {}, {}> | undefined = thisPrototype.schema;

    if (!_schema) {
      throw new Error('Schema is required');
    }
    return _schema;
  }

  static getDB(obj?: any) {
    const _db = obj ? Object.getPrototypeOf(obj).constructor.db : this.db;

    if (!_db) {
      throw new Error('db is required');
    }
    return _db;
  }

  static setDB(idb: IDBDatabase) {
    this.db = idb;
  }

  static getStoreName(obj?: any) {
    const thisPrototype = obj ? Object.getPrototypeOf(obj).constructor : this;
    const _storeName: string | undefined = thisPrototype.storeName;

    if (!_storeName) {
      throw new Error('db is required');
    }
    return _storeName;
  }

  static init(idb: IDBDatabase) {
    this.setDB(idb);
  }

  static onUpgradeNeeded(idb: IDBDatabase) {
    if (this.storeName && !idb.objectStoreNames.contains(this.storeName)) {
      idb.createObjectStore(this.storeName, {
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
    return new this.Query(this.getDB(), this.getStoreName()).find(filter, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
    });
  }

  static findById(id: IDBValidKey) {
    return new this.Query(this.getDB(), this.getStoreName()).findById(id, {
      Constructor: this,
      transaction: this.createTransaction('readonly'),
    });
  }

  static findByIdAndUpdate(
    id: IDBValidKey,
    payload: QueryExecutorUpdateManyUpdater<any>,
    options?: QueryFindByIdAndUpdateOptions
  ) {
    return new this.Query(this.getDB(), this.getStoreName()).findByIdAndUpdate(
      id,
      payload,
      {
        Constructor: this,
        transaction: this.createTransaction('readwrite'),
        ...options,
      }
    );
  }

  static findByIdAndDelete(id: IDBValidKey) {
    return new this.Query(this.getDB(), this.getStoreName()).findByIdAndDelete(
      id,
      {
        Constructor: this,
        transaction: this.createTransaction('readwrite'),
      }
    );
  }

  static deleteOne(filter?: QueryRootFilter) {
    return new this.Query(this.getDB(), this.getStoreName()).deleteOne(filter, {
      transaction: this.createTransaction('readwrite'),
    });
  }

  static syncModelToSchema({ name, schema }: { name: string; schema: Schema }) {
    if (this.schema) return;

    const newSchema = schema.clone();
    this.schema = newSchema;
    this.storeName = name;

    // defining all virtual props
    Object.entries(newSchema.virtuals).forEach(([key, virtualType]) => {
      Object.defineProperty(this.prototype, key, {
        get() {
          return virtualType.applyGetters(this, {
            modelInstance: this,
          });
        },
        set(value) {
          return virtualType.applySetters(this, {
            modelInstance: this,
            value,
          });
        },
      });
    });

    // defining all instance method props
    Object.entries(newSchema.methods).forEach(([key, func]) => {
      Object.defineProperty(this.prototype, key, {
        value: func,
      });
    });

    // defining all statics method props
    Object.entries(newSchema.statics).forEach(([key, func]) => {
      Object.defineProperty(this, key, {
        value: func,
      });
    });

    // defining document middleware executor for the model
    this.prototype.documentMiddleware = newSchema.middleware.filter((name) => {
      return documentMiddlewareKeys.includes(name);
    });

    // defining new Query constructor for the model
    this.Query = class extends AbstractQuery {
      // Query middleware executor
      middleware: MiddlewareExecutor = newSchema.middleware.filter((name) => {
        return queryMiddlewareKeys.includes(name);
      });
    };
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

  NewModel.syncModelToSchema({ name, schema });

  return (models[name] = NewModel as any);
}

export { AbstractModel, model };
