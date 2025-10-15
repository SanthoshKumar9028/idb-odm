import type { Schema } from '../schema';

export interface ModelInstance {
  _new: boolean;
  _schema: Schema<any, {}, {}> | null;
  _storeName: string | null;
  _db: IDBDatabase | null;
  save(): Promise<any>;
  validate(): boolean;
  getSchema(): Schema<any, {}, {}> | null;
}

export interface IModel<TRawDocType = {}, TInstanceMethods = {}> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean
  ): TRawDocType & TInstanceMethods & ModelInstance;

  find(): never[];
  findById(): any;
}
