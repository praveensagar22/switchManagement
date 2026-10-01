import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 focus:ring-cyan-500 border border-cyan-400/30',
    secondary:
      'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-sm focus:ring-slate-600',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-600/25 hover:shadow-rose-600/35 focus:ring-rose-500 border border-rose-400/30',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent hover:border-slate-700/60 focus:ring-slate-700'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs md:text-sm px-4 py-2 gap-2 font-medium',
    lg: 'text-sm md:text-base px-5 py-2.5 gap-2.5 font-semibold'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

