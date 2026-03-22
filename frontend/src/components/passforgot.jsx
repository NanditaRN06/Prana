// frontend/components/PassForgot.jsx

import React, { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        const loadToast = toast.loading("Verifying identity...");

        axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, { contact: email })
            .then((res) => {
                toast.success(res.data.message, { id: loadToast });
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Identification failed.", { id: loadToast });
            });
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md w-full space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Security Recovery</h2>
                    <p className="text-slate-500 font-medium">Verify your registered email to reset clinical access.</p>
                </div>

                <form className="space-y-6" onSubmit={handleInitialSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            Registered Email Address
                        </label>
                        <input
                            type="email"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
                            placeholder="doctor@prana.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border-b-4 border-blue-800">
                        Send Recovery Link
                    </button>
                </form>

                <div className="text-center">
                    <Link to="/login" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">Back to Secure Login</Link>
                </div>
            </div>
        </div>
    );
};

export const ResetPasswordWrapper = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    return <ResetPassword id={id} token={token} />;
};

export const ResetPassword = ({ id, token }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifying, setVerifying] = useState(true);
    const [validToken, setValidToken] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id || !token) {
            toast.error("Security parameters are missing.");
            setVerifying(false);
            setTimeout(() => navigate("/forgot-password"), 2000);
            return;
        }

        axios.get(`${import.meta.env.VITE_API_URL}/reset-password-verify?id=${id}&token=${token}`)
            .then(() => {
                setValidToken(true);
                setVerifying(false);
            })
            .catch(() => {
                toast.error("Security token is invalid or has expired.");
                setVerifying(false);
                setTimeout(() => navigate("/forgot-password"), 2000);
            });
    }, [id, token, navigate]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Password confirmation does not match.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters for clinical security.");
            return;
        }

        const loadToast = toast.loading("Updating security credentials...");
        axios.post(`${import.meta.env.VITE_API_URL}/reset-password-action`, { id, token, newPassword })
            .then((res) => {
                toast.success(res.data.message, { id: loadToast });
                setTimeout(() => setRedirect(true), 1500);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Internal error during password update.", { id: loadToast });
            });
    };

    if (redirect) return <Navigate to="/login" />;

    if (verifying) return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="animate-pulse text-xs font-black text-slate-400 uppercase tracking-widest">Verifying Security Token...</div>
        </div>
    );

    if (!validToken) return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center space-y-4">
                <p className="text-red-500 font-bold">Invalid Security Token</p>
                <p className="text-slate-500 text-sm font-medium">Redirecting you to recovery...</p>
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md w-full space-y-8 animate-in zoom-in duration-500">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Security Update</h2>
                    <p className="text-slate-500 font-medium">Create a new, strong password for your account.</p>
                </div>

                <form className="space-y-6" onSubmit={handleFormSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Secure Password</label>
                        <input
                            type="password"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                            placeholder="Minimum 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold disabled:opacity-50"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!newPassword}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border-b-4 border-blue-800 disabled:opacity-50" disabled={!confirmPassword}>
                        Reset Access Password
                    </button>
                </form>
            </div>
        </div>
    );
};
