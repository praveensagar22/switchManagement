import { SwitchVendor } from '../../core/types/switch.types.js';
import { NormalizedInterface } from '../../core/types/interface.types.js';
import { NormalizedTrapPayload } from '../../core/types/event.types.js';

import { AdminStatus, OperStatus } from '../../core/types/interface.types.js';

export interface HardwareInfo {
  vendor: SwitchVendor;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export interface NormalizedTrapResult {
  ifIndex: number;
  ifName?: string;
  eventType: 'LINK_DOWN' | 'LINK_UP' | 'OTHER';
  adminStatus?: AdminStatus;
  operStatus: OperStatus;
}

export interface IVendorAdapter {
  readonly vendor: SwitchVendor;

  /**
   * Evaluates if this adapter matches the device based on sysObjectID and sysDescr
   */
  matches(sysObjectID: string, sysDescr: string): boolean;

  /**
   * Normalizes interface name (e.g. cleans up Huawei GigabitEthernet0/0/1 vs generic)
   */
  normalizeInterface(raw: Partial<NormalizedInterface>): NormalizedInterface;

  /**
   * Parses hardware details from system description or vendor-specific OIDs
   */
  extractHardwareInfo(sysDescr: string, sysObjectID: string, vendorOidResults?: Record<string, any>): HardwareInfo;

  /**
   * Vendor-specific extra OIDs to query during device discovery
   */
  getDiscoveryOids(): string[];

  /**
   * Parses trap varbinds. Returns normalized linkUp/linkDown result or null if unrecognized
   */
  parseTrap(payload: NormalizedTrapPayload): NormalizedTrapResult | null;
}
