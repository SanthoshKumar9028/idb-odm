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
}).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
