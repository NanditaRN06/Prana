// frontend/src/layout/Navbar.jsx
import React from 'react';
import { Link, useLocation, matchPath } from 'react-router-dom';
import { FaUser, FaHome, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ handleLogout, username }) => {
	const location = useLocation();
	const hiddenRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', "/home"];
	const isHiddenRoute = hiddenRoutes.some((route) => matchPath({ path: route }, location.pathname));
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
				<button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm tracking-wide uppercase transition-colors">
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

export default Navbar;
