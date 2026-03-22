// frontend/components/Signup.jsx

import React, { useState, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SignUp = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        countryCode: '+91',
        phoneDigits: '',
        password: '',
        confirmPassword: ''
    });
    const [passwordTooltip, setPasswordTooltip] = useState(true);
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();
    const usernameWarnedRef = useRef(false);

    const passwordRegex = /^[A-Za-z0-9_@]{8,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const handleFormSubmission = (e) => {
        e.preventDefault();
        const { fullName, email, username, countryCode, phoneDigits, password, confirmPassword } = formData;
        const phoneNumber = `${countryCode} ${phoneDigits}`.trim();

        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid clinical email address.");
            return;
        }

        if (!passwordRegex.test(password)) {
            toast.error('Password must be at least 8 characters (letters, numbers, _, @).');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Identity confirmation failed: Passwords do not match.');
            return;
        }

        const loadToast = toast.loading("Creating your account...");
        axios.post(`${import.meta.env.VITE_API_URL}/signup`, { fullName, email, username, phoneNumber, password })
            .then(() => {
                toast.success('Account created successfully.', { id: loadToast });
                setTimeout(() => setRedirect(true), 1500);
            })
            .catch((err) => {
                const errMsg = err.response?.data?.message || 'An error occurred during registration.';
                toast.error(errMsg, { id: loadToast });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordTooltip(value.length < 8);
        }
        if (name === 'username' && value.length > 0 && !usernameWarnedRef.current) {
            usernameWarnedRef.current = true;
            toast('Note: Username cannot be changed once created.', { icon: '⚠️', position: 'bottom-center', duration: 3000, id: 'username-warning' });
        }
    };
    if (redirect) return <Navigate to="/login" />;

    return (
        <div className="flex items-center justify-center min-h-[90vh] py-12">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-xl w-full space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="text-slate-500 font-medium">Sign up to start using Prana.</p>
                </div>

                <form className="space-y-6" onSubmit={handleFormSubmission}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="Full Name" name="fullName" placeholder="Dr. Jane Doe" value={formData.fullName} onChange={handleInputChange} required />
                        <FormInput label="Username" name="username" placeholder="janedoe_md" value={formData.username} onChange={handleInputChange} required />
                    </div>

                    <FormInput label="Email Address" type="email" name="email" placeholder="jane.doe@clinic.com" value={formData.email} onChange={handleInputChange} required />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="countryCode"
                                className="w-20 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                placeholder="+91"
                                required
                            />
                            <input
                                type="text"
                                name="phoneDigits"
                                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
                                value={formData.phoneDigits}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setFormData(prev => ({ ...prev, phoneDigits: val }));
                                }}
                                placeholder="10 Digits"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <FormInput label="Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                            {formData.password && passwordTooltip && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter pl-1 italic">Min 8 Chars</p>
                            )}
                        </div>
                        <FormInput label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} required />
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all border-b-4 border-blue-900/40">
                        Create Account
                    </button>
                </form>

                <div className="text-center space-y-6 pt-4 border-t border-slate-50">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Already registered? <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors pl-2">Sign In</Link>
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] hover:text-slate-500 transition-colors"
                    >
                        Go back
                    </button>
                </div>
            </div >
        </div >
    );
};

const FormInput = ({ label, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
        <input
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-slate-700"
            {...props}
        />
    </div>
);

export default SignUp;
