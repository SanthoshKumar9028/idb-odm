import type { IQuery } from 'iodm-query';
import type { Schema } from '.';
import type { IfAny } from '../types';

export type ObtainSchemaGeneric<
  TSchema,
  alias extends
    | 'DocType'
    | 'TInstanceMethods'
    | 'TVirtualProperties'
    | 'TStaticMethods',
> =
  TSchema extends Schema<
    infer DocType,
    infer TInstanceMethods,
    infer TVirtualProperties,
    infer TStaticMethods
  >
    ? {
        DocType: DocType;
        TInstanceMethods: TInstanceMethods;
        TVirtualProperties: TVirtualProperties;
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

export interface SchemaMethodOptions {}

export interface SchemaSaveMethodOptions extends SchemaMethodOptions {
  transaction: IDBTransaction;
}

export type PluginFn<
  RawDocType,
  TInstanceMethods,
  TVirtualProperties,
  TStaticMethods,
  HydratedDoc,
> = (
  schema: Schema<
    RawDocType,
    TInstanceMethods,
    TVirtualProperties,
    TStaticMethods,
    HydratedDoc
  >,
  opt?: any
) => void;

export interface BroadcastEnabledEventsOptions {
  // can be one of the options pre, post, both
  type: 'pre' | 'post' | 'both';
  prepare: (payload: any) => any;
}
