import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Bell, Moon, Sun } from 'lucide-react';
import type { NavbarProps } from './types';
import { api } from '../../lib/api';

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Check local storage for dark mode
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark');
    }

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-900/50 z-10 sticky top-0 border-b border-transparent dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2">
            <span className="text-white font-bold text-lg">SF</span>
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">SmartFinance</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/60"
            title="Đổi giao diện"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/60 relative"
              title="Thông báo"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/60 border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-slate-100">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Đánh dấu đã đọc</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">Không có thông báo nào</p>
                  ) : (
                    notifications.map(notification => (
                      <div key={notification._id} className={`p-3 border-b border-gray-50 dark:border-slate-700/50 ${notification.isRead ? 'opacity-60' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{notification.title}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/profile" className="hidden sm:flex items-center gap-2 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-600/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <UserIcon size={16} />
            <span className="text-sm font-medium">{user.username}</span>
          </Link>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 dark:text-slate-400 hover:text-danger transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/60"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
