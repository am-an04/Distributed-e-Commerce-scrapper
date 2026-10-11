const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function runScraper(url, storeName, config) {
    const browser = await chromium.launch({ 
        headless: true, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security'
        ] 
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 }
    });

    const page = await context.newPage();

    try {
        console.log(` [${storeName}] Opening: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });

        // Scroll page down slightly to trigger lazy loading images
        await page.evaluate(() => window.scrollBy(0, 1200));
        await page.waitForTimeout(2500);

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
        return null;
    } finally {
        try {
            await browser.close();
        } catch (_) {
            // Ignore error on close if browser already crashed or closed
        }
    }
}

module.exports = runScraper;
