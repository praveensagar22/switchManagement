import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
  mono?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  mono = false,
  className = ''
}) => {
  const variantStyles = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10',
    blue: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/10',
    purple: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-sm shadow-indigo-500/10',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80'
  };

  const dotGlows = {
    green: 'bg-emerald-400 led-glow-emerald',
    red: 'bg-rose-400 led-glow-rose',
    amber: 'bg-amber-400 led-glow-amber',
    blue: 'bg-cyan-400 led-glow-cyan',
    purple: 'bg-indigo-400',
    slate: 'bg-slate-400'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide select-none ${
        mono ? 'font-mono' : ''
      } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${dotGlows[variant]}`}
        />
      )}
      {children}
    </span>
  );
};

