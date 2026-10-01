import { BaseVendorAdapter } from './base.adapter.js';
import { HardwareInfo } from './vendor.adapter.interface.js';
import { SwitchVendor } from '../../core/types/switch.types.js';
import { HUAWEI_OIDS, isHuaweiDevice } from '../mibs/oids.huawei.js';

export class HuaweiAdapter extends BaseVendorAdapter {
  override readonly vendor: SwitchVendor = 'HUAWEI';

  override matches(sysObjectID: string, sysDescr: string): boolean {
    return isHuaweiDevice(sysObjectID, sysDescr);
  }

  override getDiscoveryOids(): string[] {
    return [
      HUAWEI_OIDS.ENTITY_SERIAL_NUMBER,
      HUAWEI_OIDS.ENTITY_DEVICE_DESCRIPTION
    ];
  }

  override extractHardwareInfo(
    sysDescr: string = '',
    sysObjectID: string = '',
    vendorOidResults: Record<string, any> = {}
  ): HardwareInfo {
    let model = 'Huawei S5720';
    let firmwareVersion = 'VRP';
    let serialNumber: string | undefined = undefined;

    // 1. Extract Model from sysDescr
    // Common Huawei sysDescr:
    // "Huawei Versatile Routing Platform Software
    //  VRP (R) software, Version 5.170 (S5720 V200R011C10SPC600)
    //  Copyright (C) 2000-2018 HUAWEI TECH Co., Ltd.
    //  Huawei S5720-28P-PWR-LI-AC"
    const lines = sysDescr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.match(/Huawei\s+(S\d{4}[A-Za-z0-9\-]*)/i)) {
        const match = line.match(/Huawei\s+(S\d{4}[A-Za-z0-9\-]*)/i);
        if (match) model = `Huawei ${match[1]}`;
      } else if (line.match(/(S\d{4}[A-Za-z0-9\-]+)/i) && !line.includes('Version')) {
        const match = line.match(/(S\d{4}[A-Za-z0-9\-]+)/i);
        if (match) model = `Huawei ${match[1]}`;
      }

      if (line.includes('Version') || line.includes('VRP')) {
        firmwareVersion = line;
      }
    }

    // 2. Extract Serial Number from Huawei Entity MIB results if retrieved
    if (vendorOidResults) {
      for (const [oid, val] of Object.entries(vendorOidResults)) {
        if (oid.startsWith(HUAWEI_OIDS.ENTITY_SERIAL_NUMBER) && val) {
          const str = Buffer.isBuffer(val) ? val.toString('utf8') : String(val);
          if (str && str.trim().length > 3) {
            serialNumber = str.trim();
            break;
          }
        }
      }
    }

    return {
      vendor: 'HUAWEI',
      model,
      serialNumber,
      firmwareVersion
    };
  }
}
