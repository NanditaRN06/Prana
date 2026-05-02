// App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import apiClient from './services/apiClient';
import { getAccount } from './services/authService';
import Login from './pages/auth/Signin';
import SignUp from './pages/auth/Signup';
import { ForgotPassword, ResetPasswordWrapper } from './pages/auth/PassForgot';
import { isAuthenticated, logout } from './utils/auth';
import HomePage from "./pages/dashboard/Home";
import Main from "./pages/dashboard/Main";
import NewEntry from "./pages/patient/NewEntry";
import ProfilePage from "./pages/ProfilePage";
import { Patient, Update } from './pages/patient/PatientProfilePage';
import Navbar from './layout/Navbar';

const App = () => {
	const [authenticated, setAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	const fetchUsername = async () => {
		try {
			const data = await getAccount();
			setUser(data.username);
		} catch (error) {
			console.error("Error fetching user data:", error.response || error.message);
		}
	};

	useEffect(() => {
		const checkAuth = async () => {
			const authStatus = await isAuthenticated();
			setAuthenticated(authStatus);
			if (authStatus) fetchUsername();
		};
		checkAuth();

		// Silent ping to wake up the Render backend from sleep mode
		apiClient.get(`/`).catch(() => { });
	}, []);

	const handleLogout = async () => {
		const loggedOut = await logout();
		if (loggedOut) {
			setAuthenticated(false);
			setUser(null);
			window.localStorage.removeItem("isLoggedIn");
			document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			toast.success("Session successfully terminated.");
		} else {
			toast.error('Logout process encountered an error.');
		}
	};

	const handleLoginSuccess = () => {
		setAuthenticated(true);
		fetchUsername();
	};

	return (
		<Router>
			<div className="min-h-screen bg-[#fcfcfd] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
				<Toaster position="top-right" toastOptions={{
					duration: 4000,
					style: { borderRadius: '12px', background: '#333', color: '#fff' }
				}} />

				<Navbar
					handleLogout={handleLogout}
					username={user}
				/>

				<main className="container mx-auto px-6 py-12 max-w-7xl">
					<Routes>
						<Route path="/" element={<Main />} />
						<Route path="/home" element={authenticated ? <HomePage /> : <Navigate to="/login" />} />
						<Route path="/account" element={authenticated ? <ProfilePage /> : <Navigate to="/login" />} />
						<Route path="/login" element={authenticated ? <Navigate to="/home" /> : <Login onLoginSuccess={handleLoginSuccess} />} />
						<Route path="/signup" element={<SignUp />} />
						<Route path="/forgot-password" element={<ForgotPassword />} />
						<Route path="/reset-password" element={<ResetPasswordWrapper />} />
						<Route path="/new-entry" element={authenticated ? <NewEntry /> : <Navigate to="/login" />} />
						<Route path="/update/:patientId" element={authenticated ? <Update /> : <Navigate to="/login" />} />
						<Route path="/patient/:patientId" element={authenticated ? <Patient /> : <Navigate to="/login" />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
};



export default App;
