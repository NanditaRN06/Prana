// frontend/utils/auth.js

import apiClient from '../services/apiClient';

export const isAuthenticated = async () => {
    try {
        const response = await apiClient.get(`/api/check-auth`);
        return response.status === 200;
    }
    catch (error) { console.error(error); return false; }
};

export const logout = async () => {
    try {
        await apiClient.post(`/logout`, {});
        return true;
    } catch (error) {
        console.error("Logout failed:", error);
        return false;
    }
};
