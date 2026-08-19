const mongoose = require('mongoose');

const HotelBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    hotelName: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    guests: { type: Number, required: true, default: 2 },
    rooms: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'CONFIRMED' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HotelBooking', HotelBookingSchema);
