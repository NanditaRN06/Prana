// backend/services/patientService.js
const Patient = require("../models/Patient");

exports.createPatientEntry = async (patientData) => {
    const newPatient = new Patient(patientData);
    await newPatient.save();
    return newPatient;
};

exports.getPatientByIdAndUserId = async (patientId, userId) => {
    const escapedId = patientId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patient = await Patient.findOne({ userId, name: { $regex: new RegExp(`^${escapedId}$`, 'i') } });
    if (!patient) throw new Error("Clinical record not found for the specified patient.");
    return patient;
};

exports.updatePatientEntry = async (patientId, userId, updatePayload) => {
    const allowedFields = [
        'name', 'age', 'phone', 'address', 'examdate', 'comorbidities',
        'comorbidityData', 'allergies', 'allergyDetails', 'currentMedications',
        'clinicalDiagnosis', 'chiefComplaints', 'examination', 'treatments',
        'otherDetails', 'investigations', 'investigationDetails'
    ];
    
    const updatedData = {};
    for (const key of allowedFields) { 
        if (updatePayload[key] !== undefined) updatedData[key] = updatePayload[key]; 
    }

    const currentPatient = await Patient.findOne({ name: patientId, userId });
    if (!currentPatient) throw new Error("Patient record not found.");

    const versionSnapshot = currentPatient.toObject();
    delete versionSnapshot._id; delete versionSnapshot.versions; delete versionSnapshot.updatedAt;
    
    const changedFields = [];
    const ignoreFields = ['versions', 'updatedAt', 'userId', '_id', '__v', 'createdAt'];

    for (const key in updatedData) {
        if (ignoreFields.includes(key)) continue;
        if (JSON.stringify(currentPatient[key]) !== JSON.stringify(updatedData[key])) {
            changedFields.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        }
    }
    
    const changeSummary = changedFields.length > 0 ? `Edited ${changedFields.join(", ")}` : "Manual Update";

    const result = await Patient.findOneAndUpdate(
        { name: patientId, userId },
        { $set: updatedData, $push: { versions: { ...versionSnapshot, versionDate: new Date(), changeSummary } } },
        { new: true, runValidators: true }
    );
    
    return result;
};

exports.deletePatientEntry = async (patientId, userId) => {
    const deleted = await Patient.findOneAndDelete({ name: patientId, userId });
    if (!deleted) throw new Error("Record not found for deletion.");
    return deleted;
};

exports.searchPatientRecords = async (query, userId) => {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patients = await Patient.find({
        userId,
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
    return patients;
};
