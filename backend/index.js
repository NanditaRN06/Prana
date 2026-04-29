// backend/index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


app.use(cors({
    origin: process.env.FE_URL || "http://localhost:5173",
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

app.use(helmet());

// Trust the reverse proxy when deploying to Render/Vercel
// This prevents the express-rate-limit 'X-Forwarded-For' ValidationError
app.set('trust proxy', 1);

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased from 100 to 1000 to prevent dev lockouts
    message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(generalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use('/', require('./routes/allRoutes'));

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prana';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected to Prana'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req, res) => {
    res.send("Prana Backend Server is Live and Running!");
});

