// frontend/components/Home.jsx

import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { logout } from '../utils/auth';
import { toast } from "react-hot-toast";
import axios from "axios";

const HomePage = () => {
    const [name, setName] = useState(null);
    const navigate = useNavigate();

    const fetchUsername = async () => {
        try {
            const response = await axios.get("http://localhost:9000/api/account", { withCredentials: true });
            setName(response.data.fullName);
        } catch (error) {
            console.error("Error fetching user data:", error.response || error.message);
        }
    };

    useEffect(() => {
        fetchUsername();
    }, []);

    const handleLogout = async () => {
        const loggedOut = await logout();
        if (loggedOut) {
            window.localStorage.removeItem("isLoggedIn");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            toast.success("Session successfully terminated.");
            navigate("/");
            setTimeout(() => window.location.reload(), 500);
        } else {
            toast.error('Logout process encountered an error.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                    {name ? `Dr. ${name}'s Workspace` : "Initialising Hub..."}
                </h1>
                <p className="text-xl text-slate-500 font-medium">Welcome to the Prana Clinical Information System.</p>
            </div>

            <div className="w-full">
                <SearchBar />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <DashboardCard
                    to="/new-entry"
                    icon={<FaUserPlus className="text-blue-600" size={48} />}
                    label="Patient Intake"
                    description="Initiate a new medical history and clinical examination record."
                />
                <DashboardCard
                    to="/account"
                    icon={<FaUser className="text-slate-800" size={48} />}
                    label="Credential Management"
                    description="Configure your professional profile and security settings."
                />
                <button
                    onClick={handleLogout}
                    className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col items-center gap-8 hover:border-red-100 hover:shadow-red-50 transition-all text-center relative overflow-hidden"
                >
                    <div className="p-8 bg-red-50 rounded-[2rem] group-hover:bg-red-100 transition-colors">
                        <FaSignOutAlt className="text-red-500" size={48} />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Terminate Session</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">Securely sign out and lock clinical access.</p>
                    </div>
                </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/10 overflow-hidden relative">
                <div className="relative z-10 space-y-6 max-w-2xl">
                    <div className="inline-block px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Notice</div>
                    <h2 className="text-3xl font-black tracking-tight leading-tight italic">Prana Clinical Intelligence Dashboard</h2>
                    <p className="text-slate-400 text-lg leading-relaxed font-medium">
                        Prana is engineered for medical precision, allowing providers to archive patient records,
                        monitor investigations, and iterate treatment plans with unparalleled efficiency.
                        Inspired by decades of neurological expertise.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                <div className="absolute bottom-0 right-10 w-48 h-48 bg-indigo-600/5 rounded-full blur-[60px]"></div>
            </div>
        </div>
    );
};

const DashboardCard = ({ to, icon, label, description }) => (
    <Link to={to} className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col items-center gap-8 hover:border-blue-200 hover:shadow-blue-50 transition-all text-center">
        <div className="p-8 bg-slate-50 rounded-[2rem] group-hover:bg-blue-50 transition-colors">
            {icon}
        </div>
        <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{label}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
        </div>
    </Link>
);

export default HomePage;
