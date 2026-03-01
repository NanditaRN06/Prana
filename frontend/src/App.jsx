// App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, matchPath } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import Login from './components/Signin';
import SignUp from './components/Signup';
import { ForgotPassword, ResetPasswordWrapper } from './components/PassForgot';
import { isAuthenticated, logout } from './utils/auth';
import HomePage from "./components/Home";
import Main from "./components/Main";
import NewEntry from "./components/NewEntry";
import ProfilePage from "./components/ProfilePage";
import { Patient, Update } from './components/PatientData';
import { FaUser, FaHome, FaSignOutAlt } from 'react-icons/fa';

const App = () => {
	const [authenticated, setAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	const fetchUsername = async () => {
		try {
			const response = await axios.get("http://localhost:9000/api/account", { withCredentials: true });
			setUser(response.data.username);
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

				<Navigation
					authenticated={authenticated}
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

const Navigation = ({ authenticated, handleLogout, username }) => {
	const location = useLocation();
	const hiddenRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', "/home"];

	const isHiddenRoute = hiddenRoutes.some((route) =>
		matchPath({ path: route }, location.pathname)
	);

	if (isHiddenRoute) return null;

	return (
		<nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between transition-all print:hidden">
			<Link to="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<img src="/logo.svg" alt="Prana Logo" className="w-10 h-10" />
				<span className="text-2xl font-black text-blue-600 tracking-tighter">Prana<span className="text-slate-400">.</span></span>
			</Link>

			<div className="flex items-center gap-8">
				<NavLink to="/home" icon={<FaHome />} label="Dashboard" />
				<NavLink to="/account" icon={<FaUser />} label={username || "Account"} />

				<button
					onClick={handleLogout}
					className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm tracking-wide uppercase transition-colors"
				>
					<FaSignOutAlt className="text-lg" />
					<span>Logout</span>
				</button>
			</div>
		</nav>
	);
};

const NavLink = ({ to, icon, label }) => (
	<Link to={to} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm tracking-wide uppercase transition-all">
		<span className="text-lg opacity-80">{icon}</span>
		<span>{label}</span>
	</Link>
);

export default App;
