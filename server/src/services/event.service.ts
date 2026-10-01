import { NormalizedTrapPayload, EventSource } from '../core/types/event.types.js';
import { SwitchModel, ISwitch } from '../models/Switch.model.js';
import { InterfaceModel, IInterface } from '../models/Interface.model.js';
import { PortEventModel, IPortEvent } from '../models/PortEvent.model.js';
import { VendorAdapterFactory } from '../snmp/adapters/adapter.factory.js';
import { AlertService } from './alert.service.js';
import { SocketServer } from '../websocket/socket.server.js';
import { OperStatus } from '../core/types/interface.types.js';

export class EventService {
  /**
   * Processes normalized incoming SNMP trap
   */
  public static async handleIncomingTrap(payload: NormalizedTrapPayload): Promise<IPortEvent | null> {
    const { sourceIp, trapOid, varbinds } = payload;

    // 1. Locate Switch by IP address
    const switchDoc = await SwitchModel.findOne({ ipAddress: sourceIp });
    if (!switchDoc) {
      console.warn(`[EventService] Received trap from unknown switch IP: ${sourceIp}. Ignoring.`);
      return null;
    }

    // Update last seen trap timestamp
    switchDoc.lastSeenTrap = new Date();
    if (switchDoc.connectionStatus === 'UNREACHABLE' || switchDoc.connectionStatus === 'OFFLINE') {
      switchDoc.connectionStatus = 'ONLINE';
      await AlertService.handleSwitchReachabilityChange(switchDoc, true);
    }
    await switchDoc.save();

    // 2. Resolve vendor adapter
    const adapter = VendorAdapterFactory.getAdapterByVendor(switchDoc.vendor);
    const trapResult = adapter.parseTrap(payload);

    if (!trapResult) {
      console.log(
        `[EventService] Trap ${trapOid} from switch ${switchDoc.name} is not a recognized linkUp/linkDown event.`
      );
      return null;
    }

    const { ifIndex, eventType, operStatus, adminStatus } = trapResult;

    // 3. Locate the Interface
    const interfaceDoc = await InterfaceModel.findOne({
      switchId: switchDoc._id,
      ifIndex
    });

    if (!interfaceDoc) {
      console.warn(
        `[EventService] Interface with ifIndex ${ifIndex} on switch ${switchDoc.name} not found in database.`
      );
      return null;
    }

    const previousOperStatus = interfaceDoc.ifOperStatus;
    const newOperStatus = operStatus;

    // Update interface operational and admin status
    interfaceDoc.ifOperStatus = newOperStatus;
    if (adminStatus) {
      interfaceDoc.ifAdminStatus = adminStatus;
    }
    interfaceDoc.lastStatusChange = new Date();
    await interfaceDoc.save();

    // 4. Create immutable PortEvent audit record
    const portEvent = await PortEventModel.create({
      switchId: switchDoc._id,
      interfaceId: interfaceDoc._id,
      ifIndex,
      ifName: interfaceDoc.ifName,
      eventType,
      previousOperStatus,
      newOperStatus,
      source: 'TRAP',
      timestamp: new Date(),
      rawTrapData: {
        trapOid,
        varbinds
      }
    });

    console.log(
      `[EventService] Port Event recorded: Switch [${switchDoc.name}] Port [${interfaceDoc.ifName}] ${previousOperStatus} -> ${newOperStatus} (via TRAP)`
    );

    // 5. Emit real-time WebSocket event
    SocketServer.emitPortStatus({
      switchId: switchDoc._id.toString(),
      interfaceId: interfaceDoc._id.toString(),
      ifIndex,
      ifName: interfaceDoc.ifName,
      ifOperStatus: newOperStatus,
      previousOperStatus,
      timestamp: new Date()
    });

    // 6. Alert lifecycle evaluation
    await AlertService.handlePortStateChange(switchDoc, interfaceDoc, previousOperStatus, newOperStatus);

    return portEvent;
  }

  /**
   * Records a port state change detected during periodic polling (fallback/reconciliation)
   */
  public static async recordPolledStateChange(
    switchDoc: ISwitch,
    interfaceDoc: IInterface,
    newOperStatus: OperStatus
  ): Promise<IPortEvent | null> {
    const previousOperStatus = interfaceDoc.ifOperStatus;
    if (previousOperStatus === newOperStatus) {
      return null; // No state change
    }

    const eventType = newOperStatus === 'DOWN' ? 'LINK_DOWN' : 'LINK_UP';

    interfaceDoc.ifOperStatus = newOperStatus;
    interfaceDoc.lastStatusChange = new Date();
    await interfaceDoc.save();

    const portEvent = await PortEventModel.create({
      switchId: switchDoc._id,
      interfaceId: interfaceDoc._id,
      ifIndex: interfaceDoc.ifIndex,
      ifName: interfaceDoc.ifName,
      eventType,
      previousOperStatus,
      newOperStatus,
      source: 'POLL',
      timestamp: new Date()
    });

    console.log(
      `[EventService] (Reconciliation) Port Event recorded: Switch [${switchDoc.name}] Port [${interfaceDoc.ifName}] ${previousOperStatus} -> ${newOperStatus} (via POLL)`
    );

    // Emit real-time WebSocket event
    SocketServer.emitPortStatus({
      switchId: switchDoc._id.toString(),
      interfaceId: interfaceDoc._id.toString(),
      ifIndex: interfaceDoc.ifIndex,
      ifName: interfaceDoc.ifName,
      ifOperStatus: newOperStatus,
      previousOperStatus,
      timestamp: new Date()
    });

    // Alert lifecycle evaluation
    await AlertService.handlePortStateChange(switchDoc, interfaceDoc, previousOperStatus, newOperStatus);

    return portEvent;
  }
}
