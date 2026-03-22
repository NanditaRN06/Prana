// frontend/components/NewEntry.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import PatientForm from "./PatientForm";

const NewEntry = () => {
    const navigate = useNavigate();

    const handleCreate = (submissionData) => {
        const loadToast = toast.loading("Saving patient data...");
        axios.post(`${import.meta.env.VITE_API_URL}/new-entry`, submissionData, { withCredentials: true })
            .then(() => {
                toast.success("Patient record saved.", { id: loadToast });
                navigate(`/patient/${submissionData.name}`);
            })
            .catch(err => {
                console.error("Submission Error:", err);
                toast.error("An error occurred while attempting to save the record.", { id: loadToast });
            });
    };

    return <PatientForm mode="create" onSubmit={handleCreate} />;
};

export default NewEntry;
