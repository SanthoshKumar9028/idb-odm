import type { Schema } from '.';
import type { IfAny } from '../types';
import type { ModelInstance } from '../model/types';

export type ObtainSchemaGeneric<
  TSchema,
  alias extends 'DocType' | 'TInstanceMethods' | 'TStaticMethods'
> = TSchema extends Schema<
  infer DocType,
  infer TInstanceMethods,
  infer TStaticMethods
>
  ? {
      DocType: DocType;
      TInstanceMethods: TInstanceMethods;
      TStaticMethods: TStaticMethods;
    }[alias]
  : unknown;

export type InferSchemaType<TSchema> = IfAny<
  TSchema,
  any,
  ObtainSchemaGeneric<TSchema, 'DocType'>
>;

export interface SchemaOptions {
  keyPath: string;
}

export interface SchemaMethodOptions {
  modelInstance: ModelInstance;
}

export interface SchemaSaveMethodOptions extends SchemaMethodOptions {
  transaction: IDBTransaction;
}
