const mongoose = require('mongoose');

// Subdocument schema for detections
const DetectionSchema = new mongoose.Schema({
    type: { type: String },
    value: { type: String },
    token: { type: String },
    riskLevel: { type: String }
}, { _id: false });

// Subdocument schema for attacks
const AttackSchema = new mongoose.Schema({
    type: { type: String },
    severity: { type: String },
    pattern: { type: String }
}, { _id: false });

const LogSchema = new mongoose.Schema({
    originalPrompt: {
        type: String,
        required: true
    },
    maskedPrompt: {
        type: String,
        required: true
    },
    aiResponse: {
        type: String
    },
    verificationResult: {
        status: {
            type: String,
            enum: ['verified', 'warning', 'error', 'pending'],
            default: 'pending'
        },
        secondModelResponse: String,
        confidence: Number
    },
    platform: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    riskLevel: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        default: 'LOW'
    },
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    detections: [DetectionSchema],
    policyViolations: [{
        policyId: String,
        policyName: String,
        action: String,
        message: String,
        severity: String
    }],
    attacksDetected: [AttackSchema],
    userId: String,
    department: String
});

LogSchema.index({ riskLevel: 1, timestamp: -1 });
LogSchema.index({ userId: 1 });

module.exports = mongoose.model('Log', LogSchema);
