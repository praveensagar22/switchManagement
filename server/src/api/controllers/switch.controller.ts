import { Request, Response, NextFunction } from 'express';
import { SwitchService } from '../../services/switch.service.js';

export class SwitchController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const switches = await SwitchService.getAllSwitches();
      res.json({
        success: true,
        count: switches.length,
        data: switches
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const switchDoc = await SwitchService.getSwitchById(req.params.id);
      res.json({
        success: true,
        data: switchDoc
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const switchDoc = await SwitchService.createSwitch(req.body);
      res.status(201).json({
        success: true,
        message: 'Switch added successfully. Discovery has been queued.',
        data: switchDoc
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const switchDoc = await SwitchService.updateSwitch(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Switch updated successfully',
        data: switchDoc
      });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SwitchService.deleteSwitch(req.params.id);
      res.json({
        success: true,
        message: 'Switch and associated data deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  public static async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SwitchService.testConnection(req.body);
      res.json({
        success: result.success,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SwitchService.syncSwitchInterfaces(req.params.id);
      res.json({
        success: true,
        message: `Synchronized ${result.interfaceCount} interfaces successfully`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
