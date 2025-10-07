import { BaseSchema } from './base-schema';
import { NumberSchema } from './primitive/number.ts';
import { StringSchema } from './primitive/string.ts';
import type { ValidateOptions } from './validation-rule/type.ts';

type SchemaDefinitionValue =
  | typeof String
  | typeof Number
  | { type: typeof String; required?: boolean }
  | { type: typeof Number; required?: boolean };

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

      switch (constructor) {
        case String:
          this.tree[prop] = new StringSchema();
          break;
        case Number:
          this.tree[prop] = new NumberSchema();
          break;
        default:
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
}
