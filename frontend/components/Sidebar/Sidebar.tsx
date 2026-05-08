import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Zap, User, Settings } from 'lucide-react';

// Thanh điều hướng bên trái, chứa các liên kết đến các trang chức năng chính và logo thương hiệu.
export const Sidebar: React.FC = () => {
  const linkBaseClass = 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group';

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-[#13151f] border-r border-gray-100 dark:border-[#1f212e] h-screen p-6 sticky top-0 transition-all flex flex-col overflow-y-auto">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-[22px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">Smart</span>
          <span className="text-[10px] font-black tracking-[0.3em] text-indigo-600 dark:text-indigo-500 uppercase leading-none -mt-0.5">Finance</span>
        </div>
      </div>

      <div className="mb-4 px-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold">Menu chính</p>
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-[#1a1c26] hover:text-slate-900 dark:hover:text-slate-200'}`
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
              <span>Tổng quan</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-[#1a1c26] hover:text-slate-900 dark:hover:text-slate-200'}`
          }
        >
          {({ isActive }) => (
            <>
              <LineChart size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
              <span>Phân tích</span>
            </>
          )}
        </NavLink>
      </nav>

      <div className="pt-6 border-t border-gray-100 dark:border-[#1f212e]">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-[#1a1c26]'}`
          }
        >
          {({ isActive }) => (
            <>
              <User size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
              <span>Tài khoản</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
