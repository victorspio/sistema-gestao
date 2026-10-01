import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './styles/globals.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// Previne globalmente que o scroll do mouse altere valores em campos numéricos (type="number")
document.addEventListener(
  'wheel',
  (event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.tagName === 'INPUT' &&
      event.target.type === 'number'
    ) {
      event.target.blur();
    }
  },
  { capture: true, passive: true }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Registra o Service Worker para atualizações automáticas
registerServiceWorker();