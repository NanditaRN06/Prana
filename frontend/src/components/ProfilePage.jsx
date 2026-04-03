// frontend/components/ProfilePage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import axios from "axios";

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");
    const [qualifications, setQualifications] = useState([]);
    const [consultationAddress, setConsultationAddress] = useState("");
    const [consultationHospital, setConsultationHospital] = useState("");
    const [kmcNumber, setKmcNumber] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = window.localStorage.getItem("isLoggedIn");
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        axios.get(`${import.meta.env.VITE_API_URL}/api/account`, { withCredentials: true })
            .then((response) => {
                const data = response.data;
                setUserData(data);
                setFullName(data.fullName || "");
                setEmail(data.email || "");
                setUsername(data.username || "");
                const phone = data.phoneNumber || "";
                if (phone.includes(" ")) {
                    const parts = phone.split(" ");
                    setCountryCode(parts[0]);
                    setPhoneDigits(parts.slice(1).join(""));
                } else {
                    setPhoneDigits(phone);
                }
                setDepartment(data.department || "");
                setPosition(data.position || "");
                setQualifications(data.qualifications || []);
                setConsultationAddress(data.consultationAddress || "");
                setConsultationHospital(data.consultationHospital || "");
                setKmcNumber(data.kmcNumber || "");
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching profile:", error);
                toast.error("Could not load your profile.");
                navigate("/login");
            });
    }, [navigate]);

    const handleSave = () => {
        const fullPhoneNumber = phoneDigits.trim().length > 0 ? `${countryCode} ${phoneDigits}`.trim() : "";
        const updatedData = {
            fullName,
            email,
            phoneNumber: fullPhoneNumber,
            department,
            position,
            qualifications: qualifications.filter(q => q.trim() !== ""),
            consultationAddress,
            consultationHospital,
            kmcNumber: kmcNumber.trim()
        };
        const saveToast = toast.loading("Updating your profile...");

        axios.put(`${import.meta.env.VITE_API_URL}/api/account`, updatedData, { withCredentials: true })
            .then(() => {
                toast.success("Profile saved.", { id: saveToast });
                setUserData(prev => ({ ...prev, ...updatedData }));
                setIsEditing(false);
            })
            .catch((error) => {
                console.error("Error updating profile:", error);
                toast.error("Failed to update profile details.", { id: saveToast });
            });
    };

    const toDeactivate = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-bold text-slate-800">Confirm Account Deactivation</p>
                <p className="text-sm text-slate-600">Your account will be temporarily disabled. Your data will be preserved, but you will not be able to log in until reactivated by support.</p>
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
                            performDeactivate();
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                        Confirm Deactivate
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const performDeactivate = () => {
        const delToast = toast.loading("Deactivating your account...");
        axios.post(`${import.meta.env.VITE_API_URL}/api/deactivate`, {}, { withCredentials: true })
            .then((response) => {
                toast.success("Account successfully deactivated.", { id: delToast });
                window.localStorage.removeItem("isLoggedIn");
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                navigate("/");
                setTimeout(() => window.location.reload(), 500);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Error during account deactivation.", { id: delToast });
            });
    };

    const toDelete = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-bold text-slate-800">Confirm Account Deletion</p>
                <p className="text-sm text-slate-600">This action will permanently remove your access and all associated patient data. This action is irreversible.</p>
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
                        Confirm Delete
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const performDelete = () => {
        const delToast = toast.loading("Deleting your account...");
        axios.delete(`${import.meta.env.VITE_API_URL}/api/account`, { withCredentials: true })
            .then((response) => {
                toast.success("Account deleted.", { id: delToast });
                window.localStorage.removeItem("isLoggedIn");
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                navigate("/");
                setTimeout(() => window.location.reload(), 500);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Error during account termination.", { id: delToast });
            });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-xs font-black text-slate-400 uppercase tracking-widest">Loading profile...</div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-10 py-12 text-white relative">
                    <h1 className="text-3xl font-black tracking-tight relative z-10">Your Profile</h1>
                    <p className="text-slate-400 font-medium mt-2 relative z-10">Update your personal details here.</p>
                </div>

                <div className="p-10">
                    {!isEditing ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ProfileItem label="Full Name" value={userData.fullName} />
                                <ProfileItem label="Username" value={userData.username} />
                                <ProfileItem label="Email Contact" value={userData.email} />
                                <ProfileItem label="Department" value={userData.department || "Not specified"} />
                                <ProfileItem label="Position" value={userData.position || "Not specified"} />
                                <ProfileItem label="Qualifications" value={userData.qualifications?.length ? userData.qualifications.join(", ") : "None listed"} />
                                <ProfileItem label="Consultation Hospital" value={userData.consultationHospital || "Not specified"} />
                                <ProfileItem label="Phone Number" value={userData.phoneNumber || "Not registered"} />
                                <ProfileItem label="KMC Number" value={userData.kmcNumber || "Not specified"} />
                                <ProfileItem label="Consultation Address" value={userData.consultationAddress || "Not specified"} fullWidth />
                            </div>

                            <div className="pt-10 flex flex-col gap-4 border-t border-slate-50">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg hover:bg-blue-700 transition-all text-center border-b-4 border-black/10"
                                >
                                    Edit Profile
                                </button>

                                <div className="flex gap-4">
                                    <button
                                        onClick={toDeactivate}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-200 border-b-4 border-black/10"
                                    >
                                        Deactivate Account
                                    </button>
                                    <button
                                        onClick={toDelete}
                                        className="flex-1 py-4 bg-white text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-red-50 transition-all border border-red-100 border-b-4 border-black/10"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputItem label="Full Name" value={fullName} onChange={setFullName} />
                                <InputItem label="Username" value={username} onChange={setUsername} disabled />
                                <InputItem label="Email Address" value={email} disabled />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="w-20 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            placeholder="+91"
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
                                            value={phoneDigits}
                                            onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="10 Digits"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Professional Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputItem label="Department" value={department} onChange={setDepartment} placeholder="ex: Neurology" />
                                    <InputItem label="Position" value={position} onChange={setPosition} placeholder="ex: Associate Professor" />
                                    <InputItem
                                        label="Karnataka Medical Council Number"
                                        value={kmcNumber}
                                        onChange={(val) => setKmcNumber(val.replace(/\D/g, ''))}
                                        placeholder="KMC Number"
                                        pattern="\d*"
                                    />
                                </div>
                                <div className="mt-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Qualifications</label>
                                    <div className="space-y-2">
                                        {qualifications.map((q, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 text-sm"
                                                    value={q}
                                                    onChange={(e) => {
                                                        const newQuals = [...qualifications];
                                                        newQuals[idx] = e.target.value;
                                                        setQualifications(newQuals);
                                                    }}
                                                    placeholder="ex: MBBS"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newQuals = qualifications.filter((_, i) => i !== idx);
                                                        setQualifications(newQuals);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors font-bold text-lg"
                                                >
                                                    -
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setQualifications([...qualifications, ""])}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors flex items-center gap-2"
                                        >
                                            + Add Qualification
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputItem label="Consultation Hospital" value={consultationHospital} onChange={setConsultationHospital} placeholder="ex: ABC Hospital" />
                                    <InputItem label="Consultation Address" value={consultationAddress} onChange={setConsultationAddress} placeholder="Clinic or Hospital Address" />
                                </div>
                            </div>

                            <div className="pt-8 flex gap-5 border-t border-slate-50">
                                <button
                                    onClick={handleSave}
                                    className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg hover:bg-emerald-700 transition-all border-b-4 border-black/10"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-200 transition-all border-b-4 border-black/10"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const ProfileItem = ({ label, value, fullWidth }) => (
    <div className={`flex flex-col space-y-1 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
        <span className="text-base font-bold text-slate-800">{value}</span>
    </div>
);

const InputItem = ({ label, value, onChange, type = "text", ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    </div>
);

export default ProfilePage;
