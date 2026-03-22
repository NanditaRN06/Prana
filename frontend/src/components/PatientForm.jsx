// frontend/components/PatientForm.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const COMORBIDITY_OPTIONS = ["Hypertension", "Diabetes", "Thyroid Disease", "IHD", "Old Stroke", "Others", "None"];
const DURATION_OPTIONS = [
    "< 1 year", "1-3 years", "4-6 years", "7-9 years", "10-12 years",
    "13-15 years", "16-18 years", "19-21 years", "22-25 years", "> 25 years"
];
const INVESTIGATION_OPTIONS = ["CBC", "HBA1C", "Lipid Profile", "FBS", "PPBS", "MRI", "CT", "EEG", "ENMG", "TSH", "USG Abdomen", "Others"];

const PatientForm = ({ initialData = {}, mode = "create", onSubmit }) => {
    const navigate = useNavigate();

    const parseTreatments = (treatments = []) => {
        if (!Array.isArray(treatments)) return [];
        return treatments.map((t, index) => {
            const parts = t.split('-');
            const scheduleRaw = parts[2] || "[]";
            const schedule = scheduleRaw.slice(1, -1).split(',').filter(s => s.trim() !== "");

            const daysString = parts[3] || "";
            const daysParts = daysString.trim().split(/\s+/);
            const daysCount = daysParts[0] || "";
            const daysUnit = daysParts[1] || "Days";

            let dose = (parts[1] || "").trim();
            let doseUnit = "mg";
            const suffixes = ["mg/mL", "mg/kg", "mg", "mcd", "gm"];
            for (const suffix of suffixes) {
                if (dose.endsWith(suffix)) {
                    doseUnit = suffix;
                    dose = dose.slice(0, -suffix.length).trim();
                    break;
                }
            }

            return {
                id: Date.now() + index,
                name: parts[0] || "",
                dose,
                doseUnit,
                schedule,
                daysCount,
                daysUnit,
                instructions: parts[4] || ""
            };
        });
    };

    const parseInvestigationDetails = (details, type) => {
        if (!details || !details[type]) return [];
        const data = details[type];
        if (Array.isArray(data)) return data.map((item, i) => ({ ...item, id: Date.now() + i }));
        if (typeof data === 'object' && data.region) return [{ ...data, id: Date.now() }];
        return [];
    };

    const [formData, setFormData] = useState({
        name: initialData.name || "",
        age: initialData.age || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        examdate: initialData.examdate ? (() => {
            const d = new Date(initialData.examdate);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        })() : "",
        allergies: (initialData.allergies?.toLowerCase() === "yes") ? "yes" : "no",
        allergyDetails: initialData.allergyDetails || "",
        clinicalDiagnosis: initialData.clinicalDiagnosis || "",
        currentMedications: initialData.currentMedications || "",
        chiefComplaints: initialData.chiefComplaints || "",
        examination: initialData.examination || "",
        otherDetails: initialData.otherDetails || ""
    });

    const [comorbidities, setComorbidities] = useState(() => {
        if (initialData.comorbidityData && initialData.comorbidityData.length > 0) {
            return initialData.comorbidityData;
        }
        if (initialData.comorbidities && initialData.comorbidities.length > 0) {
            return initialData.comorbidities.map(c => ({ name: c, duration: "" }));
        }
        return [{ name: "None", duration: "" }];
    });

    const [previousComorbidities, setPreviousComorbidities] = useState([]);
    const [customComorbidity, setCustomComorbidity] = useState({ name: "", duration: "" });

    const [medicines, setMedicines] = useState(parseTreatments(initialData.treatments));
    const [showMedicines, setShowMedicines] = useState(medicines.length > 0);
    const [showOtherTreatment, setShowOtherTreatment] = useState(!!initialData.otherDetails);
    const [selectedInvestigations, setSelectedInvestigations] = useState(initialData.investigations || []);
    const [investigationDetails, setInvestigationDetails] = useState({
        mri: parseInvestigationDetails(initialData.investigationDetails, 'mri'),
        ct: parseInvestigationDetails(initialData.investigationDetails, 'ct'),
        enmg: parseInvestigationDetails(initialData.investigationDetails, 'enmg'),
        others: initialData.investigationDetails?.others || ""
    });

    const [newInvestigationInput, setNewInvestigationInput] = useState({
        mri: { region: "" },
        ct: { region: "", contrast: "" },
        enmg: { region: "" }
    });

    const [othersInput, setOthersInput] = useState("");

    const [hasChanges, setHasChanges] = useState(false);

    const isFormValid = () => {
        return (
            formData.name.trim() !== "" &&
            String(formData.age).trim() !== "" &&
            String(formData.phone).trim().length === 10 &&
            String(formData.examdate).trim() !== ""
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (mode === 'edit') setHasChanges(true);
    };
    const toggleComorbidity = (name) => {
        if (mode === 'edit') setHasChanges(true);
        if (name === "None") {
            if (comorbidities.some(c => c.name === "None")) {
                setComorbidities(previousComorbidities.length > 0 ? previousComorbidities : []);
            } else {
                setPreviousComorbidities(comorbidities);
                setComorbidities([{ name: "None", duration: "" }]);
            }
        } else {
            let newComorbidities = [...comorbidities];
            if (newComorbidities.some(c => c.name === "None")) {
                newComorbidities = [];
            }

            const exists = newComorbidities.find(c => c.name === name);
            if (exists) {
                newComorbidities = newComorbidities.filter(c => c.name !== name);
            } else {
                newComorbidities.push({ name, duration: "" });
            }

            setComorbidities(newComorbidities);
        }
    };

    const updateComorbidityDuration = (name, duration) => {
        if (mode === 'edit') setHasChanges(true);
        setComorbidities(prev => prev.map(c => c.name === name ? { ...c, duration } : c));
    };

    const addCustomComorbidity = () => {
        if (customComorbidity.name.trim()) {
            if (mode === 'edit') setHasChanges(true);
            const prefixedName = `Other: ${customComorbidity.name.trim()}`;
            if (!comorbidities.some(c => c.name === prefixedName)) {
                let newComorbidities = [...comorbidities];
                if (newComorbidities.some(c => c.name === "None")) {
                    newComorbidities = [];
                }
                newComorbidities.push({ name: prefixedName, duration: customComorbidity.duration });
                setComorbidities(newComorbidities);
            }
            setCustomComorbidity({ name: "", duration: "" });
        }
    };

    const removeCustomComorbidity = (name) => {
        if (mode === 'edit') setHasChanges(true);
        setComorbidities(prev => prev.filter(c => c.name !== name));
    };

    const addMedicine = () => {
        if (mode === 'edit') setHasChanges(true);
        setMedicines([...medicines, { id: Date.now(), name: "", dose: "", doseUnit: "mg", schedule: [], daysCount: "", daysUnit: "Days", instructions: "" }]);
    };
    const removeMedicine = (index) => {
        if (mode === 'edit') setHasChanges(true);
        setMedicines(medicines.filter((_, i) => i !== index));
    };
    const updateMedicine = (index, field, value) => {
        if (mode === 'edit') setHasChanges(true);
        const updated = [...medicines];
        if (field === "schedule") {
            const current = updated[index].schedule;
            updated[index].schedule = current.includes(value) ? current.filter(s => s !== value) : [...current, value];
        } else {
            updated[index][field] = value;
        }
        setMedicines(updated);
    };

    const toggleInvestigation = (inv) => {
        if (mode === 'edit') setHasChanges(true);
        setSelectedInvestigations(prev => prev.includes(inv) ? prev.filter(x => x !== inv) : [...prev, inv]);
    };

    const addMriRegion = () => {
        if (newInvestigationInput.mri.region.trim()) {
            if (mode === 'edit') setHasChanges(true);
            setInvestigationDetails(prev => ({
                ...prev,
                mri: [...prev.mri, { id: Date.now(), region: newInvestigationInput.mri.region }]
            }));
            setNewInvestigationInput(prev => ({ ...prev, mri: { region: "" } }));
        }
    };

    const addCtRegion = () => {
        if (newInvestigationInput.ct.region.trim()) {
            if (mode === 'edit') setHasChanges(true);
            setInvestigationDetails(prev => ({
                ...prev,
                ct: [...prev.ct, { id: Date.now(), region: newInvestigationInput.ct.region, contrast: newInvestigationInput.ct.contrast }]
            }));
            setNewInvestigationInput(prev => ({ ...prev, ct: { region: "", contrast: "" } }));
        }
    };

    const addEnmgRegion = () => {
        if (newInvestigationInput.enmg.region.trim()) {
            if (mode === 'edit') setHasChanges(true);
            setInvestigationDetails(prev => ({
                ...prev,
                enmg: [...prev.enmg, { id: Date.now(), region: newInvestigationInput.enmg.region }]
            }));
            setNewInvestigationInput(prev => ({ ...prev, enmg: { region: "" } }));
        }
    };

    const removeInvestigationItem = (type, id) => {
        if (mode === 'edit') setHasChanges(true);
        setInvestigationDetails(prev => ({
            ...prev,
            [type]: prev[type].filter(item => item.id !== id)
        }));
    };

    const addOtherInvestigation = (e) => {
        if (e.key === "Enter" && othersInput.trim()) {
            e.preventDefault();
            if (mode === 'edit') setHasChanges(true);

            const customText = othersInput.trim();

            if (!selectedInvestigations.includes("Others")) {
                setSelectedInvestigations([...selectedInvestigations, "Others"]);
            }

            setInvestigationDetails(prev => ({
                ...prev,
                others: prev.others ? `${prev.others}, ${customText}` : customText
            }));

            setOthersInput("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (comorbidities.length === 0) {
            toast.error("Please specify at least one co-morbidity or select 'None'.");
            return;
        }

        if (selectedInvestigations.includes("MRI") && investigationDetails.mri.length === 0) {
            toast.error("Please add at least one MRI region before submitting.");
            return;
        }

        if (selectedInvestigations.includes("CT") && investigationDetails.ct.length === 0) {
            toast.error("Please add CT region and select contrast option before submitting.");
            return;
        }

        if (selectedInvestigations.includes("ENMG") && investigationDetails.enmg.length === 0) {
            toast.error("Please add at least one ENMG region before submitting.");
            return;
        }

        const medicinesFormatted = medicines.map(m => {
            const doseCombined = `${m.dose} ${m.doseUnit}`.trim();
            return `${m.name}-${doseCombined}-[${m.schedule.join(",")}]-${m.daysCount} ${m.daysUnit}-${m.instructions}`;
        });

        const cleanInvestigationDetails = {
            mri: investigationDetails.mri.map(({ id, ...rest }) => rest),
            ct: investigationDetails.ct.map(({ id, ...rest }) => rest),
            enmg: investigationDetails.enmg.map(({ id, ...rest }) => rest),
            others: investigationDetails.others || ""
        };

        const submissionData = {
            ...formData,
            comorbidities: comorbidities.map(c => c.name),
            comorbidityData: comorbidities,
            currentMedications: formData.currentMedications,
            phone: formData.phone,
            address: formData.address,
            clinicalDiagnosis: formData.clinicalDiagnosis,
            treatments: medicinesFormatted,
            investigations: selectedInvestigations.length > 0 ? selectedInvestigations : ["None"],
            investigationDetails: cleanInvestigationDetails,
            allergies: formData.allergies === "yes" ? "Yes" : "No"
        };

        onSubmit(submissionData);
    };

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

                <form className="p-10 space-y-12" onSubmit={handleSubmit}>
                    <section className="space-y-6">
                        <SectionHeading title="General Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormGroup label="Patient Full Name" required>
                                <input name="name" className="input-field" placeholder="Enter legal name" value={formData.name} onChange={handleInputChange} required />
                            </FormGroup>
                            <FormGroup label="Age (Years)" required>
                                <input type="number" name="age" className="input-field" placeholder="0-120" value={formData.age} onChange={handleInputChange} required />
                            </FormGroup>
                            <FormGroup label="Phone Number" required>
                                <input
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
                            <FormGroup label="Residential Address">
                                <input type="text" name="address" className="input-field" placeholder="Optional" value={formData.address} onChange={handleInputChange} />
                            </FormGroup>
                            <FormGroup label="Examination Date & Time" required>
                                <input type="datetime-local" name="examdate" className="input-field" value={formData.examdate} onChange={handleInputChange} required />
                            </FormGroup>
                        </div>
                    </section>

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
                                <textarea name="allergyDetails" className="textarea-field mt-4 border-red-100" placeholder="Document specific allergen sensitivities..." value={formData.allergyDetails} onChange={handleInputChange} required />
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

                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <SectionHeading title="Treatment Plan" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowMedicines(!showMedicines); if (!showMedicines && medicines.length === 0) addMedicine() }} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showMedicines ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Medicines
                                </button>
                                <button type="button" onClick={() => setShowOtherTreatment(!showOtherTreatment)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showOtherTreatment ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Notes
                                </button>
                            </div>
                        </div>

                        {showMedicines && (
                            <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                {medicines.map((med, idx) => (
                                    <div key={med.id} className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-slate-100 relative">
                                        <button type="button" onClick={() => removeMedicine(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">✕</button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medicine Name</label>
                                                <input type="text" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={med.name} onChange={(e) => updateMedicine(idx, "name", e.target.value)} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
                                                <div className="flex bg-slate-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100">
                                                    <input type="number" className="w-full p-3 bg-transparent font-bold focus:outline-none" value={med.dose} onChange={(e) => updateMedicine(idx, "dose", e.target.value)} required />
                                                    <select
                                                        className="p-3 bg-slate-100 font-bold text-xs border-l border-slate-200 outline-none cursor-pointer"
                                                        value={med.doseUnit || "mg"}
                                                        onChange={(e) => updateMedicine(idx, "doseUnit", e.target.value)}
                                                    >
                                                        <option value="mg">mg</option>
                                                        <option value="mcd">mcd</option>
                                                        <option value="gm">gm</option>
                                                        <option value="mg/mL">mg/mL</option>
                                                        <option value="mg/kg">mg/kg</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-end gap-2">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Schedule</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Morning", "Afternoon", "Evening", "Night"].map(t => (
                                                        <button key={t} type="button" onClick={() => updateMedicine(idx, "schedule", t)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${med.schedule.includes(t) ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-100 text-slate-400'}`}>{t}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1 w-36 flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Days</label>
                                                    <input type="number" min={0} className="w-full p-2 bg-slate-50 rounded-xl font-bold text-center" value={med.daysCount} onChange={(e) => updateMedicine(idx, "daysCount", e.target.value)} required />
                                                </div>
                                                <select
                                                    className="p-2 bg-slate-50 rounded-xl font-bold text-[10px] mb-[1px] border border-transparent focus:border-blue-200 outline-none"
                                                    value={med.daysUnit}
                                                    onChange={(e) => updateMedicine(idx, "daysUnit", e.target.value)}
                                                >
                                                    <option value="Days">Days</option>
                                                    <option value="Months">Months</option>
                                                    <option value="Years">Years</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-[140px]">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instructions</label>
                                                <input type="text" className="w-full p-2 bg-slate-50 rounded-xl font-bold" placeholder="ex: Before food" value={med.instructions} onChange={(e) => updateMedicine(idx, "instructions", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addMedicine} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-blue-300">+ Add Medication</button>
                            </div>
                        )}

                        {showOtherTreatment && (
                            <textarea name="otherDetails" className="textarea-field min-h-[100px]" placeholder="Supplemental treatment notes..." value={formData.otherDetails} onChange={handleInputChange} />
                        )}
                    </section>

                    <section className="space-y-6">
                        <SectionHeading title="Clinical Investigations" />
                        <FormGroup label="Recommended/Requested Tests">
                            <div className="flex flex-wrap gap-2 mb-6 max-h-[220px] overflow-y-auto p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                {INVESTIGATION_OPTIONS.map(inv => (
                                    <button key={inv} type="button" onClick={() => toggleInvestigation(inv)} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${selectedInvestigations.includes(inv) ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-600 hover:border-blue-300'}`}>
                                        {inv}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {selectedInvestigations.includes("MRI") && (
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add MRI Region</p>
                                        <div className="flex gap-2">
                                            <input
                                                className="input-field py-2 text-sm"
                                                placeholder="Region (ex: Brain)"
                                                value={newInvestigationInput.mri.region}
                                                onChange={(e) => setNewInvestigationInput(prev => ({ ...prev, mri: { region: e.target.value } }))}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMriRegion())}
                                            />
                                            <button type="button" onClick={addMriRegion} className="bg-slate-800 text-white w-10 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-slate-700">+</button>
                                        </div>
                                    </div>
                                )}

                                {selectedInvestigations.includes("CT") && (
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add CT Scan Details</p>
                                        <div className="space-y-2">
                                            <input
                                                className="input-field py-2"
                                                placeholder="Region (ex: Brain, Abdomen)"
                                                value={newInvestigationInput.ct.region}
                                                onChange={(e) => setNewInvestigationInput(prev => ({ ...prev, ct: { ...prev.ct, region: e.target.value } }))}
                                            />
                                            <div className="flex gap-2">
                                                {["With Contrast", "Without Contrast"].map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setNewInvestigationInput(prev => ({ ...prev, ct: { ...prev.ct, contrast: opt } }))}
                                                        className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${newInvestigationInput.ct.contrast === opt ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                                <button type="button" onClick={addCtRegion} className="bg-blue-600 text-white w-12 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-blue-700 disabled:opacity-50" disabled={!newInvestigationInput.ct.region || !newInvestigationInput.ct.contrast}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedInvestigations.includes("ENMG") && (
                                    <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add ENMG Region</p>
                                        <div className="flex gap-2">
                                            <input
                                                className="input-field py-2 text-sm"
                                                placeholder="Specify ENMG Region (ex: Upper Limb)"
                                                value={newInvestigationInput.enmg.region}
                                                onChange={(e) => setNewInvestigationInput(prev => ({ ...prev, enmg: { region: e.target.value } }))}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEnmgRegion())}
                                            />
                                            <button type="button" onClick={addEnmgRegion} className="bg-slate-800 text-white w-10 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-slate-700">+</button>
                                        </div>
                                    </div>
                                )}

                                {selectedInvestigations.includes("Others") && (
                                    <input
                                        className="w-full p-3 bg-slate-900 text-white placeholder-slate-400 rounded-xl border-2 border-slate-700 focus:border-blue-500 focus:outline-none font-medium"
                                        placeholder="Type other investigations and press Enter"
                                        value={othersInput}
                                        onChange={(e) => {
                                            if (mode === 'edit') setHasChanges(true);
                                            setOthersInput(e.target.value);
                                        }}
                                        onKeyDown={addOtherInvestigation}
                                    />
                                )}
                            </div>

                            <div className="mt-8 flex flex-wrap gap-2">
                                {selectedInvestigations.map((inv, idx) => {
                                    let displayText = inv;
                                    let details = "";

                                    if (inv === "MRI" && investigationDetails.mri.length) details = ` (${investigationDetails.mri.map(i => i.region).join(", ")})`;
                                    if (inv === "CT" && investigationDetails.ct.length) details = ` (${investigationDetails.ct.map(i => `${i.region} [${i.contrast || ''}]`).join(", ")})`;
                                    if (inv === "ENMG" && investigationDetails.enmg.length) details = ` (${investigationDetails.enmg.map(i => i.region).join(", ")})`;

                                    if (inv === "Others" && investigationDetails.others) {
                                        displayText = investigationDetails.others;
                                        details = "";
                                    }

                                    return (
                                        <span key={idx} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3">
                                            {displayText}{details}
                                            <button type="button" onClick={() => setSelectedInvestigations(selectedInvestigations.filter(i => i !== inv))} className="text-white/30 hover:text-white transition-colors">✕</button>
                                        </span>
                                    );
                                })}
                            </div>
                        </FormGroup>
                    </section>

                    <div className="pt-12 flex gap-6">
                        <button
                            type="submit"
                            disabled={mode === 'create' ? !isFormValid() : !hasChanges}
                            className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg transition-all ${(mode === 'create' ? !isFormValid() : !hasChanges)
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

const FormGroup = ({ label, children, required = false }) => (
    <div className="space-y-3">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const SectionHeading = ({ title }) => (
    <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
);

export default PatientForm;
