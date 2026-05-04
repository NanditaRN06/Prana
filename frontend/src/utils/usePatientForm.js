// frontend/src/utils/usePatientForm.js

import { useState } from "react";
import { toast } from "react-hot-toast";

export const COMORBIDITY_OPTIONS = ["Hypertension", "Diabetes", "Thyroid Disease", "IHD", "Old Stroke", "Others", "None"];
export const DURATION_OPTIONS = [
    "< 1 year", "1-3 years", "4-6 years", "7-9 years", "10-12 years",
    "13-15 years", "16-18 years", "19-21 years", "22-25 years", "> 25 years"
];
export const INVESTIGATION_OPTIONS = ["CBC", "HBA1C", "Lipid Profile", "FBS", "PPBS", "MRI", "CT", "EEG", "ENMG", "TSH", "USG Abdomen", "Others"];

export const MEDICINE_TYPES = [
    { val: "Cap", label: "Cap - Capsule", full: "Capsule" },
    { val: "Tab", label: "Tab - Tablet", full: "Tablet" },
    { val: "Syr", label: "Syr - Syrup", full: "Syrup" },
    { val: "Oin", label: "Oin - Ointment", full: "Ointment" },
    { val: "Gel", label: "Gel - Gel", full: "Gel" },
    { val: "Inj", label: "Inj - Injection", full: "Injection" },
    { val: "Str", label: "Str - Strip", full: "Strip" },
    { val: "Sac", label: "Sac - Sachet", full: "Sachet" }
];

export const parseTreatments = (treatments = []) => {
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

        let type = "Tab";
        let name = parts[0] || "";
        const knownTypes = ["Cap", "Tab", "Syr", "Oin", "Gel", "Inj", "Str", "Sac"];
        const words = name.trim().split(" ");
        if (words.length > 0 && knownTypes.includes(words[0])) {
            type = words[0];
            name = words.slice(1).join(" ");
        }

        return {
            id: Date.now() + index,
            type,
            name,
            dose,
            doseUnit,
            schedule,
            daysCount,
            daysUnit,
            instructions: parts[4] || ""
        };
    });
};

export const parseInvestigationDetails = (details, type) => {
    if (!details || !details[type]) return [];
    const data = details[type];
    if (Array.isArray(data)) return data.map((item, i) => ({ ...item, id: Date.now() + i }));
    if (typeof data === 'object' && data.region) return [{ ...data, id: Date.now() }];
    return [];
};

export const usePatientForm = (initialData = {}, mode = "create", onSubmit) => {
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
        otherDetails: initialData.otherDetails || "",
        vitals: {
            pulse: initialData.vitals?.pulse || "",
            bp: {
                systolic: initialData.vitals?.bp?.systolic || "",
                diastolic: initialData.vitals?.bp?.diastolic || ""
            },
            spO2: initialData.vitals?.spO2 || ""
        }
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

    const [medicines, setMedicines] = useState(() => parseTreatments(initialData.treatments));
    const [showMedicines, setShowMedicines] = useState(medicines.length > 0);
    const [showOtherTreatment, setShowOtherTreatment] = useState(!!initialData.otherDetails);
    const [selectedInvestigations, setSelectedInvestigations] = useState(initialData.investigations || []);
    const [investigationDetails, setInvestigationDetails] = useState(() => ({
        mri: parseInvestigationDetails(initialData.investigationDetails, 'mri'),
        ct: parseInvestigationDetails(initialData.investigationDetails, 'ct'),
        enmg: parseInvestigationDetails(initialData.investigationDetails, 'enmg'),
        others: initialData.investigationDetails?.others || ""
    }));

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

    const handleVitalsChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = value === "" ? "" : Number(value);
        if (name === "systolic" || name === "diastolic") {
            setFormData(prev => ({
                ...prev,
                vitals: {
                    ...prev.vitals,
                    bp: { ...prev.vitals.bp, [name]: parsedValue }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                vitals: { ...prev.vitals, [name]: parsedValue }
            }));
        }
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
        setMedicines([...medicines, { id: Date.now(), type: "Tab", name: "", dose: "", doseUnit: "mg", schedule: [], daysCount: "", daysUnit: "Days", instructions: "" }]);
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

        const sysVal = formData.vitals.bp.systolic;
        const diaVal = formData.vitals.bp.diastolic;
        if ((sysVal !== "" && diaVal === "") || (sysVal === "" && diaVal !== "")) {
            toast.error("Please enter both the Systolic and Diastolic blood pressure values, or leave both empty.");
            return;
        }

        const medicinesFormatted = medicines.map(m => {
            const doseCombined = `${m.dose} ${m.doseUnit}`.trim();
            return `${m.type} ${m.name}-${doseCombined}-[${m.schedule.join(",")}]-${m.daysCount} ${m.daysUnit}-${m.instructions}`;
        });

        const cleanInvestigationDetails = {
            mri: investigationDetails.mri.map(item => { const rest = { ...item }; delete rest.id; return rest; }),
            ct: investigationDetails.ct.map(item => { const rest = { ...item }; delete rest.id; return rest; }),
            enmg: investigationDetails.enmg.map(item => { const rest = { ...item }; delete rest.id; return rest; }),
            others: investigationDetails.others || ""
        };

        const cleanVitals = {
            pulse: formData.vitals.pulse !== "" ? Number(formData.vitals.pulse) : null,
            bp: {
                systolic: formData.vitals.bp.systolic !== "" ? Number(formData.vitals.bp.systolic) : null,
                diastolic: formData.vitals.bp.diastolic !== "" ? Number(formData.vitals.bp.diastolic) : null
            },
            spO2: formData.vitals.spO2 !== "" ? Number(formData.vitals.spO2) : null
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
            allergies: formData.allergies === "yes" ? "Yes" : "No",
            vitals: cleanVitals
        };

        onSubmit(submissionData);
    };

    return {
        state: {
            formData,
            comorbidities,
            previousComorbidities,
            customComorbidity,
            medicines,
            showMedicines,
            showOtherTreatment,
            selectedInvestigations,
            investigationDetails,
            newInvestigationInput,
            othersInput,
            hasChanges,
            isFormValid: isFormValid()
        },
        actions: {
            setFormData,
            setCustomComorbidity,
            setShowMedicines,
            setShowOtherTreatment,
            setNewInvestigationInput,
            setOthersInput,
            setSelectedInvestigations,

            handleInputChange,
            handleVitalsChange,
            toggleComorbidity,
            updateComorbidityDuration,
            addCustomComorbidity,
            removeCustomComorbidity,
            addMedicine,
            removeMedicine,
            updateMedicine,
            toggleInvestigation,
            addMriRegion,
            addCtRegion,
            addEnmgRegion,
            addOtherInvestigation,
            handleSubmit
        }
    };
};
