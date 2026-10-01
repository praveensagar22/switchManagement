import { Types } from 'mongoose';
import { InterfaceModel, IInterface } from '../models/Interface.model.js';
import { PortEventModel, IPortEvent } from '../models/PortEvent.model.js';
import { NotFoundError } from '../core/errors/app.error.js';

export interface InterfaceFilters {
  operStatus?: string;
  adminStatus?: string;
  search?: string;
}

export class InterfaceService {
  /**
   * Retrieves all interfaces for a switch with optional status filtering
   */
  public static async getInterfacesBySwitch(
    switchId: string,
    filters: InterfaceFilters = {}
  ): Promise<IInterface[]> {
    const query: any = { switchId: new Types.ObjectId(switchId) };

    if (filters.operStatus) {
      query.ifOperStatus = filters.operStatus.toUpperCase();
    }

    if (filters.adminStatus) {
      query.ifAdminStatus = filters.adminStatus.toUpperCase();
    }

    if (filters.search) {
      query.$or = [
        { ifName: { $regex: filters.search, $options: 'i' } },
        { ifDescr: { $regex: filters.search, $options: 'i' } },
        { ifAlias: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return InterfaceModel.find(query).sort({ ifIndex: 1 });
  }

  /**
   * Retrieves a single interface by its ID
   */
  public static async getInterfaceById(id: string): Promise<IInterface> {
    const iface = await InterfaceModel.findById(id);
    if (!iface) {
      throw new NotFoundError('Interface not found');
    }
    return iface;
  }

  /**
   * Retrieves history of events for a specific interface
   */
  public static async getInterfaceHistory(
    interfaceId: string,
    limit: number = 50,
    page: number = 1
  ): Promise<{ events: IPortEvent[]; total: number }> {
    const query = { interfaceId: new Types.ObjectId(interfaceId) };
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      PortEventModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      PortEventModel.countDocuments(query)
    ]);

    return { events, total };
  }
}
