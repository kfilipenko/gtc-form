import type { IntakeAgentStubOutput, PublicLeadSubmission } from './types.js';

export function createIntakeAgentStubOutput(submission: PublicLeadSubmission): IntakeAgentStubOutput {
  const format = submission.travel_format?.join(', ') || 'not specified';
  const destination = submission.destination_interest || 'not specified';
  const audience = submission.audience_type?.join(', ') || 'not specified';

  return {
    summary: `Lead role: ${submission.declared_role}. Interest: ${submission.primary_interest}. Format: ${format}. Destination: ${destination}. Audience: ${audience}.`,
    inferred_role: submission.declared_role,
    motivation: inferMotivation(submission),
    recommended_stage: 'needs_human_review',
    recommended_next_step: 'Review the user interest, confirm whether the next step is Travel Advantage membership, MWR Life explanation, Ambassador discussion or nurture, and prepare a compliant first contact.',
    questions_for_operator: [
      'Does the person ask about Travel Advantage membership, MWR Life, Ambassador role, events or a general question?',
      'Does the request require checking country availability, price or official registration path?',
      'Which official material or human consultation should be offered next?',
    ],
    risk_flags: {
      income_claim: /\b(income|earn|profit|доход|заработ|прибыл)/i.test(submission.message),
      medical_claim: /\b(cure|леч|исцел|medical|diagnos)/i.test(submission.message),
      pressure_language: /\b(срочно|только сегодня|last chance|urgent)\b/i.test(submission.message),
      brand_compliance: 'none',
    },
    human_review_required: true,
  };
}

function inferMotivation(submission: PublicLeadSubmission): string {
  if (submission.primary_interest === 'create_trip') return 'create a travel route or group experience';
  if (submission.primary_interest === 'create_travel_group') return 'create a travel group or community experience';
  if (submission.primary_interest === 'event') return 'organize a travel-based event';
  if (submission.primary_interest === 'events') return 'learn about events and presentations';
  if (submission.primary_interest === 'club') return 'understand the travel club environment';
  if (submission.primary_interest === 'business_model') return 'understand the partner model without pressure';
  if (submission.primary_interest === 'partner_model') return 'understand the partner model without pressure';
  if (submission.primary_interest === 'learn_lifestyle_ambassador') return 'understand the Lifestyle Ambassador role';
  if (submission.primary_interest === 'learn_travel_advantage') return 'learn about Travel Advantage membership';
  if (submission.primary_interest === 'become_travel_advantage_member') return 'discuss becoming a Travel Advantage member';
  if (submission.primary_interest === 'learn_mwr_life') return 'learn how MWR Life relates to Travel Advantage';
  if (submission.primary_interest === 'presentation_request') return 'receive a compliant project presentation';
  if (submission.primary_interest === 'question') return 'ask a general question before choosing the next step';
  if (submission.primary_interest === 'travel') return 'travel more often with community support';
  return 'understand which TravelGTC path fits best';
}
