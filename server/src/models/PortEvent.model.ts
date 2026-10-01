import mongoose, { Schema, Document, Types } from 'mongoose';
import { PortEventType, EventSource } from '../core/types/event.types.js';
import { OperStatus } from '../core/types/interface.types.js';

export interface IPortEvent extends Document {
  _id: Types.ObjectId;
  switchId: Types.ObjectId;
  interfaceId: Types.ObjectId;
  ifIndex: number;
  ifName?: string;
  eventType: PortEventType;
  previousOperStatus: OperStatus;
  newOperStatus: OperStatus;
  source: EventSource;
  timestamp: Date;
  rawTrapData?: Record<string, any>;
  createdAt: Date;
}

const PortEventSchema = new Schema<IPortEvent>(
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
      required: true,
      index: true
    },
    ifIndex: {
      type: Number,
      required: true
    },
    ifName: {
      type: String
    },
    eventType: {
      type: String,
      enum: ['LINK_DOWN', 'LINK_UP', 'ADMIN_CHANGE', 'FLAPPING'],
      required: true,
      index: true
    },
    previousOperStatus: {
      type: String,
      required: true
    },
    newOperStatus: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['TRAP', 'POLL'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    rawTrapData: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Optimize port-specific and switch-specific chronological history lookups
PortEventSchema.index({ switchId: 1, ifIndex: 1, timestamp: -1 });
PortEventSchema.index({ switchId: 1, timestamp: -1 });

export const PortEventModel = mongoose.model<IPortEvent>('PortEvent', PortEventSchema);
