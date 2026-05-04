// frontend/src/components/PatientForm.jsx

import { useNavigate } from "react-router-dom";
import { usePatientForm } from "../utils/usePatientForm";
import { GeneralInfo, Vitals, MedicalHistory, ClinicalFindings } from "./PatientFormSections";
import { TreatmentPlan, Investigations } from "./PatientFormDetails";

const PatientForm = ({ initialData = {}, mode = "create", onSubmit }) => {
    const navigate = useNavigate();
    const { state, actions } = usePatientForm(initialData, mode, onSubmit);

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className={`${mode === 'create' ? 'bg-slate-900' : 'bg-blue-600'} px-10 py-12 text-white`}>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        {mode === 'create' ? 'New Patient Entry' : 'Edit Patient Record'}
                    </h1>
                    <p className="opacity-80 mt-2 font-medium">
                        {mode === 'create' ? 'Enter patient history and current health status.' : 'Update clinical documentation.'}
                    </p>
                </div>

                <form className="p-10 space-y-12" onSubmit={actions.handleSubmit}>
                    <GeneralInfo formData={state.formData} handleInputChange={actions.handleInputChange} />
                    <Vitals vitals={state.formData.vitals} handleVitalsChange={actions.handleVitalsChange} />
                    <MedicalHistory state={state} actions={actions} />
                    <ClinicalFindings formData={state.formData} handleInputChange={actions.handleInputChange} />
                    <TreatmentPlan state={state} actions={actions} />
                    <Investigations state={state} actions={actions} mode={mode} />

                    <div className="pt-12 flex gap-6">
                        <button
                            type="submit"
                            disabled={mode === 'create' ? !state.isFormValid : !state.hasChanges}
                            className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg transition-all ${(mode === 'create' ? !state.isFormValid : !state.hasChanges)
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {mode === 'create' ? 'Save Patient Record' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => navigate("/home")} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientForm;
