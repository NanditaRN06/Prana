import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signin from '@frontend/pages/auth/Signin';
import * as authService from '@frontend/services/authService';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@frontend/services/authService', () => ({
    login: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn().mockReturnValue('loading-toast-id'),
    }
}));

const renderSignin = (onLoginSuccess = vi.fn()) => {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Signin onLoginSuccess={onLoginSuccess} />} />
                <Route path="/home" element={<div data-testid="home-page">Home</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('Signin Component', () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
        window.localStorage.clear();
    });

    it('FE-UT-104: Signin Comp - State update: Input fields', async () => {
        renderSignin();
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');

        expect(usernameInput.value).toBe('testuser');
        expect(passwordInput.value).toBe('password123');
    });

    it('FE-UT-100: Signin Comp - Invalid Input: Empty Fields', async () => {
        renderSignin();
        
        const submitButton = screen.getByRole('button', { name: /Login/i });
        const form = submitButton.closest('form');
        const handleSubmit = vi.fn((e) => e.preventDefault());
        form.addEventListener('submit', handleSubmit);
        
        // Browsers handle HTML5 validation, so login API shouldn't be called
        // If we click submit with empty required fields, the form shouldn't be submitted
        await user.click(submitButton);
        
        expect(authService.login).not.toHaveBeenCalled();
    });

    it('FE-UT-99: Signin Comp - Happy Path: Successful Login', async () => {
        const onLoginSuccess = vi.fn();
        renderSignin(onLoginSuccess);
        
        authService.login.mockResolvedValue({ authenticated: true, message: 'Success' });
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Login/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
            expect(window.localStorage.getItem('isLoggedIn')).toBe('true');
            expect(window.localStorage.getItem('username')).toBe('testuser');
            expect(toast.success).toHaveBeenCalledWith('Login successful. Welcome back!', { id: 'loading-toast-id' });
            expect(onLoginSuccess).toHaveBeenCalled();
        });
    });

    it('FE-UT-105: Signin Comp - Redirect logic', async () => {
        renderSignin();
        authService.login.mockResolvedValue({ authenticated: true });
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Login/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByTestId('home-page')).toBeInTheDocument();
        });
    });

    it('FE-UT-103: Signin Comp - Edge Case: authenticated payload false', async () => {
        renderSignin();
        authService.login.mockResolvedValue({ authenticated: false, message: 'Invalid token' });
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Login/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid token', { id: 'loading-toast-id' });
            expect(window.localStorage.getItem('isLoggedIn')).toBeNull();
        });
    });

    it('FE-UT-101: Signin Comp - Failure: Invalid Credentials', async () => {
        renderSignin();
        authService.login.mockRejectedValue({ response: { data: { message: 'Access denied' } } });
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Login/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'wrongpass');
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Access denied', { id: 'loading-toast-id' });
        });
    });

    it('FE-UT-102: Signin Comp - Failure: Network Error', async () => {
        renderSignin();
        authService.login.mockRejectedValue(new Error('Network Error'));
        
        const usernameInput = screen.getByPlaceholderText(/Username, Email or Phone/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Login/i });

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Internal authentication error.', { id: 'loading-toast-id' });
        });
    });
});
