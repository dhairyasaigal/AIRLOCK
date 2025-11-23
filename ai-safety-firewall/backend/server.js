require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const logRoutes = require('./routes/log');
const verifyRoutes = require('./routes/verify');
const logsRoutes = require('./routes/logs');

app.use('/api/log', logRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/logs', logsRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('AI Safety Firewall Backend is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
