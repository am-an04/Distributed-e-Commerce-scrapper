const crypto = require('crypto');
const { getRedisClient } = require('../../../libs/redis/client');
const Product = require('../../../libs/database/Product');
const storeConfigs = require('../../worker-node/scrapers/siteConfigs');

const ELECTRONICS_KEYWORDS = ['phone', 'mobile', 'laptop', 'tv', 'headphone', 'earbuds', 'watch', 'camera', 'refrigerator', 'macbook', 'ipad', 'iphone', 'samsung', 'sony', 'dell', 'hp', 'audio', 'charger', 'speaker', 'tab', 'monitor', 'keyboard', 'mouse', 'console', 'ps5'];
const FASHION_KEYWORDS = ['shoe', 'sneaker', 'tshirt', 't-shirt', 'shirt', 'jeans', 'jacket', 'hoodie', 'kurta', 'dress', 'saree', 'top', 'trouser', 'pant', 'sandal', 'footwear', 'clothing', 'bag', 'wallet'];
const SPORTS_KEYWORDS = ['shoe', 'sneaker', 'running', 'football', 'gym', 'fitness', 'sports', 'racket', 'bat', 'cycle', 'jersey', 'tracks', 'sports-bag'];
const BEAUTY_KEYWORDS = ['lipstick', 'perfume', 'shampoo', 'cream', 'lotion', 'makeup', 'serum', 'skincare', 'hair', 'beauty', 'fragrance', 'cologne'];

/**
 * Distributes tasks to workers dynamically based on product query and category hints
 */
const initiateSearch = async (productName) => {
    const redisClient = await getRedisClient();
    const searchId = crypto.randomUUID();

    // Set active searchId in Redis
    await redisClient.set('current_search_id', searchId);

    const tasks = [];
    const queryLower = productName.toLowerCase();

    const isElectronics = ELECTRONICS_KEYWORDS.some(k => queryLower.includes(k));
    const isFashion = FASHION_KEYWORDS.some(k => queryLower.includes(k));
    const isSports = SPORTS_KEYWORDS.some(k => queryLower.includes(k));
    const isBeauty = BEAUTY_KEYWORDS.some(k => queryLower.includes(k));

    // Determine relevant stores
    for (const [storeKey, cfg] of Object.entries(storeConfigs)) {
        let shouldInclude = false;

        if (cfg.category === 'general') {
            shouldInclude = true; // Always include general marketplaces (Amazon, Flipkart, Tata CLiQ, Snapdeal, Meesho, Shopsy)
        } else if (cfg.category === 'electronics' && (isElectronics || (!isFashion && !isSports && !isBeauty))) {
            shouldInclude = true;
        } else if (cfg.category === 'fashion' && (isFashion || (!isElectronics && !isBeauty))) {
            shouldInclude = true;
        } else if (cfg.category === 'sports' && (isSports || isFashion || (!isElectronics && !isBeauty))) {
            shouldInclude = true;
        } else if (cfg.category === 'beauty' && (isBeauty || (!isElectronics && !isSports))) {
            shouldInclude = true;
        }

        if (shouldInclude && typeof cfg.searchUrl === 'function') {
            tasks.push({
                searchId,
                name: storeKey,
                storeDisplayName: cfg.name,
                url: cfg.searchUrl(productName),
                query: productName
            });
        }
    }

    console.log(`📤 Pushing ${tasks.length} scraping tasks to Redis for '${productName}' (searchId: ${searchId})...`);

    // Push tasks to Redis scrape_queue
    for (const task of tasks) {
        console.log(`  -> Task queued: [${task.name}] ${task.url}`);
        await redisClient.lPush('scrape_queue', JSON.stringify(task));
    }

    return {
        searchId,
        count: tasks.length,
        stores: tasks.map(t => t.storeDisplayName || t.name)
    };
};

/**
 * Fetch results from DB sorted by price, strictly for the provided searchId with no fallback
 */
const getLatestResults = async (searchId) => {
    if (!searchId) {
        return [];
    }
    return await Product.find({ searchId }).sort({ price: 1 });
};

module.exports = { initiateSearch, getLatestResults };