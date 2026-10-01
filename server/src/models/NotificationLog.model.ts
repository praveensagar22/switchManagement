import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotificationLog extends Document {
  _id: Types.ObjectId;
  alertId: Types.ObjectId;
  channel: 'EMAIL';
  recipient: string;
  subject: string;
  status: 'SENT' | 'FAILED';
  errorMessage?: string;
  sentAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    alertId: {
      type: Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: ['EMAIL'],
      default: 'EMAIL'
    },
    recipient: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      required: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const NotificationLogModel = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
