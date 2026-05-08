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
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };


  return (
    <header className="bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-md shadow-sm dark:shadow-black/20 z-10 sticky top-0 border-b border-gray-100 dark:border-[#1f212e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Empty div or breadcrumbs could go here */}
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
