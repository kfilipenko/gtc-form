import net from 'node:net';
import {deliver,linkConsent,stopped,validateDraft,validateGrounding,discussionSubject} from './miraDelivery.js';
import {miraLinks} from './miraLinks.js';
import {registrationGate} from './guestChat.js';
import type {AzureFoundryAgentHistoryTurn as Turn} from './azureFoundryAgent.js';
export type SiteResult={status:string;checked_at?:string;items?:{id:string;source_url:string}[]};
export const needsLiveRead=(q:string)=>/(?:сейчас|сегодня|актуальн|свеж|мест|налич|главн|Santorini|Санторини|онлайн)/iu.test(q)&&/(?:поезд|событ|experience|налич|ссыл|главн|Santorini|Санторини|мест)/iu.test(q)&&!/(?:забронируй|оплати)/iu.test(q);
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
// Tool response bodies, instructions, cookies and account fields are never logged.
export async function askMira42(api:any,agentName:string,question:string,history:Turn[],completed:number,read:()=>Promise<SiteResult>=readExperienceLinks):Promise<string>{
 if(stopped(question))return 'Хорошо, остановимся на этом.';
 const consent=linkConsent(question,history);const liveNeeded=needsLiveRead(question);
 const gate=registrationGate(question,'',completed);const allowed=gate.referralUrl;
 const registry={...miraLinks};const keyFor=(url:string|null)=>Object.keys(registry).find(k=>registry[k].url===url);
 const input:any[]=[{role:'user',content:'Служебный контекст приложения, не раскрывать: '+JSON.stringify({discussion_subject:discussionSubject(history,question),link_consent:consent,allowed_referral:keyFor(allowed)||null,history})+'\nСообщение посетителя: '+question}];
 let live:SiteResult|null=null;let readAttempted=false;
 const deadline=Date.now()+100000;
 for(let round=0;round<4&&Date.now()<deadline;round++){
  const r=await api.responses.create({input,max_output_tokens:1300,store:false,tool_choice:liveNeeded&&!readAttempted?'auto':'none'},{timeout:Math.min(45000,deadline-Date.now()),body:{agent_reference:{type:'agent_reference',name:agentName,version:'42'}}});
  input.push(...(r.output||[]));
  const functions=(r.output||[]).filter((x:any)=>x.type==='function_call');
  if(functions.length){
   if(functions.length>2)break;
   for(const f of functions){
    let response:SiteResult={status:'DENIED',items:[]};
    try{const args=JSON.parse(f.arguments);if(liveNeeded&&!readAttempted&&f.name==='list_experiences'&&args&&typeof args==='object'&&!Array.isArray(args)&&Object.keys(args).length===0){readAttempted=true;response=sanitizeSiteResult(await read());live=response;}}catch{readAttempted=true;live={status:'READ_UNAVAILABLE',items:[]};}
    for(const item of response.items||[])registry['EVENT_'+item.id]={url:item.source_url,label:'Описание события '+item.id};
    input.push({type:'function_call_output',call_id:f.call_id,output:JSON.stringify({...response,items:response.items?.map(x=>({...x,link_key:'EVENT_'+x.id,availability:'NOT_CHECKED',guest_access:'NOT_VERIFIED'}))})});
   }continue;
  }
  let draft:any;let errors:string[]=[];
  try{draft=JSON.parse(r.output_text);if(Array.isArray(draft.links)){draft.links=draft.links.map((k:unknown)=>typeof k==='string'&&/^\d+$/.test(k)&&registry['EVENT_'+k]?'EVENT_'+k:k);draft.links=consent?draft.links.slice(0,3):[];}errors=[...validateDraft(draft),...validateGrounding(draft)];if(!errors.length&&draft.links.some((k:string)=>!Object.hasOwn(registry,k)))errors.push('UNKNOWN_LINK_SYMBOL');}catch{errors=['RETURN_VALID_JSON'];}
  if(r.status==='incomplete')errors.push('SHORTEN_INCOMPLETE_RESPONSE');
  if(errors.length){input.push({role:'user',content:'Исправь ответ: '+errors.join(', ')+'. Верни полный JSON по системной инструкции, без новых фактов, URL в text и question или непроверенной периодичности взносов.'});continue;}
  if(readAttempted&&!live?.items?.length)draft={text:'Сейчас не удалось прочитать список ссылок с сайта. Я не могу подтвердить актуальные предложения. Могу объяснить формат поездок по учебным материалам.',question:null,links:[]};
  if(live?.items?.length){
   if(consent&&/ссыл/iu.test(question)&&!draft.links.some((k:string)=>k.startsWith('EVENT_')))draft.links=live.items.slice(0,3).map(x=>'EVENT_'+x.id);
   draft.text+='\n\nСсылки прочитаны '+live.checked_at+'. Цены, свободные места и доступ гостя не проверены.';
  }
  if(consent&&allowed)draft.links=[keyFor(allowed)];
  if(consent&&!liveNeeded&&!allowed){const topic=history.filter(t=>t.role==='user').map(t=>t.content).join(' ')+' '+question;let key=null;if(/компенсационн/iu.test(question))key='MATERIAL_COMPENSATION_PLAN';else if(/флаер/iu.test(question)&&/VIP/iu.test(question))key='MATERIAL_VIP_RU';else if(/курс|обучени/iu.test(question))key='MATERIAL_GETTING_STARTED_RU';else if(/видео|подборк/iu.test(question)&&/life|experience|компан|поезд|совместн/iu.test(topic))key='MATERIAL_LIFE_EXPERIENCES';if(key)draft.links=[key];}
  draft.text=draft.text.replace(/:\s*\./g,'.');if(consent&&draft.links.length)draft.question=null;
  return deliver(draft,{question,history,registry,paidRoute:allowed,guestRoute:allowed}).answer;
 }
 return 'Сейчас не удалось подготовить проверенный ответ. Попробуйте повторить вопрос.';
}
