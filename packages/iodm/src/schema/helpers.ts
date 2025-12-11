import type { SchemaOptions } from './types';

const sechemaOptionsDefault: SchemaOptions = {
  keyPath: '_id',
};

export const applySchemaOptionsDefaults = (
  options: Partial<SchemaOptions> = sechemaOptionsDefault
): SchemaOptions => {
  const newOptions = { ...sechemaOptionsDefault };

  (Object.keys(newOptions) as (keyof SchemaOptions)[]).forEach((key) => {
    newOptions[key] = options[key] ?? sechemaOptionsDefault[key];
  });

  return newOptions;
};
