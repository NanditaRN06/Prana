import axios from 'axios';
import { toast } from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network Errors (Server down, no internet, CORS)
        if (!error.response) {
            toast.error("Network error. Please check your internet connection or try again later.", { id: 'network-err' });
            return Promise.reject(error);
        }

        const status = error.response.status;

        // Session Expiry or Unauthorized Access
        const authRoutes = ['/login', '/', '/signup', '/forgot-password', '/reset-password'];
        if (status === 401 && !authRoutes.includes(window.location.pathname)) {
            window.localStorage.removeItem("isLoggedIn");
            toast.error("Your secure session has expired. Please log in again to continue.", { id: 'session-exp' });
            window.location.href = '/login';
        }

        // Forbidden Access
        if (status === 403) {
            toast.error("You do not have the required permissions to perform this action.", { id: 'forbidden-err' });
        }

        // Internal Server Errors
        if (status >= 500) {
            toast.error("The clinical system is currently experiencing issues. Our team has been notified.", { id: 'server-err' });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
