import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '@frontend/App';
import { mockApi, resetMockApi } from '../../utils/helpers/frontendHelper';

window.matchMedia = window.matchMedia || function() {
    return { matches: false, addListener: function() {}, removeListener: function() {} };
};

const mockPatient = {
    _id: "patient123",
    name: "Jane Smith",
    age: 45,
    phone: "1234567890",
    examdate: "2023-10-15T10:30",
    comorbidities: ["Hypertension", "Diabetes"],
    comorbidityData: [
        { name: "Hypertension", duration: "1-3 years" },
        { name: "Diabetes", duration: "4-6 years" }
    ],
    vitals: {
        pulse: 80,
        bp: { systolic: 120, diastolic: 80 },
        spO2: 98
    },
    treatments: [
        "Tab Paracetamol-500mg-[1-0-1]-5 Days-AF"
    ],
    clinicalDiagnosis: "Viral Fever",
    chiefComplaints: "Fever and headache for 3 days",
    examination: "Patient looks pale. Temp: 101F",
    investigationDetails: {
        mri: [{ region: "Brain", impression: "Normal" }],
        others: "Blood tests normal"
    }
};

const incompleteDoctor = {
    fullName: "Dr. Jane Doe",
    username: "janedoe",
    department: "",
    position: "",
    qualifications: [],
    kmcNumber: ""
};

const completeDoctor = {
    ...incompleteDoctor,
    department: "Neurology",
    position: "Senior Consultant",
    qualifications: ["MBBS", "MD"],
    kmcNumber: "KMC12345"
};

describe('Patient Profile & Edit Flow', () => {
    let user;
    let printMock;

    beforeEach(() => {
        resetMockApi();
        user = userEvent.setup();
        window.localStorage.clear();
        
        mockApi.onGet('/api/check-auth').reply(200);
        printMock = vi.spyOn(window, 'print').mockImplementation(() => {});
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        printMock.mockRestore();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderAppAt = async (path, state = {}) => {
        window.history.pushState({}, '', '/home');
        let utils;
        await act(async () => {
            utils = render(<App />);
        });
        
        // Wait for auth resolution bounce to /home to finish
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Workspace/i })).toBeInTheDocument();
        });

        // Now navigate to desired protected route
        await act(async () => {
            window.history.pushState({ usr: state, key: 'test' }, '', path);
            window.dispatchEvent(new Event('popstate'));
        });

        return utils;
    };

    it('FE-IT-39: Patient Profile → Successful Fetch & Render', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
            expect(screen.getByText(/45 Years/i)).toBeInTheDocument();
            expect(screen.getByText('Hypertension')).toBeInTheDocument();
            expect(screen.getByText('Diabetes')).toBeInTheDocument();
            expect(screen.getByText('Viral Fever')).toBeInTheDocument();
            expect(screen.getByText('Tab Paracetamol')).toBeInTheDocument();
        });
    });

    it('FE-IT-40: Patient Profile → Render Empty Sections gracefully', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        const emptyPatient = { ...mockPatient, vitals: null, medicines: [], investigationDetails: null };
        mockApi.onGet('/patient/empty123').reply(200, emptyPatient);

        await renderAppAt('/patient/empty123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        // App should not crash when vitals and investigations are null
        expect(screen.queryByText(/80 bpm/i)).not.toBeInTheDocument();
        expect(screen.queryByText('Paracetamol')).not.toBeInTheDocument();
    });

    it('FE-IT-41: Patient Profile → Treatment Plan Download (Incomplete Profile)', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        const printBtn = screen.getByRole('button', { name: 'Print' });
        await user.click(printBtn);

        await waitFor(() => {
            expect(screen.getByText('Cannot Print')).toBeInTheDocument();
            expect(screen.getByText('Please complete your profile details:')).toBeInTheDocument();
        });

        expect(printMock).not.toHaveBeenCalled();
    });

    it('FE-IT-42: Patient Profile → Treatment Plan Download (Complete Profile)', async () => {
        mockApi.onGet('/api/account').reply(200, completeDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        const printBtn = screen.getByRole('button', { name: 'Print' });
        await user.click(printBtn);

        await waitFor(() => {
            expect(printMock).toHaveBeenCalled();
        });
    });

    it('FE-IT-43: Patient Profile → Edit Navigation', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        const editBtn = screen.getByRole('button', { name: 'Edit' });
        await user.click(editBtn);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/update/Jane%20Smith');
        });
    });

    it('FE-IT-44: Patient Profile → Delete Confirmation Open/Close', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole('button', { name: 'Delete' });
        await user.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        });

        const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelBtn);

        await waitFor(() => {
            expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
        });
    });

    it('FE-IT-45: Patient Profile → Delete Success', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);
        mockApi.onDelete(/\/patient\/.+/).reply(200, { message: "Patient record successfully removed." });

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole('button', { name: 'Delete' });
        await user.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        });

        const confirmBtn = screen.getByRole('button', { name: 'Delete Record' });
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(mockApi.history.delete.some(req => req.url.includes('/patient/'))).toBe(true);
        });

        await waitFor(() => {
            expect(screen.getByText('Patient record successfully removed.')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(window.location.pathname).toBe('/home');
        });
    });

    it('FE-IT-46: Patient Profile → 404/API Failure', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(404, { message: "Patient not found" });

        await renderAppAt('/patient/patient123');

        await waitFor(() => {
            expect(screen.getByText('Patient not found')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------------- //
    // Edit Entry Flow Tests
    // -------------------------------------------------------------------------------- //

    it('FE-IT-47: Edit Entry → Prefill Data', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/update/Jane%20Smith', mockPatient);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Edit Patient Record/i })).toBeInTheDocument();
        });

        expect(screen.getByLabelText(/Patient Full Name/i).value).toBe('Jane Smith');
        expect(screen.getByLabelText(/Age \(Years\)/i).value).toBe('45');
        
        // Hypertension should be active
        const htnBtn = screen.getByRole('button', { name: 'Hypertension' });
        expect(htnBtn).toHaveClass('active');
    });

    it('FE-IT-48: Edit Entry → Save Changes', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);
        // Using regex for path since encodeURIComponent might encode spaces to %20
        mockApi.onPut(/\/update\/.+/).reply(200, { message: "Patient updated successfully" });

        await renderAppAt('/update/Jane%20Smith', mockPatient);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Edit Patient Record/i })).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText(/Patient Full Name/i);
        await user.clear(nameInput);
        await user.type(nameInput, 'Johnathan Doe');

        const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
        await waitFor(() => {
            expect(saveBtn).not.toBeDisabled();
        });
        
        await user.click(saveBtn);

        await waitFor(() => {
            expect(mockApi.history.put.some(req => req.url.includes('/update/'))).toBe(true);
        });

        await waitFor(() => {
            expect(screen.getByText('Patient information updated.')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(window.location.pathname).toBe('/patient/Johnathan%20Doe');
        });
    });

    it('FE-IT-49: Edit Entry → Cancel', async () => {
        mockApi.onGet('/api/account').reply(200, incompleteDoctor);
        mockApi.onGet('/patient/patient123').reply(200, mockPatient);

        await renderAppAt('/update/Jane%20Smith', mockPatient);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Edit Patient Record/i })).toBeInTheDocument();
        });

        const cancelBtn = screen.getAllByRole('button', { name: /Cancel/i }).at(-1);
        await user.click(cancelBtn);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/home');
        });
    });
});
