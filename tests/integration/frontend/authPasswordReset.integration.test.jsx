import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Authentication Flow — Password Reset', () => {
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

    const renderAppAt = async (path, headingPattern) => {
        window.history.pushState({}, '', path);
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        if (headingPattern) {
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: headingPattern })).toBeInTheDocument();
            });
        }
        return utils;
    };

    it('FE-IT-12: Forgot Password → Request Sent', async () => {
        mockApi.onPost('/forgot-password').reply(200, {
            message: "Recovery email sent."
        });

        await renderAppAt('/forgot-password', /Security Recovery/i);

        await user.type(screen.getByPlaceholderText('doctor@prana.com'), 'doctor@prana.com');
        await user.click(screen.getByRole('button', { name: /Send Recovery Link/i }));

        await waitFor(() => {
            expect(mockApi.history.post.some(req => req.url === '/forgot-password')).toBe(true);
        });

        const forgotReq = mockApi.history.post.find(req => req.url === '/forgot-password');
        expect(JSON.parse(forgotReq.data)).toEqual({ contact: 'doctor@prana.com' });

        await waitFor(() => {
            expect(screen.getByText('Recovery email sent.')).toBeInTheDocument();
        });
    });

    it('FE-IT-13: Reset Password → Full Flow', async () => {
        mockApi.onGet('/reset-password?id=abc&token=xyz').reply(200, {
            message: "Token valid"
        });
        mockApi.onPost('/reset-password').reply(200, {
            message: "Password updated successfully."
        });

        // App mounts at /reset-password and immediately shows Verifying Security Token...
        window.history.pushState({}, '', '/reset-password?id=abc&token=xyz');
        await act(async () => {
            render(<App />);
        });


        // Wait for token validation and form to appear
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Security Update/i })).toBeInTheDocument();
        });

        // Fill form
        await user.type(screen.getByPlaceholderText('Minimum 8 characters'), 'NewPass@1');
        await user.type(screen.getByPlaceholderText('Repeat new password'), 'NewPass@1');
        
        await user.click(screen.getByRole('button', { name: /Reset Access Password/i }));

        await waitFor(() => {
            expect(screen.getByText('Password updated successfully.')).toBeInTheDocument();
        });

        // Wait for redirect to login
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('FE-IT-14: Reset Password → Invalid Token', async () => {
        mockApi.onGet('/reset-password?id=abc&token=bad').reply(400, {
            message: "Invalid token"
        });

        window.history.pushState({}, '', '/reset-password?id=abc&token=bad');
        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByText('Security token is invalid or has expired.')).toBeInTheDocument();
        });

        // Should show invalid security token UI
        expect(screen.getByText('Invalid Security Token')).toBeInTheDocument();

        // Wait for automatic redirect to forgot-password
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Security Recovery/i })).toBeInTheDocument();
        }, { timeout: 2500 });
    });

    it('FE-IT-15: Reset Password → Missing Params', async () => {
        window.history.pushState({}, '', '/reset-password');
        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByText('Security parameters are missing.')).toBeInTheDocument();
        });

        // Wait for redirect
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Security Recovery/i })).toBeInTheDocument();
        }, { timeout: 2500 });
    });

    it('FE-IT-16: Reset Password → Short Password', async () => {
        mockApi.onGet('/reset-password?id=abc&token=xyz').reply(200);

        window.history.pushState({}, '', '/reset-password?id=abc&token=xyz');
        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Security Update/i })).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('Minimum 8 characters'), 'Ab1');
        await user.type(screen.getByPlaceholderText('Repeat new password'), 'Ab1');
        
        await user.click(screen.getByRole('button', { name: /Reset Access Password/i }));

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 8 characters for clinical security.')).toBeInTheDocument();
        });
        
        expect(mockApi.history.post.length).toBe(0);
    });

    it('FE-IT-17: Reset Password → Password Mismatch', async () => {
        mockApi.onGet('/reset-password?id=abc&token=xyz').reply(200);

        window.history.pushState({}, '', '/reset-password?id=abc&token=xyz');
        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Security Update/i })).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('Minimum 8 characters'), 'NewPass@1');
        await user.type(screen.getByPlaceholderText('Repeat new password'), 'Differ@2');
        
        await user.click(screen.getByRole('button', { name: /Reset Access Password/i }));

        await waitFor(() => {
            expect(screen.getByText('Password confirmation does not match.')).toBeInTheDocument();
        });
        
        expect(mockApi.history.post.length).toBe(0);
    });
});
