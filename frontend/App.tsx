import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { AnalysisPage } from './pages/AnalysisPage/AnalysisPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CurrenciesPage } from './pages/CurrenciesPage';
import { DebtPage } from './pages/DebtPage';
import { ProfilePage } from './pages/ProfilePage/ProfilePage';
import Sidebar from './components/Sidebar/Sidebar';
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import { ToastModal } from './components/ToastModal/ToastModal';
import type { User } from './types/Users';

// Component chính điều hướng toàn bộ ứng dụng và quản lý trạng thái đăng nhập.
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

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

  // Xử lý lưu thông tin người dùng sau khi đăng nhập thành công.
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('smart_finance_user', JSON.stringify(newUser));
  };

  // Xử lý đăng xuất và xóa dữ liệu phiên làm việc.
  const handleLogout = () => {
    setIsLogoutConfirmOpen(false);
    setUser(null);
    localStorage.removeItem('smart_finance_user');
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f111a] transition-colors font-sans">
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
              <Navbar user={user} onLogout={() => setIsLogoutConfirmOpen(true)} />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage user={user} />} />
                  <Route path="/analysis" element={<AnalysisPage user={user} />} />
                  <Route path="/categories" element={<CategoriesPage user={user} />} />
                  <Route path="/currencies" element={<CurrenciesPage user={user} />} />
                  <Route path="/debt" element={<DebtPage user={user} />} />
                  <Route path="/profile" element={<ProfilePage user={user} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
          
          <ToastModal
            isOpen={isLogoutConfirmOpen}
            type="confirm"
            title="Xác nhận đăng xuất"
            message="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?"
            confirmText="Đăng xuất"
            cancelText="Hủy"
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogout}
          />
        </div>
      )}
    </>
  );
};

export default App;