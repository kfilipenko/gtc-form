import { describe, expect, test } from 'vitest';
import {
  MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL,
  TRAVELGTC_PAIR_MODEL_PAGE_URL,
  TRAVELGTC_PAIR_MODEL_PDF_URL,
  attachMembershipDocumentLink,
  buildMembershipKnowledgeContext,
  isDialogueFirstQuestion,
} from '../src/modules/ai/membershipKnowledge.js';
import { applyMiraAnswerGuard } from '../src/modules/ai/azureFoundryAgent.js';

describe('TravelGTC Mira membership knowledge', () => {
  test('keeps scenario starts as a dialogue instead of a full presentation', () => {
    const question = 'Хочу посмотреть модель для пары на 2 года. С чего начать, чтобы понять, подходит ли она нам?';

    expect(isDialogueFirstQuestion(question)).toBe(true);

    const context = buildMembershipKnowledgeContext(question);
    expect(context).toContain('это первый сценарный вход');
    expect(context).toContain('максимум 2 коротких абзаца');
    expect(context).toContain('Не называй Free Guest Pass, VIP, Elite, Turbo и ссылки в первом ответе');
    expect(context).toContain('открыть живой продажный диалог');

    const answer = 'Отлично, начнём с вашей ситуации. Что сейчас ближе: личные поездки, семья, группа или business-направление?';
    expect(attachMembershipDocumentLink(question, answer)).toBe(answer);
    expect(attachMembershipDocumentLink(question, answer)).not.toContain(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL);
  });

  test('does not append documents when user asks for a short no-pressure explanation', () => {
    const question = 'Я слышал про баллы и Travel Credits, но боюсь запутаться. Объясни коротко и без рекламного давления.';
    const answer = [
      'Есть Travel Credits и Loyalty Points. Давайте сначала поймем, какие поездки вы планируете.',
      '',
      '📄 Документ для проверки и сравнения: https://travelgtc.com/assets/docs/MembershipBenefits-RU.pdf',
      'Официальный PDF: https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf',
    ].join('\n');

    expect(attachMembershipDocumentLink(question, answer)).toBe(
      'Есть Travel Credits и Loyalty Points. Давайте сначала поймем, какие поездки вы планируете.',
    );
  });

  test('does not mistake scenario wording for price-document intent', () => {
    const question = 'А если иногда брать друзей, какой сценарий лучше?';
    const answer = [
      'Для друзей лучше сначала понять формат поездок.',
      '',
      '📄 Документ для проверки и сравнения: https://travelgtc.com/assets/docs/MembershipBenefits-RU.pdf',
    ].join('\n');

    expect(attachMembershipDocumentLink(question, answer)).toBe('Для друзей лучше сначала понять формат поездок.');
  });

  test('offers document choice before sending files for tariff questions', () => {
    const question = 'Какие тарифы Travel Advantage лучше сравнить для семьи?';
    const answer = 'Для семьи обычно важно понять, сколько людей будет пользоваться доступом и как часто вы планируете поездки.';

    const result = attachMembershipDocumentLink(question, answer);

    expect(result).toContain('Могу объяснить здесь в чате или дать ссылку на официальный документ');
    expect(result).not.toContain(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL);
  });

  test('injects sales playbook and return-dialogue guidance for membership questions', () => {
    const question = 'Я вернулся, хочу дальше разобраться с Membership для семьи и друзей.';

    const context = buildMembershipKnowledgeContext(question);

    expect(context).toContain('approved sales playbook');
    expect(context).toContain('путешествия -> членство -> сообщество');
    expect(context).toContain('Если пользователь вернулся после паузы');
    expect(context).toContain('один следующий вопрос');
  });

  test('sends documents after explicit user consent', () => {
    const question = 'Да, пришли PDF и таблицу сравнения.';
    const answer = 'Конечно, отправляю документы для спокойной проверки.';

    const result = attachMembershipDocumentLink(question, answer);

    expect(result).toContain(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL);
    expect(result).toContain('Официальный Membership Benefits PDF');
  });

  test('sends the pair-model presentation only when it is directly requested', () => {
    const question = 'Пришли презентацию с моделью для пары на 2 года.';
    const result = attachMembershipDocumentLink(question, 'Конечно, вот наглядная модель.');

    expect(result).toContain(TRAVELGTC_PAIR_MODEL_PAGE_URL);
    expect(result).not.toContain(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL);
  });

  test('sends the PDF only when the pair-model file is requested explicitly', () => {
    const result = attachMembershipDocumentLink('Пришли PDF с моделью для пары.', 'Конечно.');

    expect(result).toContain(TRAVELGTC_PAIR_MODEL_PDF_URL);
    expect(result).not.toContain(TRAVELGTC_PAIR_MODEL_PAGE_URL);
  });

  test('includes the strong pair scenario without treating points as cash', () => {
    const context = buildMembershipKnowledgeContext('Мы путешествуем семьёй и хотим понять Elite + Turbo.');

    expect(context).toContain('сильный сценарий Elite + Turbo');
    expect(context).toContain('490 Loyalty Points');
    expect(context).toContain('не наличные');
  });

  test('does not resend documents when user has already read a document and asks for registration link', () => {
    const question = 'Я почитал документ. Теперь хочу ссылку, чтобы зарегистрироваться и посмотреть официальный шаг.';
    const answer = 'Отлично, вот официальный следующий шаг.';

    const result = attachMembershipDocumentLink(question, answer);

    expect(result).toBe(answer);
    expect(result).not.toContain(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL);
  });

  test('removes unsupported savings claims without damaging legitimate Russian text', () => {
    const answer = [
      'Потенциальная польза Membership зависит от конкретной поездки.',
      'Обычно участники экономят 20-50% на каждом бронировании.',
      'Loyalty Points - не наличные и применяются только в допустимом заказе.',
    ].join(' ');

    const result = applyMiraAnswerGuard('Сравните тарифы для семьи.', answer);

    expect(result).toContain('Потенциальная польза Membership зависит от конкретной поездки.');
    expect(result).toContain('Loyalty Points - не наличные');
    expect(result).not.toMatch(/20\s*[-–]\s*50\s*%/);
    expect(result).not.toContain('сравнение условий и travel-value');
  });
});
