import { BaseSchema, type BaseSchemaConstructorOptions } from './base-schema';
import { ArraySchema } from './non-primitive/array/index.ts';
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
  | SchemaDefinitionValue[]
  | { type: typeof String; required?: boolean; ref?: string }
  | { type: typeof Number; required?: boolean; min?: number; ref?: string }
  | { type: SchemaDefinitionValue[]; required?: boolean };

type SchemaDefinition<RawDocType> = Record<
  keyof RawDocType,
  SchemaDefinitionValue
>;

export class Schema<
  RawDocType = any,
  TInstanceMethods = {},
  TStaticMethods = {}
> extends BaseSchema {
  private tree: Record<string, BaseSchema>;
  private rawDefinition: SchemaDefinition<RawDocType>;

  constructor(definition: SchemaDefinition<RawDocType>) {
    super();

    this.rawDefinition = definition;
    this.tree = {};

    for (let prop in definition) {
      if ('type' in this.rawDefinition[prop]) {
        this.rawDefinition[prop] = {
          ...this.rawDefinition[prop],
        } as SchemaDefinitionValue;
      }

      this.tree[prop] = this.parseSchemaDefinition(prop, definition[prop]);
    }
  }

  parseSchemaDefinition(
    prop: string,
    definition: SchemaDefinitionValue
  ): BaseSchema {
    const constructor = 'type' in definition ? definition.type : definition;

    const schemaOptions: BaseSchemaConstructorOptions = {
      name: prop,
      required: undefined,
    };

    if ('type' in definition) {
      schemaOptions.required = definition.required;
    }

    if (constructor === String) {
      return new StringSchema(schemaOptions);
    } else if (constructor === Number) {
      const numberSchemaOptions: NumberSchemaConstructorOptions = schemaOptions;

      if ('min' in definition) {
        numberSchemaOptions.min = definition.min;
      }

      return new NumberSchema(numberSchemaOptions);
    } else if (Array.isArray(constructor)) {
      if (constructor.length === 0) {
        throw new Error(`Array type must have a value type`);
      }

      return new ArraySchema({
        valueSchema: this.parseSchemaDefinition(prop, constructor[0]),
        ...schemaOptions,
      });
    } else if (constructor instanceof Schema) {
      return constructor.clone();
    }

    throw new Error(`Type for ${prop} is not supported`);
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
