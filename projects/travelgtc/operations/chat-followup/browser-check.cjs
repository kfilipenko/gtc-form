const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;
for(const width of [390,1440])for(const path of ['/','/mira/']){
 const page=await browser.newPage({viewport:{width,height:844}});const requests=[];let resolveAnswer;
 await page.route('**/api/**',async route=>{const url=route.request().url();let body={ok:true};let status=200;
 if(url.endsWith('/auth/me'))body={ok:true,authenticated:false};
 else if(url.endsWith('/history'))body={ok:true,messages:[]};
 else if(url.endsWith('/voice/access')){status=403;body={ok:false};}
 else if(url.endsWith('/chat/session'))requests.push(route.request().postDataJSON());
 else if(url.endsWith('/ai/chat')){requests.push(route.request().postDataJSON());await new Promise(r=>resolveAnswer=r);body={ok:true,answer:'НАЧАЛО ОТВЕТА\n\n'+('Разбираем условия поездки и возможности приложения.\n\n'.repeat(30))};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('http://127.0.0.1:4197'+path);await page.waitForTimeout(250);
 assert.equal(await page.locator('#consent').count(),0);checks++;
 await page.locator('#question').fill('Хочу посмотреть приложение');await page.locator('#send').click();
 await page.waitForFunction(()=>document.querySelector('#state').textContent.includes('обдумывает'));
 await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));resolveAnswer();
 await page.waitForSelector('.bot:has-text("НАЧАЛО ОТВЕТА")');await page.waitForTimeout(350);
 const pos=await page.evaluate(()=>{const e=[...document.querySelectorAll('.bot')].find(e=>e.textContent.includes('НАЧАЛО ОТВЕТА'));const b=document.querySelector('#messages');return {top:e.getBoundingClientRect().top,box:b.getBoundingClientRect().top,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
 assert(pos.top>=-1&&pos.top<pos.height-100,JSON.stringify({width,path,pos}));checks++;
 assert(Math.abs(pos.top-pos.box)<35,JSON.stringify(pos));checks++;
 assert(!pos.overflow);checks++;
 assert(requests.length===2&&requests.every(r=>!('guest_consent'in r)));checks++;
 assert.equal(await page.locator('.bot:has-text("НАЧАЛО ОТВЕТА") [data-rating]').count(),2);checks++;
 await page.screenshot({path:`/tmp/mira-followup-${width}-${path==='/ ' ?'home':path==='/ '?'home':path==='/'?'home':'chat'}.png`});
 await page.close();
}
console.log(JSON.stringify({browserChecks:checks,status:'PASS'}));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
