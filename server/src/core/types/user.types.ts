export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}
