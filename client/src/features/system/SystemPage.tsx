import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api.ts';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import {
  Activity,
  Database,
  Radio,
  Clock,
  Terminal,
  RefreshCw,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const SystemPage: React.FC = () => {
  const [testEmailAddress, setTestEmailAddress] = useState('admin@example.com');
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: ApiService.getHealth,
    refetchInterval: 5000
  });

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await api.post('/system/test-email', { email: testEmailAddress });
      setEmailStatus({
        success: true,
        message: res.data?.message || `Test email dispatched to ${testEmailAddress}`
      });
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to dispatch email. Check SMTP settings in server .env.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const huaweiCliCommands = `# 1. Enter system-view
system-view

# 2. Enable SNMP Agent
snmp-agent

# 3. Configure SNMP v2c Community for monitoring
snmp-agent sys-info version v2c v3
snmp-agent community read public

# 4. Enable standard link traps (IF-MIB linkUp / linkDown)
snmp-agent trap enable feature-name ifnet trap-name linkup
snmp-agent trap enable feature-name ifnet trap-name linkdown

# 5. Point trap destination to SwitchGuard server IP (port 162)
snmp-agent target-host trap address udp-domain <SERVER_IP> udp-port 162 params securityname public v2c

# 6. Save configuration
return
save`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              System & Daemon Health
            </h2>
            <Badge variant="blue" size="sm" mono>
              Gateway Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Internal UDP 162 daemon listeners, trap ingestion statistics, and hardware setup guides
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SNMP Trap Receiver Daemon */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              SNMP Trap Receiver
            </span>
            <Badge
              variant={health?.snmpTrapReceiver.isListening ? 'green' : 'red'}
              size="sm"
              dot
              mono
            >
              {health?.snmpTrapReceiver.isListening ? 'LISTENING' : 'OFFLINE'}
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Binding Port:</span>
              <span className="font-mono text-cyan-400 font-bold">
                UDP {health?.snmpTrapReceiver.port ?? 162}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Traps Ingested:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {health?.snmpTrapReceiver.trapCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Daemon Health:</span>
              <span className="font-mono text-slate-300">
                {health?.snmpTrapReceiver.lastError || 'Optimal (No Errors)'}
              </span>
            </div>
          </div>
        </Card>

        {/* Database Connection */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              MongoDB Cluster
            </span>
            <Badge
              variant={health?.database.status === 'CONNECTED' ? 'green' : 'red'}
              size="sm"
              dot
              mono
            >
              {health?.database.status ?? 'CHECKING'}
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Connection State:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {health?.database.status}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Database Name:</span>
              <span className="font-mono text-slate-300 font-semibold">
                {health?.database.name || 'switch_management'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Index Optimizations:</span>
              <span className="text-slate-300 font-mono text-[11px]">Active (switchId + ifIndex)</span>
            </div>
          </div>
        </Card>

        {/* Server Process Uptime */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Backend Process
            </span>
            <Badge variant="blue" size="sm" mono>
              Node.js
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Process Uptime:</span>
              <span className="font-mono text-slate-100 font-bold">
                {formatUptime(health?.uptimeSeconds)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Reconciliation Polling:</span>
              <span className="font-mono text-slate-300">Every 5 Minutes</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Socket.IO Push:</span>
              <span className="text-emerald-400 font-mono font-semibold">Real-Time Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Simulator Guidance & Testing Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Huawei S5720 Switch Onboarding Guide */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Huawei S5720 VRP Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                CLI commands to enable SNMP traps on your physical switch
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(huaweiCliCommands, 'huawei')}
              icon={copiedSection === 'huawei' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedSection === 'huawei' ? 'Copied!' : 'Copy CLI'}
            </Button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto max-h-[220px]">
            {huaweiCliCommands.split('\n').map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('#')
                    ? 'text-slate-500 italic'
                    : line.startsWith('snmp-agent')
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-200'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </Card>

        {/* Email Notification Dispatcher */}
        <Card>
          <CardHeader
            title="Email Notification Dispatcher"
            subtitle="Validate SMTP connectivity for critical alarms"
          />
          {emailStatus && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                emailStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {emailStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              )}
              <span>{emailStatus.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            <Button
              size="sm"
              onClick={handleSendTestEmail}
              isLoading={isSendingEmail}
              icon={<Mail className="w-3.5 h-3.5" />}
            >
              Send Test Notification
            </Button>
            <p className="text-[11px] text-slate-500 mt-1">
              Note: Email dispatch can be toggled via <code className="text-cyan-400">ENABLE_EMAIL_ALERTS=true</code> in <code className="text-slate-400">server/.env</code>.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
