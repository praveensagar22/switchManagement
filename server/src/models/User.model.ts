import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../core/types/user.types.js';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'OPERATOR', 'VIEWER'],
      default: 'OPERATOR'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
