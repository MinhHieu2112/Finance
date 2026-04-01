import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const linkBaseClass = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors';

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-0">
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Navigation</p>
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            `${linkBaseClass} ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`
          }
        >
          <LineChart size={18} />
          <span>Analysis</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
