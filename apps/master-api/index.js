const express = require('express');
const cors = require('cors');
const connectDB = require('../../libs/database/connection');
const { connectRedis } = require('../../libs/redis/client');
const searchRoutes = require('./routes/searchRoutes'); // Import your routes

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Routes
// This sends any request starting with /api to your searchRoutes.js
app.use('/api', searchRoutes);

// 3. Server Initialization
const start = async () => {
    try {
        // Connect to the "Vault" (MongoDB)
        await connectDB();
        
        // Connect to the "Messenger" (Redis)
        // We initialize it here so the services can use the connection later
        await connectRedis();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Master API Orchestrator live on port ${PORT}`);
        });
    } catch (error) {
        console.error("FATAL: Could not start Master API", error);
        process.exit(1);
    }
};

start();