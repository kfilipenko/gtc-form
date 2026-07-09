import { loadConfig } from './config.js';
import { createTravelGtcApp } from './createApp.js';
import { MemoryAuthStore } from '../modules/auth/stores/memoryAuthStore.js';
import { PostgresAuthStore } from '../modules/auth/stores/postgresAuthStore.js';
import { MemoryLeadStore } from '../modules/public-leads/stores/memoryLeadStore.js';
import { PostgresLeadStore } from '../modules/public-leads/stores/postgresLeadStore.js';

const config = loadConfig();
const store = config.databaseUrl ? new PostgresLeadStore(config.databaseUrl) : new MemoryLeadStore();
const authStore = config.databaseUrl ? new PostgresAuthStore(config.databaseUrl) : new MemoryAuthStore();
const app = await createTravelGtcApp({ config, store, authStore });

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
