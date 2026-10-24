import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppStoreProvider } from './store/context';
import { App } from './ui/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppStoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppStoreProvider>
  </React.StrictMode>
);
