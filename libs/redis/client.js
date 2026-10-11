const { createClient } = require('redis');
let client;

const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        throw new Error("REDIS_URL environment variable is not defined");
    }
    client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    console.log('📡 Redis Connection Established');
    return client;
};

// This helper lets your Service file grab the existing connection
const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };