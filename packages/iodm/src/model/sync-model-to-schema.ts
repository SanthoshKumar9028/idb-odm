import type { IModel } from './types';

export function syncModelToSchema<T extends IModel>(NewModel: T) {
  const schema = NewModel.getSchema();

  // defining all virtual props
  Object.entries(schema.virtuals).forEach(([key, virtualType]) => {
    Object.defineProperty(NewModel.prototype, key, {
      get() {
        return virtualType.applyGetters(this, {
          modelInstance: this,
        });
      },
      set(value) {
        return virtualType.applySetters(this, {
          modelInstance: this,
          value,
        });
      },
    });
  });
}
