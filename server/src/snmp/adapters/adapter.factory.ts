import { IVendorAdapter } from './vendor.adapter.interface.js';
import { BaseVendorAdapter } from './base.adapter.js';
import { HuaweiAdapter } from './huawei.adapter.js';
import { CiscoAdapter } from './cisco.adapter.js';
import { OptilinkAdapter } from './optilink.adapter.js';
import { SwitchVendor } from '../../core/types/switch.types.js';

export class VendorAdapterFactory {
  private static adapters: IVendorAdapter[] = [
    new HuaweiAdapter(),
    new CiscoAdapter(),
    new OptilinkAdapter(),
    new BaseVendorAdapter() // Default fallback
  ];

  public static getAdapterByVendor(vendor: SwitchVendor): IVendorAdapter {
    const found = this.adapters.find((a) => a.vendor === vendor);
    return found || this.adapters[this.adapters.length - 1]; // Fallback to Base
  }

  public static detectAdapter(sysObjectID: string = '', sysDescr: string = ''): IVendorAdapter {
    for (const adapter of this.adapters) {
      if (adapter.vendor !== 'GENERIC' && adapter.matches(sysObjectID, sysDescr)) {
        return adapter;
      }
    }
    // Return standard generic fallback
    return this.adapters[this.adapters.length - 1];
  }
}
