const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, index: true },
    area: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    pricePerNight: { type: Number, required: true },
    image: { type: String },
    availableRooms: { type: Number, default: 5 },
    distanceKm: { type: Number, default: 2.0 },
    amenities: [{ type: String }],
    address: { type: String }
});

module.exports = mongoose.model('Hotel', HotelSchema);
