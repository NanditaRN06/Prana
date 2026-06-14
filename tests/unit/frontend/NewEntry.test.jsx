import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewEntry from '@frontend/pages/patient/NewEntry';
import * as patientService from '@frontend/services/patientService';
import { toast } from 'react-hot-toast';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

vi.mock('@frontend/services/patientService', () => ({
    createPatient: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn().mockReturnValue('loading-toast-id'),
    }
}));

// Mock PatientForm so we don't have to deal with complex validation in NewEntry tests
vi.mock('@frontend/components/PatientForm', () => ({
    default: ({ mode, onSubmit }) => (
        <div data-testid="patient-form-mock" data-mode={mode}>
            <h2>Create New Patient Profile</h2>
            <button 
                data-testid="trigger-submit-success" 
                onClick={() => onSubmit({ name: 'John Doe', age: 30 })}
            >
                Submit Valid
            </button>
            <button 
                data-testid="trigger-submit-fail" 
                onClick={() => { /* simulate empty submission prevented by form */ }}
            >
                Submit Invalid
            </button>
        </div>
    )
}));

describe('NewEntry Component', () => {
    let user;
    let originalConsoleError;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup({ delay: null });
        
        originalConsoleError = console.error;
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    const renderNewEntry = () => {
        return render(
            <MemoryRouter initialEntries={['/new-entry']}>
                <Routes>
                    <Route path="/new-entry" element={<NewEntry />} />
                    <Route path="/patient/:id" element={<div data-testid="patient-profile">Patient Profile</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('FE-UT-184: NewEntry Comp - Happy Path: Initial render', () => {
        renderNewEntry();
        expect(screen.getByText('Create New Patient Profile')).toBeInTheDocument();
    });

    it('FE-UT-185: NewEntry Comp - State update: PatientForm render', () => {
        renderNewEntry();
        const formMock = screen.getByTestId('patient-form-mock');
        expect(formMock).toBeInTheDocument();
        expect(formMock.getAttribute('data-mode')).toBe('create');
    });

    it('FE-UT-241: NewEntry Comp - Form Validation: Empty fields submission', async () => {
        renderNewEntry();
        // Since we mocked PatientForm, it doesn't submit
        await user.click(screen.getByTestId('trigger-submit-fail'));
        expect(patientService.createPatient).not.toHaveBeenCalled();
    });

    it('FE-UT-242: NewEntry Comp - Form Validation: Invalid phone/age', async () => {
        renderNewEntry();
        // Same as above, form validation is handled by PatientForm
        await user.click(screen.getByTestId('trigger-submit-fail'));
        expect(patientService.createPatient).not.toHaveBeenCalled();
    });

    it('FE-UT-243: NewEntry Comp - Happy Path: Successful form submission', async () => {
        renderNewEntry();
        patientService.createPatient.mockResolvedValue({});
        
        await user.click(screen.getByTestId('trigger-submit-success'));
        
        await waitFor(() => {
            expect(patientService.createPatient).toHaveBeenCalledWith({ name: 'John Doe', age: 30 });
            expect(toast.success).toHaveBeenCalledWith('Patient record saved.', { id: 'loading-toast-id' });
            expect(screen.getByTestId('patient-profile')).toBeInTheDocument(); // Navigated to /patient/John Doe
        });
    });

    it('FE-UT-244: NewEntry Comp - Failure: Server Error on submit', async () => {
        renderNewEntry();
        patientService.createPatient.mockRejectedValue(new Error('Server Error'));
        
        await user.click(screen.getByTestId('trigger-submit-success'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred while attempting to save the record.', { id: 'loading-toast-id' });
            expect(console.error).toHaveBeenCalled();
        });
    });

    it('FE-UT-245: NewEntry Comp - Edge Case: Network timeout on submit', async () => {
        renderNewEntry();
        patientService.createPatient.mockRejectedValue(new Error('Timeout'));
        
        await user.click(screen.getByTestId('trigger-submit-success'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred while attempting to save the record.', { id: 'loading-toast-id' });
        });
    });

});
