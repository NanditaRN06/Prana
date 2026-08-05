import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Authentication Flow — Signup', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        window.history.pushState({}, '', '/signup');
        
        mockApi.onGet('/api/check-auth').reply(401);
        mockApi.onGet('/').reply(200);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderAppAtSignup = async () => {
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
        });
        return utils;
    };

    const fillForm = async (data) => {
        if (data.fullName) await user.type(screen.getByPlaceholderText('Dr. Jane Doe'), data.fullName);
        if (data.username) await user.type(screen.getByPlaceholderText('janedoe_md'), data.username);
        if (data.email) await user.type(screen.getByPlaceholderText('jane.doe@clinic.com'), data.email);
        if (data.countryCode) {
            const cc = screen.getByPlaceholderText('+91');
            await user.clear(cc);
            await user.type(cc, data.countryCode);
        }
        if (data.phoneDigits) await user.type(screen.getByPlaceholderText('10 Digits'), data.phoneDigits);
        
        const pwds = screen.getAllByPlaceholderText('••••••••');
        if (data.password) await user.type(pwds[0], data.password);
        if (data.confirmPassword) await user.type(pwds[1], data.confirmPassword);
    };

    it('FE-IT-06: Signup → Success → Login Redirect', async () => {
        mockApi.onPost('/signup').reply(200, {
            message: "Account successfully created.",
            user: { username: "janedoe" }
        });

        await renderAppAtSignup();

        await fillForm({
            fullName: "Dr. Jane",
            username: "janedoe",
            email: "jane@clinic.com",
            countryCode: "+91",
            phoneDigits: "9876543210",
            password: "Secure@123",
            confirmPassword: "Secure@123"
        });

        await user.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(mockApi.history.post.some(req => req.url === '/signup')).toBe(true);
        });

        const signupReq = mockApi.history.post.find(req => req.url === '/signup');
        expect(JSON.parse(signupReq.data)).toEqual({
            fullName: "Dr. Jane",
            email: "jane@clinic.com",
            username: "janedoe",
            phoneNumber: "+91 9876543210",
            password: "Secure@123"
        });

        await waitFor(() => {
            expect(screen.getByText('Account created successfully.')).toBeInTheDocument();
        });

        // Verify redirect to login happens after 1.5s
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('FE-IT-07: Signup → Password Mismatch', async () => {
        await renderAppAtSignup();

        await fillForm({
            fullName: "Dr. Jane",
            username: "janedoe",
            email: "jane@clinic.com",
            phoneDigits: "9876543210",
            password: "Abc@1234",
            confirmPassword: "Xyz@1234"
        });

        await user.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
        });

        expect(mockApi.history.post.length).toBe(0);
    });

    it('FE-IT-08: Signup → Invalid Email', async () => {
        await renderAppAtSignup();

        await fillForm({
            fullName: "Dr. Jane",
            username: "janedoe",
            email: "not-an-email",
            phoneDigits: "9876543210",
            password: "Secure@123",
            confirmPassword: "Secure@123"
        });

        const submitBtn = screen.getByRole('button', { name: /Create Account/i });
        fireEvent.submit(submitBtn.closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
        });

        expect(mockApi.history.post.length).toBe(0);
    });


    it('FE-IT-09: Signup → Short Password', async () => {
        await renderAppAtSignup();

        await fillForm({
            fullName: "Dr. Jane",
            username: "janedoe",
            email: "jane@clinic.com",
            phoneDigits: "9876543210",
            password: "Ab@1",
            confirmPassword: "Ab@1"
        });

        // The tooltip should appear
        expect(screen.getByText('Min 8 Chars')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 8 characters (letters, numbers, _, @).')).toBeInTheDocument();
        });

        expect(mockApi.history.post.length).toBe(0);
    });

    it('FE-IT-10: Signup → Duplicate Email/Username', async () => {
        mockApi.onPost('/signup').reply(400, {
            message: "Email already registered"
        });

        await renderAppAtSignup();

        await fillForm({
            fullName: "Dr. Jane",
            username: "janedoe",
            email: "existing@clinic.com",
            phoneDigits: "9876543210",
            password: "Secure@123",
            confirmPassword: "Secure@123"
        });

        await user.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText('Email already registered')).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('FE-IT-11: Signup → Username Warning Toast', async () => {
        await renderAppAtSignup();

        const usernameInput = screen.getByPlaceholderText('janedoe_md');
        
        await user.type(usernameInput, 'a');

        await waitFor(() => {
            expect(screen.getByText('Note: Username cannot be changed once created.')).toBeInTheDocument();
        });
    });
});
