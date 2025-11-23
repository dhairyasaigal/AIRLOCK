const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// POST /api/log
router.post('/', async (req, res) => {
    try {
        const {
            originalPrompt,
            maskedPrompt,
            platform,
            riskScore,
            riskLevel,
            detections,
            policyViolations,
            attacksDetected,
            userId,
            department
        } = req.body;

        // Fallback risk calculation if not provided (backward compatibility)
        const finalRiskLevel = riskLevel || (originalPrompt !== maskedPrompt ? 'HIGH' : 'LOW');

        // Ensure detections is properly formatted
        const formattedDetections = (detections || []).map(d => ({
            type: d.type || d.detectionType,
            value: d.value,
            token: d.token,
            riskLevel: d.riskLevel
        }));

        // Ensure attacksDetected is properly formatted
        const formattedAttacks = (attacksDetected || []).map(a => ({
            type: a.type || a.attackType,
            severity: a.severity,
            pattern: a.pattern
        }));

        const newLog = new Log({
            originalPrompt,
            maskedPrompt,
            platform,
            riskScore: riskScore || 0,
            riskLevel: finalRiskLevel,
            detections: formattedDetections,
            policyViolations: policyViolations || [],
            attacksDetected: formattedAttacks,
            userId,
            department
        });

        const savedLog = await newLog.save();

        res.status(201).json({
            success: true,
            logId: savedLog._id,
            riskScore: savedLog.riskScore
        });
    } catch (error) {
        console.error('Error logging prompt:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// GET /api/log/analytics/risk
router.get('/analytics/risk', async (req, res) => {
    try {
        const distribution = await Log.aggregate([
            {
                $group: {
                    _id: '$riskLevel',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ success: true, distribution });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
