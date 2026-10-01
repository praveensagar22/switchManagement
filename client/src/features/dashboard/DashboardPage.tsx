import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { NetworkHealthRing } from './NetworkHealthRing.tsx';
import { QuickChassisPreview } from './QuickChassisPreview.tsx';
import { VendorDistributionCard } from './VendorDistributionCard.tsx';
import { LiveTrapStreamWidget } from './LiveTrapStreamWidget.tsx';
import { AddSwitchModal } from '../switches/AddSwitchModal.tsx';
import {
  Server,
  Activity,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  Layers,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Fetch Switches
  const {
    data: switches = [],
    isLoading: switchesLoading,
    refetch: refetchSwitches
  } = useQuery({
    queryKey: ['switches'],
    queryFn: ApiService.getSwitches,
    refetchInterval: 15000
  });

  // 2. Fetch Active Alerts
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: ApiService.getActiveAlerts,
    refetchInterval: 10000
  });

  // 3. Fetch Recent Events
  const {
    data: eventData,
    isLoading: eventsLoading,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['events', 'recent'],
    queryFn: () => ApiService.getEvents({ limit: 15 }),
    refetchInterval: 5000
  });

  const handleRefreshAll = () => {
    refetchSwitches();
    refetchAlerts();
    refetchEvents();
  };

  // Metrics computation
  const totalSwitches = switches.length;
  const onlineSwitches = switches.filter((s) => s.connectionStatus === 'ONLINE').length;
  const unreachableSwitches = switches.filter((s) => s.connectionStatus === 'UNREACHABLE').length;

  let totalPorts = 0;
  let totalUpPorts = 0;
  let totalDownPorts = 0;

  for (const sw of switches) {
    if (sw.portSummary) {
      totalPorts += sw.portSummary.total;
      totalUpPorts += sw.portSummary.up;
      totalDownPorts += sw.portSummary.down;
    }
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0m';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top NOC Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              NOC Command Center
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              Live Gateway
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interface health, push-based SNMP traps, and link event tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh All
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Switch
          </Button>
        </div>
      </div>

      {/* Top Metrics Row: Health Ring + Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dynamic Composite Health Ring */}
        <NetworkHealthRing
          totalSwitches={totalSwitches}
          onlineSwitches={onlineSwitches}
          totalPorts={totalPorts}
          upPorts={totalUpPorts}
          activeCriticalAlerts={alerts.filter((a) => a.severity === 'CRITICAL').length}
        />

        {/* Managed Switches Stat Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Managed Devices
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{totalSwitches}</span>
              <span className="text-xs text-slate-400">devices</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <Badge variant="green" size="sm" dot mono>
                {onlineSwitches} Online
              </Badge>
              {unreachableSwitches > 0 ? (
                <Badge variant="red" size="sm" dot mono>
                  {unreachableSwitches} Offline
                </Badge>
              ) : (
                <span className="text-slate-500 text-[11px] font-mono">0 Offline</span>
              )}
            </div>
          </div>
          <Link
            to="/switches"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-2.5 border-t border-slate-800/80 transition-colors"
          >
            Manage Switches <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        {/* Port Status Breakdown Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Port Interfaces
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{totalPorts}</span>
              <span className="text-xs text-slate-400">monitored ports</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <Badge variant="green" size="sm" mono>
                {totalUpPorts} UP
              </Badge>
              <Badge variant="red" size="sm" mono>
                {totalDownPorts} DOWN
              </Badge>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80 flex justify-between font-mono">
            <span>Availability:</span>
            <span className="text-emerald-400 font-bold">
              {totalPorts > 0 ? Math.round((totalUpPorts / totalPorts) * 100) : 100}%
            </span>
          </div>
        </Card>

        {/* Active Alarms Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Active Alarms
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400 font-mono tracking-tight">{alerts.length}</span>
              <span className="text-xs text-slate-400">unresolved</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs">
              {alerts.length === 0 ? (
                <Badge variant="green" size="sm" mono>
                  All Systems Clear
                </Badge>
              ) : (
                <Badge variant="red" size="sm" dot mono>
                  Action Required
                </Badge>
              )}
            </div>
          </div>
          <Link
            to="/alerts"
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 pt-2.5 border-t border-slate-800/80 transition-colors"
          >
            Open Alert Center <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* Interactive Switch Chassis Faceplate Section */}
      {switches.length > 0 && <QuickChassisPreview switches={switches} />}

      {/* Active Outage Banner (if any link is DOWN) */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-slate-900/60 border border-rose-800/80 shadow-xl shadow-rose-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              <h3 className="text-sm font-bold text-rose-200">
                Active Port Down & Link Outage Incidents ({alerts.length})
              </h3>
            </div>
            <Link
              to="/alerts"
              className="text-xs text-rose-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              View in Alert Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="red" size="sm" mono dot>
                    {alert.severity}
                  </Badge>
                  <span className="font-semibold text-slate-100">{alert.message}</span>
                </div>
                <span className="text-slate-400 text-[11px] font-mono">
                  {new Date(alert.triggeredAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Section: Inventory & Analytics + Live Trap Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Switch Inventory Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Switch Infrastructure Catalog"
              subtitle="Device operational status, IP routing, and port utilization ratio"
              action={
                <Link
                  to="/switches"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Manage Switches <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {switchesLoading ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Loading switches...
              </div>
            ) : switches.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No switches added yet. Click "Add Switch" to configure your first switch.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {switches.map((sw) => {
                  const upCount = sw.portSummary?.up ?? 0;
                  const totalCount = sw.portSummary?.total ?? 0;
                  const upPercent = totalCount > 0 ? Math.round((upCount / totalCount) * 100) : 0;

                  return (
                    <div
                      key={sw._id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 px-3 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            sw.connectionStatus === 'ONLINE'
                              ? 'bg-emerald-400 led-glow-emerald'
                              : 'bg-rose-500 led-glow-rose'
                          }`}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/switches/${sw._id}`}
                            className="font-bold text-slate-100 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 truncate"
                          >
                            {sw.name}
                            <Badge variant={sw.vendor === 'HUAWEI' ? 'blue' : 'purple'} size="sm" mono>
                              {sw.vendor}
                            </Badge>
                          </Link>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                            {sw.ipAddress} • {sw.model || 'Switch'} • Up: {formatUptime(sw.uptimeSeconds)}
                          </div>
                        </div>
                      </div>

                      {/* Mini port ratio bar */}
                      <div className="flex items-center gap-3 min-w-[170px]">
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${upPercent}%` }}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all duration-300"
                            style={{ width: `${100 - upPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-200 whitespace-nowrap">
                          {upCount}/{totalCount} UP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Vendor Breakdown & Live Trap Stream */}
        <div className="space-y-6">
          <VendorDistributionCard switches={switches} />
          <LiveTrapStreamWidget events={eventData?.data || []} isLoading={eventsLoading} />
        </div>
      </div>

      {/* Add Switch Modal */}
      <AddSwitchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => handleRefreshAll()}
      />
    </div>
  );
};
