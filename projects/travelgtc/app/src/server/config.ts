export type TravelGtcAppEnv = 'local' | 'staging' | 'production' | 'test';
export type TravelGtcCrmAuthMode = 'disabled' | 'basic' | 'session';
export type TravelGtcAgentIntakeMode = 'stub' | 'manual' | 'live';
export type TravelGtcParentNetworkMode = 'none' | 'manual' | 'linked' | 'api';

export interface TravelGtcConfig {
  appEnv: TravelGtcAppEnv;
  host: string;
  port: number;
  publicLeadCaptureEnabled: boolean;
  databaseUrl?: string;
  crmAuthMode: TravelGtcCrmAuthMode;
  agentIntakeMode: TravelGtcAgentIntakeMode;
  parentNetworkMode: TravelGtcParentNetworkMode;
  consentVersion: string;
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
  return {
    appEnv: pickEnum(env.TRAVELGTC_APP_ENV, ['local', 'staging', 'production', 'test'] as const, 'local'),
    host: env.TRAVELGTC_API_HOST || '127.0.0.1',
    port: parsePositiveInteger(env.TRAVELGTC_API_PORT, 4301),
    publicLeadCaptureEnabled: parseBoolean(env.TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED, false),
    databaseUrl: env.TRAVELGTC_DATABASE_URL || undefined,
    crmAuthMode: pickEnum(env.TRAVELGTC_CRM_AUTH_MODE, ['disabled', 'basic', 'session'] as const, 'disabled'),
    agentIntakeMode: pickEnum(env.TRAVELGTC_AGENT_INTAKE_MODE, ['stub', 'manual', 'live'] as const, 'stub'),
    parentNetworkMode: pickEnum(env.TRAVELGTC_PARENT_NETWORK_MODE, ['none', 'manual', 'linked', 'api'] as const, 'none'),
    consentVersion: env.TRAVELGTC_CONSENT_VERSION || 'travelgtc-consent-v1',
    rateLimitWindowSeconds: parsePositiveInteger(env.TRAVELGTC_RATE_LIMIT_WINDOW_SECONDS, 60),
    rateLimitMax: parsePositiveInteger(env.TRAVELGTC_RATE_LIMIT_MAX, 10),
  };
}
