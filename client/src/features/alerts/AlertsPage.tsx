import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  Server,
  RefreshCw,
  Download,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Fetch active alerts
  const {
    data: activeAlerts = [],
    isLoading: isActiveLoading,
    refetch: refetchActive
  } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: ApiService.getActiveAlerts
  });

  // Fetch historical alerts
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['alerts', 'history'],
    queryFn: () => ApiService.getAlertHistory(50),
    enabled: tab === 'HISTORY'
  });

  // Acknowledge mutation
  const ackMutation = useMutation({
    mutationFn: (id: string) => ApiService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const alertsToDisplay = tab === 'ACTIVE' ? activeAlerts : historyData?.data || [];

  const filteredAlerts = alertsToDisplay.filter((alert) => {
    if (severityFilter === 'ALL') return true;
    return alert.severity === severityFilter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="red" size="sm" dot mono>{severity}</Badge>;
      case 'MAJOR':
        return <Badge variant="amber" size="sm" dot mono>{severity}</Badge>;
      case 'WARNING':
        return <Badge variant="amber" size="sm" mono>{severity}</Badge>;
      default:
        return <Badge variant="blue" size="sm" mono>{severity}</Badge>;
    }
  };

  const exportToCsv = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ['Triggered At', 'Resolved At', 'Severity', 'Status', 'Alert Type', 'Switch Name', 'Switch IP', 'Message'];
    const rows = filteredAlerts.map((a) => {
      const sw = typeof a.switchId === 'object' ? a.switchId : null;
      return [
        new Date(a.triggeredAt).toISOString(),
        a.resolvedAt ? new Date(a.resolvedAt).toISOString() : '',
        a.severity,
        a.status,
        a.alertType,
        sw?.name || 'Unknown',
        sw?.ipAddress || '',
        a.message
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `switch_alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = tab === 'ACTIVE' ? isActiveLoading : isHistoryLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Alerts & Incident Management
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase">
              {activeAlerts.length} Active Alarms
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SNMP trap alarms, automated linkDown triggers, and recovery life-cycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToCsv}
            disabled={filteredAlerts.length === 0}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (tab === 'ACTIVE' ? refetchActive() : refetchHistory())}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Active vs Resolved History Tab */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setTab('ACTIVE')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'ACTIVE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Active Outages ({activeAlerts.length})
          </button>
          <button
            onClick={() => setTab('HISTORY')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'HISTORY'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Historical Archive
          </button>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="MAJOR">Major</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-900/70 shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Switch & Port</th>
              <th className="px-4 py-3">Alarm Message</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Triggered</th>
              {tab === 'HISTORY' && <th className="px-4 py-3">Resolved</th>}
              <th className="px-4 py-3">Status</th>
              {tab === 'ACTIVE' && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-mono">
                  Loading alert registry...
                </td>
              </tr>
            ) : filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mb-1" />
                    <span className="font-bold text-slate-200">
                      {tab === 'ACTIVE'
                        ? 'No active alarms detected — all network links operational'
                        : 'No historical alert records found'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Sub-second automated reconciliation active on UDP 162
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const sw = typeof alert.switchId === 'object' ? alert.switchId : null;
                const isResolved = alert.status === 'RESOLVED';

                return (
                  <tr
                    key={alert._id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      alert.severity === 'CRITICAL' && !isResolved ? 'bg-rose-950/15' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSeverityBadge(alert.severity)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        {sw ? (
                          <Link
                            to={`/switches/${sw._id}`}
                            className="hover:text-cyan-400 transition-colors"
                          >
                            {sw.name}
                          </Link>
                        ) : (
                          'Unknown Switch'
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {sw?.ipAddress}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{alert.message}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {alert.alertType}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </td>
                    {tab === 'HISTORY' && (
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={
                          isResolved
                            ? 'green'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                        mono
                      >
                        {alert.status}
                      </Badge>
                    </td>
                    {tab === 'ACTIVE' && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {alert.status !== 'ACKNOWLEDGED' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => ackMutation.mutate(alert._id)}
                            isLoading={ackMutation.isPending}
                            icon={<Check className="w-3 h-3 text-emerald-400" />}
                          >
                            Ack
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Acknowledged
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
