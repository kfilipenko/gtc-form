export type GtcAccountStatus = 'pending_verification' | 'active' | 'suspended' | 'closed';

export interface GtcIdentityUser {
  userId: string;
  email: string;
  displayName: string;
  phone?: string;
  primaryChannel: string;
  accountStatus: GtcAccountStatus;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt?: string;
  projectMemberships?: ProjectMembership[];
}

export interface ProjectMembership {
  projectCode: string;
  membershipStatus: string;
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  primaryChannel: string;
  phone?: string;
  consentVersion: string;
  accountTermsConsent: true;
  privacyConsent: true;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthSession {
  sessionId: string;
  token: string;
  tokenHash: string;
  user: GtcIdentityUser;
  expiresAt: string;
}

export interface SessionLookupResult {
  sessionId: string;
  user: GtcIdentityUser;
  expiresAt: string;
}

export interface EmailVerificationToken {
  token: string;
  expiresAt: string;
  deliveryStatus: 'captured_test_only' | 'prepared_not_sent';
}
