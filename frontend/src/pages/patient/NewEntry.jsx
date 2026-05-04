// frontend/components/NewEntry.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { createPatient } from "../../services/patientService";
import { toast } from "react-hot-toast";
import PatientForm from "../../components/PatientForm";

const NewEntry = () => {
    const navigate = useNavigate();

    const handleCreate = async (submissionData) => {
        const loadToast = toast.loading("Saving patient data...");
        try {
            await createPatient(submissionData);
            toast.success("Patient record saved.", { id: loadToast });
            navigate(`/patient/${submissionData.name}`);
        } catch (err) {
            console.error("Submission Error:", err);
            toast.error("An error occurred while attempting to save the record.", { id: loadToast });
        }
    };

    return <PatientForm mode="create" onSubmit={handleCreate} />;
};

export default NewEntry;
