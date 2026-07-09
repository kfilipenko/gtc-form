export const preferredChannels = ['whatsapp', 'max', 'telegram', 'email', 'phone'] as const;
export const declaredRoles = [
  'traveler',
  'trip_author',
  'community_leader',
  'event_organizer',
  'partner_candidate',
  'unsure',
] as const;
export const primaryInterests = [
  'travel',
  'club',
  'create_trip',
  'event',
  'business_model',
  'presentation',
  'not_sure',
] as const;
export const businessInterestLevels = ['none', 'curious_later', 'want_to_understand', 'ready_to_discuss'] as const;
export const consultationPreferences = ['message_first', 'call', 'presentation', 'not_sure'] as const;
export const travelFormats = [
  'rest',
  'yoga',
  'freediving',
  'retreat',
  'sport',
  'family',
  'business_weekend',
  'cruise',
  'other',
] as const;
export const audienceTypes = [
  'friends',
  'family',
  'clients',
  'students',
  'partners',
  'community',
  'subscribers',
  'other',
] as const;
export const audienceSizeRanges = ['none', '1_10', '11_50', '51_200', '200_plus', 'unknown'] as const;

export type PreferredChannel = (typeof preferredChannels)[number];
export type DeclaredRole = (typeof declaredRoles)[number];
export type PrimaryInterest = (typeof primaryInterests)[number];
export type BusinessInterestLevel = (typeof businessInterestLevels)[number];
export type ConsultationPreference = (typeof consultationPreferences)[number];

export interface LeadTrackingInput {
  landing_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referral_code?: string;
  locale?: string;
  timezone?: string;
  client_event_id?: string;
}

export interface PublicLeadSubmission {
  name: string;
  preferred_channel: PreferredChannel;
  contact_value: string;
  declared_role: DeclaredRole;
  primary_interest: PrimaryInterest;
  message: string;
  personal_data_consent: true;
  communication_consent: true;
  consent_version: string;
  travel_format?: string[];
  destination_interest?: string;
  approx_dates?: string;
  audience_type?: string[];
  estimated_group_size?: string;
  has_existing_audience?: boolean | null;
  audience_size_range?: string;
  business_interest_level?: BusinessInterestLevel;
  consultation_preference?: ConsultationPreference;
  best_contact_time?: string;
  important_details?: string;
  tracking: LeadTrackingInput;
}

export interface IntakeAgentStubOutput {
  summary: string;
  inferred_role: DeclaredRole;
  motivation: string;
  recommended_stage: 'needs_human_review';
  recommended_next_step: string;
  questions_for_operator: string[];
  risk_flags: {
    income_claim: boolean;
    medical_claim: boolean;
    pressure_language: boolean;
    brand_compliance: 'none' | 'low' | 'medium' | 'high';
  };
  human_review_required: true;
}

export interface LeadCreationResult {
  contactId: string;
  leadId: string;
  travelIdeaId: string;
  interactionId: string;
  taskId: string;
  agentRunId: string;
  stage: 'new_lead';
}

export interface StoredLeadBundle extends LeadCreationResult {
  submission: PublicLeadSubmission;
  intakeOutput: IntakeAgentStubOutput;
  userId?: string;
}
