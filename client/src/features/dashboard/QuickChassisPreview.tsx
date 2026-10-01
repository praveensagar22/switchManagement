import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SwitchItem } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { PortRackVisualizer } from '../interfaces/PortRackVisualizer.tsx';
import { PortHistoryModal } from '../interfaces/PortHistoryModal.tsx';
import { InterfaceItem } from '../../types/index.ts';
import {
  Layers,
  ArrowRight,
  ExternalLink,
  Cable,
  PlugZap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickChassisPreviewProps {
  switches: SwitchItem[];
}

export const QuickChassisPreview: React.FC<QuickChassisPreviewProps> = ({ switches }) => {
  const queryClient = useQueryClient();
  const [selectedSwitchId, setSelectedSwitchId] = useState<string>(
    switches[0]?._id || ''
  );
  const [selectedPortForHistory, setSelectedPortForHistory] = useState<InterfaceItem | null>(null);

  // Interactive Trap Simulation State
  const [simPortIndex, setSimPortIndex] = useState<number>(1);
  const [simFeedback, setSimFeedback] = useState<{ isDown: boolean; message: string } | null>(null);

  // Synchronize initial selected switch ID if switches array updates
  React.useEffect(() => {
    if (!selectedSwitchId && switches.length > 0) {
      setSelectedSwitchId(switches[0]._id);
    }
  }, [switches, selectedSwitchId]);

  const currentSwitch = switches.find((s) => s._id === selectedSwitchId) || switches[0];

  // Query interfaces for selected switch
  const { data: interfaces = [], isLoading } = useQuery({
    queryKey: ['interfaces', selectedSwitchId],
    queryFn: () => ApiService.getInterfacesBySwitch(selectedSwitchId),
    enabled: !!selectedSwitchId
  });

  // Trap Simulation Mutation
  const trapMutation = useMutation({
    mutationFn: (action: 'linkDown' | 'linkUp') =>
      ApiService.simulateTrap({
        action,
        ifIndex: simPortIndex,
        switchIp: currentSwitch?.ipAddress || '127.0.0.1'
      }),
    onSuccess: (data, action) => {
      setSimFeedback({
        isDown: action === 'linkDown',
        message: data.message
      });
      // Invalidate queries so dashboard faceplate updates instantly
      queryClient.invalidateQueries({ queryKey: ['interfaces', selectedSwitchId] });
      queryClient.invalidateQueries({ queryKey: ['switches'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  if (!currentSwitch) return null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Chassis Live Faceplate
              <Badge variant={currentSwitch.vendor === 'HUAWEI' ? 'blue' : 'purple'} size="sm">
                {currentSwitch.vendor}
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive physical rack preview with real-time port activity
            </p>
          </div>
        </div>

        {/* Switch Selector & Detail Link */}
        <div className="flex items-center gap-3">
          {switches.length > 1 && (
            <select
              value={selectedSwitchId}
              onChange={(e) => setSelectedSwitchId(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {switches.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.ipAddress})
                </option>
              ))}
            </select>
          )}

          <Link to={`/switches/${currentSwitch._id}`}>
            <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Switch Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Faceplate */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading faceplate ports...</div>
      ) : (
        <PortRackVisualizer
          interfaces={interfaces}
          onSelectPort={(port) => setSelectedPortForHistory(port)}
          vendorName={currentSwitch.vendor || 'HUAWEI'}
          modelName={currentSwitch.model || 'Huawei S5720-28P-PWR-LI-AC'}
        />
      )}

      {/* Interactive Quick Simulation Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 to-slate-900/80 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2.5 text-xs text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cable className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-2">
              SNMP Trap Simulator
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                UDP 162
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Fire authentic RFC 2863 linkDown/linkUp traps to test real-time failover
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Target:</span>
            <select
              value={simPortIndex}
              onChange={(e) => setSimPortIndex(Number(e.target.value))}
              className="bg-transparent text-slate-100 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {interfaces.map((i) => (
                <option key={i._id} value={i.ifIndex} className="bg-slate-900 text-slate-100">
                  Port {i.ifIndex} — {i.ifName} ({i.ifOperStatus})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => trapMutation.mutate('linkDown')}
            isLoading={trapMutation.isPending && trapMutation.variables === 'linkDown'}
            icon={<Cable className="w-3.5 h-3.5" />}
          >
            Pull Cable (linkDown)
          </Button>

          <Button
            size="sm"
            onClick={() => trapMutation.mutate('linkUp')}
            isLoading={trapMutation.isPending && trapMutation.variables === 'linkUp'}
            icon={<PlugZap className="w-3.5 h-3.5" />}
          >
            Insert Cable (linkUp)
          </Button>
        </div>
      </div>

      {/* Trap Feedback Message */}
      {simFeedback && (
        <div
          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 animate-fade-in ${
            simFeedback.isDown
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {simFeedback.isDown ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{simFeedback.message}</span>
        </div>
      )}

      {/* History Modal */}
      <PortHistoryModal
        isOpen={!!selectedPortForHistory}
        onClose={() => setSelectedPortForHistory(null)}
        interfaceItem={selectedPortForHistory}
      />
    </Card>
  );
};
