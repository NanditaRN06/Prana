import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Toaster } from 'react-hot-toast';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '@frontend/services/apiClient';

describe('API Client Interceptors', () => {
    let mockApi;
    
    beforeEach(() => {
        // We use a specific mock adapter instance for apiClient
        mockApi = new MockAdapter(apiClient, { onNoMatch: 'throwException' });
        window.localStorage.clear();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        mockApi.restore();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderToaster = () => {
        render(<Toaster />);
    };

    it('FE-IT-59: API Client → 401 Unauthorized Interceptor', async () => {
        mockApi.onGet('/api/test-401').reply(401);
        
        window.history.pushState({}, '', '/home');
        window.localStorage.setItem('isLoggedIn', 'true');
        
        renderToaster();

        try {
            await apiClient.get('/api/test-401');
        } catch (error) {
            // Expected to throw
        }

        await waitFor(() => {
            expect(screen.getByText('Your secure session has expired. Please log in again to continue.')).toBeInTheDocument();
        });

        expect(window.localStorage.getItem('isLoggedIn')).toBeNull();
        
    });

    it('FE-IT-60: API Client → 403 Forbidden Interceptor', async () => {
        mockApi.onGet('/api/test-403').reply(403);
        
        renderToaster();

        try {
            await apiClient.get('/api/test-403');
        } catch (error) {
            // Expected
        }

        await waitFor(() => {
            expect(screen.getByText('You do not have the required permissions to perform this action.')).toBeInTheDocument();
        });
    });

    it('FE-IT-61: API Client → 500 Internal Server Error Interceptor', async () => {
        mockApi.onGet('/api/test-500').reply(500);
        
        renderToaster();

        try {
            await apiClient.get('/api/test-500');
        } catch (error) {
            // Expected
        }

        await waitFor(() => {
            expect(screen.getByText('The clinical system is currently experiencing issues. Our team has been notified.')).toBeInTheDocument();
        });
    });

    it('FE-IT-62: API Client → Network Error', async () => {
        mockApi.onGet('/api/test-network').networkError();
        
        renderToaster();

        try {
            await apiClient.get('/api/test-network');
        } catch (error) {
            // Expected
        }

        await waitFor(() => {
            expect(screen.getByText('Network error. Please check your internet connection or try again later.')).toBeInTheDocument();
        });
    });
});
