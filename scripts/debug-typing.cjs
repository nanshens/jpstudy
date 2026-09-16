const { chromium } = require('C:/Users/nanshens/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });
  await page.goto('http://127.0.0.1:4173/scenarios/medical', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('click 打字...');
  await page.locator('button:has-text("打字")').click();
  await page.waitForTimeout(3000);
  console.log('done');
  await browser.close();
})();