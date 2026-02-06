// /backend/apiRoutes.js
const express = require('express');
require('dotenv').config();
const router = express.Router();
const jwt = require('jsonwebtoken');
const verifyUser = require('./verifyUser');
const User = require("./models/User");

router.get('/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    jwt.verify(token, process.env.JWT_SECRET || "jwt_secret_key", (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        res.status(200).json({ message: 'Authenticated' });
    });
});

router.get("/account", verifyUser, async (req, res) => {
    try {
        if (!req.user || !req.user.id)
            return res.status(400).json({ message: "User is not authenticated or user ID is missing" });

        const user = await User.findById(req.user.id, "-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    }
    catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/account", verifyUser, async (req, res) => {
    const { fullName, email, username, phoneNumber } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.phoneNumber = phoneNumber || user.phoneNumber;

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/account", verifyUser, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);

        if (!user) {
            console.error("User not found for deletion");
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "Account deleted successfully" });
    }
    catch (err) {
        console.error("Error deleting account:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/deactivate", verifyUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.status = "deactivated";
        await user.save();

        res.clearCookie('token');
        res.json({ message: "Account deactivated successfully. You can reactivate it by contacting support." });
    } catch (err) {
        console.error("Error deactivating account:", err);
        res.status(500).json({ message: "Server error during deactivation." });
    }
});

module.exports = router;
