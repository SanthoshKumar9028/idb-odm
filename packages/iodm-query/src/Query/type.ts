export interface IBaseQuery<ResultType> {
  find(query: { $query: any }, options?: { transaction?: IDBTransaction }): IBaseQuery<ResultType>;
  findById(id: any, options?: { transaction?: IDBTransaction }): IBaseQuery<ResultType>;
}

export type TQueryKeys = keyof { [K in keyof IBaseQuery<unknown> as `_${K}`]: unknown };

export interface IQuery<ResultType> extends IBaseQuery<ResultType> {
  then(
    onFulfilled?: (value: ResultType) => any | Promise<any>,
    onRejected?: (reason: any) => any | PromiseLike<any>
  ): Promise<ResultType>
}