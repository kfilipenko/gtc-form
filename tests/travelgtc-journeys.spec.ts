import { test, expect } from '@playwright/test';

const pages = ['/travel-lifestyle/', '/club/', '/business-model/'];
async function anonymous(page) {
  await page.route('**/api/travelgtc/v1/**', route => route.fulfill({json:{ok:true,authenticated:false,messages:[]}}));
}

for(const [width,height] of [[1920,1080],[1440,900],[768,1024],[390,844],[320,568]]) {
  test(`audience pages render and first action fits ${width}x${height}`,async({page},info)=>{
    await page.setViewportSize({width,height});
    await anonymous(page);
    const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    for(const path of pages) {
      await page.goto(path);
      await page.evaluate(()=>document.fonts.ready);
      await expect(page.locator('h1')).toHaveCount(1);
      const hero=await page.locator('.journey-hero').boundingBox();
      expect(hero!.y+hero!.height,path).toBeLessThan(height);
      expect(await page.locator('[data-journey-primary]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),path).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
      const loaded=await page.locator('.journey-hero').evaluate(el=>new Promise<boolean>(resolve=>{
        const url=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
        if(!url)return resolve(false); const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=url;
      }));
      expect(loaded,path).toBe(true);
      const broken=await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));
      expect(broken).toEqual([]);
      const headerOverlap=await page.evaluate(()=>{
        const nav=document.querySelector('.nav-links')!; if(getComputedStyle(nav).display==='none')return false;
        const n=nav.getBoundingClientRect(), a=document.querySelector('.nav-actions')!.getBoundingClientRect();
        return n.right>a.left && n.top<a.bottom && n.bottom>a.top;
      });
      expect(headerOverlap,'Header overlap '+path).toBe(false);
      await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveAttribute('href',path);
      expect(await page.locator('.nav-links a').evaluateAll(links=>links.every(link=>getComputedStyle(link,'::after').content==='none'))).toBe(true);
      await page.locator('summary').first().click();
      await expect(page.locator('details[open]')).toHaveCount(1);
      await page.locator('summary').first().click();
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      await page.screenshot({path:info.outputPath(path.replaceAll('/','')+'.png'),fullPage:true});
      await page.locator('[data-journey-primary]').click();
      await expect(page).toHaveURL(/\/mira\/\?scenario=/);
      await expect(page.locator('[data-guest-consent]')).not.toBeChecked();
    }
    expect(errors).toEqual([]);
  });
}

for(const [path,route,scenario,source,cta,question] of [
  ['/travel-lifestyle/','value','personal-travel','travel-lifestyle','travel-value','поездки'],
  ['/travel-lifestyle/','independent','personal-travel','travel-lifestyle','independent-travel','самостоятельно'],
  ['/club/','community','events','club','community','Life Experiences'],
  ['/business-model/','ambassador','ambassador-business','business-model','ambassador-start','Ambassador'],
]) {
  test(`consented ${route} handoff retains question and campaign`,async({page})=>{
    await anonymous(page);
    const sent:any[]=[];
    await page.route('**/api/travelgtc/v1/ai/chat',route=>{
      sent.push(route.request().postDataJSON());
      return route.fulfill({json:{ok:true,mode:'azure',answer:'Уточним ваши планы.',completed_turns:1,history_persisted:true}});
    });
    await page.goto('/?utm_source=vk&utm_campaign=journeys&utm_medium=email%40example.invalid');
    await page.locator('.nav-links a').filter({hasText: path==='/club/'?'Сообщество':path==='/business-model/'?'Ambassador':'Путешествия'}).click();
    expect(new URL(page.url()).pathname).toBe(path);
    expect(new URL(page.url()).searchParams.get('utm_source')).toBe('vk');
    await page.locator(`[data-journey-route="${route}"]`).click();
    const url=new URL(page.url());
    expect(url.searchParams.get('scenario')).toBe(scenario);
    expect(url.searchParams.get('utm_campaign')).toBe('journeys');
    expect(url.searchParams.has('utm_medium')).toBe(false);
    await expect(page.locator('[name=question]')).toHaveValue(new RegExp(question));
    const login=await page.locator('[data-ai-entry-login]').getAttribute('href');
    expect(decodeURIComponent(login!)).toContain(`cta=${cta}`);
    await page.locator('[data-ai-form] button[type=submit]').click();
    expect(sent).toHaveLength(0);
    await page.locator('[data-guest-consent]').check();
    await page.locator('[data-ai-form] button[type=submit]').click();
    await expect(page.locator('[data-ai-messages]')).toContainText('Уточним ваши планы.');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({scenario,source,cta,guest_consent:true,campaign:{utm_source:'vk',utm_campaign:'journeys'}});
    if(route!=='ambassador') expect(sent[0].question).not.toContain('Ambassador');
  });
}

test('mobile menu exposes journeys; home anchors route to relevant content',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await anonymous(page);
  await page.goto('/');
  await page.locator('[data-menu-toggle]').click();
  await page.locator('.nav-links a[href="/club/"]').click();
  await expect(page.locator('h1')).toHaveText('Life Experiences');
  await page.goto('/');
  await page.locator('main a[href="/travel-lifestyle/#independent"]').click();
  await expect(page).toHaveURL(/travel-lifestyle\/#independent$/);
  await expect(page.locator('#independent h2')).toContainText('готовый тур');
  await page.goto('/club/');
  expect(await page.locator('main a[href*="scenario=ambassador-business"]').count()).toBe(0);
});
