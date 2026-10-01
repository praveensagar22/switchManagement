import { z } from 'zod';

export const snmpConfigSchema = z.object({
  version: z.enum(['v2c', 'v3']).default('v2c'),
  port: z.number().int().min(1).max(65535).default(161),
  community: z.string().optional(),
  v3: z
    .object({
      username: z.string().min(1),
      securityLevel: z.enum(['noAuthNoPriv', 'authNoPriv', 'authPriv']),
      authProtocol: z.enum(['md5', 'sha', 'sha256', 'none']).optional(),
      authKey: z.string().optional(),
      privProtocol: z.enum(['des', 'aes', 'aes256b', 'none']).optional(),
      privKey: z.string().optional()
    })
    .optional(),
  timeout: z.number().int().min(500).max(30000).optional(),
  retries: z.number().int().min(0).max(5).optional()
});

export const createSwitchSchema = z.object({
  name: z.string().min(2).max(100),
  hostname: z.string().optional(),
  ipAddress: z.string().min(7), // IPv4 or hostname
  vendor: z.enum(['HUAWEI', 'CISCO', 'ARUBA', 'JUNIPER', 'MIKROTIK', 'GENERIC']).optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),
  location: z.string().optional(),
  snmpConfig: snmpConfigSchema
});

export const updateSwitchSchema = createSwitchSchema.partial();

export const testConnectionSchema = z.object({
  ipAddress: z.string().min(7),
  snmpConfig: snmpConfigSchema
});
