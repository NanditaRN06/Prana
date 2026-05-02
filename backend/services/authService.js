// backend/services/authService.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const FE_URL = process.env.FE_URL || "http://localhost:5173";

exports.signupUser = async (userData) => {
    let { fullName, email, username, password, phoneNumber } = userData;
    if (phoneNumber === "") phoneNumber = undefined;

    const existingUser = await User.findOne({ $or: [{ email }, { username }, { phoneNumber }] });
    if (existingUser) {
        if (existingUser.email === email) throw new Error('Email address is already registered.');
        if (existingUser.username === username) throw new Error('Username is already taken.');
        if (phoneNumber && existingUser.phoneNumber === phoneNumber) throw new Error('Phone number is already registered.');
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ fullName, email, username, password: hash, phoneNumber });
    return newUser;
};

exports.loginUser = async (credentials) => {
    const { username, password } = credentials;
    const foundUser = await User.findOne({ $or: [{ username: username }, { email: username }, { phoneNumber: username }] });
    
    if (!foundUser) throw new Error("Invalid credentials. Please verify your username/email.");
    if (foundUser.status === "deactivated") throw new Error("This account has been deactivated. Please contact support for assistance.");

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) throw new Error("Incorrect password. Please try again.");

    const logintoken = jwt.sign(
        { id: foundUser._id, username: foundUser.username, email: foundUser.email, role: foundUser.role },
        JWT_SECRET, { expiresIn: '12h' }
    );

    return logintoken;
};

exports.requestPasswordReset = async (contact) => {
    const user = await User.findOne({ email: contact });
    if (!user) return true; // Generic success to avoid email enumeration

    const secret = JWT_SECRET + user.password;
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "15m" });
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const templatePath = path.join(__dirname, '../templates/resetPassword.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    const resetLink = `${FE_URL}/reset-password?id=${user._id}&token=${token}`;
    htmlContent = htmlContent.replace('{{fullName}}', user.fullName).replace('{{resetLink}}', resetLink);

    const mailOptions = {
        from: `"Prana Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Security Notice: Password Reset Request',
        html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return true;
};

exports.verifyPasswordReset = async (id, token) => {
    const user = await User.findById(id);
    if (!user) throw new Error("Security parameters are invalid.");

    const secret = JWT_SECRET + user.password;
    const decoded = jwt.verify(token, secret);
    
    if (decoded.id !== id) throw new Error("Unauthorized.");
    return true;
};

exports.resetPassword = async (id, token, newPassword) => {
    const user = await User.findById(id);
    if (!user) throw new Error("Security parameters are invalid.");

    const secret = JWT_SECRET + user.password;
    const decoded = jwt.verify(token, secret);
    
    if (decoded.id !== id) throw new Error("Unauthorized access attempt.");

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    return true;
};
