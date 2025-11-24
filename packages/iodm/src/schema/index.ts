import type { QueryExecutorGetCommonOptions } from 'iodm-query';
import { BaseSchema, type BaseSchemaConstructorOptions } from './base-schema';
import { ArraySchema } from './non-primitive/array/index.ts';
import { RefSchema } from './non-primitive/ref/index.ts';
import {
  NumberSchema,
  type NumberSchemaConstructorOptions,
} from './primitive/number.ts';
import { StringSchema } from './primitive/string.ts';
import type { ValidateOptions } from './validation-rule/type.ts';
import { RefArraySchema } from './non-primitive/ref-array/index.ts';

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
  private refNames: string[];
  private tree: Record<string, BaseSchema>;
  private rawDefinition: SchemaDefinition<RawDocType>;

  constructor(definition: SchemaDefinition<RawDocType>) {
    super();

    this.rawDefinition = definition;
    this.tree = {};
    this.refNames = [];

    for (let prop in definition) {
      if ('type' in this.rawDefinition[prop]) {
        this.rawDefinition[prop] = {
          ...this.rawDefinition[prop],
        } as SchemaDefinitionValue;
      }

      this.tree[prop] = this.parseSchemaDefinition(prop, definition[prop]);
    }

    if (!this.tree['_id']) {
      this.tree['_id'] = new StringSchema({ name: '_id', required: true });
    }
  }

  private parseSchemaDefinition(
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
      if ('ref' in definition && definition['ref']) {
        this.refNames.push(definition.ref);

        return new RefSchema({
          name: prop,
          ref: definition.ref,
          valueSchema: new StringSchema(schemaOptions),
          required: definition.required,
        });
      }

      return new StringSchema(schemaOptions);
    } else if (constructor === Number) {
      const numberSchemaOptions: NumberSchemaConstructorOptions = schemaOptions;

      if ('min' in definition) {
        numberSchemaOptions.min = definition.min;
      }

      if ('ref' in definition && definition['ref']) {
        this.refNames.push(definition.ref);

        return new RefSchema({
          name: prop,
          ref: definition.ref,
          valueSchema: new NumberSchema(numberSchemaOptions),
          required: definition.required,
        });
      }

      return new NumberSchema(numberSchemaOptions);
    } else if (Array.isArray(constructor)) {
      if (constructor.length === 0) {
        throw new Error(`Array type must have a value type`);
      }

      if ('ref' in constructor[0] && constructor[0].ref) {
        this.refNames.push(constructor[0].ref);

        return new RefArraySchema({
          name: prop,
          ref: constructor[0].ref,
          valueSchema: this.parseSchemaDefinition(prop, constructor[0].type),
          required: constructor[0].required,
        });
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

  getRefNames() {
    return this.refNames;
  }

  clone() {
    return new Schema<RawDocType, TInstanceMethods, TStaticMethods>(
      this.rawDefinition
    );
  }

  async save(value: unknown, options: ValidateOptions) {
    if (!value || typeof value !== 'object') {
      throw new Error('value must be an Object');
    }

    for (const prop in this.tree) {
      await this.tree[prop].save(value[prop as keyof typeof value], options);
    }
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

  async preProcess(
    doc: Record<string, unknown>,
    options: QueryExecutorGetCommonOptions
  ) {
    const newDoc: Record<string, unknown> = {};

    for (const key in doc) {
      if (this.tree[key]) {
        newDoc[key] = await this.tree[key].preProcess(doc, options);
      }
    }
    return newDoc;
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
