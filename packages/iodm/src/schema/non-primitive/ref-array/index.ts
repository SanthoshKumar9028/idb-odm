import type { BaseSchemaConstructorOptions } from '../../base-schema';
import type { SchemaMethodOptions, SchemaSaveMethodOptions } from '../../types';
import type { QueryExecutorGetCommonOptions } from 'iodm-query';

import { BaseSchema } from '../../base-schema';
import { models } from '../../../models';
import { Query } from 'iodm-query';
import { RefSchema } from '../ref';

export interface RefArraySchemaConstructorOptions
  extends BaseSchemaConstructorOptions {
  ref: string;
  valueSchema: BaseSchema;
}

export class RefArraySchema extends RefSchema {
  validate(value: unknown, options: SchemaMethodOptions): boolean {
    this.validationRules.forEach((rule) => rule.validate(value, options));

    if (!Array.isArray(value)) return true;

    return value.every((v) => super.validate(v, options));
  }

  async save(value: unknown, options: SchemaSaveMethodOptions) {
    if (!Array.isArray(value)) return;
    return Promise.all(value.map((v) => super.save(v, options)));
  }

  async preProcess(
    doc: Record<string, unknown>,
    options: QueryExecutorGetCommonOptions
  ) {
    const populateFieldsSet = new Set();

    if (this.name && options.populateFields) {
      for (const field in options.populateFields) {
        if (field == this.name || field.startsWith(`${this.name}.`)) {
          populateFieldsSet.add(field);
        }
      }
    }

    const subDocIds = this.name ? doc[this.name] : doc;

    if (this.name && Array.isArray(subDocIds) && populateFieldsSet.size > 0) {
      return await Promise.all(
        subDocIds.map((subDocId, i) => {
          if (typeof subDocId !== 'string' && typeof subDocId !== 'number') {
            return subDocId;
          }

          if (!models[this.ref]) {
            throw new Error(`Ref ${this.ref} model is not created`);
          }

          if (
            !populateFieldsSet.has(this.name) &&
            !populateFieldsSet.has(`${this.name}.${i}`)
          ) {
            return subDocId;
          }

          return new Query(options.idb, this.ref).findById(subDocId, {
            Constructor: models[this.ref],
            // need to remove the prefix for nested objects
            // populateFields: options.populateFields,
            transaction: options.transaction,
          });
        })
      );
    }

    return subDocIds;
  }

  castFrom(value: unknown, options: SchemaMethodOptions): unknown {
    if (!Array.isArray(value)) return undefined;

    return value.map((v) => super.castFrom(v, options));
  }
}
