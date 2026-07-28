export const MEMBERSHIP_KNOWLEDGE_DOCUMENT_PATH = '/assets/docs/MembershipBenefits-RU.pdf';
export const MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL = `https://travelgtc.com${MEMBERSHIP_KNOWLEDGE_DOCUMENT_PATH}`;
export const OFFICIAL_MEMBERSHIP_BENEFITS_URL =
  'https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf';
export const TRAVEL_ADVANTAGE_VIP_DEMO_URL = 'https://vip.traveladvantage.com/KFilip909';
export const TRAVEL_ADVANTAGE_FREE_DEMO_URL = 'https://free.traveladvantage.com/KFilip909';

const MEMBERSHIP_KNOWLEDGE_SUMMARY = [
  'База знаний Travel Advantage Membership для ответов Миры.',
  'Источник цифр: официальный Membership Benefits PDF v25.05.01 и рабочий RU-документ TravelGTC.',
  `Рабочий RU-документ: ${MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL}`,
  `Официальный EN PDF: ${OFFICIAL_MEMBERSHIP_BENEFITS_URL}`,
  `VIP demo Travel Advantage: ${TRAVEL_ADVANTAGE_VIP_DEMO_URL}`,
  `Free demo Travel Advantage: ${TRAVEL_ADVANTAGE_FREE_DEMO_URL}`,
  '',
  'Уровни: Guest, VIP, VIP180, Elite, а также Turbo add-on.',
  'Ключевые условия для сравнений, расчетов и продажного объяснения:',
  '- Guest: бесплатное пожизненное членство, регистрация лояльности 120, гостевые пропуски при регистрации 10, после оплаты 0, за бронь отеля 0, доп. пользователей 0.',
  '- VIP: 19.97 в месяц + 20 активация, гостевые пропуски 15 / 3 / 3, доп. пользователей 1.',
  '- VIP180: 99 за 6 месяцев + 20 активация, гостевые пропуски 25 / 25 / 3, доп. пользователей 1.',
  '- Elite: 119.97 в месяц + 120 активация, лояльность при регистрации 120, гостевые пропуски 50 / 20 / 3, доп. пользователей 4.',
  '- Turbo add-on: 249.97 разово, +250 баллов и +1500 гостевых пропусков.',
  '- Elite является уровнем eligibility для Loyalty Points.',
  '- Turbo add-on связан с Double Monthly Loyalty Points.',
  '- Loyalty Points: это travel-value внутри программы. Для объяснения клиенту: 1 Loyalty Point может соответствовать $1 travel-value при допустимом списании, но сумма, пропорция и лимит зависят от правил конкретного заказа.',
  '- Loyalty Points usage: do not claim that points can be applied to flights, cruises, hotels or any category unless the concrete booking flow allows it. Use wording "допустимый заказ", "booking flow" and "Life Experiences where applicable".',
  '- Loyalty Points не переводятся между участниками и не обмениваются на наличные.',
  '- Travel Credits earned from bookings and stored in account to be used at checkout if applicable; official PDF states Value $.01.',
  '- Demo access: VIP demo and free demo are approved TravelGTC links for showing the Travel Advantage interface before paid registration. Demo is a discovery step, not a promise of final price, availability or paid inventory.',
  '- Demo access routing: free demo is the soft first look for cautious users, first product discovery and "бесплатно посмотреть"; VIP demo is the preferred sales demo for users asking about Membership, VIP/Elite, family, groups, clients, points, events, Ambassador or purchase comparison. If unclear, give both links and explain the difference briefly.',
  '- Групповые и бизнес-сценарии: йога, цигун, wellness, ретриты, тренеры, эксперты с аудиторией, организаторы событий, подарочные поездки близким, Ambassador-направление.',
  '- При группе, клиентах, семье, друзьях, регулярных поездках, Life Experiences, points или business interest Мира сначала сравнивает Elite и при необходимости Turbo add-on.',
  '- При просрочке оплаты баллы блокируются, 180+ дней просрочки: отмена членства.',
].join('\n');

export function isMembershipKnowledgeQuestion(question: string): boolean {
  return /(membership|тариф|уровн|vip|vip180|elite|элит|turbo|турбо|балл|loyalty|point|travel credits|кредит|сравн|расчет|расч[её]т|калькул|выгод|выгодн|окуп|таблиц|разниц|сценар|семь|друз|групп|клиент|ученик|ретрит|йог|цигун|wellness|ambassador|амбассад|бизнес|заработ|доход|life experience|demo|демо|free|trial|посмотреть|интерфейс)/i.test(
    question,
  );
}

export function buildMembershipKnowledgeContext(question: string): string {
  if (!isMembershipKnowledgeQuestion(question)) {
    return question;
  }

  return [
    question,
    '',
    'Используй следующую базу знаний для ответа о Membership, тарифах, баллах, группах, бизнес-сценариях и расчетах.',
    'Отвечай как продающий консультант: выявляй потребности и сначала проверяй, подходит ли Elite / Turbo add-on. Если потребность или бюджет ниже - спускайся к VIP180/VIP.',
    'Если говоришь про баллы: объясняй travel-value, не называй это cash. Укажи, что применимость и пропорция зависят от конкретного заказа.',
    'Не придумывай категории списания Loyalty Points. Не говори "авиабилеты/круизы/отели" как универсальные примеры применения баллов. Говори "допустимый заказ", "Life Experiences where applicable" и "покажет официальный booking flow".',
    'Если вопрос про бизнес/группы: выявляй аудиторию, учеников, клиентов, ретриты, мероприятия и Ambassador-сценарий.',
    'Если используешь цифры, добавляй ссылку на рабочий RU-документ и официальный EN PDF.',
    'Если пользователь хочет сначала посмотреть платформу, до оплаты или до регистрации: предложи demo-доступ. Free demo - для первого осторожного знакомства и просьб "бесплатно посмотреть"; VIP demo - для вопросов про тарифы, Membership, семью, группу, клиентов, баллы, события, Ambassador или сравнение перед покупкой. Если неясно - дай обе ссылки и объясни разницу.',
    '',
    MEMBERSHIP_KNOWLEDGE_SUMMARY,
  ].join('\n');
}

export function attachMembershipDocumentLink(question: string, answer: string): string {
  if (!isMembershipKnowledgeQuestion(question)) {
    return answer;
  }
  if (answer.includes(MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL)) {
    return answer;
  }

  const demoLine = /(demo|демо|free|trial|посмотреть|интерфейс)/i.test(question)
    ? `\n\n🌟 VIP demo: ${TRAVEL_ADVANTAGE_VIP_DEMO_URL}\n🆓 Free demo: ${TRAVEL_ADVANTAGE_FREE_DEMO_URL}`
    : '';

  return `${answer}\n\n📄 Документ для проверки и сравнения: ${MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL}\nОфициальный PDF: ${OFFICIAL_MEMBERSHIP_BENEFITS_URL}${demoLine}`;
}
