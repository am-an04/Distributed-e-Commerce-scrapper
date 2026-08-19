const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    searchHotels,
    bookHotelRoom,
    getUserHotelBookings
} = require('../services/hotelService');

// GET: Search hotels by location, query, amenity, availability
router.get('/', async (req, res) => {
    try {
        const { query, location, amenity, availableOnly, maxPrice } = req.query;
        const results = await searchHotels({
            query,
            location,
            amenity,
            availableOnly: availableOnly === 'true',
            maxPrice
        });
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Book a room (Protected route)
router.post('/book', authMiddleware, async (req, res) => {
    try {
        const { hotelId, checkIn, checkOut, guests, rooms } = req.body;
        if (!hotelId) return res.status(400).json({ error: 'Hotel ID is required' });

        const result = await bookHotelRoom({
            userId: req.user.id,
            hotelId,
            checkIn,
            checkOut,
            guests,
            rooms
        });

        res.status(201).json({
            message: 'Room booked successfully! 🏨',
            ...result
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET: Fetch user's hotel bookings (Protected route)
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await getUserHotelBookings(req.user.id);
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
