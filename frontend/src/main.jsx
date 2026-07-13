import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import theme from './theme.config.js';

// Aplicar CSS custom properties do tema globalmente
const root = document.documentElement;
root.style.setProperty('--color-primary', theme.colors.primary);
root.style.setProperty('--color-secondary', theme.colors.secondary);
root.style.setProperty('--color-accent', theme.colors.accent);
root.style.setProperty('--color-background', theme.colors.background);
root.style.setProperty('--color-surface', theme.colors.surface);
root.style.setProperty('--color-text', theme.colors.text);
root.style.setProperty('--color-text-muted', theme.colors.textMuted);

// Atualizar meta theme-color com a cor primária do cliente
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.primary);
if (theme.restaurantName) document.title = theme.restaurantName;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
