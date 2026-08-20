import { IUserRepository, ISessionRepository } from '@2mart/domain/src/auth/repositories';
import { User, Session } from '@2mart/domain/src/auth/entities';

// Interface cho Token Generator (Sẽ được implement ở tầng Infrastructure bằng jsonwebtoken)
export interface ITokenService {
  generateAccessToken(userId: string, permissionVersion: number): string;
  generateRefreshToken(): string;
  hashToken(token: string): Promise<string>;
}

// Interface cho Password Hasher (Sẽ được implement ở tầng Infrastructure bằng argon2)
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async login(username: string, password: string, deviceId: string, ip: string, userAgent: string) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked. Try again later.');
    }

    const isValid = await this.passwordHasher.verify(user.passwordHash, password);
    if (!isValid) {
      const attempts = user.failedAttempts + 1;
      let lockUntil = null;
      if (attempts >= this.MAX_FAILED_ATTEMPTS) {
        lockUntil = new Date(Date.now() + this.LOCKOUT_MINUTES * 60000);
      }
      await this.userRepository.updateFailedAttempts(user.id, attempts, lockUntil);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0) {
      await this.userRepository.resetFailedAttempts(user.id);
    }

    // Sinh token
    // Lấy permissionVersion mặc định từ session mới (ví dụ version 1, hoặc lấy từ user nếu có field)
    const permissionVersion = 1; 
    const accessToken = this.tokenService.generateAccessToken(user.id, permissionVersion);
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);

    // Lưu session
    const session = await this.sessionRepository.createSession({
      userId: user.id,
      deviceId,
      ipAddress: ip,
      userAgent,
      refreshTokenHash,
      permissionVersion,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return {
      user,
      sessionId: session.id,
      accessToken,
      refreshToken
    };
  }

  async logout(sessionId: string, userId: string) {
    const session = await this.sessionRepository.findById(sessionId);
    if (session && session.userId === userId) {
      await this.sessionRepository.revokeSession(sessionId);
    }
  }

  // Luồng refresh token và validate token sẽ được thêm sau
}
