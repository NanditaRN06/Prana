import React, { useState, useEffect } from "react";
import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaPrint, FaEdit, FaTrash, FaCheck, FaArrowLeft } from 'react-icons/fa';

export function Patient() {
    const { patientId } = useParams();
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:9000/patient/${patientId}`, { withCredentials: true })
            .then((response) => {
                setPatientData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching patient:", error);
                setError("Patient record could not be retrieved.");
                setLoading(false);
            });
    }, [patientId]);

    const handlePrint = () => {
        const style = document.createElement('style');
        style.innerHTML = '@page { margin: 0; } body { margin: 1.6cm; }';
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    const handleDelete = () => {
        const deleteToast = toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-bold text-slate-800">Confirm Deletion</p>
                <p className="text-sm text-slate-600">Are you sure you want to permanently delete this patient record? This action is irreversible.</p>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete();
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                    >
                        Delete Record
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const performDelete = () => {
        const loadToast = toast.loading("Removing patient record...");
        axios.delete(`http://localhost:9000/patient/${patientData.name}`, { withCredentials: true })
            .then(() => {
                toast.success("Patient record successfully removed.", { id: loadToast });
                navigate("/home");
            })
            .catch(() => toast.error("An error occurred during deletion.", { id: loadToast }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="flex justify-center py-20 animate-pulse text-slate-300 font-bold uppercase tracking-widest text-xs">Accessing Registry...</div>;
    if (error) return <div className="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-xs">{error}</div>;

    const { name, age, examdate, comorbidities = [], allergies, allergyDetails, chiefComplaints, examination, treatments, investigations = [] } = patientData;

    return (
        <div className="max-w-4xl mx-auto py-10 print:py-0 print:m-0 print:max-w-none">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                {/* Visual Header - Hidden in Print */}
                <div className="bg-slate-900 px-10 py-12 text-white flex justify-between items-end print:hidden">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{name}</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-sm">Registry ID: {patientData._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black italic opacity-10">Prana Clinical</p>
                        <p className="text-slate-400 font-bold text-sm tracking-wide">{formatDate(examdate)}</p>
                    </div>
                </div>

                {/* Print Header - Only in Print - REMOVED BRANDING */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Medical Report</h2>
                            <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>Last Edited: {formatDate(patientData.updatedAt || patientData.examdate)}</span>
                                <span className="opacity-30">|</span>
                                <span>Consultation: {formatDate(examdate)}</span>
                            </div>
                        </div>
                        <div className="text-right font-mono text-[10px] text-slate-400">
                            Printed: {new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-10 space-y-12 print:p-0 print:space-y-8">
                    {/* Patient Particulars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-10">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-slate-900">Patient Details</h3>
                            <div className="space-y-3">
                                <ParticularRow label="Full Name" value={name} />
                                <ParticularRow label="Age" value={`${age} Years`} />
                                <ParticularRow label="Date" value={formatDate(examdate)} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-slate-900">Medical History</h3>
                            <div className="space-y-3">
                                <ParticularRow label="Pre-existing conditions" value={comorbidities.join(", ") || "None recorded"} />
                                <ParticularRow label="Allergies" value={allergies} highlight={allergies === "Yes"} subValue={allergies === "Yes" ? allergyDetails : null} />
                            </div>
                        </div>
                    </div>

                    {/* Investigations Chip View */}
                    <div className="space-y-4 print:space-y-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] print:text-slate-900">Requested Tests</h3>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {investigations.length > 0 ? investigations.map((inv, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-tight border border-slate-200 print:bg-white print:border-slate-800 print:text-[11px]">{inv}</span>
                            )) : <span className="text-slate-300 italic text-sm">None recorded</span>}
                        </div>
                    </div>

                    {/* Narrative Sections */}
                    <div className="space-y-10 print:space-y-8">
                        <PrintSection label="Patient Complaints" content={chiefComplaints} />
                        <PrintSection label="Examination Results" content={examination} />
                        <PrintSection label="Treatment Plan" content={Array.isArray(treatments) ? treatments.join("\n") : treatments} />
                    </div>

                    {/* Signature and Seal Area - ONLY IN PRINT */}
                    <div className="hidden print:block pt-32">
                        <div className="flex justify-end gap-16">
                            <div className="w-40 text-center border-t border-slate-400 pt-3">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-16">Official Seal</p>
                            </div>
                            <div className="w-56 text-center border-t border-slate-400 pt-3">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer - REMOVED BRANDING AND NAV */}
                <div className="hidden print:block mt-10 pt-6 border-t border-slate-200">
                    <div className="text-center text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                        Official Clinical Documentation - End of Report
                    </div>
                </div>

                {/* Footer Actions - Hidden in Print */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3 print:hidden">
                    <ActionButton onClick={handlePrint} icon={<FaPrint size={14} />} label="Print report" color="bg-slate-900" />
                    <ActionButton onClick={() => navigate(`/update/${name}`, { state: patientData })} icon={<FaEdit size={14} />} label="Edit data" color="bg-blue-600" />
                    <ActionButton onClick={handleDelete} icon={<FaTrash size={14} />} label="Delete" color="bg-red-500" />
                    <ActionButton onClick={() => navigate("/home")} icon={<FaCheck size={14} />} label="Done" color="bg-emerald-600" />
                </div>
            </div>
        </div>
    );
}

const ParticularRow = ({ label, value, highlight, subValue }) => (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} print:p-2 print:border-none print:bg-white`}>
        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-[9px] print:text-slate-500">{label}</span>
        <span className={`block font-bold print:text-[12px] ${highlight ? 'text-red-700' : 'text-slate-900'}`}>{value}</span>
        {subValue && <span className="block text-[10px] text-red-600 font-medium italic mt-1">{subValue}</span>}
    </div>
);

const PrintSection = ({ label, content }) => (
    <div className="space-y-4 print:space-y-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1 print:text-slate-900 print:text-[11px]">{label}</h3>
        <div className="p-8 bg-white border border-slate-100 rounded-3xl text-slate-700 font-medium leading-relaxed shadow-sm whitespace-pre-wrap print:p-0 print:border-none print:shadow-none print:text-[13px]">
            {content || "No records provided."}
        </div>
    </div>
);

const ActionButton = ({ onClick, icon, label, color }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 ${color} text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-black/10`}>
        {icon} <span className="whitespace-nowrap">{label}</span>
    </button>
);

export function Update() {
    const location = useLocation();
    const navigate = useNavigate();
    const patientData = location.state || {};

    // Prefilling existing data
    const [formData, setFormData] = useState({
        ...patientData,
        examdate: patientData.examdate ? new Date(patientData.examdate).toISOString().slice(0, 16) : ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const loadToast = toast.loading("Updating patient information...");
        axios.put(`http://localhost:9000/update/${patientData.name}`, formData, { withCredentials: true })
            .then(() => {
                toast.success("Patient information updated.", { id: loadToast });
                navigate(`/patient/${formData.name}`);
            })
            .catch(() => toast.error("Failed to update information.", { id: loadToast }));
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 px-10 py-12 text-white">
                    <h1 className="text-xl font-black flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="hover:scale-110 transition-transform bg-white/10 p-2 rounded-xl"><FaArrowLeft size={14} /></button>
                        Update Details
                    </h1>
                </div>

                <form className="p-10 space-y-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-6">
                        <Input label="Patient Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
                        <Input label="Age" type="number" value={formData.age} onChange={(v) => setFormData({ ...formData, age: v })} />
                    </div>
                    <Input label="Examination Date" type="datetime-local" value={formData.examdate} onChange={(v) => setFormData({ ...formData, examdate: v })} />

                    <Textarea label="Chief Complaints" value={formData.chiefComplaints} onChange={(v) => setFormData({ ...formData, chiefComplaints: v })} />
                    <Textarea label="Examination Findings" value={formData.examination} onChange={(v) => setFormData({ ...formData, examination: v })} />

                    <div className="pt-8 flex gap-5">
                        <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all border-b-4 border-blue-800">Update Record</button>
                        <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all border-b-4 border-slate-200">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const Input = ({ label, value, onChange, type = "text" }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input type={type} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const Textarea = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <textarea className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold min-h-[140px] leading-relaxed text-slate-700" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);
