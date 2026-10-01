import { BaseVendorAdapter } from './base.adapter.js';
import { HardwareInfo } from './vendor.adapter.interface.js';
import { SwitchVendor } from '../../core/types/switch.types.js';

export class CiscoAdapter extends BaseVendorAdapter {
  override readonly vendor: SwitchVendor = 'CISCO';

  override matches(sysObjectID: string, sysDescr: string): boolean {
    if (sysObjectID.startsWith('1.3.6.1.4.1.9.')) return true;
    if (sysDescr.toLowerCase().includes('cisco') || sysDescr.toLowerCase().includes('ios')) return true;
    return false;
  }

  override extractHardwareInfo(sysDescr: string = '', _sysObjectID: string = ''): HardwareInfo {
    let model = 'Cisco Switch';
    let firmwareVersion = 'Cisco IOS';

    const matchModel = sysDescr.match(/C(\d{4}[A-Za-z0-9\-]*)/i);
    if (matchModel) {
      model = `Cisco Catalyst ${matchModel[0]}`;
    }

    const matchVersion = sysDescr.match(/Version\s+([^,]+)/i);
    if (matchVersion) {
      firmwareVersion = matchVersion[1].trim();
    }

    return {
      vendor: 'CISCO',
      model,
      firmwareVersion
    };
  }
}
