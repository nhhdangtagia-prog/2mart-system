import { User, Session } from '../entities';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  updateFailedAttempts(userId: string, attempts: number, lockUntil?: Date): Promise<void>;
  resetFailedAttempts(userId: string): Promise<void>;
}

export interface ISessionRepository {
  createSession(session: Omit<Session, 'id' | 'createdAt' | 'lastSeenAt'>): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<Session | null>;
  revokeSession(id: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
  updateLastSeen(id: string): Promise<void>;
}
