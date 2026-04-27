import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const linkBaseClass = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200';

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-screen p-4 sticky top-0 transition-colors">
      <div className="mb-4 px-2">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Điều hướng</p>
      </div>

      <nav className="space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-slate-200'}`
          }
        >
          <LayoutDashboard size={18} />
          <span>Tổng quan</span>
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-slate-200'}`
          }
        >
          <LineChart size={18} />
          <span>Phân tích</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
