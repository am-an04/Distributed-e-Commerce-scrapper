const { getRedisClient } = require('../../../libs/redis/client');
const Product = require('../../../libs/database/Product');

/**
 * Helper: check if product is fashion-related
 */
const myntraMap = {
    shoes: "shoes",
    sneaker: "shoes",
    tshirt: "tshirts",
    "t-shirt": "tshirts",
    shirt: "shirts",
    jeans: "jeans",
    jacket: "jackets",
    hoodie: "hoodies",
    kurta: "kurtas",
    dress: "dresses"
};

const getMyntraPath = (productName) => {
    const key = productName.toLowerCase();

    for (let k in myntraMap) {
        if (key.includes(k)) {
            return myntraMap[k];
        }
    }
    return null; // not supported
};

/**
 * Distributes tasks to workers
 */
const initiateSearch = async (productName) => {
    const redisClient = await getRedisClient();

    // Clear previous results
    await Product.deleteMany({});

    const tasks = [];

    // ✅ Always include Amazon & Flipkart
    tasks.push(
        { name: 'amazon', url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}` },
        { name: 'flipkart', url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}` }
    );

    // ✅ Myntra only if relevant
    const myntraPath = getMyntraPath(productName);

    if (myntraPath) {
        tasks.push({
            name: 'myntra',
            url: `https://www.myntra.com/${myntraPath}`
        });
    } else {
        console.log("⚠️ Myntra skipped (not a fashion product)");
    }

    // Optional: Nike (same logic as Myntra)
    if (productName.toLowerCase().includes("shoe")) {
        tasks.push({
            name: 'nike',
            url: `https://www.nike.com/in/w?q=${encodeURIComponent(productName)}`
        });
    }

    // Push tasks to Redis
    for (const task of tasks) {
        console.log("📤 Sending task:", task);
        await redisClient.lPush('scrape_queue', JSON.stringify(task));
    }

    return tasks.length;
};

/**
 * Fetch results from DB
 */
const getLatestResults = async () => {
    return await Product.find().sort({ price: 1 });
};

module.exports = { initiateSearch, getLatestResults };