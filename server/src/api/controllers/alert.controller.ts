import { Request, Response, NextFunction } from 'express';
import { AlertModel } from '../../models/Alert.model.js';
import { AlertService } from '../../services/alert.service.js';
import { Types } from 'mongoose';

export class AlertController {
  public static async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { severity, switchId } = req.query;
      const filter: any = { status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } };

      if (severity) filter.severity = severity;
      if (switchId && Types.ObjectId.isValid(switchId as string)) {
        filter.switchId = new Types.ObjectId(switchId as string);
      }

      const alerts = await AlertModel.find(filter)
        .populate('switchId', 'name ipAddress vendor')
        .populate('interfaceId', 'ifName ifOperStatus')
        .sort({ triggeredAt: -1 });

      res.json({
        success: true,
        count: alerts.length,
        data: alerts
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, severity, switchId } = req.query;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const page = parseInt(req.query.page as string, 10) || 1;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      if (switchId && Types.ObjectId.isValid(switchId as string)) {
        filter.switchId = new Types.ObjectId(switchId as string);
      }

      const [alerts, total] = await Promise.all([
        AlertModel.find(filter)
          .populate('switchId', 'name ipAddress vendor')
          .populate('interfaceId', 'ifName ifOperStatus')
          .sort({ triggeredAt: -1 })
          .skip(skip)
          .limit(limit),
        AlertModel.countDocuments(filter)
      ]);

      res.json({
        success: true,
        page,
        limit,
        total,
        data: alerts
      });
    } catch (err) {
      next(err);
    }
  }

  public static async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const alert = await AlertService.acknowledgeAlert(req.params.id, userId);

      res.json({
        success: true,
        message: 'Alert acknowledged',
        data: alert
      });
    } catch (err) {
      next(err);
    }
  }
}
