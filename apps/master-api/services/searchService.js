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

    // Clear previous search results from DB
    await Product.deleteMany({});

    // Clear stale tasks in Redis scrape_queue so workers don't execute old queries
    try {
        await redisClient.del('scrape_queue');
    } catch (e) {
        console.warn('⚠️ Could not flush scrape_queue:', e.message);
    }

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
                name: storeKey,
                storeDisplayName: cfg.name,
                url: cfg.searchUrl(productName),
                query: productName
            });
        }
    }

    console.log(`📤 Pushing ${tasks.length} scraping tasks to Redis for '${productName}'...`);

    // Push tasks to Redis scrape_queue
    for (const task of tasks) {
        console.log(`  -> Task queued: [${task.name}] ${task.url}`);
        await redisClient.lPush('scrape_queue', JSON.stringify(task));
    }

    return {
        count: tasks.length,
        stores: tasks.map(t => t.storeDisplayName || t.name)
    };
};

/**
 * Fetch results from DB sorted by price, matching query when supplied
 */
const getLatestResults = async (searchQuery) => {
    if (searchQuery && searchQuery.trim()) {
        const words = searchQuery.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
            const regexPattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            const searchRegex = new RegExp(regexPattern, 'i');
            const matched = await Product.find({ title: searchRegex }).sort({ price: 1 });
            if (matched.length > 0) return matched;
        }
    }
    return await Product.find().sort({ price: 1 });
};

module.exports = { initiateSearch, getLatestResults };