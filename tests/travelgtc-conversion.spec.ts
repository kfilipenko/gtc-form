import { test, expect } from '@playwright/test';

async function anonymous(page) {
  await page.route('**/api/travelgtc/v1/**', route => route.fulfill({json:{ok:true,authenticated:false,messages:[]}}));
}

for (const [width,height] of [[1920,1080],[1440,900],[390,844],[320,700],[320,568]]) {
  test(`first screen and compact guest chat ${width}x${height}`, async ({page},info) => {
    await page.setViewportSize({width,height});
    await anonymous(page);
    const errors:string[]=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto('/');
    await page.evaluate(()=>document.fonts.ready);
    const cta=page.locator('[data-home-primary]');
    await expect(cta).toBeVisible();
    const hero=await page.locator('.conversion-hero').boundingBox();
    expect(hero!.y+hero!.height).toBeLessThan(height);
    expect(await cta.evaluate(el=>el.getBoundingClientRect().bottom<innerHeight)).toBe(true);
    await page.screenshot({path:info.outputPath('home.png'),fullPage:true});
    await cta.click();
    await expect(page).toHaveURL(/\/mira\/.*cta=hero-trip/);
    await expect(page.locator('[data-ai-form]')).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.locator('[name=question]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
    expect(await page.locator('[data-ai-form] button[type=submit]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
    await expect(page.locator('[data-ai-question-select] option:checked')).toHaveText('Выберите первый вопрос');
    await expect(page.locator('[data-guest-consent]')).not.toBeChecked();
    await page.screenshot({path:info.outputPath('mira.png'),fullPage:true});
    for(const path of ['/','/mira/','/about/','/business-model/']) {
      await page.goto(path);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('campaign codes survive primary CTA; no chat call before consent', async ({page}) => {
  await anonymous(page);
  const requests:Record<string,unknown>[]=[];
  await page.route('**/api/travelgtc/v1/ai/chat',route=>{
    requests.push(route.request().postDataJSON());
    return route.fulfill({json:{ok:true,mode:'azure',answer:'Какие даты поездки?',completed_turns:1}});
  });
  await page.goto('/?utm_source=vk&utm_campaign=family-2026&utm_medium=person%40example.invalid&utm_term=private&token=secret');
  await page.locator('[data-home-primary]').click();
  expect(page.url()).toContain('utm_source=vk');
  expect(new URL(page.url()).searchParams.has('utm_medium')).toBe(false);
  expect(new URL(page.url()).searchParams.has('token')).toBe(false);
  await page.locator('[name=question]').fill('Планируем семейную поездку');
  await page.locator('[data-ai-form] button[type=submit]').click();
  expect(requests).toHaveLength(0);
  await expect(page.locator('[data-ai-question-prompt]')).toBeVisible();
  await page.locator('[data-guest-consent]').check();
  await page.locator('[data-ai-form] button[type=submit]').click();
  await expect(page.locator('[data-ai-messages]')).toContainText('Какие даты поездки?');
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({source:'home',cta:'hero-trip',guest_consent:true,campaign:{utm_source:'vk',utm_campaign:'family-2026'}});
  expect(requests[0].campaign).toEqual({utm_source:'vk',utm_campaign:'family-2026'});
  const next=await page.locator('[data-ai-entry-register]').getAttribute('href');
  expect(decodeURIComponent(next!)).toContain('utm_campaign=family-2026');
});

test('founder identity, safe social links and FAQ', async ({page}) => {
  await anonymous(page);
  await page.goto('/');
  await expect(page.locator('#founder')).toContainText('Константин Филипенко');
  await page.getByText('Нужно ли регистрироваться, чтобы задать вопрос?',{exact:true}).click();
  await expect(page.locator('details[open]')).toContainText('Нет.');
  await page.goto('/about/');
  await expect(page.locator('h1')).toHaveText('Константин Филипенко');
  for(const host of ['facebook.com','linkedin.com']) {
    const link=page.locator(`main a[href*="${host}"]`);
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel',/noopener/);
  }
});
