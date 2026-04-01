import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} SmartFinance. Built for smarter personal finance management.
      </div>
    </footer>
  );
};
