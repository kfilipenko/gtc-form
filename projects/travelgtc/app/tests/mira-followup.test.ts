import {deliver} from '../src/modules/ai/miraDeliveryV6.js';
import {describe,test,expect,vi} from 'vitest';
import Fastify from 'fastify';
import {registerMiraPublic} from '../src/server/miraPublic.js';
import {GuestChatService} from '../src/modules/ai/guestChat.js';
import {classifyMiraIntent,contextualMiraQuestion} from '../src/modules/ai/miraIntent.js';
import {travelHandoff} from '../src/modules/ai/miraTravelHandoff.js';
import {BoundInvitationChat} from '../src/modules/ai/guestInvitations/chat.js';
const history=(questions:string[])=>questions.flatMap(content=>[{role:'user',content},{role:'assistant',content:'Уточните предпочтения.'}]);
describe('Mira agreed chat fixes',()=>{
 test('Maldives short replies count toward the handoff',()=>{
 const h=history(['Как выгодно путешествовать','Например Мальдивы','Бунгало на воде','С 10 по 20 октября']);
 expect(travelHandoff('На 2 человека',h)).toContain('Дать гостевое приглашение?');
 expect(travelHandoff('Как войти в приложение?',h)).toBeNull();
 expect(travelHandoff('Не хочу гостевой доступ',h)).toBeNull();
 });
 test('does not repeat an already asked question',()=>{
 const r=deliver({text:'Ваши даты уже известны.',question:'Какие даты поездки?',links:[]},{question:'10 октября',history:[{role:'assistant',content:'Какие даты поездки?'}],registry:{}});
 expect(r.answer).toBe('Ваши даты уже известны.');
 });
 test('offer occurs only after four completed travel exchanges',()=>{
 expect(travelHandoff('На двоих',history(['Поездка в Турцию','10 октября','Бунгало']))).toBeNull();
 });
 test.each(['Да','Давайте','Можно','Покажи','Хочу'])('contextual guest acceptance: %s',q=>{
 expect(classifyMiraIntent(contextualMiraQuestion(q,[{role:'assistant',content:'Дать гостевое приглашение?'}])).action).toBe('guest_pass');
 });
 test.each(['Хочу посмотреть приложение','Покажи платформу Travel Advantage'])('preview intent: %s',q=>{
 expect(classifyMiraIntent(q).action).toBe('guest_pass');
 });
 test('never turns refusal or unrelated yes into issuance',()=>{
 expect(contextualMiraQuestion('Нет',[{role:'assistant',content:'Дать гостевое приглашение?'}])).toBe('Нет');
 expect(contextualMiraQuestion('Да',[{role:'assistant',content:'Какие даты поездки?'}])).toBe('Да');
 expect(contextualMiraQuestion('Да',[{role:'assistant',content:'Не удалось проверить гостевое приглашение.'}])).toBe('Да');
 });
 test.each(['empty','unavailable','expired','disabled'])('invitation failure %s is explicit, no model fallback',async status=>{
 const store={allocate:vi.fn().mockResolvedValue({status}),checkGuest:vi.fn()};
 const r=await new BoundInvitationChat(store as any).handle('Хочу гостевой доступ','00000000-0000-4000-8000-000000000001');
 expect(r).not.toBeNull();expect(r?.referralUrl).toBeNull();expect(r?.answer).not.toMatch(/Какие.*предпочтения/);expect(store.allocate).toHaveBeenCalledTimes(1);
 });
 test('session starts without consent field while preserving origin and rate checks',async()=>{
 const app=Fastify();const start=vi.fn().mockResolvedValue('synthetic');const origin=vi.fn();const check=vi.fn();
 registerMiraPublic(app,{pool:null,guestChat:{start},session:async()=>null,origin,ipLimit:{check},globalLimit:{check},secure:true});
 const res=await app.inject({method:'POST',url:'/api/travelgtc/v1/ai/chat/session',payload:{}});
 expect(res.statusCode).toBe(200);expect(start).toHaveBeenCalledOnce();expect(origin).toHaveBeenCalledOnce();expect(check).toHaveBeenCalledTimes(2);
 const cross=await app.inject({method:'POST',url:'/api/travelgtc/v1/ai/chat/session',headers:{'sec-fetch-site':'cross-site'},payload:{}});
 expect(cross.statusCode).not.toBe(200);expect(start).toHaveBeenCalledOnce();await app.close();
 });
 test('guest record never fabricates personal-data or communication consent',async()=>{
 const sql:string[]=[];const client={query:async(q:string)=>{sql.push(q);return {rows:[{id:'00000000-0000-4000-8000-000000000001'}]}},release(){}};
 await new GuestChatService({connect:async()=>client} as any).start();
 const insert=sql.find(x=>x.includes('insert into travelgtc_contacts'))!;
 expect(insert).toContain("'anonymous',false,false,'mira-guest-notice-v2'");
 });
});
