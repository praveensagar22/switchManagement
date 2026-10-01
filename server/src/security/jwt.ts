import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthUserPayload } from '../core/types/user.types.js';

export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any
  });
}

export function verifyToken(token: string): AuthUserPayload {
  return jwt.verify(token, config.jwtSecret) as AuthUserPayload;
}
