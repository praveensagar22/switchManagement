import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { InterfaceItem } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Activity, Clock, Radio, Cpu, ShieldCheck } from 'lucide-react';

interface PortHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceItem: InterfaceItem | null;
}

export const PortHistoryModal: React.FC<PortHistoryModalProps> = ({
  isOpen,
  onClose,
  interfaceItem
}) => {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['interface', interfaceItem?._id, 'history'],
    queryFn: () => ApiService.getInterfaceHistory(interfaceItem!._id, 30),
    enabled: isOpen && !!interfaceItem?._id
  });

  if (!interfaceItem) return null;

  const isUp = interfaceItem.ifOperStatus === 'UP';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Port Telemetry: ${interfaceItem.ifName}`}
      subtitle={`ifIndex ${interfaceItem.ifIndex} • ${interfaceItem.ifDescr || 'Standard Switch Interface'}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Quick Port Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <div className="text-slate-500 text-[11px] font-medium">Oper Status</div>
            <div className="mt-1">
              <Badge variant={isUp ? 'green' : 'red'} size="sm" dot mono>
                {interfaceItem.ifOperStatus}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] font-medium">Link Speed</div>
            <div className="mt-1 font-mono font-bold text-slate-200">
              {interfaceItem.ifSpeed ? `${Math.round(interfaceItem.ifSpeed / 1_000_000)} Mbps` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] font-medium">MAC Address</div>
            <div className="mt-1 font-mono text-slate-300 truncate">
              {interfaceItem.macAddress || '—'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] font-medium">Admin State</div>
            <div className="mt-1 font-mono font-semibold text-slate-200">
              {interfaceItem.ifAdminStatus}
            </div>
          </div>
        </div>

        {/* Chronological Event History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              State Transition Audit Timeline
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Traps & Polling Reconciliation
            </span>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-slate-500 text-xs font-mono">
              Loading port event timeline...
            </div>
          ) : !historyData?.data || historyData.data.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl p-6 text-slate-500 text-xs">
              No state transition events recorded for this port yet.
            </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-3 space-y-4 py-1">
              {historyData.data.map((evt) => {
                const isLinkUp = evt.eventType === 'LINK_UP';
                return (
                  <div key={evt._id} className="relative pl-6">
                    {/* Circle marker on line */}
                    <div
                      className={`absolute -left-1.5 top-2 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        isLinkUp ? 'bg-emerald-400 led-glow-emerald' : 'bg-rose-500 led-glow-rose'
                      }`}
                    />

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black font-mono ${
                              isLinkUp ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {evt.eventType}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({evt.previousOperStatus} → {evt.newOperStatus})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] font-semibold">
                          SOURCE: {evt.source}
                        </span>
                        {evt.source === 'TRAP' && (
                          <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                            <Radio className="w-3 h-3" /> Ingested via UDP port 162
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
