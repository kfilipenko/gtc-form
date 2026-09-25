import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import {InvitationStore} from '../modules/ai/guestInvitations/store.js';
import {BoundInvitationChat} from '../modules/ai/guestInvitations/chat.js';
import {observeInvitation} from '../modules/ai/guestInvitations/observer.js';
import { loadConfig } from './config.js';
import { createTravelGtcApp } from './createApp.js';
import { MemoryAuthStore } from '../modules/auth/stores/memoryAuthStore.js';
import { PostgresAuthStore } from '../modules/auth/stores/postgresAuthStore.js';
import { MemoryLeadStore } from '../modules/public-leads/stores/memoryLeadStore.js';
import { PostgresLeadStore } from '../modules/public-leads/stores/postgresLeadStore.js';

const config = loadConfig();
const store = config.databaseUrl ? new PostgresLeadStore(config.databaseUrl) : new MemoryLeadStore();
const authStore = config.databaseUrl ? new PostgresAuthStore(config.databaseUrl) : new MemoryAuthStore();
const invitationPool=process.env.MIRA_GUEST_POOL_ENABLED==='true'&&config.databaseUrl?new Pool({connectionString:config.databaseUrl,max:3}):null;
const invitationService=invitationPool?new BoundInvitationChat(new InvitationStore(invitationPool,await readFile('/etc/travelgtc/mira-guest-pool.key'),true,u=>u==='https://guestmember.com/',observeInvitation)):undefined;
const app = await createTravelGtcApp({ config, store, authStore,invitationService });
app.addHook('onClose',async()=>{await invitationPool?.end();});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
