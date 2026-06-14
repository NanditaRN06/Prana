import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
    MedTypeDropdown,
    TreatmentPlan,
    Investigations
} from '@frontend/components/PatientFormDetails';

describe('PatientFormDetails Component Tests', () => {
    describe('MedTypeDropdown Component', () => {
        it('FE-UT-214: MedTypeDropdown - UI: Renders selected type abbreviation', () => {
            render(<MedTypeDropdown value="Tab" onChange={vi.fn()} />);
            expect(screen.getByRole('button', { name: /Tab/i })).toBeInTheDocument();
        });

        it('FE-UT-215: MedTypeDropdown - UI: Click opens dropdown with all types', async () => {
            const user = userEvent.setup({ delay: null });
            render(<MedTypeDropdown value="Tab" onChange={vi.fn()} />);
            
            await user.click(screen.getByRole('button', { name: /Tab/i }));
            
            const types = ["Tab - Tablet", "Cap - Capsule", "Syr - Syrup", "Inj - Injection", "Oin - Ointment"];
            for (const type of types) {
                expect(screen.getByText(type)).toBeInTheDocument();
            }
        });

        it('FE-UT-216: MedTypeDropdown - UI: Selecting type calls onChange and closes', async () => {
            const user = userEvent.setup({ delay: null });
            const mockOnChange = vi.fn();
            render(<MedTypeDropdown value="Tab" onChange={mockOnChange} />);
            
            await user.click(screen.getByRole('button', { name: /Tab/i }));
            
            const capOption = screen.getByText('Cap - Capsule');
            await user.click(capOption);
            
            expect(mockOnChange).toHaveBeenCalledWith('Cap');
            // Check dropdown closes
            await waitFor(() => {
                expect(screen.queryByText('Syp')).not.toBeInTheDocument();
            });
        });

        it('FE-UT-217: MedTypeDropdown - Edge Case: Click outside closes dropdown', async () => {
            const user = userEvent.setup({ delay: null });
            render(
                <div>
                    <div data-testid="outside">Outside</div>
                    <MedTypeDropdown value="Tab" onChange={vi.fn()} />
                </div>
            );
            
            await user.click(screen.getByRole('button', { name: /Tab/i }));
            expect(screen.getByText('Cap - Capsule')).toBeInTheDocument();
            
            await user.click(screen.getByTestId('outside'));
            
            await waitFor(() => {
                expect(screen.queryByText('Cap - Capsule')).not.toBeInTheDocument();
            });
        });
    });

    describe('TreatmentPlan Component', () => {
        const defaultMedicine = { type: 'Tab', name: '', dose: '', unit: 'mg', schedule: [], days: '', instructions: '' };
        
        const defaultState = { medicines: [], showOtherTreatment: false, showMedicines: false, formData: { otherDetails: '' } };
        const defaultActions = { setShowMedicines: vi.fn(), setShowOtherTreatment: vi.fn(), addMedicine: vi.fn(), removeMedicine: vi.fn(), updateMedicine: vi.fn(), handleInputChange: vi.fn() };

        it('FE-UT-218: TreatmentPlan - UI: "Medicines" toggle shows medicine cards', async () => {
            const user = userEvent.setup({ delay: null });
            const setShowMedicinesMock = vi.fn();
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: false }} actions={{ ...defaultActions, setShowMedicines: setShowMedicinesMock }} />);
            
            const medToggle = screen.getByRole('button', { name: /Medicines/i });
            await user.click(medToggle);
            
            expect(setShowMedicinesMock).toHaveBeenCalledWith(true);
        });

        it('FE-UT-219: TreatmentPlan - UI: "Notes" toggle shows textarea', async () => {
            const user = userEvent.setup({ delay: null });
            const setShowOtherMock = vi.fn();
            render(<TreatmentPlan state={{ ...defaultState, showOtherTreatment: false }} actions={{ ...defaultActions, setShowOtherTreatment: setShowOtherMock }} />);
            
            const notesToggle = screen.getByRole('button', { name: /Notes/i });
            await user.click(notesToggle);
            
            expect(setShowOtherMock).toHaveBeenCalledWith(true);
        });

        it('FE-UT-220: TreatmentPlan - UI: Medicine card has all fields', () => {
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: true, medicines: [defaultMedicine] }} actions={defaultActions} />);
            
            expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
            
            // Schedule buttons
            ['Morning', 'Afternoon', 'Night'].forEach(time => {
                expect(screen.getByRole('button', { name: time })).toBeInTheDocument();
            });
            
            expect(screen.getAllByRole('spinbutton').length).toBe(2); // dose and days
            expect(screen.getByPlaceholderText(/ex: Before food/i)).toBeInTheDocument();
        });

        it('FE-UT-221: TreatmentPlan - UI: Schedule buttons toggle active class', () => {
            const activeMed = { ...defaultMedicine, schedule: ['Morning'] };
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: true, medicines: [activeMed] }} actions={defaultActions} />);
            
            const morningBtn = screen.getByRole('button', { name: 'Morning' });
            expect(morningBtn.className).toContain('bg-blue-600');
            expect(morningBtn.className).toContain('text-white');
            
            const afternoonBtn = screen.getByRole('button', { name: 'Afternoon' });
            expect(afternoonBtn.className).not.toContain('bg-blue-600');
        });

        it('FE-UT-222: TreatmentPlan - UI: Remove medicine button calls removeMedicine', async () => {
            const user = userEvent.setup({ delay: null });
            const removeMedicineMock = vi.fn();
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: true, medicines: [defaultMedicine] }} actions={{ ...defaultActions, removeMedicine: removeMedicineMock }} />);
            
            // The trash icon button
            const removeBtn = screen.getByText('✕');
            
            await user.click(removeBtn);
            
            expect(removeMedicineMock).toHaveBeenCalledWith(0);
        });

        it('FE-UT-223: TreatmentPlan - UI: "+ Add Medication" button calls addMedicine', async () => {
            const user = userEvent.setup({ delay: null });
            const addMedicineMock = vi.fn();
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: true, medicines: [defaultMedicine] }} actions={{ ...defaultActions, addMedicine: addMedicineMock }} />);
            
            await user.click(screen.getByRole('button', { name: /\+ Add Medication/i }));
            
            expect(addMedicineMock).toHaveBeenCalled();
        });

        it('FE-UT-224: TreatmentPlan - UI: Dose unit dropdown has all options', () => {
            render(<TreatmentPlan state={{ ...defaultState, showMedicines: true, medicines: [defaultMedicine] }} actions={defaultActions} />);
            
            const unitSelect = screen.getAllByRole('combobox')[0];
            const options = Array.from(unitSelect.options).map(o => o.value);
            expect(options).toEqual(expect.arrayContaining(['mg', 'mcd', 'gm', 'mg/mL', 'mg/kg']));
        });
    });

    describe('Investigations Component', () => {
        const defaultState = { 
            selectedInvestigations: [], 
            investigationDetails: { mri: [], ct: [], enmg: [] }, 
            newInvestigationInput: { mri: { region: '' }, ct: { region: '', contrast: '' }, enmg: { region: '' } }, 
            othersInput: '' 
        };
        const defaultActions = { toggleInvestigation: vi.fn(), addMriRegion: vi.fn(), addCtRegion: vi.fn(), addEnmgRegion: vi.fn(), setNewInvestigationInput: vi.fn(), addOtherInvestigation: vi.fn(), setOthersInput: vi.fn(), setSelectedInvestigations: vi.fn(), setHasChanges: vi.fn() };

        it('FE-UT-225: Investigations - UI: All investigation option buttons rendered', () => {
            render(<Investigations state={defaultState} actions={defaultActions} mode="create" />);
            
            const options = ["MRI", "CT", "EEG", "ENMG", "TSH", "Others"];
            options.forEach(opt => {
                expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
            });
        });

        it('FE-UT-226: Investigations - UI: Selected investigation has active class', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['MRI'] }} actions={defaultActions} mode="create" />);
            
            const mriBtn = screen.getByRole('button', { name: 'MRI' });
            expect(mriBtn.className).toContain('bg-slate-900');
            expect(mriBtn.className).toContain('text-white');
        });

        it('FE-UT-227: Investigations - UI: MRI selected -> region input section shown', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['MRI'] }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByPlaceholderText(/Region \(ex: Brain\)/i)).toBeInTheDocument();
            // The add + button
            const addBtn = screen.getByText('+', { selector: 'button.bg-slate-800' });
            expect(addBtn).toBeInTheDocument();
        });

        it('FE-UT-228: Investigations - UI: CT selected -> region + contrast section shown', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['CT'] }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByPlaceholderText(/Region \(ex: Brain, Abdomen\)/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /With Contrast/i })).toBeInTheDocument();
        });

        it('FE-UT-229: Investigations - Edge Case: CT add button disabled when region or contrast empty', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['CT'] }} actions={defaultActions} mode="create" />);
            
            const addBtn = screen.getByText('+', { selector: 'button.bg-blue-600' });
            expect(addBtn).toBeDisabled();
        });

        it('FE-UT-230: Investigations - UI: ENMG selected -> region input section shown', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['ENMG'] }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByPlaceholderText(/Specify ENMG Region/i)).toBeInTheDocument();
        });

        it('FE-UT-231: Investigations - UI: "Others" selected -> free-text input shown', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['Others'] }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByPlaceholderText(/Type other investigations and press Enter/i)).toBeInTheDocument();
        });

        it('FE-UT-232: Investigations - Edge Case: "Others" input in edit mode sets hasChanges', async () => {
            const user = userEvent.setup({ delay: null });
            const setHasChangesMock = vi.fn();
            const setOthersInputMock = vi.fn();
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['Others'] }} actions={{ ...defaultActions, setHasChanges: setHasChangesMock, setOthersInput: setOthersInputMock }} mode="edit" />);
            
            const input = screen.getByPlaceholderText(/Type other investigations and press Enter/i);
            await user.type(input, 'T');
            
            expect(setHasChangesMock).toHaveBeenCalledWith(true);
        });

        it('FE-UT-233: Investigations - UI: Selected investigations displayed as tags', () => {
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['MRI', 'CT'] }} actions={defaultActions} mode="create" />);
            
            const mriTags = screen.getAllByText('MRI');
            const ctTags = screen.getAllByText('CT');
            expect(mriTags.length).toBeGreaterThanOrEqual(1);
            expect(ctTags.length).toBeGreaterThanOrEqual(1);
        });

        it('FE-UT-234: Investigations - UI: MRI tag shows regions in parentheses', () => {
            const details = { ...defaultState.investigationDetails, mri: [{ region: 'Spine' }] };
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['MRI'], investigationDetails: details }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByText('MRI (Spine)')).toBeInTheDocument();
        });

        it('FE-UT-235: Investigations - UI: CT tag shows region with contrast info', () => {
            const details = { ...defaultState.investigationDetails, ct: [{ region: 'Head', contrast: 'With Contrast' }] };
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['CT'], investigationDetails: details }} actions={defaultActions} mode="create" />);
            
            expect(screen.getByText('CT (Head [With Contrast])')).toBeInTheDocument();
        });

        it('FE-UT-236: Investigations - UI: Remove tag button filters out investigation', async () => {
            const user = userEvent.setup({ delay: null });
            const setSelectedInvestigationsMock = vi.fn();
            render(<Investigations state={{ ...defaultState, selectedInvestigations: ['MRI', 'CT'] }} actions={{ ...defaultActions, setSelectedInvestigations: setSelectedInvestigationsMock }} mode="create" />);
            
            // Find all remove buttons and click the first one (which should be MRI tag)
            const removeBtns = screen.getAllByRole('button', { name: '✕' });
            
            if(removeBtns.length > 0) await user.click(removeBtns[0]);
            
            expect(setSelectedInvestigationsMock).toHaveBeenCalledWith(['CT']);
        });
    });
});
