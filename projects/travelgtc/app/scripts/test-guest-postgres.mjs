import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
import { GuestChatService } from '../dist/src/modules/ai/guestChat.js';

const name = `travelgtc_ai018_test_${process.pid}`;
const admin = new pg.Pool({host:'/var/run/postgresql',user:'postgres',database:'postgres'});
let pool;
let created = false;
let assertions = 0;
try {
  await admin.query(`create database ${name}`);
  created = true;
  pool = new pg.Pool({host:'/var/run/postgresql',user:'postgres',database:name});
  for (const file of (await fs.readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())
    await pool.query(await fs.readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
  const service = new GuestChatService(pool);
  const token = await service.start();
  const stranger = await service.start();
  let modelCalls = 0;
  const ask = async (_q,history) => { modelCalls++; if(modelCalls===2) assert.equal(history.length,2); return 'Ответ. https://vip.traveladvantage.com/KFilip909'; };
  for (let n=0;n<3;n++) {
    const response = await service.reply(token,'Хочу купить VIP Membership.',ask,{source:'home',cta:'hero-trip',campaign:{utm_source:'test'}});
    assert.equal(response.purchaseIntent,false); assert.equal(response.referralUrl,null); assertions++;
  }
  const confirmed = await service.reply(token,'Хочу купить VIP Membership.',ask);
  assert.equal(confirmed.purchaseIntent,true); assertions++;
  const attribution = await pool.query("select metadata_json from travelgtc_interactions where metadata_json->>'funnel_event'='conversation_started'");
  assert.equal(attribution.rowCount,1); assertions++;
  assert.deepEqual(attribution.rows[0].metadata_json.entry,{source:'home',cta:'hero-trip',campaign:{utm_source:'test'}}); assertions++;
  assert.equal((await service.history(token)).length,8); assertions++;
  assert.equal((await service.history(stranger)).length,0); assertions++;
  assert.equal((await service.history('malformed')).length,0); assertions++;
  const stored = await pool.query('select token_hash from travelgtc_mira_guest_sessions');
  assert.ok(stored.rows.every(r=>r.token_hash!==token)); assertions++;
  const user = (await pool.query("insert into travelgtc_identity.users(email,display_name,primary_channel) values ('test@example.invalid','Synthetic Test','email') returning user_id")).rows[0];
  const identity = {userId:user.user_id,email:'test@example.invalid',displayName:'Synthetic Test',primaryChannel:'email'};
  assert.equal(await service.claim(token,identity),true); assertions++;
  assert.equal(await service.claim(token,identity),false); assertions++;
  assert.equal((await service.history(token)).length,0); assertions++;
  await assert.rejects(()=>service.reply(token,'Ещё вопрос',ask),e=>e.statusCode===410); assertions++;
  assert.equal((await pool.query('select i.id from travelgtc_interactions i join travelgtc_leads l on l.id=i.lead_id where l.user_id=$1',[user.user_id])).rowCount,8); assertions++;
  const failureToken = await service.start();
  await assert.rejects(()=>service.reply(failureToken,'Тест ошибки',async()=>{throw Error('Synthetic model failure');}));
  assert.equal((await service.history(failureToken)).length,0); assertions++;
  await pool.query('update travelgtc_mira_guest_sessions set completed_turns=20 where claimed_user_id is null');
  await assert.rejects(()=>service.reply(failureToken,'Лимит',ask),e=>e.statusCode===429); assertions++;
  await pool.query("update travelgtc_mira_guest_sessions set expires_at=now()-interval '1 day'");
  await service.purgeExpired();
  assert.equal((await pool.query('select * from travelgtc_mira_guest_sessions where claimed_user_id is null')).rowCount,0); assertions++;
  assert.equal((await pool.query('select * from travelgtc_interactions')).rowCount,8); assertions++;
  console.log(JSON.stringify({result:'PASS',checks:assertions,modelCalls,realAzureCalls:0,productionWrites:0}));
} finally {
  if(pool) await pool.end();
  if(created) await admin.query(`drop database ${name}`);
  await admin.end();
}
