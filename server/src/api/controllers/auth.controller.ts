import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../models/User.model.js';
import { hashPassword, comparePassword } from '../../security/password.js';
import { signToken } from '../../security/jwt.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../core/errors/app.error.js';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = (req.body.email || '').trim().toLowerCase();
      const password = req.body.password || '';

      let user = await UserModel.findOne({ email });

      // If database is completely empty, automatically initialize default admin on the fly
      if (!user) {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
          if (email === 'admin@network.local' && password === 'Admin@123456') {
            const passwordHash = await hashPassword('Admin@123456');
            user = await UserModel.create({
              email: 'admin@network.local',
              passwordHash,
              fullName: 'System Administrator',
              role: 'ADMIN',
              isActive: true
            });
            console.log('[Auth] Automatically initialized default admin on first login attempt.');
          } else {
            throw new UnauthorizedError(
              'No users exist yet. Default admin account is: admin@network.local with password: Admin@123456'
            );
          }
        } else {
          throw new UnauthorizedError('Invalid email or password');
        }
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is deactivated');
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName, role } = req.body;

      const existing = await UserModel.findOne({ email });
      if (existing) {
        throw new ConflictError('A user with this email address already exists');
      }

      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({
        email,
        passwordHash,
        fullName,
        role: role || 'OPERATOR'
      });

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const user = await UserModel.findById(req.user.userId).select('-passwordHash');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }
}
