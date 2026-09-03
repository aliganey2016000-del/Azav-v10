import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './routes/AppRouter';

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
