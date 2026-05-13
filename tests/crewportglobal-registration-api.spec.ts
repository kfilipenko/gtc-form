import { expect, test } from '@playwright/test';

type DraftResponse = {
  ok: boolean;
  draft_id: string;
  role: string;
  email: string;
  status: string;
  payload: Record<string, unknown>;
};

test('health endpoint returns service status', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.service).toBe('crewportglobal-registration-api');
});

test('seafarer draft create, get and patch flow works', async ({ request }) => {
  const unique = Date.now();
  const email = `api.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Test Seafarer',
      country_code: 'AE',
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('seafarer');
  expect(created.email).toBe(email);
  expect(typeof created.draft_id).toBe('string');

  const getResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(getResponse.status()).toBe(200);

  const fetched = (await getResponse.json()) as DraftResponse;
  expect(fetched.ok).toBe(true);
  expect(fetched.draft_id).toBe(created.draft_id);

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      availability_status: 'available_now',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  expect(patched.ok).toBe(true);
  expect(patched.draft_id).toBe(created.draft_id);

  const seafarerProfile = patched.payload.seafarer_profile as Record<string, unknown>;
  expect(seafarerProfile.availability_status).toBe('available_now');
});

test('shipowner flow normalizes IMO and updates vessel context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.shipowner.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'shipowner',
      email,
      company_name: 'API Blue Horizon',
      country_code: 'SG',
      registration_number: `SG-${unique}`,
      vessel: {
        vessel_name: 'MV Test Aurora',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9001234',
      },
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('shipowner');

  const company = created.payload.company as Record<string, unknown>;
  const vessel = created.payload.vessel as Record<string, unknown>;
  expect(company.company_type).toBe('shipowner');
  expect(vessel.imo_number).toBe('9001234');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'API Blue Horizon Group',
      vessel: {
        vessel_name: 'MV Test Aurora II',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9001234',
      },
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  const patchedCompany = patched.payload.company as Record<string, unknown>;
  const patchedVessel = patched.payload.vessel as Record<string, unknown>;
  expect(patchedCompany.company_name).toBe('API Blue Horizon Group');
  expect(patchedVessel.vessel_name).toBe('MV Test Aurora II');
  expect(patchedVessel.imo_number).toBe('9001234');
});

test('employer flow creates and updates company draft context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.employer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      email,
      company_name: 'Atlas Marine Crewing',
      country_code: 'AE',
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('employer');

  const createdCompany = created.payload.company as Record<string, unknown>;
  expect(createdCompany.company_name).toBe('Atlas Marine Crewing');
  expect(createdCompany.company_type).toBe('employer');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'Atlas Marine Crewing LLC',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  const patchedCompany = patched.payload.company as Record<string, unknown>;
  expect(patchedCompany.company_name).toBe('Atlas Marine Crewing LLC');
  expect(patchedCompany.company_type).toBe('employer');
});

test('invalid payloads are rejected with 4xx', async ({ request }) => {
  const noJson = await request.post('/registration/drafts', {
    headers: { 'Content-Type': 'text/plain' },
    data: 'not-json',
  });
  expect(noJson.status()).toBe(415);

  const badRole = await request.post('/registration/drafts', {
    data: {
      role: 'captain',
      email: 'bad-role@example.com',
    },
  });
  expect(badRole.status()).toBe(400);

  const badDraftId = await request.get('/registration/drafts/not-a-uuid');
  expect(badDraftId.status()).toBe(400);
});
