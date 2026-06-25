import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

// Mock matchMedia for recharts/jsdom
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
    };
};

describe('Authentication Flow — Login', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        // Mock global window location for redirects using native History API
        window.history.pushState({}, '', '/login');
        
        // Mock the initial auth checks that App performs on mount
        mockApi.onGet('/api/check-auth').reply(401);
        mockApi.onGet('/').reply(200);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderAppAtLogin = async () => {
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        // Wait for the login page to be rendered
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        });
        return utils;
    };

    it('FE-IT-01: Login → Home Redirect', async () => {
        // Setup API mocks
        mockApi.onPost('/login').reply(200, {
            message: "Login successful.",
            authenticated: true,
            user: { username: "drjane" }
        });
        mockApi.onGet('/api/account').reply(200, {
            username: "drjane",
            fullName: "Dr. Jane Doe"
        });

        await renderAppAtLogin();

        // Fill form
        await user.type(screen.getByPlaceholderText(/Username/i), 'drjane');
        await user.type(screen.getByPlaceholderText(/••••••••••••/i), 'Secure@123');
        
        // Submit
        await user.click(screen.getByRole('button', { name: /Login/i }));

        // Verify API was called
        await waitFor(() => {
            expect(mockApi.history.post.some(req => req.url === '/login')).toBe(true);
        });
        
        const loginReq = mockApi.history.post.find(req => req.url === '/login');
        expect(JSON.parse(loginReq.data)).toEqual({ username: 'drjane', password: 'Secure@123' });

        // Verify success toast
        await waitFor(() => {
            expect(screen.getByText('Login successful. Welcome back!')).toBeInTheDocument();
        });

        // Verify localStorage
        expect(window.localStorage.getItem('isLoggedIn')).toBe('true');

        // Verify Navigation to Home
        await waitFor(() => {
            expect(screen.getByText(/Dr\. Jane Doe's Workspace/i)).toBeInTheDocument();
        });
    });

    it('FE-IT-02: Login → API Error', async () => {
        mockApi.onPost('/login').reply(401, {
            message: "Invalid credentials provided."
        });

        await renderAppAtLogin();

        await user.type(screen.getByPlaceholderText(/Username/i), 'wrong');
        await user.type(screen.getByPlaceholderText(/••••••••••••/i), 'bad');
        await user.click(screen.getByRole('button', { name: /Login/i }));

        // Verify error toast from API
        await waitFor(() => {
            expect(screen.getByText('Invalid credentials provided.')).toBeInTheDocument();
        });

        // Verify still on login page
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        expect(window.localStorage.getItem('isLoggedIn')).toBeNull();
    });

    it('FE-IT-03: Login → Network Error', async () => {
        mockApi.onPost('/login').networkError();

        await renderAppAtLogin();

        await user.type(screen.getByPlaceholderText(/Username/i), 'drjane');
        await user.type(screen.getByPlaceholderText(/••••••••••••/i), 'Secure@123');
        await user.click(screen.getByRole('button', { name: /Login/i }));

        // Verify interceptor network error toast
        await waitFor(() => {
            expect(screen.getByText('Network error. Please check your internet connection or try again later.')).toBeInTheDocument();
        });

        // Verify still on login page
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });

    it('FE-IT-04: Login → Empty Fields', async () => {
        await renderAppAtLogin();

        // Click submit without typing anything
        const submitButton = screen.getByRole('button', { name: /Login/i });
        await user.click(submitButton);

        // API should not be called due to HTML5 validation
        expect(mockApi.history.post.length).toBe(0);

        // Verify required attributes
        expect(screen.getByPlaceholderText(/Username/i)).toBeRequired();
        expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeRequired();
    });

    it('FE-IT-05: Authenticated User → Login Redirect', async () => {
        // Mock user as ALREADY authenticated
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, {
            username: "drjane",
            fullName: "Dr. Jane Doe"
        });

        let utils;
        await act(async () => {
            utils = render(<App />);
        });

        // Should automatically redirect to /home and show workspace
        await waitFor(() => {
            expect(screen.getByText(/Dr\. Jane Doe's Workspace/i)).toBeInTheDocument();
        });
        
        // Login heading should not be present
        expect(screen.queryByRole('heading', { name: /Login/i })).not.toBeInTheDocument();
    });
});
