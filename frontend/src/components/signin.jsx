import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();

    const handleFormSubmission = (e) => {
        e.preventDefault();
        const loadToast = toast.loading("Checking login details...");

        axios.defaults.withCredentials = true;
        axios.post('http://localhost:9000/login', formData)
            .then((res) => {
                if (res.data.authenticated) {
                    window.localStorage.setItem("isLoggedIn", true);
                    window.localStorage.setItem("username", formData.username);
                    toast.success("Login successful. Welcome back!", { id: loadToast });
                    onLoginSuccess();
                    setRedirect(true);
                } else {
                    toast.error(res.data.message || "Access denied.", { id: loadToast });
                }
            })
            .catch((err) => {
                const errMsg = err.response?.data?.message || "Internal authentication error.";
                toast.error(errMsg, { id: loadToast });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (redirect) return <Navigate to="/home" />;

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row gap-16 max-w-6xl w-full animate-in fade-in duration-700">
                <div className="flex-1 space-y-10">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Login</h2>
                        <p className="text-slate-500 font-medium">Enter your details to access your account.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleFormSubmission}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Username or Email</label>
                            <input
                                type="text"
                                name="username"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 font-bold"
                                placeholder="Username, Email or Phone"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                <Link to="/forgot-password" net="true" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">Forgot Password?</Link>
                            </div>
                            <input
                                type="password"
                                name="password"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-700 font-bold"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all border-b-6 border-blue-900/40">
                            Login
                        </button>
                    </form>

                    <div className="flex flex-col gap-6 text-center pt-8 border-t border-slate-50">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                            New here? <Link to="/signup" className="text-blue-600 hover:text-blue-800 transition-colors pl-2">Create Account</Link>
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] hover:text-slate-500 transition-colors"
                        >
                            Go back
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex flex-[0.8] items-center justify-center bg-slate-900 rounded-[3rem] p-12 overflow-hidden relative">
                    <div className="relative z-10 text-center space-y-6">
                        <div className="w-24 h-24 mx-auto flex items-center justify-center p-4 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
                            <img src="/logo.svg" alt="Prana Logo" theme="dark" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Prana Clinical</h3>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto text-sm">Easily manage patient records and treatment plans.</p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
