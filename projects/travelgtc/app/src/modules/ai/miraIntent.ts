export type MiraDirection = 'travel' | 'experiences' | 'ambassador' | 'unknown';
export type MiraAction = 'conversation' | 'document' | 'guest_pass' | 'event' | 'account' | 'membership' | 'ambassador' | 'clarify_registration';

export interface MiraIntent {
  direction: MiraDirection;
  action: MiraAction;
  purchaseIntent: boolean;
  businessDeclined: boolean;
}

export function classifyMiraIntent(text: string): MiraIntent {
  const q = text.replace(/\s+/g, ' ').trim();
  const businessDeclined = /(?:не\s+(?:хочу|интересует|нужен|планирую)[^.!?]{0,35}(?:бизнес|ambassador|амбассад|зарабат)|(?:бизнес|ambassador|амбассад|доход)[^.!?]{0,25}(?:не\s+интерес|не\s+нуж|не\s+хочу)|без\s+(?:бизнес|ambassador)|not interested in (?:business|ambassador))/i.test(q);
  const business = !businessDeclined && /(?:ambassador|амбассад|бизнес|заработ|доход|партн[её]рск\S*\s+(?:бизнес|регистрац|направлен))/i.test(q);
  const experience = /(?:life experiences?|мероприяти|событи|клубн\S*\s+встреч)/i.test(q);
  const travel = /(?:путешеств|поезд|семь|групп|йог|ретрит|отел|travel|membership|членств|vip|elite|turbo)/i.test(q);
  const direction: MiraDirection = business ? 'ambassador' : experience ? 'experiences' : travel ? 'travel' : 'unknown';
  const result = (action: MiraAction): MiraIntent => ({
    direction, action, businessDeclined, purchaseIntent: action === 'membership' || action === 'ambassador',
  });

  // Explicit non-purchase purposes and refusals take precedence over generic registration words.
  const documentRequest = /(?:пришли|отправ|дай|дайте|покажи|хочу|нужен|нужна|send|show)[^.!?]{0,80}(?:документ|pdf|таблиц|презентац|faq|compensation|план\s+вознагражд)/i.test(q);
  if (documentRequest) return result('document');
  const guestTopic = /(?:guest\s*pass|гостев\S*\s+(?:доступ|пропуск|ссылк|приглашен|просмотр)|демо|бесплатно\s+посмотр)/i.test(q);
  const guestRequest = /(?:повтори|повторите|хочу|дай(?:те)?|пришли(?:те)?|отправ|покажи|можно|как\s+(?:получить|открыть|посмотреть)|send|show|try)/i.test(q);
  const guestDeclined = /(?:не\s+(?:хочу|нуж\S*|давай|присылай|отправляй|показывай)[^.!?,;]{0,35}(?:guest\s*pass|гостев|демо)|(?:guest\s*pass|гостев\S*\s+\S+)[^.!?,;]{0,15}не\s+(?:нуж|хочу)|do not[^.!?,;]{0,25}(?:guest\s*pass|demo))/i.test(q);
  const directPreview = /(?:покажи(?:те)?|открой(?:те)?)[^.!?,;]{0,15}(?:приложен|платформ)/iu.test(q);
  const productPreview = /(?:хочу|дай(?:те)?|покажи|можно|как)[^.!?,;]{0,25}(?:посмотр\S*|попроб\S*|познаком\S*)[^.!?,;]{0,30}(?:travel\s*advantage|приложен|платформ)/i.test(q);
  if (!guestDeclined && ((guestTopic && guestRequest) || directPreview || (productPreview && !/не\s+хочу/i.test(q)))) return result('guest_pass');
  if (/(?:не\s+(?:готов\S*|хочу|буду|планирую)\s*(?:[^.!?]{0,25}(?:покуп|оплач|плат|регистр|подпис))?|пока\s+не|сначала\s+(?:понять|сравнить|проверить)|хочу\s+(?:понять|разобраться|сравнить)|do not want to (?:buy|pay)|not ready)/i.test(q)) return result('conversation');

  const ready = /(?:хочу|готов[аы]?|давайте|дай(?:те)?|пришли(?:те)?|отправь(?:те)?|как|где|i want|ready|send|how)[^.!?]{0,80}(?:купить|оплатить|оформить|создать\s+аккаунт|подписаться|зарегистр|регистрац|вступить|ссылк|buy|pay|register|join|link)/i.test(q);
  if (!ready) return result('conversation');
  if (/(?:аккаунт|профил|на\s+сайте|учетн|учётн)/i.test(q)) return result('account');
  if (experience) return result('event');
  if (business) return result('ambassador');
  if (/(?:membership|членств|тариф|vip|elite|turbo)/i.test(q)) return result('membership');
  return result('clarify_registration');
}

// Resolve only an explicit response to the most recent assistant offer. Never infer a purchase.
export function contextualMiraQuestion(question: string, history: {role:string;content:string}[]): string {
 const last=history.filter(t=>t.role==='assistant').at(-1)?.content || '';
 const yes=/^(да|давайте|можно|хорошо|согласен|согласна|покажи|покажите|хочу|да хочу)[.! ,]*$/iu.test(question.trim());
 const offer=/гостев.{0,25}(доступ|приглашен)|посмотр.{0,25}приложен/iu.test(last);
 const failed=/не удалось|недоступ|использован|ист[её]к|нет свободных/iu.test(last);
 if(yes&&offer&&!failed&&/дать|предлага|получ|помо|воспольз|отправ|присла/iu.test(last))return 'Хочу получить гостевое приглашение и посмотреть приложение Travel Advantage.';
 return question;
}
