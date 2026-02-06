import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000';

export const isAuthenticated = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/check-auth`, { withCredentials: true });
        return response.status === 200;
    }
    catch (error) { return false; }
};

export const logout = async () => {
    try {
        await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
        return true;
    } catch (error) {
        console.error("Logout failed:", error);
        return false;
    }
};
