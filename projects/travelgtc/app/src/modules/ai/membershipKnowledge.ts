export const MEMBERSHIP_KNOWLEDGE_DOCUMENT_PATH = '/assets/docs/MembershipBenefits-RU.pdf';
export const MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL = `https://travelgtc.com${MEMBERSHIP_KNOWLEDGE_DOCUMENT_PATH}`;
export const OFFICIAL_MEMBERSHIP_BENEFITS_URL =
  'https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf';
export const OFFICIAL_MWR_FAQ_URL =
  'https://mwracademy.com/wp-content/uploads/2025/07/FAQ-MWR-Life-V16_May-2025-ENG.pdf';
export const TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL = 'https://vip.traveladvantage.com/KFilip909';
export const TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL = 'https://free.traveladvantage.com/KFilip909';
export const TRAVELGTC_OPPORTUNITIES_URL = 'https://travelgtc.com/events/';

const MEMBERSHIP_KNOWLEDGE_SUMMARY = [
  'База знаний Travel Advantage Membership для ответов Миры.',
  'Источник цифр: официальный Membership Benefits PDF v25.05.01 и рабочий RU-документ TravelGTC.',
  `Рабочий RU-документ: ${MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL}`,
  `Официальный EN PDF: ${OFFICIAL_MEMBERSHIP_BENEFITS_URL}`,
  `MWR Life FAQ / Travel Advantage troubleshooting guide: ${OFFICIAL_MWR_FAQ_URL}`,
  `VIP Membership Travel Advantage: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}`,
  `Free Guest Pass Travel Advantage: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`,
  `Сценарии возможностей TravelGTC: ${TRAVELGTC_OPPORTUNITIES_URL}`,
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
  '- Важно: Travel Credits и Loyalty Points - разные единицы. Не называй их одним словом "бонусы" без уточнения.',
  '- Travel Credits: начисляются за подходящие бронирования и хранятся в аккаунте для использования при checkout, если применимо. Официальный Membership Benefits PDF указывает Value $.01; FAQ поясняет: 100 Travel Credits = $1 deduction.',
  '- Loyalty Points: это отдельный travel-value механизм для ELITE / ELITE + TURBO. FAQ поясняет: 1 Loyalty Point is equivalent to $1 deducted when the reservation is eligible for loyalty points.',
  '- Loyalty Points usage: do not claim that points can be applied to flights, cruises, hotels or any category unless the concrete booking flow allows it. Use wording "допустимый заказ", "booking flow" and "Life Experiences where applicable".',
  '- Loyalty Points не переводятся между участниками и не обмениваются на наличные.',
  '- Если пользователь говорит "бонусы", "кредиты", "баллы" или "уплаченная сумма зачисляется 1 к 1", сначала уточни термин: Travel Credits или Loyalty Points. 1 к 1 относится к Loyalty Points travel-value при допустимом списании, а не к Travel Credits.',
  '- Free Guest Pass: approved TravelGTC link for first product discovery without a credit card; page states Guest Pass provides full access to the Travel Advantage booking platform, limited to 1 hotel booking for a maximum of 2 nights.',
  '- VIP Membership: approved TravelGTC link to the VIP Membership sales page and official VIP checkout route. It is not a trial page.',
  '- Link routing: Free Guest Pass is the soft first look for cautious users, first product discovery and "бесплатно посмотреть"; VIP Membership is for users ready to consider the paid VIP level. For family, groups, clients, points, Elite, Turbo or Ambassador interest, first compare Membership levels before sending only the VIP Membership link.',
  '- Групповые и бизнес-сценарии: йога, цигун, wellness, ретриты, тренеры, эксперты с аудиторией, организаторы событий, подарочные поездки близким, Ambassador-направление.',
  '- При группе, клиентах, семье, друзьях, регулярных поездках, Life Experiences, points или business interest Мира сначала сравнивает Elite и при необходимости Turbo add-on.',
  '- Страница возможностей TravelGTC структурирует потребности пользователя: путешествовать чаще, семья и близкие, активные путешествия, группы/ученики/клиенты, события/клубная среда, Ambassador и бизнес.',
  '- Если пользователь не понимает, что ему ближе, Мира сначала задает один классифицирующий вопрос: личные поездки, семья, активный формат, группа/клиенты, клубные события или Ambassador/бизнес.',
  '- Если пользователь является тренером, мастером йоги/цигуна/wellness, организатором ретритов, преподавателем, консультантом или лидером сообщества, Мира должна показать сценарий "группы, ученики и клиенты" и затем аккуратно раскрыть Ambassador-возможность.',
  '- Если пользователь интересуется бизнесом, Мира объясняет современную партнерскую модель через полезный travel-продукт, доверие, рекомендации, готовую инфраструктуру, цифровой доступ и развитие собственной группы. Не использовать агрессивные анти-скептические формулировки.',
  '- При просрочке оплаты баллы блокируются, 180+ дней просрочки: отмена членства.',
].join('\n');

export function isMembershipKnowledgeQuestion(question: string): boolean {
  return /(membership|тариф|уровн|vip|vip180|elite|элит|turbo|турбо|балл|loyalty|point|travel credits|кредит|сравн|расчет|расч[её]т|калькул|выгод|выгодн|окуп|таблиц|разниц|сценар|возможност|потребност|семь|близк|подар|свадеб|друз|групп|клиент|ученик|ретрит|йог|цигун|wellness|спорт|фридайв|активн|тренер|мастер|аудитор|сообществ|ambassador|амбассад|бизнес|заработ|доход|прям.*продаж|сетев|рекомендац|life experience|guest pass|гостев|demo|демо|free|trial|посмотреть|интерфейс)/i.test(
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
    'Если говоришь про баллы, сначала различай Travel Credits и Loyalty Points. Travel Credits: 100 = $1 deduction. Loyalty Points: 1 = $1 travel-value only where eligible. Не называй это cash. Укажи, что применимость и пропорция зависят от конкретного заказа.',
    'Не придумывай категории списания Loyalty Points. Не говори "авиабилеты/круизы/отели" как универсальные примеры применения баллов. Говори "допустимый заказ", "Life Experiences where applicable" и "покажет официальный booking flow".',
    'Если вопрос про бизнес/группы: выявляй аудиторию, учеников, клиентов, ретриты, мероприятия и Ambassador-сценарий.',
    `Если вопрос про сценарии потребностей или пользователь не знает, с чего начать: используй карту возможностей TravelGTC ${TRAVELGTC_OPPORTUNITIES_URL} и классифицируй сценарий: личные путешествия, семья, активный отдых, группы/клиенты, события/клубная среда, Ambassador/бизнес.`,
    'Если используешь цифры, добавляй ссылку на рабочий RU-документ, официальный Membership Benefits EN PDF и MWR Life FAQ.',
    'Если пользователь хочет сначала посмотреть платформу, до оплаты или без кредитной карты: предложи Free Guest Pass. Объясни ограничение: 1 hotel booking максимум на 2 ночи. Если пользователь готов рассматривать платный VIP-уровень - дай VIP Membership. Если есть семья, группа, клиенты, баллы, Elite, Turbo или Ambassador interest - сначала сравни уровни Membership, чтобы не отправить человека на слишком слабый VIP checkout.',
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

  const accessLine = /(guest pass|гостев|demo|демо|free|trial|посмотреть|интерфейс)/i.test(question)
    ? `\n\n🌟 VIP Membership: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}\n🆓 Free Guest Pass: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`
    : '';

  return `${answer}\n\n📄 Документ для проверки и сравнения: ${MEMBERSHIP_KNOWLEDGE_DOCUMENT_URL}\nОфициальный PDF: ${OFFICIAL_MEMBERSHIP_BENEFITS_URL}\nFAQ MWR Life / Travel Advantage: ${OFFICIAL_MWR_FAQ_URL}${accessLine}`;
}
