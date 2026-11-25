import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useEditorStore } from './stores/editorStore';
import './styles/global.css';

if (typeof window !== 'undefined') {
  (window as any).__xivigStores = {
    useEditorStore,
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
