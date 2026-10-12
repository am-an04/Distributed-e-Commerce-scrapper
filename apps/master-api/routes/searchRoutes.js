const express = require('express');
const router = express.Router();
const { initiateSearch, getLatestResults } = require('../services/searchService');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'antigravity_distributed_scraper_jwt_secret_2026';

// Optional auth middleware: allows public searches while populating req.user if token is provided
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token, getJwtSecret());
        }
    } catch (_) {}
    next();
};

// POST: Trigger distributed scraping for the requested product
router.post('/search', optionalAuth, async (req, res) => {
    try {
        const { productName } = req.body;
        if (!productName || !productName.trim()) {
            return res.status(400).json({ error: "Product name is required" });
        }

        // Call the service to push tasks to Redis
        const searchInfo = await initiateSearch(productName.trim());
        
        res.status(202).json({
            message: `Search initiated for ${productName}`,
            searchId: searchInfo.searchId,
            active_tasks: typeof searchInfo === 'number' ? searchInfo : searchInfo.count,
            dispatched_stores: searchInfo.stores || []
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET: Retrieve results for the Frontend (requires searchId)
router.get('/results', async (req, res) => {
    try {
        const { searchId } = req.query;
        const results = await getLatestResults(searchId);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Could not retrieve results" });
    }
});

module.exports = router;
