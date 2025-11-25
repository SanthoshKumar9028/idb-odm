import type { IModel } from './model/types';

interface ConfigureIndexedDBProps {
  db: string;
  version: number;
  models: Array<IModel>;
  onupgradeneeded?: (event: IDBOpenDBRequest) => any;
}

export const configureIDB = async (
  config: ConfigureIndexedDBProps
): Promise<IDBDatabase> => {
  const { models, db, version, onupgradeneeded } = config;

  return new Promise((res, rej) => {
    const openReq = indexedDB.open(db, version);

    openReq.onerror = rej;

    openReq.onsuccess = function () {
      models.forEach((model) => {
        model.init(this.result);
      });

      res(this.result);
    };

    openReq.onupgradeneeded = function () {
      models.forEach((model) => {
        model.onUpgradeNeeded(this.result);
      });

      onupgradeneeded && onupgradeneeded(this);
    };
  });
};
