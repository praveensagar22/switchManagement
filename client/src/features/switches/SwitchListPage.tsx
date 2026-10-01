import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { AddSwitchModal } from './AddSwitchModal.tsx';
import {
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search,
  Server,
  MapPin,
  Clock,
  Layers,
  Cpu,
  Wifi,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SwitchListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data: switches = [], isLoading, refetch } = useQuery({
    queryKey: ['switches'],
    queryFn: ApiService.getSwitches
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => ApiService.syncSwitch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['switches'] });
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
    },
    onSettled: () => {
      setSyncingId(null);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiService.deleteSwitch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['switches'] });
    }
  });

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncMutation.mutate(id);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove switch ${name}? All associated interfaces and alert history will be removed.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSwitches = switches.filter((sw) => {
    const matchesSearch =
      sw.name.toLowerCase().includes(search.toLowerCase()) ||
      sw.ipAddress.includes(search) ||
      (sw.location && sw.location.toLowerCase().includes(search.toLowerCase())) ||
      (sw.model && sw.model.toLowerCase().includes(search.toLowerCase()));

    const matchesVendor = vendorFilter === 'ALL' || sw.vendor === vendorFilter;
    return matchesSearch && matchesVendor;
  });

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
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Switch Infrastructure
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
              {switches.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            SNMP configurations, real-time device reachability, and hardware interface discovery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by switch name, IP address, model, or location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
          />
        </div>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
        >
          <option value="ALL">All Vendors</option>
          <option value="HUAWEI">Huawei</option>
          <option value="CISCO">Cisco</option>
          <option value="OPTILINK">Optilink</option>
          <option value="ARUBA">Aruba / HPE</option>
          <option value="JUNIPER">Juniper</option>
          <option value="MIKROTIK">MikroTik</option>
          <option value="GENERIC">Generic</option>
        </select>
      </div>

      {/* Switches Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading switch catalog...
        </div>
      ) : filteredSwitches.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8 bg-slate-950/40">
          <Server className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No network switches found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || vendorFilter !== 'ALL'
              ? 'No switches match your search filter criteria.'
              : 'Add your target managed network switch (e.g. Huawei S5720) to begin SNMP monitoring.'}
          </p>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            Add New Switch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSwitches.map((sw) => {
            const isOnline = sw.connectionStatus === 'ONLINE';
            const upPorts = sw.portSummary?.up ?? 0;
            const totalPorts = sw.portSummary?.total ?? 0;
            const upPercent = totalPorts > 0 ? Math.round((upPorts / totalPorts) * 100) : 0;

            return (
              <Card key={sw._id} hoverable className="flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link
                        to={`/switches/${sw._id}`}
                        className="text-base font-black text-slate-100 hover:text-cyan-400 transition-colors truncate block"
                      >
                        {sw.name}
                      </Link>
                      <div className="text-xs font-mono text-cyan-400/90 mt-0.5 flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-cyan-500" />
                        {sw.ipAddress}:{sw.snmpConfig?.port || 161}
                      </div>
                    </div>
                    <Badge variant={isOnline ? 'green' : 'red'} size="sm" dot mono>
                      {sw.connectionStatus}
                    </Badge>
                  </div>

                  {/* Metadata tags */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vendor:</span>
                      <Badge variant={sw.vendor === 'HUAWEI' ? 'blue' : 'purple'} size="sm" mono>
                        {sw.vendor}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Model:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {sw.model || 'Managed Switch'}
                      </span>
                    </div>

                    {sw.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-slate-300 truncate max-w-[170px]">{sw.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">System Uptime:</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {formatUptime(sw.uptimeSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Port distribution bar */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Interface Capacity
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {upPorts} UP / {totalPorts} Total
                      </span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden flex border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${upPercent}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{ width: `${100 - upPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSync(sw._id)}
                      isLoading={syncingId === sw._id}
                      title="Run SNMP discovery walk to sync interfaces"
                      icon={<RefreshCw className="w-3 h-3" />}
                    >
                      Sync MIB
                    </Button>
                    <button
                      onClick={() => handleDelete(sw._id, sw.name)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete switch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link to={`/switches/${sw._id}`}>
                    <Button size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Faceplate & Ports
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Switch Modal */}
      <AddSwitchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
