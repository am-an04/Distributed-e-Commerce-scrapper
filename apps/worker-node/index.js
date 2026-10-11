require('dotenv').config();
const connectDB = require('../../libs/database/connection');
const { connectRedis } = require('../../libs/redis/client');
const runScraper = require('./engine/scraper');
const Product = require('../../libs/database/Product');
const { parsePrice, parseRating, cleanImageUrl, calculateDiscount } = require('../../libs/utils/parser');
const storeConfigs = require('./scrapers/siteConfigs');

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Worker Unhandled Rejection:', reason && reason.message ? reason.message : reason);
});
process.on('uncaughtException', (err) => {
    console.error('⚠️ Worker Uncaught Exception:', err.message);
});

async function start() {
    await connectDB();
    const redis = await connectRedis();

    console.log("🚀 Worker started...");

    while (true) {
        try {
            const taskData = await redis.brPop('scrape_queue', 0);

            if (!taskData) continue;

            console.log(" Raw Task:", taskData.element);

            const { url, name } = JSON.parse(taskData.element);
            const store = name.toLowerCase();

            console.log(` [${store}] Scraping...`);

            const config = storeConfigs[store];

            // Safety check
            if (!config) {
                console.log(`❌ No config found for store: ${store}`);
                continue;
            }

            const data = await runScraper(url, store, config);

            console.log(" Scraped Data count:", data ? data.length : 0);

            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item && item.title !== "N/A" && item.title) {
                        const numericPrice = parsePrice(item.price);
                        const numericOrigPrice = parsePrice(item.originalPrice);
                        const numericRating = parseRating(item.rating);
                        const imageUrl = cleanImageUrl(item.image, url);
                        const discountPct = calculateDiscount(numericPrice, numericOrigPrice);

                        if (numericPrice > 0) {
                            await Product.findOneAndUpdate(
                                { url: item.url },
                                {
                                    title: item.title,
                                    price: numericPrice,
                                    originalPrice: numericOrigPrice > numericPrice ? numericOrigPrice : null,
                                    discount: discountPct,
                                    rating: numericRating,
                                    image: imageUrl,
                                    store: config.name || store,
                                    url: item.url,
                                    lastScraped: new Date()
                                },
                                { upsert: true }
                            );

                            console.log(`✅ [${store}] Saved: ${item.title} - ₹${numericPrice}`);
                        }
                    }
                }
            } else {
                console.log(`⚠️ [${store}] No valid data extracted`);
            }

        } catch (err) {
            console.error("❌ Worker Loop Error:", err.message);
        }
    }
}

start();