# 🛡️ AI Safety Firewall - Enterprise Edition

> **Protect sensitive data and prevent security threats when interacting with AI platforms**

AI Safety Firewall is a comprehensive browser extension that automatically detects, masks, and monitors sensitive information before it's sent to AI platforms like ChatGPT, Gemini, Claude, and Perplexity. It provides real-time protection, policy enforcement, and multi-model verification to ensure enterprise-grade security.

---

## ✨ Features

### 🔒 **Data Protection**
- **30+ Detection Patterns**: Automatically detects PII, financial data, authentication credentials, and corporate information
- **Smart Masking**: Replaces sensitive data with tokens while preserving context
- **Real-time Monitoring**: Instant detection as you type
- **Automatic Unmasking**: Safely reveals original data in AI responses

### 🚨 **Threat Prevention**
- **Attack Detection**: Blocks jailbreak attempts, prompt injection, and data exfiltration
- **Policy Enforcement**: Risk-based blocking and warning system
- **Multi-model Verification**: Compares AI responses with Gemini for accuracy validation

### 📊 **Enterprise Dashboard**
- **Real-time Monitoring**: Live view of all interactions
- **Risk Analytics**: Visual risk distribution and statistics
- **Verification Status**: Track response verification across all interactions
- **Activity Logs**: Complete audit trail with timestamps

### 🎯 **Platform Support**
- ✅ ChatGPT (chat.openai.com)
- ✅ Google Gemini (gemini.google.com)
- ✅ Perplexity (www.perplexity.ai)
- ✅ Claude (claude.ai)
- ✅ Cohere (cohere.com)
- ✅ Hugging Face Chat (huggingface.co)
- ✅ Generic fallback for other AI platforms

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **Chrome/Edge Browser**
- **Gemini API Key** (optional, for verification)

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hack3
```

#### 2. Backend Setup

```bash
cd ai-safety-firewall/backend
npm install
```

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/ai-safety-firewall
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste into `.env` file

#### 3. Start MongoDB

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

#### 4. Start Backend Server

```bash
cd ai-safety-firewall/backend
npm start
```

You should see:
```
MongoDB Connected
Server running on port 5000
```

#### 5. Dashboard Setup

```bash
cd dashboard
npm install
npm run dev
```

Dashboard will be available at `http://localhost:5173`

#### 6. Load Extension

1. Open Chrome/Edge
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `ai-safety-firewall/extension` folder
6. Extension icon should appear in your toolbar

---

## 📖 Usage Guide

### Basic Usage

1. **Visit an AI Platform**
   - Go to ChatGPT, Gemini, or any supported platform
   - You'll see a green border around the input field
   - A "🛡️ Protected" badge appears above the input

2. **Type Your Prompt**
   - Enter any text with sensitive data
   - Example: "My email is john@example.com and my phone is 1234567890"
   - The extension automatically detects and masks sensitive information

3. **Submit Prompt**
   - Press Enter to send
   - Sensitive data is replaced with tokens: `[EMAIL_1]`, `[PHONE_1]`
   - Only masked data is sent to the AI

4. **View Results**
   - AI response appears normally
   - Sensitive data is automatically unmasked for your viewing
   - Check dashboard for full details

### Dashboard Features

1. **View Activity Log**
   - See all interactions in real-time
   - Color-coded risk levels (CRITICAL, HIGH, MEDIUM, LOW)
   - Click any log entry for detailed view

2. **Monitor Statistics**
   - Total prompts processed
   - High-risk detections
   - Verified responses

3. **Risk Distribution**
   - Visual pie chart showing risk level distribution
   - Updated in real-time

4. **Verification Status**
   - See verification results for each interaction
   - Confidence scores
   - Similarity comparisons

---

## 🔧 Configuration

### Extension Settings

The extension works out-of-the-box with default settings. No configuration needed!

### Backend Configuration

Edit `ai-safety-firewall/backend/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ai-safety-firewall

# Server Port
PORT=5000

# Gemini API Key (for verification)
GEMINI_API_KEY=your_key_here
```

### Policy Customization

Edit `ai-safety-firewall/extension/background.js` to customize policies:

```javascript
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
        // Add your custom policies here
    ];
}
```

---

## 🎯 What Gets Detected?

### Personal Information (PII)
- Email addresses
- Phone numbers
- Social Security Numbers (SSN)
- Aadhaar numbers
- IP addresses

### Financial Data
- Credit card numbers
- Bank account numbers
- Routing numbers
- SWIFT codes
- IBAN
- Cryptocurrency wallet addresses

### Authentication Credentials
- API keys (AWS, Azure, etc.)
- Passwords
- JWT tokens
- Bearer tokens
- Private keys

### Corporate Data
- Employee IDs
- Internal URLs
- Project codenames
- Connection strings

---

## 🏗️ Architecture

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

### Components

- **Extension**: Browser extension for real-time protection
- **Backend**: Express.js API server with MongoDB
- **Dashboard**: React-based web dashboard for monitoring

See [TECHNICAL_WORKFLOW.md](./TECHNICAL_WORKFLOW.md) for detailed architecture.

---

## 🛠️ Technology Stack

### Frontend (Extension)
- **JavaScript (ES6+)**
- **Chrome Extension APIs**
- **DOM Manipulation**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** with Mongoose
- **Axios** (for Gemini API)

### Dashboard
- **React 19**
- **Vite**
- **Axios**
- **Recharts**

---

## 📊 API Endpoints

### Backend API (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/log` | Log a prompt/interaction |
| `GET` | `/api/logs` | Get all logs |
| `GET` | `/api/logs/:id` | Get specific log |
| `POST` | `/api/verify` | Verify AI response |

### Example Request

```bash
# Log a prompt
curl -X POST http://localhost:5000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrompt": "My email is test@example.com",
    "maskedPrompt": "My email is [EMAIL_1]",
    "platform": "chat.openai.com",
    "riskScore": 25,
    "riskLevel": "MEDIUM",
    "detections": [...]
  }'
```

---

## 🐛 Troubleshooting

### Extension Not Working

1. **Check if extension is loaded**
   - Go to `chrome://extensions/`
   - Ensure extension is enabled
   - Check for errors

2. **Reload the extension**
   - Click the reload button in `chrome://extensions/`
   - Refresh the AI platform page

3. **Check browser console**
   - Press `F12` to open DevTools
   - Look for `🛡️ AI Safety Firewall` messages
   - Check for any errors

### Backend Not Connecting

1. **Check if MongoDB is running**
   ```bash
   # Windows
   mongod
   
   # Check if running
   mongo
   ```

2. **Verify backend is running**
   ```bash
   curl http://localhost:5000/
   # Should return: "AI Safety Firewall Backend is running"
   ```

3. **Check environment variables**
   - Ensure `.env` file exists
   - Verify `MONGODB_URI` is correct

### Dashboard Not Showing Data

1. **Check backend connection**
   - Look for connection status indicator (green/red)
   - If red, backend is not connected

2. **Verify backend is running**
   - Check `http://localhost:5000/api/logs`
   - Should return JSON array

3. **Check browser console**
   - Look for API errors
   - Verify CORS is enabled

### Verification Not Working

1. **Check Gemini API Key**
   - Ensure `GEMINI_API_KEY` is set in `.env`
   - Verify key is valid

2. **Check console logs**
   - Look for verification messages
   - Check for API errors

3. **Verify response detection**
   - Extension should detect AI responses automatically
   - Check console for "Detected new response" messages

---

## 📝 Development

### Running in Development Mode

**Backend:**
```bash
cd ai-safety-firewall/backend
npm run dev  # Uses nodemon for auto-reload
```

**Dashboard:**
```bash
cd dashboard
npm run dev  # Vite dev server with hot reload
```

### Project Structure

```
hack3/
├── ai-safety-firewall/
│   ├── backend/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── server.js        # Express server
│   │   └── package.json
│   └── extension/
│       ├── background.js    # Policy engine
│       ├── content.js        # Main interception logic
│       ├── popup.js         # Extension popup
│       ├── manifest.json    # Extension config
│       └── styles.css
├── dashboard/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app
│   │   └── main.jsx
│   └── package.json
├── README.md
└── TECHNICAL_WORKFLOW.md
```

---

## 🧪 Testing

### Manual Testing

1. **Test Detection**
   - Enter various sensitive data types
   - Verify detection and masking

2. **Test Blocking**
   - Try high-risk prompts
   - Verify blocking works

3. **Test Verification**
   - Send prompts and wait for responses
   - Check verification status in dashboard

### Test Cases

- ✅ Email detection and masking
- ✅ Phone number detection
- ✅ Credit card detection
- ✅ API key detection
- ✅ Attack pattern blocking
- ✅ Policy enforcement
- ✅ Response verification

---

## 🔐 Security Considerations

- **Local Storage**: Token mappings stored only in browser memory
- **No Data Persistence**: Sensitive data never stored in database
- **Encryption**: Consider adding encryption for production
- **API Keys**: Never commit API keys to version control
- **HTTPS**: Use HTTPS in production

---

## 📈 Future Enhancements

- [ ] Multi-model verification (add more AI models)
- [ ] Real-time dashboard updates (WebSocket)
- [ ] User authentication and multi-user support
- [ ] Custom policy management UI
- [ ] Advanced analytics and reporting
- [ ] Export logs to CSV/PDF
- [ ] Mobile app support
- [ ] Enterprise SSO integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - *Initial work*

---

## 🙏 Acknowledgments

- Google Gemini API for verification
- Chrome Extension APIs
- React and Vite communities
- MongoDB and Express.js

---

## 📞 Support

For issues, questions, or contributions:

- **Issues**: Open an issue on GitHub
- **Email**: [your-email@example.com]
- **Documentation**: See [TECHNICAL_WORKFLOW.md](./TECHNICAL_WORKFLOW.md)

---

## 🎯 Use Cases

### Enterprise
- Protect corporate data in AI interactions
- Compliance with data protection regulations
- Audit trail for AI usage

### Personal
- Protect personal information
- Prevent accidental data leaks
- Safe AI experimentation

### Development
- Secure API key testing
- Safe prompt engineering
- Development workflow protection

---

## ⚠️ Disclaimer

This tool provides an additional layer of security but should not be the only security measure. Always follow best practices for data protection and comply with your organization's security policies.

---

## 📊 Statistics

- **30+ Detection Patterns**
- **6+ Supported Platforms**
- **Real-time Monitoring**
- **Multi-model Verification**
- **Enterprise Dashboard**

---

**Made with 🛡️ for AI Safety**

