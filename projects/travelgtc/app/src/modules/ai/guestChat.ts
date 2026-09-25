import {redactInvitationText,type ChatInvitationService} from './guestInvitations/chat.js';
import { createHash, randomBytes } from 'node:crypto';
import type pg from 'pg';
import type { SessionLookupResult } from '../auth/types.js';
import type { AzureFoundryAgentHistoryTurn } from './azureFoundryAgent.js';
import { classifyMiraIntent, contextualMiraQuestion } from './miraIntent.js';
import { OFFICIAL_MWR_REGISTRATION_URL, TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL, TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL } from './membershipKnowledge.js';

export const GUEST_COOKIE = 'gtc_mira_guest';
export const GUEST_TTL_SECONDS = 30 * 86400;
export const MIN_WARM_TURNS = 3;
export class GuestChatError extends Error {
  constructor(public readonly statusCode: number, message: string) { super(message); }
}
const tokenHash = (token?: string) => token && /^[a-f0-9]{64}$/.test(token) ? createHash('sha256').update(token).digest('hex') : null;

export function buildReferralGateContext(completedTurns: number): string {
  const paidRoute = completedTurns >= MIN_WARM_TURNS ? 'можно передать по явному запросу' : 'пока не передавай; уточни один полезный вопрос о выборе пользователя';
  return `Гостевое приглашение по прямой просьбе доступно сразу, без аккаунта TravelGTC. Платный маршрут Membership / Ambassador: ${paidRoute}. Это внутренний контекст приложения, не повторяй его посетителю. Guest Pass не является покупкой. Не заявляй о подтверждении внешней регистрации или автоматическом возврате с партнёрского сайта.`;
}

export function registrationGate(question: string, answer: string, completedTurns: number) {
  const intent = classifyMiraIntent(question);
  const permitted = intent.action === 'guest_pass' || (completedTurns >= MIN_WARM_TURNS && intent.purchaseIntent);
  const url = !permitted ? null : intent.action === 'guest_pass' ? TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL
    : intent.action === 'membership' && /\bvip\b/i.test(question) ? TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL : OFFICIAL_MWR_REGISTRATION_URL;
  const route = /https:\/\/(?:(?:vip|free)\.traveladvantage\.com\/[^\s)<>]*|(?:www\.)?mwrlife\.com\/KFilip909[^\s)<>]*)/gi;
  let text = answer.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (link, label: string, href: string) => {
    route.lastIndex = 0;
    return route.test(href) ? '' : link;
  }).replace(route, '').replace(/:\s*\.(?=\s|$)/g, '.').trim();
  if (url) {
    const label = intent.action === 'guest_pass' ? 'Гостевое знакомство с Travel Advantage по приглашению Константина'
      : intent.action === 'ambassador' ? 'Официальный маршрут регистрации Ambassador' : 'Официальный маршрут оформления Membership';
    text += `\n\n${label}: ${url}`;
    if (intent.action === 'guest_pass') text += '\n\nЭто не покупка платного членства. На официальной странице проверьте условия гостевого доступа; может потребоваться гостевой аккаунт. Аккаунт TravelGTC для перехода не нужен.';
    text += '\n\nОткроется отдельная вкладка; чат останется здесь. TravelGTC не получает автоматического подтверждения регистрации на этом сайте.';
  } else if (intent.purchaseIntent) {
    // A model may announce a withheld paid link; do not leave a misleading invitation behind.
    text = 'Перед платным вступлением важно понять, подходит ли вам продукт и его условия. Для знакомства можно сразу запросить гостевое приглашение, без аккаунта TravelGTC.\n\nЧто вы хотели бы уточнить перед оформлением участия?';
  }
  return { answer: text, referralUrl: url, purchaseIntent: permitted && intent.purchaseIntent, intent };
}

export class GuestChatService {
  constructor(private readonly pool: pg.Pool, private readonly invitations?: ChatInvitationService) {}

  async purgeExpired(): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const expired = await client.query(`select * from travelgtc_mira_guest_sessions
        where claimed_user_id is null and expires_at<=now() order by expires_at limit 100 for update skip locked`);
      for (const guest of expired.rows) {
        await client.query(`delete from travelgtc_interactions where lead_id=$1 and created_by='ai_guest'`, [guest.lead_id]);
        await client.query(`update travelgtc_leads set summary='Гостевая переписка удалена по сроку хранения',stage='archived',updated_at=now()
          where id=$1 and user_id is null`, [guest.lead_id]);
        await client.query(`delete from travelgtc_mira_guest_sessions where token_hash=$1`, [guest.token_hash]);
      }
      await client.query('commit');
      return expired.rowCount || 0;
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }

  async start(): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const contact = await client.query(`insert into travelgtc_contacts
        (display_name,primary_channel,primary_contact,consent_personal_data,consent_communication,consent_version,created_by,updated_by)
        values ('Гость Миры','site','anonymous',false,false,'mira-guest-notice-v2','ai_guest','ai_guest') returning id`);
      const lead = await client.query(`insert into travelgtc_leads
        (contact_id,stage,declared_role,primary_interest,business_interest_level,source_channel,source_path,summary,created_by,updated_by)
        values ($1,'cold_contact','unsure','question','none','site','ai_chat','Гостевой диалог Миры','ai_guest','ai_guest') returning id`, [contact.rows[0].id]);
      await client.query(`insert into travelgtc_chat_cases (lead_id,contact_id,created_by) values ($1,$2,'ai_guest')`, [lead.rows[0].id,contact.rows[0].id]);
      await client.query(`insert into travelgtc_mira_guest_sessions (token_hash,lead_id,contact_id) values ($1,$2,$3)`, [tokenHash(token),lead.rows[0].id,contact.rows[0].id]);
      await client.query('commit');
      return token;
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }

  async history(token?: string) {
    const hash = tokenHash(token);
    if (!hash) return [];
    const result = await this.pool.query(`select i.direction,i.body,i.created_at::text from travelgtc_mira_guest_sessions g
      join travelgtc_interactions i on i.lead_id=g.lead_id
      join travelgtc_chat_cases cc on cc.lead_id=g.lead_id
      where g.token_hash=$1 and g.claimed_user_id is null and g.expires_at>now() and cc.status='active'
        and i.interaction_type='ai_chat' order by i.created_at,i.id limit 40`, [hash]);
    return result.rows;
  }

  async reply(token: string, question: string, ask: (q: string, history: AzureFoundryAgentHistoryTurn[], runtime: {question: string; completedTurns: number}) => Promise<string>,
    entry: { scenario?: string | null; source?: string | null; cta?: string | null; campaign?: Record<string, string> } = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      await client.query("set local lock_timeout = '3s'");
      const result = await client.query(`select g.* from travelgtc_mira_guest_sessions g
        join travelgtc_chat_cases cc on cc.lead_id=g.lead_id
        where g.token_hash=$1 and g.claimed_user_id is null and g.expires_at>now() and cc.status='active' for update of g`, [tokenHash(token)]);
      const guest = result.rows[0];
      if (!guest) throw new GuestChatError(410, 'Гостевой сеанс завершён. Обновите страницу и начните новый диалог.');
      if (guest.completed_turns >= 20) throw new GuestChatError(429, 'Лимит гостевого диалога достигнут. Сохраните переписку в аккаунте TravelGTC и продолжите после входа.');
      const turns = await client.query(`select direction,body from travelgtc_interactions where lead_id=$1 and interaction_type='ai_chat' order by created_at desc,id desc limit 40`, [guest.lead_id]);
      const history = turns.rows.reverse().map(row => ({ role: row.direction === 'inbound' ? 'user' as const : 'assistant' as const, content: redactInvitationText(row.body) }));
      const resolvedQuestion=contextualMiraQuestion(question,history);
      const personal=await this.invitations?.handle(resolvedQuestion,guest.contact_id);
      const raw = personal?personal.answer:await ask(`${buildReferralGateContext(guest.completed_turns)}\nСообщение пользователя: ${resolvedQuestion}`, history, {question:resolvedQuestion,completedTurns:guest.completed_turns});
      const response = personal || registrationGate(resolvedQuestion, raw, guest.completed_turns);
      for (const [direction,body] of [['inbound',question],['outbound',response.answer]]) {
        await client.query(`insert into travelgtc_interactions (lead_id,contact_id,interaction_type,channel,direction,body,metadata_json,created_by,created_at)
          values ($1,$2,'ai_chat','site',$3,$4,$5,'ai_guest',clock_timestamp())`, [guest.lead_id,guest.contact_id,direction,body,
          JSON.stringify({ source:'guest_ai_chat', entry, intent:response.intent, partner_registration_verified:false,
            ...(direction === 'inbound' && guest.completed_turns === 0 ? { funnel_event:'conversation_started' } : {}) })]);
      }
      await client.query(`update travelgtc_mira_guest_sessions set completed_turns=completed_turns+1 where token_hash=$1`, [tokenHash(token)]);
      await client.query(`update travelgtc_leads set stage=$2, summary=$3, updated_at=now() where id=$1`,
        [guest.lead_id,response.purchaseIntent?'ready_to_subscribe':'cold_contact',`Гостевой чат: ${question.slice(0,220)}`]);
      if (response.purchaseIntent) await client.query(`insert into travelgtc_tasks (lead_id,task_type,title,status,priority,created_by)
        select $1,'purchase_intent','Гость готов к партнёрской регистрации','open','high','ai_guest'
        where not exists (select 1 from travelgtc_tasks where lead_id=$1 and task_type='purchase_intent' and status in ('open','in_progress'))`, [guest.lead_id]);
      await client.query('commit');
      return { ...response, completedTurns:guest.completed_turns+1, leadId:guest.lead_id };
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }

  async claim(token: string | undefined, user: SessionLookupResult['user']): Promise<boolean> {
    if (!tokenHash(token)) return false;
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await client.query(`select g.* from travelgtc_mira_guest_sessions g join travelgtc_chat_cases cc on cc.lead_id=g.lead_id where g.token_hash=$1
        and g.claimed_user_id is null and g.expires_at>now() and cc.status='active' for update of g`, [tokenHash(token)]);
      const guest = result.rows[0];
      if (!guest) { await client.query('commit'); return false; }
      await client.query(`update travelgtc_contacts set user_id=$2,display_name=$3,email=$4,phone=$5,
        primary_channel=$6,primary_contact=$7,updated_at=now() where id=$1`,
        [guest.contact_id,user.userId,user.displayName||user.email,user.email,user.phone||null,user.primaryChannel,
          user.primaryChannel==='phone'&&user.phone?user.phone:user.email]);
      await client.query(`update travelgtc_leads set user_id=$2,stage=case when stage='cold_contact' then 'new_lead' else stage end,updated_at=now() where id=$1`, [guest.lead_id,user.userId]);
      await client.query(`update travelgtc_mira_guest_sessions set claimed_user_id=$2,claimed_at=now() where token_hash=$1`, [tokenHash(token),user.userId]);
      await client.query('commit');
      return true;
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }
}
