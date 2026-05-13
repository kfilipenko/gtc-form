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
      rank: 'Second Officer',
      department: 'deck',
      country_code: 'AE',
      nationality_code: 'PH',
      residence_country_code: 'AE',
      availability_status: 'available_later',
      availability_date: '2026-07-10',
      preferred_vessel_types: ['Bulk Carrier', 'Container'],
      salary_expectation_usd: 4200,
      contact_phone: '+971500000001',
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
  const fetchedSeafarerProfile = fetched.payload.seafarer_profile as Record<string, unknown>;
  expect(fetchedSeafarerProfile.primary_rank).toBe('Second Officer');
  expect(fetchedSeafarerProfile.department).toBe('deck');
  expect(fetchedSeafarerProfile.nationality_code).toBe('PH');
  expect(fetchedSeafarerProfile.residence_country_code).toBe('AE');
  expect(fetchedSeafarerProfile.availability_date).toBe('2026-07-10');
  expect(fetchedSeafarerProfile.salary_expectation_usd).toBe('4200.00');
  expect(fetchedSeafarerProfile.contact_phone).toBe('+971500000001');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      availability_status: 'available_now',
      rank: 'Chief Officer',
      department: 'deck',
      preferred_vessel_types: ['LNG'],
      salary_expectation_usd: 5100,
      contact_phone: '+971500000999',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  expect(patched.ok).toBe(true);
  expect(patched.draft_id).toBe(created.draft_id);

  const seafarerProfile = patched.payload.seafarer_profile as Record<string, unknown>;
  expect(seafarerProfile.availability_status).toBe('available_now');
  expect(seafarerProfile.primary_rank).toBe('Chief Officer');
  expect(seafarerProfile.department).toBe('deck');
  expect(seafarerProfile.salary_expectation_usd).toBe('5100.00');
  expect(seafarerProfile.contact_phone).toBe('+971500000999');
  expect(seafarerProfile.availability_date).toBe('2026-07-10');
  expect(typeof seafarerProfile.preferred_vessel_types).toBe('string');
  expect(seafarerProfile.preferred_vessel_types).toBe('["LNG"]');
});

test('shipowner flow normalizes IMO and updates vessel context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.shipowner.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'shipowner',
      role_in_company: 'owner',
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
  expect(company.role_in_company).toBe('owner');
  expect(vessel.imo_number).toBe('9001234');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'API Blue Horizon Group',
      role_in_company: 'recruiter',
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
  expect(patchedCompany.role_in_company).toBe('recruiter');
  expect(patchedVessel.vessel_name).toBe('MV Test Aurora II');
  expect(patchedVessel.imo_number).toBe('9001234');
});

test('employer flow creates and updates company draft context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.employer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
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
  expect(createdCompany.role_in_company).toBe('manager');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'Atlas Marine Crewing LLC',
      role_in_company: 'owner',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  const patchedCompany = patched.payload.company as Record<string, unknown>;
  expect(patchedCompany.company_name).toBe('Atlas Marine Crewing LLC');
  expect(patchedCompany.company_type).toBe('employer');
  expect(patchedCompany.role_in_company).toBe('owner');
});

test('operator review queue returns submitted seafarer and company drafts', async ({ request }) => {
  const unique = Date.now();

  const seafarerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: `api.queue.seafarer.${unique}@example.com`,
      full_name: 'Queue Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(seafarerCreate.status()).toBe(201);

  const companyCreate = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      email: `api.queue.employer.${unique}@example.com`,
      full_name: 'Queue Employer',
      company_name: 'Queue Marine LLC',
      country_code: 'AE',
    },
  });
  expect(companyCreate.status()).toBe(201);

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);

  const queueBody = (await queueResponse.json()) as {
    ok: boolean;
    count: number;
    queue: Array<Record<string, unknown>>;
  };

  expect(queueBody.ok).toBe(true);
  expect(Array.isArray(queueBody.queue)).toBe(true);
  expect(queueBody.count).toBeGreaterThan(0);

  const hasSeafarer = queueBody.queue.some((item) => item.queue_type === 'seafarer_profile' && item.role === 'seafarer');
  const hasCompany = queueBody.queue.some((item) => item.queue_type === 'company_verification' && item.role === 'employer');

  expect(hasSeafarer).toBe(true);
  expect(hasCompany).toBe(true);
});

test('operator decision endpoint updates draft review status', async ({ request }) => {
  const unique = Date.now();
  const email = `api.operator.decision.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Operator Decision Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;

  const decisionResponse = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(decisionResponse.status()).toBe(200);

  const decisionBody = (await decisionResponse.json()) as Record<string, unknown>;
  expect(decisionBody.ok).toBe(true);
  expect(decisionBody.draft_id).toBe(created.draft_id);
  expect(decisionBody.new_status).toBe('approved');

  const getResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(getResponse.status()).toBe(200);
  const fetched = (await getResponse.json()) as DraftResponse;
  const seafarerProfile = fetched.payload.seafarer_profile as Record<string, unknown>;
  expect(seafarerProfile.review_status).toBe('approved');

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = (await queueResponse.json()) as {
    queue: Array<Record<string, unknown>>;
  };
  const stillInQueue = queueBody.queue.some((item) => item.draft_id === created.draft_id);
  expect(stillInQueue).toBe(false);
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
