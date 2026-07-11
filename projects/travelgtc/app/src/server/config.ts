export type TravelGtcAppEnv = 'local' | 'staging' | 'production' | 'test';
export type TravelGtcCrmAuthMode = 'disabled' | 'basic' | 'session';
export type TravelGtcAgentIntakeMode = 'stub' | 'manual' | 'live';
export type TravelGtcParentNetworkMode = 'none' | 'manual' | 'linked' | 'api';
export type TravelGtcAiChatMode = 'stub' | 'azure';
export type TravelGtcEmailNotificationMode = 'disabled' | 'smtp';

export interface TravelGtcConfig {
  appEnv: TravelGtcAppEnv;
  host: string;
  port: number;
  publicLeadCaptureEnabled: boolean;
  accountLeadCaptureEnabled: boolean;
  databaseUrl?: string;
  crmAuthMode: TravelGtcCrmAuthMode;
  agentIntakeMode: TravelGtcAgentIntakeMode;
  parentNetworkMode: TravelGtcParentNetworkMode;
  aiChatMode: TravelGtcAiChatMode;
  azureAiProjectEndpoint?: string;
  azureAiAgentName: string;
  azureAiAgentVersion: string;
  emailNotificationMode: TravelGtcEmailNotificationMode;
  leadNotificationTo: string;
  leadNotificationFrom: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  consentVersion: string;
  identityConsentVersion: string;
  sessionCookieName: string;
  sessionTtlDays: number;
  authSecureCookies: boolean;
  authEmailVerificationTestMode: boolean;
  rateLimitWindowSeconds: number;
  rateLimitMax: number;
}

function pickEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): TravelGtcConfig {
  const appEnv = pickEnum(env.TRAVELGTC_APP_ENV, ['local', 'staging', 'production', 'test'] as const, 'local');

  return {
    appEnv,
    host: env.TRAVELGTC_API_HOST || '127.0.0.1',
    port: parsePositiveInteger(env.TRAVELGTC_API_PORT, 4301),
    publicLeadCaptureEnabled: parseBoolean(env.TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED, false),
    accountLeadCaptureEnabled: parseBoolean(env.TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED, false),
    databaseUrl: env.TRAVELGTC_DATABASE_URL || undefined,
    crmAuthMode: pickEnum(env.TRAVELGTC_CRM_AUTH_MODE, ['disabled', 'basic', 'session'] as const, 'disabled'),
    agentIntakeMode: pickEnum(env.TRAVELGTC_AGENT_INTAKE_MODE, ['stub', 'manual', 'live'] as const, 'stub'),
    parentNetworkMode: pickEnum(env.TRAVELGTC_PARENT_NETWORK_MODE, ['none', 'manual', 'linked', 'api'] as const, 'none'),
    aiChatMode: pickEnum(env.TRAVELGTC_AI_CHAT_MODE, ['stub', 'azure'] as const, 'stub'),
    azureAiProjectEndpoint: env.TRAVELGTC_AZURE_AI_PROJECT_ENDPOINT || undefined,
    azureAiAgentName: env.TRAVELGTC_AZURE_AI_AGENT_NAME || 'AI-TravelGTC',
    azureAiAgentVersion: env.TRAVELGTC_AZURE_AI_AGENT_VERSION || '5',
    emailNotificationMode: pickEnum(env.TRAVELGTC_EMAIL_NOTIFICATION_MODE, ['disabled', 'smtp'] as const, 'disabled'),
    leadNotificationTo: env.TRAVELGTC_LEAD_NOTIFICATION_TO || 'kfilipenko@kmf.ru',
    leadNotificationFrom: env.TRAVELGTC_LEAD_NOTIFICATION_FROM || 'TravelGTC <no-reply@travelgtc.com>',
    smtpHost: env.TRAVELGTC_SMTP_HOST || undefined,
    smtpPort: parsePositiveInteger(env.TRAVELGTC_SMTP_PORT, 587),
    smtpSecure: parseBoolean(env.TRAVELGTC_SMTP_SECURE, false),
    smtpUser: env.TRAVELGTC_SMTP_USER || undefined,
    smtpPassword: env.TRAVELGTC_SMTP_PASSWORD || undefined,
    consentVersion: env.TRAVELGTC_CONSENT_VERSION || 'travelgtc-consent-v1',
    identityConsentVersion: env.TRAVELGTC_IDENTITY_CONSENT_VERSION || 'travelgtc-identity-consent-v1',
    sessionCookieName: env.TRAVELGTC_SESSION_COOKIE_NAME || 'gtc_travelgtc_session',
    sessionTtlDays: parsePositiveInteger(env.TRAVELGTC_SESSION_TTL_DAYS, 7),
    authSecureCookies: parseBoolean(env.TRAVELGTC_AUTH_SECURE_COOKIES, appEnv === 'production'),
    authEmailVerificationTestMode: parseBoolean(
      env.TRAVELGTC_AUTH_EMAIL_VERIFICATION_TEST_MODE,
      appEnv === 'test',
    ),
    rateLimitWindowSeconds: parsePositiveInteger(env.TRAVELGTC_RATE_LIMIT_WINDOW_SECONDS, 60),
    rateLimitMax: parsePositiveInteger(env.TRAVELGTC_RATE_LIMIT_MAX, 10),
  };
}
