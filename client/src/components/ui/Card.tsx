import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 ${
        hoverable
          ? 'hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

