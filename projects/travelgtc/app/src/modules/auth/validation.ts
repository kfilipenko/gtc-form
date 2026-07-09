import { z } from 'zod';
import type { TravelGtcConfig } from '../../server/config.js';
import { AuthValidationError } from './errors.js';
import type { LoginInput, RegisterInput } from './types.js';

const text = (max = 500) => z.string().trim().min(1, 'required').max(max, `max_${max}`);
const contactChannels = ['email', 'phone'] as const;

const registerSchema = z
  .object({
    display_name: text(160),
    email: z.string().trim().email('invalid_email').max(240).transform((value) => value.toLowerCase()),
    password: z.string().min(8, 'min_8').max(200, 'max_200'),
    primary_channel: z.enum(contactChannels),
    phone: text(80),
    consent_version: text(120),
    account_terms_consent: z.literal(true),
    privacy_consent: z.literal(true),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email('invalid_email').max(240).transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'required').max(200, 'max_200'),
  })
  .strict();

const tokenSchema = z
  .object({
    token: text(500),
  })
  .strict();

function validationFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    fields[issue.path.join('.') || 'body'] = issue.message;
  }
  return fields;
}

export function validateRegisterInput(payload: unknown, config: TravelGtcConfig): RegisterInput {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AuthValidationError(validationFields(parsed.error));
  }

  if (parsed.data.consent_version !== config.identityConsentVersion) {
    throw new AuthValidationError({ consent_version: 'unexpected_version' });
  }

  return {
    displayName: parsed.data.display_name,
    email: parsed.data.email,
    password: parsed.data.password,
    primaryChannel: parsed.data.primary_channel,
    phone: parsed.data.phone,
    consentVersion: parsed.data.consent_version,
    accountTermsConsent: true,
    privacyConsent: true,
  };
}

export function validateLoginInput(payload: unknown): LoginInput {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AuthValidationError(validationFields(parsed.error));
  }

  return parsed.data;
}

export function validateVerificationTokenInput(payload: unknown): string {
  const parsed = tokenSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AuthValidationError(validationFields(parsed.error));
  }

  return parsed.data.token;
}
