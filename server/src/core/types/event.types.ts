import { OperStatus } from './interface.types.js';

export type PortEventType = 'LINK_DOWN' | 'LINK_UP' | 'ADMIN_CHANGE' | 'FLAPPING';

export type EventSource = 'TRAP' | 'POLL';

export interface TrapVarbind {
  oid: string;
  type?: number;
  value: any;
}

export interface NormalizedTrapPayload {
  sourceIp: string;
  trapOid: string;
  genericTrap?: number;
  specificTrap?: number;
  varbinds: TrapVarbind[];
  timestamp: Date;
}
