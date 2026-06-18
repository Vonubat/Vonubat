'use strict';

const puppeteer = require('puppeteer-extra');
let StealthPlugin = require('puppeteer-extra-plugin-stealth');

if (StealthPlugin.default) {
  StealthPlugin = StealthPlugin.default;
}
puppeteer.use(StealthPlugin());

const fs = require('fs');

(async () => {
  let quote = 'Code is like humor. When you have to explain it, it’s bad.';
  let success = false;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let browser;

    try {
      console.log(`Attempt ${attempt} of ${maxAttempts}...`);

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      });

      const page = await browser.newPage();

      await page.goto('https://programming-quotesapi.vercel.app/api/random', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => {
          try {
            const data = JSON.parse(document.body.innerText);
            return data && data.quote;
          } catch (e) {
            return false;
          }
        },
        { timeout: 15000 },
      );

      const content = await page.evaluate(() => document.body.innerText);
      const data = JSON.parse(content);

      if (data && data.quote) {
        quote = data.quote;
        success = true;
        console.log('Success!');
      }
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
    } finally {
      if (browser) await browser.close();
    }

    if (success) break;
  }

  const dynamicWidth = Math.max(550, quote.length * 10 + 30);
  const encodedQuote = encodeURIComponent(quote);
  let readme = fs.readFileSync('README.md', 'utf-8');

  readme = readme.replace(/(readme-typing-svg\.demolab\.com.*?[?&]lines=)[^&\)\]"]+/g, `$1${encodedQuote}`);
  readme = readme.replace(/(readme-typing-svg\.demolab\.com.*?[?&]width=)\d+/g, `$1${dynamicWidth}`);

  fs.writeFileSync('README.md', readme);
})();
