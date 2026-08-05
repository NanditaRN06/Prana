import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForgotPassword, ResetPassword, ResetPasswordWrapper } from '@frontend/pages/auth/PassForgot';
import * as authService from '@frontend/services/authService';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@frontend/services/authService', () => ({
    requestPasswordReset: vi.fn(),
    verifyPasswordReset: vi.fn(),
    performPasswordReset: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: vi.fn(),
}));

toast.error = vi.fn();
toast.success = vi.fn();
toast.loading = vi.fn().mockReturnValue('loading-toast-id');

describe('PassForgot Components', () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup({ delay: null });
    });

    describe('ForgotPassword', () => {
        const renderForgot = () => {
            return render(
                <MemoryRouter>
                    <ForgotPassword />
                </MemoryRouter>
            );
        };

        it('FE-UT-114: ForgotPassword - Happy Path: Submit email', async () => {
            renderForgot();
            authService.requestPasswordReset.mockResolvedValue({ message: 'Email sent' });
            
            const emailInput = screen.getByPlaceholderText('doctor@prana.com');
            const submitButton = screen.getByRole('button', { name: /Send Recovery Link/i });

            await user.type(emailInput, 'test@prana.com');
            await user.click(submitButton);

            await waitFor(() => {
                expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@prana.com');
                expect(toast.success).toHaveBeenCalledWith('Email sent', { id: 'loading-toast-id' });
            });
        });

        it('FE-UT-115: ForgotPassword - Failure: API Error', async () => {
            renderForgot();
            authService.requestPasswordReset.mockRejectedValue({ response: { data: { message: 'User not found' } } });
            
            const emailInput = screen.getByPlaceholderText('doctor@prana.com');
            const submitButton = screen.getByRole('button', { name: /Send Recovery Link/i });

            await user.type(emailInput, 'test@prana.com');
            await user.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('User not found', { id: 'loading-toast-id' });
            });
        });
    });

    describe('ResetPassword', () => {
        const renderReset = (id = 'abc', token = 'xyz') => {
            return render(
                <MemoryRouter initialEntries={[`/reset-password?id=${id}&token=${token}`]}>
                    <Routes>
                        <Route path="/reset-password" element={<ResetPasswordWrapper />} />
                        <Route path="/forgot-password" element={<div data-testid="forgot-password-page">Forgot</div>} />
                        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
                    </Routes>
                </MemoryRouter>
            );
        };

        it('FE-UT-116: ResetPassword - Security: Missing token/id', async () => {
            // Provide empty id and token
            render(
                <MemoryRouter initialEntries={[`/reset-password`]}>
                    <Routes>
                        <Route path="/reset-password" element={<ResetPasswordWrapper />} />
                        <Route path="/forgot-password" element={<div data-testid="forgot-password-page">Forgot</div>} />
                    </Routes>
                </MemoryRouter>
            );

            expect(toast.error).toHaveBeenCalledWith('Security parameters are missing.');
            await waitFor(() => {
                expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('FE-UT-123: ResetPassword - UI State: Verifying indicator', async () => {
            // Mock to keep the promise unresolved so it stays verifying
            let resolver;
            const promise = new Promise((resolve) => { resolver = resolve; });
            authService.verifyPasswordReset.mockReturnValue(promise);
            
            renderReset();

            expect(screen.getByText('Verifying Security Token...')).toBeInTheDocument();
            resolver(); // Cleanup
            await waitFor(() => {}); // Wait for effect to settle
        });

        it('FE-UT-117: ResetPassword - Security: Invalid token', async () => {
            authService.verifyPasswordReset.mockRejectedValue(new Error('Invalid token'));
            renderReset();

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Security token is invalid or has expired.');
            });

            // Fast forward to check redirect
            await waitFor(() => {
                expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('FE-UT-124: ResetPassword - UI State: Invalid Token Indicator', async () => {
            authService.verifyPasswordReset.mockRejectedValue(new Error('Invalid token'));
            renderReset();

            await waitFor(() => {
                expect(screen.getByText('Invalid Security Token')).toBeInTheDocument();
            });
        });

        it('FE-UT-118: ResetPassword - Happy Path: Valid token', async () => {
            authService.verifyPasswordReset.mockResolvedValue({});
            renderReset();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Reset Access Password/i })).toBeInTheDocument();
            });
        });

        it('FE-UT-119: ResetPassword - Form Validation: Password mismatch', async () => {
            authService.verifyPasswordReset.mockResolvedValue({});
            renderReset();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Reset Access Password/i })).toBeInTheDocument();
            });

            const newPassInput = screen.getByPlaceholderText('Minimum 8 characters');
            const confirmPassInput = screen.getByPlaceholderText('Repeat new password');
            const submitButton = screen.getByRole('button', { name: /Reset Access Password/i });

            await user.type(newPassInput, 'Password123');
            await user.type(confirmPassInput, 'Password123_different');
            await user.click(submitButton);

            expect(toast.error).toHaveBeenCalledWith('Password confirmation does not match.');
            expect(authService.performPasswordReset).not.toHaveBeenCalled();
        });

        it('FE-UT-120: ResetPassword - Form Validation: Password < 8 chars', async () => {
            authService.verifyPasswordReset.mockResolvedValue({});
            renderReset();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Reset Access Password/i })).toBeInTheDocument();
            });

            const newPassInput = screen.getByPlaceholderText('Minimum 8 characters');
            const confirmPassInput = screen.getByPlaceholderText('Repeat new password');
            const submitButton = screen.getByRole('button', { name: /Reset Access Password/i });

            await user.type(newPassInput, 'short');
            await user.type(confirmPassInput, 'short');
            await user.click(submitButton);

            expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters for clinical security.');
            expect(authService.performPasswordReset).not.toHaveBeenCalled();
        });

        it('FE-UT-121: ResetPassword - Happy Path: Password Reset Success', async () => {
            authService.verifyPasswordReset.mockResolvedValue({});
            authService.performPasswordReset.mockResolvedValue({ message: 'Password updated successfully' });
            renderReset();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Reset Access Password/i })).toBeInTheDocument();
            });

            const newPassInput = screen.getByPlaceholderText('Minimum 8 characters');
            const confirmPassInput = screen.getByPlaceholderText('Repeat new password');
            const submitButton = screen.getByRole('button', { name: /Reset Access Password/i });

            await user.type(newPassInput, 'NewStrongPass123!');
            await user.type(confirmPassInput, 'NewStrongPass123!');
            await user.click(submitButton);

            await waitFor(() => {
                expect(authService.performPasswordReset).toHaveBeenCalledWith({
                    id: 'abc',
                    token: 'xyz',
                    newPassword: 'NewStrongPass123!'
                });
                expect(toast.success).toHaveBeenCalledWith('Password updated successfully', { id: 'loading-toast-id' });
            });

            await waitFor(() => {
                expect(screen.getByTestId('login-page')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('FE-UT-122: ResetPassword - Failure: Reset API Error', async () => {
            authService.verifyPasswordReset.mockResolvedValue({});
            authService.performPasswordReset.mockRejectedValue({ response: { data: { message: 'Reset failed server side' } } });
            renderReset();

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Reset Access Password/i })).toBeInTheDocument();
            });

            const newPassInput = screen.getByPlaceholderText('Minimum 8 characters');
            const confirmPassInput = screen.getByPlaceholderText('Repeat new password');
            const submitButton = screen.getByRole('button', { name: /Reset Access Password/i });

            await user.type(newPassInput, 'NewStrongPass123!');
            await user.type(confirmPassInput, 'NewStrongPass123!');
            await user.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Reset failed server side', { id: 'loading-toast-id' });
            });
        });
    });
});
