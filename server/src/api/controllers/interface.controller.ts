import { Request, Response, NextFunction } from 'express';
import { InterfaceService } from '../../services/interface.service.js';

export class InterfaceController {
  public static async getBySwitch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { switchId } = req.params;
      const { operStatus, adminStatus, search } = req.query;

      const interfaces = await InterfaceService.getInterfacesBySwitch(switchId, {
        operStatus: operStatus as string,
        adminStatus: adminStatus as string,
        search: search as string
      });

      res.json({
        success: true,
        count: interfaces.length,
        data: interfaces
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const iface = await InterfaceService.getInterfaceById(req.params.id);
      res.json({
        success: true,
        data: iface
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const page = parseInt(req.query.page as string, 10) || 1;

      const result = await InterfaceService.getInterfaceHistory(req.params.id, limit, page);
      res.json({
        success: true,
        page,
        limit,
        total: result.total,
        data: result.events
      });
    } catch (err) {
      next(err);
    }
  }
}
