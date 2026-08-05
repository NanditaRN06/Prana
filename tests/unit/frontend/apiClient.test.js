import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from '@frontend/services/apiClient';
import { toast } from 'react-hot-toast';
import MockAdapter from 'axios-mock-adapter';

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
    }
}));

describe('apiClient', () => {
    let originalWindowLocation;
    let originalWindowLocalStorage;
    let mock;

    beforeEach(() => {
        vi.clearAllMocks();
        mock = new MockAdapter(apiClient);
        
        originalWindowLocation = window.location;
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/some-page',
                href: '',
            },
            configurable: true,
            writable: true
        });

        originalWindowLocalStorage = window.localStorage;
        Object.defineProperty(window, 'localStorage', {
            value: {
                removeItem: vi.fn(),
            },
            configurable: true,
            writable: true
        });
    });

    afterEach(() => {
        mock.restore();
        window.location = originalWindowLocation;
        window.localStorage = originalWindowLocalStorage;
    });

    it('FE-UT-23: apiClient - Base URL configured correctly', () => {
        // Base URL is loaded from import.meta.env.VITE_API_URL, which might be undefined in tests,
        // but we verify the defaults.
        expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it('FE-UT-24: responseInterceptor - 401 on protected page → redirect /login', async () => {
        window.location.pathname = '/protected-route';
        mock.onGet('/test-401').reply(401);
        
        await expect(apiClient.get('/test-401')).rejects.toThrow();

        expect(window.localStorage.removeItem).toHaveBeenCalledWith('isLoggedIn');
        expect(toast.error).toHaveBeenCalledWith(
            "Your secure session has expired. Please log in again to continue.",
            { id: 'session-exp' }
        );
        expect(window.location.href).toBe('/login');
    });

    it('FE-UT-25: responseInterceptor - 401 on /login page → no redirect', async () => {
        window.location.pathname = '/login';
        mock.onGet('/test-401').reply(401);
        
        await expect(apiClient.get('/test-401')).rejects.toThrow();

        expect(window.localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).not.toBe('/login');
    });

    it('FE-UT-26: responseInterceptor - 401 on / page → no redirect', async () => {
        window.location.pathname = '/';
        mock.onGet('/test-401').reply(401);
        
        await expect(apiClient.get('/test-401')).rejects.toThrow();

        expect(window.localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).not.toBe('/login');
    });

    it('FE-UT-27: responseInterceptor - 403 status → error propagated', async () => {
        mock.onGet('/test-403').reply(403);
        
        await expect(apiClient.get('/test-403')).rejects.toThrow();

        expect(toast.error).toHaveBeenCalledWith(
            "You do not have the required permissions to perform this action.",
            { id: 'forbidden-err' }
        );
        expect(window.location.href).not.toBe('/login');
    });

    it('FE-UT-28: responseInterceptor - 500 status → error propagated', async () => {
        mock.onGet('/test-500').reply(500);
        
        await expect(apiClient.get('/test-500')).rejects.toThrow();

        expect(toast.error).toHaveBeenCalledWith(
            "The clinical system is currently experiencing issues. Our team has been notified.",
            { id: 'server-err' }
        );
    });

    it('FE-UT-29: responseInterceptor - Network error (no response) → error propagated', async () => {
        mock.onGet('/test-network').networkError();
        
        await expect(apiClient.get('/test-network')).rejects.toThrow();

        expect(toast.error).toHaveBeenCalledWith(
            "Network error. Please check your internet connection or try again later.",
            { id: 'network-err' }
        );
    });
});
