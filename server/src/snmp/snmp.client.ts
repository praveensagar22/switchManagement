import snmp from 'net-snmp';
import {
  SnmpConfig,
  SwitchSystemInfo,
  SnmpAuthProtocol,
  SnmpPrivProtocol,
  SnmpSecurityLevel
} from '../core/types/switch.types.js';
import { NormalizedInterface } from '../core/types/interface.types.js';
import { STANDARD_OIDS, mapOperStatus, mapAdminStatus, formatMacAddress } from './mibs/oids.standard.js';
import { IVendorAdapter } from './adapters/vendor.adapter.interface.js';
import { VendorAdapterFactory } from './adapters/adapter.factory.js';

export interface SnmpSessionOptions {
  ipAddress: string;
  config: SnmpConfig;
}

export class SnmpClient {
  /**
   * Helper to map string auth protocol to net-snmp AuthProtocols enum
   */
  private static mapAuthProtocol(proto?: SnmpAuthProtocol): number {
    switch (proto) {
      case 'md5':
        return snmp.AuthProtocols.md5;
      case 'sha':
        return snmp.AuthProtocols.sha;
      case 'sha256':
        return snmp.AuthProtocols.sha256;
      default:
        return snmp.AuthProtocols.none;
    }
  }

  /**
   * Helper to map string priv protocol to net-snmp PrivProtocols enum
   */
  private static mapPrivProtocol(proto?: SnmpPrivProtocol): number {
    switch (proto) {
      case 'des':
        return snmp.PrivProtocols.des;
      case 'aes':
        return snmp.PrivProtocols.aes;
      case 'aes256b':
        return snmp.PrivProtocols.aes256b;
      default:
        return snmp.PrivProtocols.none;
    }
  }

  /**
   * Helper to map string security level to net-snmp SecurityLevel enum
   */
  private static mapSecurityLevel(level?: SnmpSecurityLevel): number {
    switch (level) {
      case 'authPriv':
        return snmp.SecurityLevel.authPriv;
      case 'authNoPriv':
        return snmp.SecurityLevel.authNoPriv;
      case 'noAuthNoPriv':
      default:
        return snmp.SecurityLevel.noAuthNoPriv;
    }
  }

  /**
   * Creates a net-snmp session for v2c or v3
   */
  public static createSession(options: SnmpSessionOptions): snmp.Session {
    const { ipAddress, config } = options;
    const port = config.port || 161;
    const timeout = config.timeout || 4000;
    const retries = config.retries || 1;

    if (config.version === 'v3' && config.v3) {
      const user: snmp.User = {
        name: config.v3.username,
        level: this.mapSecurityLevel(config.v3.securityLevel),
        authProtocol: this.mapAuthProtocol(config.v3.authProtocol),
        authKey: config.v3.authKey,
        privProtocol: this.mapPrivProtocol(config.v3.privProtocol),
        privKey: config.v3.privKey
      };

      return snmp.createV3Session(ipAddress, user, {
        port,
        timeout,
        retries
      });
    }

    // Default to v2c
    const community = config.community || 'public';
    return snmp.createSession(ipAddress, community, {
      port,
      version: snmp.Version2c,
      timeout,
      retries
    });
  }

  /**
   * Performs a Promisified SNMP GET on specified OIDs
   */
  public static async get(session: snmp.Session, oids: string[]): Promise<snmp.Varbind[]> {
    return new Promise((resolve, reject) => {
      session.get(oids, (error, varbinds) => {
        if (error) {
          return reject(error);
        }
        if (!varbinds) {
          return resolve([]);
        }
        // Check for SNMP error in individual varbind
        for (const vb of varbinds) {
          if (snmp.isVarbindError(vb)) {
            // NoSuchObject or NoSuchInstance - we still return the varbinds, caller checks
          }
        }
        resolve(varbinds);
      });
    });
  }

  /**
   * Performs a Promisified SNMP Subtree / Walk
   */
  public static async walk(session: snmp.Session, rootOid: string): Promise<snmp.Varbind[]> {
    return new Promise((resolve, reject) => {
      const results: snmp.Varbind[] = [];
      session.subtree(
        rootOid,
        (varbinds) => {
          for (const vb of varbinds) {
            results.push(vb);
          }
        },
        (error) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        }
      );
    });
  }

  /**
   * Retrieves high-level system information (sysDescr, sysObjectID, sysUpTime, etc.)
   */
  public static async getSystemInfo(session: snmp.Session): Promise<SwitchSystemInfo> {
    const oids = [
      STANDARD_OIDS.SYS_DESCR,
      STANDARD_OIDS.SYS_OBJECT_ID,
      STANDARD_OIDS.SYS_UP_TIME,
      STANDARD_OIDS.SYS_NAME,
      STANDARD_OIDS.SYS_LOCATION
    ];

    const varbinds = await this.get(session, oids);
    const info: SwitchSystemInfo = {};

    for (const vb of varbinds) {
      if (snmp.isVarbindError(vb)) continue;

      if (vb.oid === STANDARD_OIDS.SYS_DESCR) {
        info.sysDescr = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
      } else if (vb.oid === STANDARD_OIDS.SYS_OBJECT_ID) {
        info.sysObjectID = String(vb.value || '');
      } else if (vb.oid === STANDARD_OIDS.SYS_UP_TIME) {
        // TimeTicks: in hundredths of a second (10ms)
        const ticks = typeof vb.value === 'number' ? vb.value : parseInt(String(vb.value), 10);
        info.sysUpTime = Math.floor(ticks / 100); // in seconds
      } else if (vb.oid === STANDARD_OIDS.SYS_NAME) {
        info.sysName = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
      } else if (vb.oid === STANDARD_OIDS.SYS_LOCATION) {
        info.sysLocation = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
      }
    }

    return info;
  }

  /**
   * Walks both ifTable and ifXTable and produces normalized interface records
   */
  public static async discoverInterfaces(
    session: snmp.Session,
    adapter: IVendorAdapter
  ): Promise<NormalizedInterface[]> {
    // 1. Walk RFC 2863 standard IF-MIB Table
    const ifTableVarbinds = await this.walk(session, STANDARD_OIDS.IF_TABLE);

    // Map by ifIndex
    const portMap = new Map<number, Partial<NormalizedInterface>>();

    for (const vb of ifTableVarbinds) {
      if (snmp.isVarbindError(vb)) continue;
      const oid = vb.oid;
      const parts = oid.split('.');
      const ifIndex = parseInt(parts[parts.length - 1], 10);
      if (isNaN(ifIndex) || ifIndex <= 0) continue;

      if (!portMap.has(ifIndex)) {
        portMap.set(ifIndex, { ifIndex });
      }
      const entry = portMap.get(ifIndex)!;

      if (oid.startsWith(STANDARD_OIDS.IF_DESCR)) {
        entry.ifDescr = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
      } else if (oid.startsWith(STANDARD_OIDS.IF_TYPE)) {
        entry.ifType = typeof vb.value === 'number' ? vb.value : parseInt(String(vb.value), 10);
      } else if (oid.startsWith(STANDARD_OIDS.IF_SPEED)) {
        entry.ifSpeed = typeof vb.value === 'number' ? vb.value : parseInt(String(vb.value), 10);
      } else if (oid.startsWith(STANDARD_OIDS.IF_PHYS_ADDRESS)) {
        entry.macAddress = formatMacAddress(vb.value);
      } else if (oid.startsWith(STANDARD_OIDS.IF_ADMIN_STATUS)) {
        entry.ifAdminStatus = mapAdminStatus(vb.value);
      } else if (oid.startsWith(STANDARD_OIDS.IF_OPER_STATUS)) {
        entry.ifOperStatus = mapOperStatus(vb.value);
      }
    }

    // 2. Try to walk ifXTable (for exact physical ifName and 64-bit/HighSpeed)
    try {
      const ifXTableVarbinds = await this.walk(session, STANDARD_OIDS.IF_X_TABLE);
      for (const vb of ifXTableVarbinds) {
        if (snmp.isVarbindError(vb)) continue;
        const oid = vb.oid;
        const parts = oid.split('.');
        const ifIndex = parseInt(parts[parts.length - 1], 10);
        if (isNaN(ifIndex) || !portMap.has(ifIndex)) continue;

        const entry = portMap.get(ifIndex)!;
        if (oid.startsWith(STANDARD_OIDS.IF_NAME)) {
          entry.ifName = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
        } else if (oid.startsWith(STANDARD_OIDS.IF_HIGH_SPEED)) {
          entry.ifHighSpeed = typeof vb.value === 'number' ? vb.value : parseInt(String(vb.value), 10);
        } else if (oid.startsWith(STANDARD_OIDS.IF_ALIAS)) {
          entry.ifAlias = Buffer.isBuffer(vb.value) ? vb.value.toString('utf8') : String(vb.value || '');
        }
      }
    } catch (e) {
      // Some simple switches may not support ifXTable; ignore and fall back to ifTable
    }

    // 3. Normalize all interfaces through the selected vendor adapter
    const normalizedList: NormalizedInterface[] = [];
    for (const [, partial] of portMap.entries()) {
      normalizedList.push(adapter.normalizeInterface(partial));
    }

    return normalizedList.sort((a, b) => a.ifIndex - b.ifIndex);
  }
}
