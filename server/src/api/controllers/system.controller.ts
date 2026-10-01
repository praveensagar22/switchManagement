import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TrapReceiver } from '../../snmp/trap.receiver.js';
import { NotificationService } from '../../services/notification.service.js';
import { UserModel } from '../../models/User.model.js';
import { hashPassword } from '../../security/password.js';

export class SystemController {
  public static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbConnected = mongoose.connection.readyState === 1;
      const trapStatus = TrapReceiver.getStatus();

      res.json({
        success: true,
        data: {
          uptimeSeconds: Math.floor(process.uptime()),
          database: {
            status: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
            name: mongoose.connection.name
          },
          snmpTrapReceiver: trapStatus,
          timestamp: new Date()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async testEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Target email is required' });
        return;
      }

      await NotificationService.testEmail(email);
      res.json({
        success: true,
        message: `Test email dispatched to ${email}`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper endpoint to seed the default admin account if no users exist
   */
  public static async seedAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await UserModel.countDocuments();
      if (count > 0) {
        res.status(400).json({
          success: false,
          message: 'Users already exist in the database. Cannot auto-seed admin.'
        });
        return;
      }

      const passwordHash = await hashPassword('Admin@123456');
      const admin = await UserModel.create({
        email: 'admin@network.local',
        passwordHash,
        fullName: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Default admin user seeded successfully',
        data: {
          email: admin.email,
          role: admin.role,
          defaultPassword: 'Admin@123456'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dispatches a synthetic SNMP linkDown or linkUp trap directly into EventService
   */
  public static async simulateTrap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action = 'linkDown', ifIndex = 1, switchIp = '127.0.0.1' } = req.body;
      const isDown = action.toLowerCase() === 'linkdown';
      const trapOid = isDown ? '1.3.6.1.6.3.1.1.5.3' : '1.3.6.1.6.3.1.1.5.4';
      const operStatus = isDown ? 2 : 1;

      const { EventService } = await import('../../services/event.service.js');
      const { STANDARD_OIDS } = await import('../../snmp/mibs/oids.standard.js');

      await EventService.handleIncomingTrap({
        sourceIp: switchIp,
        trapOid,
        varbinds: [
          { oid: STANDARD_OIDS.SNMP_TRAP_OID, value: trapOid },
          { oid: `${STANDARD_OIDS.IF_INDEX}.${ifIndex}`, value: Number(ifIndex) },
          { oid: `${STANDARD_OIDS.IF_OPER_STATUS}.${ifIndex}`, value: operStatus }
        ],
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: `Simulated ${action} trap for port ${ifIndex} executed successfully!`
      });
    } catch (err) {
      next(err);
    }
  }
}
