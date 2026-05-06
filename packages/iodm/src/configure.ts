import type { IModel } from './model/types';

export interface ConfigureIndexedDBProps {
  db: string;
  version: number;
  models: Array<IModel<any, any, any>>;
  onUpgradeNeededPre?: (event: IDBOpenDBRequest) => any;
  onUpgradeNeededPost?: (event: IDBOpenDBRequest) => any;
}

/**
 * Configures the IndexedDB database to be used by the models. 
 * This function should be called before using any models to ensure that the database is properly set up.
 * 
 * @example
 * ```ts
 * import { createRoot } from 'react-dom/client';
 * import { configureIDB } from 'iodm';
 * import UserModel from './models/UserModel';
 * import App from './App';
 * 
 * const config = {
 *   db: 'MyDB',
 *   version: 1,
 *   models: [UserModel],
 * };
 * 
 * configureIDB(config).then((db) => {
 *   createRoot(document.getElementById('app')!).render(<App />);
 * }).catch((error) => {
 *   createRoot(document.getElementById('app')!).render(<div>Error configuring database</div>);
 * });
 * ```
 * 
 * @example
 * ```ts
 * // Using the returned promise directly in a React component with Suspense
 * import { use } from 'react';
 * import { configureIDB } from 'iodm';
 * import UserModel from './models/UserModel';
 * 
 * const config = {
 *   db: 'MyDB',
 *   version: 1,
 *   models: [UserModel],
 * };
 * 
 * const dbPromise = configureIDB(config);
 * 
 * function App() {
 *    use(dbPromise);
 * 
 *   // rest of the app
 * }
 * ```
 * 
 * @param config - The configuration object for setting up the IndexedDB database. It includes the name and version of the database, the models to be used, and optional callbacks for handling the upgrade process.
 * @returns A promise that resolves to the configured IDBDatabase instance once the database is successfully opened and configured.
 */
export const configureIDB = async (
  config: ConfigureIndexedDBProps
): Promise<IDBDatabase> => {
  const { models, db, version, onUpgradeNeededPost, onUpgradeNeededPre } =
    config;

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
      onUpgradeNeededPre && onUpgradeNeededPre(this);

      models.forEach((model) => {
        model.onUpgradeNeeded(this.result);
      });

      onUpgradeNeededPost && onUpgradeNeededPost(this);
    };
  });
};
