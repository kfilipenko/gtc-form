import { loadConfig } from './config.js';

const config = loadConfig();
const url = `http://${config.host}:${config.port}/api/travelgtc/v1/health`;
const response = await fetch(url);

if (!response.ok) {
  throw new Error(`TravelGTC API health check failed: ${response.status}`);
}

const body = (await response.json()) as { ok?: boolean; service?: string };
if (!body.ok || body.service !== 'travelgtc-api') {
  throw new Error(`TravelGTC API health check returned unexpected body: ${JSON.stringify(body)}`);
}

console.log(`TravelGTC API health check passed: ${url}`);
