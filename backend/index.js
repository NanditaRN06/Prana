// backend/index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const verifyUser = require("./verifyUser");
const controllers = require('./apiControllers');

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
    max: 100,
    message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(generalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many authentication attempts. Please try again after 15 minutes." }
});

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use('/api', require('./apiRoutes'));

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prana';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected to Prana'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req, res) => {
    res.send("Prana Backend Server is Live and Running!");
});

app.post('/signup', authLimiter, controllers.signup);
app.post('/login', authLimiter, controllers.login);
app.post('/forgot-password', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: "Too many recovery attempts. Please try again later." }
}), controllers.forgotPassword);

app.get('/reset-password-verify', controllers.resetPasswordVerify);
app.post('/reset-password-action', controllers.resetPasswordAction);

app.post('/new-entry', verifyUser, controllers.newEntry);
app.post('/logout', controllers.logout);

app.get("/patient/:patientId", verifyUser, controllers.getPatient);
app.put("/update/:patientId", verifyUser, controllers.updatePatient);
app.delete("/patient/:patientId", verifyUser, controllers.deletePatient);
app.get('/api/search-patients', verifyUser, controllers.searchPatients);
