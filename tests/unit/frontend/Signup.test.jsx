import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signup from '@frontend/pages/auth/Signup';
import * as authService from '@frontend/services/authService';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@frontend/services/authService', () => ({
    signup: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: vi.fn(),
}));

// We need to attach properties to the mock
toast.error = vi.fn();
toast.success = vi.fn();
toast.loading = vi.fn().mockReturnValue('loading-toast-id');

const renderSignup = () => {
    return render(
        <MemoryRouter initialEntries={['/signup']}>
            <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('Signup Component', () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup({ delay: null });
    });

    it('FE-UT-113: Signup Comp - State update: Phone input digits only', async () => {
        renderSignup();
        
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        await user.type(phoneInput, '123abc456!');

        expect(phoneInput.value).toBe('123456'); // Only digits should be captured
    });

    it('FE-UT-107: Signup Comp - Invalid Input: Empty Fields', async () => {
        renderSignup();
        
        const submitButton = screen.getByRole('button', { name: /Create Account/i });
        const form = submitButton.closest('form');
        const handleSubmit = vi.fn((e) => e.preventDefault());
        form.addEventListener('submit', handleSubmit);
        
        await user.click(submitButton);
        expect(authService.signup).not.toHaveBeenCalled();
    });

    it('FE-UT-108: Signup Comp - Invalid Input: Invalid Email', async () => {
        renderSignup();
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'invalidemail@abc');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'Password123@');
        await user.type(confirmInput, 'Password123@');
        
        await user.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address.');
        expect(authService.signup).not.toHaveBeenCalled();
    });

    it('FE-UT-109: Signup Comp - Invalid Input: Weak Password', async () => {
        renderSignup();
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'johndoe@email.com');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'weak');
        await user.type(confirmInput, 'weak');
        
        await user.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters (letters, numbers, _, @).');
        expect(authService.signup).not.toHaveBeenCalled();
    });

    it('FE-UT-110: Signup Comp - Invalid Input: Passwords mismatch', async () => {
        renderSignup();
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'johndoe@email.com');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'Password123@');
        await user.type(confirmInput, 'Password123@_different');
        
        await user.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
        expect(authService.signup).not.toHaveBeenCalled();
    });

    it('FE-UT-106: Signup Comp - Happy Path: Successful Signup', async () => {
        renderSignup();
        authService.signup.mockResolvedValue({});
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'johndoe@email.com');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'Password123@');
        await user.type(confirmInput, 'Password123@');
        
        await user.click(submitButton);

        await waitFor(() => {
            expect(authService.signup).toHaveBeenCalledWith({
                fullName: 'John Doe',
                username: 'johndoe',
                email: 'johndoe@email.com',
                phoneNumber: '+91 1234567890',
                password: 'Password123@'
            });
            expect(toast.success).toHaveBeenCalledWith('Account created successfully.', { id: 'loading-toast-id' });
        });

        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('FE-UT-111: Signup Comp - Failure: Duplicate Username', async () => {
        renderSignup();
        authService.signup.mockRejectedValue({ response: { data: { message: 'Username already exists.' } } });
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'johndoe@email.com');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'Password123@');
        await user.type(confirmInput, 'Password123@');
        
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Username already exists.', { id: 'loading-toast-id' });
        });
    });

    it('FE-UT-112: Signup Comp - Failure: Network Error', async () => {
        renderSignup();
        authService.signup.mockRejectedValue(new Error('Network Error'));
        
        const nameInput = screen.getByPlaceholderText(/Dr. Jane Doe/i);
        const usernameInput = screen.getByPlaceholderText(/janedoe_md/i);
        const emailInput = screen.getByPlaceholderText(/jane.doe@clinic.com/i);
        const phoneInput = screen.getByPlaceholderText(/10 Digits/i);
        const passInputs = screen.getAllByPlaceholderText(/••••••••/i);
        const passInput = passInputs[0];
        const confirmInput = passInputs[1];
        const submitButton = screen.getByRole('button', { name: /Create Account/i });

        await user.type(nameInput, 'John Doe');
        await user.type(usernameInput, 'johndoe');
        await user.type(emailInput, 'johndoe@email.com');
        await user.type(phoneInput, '1234567890');
        await user.type(passInput, 'Password123@');
        await user.type(confirmInput, 'Password123@');
        
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred during registration.', { id: 'loading-toast-id' });
        });
    });
});
