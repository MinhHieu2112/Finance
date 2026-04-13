import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { AnalysisPage } from './pages/AnalysisPage/AnalysisPage';
import Sidebar from './components/Sidebar/Sidebar';
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import type { User } from './types/Users';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from local storage on mount (simple persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('smart_finance_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as Partial<User>;
      if (parsedUser.id && parsedUser.username && parsedUser.email && parsedUser.token) {
        setUser(parsedUser as User);
      } else {
        localStorage.removeItem('smart_finance_user');
      }
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

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
              <Navbar user={user} onLogout={handleLogout} />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage user={user} />} />
                  <Route path="/analysis" element={<AnalysisPage user={user} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;