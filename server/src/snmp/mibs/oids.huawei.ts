export const HUAWEI_OIDS = {
  // Huawei Enterprise Root PEN (2011)
  ENTERPRISE_ROOT: '1.3.6.1.4.1.2011',

  // Huawei S5700 / S5720 sysObjectID branch prefix
  S5700_SYSOBJECTID_PREFIX: '1.3.6.1.4.1.2011.2.23',

  // HUAWEI-DEVICE-MIB / Entity MIB for Hardware inventory
  ENTITY_SERIAL_NUMBER: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5',
  ENTITY_MANUFACTURE_DATE: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.6',
  ENTITY_DEVICE_DESCRIPTION: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7',

  // Huawei Environment / Health (Optional telemetry)
  SYSTEM_TEMPERATURE: '1.3.6.1.4.1.2011.6.3.4.1.2',
  CPU_USAGE: '1.3.6.1.4.1.2011.6.3.4.1.3',
  MEMORY_USAGE: '1.3.6.1.4.1.2011.6.3.4.1.4'
} as const;

export function isHuaweiDevice(sysObjectID: string = '', sysDescr: string = ''): boolean {
  if (sysObjectID.includes(HUAWEI_OIDS.ENTERPRISE_ROOT)) return true;
  if (sysDescr.toLowerCase().includes('huawei') || sysDescr.toLowerCase().includes('vrp')) return true;
  return false;
}
