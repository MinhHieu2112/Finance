import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from local storage on mount (simple persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('smart_finance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('smart_finance_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smart_finance_user');
  };

  // If not logged in, show Auth Screen
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show Dashboard
  return <DashboardPage user={user} onLogout={handleLogout} />;
};

export default App;