// backend/verifyUser.js

const jwt = require("jsonwebtoken");
require('dotenv').config();

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT verification error:", err.message);
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        req.user = decoded;
        next();
    });
};

module.exports = verifyUser;
