const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// GET /api/logs/:id
router.get('/:id', async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ success: false, error: 'Log not found' });
        }
        res.json(log);
    } catch (error) {
        console.error('Error fetching log:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
