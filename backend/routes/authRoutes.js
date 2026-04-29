// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many attempts. Try again later." }
});

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', rateLimit({
    windowMs: 60 * 60 * 1000, max: 5, message: { message: "Too many attempts. Try again later." }
}), authController.forgotPassword);

router.get('/reset-password-verify', authController.resetPasswordVerify);
router.post('/reset-password-action', authController.resetPasswordAction);
router.post('/logout', authController.logout);

module.exports = router;
