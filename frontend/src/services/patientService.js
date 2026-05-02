import apiClient from './apiClient';

export const getPatient = async (patientId) => {
    const response = await apiClient.get(`/patient/${patientId}`);
    return response.data;
};

export const createPatient = async (patientData) => {
    const response = await apiClient.post('/new-entry', patientData);
    return response.data;
};

export const updatePatient = async (patientId, patientData) => {
    const response = await apiClient.put(`/update/${patientId}`, patientData);
    return response.data;
};

export const deletePatient = async (patientId) => {
    const response = await apiClient.delete(`/patient/${patientId}`);
    return response.data;
};

export const searchPatients = async (query) => {
    const response = await apiClient.get(`/api/search-patients?query=${encodeURIComponent(query)}`);
    return response.data;
};
