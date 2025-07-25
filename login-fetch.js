const puppeteer = require('puppeteer');
const fs = require('fs-extra');

const EMAIL = process.env.MYFXBOOK_EMAIL;
const PASSWORD = process.env.MYFXBOOK_PASSWORD;
const XML_URL = 'https://www.myfxbook.com/economic-calendar.xml';

(async () => {
  const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.myfxbook.com/login', { waitUntil: 'networkidle2' });

    await page.type('input[name="loginEmail"]', EMAIL);
    await page.type('input[name="loginPassword"]', PASSWORD);
    await Promise.all([
      await page.click('#login-btn'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const cookies = await page.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const xmlContent = await page.evaluate(async (url, cookieHeader) => {
      const res = await fetch(url, {
        headers: { 'Cookie': cookieHeader }
      });
      return await res.text();
    }, XML_URL, cookieHeader);

    await fs.writeFile('calendar.xml', xmlContent);
    console.log('✅ calendar.xml saved');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
