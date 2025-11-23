import type {
  Query,
  QueryExecutorGetCommonOptions,
  QueryFindByIdAndUpdateOptions,
} from 'iodm-query';
import type { Schema } from '../schema';

export interface ModelInstance {
  save(): Promise<any>;
  validate(): boolean;
}

export interface IModel<
  TRawDocType = {},
  TInstanceMethods = {},
  HydratedDoc = TRawDocType & TInstanceMethods & ModelInstance
> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean
  ): HydratedDoc;

  _schema: Schema<any, {}, {}> | null;
  _storeName: string | null;
  _db: IDBDatabase | null;

  getSchema(): Schema<any, {}, {}>;
  getDB(): IDBDatabase;
  getStoreName(): string;
  preProcess(doc: any, options: QueryExecutorGetCommonOptions): Promise<any>;

  find(): Query<HydratedDoc[], unknown>;
  findById(id: IDBValidKey): Query<HydratedDoc, unknown>;
  findByIdAndUpdate(
    id: IDBValidKey,
    payload: (param: TRawDocType) => TRawDocType,
    options?: QueryFindByIdAndUpdateOptions
  ): Query<HydratedDoc, unknown>;
  findByIdAndDelete(id: IDBValidKey): Query<HydratedDoc, unknown>;
}
