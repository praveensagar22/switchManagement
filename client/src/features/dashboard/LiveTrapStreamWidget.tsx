import React, { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { PortEventItem } from '../../types/index.ts';
import { Clock, Radio, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveTrapStreamWidgetProps {
  events: PortEventItem[];
  isLoading: boolean;
}

export const LiveTrapStreamWidget: React.FC<LiveTrapStreamWidgetProps> = ({
  events,
  isLoading
}) => {
  const [filter, setFilter] = useState<'ALL' | 'LINK_DOWN' | 'LINK_UP'>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.eventType === filter;
  });

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <span>Trap & Event Stream</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
          }
          subtitle="Real-time UDP 162 traps & reconciliation polling"
          action={
            <Link
              to="/events"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              All Events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {/* Filter Pills */}
        <div className="flex gap-1.5 mb-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('LINK_DOWN')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'LINK_DOWN'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Link Down
          </button>
          <button
            onClick={() => setFilter('LINK_UP')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'LINK_UP'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Link Up
          </button>
        </div>

        {/* Stream List */}
        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading live events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No events match selected filter.
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredEvents.slice(0, 7).map((evt) => {
              const isUp = evt.eventType === 'LINK_UP';
              const sw = typeof evt.switchId === 'object' ? evt.switchId : null;

              return (
                <div
                  key={evt._id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 hover:border-slate-700 transition-all ${
                    isUp
                      ? 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60'
                      : 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isUp ? 'bg-emerald-400 led-glow-emerald' : 'bg-rose-500 led-glow-rose'
                      }`}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 font-mono truncate">
                          {evt.ifName || `Port ${evt.ifIndex}`}
                        </span>
                        <Badge variant={isUp ? 'green' : 'red'} size="sm" mono>
                          {evt.eventType}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                        {sw?.name || 'Switch'} • {evt.source}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-mono">
          <Radio className="w-3 h-3 text-cyan-400" />
          Listening UDP 162
        </span>
        <span>Auto-refreshes on trap</span>
      </div>
    </Card>
  );
};
