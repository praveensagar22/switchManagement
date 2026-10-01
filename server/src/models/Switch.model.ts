import mongoose, { Schema, HydratedDocument, Types } from 'mongoose';
import {
  SnmpVersion,
  SwitchVendor,
  SwitchStatus,
  SnmpSecurityLevel,
  SnmpAuthProtocol,
  SnmpPrivProtocol
} from '../core/types/switch.types.js';

export interface ISwitch {
  _id: Types.ObjectId;
  name: string;
  hostname?: string;
  ipAddress: string;
  vendor: SwitchVendor;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  location?: string;
  sysObjectID?: string;
  sysDescr?: string;
  uptimeSeconds?: number;
  snmpConfig: {
    version: SnmpVersion;
    port: number;
    communityEncrypted?: string;
    v3?: {
      username: string;
      securityLevel: SnmpSecurityLevel;
      authProtocol?: SnmpAuthProtocol;
      authKeyEncrypted?: string;
      privProtocol?: SnmpPrivProtocol;
      privKeyEncrypted?: string;
    };
    timeout: number;
    retries: number;
  };
  connectionStatus: SwitchStatus;
  lastSuccessfulPoll?: Date;
  lastSeenTrap?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SnmpConfigSchema = new Schema(
  {
    version: {
      type: String,
      enum: ['v2c', 'v3'],
      default: 'v2c',
      required: true
    },
    port: {
      type: Number,
      default: 161,
      required: true
    },
    communityEncrypted: {
      type: String,
      default: null
    },
    v3: {
      username: { type: String, default: null },
      securityLevel: {
        type: String,
        enum: ['noAuthNoPriv', 'authNoPriv', 'authPriv'],
        default: 'noAuthNoPriv'
      },
      authProtocol: {
        type: String,
        enum: ['md5', 'sha', 'sha256', 'none'],
        default: 'none'
      },
      authKeyEncrypted: { type: String, default: null },
      privProtocol: {
        type: String,
        enum: ['des', 'aes', 'aes256b', 'none'],
        default: 'none'
      },
      privKeyEncrypted: { type: String, default: null }
    },
    timeout: {
      type: Number,
      default: 3000
    },
    retries: {
      type: Number,
      default: 2
    }
  },
  { _id: false }
);

const SwitchSchema = new Schema<ISwitch>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    hostname: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    vendor: {
      type: String,
      enum: ['HUAWEI', 'CISCO', 'ARUBA', 'JUNIPER', 'MIKROTIK', 'OPTILINK', 'GENERIC'],
      default: 'GENERIC',
      index: true
    },
    model: {
      type: String,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true
    },
    firmwareVersion: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    sysObjectID: {
      type: String,
      trim: true
    },
    sysDescr: {
      type: String,
      trim: true
    },
    uptimeSeconds: {
      type: Number,
      default: 0
    },
    snmpConfig: {
      type: SnmpConfigSchema,
      required: true
    },
    connectionStatus: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'UNREACHABLE', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true
    },
    lastSuccessfulPoll: {
      type: Date,
      default: null
    },
    lastSeenTrap: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export type SwitchDocument = HydratedDocument<ISwitch>;
export const SwitchModel = mongoose.model<ISwitch>('Switch', SwitchSchema);
