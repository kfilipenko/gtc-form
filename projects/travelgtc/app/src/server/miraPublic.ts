import {createHash} from 'node:crypto';
import type {FastifyInstance} from 'fastify';
import {GUEST_COOKIE,GUEST_TTL_SECONDS} from '../modules/ai/guestChat.js';
import {parseCookieValue,serializeCookie} from '../modules/auth/cookies.js';

// Identity is resolved server-side; neither a supplied lead ID nor an arbitrary cookie grants access.
export function registerMiraPublic(app:FastifyInstance, deps:any) {
 const {pool,guestChat,session,origin,ipLimit,globalLimit,secure}=deps;
 async function identity(req:any){
  const account=await session(req);
  if(account) return {userId:account.user.userId,leadId:null};
  const token=parseCookieValue(req.headers.cookie,GUEST_COOKIE);
  if(!token||!pool)return null;
  const r=await pool.query(`select g.lead_id from travelgtc_mira_guest_sessions g
   join travelgtc_chat_cases c on c.lead_id=g.lead_id
   where g.token_hash=$1 and g.claimed_user_id is null and g.expires_at>now() and c.status='active' limit 1`,
   [createHash('sha256').update(token).digest('hex')]);
  return r.rows[0]?{userId:null,leadId:r.rows[0].lead_id}:null;
 }
 function check(req:any){origin(req);if(req.headers['sec-fetch-site']==='cross-site')throw Error('origin');}
 app.get('/api/travelgtc/v1/ai/voice/access',async(req,reply)=>{
  reply.header('Cache-Control','private, no-store');
  try{check(req);return (await identity(req))?{ok:true}:reply.code(403).send({ok:false});}
  catch{return reply.code(503).send({ok:false});}
 });
 app.post('/api/travelgtc/v1/ai/chat/session',async(req,reply)=>{
  reply.header('Cache-Control','private, no-store');
  try{check(req);if(await identity(req))return {ok:true};
   if(!guestChat)return reply.code(503).send({ok:false});
   if((req.body as any)?.guest_consent!==true)return reply.code(400).send({ok:false});
   ipLimit.check(req.ip);globalLimit.check('all');
   const token=await guestChat.start();reply.header('Set-Cookie',serializeCookie(GUEST_COOKIE,token,{maxAgeSeconds:GUEST_TTL_SECONDS,secure}));return {ok:true};
  }catch{return reply.code(429).send({ok:false});}
 });
 app.post('/api/travelgtc/v1/ai/chat/feedback',async(req,reply)=>{
  reply.header('Cache-Control','private, no-store');let client:any;
  try{
   check(req);const who=await identity(req);if(!who)return reply.code(403).send({ok:false});
   const b=req.body as any;
   if(!['positive','negative'].includes(b?.rating)||typeof b.answer!=='string'||!b.answer.trim()||b.answer.length>24000||typeof b.comment!=='string'||b.comment.length>500)return reply.code(400).send({ok:false});
   if(!pool)return reply.code(503).send({ok:false});
   client=await pool.connect();await client.query('BEGIN');
   const found=await client.query(`select i.id,i.lead_id,i.contact_id from travelgtc_interactions i
    join travelgtc_leads l on l.id=i.lead_id where i.interaction_type='ai_chat' and i.direction='outbound' and i.body=$1
    and (($2::uuid is not null and l.user_id=$2::uuid and l.source_path='ai_chat') or ($3::uuid is not null and i.lead_id=$3::uuid))
    order by i.created_at desc limit 1`,[b.answer,who.userId,who.leadId]);
   if(!found.rows[0]){await client.query('ROLLBACK');return reply.code(404).send({ok:false});}
   const a=found.rows[0];await client.query('select pg_advisory_xact_lock(hashtext($1))',[`mira-feedback:${a.id}`]);
   const previous=await client.query(`select id from travelgtc_interactions where lead_id=$1::uuid and interaction_type='ai_feedback' and metadata_json->>'answer_id'=$2 limit 1`,[a.lead_id,String(a.id)]);
   const metadata=JSON.stringify({source:'mira_chat_feedback',answer_id:String(a.id),rating:b.rating,comment:b.comment.trim()});
   const body=b.rating==='positive'?'Ответ Миры полезен':'Ответ Миры не помог';
   if(previous.rows[0])await client.query(`update travelgtc_interactions set body=$1,metadata_json=$2 where id=$3::uuid`,[body,metadata,previous.rows[0].id]);
   else await client.query(`insert into travelgtc_interactions (lead_id,contact_id,actor_user_id,interaction_type,channel,direction,body,human_approved,metadata_json,created_by,updated_by)
    values($1::uuid,$2::uuid,$3::uuid,'ai_feedback','site','inbound',$4,false,$5,'mira_feedback','mira_feedback')`,[a.lead_id,a.contact_id,who.userId,body,metadata]);
   await client.query('COMMIT');return {ok:true,feedback_persisted:true};
  }catch{if(client)await client.query('ROLLBACK').catch(()=>{});return reply.code(503).send({ok:false});}
  finally{client?.release();}
 });
}
