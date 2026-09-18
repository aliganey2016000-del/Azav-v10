import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './services/productionMutationGuard';
import './index.css';

const useDarkTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
document.documentElement.classList.toggle('dark', useDarkTheme);
document.documentElement.style.colorScheme = useDarkTheme ? 'dark' : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
