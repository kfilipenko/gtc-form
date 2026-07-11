import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AccountAlreadyExistsError, EmailVerificationTokenError, InvalidCredentialsError } from '../errors.js';
import { hashPassword, verifyPassword } from '../password.js';
import type { AuthStore } from '../authStore.js';
import type {
  AuthSession,
  EmailVerificationToken,
  GtcIdentityUser,
  LoginInput,
  ProjectMembership,
  RegisterInput,
  RequestMetadata,
  SessionLookupResult,
} from '../types.js';

interface MemoryCredential {
  userId: string;
  loginEmail: string;
  passwordHash: string;
  failedLoginAttempts: number;
  isActive: boolean;
}

interface MemorySession {
  sessionId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}

interface MemoryEmailToken {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  tokenState: 'pending' | 'used' | 'revoked';
}

export class MemoryAuthStore implements AuthStore {
  private readonly users = new Map<string, GtcIdentityUser>();
  private readonly userIdsByEmail = new Map<string, string>();
  private readonly credentialsByEmail = new Map<string, MemoryCredential>();
  private readonly sessionsByTokenHash = new Map<string, MemorySession>();
  private readonly emailTokensByHash = new Map<string, MemoryEmailToken>();
  private readonly memberships = new Map<string, ProjectMembership>();
  private readonly roles = new Set<string>();

  async createUser(input: RegisterInput, _metadata: RequestMetadata): Promise<GtcIdentityUser> {
    const email = normalizeEmail(input.email);
    if (this.userIdsByEmail.has(email)) {
      throw new AccountAlreadyExistsError();
    }

    const user: GtcIdentityUser = {
      userId: randomUUID(),
      email,
      displayName: input.displayName,
      phone: input.phone,
      primaryChannel: input.primaryChannel,
      accountStatus: 'pending_verification',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      projectMemberships: [],
    };

    this.users.set(user.userId, user);
    this.userIdsByEmail.set(email, user.userId);
    this.credentialsByEmail.set(email, {
      userId: user.userId,
      loginEmail: email,
      passwordHash: await hashPassword(input.password),
      failedLoginAttempts: 0,
      isActive: true,
    });

    return publicUser(user, []);
  }

  async authenticate(input: LoginInput, _metadata: RequestMetadata): Promise<GtcIdentityUser> {
    const email = normalizeEmail(input.email);
    const credential = this.credentialsByEmail.get(email);
    const user = credential ? this.users.get(credential.userId) : undefined;

    if (!credential || !credential.isActive || !user || !(await verifyPassword(input.password, credential.passwordHash))) {
      if (credential) {
        credential.failedLoginAttempts += 1;
      }
      throw new InvalidCredentialsError();
    }

    return publicUser(user, this.membershipsForUser(user.userId));
  }

  async createSession(userId: string, _metadata: RequestMetadata, ttlSeconds: number): Promise<AuthSession> {
    const user = this.users.get(userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const session: MemorySession = {
      sessionId: randomUUID(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
    this.sessionsByTokenHash.set(tokenHash, session);

    return {
      sessionId: session.sessionId,
      token,
      tokenHash,
      user: publicUser(user, this.membershipsForUser(userId)),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async getSession(rawToken: string): Promise<SessionLookupResult | null> {
    const tokenHash = hashToken(rawToken);
    const session = this.sessionsByTokenHash.get(tokenHash);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      user: publicUser(user, this.membershipsForUser(user.userId)),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async revokeSession(rawToken: string): Promise<void> {
    const session = this.sessionsByTokenHash.get(hashToken(rawToken));
    if (session) {
      session.revokedAt = new Date();
    }
  }

  async createEmailVerificationToken(
    userId: string,
    email: string,
    ttlSeconds: number,
    testMode: boolean,
  ): Promise<EmailVerificationToken> {
    const normalizedEmail = normalizeEmail(email);
    for (const token of this.emailTokensByHash.values()) {
      if (token.userId === userId && token.email === normalizedEmail && token.tokenState === 'pending') {
        token.tokenState = 'revoked';
      }
    }

    const rawToken = randomBytes(32).toString('base64url');
    const token: MemoryEmailToken = {
      userId,
      email: normalizedEmail,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      tokenState: 'pending',
    };
    this.emailTokensByHash.set(token.tokenHash, token);

    return {
      token: rawToken,
      expiresAt: token.expiresAt.toISOString(),
      deliveryStatus: testMode ? 'captured_test_only' : 'prepared_not_sent',
    };
  }

  async verifyEmailToken(rawToken: string): Promise<GtcIdentityUser> {
    const token = this.emailTokensByHash.get(hashToken(rawToken));
    if (!token || token.tokenState !== 'pending') {
      throw new EmailVerificationTokenError('email_verification_token_invalid');
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      throw new EmailVerificationTokenError('email_verification_token_expired');
    }

    const user = this.users.get(token.userId);
    if (!user) {
      throw new EmailVerificationTokenError('email_verification_token_invalid');
    }

    token.tokenState = 'used';
    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    user.accountStatus = 'active';

    return publicUser(user, this.membershipsForUser(user.userId));
  }

  async ensureProjectMembership(userId: string, projectCode: string, membershipStatus: string): Promise<ProjectMembership> {
    const key = `${userId}:${projectCode}`;
    const membership = this.memberships.get(key) ?? { projectCode, membershipStatus };
    membership.membershipStatus = membershipStatus;
    this.memberships.set(key, membership);
    return membership;
  }

  async ensureProjectRole(userId: string, projectCode: string, roleCode: string, _source: string): Promise<void> {
    this.roles.add(`${userId}:${projectCode}:${roleCode}`);
  }

  async hasProjectRole(userId: string, projectCode: string, roleCode: string): Promise<boolean> {
    return this.roles.has(`${userId}:${projectCode}:${roleCode}`);
  }

  listUsers(): GtcIdentityUser[] {
    return [...this.users.values()].map((user) => publicUser(user, this.membershipsForUser(user.userId)));
  }

  private membershipsForUser(userId: string): ProjectMembership[] {
    return [...this.memberships.entries()]
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, membership]) => ({ ...membership }));
  }
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: GtcIdentityUser, memberships: ProjectMembership[]): GtcIdentityUser {
  return {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    primaryChannel: user.primaryChannel,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    projectMemberships: memberships,
  };
}
