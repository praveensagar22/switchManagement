import { Request, Response, NextFunction } from 'express';
import { PortEventModel } from '../../models/PortEvent.model.js';
import { Types } from 'mongoose';

export class EventController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { switchId, interfaceId, eventType, source, fromDate, toDate } = req.query;
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const page = parseInt(req.query.page as string, 10) || 1;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (switchId && Types.ObjectId.isValid(switchId as string)) {
        filter.switchId = new Types.ObjectId(switchId as string);
      }
      if (interfaceId && Types.ObjectId.isValid(interfaceId as string)) {
        filter.interfaceId = new Types.ObjectId(interfaceId as string);
      }
      if (eventType) {
        filter.eventType = eventType;
      }
      if (source) {
        filter.source = source;
      }
      if (fromDate || toDate) {
        filter.timestamp = {};
        if (fromDate) filter.timestamp.$gte = new Date(fromDate as string);
        if (toDate) filter.timestamp.$lte = new Date(toDate as string);
      }

      const [events, total] = await Promise.all([
        PortEventModel.find(filter)
          .populate('switchId', 'name ipAddress vendor')
          .populate('interfaceId', 'ifName ifDescr')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PortEventModel.countDocuments(filter)
      ]);

      res.json({
        success: true,
        page,
        limit,
        total,
        data: events
      });
    } catch (err) {
      next(err);
    }
  }
}
