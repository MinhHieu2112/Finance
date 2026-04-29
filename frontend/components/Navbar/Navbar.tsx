import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import type { NavbarProps } from './types';
import { api } from '../../lib/api';

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for dark mode
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark');
    }


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
