// backend/controllers/patientController.js
const patientService = require("../services/patientService");

exports.newEntry = async (req, res) => {
    try {
        const patientData = { ...req.body, userId: req.user.id };
        await patientService.createPatientEntry(patientData);
        res.status(201).json({ message: 'Patient clinical record successfully archived.' });
    } catch (err) {
        console.error('Error saving patient data:', err);
        res.status(500).json({ message: 'Error archiving patient data. Please try again.' });
    }
};

exports.getPatient = async (req, res) => {
    try {
        const patientId = req.params.patientId.trim();
        const patient = await patientService.getPatientByIdAndUserId(patientId, req.user.id);
        res.json(patient);
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ message: error.message });
        console.error("Error in getPatient:", error);
        res.status(500).json({ message: "Failed to load clinical documentation." });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const result = await patientService.updatePatientEntry(req.params.patientId, req.user.id, req.body);
        res.status(200).json({ message: "Clinical documentation updated successfully.", data: result });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        console.error(error);
        res.status(500).json({ error: "Internal error during record update." });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const patientId = req.params.patientId.replace(/^:/, '');
        await patientService.deletePatientEntry(patientId, req.user.id);
        res.json({ message: "Clinical patient record successfully purged from registry." });
    } catch (err) {
        if (err.message.includes("not found")) return res.status(404).json({ message: err.message });
        console.error(err);
        res.status(500).json({ message: "Server error during deletion process." });
    }
};

exports.searchPatients = async (req, res) => {
    try {
        if (!req.query.query) return res.status(400).json({ message: "Search query is required." });
        const patients = await patientService.searchPatientRecords(req.query.query, req.user.id);
        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error performing registry search." });
    }
};
