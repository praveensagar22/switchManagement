import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeAlertCount = 0 }) => {
  const navItems = [
    { name: 'NOC Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Switch Inventory', path: '/switches', icon: Server },
    {
      name: 'Active Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined
    },
    { name: 'Event Audit Log', path: '/events', icon: History },
    { name: 'System & Trap Daemon', path: '/system', icon: Activity }
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0c111e]/60 backdrop-blur-md p-4 flex flex-col hidden md:flex h-full overflow-y-auto flex-shrink-0">
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
          Network Operations
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
