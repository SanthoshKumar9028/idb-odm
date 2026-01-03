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

  // defining all instance method props
  Object.entries(schema.methods).forEach(([key, func]) => {
    Object.defineProperty(NewModel.prototype, key, {
      value: func,
    });
  });

  // defining all statics method props
  Object.entries(schema.statics).forEach(([key, func]) => {
    Object.defineProperty(NewModel, key, {
      value: func,
    });
  });
}
