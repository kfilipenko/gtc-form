import {createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,randomUUID} from 'node:crypto';
import type pg from 'pg';
export type Invitation={landingUrl:string;code:string};
export type Observation={status:'available'|'redeemed'|'expired'|'unknown';checkedAt:string};
export type Allocation={status:'assigned';invitation:Invitation;reused:boolean;checkedAt:string}|{status:'disabled'|'empty'|'unavailable'|'expired'|'already_redeemed'};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
// Only trusted application identity is accepted here, never an LLM-supplied recipient.
export const recipientKey=(kind:'guest'|'account'|'contact',serverIdentity:string)=>{
 if(!serverIdentity||serverIdentity.length>256)throw Error('INVALID_RECIPIENT');
 return hash(kind+':'+serverIdentity);
};
export class InvitationStore{
 constructor(private pool:pg.Pool,private key:Buffer,private enabled:boolean,
  private routeAllowed:(url:string)=>boolean,
  private observe:(invitation:Invitation,signal?:AbortSignal)=>Promise<Observation>){if(key.length!==32)throw Error('INVALID_KEY');}
 private seal(value:Invitation,id:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(id));const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');}
 private open(value:string,id:string):Invitation{const b=Buffer.from(value,'base64');const decipher=createDecipheriv('aes-256-gcm',this.key,b.subarray(0,12));decipher.setAAD(Buffer.from(id));decipher.setAuthTag(b.subarray(12,28));const v=JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString());if(!this.routeAllowed(v.landingUrl)||typeof v.code!=='string'||!/^[A-Za-z0-9_-]{3,128}$/.test(v.code))throw Error('INVALID_INVITATION');return v;}
 private async observation(invitation:Invitation):Promise<Observation>{
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([this.observe(invitation,controller.signal),new Promise<Observation>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve({status:'unknown',checkedAt:new Date().toISOString()});},30000);})]);}finally{if(timer)clearTimeout(timer);}
 }
 async importExclusive(entries:{ordinal:number;invitation:Invitation;sourceReference:string;validityConfirmed:boolean;expiresAt?:string}[],attestation:'EXCLUSIVE_PREVIOUSLY_UNSENT'|'OWNER_SELECTED_AVAILABLE'){
  if(!['EXCLUSIVE_PREVIOUSLY_UNSENT','OWNER_SELECTED_AVAILABLE'].includes(attestation))throw Error('POOL_AUTHORITY_REQUIRED');
  const c=await this.pool.connect();try{await c.query('begin');
   for(const x of entries){if(!Number.isSafeInteger(x.ordinal)||x.ordinal<0||!x.validityConfirmed||!x.sourceReference||!this.routeAllowed(x.invitation.landingUrl)||!/^[A-Za-z0-9_-]{3,128}$/.test(x.invitation.code)||x.expiresAt&&!Number.isFinite(Date.parse(x.expiresAt)))throw Error('UNVERIFIED_IMPORT');
    const id=randomUUID();await c.query('insert into mira_invitation_pool(id,ordinal,fingerprint,encrypted_payload,source_reference,validity_confirmed,expires_at) values($1,$2,$3,$4,$5,$6,$7)',[id,x.ordinal,createHmac('sha256',this.key).update('voucher:'+x.invitation.code).digest('hex'),this.seal(x.invitation,id),x.sourceReference,true,x.expiresAt||null]);}
   await c.query('commit');
  }catch{await c.query('rollback');throw Error('IMPORT_FAILED');}finally{c.release();}
 }
 async allocate(recipient:string,replaceRedeemed=false):Promise<Allocation>{
  if(!this.enabled)return {status:'disabled'};
  if(!/^[a-f0-9]{64}$/.test(recipient))throw Error('INVALID_RECIPIENT');
  const c=await this.pool.connect();try{
   await c.query('begin');await c.query("set local lock_timeout='3s'");
   await c.query('select pg_advisory_xact_lock(739191050)');
   await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[recipient]);
   const prior=await c.query('select p.* from mira_invitation_assignments a join mira_invitation_pool p on p.id=a.invitation_id where a.recipient_key=$1 for update of p',[recipient]);
   let reused=!!prior.rows[0];
   for(let attempt=0;attempt<5;attempt++){let row=prior.rows[0];
   if(!row){const available=await c.query("select * from mira_invitation_pool where state='available' and validity_confirmed and (expires_at is null or expires_at>now()) order by ordinal limit 1 for update skip locked");row=available.rows[0];}
   if(!row){
    const old=await c.query("select p.*,a.recipient_key as old_recipient from mira_invitation_assignments a join mira_invitation_pool p on p.id=a.invitation_id where p.state='assigned' and a.assigned_at<now()-interval '10 days' and (p.expires_at is null or p.expires_at>now()) order by a.assigned_at,p.ordinal limit 1 for update of p,a");row=old.rows[0];
   }
   if(!row){await c.query('commit');return {status:'empty'};}
   if(row.expires_at&&new Date(row.expires_at).getTime()<=Date.now()){await c.query('commit');return {status:'expired'};}
   const invitation=this.open(row.encrypted_payload,row.id);const observation=await this.observation(invitation);
   const fresh=Number.isFinite(Date.parse(observation.checkedAt))&&Math.abs(Date.now()-Date.parse(observation.checkedAt))<60000;
   if(!fresh||!['available','redeemed','expired'].includes(observation.status)){await c.query('rollback');return {status:'unavailable'};}
   if(observation.status!=='available'){
    await c.query("update mira_invitation_pool set state='unavailable' where id=$1",[row.id]);
    if(reused&&replaceRedeemed&&observation.status==='redeemed'){
     await c.query("insert into mira_invitation_history(recipient_key,invitation_id,assigned_at,reason,provider_status,checked_at) select recipient_key,invitation_id,assigned_at,'redeemed_replacement_requested',$2,$3 from mira_invitation_assignments where invitation_id=$1",[row.id,observation.status,observation.checkedAt]);
     await c.query('delete from mira_invitation_assignments where invitation_id=$1',[row.id]);prior.rows.length=0;reused=false;continue;
    }
    if(!reused)continue;
    await c.query('commit');return {status:observation.status==='expired'?'expired':'already_redeemed'};
   }
   if(!reused&&row.old_recipient){
    await c.query("insert into mira_invitation_history(recipient_key,invitation_id,assigned_at,reason,provider_status,checked_at) select recipient_key,invitation_id,assigned_at,'unactivated_after_10_days',$2,$3 from mira_invitation_assignments where invitation_id=$1",[row.id,observation.status,observation.checkedAt]);
    await c.query('delete from mira_invitation_assignments where invitation_id=$1',[row.id]);
   }
   if(!reused){await c.query("update mira_invitation_pool set state='assigned' where id=$1",[row.id]);await c.query('insert into mira_invitation_assignments(recipient_key,invitation_id,provider_status,checked_at) values($1,$2,$3,$4)',[recipient,row.id,observation.status,observation.checkedAt]);}
   // Durable commit precedes delivery. A lost HTTP response cannot recycle this code.
   await c.query('commit');return {status:'assigned',invitation,reused,checkedAt:observation.checkedAt};
   }
   await c.query('commit');return {status:'unavailable'};
  }catch{await c.query('rollback').catch(()=>{});return {status:'unavailable'};}finally{c.release();}
 }
 async checkGuest(recipient:string):Promise<{status:'not_assigned'|'unavailable'|'guest_code_available'|'guest_code_redeemed'|'guest_code_expired'|'reservation_reassigned';checkedAt?:string}>{
  if(!this.enabled||!/^[a-f0-9]{64}$/.test(recipient))return {status:'unavailable'};
  try{const r=await this.pool.query('select p.id,p.encrypted_payload from mira_invitation_assignments a join mira_invitation_pool p on p.id=a.invitation_id where a.recipient_key=$1',[recipient]);if(!r.rows[0]){const old=await this.pool.query('select 1 from mira_invitation_history where recipient_key=$1 limit 1',[recipient]);return {status:old.rows.length?'reservation_reassigned':'not_assigned'};}
   const o=await this.observation(this.open(r.rows[0].encrypted_payload,r.rows[0].id));if(!Number.isFinite(Date.parse(o.checkedAt))||Math.abs(Date.now()-Date.parse(o.checkedAt))>=60000||!['available','redeemed','expired'].includes(o.status))return {status:'unavailable'};
   return {status:({available:'guest_code_available',redeemed:'guest_code_redeemed',expired:'guest_code_expired'} as const)[o.status as 'available'|'redeemed'|'expired'],checkedAt:o.checkedAt};
  }catch{return {status:'unavailable'};}
 }
}
