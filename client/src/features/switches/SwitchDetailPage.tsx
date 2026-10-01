import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { PortRackVisualizer } from '../interfaces/PortRackVisualizer.tsx';
import { PortHistoryModal } from '../interfaces/PortHistoryModal.tsx';
import { InterfaceItem } from '../../types/index.ts';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  History,
  Layers,
  Activity,
  Cpu,
  Wifi,
  Radio
} from 'lucide-react';

export const SwitchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UP' | 'DOWN'>('ALL');
  const [selectedPortForHistory, setSelectedPortForHistory] = useState<InterfaceItem | null>(null);

  // 1. Fetch Switch Details
  const { data: switchDoc, isLoading: isSwitchLoading } = useQuery({
    queryKey: ['switch', id],
    queryFn: () => ApiService.getSwitch(id!),
    enabled: !!id
  });

  // 2. Fetch Interfaces
  const { data: interfaces = [], isLoading: isIfacesLoading } = useQuery({
    queryKey: ['interfaces', id],
    queryFn: () => ApiService.getInterfacesBySwitch(id!),
    enabled: !!id
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: () => ApiService.syncSwitch(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces', id] });
      queryClient.invalidateQueries({ queryKey: ['switch', id] });
      queryClient.invalidateQueries({ queryKey: ['switches'] });
    }
  });

  if (isSwitchLoading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs font-mono">
        Polling SNMP agent & walking MIB trees...
      </div>
    );
  }

  if (!switchDoc) {
    return (
      <div className="py-24 text-center text-rose-400 text-xs">
        Switch not found or database record unavailable.
      </div>
    );
  }

  const isOnline = switchDoc.connectionStatus === 'ONLINE';

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0m';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const formatSpeed = (bps: number) => {
    if (!bps) return 'N/A';
    if (bps >= 1_000_000_000) return `${Math.round(bps / 1_000_000_000)} Gbps`;
    if (bps >= 1_000_000) return `${Math.round(bps / 1_000_000)} Mbps`;
    return `${bps} bps`;
  };

  const filteredInterfaces = interfaces.filter((iface) => {
    const matchesSearch =
      iface.ifName.toLowerCase().includes(search.toLowerCase()) ||
      (iface.ifDescr && iface.ifDescr.toLowerCase().includes(search.toLowerCase())) ||
      (iface.ifAlias && iface.ifAlias.toLowerCase().includes(search.toLowerCase())) ||
      iface.ifIndex.toString() === search;

    const matchesStatus =
      statusFilter === 'ALL' || iface.ifOperStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const upCount = interfaces.filter((i) => i.ifOperStatus === 'UP').length;
  const downCount = interfaces.filter((i) => i.ifOperStatus === 'DOWN').length;

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/switches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Switch Inventory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {switchDoc.name}
            </h2>
            <Badge variant={isOnline ? 'green' : 'red'} size="md" dot mono>
              {switchDoc.connectionStatus}
            </Badge>
            <Badge variant={switchDoc.vendor === 'HUAWEI' ? 'blue' : 'purple'} size="md" mono>
              {switchDoc.vendor}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => syncMutation.mutate()}
              isLoading={syncMutation.isPending}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync Interfaces (SNMP Walk)
            </Button>
          </div>
        </div>
      </div>

      {/* Switch Hardware Overview Card */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Management IP</div>
            <div className="font-mono font-bold text-slate-100 mt-1 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400" />
              {switchDoc.ipAddress}:{switchDoc.snmpConfig.port}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Hardware Model</div>
            <div className="font-semibold text-slate-100 mt-1 truncate">
              {switchDoc.model || 'Huawei S5720 Series'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Serial Number</div>
            <div className="font-mono text-slate-300 mt-1 truncate">
              {switchDoc.serialNumber || 'Auto-extracting'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Firmware / OS</div>
            <div className="font-mono text-slate-300 mt-1 truncate">
              {switchDoc.firmwareVersion || 'VRP Version 5.170'}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">System Uptime</div>
            <div className="font-mono font-semibold text-slate-100 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {formatUptime(switchDoc.uptimeSeconds)}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium">Location</div>
            <div className="text-slate-200 mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              {switchDoc.location || 'Data Center Rack'}
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Switch Front Faceplate Rack */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Hardware Chassis Faceplate
        </h3>
        <PortRackVisualizer
          interfaces={interfaces}
          onSelectPort={(port) => setSelectedPortForHistory(port)}
          vendorName={switchDoc.vendor || 'HUAWEI'}
          modelName={switchDoc.model || 'Huawei S5720-28P-PWR-LI-AC'}
        />
      </div>

      {/* Port Inventory Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-slate-100">
              Interfaces Inventory ({interfaces.length})
            </h3>
            <Badge variant="green" size="sm" mono>
              {upCount} UP
            </Badge>
            <Badge variant="red" size="sm" mono>
              {downCount} DOWN
            </Badge>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter interfaces..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="flex rounded-xl bg-slate-950/80 border border-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('UP')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                UP ({upCount})
              </button>
              <button
                onClick={() => setStatusFilter('DOWN')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'DOWN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DOWN ({downCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-900/70 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">ifIndex</th>
                <th className="px-4 py-3">Interface Name</th>
                <th className="px-4 py-3">Oper Status</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Speed</th>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isIfacesLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                    Loading interfaces...
                  </td>
                </tr>
              ) : filteredInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No interfaces match your search filter.
                  </td>
                </tr>
              ) : (
                filteredInterfaces.map((iface) => {
                  const isUp = iface.ifOperStatus === 'UP';
                  return (
                    <tr
                      key={iface._id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-400">
                        {iface.ifIndex}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-100 font-mono">
                          {iface.ifName}
                        </div>
                        {iface.ifAlias && (
                          <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
                            {iface.ifAlias}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={isUp ? 'green' : 'red'} size="sm" dot mono>
                          {iface.ifOperStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">
                        {iface.ifAdminStatus}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300 font-semibold">
                        {formatSpeed(iface.ifSpeed)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">
                        {iface.macAddress || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPortForHistory(iface)}
                          icon={<History className="w-3.5 h-3.5 text-cyan-400" />}
                        >
                          History
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Port History Modal */}
      <PortHistoryModal
        isOpen={!!selectedPortForHistory}
        onClose={() => setSelectedPortForHistory(null)}
        interfaceItem={selectedPortForHistory}
      />
    </div>
  );
};
