import { Types } from 'mongoose';
import { SwitchModel, ISwitch } from '../models/Switch.model.js';
import { InterfaceModel } from '../models/Interface.model.js';
import { AlertModel } from '../models/Alert.model.js';
import { SnmpClient } from '../snmp/snmp.client.js';
import { VendorAdapterFactory } from '../snmp/adapters/adapter.factory.js';
import { encryptCredential, decryptCredential } from '../security/crypto.js';
import { SnmpConfig, SwitchVendor } from '../core/types/switch.types.js';
import { NotFoundError, BadRequestError } from '../core/errors/app.error.js';
import { SocketServer } from '../websocket/socket.server.js';
import { AlertService } from './alert.service.js';

export interface CreateSwitchInput {
  name: string;
  hostname?: string;
  ipAddress: string;
  vendor?: SwitchVendor;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  location?: string;
  snmpConfig: {
    version: 'v2c' | 'v3';
    port?: number;
    community?: string;
    v3?: {
      username: string;
      securityLevel: 'noAuthNoPriv' | 'authNoPriv' | 'authPriv';
      authProtocol?: 'md5' | 'sha' | 'sha256' | 'none';
      authKey?: string;
      privProtocol?: 'des' | 'aes' | 'aes256b' | 'none';
      privKey?: string;
    };
    timeout?: number;
    retries?: number;
  };
}

export class SwitchService {
  /**
   * Helper to decrypt stored credentials into runtime SnmpConfig
   */
  public static getDecryptedSnmpConfig(switchDoc: ISwitch): SnmpConfig {
    const raw = switchDoc.snmpConfig;
    const config: SnmpConfig = {
      version: raw.version,
      port: raw.port || 161,
      timeout: raw.timeout || 4000,
      retries: raw.retries || 1
    };

    if (raw.version === 'v2c') {
      config.community = raw.communityEncrypted ? decryptCredential(raw.communityEncrypted) : 'public';
    } else if (raw.version === 'v3' && raw.v3) {
      config.v3 = {
        username: raw.v3.username,
        securityLevel: raw.v3.securityLevel,
        authProtocol: raw.v3.authProtocol,
        authKey: raw.v3.authKeyEncrypted ? decryptCredential(raw.v3.authKeyEncrypted) : undefined,
        privProtocol: raw.v3.privProtocol,
        privKey: raw.v3.privKeyEncrypted ? decryptCredential(raw.v3.privKeyEncrypted) : undefined
      };
    }

    return config;
  }

  /**
   * Tests SNMP reachability with given parameters
   */
  public static async testConnection(input: {
    ipAddress: string;
    snmpConfig: CreateSwitchInput['snmpConfig'];
  }): Promise<{ success: boolean; sysDescr?: string; sysObjectID?: string; error?: string }> {
    const runtimeConfig: SnmpConfig = {
      version: input.snmpConfig.version,
      port: input.snmpConfig.port || 161,
      community: input.snmpConfig.community,
      v3: input.snmpConfig.v3,
      timeout: 3000,
      retries: 1
    };

    let session: any = null;
    try {
      session = SnmpClient.createSession({
        ipAddress: input.ipAddress,
        config: runtimeConfig
      });

      const sysInfo = await SnmpClient.getSystemInfo(session);
      return {
        success: true,
        sysDescr: sysInfo.sysDescr,
        sysObjectID: sysInfo.sysObjectID
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'SNMP connection timed out or rejected'
      };
    } finally {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    }
  }

  /**
   * Registers a new switch and immediately triggers discovery
   */
  public static async createSwitch(input: CreateSwitchInput): Promise<ISwitch> {
    const existing = await SwitchModel.findOne({ ipAddress: input.ipAddress });
    if (existing) {
      throw new BadRequestError(`Switch with IP address ${input.ipAddress} already exists.`);
    }

    // Encrypt credentials at rest
    let communityEncrypted: string | undefined = undefined;
    let authKeyEncrypted: string | undefined = undefined;
    let privKeyEncrypted: string | undefined = undefined;

    if (input.snmpConfig.version === 'v2c') {
      communityEncrypted = encryptCredential(input.snmpConfig.community || 'public');
    } else if (input.snmpConfig.version === 'v3' && input.snmpConfig.v3) {
      if (input.snmpConfig.v3.authKey) {
        authKeyEncrypted = encryptCredential(input.snmpConfig.v3.authKey);
      }
      if (input.snmpConfig.v3.privKey) {
        privKeyEncrypted = encryptCredential(input.snmpConfig.v3.privKey);
      }
    }

    const switchDoc = await SwitchModel.create({
      name: input.name,
      hostname: input.hostname,
      ipAddress: input.ipAddress,
      vendor: input.vendor || 'GENERIC',
      model: input.model,
      serialNumber: input.serialNumber,
      firmwareVersion: input.firmwareVersion,
      location: input.location,
      snmpConfig: {
        version: input.snmpConfig.version,
        port: input.snmpConfig.port || 161,
        communityEncrypted,
        v3: input.snmpConfig.v3
          ? {
              username: input.snmpConfig.v3.username,
              securityLevel: input.snmpConfig.v3.securityLevel,
              authProtocol: input.snmpConfig.v3.authProtocol,
              authKeyEncrypted,
              privProtocol: input.snmpConfig.v3.privProtocol,
              privKeyEncrypted
            }
          : undefined,
        timeout: input.snmpConfig.timeout || 3000,
        retries: input.snmpConfig.retries || 2
      },
      connectionStatus: 'UNKNOWN'
    });

    // Run discovery asynchronously in background so client gets instant response
    this.syncSwitchInterfaces(switchDoc._id.toString()).catch((err) => {
      console.error(`[SwitchService] Initial discovery failed for switch ${switchDoc.name}:`, err.message || err);
    });

    return switchDoc;
  }

  /**
   * Retrieves all switches with live port count summaries
   */
  public static async getAllSwitches(): Promise<any[]> {
    const switches = await SwitchModel.find().sort({ createdAt: -1 }).lean();

    // Attach port counts
    const results = await Promise.all(
      switches.map(async (sw) => {
        const ports = await InterfaceModel.find({ switchId: sw._id }).select('ifOperStatus').lean();
        const totalPorts = ports.length;
        const upPorts = ports.filter((p) => p.ifOperStatus === 'UP').length;
        const downPorts = ports.filter((p) => p.ifOperStatus === 'DOWN').length;

        // Strip encrypted credentials from returned payload
        delete (sw as any).snmpConfig?.communityEncrypted;
        if ((sw as any).snmpConfig?.v3) {
          delete (sw as any).snmpConfig.v3.authKeyEncrypted;
          delete (sw as any).snmpConfig.v3.privKeyEncrypted;
        }

        return {
          ...sw,
          portSummary: {
            total: totalPorts,
            up: upPorts,
            down: downPorts
          }
        };
      })
    );

    return results;
  }

  /**
   * Retrieves single switch by ID
   */
  public static async getSwitchById(id: string): Promise<ISwitch> {
    const switchDoc = await SwitchModel.findById(id);
    if (!switchDoc) {
      throw new NotFoundError('Switch not found');
    }
    return switchDoc;
  }

  /**
   * Updates an existing switch
   */
  public static async updateSwitch(id: string, updates: Partial<CreateSwitchInput>): Promise<ISwitch> {
    const switchDoc = await SwitchModel.findById(id);
    if (!switchDoc) {
      throw new NotFoundError('Switch not found');
    }

    if (updates.name) switchDoc.name = updates.name;
    if (updates.hostname !== undefined) switchDoc.hostname = updates.hostname;
    if (updates.location !== undefined) switchDoc.location = updates.location;
    if (updates.vendor) switchDoc.vendor = updates.vendor;

    if (updates.snmpConfig) {
      switchDoc.snmpConfig.version = updates.snmpConfig.version;
      if (updates.snmpConfig.port) switchDoc.snmpConfig.port = updates.snmpConfig.port;

      if (updates.snmpConfig.version === 'v2c' && updates.snmpConfig.community) {
        switchDoc.snmpConfig.communityEncrypted = encryptCredential(updates.snmpConfig.community);
      }

      if (updates.snmpConfig.version === 'v3' && updates.snmpConfig.v3) {
        switchDoc.snmpConfig.v3 = {
          username: updates.snmpConfig.v3.username,
          securityLevel: updates.snmpConfig.v3.securityLevel,
          authProtocol: updates.snmpConfig.v3.authProtocol,
          authKeyEncrypted: updates.snmpConfig.v3.authKey
            ? encryptCredential(updates.snmpConfig.v3.authKey)
            : switchDoc.snmpConfig.v3?.authKeyEncrypted,
          privProtocol: updates.snmpConfig.v3.privProtocol,
          privKeyEncrypted: updates.snmpConfig.v3.privKey
            ? encryptCredential(updates.snmpConfig.v3.privKey)
            : switchDoc.snmpConfig.v3?.privKeyEncrypted
        };
      }
    }

    await switchDoc.save();
    return switchDoc;
  }

  /**
   * Deletes a switch and all associated interfaces and alerts
   */
  public static async deleteSwitch(id: string): Promise<void> {
    const switchDoc = await SwitchModel.findById(id);
    if (!switchDoc) {
      throw new NotFoundError('Switch not found');
    }

    await InterfaceModel.deleteMany({ switchId: switchDoc._id });
    await AlertModel.deleteMany({ switchId: switchDoc._id });
    await SwitchModel.findByIdAndDelete(id);

    console.log(`[SwitchService] Deleted switch ${switchDoc.name} (${switchDoc.ipAddress})`);
  }

  /**
   * Performs full discovery and interface synchronization
   */
  public static async syncSwitchInterfaces(switchId: string): Promise<{ interfaceCount: number }> {
    const switchDoc = await SwitchModel.findById(switchId);
    if (!switchDoc) {
      throw new NotFoundError('Switch not found');
    }

    const decryptedConfig = this.getDecryptedSnmpConfig(switchDoc);
    let session: any = null;

    try {
      console.log(`[SwitchService] Starting discovery for ${switchDoc.name} (${switchDoc.ipAddress})...`);
      session = SnmpClient.createSession({
        ipAddress: switchDoc.ipAddress,
        config: decryptedConfig
      });

      // 1. Fetch system information
      const sysInfo = await SnmpClient.getSystemInfo(session);
      if (sysInfo.sysObjectID) switchDoc.sysObjectID = sysInfo.sysObjectID;
      if (sysInfo.sysDescr) switchDoc.sysDescr = sysInfo.sysDescr;
      if (sysInfo.sysUpTime !== undefined) switchDoc.uptimeSeconds = sysInfo.sysUpTime;

      // 2. Resolve adapter
      let adapter = VendorAdapterFactory.getAdapterByVendor(switchDoc.vendor);
      if (switchDoc.vendor === 'GENERIC' && (sysInfo.sysObjectID || sysInfo.sysDescr)) {
        adapter = VendorAdapterFactory.detectAdapter(sysInfo.sysObjectID, sysInfo.sysDescr);
        switchDoc.vendor = adapter.vendor;
      }

      // 3. Extract hardware info (Model, Serial, Firmware)
      const hwInfo = adapter.extractHardwareInfo(sysInfo.sysDescr || '', sysInfo.sysObjectID || '');
      if (hwInfo.model && (!switchDoc.get('model') || switchDoc.get('model') === 'Managed Switch')) {
        switchDoc.set('model', hwInfo.model);
      }
      if (hwInfo.serialNumber && !switchDoc.serialNumber) {
        switchDoc.serialNumber = hwInfo.serialNumber;
      }
      if (hwInfo.firmwareVersion && !switchDoc.firmwareVersion) {
        switchDoc.firmwareVersion = hwInfo.firmwareVersion;
      }

      // 4. Walk interfaces
      const discoveredInterfaces = await SnmpClient.discoverInterfaces(session, adapter);

      // 5. Bulk upsert interfaces into MongoDB
      const bulkOps = discoveredInterfaces.map((iface) => ({
        updateOne: {
          filter: { switchId: switchDoc._id, ifIndex: iface.ifIndex },
          update: {
            $set: {
              ifName: iface.ifName,
              ifDescr: iface.ifDescr,
              ifAlias: iface.ifAlias,
              ifType: iface.ifType,
              ifTypeName: iface.ifTypeName,
              ifAdminStatus: iface.ifAdminStatus,
              ifOperStatus: iface.ifOperStatus,
              ifSpeed: iface.ifSpeed,
              ifHighSpeed: iface.ifHighSpeed,
              macAddress: iface.macAddress
            },
            $setOnInsert: {
              lastStatusChange: new Date()
            }
          },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        await InterfaceModel.bulkWrite(bulkOps);
      }

      // 6. Update switch status
      switchDoc.connectionStatus = 'ONLINE';
      switchDoc.lastSuccessfulPoll = new Date();
      await switchDoc.save();

      console.log(
        `[SwitchService] Discovered and synced ${discoveredInterfaces.length} interfaces for ${switchDoc.name}`
      );

      SocketServer.emitSwitchStatus(switchDoc._id.toString(), 'ONLINE', {
        interfaceCount: discoveredInterfaces.length
      });

      await AlertService.handleSwitchReachabilityChange(switchDoc, true);

      return { interfaceCount: discoveredInterfaces.length };
    } catch (error: any) {
      console.error(`[SwitchService] Sync failed for switch ${switchDoc.name}:`, error.message || error);
      switchDoc.connectionStatus = 'UNREACHABLE';
      await switchDoc.save();

      SocketServer.emitSwitchStatus(switchDoc._id.toString(), 'UNREACHABLE', { error: error.message });
      await AlertService.handleSwitchReachabilityChange(switchDoc, false, error.message);

      throw error;
    } finally {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    }
  }
}
