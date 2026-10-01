import { Types } from 'mongoose';
import { AlertModel, IAlert } from '../models/Alert.model.js';
import { ISwitch } from '../models/Switch.model.js';
import { IInterface } from '../models/Interface.model.js';
import { OperStatus } from '../core/types/interface.types.js';
import { NotificationService } from './notification.service.js';
import { SocketServer } from '../websocket/socket.server.js';
import { NotFoundError } from '../core/errors/app.error.js';

// In-memory sliding window flap detector: key = `${switchId}:${ifIndex}` -> array of transition timestamps
const flapTracker = new Map<string, number[]>();
const FLAP_WINDOW_MS = 60 * 1000; // 60 seconds
const FLAP_THRESHOLD = 4; // 4 transitions in 60s is considered flapping

export class AlertService {
  /**
   * Evaluates port transition and manages the alert lifecycle (trigger or resolve)
   */
  public static async handlePortStateChange(
    switchDoc: ISwitch,
    interfaceDoc: IInterface,
    previousStatus: OperStatus,
    newStatus: OperStatus
  ): Promise<IAlert | null> {
    const portKey = `${switchDoc._id}:${interfaceDoc.ifIndex}`;
    const now = Date.now();

    // 1. Flapping detection
    let timestamps = flapTracker.get(portKey) || [];
    timestamps = timestamps.filter((t) => now - t <= FLAP_WINDOW_MS);
    timestamps.push(now);
    flapTracker.set(portKey, timestamps);

    const isFlapping = timestamps.length >= FLAP_THRESHOLD;

    // 2. Port goes DOWN
    if (newStatus === 'DOWN') {
      // Check if there is already an active alert for this interface
      let activeAlert = await AlertModel.findOne({
        switchId: switchDoc._id,
        interfaceId: interfaceDoc._id,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (activeAlert) {
        // Alert already exists
        return activeAlert;
      }

      const alertType = isFlapping ? 'FLAPPING' : 'PORT_DOWN';
      const severity = isFlapping ? 'WARNING' : 'CRITICAL';
      const message = isFlapping
        ? `Port ${interfaceDoc.ifName} is FLAPPING (${timestamps.length} state changes in last 60s) on switch ${switchDoc.name}`
        : `Port ${interfaceDoc.ifName} link is DOWN on switch ${switchDoc.name} (${switchDoc.ipAddress})`;

      const newAlert = await AlertModel.create({
        switchId: switchDoc._id,
        interfaceId: interfaceDoc._id,
        ifIndex: interfaceDoc.ifIndex,
        ifName: interfaceDoc.ifName,
        alertType,
        severity,
        status: 'ACTIVE',
        message,
        triggeredAt: new Date(),
        notificationStatus: 'PENDING'
      });

      // Emit real-time WebSocket alert
      SocketServer.emitAlertNew(newAlert);

      // Trigger asynchronous email dispatch
      NotificationService.sendAlertEmail(newAlert, switchDoc, interfaceDoc).catch((err) => {
        console.error('[AlertService] Error dispatching alert email:', err);
      });

      return newAlert;
    }

    // 3. Port comes back UP -> Resolve existing active alert
    if (newStatus === 'UP') {
      const activeAlert = await AlertModel.findOne({
        switchId: switchDoc._id,
        interfaceId: interfaceDoc._id,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (activeAlert) {
        activeAlert.status = 'RESOLVED';
        activeAlert.resolvedAt = new Date();
        await activeAlert.save();

        console.log(
          `[AlertService] Alert resolved for port ${interfaceDoc.ifName} on switch ${switchDoc.name}`
        );

        // Emit real-time WebSocket resolution
        SocketServer.emitAlertResolved(activeAlert);

        // Dispatch resolution email
        NotificationService.sendAlertEmail(activeAlert, switchDoc, interfaceDoc).catch((err) => {
          console.error('[AlertService] Error dispatching alert resolution email:', err);
        });

        return activeAlert;
      }
    }

    return null;
  }

  /**
   * Handles switch reachability state changes
   */
  public static async handleSwitchReachabilityChange(
    switchDoc: ISwitch,
    isReachable: boolean,
    details?: string
  ): Promise<IAlert | null> {
    if (!isReachable) {
      let activeAlert = await AlertModel.findOne({
        switchId: switchDoc._id,
        alertType: 'DEVICE_UNREACHABLE',
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (activeAlert) return activeAlert;

      const message = `Switch ${switchDoc.name} (${switchDoc.ipAddress}) is UNREACHABLE! ${details || ''}`;
      const newAlert = await AlertModel.create({
        switchId: switchDoc._id,
        alertType: 'DEVICE_UNREACHABLE',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        message,
        triggeredAt: new Date(),
        notificationStatus: 'PENDING'
      });

      SocketServer.emitAlertNew(newAlert);
      NotificationService.sendAlertEmail(newAlert, switchDoc, null).catch(console.error);
      return newAlert;
    } else {
      // Reconnected -> Resolve
      const activeAlert = await AlertModel.findOne({
        switchId: switchDoc._id,
        alertType: 'DEVICE_UNREACHABLE',
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (activeAlert) {
        activeAlert.status = 'RESOLVED';
        activeAlert.resolvedAt = new Date();
        await activeAlert.save();

        SocketServer.emitAlertResolved(activeAlert);
        return activeAlert;
      }
    }
    return null;
  }

  /**
   * Acknowledges an active alert
   */
  public static async acknowledgeAlert(alertId: string, userId?: string): Promise<IAlert> {
    const alert = await AlertModel.findById(alertId);
    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    if (userId && Types.ObjectId.isValid(userId)) {
      alert.acknowledgedBy = new Types.ObjectId(userId);
    }
    await alert.save();

    SocketServer.emitAlertNew(alert); // Broadcast updated status
    return alert;
  }
}
