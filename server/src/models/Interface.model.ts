import mongoose, { Schema, Document, Types } from 'mongoose';
import { AdminStatus, OperStatus } from '../core/types/interface.types.js';

export interface IInterface extends Document {
  _id: Types.ObjectId;
  switchId: Types.ObjectId;
  ifIndex: number;
  ifName: string;
  ifDescr: string;
  ifAlias?: string;
  ifType: number;
  ifTypeName?: string;
  ifAdminStatus: AdminStatus;
  ifOperStatus: OperStatus;
  ifSpeed: number; // bps
  ifHighSpeed?: number; // Mbps
  macAddress?: string;
  lastStatusChange?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterfaceSchema = new Schema<IInterface>(
  {
    switchId: {
      type: Schema.Types.ObjectId,
      ref: 'Switch',
      required: true,
      index: true
    },
    ifIndex: {
      type: Number,
      required: true
    },
    ifName: {
      type: String,
      required: true,
      trim: true
    },
    ifDescr: {
      type: String,
      default: ''
    },
    ifAlias: {
      type: String,
      default: ''
    },
    ifType: {
      type: Number,
      default: 6 // ethernetCsmacd
    },
    ifTypeName: {
      type: String,
      default: 'ethernetCsmacd'
    },
    ifAdminStatus: {
      type: String,
      enum: ['UP', 'DOWN', 'TESTING'],
      default: 'UP'
    },
    ifOperStatus: {
      type: String,
      enum: ['UP', 'DOWN', 'TESTING', 'UNKNOWN', 'DORMANT', 'NOT_PRESENT', 'LOWER_LAYER_DOWN'],
      default: 'UNKNOWN',
      index: true
    },
    ifSpeed: {
      type: Number,
      default: 0
    },
    ifHighSpeed: {
      type: Number,
      default: 0
    },
    macAddress: {
      type: String,
      default: null
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index: One switch cannot have duplicate ifIndex values
InterfaceSchema.index({ switchId: 1, ifIndex: 1 }, { unique: true });
InterfaceSchema.index({ switchId: 1, ifOperStatus: 1 });

export const InterfaceModel = mongoose.model<IInterface>('Interface', InterfaceSchema);
