import type { QueryInternalKeysMap } from './type';

export const queryInternalKeysMap: QueryInternalKeysMap = {
  _find: 'find',
  _openCursor: 'openCursor',
  _findById: 'findById',
  _insertOne: 'insertOne',
  _insertMany: 'insertMany',
  _replaceOne: 'replaceOne',
  _updateMany: 'updateMany',
  _updateOne: 'updateOne',
  _deleteMany: 'deleteMany',
  _deleteOne: 'deleteOne',
  _findByIdAndDelete: 'findByIdAndDelete',
  _findByIdAndUpdate: 'findByIdAndUpdate',
  _countDocuments: 'countDocuments',
};

export const queryKeys = Object.values(queryInternalKeysMap);
