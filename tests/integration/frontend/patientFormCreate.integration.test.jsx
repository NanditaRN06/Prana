import React from 'react';
import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

describe('Patient Form — Create', () => {
    let user;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        mockApi.onGet('/api/check-auth').reply(200);
        mockApi.onGet('/api/account').reply(200, { fullName: "Dr. Jane Doe" });
        
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderAppAtNewEntry = async () => {
        window.history.pushState({}, '', '/home');
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Workspace/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('link', { name: /New Patient Entry/i }));
        
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /New Patient Entry/i, level: 1 })).toBeInTheDocument();
        });
        
        return utils;
    };

    it('FE-IT-31: New Entry → Fill Form → Save → Navigate', async () => {
        mockApi.onPost('/new-entry').reply(201, { message: "Patient saved successfully", id: '12345' });

        await renderAppAtNewEntry();

        // Fill minimum required fields
        await user.type(screen.getByPlaceholderText('Enter legal name'), 'John Doe');
        await user.type(screen.getByPlaceholderText('0-120'), '45');
        await user.type(screen.getByPlaceholderText('10-digit mobile number'), '9876543210');
        
        // Use fireEvent for datetime-local to bypass user.type buggy implementation in testing-library
        fireEvent.change(screen.getByLabelText(/Examination Date & Time/i), { target: { value: '2023-10-15T10:30' } });
        
        // Toggle Comorbidity
        const htnChip = screen.getByRole('button', { name: 'Hypertension' });
        await user.click(htnChip);

        // Submit using fireEvent to bypass userEvent HTML5 validation bug in JSDOM
        const saveBtn = screen.getByRole('button', { name: /Save Patient Record/i });
        expect(saveBtn).not.toBeDisabled();
        
        fireEvent.submit(saveBtn.closest('form'));

        await waitFor(() => {
            expect(mockApi.history.post.some(req => req.url === '/new-entry')).toBe(true);
        });

        await waitFor(() => {
            expect(screen.getByText('Patient record saved.')).toBeInTheDocument();
        });

        // Redirects to /patient/John Doe
        await waitFor(() => {
            expect(window.location.pathname).toBe('/patient/John%20Doe');
        });
    });

    it('FE-IT-32: New Entry → Submit Disabled Without Required Fields', async () => {
        await renderAppAtNewEntry();

        const saveBtn = screen.getByRole('button', { name: /Save Patient Record/i });
        
        // Initial state -> Disabled
        expect(saveBtn).toBeDisabled();

        await user.type(screen.getByLabelText(/Patient Full Name/i), 'John Doe');
        
        // Still disabled because age, phone, examdate are missing
        expect(saveBtn).toBeDisabled();

        await user.type(screen.getByLabelText(/Age \(Years\)/i), '45');
        await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
        await user.type(screen.getByLabelText(/Examination Date & Time/i), '2023-10-15T10:30');

        // Now it should be enabled
        await waitFor(() => {
            expect(saveBtn).not.toBeDisabled();
        });
    });

    it('FE-IT-33: New Entry → Investigation Region Validation', async () => {
        await renderAppAtNewEntry();

        // Check MRI button to open MRI section
        await user.click(screen.getByRole('button', { name: 'MRI' }));

        await waitFor(() => {
            expect(screen.getByText('Add MRI Region')).toBeInTheDocument();
        });

        // Find the 'Add' button for the MRI region, which might be a + button
        // Since there is an input and a + button
        const mriInput = screen.getAllByPlaceholderText(/Region/i)[0]; // First region input
        await user.type(mriInput, 'Brain');
        
        // If they click + to add the region
        const addBtns = screen.getAllByRole('button', { name: '+' });
        await user.click(addBtns[addBtns.length - 1]); // Click the last + button

        await waitFor(() => {
            expect(screen.getByText(/Brain/i)).toBeInTheDocument();
        });
    });

    it('FE-IT-34: New Entry → Partial BP Validation', async () => {
        await renderAppAtNewEntry();

        // Fill required fields
        await user.type(screen.getByPlaceholderText('Enter legal name'), 'John Doe');
        await user.type(screen.getByPlaceholderText('0-120'), '45');
        await user.type(screen.getByPlaceholderText('10-digit mobile number'), '9876543210');
        fireEvent.change(screen.getByLabelText(/Examination Date & Time/i), { target: { value: '2023-10-15T10:30' } });

        // Fill Systolic but NOT Diastolic
        await user.type(screen.getByLabelText(/BP Systolic/i), '120');

        const saveBtn = screen.getByRole('button', { name: /Save Patient Record/i });
        
        fireEvent.submit(saveBtn.closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Please enter both the Systolic and Diastolic blood pressure values, or leave both empty.')).toBeInTheDocument();
        });

        expect(mockApi.history.post.length).toBe(0);
    });

    it('FE-IT-35: New Entry → Medicine Section Toggle', async () => {
        await renderAppAtNewEntry();

        // Toggle Medicines
        await user.click(screen.getByRole('button', { name: 'Medicines' }));

        await waitFor(() => {
            expect(screen.getByText('Medicine Name')).toBeInTheDocument();
        });

        // Add medicine info
        // Need to query dynamically since input doesn't have label but rather a text label above it.
        const inputs = screen.getAllByRole('textbox');
        const numberInputs = screen.getAllByRole('spinbutton');
        
        // Type in the medicine name input (which is the first text input in the medicine row)
        // Note: the component doesn't use htmlFor, so we rely on DOM structure or aria
        // Let's rely on the first visible input that isn't general info
        // It's easier: It will be the last or near-last textbox
        await user.type(inputs[inputs.length - 1], 'Paracetamol');

        const closeBtn = screen.getByRole('button', { name: '✕' });
        await user.click(closeBtn);

        await waitFor(() => {
            expect(screen.queryByText('Medicine Name')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-36: New Entry → Full Clinical Form Submission', async () => {
        mockApi.onPost('/new-entry').reply(201, { message: "Patient saved successfully", id: '12345' });

        await renderAppAtNewEntry();

        await user.type(screen.getByPlaceholderText('Enter legal name'), 'John Doe');
        await user.type(screen.getByPlaceholderText('0-120'), '45');
        await user.type(screen.getByPlaceholderText('10-digit mobile number'), '9876543210');
        fireEvent.change(screen.getByLabelText(/Examination Date & Time/i), { target: { value: '2023-10-15T10:30' } });

        await user.type(screen.getByLabelText(/Pulse/i), '80');
        await user.type(screen.getByLabelText(/BP Systolic/i), '120');
        await user.type(screen.getByLabelText(/BP Diastolic/i), '80');

        const saveBtn = screen.getByRole('button', { name: /Save Patient Record/i });
        fireEvent.submit(saveBtn.closest('form'));

        await waitFor(() => {
            expect(mockApi.history.post.length).toBe(1);
        });

        const reqData = JSON.parse(mockApi.history.post[0].data);
        expect(reqData.vitals.pulse).toBe(80);
        expect(reqData.vitals.bp.systolic).toBe(120);
    });

    it('FE-IT-37: New Entry → API Failure', async () => {
        mockApi.onPost('/new-entry').reply(500, { message: "Internal Server Error" });

        await renderAppAtNewEntry();

        await user.type(screen.getByPlaceholderText('Enter legal name'), 'John Doe');
        await user.type(screen.getByPlaceholderText('0-120'), '45');
        await user.type(screen.getByPlaceholderText('10-digit mobile number'), '9876543210');
        await user.type(screen.getByLabelText(/Examination Date & Time/i), '2023-10-15T10:30');

        const saveBtn = screen.getByRole('button', { name: /Save Patient Record/i });
        fireEvent.submit(saveBtn.closest('form'));

        await waitFor(() => {
            expect(screen.getByText('An error occurred while attempting to save the record.')).toBeInTheDocument();
        });
    });

    it('FE-IT-38: New Entry → Cancel Button', async () => {
        await renderAppAtNewEntry();

        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        await user.click(cancelBtn);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/home');
        });
    });

    it('FE-IT-67: Medicine → Fill All Fields', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'Medicines' }));

        await waitFor(() => {
            expect(screen.getByText('Medicine Name')).toBeInTheDocument();
        });

        const textInputs = screen.getAllByRole('textbox');
        const numberInputs = screen.getAllByRole('spinbutton');
        const selects = screen.getAllByRole('combobox');
        
        const nameInput = textInputs.find(i => i.required);
        await user.type(nameInput, 'Amoxicillin');
        
        await user.type(numberInputs[0], '500'); 
        
        await user.selectOptions(selects[0], 'gm');
        
        await user.click(screen.getByRole('button', { name: 'Morning' }));
        await user.click(screen.getByRole('button', { name: 'Night' }));
        
        await user.type(numberInputs[1], '10');
        
        await user.selectOptions(selects[1], 'Months');
        
        const instructionsInput = screen.getByPlaceholderText(/ex: Before food/i);
        await user.type(instructionsInput, 'Before food');

        expect(nameInput).toHaveValue('Amoxicillin');
        expect(numberInputs[0]).toHaveValue(500);
        expect(selects[0]).toHaveValue('gm');
        expect(screen.getByRole('button', { name: 'Morning' }).className).toContain('bg-blue-600');
        expect(screen.getByRole('button', { name: 'Night' }).className).toContain('bg-blue-600');
        expect(numberInputs[1]).toHaveValue(10);
        expect(selects[1]).toHaveValue('Months');
        expect(instructionsInput).toHaveValue('Before food');
    });

    it('FE-IT-68: Medicine → Type Dropdown Selection', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'Medicines' }));

        await waitFor(() => {
            expect(screen.getByText('Medicine Name')).toBeInTheDocument();
        });

        const dropdownBtn = screen.getByRole('button', { name: /Tab/i });
        await user.click(dropdownBtn);

        const syrOption = screen.getByText('Syr - Syrup');
        await user.click(syrOption);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Syr/i })).toBeInTheDocument();
            expect(screen.queryByText('Syr - Syrup')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-69: Notes Toggle → Other Treatment Textarea', async () => {
        await renderAppAtNewEntry();

        const notesBtn = screen.getByRole('button', { name: 'Notes' });
        await user.click(notesBtn);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Supplemental treatment notes...')).toBeInTheDocument();
        });

        const textarea = screen.getByPlaceholderText('Supplemental treatment notes...');
        await user.type(textarea, 'Physiotherapy recommended 3x/week');
        expect(textarea).toHaveValue('Physiotherapy recommended 3x/week');

        await user.click(notesBtn);
        await waitFor(() => {
            expect(screen.queryByPlaceholderText('Supplemental treatment notes...')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-70: Investigation → MRI Region Add via Enter Key', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'MRI' }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Region (ex: Brain)')).toBeInTheDocument();
        });

        const mriInput = screen.getByPlaceholderText('Region (ex: Brain)');
        await user.type(mriInput, 'Cervical Spine{enter}');

        await waitFor(() => {
            expect(screen.getByText('MRI (Cervical Spine)')).toBeInTheDocument();
        });
        expect(mriInput).toHaveValue('');
    });

    it('FE-IT-71: Investigation → CT Region + Contrast Add', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'CT' }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Region (ex: Brain, Abdomen)')).toBeInTheDocument();
        });

        const ctInput = screen.getByPlaceholderText('Region (ex: Brain, Abdomen)');
        await user.type(ctInput, 'Abdomen');

        await user.click(screen.getByRole('button', { name: 'With Contrast' }));

        const addBtn = screen.getByText('+');
        await user.click(addBtn);

        await waitFor(() => {
            expect(screen.getByText('CT (Abdomen [With Contrast])')).toBeInTheDocument();
        });
    });

    it('FE-IT-72: Investigation → ENMG Region Add', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'ENMG' }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Specify ENMG Region (ex: Upper Limb)')).toBeInTheDocument();
        });

        const enmgInput = screen.getByPlaceholderText('Specify ENMG Region (ex: Upper Limb)');
        await user.type(enmgInput, 'Upper Limb');

        const addBtn = screen.getByText('+');
        await user.click(addBtn);

        await waitFor(() => {
            expect(screen.getByText('ENMG (Upper Limb)')).toBeInTheDocument();
        });
    });

    it('FE-IT-73: Comorbidity → Custom "Others" Add + Remove', async () => {
        await renderAppAtNewEntry();

        const othersBtns = screen.getAllByRole('button', { name: 'Others' });
        await user.click(othersBtns[0]);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Condition Name')).toBeInTheDocument();
        });

        const conditionInput = screen.getByPlaceholderText('Condition Name');
        await user.type(conditionInput, 'Thyroid Disorder');

        const durationSelect = screen.getAllByRole('combobox').find(select => Array.from(select.options).some(o => o.value === '1-3 years'));
        await user.selectOptions(durationSelect, '1-3 years');

        const addBtn = screen.getByTitle('Add condition');
        await user.click(addBtn);

        await waitFor(() => {
            expect(screen.getByText('Thyroid Disorder')).toBeInTheDocument();
        });

        const removeBtns = screen.getAllByRole('button', { name: '✕' });
        await user.click(removeBtns[0]);

        await waitFor(() => {
            expect(screen.queryByText('Thyroid Disorder')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-74: Comorbidity → Duration Update on Standard Entry', async () => {
        await renderAppAtNewEntry();

        await user.click(screen.getByRole('button', { name: 'Diabetes' }));

        await waitFor(() => {
            expect(screen.getByText('Active Selections')).toBeInTheDocument();
        });

        const durationSelect = screen.getAllByRole('combobox').find(select => Array.from(select.options).some(o => o.value === '4-6 years'));
        await user.selectOptions(durationSelect, '4-6 years');

        await waitFor(() => {
            expect(durationSelect).toHaveValue('4-6 years');
        });
    });
});
