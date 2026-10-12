const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const CHROMIUM_LOW_MEM_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',           // Uses /tmp instead of /dev/shm (critical for Docker memory limits)
    '--disable-gpu',                     // Avoids GPU process memory allocation
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-component-update',
    '--disable-background-networking',
    '--disable-sync',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--renderer-process-limit=1',        // Restricts Chromium to a single renderer process
    '--js-flags=--max-old-space-size=128' // Caps V8 heap inside Chromium
];

let sharedBrowser = null;
let taskCounter = 0;
const MAX_TASKS_PER_BROWSER_RECYCLE = 15; // Periodically recycle browser to prevent memory creep

async function getBrowser() {
    if (!sharedBrowser || !sharedBrowser.isConnected()) {
        if (sharedBrowser) {
            try { await sharedBrowser.close(); } catch (_) {}
            sharedBrowser = null;
        }
        sharedBrowser = await chromium.launch({
            headless: true,
            args: CHROMIUM_LOW_MEM_ARGS
        });
        taskCounter = 0;
    }
    return sharedBrowser;
}

async function closeBrowser() {
    if (sharedBrowser) {
        try {
            await sharedBrowser.close();
        } catch (_) {}
        sharedBrowser = null;
    }
}

async function recycleBrowserIfNecessary() {
    taskCounter++;
    if (taskCounter >= MAX_TASKS_PER_BROWSER_RECYCLE) {
        await closeBrowser();
        taskCounter = 0;
    }
}

async function runScraper(url, storeName, config) {
    let context = null;
    let page = null;

    try {
        const browser = await getBrowser();

        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            deviceScaleFactor: 1
        });

        // Request interception: block heavy images, media, and fonts to keep memory strictly under 512MB
        await context.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
                return route.abort();
            }
            return route.continue();
        });

        page = await context.newPage();
        page.setDefaultNavigationTimeout(25000);
        page.setDefaultTimeout(15000);

        console.log(` [${storeName}] Opening: ${url}`);
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        } catch (navErr) {
            console.log(`⚠️ [${storeName}] Navigation warning: ${navErr.message}`);
            const hasContent = await page.evaluate(() => document.body && document.body.innerText.length > 100).catch(() => false);
            if (!hasContent) {
                return null;
            }
        }

        // Scroll slightly for lazy DOM rendering without heavy delays
        try {
            await page.evaluate(() => window.scrollBy(0, 800));
        } catch (_) {}

        // Small bounded wait for DOM settlement
        try {
            await page.waitForTimeout(1000);
        } catch (_) {}

        const { container, title, price, originalPrice, rating, image } = config || {};
        const serializableConfig = { container, title, price, originalPrice, rating, image };

        const result = await page.evaluate((cfg) => {
            const products = [];

            const toArray = (val) => {
                if (!val) return [];
                return Array.isArray(val) ? val : [val];
            };

            // 1. Selector-based Extraction
            if (cfg && cfg.container) {
                const containerSelectors = toArray(cfg.container);
                let containerElements = [];

                for (const selector of containerSelectors) {
                    const els = Array.from(document.querySelectorAll(selector));
                    if (els.length > 0) {
                        containerElements = els;
                        break;
                    }
                }

                if (containerElements.length > 0) {
                    const titleSelectors = toArray(cfg.title);
                    const priceSelectors = toArray(cfg.price);
                    const origPriceSelectors = toArray(cfg.originalPrice);
                    const ratingSelectors = toArray(cfg.rating);
                    const imageSelectors = toArray(cfg.image);

                    containerElements.forEach((el, index) => {
                        if (index >= 8) return; // Limit to top 8 deals per store

                        // Title
                        let titleText = "";
                        for (const s of titleSelectors) {
                            const found = el.querySelector(s);
                            if (found && found.innerText && found.innerText.trim()) {
                                titleText = found.innerText.trim();
                                break;
                            }
                        }

                        // Fallback title from img alt attribute
                        if (!titleText) {
                            const imgEl = el.querySelector('img[alt]');
                            if (imgEl && imgEl.alt && imgEl.alt.trim().length > 5) {
                                titleText = imgEl.alt.trim();
                            }
                        }

                        // Price
                        let priceText = "";
                        for (const s of priceSelectors) {
                            const found = el.querySelector(s);
                            if (found && found.innerText && found.innerText.trim()) {
                                priceText = found.innerText.trim();
                                break;
                            }
                        }

                        // Regex fallback for price inside container text
                        if (!priceText) {
                            const match = el.innerText ? el.innerText.match(/(?:₹|Rs\.?)\s?[\d,]+/i) : null;
                            if (match) priceText = match[0];
                        }

                        // Original Price
                        let origPriceText = "";
                        for (const s of origPriceSelectors) {
                            const found = el.querySelector(s);
                            if (found && found.innerText && found.innerText.trim()) {
                                origPriceText = found.innerText.trim();
                                break;
                            }
                        }

                        // Rating
                        let ratingText = "";
                        for (const s of ratingSelectors) {
                            const found = el.querySelector(s);
                            if (found && found.innerText && found.innerText.trim()) {
                                ratingText = found.innerText.trim();
                                break;
                            }
                        }

                        // Image
                        let imageUrl = "";
                        for (const s of imageSelectors) {
                            const found = el.querySelector(s);
                            if (found) {
                                imageUrl = found.getAttribute('src') ||
                                           found.getAttribute('data-src') ||
                                           found.getAttribute('data-lazy-src') ||
                                           found.getAttribute('data-original') || "";
                                if (imageUrl) break;
                            }
                        }
                        if (!imageUrl) {
                            const anyImg = el.querySelector('img');
                            if (anyImg) {
                                imageUrl = anyImg.getAttribute('src') || anyImg.getAttribute('data-src') || "";
                            }
                        }

                        // Link URL
                        let linkUrl = window.location.href;
                        const linkEl = el.tagName === 'A' ? el : el.querySelector('a[href]');
                        if (linkEl && linkEl.href) {
                            linkUrl = linkEl.href;
                        }

                        if (titleText && priceText) {
                            products.push({
                                title: titleText,
                                price: priceText,
                                originalPrice: origPriceText,
                                rating: ratingText,
                                image: imageUrl,
                                url: linkUrl
                            });
                        }
                    });
                }
            }

            // 2. JSON-LD Fallback
            if (products.length === 0) {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                scripts.forEach(script => {
                    try {
                        const json = JSON.parse(script.textContent);
                        const items = Array.isArray(json) ? json : (json['@graph'] || [json]);

                        items.forEach(item => {
                            if (products.length >= 8) return;

                            if (item && item['@type'] === 'Product') {
                                const title = item.name || item.title || "";
                                const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                                const price = offers ? (offers.price || offers.lowPrice) : "";
                                const image = Array.isArray(item.image) ? item.image[0] : (item.image?.url || item.image || "");
                                const rating = item.aggregateRating?.ratingValue || "";
                                const url = item.url || offers?.url || window.location.href;

                                if (title && price) {
                                    products.push({
                                        title: String(title),
                                        price: String(price),
                                        originalPrice: "",
                                        rating: String(rating),
                                        image: String(image),
                                        url: String(url)
                                    });
                                }
                            }
                        });
                    } catch (e) {}
                });
            }

            return products;
        }, serializableConfig);

        console.log(`✅ [${storeName}] Scraped ${result.length} items`);
        return result;

    } catch (err) {
        console.log(`❌ [${storeName}] Error: ${err.message}`);
        // If the browser crashed, disconnects, or closed, reset active instance
        if (err.message && (
            err.message.includes('Target page, context or browser has been closed') ||
            err.message.includes('browser has been closed') ||
            err.message.includes('disconnected')
        )) {
            await closeBrowser();
        }
        return null;
    } finally {
        if (page) {
            try { await page.close(); } catch (_) {}
        }
        if (context) {
            try { await context.close(); } catch (_) {}
        }
        await recycleBrowserIfNecessary();
    }
}

runScraper.closeBrowser = closeBrowser;

module.exports = runScraper;
