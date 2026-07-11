const OFFICIAL_SOURCE_TEXT =
  'Официальные источники для проверки: MWR Life https://www.mwrlife.com/, Membership https://www.mwrlife.com/home/membership, Company https://www.mwrlife.com/home/company, Travel Advantage https://www.traveladvantage.com/home, Membership Benefits PDF https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf.';

export function buildMiraFallbackAnswer(question: string): string {
  const normalized = question.toLowerCase();
  const nextStepPattern =
    /(зарегистр|регистрац|стоим|цена|сколько|тариф|купить|оплат|участник|ambassador|амбассад|страна|доступ|ссылка|связ|контакт|whatsapp|telegram|телефон|email)/i;
  const sourcePattern = /(официальн|источник|сайт|документ|pdf|benefits|правил|услов)/i;
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл|путешеств)/i;

  if (nextStepPattern.test(normalized)) {
    return 'Похоже, вы уже близко к следующему шагу. Я Мира, поэтому подскажу спокойно: оставьте короткую заявку на TravelGTC, а партнёр объяснит тарифы, проверит доступность для вашей страны и поможет перейти к официальной процедуре MWR Life / Travel Advantage.';
  }
  if (sourcePattern.test(normalized)) {
    return `${OFFICIAL_SOURCE_TEXT} TravelGTC — партнёрская информационная страница независимого Lifestyle Ambassador, поэтому финальные цены, условия, правила членства, документы и региональную доступность нужно сверять именно там.`;
  }
  if (normalized.includes('travel advantage') || normalized.includes('членств')) {
    return 'Travel Advantage — это онлайн/мобильное приложение, доступное членам клуба путешественников, с категориями сервисов для поездок и отдыха. Хороший первый шаг — понять, какой тариф закрывает именно вашу задачу: семья, частые поездки, события или личный travel-инструмент.';
  }
  if (normalized.includes('mwr') || normalized.includes('компан')) {
    return 'MWR Life — деловая сторона проекта: компания, Lifestyle Ambassador, события, обучение и партнёрская модель. TravelGTC не является официальным сайтом MWR Life, а помогает разобраться и подготовиться к следующему шагу.';
  }
  if (normalized.includes('доход') || normalized.includes('заработ')) {
    return 'Доход в партнёрской модели не гарантирован. Любые результаты зависят от личной активности, навыков, времени, репутации и соблюдения официальных правил. Перед решением нужно изучить официальные раскрытия и документы.';
  }
  if (storyPattern.test(normalized)) {
    return 'В travel-сообществах часто самое ценное начинается не с бронирования, а со встречи: кто-то находит компанию для поездки, кто-то — делового партнёра, кто-то — друга по интересам. Это пример атмосферы, не обещание результата. А тариф лучше выбирать уже после спокойного сравнения официальных условий.';
  }
  return 'Я Мира TravelGTC. Могу объяснить разницу между MWR Life, Travel Advantage, членством, событиями и ролью Lifestyle Ambassador. Чтобы подобрать тариф без суеты, расскажите: вы хотите путешествовать чаще, выбрать семейный формат или понять членство как travel-инструмент?';
}
