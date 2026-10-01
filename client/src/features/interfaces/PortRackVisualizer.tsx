import React, { useState } from 'react';
import { InterfaceItem } from '../../types/index.ts';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

interface PortRackVisualizerProps {
  interfaces: InterfaceItem[];
  onSelectPort: (iface: InterfaceItem) => void;
  selectedPortId?: string;
  vendorName?: string;
  modelName?: string;
}

export const PortRackVisualizer: React.FC<PortRackVisualizerProps> = ({
  interfaces,
  onSelectPort,
  selectedPortId,
  vendorName = 'HUAWEI',
  modelName = 'S5720-28P-PWR-LI-AC'
}) => {
  const [hoveredPort, setHoveredPort] = useState<InterfaceItem | null>(null);

  // Sort interfaces by ifIndex
  const sorted = [...interfaces].sort((a, b) => a.ifIndex - b.ifIndex);

  // Group into standard copper ports (1-24) and optical SFP+ uplink ports (25+)
  const copperPorts = sorted.filter((i) => i.ifIndex <= 24);
  const sfpPorts = sorted.filter((i) => i.ifIndex > 24);

  // If there are more or custom ports, adjust dynamically
  const displayCopper = copperPorts.length > 0 ? copperPorts : sorted;
  const displaySfp = copperPorts.length > 0 ? sfpPorts : [];

  // Split into odd (top row) and even (bottom row)
  const copperOdd = displayCopper.filter((_, idx) => idx % 2 === 0);
  const copperEven = displayCopper.filter((_, idx) => idx % 2 === 1);

  const sfpOdd = displaySfp.filter((_, idx) => idx % 2 === 0);
  const sfpEven = displaySfp.filter((_, idx) => idx % 2 === 1);

  const formatSpeed = (bps: number) => {
    if (!bps) return '0M';
    if (bps >= 1_000_000_000) return `${Math.round(bps / 1_000_000_000)}G`;
    if (bps >= 1_000_000) return `${Math.round(bps / 1_000_000)}M`;
    return `${bps}b`;
  };

  const getLedClass = (status: string) => {
    switch (status) {
      case 'UP':
        return 'bg-emerald-400 led-glow-emerald';
      case 'DOWN':
        return 'bg-rose-500 led-glow-rose';
      case 'FLAPPING':
      case 'TESTING':
        return 'bg-amber-400 led-glow-amber animate-pulse';
      default:
        return 'bg-slate-700';
    }
  };

  // Render individual RJ45 Copper Port
  const renderCopperPort = (iface: InterfaceItem) => {
    const isSelected = selectedPortId === iface._id;
    const isUp = iface.ifOperStatus === 'UP';

    return (
      <button
        key={iface._id}
        onClick={() => onSelectPort(iface)}
        onMouseEnter={() => setHoveredPort(iface)}
        onMouseLeave={() => setHoveredPort(null)}
        className={`group relative flex flex-col items-center justify-between p-1 rounded-sm border transition-all duration-150 w-[42px] h-[48px] cursor-pointer select-none ${
          isSelected
            ? 'bg-cyan-950/90 border-cyan-400 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30'
            : isUp
            ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/70 hover:bg-slate-850'
            : 'bg-slate-950 border-slate-800 hover:border-slate-600'
        }`}
      >
        {/* Top: Port Number & Link LED */}
        <div className="flex items-center justify-between w-full px-0.5">
          <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-cyan-300">
            {iface.ifIndex}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${getLedClass(
              iface.ifOperStatus
            )}`}
          />
        </div>

        {/* RJ45 Socket Cavity */}
        <div className="w-6 h-4 rounded-xs bg-[#070a12] border border-slate-800 flex flex-col items-center justify-between p-0.5 group-hover:border-slate-600 transition-colors">
          {/* Gold pins */}
          <div className="flex gap-0.5 justify-center w-full">
            <span className="w-0.5 h-1 bg-amber-500/60 rounded-xs" />
            <span className="w-0.5 h-1 bg-amber-500/60 rounded-xs" />
            <span className="w-0.5 h-1 bg-amber-500/60 rounded-xs" />
            <span className="w-0.5 h-1 bg-amber-500/60 rounded-xs" />
          </div>
          {/* Socket Clip Tab */}
          <div className="w-2.5 h-1 bg-slate-800 rounded-t-xs" />
        </div>

        {/* Speed / Activity Footer */}
        <div className="flex items-center justify-between w-full px-0.5 text-[8px] font-mono text-slate-500">
          <span>{formatSpeed(iface.ifSpeed)}</span>
          {isUp && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
        </div>
      </button>
    );
  };

  // Render SFP+ 10GE Optical Port
  const renderSfpPort = (iface: InterfaceItem) => {
    const isSelected = selectedPortId === iface._id;
    const isUp = iface.ifOperStatus === 'UP';

    return (
      <button
        key={iface._id}
        onClick={() => onSelectPort(iface)}
        onMouseEnter={() => setHoveredPort(iface)}
        onMouseLeave={() => setHoveredPort(null)}
        className={`group relative flex flex-col items-center justify-between p-1 rounded-sm border transition-all duration-150 w-[44px] h-[48px] cursor-pointer select-none ${
          isSelected
            ? 'bg-cyan-950/90 border-cyan-400 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30'
            : isUp
            ? 'bg-slate-900 border-slate-600 hover:border-cyan-400'
            : 'bg-slate-950 border-slate-800 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between w-full px-0.5">
          <span className="text-[9px] font-mono font-bold text-cyan-400">
            {iface.ifName.replace(/[^0-9/]/g, '') || iface.ifIndex}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${getLedClass(iface.ifOperStatus)}`}
          />
        </div>

        {/* Metallic SFP+ Transceiver Cage */}
        <div className="w-7 h-4 rounded-xs bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-500/60 flex items-center justify-center p-0.5 shadow-inner">
          <div className="w-5 h-2.5 rounded-xs bg-black/90 border border-cyan-500/40 flex items-center justify-center text-[7px] font-mono text-cyan-300 font-bold">
            SFP+
          </div>
        </div>

        <div className="text-[8px] font-mono text-cyan-400/80 font-semibold">10GE</div>
      </button>
    );
  };

  return (
    <div className="relative rounded-2xl border border-slate-800/90 bg-[#0f1422] shadow-2xl overflow-hidden">
      {/* Front Panel Header with Chassis Status */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono text-[11px] tracking-wider uppercase">
              {vendorName}
            </span>
            <span className="font-mono text-slate-300 text-xs font-semibold">
              {modelName}
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            1U Enterprise Managed Switch (24x GE + 4x 10GE SFP+)
          </span>
        </div>

        {/* LED Diagnostic Cluster */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-glow-emerald" />
            <span className="text-slate-300 font-semibold">PWR</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-glow-emerald animate-pulse" />
            <span className="text-slate-300 font-semibold">SYS</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            <span className="text-slate-400 font-semibold">ALM</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 led-glow-cyan" />
            <span className="text-cyan-300 font-semibold">SPEED</span>
          </div>
        </div>
      </div>

      {/* Realistic 1U Rack Chassis Body */}
      <div className="p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[820px] flex items-center bg-[#090d16] border border-slate-800 rounded-xl p-3 shadow-inner relative">
          {/* Left Rack Ear (Mounting Bracket) */}
          <div className="w-7 h-28 bg-gradient-to-r from-slate-800 to-slate-900 border-r border-slate-700/80 rounded-l flex flex-col justify-between items-center py-2 -ml-3 mr-3 shadow-md flex-shrink-0">
            <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest rotate-90">
              1U
            </div>
            <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          </div>

          {/* Switch Diagnostic Silkscreen */}
          <div className="flex flex-col justify-between h-24 mr-4 pr-3 border-r border-slate-800 text-[9px] font-mono text-slate-400 flex-shrink-0">
            <div>
              <div className="text-slate-200 font-black tracking-tight text-sm">
                {vendorName}
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold">
                S5720 SERIES
              </div>
            </div>
            <div className="space-y-0.5 text-[8px] text-slate-500">
              <div>10/100/1000T</div>
              <div>POE+ GIGABIT</div>
            </div>
          </div>

          {/* Copper Gigabit Ports (1-24) */}
          <div className="flex-1 flex flex-col gap-1.5 pr-4 border-r border-slate-800/80">
            {/* Row 1: Odd Ports */}
            <div className="flex gap-1.5 flex-wrap">
              {copperOdd.map((iface) => renderCopperPort(iface))}
            </div>
            {/* Row 2: Even Ports */}
            <div className="flex gap-1.5 flex-wrap">
              {copperEven.map((iface) => renderCopperPort(iface))}
            </div>
          </div>

          {/* Optical Uplink SFP+ Ports (25-28) */}
          {displaySfp.length > 0 && (
            <div className="flex flex-col gap-1.5 pl-4 flex-shrink-0">
              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                10GE Optical Uplink
              </div>
              <div className="flex gap-1.5">
                {sfpOdd.map((iface) => renderSfpPort(iface))}
              </div>
              <div className="flex gap-1.5">
                {sfpEven.map((iface) => renderSfpPort(iface))}
              </div>
            </div>
          )}

          {/* Right Rack Ear (Mounting Bracket) */}
          <div className="w-7 h-28 bg-gradient-to-l from-slate-800 to-slate-900 border-l border-slate-700/80 rounded-r flex flex-col justify-between items-center py-2 -mr-3 ml-4 shadow-md flex-shrink-0">
            <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest -rotate-90">
              1U
            </div>
            <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Port Details / Tooltip Bar */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {hoveredPort ? (
          <div className="flex items-center gap-4 font-mono text-[11px] animate-fade-in text-slate-200">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${getLedClass(hoveredPort.ifOperStatus)}`}
              />
              <strong className="text-white">{hoveredPort.ifName}</strong> (ifIndex{' '}
              {hoveredPort.ifIndex})
            </span>
            <span>•</span>
            <span
              className={
                hoveredPort.ifOperStatus === 'UP'
                  ? 'text-emerald-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              OPER: {hoveredPort.ifOperStatus}
            </span>
            <span>•</span>
            <span>ADMIN: {hoveredPort.ifAdminStatus}</span>
            <span>•</span>
            <span>SPEED: {formatSpeed(hoveredPort.ifSpeed)}</span>
            {hoveredPort.macAddress && (
              <>
                <span>•</span>
                <span>MAC: {hoveredPort.macAddress}</span>
              </>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Hover over any port to inspect live telemetry • Click any port to view historical SNMP trap audit timeline
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-glow-emerald" /> Link UP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 led-glow-rose" /> Link DOWN
          </span>
        </div>
      </div>
    </div>
  );
};

