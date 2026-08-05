import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientForm, parseTreatments, parseInvestigationDetails } from '@frontend/utils/usePatientForm';
import { toast } from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

describe('usePatientForm Utility and Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // --- parseTreatments ---
    describe('parseTreatments', () => {
        it('FE-UT-44: parseTreatments - Formatted string parsed correctly', () => {
            const result = parseTreatments(["Tab Aspirin-500mg-[M,E]-5d-AfterFood"]);
            expect(result[0].type).toBe("Tab");
            expect(result[0].name).toBe("Aspirin");
            expect(result[0].dose).toBe("500");
            expect(result[0].doseUnit).toBe("mg");
            expect(result[0].schedule).toEqual(["M", "E"]);
            expect(result[0].instructions).toBe("AfterFood");
        });

        it('FE-UT-45: parseTreatments - Non-array input → returns []', () => {
            expect(parseTreatments(null)).toEqual([]);
        });

        it('FE-UT-46: parseTreatments - No type prefix → defaults to "Tab"', () => {
            const result = parseTreatments(["Aspirin-500mg-[]-5d-"]);
            expect(result[0].type).toBe("Tab");
            expect(result[0].name).toBe("Aspirin");
        });

        it('FE-UT-47: parseTreatments - Dose suffix "mg" stripped for input', () => {
            const result = parseTreatments(["Tab Aspirin-500mg-[M]-5d-"]);
            expect(result[0].dose).toBe("500");
            expect(result[0].doseUnit).toBe("mg");
        });
    });

    // --- parseInvestigationDetails ---
    describe('parseInvestigationDetails', () => {
        it('FE-UT-48: parseInvestigationDetails - Array of objects parsed correctly', () => {
            const result = parseInvestigationDetails({ mri: [{ region: "Spine" }] }, 'mri');
            expect(result[0].region).toBe("Spine");
            expect(result[0].id).toBeDefined();
        });

        it('FE-UT-49: parseInvestigationDetails - Single object with region → wrapped in array', () => {
            const result = parseInvestigationDetails({ mri: { region: "Brain" } }, 'mri');
            expect(result[0].region).toBe("Brain");
            expect(result.length).toBe(1);
        });

        it('FE-UT-50: parseInvestigationDetails - Investigation type not in details → []', () => {
            const result = parseInvestigationDetails({ ct: [{ region: "Head" }] }, 'mri');
            expect(result).toEqual([]);
        });
    });

    // --- usePatientForm Hook ---
    describe('usePatientForm Hook', () => {
        const renderTestHook = (initialData = {}, mode = "create", onSubmit = vi.fn()) => {
            return renderHook(() => usePatientForm(initialData, mode, onSubmit));
        };

        it('FE-UT-51: isFormValid - Returns false when required fields empty', () => {
            const { result } = renderTestHook();
            expect(result.current.state.isFormValid).toBe(false);
        });

        it('FE-UT-52: isFormValid - Returns true when all required fields filled', () => {
            const { result } = renderTestHook({
                name: "A", age: "5", allergies: "No", examdate: "2023-01-01T12:00:00Z", phone: "1234567890"
            });
            expect(result.current.state.isFormValid).toBe(true);
        });

        it('FE-UT-53: isFormValid - Phone 9 digits → invalid', () => {
            const { result } = renderTestHook({
                name: "A", age: "5", allergies: "No", examdate: "2023-01-01T12:00:00Z", phone: "123456789"
            });
            expect(result.current.state.isFormValid).toBe(false);
        });

        it('FE-UT-54: handleInputChange - Updates correct field in formData', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.handleInputChange({ target: { name: "name", value: "X" } });
            });
            expect(result.current.state.formData.name).toBe("X");
        });

        it('FE-UT-55: handleInputChange - Sets hasChanges = true in edit mode', () => {
            const { result } = renderTestHook({}, "edit");
            act(() => {
                result.current.actions.handleInputChange({ target: { name: "name", value: "X" } });
            });
            expect(result.current.state.hasChanges).toBe(true);
        });

        it('FE-UT-56: handleVitalsChange - Nested BP field updated', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.handleVitalsChange({ target: { name: "systolic", value: "120" } });
            });
            expect(result.current.state.formData.vitals.bp.systolic).toBe(120);
        });

        it('FE-UT-57: handleVitalsChange - Top-level vital updated', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.handleVitalsChange({ target: { name: "pulse", value: "80" } });
            });
            expect(result.current.state.formData.vitals.pulse).toBe(80);
        });

        it('FE-UT-58: handleVitalsChange - Empty string clears vital', () => {
            const { result } = renderTestHook({ vitals: { pulse: 80 } });
            act(() => {
                result.current.actions.handleVitalsChange({ target: { name: "pulse", value: "" } });
            });
            expect(result.current.state.formData.vitals.pulse).toBe("");
        });

        it('FE-UT-59: toggleComorbidity - Selecting "None" clears all conditions', () => {
            const { result } = renderTestHook({ comorbidities: ["HTN"] });
            act(() => {
                result.current.actions.toggleComorbidity("None");
            });
            expect(result.current.state.comorbidities).toEqual([{ name: "None", duration: "" }]);
        });

        it('FE-UT-60: toggleComorbidity - Deselecting "None" restores previous', () => {
            const { result } = renderTestHook({ comorbidities: ["HTN"] });
            act(() => {
                result.current.actions.toggleComorbidity("None"); // Switch to None
            });
            act(() => {
                result.current.actions.toggleComorbidity("None"); // Switch back
            });
            expect(result.current.state.comorbidities[0].name).toBe("HTN");
        });

        it('FE-UT-61: toggleComorbidity - Adding condition removes "None"', () => {
            const { result } = renderTestHook({ comorbidities: ["None"] });
            act(() => {
                result.current.actions.toggleComorbidity("HTN");
            });
            expect(result.current.state.comorbidities[0].name).toBe("HTN");
        });

        it('FE-UT-62: toggleComorbidity - Deselecting existing condition', () => {
            const { result } = renderTestHook({ comorbidities: ["HTN", "DM"] });
            act(() => {
                result.current.actions.toggleComorbidity("HTN");
            });
            expect(result.current.state.comorbidities.map(c => c.name)).toEqual(["DM"]);
        });

        it('FE-UT-63: addCustomComorbidity - Empty input → no-op', () => {
            const { result } = renderTestHook();
            const initial = result.current.state.comorbidities;
            act(() => {
                result.current.actions.addCustomComorbidity();
            });
            expect(result.current.state.comorbidities).toEqual(initial);
        });

        it('FE-UT-64: addCustomComorbidity - Adds with "Other: " prefix', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setCustomComorbidity({ name: "Lupus", duration: "1 year" });
            });
            act(() => {
                result.current.actions.addCustomComorbidity();
            });
            expect(result.current.state.comorbidities.find(c => c.name === "Other: Lupus")).toBeDefined();
        });

        it('FE-UT-65: addCustomComorbidity - Duplicate guard', () => {
            const { result } = renderTestHook({ comorbidities: ["Other: Lupus"] });
            act(() => {
                result.current.actions.setCustomComorbidity({ name: "Lupus", duration: "2 years" });
            });
            act(() => {
                result.current.actions.addCustomComorbidity();
            });
            expect(result.current.state.comorbidities.filter(c => c.name === "Other: Lupus").length).toBe(1);
        });

        it('FE-UT-66: removeCustomComorbidity - Removes correct custom entry', () => {
            const { result } = renderTestHook({ comorbidities: ["Other: Lupus", "HTN"] });
            act(() => {
                result.current.actions.removeCustomComorbidity("Other: Lupus");
            });
            expect(result.current.state.comorbidities.map(c => c.name)).toEqual(["HTN"]);
        });

        it('FE-UT-67: handleSubmit - Empty comorbidities → validation error', async () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.toggleComorbidity("None");
            });
            
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(toast.error).toHaveBeenCalledWith("Please specify at least one co-morbidity or select 'None'.");
        });

        it('FE-UT-68: handleSubmit - MRI selected, no region → error', async () => {
            const { result } = renderTestHook({ investigations: ["MRI"] });
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(toast.error).toHaveBeenCalledWith("Please add at least one MRI region before submitting.");
        });

        it('FE-UT-69: handleSubmit - CT selected, no region → error', async () => {
            const { result } = renderTestHook({ investigations: ["CT"] });
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(toast.error).toHaveBeenCalledWith("Please add CT region and select contrast option before submitting.");
        });

        it('FE-UT-70: handleSubmit - ENMG selected, no region → error', async () => {
            const { result } = renderTestHook({ investigations: ["ENMG"] });
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(toast.error).toHaveBeenCalledWith("Please add at least one ENMG region before submitting.");
        });

        it('FE-UT-71: handleSubmit - BP only systolic (no diastolic) → error', async () => {
            const { result } = renderTestHook({ vitals: { bp: { systolic: 120, diastolic: "" } } });
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(toast.error).toHaveBeenCalledWith("Please enter both the Systolic and Diastolic blood pressure values, or leave both empty.");
        });

        it('FE-UT-72: handleSubmit - Valid form → onSubmit called with payload', async () => {
            const onSubmit = vi.fn();
            const { result } = renderTestHook({
                name: "A", age: 5, allergies: "no", examdate: "2023-01-01T12:00", phone: "1234567890",
                comorbidities: ["None"]
            }, "create", onSubmit);
            
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(onSubmit).toHaveBeenCalled();
            expect(onSubmit.mock.calls[0][0].name).toBe("A");
        });

        it('FE-UT-73: handleSubmit - onSubmit callback throws → error caught', async () => {
            const onSubmit = vi.fn().mockRejectedValue(new Error("Network Error"));
            const { result } = renderTestHook({ comorbidities: ["None"] }, "create", onSubmit);
            
            await act(async () => {
                await result.current.actions.handleSubmit({ preventDefault: vi.fn() });
            });
            expect(console.error).toHaveBeenCalled();
        });

        it('FE-UT-74: updateComorbidityDuration - Updates duration', () => {
            const { result } = renderTestHook({ comorbidities: ["HTN"] });
            act(() => {
                result.current.actions.updateComorbidityDuration("HTN", "5 years");
            });
            expect(result.current.state.comorbidities[0].duration).toBe("5 years");
        });

        it('FE-UT-75: addMedicine - Adds medicine with default values', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.addMedicine();
            });
            expect(result.current.state.medicines.length).toBe(1);
            expect(result.current.state.medicines[0].type).toBe("Tab");
        });

        it('FE-UT-76: removeMedicine - Removes medicine by index', () => {
            const { result } = renderTestHook({ treatments: ["Tab A-500mg-[M]-5d-", "Tab B-500mg-[M]-5d-"] });
            act(() => {
                result.current.actions.removeMedicine(0);
            });
            expect(result.current.state.medicines.length).toBe(1);
            expect(result.current.state.medicines[0].name).toBe("B");
        });

        it('FE-UT-77: updateMedicine - Updates field value at index', () => {
            const { result } = renderTestHook({ treatments: ["Tab A-500mg-[M]-5d-"] });
            act(() => {
                result.current.actions.updateMedicine(0, "name", "Aspirin");
            });
            expect(result.current.state.medicines[0].name).toBe("Aspirin");
        });

        it('FE-UT-78: updateMedicine - Schedule toggle — add time', () => {
            const { result } = renderTestHook({ treatments: ["Tab A-500mg-[M]-5d-"] });
            act(() => {
                result.current.actions.updateMedicine(0, "schedule", "E");
            });
            expect(result.current.state.medicines[0].schedule).toEqual(["M", "E"]);
        });

        it('FE-UT-79: updateMedicine - Schedule toggle — remove time', () => {
            const { result } = renderTestHook({ treatments: ["Tab A-500mg-[M,E]-5d-"] });
            act(() => {
                result.current.actions.updateMedicine(0, "schedule", "M");
            });
            expect(result.current.state.medicines[0].schedule).toEqual(["E"]);
        });

        it('FE-UT-80: toggleInvestigation - Toggle on — adds investigation', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.toggleInvestigation("MRI");
            });
            expect(result.current.state.selectedInvestigations).toEqual(["MRI"]);
        });

        it('FE-UT-81: toggleInvestigation - Toggle off — removes investigation', () => {
            const { result } = renderTestHook({ investigations: ["MRI"] });
            act(() => {
                result.current.actions.toggleInvestigation("MRI");
            });
            expect(result.current.state.selectedInvestigations).toEqual([]);
        });

        it('FE-UT-82: addMriRegion - Adds MRI region with unique ID', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setNewInvestigationInput({ mri: { region: "Spine" }, ct: {region: "", contrast: ""}, enmg: {region: ""} });
            });
            act(() => {
                result.current.actions.addMriRegion();
            });
            expect(result.current.state.investigationDetails.mri.length).toBe(1);
            expect(result.current.state.investigationDetails.mri[0].region).toBe("Spine");
        });

        it('FE-UT-83: addMriRegion - Empty region → no-op', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.addMriRegion();
            });
            expect(result.current.state.investigationDetails.mri.length).toBe(0);
        });

        it('FE-UT-84: addCtRegion - Adds CT region with contrast', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setNewInvestigationInput({ ct: { region: "Head", contrast: "With" }, mri: {region: ""}, enmg: {region: ""} });
            });
            act(() => {
                result.current.actions.addCtRegion();
            });
            expect(result.current.state.investigationDetails.ct[0].region).toBe("Head");
            expect(result.current.state.investigationDetails.ct[0].contrast).toBe("With");
        });

        it('FE-UT-85: addEnmgRegion - Adds ENMG region', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setNewInvestigationInput({ enmg: { region: "Upper" }, ct: {region: "", contrast: ""}, mri: {region: ""} });
            });
            act(() => {
                result.current.actions.addEnmgRegion();
            });
            expect(result.current.state.investigationDetails.enmg[0].region).toBe("Upper");
        });

        it('FE-UT-86: addOtherInvestigation - Enter key adds text', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setOthersInput("X-Ray");
            });
            act(() => {
                result.current.actions.addOtherInvestigation({ key: "Enter", preventDefault: vi.fn() });
            });
            expect(result.current.state.investigationDetails.others).toBe("X-Ray");
            expect(result.current.state.selectedInvestigations).toContain("Others");
        });

        it('FE-UT-87: addOtherInvestigation - Non-Enter key → no-op', () => {
            const { result } = renderTestHook();
            act(() => {
                result.current.actions.setOthersInput("X-Ray");
            });
            act(() => {
                result.current.actions.addOtherInvestigation({ key: "A", preventDefault: vi.fn() });
            });
            expect(result.current.state.investigationDetails.others).toBe("");
        });

        it('FE-UT-88: Initial state - examdate formatted correctly', () => {
            // Using a date string that will parse
            const initialData = { examdate: "2023-01-01T12:00:00.000Z" };
            const { result } = renderTestHook(initialData, "edit");
            // Check that it's formatted as YYYY-MM-DDTHH:mm
            expect(result.current.state.formData.examdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        });
    });
});
