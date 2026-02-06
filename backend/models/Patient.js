const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "members", required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    examdate: { type: Date, required: true },
    comorbidities: [String],
    allergies: { type: String, required: true },
    allergyDetails: { type: String },
    chiefComplaints: { type: String },
    examination: { type: String },
    treatments: [String],
    investigations: [String],
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
