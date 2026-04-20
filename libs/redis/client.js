const { createClient } = require('redis');
let client;

const connectRedis = async () => {
    client = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
    await client.connect();
    console.log('📡 Redis Connection Established');
    return client;
};

// This helper lets your Service file grab the existing connection
const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };