import type {
  AuthSession,
  EmailVerificationToken,
  GtcIdentityUser,
  LoginInput,
  ProjectMembership,
  RegisterInput,
  RequestMetadata,
  SessionLookupResult,
} from './types.js';

export interface AuthStore {
  createUser(input: RegisterInput, metadata: RequestMetadata): Promise<GtcIdentityUser>;
  authenticate(input: LoginInput, metadata: RequestMetadata): Promise<GtcIdentityUser>;
  createSession(userId: string, metadata: RequestMetadata, ttlSeconds: number): Promise<AuthSession>;
  getSession(rawToken: string): Promise<SessionLookupResult | null>;
  revokeSession(rawToken: string): Promise<void>;
  createEmailVerificationToken(
    userId: string,
    email: string,
    ttlSeconds: number,
    testMode: boolean,
  ): Promise<EmailVerificationToken>;
  verifyEmailToken(rawToken: string): Promise<GtcIdentityUser>;
  ensureProjectMembership(userId: string, projectCode: string, membershipStatus: string): Promise<ProjectMembership>;
  ensureProjectRole(userId: string, projectCode: string, roleCode: string, source: string): Promise<void>;
  hasProjectRole(userId: string, projectCode: string, roleCode: string): Promise<boolean>;
  close?(): Promise<void>;
}
