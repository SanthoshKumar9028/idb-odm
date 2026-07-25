import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureIDB } from 'iodm';
import './index.css';
import App from './App.tsx';
import { UserModel, ProductModel, CartModel, AssertModel } from './models.ts';

configureIDB({
  db: 'test-db',
  version: 3,
  models: [UserModel, ProductModel, CartModel, AssertModel],
  onSuccess(idb) {
    console.log('onSuccess', idb);
  },
}).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
