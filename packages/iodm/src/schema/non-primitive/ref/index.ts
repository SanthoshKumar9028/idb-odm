import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { ValidateOptions } from '../../validation-rule/type';
import { BaseSchema } from '../../base-schema';
import { models } from '../../../models';
import { Query, type QueryExecutorGetCommonOptions } from 'iodm-query';

export interface RefSchemaConstructorOptions
  extends BaseSchemaConstructorOptions {
  ref: string;
  valueSchema: BaseSchema;
}

export class RefSchema extends BaseSchema {
  protected ref: string;
  protected valueSchema: BaseSchema;

  constructor(options: RefSchemaConstructorOptions) {
    super(options);

    this.ref = options.ref;
    this.valueSchema = options.valueSchema;
  }

  validate(value: unknown, options: ValidateOptions): boolean {
    if (value && typeof value === 'object' && '_id' in value) {
      return this.valueSchema.validate(value._id, options);
    }

    return this.valueSchema.validate(value, options);
  }

  async save(value: unknown, _options: ValidateOptions) {
    if (!value || typeof value !== 'object') return;
    if (!models[this.ref]) {
      throw new Error(`Ref ${this.ref} model is not created`);
    }

    const modelObj =
      value instanceof models[this.ref] ? value : new models[this.ref](value);

    modelObj.validate();
    return modelObj.save();
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
        if (!models[this.ref]) {
          throw new Error(`Ref ${this.ref} model is not created`);
        }

        return await new Query(options.idb, this.ref).findById(subDocId, {
          Constructor: models[this.ref],
          // need to remove the prefix for nested objects
          // populateFields: options.populateFields,
          transaction: options.transaction,
        });
      }
    }

    return this.name ? doc[this.name] : doc;
  }

  castFrom(value: unknown): unknown {
    if (value && typeof value === 'object' && '_id' in value) {
      return value._id && this.valueSchema.castFrom(value._id);
    }

    return value && this.valueSchema.castFrom(value);
  }
}
