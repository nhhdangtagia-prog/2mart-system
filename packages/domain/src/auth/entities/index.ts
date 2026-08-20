export interface User {
  id: string;
  organizationId: string;
  username: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil?: Date;
  defaultBranchId?: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  refreshTokenHash: string;
  permissionVersion: number;
  isRevoked: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
}
