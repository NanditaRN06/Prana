import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaPrint, FaEdit, FaTrash, FaCheck, FaHistory, FaTimes, FaPhone, FaMapMarkerAlt, FaFileMedical } from 'react-icons/fa';
import PatientForm from "./PatientForm";

export function Patient() {
    const { patientId } = useParams();
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showVersions, setShowVersions] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:9000/patient/${patientId}`, { withCredentials: true })
            .then((response) => {
                setPatientData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching patient:", error);
                const errorMessage = error.response?.data?.message || error.message || "Patient record could not be retrieved.";
                setError(errorMessage);
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
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">Cancel</button>
                    <button onClick={() => { toast.dismiss(t.id); performDelete(); }} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">Delete Record</button>
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

    if (loading) return <div className="flex justify-center py-20 animate-pulse text-slate-300 font-bold uppercase tracking-widest text-xs">Accessing Registry...</div>;
    if (error) return <div className="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-xs">{error}</div>;
    if (!patientData) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No patient data found</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 print:py-0 print:m-0 print:max-w-none">
            <PatientView data={patientData} handlePrint={handlePrint} handleDelete={handleDelete} navigate={navigate} setShowVersions={setShowVersions} />

            {showVersions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <FaHistory className="text-blue-500" /> Version History
                            </h2>
                            <button onClick={() => { setShowVersions(false); setSelectedVersion(null); }} className="text-slate-400 hover:text-red-500"><FaTimes size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {selectedVersion ? (
                                <div className="p-6">
                                    <button onClick={() => setSelectedVersion(null)} className="mb-4 text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">← Back to List</button>
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <div className="mb-4 pb-4 border-b border-slate-200">
                                            <p className="text-xs font-black uppercase text-slate-400">Snapshot Date</p>
                                            <p className="text-lg font-bold text-slate-800">{new Date(selectedVersion.versionDate).toLocaleString()}</p>
                                        </div>
                                        <PatientView data={selectedVersion} isVersionView={true} />
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {patientData.versions && patientData.versions.length > 0 ? (
                                        [...patientData.versions].reverse().map((v, idx) => (
                                            <button key={idx} onClick={() => setSelectedVersion(v)} className="w-full text-left p-6 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                                <div>
                                                    <p className="font-bold text-slate-800 group-hover:text-blue-600">{v.changeSummary || `Version ${patientData.versions.length - idx}`}</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">{new Date(v.versionDate).toLocaleString()}</p>
                                                </div>
                                                <span className="text-slate-300 group-hover:text-blue-400">View Details →</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center text-slate-400 font-medium italic">No previous versions available.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const PatientView = ({ data, handlePrint, handleDelete, navigate, setShowVersions, isVersionView = false }) => {
    if (!data) {
        return <div className="text-center py-20 text-slate-400 font-bold">No patient data available</div>;
    }

    const {
        name, age, phone, address, examdate,
        comorbidities = [], comorbidityData = [],
        allergies, allergyDetails,
        clinicalDiagnosis, currentMedications,
        chiefComplaints, examination, treatments, otherDetails,
        investigations = [], investigationDetails = {}
    } = data;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const displayComorbidities = comorbidityData.length > 0 ? comorbidityData : comorbidities.map(c => ({ name: c, duration: "" }));

    return (
        <div className={`bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none ${isVersionView ? 'shadow-none border-none rounded-none' : ''}`}>
            {!isVersionView && (
                <div className="bg-slate-900 px-10 py-12 text-white flex justify-between items-end print:hidden">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{name}</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-sm">Registry ID: {data._id ? data._id.slice(-8).toUpperCase() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black italic opacity-10">Prana Clinical</p>
                        <p className="text-slate-400 font-bold text-sm tracking-wide">{formatDate(examdate)}</p>
                    </div>
                </div>
            )}

            <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Medical Report</h2>
                        <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>Last Edited: {formatDate(data.updatedAt || data.examdate)}</span>
                            <span className="opacity-30">|</span>
                            <span>Consultation: {formatDate(examdate)}</span>
                        </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400">
                        Printed: {new Date().toLocaleString('en-GB')}
                    </div>
                </div>
            </div>

            <div className={`p-10 space-y-12 print:p-0 print:space-y-8 ${isVersionView ? 'p-0 space-y-8' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-10">
                    <div className="space-y-4">
                        <SectionTitle title="Patient Details" />
                        <div className="space-y-3">
                            <ParticularRow label="Full Name" value={name} />
                            <ParticularRow label="Age" value={`${age} Years`} />
                            {phone && <ParticularRow label="Contact" value={phone} icon={<FaPhone size={8} />} />}
                            {address && <ParticularRow label="Address" value={address} icon={<FaMapMarkerAlt size={8} />} />}
                            <ParticularRow label="Date" value={formatDate(examdate)} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SectionTitle title="Medical History" />
                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-100 print:p-2 print:border-none print:bg-white">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 print:text-[9px]">Pre-existing Conditions</span>
                                {displayComorbidities.length > 0 ? (
                                    <div className="space-y-1">
                                        {displayComorbidities.map((c, i) => (
                                            <div key={i} className="flex justify-between text-sm print:text-xs">
                                                <span className="font-bold text-slate-800">{(typeof c === 'string' ? c : c.name || "").replace(/^Other:\s*/, '')}</span>
                                                {c.duration && <span className="text-slate-500 text-xs italic">{c.duration}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <span className="text-slate-400 italic text-xs">None recorded</span>}
                            </div>
                            <ParticularRow label="Allergies" value={allergies} highlight={allergies === "Yes"} subValue={allergies === "Yes" ? allergyDetails : null} />
                            {currentMedications && (
                                <div className="p-4 rounded-2xl border bg-slate-50 border-slate-100 print:p-2 print:border-none print:bg-white">
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Medications</span>
                                    <span className="block font-medium text-slate-700 text-sm whitespace-pre-wrap">{currentMedications}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {clinicalDiagnosis && (
                    <div className="space-y-4 print:space-y-2">
                        <SectionTitle title="Clinical Diagnosis" />
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-blue-900 font-bold leading-relaxed shadow-sm print:p-0 print:border-none print:bg-white print:text-slate-900">
                            {clinicalDiagnosis}
                        </div>
                    </div>
                )}

                <div className="space-y-10 print:space-y-8">
                    <PrintSection label="Patient Complaints" content={chiefComplaints} />
                    <PrintSection label="Examination Results" content={examination} />
                </div>

                <div className="space-y-4 print:space-y-2">
                    <SectionTitle title="Requested Clinical Investigations" />
                    <div className="flex flex-wrap gap-3 pt-2">
                        {investigations.length > 0 ? investigations.map((inv, i) => {
                            let displayText = inv;
                            let details = "";

                            if (inv === "MRI" && investigationDetails.mri) {
                                if (Array.isArray(investigationDetails.mri)) {
                                    const regions = investigationDetails.mri.map(item => item.region).filter(Boolean);
                                    if (regions.length > 0) details = `(${regions.join(", ")})`;
                                } else if (investigationDetails.mri.region) {
                                    details = `(${investigationDetails.mri.region})`;
                                }
                            }

                            if ((inv === "CT" || inv.startsWith("CT")) && investigationDetails.ct) {
                                if (Array.isArray(investigationDetails.ct)) {
                                    const ctDetails = investigationDetails.ct.map(item => {
                                        const parts = [];
                                        if (item.region) parts.push(item.region);
                                        if (item.contrast) parts.push(item.contrast);
                                        return parts.join(" - ");
                                    }).filter(Boolean);
                                    if (ctDetails.length > 0) details = `(${ctDetails.join(", ")})`;
                                } else {
                                    const parts = [];
                                    if (investigationDetails.ct.region) parts.push(investigationDetails.ct.region);
                                    if (investigationDetails.ct.contrast) parts.push(investigationDetails.ct.contrast);
                                    if (parts.length > 0) details = `(${parts.join(", ")})`;
                                }
                            }

                            if (inv === "ENMG" && investigationDetails.enmg) {
                                if (Array.isArray(investigationDetails.enmg)) {
                                    const regions = investigationDetails.enmg.map(item => item.region).filter(Boolean);
                                    if (regions.length > 0) details = `(${regions.join(", ")})`;
                                } else if (investigationDetails.enmg.region) {
                                    details = `(${investigationDetails.enmg.region})`;
                                }
                            }

                            if (inv === "Others" && investigationDetails.others) {
                                displayText = investigationDetails.others;
                                details = "";
                            }

                            return (
                                <span key={i} className="px-4 py-2 bg-slate-50 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-tight border border-slate-200 print:bg-white print:border-slate-800">
                                    {displayText} <span className="text-slate-500 font-medium normal-case ml-1">{details}</span>
                                </span>
                            );
                        }) : <span className="text-slate-300 italic text-sm">None recorded</span>}
                    </div>
                </div>

                {(treatments || otherDetails) && (
                    <div className="space-y-4 print:space-y-2">
                        <SectionTitle title="Treatment Plan" />

                        {treatments && (
                            <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm print:p-0 print:border-none print:shadow-none">
                                <div className="space-y-3">
                                    {(Array.isArray(treatments) ? treatments : []).map((medStr, idx) => {
                                        const parts = medStr.split('-');
                                        const name = parts[0] || "Unknown Medicine";
                                        const dose = parts[1] || "";
                                        const scheduleRaw = parts[2] || "[]";
                                        const schedule = scheduleRaw.slice(1, -1).split(',').filter(s => s.trim() !== "");
                                        const duration = parts[3] || "";
                                        const instructions = parts[4] || "";

                                        return (
                                            <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 print:p-2 print:border-none print:bg-white line-break-inside-avoid">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-extrabold text-slate-900 text-sm italic">{name}</span>
                                                    {dose && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">{dose}</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px] items-center">
                                                    {schedule.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {schedule.map(s => <span key={s} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">{s}</span>)}
                                                        </div>
                                                    )}
                                                    {duration && (
                                                        <span className="text-slate-400 font-bold border-l border-slate-200 pl-2">For {duration}</span>
                                                    )}
                                                </div>
                                                {instructions && (
                                                    <p className="text-[11px] text-slate-500 italic font-medium pt-1 border-t border-slate-100/50">Note: {instructions}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {otherDetails && (
                            <div className="p-8 bg-blue-50 border border-blue-100 rounded-3xl text-slate-700 font-medium leading-relaxed shadow-sm print:p-0 print:border-none print:shadow-none print:bg-white print:text-[13px]">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 print:text-slate-400">Supplemental Notes</div>
                                <div className="whitespace-pre-wrap">{otherDetails}</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="hidden print:block pt-32">
                    <div className="flex justify-end gap-16">
                        <div className="w-40 text-center border-t border-slate-400 pt-3"><p className="text-[8px] font-black uppercase text-slate-400">Official Seal</p></div>
                        <div className="w-56 text-center border-t border-slate-400 pt-3"><p className="text-[8px] font-black uppercase text-slate-500">Authorized Signature</p></div>
                    </div>
                </div>
            </div>

            {!isVersionView && (
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3 print:hidden">
                    <ActionButton onClick={handlePrint} icon={<FaPrint size={14} />} label="Print" color="bg-slate-900" />
                    <ActionButton onClick={() => navigate(`/update/${name}`, { state: data })} icon={<FaEdit size={14} />} label="Edit" color="bg-blue-600" />
                    <ActionButton onClick={() => setShowVersions(true)} icon={<FaHistory size={14} />} label="Versions" color="bg-slate-500" />
                    <ActionButton onClick={handleDelete} icon={<FaTrash size={14} />} label="Delete" color="bg-red-500" />
                    <ActionButton onClick={() => navigate("/home")} icon={<FaCheck size={14} />} label="Done" color="bg-emerald-600" />
                </div>
            )}
        </div>
    );
};

export function Update() {
    const location = useLocation();
    const navigate = useNavigate();
    const patientData = location.state || {};

    const handleUpdate = (submissionData) => {
        const loadToast = toast.loading("Updating patient information...");
        axios.put(`http://localhost:9000/update/${patientData.name}`, submissionData, { withCredentials: true })
            .then(() => {
                toast.success("Patient information updated.", { id: loadToast });
                navigate(`/patient/${submissionData.name}`);
            })
            .catch(() => toast.error("Failed to update information.", { id: loadToast }));
    };

    return <PatientForm initialData={patientData} mode="edit" onSubmit={handleUpdate} />;
}

const SectionTitle = ({ title }) => <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-slate-900">{title}</h3>;

const ParticularRow = ({ label, value, highlight, subValue, icon }) => (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} print:p-2 print:border-none print:bg-white`}>
        <div className="flex justify-between items-start">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-[9px] print:text-slate-500">{label}</span>
            {icon && <span className="text-slate-300">{icon}</span>}
        </div>
        <span className={`block font-bold print:text-[12px] ${highlight ? 'text-red-700' : 'text-slate-900'}`}>{value || "-"}</span>
        {subValue && <span className="block text-[10px] text-red-600 font-medium italic mt-1">{subValue}</span>}
    </div>
);

const PrintSection = ({ label, content }) => (
    <div className="space-y-4 print:space-y-2">
        <SectionTitle title={label} />
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
