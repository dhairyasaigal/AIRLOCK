# AI Safety Firewall - Complete Technical Workflow

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Browser       │         │   Backend API    │         │   Dashboard     │
│   Extension     │◄───────►│   (Express.js)   │◄───────►│   (React/Vite)  │
│   (Content.js)  │         │   Port: 5000     │         │   Port: 5173    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│  Background.js  │         │   MongoDB        │
│  (Policy Engine) │         │   Database       │
└─────────────────┘         └──────────────────┘
```

---

## 📋 Component Breakdown

### 1. **Browser Extension** (`ai-safety-firewall/extension/`)

#### **manifest.json**
- Defines extension permissions and structure
- Content scripts injection points
- Background service worker

#### **content.js** (Main Interception Engine)
- **Location**: Injected into every webpage
- **Purpose**: Real-time monitoring and protection

**Key Functions:**
1. **Input Field Detection**
   - Scans for textareas, contenteditable divs, input fields
   - Platform-specific selectors for ChatGPT, Gemini, Claude, etc.
   - MutationObserver for dynamically loaded content

2. **Sensitive Data Detection**
   - **Pattern Matching**: 30+ regex patterns for:
     - PII: Email, Phone, SSN, Aadhaar
     - Financial: Credit Cards, Bank Accounts, Crypto Wallets
     - Authentication: API Keys, Passwords, JWT Tokens
     - Corporate: Employee IDs, Internal URLs
   
3. **Data Masking**
   - Replaces sensitive data with tokens: `[EMAIL_1]`, `[PHONE_1]`
   - Maintains token mapping for unmasking responses
   - Preserves context while protecting data

4. **Attack Detection**
   - Jailbreak attempts
   - Prompt injection
   - Data exfiltration attempts

5. **Visual Indicators**
   - Green border around protected input fields
   - "🛡️ Protected" badge
   - Floating shield icon
   - Warning badges for detected sensitive data

6. **Response Monitoring**
   - Detects AI responses using platform-specific selectors
   - Automatically triggers verification
   - Unmasks tokens in responses for user viewing

#### **background.js** (Policy Engine)
- **Location**: Service Worker (runs in background)
- **Purpose**: Policy evaluation and verification coordination

**Key Functions:**
1. **Policy Evaluation**
   - Risk-based blocking (CRITICAL, HIGH, MEDIUM, LOW)
   - Custom policy rules
   - Violation detection

2. **Verification Coordination**
   - Receives verification requests from content script
   - Forwards to backend API
   - Returns results to content script

#### **popup.js/popup.html**
- Extension popup UI
- Shows statistics
- Dashboard navigation button

---

### 2. **Backend API** (`ai-safety-firewall/backend/`)

#### **server.js** (Express Server)
- **Port**: 5000
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)

**Endpoints:**
```
GET  /                    - Health check
POST /api/log             - Log prompt/interaction
GET  /api/logs            - Get all logs
GET  /api/logs/:id        - Get specific log
POST /api/verify          - Verify AI response
```

#### **routes/log.js** (Logging Route)
**POST /api/log**
- Receives: `originalPrompt`, `maskedPrompt`, `detections`, `riskScore`, etc.
- Validates data against schema
- Saves to MongoDB
- Returns: `{ success: true, logId: ... }`

**Data Structure:**
```javascript
{
  originalPrompt: String,
  maskedPrompt: String,
  platform: String,
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  riskScore: Number (0-100),
  detections: [{
    type: String,
    value: String,
    token: String,
    riskLevel: String
  }],
  policyViolations: [...],
  attacksDetected: [...],
  timestamp: Date
}
```

#### **routes/verify.js** (Verification Route)
**POST /api/verify**
- Receives: `aiResponse`, `maskedPrompt`
- Finds matching log entry
- Calls Gemini API for verification
- Compares Primary AI response vs Gemini response
- Calculates similarity score
- Updates log with verification result

**Verification Process:**
1. Send masked prompt to Gemini API
2. Get Gemini's response
3. Calculate text similarity (word overlap)
4. Determine status:
   - **VERIFIED**: >75% similarity
   - **WARNING**: 55-75% similarity
   - **ERROR**: <55% similarity
5. Store result in log

#### **routes/logs.js** (Log Retrieval)
**GET /api/logs**
- Fetches all logs from MongoDB
- Sorted by timestamp (newest first)
- Limited to 100 most recent
- Returns array of log objects

#### **models/Log.js** (MongoDB Schema)
- Defines data structure
- Validation rules
- Indexes for performance

---

### 3. **Dashboard** (`dashboard/`)

#### **App.jsx** (Main Component)
- **Framework**: React 19
- **State Management**: useState, useEffect
- **API Client**: Axios

**Features:**
1. **Real-time Updates**
   - Polls `/api/logs` every 5 seconds
   - Auto-refreshes log list
   - Updates statistics

2. **Connection Status**
   - Shows backend connection state
   - Error messages with retry button
   - Visual indicators (green/red)

3. **Statistics Display**
   - Total Prompts
   - High Risk Count
   - Verified Responses

4. **Risk Distribution Chart**
   - Pie chart (Recharts library)
   - Shows CRITICAL, HIGH, MEDIUM, LOW distribution

#### **components/LogsList.jsx**
- Displays list of all logs
- Color-coded risk badges
- Click to view details
- Timestamps

#### **components/LogDetail.jsx**
- Shows full log details:
  - Original Prompt
  - Masked Prompt
  - AI Response
  - Verification Result
  - Similarity scores
  - Gemini response (if available)

---

## 🔄 Complete Workflow

### **Phase 1: User Input Detection**

```
1. User visits AI platform (ChatGPT, Gemini, etc.)
   ↓
2. Extension content.js injected into page
   ↓
3. setupInterception() scans for input fields
   ↓
4. Input field found → attachHandlers() called
   ↓
5. Visual indicators added:
   - Green border
   - "🛡️ Protected" badge
   - Floating shield icon
```

### **Phase 2: Real-time Monitoring**

```
6. User types in input field
   ↓
7. detectAndNotify() called on each keystroke
   ↓
8. Quick pattern matching for sensitive data
   ↓
9. If detected → Show warning badge
```

### **Phase 3: Prompt Submission**

```
10. User presses Enter (submit)
    ↓
11. handleInput() intercepts the event
    ↓
12. Attack Detection:
    - Scans for jailbreak patterns
    - If attack found → Block & Log
    ↓
13. Data Masking:
    - maskSensitiveData() processes text
    - Replaces sensitive data with tokens
    - Returns: { maskedText, detections, riskScore }
    ↓
14. Policy Check:
    - Sends context to background.js
    - PolicyEngine evaluates rules
    - Returns violations
    ↓
15. Decision Tree:
    ├─ BLOCK violation → Show error modal, log, stop
    ├─ WARN violation → Show warning modal, user confirms
    └─ No violation → Continue
    ↓
16. If proceeding:
    - Replace input field value with masked text
    - Trigger framework events (React/Vue updates)
    - Show success notification
```

### **Phase 4: Logging to Backend**

```
17. logToBackend() called
    ↓
18. POST request to http://localhost:5000/api/log
    ↓
19. Backend validates and saves to MongoDB
    ↓
20. Store masked prompt in recentPrompts Map
    (for verification matching)
    ↓
21. Success → Continue
```

### **Phase 5: AI Response Detection**

```
22. AI generates response
    ↓
23. setupResponseMonitoring() detects new response
    (checks every 1.5 seconds)
    ↓
24. Response element found using platform selectors
    ↓
25. Extract response text
    ↓
26. Match with recent prompt (within 2 minutes)
    ↓
27. If match found → Trigger verification
```

### **Phase 6: Verification Process**

```
28. chrome.runtime.sendMessage({ action: 'verifyResponse' })
    ↓
29. background.js receives message
    ↓
30. POST to http://localhost:5000/api/verify
    ↓
31. Backend finds matching log entry
    ↓
32. Call Gemini API:
    - Send masked prompt to Gemini
    - Get Gemini's response
    ↓
33. Calculate Similarity:
    - Compare Primary AI response vs Gemini response
    - Word overlap algorithm
    - Similarity score (0-1)
    ↓
34. Determine Status:
    - >75% → VERIFIED
    - 55-75% → WARNING
    - <55% → ERROR
    ↓
35. Update MongoDB log:
    - aiResponse: Primary AI response
    - verificationResult: { status, confidence, similarities }
    ↓
36. Return result to extension
```

### **Phase 7: Response Unmasking**

```
37. Response displayed to user
    ↓
38. MutationObserver detects new content
    ↓
39. unmaskText() processes response
    ↓
40. Replaces tokens with original values
    (e.g., [EMAIL_1] → user@example.com)
    ↓
41. User sees unmasked response
```

### **Phase 8: Dashboard Display**

```
42. Dashboard polls /api/logs every 5 seconds
    ↓
43. Fetches all logs from MongoDB
    ↓
44. Updates UI:
    - Log list
    - Statistics
    - Risk distribution chart
    ↓
45. User clicks log entry
    ↓
46. LogDetail component shows:
    - Original prompt
    - Masked prompt
    - AI response
    - Verification status
    - Confidence score
    - Similarity details
```

---

## 🔐 Security Features

### **Data Protection**
- **Tokenization**: Sensitive data replaced with tokens
- **In-memory mapping**: Token → Original value (not persisted)
- **Automatic unmasking**: Only in user's browser

### **Attack Prevention**
- **Jailbreak detection**: Blocks prompt manipulation
- **Injection detection**: Prevents system prompt injection
- **Exfiltration detection**: Blocks data extraction attempts

### **Policy Enforcement**
- **Risk-based blocking**: CRITICAL/HIGH risk auto-blocked
- **Configurable policies**: Custom rules in background.js
- **Warning system**: User confirmation for medium risk

---

## 📊 Data Flow Diagram

```
User Input
    │
    ├─► [Content Script] ──► Pattern Matching ──► Detection
    │                           │
    │                           ├─► Attack? ──► BLOCK
    │                           │
    │                           ├─► Sensitive Data? ──► Mask
    │                           │
    │                           └─► Clean ──► Log
    │
    ├─► [Masked Text] ──► AI Platform ──► AI Response
    │
    ├─► [Logging] ──► Backend API ──► MongoDB
    │
    └─► [Response] ──► Verification ──► Gemini API
                          │
                          └─► Similarity ──► Status Update
                                              │
                                              └─► Dashboard
```

---

## 🛠️ Technology Stack

### **Extension**
- **Language**: JavaScript (ES6+)
- **APIs**: Chrome Extension APIs
- **Pattern Matching**: Regex
- **DOM Manipulation**: Native JavaScript

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **HTTP Client**: Axios (for Gemini API)

### **Dashboard**
- **Framework**: React 19
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Styling**: CSS Modules

---

## 🔧 Configuration

### **Environment Variables** (`.env` in backend/)
```env
MONGODB_URI=mongodb://localhost:27017/ai-safety-firewall
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

### **Extension Permissions** (manifest.json)
- `activeTab`: Access to current tab
- `storage`: Local storage for stats
- Host permissions for AI platforms

---

## 🚀 Deployment Flow

### **Development**
1. Start MongoDB: `mongod`
2. Start Backend: `cd backend && npm start`
3. Start Dashboard: `cd dashboard && npm run dev`
4. Load Extension: `chrome://extensions/` → Load unpacked

### **Production** (Future)
- Backend: Deploy to cloud (Heroku, AWS, etc.)
- Dashboard: Build with `npm run build`, deploy to static hosting
- Extension: Publish to Chrome Web Store

---

## 📈 Performance Optimizations

1. **Debouncing**: Input detection throttled
2. **Caching**: Token map in memory
3. **Lazy Loading**: Components load on demand
4. **Polling**: Dashboard polls every 5s (configurable)
5. **Indexing**: MongoDB indexes on timestamp, riskLevel

---

## 🐛 Error Handling

- **Network Errors**: Graceful degradation, retry logic
- **API Failures**: Fallback to pending status
- **Missing Keys**: Verification shows "unavailable"
- **Extension Errors**: Console logging, non-blocking

---

## 📝 Key Algorithms

### **Similarity Calculation**
```javascript
function calculateSimilarity(text1, text2) {
    words1 = text1.toLowerCase().split(/\s+/)
    words2 = text2.toLowerCase().split(/\s+/)
    commonWords = words1.filter(word => words2.includes(word))
    return (2 * commonWords.length) / (words1.length + words2.length)
}
```

### **Risk Score Calculation**
```javascript
weights = { CRITICAL: 100, HIGH: 50, MEDIUM: 25, LOW: 10 }
totalRisk = detections.reduce((sum, d) => sum + weights[d.riskLevel], 0)
riskScore = Math.min(100, totalRisk)
```

---

## 🎯 Future Enhancements

1. **Multi-model verification**: Add more AI models
2. **Real-time dashboard**: WebSocket updates
3. **User authentication**: Multi-user support
4. **Custom policies**: UI for policy management
5. **Analytics**: Advanced reporting and insights
6. **Export**: CSV/PDF export of logs

---

## 📚 File Structure

```
hack3/
├── ai-safety-firewall/
│   ├── backend/
│   │   ├── models/
│   │   │   └── Log.js
│   │   ├── routes/
│   │   │   ├── log.js
│   │   │   ├── logs.js
│   │   │   └── verify.js
│   │   ├── server.js
│   │   └── package.json
│   └── extension/
│       ├── background.js
│       ├── content.js
│       ├── popup.js
│       ├── popup.html
│       ├── manifest.json
│       └── styles.css
└── dashboard/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── LogsList.jsx
    │   │   └── LogDetail.jsx
    │   └── main.jsx
    └── package.json
```

---

This is the complete technical workflow of your AI Safety Firewall project! 🛡️

