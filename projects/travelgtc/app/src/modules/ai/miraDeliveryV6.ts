// @ts-nocheck
import {classifyMiraIntent} from './miraIntent.js';
// Candidate delivery contract. Pure functions: no credentials, network or CRM.
export function stopped(q){return /пока не продолжим|остановимся на этом|дальше сам|не хочу участвовать|тему бизнеса закроем|не будем продолжать/iu.test(q);}
export function linkConsent(q,history: {role:string;content:string}[]=[]){
 if(stopped(q)||/(?:ссыл[а-яё]*|видео|материал[а-яё]*)\s+(?:пока\s+)?(?:не\s+(?:надо|нуж|хочу)|потом)|не\s+(?:присылай|присылайте|отправляй|отправляйте|давай)\s+(?:ссыл|видео|материал)/iu.test(q))return false;
 if(/(?:дай|дайте|пришли|пришлите|покажи|покажите|отправь|давайте)\s|дайте обучение/iu.test(q)&&/ссыл|видео|флаер|курс|обучени|документ|план|подборк|маршрут|приглашени/iu.test(q))return true;
 if(classifyMiraIntent(q).action==='guest_pass')return true;
 if(/покажи|покажите/iu.test(q)&&/life\s*experiences?|событи|актуальн.{0,15}поезд|текущ.{0,15}поезд/iu.test(q))return true;
 const last=history.at(-1);
 return /^(?:да|можно|хорошо|согласен|согласна)[,.!\s]*$/iu.test(q.trim())&&last?.role==='assistant'&&/(?:прислать|отправить|показать).{0,70}(?:ссыл|видео|материал|план|курс)|(?:ссыл|видео|материал|план|курс).{0,70}(?:прислать|отправить)/iu.test(last.content);
}
export function discussionSubject(history,question){
 let partner=false;
 for(const q of [...history.filter(t=>t.role==='user').map(t=>t.content),question]){
  if(/(?:бизнес|заработок).{0,20}(?:не\s+(?:интерес|нуж|хочу))|не\s+(?:надо|хочу|предлагай|предлагайте).{0,20}бизнес|без бизнеса|без участия в бизнесе|никаких продаж|тему бизнеса закроем/iu.test(q))partner=false;
  else if(/(?:хочу|интересно|интересует).{0,70}(?:Ambassador|зарабатывать|заработать|продавать|привлекать клиентов|бизнес|рекомендаци.{0,20}работ)|Ambassador.{0,35}(?:как\s+бизнес|как\s+работ)/iu.test(q))partner=true;
  if(/другая поездка|просто хочу отдохнуть|пока выберу самостоятельную/iu.test(q))partner=false;
 }
 if(partner)return 'Обсуждается работа Ambassador. Описание семейных поездок или запросов аудитории не означает личную поездку собеседника. Не спрашивать его даты вылета без явного перехода к собственной поездке.';
 if(/не знаю|помоги разобраться|трудно сказать/iu.test(question))return 'Потребность ещё не выбрана. Не предполагай личную поездку. Задай один открытый вопрос о желаемой пользе; если человеку трудно ответить, предложи поездку для себя, общение в совместной поездке и работу с рекомендациями как три добровольных варианта.';
 return null;
}
export function validateDraft(d){
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).sort().join(',')!=='links,question,text')return ['INVALID_SHAPE'];
 const e=[];
 if(typeof d.text!=='string'||!d.text.trim()||d.text.length>4000)e.push('INVALID_TEXT');
 if(d.question!==null&&(typeof d.question!=='string'||d.question.length>350||(d.question.match(/\?/g)||[]).length!==1||!d.question.endsWith('?')))e.push('ONE_QUESTION_REQUIRED');
 if(!Array.isArray(d.links)||d.links.length>3||d.links.some(x=>typeof x!=='string'))e.push('INVALID_LINKS');
 if(/[?？]|https?:|www\.|\bK\d{3}\b|OWNER_APPROVED|MATERIAL_|\b(?:gate|completedTurns|read_training|list_experiences)\b/iu.test(d.text||''))e.push('TEXT_CONTAINS_QUESTION_URL_OR_INTERNAL_MARKER');
 if(/https?:|www\.|\bK\d{3}\b|OWNER_APPROVED|MATERIAL_/iu.test(d.question||''))e.push('QUESTION_CONTAINS_URL_OR_MARKER');
 if(/\]\s*\(|(?:javascript|data|mailto|file):|\b[a-z][a-z0-9+.-]*:\/\//iu.test((d.text||'')+' '+(d.question||'')))e.push('LINKS_MUST_USE_REGISTRY');
 return e;
}
export function validateGrounding(d){
 const t=d.text||'';const errors=[];
 if(/(?:карточк|страниц)\S*.{0,90}(?:доступн|открыт)\S*.{0,35}без|без\s+(?:активного\s+)?(?:гостевого\s+)?приглашения/iu.test(t))errors.push('DO_NOT_ASSERT_UNVERIFIED_GUEST_ACCESS');
 if(/(?:места\s+есть|места\s+доступны|бронирование\s+открыто|точная\s+цена\s+составляет)/iu.test(t))errors.push('NO_PRICE_OR_AVAILABILITY_EVIDENCE');
 if(/(?:у меня нет|не имею)\s+доступа\s+к\s+аккаунт/iu.test(t))errors.push('LIMITED_READING_EXISTS_NO_ACTION_RIGHTS');
 if(/(?:три|3)\s+часа.{0,50}(?:минимальн|достаточн)|(?:минимум|минимальн\S*)\s+(?:три|3)\s+час/iu.test(t))errors.push('NO_MINIMUM_HOURS_OR_SUCCESS_THRESHOLD_CONFIRMED');
 return errors;
}
export function deliver(d,{question,history=[],registry,paidRoute=null,guestRoute=null}: {question:string;history?:{role:string;content:string}[];registry:Record<string,{url:string;label:string}>;paidRoute?:string|null;guestRoute?:string|null}){
 const issues=validateDraft(d);if(issues.length)throw Error(issues.join(','));
 if(stopped(question))return {answer:'Хорошо, остановимся на этом.',links:[],suppressed:d.links};
 const consent=linkConsent(question,history);
 const selected=[];const suppressed=[];
 for(const key of d.links){
  if(!consent||!Object.hasOwn(registry,key)){suppressed.push(key);continue;}
  const r=registry[key];
  if(key.startsWith('OWNER_APPROVED_')&&r.url!==(key==='OWNER_APPROVED_GUEST_ROUTE'?guestRoute:paidRoute)){suppressed.push(key);continue;}
  if(!selected.some(x=>x.url===r.url))selected.push(r);
 }
 // Compensation plan and disclosure are one informational bundle.
 if(selected.some(x=>x.url===registry.MATERIAL_COMPENSATION_PLAN.url)&&!selected.some(x=>x.url===registry.MATERIAL_INCOME_DISCLOSURE.url))selected.push(registry.MATERIAL_INCOME_DISCLOSURE);
 let text=d.text.trim();
 if(discussionSubject(history,question)?.startsWith('Обсуждается работа Ambassador.')&&!discussionSubject(history,'')?.startsWith('Обсуждается работа Ambassador.')&&!/доход.{0,35}не\s+гарант|не\s+гарант.{0,35}доход/iu.test(text))text+='\n\nДоход не гарантирован.';
 if(registry.MATERIAL_LIFE_EXPERIENCES&&selected.some(x=>x.url===registry.MATERIAL_LIFE_EXPERIENCES.url)){
  text=text.replace(/[^.!?\n]*(?:ссылк[^.!?\n]*доступн|доступн[^.!?\n]*(?:событ|предложен))[^.!?\n]*[.!?]?/giu,'').trim();
  text+=(text?'\n\n':'')+'Материал знакомит с форматом поездок; он не подтверждает текущее расписание, цены или наличие мест.';
 }
 if(registry.MATERIAL_VIP_RU&&selected.some(x=>x.url===registry.MATERIAL_VIP_RU.url))text+='\n\nЭто историческая версия флаера; текущие тарифы и условия нужно сверить на официальной странице.';
 const normalizeQuestion=s=>s.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w&&!['а','ещё','еще','пожалуйста','же','ну'].includes(w)).join(' ');
 const repeatedQuestion=d.question&&normalizeQuestion(question).includes(normalizeQuestion(d.question));
 const answer=[text,repeatedQuestion?null:d.question?.trim(),...selected.map(r=>`[${r.label}](${r.url})`)].filter(Boolean).join('\n\n');
 return {answer,links:selected.map(x=>x.url),suppressed};
}
