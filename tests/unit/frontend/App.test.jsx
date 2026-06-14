import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '@frontend/App';
import * as authUtils from '@frontend/utils/auth';
import * as authService from '@frontend/services/authService';
import apiClient from '@frontend/services/apiClient';
import { toast } from 'react-hot-toast';

vi.mock('@frontend/utils/auth', () => ({
    isAuthenticated: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@frontend/services/authService', () => ({
    getAccount: vi.fn(),
}));

vi.mock('@frontend/services/apiClient', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn().mockResolvedValue({ data: {} }),
    }
}));

vi.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock all pages and layout to isolate App component routing logic
vi.mock('@frontend/pages/auth/Signin', () => ({
    default: ({ onLoginSuccess }) => (
        <div data-testid="login-page">
            <button data-testid="trigger-login" onClick={onLoginSuccess}>Success</button>
        </div>
    )
}));
vi.mock('@frontend/pages/auth/Signup', () => ({ default: () => <div data-testid="signup-page">SignUp</div> }));
vi.mock('@frontend/pages/auth/PassForgot', () => ({
    ForgotPassword: () => <div data-testid="forgot-password">Forgot</div>,
    ResetPasswordWrapper: () => <div data-testid="reset-password">Reset</div>
}));
vi.mock('@frontend/pages/dashboard/Home', () => ({ default: () => <div data-testid="home-page">Home</div> }));
vi.mock('@frontend/pages/dashboard/Main', () => ({ default: () => <div data-testid="main-page">Main</div> }));
vi.mock('@frontend/pages/patient/NewEntry', () => ({ default: () => <div data-testid="new-entry">NewEntry</div> }));
vi.mock('@frontend/pages/ProfilePage', () => ({ default: () => <div data-testid="profile-page">Profile</div> }));
vi.mock('@frontend/pages/patient/PatientProfilePage', () => ({
    Patient: () => <div data-testid="patient-page">Patient</div>,
    Update: () => <div data-testid="update-page">Update</div>
}));
vi.mock('@frontend/pages/NotFound', () => ({ default: () => <div data-testid="not-found-page">404</div> }));
vi.mock('@frontend/layout/Navbar', () => ({
    default: ({ handleLogout, username }) => (
        <nav data-testid="navbar">
            <span data-testid="nav-username">{username || 'Guest'}</span>
            <button data-testid="logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
    )
}));

describe('App Routing & State Tests', () => {
    let user;
    let originalConsoleError;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
        window.history.pushState({}, 'Test', '/');
        
        originalConsoleError = console.error;
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock default authenticated state to false
        authUtils.isAuthenticated.mockResolvedValue(false);
        authService.getAccount.mockResolvedValue({ username: 'testuser' });
    });

    it('FE-UT-89: App Routing - Initial Auth Check', async () => {
        render(<App />);
        await waitFor(() => {
            expect(authUtils.isAuthenticated).toHaveBeenCalled();
        });
    });

    it('FE-UT-90: App Routing - Auth Success fetches username', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        render(<App />);
        await waitFor(() => {
            expect(authService.getAccount).toHaveBeenCalled();
            expect(screen.getByTestId('nav-username').textContent).toBe('testuser');
        });
    });

    it('FE-UT-91: App Routing - Silent Ping wakes server', async () => {
        render(<App />);
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/');
        });
    });

    it('FE-UT-92: App Routing - handleLogout Success', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        authUtils.logout.mockResolvedValue(true);
        
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('nav-username').textContent).toBe('testuser'));
        
        await user.click(screen.getByTestId('logout-btn'));
        
        await waitFor(() => {
            expect(authUtils.logout).toHaveBeenCalled();
            expect(screen.getByTestId('nav-username').textContent).toBe('Guest');
            expect(toast.success).toHaveBeenCalledWith('Session successfully terminated.');
        });
    });

    it('FE-UT-93: App Routing - handleLogout Failure', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        authUtils.logout.mockResolvedValue(false);
        
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('nav-username').textContent).toBe('testuser'));
        
        await user.click(screen.getByTestId('logout-btn'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Logout process encountered an error.');
        });
    });

    it('FE-UT-94: App Routing - Security: Unauth access to /home → redirects to /login', async () => {
        window.history.pushState({}, '', '/home');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    it('FE-UT-95: App Routing - Security: Unauth access to /account → redirects to /login', async () => {
        window.history.pushState({}, '', '/account');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    it('FE-UT-96: App Routing - Security: Unauth access to /new-entry → redirects to /login', async () => {
        window.history.pushState({}, '', '/new-entry');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    it('FE-UT-97: App Routing - Security: Unauth access to /patient/:id → redirects to /login', async () => {
        window.history.pushState({}, '', '/patient/123');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
    });

    it('FE-UT-98: App Routing - Happy Path: Authenticated access to /home', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        window.history.pushState({}, '', '/home');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    });

    it('FE-UT-196: App Routing - Failure: 404 Route', async () => {
        window.history.pushState({}, '', '/does-not-exist');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('not-found-page')).toBeInTheDocument());
    });

    it('FE-UT-197: App Routing - Route Guard (Auth user to /login → /home)', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        window.history.pushState({}, '', '/login');
        render(<App />);
        // Wait for auth check to finish and redirect to kick in
        await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    });

    it('FE-UT-198: App Routing - handleLoginSuccess sets auth and fetches username', async () => {
        window.history.pushState({}, '', '/login');
        render(<App />);
        await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
        
        await user.click(screen.getByTestId('trigger-login'));
        
        await waitFor(() => {
            expect(authService.getAccount).toHaveBeenCalled();
            expect(screen.getByTestId('nav-username').textContent).toBe('testuser');
        });
    });

    it('FE-UT-199: App Routing - fetchUsername Error handling', async () => {
        authUtils.isAuthenticated.mockResolvedValue(true);
        authService.getAccount.mockRejectedValue(new Error('Network error'));
        
        render(<App />);
        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
            expect(screen.getByTestId('nav-username').textContent).toBe('Guest');
        });
    });
});
