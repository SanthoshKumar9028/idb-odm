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
} from 'iodm-query';
import type { Schema } from '../schema';

export interface ModelSaveOptions {
  transaction?: IDBTransaction;
}

export interface ModelInstance {
  save(options?: ModelSaveOptions): Promise<any>;
  validate(): boolean;
  createInstanceTransaction(mode?: string): IDBTransaction;
  toJSON(): Record<string, any>;
}

export interface ModelOptions {
  isNew?: boolean;
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
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options?: QueryUpdateManyOptions
  ): Query<QueryExecutorUpdateManyResponse, DocumentType>;
  updateOne(
    filter: QueryRootFilter,
    payload: QueryExecutorUpdateManyUpdater<DocumentType>,
    options?: QueryUpdateOneOptions
  ): Query<QueryExecutorUpdateManyResponse, DocumentType>;
  deleteMany(
    filter?: QueryRootFilter,
    options?: QueryDeleteManyOptions
  ): Query<QueryExecutorDeleteManyResponse, DocumentType>;
  deleteOne(
    filter?: QueryRootFilter,
    options?: QueryDeleteOneOptions
  ): Query<QueryExecutorDeleteManyResponse, DocumentType>;
  findByIdAndDelete(
    id: IDBValidKey,
    options?: QueryFindByIdAndDeleteOptions
  ): Query<HydratedDoc, DocumentType>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: QueryExecutorUpdateManyUpdater<TRawDocType>,
    options?: QueryFindByIdAndUpdateOptions
  ): Query<HydratedDoc, DocumentType>;
  countDocuments(
    filter?: QueryRootFilter,
    options?: QueryCountDocumentsOptions
  ): Query<number, DocumentType>;
}

export interface PostMessage {
  model: string;
  type: 'pre' | 'post';
  event: string;
  payload: any;
}
