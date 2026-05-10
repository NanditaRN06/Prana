// backend/controllers/authController.js
const authService = require("../services/authService");

exports.signup = async (req, res) => {
    try {
        const newUser = await authService.signupUser(req.body);
        res.status(201).json({ message: "Registration successful.", user: { id: newUser._id, username: newUser.username } });
    } catch (err) {
        if (err.message.includes('registered') || err.message.includes('taken')) {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'An internal server error occurred. Please try again later.' });
    }
};

exports.login = async (req, res) => {
    try {
        if (!req.body || !req.body.username || !req.body.password) {
            return res.status(400).json({ message: "Username and password are required." });
        }
        const logintoken = await authService.loginUser(req.body);
        res.cookie('token', logintoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 12 * 60 * 60 * 1000
        });
        res.json({ message: "Login successful.", authenticated: true });
    } catch (err) {
        if (err.message.includes('credentials') || err.message.includes('password') || err.message.includes('deactivated')) {
            const status = err.message.includes('deactivated') ? 403 : 401;
            return res.status(status).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Login failed due to a server error.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        await authService.requestPasswordReset(req.body.contact);
        const genericMessage = "If this email is registered, a professional recovery link has been dispatched.";
        res.json({ message: genericMessage, type: "email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An unexpected error occurred during the password recovery process." });
    }
};

exports.resetPasswordVerify = async (req, res) => {
    try {
        await authService.verifyPasswordReset(req.query.id, req.query.token);
        res.json({ valid: true });
    } catch (err) {
        console.error(err);
        if (err.message === "Security parameters are invalid.") return res.status(401).json({ message: err.message });
        if (err.message === "Unauthorized.") return res.status(403).json({ message: err.message });
        res.status(401).json({ message: "Security token is invalid or has already been used." });
    }
};

exports.resetPasswordAction = async (req, res) => {
    try {
        await authService.resetPassword(req.body.id, req.body.token, req.body.newPassword);
        res.json({ message: "Password updated successfully. You may now log in with your new credentials." });
    } catch (err) {
        console.error(err);
        if (err.message === "Security parameters are invalid.") return res.status(401).json({ message: err.message });
        if (err.message === "Unauthorized access attempt.") return res.status(403).json({ message: err.message });
        res.status(401).json({ message: "Security token is invalid, expired, or has already been used." });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' });
    res.status(200).json({ message: "Session successfully terminated." });
};
