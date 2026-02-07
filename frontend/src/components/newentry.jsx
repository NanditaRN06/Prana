import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const NewEntry = () => {
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        examdate: "",
        allergies: "no",
        allergyDetails: "",
        chiefComplaints: "",
        examination: "",
        otherDetails: ""
    });
    const [comorbidities, setComorbidities] = useState([]);
    const [otherComorbidities, setOtherComorbidities] = useState("");
    const [selectedInvestigations, setSelectedInvestigations] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [showMedicines, setShowMedicines] = useState(false);
    const [showOtherTreatment, setShowOtherTreatment] = useState(false);
    const [investigationState, setInvestigationState] = useState({
        showMRI: false,
        showCT: false,
        showOthers: false,
        mriRegion: "",
        otherText: ""
    });
    const [toData, setToData] = useState(false);

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleComorbidityChange = (value) => {
        setComorbidities(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
    };

    const addMedicine = () => {
        setMedicines([...medicines, { name: "", dose: "", schedule: [], days: "" }]);
    };

    const validateDose = (value) => {
        if (value && !/^\d/.test(value)) {
            return false;
        }
        return true;
    };

    const updateMedicine = (index, field, value) => {
        const updated = [...medicines];
        if (field === "dose") {
            if (value && !/^\d/.test(value)) {
                // We don't update if it's invalid, but let's provide feedback later
                // Actually, the requirement says "must start with a number". 
                // We can enforce it by not allowing the change or showing a red border.
            }
        }

        if (field === "schedule") {
            const current = updated[index].schedule;
            updated[index].schedule = current.includes(value)
                ? current.filter(s => s !== value)
                : [...current, value];
        } else {
            updated[index][field] = value;
        }
        setMedicines(updated);
    };

    const removeMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleInvestigationSelect = (value) => {
        if (value === "MRI") setInvestigationState({ ...investigationState, showMRI: true, showCT: false, showOthers: false });
        else if (value === "CT") setInvestigationState({ ...investigationState, showCT: true, showMRI: false, showOthers: false });
        else if (value === "Others") setInvestigationState({ ...investigationState, showOthers: true, showMRI: false, showCT: false });
        else if (!selectedInvestigations.includes(value)) setSelectedInvestigations([...selectedInvestigations, value]);
    };

    const addMriRegion = (e) => {
        if (e.key === "Enter" && investigationState.mriRegion.trim()) {
            e.preventDefault();
            const region = `MRI of ${investigationState.mriRegion.trim()}`;
            if (!selectedInvestigations.includes(region)) setSelectedInvestigations([...selectedInvestigations, region]);
            setInvestigationState({ ...investigationState, mriRegion: "" });
        }
    };

    const addOtherInvestigation = (e) => {
        if (e.key === "Enter" && investigationState.otherText.trim()) {
            e.preventDefault();
            const text = investigationState.otherText.trim();
            if (!selectedInvestigations.includes(text)) setSelectedInvestigations([...selectedInvestigations, text]);
            setInvestigationState({ ...investigationState, otherText: "" });
        }
    };

    const onSubmitting = (e) => {
        e.preventDefault();

        // Validation
        if (comorbidities.length === 0) {
            toast.error("Please specify at least one co-morbidity or select 'None'.");
            return;
        }

        // Medicine dosage validation
        for (let i = 0; i < medicines.length; i++) {
            if (!validateDose(medicines[i].dose)) {
                toast.error(`Dosage for "${medicines[i].name || 'Medicine ' + (i + 1)}" must start with a number (e.g., '500 mg').`);
                return;
            }
        }

        const finalComorbidities = [...comorbidities];
        if (comorbidities.includes("Others") && otherComorbidities) finalComorbidities.push(otherComorbidities);

        const medicinesFormatted = medicines.map(m =>
            `${m.name}-${m.dose}-[${m.schedule.join(",")}]-${m.days}`
        );

        const submissionData = {
            ...formData,
            comorbidities: finalComorbidities,
            treatments: medicinesFormatted,
            investigations: selectedInvestigations.length > 0 ? selectedInvestigations : ["None"],
            allergies: formData.allergies === "yes" ? "Yes" : "No"
        };

        const loadToast = toast.loading("Saving patient data...");
        axios.post('http://localhost:9000/new-entry', submissionData, { withCredentials: true })
            .then(() => {
                toast.success("Patient record saved.", { id: loadToast });
                setToData(true);
            })
            .catch(err => {
                console.error("Submission Error:", err);
                toast.error("An error occurred while attempting to save the record.", { id: loadToast });
            });
    };

    if (toData) return <Navigate to={`/patient/${formData.name}`} />;

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-10 py-12 text-white">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        New Patient Entry
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Enter patient history and current health status.</p>
                </div>

                <form className="p-10 space-y-12" onSubmit={onSubmitting}>
                    {/* Basic Info */}
                    <section className="space-y-6">
                        <SectionHeading title="General Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormGroup label="Patient Full Name">
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    placeholder="Enter legal name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </FormGroup>
                            <FormGroup label="Age (Years)">
                                <input
                                    type="number"
                                    name="age"
                                    className="input-field"
                                    placeholder="0-120"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    min="0" max="120"
                                    required
                                />
                            </FormGroup>
                            <FormGroup label="Date of Examination">
                                <input
                                    type="datetime-local"
                                    name="examdate"
                                    className="input-field"
                                    value={formData.examdate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </FormGroup>
                        </div>
                    </section>

                    {/* Medical History */}
                    <section className="space-y-6">
                        <SectionHeading title="Medical History" />
                        <FormGroup label="Co-morbidities">
                            <div className="flex flex-wrap gap-3">
                                {["Hypertension", "Diabetes", "Thyroid Disease", "IHD", "Old Stroke", "Others", "None"].map(c => (
                                    <label key={c} className={`chip ${comorbidities.includes(c) ? 'active' : ''}`}>
                                        <input type="checkbox" className="hidden" checked={comorbidities.includes(c)} onChange={() => handleComorbidityChange(c)} />
                                        <span>{c}</span>
                                    </label>
                                ))}
                            </div>
                            {comorbidities.includes("Others") && (
                                <textarea
                                    className="textarea-field mt-4"
                                    placeholder="Provide details of other clinical conditions..."
                                    value={otherComorbidities}
                                    onChange={(e) => setOtherComorbidities(e.target.value)}
                                />
                            )}
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
                                <textarea
                                    name="allergyDetails"
                                    className="textarea-field mt-4 border-red-100 focus:border-red-400 focus:ring-red-50"
                                    placeholder="Document specific allergen sensitivities..."
                                    value={formData.allergyDetails}
                                    onChange={handleInputChange}
                                    required
                                />
                            )}
                        </FormGroup>
                    </section>

                    {/* Clinical Details */}
                    <section className="space-y-6">
                        <SectionHeading title="Patient Notes" />
                        <div className="grid grid-cols-1 gap-8">
                            <FormGroup label="Principal Complaints">
                                <textarea
                                    name="chiefComplaints"
                                    className="textarea-field min-h-[120px]"
                                    placeholder="Main symptoms or reason for visit..."
                                    value={formData.chiefComplaints}
                                    onChange={handleInputChange}
                                    required
                                />
                            </FormGroup>
                            <FormGroup label="Medical Examination">
                                <textarea
                                    name="examination"
                                    className="textarea-field min-h-[120px]"
                                    placeholder="Notes from health assessment..."
                                    value={formData.examination}
                                    onChange={handleInputChange}
                                    required
                                />
                            </FormGroup>
                        </div>
                    </section>

                    {/* Treatments */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <SectionHeading title="Treatment Plan" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowMedicines(!showMedicines); if (!showMedicines && medicines.length === 0) addMedicine() }} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showMedicines ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Medicines
                                </button>
                                <button type="button" onClick={() => setShowOtherTreatment(!showOtherTreatment)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showOtherTreatment ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Other Notes
                                </button>
                            </div>
                        </div>

                        {showMedicines && (
                            <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner overflow-hidden">
                                {medicines.map((med, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-slate-100 relative group animate-in fade-in slide-in-from-top-4 duration-300">
                                        <button type="button" onClick={() => removeMedicine(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">✕</button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medicine Name</label>
                                                <input type="text" placeholder="e.g. Paracetamol" className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold placeholder:text-slate-300" value={med.name} onChange={(e) => updateMedicine(idx, "name", e.target.value)} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 500mg"
                                                    className={`w-full p-3 bg-slate-50 rounded-xl border-none font-bold placeholder:text-slate-300 ${!validateDose(med.dose) && med.dose ? 'ring-2 ring-red-100 text-red-600' : ''}`}
                                                    value={med.dose}
                                                    onChange={(e) => updateMedicine(idx, "dose", e.target.value)}
                                                    required
                                                />
                                                {!validateDose(med.dose) && med.dose && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1 uppercase tracking-tighter">Must start with a number</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-end gap-2 pt-2">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Schedule</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Morning", "Afternoon", "Evening", "Night"].map(t => (
                                                        <button key={t} type="button" onClick={() => updateMedicine(idx, "schedule", t)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${med.schedule.includes(t) ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-blue-100'}`}>
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                                                <input type="number" placeholder="Days" className="w-24 p-2 bg-slate-50 rounded-xl border-none text-center font-bold" value={med.days} onChange={(e) => updateMedicine(idx, "days", e.target.value)} required />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addMedicine} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-blue-300 hover:text-blue-600 hover:bg-white transition-all flex items-center justify-center gap-2">
                                    <span className="text-xl">+</span> Add Medication
                                </button>
                            </div>
                        )}

                        {showOtherTreatment && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Supplemental Treatment Notes</label>
                                <textarea
                                    name="otherDetails"
                                    className="textarea-field min-h-[100px] border-slate-100"
                                    placeholder="Enter non-pharmacological interventions or patient advice..."
                                    value={formData.otherDetails}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                    </section>

                    {/* Investigations */}
                    <section className="space-y-6">
                        <SectionHeading title="Clinical Investigations" />
                        <FormGroup label="Recommended/Requested Tests">
                            <div className="flex flex-wrap gap-2 mb-6 max-h-[220px] overflow-y-auto p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                {["CBC", "HBA1C", "FBS", "PPBS", "MRI", "CT", "EEG", "ENMG", "Vit. B12", "Vit. D", "TSH", "USG Abdomen", "Others"].map(inv => (
                                    <button key={inv} type="button" onClick={() => handleInvestigationSelect(inv)} className="px-4 py-2 rounded-xl font-bold text-xs transition-all bg-white border border-slate-100 text-slate-600 hover:border-blue-300 hover:bg-blue-50 shadow-sm">
                                        {inv}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {investigationState.showMRI && (
                                    <input
                                        className="input-field border-blue-200 bg-blue-50 text-blue-900 placeholder-blue-300"
                                        placeholder="Specify MRI anatomical region (e.g. Brain) + Enter"
                                        value={investigationState.mriRegion}
                                        onChange={(e) => setInvestigationState({ ...investigationState, mriRegion: e.target.value })}
                                        onKeyDown={addMriRegion}
                                    />
                                )}
                                {investigationState.showCT && (
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setSelectedInvestigations([...selectedInvestigations, "CT with contrast"])} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg">With Contrast</button>
                                        <button type="button" onClick={() => setSelectedInvestigations([...selectedInvestigations, "CT without contrast"])} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg">Without Contrast</button>
                                    </div>
                                )}
                                {investigationState.showOthers && (
                                    <input
                                        className="input-field border-slate-800 bg-slate-900 text-white placeholder-slate-500"
                                        placeholder="Type custom investigation name + Enter"
                                        value={investigationState.otherText}
                                        onChange={(e) => setInvestigationState({ ...investigationState, otherText: e.target.value })}
                                        onKeyDown={addOtherInvestigation}
                                    />
                                )}
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Registry Summary:</h4>
                                    {selectedInvestigations.length > 0 && (
                                        <button type="button" onClick={() => setSelectedInvestigations([])} className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest">Clear Registry</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedInvestigations.length > 0 ? (
                                        selectedInvestigations.map((inv, idx) => (
                                            <span key={idx} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 animate-in zoom-in duration-200">
                                                {inv}
                                                <button type="button" onClick={() => setSelectedInvestigations(selectedInvestigations.filter((_, i) => i !== idx))} className="text-white/30 hover:text-white transition-colors text-[10px]">✕</button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-slate-300 italic text-sm pl-1">No investigations currently selected.</p>
                                    )}
                                </div>
                            </div>
                        </FormGroup>
                    </section>

                    {/* Actions */}
                    <div className="pt-12 flex gap-6">
                        <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all border-b-4 border-black/10">
                            Save Patient Record
                        </button>
                        <button type="button" onClick={() => navigate("/home")} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-200 transition-all border-b-4 border-black/10">
                            Discard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FormGroup = ({ label, children }) => (
    <div className="space-y-3">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">{label}</label>
        {children}
    </div>
);

const SectionHeading = ({ title }) => (
    <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
);

export default NewEntry;
