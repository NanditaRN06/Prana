// frontend/components/Main.jsx

import { Link } from 'react-router-dom';

const Main = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center animate-in fade-in duration-1000">
            <div className="relative mb-12">
                <div className="absolute inset-0 blur-3xl bg-blue-100/50 rounded-full scale-150"></div>
                <h1 className="relative text-7xl font-black text-slate-900 tracking-tighter mb-4">
                    Prana<span className="text-blue-600">.</span>
                </h1>
                <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-6">
                Clinical Information Systems
            </h2>

            <p className="text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed font-semibold">
                Building the future of patient record management through precision, security, and professional clinical workflows.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                <Link to="/login" className="flex-1 w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-100 transition-all border-b-6 border-blue-900/40 inline-block text-center cursor-pointer">
                    Access Portal
                </Link>
                <Link to="/signup" className="flex-1 w-full py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-100 transition-all border-b-6 border-slate-200 inline-block text-center cursor-pointer">
                    Join Registry
                </Link>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 w-full max-w-sm">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Optimized for Clinical Excellence</p>
            </div>
        </div>
    );
};

export default Main;
