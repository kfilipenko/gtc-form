import { test, expect } from '@playwright/test';

const workflowUser = {
  gtc_user_id: 3598,
  email: 'kfilipenko@gtchain.io',
  id: 'workflow-test-user',
  email_verified: true,
  full_name: 'Workflow QA User'
};

const WORKFLOW_WEBHOOK = 'https://agent.gtstor.com/webhook/chat';
const okHeaders = { 'Content-Type': 'application/json' };
const okChatApiResponse = { success: true, data: [] };

function buildMockWorkflowResponse(message) {
  return [
    {
      success: true,
      trace_id: `mock-trace-${Date.now()}`,
      chat_id: 'mock-chat-id',
      gtc_user_id: workflowUser.gtc_user_id,
      reply: `Mocked workflow reply for: ${message}`,
      output: {
        reply: `Mocked workflow reply for: ${message}`,
        stage: 'TEST_STAGE'
      },
      intermediateSteps: []
    }
  ];
}

async function bootstrapSession(page) {
  await page.evaluate(({ user }) => {
    localStorage.clear();
    sessionStorage.clear();
    const payload = {
      gtc_user_id: user.gtc_user_id,
      email: user.email,
      id: user.id,
      email_verified: user.email_verified,
      full_name: user.full_name
    };
    localStorage.setItem('chat:user', JSON.stringify(payload));
    localStorage.setItem('gtc_user_id', String(user.gtc_user_id));
    localStorage.setItem('chat:history', JSON.stringify([]));
  }, { user: workflowUser });
}

async function waitForBotReply(page, previousCount) {
  await page.waitForFunction((count) => {
    return document.querySelectorAll('.chat-msg.bot').length > count;
  }, previousCount, { timeout: 90_000 });
}

function sanitize(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

test.describe('Workflow request-response', () => {
  test('sends chat message and renders workflow reply', async ({ page }) => {
    await page.route('**/chat_api.php*', async (route) => {
      await route.fulfill({ status: 200, headers: okHeaders, body: JSON.stringify(okChatApiResponse) });
    });
    await page.route('**/chat_transactions.log*', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'text/plain' }, body: '' });
    });
    page.on('console', (msg) => {
      console.log(`[chat-console] ${msg.type()}: ${msg.text()}`);
    });
    await page.route(WORKFLOW_WEBHOOK, async (route) => {
      const request = route.request();
      let message = 'unknown message';
      try {
        const payload = await request.postDataJSON();
        message = payload?.message || message;
      } catch {}
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMockWorkflowResponse(message))
      });
    });
    const message = `Automation ping ${new Date().toISOString()}`;
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await bootstrapSession(page);
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('#userSection'), 'user card should be visible after bootstrap').toBeVisible();

    const botMessages = page.locator('.chat-msg.bot');
    const initialBotCount = await botMessages.count();

    await page.fill('#chatInput', message);
    await page.click('#sendBtn');

    await waitForBotReply(page, initialBotCount);
    const latestCount = await botMessages.count();
    const latestBot = botMessages.nth(latestCount - 1);
    await expect(latestBot).toBeVisible();
    const botText = sanitize(await latestBot.textContent());
    expect(botText.length, 'workflow reply should not be empty').toBeGreaterThan(0);

    test.info().annotations.push({ type: 'workflow-response', description: botText.slice(0, 200) });

    const historySnapshot = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('chat:history') || '[]');
      } catch {
        return [];
      }
    });
    const hasAssistantEntry = historySnapshot.some((entry) => entry?.role === 'bot' && typeof entry.text === 'string' && entry.text.trim().length > 0);
    expect(hasAssistantEntry, 'local history should include bot reply').toBeTruthy();
  });
});
