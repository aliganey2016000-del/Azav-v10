import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './services/productionMutationGuard';
import './index.css';

const storedTheme = window.localStorage.getItem('azaam_theme');
const useDarkTheme = storedTheme === 'dark';
document.documentElement.classList.toggle('dark', useDarkTheme);
document.documentElement.style.colorScheme = useDarkTheme ? 'dark' : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
