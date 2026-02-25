import { test, expect } from '@playwright/test';

const mockStatusPayload = {
  gtc_user_id: '987654',
  email: 'active-subscription@gtstor.com',
  status: 'payment_required',
  subscription_active: true,
  subscription_status: 'active',
  manual_access: false
};

const okChatApiResponse = {
  success: true,
  data: []
};

const okHeaders = { 'Content-Type': 'application/json' };

test.describe('Chat access decisions', () => {
  test('treats active subscriptions as chat-ready even if status suggests payment', async ({ page }) => {
    await page.addInitScript(({ statusPayload, chatResponse }) => {
      const originalFetch = window.fetch.bind(window);
      const okJsonHeaders = { 'Content-Type': 'application/json' };
      window.fetch = async (input, init = {}) => {
        const rawUrl = typeof input === 'string' ? input : (input?.url || '');
        const absolute = rawUrl.startsWith('http')
          ? rawUrl
          : String(new URL(rawUrl || '', window.location.origin));
        if (absolute.includes('/auth/status')) {
          return new Response(JSON.stringify(statusPayload), { status: 200, headers: okJsonHeaders });
        }
        if (absolute.includes('/auth/profile')) {
          return new Response(JSON.stringify({ gtc_user_id: statusPayload.gtc_user_id }), { status: 200, headers: okJsonHeaders });
        }
        if (absolute.includes('/chat_api.php')) {
          return new Response(JSON.stringify(chatResponse), { status: 200, headers: okJsonHeaders });
        }
        if (absolute.includes('/chat_transactions.log')) {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }
        return originalFetch(input, init);
      };
    }, { statusPayload: mockStatusPayload, chatResponse: okChatApiResponse });

    await page.goto('/chat', { waitUntil: 'networkidle' });

    await page.waitForFunction(() => {
      const statusEl = document.querySelector('#chatStatus');
      return Boolean(statusEl && statusEl.textContent && statusEl.textContent.includes('Access confirmed.'));
    });

    const paymentPanel = page.locator('#paymentPanel');
    await expect(paymentPanel).toHaveAttribute('data-critical', 'false');
    await expect(page.locator('#userIdDisplay')).toContainText(mockStatusPayload.gtc_user_id);
    await expect(page.locator('#sendBtn')).toBeEnabled();
  });
});
