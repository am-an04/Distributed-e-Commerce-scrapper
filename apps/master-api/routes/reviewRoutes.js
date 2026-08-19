const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getReviews,
    createReview,
    upvoteReview
} = require('../services/reviewService');

// GET: Fetch user reviews & stats
router.get('/', async (req, res) => {
    try {
        const { type, rating, query } = req.query;
        const result = await getReviews({ type, rating, query });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Submit feedback / fault report (Protected route)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, rating, title, comment } = req.body;
        
        const newReview = await createReview({
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            type,
            rating,
            title,
            comment
        });

        res.status(201).json({
            message: 'Feedback submitted successfully! Thank you for helping us improve. ❤️',
            review: newReview
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST: Upvote review
router.post('/:id/upvote', async (req, res) => {
    try {
        const updated = await upvoteReview(req.params.id);
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
