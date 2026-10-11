const { spawn } = require('child_process');
const net = require('net');

let RedisMemoryServer;
try {
    RedisMemoryServer = require('redis-memory-server').RedisMemoryServer;
} catch (e) {
    // redis-memory-server is optional for local development
}

async function checkPort(port) {
    return new Promise((resolve) => {
        const s = net.connect(port, '127.0.0.1', () => {
            s.destroy();
            resolve(true);
        });
        s.on('error', () => resolve(false));
    });
}

async function start() {
    console.log("==================================================");
    console.log("🚀 Distributed E-Commerce Scraper Suite Initializing");
    console.log("==================================================");

    const isRedisOpen = await checkPort(6379);
    if (!isRedisOpen) {
        if (RedisMemoryServer) {
            console.log("📡 Starting local Redis Memory Server on port 6379...");
            try {
                const redisServer = new RedisMemoryServer({
                    instance: { port: 6379 }
                });
                await redisServer.getHost();
                await redisServer.getPort();
                console.log("✅ Redis Server active at 127.0.0.1:6379");
            } catch (e) {
                console.log("⚠️ Could not start embedded Redis. Trying default host...", e.message);
            }
        } else {
            console.log("⚠️ No Redis service detected on port 6379 and optional 'redis-memory-server' is not installed.");
            console.log("ℹ️ For local in-memory Redis, install it via: npm install --save-dev redis-memory-server");
            console.log("ℹ️ Or ensure a Redis service is running at 127.0.0.1:6379");
        }
    } else {
        console.log("✅ Existing Redis service detected on port 6379.");
    }

    const env = { 
        ...process.env, 
        MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scraper_db', 
        REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379' 
    };

    console.log("⚡ Launching Master API (Port 3000)...");
    const master = spawn('node', ['apps/master-api/index.js'], { env, stdio: 'inherit', shell: true });

    console.log("🤖 Spawning 3 Distributed Worker Nodes...");
    const workers = [];
    for (let i = 1; i <= 3; i++) {
        const w = spawn('node', ['apps/worker-node/index.js'], { env, stdio: 'inherit', shell: true });
        workers.push(w);
    }

    console.log("🎨 Launching Frontend Dashboard (Vite)...");
    const frontend = spawn('npx', ['vite'], { cwd: './frontend', stdio: 'inherit', shell: true });

    const cleanup = () => {
        console.log("\n🛑 Shutting down all processes...");
        master.kill();
        workers.forEach(w => w.kill());
        frontend.kill();
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

start().catch(console.error);
