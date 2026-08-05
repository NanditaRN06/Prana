// backend/models/Patient.js

const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "members", required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    phone: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^\d{10}$/.test(v); // Allow empty or exactly 10 digits
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    address: { type: String },
    examdate: { type: Date, required: true },
    comorbidities: [String],
    comorbidityData: [{ name: String, duration: String }],
    allergies: { type: String, required: true },
    allergyDetails: { type: String },
    currentMedications: { type: String },
    clinicalDiagnosis: { type: String },
    chiefComplaints: { type: String },
    examination: { type: String },
    treatments: [String],
    otherDetails: { type: String },
    investigations: [String],
    investigationDetails: {
        ct: [{ region: String, contrast: String }],
        enmg: [{ region: String }],
        mri: [{ region: String }],
        others: { type: String } // Custom investigation text
    },
    vitals: {
        pulse: { type: Number, min: 0, max: 300, default: undefined },
        bp: {
            systolic: { type: Number, min: 0, max: 300, default: undefined },
            diastolic: { type: Number, min: 0, max: 200, default: undefined }
        },
        spO2: { type: Number, min: 0, max: 100, default: undefined }
    },
    versions: []
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
