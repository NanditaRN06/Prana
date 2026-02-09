const User = require("./models/User");
const Patient = require("./models/Patient");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";
const FE_URL = process.env.FE_URL || "http://localhost:5173";

exports.signup = async (req, res) => {
    const { fullName, email, username, password, phoneNumber } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }, { phoneNumber }] });
        if (existingUser) {
            if (existingUser.email === email) return res.status(400).json({ message: 'Email address is already registered.' });
            if (existingUser.username === username) return res.status(400).json({ message: 'Username is already taken.' });
            if (phoneNumber && existingUser.phoneNumber === phoneNumber) return res.status(400).json({ message: 'Phone number is already registered.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ fullName, email, username, password: hash, phoneNumber });
        res.status(201).json({ message: "Registration successful.", user: { id: newUser._id, username: newUser.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An internal server error occurred. Please try again later.' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const foundUser = await User.findOne({ $or: [{ username: username }, { email: username }, { phoneNumber: username }] });
        if (!foundUser) return res.status(401).json({ message: "Invalid credentials. Please verify your username/email." });

        if (foundUser.status === "deactivated") {
            return res.status(403).json({ message: "This account has been deactivated. Please contact support for assistance." });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect password. Please try again." });

        const logintoken = jwt.sign(
            { id: foundUser._id, username: foundUser.username, email: foundUser.email, role: foundUser.role },
            JWT_SECRET, { expiresIn: '12h' }
        );
        res.cookie('token', logintoken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.json({ message: "Login successful.", authenticated: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed due to a server error.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { contact } = req.body;
    try {
        const user = await User.findOne({ email: contact });

        const genericMessage = "If this email is registered, a professional recovery link has been dispatched.";

        if (!user) {
            return res.json({ message: genericMessage, type: "email" });
        }

        const secret = JWT_SECRET + user.password;
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: "15m" });
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const templatePath = path.join(__dirname, 'models/resetPassword.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        const resetLink = `${FE_URL}/reset-password?id=${user._id}&token=${token}`;
        htmlContent = htmlContent
            .replace('{{fullName}}', user.fullName)
            .replace('{{resetLink}}', resetLink);

        const mailOptions = {
            from: `"Prana Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Security Notice: Password Reset Request',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: genericMessage, type: "email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An unexpected error occurred during the password recovery process." });
    }
};

exports.resetPasswordVerify = async (req, res) => {
    const { id, token } = req.query;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(401).json({ message: "Security parameters are invalid." });

        const secret = JWT_SECRET + user.password;
        const decoded = jwt.verify(token, secret);

        if (decoded.id !== id) return res.status(403).json({ message: "Unauthorized." });
        res.json({ valid: true });
    } catch (err) {
        res.status(401).json({ message: "Security token is invalid or has already been used." });
    }
};

exports.resetPasswordAction = async (req, res) => {
    const { id, token, newPassword } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(401).json({ message: "Security parameters are invalid." });

        const secret = JWT_SECRET + user.password;
        const decoded = jwt.verify(token, secret);

        if (decoded.id !== id) return res.status(403).json({ message: "Unauthorized access attempt." });

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        await user.save();

        res.json({ message: "Password updated successfully. You may now log in with your new credentials." });
    } catch (err) {
        res.status(401).json({ message: "Security token is invalid, expired, or has already been used." });
    }
};

exports.newEntry = (req, res) => {
    const patientData = { ...req.body, userId: req.user.id };
    const newPatient = new Patient(patientData);

    newPatient.save()
        .then(() => res.status(201).json({ message: 'Patient clinical record successfully archived.' }))
        .catch((err) => {
            console.error('Error saving patient data:', err);
            res.status(500).json({ message: 'Error archiving patient data', error: err.message });
        });
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Session successfully terminated." });
};

exports.getPatient = async (req, res) => {
    try {
        const patientId = decodeURIComponent(req.params.patientId.trim());
        const patient = await Patient.findOne({ userId: req.user.id, name: { $regex: new RegExp(`^${patientId}$`, 'i') } });

        if (!patient) return res.status(404).json({ message: "Clinical record not found for the specified patient." });
        res.json(patient);
    } catch (error) {
        console.error("Error in getPatient:", error);
        res.status(500).json({ message: "Failed to load clinical documentation." });
    }
};

exports.updatePatient = async (req, res) => {
    const { patientId } = req.params;
    const updatedData = req.body;

    try {
        const currentPatient = await Patient.findOne({ name: patientId, userId: req.user.id });
        if (!currentPatient) return res.status(404).json({ error: "Patient record not found." });

        const versionSnapshot = currentPatient.toObject();
        delete versionSnapshot._id;
        delete versionSnapshot.versions;
        delete versionSnapshot.updatedAt;
        const changedFields = [];
        const ignoreFields = ['versions', 'updatedAt', 'userId', '_id', '__v', 'createdAt'];

        for (const key in updatedData) {
            if (ignoreFields.includes(key)) continue;
            const currentVal = JSON.stringify(currentPatient[key]);
            const newVal = JSON.stringify(updatedData[key]);

            if (currentVal !== newVal) {
                const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                changedFields.push(readableKey);
            }
        }

        const changeSummary = changedFields.length > 0 ? `Edited ${changedFields.join(", ")}` : "Manual Update";

        const result = await Patient.findOneAndUpdate(
            { name: patientId, userId: req.user.id },
            {
                $set: updatedData,
                $push: { versions: { ...versionSnapshot, versionDate: new Date(), changeSummary } }
            },
            { new: true, runValidators: true }
        );

        if (!result) return res.status(404).json({ error: "Patient record not found." });
        res.status(200).json({ message: "Clinical documentation updated successfully.", data: result });
    } catch (error) {
        res.status(500).json({ error: "Internal error during record update." });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const patientId = req.params.patientId.replace(/^:/, '');
        const deleted = await Patient.findOneAndDelete({ name: patientId, userId: req.user.id });

        if (!deleted) return res.status(404).json({ message: "Record not found for deletion." });
        res.json({ message: "Clinical patient record successfully purged from registry." });
    } catch (err) {
        res.status(500).json({ message: "Server error during deletion process." });
    }
};

exports.searchPatients = async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ message: "Search query is required." });

    try {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
        const patients = await Patient.find({
            userId: req.user.id,
            $or: [
                { name: { $regex: escapedQuery, $options: 'i' } },
                { clinicalDiagnosis: { $regex: escapedQuery, $options: 'i' } },
                { chiefComplaints: { $regex: escapedQuery, $options: 'i' } },
                { examination: { $regex: escapedQuery, $options: 'i' } },
                { comorbidities: { $regex: escapedQuery, $options: 'i' } },
                { "investigationDetails.ct.region": { $regex: escapedQuery, $options: 'i' } },
                { "investigationDetails.mri.region": { $regex: escapedQuery, $options: 'i' } },
                { "investigationDetails.enmg.region": { $regex: escapedQuery, $options: 'i' } },
                { phone: { $regex: escapedQuery, $options: 'i' } },
                { address: { $regex: escapedQuery, $options: 'i' } }
            ]
        });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: "Error performing registry search." });
    }
};
