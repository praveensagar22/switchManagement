export type AdminStatus = 'UP' | 'DOWN' | 'TESTING';

export type OperStatus = 'UP' | 'DOWN' | 'TESTING' | 'UNKNOWN' | 'DORMANT' | 'NOT_PRESENT' | 'LOWER_LAYER_DOWN';

export interface NormalizedInterface {
  ifIndex: number;
  ifName: string;
  ifDescr: string;
  ifAlias?: string;
  ifType: number;
  ifTypeName?: string;
  ifAdminStatus: AdminStatus;
  ifOperStatus: OperStatus;
  ifSpeed: number; // in bps
  ifHighSpeed?: number; // in Mbps
  macAddress?: string;
  lastStatusChange?: Date;
}
