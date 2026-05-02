import type { IQuery } from 'iodm-query';
import type { PluginFn } from '../schema/types';
import { DateSchema } from '../schema/non-primitive/date';

export type TimestampOption =
  | undefined
  | null
  | boolean
  | {
      createdAt?: boolean | string;
      updatedAt?: boolean | string;
    };

const getKeyName = (
  opts: TimestampOption,
  curName: 'createdAt' | 'updatedAt'
) => {
  if (!opts) return '';

  return typeof opts === 'boolean' ||
    typeof opts[curName] !== 'string' ||
    !opts[curName]
    ? curName
    : opts[curName];
};

export const timestampsPlugin: PluginFn<any, any, any, any, any> = (
  schema,
  opts: TimestampOption
) => {
  if (!opts) return;

  const enableCreatedAt = typeof opts === 'boolean' ? opts : !!opts.createdAt;
  const createdAtKeyName = getKeyName(opts, 'createdAt');

  const enableUpdatedAt = typeof opts === 'boolean' ? opts : !!opts.updatedAt;
  const updatedAtKeyName = getKeyName(opts, 'updatedAt');

  if (enableCreatedAt || enableUpdatedAt) {
    schema.pre('insertMany', addCreatedAt);
    schema.pre('insertOne', addCreatedAt);
  }

  if (enableUpdatedAt) {
    schema.pre('replaceOne', addUpdatedAt);
    schema.pre('updateMany', addUpdatedAt);
    schema.pre('updateOne', addUpdatedAt);
    schema.pre('findByIdAndUpdate', addUpdatedAt);
  }

  if (enableCreatedAt) {
    schema.setSchemaFor(new DateSchema({ name: createdAtKeyName }));
  }

  if (enableUpdatedAt) {
    schema.setSchemaFor(new DateSchema({ name: updatedAtKeyName }));
  }

  function addCreatedAt(this: IQuery<any, any>) {
    switch (this.options.type) {
      case 'insertMany':
      case 'insertOne':
        const curDate = new Date();

        this.options.insertList.forEach((doc) => {
          if (doc && typeof doc === 'object') {
            if (enableCreatedAt) {
              doc[createdAtKeyName] = curDate;
            }

            if (enableUpdatedAt) {
              doc[updatedAtKeyName] = curDate;
            }
          }
        });
    }
  }

  function addUpdatedAt(this: IQuery<any, any>) {
    switch (this.options.type) {
      case 'updateMany':
      case 'updateOne':
      case 'findByIdAndUpdate':
        if (typeof this.options.payload === 'function') {
          const updater = this.options.payload;

          this.options.payload = (...args) => {
            const doc = updater(...args);
            if (doc && typeof doc === 'object') {
              doc[updatedAtKeyName] = new Date();
            }
            return doc;
          };
        } else {
          if (!this.options.payload.$set) {
            this.options.payload.$set = {};
          }

          this.options.payload.$set[updatedAtKeyName] = new Date();
        }
        break;

      case 'replaceOne':
        if (this.options.payload && typeof this.options.payload === 'object') {
          this.options.payload[updatedAtKeyName] = new Date();
        }
        break;
    }
  }
};
