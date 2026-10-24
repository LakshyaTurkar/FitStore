import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ServerWakeGate from './components/ServerWakeGate';
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Waits for the (possibly sleeping) server before the app makes its first API calls. */}
    <ServerWakeGate>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ServerWakeGate>
  </StrictMode>,
);
