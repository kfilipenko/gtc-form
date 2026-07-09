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
    recommended_next_step: 'Review the travel idea, confirm the user need, and prepare a calm first contact.',
    questions_for_operator: [
      'What result should the person receive from the travel or club conversation?',
      'Is the person interested only in a trip now, or also in understanding the partner model later?',
      'Who is the intended group: friends, family, clients, students, partners or community?',
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
  if (submission.primary_interest === 'event') return 'organize a travel-based event';
  if (submission.primary_interest === 'club') return 'understand the travel club environment';
  if (submission.primary_interest === 'business_model') return 'understand the partner model without pressure';
  if (submission.primary_interest === 'travel') return 'travel more often with community support';
  return 'understand which TravelGTC path fits best';
}
