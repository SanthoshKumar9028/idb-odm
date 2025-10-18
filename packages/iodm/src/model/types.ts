import type { Schema } from '../schema';

export interface ModelInstance {
  save(): Promise<any>;
  validate(): boolean;
}

export interface IModel<TRawDocType = {}, TInstanceMethods = {}> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean
  ): TRawDocType & TInstanceMethods & ModelInstance;

  _schema: Schema<any, {}, {}> | null;
  _storeName: string | null;
  _db: IDBDatabase | null;

  getSchema(): Schema<any, {}, {}>;
  getDB(): IDBDatabase;

  find(): Array<IModel<TRawDocType, TInstanceMethods>>;
  findById(): any;
}
