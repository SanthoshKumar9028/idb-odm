import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureIDB } from 'iodm';
import './index.css';
import App from './App.tsx';
import { AddressModel, UserModel } from './models.ts';

configureIDB({
  db: 'test-db',
  version: 1,
  models: [AddressModel, UserModel],
  onupgradeneeded: (ev) => {
    // if (!ev.result) return;
    // const db = ev.result;
    // const store = db.createObjectStore('User', {
    //   keyPath: '_id',
    // });
    // for (let i = 1; i < 3; ++i) {
    //   store.add({
    //     _id: String(i),
    //     name: 'user ' + i,
    //   });
    // }
    // const address = db.createObjectStore('Address', {
    //   keyPath: '_id',
    // });
  },
}).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
