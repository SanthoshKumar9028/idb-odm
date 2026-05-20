import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { SchemaMethodOptions, SchemaSaveMethodOptions } from '../../types';
import type { QueryExecutorGetCommonOptions } from 'iodm-query';

import { Query } from 'iodm-query';
import { BaseSchema } from '../../base-schema';
import iodm from '../../../iodm';

export interface RefSchemaConstructorOptions extends BaseSchemaConstructorOptions {
  ref: string;
  valueSchema: BaseSchema;
}

export class RefSchema extends BaseSchema<RefSchemaConstructorOptions> {
  protected ref: string;
  protected valueSchema: BaseSchema;

  constructor(options: RefSchemaConstructorOptions) {
    super(options);

    this.ref = options.ref;
    this.valueSchema = options.valueSchema;
  }

  getRefModel() {
    if (!iodm.models[this.ref]) {
      throw new Error(`Ref ${this.ref} model is not created`);
    }

    return iodm.models[this.ref];
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const keyPath = this.getRefModel().getSchema().getSchemaOptions().keyPath;

    let indexPath = keyPath;

    if (value && typeof value === 'object') {
      if (options.path) {
        indexPath = `${options.path}.${indexPath}`;
      }

      return this.valueSchema.validate(value[keyPath as keyof typeof value], {
        ...options,
        path: indexPath,
      });
    }

    return this.valueSchema.validate(value, {
      ...options,
      path: options.path ?? keyPath,
    });
  }

  async save(value: unknown, options: SchemaSaveMethodOptions) {
    if (!value || typeof value !== 'object') return;

    const RefModel = this.getRefModel();

    const modelObj =
      value instanceof RefModel ? value : new RefModel(value, { isNew: false });

    try {
      return modelObj.save({ transaction: options.transaction });
    } catch (e) {
      options.transaction.abort();
      throw e;
    }
  }

  async preProcess(
    doc: Record<string, unknown>,
    options: QueryExecutorGetCommonOptions
  ) {
    if (
      this.name &&
      options.populateFields &&
      options.populateFields[this.name]
    ) {
      let subDocId = doc[this.name];

      if (typeof subDocId === 'string' || typeof subDocId === 'number') {
        const RefModel = this.getRefModel();

        return await new Query(options.idb, this.ref).findById(subDocId, {
          Constructor: RefModel,
          // need to remove the prefix for nested objects
          // populateFields: options.populateFields,
          transaction: options.transaction,
        });
      }
    }

    return this.name ? doc[this.name] : doc;
  }

  castFrom(value: unknown, options: SchemaMethodOptions): unknown {
    const keyPath = this.getRefModel().getSchema().getSchemaOptions().keyPath;
    let val = this.getFinalValue(value);

    if (val && typeof val === 'object') {
      return this.valueSchema.castFrom(
        val[keyPath as keyof typeof val],
        options
      );
    }

    return this.valueSchema.castFrom(val, options);
  }

  clone(): RefSchema {
    return new RefSchema(this.constructorOptions);
  }
}
