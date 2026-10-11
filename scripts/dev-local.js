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

    let mongoProcess = null;
    const isMongoOpen = await checkPort(27017);
    if (!isMongoOpen) {
        console.log("📡 Checking for local MongoDB service on port 27017...");
        const fs = require('fs');
        const path = require('path');
        const candidatePaths = [
            'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
            'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
            'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
            'mongod'
        ];
        const mongodBin = candidatePaths.find(p => p !== 'mongod' && fs.existsSync(p)) || 'mongod';
        const dataDir = path.join(__dirname, '..', 'mongodb_data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        try {
            console.log(`📦 Launching local MongoDB server using ${dataDir}...`);
            mongoProcess = spawn(mongodBin, ['--dbpath', dataDir, '--port', '27017'], {
                stdio: 'ignore',
                shell: true
            });
            mongoProcess.on('error', (err) => {
                console.log("⚠️ Could not spawn mongod:", err.message);
            });

            // Wait up to 5 seconds for Mongo to accept connections
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (await checkPort(27017)) {
                    console.log("✅ Local MongoDB active at 127.0.0.1:27017");
                    break;
                }
            }
        } catch (e) {
            console.log("⚠️ Could not start local MongoDB:", e.message);
        }

        if (!await checkPort(27017)) {
            console.log("⚠️ MongoDB is not accessible at 127.0.0.1:27017. Please start MongoDB for authentication & database features.");
        }
    } else {
        console.log("✅ Existing MongoDB service detected on port 27017.");
    }

    const env = { 
        ...process.env, 
        MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scraper_db', 
        REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379' 
    };

    console.log("⚡ Launching Master API (Port 3000)...");
    const master = spawn('node', ['apps/master-api/index.js'], { env, stdio: 'inherit', shell: true });

    console.log("🔍 Checking Playwright browser binaries...");
    try {
        const { chromium } = require('playwright');
        const fs = require('fs');
        const execPath = chromium.executablePath();
        if (!fs.existsSync(execPath)) {
            console.log("📥 Downloading Playwright Chromium browser for workers...");
            const { execSync } = require('child_process');
            execSync('npx playwright install chromium', { stdio: 'inherit' });
        }
        console.log("✅ Playwright Chromium ready.");
    } catch (e) {
        console.log("⚠️ Playwright check note:", e.message);
    }

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
        if (mongoProcess) mongoProcess.kill();
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

start().catch(console.error);
