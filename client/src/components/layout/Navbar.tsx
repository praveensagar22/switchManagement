import React, { useState, useEffect } from 'react';
import { Network, Bell, Wifi, WifiOff, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getSocket } from '../../services/socket.ts';
import { Link } from 'react-router-dom';

interface NavbarProps {
  activeAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeAlertCount = 0 }) => {
  const { user, logout } = useAuth();
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    setIsWsConnected(socket.connected);

    const onConnect = () => setIsWsConnected(true);
    const onDisconnect = () => setIsWsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const formatUtcTime = (date: Date) => {
    return date.toUTCString().slice(17, 25) + ' UTC';
  };

  const formatLocalTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="h-16 flex-shrink-0 border-b border-slate-800/80 bg-[#0c111e]/90 backdrop-blur-xl z-40 px-5 sm:px-6 flex items-center justify-between shadow-md shadow-black/20">
      {/* Brand title */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-600/25 text-white group-hover:scale-105 transition-transform duration-200">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                SwitchGuard
              </span>
              <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                NOC Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block -mt-0.5">
              Multi-Vendor SNMP Trap & Telemetry Gateway
            </p>
          </div>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Real-time Clock for NOC Operations */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-100">{formatLocalTime(currentTime)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[11px]">{formatUtcTime(currentTime)}</span>
        </div>

        {/* Real-time WebSocket connection badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          {isWsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 led-glow-emerald"></span>
              </span>
              <span className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Daemon Live</span> (UDP 162)
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 led-glow-rose"></span>
              <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Reconnecting
              </span>
            </>
          )}
        </div>

        {/* Active Alert Notification Bell */}
        <Link
          to="/alerts"
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all duration-150"
          title="Active System Alarms"
        >
          <Bell className="w-5 h-5" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md shadow-rose-500/40 ring-2 ring-[#0c111e] animate-pulse">
              {activeAlertCount > 9 ? '9+' : activeAlertCount}
            </span>
          )}
        </Link>

        {/* User profile and logout */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm">
              {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {user.fullName}
              </div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

