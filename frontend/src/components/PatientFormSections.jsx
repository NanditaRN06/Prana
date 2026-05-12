// frontend/src/components/PatientFormSections.jsx

import { COMORBIDITY_OPTIONS, DURATION_OPTIONS } from "../utils/usePatientForm";

export const FormGroup = ({ label, children, required = false, htmlFor }) => (
    <div className="space-y-3">
        <label htmlFor={htmlFor} className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

export const SectionHeading = ({ title }) => (
    <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
);

export const GeneralInfo = ({ formData, handleInputChange }) => (
    <section className="space-y-6">
        <SectionHeading title="General Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormGroup label="Patient Full Name" required htmlFor="name">
                <input id="name" name="name" className="input-field" placeholder="Enter legal name" value={formData.name} onChange={handleInputChange} required />
            </FormGroup>
            <FormGroup label="Age (Years)" required htmlFor="age">
                <input id="age" type="number" name="age" className="input-field" placeholder="0-120" value={formData.age} onChange={handleInputChange} required />
            </FormGroup>
            <FormGroup label="Phone Number" required htmlFor="phone">
                <input
                    id="phone"
                    type="tel"
                    name="phone"
                    className="input-field"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    pattern="\d{10}"
                    required
                    title="Please enter exactly 10 digits"
                    onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); }}
                />
            </FormGroup>
            <FormGroup label="Residential Address" htmlFor="address">
                <input id="address" type="text" name="address" className="input-field" placeholder="Optional" value={formData.address} onChange={handleInputChange} />
            </FormGroup>
            <FormGroup label="Examination Date & Time" required htmlFor="examdate">
                <input id="examdate" type="datetime-local" name="examdate" className="input-field" value={formData.examdate} onChange={handleInputChange} required />
            </FormGroup>
        </div>
    </section>
);

export const Vitals = ({ vitals, handleVitalsChange }) => (
    <section className="space-y-6">
        <div className="flex items-center justify-between">
            <SectionHeading title="Vitals (Optional)" />
            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">Only recorded values will be saved</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <FormGroup label="Pulse (bpm)" htmlFor="pulse">
                <input id="pulse" type="number" name="pulse" className="input-field" placeholder="0 - 300" min="0" max="300" value={vitals.pulse} onChange={handleVitalsChange} />
            </FormGroup>
            <FormGroup label="BP Systolic" htmlFor="systolic">
                <input id="systolic" type="number" name="systolic" className="input-field" placeholder="mmHg" min="0" max="300" value={vitals.bp.systolic} onChange={handleVitalsChange} />
            </FormGroup>
            <FormGroup label="BP Diastolic" htmlFor="diastolic">
                <input id="diastolic" type="number" name="diastolic" className="input-field" placeholder="mmHg" min="0" max="200" value={vitals.bp.diastolic} onChange={handleVitalsChange} />
            </FormGroup>
            <FormGroup label="SpO2 (%)" htmlFor="spO2">
                <input id="spO2" type="number" name="spO2" className="input-field" placeholder="0 - 100" min="0" max="100" value={vitals.spO2} onChange={handleVitalsChange} />
            </FormGroup>
        </div>
    </section>
);

export const MedicalHistory = ({ state, actions }) => {
    const { formData, comorbidities, customComorbidity } = state;
    const {
        handleInputChange,
        toggleComorbidity,
        updateComorbidityDuration,
        addCustomComorbidity,
        removeCustomComorbidity,
        setCustomComorbidity
    } = actions;

    return (
        <section className="space-y-6">
            <SectionHeading title="Medical History" />

            <FormGroup label="Co-morbidities & Duration">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        {COMORBIDITY_OPTIONS.map(c => {
                            const isSelected = comorbidities.some(item => item.name === c);
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleComorbidity(c)}
                                    className={`chip ${isSelected ? 'active' : ''}`}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>

                    {comorbidities.some(c => c.name === "Others") && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specify Other Conditions</h4>
                                <div className="group relative">
                                    <span className="cursor-help text-xs bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center font-bold text-slate-500">?</span>
                                    <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg hidden group-hover:block z-10">Add unlisted conditions here. Can add multiple entries.</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="input-field py-2 text-sm flex-1"
                                    placeholder="Condition Name"
                                    value={customComorbidity.name}
                                    onChange={(e) => setCustomComorbidity(prev => ({ ...prev, name: e.target.value }))}
                                />
                                <select
                                    className="input-field py-2 text-xs w-32"
                                    value={customComorbidity.duration}
                                    onChange={(e) => setCustomComorbidity(prev => ({ ...prev, duration: e.target.value }))}
                                >
                                    <option value="">Duration...</option>
                                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <button type="button" onClick={addCustomComorbidity} className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl hover:bg-blue-700 transition-colors" title="Add condition">+</button>
                            </div>
                        </div>
                    )}

                    {comorbidities.length > 0 && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Selections</h4>
                            {comorbidities.map((item, idx) => {
                                if (item.name === "None") return <p key={idx} className="text-sm font-bold text-slate-400 italic">No co-morbidities recorded.</p>;
                                if (item.name === "Others") return null;

                                const displayName = item.name.startsWith("Other: ") ? item.name.replace("Other: ", "") : item.name;

                                return (
                                    <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-left-2">
                                        <span className="font-bold text-sm w-1/3 truncate" title={displayName}>{displayName}</span>
                                        <select
                                            className="input-field py-2 text-xs w-1/3"
                                            value={item.duration}
                                            onChange={(e) => updateComorbidityDuration(item.name, e.target.value)}
                                        >
                                            <option value="">Select Duration...</option>
                                            {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        {item.name.startsWith("Other: ") && (
                                            <button type="button" onClick={() => removeCustomComorbidity(item.name)} className="text-red-400 hover:text-red-600 font-bold px-2">✕</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </FormGroup>

            <FormGroup label="Allergy Status">
                <div className="flex gap-4">
                    {["yes", "no"].map(opt => (
                        <label key={opt} className={`flex-1 radio-box ${formData.allergies === opt ? 'active' : ''}`}>
                            <input type="radio" name="allergies" value={opt} className="hidden" checked={formData.allergies === opt} onChange={handleInputChange} />
                            <span className="capitalize">{opt}</span>
                        </label>
                    ))}
                </div>
                {formData.allergies === "yes" && (
                    <textarea name="allergyDetails" className="textarea-field mt-4 border-red-100" placeholder="List any known drug or food allergies here..." value={formData.allergyDetails} onChange={handleInputChange} required />
                )}
            </FormGroup>

            <FormGroup label="Current Medications (if any)">
                <textarea
                    name="currentMedications"
                    className="textarea-field min-h-[80px]"
                    placeholder="List currently active medications..."
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                />
            </FormGroup>
        </section>
    );
};

export const ClinicalFindings = ({ formData, handleInputChange }) => (
    <section className="space-y-6">
        <SectionHeading title="Clinical Findings" />

        <div className="grid grid-cols-1 gap-8">
            <FormGroup label="Principal Complaints">
                <textarea name="chiefComplaints" className="textarea-field min-h-[120px]" placeholder="Main symptoms or reason for visit..." value={formData.chiefComplaints} onChange={handleInputChange} required />
            </FormGroup>
            <FormGroup label="Medical Examination">
                <textarea name="examination" className="textarea-field min-h-[120px]" placeholder="Notes from health assessment..." value={formData.examination} onChange={handleInputChange} required />
            </FormGroup>
            <FormGroup label="Clinical Diagnosis">
                <textarea
                    name="clinicalDiagnosis"
                    className="textarea-field min-h-[80px] border-blue-100 bg-blue-50/30"
                    placeholder="Final/Provisional diagnosis..."
                    value={formData.clinicalDiagnosis}
                    onChange={handleInputChange}
                />
            </FormGroup>
        </div>
    </section>
);
