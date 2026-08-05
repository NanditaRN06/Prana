import React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Navigation & Route Guards', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        mockApi.onGet('/api/check-auth').reply(401);
        mockApi.onGet('/').reply(200);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderAppAt = async (path) => {
        window.history.pushState({}, '', path);
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        return utils;
    };

    it('FE-IT-18: Protected Route → Unauthenticated Redirect', async () => {
        const protectedRoutes = ['/home', '/account', '/new-entry', '/patient/123', '/update/123'];
        
        for (const route of protectedRoutes) {
            await renderAppAt(route);
            // Should redirect to login
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
            });
            // Cleanup for next iteration
            cleanup();
        }
    });

    it('FE-IT-19: Landing Page → Login/Signup Links', async () => {
        await renderAppAt('/');
        
        // Wait for landing page
        await waitFor(() => {
            expect(screen.getByText(/Clinical Information Systems/i)).toBeInTheDocument();
        });

        // Click Login
        await user.click(screen.getByRole('link', { name: /Login/i }));
        
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        });
    });

    it('FE-IT-20: Navbar Visibility — Hidden Routes', async () => {
        const hiddenRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/home'];
        
        // Mock authentication to prevent redirects for /home
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, { username: "user", fullName: "User" });
        window.localStorage.setItem('isLoggedIn', 'true');
        
        for (const route of hiddenRoutes) {
            await renderAppAt(route);
            
            // Wait for something on the page to indicate it's rendered
            await waitFor(() => {
                expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
            });
            
            cleanup();
        }
    });

    it('FE-IT-21: Navbar Visibility — Visible Routes', async () => {
        const visibleRoutes = ['/account', '/patient/123', '/new-entry', '/update/123'];
        
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, { username: "drjane", fullName: "Dr. Jane" });
        window.localStorage.setItem('isLoggedIn', 'true');
        
        // Mock specific data needed for these pages
        mockApi.onGet('/api/patient/123').reply(200, { name: "John Doe" });
        
        await renderAppAt('/home');
        
        // Wait for auth to settle
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Workspace/i })).toBeInTheDocument();
        });

        for (const route of visibleRoutes) {
            // Navigate via history API directly to avoid initial render redirect
            act(() => {
                window.history.pushState({}, '', route);
                window.dispatchEvent(new Event('popstate'));
            });
            
            await waitFor(() => {
                const nav = screen.getByRole('navigation');
                expect(nav).toBeInTheDocument();
                // Check if links are present
                expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
                expect(screen.getByRole('link', { name: /drjane/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
            });
        }
    });

    it('FE-IT-22: 404 Page — Unknown Route', async () => {
        await renderAppAt('/nonexistent-page');
        
        await waitFor(() => {
            expect(screen.getByText('404')).toBeInTheDocument();
            expect(screen.getByText('Page Not Found')).toBeInTheDocument();
        });
        
        await user.click(screen.getByRole('link', { name: /Return to Home/i }));
        
        // Navigates to landing page
        await waitFor(() => {
            expect(screen.getByText(/Clinical Information Systems/i)).toBeInTheDocument();
        });
    });

    it('FE-IT-23: Cross-page Navigation Links', async () => {
        // Login to Signup
        await renderAppAt('/login');
        await waitFor(() => expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument());
        await user.click(screen.getByRole('link', { name: /Create Account/i }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument());
        
        // Signup to Login
        await user.click(screen.getByRole('link', { name: /Sign In/i }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument());
        
        // Login to Forgot Password
        await user.click(screen.getByRole('link', { name: /Forgot Password\?/i }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Security Recovery/i })).toBeInTheDocument());
        
        // Forgot Password to Login
        await user.click(screen.getByRole('link', { name: /Back to Secure Login/i }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument());
    });
});
