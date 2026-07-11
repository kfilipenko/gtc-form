import type { IntakeAgentStubOutput, PublicLeadSubmission } from './types.js';

export function createIntakeAgentStubOutput(submission: PublicLeadSubmission): IntakeAgentStubOutput {
  const format = submission.travel_format?.join(', ') || 'не указан';
  const destination = submission.destination_interest || 'не указано';
  const audience = submission.audience_type?.join(', ') || 'не указана';

  return {
    summary: `Роль: ${submission.declared_role}. Интерес: ${submission.primary_interest}. Формат: ${format}. Направление: ${destination}. Аудитория: ${audience}.`,
    inferred_role: submission.declared_role,
    motivation: inferMotivation(submission),
    recommended_stage: 'needs_human_review',
    recommended_next_step: 'Изучить интерес пользователя, определить подходящий следующий шаг: членство Travel Advantage, объяснение MWR Life, обсуждение роли Lifestyle Ambassador или мягкое сопровождение. Подготовить корректный первый контакт без обещаний дохода, гарантированной экономии или давления.',
    questions_for_operator: [
      'О чём спрашивает человек: членство Travel Advantage, MWR Life, роль Lifestyle Ambassador, события или общий вопрос?',
      'Нужно ли проверить страну доступности, цену, официальные условия или путь регистрации?',
      'Что лучше предложить следующим шагом: официальный материал, личную консультацию, презентацию или спокойное продолжение диалога?',
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
  if (submission.primary_interest === 'create_trip') return 'создать маршрут или групповую поездку';
  if (submission.primary_interest === 'create_travel_group') return 'создать travel-группу или сообщество';
  if (submission.primary_interest === 'event') return 'организовать событие на основе путешествия';
  if (submission.primary_interest === 'events') return 'узнать о событиях и презентациях';
  if (submission.primary_interest === 'club') return 'понять возможности travel-клуба';
  if (submission.primary_interest === 'business_model') return 'разобраться в партнёрской модели без давления';
  if (submission.primary_interest === 'partner_model') return 'разобраться в партнёрской модели без давления';
  if (submission.primary_interest === 'learn_lifestyle_ambassador') return 'понять роль Lifestyle Ambassador';
  if (submission.primary_interest === 'learn_travel_advantage') return 'узнать о членстве Travel Advantage';
  if (submission.primary_interest === 'become_travel_advantage_member') return 'обсудить подключение к Travel Advantage';
  if (submission.primary_interest === 'learn_mwr_life') return 'понять связь MWR Life и Travel Advantage';
  if (submission.primary_interest === 'presentation_request') return 'получить корректную презентацию проекта';
  if (submission.primary_interest === 'question') return 'задать общий вопрос перед выбором следующего шага';
  if (submission.primary_interest === 'travel') return 'путешествовать чаще при поддержке сообщества';
  return 'понять, какой путь TravelGTC подходит лучше всего';
}
