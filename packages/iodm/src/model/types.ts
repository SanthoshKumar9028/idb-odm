import type {
  Query,
  QueryDeleteOneOptions,
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndDeleteOptions,
  QueryFindByIdAndUpdateOptions,
  QueryFindByIdOptions,
  QueryFindOptions,
  QueryInsertManyOptions,
  QueryInsertOneOptions,
  QueryOpenCursorOptions,
  QueryExecutorDeleteManyResponse,
  QueryExecutorUpdateManyUpdater,
  QueryRootFilter,
  QueryReplaceOneOptions,
  QueryUpdateManyOptions,
  QueryExecutorUpdateManyResponse,
  QueryDeleteManyOptions,
  QueryCountDocumentsOptions,
  QueryUpdateOneOptions,
  MiddlewareFn,
} from 'iodm-query';
import type { Schema } from '../schema';
import type { SchemaSaveMethodOptions } from '../schema/types';
import type { MiddlewareKeys } from '../schema/constants';

export type ModelSaveOptions = Partial<SchemaSaveMethodOptions>;

export interface ModelInstance {
  save(options?: ModelSaveOptions): Promise<any>;
  validate(): boolean;
  createInstanceTransaction(mode?: string): IDBTransaction;
  toJSON(): Record<string, any> | undefined | null;
}

export interface ModelOptions {
  isNew?: boolean;
  defaults?: boolean;
}

export interface IModel<
  TRawDocType = {},
  TInstanceMethods = {},
  TVirtualProperties = {},
  HydratedDoc = TRawDocType &
    TInstanceMethods &
    ModelInstance &
    TVirtualProperties,
> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    options?: ModelOptions
  ): HydratedDoc;

  init(idb: IDBDatabase): void;
  getSchema(): Schema<any, {}, {}>;
  getDB(): IDBDatabase;
  setDB(idb: IDBDatabase): void;
  getStoreName(): string;
  createTransaction(mode?: IDBTransactionMode | undefined): IDBTransaction;
  preProcess(doc: any, options: QueryExecutorGetCommonOptions): Promise<any>;
  onUpgradeNeeded(idb: IDBDatabase): void;
  enableBroadcastFor(
    event: MiddlewareKeys,
    data: BroadcastEnabledEventsOptions
  ): void;
  disableBroadcastFor(event: MiddlewareKeys): void;
  addBroadcastHook(
    fn: MiddlewareFn<
      IModel<TRawDocType, TInstanceMethods>,
      MessageEvent<PostMessage>
    >
  ): void;
  removeBroadcastHook(
    fn: MiddlewareFn<
      IModel<TRawDocType, TInstanceMethods>,
      MessageEvent<PostMessage>
    >
  ): void;
  syncModelToSchema({ name, schema }: { name: string; schema: Schema }): void;

  openCursor(
    filter?: QueryRootFilter,
    options?: QueryOpenCursorOptions
  ): Query<
    {
      [Symbol.asyncIterator](): AsyncGenerator<
        HydratedDoc,
        { done: boolean } | undefined,
        unknown
      >;
    },
    unknown
  >;
  find(
    filter?: QueryRootFilter,
    options?: QueryFindOptions
  ): Query<HydratedDoc[], unknown>;
  findById(
    id: IDBValidKey,
    options?: QueryFindByIdOptions
  ): Query<HydratedDoc, unknown>;
  insertOne(
    doc: TRawDocType,
    options?: QueryInsertOneOptions
  ): Promise<unknown>;
  insertMany(
    doc: TRawDocType[],
    options?: QueryInsertManyOptions
  ): Promise<HydratedDoc[]>;
  replaceOne(
    doc: TRawDocType,
    options?: QueryReplaceOneOptions
  ): Promise<unknown>;
  updateMany(
    filter: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<TRawDocType>,
    options?: QueryUpdateManyOptions
  ): Query<QueryExecutorUpdateManyResponse, TRawDocType>;
  updateOne(
    filter: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<TRawDocType>,
    options?: QueryUpdateOneOptions
  ): Query<QueryExecutorUpdateManyResponse, TRawDocType>;
  deleteMany(
    filter?: QueryRootFilter,
    options?: QueryDeleteManyOptions
  ): Query<QueryExecutorDeleteManyResponse, TRawDocType>;
  deleteOne(
    filter?: QueryRootFilter,
    options?: QueryDeleteOneOptions
  ): Query<QueryExecutorDeleteManyResponse, TRawDocType>;
  findByIdAndDelete(
    id: IDBValidKey,
    options?: QueryFindByIdAndDeleteOptions
  ): Query<HydratedDoc, TRawDocType>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: QueryExecutorUpdateManyUpdater<TRawDocType>,
    options?: QueryFindByIdAndUpdateOptions
  ): Query<HydratedDoc, TRawDocType>;
  countDocuments(
    filter?: QueryRootFilter,
    options?: QueryCountDocumentsOptions
  ): Query<number, TRawDocType>;
}

export interface PostMessage {
  model: string;
  type: 'pre' | 'post';
  event: string;
  payload: any;
}

export interface BroadcastEnabledEventsOptions {
  type: 'pre' | 'post' | 'both';
  prepare: (payload: any) => any;
}
