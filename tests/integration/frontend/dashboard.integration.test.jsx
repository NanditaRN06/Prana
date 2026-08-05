import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Dashboard & Search', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, { fullName: "Dr. Jane Doe" });
        mockApi.onGet('/').reply(200);
        
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderAppAtHome = async () => {
        window.history.pushState({}, '', '/home');
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        return utils;
    };

    it('FE-IT-24: Home → Greeting Display', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        await renderAppAtHome();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Dr\. Jane Doe's Workspace/i })).toBeInTheDocument();
        });
    });

    it('FE-IT-25: Search → Results → Navigate to Patient', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        mockApi.onGet('/api/search-patients?query=Jane').reply(200, [
            { _id: '123456789', name: 'Jane Doe', age: 30 }
        ]);

        await renderAppAtHome();

        const searchInput = screen.getByPlaceholderText(/Search Clinical Registry/i);
        
        await user.type(searchInput, 'Jane');
        
        act(() => {
            vi.advanceTimersByTime(350);
        });

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
            expect(screen.getByText(/30 Years/i)).toBeInTheDocument();
        });

        // Click on the result
        await user.click(screen.getByText('Jane Doe'));

        // Wait for router navigation to take place
        // The mock for the patient API isn't strictly necessary since we just check URL/Router state
        // or check that the Patient view starts mounting
        await waitFor(() => {
            // Patient View will mount and show a loading pulse or error if mock fails, 
            // but the URL matches, so we look for something in the Patient View
            expect(window.location.pathname).toBe('/patient/Jane%20Doe');
        });
    });

    it('FE-IT-26: Search → No Results', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        mockApi.onGet('/api/search-patients?query=zzzznonexistent').reply(200, []);

        await renderAppAtHome();

        const searchInput = screen.getByPlaceholderText(/Search Clinical Registry/i);
        await user.type(searchInput, 'zzzznonexistent');
        
        act(() => {
            vi.advanceTimersByTime(350);
        });

        await waitFor(() => {
            expect(screen.getByText('No Registry Matches')).toBeInTheDocument();
            expect(screen.getByText(/Unable to locate records for "zzzznonexistent"/i)).toBeInTheDocument();
        });
    });

    it('FE-IT-27: Search → Debounce Behavior', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        mockApi.onGet('/api/search-patients?query=Ja').reply(200, []);
        mockApi.onGet('/api/search-patients?query=Jane').reply(200, []);

        await renderAppAtHome();

        const searchInput = screen.getByPlaceholderText(/Search Clinical Registry/i);
        
        // Type quickly
        await user.type(searchInput, 'J');
        await user.type(searchInput, 'a');
        act(() => vi.advanceTimersByTime(100));
        await user.type(searchInput, 'n');
        await user.type(searchInput, 'e');
        
        // Wait full debounce time
        act(() => vi.advanceTimersByTime(350));

        await waitFor(() => {
            // Should only have called search API once with 'Jane', not with intermediate values
            const searchRequests = mockApi.history.get.filter(req => req.url.includes('/api/search-patients'));
            expect(searchRequests.length).toBe(1);
            expect(searchRequests[0].url).toBe('/api/search-patients?query=Jane');
        });
    });

    it('FE-IT-28: Search → Snippet Highlighting', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        mockApi.onGet('/api/search-patients?query=migraine').reply(200, [
            { 
                _id: '123', 
                name: 'Test Patient', 
                age: 45,
                clinicalDiagnosis: 'Severe chronic migraine with aura' 
            }
        ]);

        await renderAppAtHome();

        const searchInput = screen.getByPlaceholderText(/Search Clinical Registry/i);
        await user.type(searchInput, 'migraine');
        
        act(() => vi.advanceTimersByTime(350));

        await waitFor(() => {
            expect(screen.getByText(/Severe chronic/i)).toBeInTheDocument();
            const highlightedEl = screen.getByText('migraine');
            expect(highlightedEl.tagName.toLowerCase()).toBe('span');
            expect(highlightedEl).toHaveClass('font-bold', 'underline');
        });
    });

    it('FE-IT-29: Dashboard → Navigation Cards', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        await renderAppAtHome();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Dr\. Jane Doe's Workspace/i })).toBeInTheDocument();
        });

        // Assuming DashboardCards use these headings
        const newEntryLink = screen.getByRole('heading', { name: /New Patient Entry/i }).closest('a');
        expect(newEntryLink).toHaveAttribute('href', '/new-entry');

        const accountLink = screen.getByRole('heading', { name: /Account Settings/i }).closest('a');
        expect(accountLink).toHaveAttribute('href', '/account');
    });

    it('FE-IT-30: Dashboard → Logout', async () => {
        mockApi.onGet('/api/account').reply(200, { fullName: "Jane Doe" });
        mockApi.onPost('/logout').reply(200, { message: "Logged out" });
        
        // Mock reload
        const originalLocation = window.location;
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, reload: reloadMock }
        });
        
        await renderAppAtHome();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Dr\. Jane Doe's Workspace/i })).toBeInTheDocument();
        });

        const logoutBtn = screen.getByRole('button', { name: /Logout/i, hidden: true }).closest('button');
        await user.click(logoutBtn);

        await waitFor(() => {
            expect(mockApi.history.post.some(req => req.url === '/logout')).toBe(true);
        });

        await waitFor(() => {
            expect(screen.getByText('Session successfully terminated.')).toBeInTheDocument();
        });

        expect(window.localStorage.getItem('isLoggedIn')).toBeNull();
        
        act(() => vi.advanceTimersByTime(550));
        
        expect(reloadMock).toHaveBeenCalled();

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation
        });
    });
});
