import { BaseSchema, type BaseSchemaConstructorOptions } from './base-schema';
import {
  NumberSchema,
  type NumberSchemaConstructorOptions,
} from './primitive/number.ts';
import { StringSchema } from './primitive/string.ts';
import type { ValidateOptions } from './validation-rule/type.ts';

type SchemaDefinitionValue =
  | Schema
  | typeof String
  | typeof Number
  | { type: typeof String; required?: boolean }
  | { type: typeof Number; required?: boolean; min?: number };

export class Schema<
  RawDocType = any,
  TInstanceMethods = {},
  TStaticMethods = {}
> extends BaseSchema {
  private tree: Record<string, BaseSchema>;
  private rawDefinition: Record<keyof RawDocType, SchemaDefinitionValue>;

  constructor(definition: Record<keyof RawDocType, SchemaDefinitionValue>) {
    super();

    this.rawDefinition = definition;
    this.tree = {};

    for (let prop in definition) {
      if ('type' in this.rawDefinition[prop]) {
        this.rawDefinition[prop] = {
          ...this.rawDefinition[prop],
        } as SchemaDefinitionValue;
      }

      const constructor =
        'type' in definition[prop] ? definition[prop].type : definition[prop];

      const schemaOptions: BaseSchemaConstructorOptions = {
        name: prop,
        required: undefined,
      };

      if ('type' in definition[prop]) {
        schemaOptions.required = definition[prop].required;
      }

      if (constructor === String) {
        this.tree[prop] = new StringSchema(schemaOptions);
      } else if (constructor === Number) {
        const numberSchemaOptions: NumberSchemaConstructorOptions =
          schemaOptions;

        if ('min' in definition[prop]) {
          numberSchemaOptions.min = definition[prop].min;
        }

        this.tree[prop] = new NumberSchema(numberSchemaOptions);
      } else if (constructor instanceof Schema) {
        this.tree[prop] = constructor.clone();
      } else {
        throw new Error(`Type for ${prop} is not supported`);
      }
    }
  }

  clone() {
    return new Schema<RawDocType, TInstanceMethods, TStaticMethods>(
      this.rawDefinition
    );
  }

  validate(value: unknown, options: ValidateOptions) {
    if (!value || typeof value !== 'object') {
      throw new Error('value must be an Object');
    }

    for (const prop in this.tree) {
      this.tree[prop].validate(value[prop as keyof typeof value], options);
    }

    return true;
  }

  castFrom(value: unknown) {
    if (!value || typeof value !== 'object') {
      throw new Error('Cant cast value to object schema');
    }

    const obj: Record<string, any> = {};

    for (const key in this.tree) {
      obj[key] = this.tree[key].castFrom(value[key as keyof typeof value]);
    }

    return obj;
  }
}
