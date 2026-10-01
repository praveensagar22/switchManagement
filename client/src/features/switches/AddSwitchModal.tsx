import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ApiService } from '../../services/api.ts';
import { CheckCircle2, AlertCircle, Wifi, Shield, Server, Lock } from 'lucide-react';

const switchFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  ipAddress: z.string().min(7, 'Valid IP address or hostname is required'),
  vendor: z.enum(['HUAWEI', 'CISCO', 'ARUBA', 'JUNIPER', 'MIKROTIK', 'OPTILINK', 'GENERIC']),
  location: z.string().optional(),
  snmpConfig: z.object({
    version: z.enum(['v2c', 'v3']),
    port: z.number().int().min(1).max(65535).default(161),
    community: z.string().optional(),
    v3: z
      .object({
        username: z.string().optional(),
        securityLevel: z.enum(['noAuthNoPriv', 'authNoPriv', 'authPriv']),
        authProtocol: z.enum(['md5', 'sha', 'sha256', 'none']).optional(),
        authKey: z.string().optional(),
        privProtocol: z.enum(['des', 'aes', 'aes256b', 'none']).optional(),
        privKey: z.string().optional()
      })
      .optional()
  })
});

type SwitchFormData = z.infer<typeof switchFormSchema>;

interface AddSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSwitchModal: React.FC<AddSwitchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SwitchFormData>({
    resolver: zodResolver(switchFormSchema),
    defaultValues: {
      name: '',
      ipAddress: '',
      vendor: 'HUAWEI',
      location: 'Data Center Rack 01',
      snmpConfig: {
        version: 'v2c',
        port: 161,
        community: 'public',
        v3: {
          username: 'snmpadmin',
          securityLevel: 'authPriv',
          authProtocol: 'sha',
          authKey: '',
          privProtocol: 'aes',
          privKey: ''
        }
      }
    }
  });

  const selectedVersion = watch('snmpConfig.version');
  const selectedSecLevel = watch('snmpConfig.v3.securityLevel');

  const handleTestConnection = async () => {
    const formData = watch();
    if (!formData.ipAddress) {
      setTestResult({ success: false, message: 'Please enter a valid IP address first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await ApiService.testConnection({
        ipAddress: formData.ipAddress,
        snmpConfig: formData.snmpConfig
      });
      if (res.success) {
        setTestResult({
          success: true,
          message: `SNMP reachability confirmed! SysDescr: ${res.sysDescr?.slice(0, 85)}...`
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'SNMP connection timed out or packet was rejected by switch'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: SwitchFormData) => {
    setSubmitError(null);
    try {
      await ApiService.createSwitch(data);
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to add switch. Check parameters.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Managed Switch"
      subtitle="Configure SNMP credentials for automated interface discovery and trap correlation"
      maxWidth="2xl"
    >
      {submitError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {testResult && (
        <div
          className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Switch Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Switch Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Huawei-S5720-Core01"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-medium"
            />
            {errors.name && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Management IP Address *
            </label>
            <input
              type="text"
              {...register('ipAddress')}
              placeholder="e.g. 192.168.1.254"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
            {errors.ipAddress && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.ipAddress.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vendor Profile *
            </label>
            <select
              {...register('vendor')}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
            >
              <option value="HUAWEI">Huawei (Target S5720 Series)</option>
              <option value="CISCO">Cisco (Catalyst / Nexus)</option>
              <option value="OPTILINK">Optilink (OP-MEN 95612 / L3 Series)</option>
              <option value="ARUBA">HPE / Aruba</option>
              <option value="JUNIPER">Juniper Junos</option>
              <option value="MIKROTIK">MikroTik RouterOS</option>
              <option value="GENERIC">Generic Standard IF-MIB</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Physical Location
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="e.g. Server Room B, Rack 04"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* SNMP Parameters */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              SNMP Protocol Security
            </span>
            <div className="flex rounded-lg bg-slate-950/90 border border-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setValue('snmpConfig.version', 'v2c')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedVersion === 'v2c'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SNMP v2c
              </button>
              <button
                type="button"
                onClick={() => setValue('snmpConfig.version', 'v3')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedVersion === 'v3'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SNMP v3 (USM)
              </button>
            </div>
          </div>

          {selectedVersion === 'v2c' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Community String
                </label>
                <input
                  type="password"
                  {...register('snmpConfig.community')}
                  placeholder="public"
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Encrypted at rest with AES-256-GCM before saving to database
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  SNMP UDP Port
                </label>
                <input
                  type="number"
                  {...register('snmpConfig.port', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400 font-semibold"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    v3 Security Username
                  </label>
                  <input
                    type="text"
                    {...register('snmpConfig.v3.username')}
                    placeholder="snmpadmin"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Security Level
                  </label>
                  <select
                    {...register('snmpConfig.v3.securityLevel')}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="authPriv">authPriv (Authentication + Encryption)</option>
                    <option value="authNoPriv">authNoPriv (Authentication Only)</option>
                    <option value="noAuthNoPriv">noAuthNoPriv</option>
                  </select>
                </div>
              </div>

              {selectedSecLevel !== 'noAuthNoPriv' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Auth Protocol
                    </label>
                    <select
                      {...register('snmpConfig.v3.authProtocol')}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="sha">SHA-1</option>
                      <option value="sha256">SHA-256</option>
                      <option value="md5">MD5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Auth Password / Key
                    </label>
                    <input
                      type="password"
                      {...register('snmpConfig.v3.authKey')}
                      placeholder="Auth pass phrase"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedSecLevel === 'authPriv' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Privacy Protocol
                    </label>
                    <select
                      {...register('snmpConfig.v3.privProtocol')}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="aes">AES-128</option>
                      <option value="aes256b">AES-256</option>
                      <option value="des">DES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Privacy Password / Key
                    </label>
                    <input
                      type="password"
                      {...register('snmpConfig.v3.privKey')}
                      placeholder="Privacy pass phrase"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isTesting}
            icon={<Wifi className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Test SNMP Ping
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save & Discover Ports
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
