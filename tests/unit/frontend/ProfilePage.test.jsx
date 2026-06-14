import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../../../frontend/src/pages/ProfilePage';
import * as authService from '../../../frontend/src/services/authService';

vi.mock('../../../frontend/src/services/authService', () => ({
    getAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    deactivateAccount: vi.fn()
}));

const mocks = vi.hoisted(() => {
    const mockToastFn = vi.fn((content) => {
        if (typeof content === 'function' || typeof content === 'object') {
            const { render } = require('@testing-library/react');
            render(<div data-testid="toast-container">{content((id) => id)}</div>);
        }
    });
    mockToastFn.loading = vi.fn().mockReturnValue('toast-id');
    mockToastFn.success = vi.fn();
    mockToastFn.error = vi.fn();
    mockToastFn.dismiss = vi.fn();
    return { mockToastFn };
});

vi.mock('react-hot-toast', () => ({
    toast: mocks.mockToastFn
}));

const { mockToastFn } = mocks;


describe('ProfilePage Component Tests', () => {
    let user;

    beforeEach(() => {
        user = userEvent.setup({ delay: null });
        vi.clearAllMocks();
        // Default: logged in
        Storage.prototype.getItem = vi.fn(() => 'true');
        Storage.prototype.removeItem = vi.fn();
    });

    const mockUserData = {
        fullName: 'Dr. John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        phoneNumber: '+91 9876543210',
        department: 'Neurology',
        position: 'Head',
        qualifications: ['MBBS', 'MD'],
        consultationAddress: '123 Health St',
        consultationHospital: 'General Hospital',
        kmcNumber: '12345'
    };

    it('FE-UT-138: ProfilePage - Loads and displays user data', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading profile...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
            expect(screen.getByText('Neurology')).toBeInTheDocument();
        });
    });

    it('FE-UT-139: ProfilePage - Not logged in -> redirect to /login', async () => {
        Storage.prototype.getItem = vi.fn(() => null);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        // Does not call getAccount
        expect(authService.getAccount).not.toHaveBeenCalled();
    });

    it('FE-UT-140: ProfilePage - Click "Edit Profile" -> edit mode', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        
        await user.click(screen.getByText('Edit Profile'));

        // Should see inputs with the values
        const nameInput = screen.getByDisplayValue('Dr. John Doe');
        expect(nameInput).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('FE-UT-141: handleSave - Save -> toast success + update state', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.updateAccount.mockResolvedValue();
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByDisplayValue('Dr. John Doe');
        await user.clear(nameInput);
        await user.type(nameInput, 'Dr. Jane Doe');

        await user.click(screen.getByText('Save Changes'));

        expect(mockToastFn.loading).toHaveBeenCalledWith('Updating your profile...');
        await waitFor(() => {
            expect(authService.updateAccount).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Dr. Jane Doe' }));
            expect(mockToastFn.success).toHaveBeenCalledWith('Profile saved.', { id: 'toast-id' });
        });
        
        // Returns to view mode with new name
        expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('FE-UT-142: handleSave - Save fails -> toast error', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.updateAccount.mockRejectedValue(new Error('Update failed'));
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        await user.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(mockToastFn.error).toHaveBeenCalledWith('Failed to update profile details.', { id: 'toast-id' });
        });
    });

    it('FE-UT-143: ProfilePage - Cancel edit -> returns to view mode', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        await user.click(screen.getByText('Cancel'));

        // View mode
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('FE-UT-144: ProfilePage - Username field disabled in edit', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        const usernameInput = screen.getByDisplayValue('johndoe');
        expect(usernameInput).toBeDisabled();
    });

    it('FE-UT-145: ProfilePage - Email field disabled in edit', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        const emailInput = screen.getByDisplayValue('john@example.com');
        expect(emailInput).toBeDisabled();
    });

    it('FE-UT-146: ProfilePage - Qualifications CRUD works', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Dr. John Doe'));
        await user.click(screen.getByText('Edit Profile'));

        // Add
        await user.click(screen.getByText('+ Add Qualification'));
        const inputs = screen.getAllByPlaceholderText('ex: MBBS');
        expect(inputs.length).toBe(3); // MBBS, MD, and new one

        await user.type(inputs[2], 'PhD');
        expect(inputs[2].value).toBe('PhD');

        // Remove the first one (MBBS)
        const removeButtons = screen.getAllByText('-');
        await user.click(removeButtons[0]);

        const inputsAfter = screen.getAllByPlaceholderText('ex: MBBS');
        expect(inputsAfter.length).toBe(2);
        expect(inputsAfter[0].value).toBe('MD');
    });

    it('FE-UT-147: performDelete - Delete account -> clears session, navigates', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.deleteAccount.mockResolvedValue();
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Delete Account'));
        await user.click(screen.getByText('Delete Account'));

        // The toast component with Confirm Delete is rendered by mockToastFn via portal
        const confirmBtn = screen.getByText('Confirm Delete');
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(mockToastFn.loading).toHaveBeenCalledWith('Deleting your account...');
            expect(authService.deleteAccount).toHaveBeenCalled();
            expect(mockToastFn.success).toHaveBeenCalledWith('Account deleted.', { id: 'toast-id' });
            expect(Storage.prototype.removeItem).toHaveBeenCalledWith('isLoggedIn');
        });
    });

    it('FE-UT-148: performDelete - Delete fails -> toast error', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.deleteAccount.mockRejectedValue(new Error('Delete error'));
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Delete Account'));
        await user.click(screen.getByText('Delete Account'));

        const confirmBtn = screen.getByText('Confirm Delete');
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(mockToastFn.error).toHaveBeenCalledWith('Error during account termination.', { id: 'toast-id' });
        });
    });

    it('FE-UT-149: toDelete - Confirmation toast with Cancel/Confirm', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Delete Account'));
        await user.click(screen.getByText('Delete Account'));

        expect(mockToastFn).toHaveBeenCalled();
        expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
        
        const cancelBtn = screen.getAllByText('Cancel').find(b => b.tagName === 'BUTTON');
        await user.click(cancelBtn);
        expect(mockToastFn.dismiss).toHaveBeenCalled();
    });

    it('FE-UT-150: performDeactivate - Deactivation -> clears session, navigates', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.deactivateAccount.mockResolvedValue();
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Deactivate Account'));
        const deactivateBtn = screen.getByText('Deactivate Account');
        const reactKey = Object.keys(deactivateBtn).find(k => k.startsWith('__reactProps$'));
        act(() => {
            deactivateBtn[reactKey].onClick();
        });

        const confirmBtn = screen.getByText('Confirm Deactivate');
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(mockToastFn.loading).toHaveBeenCalledWith('Deactivating your account...');
            expect(authService.deactivateAccount).toHaveBeenCalled();
            expect(mockToastFn.success).toHaveBeenCalledWith('Account successfully deactivated.', { id: 'toast-id' });
            expect(Storage.prototype.removeItem).toHaveBeenCalledWith('isLoggedIn');
        });
    });

    it('FE-UT-151: performDeactivate - Deactivation fails -> toast error', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        authService.deactivateAccount.mockRejectedValue(new Error('Deactivate error'));
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('Deactivate Account'));
        const deactivateBtn = screen.getByText('Deactivate Account');
        const reactKey = Object.keys(deactivateBtn).find(k => k.startsWith('__reactProps$'));
        act(() => {
            deactivateBtn[reactKey].onClick();
        });

        const confirmBtn = screen.getByText('Confirm Deactivate');
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(mockToastFn.error).toHaveBeenCalledWith('Error during account deactivation.', { id: 'toast-id' });
        });
    });

    it('FE-UT-152: ProfilePage - Deactivate button is currently disabled', async () => {
        authService.getAccount.mockResolvedValue(mockUserData);
        
        render(
            <MemoryRouter>
                <ProfilePage />
            </MemoryRouter>
        );

        await waitFor(() => {
            const btn = screen.getByText('Deactivate Account');
            expect(btn).toBeDisabled();
        });
    });
});
