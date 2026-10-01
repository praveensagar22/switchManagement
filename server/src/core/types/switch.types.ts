export type SnmpVersion = 'v2c' | 'v3';

export type SwitchVendor = 'HUAWEI' | 'CISCO' | 'ARUBA' | 'JUNIPER' | 'MIKROTIK' | 'OPTILINK' | 'GENERIC';

export type SwitchStatus = 'ONLINE' | 'OFFLINE' | 'UNREACHABLE' | 'UNKNOWN';

export type SnmpSecurityLevel = 'noAuthNoPriv' | 'authNoPriv' | 'authPriv';

export type SnmpAuthProtocol = 'md5' | 'sha' | 'sha256' | 'none';

export type SnmpPrivProtocol = 'des' | 'aes' | 'aes256b' | 'none';

export interface SnmpV3Config {
  username: string;
  securityLevel: SnmpSecurityLevel;
  authProtocol?: SnmpAuthProtocol;
  authKey?: string; // Plaintext when inputting, encrypted in DB
  privProtocol?: SnmpPrivProtocol;
  privKey?: string; // Plaintext when inputting, encrypted in DB
}

export interface SnmpConfig {
  version: SnmpVersion;
  port: number;
  community?: string; // v2c community plaintext when inputting, encrypted in DB
  v3?: SnmpV3Config;
  timeout?: number;
  retries?: number;
}

export interface SwitchSystemInfo {
  sysDescr?: string;
  sysObjectID?: string;
  sysUpTime?: number;
  sysName?: string;
  sysLocation?: string;
  vendor?: SwitchVendor;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}
