import mongoose, { Schema, Document, Types } from 'mongoose';
import { AlertType, AlertSeverity, AlertStatus, NotificationStatus } from '../core/types/alert.types.js';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  switchId: Types.ObjectId;
  interfaceId?: Types.ObjectId;
  ifIndex?: number;
  ifName?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: Types.ObjectId;
  notificationStatus: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    switchId: {
      type: Schema.Types.ObjectId,
      ref: 'Switch',
      required: true,
      index: true
    },
    interfaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Interface',
      default: null,
      index: true
    },
    ifIndex: {
      type: Number,
      default: null
    },
    ifName: {
      type: String,
      default: null
    },
    alertType: {
      type: String,
      enum: ['PORT_DOWN', 'DEVICE_UNREACHABLE', 'FLAPPING'],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO'],
      default: 'CRITICAL',
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED'],
      default: 'ACTIVE',
      index: true
    },
    message: {
      type: String,
      required: true
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notificationStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SUPPRESSED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast dashboard query filtering
AlertSchema.index({ status: 1, severity: 1, triggeredAt: -1 });
AlertSchema.index({ switchId: 1, interfaceId: 1, status: 1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
