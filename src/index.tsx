import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './app/providers/AuthContext';
import MainLayout from './app/layouts/MainLayout';
import './shared/styles/index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  </React.StrictMode>
);
