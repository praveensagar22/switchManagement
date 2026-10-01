import React from 'react';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

interface NetworkHealthRingProps {
  totalSwitches: number;
  onlineSwitches: number;
  totalPorts: number;
  upPorts: number;
  activeCriticalAlerts: number;
}

export const NetworkHealthRing: React.FC<NetworkHealthRingProps> = ({
  totalSwitches,
  onlineSwitches,
  totalPorts,
  upPorts,
  activeCriticalAlerts
}) => {
  // Calculate dynamic composite health score (0 - 100%)
  const switchScore = totalSwitches > 0 ? (onlineSwitches / totalSwitches) * 50 : 50;
  const portScore = totalPorts > 0 ? (upPorts / totalPorts) * 40 : 40;
  const alertPenalty = Math.min(activeCriticalAlerts * 10, 30);

  const rawHealth = Math.round(switchScore + portScore - alertPenalty);
  const healthScore = Math.max(0, Math.min(100, rawHealth));

  // Determine grade & color
  let statusText = 'Optimal';
  let badgeVariant: 'green' | 'amber' | 'red' = 'green';
  let gradientId = 'health-grad-emerald';

  if (healthScore < 70) {
    statusText = 'Critical';
    badgeVariant = 'red';
    gradientId = 'health-grad-rose';
  } else if (healthScore < 90) {
    statusText = 'Degraded';
    badgeVariant = 'amber';
    gradientId = 'health-grad-amber';
  }

  // SVG circular progress calculation
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const switchRatio = totalSwitches > 0 ? Math.round((onlineSwitches / totalSwitches) * 100) : 100;
  const portRatio = totalPorts > 0 ? Math.round((upPorts / totalPorts) * 100) : 100;

  return (
    <Card className="flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Health Index
        </span>
        <Badge variant={badgeVariant} size="sm" dot mono>
          {statusText}
        </Badge>
      </div>

      {/* Centered Radial Gauge */}
      <div className="flex flex-col items-center justify-center my-1">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="health-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="health-grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="health-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-800/80"
            />

            {/* Glowing progress arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white font-mono tracking-tight leading-none">
              {healthScore}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
              Score
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Metric Breakdown: 2 Clean Balanced Columns */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2.5 border-t border-slate-800/80">
        {/* Switches Metric */}
        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-medium">Switches</span>
            <span className="font-mono font-bold text-slate-200">{switchRatio}%</span>
          </div>
          <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                switchRatio > 0 ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
              style={{ width: `${Math.max(switchRatio, 4)}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            {onlineSwitches}/{totalSwitches} Online
          </div>
        </div>

        {/* Ports Metric */}
        <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-medium">Ports</span>
            <span className="font-mono font-bold text-emerald-400">{portRatio}%</span>
          </div>
          <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(portRatio, 4)}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            {upPorts}/{totalPorts} Links UP
          </div>
        </div>
      </div>
    </Card>
  );
};
