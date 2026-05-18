import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function runSql(sql: string): string {
  return execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();
}

function cleanupReferenceCatalogs(prefix: string): void {
  const safePrefix = prefix.replace(/'/g, "''");
  runSql(`
DELETE FROM crewportglobal.reference_catalogs
WHERE catalog_code LIKE '${safePrefix}%';
`);
}

function seedReferenceCatalogFixtures(prefix: string): void {
  const pendingCatalog = `${prefix}pending`;
  const mixedCatalog = `${prefix}mixed`;
  const safePendingCatalog = pendingCatalog.replace(/'/g, "''");
  const safeMixedCatalog = mixedCatalog.replace(/'/g, "''");

  runSql(`
WITH pending_catalog AS (
  INSERT INTO crewportglobal.reference_catalogs (
    catalog_code,
    catalog_name,
    catalog_scope,
    source_name,
    source_sheet,
    description,
    publication_state
  ) VALUES (
    '${safePendingCatalog}',
    'Test pending catalog',
    'seafarer',
    'private-test-source.xls',
    'DROPDOWN_LISTS',
    'Pending values must not be public',
    'pending_owner_review'
  )
  RETURNING reference_catalog_id
)
INSERT INTO crewportglobal.reference_catalog_values (
  reference_catalog_id,
  value_code,
  display_name,
  source_value,
  sort_order,
  publication_state
)
SELECT
  reference_catalog_id,
  'pending_value',
  'Pending Value',
  'Private pending source value',
  1,
  'pending_owner_review'
FROM pending_catalog;

WITH mixed_catalog AS (
  INSERT INTO crewportglobal.reference_catalogs (
    catalog_code,
    catalog_name,
    catalog_scope,
    source_name,
    source_sheet,
    description,
    publication_state
  ) VALUES (
    '${safeMixedCatalog}',
    'Test mixed catalog',
    'seafarer',
    'private-test-source.xls',
    'DROPDOWN_LISTS',
    'Only published values may be public',
    'published'
  )
  RETURNING reference_catalog_id
)
INSERT INTO crewportglobal.reference_catalog_values (
  reference_catalog_id,
  value_code,
  display_name,
  source_value,
  sort_order,
  publication_state
)
SELECT
  reference_catalog_id,
  value_code,
  display_name,
  source_value,
  sort_order,
  publication_state
FROM mixed_catalog
CROSS JOIN (VALUES
  ('published_value', 'Published Value', 'Private published source value', 1, 'published'),
  ('hidden_value', 'Hidden Value', 'Private hidden source value', 2, 'pending_owner_review')
) AS values_to_insert(value_code, display_name, source_value, sort_order, publication_state);
`);
}

test('reference catalog API exposes only published catalog values', async ({ request }) => {
  const prefix = `test_ref_${Date.now()}_`;
  cleanupReferenceCatalogs(prefix);
  seedReferenceCatalogFixtures(prefix);

  try {
    const pendingResponse = await request.get(`/api/v1/reference-catalogs?catalog_code=${prefix}pending`);
    expect(pendingResponse.status()).toBe(200);
    const pendingBody = await pendingResponse.json();
    expect(pendingBody.catalogs).toEqual([]);
    expect(JSON.stringify(pendingBody)).not.toContain('Pending Value');
    expect(JSON.stringify(pendingBody)).not.toContain('source_value');
    expect(JSON.stringify(pendingBody)).not.toContain('private-test-source.xls');

    const mixedResponse = await request.get(`/api/v1/reference-catalogs?catalog_code=${prefix}mixed`);
    expect(mixedResponse.status()).toBe(200);
    const mixedBody = await mixedResponse.json();
    expect(mixedBody.count).toBe(1);
    expect(mixedBody.publication_state).toBe('published');
    expect(mixedBody.catalogs[0].catalog_code).toBe(`${prefix}mixed`);
    expect(mixedBody.catalogs[0].values).toEqual([
      {
        value_code: 'published_value',
        display_name: 'Published Value',
        sort_order: 1,
      },
    ]);
    expect(JSON.stringify(mixedBody)).not.toContain('Hidden Value');
    expect(JSON.stringify(mixedBody)).not.toContain('Private hidden source value');
    expect(JSON.stringify(mixedBody)).not.toContain('source_value');
    expect(JSON.stringify(mixedBody)).not.toContain('source_name');

    const invalidScopeResponse = await request.get('/api/v1/reference-catalogs?scope=crew');
    expect(invalidScopeResponse.status()).toBe(400);
    const invalidScopeBody = await invalidScopeResponse.json();
    expect(invalidScopeBody.error).toBe('invalid_reference_catalog_scope');
  } finally {
    cleanupReferenceCatalogs(prefix);
  }
});
