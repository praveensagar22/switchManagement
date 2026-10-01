import { SwitchModel, ISwitch, SwitchDocument } from '../models/Switch.model.js';
import { InterfaceModel } from '../models/Interface.model.js';
import { SwitchService } from './switch.service.js';
import { SnmpClient } from '../snmp/snmp.client.js';
import { EventService } from './event.service.js';
import { AlertService } from './alert.service.js';
import { SocketServer } from '../websocket/socket.server.js';
import { STANDARD_OIDS, mapOperStatus } from '../snmp/mibs/oids.standard.js';
import { config } from '../config/env.js';

export class PollingWorker {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning: boolean = false;

  public static start(): void {
    const intervalMs = config.pollIntervalMinutes * 60 * 1000;
    console.log(`[PollingWorker] Starting periodic reconciliation poller (every ${config.pollIntervalMinutes} min)`);

    // Run first poll after 10 seconds to allow services to start cleanly
    setTimeout(() => {
      this.pollAllSwitches();
    }, 10_000);

    this.timer = setInterval(() => {
      this.pollAllSwitches();
    }, intervalMs);
  }

  public static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[PollingWorker] Stopped periodic poller.');
  }

  public static async pollAllSwitches(): Promise<void> {
    if (this.isRunning) {
      console.log('[PollingWorker] Previous poll cycle still active. Skipping.');
      return;
    }

    this.isRunning = true;
    try {
      const switches = await SwitchModel.find({});
      for (const sw of switches) {
        await this.pollSingleSwitch(sw).catch((err) => {
          console.error(`[PollingWorker] Polling error for switch ${sw.name} (${sw.ipAddress}):`, err.message || err);
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  public static async pollSingleSwitch(switchDoc: SwitchDocument): Promise<void> {
    const snmpConfig = SwitchService.getDecryptedSnmpConfig(switchDoc);
    let session: any = null;

    try {
      session = SnmpClient.createSession({
        ipAddress: switchDoc.ipAddress,
        config: snmpConfig
      });

      // 1. Check reachability via sysUpTime
      const sysInfo = await SnmpClient.getSystemInfo(session);
      if (sysInfo.sysUpTime !== undefined) {
        switchDoc.uptimeSeconds = sysInfo.sysUpTime;
      }
      switchDoc.lastSuccessfulPoll = new Date();

      if (switchDoc.connectionStatus !== 'ONLINE') {
        switchDoc.connectionStatus = 'ONLINE';
        SocketServer.emitSwitchStatus(switchDoc._id.toString(), 'ONLINE');
        await AlertService.handleSwitchReachabilityChange(switchDoc, true);
      }
      await switchDoc.save();

      // 2. State Reconciliation: Walk ifOperStatus to catch missed traps
      const operStatusVarbinds = await SnmpClient.walk(session, STANDARD_OIDS.IF_OPER_STATUS);
      const dbInterfaces = await InterfaceModel.find({ switchId: switchDoc._id });
      const ifaceMap = new Map<number, any>();
      for (const iface of dbInterfaces) {
        ifaceMap.set(iface.ifIndex, iface);
      }

      for (const vb of operStatusVarbinds) {
        const parts = vb.oid.split('.');
        const ifIndex = parseInt(parts[parts.length - 1], 10);
        if (isNaN(ifIndex) || !ifaceMap.has(ifIndex)) continue;

        const currentIface = ifaceMap.get(ifIndex);
        const liveStatus = mapOperStatus(vb.value);

        if (currentIface.ifOperStatus !== liveStatus) {
          console.log(
            `[PollingWorker] State divergence detected for switch ${switchDoc.name} port ${currentIface.ifName}: DB is ${currentIface.ifOperStatus}, live is ${liveStatus}. Reconciling.`
          );
          await EventService.recordPolledStateChange(switchDoc, currentIface, liveStatus);
        }
      }
    } catch (error: any) {
      if (switchDoc.connectionStatus !== 'UNREACHABLE') {
        console.warn(`[PollingWorker] Switch ${switchDoc.name} (${switchDoc.ipAddress}) became UNREACHABLE.`);
        switchDoc.connectionStatus = 'UNREACHABLE';
        await switchDoc.save();

        SocketServer.emitSwitchStatus(switchDoc._id.toString(), 'UNREACHABLE', { error: error.message });
        await AlertService.handleSwitchReachabilityChange(switchDoc, false, error.message);
      }
    } finally {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    }
  }
}
