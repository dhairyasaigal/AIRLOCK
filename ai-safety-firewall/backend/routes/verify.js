const express = require('express');
const router = express.Router();
const axios = require('axios');
const Log = require('../models/Log');

// Helper for text similarity
function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return (2 * commonWords.length) / (words1.length + words2.length);
}

async function callGemini(prompt) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        return "Gemini verification unavailable (No API Key)";
    }

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            timeout: 10000
        });
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        return `Gemini Error: ${error.response?.data?.error?.message || error.message}`;
    }
}

async function multiModelVerification(prompt, primaryResponse) {
    try {
        // Get Gemini's response for verification
        const geminiResponse = await callGemini(prompt).catch(e => {
            console.error('Gemini call failed:', e.message);
            return `Gemini Error: ${e.message}`;
        });

        // Check if Gemini is available
        const isGeminiAvailable = geminiResponse && 
                                   !geminiResponse.includes('unavailable') && 
                                   !geminiResponse.includes('Error');

        if (!isGeminiAvailable) {
            // If Gemini is not available, return pending status
            return {
                status: 'pending',
                confidence: '0%',
                message: 'Gemini verification unavailable. Please add GEMINI_API_KEY to .env file.',
                secondModelResponse: geminiResponse
            };
        }

        // Calculate similarity between primary response and Gemini response
        const similarity = calculateSimilarity(primaryResponse, geminiResponse);
        const avgSimilarity = similarity; // Only one comparison now

        // Determine status based on similarity
        let status, confidence;
        if (avgSimilarity > 0.75) {
            status = 'verified';
            confidence = avgSimilarity;
        } else if (avgSimilarity > 0.55) {
            status = 'warning';
            confidence = avgSimilarity;
        } else {
            status = 'error';
            confidence = avgSimilarity;
        }

        return {
            status,
            confidence: (confidence * 100).toFixed(1) + '%',
            models: ['Primary AI', 'Gemini'],
            similarities: {
                'Primary-Gemini': (similarity * 100).toFixed(1) + '%'
            },
            consensus: similarity > 0.7 ? '2/2 models agree' : 'Models disagree',
            secondModelResponse: geminiResponse,
            primaryResponse: primaryResponse.substring(0, 200) + '...' // Preview for debugging
        };
    } catch (error) {
        console.error('Multi-model verification failed:', error);
        return { 
            status: 'error', 
            confidence: '0%', 
            error: error.message,
            message: 'Verification failed due to an error'
        };
    }
}

// POST /api/verify
router.post('/', async (req, res) => {
    try {
        const { aiResponse, maskedPrompt } = req.body;

        if (!aiResponse || !maskedPrompt) {
            return res.status(400).json({ success: false, error: 'Missing aiResponse or maskedPrompt' });
        }

        // Find the most recent log for this prompt (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const log = await Log.findOne({ 
            maskedPrompt: maskedPrompt,
            timestamp: { $gte: fiveMinutesAgo }
        }).sort({ timestamp: -1 });

        // If not found, try without time constraint (for testing)
        const logToUpdate = log || await Log.findOne({ maskedPrompt }).sort({ timestamp: -1 });

        if (!logToUpdate) {
            console.warn('Log not found for verification:', maskedPrompt.substring(0, 50));
            // Still perform verification and return result
            const verification = await multiModelVerification(maskedPrompt, aiResponse);
            return res.json({
                success: true,
                verification: verification,
                note: 'Log not found, verification performed anyway'
            });
        }

        // Use enhanced multi-model verification
        const verification = await multiModelVerification(maskedPrompt, aiResponse);

        // Update Log
        logToUpdate.aiResponse = aiResponse;
        logToUpdate.verificationResult = verification;
        await logToUpdate.save();

        res.json({
            success: true,
            verification: logToUpdate.verificationResult
        });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, error: 'Server Error', details: error.message });
    }
});

module.exports = router;
