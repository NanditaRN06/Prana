import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '@frontend/pages/dashboard/Home';
import * as authService from '@frontend/services/authService';
import * as authUtils from '@frontend/utils/auth';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@frontend/services/authService', () => ({
    getAccount: vi.fn(),
}));

vi.mock('@frontend/utils/auth', () => ({
    logout: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock SearchBar to prevent actual rendering
vi.mock('@frontend/components/SearchBar', () => ({
    default: () => <div data-testid="search-bar">SearchBarMock</div>
}));

describe('HomePage Component', () => {
    let user;
    let originalConsoleError;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup({ delay: null });
        window.localStorage.clear();
        
        // Suppress console.error for API failure tests
        originalConsoleError = console.error;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock window.location.reload
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: vi.fn() },
        });
        
        // Mock default getAccount
        authService.getAccount.mockResolvedValue({ fullName: 'Jane Doe' });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    const renderHome = () => {
        return render(
            <MemoryRouter initialEntries={['/home']}>
                <Routes>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/" element={<div data-testid="landing-page">Landing</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('FE-UT-125: Home Comp - Happy Path: Render content', async () => {
        renderHome();
        
        await waitFor(() => {
            expect(screen.getByText(/Prana Provider Dashboard/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
            expect(screen.getByText(/Welcome to the Prana Clinical Information System./i)).toBeInTheDocument();
        });
    });

    it('FE-UT-126: Home Comp - Happy Path: Render username', async () => {
        renderHome();
        
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Dr\. Jane Doe's Workspace/i })).toBeInTheDocument();
        });
    });

    it('FE-UT-127: Home Comp - Failure: Auth API Error', async () => {
        authService.getAccount.mockRejectedValue(new Error('API Error'));
        renderHome();
        
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Loading your workspace\.\.\./i })).toBeInTheDocument();
            expect(console.error).toHaveBeenCalled();
        });
    });

    it('FE-UT-128: Home Comp - Happy Path: Logout Success', async () => {
        authUtils.logout.mockResolvedValue(true);
        
        renderHome();
        
        const logoutButton = screen.getByRole('button', { name: /Logout/i });
        await user.click(logoutButton);
        
        await waitFor(() => {
            expect(authUtils.logout).toHaveBeenCalled();
            expect(window.localStorage.getItem("isLoggedIn")).toBeNull();
            expect(toast.success).toHaveBeenCalledWith('Session successfully terminated.');
            expect(screen.getByTestId('landing-page')).toBeInTheDocument();
        });

        // Wait for the setTimeout for reload
        await waitFor(() => {
            expect(window.location.reload).toHaveBeenCalled();
        }, { timeout: 2000 });
    });

    it('FE-UT-129: Home Comp - Failure: Logout Failure', async () => {
        authUtils.logout.mockResolvedValue(false);
        renderHome();
        
        const logoutButton = screen.getByRole('button', { name: /Logout/i });
        await user.click(logoutButton);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Logout process encountered an error.');
            expect(window.location.reload).not.toHaveBeenCalled();
        });
    });

    it('FE-UT-130: Home Comp - Happy Path: SearchBar renders', async () => {
        renderHome();
        
        await waitFor(() => {
            expect(screen.getByTestId('search-bar')).toBeInTheDocument();
        });
    });

    it('FE-UT-237: Home Comp - Happy Path: Links navigation (/new-entry)', async () => {
        renderHome();
        
        await waitFor(() => {
            const link = screen.getByRole('link', { name: /New Patient Entry/i });
            expect(link.getAttribute('href')).toBe('/new-entry');
        });
    });

    it('FE-UT-238: Home Comp - Happy Path: Links navigation (/account)', async () => {
        renderHome();
        
        await waitFor(() => {
            const link = screen.getByRole('link', { name: /Account Settings/i });
            expect(link.getAttribute('href')).toBe('/account');
        });
    });

    it('FE-UT-239: Home Comp - Edge Case: Name missing from API', async () => {
        authService.getAccount.mockResolvedValue({}); // No fullName
        renderHome();
        
        // Wait for fetch to complete. Should fall back to "Loading your workspace..."
        // since name is undefined (falsy)
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Loading your workspace\.\.\./i })).toBeInTheDocument();
        });
    });

    it('FE-UT-240: Home Comp - State update: Not applicable, data fetching only', () => {
        // Just verify component renders cleanly without any user interaction other than mount
        renderHome();
        expect(screen.getByText(/Welcome to the Prana Clinical Information System./i)).toBeInTheDocument();
    });
});
