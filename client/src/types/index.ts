export type SwitchVendor = 'HUAWEI' | 'CISCO' | 'ARUBA' | 'JUNIPER' | 'MIKROTIK' | 'OPTILINK' | 'GENERIC';

export type SwitchStatus = 'ONLINE' | 'OFFLINE' | 'UNREACHABLE' | 'UNKNOWN';

export type AdminStatus = 'UP' | 'DOWN' | 'TESTING';

export type OperStatus = 'UP' | 'DOWN' | 'TESTING' | 'UNKNOWN' | 'DORMANT' | 'NOT_PRESENT' | 'LOWER_LAYER_DOWN';

export type AlertSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INFO';

export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';

export type AlertType = 'PORT_DOWN' | 'DEVICE_UNREACHABLE' | 'FLAPPING';

export interface SnmpV3Config {
  username: string;
  securityLevel: 'noAuthNoPriv' | 'authNoPriv' | 'authPriv';
  authProtocol?: 'md5' | 'sha' | 'sha256' | 'none';
  authKey?: string;
  privProtocol?: 'des' | 'aes' | 'aes256b' | 'none';
  privKey?: string;
}

export interface SnmpConfig {
  version: 'v2c' | 'v3';
  port: number;
  community?: string;
  v3?: SnmpV3Config;
  timeout?: number;
  retries?: number;
}

export interface SwitchItem {
  _id: string;
  name: string;
  hostname?: string;
  ipAddress: string;
  vendor: SwitchVendor;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  location?: string;
  sysObjectID?: string;
  sysDescr?: string;
  uptimeSeconds?: number;
  snmpConfig: SnmpConfig;
  connectionStatus: SwitchStatus;
  lastSuccessfulPoll?: string;
  lastSeenTrap?: string;
  createdAt: string;
  updatedAt: string;
  portSummary?: {
    total: number;
    up: number;
    down: number;
  };
}

export interface InterfaceItem {
  _id: string;
  switchId: string;
  ifIndex: number;
  ifName: string;
  ifDescr: string;
  ifAlias?: string;
  ifType: number;
  ifTypeName?: string;
  ifAdminStatus: AdminStatus;
  ifOperStatus: OperStatus;
  ifSpeed: number;
  ifHighSpeed?: number;
  macAddress?: string;
  lastStatusChange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortEventItem {
  _id: string;
  switchId: {
    _id: string;
    name: string;
    ipAddress: string;
    vendor: string;
  } | string;
  interfaceId: {
    _id: string;
    ifName: string;
    ifDescr?: string;
  } | string;
  ifIndex: number;
  ifName?: string;
  eventType: 'LINK_DOWN' | 'LINK_UP' | 'ADMIN_CHANGE' | 'FLAPPING';
  previousOperStatus: OperStatus;
  newOperStatus: OperStatus;
  source: 'TRAP' | 'POLL';
  timestamp: string;
  rawTrapData?: any;
}

export interface AlertItem {
  _id: string;
  switchId: {
    _id: string;
    name: string;
    ipAddress: string;
    vendor: string;
  } | any;
  interfaceId?: {
    _id: string;
    ifName: string;
    ifOperStatus: string;
  } | any;
  ifIndex?: number;
  ifName?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  notificationStatus: string;
}

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface SystemHealthData {
  uptimeSeconds: number;
  database: {
    status: 'CONNECTED' | 'DISCONNECTED';
    name: string;
  };
  snmpTrapReceiver: {
    isListening: boolean;
    port: number;
    trapCount: number;
    lastError: string | null;
  };
  timestamp: string;
}
