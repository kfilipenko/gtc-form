import {describe,it,expect} from 'vitest';
import {askMira42,sanitizeSiteResult} from '../src/modules/ai/miraRuntime.js';
import {registrationGate} from '../src/modules/ai/guestChat.js';
const answer=(text='Можно сравнить условия поездки.',links:string[]=[])=>({output:[],status:'completed',output_text:JSON.stringify({text,question:null,links})});
function apiSequence(responses:any[]){let calls=0;return {api:{responses:{create:async()=>responses[calls++]}},count:()=>calls};}
const q='Покажи ссылки Life Experiences сейчас на главной';
const tool={output:[{type:'function_call',name:'list_experiences',arguments:'{}',call_id:'test'}]};
describe('Mira v42 application boundary',()=>{
 it('delivers only broker-confirmed links and source limits',async()=>{const {api}=apiSequence([tool,answer('Вот описания.', ['EVENT_374'])]);const text=await askMira42(api,'AI-TravelGTC',q,[],0,async()=>({status:'HOME_LINKS_ONLY_NOT_AVAILABILITY',checked_at:new Date().toISOString(),items:[{id:'374',source_url:'https://www.traveladvantage.com/experience/view/374'}]}));expect(text).toContain('/experience/view/374');expect(text).toContain('не проверены');expect(text).not.toContain('EVENT_');});
 it('does not invoke browser for offline material even if model asks',async()=>{let reads=0;const {api}=apiSequence([tool,answer()]);await askMira42(api,'AI-TravelGTC','Как сравнить поездку?',[],0,async()=>{reads++;return {status:'bad'};});expect(reads).toBe(0);});
 it('fails closed on source failure',async()=>{const {api}=apiSequence([tool,answer()]);expect(await askMira42(api,'AI-TravelGTC',q,[],0,async()=>{throw Error('private failure');})).toContain('не удалось прочитать');});
 it('rejects injected URLs and stale evidence',()=>{expect(sanitizeSiteResult({status:'HOME_LINKS_ONLY_NOT_AVAILABILITY',checked_at:new Date().toISOString(),items:[{id:'374',source_url:'https://evil.test/374'}]}).items).toEqual([]);expect(sanitizeSiteResult({status:'HOME_LINKS_ONLY_NOT_AVAILABILITY',checked_at:'2000-01-01',items:[]}).status).toBe('READ_UNAVAILABLE');});
 it('retries malformed output then returns safe text',async()=>{const {api,count}=apiSequence([{output:[],output_text:'secret invalid'},answer()]);const text=await askMira42(api,'AI-TravelGTC','Объясни пользу',[],0);expect(count()).toBe(2);expect(text).not.toContain('secret');});
 it('stops without a model or browser call',async()=>{expect(await askMira42(null,'AI-TravelGTC','Не будем продолжать',[],0)).toBe('Хорошо, остановимся на этом.');});
 it('preserves the existing guest route and emits it once after outer gate',async()=>{const {api}=apiSequence([answer('Можно познакомиться с платформой.',['OWNER_APPROVED_GUEST_ROUTE'])]);const text=await askMira42(api,'AI-TravelGTC','Дай гостевую ссылку',[],0);const final=registrationGate('Дай гостевую ссылку',text,0).answer;expect(final.match(/https:\/\/free.traveladvantage.com/g)).toHaveLength(1);});
 it('does not reveal links without consent',async()=>{const {api}=apiSequence([answer('Объясню формат.',['MATERIAL_LIFE_EXPERIENCES'])]);expect(await askMira42(api,'AI-TravelGTC','Хочу компанию, ссылки не нужны',[],0)).not.toContain('https://');});
 it('keeps more than six exchanges in structured context',async()=>{const history=Array.from({length:16},(_,i)=>({role:i%2?'assistant' as const:'user' as const,content:'turn'+i}));let captured:any;const api={responses:{create:async(p:any)=>{captured=p;return answer();}}};await askMira42(api,'AI-TravelGTC','Напомни начало',history,8);expect(captured.input[0].content).toContain('turn0');expect(captured.input[0].content).toContain('turn15');});
});
