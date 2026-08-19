const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await registerUser({ name, email, password });
        res.status(201).json({
            message: 'Account created successfully',
            ...result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST: Authenticate user login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        res.status(200).json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET: Fetch current user profile (Protected route)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await getUserProfile(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

module.exports = router;
