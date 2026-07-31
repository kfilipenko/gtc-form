const OFFICIAL_SOURCE_TEXT =
  'Официальные источники для проверки: MWR Life https://www.mwrlife.com/, Membership https://www.mwrlife.com/home/membership, Company https://www.mwrlife.com/home/company, Travel Advantage https://www.traveladvantage.com/home, Membership Benefits PDF https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf, VIP Membership https://vip.traveladvantage.com/KFilip909, Free Guest Pass https://free.traveladvantage.com/KFilip909.';
const MEMBERSHIP_DOC_LINK =
  'https://travelgtc.com/assets/docs/MembershipBenefits-RU.pdf';
const VIP_MEMBERSHIP_LINK = 'https://vip.traveladvantage.com/KFilip909';
const FREE_GUEST_PASS_LINK = 'https://free.traveladvantage.com/KFilip909';
const OPPORTUNITIES_LINK = 'https://travelgtc.com/';

export function buildMiraFallbackAnswer(question: string): string {
  const normalized = question.toLowerCase();
  const nextStepPattern =
    /(зарегистр|регистрац|стоим|цена|сколько|купить|оплат|checkout|участник|ambassador|амбассад|страна|доступ|ссылка|связ|контакт|whatsapp|telegram|телефон|email)/i;
  const sourcePattern = /(официальн|источник|сайт|документ|pdf|benefits|правил|услов)/i;
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл)/i;
  const comparePattern = /(сравн|расчет|расч[её]т|калькул|выгод|разниц|таблиц|elite|vip|турбо|turbo|балл|loyalty|групп|клиент|ретрит|йог|цигун)/i;
  const guestAccessPattern = /(guest pass|гостев|demo|демо|trial|free|посмотреть|интерфейс)/i;
  const opportunitiesPattern =
    /(возможност|сценар|потребност|семь|близк|подар|спорт|активн|фридайв|йог|цигун|wellness|ретрит|групп|клиент|ученик|тренер|аудитор|сообществ|сетев|рекомендац)/i;

  if (guestAccessPattern.test(normalized)) {
    const vipFit = /(vip|elite|элит|membership|тариф|семь|друз|групп|клиент|балл|loyalty|событ|ambassador|амбассад|куп|оплат|сравн)/i.test(
      normalized,
    );
    const primaryLine = vipFit
      ? `🌟 VIP Membership: ${VIP_MEMBERSHIP_LINK}`
      : `🆓 Free Guest Pass: ${FREE_GUEST_PASS_LINK}`;
    const secondaryLine = vipFit
      ? `🆓 Free Guest Pass, если хотите начать совсем мягко: ${FREE_GUEST_PASS_LINK}`
      : `🌟 VIP Membership, если уже хотите перейти к платному VIP-членству: ${VIP_MEMBERSHIP_LINK}`;
    return `Можно начать с правильного входа Travel Advantage.\n\n${primaryLine}\n${secondaryLine}\n\nFree Guest Pass подходит для первого знакомства без кредитной карты. По странице Travel Advantage он даёт гостевой доступ к booking platform с ограничением: 1 hotel booking максимум на 2 ночи.\n\nVIP Membership — это уже продающая страница платного VIP-членства с переходом к official checkout. Если у вас семья, группа, клиенты, интерес к баллам, Elite, Turbo или Ambassador, я бы сначала сравнила уровни Membership, чтобы не выбрать слишком слабый тариф.`;
  }

  if (opportunitiesPattern.test(normalized)) {
    return `Давайте начнём не с тарифа, а с вашего сценария 🌍\n\nВ TravelGTC я смотрю на 6 основных потребностей:\n\n- путешествовать чаще для себя;\n- семья, близкие и подарочные поездки;\n- активные путешествия: спорт, wellness, ретриты;\n- группы, ученики и клиенты;\n- события и клубная среда;\n- Ambassador и бизнес вокруг travel-продукта.\n\nЕсли у вас уже есть ученики, клиенты, подписчики или группа, это особенно интересный сценарий: Travel Advantage может быть не просто членством, а travel-направлением вокруг доверия и рекомендаций.\n\nКарта возможностей: ${OPPORTUNITIES_LINK}\n\nСкажите, что ближе сейчас: личные поездки, семья, активный формат, группа/клиенты или бизнес-сценарий?`;
  }

  if (nextStepPattern.test(normalized)) {
    return `Похоже, вы уже близко к следующему шагу ✅

Есть три корректных входа:

- 🆓 Free Guest Pass, если хотите сначала посмотреть платформу без кредитной карты: ${FREE_GUEST_PASS_LINK}
- 🌟 VIP Membership, если уже хотите перейти к платному VIP-членству: ${VIP_MEMBERSHIP_LINK}
- 🔗 официальная партнёрская регистрация TravelGTC, если готовы регистрироваться или обсуждать Ambassador: https://www.mwrlife.com/KFilip909

Перед оплатой я бы всё же быстро проверила: вам нужен только личный доступ или важны семья, друзья, группы, клиенты, Guest Passes, Elite, Turbo add-on и Loyalty Points? Это помогает не выбрать уровень слабее ваших реальных задач.`;
  }
  if (sourcePattern.test(normalized)) {
    return `${OFFICIAL_SOURCE_TEXT} Для удобного сравнения уровней на сервере TravelGTC размещён рабочий документ: ${MEMBERSHIP_DOC_LINK}. TravelGTC — партнёрская информационная страница независимого Lifestyle Ambassador, поэтому финальные цены, условия, правила членства, документы и региональную доступность нужно сверять именно там.`;
  }
  if (comparePattern.test(normalized)) {
    return `Хороший вопрос. Я бы начала не с названия тарифа, а с ваших задач 🌍

Чтобы не купить слишком слабый уровень, сначала проверяем “maximum fit”:

1. Вы путешествуете один, с семьёй или с друзьями?
2. Хотите ли вы приглашать близких, клиентов или участников группы?
3. Важны ли вам Guest Passes, Additional Users, Life Experiences или Loyalty Points?
4. Рассматриваете ли вы роль Lifestyle Ambassador в будущем?

Если есть семья, группа, клиенты, события или интерес к баллам, сначала стоит сравнить Elite и Turbo add-on. Если потребности проще или бюджет ограничен, тогда смотрим VIP180 или VIP.

Для сравнения используйте документ TravelGTC: ${MEMBERSHIP_DOC_LINK}. Баллы — это travel-value внутри программы: 1 Loyalty Point может соответствовать $1 travel-value при допустимом списании, но конкретная пропорция зависит от заказа.`;
  }
  if (normalized.includes('travel advantage') || normalized.includes('членств')) {
    return 'Travel Advantage — это онлайн/мобильное приложение, доступное членам клуба путешественников, с категориями сервисов для поездок и отдыха. Хороший первый шаг — понять, какой Membership закрывает именно вашу задачу: личные поездки, семья, друзья, события, группа/клиенты или Ambassador-направление.';
  }
  if (normalized.includes('mwr') || normalized.includes('компан')) {
    return 'MWR Life — деловая сторона проекта: компания, Lifestyle Ambassador, события, обучение и партнёрская модель. TravelGTC не является официальным сайтом MWR Life, а помогает разобраться и подготовиться к следующему шагу.';
  }
  if (normalized.includes('доход') || normalized.includes('заработ')) {
    return 'Если вы хотите зарабатывать на travel-направлении, это уже сценарий MWR Life Lifestyle Ambassador: рекомендации, вовлечение участников, группы, события и комиссионная модель по официальным правилам. Особенно интересно это для тех, у кого есть ученики, клиенты, ретриты, wellness-группы или своё сообщество. Начинать разговор стоит с Elite, Turbo add-on и Ambassador-сценария, чтобы не выбрать слабый вход для бизнес-задачи.';
  }
  if (storyPattern.test(normalized)) {
    return 'В travel-сообществах часто самое ценное начинается не с бронирования, а со встречи: кто-то находит компанию для поездки, кто-то — делового партнёра, кто-то — друга по интересам. Это пример атмосферы, не обещание результата. А тариф лучше выбирать уже после спокойного сравнения официальных условий.';
  }
  return `Я Мира TravelGTC. Помогаю не просто ответить на вопрос, а подобрать путь к Membership через вашу реальную потребность. Для сравнений и расчетов использую этот документ: ${MEMBERSHIP_DOC_LINK}. Что сейчас важнее: путешествовать чаще, вовлечь семью, собрать друзей, организовать поездку для группы или понять Ambassador-направление?`;
}
