import {classifyMiraIntent} from '../miraIntent.js';
import {recipientKey,type InvitationStore} from './store.js';
export interface ChatInvitationResult{answer:string;referralUrl:string|null;purchaseIntent:false;intent:ReturnType<typeof classifyMiraIntent>}
export interface ChatInvitationService{handle(question:string,serverContactId:string):Promise<ChatInvitationResult|null>}
export const isGuestStatusQuestion=(q:string)=>/код|приглашени|гостев/iu.test(q)&&/проверь|проверить|активирован|использован|статус/iu.test(q);
export const redactInvitationText=(text:string)=>text.replace(/(Код приглашения:\s*)[A-Za-z0-9_-]+/giu,'$1[скрыт]');
export class BoundInvitationChat implements ChatInvitationService{
 constructor(private store:Pick<InvitationStore,'allocate'|'checkGuest'>){}
 async handle(question:string,serverContactId:string):Promise<ChatInvitationResult|null>{
  const intent=classifyMiraIntent(question);const replace=/замен|друг[а-яё]*\s+код|нов[а-яё]*\s+код/iu.test(question)&&/код|приглашени/iu.test(question);const check=!replace&&isGuestStatusQuestion(question);
  if(intent.action!=='guest_pass'&&!check&&!replace)return null;
  if(!/^[0-9a-f-]{36}$/i.test(serverContactId))throw Error('SERVER_CONTACT_REQUIRED');
  const recipient=recipientKey('contact',serverContactId);
  const result=(answer:string,referralUrl:string|null=null):ChatInvitationResult=>({answer,referralUrl,purchaseIntent:false,intent});
  if(check){const r=await this.store.checkGuest(recipient);const messages={
   reservation_reassigned:'Резерв прежнего приглашения завершён после 10 дней без активации, код мог быть выдан повторно. Могу подобрать другое доступное приглашение.',
   not_assigned:'За этим диалогом пока не закреплено персональное гостевое приглашение.',
   unavailable:'Сейчас не удалось проверить статус вашего гостевого приглашения.',
   guest_code_available:'Закреплённый за вами код пока отмечен у провайдера как Available. Завершение гостевой регистрации этим не подтверждается.',
   guest_code_redeemed:'Закреплённый за вами код отмечен как Redeemed — использованный. Код мог ранее выдаваться другому человеку; этот статус не подтверждает именно вашу регистрацию. Сам по себе он не подтверждает оформление платного Membership, Ambassador или оплату.',
   guest_code_expired:'Закреплённое за вами приглашение отмечено как истёкшее. Оно не выдано другому человеку.'};
   return result(messages[r.status]+(r.checkedAt?'\n\nПроверено: '+r.checkedAt:''));}
  const r=await (replace?this.store.allocate(recipient,true):this.store.allocate(recipient));
  if(r.status==='disabled')return null;
  if(r.status!=='assigned')return result(r.status==='already_redeemed'?'Ранее закреплённое за вами приглашение отмечено как использованное. Новое автоматически не выдаю.':'Сейчас не удалось выдать подтверждённое свободное персональное приглашение. Попробуйте повторить запрос позже.');
  return result((r.reused?'Возвращаю ранее закреплённое за вами приглашение.':'За вами закреплено персональное гостевое приглашение.')+'\n\n[Открыть страницу гостевого доступа]('+r.invitation.landingUrl+')\n\nКод приглашения: '+r.invitation.code+'\n\nВведите код на официальной странице, затем самостоятельно заполните форму гостевой регистрации. Мы резервируем приглашение на 10 дней. Если оно не будет активировано, можем выдать его повторно; это наш срок резервирования, а не срок действия кода у провайдера. Если код окажется использован, сообщите мне для подбора замены. Это гостевой доступ, а не оформление Ambassador или платного Membership.',r.invitation.landingUrl);
 }
}
