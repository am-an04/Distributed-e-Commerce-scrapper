const express = require('express');
const router = express.Router();
const { initiateSearch, getLatestResults } = require('../services/searchService');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Trigger the distributed scraping (Requires Authentication)
router.post('/search', authMiddleware, async (req, res) => {
    try {
        const { productName } = req.body;
        if (!productName) return res.status(400).json({ error: "Product name is required" });

        // Call the service to push tasks to Redis
        const searchInfo = await initiateSearch(productName);
        
        res.status(202).json({
            message: `Search initiated for ${productName}`,
            active_tasks: typeof searchInfo === 'number' ? searchInfo : searchInfo.count,
            dispatched_stores: searchInfo.stores || []
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET: Retrieve results for the Frontend
router.get('/results', async (req, res) => {
    try {
        const results = await getLatestResults();
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Could not retrieve results" });
    }
});

module.exports = router;
