import { AdminStatus, OperStatus } from '../../core/types/interface.types.js';

export const STANDARD_OIDS = {
  // RFC 1213 / SNMPv2-MIB System Group
  SYS_DESCR: '1.3.6.1.2.1.1.1.0',
  SYS_OBJECT_ID: '1.3.6.1.2.1.1.2.0',
  SYS_UP_TIME: '1.3.6.1.2.1.1.3.0',
  SYS_CONTACT: '1.3.6.1.2.1.1.4.0',
  SYS_NAME: '1.3.6.1.2.1.1.5.0',
  SYS_LOCATION: '1.3.6.1.2.1.1.6.0',

  // RFC 2863 IF-MIB Table Roots
  IF_NUMBER: '1.3.6.1.2.1.2.1.0',
  IF_TABLE: '1.3.6.1.2.1.2.2',
  IF_INDEX: '1.3.6.1.2.1.2.2.1.1',
  IF_DESCR: '1.3.6.1.2.1.2.2.1.2',
  IF_TYPE: '1.3.6.1.2.1.2.2.1.3',
  IF_MTU: '1.3.6.1.2.1.2.2.1.4',
  IF_SPEED: '1.3.6.1.2.1.2.2.1.5',
  IF_PHYS_ADDRESS: '1.3.6.1.2.1.2.2.1.6',
  IF_ADMIN_STATUS: '1.3.6.1.2.1.2.2.1.7',
  IF_OPER_STATUS: '1.3.6.1.2.1.2.2.1.8',
  IF_LAST_CHANGE: '1.3.6.1.2.1.2.2.1.9',

  // RFC 2863 ifXTable Roots (Extended)
  IF_X_TABLE: '1.3.6.1.2.1.31.1.1',
  IF_NAME: '1.3.6.1.2.1.31.1.1.1.1',
  IF_HIGH_SPEED: '1.3.6.1.2.1.31.1.1.1.15',
  IF_ALIAS: '1.3.6.1.2.1.31.1.1.1.18',

  // Standard Trap OIDs
  SNMP_TRAP_OID: '1.3.6.1.6.3.1.1.4.1.0',
  LINK_DOWN_TRAP: '1.3.6.1.6.3.1.1.5.3',
  LINK_UP_TRAP: '1.3.6.1.6.3.1.1.5.4',
  COLD_START_TRAP: '1.3.6.1.6.3.1.1.5.1',
  WARM_START_TRAP: '1.3.6.1.6.3.1.1.5.2'
} as const;

export function mapOperStatus(val: any): OperStatus {
  const num = typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : Number(val);
  switch (num) {
    case 1:
      return 'UP';
    case 2:
      return 'DOWN';
    case 3:
      return 'TESTING';
    case 4:
      return 'UNKNOWN';
    case 5:
      return 'DORMANT';
    case 6:
      return 'NOT_PRESENT';
    case 7:
      return 'LOWER_LAYER_DOWN';
    default:
      return 'UNKNOWN';
  }
}

export function mapAdminStatus(val: any): AdminStatus {
  const num = typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : Number(val);
  switch (num) {
    case 1:
      return 'UP';
    case 2:
      return 'DOWN';
    case 3:
      return 'TESTING';
    default:
      return 'DOWN';
  }
}

export function formatMacAddress(bufferOrString: any): string {
  if (!bufferOrString) return '';
  if (Buffer.isBuffer(bufferOrString)) {
    return Array.from(bufferOrString)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();
  }
  if (typeof bufferOrString === 'string' && bufferOrString.length === 6) {
    return Array.from(Buffer.from(bufferOrString, 'binary'))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();
  }
  return String(bufferOrString);
}
