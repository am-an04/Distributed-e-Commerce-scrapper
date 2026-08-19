const express = require('express');
const cors = require('cors');
const connectDB = require('../../libs/database/connection');
const { connectRedis } = require('../../libs/redis/client');
const searchRoutes = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const priceAlertRoutes = require('./routes/priceAlertRoutes');

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Routes
app.use('/api/auth', authRoutes);
app.use('/api/user/price-alerts', priceAlertRoutes);
app.use('/api/user', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', searchRoutes);

// 3. Server Initialization
const start = async () => {
    try {
        await connectDB();
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