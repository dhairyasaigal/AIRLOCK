// Background Service Worker

class PolicyEngine {
    constructor() {
        this.policies = this.getDefaultPolicies();
    }

    getDefaultPolicies() {
        return [
            {
                id: 'block-critical-high-risk',
                name: 'Block Critical Data',
                condition: (context) => context.riskScore >= 90,
                action: 'BLOCK',
                message: 'Critical sensitive data detected. Prompt blocked for security.',
                severity: 'CRITICAL'
            },
            {
                id: 'warn-high-risk',
                name: 'Warn High Risk',
                condition: (context) => context.riskScore >= 50 && context.riskScore < 90,
                action: 'WARN',
                message: 'High-risk data detected. Proceed with caution.',
                severity: 'HIGH'
            },
            {
                id: 'block-aws-keys',
                name: 'Block AWS Keys',
                condition: (context) => context.detections && context.detections.some(d => d.type === 'awsKey'),
                action: 'BLOCK',
                message: 'AWS credentials detected. Cannot share with public AI.',
                severity: 'CRITICAL'
            }
        ];
    }

    evaluatePolicy(context) {
        const violations = [];
        for (const policy of this.policies) {
            try {
                if (policy.condition(context)) {
                    violations.push({
                        policyId: policy.id,
                        policyName: policy.name,
                        action: policy.action,
                        message: policy.message,
                        severity: policy.severity
                    });
                }
            } catch (e) {
                console.error('Policy evaluation error:', e);
            }
        }
        return violations;
    }
}

const policyEngine = new PolicyEngine();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'verifyResponse') {
        handleVerification(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Will respond asynchronously
    }

    if (request.action === 'checkPolicy') {
        try {
            const violations = policyEngine.evaluatePolicy(request.context);
            sendResponse(violations || []);
        } catch (error) {
            console.error('Policy check error:', error);
            sendResponse([]); // Return empty array on error
        }
        return true; // Indicate we will send a response
    }
});

async function handleVerification(data) {
    const { aiResponse, maskedPrompt } = data;

    try {
        const response = await fetch('http://localhost:5000/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aiResponse,
                maskedPrompt
            })
        });

        if (!response.ok) {
            throw new Error('Verification failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Verification error:', error);
        return { error: error.message };
    }
}
