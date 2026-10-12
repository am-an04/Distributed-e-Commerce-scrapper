const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // One-time migration: drop legacy unique url_1 index from products if present
        try {
            await mongoose.connection.collection('products').dropIndex('url_1');
            console.log('🧹 One-time migration: dropped legacy url_1 index');
        } catch (idxErr) {
            // IndexNotFound (code 27) is expected once dropped
        }
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;