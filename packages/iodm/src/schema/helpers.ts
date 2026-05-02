import type { SchemaOptions } from './types';

const schemaOptionsDefault: SchemaOptions = {
  keyPath: '_id',
};

export const applySchemaOptionsDefaults = (
  options: Partial<SchemaOptions> = schemaOptionsDefault
): SchemaOptions => {
  const newOptions = { ...schemaOptionsDefault };

  newOptions.keyPath = options.keyPath ?? schemaOptionsDefault.keyPath;

  return newOptions;
};
