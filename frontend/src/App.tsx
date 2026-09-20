import React from 'react';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './routes/AppRouter';

export function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
