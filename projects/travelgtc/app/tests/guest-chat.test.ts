import { describe, expect, test } from 'vitest';
import { registrationGate, buildReferralGateContext } from '../src/modules/ai/guestChat.js';

describe('guest registration gate', () => {
  test.each([0,1,2])('holds paid partner routes at %i completed turns', count => {
    const result = registrationGate('Хочу купить VIP Membership.', '[VIP](https://vip.traveladvantage.com/KFilip909)', count);
    expect(result.purchaseIntent).toBe(false);
    expect(result.referralUrl).toBeNull();
    expect(result.answer).not.toContain('https://');
    expect(result.answer).toContain('Что вы хотели бы уточнить');
    expect(result.answer).not.toContain('обменов');
  });
  test('requires renewed explicit intent, not just elapsed turns', () => {
    const result = registrationGate('Спасибо, мне надо подумать.', 'https://www.mwrlife.com/KFilip909', 4);
    expect(result.purchaseIntent).toBe(false);
    expect(result.referralUrl).toBeNull();
  });
  test('allows confirmed VIP on fourth exchange without claiming external registration', () => {
    const result = registrationGate('Хочу купить VIP Membership.', 'Разберём условия.', 3);
    expect(result.purchaseIntent).toBe(true);
    expect(result.referralUrl).toBe('https://vip.traveladvantage.com/KFilip909');
    expect(result.answer).toContain('не получает автоматического подтверждения');
  });
  test('document remains immediate and is not a purchase', () => {
    const result = registrationGate('Пришли документ Membership.', 'https://example.org/benefits.pdf', 0);
    expect(result.answer).toContain('benefits.pdf');
    expect(result.purchaseIntent).toBe(false);
  });
  test('refusal overrides previous interaction count', () => {
    expect(registrationGate('Не хочу покупать VIP.', 'https://vip.traveladvantage.com/KFilip909', 10).referralUrl).toBeNull();
  });
  test.each([0,1,2,3,10])('guest invitation is immediate and not a sale at %i turns', count => {
    const result = registrationGate('Хочу посмотреть Travel Advantage.', 'Посмотрите продукт. [VIP](https://vip.traveladvantage.com/KFilip909)', count);
    expect(result.intent.action).toBe('guest_pass');
    expect(result.referralUrl).toBe('https://free.traveladvantage.com/KFilip909');
    expect(result.purchaseIntent).toBe(false);
    expect(result.answer).toContain('Гостевое знакомство');
    expect(result.answer).toContain('Аккаунт TravelGTC для перехода не нужен');
    expect(result.answer).toContain('не получает автоматического подтверждения');
    expect(result.answer).not.toContain('Официальная партнёрская регистрация');
    expect(result.answer).not.toContain('https://vip.');
    expect(result.answer.match(/https:\/\//g)).toHaveLength(1);
  });
  test.each(['Не присылай Guest Pass.', 'Что такое Guest Pass?', 'Хочу зарегистрироваться.', 'Я уже зарегистрировался в MWR Life.'])('does not invent readiness: %s', question => {
    const result = registrationGate(question, 'https://free.traveladvantage.com/KFilip909', 10);
    expect(result.referralUrl).toBeNull();
    expect(result.purchaseIntent).toBe(false);
  });
  test('both conversation types receive the same explicit exception', () => {
    const context = buildReferralGateContext(0);
    expect(context).toContain('приглашение по прямой просьбе доступно сразу');
    expect(context).toContain('пока не передавай');
    expect(context).not.toContain('обменов');
    expect(buildReferralGateContext(3)).toContain('можно передать по явному запросу');
    expect(context).toContain('Guest Pass не является покупкой');
  });
});
