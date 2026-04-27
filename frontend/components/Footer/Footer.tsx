import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 dark:text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} SmartFinance. Được thiết kế để quản lý tài chính cá nhân thông minh hơn..
      </div>
    </footer>
  );
};
