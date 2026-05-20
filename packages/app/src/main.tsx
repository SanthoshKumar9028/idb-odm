import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureIDB } from 'iodm';
import './index.css';
import App from './App.tsx';
import { UserModel, ProductModel, CartModel } from './models.ts';

configureIDB({
  db: 'test-db',
  version: 2,
  models: [UserModel, ProductModel, CartModel],
}).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
