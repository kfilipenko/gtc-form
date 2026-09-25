import {knowledgeGroundingErrors,needsKnowledge,readKnowledge,sanitizeKnowledge,knowledgeQueryAllowed,type KnowledgeResult} from './miraKnowledge.js';
import net from 'node:net';
import {deliver,linkConsent,stopped,validateDraft,validateGrounding,discussionSubject} from './miraDeliveryV6.js';
import {miraLinks} from './miraLinksV6.js';
import {registrationGate} from './guestChat.js';
import type {AzureFoundryAgentHistoryTurn as Turn} from './azureFoundryAgent.js';
export type SiteResult={status:string;checked_at?:string;items?:{id:string;source_url:string}[]};
export const needsLiveRead=(q:string)=>/(?:сейчас|сегодня|актуальн|текущ|свеж|(?:^|[^а-яё])мест(?:а|о)?(?![а-яё])|налич|главн|Santorini|Санторини|онлайн)/iu.test(q)&&/(?:поезд|событ|experience|налич|ссыл|главн|Santorini|Санторини|мест)/iu.test(q)&&!/(?:забронируй|оплати)(?![а-яё])/iu.test(q);
export function readExperienceLinks(socket='/run/mira-reader/read.sock'):Promise<SiteResult>{
 return new Promise(resolve=>{
  const c=net.createConnection(socket);let data='';let done=false;
  const finish=(value:SiteResult)=>{if(done)return;done=true;c.destroy();resolve(value);};
  c.setTimeout(6000,()=>finish({status:'READ_UNAVAILABLE'}));
  c.on('error',()=>finish({status:'READ_UNAVAILABLE'}));
  c.on('connect',()=>c.write('{"op":"list-experiences"}\n'));
  c.on('data',b=>{data+=b.toString();if(data.length>12000)return finish({status:'READ_UNAVAILABLE'});if(data.includes('\n')){try{finish(sanitizeSiteResult(JSON.parse(data.split('\n')[0])));}catch{finish({status:'READ_UNAVAILABLE'});}}});
  c.on('end',()=>finish({status:'READ_UNAVAILABLE'}));
 });
}
export function sanitizeSiteResult(value:unknown):SiteResult{
 const v=value as SiteResult;
 if(!v||v.status!=='HOME_LINKS_ONLY_NOT_AVAILABILITY'||!Array.isArray(v.items)||typeof v.checked_at!=='string'||!Number.isFinite(Date.parse(v.checked_at))||Math.abs(Date.now()-Date.parse(v.checked_at))>60000)return {status:'READ_UNAVAILABLE',items:[]};
 return {status:v.status,checked_at:v.checked_at,items:v.items.filter(x=>typeof x?.id==='string'&&/^\d+$/.test(x.id)&&x.source_url==='https://www.traveladvantage.com/experience/view/'+x.id).slice(0,20).map(x=>({id:x.id,source_url:x.source_url}))};
}
export type DetailResult={status:string;id?:string;source_url?:string;checked_at?:string;fields?:Record<string,string>;truncated?:string[]};
export function sanitizeDetail(v:any,id:string):DetailResult{
 if(!/^[1-9]\d{0,8}$/.test(id)||v?.status!=='EVENT_DESCRIPTION_ONLY'||v.id!==id||v.source_url!=='https://www.traveladvantage.com/experience/view/'+id||typeof v.checked_at!=='string'||!Number.isFinite(Date.parse(v.checked_at))||Math.abs(Date.now()-Date.parse(v.checked_at))>60000)return {status:'DETAIL_UNAVAILABLE'};
 const fields:Record<string,string>={};const limits:Record<string,number>={title:180,schedule:500,displayed_price:180,description:6000,itinerary:6000,booking_terms:10000};
 for(const [key,max] of Object.entries(limits))fields[key]=typeof v.fields?.[key]==='string'?v.fields[key].slice(0,max):'';
 if(!fields.title||!fields.description)return {status:'DETAIL_UNAVAILABLE'};
 return {status:v.status,id,source_url:v.source_url,checked_at:v.checked_at,fields,truncated:Array.isArray(v.truncated)?v.truncated.filter((k:any)=>Object.hasOwn(limits,k)):[]};
}
export function readExperienceDetail(id:string,socket='/run/mira-reader/read.sock'):Promise<DetailResult>{
 if(!/^[1-9]\d{0,8}$/.test(id))return Promise.resolve({status:'DENIED'});
 return new Promise(resolve=>{const c=net.createConnection(socket);let data='';let done=false;
 const finish=(v:DetailResult)=>{if(done)return;done=true;c.destroy();resolve(v);};
 c.setTimeout(22000,()=>finish({status:'DETAIL_UNAVAILABLE'}));c.on('error',()=>finish({status:'DETAIL_UNAVAILABLE'}));
 c.on('connect',()=>c.write(JSON.stringify({op:'experience-detail',id})+'\n'));
 c.on('data',b=>{data+=b.toString();if(data.length>35000)return finish({status:'DETAIL_UNAVAILABLE'});if(data.includes('\n')){try{finish(sanitizeDetail(JSON.parse(data.split('\n')[0]),id));}catch{finish({status:'DETAIL_UNAVAILABLE'});}}});
 c.on('end',()=>finish({status:'DETAIL_UNAVAILABLE'}));});
}
export function eventStartDate(schedule:string):string|null{
 const m=schedule.match(/(?:^|\s)(\d{1,2})\s*[-–]\s*\d{1,2}\s+([a-zа-яё.]+),?\s*(20\d{2})/iu);if(!m)return null;
 const months=['янв|jan','фев|feb','мар|mar','апр|apr','ма[йя]|may','июн|jun','июл|jul','авг|aug','сен|sep','окт|oct','ноя|nov','дек|dec'];const month=months.findIndex(x=>new RegExp('^(?:'+x+')','iu').test(m[2]))+1;
 if(!month||+m[1]>31||+m[1]<1)return null;return m[3]+'-'+String(month).padStart(2,'0')+'-'+m[1].padStart(2,'0');
}
export const needsEventDetail=(q:string)=>/experience|экспириенс|событи|поездк|San Diego|Дуна|событи[ея]\s*\d+/iu.test(q)&&/подроб|программ|включ|услов|описан|стоим|цен|балл|LP|дат|расскаж/iu.test(q)&&!/(?:забронируй|оплати)(?![а-яё])/iu.test(q);
// Tool response bodies, instructions, cookies and account fields are never logged.
export async function askMiraV6(api:any,agentName:string,question:string,history:Turn[],completed:number,read:()=>Promise<SiteResult>=readExperienceLinks, agentVersion='2',readDetail:(id:string)=>Promise<DetailResult>=readExperienceDetail,readKb:(query:string)=>Promise<KnowledgeResult>=readKnowledge):Promise<string>{
 if(stopped(question))return 'Хорошо, остановимся на этом.';
 const customPeriod=question.match(/(\d+)\s*месяц/iu);
 if(customPeriod && ![12].includes(Number(customPeriod[1])) && /выгод|сравн|посчит|расч[её]т/iu.test(question) && !(/Ambassador/iu.test(question)&&/Turbo/iu.test(question)&&Number(customPeriod[1])===3))return 'Для такого срока у меня пока нет готового проверенного расчёта. Годовой пример нельзя переносить на него напрямую: отличаются срок участия, начисления и доступное списание баллов.\n\nДля точного сравнения нужно отдельно проверить расходы выбранного тарифа и лимиты списания к датам бронирований. Я не буду выдавать приблизительную сумму за подтверждённую выгоду.';
 if(/подтверд.{0,45}регистрац|регистрац.{0,45}подтверд/iu.test(question))return 'Сейчас у меня нет инструмента проверки вашей регистрации на стороне провайдера. Гостевой доступ, платное Membership и Ambassador имеют разные статусы; переход по ссылке сам по себе не подтверждает оформление.\n\nПроверьте подтверждение в своём официальном кабинете или письме сервиса. Пароль и код подтверждения присылать не нужно.';

 const consent=linkConsent(question,history);const requestedId=question.match(/(?:life\s*experiences?|событи[ея]|идентификатор|\bid)\s*(?:с\s*)?(?:№|:)?\s*(\d{1,9})(?!\d)/iu)?.[1];const kbNeeded=needsKnowledge(question);const detailNeeded=needsEventDetail(question)&&(!kbNeeded||Boolean(requestedId));const liveNeeded=(needsLiveRead(question)||detailNeeded)&&(!kbNeeded||Boolean(requestedId));
 const gate=registrationGate(question,'',completed);const allowed=gate.referralUrl;
 const registry={...miraLinks};const keyFor=(url:string|null)=>Object.keys(registry).find(k=>registry[k].url===url);
 const input:any[]=[{role:'user',content:'Служебный контекст приложения, не раскрывать. Для определения сегодняшнего дня current_date ниже имеет приоритет над датами снимков и учебных обновлений: '+JSON.stringify({current_date:new Date().toISOString().slice(0,10),discussion_subject:discussionSubject(history,question),link_consent:consent,allowed_referral:keyFor(allowed)||null,history})+'\nСообщение посетителя: '+question}];
 if(kbNeeded)input.push({role:'user',content:'Точность объяснения Loyalty Unlocked: сброс при30днях подряд и более, либо БОЛЕЕ90дней суммарно; ровно90само по себе не сбрасывает. Перенос сформулирован для неиспользованных баллов между13–23месяцами; не заменяй это любым остатком первого года. Не добавляй непрошенные штрафы к ответу об отмене. question=null, если вопрос посетителя уже полностью отвечен; не повторяй его вопрос ему обратно.'});
 let live:SiteResult|null=null;let readAttempted=false;let detailAttempts=0;const details:DetailResult[]=[];let kbAttempts=0;let knowledge:KnowledgeResult|null=null;
 const deadline=Date.now()+100000;
 for(let round=0;round<6&&Date.now()<deadline;round++){
  const r=await api.responses.create({input,max_output_tokens:1300,store:false,tool_choice:kbNeeded&&!kbAttempts?{type:'function',name:'search_knowledge'}:liveNeeded&&!readAttempted?{type:'function',name:'list_experiences'}:detailNeeded&&detailAttempts<2&&Boolean(live?.items?.length)?'auto':'none'},{timeout:Math.min(45000,deadline-Date.now()),body:{agent_reference:{type:'agent_reference',name:agentName,version:agentVersion}}});
  input.push(...(r.output||[]));
  const functions=(r.output||[]).filter((x:any)=>x.type==='function_call');
  if(functions.length){
   if(functions.length>2)break;
   for(const f of functions){
    let response:SiteResult & Omit<DetailResult,'truncated'> & Omit<KnowledgeResult,'truncated'> & {truncated?:boolean|string[]}={status:'DENIED',items:[]};
    try{const args=JSON.parse(f.arguments);if(kbNeeded&&kbAttempts<1&&f.name==='search_knowledge'&&args&&Object.keys(args).join(',')==='query'&&knowledgeQueryAllowed(args.query)){kbAttempts++;response=sanitizeKnowledge(await readKb(args.query));knowledge=response as KnowledgeResult;if(response.status==='KNOWLEDGE_ARTICLE_READ')registry['KB_'+response.id]={url:response.source_url!,label:response.title!};}else if(liveNeeded&&!readAttempted&&f.name==='list_experiences'&&args&&typeof args==='object'&&!Array.isArray(args)&&Object.keys(args).length===0){readAttempted=true;response=sanitizeSiteResult(await read());live=response;if(detailNeeded&&requestedId&&response.items?.length&&!response.items.some(x=>x.id===requestedId))return 'Событие '+requestedId+' не найдено среди ссылок, прочитанных на главной Travel Advantage. Его программу, цену и условия сейчас проверить не удалось.';}else if(detailNeeded&&detailAttempts<2&&f.name==='experience_detail'&&args&&Object.keys(args).join(',')==='id'&&(!requestedId||args.id===requestedId)&&live?.items?.some(x=>x.id===args.id)){detailAttempts++;response=sanitizeDetail(await readDetail(args.id),args.id);details.push(response as DetailResult);}}catch{readAttempted=true;live={status:'READ_UNAVAILABLE',items:[]};}
    for(const item of response.items||[])registry['EVENT_'+item.id]={url:item.source_url,label:'Описание события '+item.id};
    input.push({type:'function_call_output',call_id:f.call_id,output:JSON.stringify({...response,items:response.items?.map(x=>({...x,link_key:'EVENT_'+x.id,availability:'NOT_CHECKED',guest_access:'NOT_VERIFIED'}))})});
   }continue;
  }
  if(knowledge?.status==='KNOWLEDGE_ARTICLE_READ'&&knowledge.id==='1260212000031695005'&&/приостанов|suspend/iu.test(question)&&/30|90|сч[её]тчик|сброс/iu.test(question)){
   const text='По разделу Official Terms & Conditions статьи Loyalty Unlocked счётчик сбрасывается при приостановке на 30 дней подряд или больше, либо при более чем 90 днях суммарно за цикл.\n\nРовно 30 дней подряд уже сбрасывают счётчик. Ровно 90 дней суммарно сами по себе его не сбрасывают, если не было периода в 30 дней подряд. После сброса 12-месячный срок начинается заново.\n\nКраткий список в статье сформулирован иначе; здесь приведено правило из её официального раздела условий. Ваш личный статус в кабинете этим чтением не проверяется.';
   return deliver({text,question:null,links:consent?['KB_'+knowledge.id]:[]},{question,history,registry,paidRoute:null,guestRoute:null}).answer;
  }
  if(knowledge?.status==='KNOWLEDGE_ARTICLE_READ'&&knowledge.id==='1260212000031695005'&&/24|двадцать\s+четыр/iu.test(question)){
   return deliver({text:'По статье Loyalty Unlocked можно отложить использование льготы и после 24 активных месяцев применить накопленные баллы к одной Life Experience со значком Loyalty Unlocked. Это альтернатива использованию льготы после 12 месяцев.\n\nСтатья отдельно указывает: баллы, оставшиеся неиспользованными между 13-м и 23-м месяцами, переносятся в следующий цикл. Это не обещание списать любой остаток без ограничений: допустимые LP и статус цикла нужно проверить в вашем кабинете. Аккаунт владельца не позволяет проверить ваш личный допуск.\n\nЛьгота относится к одной поездке на комнату до двух путешественников за цикл; членство должно оставаться активным до поездки.',question:null,links:consent?['KB_'+knowledge.id]:[]},{question,history,registry,paidRoute:null,guestRoute:null}).answer;
  }
  let draft:any;let errors:string[]=[];
  try{draft=JSON.parse(r.output_text);if(Array.isArray(draft.links)){draft.links=draft.links.map((k:unknown)=>typeof k==='string'&&/^\d+$/.test(k)&&registry['EVENT_'+k]?'EVENT_'+k:k);draft.links=consent?draft.links.slice(0,3):[];}errors=[...validateDraft(draft),...validateGrounding(draft),...knowledgeGroundingErrors(draft.text||'')];if(!errors.length&&draft.links.some((k:string)=>!Object.hasOwn(registry,k)))errors.push('UNKNOWN_LINK_SYMBOL');}catch{errors=['RETURN_VALID_JSON'];}
  if(details.length&&/балл[а-яё]*.{0,45}пропорциональн.{0,25}стоим/iu.test(draft?.text||''))errors.push('NO_LP_REDEMPTION_RATE_CONFIRMED: пропорциональное списание относится к незавершенному совместному бронированию, не к общему правилу оплаты');
  if(r.status==='incomplete')errors.push('SHORTEN_INCOMPLETE_RESPONSE');
  if(errors.length){input.push({role:'user',content:'Исправь ответ: '+errors.join(', ')+'. Верни полный JSON по системной инструкции, без новых фактов, URL в text и question или непроверенной периодичности взносов.'});continue;}
  if(detailNeeded&&readAttempted&&live?.items?.length&&!detailAttempts){input.push({role:'user',content:'Для ответа о программе/цене/условиях обязательно вызови experience_detail для соответствующего id из прочитанного списка. Если нужного события там нет, прямо сообщи об этом, не придумывай детали.'});if(round<4)continue;}
  if(readAttempted&&!live?.items?.length)draft={text:'Сейчас не удалось прочитать список ссылок с сайта. Я не могу подтвердить актуальные предложения. Могу объяснить формат поездок по учебным материалам.',question:null,links:[]};
  if(detailNeeded&&readAttempted&&live?.items?.length&&!details.some(x=>x.status==='EVENT_DESCRIPTION_ONLY'))draft={text:'Подробности нужного события сейчас не удалось проверить. Список на главной сам по себе не подтверждает программу, цену или условия использования баллов.',question:null,links:[]};

  if(live?.items?.length){
   if(consent&&detailNeeded){const verified=details.filter(x=>x.status==='EVENT_DESCRIPTION_ONLY');draft.links=verified.map(x=>'EVENT_'+x.id);}
   else if(consent&&/ссыл|покаж/iu.test(question)&&!draft.links.some((k:string)=>k.startsWith('EVENT_')))draft.links=live.items.slice(0,3).map(x=>'EVENT_'+x.id);
   if(details.some(x=>{const start=eventStartDate(x.fields?.schedule||'');return start&&start<=new Date().toISOString().slice(0,10);})){draft.text=draft.text.replace(/пройд[её]т|состоится/giu,'проходит');draft.text+='\n\nПо датам на странице событие уже началось. Это описание не является предложением записаться на предстоящую поездку.';}
   if(details.some(x=>x.status==='EVENT_DESCRIPTION_ONLY'))draft.text+='\n\nДаты на странице: '+details.filter(x=>x.status==='EVENT_DESCRIPTION_ONLY').map(x=>x.fields?.schedule).join('; ')+'.';
   draft.text+=details.some(x=>x.status==='EVENT_DESCRIPTION_ONLY')?'\n\nОписание прочитано '+details.find(x=>x.status==='EVENT_DESCRIPTION_ONLY')!.checked_at+'. Указанная на странице цена не подтверждает наличие мест; условия для вашего аккаунта проверяются при самостоятельном оформлении.':'\n\nСсылки прочитаны '+live.checked_at+'. Цены, свободные места и доступ гостя не проверены.';
  }
  if(consent&&allowed)draft.links=[keyFor(allowed)];
  if(consent&&!liveNeeded&&!allowed){const topic=history.filter(t=>t.role==='user').map(t=>t.content).join(' ')+' '+question;let key=null;if(/компенсационн/iu.test(question))key='MATERIAL_COMPENSATION_PLAN';else if(/флаер/iu.test(question)&&/VIP/iu.test(question))key='MATERIAL_VIP_RU';else if(/курс|обучени/iu.test(question))key='MATERIAL_GETTING_STARTED_RU';else if(/видео|подборк/iu.test(question)&&/life|experience|компан|поезд|совместн/iu.test(topic))key='MATERIAL_LIFE_EXPERIENCES';if(key)draft.links=[key];}
  if(knowledge?.status==='KNOWLEDGE_ARTICLE_READ'){draft.text+='\n\nПроверено по статье «'+knowledge.title!.replace(/[?？]/g,'')+'» базы знаний Travel Advantage.';if(consent&&!allowed)draft.links=['KB_'+knowledge.id];}else if(kbAttempts)draft.text+='\n\nОнлайн-поиск сейчас не удался; это объяснение по сохранённым учебным материалам, текущая редакция статьи не проверена.';
  // Publish the approved lookup explanation, not a model-reconstructed payment breakdown.
  if(/1548[.,]70|1[ ,]548[.,]70/.test(draft.text)) draft.text='По изученным условиям, если начать с Ambassador, а новое Elite с Turbo подключить через три месяца, расходы в первом 12-месячном окне составят 1548.70 доллара.\n\n- Ambassador за год: 99 долларов.\n- Активация Elite: 120 долларов.\n- Разовое подключение Turbo: 249.97 доллара.\n- Девять месячных платежей по 119.97 доллара.\n\nЗа девять месяцев туристического участия начисляется 2410 LP. При одновременном старте расходы —1908.61 доллара и3130 LP за12 месяцев. Разница —359.91 доллара и720 LP: это три месяца меньшего участия, а не скидка на тот же срок. Будущий доход в расходы не вычтен.';
  draft.text=draft.text.replace(/:\s*\./g,'.');if(consent&&draft.links.length)draft.question=null;
  return deliver(draft,{question,history,registry,paidRoute:allowed,guestRoute:allowed}).answer;
 }
 return 'Сейчас не удалось подготовить проверенный ответ. Попробуйте повторить вопрос.';
}
