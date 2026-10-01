import { BaseVendorAdapter } from './base.adapter.js';
import { SwitchVendor } from '../../core/types/switch.types.js';
import { HardwareInfo } from './vendor.adapter.interface.js';
import { NormalizedInterface } from '../../core/types/interface.types.js';

/**
 * Optilink Networks Adapter
 * Supports Optilink OP-MEN 95612 Series and L3 managed Gigabit / 10G uplink switches
 */
export class OptilinkAdapter extends BaseVendorAdapter {
  readonly vendor: SwitchVendor = 'OPTILINK';

  matches(sysObjectID: string = '', sysDescr: string = ''): boolean {
    const lowerDescr = sysDescr.toLowerCase();
    const lowerOid = sysObjectID.toLowerCase();
    return (
      lowerDescr.includes('optilink') ||
      lowerDescr.includes('op-men') ||
      lowerDescr.includes('99828') ||
      lowerDescr.includes('99628') ||
      lowerDescr.includes('95612') ||
      lowerOid.includes('optilink')
    );
  }

  extractHardwareInfo(sysDescr: string = '', _sysObjectID: string = ''): HardwareInfo {
    let model = 'Optilink OP-MEN Series L3 Switch';
    let firmwareVersion: string | undefined = undefined;
    let serialNumber: string | undefined = undefined;

    if (sysDescr) {
      const lines = sysDescr.split('\n').map((l) => l.trim()).filter(Boolean);
      firmwareVersion = lines[0] || 'VestaOS / Realtek L3';

      if (sysDescr.includes('99828')) {
        model = 'Optilink OP-MEN 99828 L3 Switch';
      } else if (sysDescr.includes('99628')) {
        model = 'Optilink OP-MEN 99628 L3 Switch';
      } else if (sysDescr.includes('95612')) {
        model = 'Optilink OP-MEN 95612 L3 Switch';
      } else if (sysDescr.toLowerCase().includes('op-men')) {
        const match = sysDescr.match(/OP-MEN[ -]?\w+/i);
        if (match) model = `Optilink ${match[0]}`;
      }
    }

    return {
      vendor: this.vendor,
      model,
      serialNumber,
      firmwareVersion
    };
  }

  normalizeInterface(raw: Partial<NormalizedInterface>): NormalizedInterface {
    const base = super.normalizeInterface(raw);

    // Filter out internal CPU or loopback virtual ports if needed
    let name = base.ifName;
    if (!name || name.startsWith('Port-')) {
      if (base.ifIndex > 24) {
        name = `10GE1/0/${base.ifIndex - 24}`;
      } else {
        name = `GE1/0/${base.ifIndex}`;
      }
    }

    return {
      ...base,
      ifName: name
    };
  }
}
