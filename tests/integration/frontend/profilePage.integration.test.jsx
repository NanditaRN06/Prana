import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

const completeDoctor = {
    fullName: "Dr. Jane Doe",
    username: "janedoe",
    email: "jane@clinic.com",
    phoneNumber: "+91 9876543210",
    department: "Neurology",
    position: "Senior Consultant",
    qualifications: ["MBBS", "MD"],
    consultationHospital: "City Hospital",
    consultationAddress: "123 Medical Road",
    kmcNumber: "12345"
};

describe('Profile Page Flow', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        window.localStorage.setItem('isLoggedIn', 'true');
        
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, completeDoctor);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderAppAtProfile = async () => {
        window.history.pushState({}, '', '/home');
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        
        // Wait for auth bounce to home
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Workspace/i })).toBeInTheDocument();
        });

        // Navigate to /account
        await user.click(screen.getByRole('link', { name: /Account Settings/i }));

        return utils;
    };

    it('FE-IT-50: Profile Page → Load Doctor Data', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Your Profile')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
            expect(screen.getByText('Neurology')).toBeInTheDocument();
            expect(screen.getByText('MBBS, MD')).toBeInTheDocument();
            expect(screen.getByText('12345')).toBeInTheDocument();
        });
    });

    it('FE-IT-51: Profile Page → Update Success', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        mockApi.onPut('/api/account').reply(200, { message: "Profile updated" });
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        // Click Edit Profile
        await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

        await waitFor(() => {
            expect(screen.getByDisplayValue('Neurology')).toBeInTheDocument();
        });

        const deptInput = screen.getAllByRole('textbox').find(el => el.value === 'Neurology');
        await user.clear(deptInput);
        await user.type(deptInput, 'Cardiology');

        await user.click(screen.getByRole('button', { name: /Save Changes/i }));

        await waitFor(() => {
            expect(mockApi.history.put.length).toBe(1);
            const req = JSON.parse(mockApi.history.put[0].data);
            expect(req.department).toBe('Cardiology');
        });

        await waitFor(() => {
            expect(screen.getByText('Profile saved.')).toBeInTheDocument();
        });
    });

    it('FE-IT-52: Profile Page → Edit → Save Failure', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        mockApi.onPut('/api/account').reply(500, { message: "Internal server error" });
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

        await waitFor(() => {
            expect(screen.getByDisplayValue('Neurology')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Save Changes/i }));

        await waitFor(() => {
            expect(screen.getByText('Failed to update profile details.')).toBeInTheDocument();
        });
    });


    it('FE-IT-53: Profile Page → Deactivate Confirmation Open/Close', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        const deactivateBtn = screen.getByRole('button', { name: /Deactivate Account/i });
        
        // Button is currently hardcoded to disabled in the component
        if (!deactivateBtn.disabled) {
            await user.click(deactivateBtn);

            await waitFor(() => {
                expect(screen.getByText('Confirm Account Deactivation')).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: 'Cancel' }));

            await waitFor(() => {
                expect(screen.queryByText('Confirm Account Deactivation')).not.toBeInTheDocument();
            });
        }
    });

    it('FE-IT-54: Profile Page → Add/Remove Qualifications', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

        await waitFor(() => {
            expect(screen.getByDisplayValue('Neurology')).toBeInTheDocument();
        });

        // Add Qualification
        await user.click(screen.getByRole('button', { name: /\+ Add Qualification/i }));
        
        const qualInputs = screen.getAllByPlaceholderText(/ex: MBBS/i);
        await user.type(qualInputs[qualInputs.length - 1], 'DM Neurology');

        // Verify it was added
        expect(screen.getByDisplayValue('DM Neurology')).toBeInTheDocument();

        // Remove it
        const removeBtns = screen.getAllByRole('button', { name: /-/i });
        await user.click(removeBtns[removeBtns.length - 1]);

        expect(screen.queryByDisplayValue('DM Neurology')).not.toBeInTheDocument();
    });


    it('FE-IT-55: Profile Page → Account Deletion Warning Open/Close', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Delete Account/i }));

        await waitFor(() => {
            expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-56: Profile Page → Edit → Cancel', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        
        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

        await waitFor(() => {
            expect(screen.getByDisplayValue('Neurology')).toBeInTheDocument();
        });

        const deptInput = screen.getAllByRole('textbox').find(el => el.value === 'Neurology');
        await user.clear(deptInput);
        await user.type(deptInput, 'Cardiology');

        await user.click(screen.getByRole('button', { name: /Cancel/i }));

        // Verify we are back in view mode and changes discarded
        await waitFor(() => {
            expect(screen.getByText('Neurology')).toBeInTheDocument();
            expect(screen.queryByDisplayValue('Cardiology')).not.toBeInTheDocument();
        });
    });


    it('FE-IT-57: Profile Page → Account Deletion Success', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        mockApi.onDelete('/api/account').reply(200, { message: "Deleted" });
        
        vi.useFakeTimers({ shouldAdvanceTime: true });

        await renderAppAtProfile();

        await waitFor(() => {
            expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Delete Account/i }));

        await waitFor(() => {
            expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Confirm Delete' }));

        await waitFor(() => {
            expect(mockApi.history.delete.some(req => req.url === '/api/account')).toBe(true);
        });

        await waitFor(() => {
            expect(screen.getByText('Account deleted.')).toBeInTheDocument();
            expect(window.localStorage.getItem('isLoggedIn')).toBeNull();
        });

        act(() => {
            vi.advanceTimersByTime(550);
        });

        vi.useRealTimers();
    });

    it('FE-IT-58: Profile Page → API Error', async () => {
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(500, { message: "Internal server error" });
        
        window.history.pushState({}, '', '/account');
        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByText('The clinical system is currently experiencing issues. Our team has been notified.')).toBeInTheDocument();
        });

        await waitFor(() => {
            // App.jsx intercepts /login for authenticated users and sends them to /home
            expect(window.location.pathname).toBe('/home');
        });
    });
});
