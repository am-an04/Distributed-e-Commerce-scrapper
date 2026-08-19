const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, index: true },
    area: { type: String, required: true },
    cuisine: [{ type: String }],
    rating: { type: Number, default: 4.0 },
    priceForTwo: { type: Number, required: true },
    image: { type: String },
    availableTables: { type: Number, default: 4 },
    distanceKm: { type: Number, default: 1.5 },
    openingHours: { type: String, default: '11:00 AM - 11:00 PM' },
    features: [{ type: String }],
    address: { type: String }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
