import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { History, RefreshCw, Server, Download, Radio, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventsPage: React.FC = () => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

  const { data: eventData, isLoading, refetch } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => ApiService.getEvents({ limit: 100 })
  });

  const events = eventData?.data || [];

  const filteredEvents = events.filter((evt) => {
    if (eventTypeFilter === 'ALL') return true;
    return evt.eventType === eventTypeFilter;
  });

  const exportToCsv = () => {
    if (filteredEvents.length === 0) return;
    const headers = [
      'Timestamp',
      'Switch Name',
      'Switch IP',
      'Port',
      'Event Type',
      'Previous Status',
      'New Status',
      'Source'
    ];

    const rows = filteredEvents.map((evt) => {
      const sw = typeof evt.switchId === 'object' ? evt.switchId : null;
      return [
        new Date(evt.timestamp).toISOString(),
        sw?.name || 'Unknown',
        sw?.ipAddress || '',
        evt.ifName || `ifIndex ${evt.ifIndex}`,
        evt.eventType,
        evt.previousOperStatus,
        evt.newOperStatus,
        evt.source
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `port_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Port Event Audit Log
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
              {events.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable timeline of real-time linkUp/linkDown traps and periodic reconciliation events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToCsv}
            disabled={filteredEvents.length === 0}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="font-bold text-slate-200">{filteredEvents.length}</span> events
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Event Filter:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="LINK_DOWN">LINK_DOWN</option>
            <option value="LINK_UP">LINK_UP</option>
            <option value="FLAPPING">FLAPPING</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-900/70 shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Switch Name / IP</th>
              <th className="px-4 py-3">Port / Interface</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Status Transition</th>
              <th className="px-4 py-3">Ingestion Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-mono">
                  Loading event telemetry log...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="font-bold text-slate-300">No port events recorded yet</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Trap receiver is active on UDP port 162
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isUp = evt.eventType === 'LINK_UP';
                const sw = typeof evt.switchId === 'object' ? evt.switchId : null;

                return (
                  <tr key={evt._id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {sw ? (
                        <Link
                          to={`/switches/${sw._id}`}
                          className="font-bold text-slate-100 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                        >
                          <Server className="w-3.5 h-3.5 text-cyan-500" />
                          {sw.name}
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            ({sw.ipAddress})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono">Switch</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      {evt.ifName || `ifIndex ${evt.ifIndex}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isUp ? 'green' : 'red'} size="sm" dot mono>
                        {evt.eventType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className="text-slate-500">{evt.previousOperStatus}</span>
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {evt.newOperStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${
                          evt.source === 'TRAP'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-850 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        {evt.source}
                      </span>
                    </td>
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
