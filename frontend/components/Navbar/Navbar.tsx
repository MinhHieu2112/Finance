import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../../types/Users';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2">
            <span className="text-white font-bold text-lg">SF</span>
          </div>
          <span className="text-xl font-bold text-gray-800">SmartFinance</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <UserIcon size={16} />
            <span className="text-sm font-medium">{user.username}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-danger transition-colors rounded-full hover:bg-gray-100"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
