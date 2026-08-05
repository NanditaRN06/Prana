import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
    FormGroup,
    GeneralInfo,
    Vitals,
    MedicalHistory,
    ClinicalFindings
} from '@frontend/components/PatientFormSections';

describe('PatientFormSections Component Tests', () => {

    describe('FormGroup Utility', () => {
        it('FE-UT-200: FormGroup - UI: Renders label with required asterisk', () => {
            render(
                <FormGroup label="Name" required={true}>
                    <input data-testid="input" />
                </FormGroup>
            );
            
            const label = screen.getByText(/Name/i);
            expect(label).toBeInTheDocument();
            // Should contain a red asterisk span
            expect(label.querySelector('.text-red-500')).toHaveTextContent('*');
        });

        it('FE-UT-201: FormGroup - UI: Renders label without asterisk when not required', () => {
            render(
                <FormGroup label="Address" required={false}>
                    <input data-testid="input" />
                </FormGroup>
            );
            
            const label = screen.getByText(/Address/i);
            expect(label).toBeInTheDocument();
            expect(label.querySelector('.text-red-500')).not.toBeInTheDocument();
        });
    });

    describe('GeneralInfo Component', () => {
        const defaultFormData = { name: '', age: '', phone: '', address: '', examdate: '2026-06-02T10:00' };
        const defaultProps = { formData: defaultFormData, handleInputChange: vi.fn() };

        it('FE-UT-202: GeneralInfo - UI: All required input fields rendered', () => {
            render(<GeneralInfo {...defaultProps} />);
            
            expect(screen.getByLabelText(/Patient Full Name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Examination Date & Time/i)).toBeInTheDocument();
        });

        it('FE-UT-203: GeneralInfo - UI: Phone input enforces numeric-only via onInput', async () => {
            const user = userEvent.setup({ delay: null });
            render(<GeneralInfo {...defaultProps} />);
            
            const phoneInput = screen.getByLabelText(/Phone Number/i);
            
            // Simulating typing non-numeric chars
            await user.type(phoneInput, 'abc123');
            
            // Check if handleInputChange was called with non-numeric stripped (if handled via controlled component)
            // or we just check the value if it's uncontrolled stripping
            // The component does: e.target.value = e.target.value.replace(/[^0-9]/g, '') in onInput
            // user.type fires multiple events including input.
            // Wait, fireEvent might be better for onInput raw testing
            
            // Testing the pure DOM onInput event effect
            phoneInput.value = 'a1b2c3';
            const event = new Event('input', { bubbles: true });
            phoneInput.dispatchEvent(event);
            
            expect(phoneInput.value).toBe('123');
        });
    });

    describe('Vitals Component', () => {
        const defaultVitals = { pulse: '', bp: { systolic: '', diastolic: '' }, spO2: '' };
        const defaultProps = { vitals: defaultVitals, handleVitalsChange: vi.fn() };

        it('FE-UT-204: Vitals - UI: All 4 vital fields rendered', () => {
            render(<Vitals {...defaultProps} />);
            
            expect(screen.getByLabelText(/Pulse/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/BP Systolic/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/BP Diastolic/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/SpO2/i)).toBeInTheDocument();
        });

        it('FE-UT-205: Vitals - UI: "Only recorded values will be saved" hint visible', () => {
            render(<Vitals {...defaultProps} />);
            expect(screen.getByText(/Only recorded values will be saved/i)).toBeInTheDocument();
        });
    });

    describe('MedicalHistory Component', () => {
        const defaultState = { comorbidities: [{ name: '', duration: '' }], formData: { allergies: 'no', allergyDetails: '' }, isSubmitting: false, customComorbidity: '' };
        const defaultActions = { setComorbidities: vi.fn(), handleInputChange: vi.fn(), setCustomComorbidity: vi.fn() };

        it('FE-UT-206: MedicalHistory - UI: Comorbidity buttons rendered for all options', () => {
            render(<MedicalHistory state={defaultState} actions={defaultActions} />);
            
            // Basic constants from COMORBIDITY_OPTIONS
            const options = ["Hypertension", "Diabetes", "Thyroid Disease", "IHD", "Old Stroke", "Others", "None"];
            options.forEach(opt => {
                expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
            });
        });

        it('FE-UT-207: MedicalHistory - UI: Selected comorbidity has active class', () => {
            render(<MedicalHistory state={{ ...defaultState, comorbidities: [{ name: 'Hypertension' }] }} actions={defaultActions} />);
            
            const htnBtn = screen.getByRole('button', { name: 'Hypertension' });
            
            expect(htnBtn.className).toContain('active');
            
            const dmBtn = screen.getByRole('button', { name: 'Diabetes' });
            expect(dmBtn.className).not.toContain('active');
        });

        it('FE-UT-208: MedicalHistory - UI: "Others" selected -> custom input section visible', () => {
            render(<MedicalHistory state={{ ...defaultState, comorbidities: [{ name: 'Others' }] }} actions={defaultActions} />);
            
            expect(screen.getByText(/Specify Other Conditions/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Condition Name/i)).toBeInTheDocument();
        });

        it('FE-UT-209: MedicalHistory - UI: "None" selected -> italic message shown', () => {
            render(<MedicalHistory state={{ ...defaultState, comorbidities: [{ name: 'None' }] }} actions={defaultActions} />);
            
            expect(screen.getByText(/No co-morbidities recorded/i)).toBeInTheDocument();
        });

        it('FE-UT-210: MedicalHistory - UI: Allergy "yes" -> textarea appears', () => {
            render(<MedicalHistory state={{ ...defaultState, formData: { allergies: 'yes', allergyDetails: '' } }} actions={defaultActions} />);
            
            expect(screen.getByPlaceholderText(/List any known drug or food allergies here/i)).toBeInTheDocument();
        });

        it('FE-UT-211: MedicalHistory - UI: Allergy "no" -> textarea hidden', () => {
            render(<MedicalHistory state={{ ...defaultState, formData: { allergies: 'no', allergyDetails: '' } }} actions={defaultActions} />);
            
            expect(screen.queryByPlaceholderText(/List any known drug or food allergies here/i)).not.toBeInTheDocument();
        });

        it('FE-UT-212: MedicalHistory - UI: Custom comorbidity remove button shown', () => {
            render(<MedicalHistory state={{ ...defaultState, comorbidities: [{ name: 'Other: Lupus' }] }} actions={defaultActions} />);
            
            // Pill should show 'Lupus' and have a close button
            expect(screen.getByText('Lupus')).toBeInTheDocument();
            // Assuming the remove button is an svg/button right next to the text inside the pill
            const pillContainer = screen.getByText('Lupus').parentElement;
            const removeBtn = pillContainer.querySelector('button');
            expect(removeBtn).toBeInTheDocument();
        });
    });

    describe('ClinicalFindings Component', () => {
        const defaultFormData = { chiefComplaints: '', examination: '', clinicalDiagnosis: '' };
        const defaultProps = { formData: defaultFormData, handleInputChange: vi.fn() };

        it('FE-UT-213: ClinicalFindings - UI: All 3 textareas rendered', () => {
            render(<ClinicalFindings {...defaultProps} />);
            
            expect(screen.getByPlaceholderText(/Main symptoms or reason for visit.../i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Notes from health assessment.../i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Final\/Provisional diagnosis.../i)).toBeInTheDocument();
        });
    });
});
