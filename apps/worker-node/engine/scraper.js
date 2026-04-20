

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function runScraper(url, storeName, config) {
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log(` [${storeName}] Opening: ${url}`);
        console.log(` Using selector: ${config?.container}`);

        if (!config) {
            console.log(`❌ No config found for ${storeName}`);
            return null;
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });



           await page.waitForSelector(config.container, { timeout: 15000 });


           await page.waitForTimeout(5000);
           await page.mouse.wheel(0, 2000);
           await page.waitForTimeout(2000);


   const result = await page.evaluate((cfg) => {
    const items = document.querySelectorAll(cfg.container);
    if (!items.length) return [];

    const products = [];

    items.forEach((el, i) => {
        if (i >= 5) return; // 🔥 limit to 5 products

        const titleEl = el.querySelector(cfg.title);
        const priceEl = el.querySelector(cfg.price);

        let titleText = titleEl ? titleEl.innerText.trim() : "N/A";
        let priceText = priceEl ? priceEl.innerText.trim() : "0";

        // fallback price extraction (important for Myntra/Flipkart)
        const fullText = el.innerText;
        const match = fullText.match(/₹\s?[\d,]+|Rs\.?\s?[\d,]+/);

        if (match) {
            priceText = match[0];
        }

        if (titleText !== "N/A") {
            products.push({
                title: titleText,
                price: priceText,
                url: el.querySelector('a')?.href || window.location.href
            });
        }
    });

    return products;
}, config);

        console.log(` [${storeName}] Scraped:`, result);

        return result;

    } catch (err) {
        console.log(` [${storeName}] Error: ${err.message}`);
        return null;
    } finally {
        await browser.close();
    }
}

module.exports = runScraper;

