export interface IModel<TRawDocType = {}, TInstanceMethods = {}> {
  new <DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean
  ): TRawDocType & TInstanceMethods;
  
  find(): never[];
  findById(): any;
}
