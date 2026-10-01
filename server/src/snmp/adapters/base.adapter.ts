import { IVendorAdapter, HardwareInfo, NormalizedTrapResult } from './vendor.adapter.interface.js';
import { SwitchVendor } from '../../core/types/switch.types.js';
import { NormalizedInterface } from '../../core/types/interface.types.js';
import { NormalizedTrapPayload } from '../../core/types/event.types.js';
import { STANDARD_OIDS, mapOperStatus, mapAdminStatus } from '../mibs/oids.standard.js';

export class BaseVendorAdapter implements IVendorAdapter {
  readonly vendor: SwitchVendor = 'GENERIC';

  matches(_sysObjectID: string, _sysDescr: string): boolean {
    return true; // Fallback matches anything
  }

  normalizeInterface(raw: Partial<NormalizedInterface>): NormalizedInterface {
    const ifIndex = raw.ifIndex ?? 0;
    const ifName = raw.ifName || raw.ifDescr || `Port-${ifIndex}`;
    const ifDescr = raw.ifDescr || ifName;
    const ifType = raw.ifType ?? 6;

    // Determine high speed or standard speed (bps)
    let speed = raw.ifSpeed || 0;
    if (raw.ifHighSpeed && raw.ifHighSpeed > 0) {
      speed = raw.ifHighSpeed * 1_000_000;
    }

    return {
      ifIndex,
      ifName: ifName.trim(),
      ifDescr: ifDescr.trim(),
      ifAlias: raw.ifAlias?.trim() || '',
      ifType,
      ifTypeName: raw.ifTypeName || 'ethernetCsmacd',
      ifAdminStatus: raw.ifAdminStatus || 'UP',
      ifOperStatus: raw.ifOperStatus || 'UNKNOWN',
      ifSpeed: speed,
      ifHighSpeed: raw.ifHighSpeed || (speed > 0 ? Math.floor(speed / 1_000_000) : 0),
      macAddress: raw.macAddress || undefined,
      lastStatusChange: raw.lastStatusChange || new Date()
    };
  }

  extractHardwareInfo(sysDescr: string = '', _sysObjectID: string = ''): HardwareInfo {
    return {
      vendor: this.vendor,
      model: 'Managed Switch',
      serialNumber: undefined,
      firmwareVersion: sysDescr.split('\n')[0] || undefined
    };
  }

  getDiscoveryOids(): string[] {
    return [];
  }

  parseTrap(payload: NormalizedTrapPayload): NormalizedTrapResult | null {
    const { trapOid, genericTrap, varbinds } = payload;

    const isLinkDown =
      trapOid === STANDARD_OIDS.LINK_DOWN_TRAP ||
      trapOid.endsWith('.5.3') ||
      genericTrap === 2;

    const isLinkUp =
      trapOid === STANDARD_OIDS.LINK_UP_TRAP ||
      trapOid.endsWith('.5.4') ||
      genericTrap === 3;

    if (!isLinkDown && !isLinkUp) {
      return null;
    }

    let ifIndex: number | null = null;
    let operStatusVal: any = isLinkDown ? 2 : 1;
    let adminStatusVal: any = undefined;

    // Search varbinds for ifIndex (1.3.6.1.2.1.2.2.1.1.<ifIndex>), ifAdminStatus (.7), ifOperStatus (.8)
    for (const vb of varbinds) {
      const oid = vb.oid;

      if (oid.startsWith(STANDARD_OIDS.IF_INDEX)) {
        ifIndex = typeof vb.value === 'number' ? vb.value : parseInt(String(vb.value), 10);
      } else if (oid.startsWith(STANDARD_OIDS.IF_OPER_STATUS)) {
        operStatusVal = vb.value;
        if (ifIndex === null) {
          // Extract trailing instance index from OID if present
          const parts = oid.split('.');
          const last = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(last)) ifIndex = last;
        }
      } else if (oid.startsWith(STANDARD_OIDS.IF_ADMIN_STATUS)) {
        adminStatusVal = vb.value;
      }
    }

    // If ifIndex was not in varbind values, check if any varbind OID had the instance suffix
    if (ifIndex === null) {
      for (const vb of varbinds) {
        const parts = vb.oid.split('.');
        const lastPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastPart) && lastPart > 0 && lastPart < 65535) {
          ifIndex = lastPart;
          break;
        }
      }
    }

    if (ifIndex === null || isNaN(ifIndex)) {
      return null;
    }

    const operStatus = mapOperStatus(operStatusVal);
    const adminStatus = adminStatusVal !== undefined ? mapAdminStatus(adminStatusVal) : undefined;

    return {
      ifIndex,
      eventType: isLinkDown ? 'LINK_DOWN' : 'LINK_UP',
      adminStatus,
      operStatus
    };
  }
}
