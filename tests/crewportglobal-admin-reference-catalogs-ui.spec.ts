import { expect, test } from '@playwright/test';

test('admin console renders reference catalog publication controls and submits selected values', async ({ page }) => {
  const publicationRequests: Array<Record<string, unknown>> = [];

  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal_admin_session', '11111111-1111-4111-8111-111111111111');
  });

  await page.route('**/api/v1/admin/access/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        user: {
          email: 'owner@example.com',
          status: 'Project Owner',
        },
        admin_session: {
          expires_at: '2026-05-18T22:00:00+00:00',
        },
        groups: ['owners'],
        roles: ['project_owner'],
        effective_permissions: ['view_admin_console', 'manage_user_groups', 'view_access_audit'],
        recent_access_audit_events: [],
      }),
    });
  });

  await page.route('**/api/v1/admin/access/management', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        users: [],
        groups: [],
        assignable_groups: [],
      }),
    });
  });

  await page.route('**/api/v1/admin/access/reference-catalogs**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'PATCH') {
      publicationRequests.push(request.postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          catalog_code: 'seafarer_positions',
          publication_state: 'published',
          updated_value_count: 1,
          new_value_state_counts: {
            pending_owner_review: 1,
            approved: 0,
            published: 1,
            retired: 0,
          },
        }),
      });
      return;
    }

    const includeValues = url.searchParams.get('include_values') === '1';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        catalogs: [
          {
            catalog_code: 'seafarer_positions',
            catalog_name: 'Seafarer positions',
            catalog_scope: 'seafarer',
            publication_state: 'pending_owner_review',
            value_count: 2,
            state_counts: {
              pending_owner_review: 2,
              approved: 0,
              published: 0,
              retired: 0,
            },
          },
          {
            catalog_code: 'vessel_types',
            catalog_name: 'Vessel types',
            catalog_scope: 'vessel',
            publication_state: 'pending_owner_review',
            value_count: 1,
            state_counts: {
              pending_owner_review: 1,
              approved: 0,
              published: 0,
              retired: 0,
            },
          },
        ],
        values: includeValues ? [
          {
            catalog_code: 'seafarer_positions',
            value_code: 'able_seaman',
            display_name: 'Able Seaman',
            source_value: 'Able Seaman',
            source_row_number: 12,
            sort_order: 1,
            publication_state: 'pending_owner_review',
          },
          {
            catalog_code: 'seafarer_positions',
            value_code: 'chief_officer',
            display_name: 'Chief Officer',
            source_value: 'Chief Officer',
            source_row_number: 16,
            sort_order: 2,
            publication_state: 'pending_owner_review',
          },
        ] : [],
      }),
    });
  });

  await page.goto('/admin/access/');

  await expect(page.locator('#console-panel')).toBeVisible();
  await expect(page.locator('#reference-title')).toContainText('Owner review and publication');
  await expect(page.locator('#reference-total-catalogs')).toHaveText('2');
  await expect(page.locator('#reference-total-pending')).toHaveText('3');
  await expect(page.locator('#reference-catalog-list')).toContainText('Seafarer positions');
  await expect(page.locator('#reference-catalog-list')).toContainText('Vessel types');

  await page.locator('#reference-catalog-list').getByRole('button', { name: 'Open values' }).first().click();
  await expect(page.locator('#reference-selected-label')).toContainText('Seafarer positions');
  await expect(page.locator('#reference-value-list')).toContainText('Able Seaman');
  await expect(page.locator('#reference-value-list')).toContainText('Chief Officer');

  await page.locator('#reference-reason').fill('Owner approved first test value.');
  await page.locator('#reference-value-list input[value="able_seaman"]').check();
  await page.locator('#reference-publish-selected').click();

  expect(publicationRequests).toHaveLength(1);
  expect(publicationRequests[0]).toMatchObject({
    catalog_code: 'seafarer_positions',
    publication_state: 'published',
    reason: 'Owner approved first test value.',
    value_codes: ['able_seaman'],
  });
  await expect(page.locator('#reference-status')).toContainText('Updated 1 value');
});
