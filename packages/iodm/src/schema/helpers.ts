import type { SchemaOptions } from './types';

const schemaOptionsDefault: SchemaOptions = {
  keyPath: '_id',
};

export const applySchemaOptionsDefaults = (
  options: Partial<SchemaOptions> = schemaOptionsDefault
): SchemaOptions => {
  const newOptions = { ...schemaOptionsDefault };

  (Object.keys(newOptions) as (keyof SchemaOptions)[]).forEach((key) => {
    newOptions[key] = options[key] ?? schemaOptionsDefault[key];
  });

  return newOptions;
};
