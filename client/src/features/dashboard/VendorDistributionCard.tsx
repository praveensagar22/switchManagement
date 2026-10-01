import React from 'react';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { SwitchItem } from '../../types/index.ts';
import { Network, Cpu } from 'lucide-react';

interface VendorDistributionCardProps {
  switches: SwitchItem[];
}

export const VendorDistributionCard: React.FC<VendorDistributionCardProps> = ({ switches }) => {
  const vendorCounts: Record<string, number> = {};
  for (const sw of switches) {
    const v = sw.vendor || 'GENERIC';
    vendorCounts[v] = (vendorCounts[v] || 0) + 1;
  }

  const vendors = Object.entries(vendorCounts).map(([vendor, count]) => ({
    vendor,
    count,
    percentage: Math.round((count / (switches.length || 1)) * 100)
  }));

  const vendorColor = (vendor: string) => {
    switch (vendor) {
      case 'HUAWEI':
        return 'bg-gradient-to-r from-cyan-500 to-cyan-400';
      case 'CISCO':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-400';
      case 'ARUBA':
        return 'bg-gradient-to-r from-amber-500 to-amber-400';
      case 'JUNIPER':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
      case 'MIKROTIK':
        return 'bg-gradient-to-r from-rose-500 to-rose-400';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader
        title="Vendor Distribution"
        subtitle="Active multi-vendor SNMP adapters"
      />

      {switches.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-xs">No switches registered</div>
      ) : (
        <div className="space-y-3.5 py-1">
          {vendors.map((item) => (
            <div key={item.vendor} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                  {item.vendor}
                </span>
                <span className="font-mono text-slate-300 text-[11px] font-semibold">
                  {item.count} switch{item.count > 1 ? 'es' : ''} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${vendorColor(item.vendor)} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          Hardware Abstraction
        </span>
        <span className="font-mono text-emerald-400 font-bold">RFC 2863 IF-MIB</span>
      </div>
    </Card>
  );
};
