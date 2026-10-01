import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  encryptionKey: string;
  snmpTrapPort: number;
  snmpTrapBindAddress: string;
  pollIntervalMinutes: number;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
    enabled: boolean;
  };
  corsOrigin: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/switch_management',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-minimum-32-chars-long-for-testing',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  snmpTrapPort: parseInt(process.env.SNMP_TRAP_PORT || '162', 10),
  snmpTrapBindAddress: process.env.SNMP_TRAP_BIND_ADDRESS || '0.0.0.0',
  pollIntervalMinutes: parseInt(process.env.POLL_INTERVAL_MINUTES || '5', 10),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.ALERT_FROM_EMAIL || 'Switch Monitoring <alerts@example.com>',
    to: process.env.ALERT_TO_EMAIL || 'admin@example.com',
    enabled: process.env.ENABLE_EMAIL_ALERTS === 'true'
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
