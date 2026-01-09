import type {
  Query,
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndUpdateOptions,
} from 'iodm-query';
import type { Schema } from '../schema';
import type {
  QueryExecutorDeleteManyResponse,
  QueryExecutorUpdateManyUpdater,
  QueryRootFilter,
} from 'iodm-query/dist/QueryExecutor/type';

export interface ModelSaveOptions {
  transaction?: IDBTransaction;
}

export interface ModelInstance {
  save(options?: ModelSaveOptions): Promise<any>;
  validate(): boolean;
  createInstanceTransaction(mode?: string): IDBTransaction;
}

export interface ModelOptions {
  isNew?: boolean;
}

export interface IModel<
  TRawDocType = {},
  TInstanceMethods = {},
  HydratedDoc = TRawDocType & TInstanceMethods & ModelInstance
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
  preProcess(doc: any, options: QueryExecutorGetCommonOptions): Promise<any>;
  onUpgradeNeeded(idb: IDBDatabase): void;
  syncModelToSchema({ name, schema }: { name: string; schema: Schema }): void;

  find(filter?: QueryRootFilter): Query<HydratedDoc[], unknown>;
  findById(id: IDBValidKey): Query<HydratedDoc, unknown>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: QueryExecutorUpdateManyUpdater<TRawDocType>,
    options?: QueryFindByIdAndUpdateOptions
  ): Query<HydratedDoc, unknown>;
  findByIdAndDelete(id: IDBValidKey): Query<HydratedDoc, unknown>;
  deleteOne(
    filter?: QueryRootFilter
  ): Query<QueryExecutorDeleteManyResponse, unknown>;
}
