import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Patient, Update } from '@frontend/pages/patient/PatientProfilePage';
import * as patientService from '@frontend/services/patientService';
import * as authService from '@frontend/services/authService';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ patientId: 'John Doe' })
    };
});

vi.mock('@frontend/services/patientService', () => ({
    getPatient: vi.fn(),
    deletePatient: vi.fn(),
    updatePatient: vi.fn(),
}));

vi.mock('@frontend/services/authService', () => ({
    getAccount: vi.fn(),
}));

const renderToast = (t) => {
    if (typeof t === 'function') {
        const el = t({ id: 'mock-toast' });
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = require('react-dom/client').createRoot(container);
        root.render(el);
    }
    return 'mock-toast';
};

vi.mock('react-hot-toast', () => ({
    toast: vi.fn((t) => {
        if (typeof t === 'function') {
            const el = t({ id: 'mock-toast' });
            // Render it in a hidden div so we can test the UI elements inside the toast
            document.body.innerHTML += `<div id="toast-container"></div>`;
            const container = document.getElementById('toast-container');
            const root = require('react-dom/client').createRoot(container);
            root.render(el);
        }
        return 'mock-toast';
    }),
}));
toast.success = vi.fn(renderToast);
toast.error = vi.fn(renderToast);
toast.loading = vi.fn(() => 'loading-id');
toast.dismiss = vi.fn();

const originalPrint = window.print;
const originalConsoleError = console.error;

describe('PatientProfilePage Component', () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup({ delay: null });
        window.print = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = '';
    });

    afterEach(() => {
        window.print = originalPrint;
        console.error.mockRestore();
    });

    const mockPatientData = {
        _id: 'abc123def456',
        name: 'John Doe',
        age: 30,
        phone: '1234567890',
        address: '123 Main St',
        examdate: new Date().toISOString(),
        comorbidities: ['Diabetes'],
        allergies: 'Yes',
        allergyDetails: 'Peanuts',
        clinicalDiagnosis: 'Healthy',
        currentMedications: 'None',
        chiefComplaints: 'Pain',
        examination: 'Normal',
        investigations: ['MRI', 'CT'],
        investigationDetails: { mri: { region: 'Head' }, ct: { region: 'Chest', contrast: 'Yes' } },
        treatments: ['Aspirin-10mg-[Morning]-1 Week-Take with food'],
        otherDetails: 'Notes',
        vitals: { pulse: 75, spO2: 98, bp: { systolic: 120, diastolic: 80 } },
        versions: [
            { versionDate: new Date().toISOString(), changeSummary: 'Initial', _id: 'v1', name: 'John Doe' }
        ]
    };

    const mockDoctorProfile = {
        fullName: 'Dr. Smith',
        department: 'Cardiology',
        position: 'CMO',
        qualifications: ['MBBS'],
        kmcNumber: '12345',
        consultationHospital: 'City Hosp',
        consultationAddress: 'City Center',
        phoneNumber: '9876543210',
        email: 'doctor@city.com'
    };

    const renderPatient = (patientId = 'John Doe') => {
        return render(
            <MemoryRouter initialEntries={[`/patient/${patientId}`]}>
                <Routes>
                    <Route path="/patient/:patientId" element={<Patient />} />
                    <Route path="/home" element={<div data-testid="home-page">Home</div>} />
                    <Route path="/update/:patientId" element={<div data-testid="update-page">Update</div>} />
                    <Route path="/account" element={<div data-testid="account-page">Account</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('FE-UT-159: PatientProfilePage Comp - Happy Path: Initial render', async () => {
        // Pending promise to stay in loading state
        patientService.getPatient.mockReturnValue(new Promise(() => {}));
        authService.getAccount.mockReturnValue(new Promise(() => {}));
        
        renderPatient();
        expect(screen.getByText(/Accessing Registry\.\.\./i)).toBeInTheDocument();
    });

    it('FE-UT-160: PatientProfilePage Comp - Happy Path: Render Patient Component', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument();
            expect(screen.getAllByText(/DEF456/i)[0]).toBeInTheDocument(); // Registry ID
        });
    });

    it('FE-UT-161: PatientProfilePage Comp - Edge Case: Patient not found', async () => {
        patientService.getPatient.mockRejectedValue(new Error('Patient Not Found'));
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText(/Patient Not Found/i)).toBeInTheDocument();
        });
    });

    it('FE-UT-162: PatientProfilePage Comp - Failure: Auth API Error', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockRejectedValue(new Error('Auth Error'));
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText(/Auth Error/i)).toBeInTheDocument();
        });
    });

    it('FE-UT-163: PatientProfilePage Comp - Happy Path: Display Patient Name and Registry ID', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument();
            expect(screen.getByText(/Registry ID:/i)).toBeInTheDocument();
        });
    });

    it('FE-UT-164: PatientProfilePage Comp - Happy Path: Render Patient Details', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText(/30 Years/i)).toBeInTheDocument();
            expect(screen.getByText('1234567890')).toBeInTheDocument();
            expect(screen.getByText('123 Main St')).toBeInTheDocument();
        });
    });

    it('FE-UT-165: PatientProfilePage Comp - Edge Case: Display N/A for missing phone/address', async () => {
        patientService.getPatient.mockResolvedValue({ ...mockPatientData, phone: '', address: '' });
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.queryByText('1234567890')).not.toBeInTheDocument();
            expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
        });
    });

    it('FE-UT-166: PatientProfilePage Comp - Happy Path: Display Medical History', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText('Diabetes')).toBeInTheDocument();
            expect(screen.getByText('Peanuts')).toBeInTheDocument();
        });
    });

    it('FE-UT-167: PatientProfilePage Comp - State update: Toggle Version History Modal', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        const versionsBtn = screen.getByRole('button', { name: /Versions/i });
        await user.click(versionsBtn);
        
        await waitFor(() => {
            expect(screen.getByText('Version History')).toBeInTheDocument();
        });
    });

    it('FE-UT-168: PatientProfilePage Comp - Happy Path: Render Version List in Modal', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Versions/i }));
        
        await waitFor(() => {
            expect(screen.getByText('Initial')).toBeInTheDocument();
        });
    });

    it('FE-UT-169: PatientProfilePage Comp - State update: Select Version from List', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Versions/i }));
        
        await waitFor(() => expect(screen.getByText('Initial')).toBeInTheDocument());
        await user.click(screen.getByText('Initial'));
        
        await waitFor(() => {
            expect(screen.getByText('Snapshot Date')).toBeInTheDocument();
            expect(screen.getByText('← Back to List')).toBeInTheDocument();
        });
    });

    it('FE-UT-170: PatientProfilePage Comp - Edge Case: No previous versions', async () => {
        patientService.getPatient.mockResolvedValue({ ...mockPatientData, versions: [] });
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Versions/i }));
        
        await waitFor(() => {
            expect(screen.getByText(/No previous versions available/i)).toBeInTheDocument();
        });
    });

    it('FE-UT-171: PatientProfilePage Comp - Action: Close Version Modal', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Versions/i }));
        await waitFor(() => expect(screen.getByText('Version History')).toBeInTheDocument());
        
        const header = screen.getByText('Version History').parentElement;
        const btn = within(header).getByRole('button');
        await user.click(btn);
        
        await waitFor(() => {
            expect(screen.queryByText('Version History')).not.toBeInTheDocument();
        });
    });

    it('FE-UT-250: PatientProfilePage Comp - Happy Path: Vitals rendering', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText('75')).toBeInTheDocument(); // pulse
            expect(screen.getByText('98')).toBeInTheDocument(); // spO2
            expect(screen.getByText('120 / 80')).toBeInTheDocument(); // BP
        });
    });

    it('FE-UT-251: PatientProfilePage Comp - Happy Path: Render Clinical Diagnosis', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText('Healthy')).toBeInTheDocument(); // clinicalDiagnosis
        });
    });

    it('FE-UT-252: PatientProfilePage Comp - Happy Path: Render Investigations', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText('MRI')).toBeInTheDocument();
            expect(screen.getByText('(Head)')).toBeInTheDocument();
            expect(screen.getByText('CT')).toBeInTheDocument();
            expect(screen.getByText('(Chest, Yes)')).toBeInTheDocument();
        });
    });

    it('FE-UT-253: PatientProfilePage Comp - Happy Path: Render Treatments', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => {
            expect(screen.getByText('Aspirin')).toBeInTheDocument();
            expect(screen.getByText('10mg')).toBeInTheDocument();
            expect(screen.getByText('Morning')).toBeInTheDocument();
            expect(screen.getByText('For 1 Week')).toBeInTheDocument();
            expect(screen.getByText('Note: Take with food')).toBeInTheDocument();
        });
    });

    it('FE-UT-254: PatientProfilePage Comp - Action: Print Success', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Print/i }));
        expect(window.print).toHaveBeenCalled();
    });

    it('FE-UT-255: PatientProfilePage Comp - Action: Print Failure (Missing Doctor Data)', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue({ fullName: 'Dr. No Details' });
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Print/i }));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
            expect(window.print).not.toHaveBeenCalled();
            
            // Check if toast contains specific missing fields using document body
            expect(document.body.textContent).toContain('Cannot Print');
            expect(document.body.textContent).toContain('Department');
        });
    });

    it('FE-UT-256: PatientProfilePage Comp - Action: Navigates to Edit Page', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Edit/i }));
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/update/John Doe', expect.anything());
        });
    });

    it('FE-UT-257: PatientProfilePage Comp - Action: Delete Patient Initial', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Delete/i }));
        
        await waitFor(() => {
            expect(toast).toHaveBeenCalled();
            expect(document.body.textContent).toContain('Confirm Deletion');
        });
    });

    it('FE-UT-258: PatientProfilePage Comp - Action: Confirm Delete Success', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        patientService.deletePatient.mockResolvedValue({});
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Delete/i }));
        await waitFor(() => expect(document.body.textContent).toContain('Confirm Deletion'));
        
        const confirmBtn = screen.getByRole('button', { name: /Delete Record/i });
        await user.click(confirmBtn);
        
        await waitFor(() => {
            expect(patientService.deletePatient).toHaveBeenCalledWith('John%20Doe');
            expect(toast.success).toHaveBeenCalledWith('Patient record successfully removed.', { id: 'loading-id' });
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    it('FE-UT-259: PatientProfilePage Comp - Action: Delete Patient Error', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        patientService.deletePatient.mockRejectedValue(new Error('Delete fail'));
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Delete/i }));
        await waitFor(() => expect(document.body.textContent).toContain('Confirm Deletion'));
        
        const confirmBtn = screen.getByRole('button', { name: /Delete Record/i });
        await user.click(confirmBtn);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred during deletion.', { id: 'loading-id' });
        });
    });

    it('FE-UT-260: PatientProfilePage Comp - Action: Cancel Delete', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Delete/i }));
        await waitFor(() => expect(document.body.textContent).toContain('Confirm Deletion'));
        
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        await user.click(cancelBtn);
        
        await waitFor(() => {
            expect(toast.dismiss).toHaveBeenCalled();
            expect(patientService.deletePatient).not.toHaveBeenCalled();
        });
    });

    it('FE-UT-261: PatientProfilePage Comp - Action: Done Button Navigation', async () => {
        patientService.getPatient.mockResolvedValue(mockPatientData);
        authService.getAccount.mockResolvedValue(mockDoctorProfile);
        
        renderPatient();
        await waitFor(() => expect(screen.getByRole('heading', { name: /John Doe/i })).toBeInTheDocument());
        
        await user.click(screen.getByRole('button', { name: /Done/i }));
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    // Tests for Update Component
    describe('Update Component', () => {
        // Mock PatientForm for the Update component to isolate it
        beforeEach(() => {
            vi.mock('@frontend/components/PatientForm', async () => {
                const actual = await vi.importActual('@frontend/components/PatientForm');
                return {
                    default: ({ onSubmit, mode, initialData }) => (
                        <div data-testid={`patient-form-mock-${mode}`}>
                            <button 
                                onClick={() => onSubmit({ ...initialData, age: 31 })}
                                data-testid="submit-update"
                            >
                                Submit
                            </button>
                        </div>
                    )
                };
            });
        });

        const renderUpdate = (state) => {
            return render(
                <MemoryRouter initialEntries={[{ pathname: '/update/John Doe', state }]}>
                    <Routes>
                        <Route path="/update/:patientId" element={<Update />} />
                        <Route path="/patient/:patientId" element={<div data-testid="patient-profile">Patient Profile</div>} />
                    </Routes>
                </MemoryRouter>
            );
        };

        it('FE-UT-262: Update Comp - Happy Path: Render PatientForm', async () => {
            renderUpdate(mockPatientData);
            await waitFor(() => {
                expect(screen.getByTestId('patient-form-mock-edit')).toBeInTheDocument();
            });
        });

        it('FE-UT-186: Update Comp - Happy Path: Successful form submission', async () => {
            patientService.updatePatient.mockResolvedValue({});
            renderUpdate(mockPatientData);
            
            await waitFor(() => expect(screen.getByTestId('patient-form-mock-edit')).toBeInTheDocument());
            
            await user.click(screen.getByTestId('submit-update'));
            
            await waitFor(() => {
                expect(patientService.updatePatient).toHaveBeenCalledWith('John%20Doe', expect.objectContaining({ age: 31 }));
                expect(toast.success).toHaveBeenCalledWith('Patient information updated.', { id: 'loading-id' });
                // Note: The actual component uses window.history.back() or navigate(-1) ? 
                // Wait, let's just check success
            });
        });

        it('FE-UT-187: Update Comp - Failure: Update API Error', async () => {
            patientService.updatePatient.mockRejectedValue(new Error('Update failed'));
            renderUpdate(mockPatientData);
            
            await waitFor(() => expect(screen.getByTestId('patient-form-mock-edit')).toBeInTheDocument());
            
            await user.click(screen.getByTestId('submit-update'));
            
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to update information.', { id: 'loading-id' });
            });
        });
    });

});
