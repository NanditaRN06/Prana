import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('App Initialization', () => {
    let user;
    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        // Mock the silent ping to root
        mockApi.onGet('/').reply(200);
        
        // Use fake timers to prevent act() warnings for pending promises if needed
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('FE-IT-63: App Initialization → Unauthenticated User', async () => {
        mockApi.onGet('/api/check-auth').reply(401);

        window.history.pushState({}, '', '/');
        
        await act(async () => {
            render(<App />);
        });

        // Should not try to fetch account since not authenticated
        await waitFor(() => {
            expect(mockApi.history.get.some(req => req.url === '/api/account')).toBe(false);
        });

        // Make sure we stay on the landing page
        expect(screen.getByText(/Clinical Information Systems/i)).toBeInTheDocument();
    });

    it('FE-IT-64: App Initialization → Authenticated User', async () => {
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, { username: "janedoe", fullName: "Dr. Jane Doe" });
        window.localStorage.setItem('isLoggedIn', 'true');

        window.history.pushState({}, '', '/home');

        await act(async () => {
            render(<App />);
        });

        // Should fetch account
        await waitFor(() => {
            expect(mockApi.history.get.some(req => req.url === '/api/account')).toBe(true);
        });

        // Navigate to account page from home page
        const accountLink = await screen.findByRole('link', { name: /Account Settings/i });
        await user.click(accountLink);

        await waitFor(() => {
            // Navbar should display the username as the label
            const elements = screen.getAllByText('janedoe');
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    it('FE-IT-65: App Initialization → API Error on check-auth', async () => {
        mockApi.onGet('/api/check-auth').reply(500);

        window.history.pushState({}, '', '/home');

        await act(async () => {
            render(<App />);
        });

        // Interceptor for 500 should trigger a toast
        await waitFor(() => {
            expect(screen.getByText('The clinical system is currently experiencing issues. Our team has been notified.')).toBeInTheDocument();
        });

        // App should treat it as unauthenticated and redirect to /login
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        });
    });

    it('FE-IT-66: App Initialization → API Error on getAccount', async () => {
        // Authenticated but account fetch fails
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(500);
        window.localStorage.setItem('isLoggedIn', 'true');

        // Render at a visible route for navbar to see the fallback label
        window.history.pushState({}, '', '/patient/123');
        // Mock patient fetch so it doesn't fail
        mockApi.onGet('/api/patient/123').reply(200, { name: "Test" });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(mockApi.history.get.some(req => req.url === '/api/account')).toBe(true);
        });

        // Should fall back to "Account" in Navbar instead of username
        await waitFor(() => {
            // The nav link shows {username || "Account"}
            const navLinks = screen.getAllByRole('link');
            const accountLink = navLinks.find(link => link.getAttribute('href') === '/account');
            expect(accountLink).toHaveTextContent('Account');
        });

        consoleSpy.mockRestore();
    });
});

// Helper for cleanup since it wasn't imported
import { cleanup } from '@testing-library/react';
