// PII Detection Patterns
const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[- ]?)?\d{10}\b/g,
    creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    apiKey: /\b(sk|pk)-[a-zA-Z0-9]{20,}\b/g,
    salary: /\$\d{1,3}(,\d{3})*(\.\d{2})?/g
};

const ADVANCED_PATTERNS = {
    // Financial
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    routingNumber: /\b\d{9}\b/g,
    swiftCode: /\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b/g,
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g,
    cryptoWallet: /\b(bc1|)[a-zA-HJ-NP-Z0-9]{25,39}\b/g,

    // Authentication
    password: /password\s*[=:]\s*['"][^'"]*['"]/gi,
    awsKey: /AKIA[0-9A-Z]{16}/g,
    azureKey: /[0-9a-zA-Z]{88}==/g,
    jwtToken: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g,
    bearerToken: /Bearer\s+[A-Za-z0-9-._~+/]+/g,

    // Infrastructure
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    privateKey: /-----BEGIN (RSA |EC |)PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |)PRIVATE KEY-----/g,
    connectionString: /(mongodb|mysql|postgres|redis):\/\/[^\s]+/g,

    // Corporate
    projectCodename: /Project\s+(Alpha|Beta|Phoenix|Titan)/gi,
    internalUrl: /(internal|corp|intranet)\.[a-z0-9-]+\.com/gi,
    employeeId: /EMP-\d{6}/g
};

const ALL_PATTERNS = { ...patterns, ...ADVANCED_PATTERNS };

// Attack Detection Patterns
const ATTACK_PATTERNS = {
    jailbreak: [
        /(ignore|forget|disregard)\s+(previous|all|your)\s+(instructions|rules)/gi,
        /DAN\s+mode/gi,
        /developer\s+mode/gi
    ],
    injection: [
        /new\s+instruction:/gi,
        /override:/gi,
        /system:/gi
    ],
    exfiltration: [
        /(show|reveal)\s+me\s+your\s+(training\s+data|system\s+prompt)/gi
    ]
};

// Token Mapping Storage
let tokenMap = {};
let tokenCounter = {};

// Helper to generate tokens
function getToken(type, value) {
    for (const [token, realValue] of Object.entries(tokenMap)) {
        if (realValue === value) return token;
    }

    if (!tokenCounter[type]) tokenCounter[type] = 1;
    const token = `[${type.toUpperCase()}_${tokenCounter[type]++}]`;
    tokenMap[token] = value;
    return token;
}

// Risk Level Logic
function getRiskLevel(type) {
    const riskMatrix = {
        CRITICAL: ['apiKey', 'awsKey', 'azureKey', 'privateKey', 'jwtToken', 'password', 'connectionString', 'bearerToken'],
        HIGH: ['ssn', 'aadhaar', 'creditCard', 'routingNumber', 'swiftCode', 'cryptoWallet', 'iban'],
        MEDIUM: ['email', 'phone', 'ipAddress', 'internalUrl', 'employeeId'],
        LOW: ['projectCodename', 'salary']
    };

    for (const [level, types] of Object.entries(riskMatrix)) {
        if (types.includes(type)) return level;
    }
    return 'LOW';
}

function calculateRiskScore(detections) {
    const weights = { CRITICAL: 100, HIGH: 50, MEDIUM: 25, LOW: 10 };
    const totalRisk = detections.reduce((sum, d) => sum + weights[d.riskLevel], 0);
    return Math.min(100, totalRisk);
}

// Attack Detection
function detectAttack(prompt) {
    const detected = [];
    for (const [attackType, patterns] of Object.entries(ATTACK_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(prompt)) {
                detected.push({
                    type: attackType,
                    severity: 'HIGH',
                    pattern: pattern.source
                });
            }
        }
    }
    return detected;
}

// Show Blocking Modal
function showBlockingModal(title, message, type = 'info', onConfirm = null) {
    // Remove existing modal
    const existing = document.getElementById('ai-safety-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ai-safety-modal';

    const color = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');

    modal.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 99999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Segoe UI', sans-serif;
        ">
            <div style="
                background: #1e1e1e; color: white; padding: 30px;
                border-radius: 12px; width: 400px; text-align: center;
                border: 2px solid ${color}; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 40px; margin-bottom: 15px;">🛡️</div>
                <h2 style="margin: 0 0 10px 0; color: ${color};">${title}</h2>
                <p style="margin-bottom: 25px; line-height: 1.5; color: #e5e5e5;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    ${onConfirm ?
            `<button id="ai-safety-confirm" style="
                            background: ${color}; border: none; padding: 10px 20px;
                            color: white; border-radius: 6px; cursor: pointer; font-weight: bold;
                        ">Proceed Anyway</button>
                        <button id="ai-safety-cancel" style="
                            background: #333; border: 1px solid #555; padding: 10px 20px;
                            color: white; border-radius: 6px; cursor: pointer;
                        ">Cancel</button>`
            :
            `<button id="ai-safety-ok" style="
                            background: ${color}; border: none; padding: 10px 20px;
                            color: white; border-radius: 6px; cursor: pointer; font-weight: bold;
                        ">Understood</button>`
        }
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    return new Promise((resolve) => {
        if (onConfirm) {
            document.getElementById('ai-safety-confirm').onclick = () => {
                modal.remove();
                resolve(true);
            };
            document.getElementById('ai-safety-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };
        } else {
            document.getElementById('ai-safety-ok').onclick = () => {
                modal.remove();
                resolve(true);
            };
        }
    });
}

// Masking Logic
function maskSensitiveData(text) {
    let maskedText = text;
    const detections = [];

    for (const [type, regex] of Object.entries(ALL_PATTERNS)) {
        maskedText = maskedText.replace(regex, (match) => {
            const token = getToken(type, match);
            if (!detections.some(d => d.token === token)) {
                detections.push({
                    type: type,
                    value: match,
                    token: token,
                    riskLevel: getRiskLevel(type)
                });
            }
            return token;
        });
    }

    const riskScore = calculateRiskScore(detections);
    return { maskedText, detections, riskScore };
}

// Unmasking Logic (Visual only)
function unmaskText(text) {
    let unmaskedText = text;
    for (const [token, realValue] of Object.entries(tokenMap)) {
        unmaskedText = unmaskedText.split(token).join(realValue);
    }
    return unmaskedText;
}

// Logging to Backend
async function logToBackend(originalPrompt, maskedPrompt, riskScore, detections, policyViolations, attacks) {
    try {
        const platform = window.location.hostname;
        const response = await fetch('http://localhost:5000/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalPrompt,
                maskedPrompt,
                platform,
                riskScore,
                riskLevel: detections.length > 0 ? detections.reduce((max, d) => {
                    const levels = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    return levels[d.riskLevel] > levels[max] ? d.riskLevel : max;
                }, 'LOW') : 'LOW',
                detections: detections.map(d => ({
                    type: d.type,
                    value: d.value,
                    token: d.token,
                    riskLevel: d.riskLevel
                })),
                policyViolations,
                attacksDetected: attacks,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Logging failed');
        }

        // Store prompt for verification (only if not blocked)
        if (!maskedPrompt.includes('[BLOCKED')) {
            recentPrompts.set(maskedPrompt, {
                originalPrompt,
                timestamp: Date.now(),
                logId: result.logId
            });

            console.log('🛡️ AI Safety: Prompt logged, waiting for AI response...', {
                maskedPrompt: maskedPrompt.substring(0, 50) + '...',
                timestamp: new Date().toLocaleTimeString()
            });

            // Clean up old prompts (keep only last 10)
            if (recentPrompts.size > 10) {
                const oldest = Array.from(recentPrompts.entries())
                    .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
                recentPrompts.delete(oldest[0]);
            }
        }
    } catch (error) {
        // Only log if it's not a network error (backend might be down)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.warn('AI Safety Firewall: Backend server may be offline. Logging skipped.');
        } else {
            console.error('AI Safety Firewall: Logging failed', error);
        }
    }
}

// Real-time detection and notification
function detectAndNotify(inputField) {
    const text = inputField.value || inputField.innerText || inputField.textContent || '';
    if (!text.trim()) return;

    // Quick check for sensitive data
    const { detections, riskScore } = maskSensitiveData(text);
    const attacks = detectAttack(text);

    if (detections.length > 0 || attacks.length > 0) {
        // Show visual indicator
        if (!inputField.dataset.aiSafetyNotified) {
            inputField.dataset.aiSafetyNotified = 'true';
            
            // Add warning badge
            const badge = document.createElement('div');
            badge.id = 'ai-safety-warning-badge';
            badge.innerHTML = `⚠️ ${detections.length} sensitive item${detections.length > 1 ? 's' : ''} detected`;
            badge.style.cssText = `
                position: absolute; top: -30px; right: 0;
                background: #f59e0b; color: white; font-size: 11px;
                padding: 4px 8px; border-radius: 4px; font-family: sans-serif;
                z-index: 10000; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
            `;
            
            // Add pulse animation
            if (!document.getElementById('ai-safety-styles')) {
                const style = document.createElement('style');
                style.id = 'ai-safety-styles';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                `;
                document.head.appendChild(style);
            }

            const parent = inputField.parentElement || inputField;
            if (parent.style.position !== 'relative' && parent.style.position !== 'absolute') {
                parent.style.position = 'relative';
            }
            parent.appendChild(badge);
        }
    }
}

// Platform-specific selectors for different AI platforms
const PLATFORM_SELECTORS = {
    // ChatGPT
    'chat.openai.com': {
        input: ['textarea#prompt-textarea', 'textarea[placeholder*="Message"]', '[contenteditable="true"]'],
        response: [
            'div[data-message-author-role="assistant"]', 
            '.markdown',
            '.group.w-full.text-token-text-primary',
            '[data-testid="conversation-turn"]'
        ],
        responseContainer: [
            '[data-testid="conversation-turn"]',
            'div[data-message-author-role="assistant"]',
            '.group.w-full'
        ]
    },
    // Perplexity
    'www.perplexity.ai': {
        input: ['textarea[placeholder*="Ask"]', 'textarea[placeholder*="anything"]'],
        response: ['.prose', '.answer-content', '[data-testid="answer"]'],
        responseContainer: '.answer-container'
    },
    // Google Gemini
    'gemini.google.com': {
        input: ['textarea[placeholder*="Enter a prompt"]', '.ql-editor', '[contenteditable="true"]'],
        response: ['.model-response-text', '.response-content', '[data-response]'],
        responseContainer: '.response-container'
    },
    // Claude (Anthropic)
    'claude.ai': {
        input: ['textarea[placeholder*="Message Claude"]', '[contenteditable="true"]'],
        response: ['.prose', '.message-content', '[data-message-type="assistant"]'],
        responseContainer: '.message-container'
    },
    // Cohere
    'cohere.com': {
        input: ['textarea', '[contenteditable="true"]'],
        response: ['.response', '.output'],
        responseContainer: '.response-container'
    },
    // Hugging Face Chat
    'huggingface.co': {
        input: ['textarea', '[contenteditable="true"]'],
        response: ['.message-content', '.response'],
        responseContainer: '.message'
    },
    // Generic fallback
    'default': {
        input: ['textarea', 'div[contenteditable="true"]', 'input[type="text"]', '[role="textbox"]'],
        response: ['.response', '.answer', '.output', '[data-role="assistant"]'],
        responseContainer: '.message, .response-container, .answer-container'
    }
};

// Get platform-specific selectors
function getPlatformSelectors() {
    const hostname = window.location.hostname;
    for (const [domain, selectors] of Object.entries(PLATFORM_SELECTORS)) {
        if (hostname.includes(domain) || hostname === domain) {
            return selectors;
        }
    }
    return PLATFORM_SELECTORS.default;
}

// Intercept Input
function setupInterception() {
    console.log("AI Safety Firewall: Starting interception engine...");

    // Find all possible input fields
    function findInputFields() {
        const selectors = getPlatformSelectors();
        const allSelectors = [];
        
        // Try platform-specific selectors first
        selectors.input.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                allSelectors.push(...Array.from(elements));
            } catch (e) {
                console.warn('Invalid selector:', selector);
            }
        });
        
        // Add generic selectors
        const genericSelectors = [
            'textarea',
            'div[contenteditable="true"]',
            'input[type="text"]',
            '[role="textbox"]',
            '#prompt-textarea',
            '[data-id="root"] textarea',
            'form textarea',
            'form input[type="text"]',
            // ChatGPT specific
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Ask"]',
            '[contenteditable="true"][data-id]',
            '.prose textarea',
            // More generic contenteditable
            '[contenteditable]:not([contenteditable="false"])'
        ];
        
        genericSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                allSelectors.push(...Array.from(elements));
            } catch (e) {
                // Ignore invalid selectors
            }
        });
        
        // Remove duplicates and filter
        const uniqueElements = [...new Set(allSelectors)];
        
        return uniqueElements.filter(el => {
            if (!el) return false;
            
            // Skip if already attached
            if (el.dataset.aiSafetyAttached === 'true') return false;
            
            // Skip hidden elements
            if (el.offsetParent === null) return false;
            
            // Skip if too small (likely not the main input)
            if (el.offsetWidth < 50 && el.offsetHeight < 20) return false;
            
            // Skip if it's inside a response container
            const isInResponse = el.closest('[data-message-author-role="assistant"]') ||
                                el.closest('.response') ||
                                el.closest('.answer');
            if (isInResponse) return false;
            
            return true;
        });
    }

    // Attach handlers to input fields
    function attachHandlers(inputField) {
        if (inputField.dataset.aiSafetyAttached === 'true') return;
        if (!inputField || !inputField.offsetParent) return; // Skip hidden elements
        
        console.log("🛡️ AI Safety Firewall: Attaching to input field", inputField);
        inputField.dataset.aiSafetyAttached = "true";

        // Visual Indicator - Green border
        inputField.style.border = "2px solid #10b981";
        inputField.style.borderRadius = "8px";
        
        // Find the best parent for badge positioning
        let parent = inputField.parentElement;
        let attempts = 0;
        while (parent && attempts < 5) {
            const computedStyle = window.getComputedStyle(parent);
            if (computedStyle.position === 'relative' || computedStyle.position === 'absolute' || 
                computedStyle.position === 'fixed' || parent.tagName === 'BODY') {
                break;
            }
            parent = parent.parentElement;
            attempts++;
        }
        
        if (!parent) parent = inputField.parentElement || inputField;
        
        // Ensure parent has relative positioning
        if (parent.style.position !== 'relative' && 
            parent.style.position !== 'absolute' && 
            parent.style.position !== 'fixed') {
            parent.style.position = "relative";
        }

        // Remove existing badge if any
        const existingBadge = parent.querySelector('.ai-safety-badge');
        if (existingBadge) existingBadge.remove();

        // Add Badge with better styling
        const badge = document.createElement('div');
        badge.className = 'ai-safety-badge';
        badge.innerHTML = "🛡️ Protected";
        badge.style.cssText = `
            position: absolute !important;
            top: -30px !important;
            right: 10px !important;
            background: #10b981 !important;
            color: white !important;
            font-size: 11px !important;
            font-weight: bold !important;
            padding: 4px 10px !important;
            border-radius: 6px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            z-index: 999999 !important;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
            pointer-events: none !important;
            white-space: nowrap !important;
        `;
        parent.appendChild(badge);

        // Also add a floating indicator near the input
        const floatingBadge = document.createElement('div');
        floatingBadge.className = 'ai-safety-floating-badge';
        floatingBadge.innerHTML = "🛡️";
        floatingBadge.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            background: #10b981 !important;
            color: white !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 24px !important;
            z-index: 999998 !important;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
            cursor: pointer !important;
            animation: pulse 2s infinite !important;
        `;
        
        // Remove existing floating badge if any
        const existingFloating = document.querySelector('.ai-safety-floating-badge');
        if (existingFloating) existingFloating.remove();
        
        document.body.appendChild(floatingBadge);

        // Real-time detection on input
        inputField.addEventListener('input', () => {
            detectAndNotify(inputField);
        });

        // Real-time detection on paste
        inputField.addEventListener('paste', (e) => {
            setTimeout(() => {
                detectAndNotify(inputField);
            }, 10);
        });

        // Attach submit handler
        inputField.addEventListener('keydown', handleInput);
    }

    // Initial scan
    findInputFields().forEach(attachHandlers);

    // Use MutationObserver to detect new input fields dynamically
    const inputObserver = new MutationObserver(() => {
        findInputFields().forEach(attachHandlers);
    });

    inputObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function handleInput(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        const inputField = e.target;
        const originalText = inputField.value || inputField.innerText || inputField.textContent || '';

        if (!originalText.trim()) return;

        // 1. Attack Detection
        const attacks = detectAttack(originalText);
        if (attacks.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            await showBlockingModal('Security Threat Detected', `This prompt contains a potential ${attacks[0].type} attack and has been blocked.`, 'error');
            await logToBackend(originalText, "[BLOCKED_ATTACK]", 100, [], [], attacks);
            return;
        }

        // 2. Masking & Risk Assessment
        const { maskedText, detections, riskScore } = maskSensitiveData(originalText);

        // 3. Policy Check (with fallback to ensure logging always happens)
        const context = { originalText, maskedText, detections, riskScore };
        
        // Helper function to process and log
        const processAndLog = async (policyViolations) => {
            const violations = policyViolations || [];
            
            // Handle Blocking Violations
            if (violations && violations.some(v => v.action === 'BLOCK')) {
                e.preventDefault();
                e.stopPropagation();
                await showBlockingModal('Policy Violation', violations[0].message, 'error');
                await logToBackend(originalText, "[BLOCKED_POLICY]", riskScore, detections, violations, []);
                return;
            }

            // Handle Warnings
            if (violations && violations.some(v => v.action === 'WARN')) {
                e.preventDefault();
                e.stopPropagation();
                const warning = violations.find(v => v.action === 'WARN');
                const proceed = await showBlockingModal('High Risk Warning', warning.message, 'warning', true);

                if (!proceed) {
                    // Log even if user cancelled
                    await logToBackend(originalText, maskedText, riskScore, detections, violations, []);
                    return;
                }
            }

            // If we got here, we proceed with masking
            if (maskedText !== originalText) {
                e.preventDefault();
                e.stopPropagation();

                // Update UI
                if (inputField.tagName === 'TEXTAREA' || inputField.tagName === 'INPUT') {
                    inputField.value = maskedText;
                } else {
                    inputField.innerText = maskedText;
                    inputField.textContent = maskedText;
                }

                // Trigger React/Framework updates
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                inputField.dispatchEvent(new Event('change', { bubbles: true }));

                // Show Success Modal (Auto-close)
                const modal = document.createElement('div');
                modal.innerHTML = `
                    <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">🛡️</span>
                        <div>
                            <div style="font-weight: bold;">Data Masked</div>
                            <div style="font-size: 12px;">${detections.length} sensitive items protected</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                setTimeout(() => modal.remove(), 3000);

                // Log
                await logToBackend(originalText, maskedText, riskScore, detections, violations, []);
            } else {
                // Log clean prompts too - ALWAYS log
                await logToBackend(originalText, maskedText, riskScore, detections, violations, []);
            }
        };

        // Try policy check, but ensure logging happens even if it fails
        try {
            chrome.runtime.sendMessage({
                action: 'checkPolicy',
                context: context
            }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Policy check failed:', chrome.runtime.lastError.message);
                    // Still process and log even if policy check fails
                    await processAndLog([]);
                } else {
                    await processAndLog(response || []);
                }
            });
        } catch (error) {
            console.warn('Policy check error:', error);
            // Fallback: process and log even if there's an error
            processAndLog([]);
        }

        // Prevent default immediately for async checks if there are detections
        const tempCheck = maskSensitiveData(originalText);
        if (tempCheck.detections.length > 0 || attacks.length > 0) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

// Store recent prompts for verification
let recentPrompts = new Map(); // maskedPrompt -> { originalPrompt, timestamp, logId }

// Response Monitoring (Unmasking + Verification)
function setupResponseMonitoring() {
    const selectors = getPlatformSelectors();
    let lastResponseCount = 0;
    let checkedResponses = new Set(); // Track which responses we've already verified
    let checkingForResponse = false;

    const checkForNewResponse = async () => {
        if (checkingForResponse) return;
        checkingForResponse = true;

        try {
            // Find response containers using platform-specific selectors
            // ChatGPT specific selectors
            const chatgptSelectors = [
                ...document.querySelectorAll('[data-message-author-role="assistant"]'),
                ...document.querySelectorAll('.group.w-full.text-token-text-primary'),
                ...document.querySelectorAll('.markdown.prose'),
                ...document.querySelectorAll('[data-testid="conversation-turn"]')
            ];

            // Generic selectors
            const genericSelectors = [
                ...selectors.response.map(s => {
                    try {
                        return document.querySelectorAll(s);
                    } catch (e) {
                        return [];
                    }
                }),
                ...document.querySelectorAll('.response'),
                ...document.querySelectorAll('.answer'),
                ...document.querySelectorAll('.message-content'),
                ...document.querySelectorAll('[data-role="assistant"]'),
                ...document.querySelectorAll('.ai-response'),
                ...document.querySelectorAll('.assistant-message')
            ].flat();

            const allResponses = [...chatgptSelectors, ...genericSelectors];
            const currentResponseCount = allResponses.length;

            // If new response detected
            if (currentResponseCount > lastResponseCount && recentPrompts.size > 0) {
                const newResponses = Array.from(allResponses).slice(lastResponseCount);
                
                for (const responseElement of newResponses) {
                    if (!responseElement) continue;
                    
                    // Create a unique ID for this response
                    const responseId = responseElement.getAttribute('data-verification-id') || 
                                     responseElement.innerText?.substring(0, 50) || 
                                     Math.random().toString();
                    
                    // Skip if we've already checked this response
                    if (checkedResponses.has(responseId)) continue;
                    
                    // Get response text - wait a bit for content to load
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const responseText = responseElement.innerText || responseElement.textContent || '';
                    
                    if (responseText.trim() && responseText.length > 20) {
                        // Find the most recent prompt (within last 2 minutes)
                        const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
                        const recentPrompt = Array.from(recentPrompts.entries())
                            .filter(([_, data]) => data.timestamp > twoMinutesAgo)
                            .sort((a, b) => b[1].timestamp - a[1].timestamp)[0];

                        if (recentPrompt) {
                            const [maskedPrompt, promptData] = recentPrompt;
                            
                            console.log('🛡️ AI Safety: Detected new response, triggering verification...');
                            
                            // Mark as checked
                            checkedResponses.add(responseId);
                            responseElement.setAttribute('data-verification-id', responseId);
                            
                            // Trigger verification
                            chrome.runtime.sendMessage({
                                action: 'verifyResponse',
                                data: {
                                    aiResponse: responseText,
                                    maskedPrompt: maskedPrompt
                                }
                            }, (result) => {
                                if (result && !result.error) {
                                    console.log('✅ Verification completed:', result);
                                } else {
                                    console.error('❌ Verification failed:', result?.error || 'Unknown error');
                                }
                            });

                            // Remove from recent prompts after verification
                            recentPrompts.delete(maskedPrompt);
                            break; // Only verify one response at a time
                        }
                    }
                }

                lastResponseCount = currentResponseCount;
            }
        } catch (error) {
            console.error('Response monitoring error:', error);
        } finally {
            checkingForResponse = false;
        }
    };

    // Monitor for new responses
    const responseObserver = new MutationObserver(() => {
        checkForNewResponse();
    });

    responseObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Also check periodically (more frequently)
    setInterval(checkForNewResponse, 1500);
    
    // Initial check
    setTimeout(checkForNewResponse, 2000);
    
    console.log('🛡️ AI Safety: Response monitoring initialized');
}

// Response Monitoring (Unmasking)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element
                if (node.innerText && node.innerText.includes('[')) {
                    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
                    let textNode;
                    while (textNode = walker.nextNode()) {
                        if (Object.keys(tokenMap).some(token => textNode.nodeValue.includes(token))) {
                            textNode.nodeValue = unmaskText(textNode.nodeValue);
                        }
                    }
                }
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initialize
function initializeExtension() {
    console.log("🛡️ AI Safety Firewall: Initializing...");
    
    // Setup interception
    setupInterception();
    
    // Setup response monitoring
    setupResponseMonitoring();
    
    // Retry for dynamically loaded content (like ChatGPT)
    setTimeout(() => {
        console.log("🛡️ AI Safety: Retrying to find input fields...");
        setupInterception();
    }, 2000);
    
    setTimeout(() => {
        console.log("🛡️ AI Safety: Final retry for input fields...");
        setupInterception();
    }, 5000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Also initialize after a short delay for dynamically loaded content
setTimeout(initializeExtension, 1000);

console.log("🛡️ AI Safety Firewall Active");
