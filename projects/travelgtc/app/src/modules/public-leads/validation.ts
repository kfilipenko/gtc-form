import { z } from 'zod';
import type { TravelGtcConfig } from '../../server/config.js';
import {
  audienceSizeRanges,
  audienceTypes,
  businessInterestLevels,
  consultationPreferences,
  declaredRoles,
  preferredChannels,
  primaryInterests,
  travelFormats,
  type PublicLeadSubmission,
} from './types.js';
import { ValidationFailedError } from './errors.js';

const text = (max = 500) => z.string().trim().min(1, 'required').max(max, `max_${max}`);
const optionalText = (max = 500) =>
  z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().max(max).optional());

function enumArray<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      return Array.isArray(value) ? value : [value];
    },
    z.array(z.enum(values)).min(1).optional(),
  );
}

const trackingSchema = z
  .object({
    landing_path: optionalText(300),
    referrer: optionalText(1000),
    utm_source: optionalText(120),
    utm_medium: optionalText(120),
    utm_campaign: optionalText(160),
    utm_content: optionalText(160),
    utm_term: optionalText(160),
    referral_code: optionalText(120),
    locale: optionalText(40),
    timezone: optionalText(80),
    client_event_id: optionalText(160),
  })
  .default({});

const rawLeadSchema = z
  .object({
    name: text(160),
    preferred_channel: z.enum(preferredChannels),
    contact_value: text(200),
    declared_role: z.enum(declaredRoles),
    primary_interest: z.enum(primaryInterests),
    message: text(4000),
    personal_data_consent: z.literal(true),
    communication_consent: z.literal(true),
    consent_version: text(80),
    travel_format: enumArray(travelFormats),
    destination_interest: optionalText(300),
    approx_dates: optionalText(200),
    audience_type: enumArray(audienceTypes),
    estimated_group_size: optionalText(80),
    has_existing_audience: z.boolean().nullable().optional(),
    audience_size_range: z.enum(audienceSizeRanges).optional(),
    business_interest_level: z.enum(businessInterestLevels).optional(),
    consultation_preference: z.enum(consultationPreferences).optional(),
    best_contact_time: optionalText(200),
    important_details: optionalText(2000),
    tracking: trackingSchema,
    landing_path: optionalText(300),
    referrer: optionalText(1000),
    utm_source: optionalText(120),
    utm_medium: optionalText(120),
    utm_campaign: optionalText(160),
    utm_content: optionalText(160),
    utm_term: optionalText(160),
    referral_code: optionalText(120),
    locale: optionalText(40),
    timezone: optionalText(80),
    client_event_id: optionalText(160),
  })
  .passthrough();

export function validatePublicLeadSubmission(payload: unknown, config: TravelGtcConfig): PublicLeadSubmission {
  const parsed = rawLeadSchema.safeParse(payload);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'body';
      fields[path] = issue.message;
    }
    throw new ValidationFailedError(fields);
  }

  const value = parsed.data;
  if (value.consent_version !== config.consentVersion) {
    throw new ValidationFailedError({ consent_version: 'unexpected_version' });
  }

  const tracking = {
    ...value.tracking,
    landing_path: value.tracking.landing_path ?? value.landing_path,
    referrer: value.tracking.referrer ?? value.referrer,
    utm_source: value.tracking.utm_source ?? value.utm_source,
    utm_medium: value.tracking.utm_medium ?? value.utm_medium,
    utm_campaign: value.tracking.utm_campaign ?? value.utm_campaign,
    utm_content: value.tracking.utm_content ?? value.utm_content,
    utm_term: value.tracking.utm_term ?? value.utm_term,
    referral_code: value.tracking.referral_code ?? value.referral_code,
    locale: value.tracking.locale ?? value.locale,
    timezone: value.tracking.timezone ?? value.timezone,
    client_event_id: value.tracking.client_event_id ?? value.client_event_id,
  };

  return {
    name: value.name,
    preferred_channel: value.preferred_channel,
    contact_value: value.contact_value,
    declared_role: value.declared_role,
    primary_interest: value.primary_interest,
    message: value.message,
    personal_data_consent: true,
    communication_consent: true,
    consent_version: value.consent_version,
    travel_format: value.travel_format,
    destination_interest: value.destination_interest,
    approx_dates: value.approx_dates,
    audience_type: value.audience_type,
    estimated_group_size: value.estimated_group_size,
    has_existing_audience: value.has_existing_audience,
    audience_size_range: value.audience_size_range,
    business_interest_level: value.business_interest_level ?? 'none',
    consultation_preference: value.consultation_preference,
    best_contact_time: value.best_contact_time,
    important_details: value.important_details,
    tracking,
  };
}

export function validateNotObviousSpam(submission: PublicLeadSubmission): void {
  const combined = [submission.name, submission.contact_value, submission.message, submission.important_details ?? ''].join(' ');
  const urlCount = (combined.match(/https?:\/\//gi) ?? []).length;
  const bbCodeUrlCount = (combined.match(/\[url=/gi) ?? []).length;
  const repeatedLinkText = /(free money|casino|crypto bonus|seo backlinks)/i.test(combined);

  if (urlCount > 3 || bbCodeUrlCount > 0 || repeatedLinkText) {
    throw new ValidationFailedError({ message: 'spam_rejected' });
  }
}
