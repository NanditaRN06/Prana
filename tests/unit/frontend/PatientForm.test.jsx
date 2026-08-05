import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PatientForm from '@frontend/components/PatientForm';
import { toast } from 'react-hot-toast';

// Mock toast
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(() => 'loading-id'),
        dismiss: vi.fn(),
    }
}));

describe('PatientForm Component Tests', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const fillBasicFields = () => {
        fireEvent.change(screen.getByLabelText(/Patient Full Name/i), { target: { value: 'Test Patient' } });
        fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '35' } });
        fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
        fireEvent.change(screen.getByLabelText(/Examination Date & Time/i), { target: { value: '2023-01-01T10:00' } });
    };

    it('FE-UT-263: PatientForm - Happy Path: Vitals input recording', async () => {
        const initialData = { comorbidityData: [{ name: 'None', duration: '' }] };
        const { container } = render(
            <MemoryRouter>
                <PatientForm initialData={initialData} onSubmit={mockOnSubmit} mode="create" />
            </MemoryRouter>
        );

        fillBasicFields();

        fireEvent.change(screen.getByLabelText(/Pulse/i), { target: { value: '72' } });
        fireEvent.change(screen.getByLabelText(/BP Systolic/i), { target: { value: '120' } });
        fireEvent.change(screen.getByLabelText(/BP Diastolic/i), { target: { value: '80' } });

        const submitButton = screen.getByRole('button', { name: /Save Patient Record/i });
        await waitFor(() => expect(submitButton).not.toBeDisabled());

        fireEvent.submit(container.querySelector('form'));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Test Patient',
                vitals: expect.objectContaining({
                    pulse: 72,
                    bp: { systolic: 120, diastolic: 80 }
                })
            }));
        }, { timeout: 4000 });
    });

    it('FE-UT-264: PatientForm - Invalid Input: Form validation UI (pulse > 300)', async () => {
        render(<MemoryRouter><PatientForm onSubmit={mockOnSubmit} mode="create" /></MemoryRouter>);
        const pulseInput = screen.getByLabelText(/Pulse/i);
        fireEvent.change(pulseInput, { target: { value: '350' } });
        
        // Clicking the button should trigger browser validation which fireEvent.submit bypasses
        const submitButton = screen.getByRole('button', { name: /Save Patient Record/i });
        fireEvent.click(submitButton);

        expect(pulseInput.checkValidity()).toBe(false);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('FE-UT-265: PatientForm - Invalid Input: Incomplete BP', async () => {
        const initialData = { comorbidityData: [{ name: 'None', duration: '' }] };
        const { container } = render(
            <MemoryRouter>
                <PatientForm initialData={initialData} onSubmit={mockOnSubmit} mode="create" />
            </MemoryRouter>
        );
        fillBasicFields();
        fireEvent.change(screen.getByLabelText(/BP Systolic/i), { target: { value: '120' } });
        
        fireEvent.submit(container.querySelector('form'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Please enter both the Systolic and Diastolic blood pressure values, or leave both empty.");
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    it('FE-UT-266: PatientForm - Failure: API Error Handling', async () => {
        const failingSubmit = vi.fn().mockRejectedValue(new Error("API Failure"));
        const initialData = { comorbidityData: [{ name: 'None', duration: '' }] };
        const { container } = render(
            <MemoryRouter>
                <PatientForm initialData={initialData} onSubmit={failingSubmit} mode="create" />
            </MemoryRouter>
        );
        
        fillBasicFields();
        
        const submitButton = screen.getByRole('button', { name: /Save Patient Record/i });
        await waitFor(() => expect(submitButton).not.toBeDisabled());
        
        fireEvent.submit(container.querySelector('form'));

        await waitFor(() => {
            expect(failingSubmit).toHaveBeenCalled();
            expect(screen.getByLabelText(/Patient Full Name/i)).toHaveValue('Test Patient');
        }, { timeout: 4000 });
    });

    it('FE-UT-180: PatientForm - UI: Edit mode submit label', () => {
        render(
            <MemoryRouter>
                <PatientForm onSubmit={mockOnSubmit} mode="edit" initialData={{ comorbidityData: [] }} />
            </MemoryRouter>
        );
        expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('FE-UT-181: PatientForm - UI: Create header styling', () => {
        const { container } = render(
            <MemoryRouter>
                <PatientForm onSubmit={mockOnSubmit} mode="create" />
            </MemoryRouter>
        );
        // The header is the first div with a background color
        const header = container.querySelector('.bg-slate-900');
        expect(header).toBeInTheDocument();
        expect(screen.getByText(/New Patient Entry/i)).toBeInTheDocument();
    });

    it('FE-UT-182: PatientForm - UI: Edit header styling', () => {
        const { container } = render(
            <MemoryRouter>
                <PatientForm onSubmit={mockOnSubmit} mode="edit" initialData={{ comorbidityData: [] }} />
            </MemoryRouter>
        );
        const header = container.querySelector('.bg-blue-600');
        expect(header).toBeInTheDocument();
        expect(screen.getByText(/Edit Patient Record/i)).toBeInTheDocument();
    });

    it('FE-UT-183: PatientForm - Edge Case: Default initialData is {}', () => {
        render(
            <MemoryRouter>
                <PatientForm onSubmit={mockOnSubmit} mode="create" />
            </MemoryRouter>
        );
        // Just checking it renders without crashing
        expect(screen.getByLabelText(/Patient Full Name/i)).toBeInTheDocument();
    });
});
