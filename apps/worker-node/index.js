
const connectDB = require('../../libs/database/connection');
const { connectRedis } = require('../../libs/redis/client');
const runScraper = require('./engine/scraper');
const Product = require('../../libs/database/Product');
const { parsePrice } = require('../../libs/utils/parser');
const storeConfigs = require('./scrapers/siteConfigs');

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

            // ✅ safety check
            if (!config) {
                console.log(`❌ No config found for store: ${store}`);
                continue;
            }

            const data = await runScraper(url, store, config);

            console.log(" Scraped Data:", data);


    if (Array.isArray(data)) {
    for (const item of data) {
        if (item && item.title !== "N/A") {
            const numericPrice = parsePrice(item.price);

            await Product.findOneAndUpdate(
                { url: item.url },
                {
                    title: item.title,
                    price: numericPrice,
                    store: store,
                    url: item.url,
                    lastScraped: new Date()
                },
                { upsert: true }
            );

            console.log(`✅ [${store}] Saved: ${item.title} - ₹${numericPrice}`);
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