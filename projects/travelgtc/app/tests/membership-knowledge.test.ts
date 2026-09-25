import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { attachMembershipDocumentLink, buildMembershipKnowledgeContext, OFFICIAL_MEMBERSHIP_BENEFITS_URL,
  OFFICIAL_COMPENSATION_PLAN_URL, TRAVELGTC_PAIR_MODEL_PDF_URL } from '../src/modules/ai/membershipKnowledge.js';
import { applyMiraAnswerGuard } from '../src/modules/ai/azureFoundryAgent.js';
import { classifyMiraIntent } from '../src/modules/ai/miraIntent.js';
import { buildMiraFallbackAnswer } from '../src/modules/ai/miraFallback.js';

describe('Mira strategy and safe routing', () => {
  test('instruction payload separates guest access, paid readiness and external verification', () => {
    const appRoot = new URL(import.meta.url.includes('/dist/tests/') ? '../../' : '../', import.meta.url);
    const document = readFileSync(new URL('../../../docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md', appRoot), 'utf8');
    expect(document.split('<!-- MIRA_CURRENT_START -->')).toHaveLength(2);
    expect(document.split('<!-- MIRA_CURRENT_END -->')).toHaveLength(2);
    const payload = document.split('<!-- MIRA_CURRENT_START -->')[1].split('<!-- MIRA_CURRENT_END -->')[0];
    expect(payload).toContain('даже в первом ответе');
    expect(payload).toContain('Это ожидание НЕ относится к гостевому приглашению');
    expect(payload).toContain('Приложение сообщает доступность платного перехода');
    expect(payload).toContain('регистрация подтверждается Константином');
    expect(payload).toContain('нет доступа к этому кабинету или API MWR Life');
    expect(payload).not.toContain('не передавай регистрационные ссылки до трёх обменов');
  });
  test.each([
    ['Пришли ссылку на официальный документ', 'document', false],
    ['Хочу зарегистрироваться на мероприятие', 'event', false],
    ['Хочу создать аккаунт и зарегистрироваться на сайте', 'account', false],
    ['Хочу посмотреть Free Guest Pass', 'guest_pass', false],
    ['Дай гостевую ссылку', 'guest_pass', false],
    ['Хочу посмотреть Travel Advantage', 'guest_pass', false],
    ['Как получить гостевой доступ?', 'guest_pass', false],
    ['Не хочу покупать VIP, дай гостевое приглашение.', 'guest_pass', false],
    ['Что такое Guest Pass?', 'conversation', false],
    ['Не хочу Guest Pass', 'conversation', false],
    ['Не присылай гостевую ссылку', 'conversation', false],
    ['Не хочу посмотреть Travel Advantage', 'conversation', false],
    ['Хочу зарегистрироваться', 'clarify_registration', false],
    ['Хочу купить VIP Membership', 'membership', true],
    ['Хочу зарегистрироваться как Ambassador', 'ambassador', true],
    ['Пришли ссылку на регистрацию VIP', 'membership', true],
    ['Я пока не готов покупать VIP, пришли ссылку', 'conversation', false],
    ['Не хочу покупать Membership', 'conversation', false],
    ['У меня группа для йоги, бизнес не интересует', 'conversation', false],
    ['Хочу понять партнерский бизнес', 'conversation', false],
    ['I am not ready to buy VIP', 'conversation', false],
    ['Send the compensation plan document', 'document', false],
    ['Где зарегистрироваться на событие Life Experiences?', 'event', false],
  ])('%s -> %s', (question, action, purchase) => {
    expect(classifyMiraIntent(question as string)).toMatchObject({ action, purchaseIntent: purchase });
  });

  test('explicit business refusal never becomes a business lead', () => {
    expect(classifyMiraIntent('У меня группа для йоги, бизнес не интересует')).toMatchObject({
      direction: 'travel', businessDeclined: true,
    });
    expect(classifyMiraIntent('Мне интересны рекомендации и бизнес Ambassador').direction).toBe('ambassador');
    expect(classifyMiraIntent('Какие Life Experiences доступны?').direction).toBe('experiences');
  });

  test('all questions receive neutral context without historical prices or pair recruiting', () => {
    const context = buildMembershipKnowledgeContext('Я живу на Кипре, планирую семейную поездку.');
    expect(context).toContain('отдельными направлениями');
    expect(context).toContain('русский язык не определяет страну');
    expect(context).toContain('Я живу на Кипре');
    expect(context).toContain('минимально достаточное');
    expect(context).not.toMatch(/490 Loyalty|119\.97|первые 5|сначала покажи сильный/);
    expect(context).toContain('НЕ их проверенное текущее содержание');
    expect(context).toContain('не отдельный travel-продукт');
    expect(context).toContain('не требуй аккаунт TravelGTC');
    expect(context).toContain('До проверенной API-интеграции');
    expect(context).toContain('подтверждение возможно только после проверки Константином');
    expect(context).toContain('сохраняя KFilip909');
  });

  test.each([
    ['Пришли официальный документ с таблицей Membership', OFFICIAL_MEMBERSHIP_BENEFITS_URL],
    ['Пришли документ компенсационного плана', OFFICIAL_COMPENSATION_PLAN_URL],
    ['Пришли PDF с моделью для пары', TRAVELGTC_PAIR_MODEL_PDF_URL],
  ])('sends only the directly requested document: %s', (question, url) => {
    const answer = attachMembershipDocumentLink(question, 'Вот документ для проверки.');
    expect(answer).toContain(url);
    expect(answer.match(/https:\/\//g)).toHaveLength(1);
  });

  test('does not attach documents to an ordinary family scenario', () => {
    const answer = `Какие даты вы рассматриваете?\n${OFFICIAL_MEMBERSHIP_BENEFITS_URL}`;
    expect(attachMembershipDocumentLink('Мы путешествуем семьей', answer)).toBe('Какие даты вы рассматриваете?');
  });

  test('never restores a fully rejected answer', () => {
    const unsafe = 'Вы получите экономию 20-50%.';
    expect(applyMiraAnswerGuard('Какая экономия?', unsafe)).not.toContain('20-50%');
    expect(applyMiraAnswerGuard('Какая экономия?', unsafe).length).toBeGreaterThan(0);
  });

  test('link filtering preserves explanation and safe markdown formatting', () => {
    const answer = `1. Оцените расходы по [плану](${OFFICIAL_COMPENSATION_PLAN_URL}).\n\n2. Доход не гарантирован.\n\nКакие условия вам важны?`;
    const filtered = attachMembershipDocumentLink('Как оценить Ambassador?', answer);
    expect(filtered).toContain('1. Оцените расходы по плану.');
    expect(filtered).toContain('2. Доход не гарантирован.');
    expect(filtered).not.toContain(OFFICIAL_COMPENSATION_PLAN_URL);
    expect(applyMiraAnswerGuard('Как оценить Ambassador?', filtered)).toBe(filtered);
  });

  test('registration links require the matching user intent, even in an account context', () => {
    const answer = 'Оцените расходы: [регистрация](https://www.mwrlife.com/KFilip909).';
    expect(attachMembershipDocumentLink('Как оценить Ambassador?', answer)).not.toContain('https://www.mwrlife.com/KFilip909');
    const vip = '[VIP](https://vip.traveladvantage.com/KFilip909)';
    expect(attachMembershipDocumentLink('Профиль пользователя: Test.\nСообщение пользователя: Хочу купить VIP Membership.', vip)).toContain('https://vip.traveladvantage.com/KFilip909');
  });

  test('removing unsolicited bare links leaves readable punctuation', () => {
    const answer = `Смотрите официальный план: ${OFFICIAL_COMPENSATION_PLAN_URL}.\n\nОцените время и расходы.`;
    expect(attachMembershipDocumentLink('Как оценить Ambassador?', answer))
      .toBe('Смотрите официальный план.\n\nОцените время и расходы.');
  });

  test('preserves safe text while removing an unsupported savings sentence', () => {
    const result = applyMiraAnswerGuard('Сравните тарифы', 'Польза зависит от поездки. Вы экономите 20-50%. Loyalty Points - не наличные.');
    expect(result).toContain('Польза зависит от поездки.');
    expect(result).toContain('не наличные');
    expect(result).not.toContain('20-50%');
  });

  test('fallback is explicitly not an AI answer and does not sell', () => {
    const result = buildMiraFallbackAnswer('Купить VIP');
    expect(result).toContain('не ответ AI-консультанта');
    expect(result).not.toContain('https://');
  });
});
