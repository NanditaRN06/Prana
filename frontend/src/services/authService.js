import apiClient from './apiClient';

export const checkAuth = async () => {
    const response = await apiClient.get('/api/check-auth');
    return response.status === 200;
};

export const getAccount = async () => {
    const response = await apiClient.get('/api/account');
    return response.data;
};

export const login = async (credentials) => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
};

export const signup = async (userData) => {
    const response = await apiClient.post('/signup', userData);
    return response.data;
};

export const logout = async () => {
    const response = await apiClient.post('/logout', {});
    return response.data;
};

export const requestPasswordReset = async (contact) => {
    const response = await apiClient.post('/forgot-password', { contact });
    return response.data;
};

export const verifyPasswordReset = async (id, token) => {
    const response = await apiClient.get(`/reset-password?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);
    return response.data;
};

export const performPasswordReset = async (data) => {
    const response = await apiClient.post('/reset-password', data);
    return response.data;
};

export const updateAccount = async (data) => {
    const response = await apiClient.put('/api/account', data);
    return response.data;
};

export const deleteAccount = async () => {
    const response = await apiClient.delete('/api/account');
    return response.data;
};

export const deactivateAccount = async () => {
    const response = await apiClient.post('/api/deactivate', {});
    return response.data;
};
