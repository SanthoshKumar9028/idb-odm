import type { IQuery } from 'iodm-query';
import type { Schema } from '.';
import type { IfAny } from '../types';
import type { ModelInstance } from '../model/types';

export type ObtainSchemaGeneric<
  TSchema,
  alias extends 'DocType' | 'TInstanceMethods' | 'TStaticMethods',
> =
  TSchema extends Schema<
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

export type InjectFunctionContext<C, F> = F extends (...args: any) => any
  ? (this: C, ...args: Parameters<F>) => ReturnType<F>
  : F;

export type FindMiddlewareContext<T, HydratedDoc> =
  T extends Array<any>
    ? T[0]
    : T extends RegExp
      ? any
      : T extends 'save' | 'validate'
        ? HydratedDoc
        : IQuery<any, any>;

export interface SchemaOptions {
  keyPath: string;
}

export interface SchemaMethodOptions {
  modelInstance: ModelInstance;
}

export interface SchemaSaveMethodOptions extends SchemaMethodOptions {
  transaction: IDBTransaction;
}

export type PluginFn<
  RawDocType,
  TInstanceMethods,
  TStaticMethods,
  HydratedDoc,
> = (
  schema: Schema<RawDocType, TInstanceMethods, TStaticMethods, HydratedDoc>,
  opt?: any
) => void;

export interface BroadcastEnabledEventsOptions {
  // can be one of the options pre, post, both
  type: 'pre' | 'post' | 'both';
  prepare: (payload: any) => any;
}
