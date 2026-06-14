// frontend/src/components/PatientFormDetails.jsx

import { useEffect, useState } from "react";
import { MEDICINE_TYPES, INVESTIGATION_OPTIONS } from "../utils/usePatientForm";
import { SectionHeading, FormGroup } from "./PatientFormSections";

export const MedTypeDropdown = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const displayItem = MEDICINE_TYPES.find(t => t.val === value) || MEDICINE_TYPES[1];

    useEffect(() => {
        const handleClickOutside = () => setOpen(false);
        if (open) {
            setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [open]);

    return (
        <div className="relative flex-shrink-0 border-r border-slate-200 bg-slate-100 w-[60px] rounded-l-xl" onClick={e => e.stopPropagation()}>
            <button
                type="button"
                className="w-full h-full p-3 font-bold text-xs outline-none text-left flex items-center justify-between hover:bg-slate-200 transition-colors"
                title={displayItem.full}
                onClick={() => setOpen(!open)}
            >
                {displayItem.val} <span className="text-[8px] opacity-50">▾</span>
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] w-40 overflow-hidden py-1">
                    {MEDICINE_TYPES.map(t => (
                        <div
                            key={t.val}
                            className="px-4 py-2 text-xs font-bold hover:bg-blue-50 cursor-pointer text-slate-700"
                            onClick={() => { onChange(t.val); setOpen(false); }}
                        >
                            {t.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const TreatmentPlan = ({ state, actions }) => {
    const { medicines, showMedicines, showOtherTreatment, formData } = state;
    const {
        setShowMedicines,
        setShowOtherTreatment,
        addMedicine,
        removeMedicine,
        updateMedicine,
        handleInputChange
    } = actions;

    return (
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
                        <div key={med.id} className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-slate-100 relative" style={{ zIndex: 100 - idx }}>
                            <button type="button" onClick={() => removeMedicine(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">✕</button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medicine Name</label>
                                    <div className="flex bg-slate-50 rounded-xl focus-within:ring-2 focus-within:ring-blue-100">
                                        <MedTypeDropdown value={med.type || "Tab"} onChange={(val) => updateMedicine(idx, "type", val)} />
                                        <input type="text" className="w-full p-3 bg-transparent font-bold focus:outline-none" value={med.name} onChange={(e) => updateMedicine(idx, "name", e.target.value)} required />
                                    </div>
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
    );
};

export const Investigations = ({ state, actions, mode }) => {
    const { selectedInvestigations, investigationDetails, newInvestigationInput, othersInput } = state;
    const {
        toggleInvestigation,
        addMriRegion,
        addCtRegion,
        addEnmgRegion,
        setNewInvestigationInput,
        addOtherInvestigation,
        setOthersInput,
        setSelectedInvestigations,
        setHasChanges
    } = actions;

    return (
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
    );
};
