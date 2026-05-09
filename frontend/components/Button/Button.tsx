import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant   ?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading ?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant   = 'primary', 
  className = '', 
  isLoading = false,
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary   : "bg-primary text-white hover:bg-opacity-90 focus:ring-primary/50 shadow-md shadow-primary/20",
    secondary : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-gray-300",
    danger    : "bg-danger text-white hover:bg-red-600 focus:ring-red-500 shadow-md shadow-red-500/20",
    ghost     : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800",
  };

  return (
    <button 
      className = {`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled  = {isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      ) : null}
      {children}
    </button>
  );
};
