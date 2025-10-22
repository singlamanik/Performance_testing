const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    const status = 'ok';
    const uptime = process.uptime();
    const timestamp = new Date();
    const availableEndpoints = ['/health']; // Add more endpoints as needed

    res.json({
        status,
        uptime,
        timestamp,
        availableEndpoints
    });
});

module.exports = router;