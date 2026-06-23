'use strict';

const puppeteer = require('puppeteer-extra');
const puppeteerStealthPlugin = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs');

puppeteer.use(puppeteerStealthPlugin);

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

      await page.goto('https://programming-quotes-api-pi.vercel.app/quotes/random', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => {
          try {
            const data = JSON.parse(document.body.innerText);
            return data && data.en;
          } catch (e) {
            return false;
          }
        },
        { timeout: 15000 },
      );

      const content = await page.evaluate(() => document.body.innerText);
      const data = JSON.parse(content);

      if (data && data.en) {
        quote = data.en;
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

  console.log('\n--- DEBUG INFO ---');
  console.log(`Fetched Quote: "${quote}"`);

  const maxCharsPerLine = 55;
  const words = quote.split(' ');
  const linesArr = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length > maxCharsPerLine) {
      linesArr.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) {
    linesArr.push(currentLine.trim());
  }

  const formattedQuote = linesArr.join(';');
  const maxLineChars = Math.max(...linesArr.map((l) => l.length));

  const dynamicWidth = Math.ceil(Math.max(400, maxLineChars * 12 + 40));
  const dynamicHeight = Math.max(50, linesArr.length * 30 + 20);

  let readme = fs.readFileSync('README.md', 'utf-8');

  const regex = /(https:\/\/readme-typing-svg\.demolab\.com[^\s)"'>]+)/g;
  const matches = readme.match(regex);

  if (matches) {
    console.log(`Found ${matches.length} SVG URL(s) in README.md.`);
    matches.forEach((m, i) => console.log(`Old URL ${i + 1}: ${m}`));
  } else {
    console.log('WARNING: Could not find the SVG URL in README.md!');
  }

  readme = readme.replace(regex, (match) => {
    try {
      const url = new URL(match.replace(/&amp;/g, '&'));

      url.searchParams.set('lines', formattedQuote);
      url.searchParams.set('multiline', 'true');
      url.searchParams.set('width', dynamicWidth);
      url.searchParams.set('height', dynamicHeight);

      const newUrl = url.toString();
      console.log(`New URL: ${newUrl}`);
      return newUrl;
    } catch (e) {
      console.error('URL parsing failed:', e);
      return match;
    }
  });

  fs.writeFileSync('README.md', readme);
  console.log('------------------\n');
})();
