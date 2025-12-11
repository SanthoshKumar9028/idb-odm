import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { SchemaMethodOptions } from '../../types';
import type { QueryExecutorGetCommonOptions } from 'iodm-query';

import { BaseSchema } from '../../base-schema';
import { models } from '../../../models';
import { Query } from 'iodm-query';

export interface RefSchemaConstructorOptions
  extends BaseSchemaConstructorOptions {
  ref: string;
  valueSchema: BaseSchema;
}

export class RefSchema extends BaseSchema {
  protected ref: string;
  protected valueSchema: BaseSchema;
  protected subDocId: unknown;

  constructor(options: RefSchemaConstructorOptions) {
    super(options);

    this.ref = options.ref;
    this.valueSchema = options.valueSchema;
  }

  getRefModel() {
    if (!models[this.ref]) {
      throw new Error(`Ref ${this.ref} model is not created`);
    }

    return models[this.ref];
  }

  validate(value: unknown, options: SchemaMethodOptions): boolean {
    const keyPath = this.getRefModel().getSchema().getSchemaOptions().keyPath;

    if (value && typeof value === 'object') {
      return this.valueSchema.validate(
        value[keyPath as keyof typeof value],
        options
      );
    }

    return this.valueSchema.validate(value, options);
  }

  async save(value: unknown, _options: SchemaMethodOptions) {
    if (!value || typeof value !== 'object') return;

    const RefModel = this.getRefModel();

    const modelObj = value instanceof RefModel ? value : new RefModel(value);

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
        const RefModel = this.getRefModel();

        this.subDocId = subDocId;

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

    if (value && typeof value === 'object') {
      return this.valueSchema.castFrom(
        value[keyPath as keyof typeof value],
        options
      );
    }

    return this.valueSchema.castFrom(value ?? this.subDocId, options);
  }
}
