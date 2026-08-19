const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    searchRestaurants,
    createReservation,
    getUserReservations
} = require('../services/restaurantService');

// GET: Search restaurants by location, query, cuisine, availability
router.get('/', async (req, res) => {
    try {
        const { query, location, cuisine, availableOnly, maxPrice } = req.query;
        const results = await searchRestaurants({
            query,
            location,
            cuisine,
            availableOnly: availableOnly === 'true',
            maxPrice
        });
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Reserve a table (Protected route)
router.post('/reserve', authMiddleware, async (req, res) => {
    try {
        const { restaurantId, date, time, guests } = req.body;
        if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID is required' });

        const result = await createReservation({
            userId: req.user.id,
            restaurantId,
            date,
            time,
            guests
        });

        res.status(201).json({
            message: 'Table reserved successfully! 🎉',
            ...result
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET: Fetch user's table reservations (Protected route)
router.get('/my-reservations', authMiddleware, async (req, res) => {
    try {
        const reservations = await getUserReservations(req.user.id);
        res.status(200).json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
