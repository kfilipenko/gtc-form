import { expect, test } from '@playwright/test';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

test('operator queue disables actions denied by operator_access contract', async ({ page }) => {
  const draftId = '11111111-1111-4111-8111-111111111111';

  await page.route('**/api/v1/operator/review-queue', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        count: 1,
        access_model: 'permission_check',
        generated_at: '2026-05-15T00:00:00Z',
        queue: [
          {
            queue_item_id: draftId,
            queue_type: 'vacancy_request',
            draft_id: draftId,
            role: 'employer',
            email: 'operator.access.contract@example.com',
            full_name: 'Operator Access Contract',
            status: 'submitted_for_human_review',
            created_at: '2026-05-15T00:00:00Z',
            updated_at: '2026-05-15T00:00:00Z',
            summary: {
              vacancy_title: 'Chief Engineer',
            },
            operator_access: {
              mode: 'permission_check',
              view: {
                permission_code: 'view_review_queue',
                scope: 'queue',
                allowed: true,
              },
              actions: {
                start_review: {
                  permission_code: 'start_human_review',
                  scope: 'queue',
                  allowed: true,
                },
                needs_correction: {
                  permission_code: 'create_review_note',
                  scope: 'queue',
                  allowed: false,
                },
                reviewed: {
                  permission_code: 'approve_vacancy_request',
                  scope: 'queue',
                  allowed: false,
                },
              },
            },
          },
        ],
      }),
    });
  });

  await page.route(`**/api/v1/registration/drafts/${draftId}**`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        draft_id: draftId,
        role: 'employer',
        email: 'operator.access.contract@example.com',
        status: 'submitted_for_human_review',
        created_at: '2026-05-15T00:00:00Z',
        updated_at: '2026-05-15T00:00:00Z',
        payload: {
          vacancy_request: {
            vacancy_request_id: 'vacancy-access-contract',
            vacancy_title: 'Chief Engineer',
            publication_status: 'submitted_for_human_review',
          },
        },
      }),
    });
  });

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);

  await page.goto('/verify/');

  const row = page.locator('#queue-body tr', { hasText: 'operator.access.contract@example.com' }).first();
  await expect(row).toBeVisible();

  await expect(row.locator('.queue-open')).toHaveText('Open review workspace');
  await expect(row.locator('.queue-decision')).toHaveCount(0);
  await row.locator('.queue-open').click();

  const workspaceActions = page.locator('.workspace-actions-section');
  await expect(workspaceActions).toContainText('Workspace actions');
  const startReview = workspaceActions.locator('.queue-decision[data-decision="start_review"]');
  const needsCorrection = workspaceActions.locator('.queue-decision[data-decision="needs_correction"]');
  const reviewed = workspaceActions.locator('.queue-decision[data-decision="reviewed"]');

  await expect(startReview).toBeEnabled();
  await expect(startReview).toHaveAttribute('data-permission-code', 'start_human_review');
  await expect(startReview).toHaveAttribute('data-permission-scope', 'queue');

  await expect(needsCorrection).toBeDisabled();
  await expect(needsCorrection).toHaveAttribute('data-permission-code', 'create_review_note');
  await expect(needsCorrection).toHaveAttribute('title', 'This action is not available for the current operator role.');

  await expect(reviewed).toBeDisabled();
  await expect(reviewed).toHaveAttribute('data-permission-code', 'approve_vacancy_request');
  await expect(reviewed).toHaveAttribute('data-permission-scope', 'queue');
});
