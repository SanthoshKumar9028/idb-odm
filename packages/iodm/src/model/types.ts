import type { Schema } from '../schema';

export interface ModelInstance {
  new: boolean;
  save(): Promise<any>;
  validate(): boolean;
}

export interface IModel<TRawDocType = {}, TInstanceMethods = {}> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean
  ): TRawDocType & TInstanceMethods & ModelInstance;

  schema: Schema;
  storeName: String;
  db: IDBDatabase;

  find(): never[];
  findById(): any;
}
